import { Timestamp } from 'firebase/firestore';

export interface Ilan {
  id?: string;
  baslik: string;
  aciklama: string;
  departman?: string;
  konum?: string;
  calismaSekli?: 'tam-zamanli' | 'yarı-zamanli' | 'uzaktan' | 'hibrit';
  deneyimSeviyesi?: 'stajyer' | 'junior' | 'mid' | 'senior' | 'lead';
  basvuruBaslangicTarihi: Timestamp;
  basvuruBitisTarihi: Timestamp;
  aktif: boolean;
  olusturmaTarihi: Timestamp;
  olusturanAdmin: string;
  sonGuncelleme?: Timestamp;
  guncelleyenAdmin?: string;
  gorusmeTarihi?: Timestamp;
  iseBaslamaTarihi?: Timestamp;
  maasAraligi?: string;
  gereksinimler?: string[];
  sorumluluklar?: string[];
  avantajlar?: string[];
}
