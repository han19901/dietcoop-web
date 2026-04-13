/**
 * Stratejik Partner Firestore Service
 * ENTEGRASYON: firebaseConfig.ts dosyasında db'yi kendi Firebase config'inizle değiştirin.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import {
  StratejikPartnerFirma,
  StratejikPartnerGorusme,
  StratejikPartnerRandevu,
  StratejikPartnerZiyaret,
  StratejikPartnerSatis,
  StratejikPartnerCiro,
  StratejikPartnerLog,
  StratejikPartnerOdeme,
  StratejikPartnerAyarlar,
} from '@/types/stratejikPartner';

const PARTNER_ID = 'withgrower';

export const stratejikPartnerService = {
  async getFirmalar(): Promise<StratejikPartnerFirma[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerFirmalar'),
        orderBy('olusturmaTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerFirma[];
      return data.filter((f) => f.aktif !== false);
    } catch {
      return [];
    }
  },

  async getGorusmeler(): Promise<StratejikPartnerGorusme[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerGorusmeler'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerGorusme[];
    } catch {
      return [];
    }
  },

  async getRandevular(): Promise<StratejikPartnerRandevu[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerRandevular'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerRandevu[];
    } catch {
      return [];
    }
  },

  async getZiyaretler(): Promise<StratejikPartnerZiyaret[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerZiyaretler'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerZiyaret[];
    } catch {
      return [];
    }
  },

  async getSatislar(): Promise<StratejikPartnerSatis[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerSatislar'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(500)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerSatis[];
    } catch {
      return [];
    }
  },

  async getCirolar(): Promise<StratejikPartnerCiro[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerCirolar'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerCiro[];
    } catch {
      return [];
    }
  },

  async getLoglar(): Promise<StratejikPartnerLog[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerLoglar'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(200)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerLog[];
    } catch {
      return [];
    }
  },

  async getOdemeler(): Promise<StratejikPartnerOdeme[]> {
    try {
      const q = query(
        collection(db, 'stratejikPartnerOdemeler'),
        orderBy('olusturmaTarihi', 'desc'),
        limit(200)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StratejikPartnerOdeme[];
    } catch {
      return [];
    }
  },

  async getAyarlar(): Promise<StratejikPartnerAyarlar | null> {
    const docSnap = await getDoc(doc(db, 'stratejikPartnerAyarlar', PARTNER_ID));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as StratejikPartnerAyarlar;
  },
};
