import { Timestamp } from 'firebase/firestore';

export interface BankaHesapBilgileri {
  iban: string;
  aliciAdi: string;
  bankaAdi?: string;
}

export interface PaketFiyatlari {
  esnekPaket: number; // 0-10 danışan için (varsayılan: 199)
  largePaket: number; // 11-20 danışan için (varsayılan: 159)
  xlPaket: number; // 21+ danışan için (varsayılan: 129)
}

export interface GiderKalemi {
  id: string;
  ad: string;
  renk: string; // Tailwind CSS renk sınıfı (örn: 'bg-blue-500')
  aktif: boolean;
  sira: number; // Sıralama için
  olusturmaTarihi: Timestamp;
}

export interface Ayarlar {
  id: string;
  
  // KDV Oranı
  kdvOrani: number; // KDV oranı (örn: 20 = %20)
  
  // Paket Fiyatları
  paketFiyatlari?: PaketFiyatlari;
  
  // Banka Bilgileri
  bankaHesapBilgileri: BankaHesapBilgileri;
  
  // Sistem Ayarları
  otomatikOdemeHesaplama: boolean;
  otomatikPasiflestirme: boolean;
  pasiflestirmeGunSayisi: number;
  
  // API Ayarları
  mobilUygulamaApiKey?: string;
  mobilUygulamaSyncAktif: boolean;
  
  // Deneme Süresi Ayarları
  varsayilanDenemeSuresiGunSayisi: 7 | 15 | 30;
  otomatikDenemeSuresiAktif: boolean;
  
  // Gider Kalemleri
  giderKalemleri?: GiderKalemi[];
  
  sonGuncelleme: Timestamp;
  guncelleyenAdmin: string;
}



