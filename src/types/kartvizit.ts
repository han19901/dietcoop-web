import { Timestamp } from 'firebase/firestore';

export interface Kartvizit {
  id: string;
  adSoyad: string;
  unvan?: string;
  telefon: string;
  email: string;
  adres?: string;
  sirket?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  olusturmaTarihi: Timestamp;
  olusturanAdminId: string;
  aktif: boolean;
}
