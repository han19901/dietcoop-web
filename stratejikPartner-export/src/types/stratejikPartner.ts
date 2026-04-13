import { Timestamp } from 'firebase/firestore';

export interface StratejikPartnerFirma {
  id: string;
  firmaAdi: string;
  logo?: string;
  email?: string;
  telefon?: string;
  aktif: boolean;
  olusturmaTarihi: Timestamp;
}

export interface StratejikPartnerGorusme {
  id: string;
  firmaId: string;
  firmaAdi: string;
  tarih: string;
  saat?: string;
  konu: string;
  not?: string;
  olusturmaTarihi: Timestamp;
}

export interface StratejikPartnerRandevu {
  id: string;
  firmaId: string;
  firmaAdi: string;
  tarih: string;
  saat?: string;
  durum: 'planlandi' | 'tamamlandi' | 'iptal';
  not?: string;
  olusturmaTarihi: Timestamp;
}

export interface StratejikPartnerZiyaret {
  id: string;
  firmaId: string;
  firmaAdi: string;
  tarih: string;
  saat?: string;
  not?: string;
  olusturmaTarihi: Timestamp;
}

export type SatisDurumu = 'satisa_donustu' | 'satisa_donusmedi';

export interface StratejikPartnerSatis {
  id: string;
  firmaId: string;
  firmaAdi: string;
  durum: SatisDurumu;
  tutar?: number;
  tarih: string;
  not?: string;
  olusturmaTarihi: Timestamp;
}

export interface StratejikPartnerCiro {
  id: string;
  firmaId?: string;
  donem: 'aylik' | '3aylik' | '6aylik' | '12aylik';
  yil: number;
  ay?: number;
  tutar: number;
  olusturmaTarihi: Timestamp;
}

export type LogTipi = 'data_eklendi' | 'data_silindi' | 'arama_yapildi' | 'arama_notu' | 'randevu' | 'ziyaret' | 'teklif' | 'diger';

export interface StratejikPartnerLog {
  id: string;
  firmaId?: string;
  firmaAdi?: string;
  tip: LogTipi;
  aciklama: string;
  detay?: string;
  kullaniciId?: string;
  olusturmaTarihi: Timestamp;
}

export interface StratejikPartnerOdeme {
  id: string;
  firmaId: string;
  firmaAdi: string;
  tutar: number;
  odemeTarihi: string;
  aciklama?: string;
  durum: 'odendi' | 'beklemede';
  tahsilEdilenBakiye?: number;
  olusturmaTarihi: Timestamp;
}

export interface StratejikPartnerAyarlar {
  id: string;
  komisyonOrani: number;
  partnerId?: string;
  olusturmaTarihi: Timestamp;
  sonGuncelleme: Timestamp;
}

export interface StratejikPartnerGiris {
  id: string;
  email: string;
  uid?: string;
  firmaAdi: string;
  logo?: string;
  aktif: boolean;
  olusturmaTarihi: Timestamp;
}
