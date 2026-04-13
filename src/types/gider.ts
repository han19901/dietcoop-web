import { Timestamp } from 'firebase/firestore';

export type GiderKategorisi = 
  | 'kirtasiye'
  | 'yiyecekIcecek'
  | 'telefonFaks'
  | 'iskiSu'
  | 'elektrik'
  | 'reklamTanitim'
  | 'kargoKurye'
  | 'temizlik'
  | 'teknikServis'
  | 'smmYmmAvukat'
  | 'bursGideri'
  | 'internetSarfMalz'
  | 'noter'
  | 'bilgSarfMalzemleri'
  | 'vergiResimVeHarclar'
  | 'digerCesitli'
  | 'personelSaglik'
  | 'sehirIciUlasim'
  | 'temsilVeAgirlama'
  | 'apartmanAidatlari'
  | 'isyeriSigortalama'
  | 'kiralamar'
  | 'igdasDogalgaz'
  | 'aracSigortalama'
  | 'kucukDemirbaslar'
  | 'buroBakimOnarim'
  | 'aracYakit'
  | 'kurye'
  | 'gazeteVeDergi'
  | 'aracOtopark'
  | 'aracBakimVeOnarim'
  | 'matbaa'
  | 'maas'
  | 'bankaKomisyon'
  | 'krediKartiKomisyonlari'
  | 'bagkur'
  | 'prim'
  | 'yurtIciUlasim'
  | 'aracVergi'
  | 'ssk'
  | 'ogs'
  | 'kanunenKabulEdilmeyen'
  | 'fiyatFarklari'
  | 'yurtdisiUlasimKonaklama'
  | 'aracKiralama'
  | 'kidemIhbar'
  | 'digerHaberlesmeGid';

export interface Gider {
  id?: string;
  aciklama: string;
  tutar: number;
  kategori: GiderKategorisi | string; // Dinamik kalem ID'si veya eski enum değeri
  kategoriId?: string; // Dinamik kalem ID'si (yeni sistem)
  tarih: Timestamp;
  faturaNo?: string;
  olusturmaTarihi: Timestamp;
  olusturanAdmin?: string;
  sonGuncelleme?: Timestamp;
  guncelleyenAdmin?: string;
  notlar?: string;
}
