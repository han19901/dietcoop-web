import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { Diyetisyen } from '@/types/diyetisyen';
import { Odeme } from '@/types/payment';
import { Ayarlar } from '@/types/settings';
import { Eslesme } from '@/types/eslesme';
import { Fatura } from '@/types/fatura';
import { Evrak } from '@/types/evrak';
import { Gider } from '@/types/gider';
import { Kartvizit } from '@/types/kartvizit';
import { TesekkurKarti } from '@/types/tesekkurKarti';
import { Ilan } from '@/types/ilan';
import { Basvuru } from '@/types/basvuru';
import { mobileAppService } from './mobileAppService';

// Diyetisyenler Collection
export const diyetisyenService = {
  // Tüm diyetisyenleri getir
  async getAll(): Promise<Diyetisyen[]> {
    const q = query(collection(db, 'diyetisyenler'), orderBy('olusturmaTarihi', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // denemeSuresi yoksa varsayılan değer
        denemeSuresi: data.denemeSuresi || {
          aktif: false,
          gunSayisi: 15,
        },
      };
    }) as Diyetisyen[];
  },

  // Filtreleme ile getir
  async getFiltered(constraints: QueryConstraint[]): Promise<Diyetisyen[]> {
    const q = query(collection(db, 'diyetisyenler'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // denemeSuresi yoksa varsayılan değer
        denemeSuresi: data.denemeSuresi || {
          aktif: false,
          gunSayisi: 15,
        },
      };
    }) as Diyetisyen[];
  },

  // User ID (Firebase Auth UID) ile getir
  async getByUserId(userId: string): Promise<Diyetisyen | null> {
    // Önce ID ile dene
    let diyetisyenData = await this.getById(userId);
    if (diyetisyenData) return diyetisyenData;
    
    // Email ile ara (sadece adminler için veya kullanıcı kendi email'i ile arama yapıyorsa)
    // Not: Firestore rules'da email ile query yapmak için özel izin gerekir
    // Bu yüzden hata yakalayıp null döndürüyoruz
    try {
      const q = query(
        collection(db, 'diyetisyenler'),
        where('email', '==', userId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        // Email ile bulunan diyetisyen için de diyet planlarını çek
        let aktifDanisanSayisi = data.aktifDanisanSayisi || 0;
        if (data.mobilUygulamadanKayit || data.kayitYeri === 'mobil') {
          try {
            const mobileUserId = data.mobilUygulamaId || doc.id || userId;
            const now = new Date();
            const baslangicTarihi = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            const bitisTarihi = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            
            const planlar = await mobileAppService.getDiyetPlanlariByAy(
              mobileUserId,
              baslangicTarihi,
              bitisTarihi
            );
            
            let filtreliPlanlar = planlar;
            if (data.denemeSuresi?.aktif && data.denemeSuresi.bitisTarihi) {
              const denemeBitis = data.denemeSuresi.bitisTarihi.toDate();
              const denemeSuresiBitti = denemeBitis < now;
              if (!denemeSuresiBitti) {
                filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
              }
            }
            
            const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
            aktifDanisanSayisi = benzersizDanisanlar.size;
          } catch (error) {
            console.error('[firestore.getByUserId] Email ile bulunan diyetisyen için diyet planları alınamadı:', error);
          }
        }
        
        return {
          id: doc.id,
          ...data,
          aktifDanisanSayisi,
          denemeSuresi: data.denemeSuresi || {
            aktif: false,
            gunSayisi: 15,
          },
        } as Diyetisyen;
      }
    } catch (error: any) {
      // Permission denied hatası beklenen bir durum olabilir
      // Kullanıcı admin değilse ve email ile arama yapamaz
      if (error.code === 'permission-denied') {
        console.warn('Email ile arama yapılamadı (permission denied), ID ile arama yapıldı:', userId);
      } else {
        console.error('Email ile arama hatası:', error);
      }
    }
    
    return null;
  },

  // ID ile getir
  async getById(id: string): Promise<Diyetisyen | null> {
    const docRef = doc(db, 'diyetisyenler', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    
    // Mobil uygulamadan aktif/pasif danışan sayılarını oku
    // Cloud Functions kurulumu tamamlandığında aktif olacak
    let aktifDanisanSayisi = data.aktifDanisanSayisi || 0;
    let pasifDanisanSayisi = data.pasifDanisanSayisi || 0;
    
    try {
      // Mobil uygulamadaki user ID'yi bul
      // Önce mobilUygulamaId'yi kontrol et, yoksa id'yi kullan
      // Eğer mobil uygulamadan kayıt ise, doküman ID'si direkt user ID olabilir
      const mobileUserId = data.mobilUygulamaId || docSnap.id || id;
      
      // Son 12 ay için tüm diyet planlarını çek ve benzersiz danışan sayısını hesapla
      const now = new Date();
      const baslangicTarihi = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Son 12 ay
      const bitisTarihi = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Bu ayın sonu
      
      const planlar = await mobileAppService.getDiyetPlanlariByAy(
        mobileUserId,
        baslangicTarihi,
        bitisTarihi
      );
      
      // Deneme süresi kontrolü
      let filtreliPlanlar = planlar;
      if (data.denemeSuresi?.aktif && data.denemeSuresi.bitisTarihi) {
        const denemeBitis = data.denemeSuresi.bitisTarihi.toDate();
        const denemeSuresiBitti = denemeBitis < now;
        
        // Sadece deneme süresi henüz bitmemişse filtre uygula
        if (!denemeSuresiBitti) {
          filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
        }
      }
      
      // Benzersiz danışan sayısı (her danışan için 1 kez)
      const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
      aktifDanisanSayisi = benzersizDanisanlar.size;
      
    } catch (error: any) {
      console.error('❌ Mobil uygulamadan diyet planları alınamadı, mevcut değer kullanılıyor:', {
        error: error.message,
        stack: error.stack,
        mevcutAktifDanisanSayisi: aktifDanisanSayisi,
        mevcutPasifDanisanSayisi: pasifDanisanSayisi
      });
    }
    
    return {
      id: docSnap.id,
      ...data,
      aktifDanisanSayisi, // Mobil uygulamadan veya mevcut değer
      pasifDanisanSayisi, // Mobil uygulamadan veya mevcut değer
      // denemeSuresi yoksa varsayılan değer
      denemeSuresi: data.denemeSuresi || {
        aktif: false,
        gunSayisi: 15,
      },
    } as unknown as Diyetisyen;
  },

  // Email ile getir
  async getByEmail(email: string): Promise<Diyetisyen | null> {
    const q = query(collection(db, 'diyetisyenler'), where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      // denemeSuresi yoksa varsayılan değer
      denemeSuresi: data.denemeSuresi || {
        aktif: false,
        gunSayisi: 15,
      },
    } as Diyetisyen;
  },

  // Ekle
  async create(data: Omit<Diyetisyen, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'diyetisyenler'), {
      ...data,
      olusturmaTarihi: Timestamp.now(),
      sonGuncelleme: Timestamp.now(),
    });
    return docRef.id;
  },

  // Güncelle
  async update(id: string, data: Partial<Diyetisyen>): Promise<void> {
    const docRef = doc(db, 'diyetisyenler', id);
    // Eğer kayitYeri belirtilmemişse, web panelden güncelleme olduğu için 'web' yap
    const updateData: any = {
      ...data,
      sonGuncelleme: Timestamp.now(),
    };
    // Eğer kayitYeri yoksa ve mobilUygulamadanKayit false ise, web'den güncelleme
    if (!updateData.kayitYeri && data.mobilUygulamadanKayit === false) {
      updateData.kayitYeri = 'web';
    }
    await updateDoc(docRef, updateData);
  },

  // Sil
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'diyetisyenler', id));
  },
};

// Ödemeler Collection
export const odemeService = {
  // Tüm ödemeleri getir
  async getAll(): Promise<Odeme[]> {
    const q = query(collection(db, 'odemeler'), orderBy('olusturmaTarihi', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Odeme[];
  },

  // Diyetisyen ödemelerini getir
  async getByDiyetisyenId(diyetisyenId: string): Promise<Odeme[]> {
    try {
      // Önce index ile dene
      const q = query(
        collection(db, 'odemeler'),
        where('diyetisyenId', '==', diyetisyenId),
        orderBy('olusturmaTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Odeme[];
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap ve client-side'da sırala
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'odemeler'),
          where('diyetisyenId', '==', diyetisyenId)
        );
        const snapshot = await getDocs(q);
        const odemeler = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Odeme[];
        
        // Client-side'da tarihe göre sırala
        return odemeler.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });
      }
      throw error;
    }
  },

  // ID ile getir
  async getById(id: string): Promise<Odeme | null> {
    const docRef = doc(db, 'odemeler', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Odeme;
  },

  // Ödeme oluştur
  async create(data: Omit<Odeme, 'id'>): Promise<string> {
    // Ücret hesapla (aktif danışan sayısına göre)
    // getById zaten mobil uygulamadan diyet planlarını çekerek aktifDanisanSayisi'ni hesaplıyor
    const diyetisyen = await diyetisyenService.getById(data.diyetisyenId);
    const aktifDanisanSayisi = diyetisyen?.aktifDanisanSayisi || data.danisanSayisi || 0;
    const danisanBasiUcret = diyetisyen?.danisanBasiUcret || 199;
    const iskontoOrani = diyetisyen?.iskontoOrani || 0;
    
    // Ayarlardan KDV oranını al
    const ayarlar = await ayarlarService.get();
    const kdvOrani = ayarlar?.kdvOrani || 20;
    
    // İskonto hesaplama: Danışan başına indirim = danışan başına ücret * iskonto oranı
    const danisanBasiIndirim = danisanBasiUcret * (iskontoOrani / 100);
    
    // İskonto sonrası tutar = (danışan başına ücret - danışan başına indirim) * danışan sayısı
    const iskontoSonrasiTutar = (danisanBasiUcret - danisanBasiIndirim) * aktifDanisanSayisi;
    
    // KDV hesaplama: İskonto sonrası tutar üzerinden
    const kdvTutari = iskontoSonrasiTutar * (kdvOrani / 100);
    
    // Toplam tutar
    const toplamTutar = iskontoSonrasiTutar + kdvTutari;
    
    const odemeData: Omit<Odeme, 'id'> = {
      ...data,
      danisanSayisi: aktifDanisanSayisi, // Mobil uygulamadan veya mevcut değer
      tutar: iskontoSonrasiTutar,
      kdvOrani: kdvOrani,
      toplamTutar,
      olusturmaTarihi: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'odemeler'), odemeData);
    return docRef.id;
  },

  // Ödeme güncelle
  async update(id: string, data: Partial<Odeme>): Promise<void> {
    const docRef = doc(db, 'odemeler', id);
    await updateDoc(docRef, data);
  },
};

// Ayarlar Collection
export const ayarlarService = {
  // Ayarları getir
  async get(): Promise<Ayarlar | null> {
    const docRef = doc(db, 'ayarlar', 'genelAyarlar');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Ayarlar;
  },

  // Ayarları güncelle (doküman yoksa oluşturur)
  async update(data: Partial<Ayarlar>, adminId: string): Promise<void> {
    const docRef = doc(db, 'ayarlar', 'genelAyarlar');
    const docSnap = await getDoc(docRef);
    
    const updateData = {
      ...data,
      sonGuncelleme: Timestamp.now(),
      guncelleyenAdmin: adminId,
    };
    
    if (docSnap.exists()) {
      // Doküman varsa güncelle
      await updateDoc(docRef, updateData);
    } else {
      // Doküman yoksa oluştur
      await setDoc(docRef, updateData);
    }
  },

  // Ayarları oluştur (ilk kurulum)
  async create(data: Omit<Ayarlar, 'id'>): Promise<void> {
    const docRef = doc(db, 'ayarlar', 'genelAyarlar');
    await setDoc(docRef, {
      ...data,
      sonGuncelleme: Timestamp.now(),
    });
  },
};

// Eşleşmeler Collection
export const eslesmeService = {
  // Diyetisyenin tüm eşleşmelerini getir
  async getByDiyetisyenId(diyetisyenId: string): Promise<Eslesme[]> {
    const q = query(
      collection(db, 'eslesmeler'),
      where('diyetisyenId', '==', diyetisyenId),
      orderBy('olusturmaTarihi', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Eslesme[];
  },

  // Bekleyen eşleşmeleri getir
  async getBekleyen(diyetisyenId: string): Promise<Eslesme[]> {
    try {
      // Önce index ile dene
      const q = query(
        collection(db, 'eslesmeler'),
        where('diyetisyenId', '==', diyetisyenId),
        where('durum', '==', 'beklemede'),
        orderBy('olusturmaTarihi', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Eslesme[];
    } catch (error: any) {
      // Index yoksa veya permissions hatası varsa, orderBy olmadan sorgu yap
      if (error.code === 'failed-precondition' || error.code === 'permission-denied' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı veya permissions hatası, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'eslesmeler'),
          where('diyetisyenId', '==', diyetisyenId),
          where('durum', '==', 'beklemede')
        );
        const snapshot = await getDocs(q);
        const eslesmeler = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Eslesme[];
        
        // Client-side'da tarihe göre sırala
        return eslesmeler.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return aTime - bTime; // Ascending order
        });
      }
      throw error;
    }
  },

  // Aktif eşleşme sayısını getir
  async getAktifSayisi(diyetisyenId: string): Promise<number> {
    const q = query(
      collection(db, 'eslesmeler'),
      where('diyetisyenId', '==', diyetisyenId),
      where('durum', '==', 'aktif')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  // Bekleyen eşleşme sayısını getir
  async getBekleyenSayisi(diyetisyenId: string): Promise<number> {
    const q = query(
      collection(db, 'eslesmeler'),
      where('diyetisyenId', '==', diyetisyenId),
      where('durum', '==', 'beklemede')
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  // Eşleşme oluştur
  async create(data: Omit<Eslesme, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'eslesmeler'), {
      ...data,
      olusturmaTarihi: Timestamp.now(),
    });
    return docRef.id;
  },

  // Eşleşme güncelle
  async update(id: string, data: Partial<Eslesme>): Promise<void> {
    const docRef = doc(db, 'eslesmeler', id);
    await updateDoc(docRef, data);
  },

  // Bekleyen eşleşmeleri aktifleştir
  async activatePending(
    diyetisyenId: string,
    yeniPaketHakki: number
  ): Promise<number> {
    const aktifSayisi = await this.getAktifSayisi(diyetisyenId);
    const bekleyenler = await this.getBekleyen(diyetisyenId);
    
    const aktiflestirilecekSayi = Math.min(
      bekleyenler.length,
      yeniPaketHakki - aktifSayisi
    );
    
    for (let i = 0; i < aktiflestirilecekSayi; i++) {
      await this.update(bekleyenler[i].id!, {
        durum: 'aktif',
        aktiflestirmeTarihi: Timestamp.now(),
      });
    }
    
    return aktiflestirilecekSayi;
  },
};

// Aktivite Logları
export const aktiviteLogService = {
  async log(
    adminId: string,
    islemTipi: string,
    aciklama: string,
    diyetisyenId?: string,
    detaylar?: object
  ): Promise<void> {
    const logData: any = {
      adminId,
      islemTipi,
      aciklama,
      tarih: Timestamp.now(),
    };
    
    // undefined değerleri Firebase'e gönderme
    if (diyetisyenId !== undefined) {
      logData.diyetisyenId = diyetisyenId;
    }
    
    if (detaylar !== undefined) {
      logData.detaylar = detaylar;
    }
    
    await addDoc(collection(db, 'aktiviteLoglari'), logData);
  },
};

// Faturalar Collection
export const faturaService = {
  // Tüm faturaları getir
  async getAll(): Promise<Fatura[]> {
    const q = query(collection(db, 'faturalar'), orderBy('olusturmaTarihi', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Fatura[];
  },

  // Diyetisyen ID'ye göre faturaları getir
  async getByDiyetisyenId(diyetisyenId: string): Promise<Fatura[]> {
    try {
      const q = query(
        collection(db, 'faturalar'),
        where('diyetisyenId', '==', diyetisyenId),
        orderBy('olusturmaTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Fatura[];
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap ve client-side'da sırala
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'faturalar'),
          where('diyetisyenId', '==', diyetisyenId)
        );
        const snapshot = await getDocs(q);
        const faturalar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Fatura[];
        
        // Client-side'da tarihe göre sırala
        return faturalar.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });
      }
      throw error;
    }
  },

  // Fatura dönemine göre getir
  async getByDonem(yil: number, ay: number): Promise<Fatura[]> {
    try {
      const q = query(
        collection(db, 'faturalar'),
        where('faturaDonemi.yil', '==', yil),
        where('faturaDonemi.ay', '==', ay),
        orderBy('olusturmaTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Fatura[];
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap ve client-side'da sırala
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'faturalar'),
          where('faturaDonemi.yil', '==', yil),
          where('faturaDonemi.ay', '==', ay)
        );
        const snapshot = await getDocs(q);
        const faturalar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Fatura[];
        
        // Client-side'da tarihe göre sırala
        return faturalar.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });
      }
      throw error;
    }
  },

  // Fatura durumuna göre getir
  async getByDurum(durum: Fatura['faturaDurumu']): Promise<Fatura[]> {
    try {
      const q = query(
        collection(db, 'faturalar'),
        where('faturaDurumu', '==', durum),
        orderBy('olusturmaTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Fatura[];
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap ve client-side'da sırala
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'faturalar'),
          where('faturaDurumu', '==', durum)
        );
        const snapshot = await getDocs(q);
        const faturalar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Fatura[];
        
        // Client-side'da tarihe göre sırala
        return faturalar.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });
      }
      throw error;
    }
  },

  // ID ile getir
  async getById(id: string): Promise<Fatura | null> {
    const docRef = doc(db, 'faturalar', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Fatura;
  },

  // Fatura oluştur
  async create(data: Omit<Fatura, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'faturalar'), data);
    return docRef.id;
  },

  // Fatura güncelle
  async update(id: string, data: Partial<Fatura>): Promise<void> {
    const docRef = doc(db, 'faturalar', id);
    await updateDoc(docRef, data);
  },

  // Fatura sil
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'faturalar', id);
    await deleteDoc(docRef);
  },

  // Diyetisyen için belirli dönemde fatura var mı kontrol et
  async faturaVarMi(diyetisyenId: string, yil: number, ay: number): Promise<boolean> {
    const q = query(
      collection(db, 'faturalar'),
      where('diyetisyenId', '==', diyetisyenId),
      where('faturaDonemi.yil', '==', yil),
      where('faturaDonemi.ay', '==', ay)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  },
};

// Evraklar Collection
export const evrakService = {
  // Tüm evrakları getir
  async getAll(): Promise<Evrak[]> {
    try {
      const q = query(collection(db, 'evraklar'), orderBy('yuklemeTarihi', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evrak[];
    } catch (error) {
      console.error('Tüm evraklar yüklenirken hata:', error);
      throw error;
    }
  },

  // Diyetisyen ID'ye göre evrakları getir
  async getByDiyetisyenId(diyetisyenId: string): Promise<Evrak[]> {
    try {
      const q = query(
        collection(db, 'evraklar'),
        where('diyetisyenId', '==', diyetisyenId),
        orderBy('yuklemeTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evrak[];
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'evraklar'),
          where('diyetisyenId', '==', diyetisyenId)
        );
        const snapshot = await getDocs(q);
        const evraklar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Evrak[];
        
        // Client-side'da tarihe göre sırala
        return evraklar.sort((a, b) => {
          const aTime = a.yuklemeTarihi?.toMillis() || 0;
          const bTime = b.yuklemeTarihi?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });
      }
      throw error;
    }
  },

  // Evrak tipine göre getir
  async getByEvrakTipi(evrakTipi: Evrak['evrakTipi']): Promise<Evrak[]> {
    try {
      const q = query(
        collection(db, 'evraklar'),
        where('evrakTipi', '==', evrakTipi),
        orderBy('yuklemeTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evrak[];
    } catch (error: any) {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'evraklar'),
          where('evrakTipi', '==', evrakTipi)
        );
        const snapshot = await getDocs(q);
        const evraklar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Evrak[];
        
        return evraklar.sort((a, b) => {
          const aTime = a.yuklemeTarihi?.toMillis() || 0;
          const bTime = b.yuklemeTarihi?.toMillis() || 0;
          return bTime - aTime;
        });
      }
      throw error;
    }
  },

  // Duruma göre getir
  async getByDurum(durum: Evrak['durum']): Promise<Evrak[]> {
    try {
      const q = query(
        collection(db, 'evraklar'),
        where('durum', '==', durum),
        orderBy('yuklemeTarihi', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evrak[];
    } catch (error: any) {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'evraklar'),
          where('durum', '==', durum)
        );
        const snapshot = await getDocs(q);
        const evraklar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Evrak[];
        
        return evraklar.sort((a, b) => {
          const aTime = a.yuklemeTarihi?.toMillis() || 0;
          const bTime = b.yuklemeTarihi?.toMillis() || 0;
          return bTime - aTime;
        });
      }
      throw error;
    }
  },

  // ID ile getir
  async getById(id: string): Promise<Evrak | null> {
    try {
      const docRef = doc(db, 'evraklar', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Evrak;
    } catch (error) {
      console.error(`Evrak ID'ye göre yüklenirken hata (${id}):`, error);
      throw error;
    }
  },

  // Diyetisyen için belirli evrak tipinde evrak var mı kontrol et
  async evrakVarMi(diyetisyenId: string, evrakTipi: Evrak['evrakTipi']): Promise<Evrak | null> {
    try {
      const q = query(
        collection(db, 'evraklar'),
        where('diyetisyenId', '==', diyetisyenId),
        where('evrakTipi', '==', evrakTipi),
        orderBy('yuklemeTarihi', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Evrak;
    } catch (error: any) {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        // Index yoksa, orderBy olmadan sorgu yap
        const q = query(
          collection(db, 'evraklar'),
          where('diyetisyenId', '==', diyetisyenId),
          where('evrakTipi', '==', evrakTipi)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        // En yeni olanı al
        const evraklar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Evrak[];
        evraklar.sort((a, b) => {
          const aTime = a.yuklemeTarihi?.toMillis() || 0;
          const bTime = b.yuklemeTarihi?.toMillis() || 0;
          return bTime - aTime;
        });
        return evraklar[0] || null;
      }
      throw error;
    }
  },

  // Evrak oluştur
  async create(data: Omit<Evrak, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'evraklar'), data);
      return docRef.id;
    } catch (error) {
      console.error('Evrak oluşturulurken hata:', error);
      throw error;
    }
  },

  // Evrak güncelle
  async update(id: string, data: Partial<Evrak>): Promise<void> {
    try {
      const docRef = doc(db, 'evraklar', id);
      // undefined değerleri filtrele (Firestore undefined kabul etmez)
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined)
      );
      await updateDoc(docRef, {
        ...cleanData,
        sonGuncelleme: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Evrak güncellenirken hata (${id}):`, error);
      throw error;
    }
  },

  // Evrak sil
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'evraklar', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Evrak silinirken hata (${id}):`, error);
      throw error;
    }
  },
};

// Giderler Collection
export const giderService = {
  // Tüm giderleri getir
  async getAll(): Promise<Gider[]> {
    const q = query(collection(db, 'giderler'), orderBy('tarih', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Gider[];
  },

  // Filtreleme ile getir
  async getFiltered(constraints: QueryConstraint[]): Promise<Gider[]> {
    const q = query(collection(db, 'giderler'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Gider[];
  },

  // ID ile getir
  async getById(id: string): Promise<Gider | null> {
    const docSnap = await getDoc(doc(db, 'giderler', id));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Gider;
  },

  // Gider oluştur
  async create(data: Omit<Gider, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'giderler'), {
      ...data,
      olusturmaTarihi: Timestamp.now(),
    });
    return docRef.id;
  },

  // Gider güncelle
  async update(id: string, data: Partial<Gider>): Promise<void> {
    const docRef = doc(db, 'giderler', id);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(docRef, {
      ...cleanData,
      sonGuncelleme: Timestamp.now(),
    });
  },

  // Gider sil
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'giderler', id);
    await deleteDoc(docRef);
  },
};

// Kartvizitler Collection
export const kartvizitService = {
  // Tüm kartvizitleri getir (sadece adminler için - Firestore rules kontrol eder)
  async getAll(): Promise<Kartvizit[]> {
    try {
      const q = query(collection(db, 'kartvizitler'), orderBy('olusturmaTarihi', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Kartvizit[];
    } catch (error: any) {
      // Eğer yetki hatası varsa, boş array döndür
      if (error.code === 'permission-denied') {
        console.warn('Kartvizitler okuma yetkisi yok, boş liste döndürülüyor');
        return [];
      }
      throw error;
    }
  },

  // ID ile getir
  async getById(id: string): Promise<Kartvizit | null> {
    const docSnap = await getDoc(doc(db, 'kartvizitler', id));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Kartvizit;
  },

  // Kartvizit oluştur
  async create(data: Omit<Kartvizit, 'id' | 'olusturmaTarihi'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'kartvizitler'), {
      ...data,
      olusturmaTarihi: Timestamp.now(),
      aktif: true,
    });
    return docRef.id;
  },

  // Kartvizit güncelle
  async update(id: string, data: Partial<Kartvizit>): Promise<void> {
    const docRef = doc(db, 'kartvizitler', id);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(docRef, cleanData);
  },

  // Kartvizit sil
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'kartvizitler', id);
    await deleteDoc(docRef);
  },
};

// Teşekkür Kartları Collection
export const tesekkurKartiService = {
  async getAll(): Promise<TesekkurKarti[]> {
    try {
      const q = query(collection(db, 'tesekkurKartlari'), orderBy('olusturmaTarihi', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TesekkurKarti[];
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn('Teşekkür kartları okuma yetkisi yok');
        return [];
      }
      throw error;
    }
  },

  async getById(id: string): Promise<TesekkurKarti | null> {
    const docSnap = await getDoc(doc(db, 'tesekkurKartlari', id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as TesekkurKarti;
  },

  async create(data: Omit<TesekkurKarti, 'id' | 'olusturmaTarihi'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'tesekkurKartlari'), {
      ...data,
      olusturmaTarihi: Timestamp.now(),
      aktif: true,
    });
    return docRef.id;
  },

  async update(id: string, data: Partial<TesekkurKarti>): Promise<void> {
    const docRef = doc(db, 'tesekkurKartlari', id);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(docRef, cleanData);
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'tesekkurKartlari', id);
    await deleteDoc(docRef);
  },
};

// İlanlar Collection
export const ilanService = {
  // Tüm ilanları getir
  async getAll(): Promise<Ilan[]> {
    const q = query(collection(db, 'ilanlar'), orderBy('olusturmaTarihi', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ilan[];
  },

  // Aktif ilanları getir (public için)
  async getAktifIlanlar(): Promise<Ilan[]> {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'ilanlar'),
      where('aktif', '==', true),
      where('basvuruBaslangicTarihi', '<=', now),
      where('basvuruBitisTarihi', '>=', now),
      orderBy('basvuruBitisTarihi', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ilan[];
  },

  // ID ile getir
  async getById(id: string): Promise<Ilan | null> {
    const docSnap = await getDoc(doc(db, 'ilanlar', id));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Ilan;
  },

  // İlan oluştur
  async create(data: Omit<Ilan, 'id' | 'olusturmaTarihi'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'ilanlar'), {
      ...data,
      olusturmaTarihi: Timestamp.now(),
    });
    return docRef.id;
  },

  // İlan güncelle
  async update(id: string, data: Partial<Ilan>): Promise<void> {
    const docRef = doc(db, 'ilanlar', id);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(docRef, {
      ...cleanData,
      sonGuncelleme: Timestamp.now(),
    });
  },

  // İlan sil
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'ilanlar', id);
    await deleteDoc(docRef);
  },
};

// Başvurular Collection
export const basvuruService = {
  // Tüm başvuruları getir
  async getAll(): Promise<Basvuru[]> {
    const q = query(collection(db, 'basvurular'), orderBy('basvuruTarihi', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Basvuru[];
  },

  // İlan ID'ye göre başvuruları getir
  async getByIlanId(ilanId: string): Promise<Basvuru[]> {
    const q = query(
      collection(db, 'basvurular'),
      where('ilanId', '==', ilanId),
      orderBy('basvuruTarihi', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Basvuru[];
  },

  // ID ile getir
  async getById(id: string): Promise<Basvuru | null> {
    const docSnap = await getDoc(doc(db, 'basvurular', id));
    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Basvuru;
  },

  // Başvuru oluştur
  async create(data: Omit<Basvuru, 'id' | 'basvuruTarihi'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'basvurular'), {
      ...data,
      basvuruTarihi: Timestamp.now(),
      durum: 'beklemede',
    });
    return docRef.id;
  },

  // Başvuru güncelle
  async update(id: string, data: Partial<Basvuru>): Promise<void> {
    const docRef = doc(db, 'basvurular', id);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );
    await updateDoc(docRef, {
      ...cleanData,
      guncellemeTarihi: Timestamp.now(),
    });
  },

  // Başvuru sil
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'basvurular', id);
    await deleteDoc(docRef);
  },
};


