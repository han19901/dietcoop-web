import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { Bildirim, BildirimTipi, BildirimDurumu } from '@/types/bildirim';
import { diyetisyenService } from './firestore';

const MAX_BILDIRIM_SAYISI = 10;

export const bildirimService = {
  // Diyetisyen için bildirimleri getir (son 10 aktif bildirim)
  async getByDiyetisyenId(diyetisyenId: string): Promise<Bildirim[]> {
    try {
      // Diyetisyen bildirimlerini getir (genel bildirimler her diyetisyen için ayrı oluşturuluyor)
      const q1 = query(
        collection(db, 'bildirimler'),
        where('diyetisyenId', '==', diyetisyenId),
        where('durum', '!=', 'silindi'),
        orderBy('durum', 'asc'), // Aktif olanlar önce
        orderBy('olusturmaTarihi', 'desc'),
        limit(MAX_BILDIRIM_SAYISI)
      );

      const snapshot1 = await getDocs(q1).catch(() => ({ docs: [], empty: true }));

      const bildirimler: Bildirim[] = snapshot1.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Bildirim[];

      // Tarihe göre sırala ve en fazla 10 tane al
      bildirimler.sort((a, b) => {
        const aTime = a.olusturmaTarihi?.toMillis() || 0;
        const bTime = b.olusturmaTarihi?.toMillis() || 0;
        return bTime - aTime;
      });

      return bildirimler.slice(0, MAX_BILDIRIM_SAYISI);
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q1 = query(
          collection(db, 'bildirimler'),
          where('diyetisyenId', '==', diyetisyenId),
          where('durum', '!=', 'silindi')
        );

        const snapshot1 = await getDocs(q1).catch(() => ({ docs: [], empty: true }));

        const bildirimler: Bildirim[] = snapshot1.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Bildirim[];

        bildirimler.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime;
        });

        return bildirimler.slice(0, MAX_BILDIRIM_SAYISI);
      }
      throw error;
    }
  },

  // Okunmamış bildirim sayısını getir
  async getOkunmamisSayisi(diyetisyenId: string): Promise<number> {
    try {
      const q1 = query(
        collection(db, 'bildirimler'),
        where('diyetisyenId', '==', diyetisyenId),
        where('goruldu', '==', false),
        where('durum', '==', 'aktif')
      );

      const snapshot1 = await getDocs(q1).catch(() => ({ docs: [], empty: true }));

      return snapshot1.docs.length;
    } catch (error) {
      console.error('Okunmamış bildirim sayısı alınırken hata:', error);
      return 0;
    }
  },

  // Bildirim oluştur
  async create(data: Omit<Bildirim, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'bildirimler'), data);
      
      // Eğer 10'dan fazla bildirim varsa, en eskisini sil
      await this.temizleEskiBildirimler(data.diyetisyenId);
      
      return docRef.id;
    } catch (error) {
      console.error('Bildirim oluşturulurken hata:', error);
      throw error;
    }
  },

  // Genel bildirim oluştur (tüm diyetisyenler için)
  async createGenel(
    baslik: string,
    mesaj: string,
    tip: BildirimTipi,
    link?: string,
    olusturanAdminId?: string,
    olusturanAdminAd?: string
  ): Promise<void> {
    try {
      const diyetisyenler = await diyetisyenService.getAll();
      const batch = writeBatch(db);

      // Her diyetisyen için ayrı bildirim oluştur
      for (const diyetisyen of diyetisyenler) {
        if (!diyetisyen.id) continue;

        const bildirimRef = doc(collection(db, 'bildirimler'));
        batch.set(bildirimRef, {
          diyetisyenId: diyetisyen.id,
          diyetisyenEmail: diyetisyen.email,
          diyetisyenAdSoyad: diyetisyen.adSoyad,
          tip,
          baslik,
          mesaj,
          link,
          durum: 'aktif' as BildirimDurumu,
          goruldu: false,
          olusturmaTarihi: Timestamp.now(),
          olusturanAdminId,
          olusturanAdminAd,
        });
      }

      await batch.commit();
      
      // Her diyetisyen için eski bildirimleri temizle
      for (const diyetisyen of diyetisyenler) {
        if (diyetisyen.id) {
          await this.temizleEskiBildirimler(diyetisyen.id);
        }
      }
    } catch (error) {
      console.error('Genel bildirim oluşturulurken hata:', error);
      throw error;
    }
  },

  // Bildirimi görüldü olarak işaretle
  async markAsRead(id: string, _diyetisyenId: string): Promise<void> {
    try {
      const docRef = doc(db, 'bildirimler', id);
      await updateDoc(docRef, {
        goruldu: true,
        gorulmeTarihi: Timestamp.now(),
        durum: 'pasif' as BildirimDurumu,
      });
    } catch (error) {
      console.error('Bildirim görüldü olarak işaretlenirken hata:', error);
      throw error;
    }
  },

  // Bildirimi sil
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'bildirimler', id);
      await updateDoc(docRef, {
        durum: 'silindi' as BildirimDurumu,
      });
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
      throw error;
    }
  },

  // Eski bildirimleri temizle (10'dan fazla varsa en eskisini sil)
  async temizleEskiBildirimler(diyetisyenId: string): Promise<void> {
    try {
      // Diyetisyen bildirimlerini getir
      const q1 = query(
        collection(db, 'bildirimler'),
        where('diyetisyenId', '==', diyetisyenId),
        where('durum', '!=', 'silindi'),
        orderBy('olusturmaTarihi', 'desc')
      );

      const snapshot1 = await getDocs(q1).catch(() => ({ docs: [], empty: true }));

      const tumBildirimler = snapshot1.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<Bildirim & { id: string }>;

      // Tarihe göre sırala
      tumBildirimler.sort((a, b) => {
        const aTime = a.olusturmaTarihi?.toMillis() || 0;
        const bTime = b.olusturmaTarihi?.toMillis() || 0;
        return bTime - aTime;
      });

      // 10'dan fazla varsa, en eskilerini sil
      if (tumBildirimler.length > MAX_BILDIRIM_SAYISI) {
        const silinecekler = tumBildirimler.slice(MAX_BILDIRIM_SAYISI);
        const batch = writeBatch(db);

        for (const bildirim of silinecekler) {
          const docRef = doc(db, 'bildirimler', bildirim.id);
          batch.update(docRef, {
            durum: 'silindi' as BildirimDurumu,
          });
        }

        await batch.commit();
      }
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        const q1 = query(
          collection(db, 'bildirimler'),
          where('diyetisyenId', '==', diyetisyenId),
          where('durum', '!=', 'silindi')
        );

        const snapshot1 = await getDocs(q1).catch(() => ({ docs: [], empty: true }));

        const tumBildirimler = snapshot1.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Array<Bildirim & { id: string }>;

        tumBildirimler.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime;
        });

        if (tumBildirimler.length > MAX_BILDIRIM_SAYISI) {
          const silinecekler = tumBildirimler.slice(MAX_BILDIRIM_SAYISI);
          const batch = writeBatch(db);

          for (const bildirim of silinecekler) {
            const docRef = doc(db, 'bildirimler', bildirim.id);
            batch.update(docRef, {
              durum: 'silindi' as BildirimDurumu,
            });
          }

          await batch.commit();
        }
      }
    }
  },
};
