import { Timestamp } from 'firebase/firestore';
import { faturaService } from '../firebase/firestore';
import { diyetisyenService } from '../firebase/firestore';
import { ayarlarService } from '../firebase/firestore';
import { mobileAppService } from '../firebase/mobileAppService';
import { createFaturaAsync, groupDanisanlarByAy, getOncekiAy, getAyTarihleri } from '../utils/faturaUtils';
import { sendFaturaOlustuBildirimi } from '../utils/bildirimUtils';
import { Diyetisyen } from '@/types/diyetisyen';

/**
 * Diyetisyen için ay içindeki diyet planlarını çeker ve fatura oluşturur
 * @param diyetisyen Diyetisyen bilgisi
 * @param yil Fatura yılı
 * @param ay Fatura ayı (1-12)
 * @returns Oluşturulan fatura ID
 */
export async function createFaturaForDiyetisyen(
  diyetisyen: Diyetisyen,
  yil: number,
  ay: number
): Promise<string> {
  // Fatura zaten var mı kontrol et
  const faturaVarMi = await faturaService.faturaVarMi(diyetisyen.id!, yil, ay);
  if (faturaVarMi) {
    throw new Error(`${yil} yılı ${ay}. ay için fatura zaten oluşturulmuş`);
  }

  // Deneme süresi kontrolü - Deneme süresi bitene kadar fatura oluşturma
  if (diyetisyen.denemeSuresi?.aktif && diyetisyen.denemeSuresi.bitisTarihi) {
    const bitisTarihi = diyetisyen.denemeSuresi.bitisTarihi.toDate();
    const { bitis: ayBitis } = getAyTarihleri(yil, ay);
    
    // Eğer deneme süresi ayın sonundan sonra bitiyorsa, bu ay için fatura oluşturma
    if (bitisTarihi > ayBitis) {
      throw new Error(`Deneme süresi devam ediyor. Deneme süresi bitiminden itibaren faturalandırma başlayacaktır. (Bitiş: ${bitisTarihi.toLocaleDateString('tr-TR')})`);
    }
  }

  // Ay tarihlerini hesapla
  const { baslangic, bitis } = getAyTarihleri(yil, ay);

  // Mobil uygulamadan ay içindeki diyet planlarını çek
  const planlar = await mobileAppService.getDiyetPlanlariByAy(
    diyetisyen.mobilUygulamaId || diyetisyen.id!,
    baslangic,
    bitis
  );

  // Deneme süresi kontrolü - Deneme süresi içindeki planları filtrele
  // Sadece aktif deneme süresi varsa VE deneme süresi henüz bitmemişse filtre uygula
  let filtreliPlanlar = planlar;
  const now = new Date();
  
  if (diyetisyen.denemeSuresi?.aktif && diyetisyen.denemeSuresi.bitisTarihi) {
    const denemeBitisTarihi = diyetisyen.denemeSuresi.bitisTarihi.toDate();
    const denemeSuresiBitti = denemeBitisTarihi < now;
    
    // Sadece deneme süresi henüz bitmemişse filtre uygula
    if (!denemeSuresiBitti) {
      // Deneme süresi bitiminden sonraki planları al
      filtreliPlanlar = planlar.filter((plan) => {
        const planTarihi = plan.olusturmaTarihi;
        return planTarihi > denemeBitisTarihi;
      });
    }
    
    // Eğer deneme süresi ayın sonundan önce bitiyorsa ve hiç plan yoksa, fatura oluşturma
    if (filtreliPlanlar.length === 0 && denemeBitisTarihi <= bitis) {
      throw new Error(`Bu ay için deneme süresi bitiminden sonra diyet planı bulunmamaktadır. Deneme süresi: ${denemeBitisTarihi.toLocaleDateString('tr-TR')}`);
    }
  }

  // Danışanları grupla (her danışan için 1 kez faturalandırma)
  const danisanDetaylari = groupDanisanlarByAy(
    filtreliPlanlar.map((plan) => ({
      danisanId: plan.danisanId,
      danisanAdi: plan.danisanAdi,
      olusturmaTarihi: Timestamp.fromDate(plan.olusturmaTarihi),
    }))
  );

  // Ayarlardan KDV oranını ve banka bilgilerini al
  const ayarlar = await ayarlarService.get();
  const kdvOrani = ayarlar?.kdvOrani || 20;
  const bankaHavalesi = ayarlar?.bankaHesapBilgileri
    ? {
        iban: ayarlar.bankaHesapBilgileri.iban,
        aliciAdi: ayarlar.bankaHesapBilgileri.aliciAdi,
      }
    : undefined;

  // Fatura oluştur (oransal hesaplama için diyetisyen bilgisi gönder)
  const fatura = await createFaturaAsync(
    diyetisyen.id!,
    diyetisyen.email,
    diyetisyen.adSoyad,
    diyetisyen.uyeNumarasi,
    yil,
    ay,
    danisanDetaylari,
    kdvOrani,
    bankaHavalesi,
    diyetisyen // Oransal hesaplama için
  );

  // Firestore'a kaydet
  const faturaId = await faturaService.create(fatura);

  // Bildirim gönder
  try {
    const faturaWithId = { ...fatura, id: faturaId } as any;
    await sendFaturaOlustuBildirimi(faturaWithId);
  } catch (error) {
    console.error('Fatura bildirimi gönderilirken hata:', error);
    // Bildirim hatası fatura oluşturmayı engellemez
  }

  return faturaId;
}

/**
 * Tüm diyetisyenler için önceki ayın faturalarını oluşturur
 * @returns Oluşturulan fatura sayısı
 */
export async function createFaturalarForAllDiyetisyenler(): Promise<number> {
  const { yil, ay } = getOncekiAy();
  
  // Tüm aktif diyetisyenleri getir
  const diyetisyenler = await diyetisyenService.getAll();
  const aktifDiyetisyenler = diyetisyenler.filter(
    (d) => d.aktiflikDurumu === 'aktif' && d.onayDurumu === 'onaylandi'
  );

  let olusturulanFaturaSayisi = 0;
  const hatalar: Array<{ diyetisyen: string; hata: string }> = [];

  for (const diyetisyen of aktifDiyetisyenler) {
    try {
      // Fatura zaten var mı kontrol et
      const faturaVarMi = await faturaService.faturaVarMi(diyetisyen.id!, yil, ay);
      if (faturaVarMi) {
        console.log(`${diyetisyen.adSoyad} için ${yil}/${ay} faturası zaten mevcut`);
        continue;
      }

      await createFaturaForDiyetisyen(diyetisyen, yil, ay);
      olusturulanFaturaSayisi++;
      console.log(`${diyetisyen.adSoyad} için fatura oluşturuldu`);
    } catch (error: any) {
      console.error(`${diyetisyen.adSoyad} için fatura oluşturulurken hata:`, error);
      hatalar.push({
        diyetisyen: diyetisyen.adSoyad,
        hata: error.message || 'Bilinmeyen hata',
      });
    }
  }

  if (hatalar.length > 0) {
    console.warn('Fatura oluşturma hataları:', hatalar);
  }

  return olusturulanFaturaSayisi;
}

/**
 * Belirli bir diyetisyen için önceki ayın faturasını oluşturur
 * @param diyetisyenId Diyetisyen ID
 * @returns Oluşturulan fatura ID
 */
export async function createFaturaForDiyetisyenOncekiAy(
  diyetisyenId: string
): Promise<string> {
  const diyetisyen = await diyetisyenService.getById(diyetisyenId);
  if (!diyetisyen) {
    throw new Error('Diyetisyen bulunamadı');
  }

  const { yil, ay } = getOncekiAy();
  return await createFaturaForDiyetisyen(diyetisyen, yil, ay);
}
