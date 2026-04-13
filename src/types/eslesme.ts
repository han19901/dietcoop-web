import { Timestamp } from 'firebase/firestore';

export type EslesmeDurumu = 'aktif' | 'beklemede' | 'iptal';

export interface Eslesme {
  id?: string;
  diyetisyenId: string;
  danisanId: string;
  danisanEmail: string;
  danisanAdi?: string;
  durum: EslesmeDurumu;
  olusturmaTarihi: Timestamp;
  aktiflestirmeTarihi?: Timestamp;
  iptalTarihi?: Timestamp;
}












