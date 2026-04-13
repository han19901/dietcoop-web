import { Timestamp } from 'firebase/firestore';
import { startOfMonth, endOfMonth } from 'date-fns';
import { calculateFaturaTutari } from './paketUtils';
import { Fatura, FaturaDanisanDetay } from '@/types/fatura';
import { Diyetisyen } from '@/types/diyetisyen';

/**
 * Ayın başlangıç ve bitiş tarihlerini hesaplar
 * @param yil Yıl
 * @param ay Ay (1-12)
 * @returns Başlangıç ve bitiş tarihleri
 */
export function getAyTarihleri(yil: number, ay: number): {
  baslangic: Date;
  bitis: Date;
} {
  const baslangic = startOfMonth(new Date(yil, ay - 1, 1));
  const bitis = endOfMonth(new Date(yil, ay - 1, 1));
  return { baslangic, bitis };
}

/**
 * Mevcut ayın bilgilerini getirir
 * @returns Yıl, ay, başlangıç ve bitiş tarihleri
 */
export function getMevcutAy(): {
  yil: number;
  ay: number;
  baslangic: Date;
  bitis: Date;
} {
  const now = new Date();
  const yil = now.getFullYear();
  const ay = now.getMonth() + 1;
  const { baslangic, bitis } = getAyTarihleri(yil, ay);
  return { yil, ay, baslangic, bitis };
}

/**
 * Önceki ayın bilgilerini getirir
 * @returns Yıl, ay, başlangıç ve bitiş tarihleri
 */
export function getOncekiAy(): {
  yil: number;
  ay: number;
  baslangic: Date;
  bitis: Date;
} {
  const now = new Date();
  const oncekiAy = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yil = oncekiAy.getFullYear();
  const ay = oncekiAy.getMonth() + 1;
  const { baslangic, bitis } = getAyTarihleri(yil, ay);
  return { yil, ay, baslangic, bitis };
}

/**
 * Son ödeme tarihini hesaplar (fatura oluşturma tarihinden 5 gün sonra)
 * @param olusturmaTarihi Fatura oluşturma tarihi
 * @returns Son ödeme tarihi
 */
export function getSonOdemeTarihi(olusturmaTarihi: Date): Date {
  const sonOdemeTarihi = new Date(olusturmaTarihi);
  sonOdemeTarihi.setDate(sonOdemeTarihi.getDate() + 5);
  return sonOdemeTarihi;
}

/**
 * Fatura açıklaması oluşturur
 * @param uyeNumarasi Üye numarası
 * @param adSoyad Ad soyad
 * @param yil Yıl
 * @param ay Ay
 * @returns Fatura açıklaması
 */
export function generateFaturaAciklama(
  uyeNumarasi: string,
  adSoyad: string,
  yil: number,
  ay: number
): string {
  const ayIsimleri = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  return `${uyeNumarasi} ${adSoyad} ${ayIsimleri[ay - 1]} ${yil} Faturası`;
}

/**
 * Ay içinde plan yapılan danışanları gruplar
 * Her danışan için ay içinde kaç plan yapıldığını sayar
 * @param planlar Ay içindeki tüm planlar (danışanId, danışanAdi, olusturmaTarihi içermeli)
 * @returns Gruplanmış danışan detayları
 */
export function groupDanisanlarByAy(
  planlar: Array<{
    danisanId: string;
    danisanAdi: string;
    olusturmaTarihi: Timestamp | Date;
  }>
): FaturaDanisanDetay[] {
  const danisanMap = new Map<string, FaturaDanisanDetay>();

  planlar.forEach((plan) => {
    const danisanId = plan.danisanId;
    const olusturmaTarihi =
      plan.olusturmaTarihi instanceof Timestamp
        ? plan.olusturmaTarihi.toDate()
        : plan.olusturmaTarihi;

    if (danisanMap.has(danisanId)) {
      const mevcut = danisanMap.get(danisanId)!;
      mevcut.planSayisi += 1;
      // En erken plan tarihini tut
      if (olusturmaTarihi < mevcut.planOlusturmaTarihi.toDate()) {
        mevcut.planOlusturmaTarihi = Timestamp.fromDate(olusturmaTarihi);
      }
    } else {
      danisanMap.set(danisanId, {
        danisanId,
        danisanAdi: plan.danisanAdi,
        planOlusturmaTarihi: Timestamp.fromDate(olusturmaTarihi),
        planSayisi: 1,
      });
    }
  });

  return Array.from(danisanMap.values());
}

/**
 * Ayın toplam gün sayısını hesaplar
 * @param ay Ay (1-12)
 * @param yil Yıl
 * @returns Ayın toplam gün sayısı (28, 29, 30, 31)
 */
export function getAyinToplamGunu(ay: number, yil: number): number {
  // Ayın son gününü al (0. gün = önceki ayın son günü)
  return new Date(yil, ay, 0).getDate();
}

/**
 * İlk aktif diyet planı tarihini bulur
 * @param danisanDetaylari Danışan detayları (planOlusturmaTarihi içerir)
 * @returns İlk aktif diyet planı tarihi veya null
 */
export function hesaplaIlkAktifDiyetPlaniTarihi(
  danisanDetaylari: FaturaDanisanDetay[]
): Date | null {
  if (danisanDetaylari.length === 0) return null;
  
  // Tüm plan tarihlerini topla ve en eskisini bul
  const tumTarihler = danisanDetaylari.map((detay) => 
    detay.planOlusturmaTarihi.toDate()
  );
  
  // En eski tarihi döndür
  return new Date(Math.min(...tumTarihler.map((t) => t.getTime())));
}

/**
 * Aktif gün sayısını hesaplar
 * @param ilkAktifDiyetPlaniTarihi İlk aktif diyet planı tarihi
 * @param faturaDonemi Fatura dönemi (ay, yil)
 * @param diyetisyen Diyetisyen bilgisi (fallback için kayıt tarihi)
 * @returns Aktif gün sayısı
 */
export function hesaplaAktifGunSayisi(
  ilkAktifDiyetPlaniTarihi: Date | null,
  faturaDonemi: { ay: number; yil: number },
  diyetisyen: Diyetisyen
): number {
  // Ayın ilk ve son günlerini hesapla
  const ayinIlkGunu = new Date(faturaDonemi.yil, faturaDonemi.ay - 1, 1);
  const ayinSonGunu = new Date(faturaDonemi.yil, faturaDonemi.ay, 0);
  
  // İlk aktif diyet planı tarihini belirle
  let baslangicTarihi: Date;
  if (ilkAktifDiyetPlaniTarihi) {
    // İlk aktif diyet planı tarihi ayın ilk gününden sonraysa, o tarihi kullan
    baslangicTarihi = ilkAktifDiyetPlaniTarihi > ayinIlkGunu 
      ? ilkAktifDiyetPlaniTarihi 
      : ayinIlkGunu;
  } else {
    // Fallback: Diyetisyenin kayıt tarihi
    const kayitTarihi = diyetisyen.olusturmaTarihi.toDate();
    baslangicTarihi = kayitTarihi > ayinIlkGunu ? kayitTarihi : ayinIlkGunu;
  }
  
  // Bitiş tarihi ayın son günü
  const bitisTarihi = ayinSonGunu;
  
  // Gün farkını hesapla (inclusive: başlangıç ve bitiş dahil)
  const gunFarki = Math.ceil(
    (bitisTarihi.getTime() - baslangicTarihi.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(1, gunFarki + 1); // En az 1 gün
}

/**
 * Oransal tutarı hesaplar
 * @param normalTutar Normal tutar (oransal hesaplama öncesi)
 * @param aktifGunSayisi Aktif gün sayısı
 * @param ayinToplamGunu Ayın toplam gün sayısı
 * @returns Oransal tutar (2 ondalık basamağa yuvarlanmış)
 */
export function hesaplaOransalTutar(
  normalTutar: number,
  aktifGunSayisi: number,
  ayinToplamGunu: number
): number {
  const oransalTutar = (normalTutar / ayinToplamGunu) * aktifGunSayisi;
  return Math.round(oransalTutar * 100) / 100; // 2 ondalık basamağa yuvarla
}

/**
 * Fatura oluşturur (async versiyon - ayarlardan paket fiyatlarını çeker)
 * @param diyetisyenId Diyetisyen ID
 * @param diyetisyenEmail Diyetisyen email
 * @param diyetisyenAdSoyad Diyetisyen ad soyad
 * @param uyeNumarasi Üye numarası
 * @param yil Fatura yılı
 * @param ay Fatura ayı (1-12)
 * @param danisanDetaylari Ay içinde plan yapılan danışan detayları
 * @param kdvOrani KDV oranı
 * @param bankaHavalesi Banka havale bilgileri
 * @param diyetisyen Diyetisyen bilgisi (oransal hesaplama için)
 * @returns Fatura objesi
 */
export async function createFaturaAsync(
  diyetisyenId: string,
  diyetisyenEmail: string,
  diyetisyenAdSoyad: string,
  uyeNumarasi: string,
  yil: number,
  ay: number,
  danisanDetaylari: FaturaDanisanDetay[],
  kdvOrani: number = 20,
  bankaHavalesi?: {
    iban: string;
    aliciAdi: string;
  },
  diyetisyen?: Diyetisyen
): Promise<Omit<Fatura, 'id'>> {
  const { baslangic, bitis } = getAyTarihleri(yil, ay);
  const danisanSayisi = danisanDetaylari.length;
  
  // Ayarlardan paket fiyatlarını çek
  const { ayarlarService } = await import('../firebase/firestore');
  const ayarlar = await ayarlarService.get();
  const paketFiyatlari = ayarlar?.paketFiyatlari;
  
  const { paketTipi, danisanBasiUcret, tutar, kdvTutari, toplamTutar } =
    await calculateFaturaTutari(danisanSayisi, kdvOrani, paketFiyatlari);

  // İskonto hesaplama (eğer diyetisyen bilgisi varsa)
  const iskontoOrani = diyetisyen?.iskontoOrani || 0;
  let iskontoTutari = 0;
  
  // Oransal hesaplama (eğer diyetisyen bilgisi varsa)
  let oransalHesaplama: Fatura['oransalHesaplama'] | undefined;
  let finalToplamTutar = toplamTutar;
  let finalKdvTutari = kdvTutari;
  let finalTutar = tutar;

  if (diyetisyen && danisanSayisi > 0) {
    // İlk aktif diyet planı tarihini bul
    const ilkAktifDiyetPlaniTarihi = hesaplaIlkAktifDiyetPlaniTarihi(danisanDetaylari);
    
    // Aktif gün sayısını hesapla
    const aktifGunSayisi = hesaplaAktifGunSayisi(
      ilkAktifDiyetPlaniTarihi,
      { ay, yil },
      diyetisyen
    );
    
    // Ayın toplam gün sayısını hesapla
    const ayinToplamGunu = getAyinToplamGunu(ay, yil);
    
    // Normal tutar (KDV hariç)
    const normalTutar = tutar;
    
    // Oransal tutarı hesapla
    const oransalTutar = hesaplaOransalTutar(normalTutar, aktifGunSayisi, ayinToplamGunu);
    
    // Oransal KDV tutarı
    const oransalKdvTutari = Math.round((oransalTutar * kdvOrani / 100) * 100) / 100;
    
    // Oransal toplam tutar
    const oransalToplamTutar = Math.round((oransalTutar + oransalKdvTutari) * 100) / 100;
    
    // Final tutarları güncelle
    finalTutar = oransalTutar;
    finalKdvTutari = oransalKdvTutari;
    finalToplamTutar = oransalToplamTutar;
    
    // Oransal hesaplama bilgilerini kaydet
    oransalHesaplama = {
      aktif: true,
      ilkAktifDiyetPlaniTarihi: ilkAktifDiyetPlaniTarihi 
        ? Timestamp.fromDate(ilkAktifDiyetPlaniTarihi)
        : diyetisyen.olusturmaTarihi,
      aktifGunSayisi,
      ayinToplamGunu,
      normalTutar,
      oransalTutar,
    };
  }
  
  // İskonto hesaplama (oransal hesaplama sonrası, iskonto oransal tutar üzerinden uygulanır)
  if (iskontoOrani > 0 && finalTutar > 0) {
    // İskonto tutarı = oransal tutar (veya normal tutar) * iskonto oranı / 100
    iskontoTutari = Math.round((finalTutar * iskontoOrani / 100) * 100) / 100;
    
    // İskonto sonrası tutar
    finalTutar = Math.round((finalTutar - iskontoTutari) * 100) / 100;
    
    // KDV iskonto sonrası tutar üzerinden hesaplanır
    finalKdvTutari = Math.round((finalTutar * kdvOrani / 100) * 100) / 100;
    
    // Toplam tutar
    finalToplamTutar = Math.round((finalTutar + finalKdvTutari) * 100) / 100;
  }

  const olusturmaTarihi = new Date();
  const sonOdemeTarihi = getSonOdemeTarihi(olusturmaTarihi);
  const aciklama = generateFaturaAciklama(uyeNumarasi, diyetisyenAdSoyad, yil, ay);

  // Fatura bilgileri (Vergi/TC Kimlik)
  let faturaBilgileri: Fatura['faturaBilgileri'] | undefined;
  if (diyetisyen) {
    if (diyetisyen.vergiNumarasi) {
      faturaBilgileri = {
        vergiNumarasi: diyetisyen.vergiNumarasi,
        tcKimlikNo: diyetisyen.tcKimlikNo,
        vergiDairesi: diyetisyen.vergiDairesi,
        adres: diyetisyen.adres,
        sehir: diyetisyen.sehir,
        postaKodu: diyetisyen.postaKodu,
      };
    } else if (diyetisyen.tcKimlikNo) {
      faturaBilgileri = {
        tcKimlikNo: diyetisyen.tcKimlikNo,
      };
    }
  }

  return {
    diyetisyenId,
    diyetisyenEmail,
    diyetisyenAdSoyad,
    uyeNumarasi,
    faturaDonemi: {
      yil,
      ay,
      baslangicTarihi: Timestamp.fromDate(baslangic),
      bitisTarihi: Timestamp.fromDate(bitis),
    },
    paketTipi,
    danisanSayisi,
    danisanBasiUcret,
    tutar: finalTutar,
    kdvOrani,
    kdvTutari: finalKdvTutari,
    toplamTutar: finalToplamTutar,
    iskontoOrani: iskontoOrani > 0 ? iskontoOrani : undefined,
    iskontoTutari: iskontoTutari > 0 ? iskontoTutari : undefined,
    danisanDetaylari,
    odemeYontemi: 'bankaHavalesi',
    faturaDurumu: 'beklemede',
    olusturmaTarihi: Timestamp.fromDate(olusturmaTarihi),
    sonOdemeTarihi: Timestamp.fromDate(sonOdemeTarihi),
    bankaHavalesi: bankaHavalesi
      ? {
          iban: bankaHavalesi.iban,
          aliciAdi: bankaHavalesi.aliciAdi,
          aciklama,
        }
      : undefined,
    oransalHesaplama,
    faturaBilgileri,
  };
}
