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
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, UploadResult } from 'firebase/storage';
import { db, storage } from './config';

export interface MesajDosyasi {
  url: string;
  dosyaAdi: string;
  dosyaTipi: 'image' | 'pdf' | 'other';
  dosyaBoyutu?: number; // bytes
}

export interface Mesaj {
  id?: string;
  diyetisyenId: string;
  adminId?: string;
  senderId: string;
  senderRol: 'admin' | 'diyetisyen';
  senderName: string;
  text: string;
  dosyalar?: MesajDosyasi[]; // Resim ve PDF dosyaları
  okundu: boolean;
  olusturmaTarihi: Timestamp;
}

export const mesajService = {
  // Diyetisyen için mesajları getir
  async getByDiyetisyenId(diyetisyenId: string): Promise<Mesaj[]> {
    const q = query(
      collection(db, 'mesajlar'),
      where('diyetisyenId', '==', diyetisyenId),
      orderBy('olusturmaTarihi', 'desc'),
      limit(100)
    );
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Mesaj[];
    } catch (error: any) {
      // Index yoksa, orderBy olmadan sorgu yap ve client-side'da sırala
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn('Firestore index bulunamadı, orderBy olmadan sorgu yapılıyor...');
        const q = query(
          collection(db, 'mesajlar'),
          where('diyetisyenId', '==', diyetisyenId)
        );
        const snapshot = await getDocs(q);
        const mesajlar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Mesaj[];
        
        // Client-side'da tarihe göre sırala
        return mesajlar.sort((a, b) => {
          const aTime = a.olusturmaTarihi?.toMillis() || 0;
          const bTime = b.olusturmaTarihi?.toMillis() || 0;
          return bTime - aTime; // Descending order
        });
      }
      throw error;
    }
  },

  // Dosya yükle (resim veya PDF)
  async uploadFile(
    file: File,
    diyetisyenId: string,
    mesajId: string
  ): Promise<MesajDosyasi> {
    // Dosya tipini belirle
    let dosyaTipi: 'image' | 'pdf' | 'other' = 'other';
    if (file.type.startsWith('image/')) {
      dosyaTipi = 'image';
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      dosyaTipi = 'pdf';
    }

    // Dosya boyutu kontrolü (maksimum 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
    }

    // Storage path: mesajlar/{diyetisyenId}/{mesajId}/{dosyaAdi}
    // Adminler için de aynı path kullanılır (senderId == diyetisyenId kontrolü yapılır)
    const dosyaAdi = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `mesajlar/${diyetisyenId}/${mesajId}/${dosyaAdi}`;
    const storageRef = ref(storage, storagePath);

    // Dosyayı yükle
    const uploadResult: UploadResult = await uploadBytes(storageRef, file);
    
    // Download URL'ini al
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
      url: downloadURL,
      dosyaAdi: file.name,
      dosyaTipi,
      dosyaBoyutu: file.size,
    };
  },

  // Mesaj gönder (dosyalarla birlikte)
  async sendMessage(
    diyetisyenId: string,
    senderId: string,
    senderRol: 'admin' | 'diyetisyen',
    senderName: string,
    text: string,
    adminId?: string,
    dosyalar?: File[]
  ): Promise<string> {
    // Önce mesajı oluştur (geçici ID için)
    const mesajData: Omit<Mesaj, 'id'> = {
      diyetisyenId,
      adminId: adminId || senderId,
      senderId,
      senderRol,
      senderName,
      text: text.trim(),
      okundu: false,
      olusturmaTarihi: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'mesajlar'), mesajData);
    const mesajId = docRef.id;

    // Dosyalar varsa yükle
    let yuklenenDosyalar: MesajDosyasi[] = [];
    if (dosyalar && dosyalar.length > 0) {
      try {
        yuklenenDosyalar = await Promise.all(
          dosyalar.map((file) => this.uploadFile(file, diyetisyenId, mesajId))
        );

        // Mesajı dosyalarla güncelle
        await updateDoc(docRef, {
          dosyalar: yuklenenDosyalar,
        });
      } catch (error: any) {
        console.error('Dosya yükleme hatası:', error);
        // Dosya yükleme hatası olsa bile mesaj kaydedilmiş olur
        // Kullanıcıya hata mesajı göster
        throw new Error(error.message || 'Dosya yüklenirken bir hata oluştu');
      }
    }

    return mesajId;
  },

  // Mesajları okundu olarak işaretle
  async markAsRead(mesajId: string): Promise<void> {
    const docRef = doc(db, 'mesajlar', mesajId);
    await updateDoc(docRef, { okundu: true });
  },

  // Diyetisyen için okunmamış mesaj sayısını getir
  async getUnreadCount(diyetisyenId: string): Promise<number> {
    const q = query(
      collection(db, 'mesajlar'),
      where('diyetisyenId', '==', diyetisyenId),
      where('okundu', '==', false),
      where('senderRol', '==', 'admin')
    );
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error: any) {
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        // Index yoksa, tüm mesajları çek ve client-side'da filtrele
        const allMesajlar = await this.getByDiyetisyenId(diyetisyenId);
        return allMesajlar.filter(
          (m) => !m.okundu && m.senderRol === 'admin'
        ).length;
      }
      return 0;
    }
  },

  // Real-time mesaj dinleyicisi
  subscribeToMessages(
    diyetisyenId: string,
    callback: (mesajlar: Mesaj[]) => void
  ): () => void {
    const q = query(
      collection(db, 'mesajlar'),
      where('diyetisyenId', '==', diyetisyenId),
      orderBy('olusturmaTarihi', 'desc'),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const mesajlar = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Mesaj[];
        callback(mesajlar);
      },
      (error) => {
        console.error('Mesaj dinleme hatası:', error);
        // Hata durumunda boş array gönder
        callback([]);
      }
    );
  },
};

