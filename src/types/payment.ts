import { Timestamp } from 'firebase/firestore';

export type OdemeYontemi = 'bankaHavalesi' | 'krediKarti';
export type OdemeDurumu = 'beklemede' | 'onaylandi' | 'iptal';

export interface BankaHavalesi {
  iban: string;
  aliciAdi: string;
  aciklama: string;
  onayTarihi?: Timestamp;
}

export interface KrediKarti {
  transactionId?: string;
  odemeTarihi?: Timestamp;
}

export interface Odeme {
  id?: string;
  diyetisyenId: string;
  diyetisyenEmail: string;
  diyetisyenAdSoyad: string;
  uyeNumarasi: string;
  
  // Ödeme Detayları
  tutar: number;
  kdvOrani: number;
  toplamTutar: number;
  odemeYontemi: OdemeYontemi;
  odemeDurumu: OdemeDurumu;
  
  // Dönem Bilgisi
  donemBaslangic: Timestamp;
  donemBitis: Timestamp;
  gunSayisi: number;
  danisanSayisi: number;
  
  // Banka Havalesi Bilgileri
  bankaHavalesi?: BankaHavalesi;
  
  // Kredi Kartı (gelecekte)
  krediKarti?: KrediKarti;
  
  olusturmaTarihi: Timestamp;
  onayTarihi?: Timestamp;
  onaylayanAdmin?: string;
}














