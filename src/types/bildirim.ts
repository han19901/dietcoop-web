import { Timestamp } from 'firebase/firestore';

export type BildirimTipi = 
  | 'profilGuncelleme' 
  | 'evrakYukleme' 
  | 'evrakReddedildi' 
  | 'faturaOlustu' 
  | 'odemeOnaylandi'
  | 'genel'
  | 'ozel';

export type BildirimDurumu = 'aktif' | 'pasif' | 'silindi';

export interface Bildirim {
  id?: string;
  diyetisyenId: string; // Diyetisyen ID (genel bildirimler her diyetisyen için ayrı oluşturulur)
  diyetisyenEmail?: string;
  diyetisyenAdSoyad?: string;
  
  tip: BildirimTipi;
  baslik: string;
  mesaj: string;
  link?: string; // İlgili sayfaya yönlendirme için
  
  durum: BildirimDurumu;
  goruldu: boolean;
  gorulmeTarihi?: Timestamp;
  
  olusturmaTarihi: Timestamp;
  olusturanAdminId?: string; // Admin tarafından oluşturulduysa
  olusturanAdminAd?: string;
  
  // Otomatik bildirimler için ek bilgiler
  ilgiliFaturaId?: string;
  ilgiliEvrakId?: string;
}
