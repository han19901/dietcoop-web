import { Timestamp } from 'firebase/firestore';

export type EvrakTipi = 'mezuniyetBelgesi' | 'tcKimlik' | 'vergiLevhası';
export type EvrakDurumu = 'beklemede' | 'onaylandi' | 'reddedildi';
export type EvrakFormat = 'jpeg' | 'jpg' | 'pdf';

export interface Evrak {
  id?: string;
  diyetisyenId: string;
  diyetisyenAdSoyad: string;
  diyetisyenEmail: string;
  
  evrakTipi: EvrakTipi;
  dosyaAdi: string;
  dosyaUrl: string;
  dosyaFormat: EvrakFormat;
  dosyaBoyutu: number; // bytes
  
  durum: EvrakDurumu;
  redSebebi?: string;
  
  yuklemeTarihi: Timestamp;
  onayTarihi?: Timestamp;
  onaylayanAdminId?: string;
  onaylayanAdminAd?: string;
  
  sonGuncelleme: Timestamp;
}

export interface DiyetisyenEvrakDurumu {
  diyetisyenId: string;
  mezuniyetBelgesi: EvrakDurumu;
  tcKimlik: EvrakDurumu;
  vergiLevhası: EvrakDurumu | null; // null ise opsiyonel, yüklenmemiş
  sonGuncelleme: Timestamp;
}
