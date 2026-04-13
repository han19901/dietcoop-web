import { Timestamp } from 'firebase/firestore';
import { bildirimService } from '../firebase/bildirimService';
import { Diyetisyen } from '@/types/diyetisyen';
import { Fatura } from '@/types/fatura';
import { Evrak } from '@/types/evrak';

/**
 * Profil güncelleme hatırlatması gönder
 */
export async function sendProfilGuncellemeBildirimi(diyetisyen: Diyetisyen): Promise<void> {
  // TC Kimlik numarası eksikse bildirim gönder
  if (!diyetisyen.tcKimlikNo || diyetisyen.tcKimlikNo.length !== 11) {
    await bildirimService.create({
      diyetisyenId: diyetisyen.id!,
      diyetisyenEmail: diyetisyen.email,
      diyetisyenAdSoyad: diyetisyen.adSoyad,
      tip: 'profilGuncelleme',
      baslik: 'Profil Bilgilerinizi Güncelleyin',
      mesaj: 'Lütfen profil bilgilerinizi tamamlayın. TC Kimlik numaranızı girmeniz gerekmektedir.',
      link: '/diyetisyen/profil',
      durum: 'aktif',
      goruldu: false,
      olusturmaTarihi: Timestamp.now(),
    });
  }
}

/**
 * Evrak yükleme hatırlatması gönder
 */
export async function sendEvrakYuklemeBildirimi(diyetisyen: Diyetisyen): Promise<void> {
  await bildirimService.create({
    diyetisyenId: diyetisyen.id!,
    diyetisyenEmail: diyetisyen.email,
    diyetisyenAdSoyad: diyetisyen.adSoyad,
    tip: 'evrakYukleme',
    baslik: 'Evraklarınızı Yükleyin',
    mesaj: 'Lütfen gerekli evraklarınızı (Mezuniyet Belgesi, TC Kimlik) yükleyiniz.',
    link: '/diyetisyen/evraklar',
    durum: 'aktif',
    goruldu: false,
    olusturmaTarihi: Timestamp.now(),
  });
}

/**
 * Evrak reddedildi bildirimi gönder
 */
export async function sendEvrakReddedildiBildirimi(
  evrak: Evrak,
  redSebebi: string
): Promise<void> {
  const evrakAdi = evrak.evrakTipi === 'mezuniyetBelgesi' 
    ? 'Mezuniyet Belgesi' 
    : evrak.evrakTipi === 'tcKimlik' 
    ? 'TC Kimlik' 
    : 'Vergi Levhası';

  await bildirimService.create({
    diyetisyenId: evrak.diyetisyenId,
    diyetisyenEmail: evrak.diyetisyenEmail,
    diyetisyenAdSoyad: evrak.diyetisyenAdSoyad,
    tip: 'evrakReddedildi',
    baslik: `${evrakAdi} Reddedildi`,
    mesaj: `${evrakAdi} evrakınız reddedilmiştir. Red sebebi: ${redSebebi}. Lütfen evrakı düzeltip tekrar yükleyiniz.`,
    link: '/diyetisyen/evraklar',
    durum: 'aktif',
    goruldu: false,
    olusturmaTarihi: Timestamp.now(),
    ilgiliEvrakId: evrak.id,
  });
}

/**
 * Fatura oluştu bildirimi gönder
 */
export async function sendFaturaOlustuBildirimi(fatura: Fatura): Promise<void> {
  await bildirimService.create({
    diyetisyenId: fatura.diyetisyenId,
    diyetisyenEmail: fatura.diyetisyenEmail,
    diyetisyenAdSoyad: fatura.diyetisyenAdSoyad,
    tip: 'faturaOlustu',
    baslik: 'Yeni Faturanız Oluşturuldu',
    mesaj: `${fatura.faturaDonemi.ay}/${fatura.faturaDonemi.yil} dönemi faturanız oluşturuldu. Toplam tutar: ${fatura.toplamTutar.toFixed(2)} ₺. Lütfen 5 gün içinde ödemeyi unutmayın.`,
    link: '/diyetisyen/faturalar',
    durum: 'aktif',
    goruldu: false,
    olusturmaTarihi: Timestamp.now(),
    ilgiliFaturaId: fatura.id,
  });
}

/**
 * Ödeme onaylandı bildirimi gönder
 */
export async function sendOdemeOnaylandiBildirimi(fatura: Fatura): Promise<void> {
  await bildirimService.create({
    diyetisyenId: fatura.diyetisyenId,
    diyetisyenEmail: fatura.diyetisyenEmail,
    diyetisyenAdSoyad: fatura.diyetisyenAdSoyad,
    tip: 'odemeOnaylandi',
    baslik: 'Ödemeniz Onaylandı',
    mesaj: `${fatura.faturaDonemi.ay}/${fatura.faturaDonemi.yil} dönemi faturanızın ödemesi onaylandı. Teşekkür ederiz!`,
    link: '/diyetisyen/faturalar',
    durum: 'aktif',
    goruldu: false,
    olusturmaTarihi: Timestamp.now(),
    ilgiliFaturaId: fatura.id,
  });
}
