import { Timestamp } from 'firebase/firestore';

export type OdemeDurumu = 'aktif' | 'beklemede' | 'suresiDolmus' | 'deneme';
export type AktiflikDurumu = 'aktif' | 'pasif' | 'askiyaAlindi';
export type ApiErisimDurumu = 'aktif' | 'kisitli' | 'kapali';
export type OnayDurumu = 'beklemede' | 'onaylandi' | 'reddedildi';
export type EvrakDurumu = 'beklemede' | 'yuklendi' | 'onaylandi' | 'reddedildi';

export interface DenemeSuresi {
  aktif: boolean;
  baslangicTarihi?: Timestamp;
  bitisTarihi?: Timestamp;
  gunSayisi: 7 | 15 | 30;
}

export interface Diyetisyen {
  id?: string;
  email: string;
  adSoyad: string;
  telefon?: string;
  uyeNumarasi: string;
  olusturmaTarihi: Timestamp;
  sonGuncelleme: Timestamp;
  
  // Kişisel Bilgiler
  tcKimlikNo?: string;
  vergiNumarasi?: string;
  vergiDairesi?: string;
  adres?: string;
  sehir?: string;
  postaKodu?: string;
  
  // Ödeme Bilgileri
  odemeDurumu: OdemeDurumu;
  sonOdemeTarihi?: Timestamp;
  birSonrakiOdemeTarihi?: Timestamp;
  aktiflikDurumu: AktiflikDurumu;
  
  // Fiyatlandırma
  danisanBasiUcret: number;
  iskontoOrani: number;
  aktifDanisanSayisi: number;
  paketHakki: number; // Satın alınan paket hakkı (örn: 10)
  
  // Deneme Süresi
  denemeSuresi?: DenemeSuresi;
  
  // Mobil Uygulama Entegrasyonu
  mobilUygulamaId?: string;
  mobilUygulamadanKayit: boolean;
  kayitYeri?: 'web' | 'mobil'; // Sonsuz döngü önleme için
  
  // API Kontrolü
  apiErisimDurumu: ApiErisimDurumu;
  kisitlamaNedeni?: string;
  
  // Onay ve Evrak Durumu
  onayDurumu?: OnayDurumu;
  evrakDurumu?: EvrakDurumu;
  evrakIstemeTarihi?: Timestamp;
  onayTarihi?: Timestamp;
  onaylayanAdmin?: string;
}



