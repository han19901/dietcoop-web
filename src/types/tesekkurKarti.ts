import { Timestamp } from 'firebase/firestore';

export type EtkinlikTipi = 'toplanti' | 'isbirligi' | 'ziyaret' | 'gorusme' | 'sunum' | 'workshop';

export interface TesekkurKarti {
  id: string;
  firmaAdi: string;
  etkinlikTipi?: EtkinlikTipi; // Toplantı, İşbirliği, Ziyaret vb. (varsayılan: toplanti)
  toplantiyaKatilanKisi: string; // Karşı taraf katılımcı(lar)
  toplantiTarihi: string; // YYYY-MM-DD formatında
  toplantiSaati?: string; // HH:MM formatında
  dietcoopKatilimcilar: string[]; // DietCoop tarafından katılan kişiler
  ozelMesaj?: string; // İsteğe bağlı özel mesaj
  olusturmaTarihi: Timestamp;
  olusturanAdminId: string;
  aktif: boolean;
}

export const ETKINLIK_TIPLERI: { value: EtkinlikTipi; label: string }[] = [
  { value: 'toplanti', label: 'Toplantı' },
  { value: 'isbirligi', label: 'İşbirliği' },
  { value: 'ziyaret', label: 'Ziyaret' },
  { value: 'gorusme', label: 'Görüşme' },
  { value: 'sunum', label: 'Sunum' },
  { value: 'workshop', label: 'Workshop' },
];

export const getEtkinlikAltBaslik = (tip: EtkinlikTipi): string => {
  const map: Record<EtkinlikTipi, string> = {
    toplanti: 'Değerli Toplantı İçin',
    isbirligi: 'Değerli İşbirliği İçin',
    ziyaret: 'Değerli Ziyaret İçin',
    gorusme: 'Değerli Görüşme İçin',
    sunum: 'Değerli Sunum İçin',
    workshop: 'Değerli Workshop İçin',
  };
  return map[tip] || 'Değerli İşbirliği İçin';
};
