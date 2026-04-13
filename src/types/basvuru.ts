import { Timestamp } from 'firebase/firestore';

export interface Basvuru {
  id?: string;
  ilanId: string;
  ilanBaslik: string;
  adSoyad: string;
  email: string;
  telefon: string;
  cvUrl: string;
  cvDosyaAdi: string;
  ozgecmis?: string;
  basvuruTarihi: Timestamp;
  durum?: 'beklemede' | 'gorusme' | 'reddedildi' | 'kabul-edildi';
  notlar?: string;
  gorusmeTarihi?: Timestamp;
  guncellemeTarihi?: Timestamp;
  guncelleyenAdmin?: string;
}
