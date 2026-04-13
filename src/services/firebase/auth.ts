import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface UserData {
  uid: string;
  email: string;
  adSoyad: string;
  rol: 'superAdmin' | 'admin' | 'diyetisyen';
}

export const authService = {
  // Google ile giriş (popup kullanarak)
  async signInWithGoogle(): Promise<UserData | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user) {
        throw new Error('Giriş başarısız oldu. Lütfen tekrar deneyin.');
      }
      
      const userData = await this.checkUserRole(user);
      
      if (!userData) {
        throw new Error('Kullanıcı bilgileri alınamadı. Lütfen tekrar deneyin.');
      }
      
      return userData;
    } catch (error: any) {
      console.error('Google giriş hatası:', error);
      
      // Popup kapatıldı hatası için özel mesaj
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Giriş penceresi kapatıldı. Lütfen tekrar deneyin.');
      }
      
      // Popup bloklandı hatası
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup penceresi tarayıcı tarafından engellendi. Lütfen popup engelleyiciyi kapatıp tekrar deneyin.');
      }
      
      throw error;
    }
  },

  // Google ile kayıt ol (onaylar ile)
  async signUpWithGoogle(
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ): Promise<UserData | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user) {
        throw new Error('Kayıt başarısız oldu. Lütfen tekrar deneyin.');
      }

      // Kullanıcı zaten var mı kontrol et
      const diyetisyenDoc = await getDoc(doc(db, 'diyetisyenler', user.uid));
      const adminDoc = await getDoc(doc(db, 'adminler', user.uid));

      // Eğer zaten kayıtlıysa normal giriş yap
      if (diyetisyenDoc.exists() || adminDoc.exists()) {
        return await this.checkUserRole(user);
      }

      // Yeni kullanıcı - diyetisyen kaydı oluştur
      const diyetisyenData = {
        email: user.email || '',
        adSoyad: user.displayName || '',
        olusturmaTarihi: Timestamp.now(),
        sonGuncelleme: Timestamp.now(),
        kayitYeri: 'web',
        mobilUygulamadanKayit: false,
        aktifDanisanSayisi: 0,
        onayDurumu: 'beklemede',
        rol: 'diyetisyen',
        // Onay bilgileri
        yasalOnaylar: {
          gizlilikPolitikasiTR: onaylar.gizlilikPolitikasiTR,
          privacyPolicyEN: onaylar.privacyPolicyEN,
          kvkk: onaylar.kvkk,
          uyelikSozlesmesi: onaylar.uyelikSozlesmesi,
          onayTarihi: Timestamp.now(),
        }
      };

      await setDoc(doc(db, 'diyetisyenler', user.uid), diyetisyenData);

      // Onay loglarını kaydet
      await this.saveOnayLoglari(
        user.uid,
        user.email || '',
        user.displayName || '',
        onaylar
      );

      return {
        uid: user.uid,
        email: user.email || '',
        adSoyad: user.displayName || '',
        rol: 'diyetisyen',
      };
    } catch (error: any) {
      console.error('Google kayıt hatası:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Kayıt penceresi kapatıldı. Lütfen tekrar deneyin.');
      }
      
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup penceresi tarayıcı tarafından engellendi. Lütfen popup engelleyiciyi kapatıp tekrar deneyin.');
      }
      
      throw error;
    }
  },


  // Email/Password ile giriş
  async signInWithEmail(email: string, password: string): Promise<UserData | null> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      return await this.checkUserRole(user);
    } catch (error: any) {
      console.error('Email giriş hatası:', error);
      throw error;
    }
  },

  // Email/Password ile kayıt ol
  async signUpWithEmail(
    email: string, 
    password: string, 
    adSoyad: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ): Promise<UserData | null> {
    try {
      // Firebase Auth ile kullanıcı oluştur
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Diyetisyen kaydı oluştur
      const diyetisyenData = {
        email: email,
        adSoyad: adSoyad,
        olusturmaTarihi: Timestamp.now(),
        sonGuncelleme: Timestamp.now(),
        kayitYeri: 'web',
        mobilUygulamadanKayit: false,
        aktifDanisanSayisi: 0,
        onayDurumu: 'beklemede',
        rol: 'diyetisyen',
        // Onay bilgileri
        yasalOnaylar: {
          gizlilikPolitikasiTR: onaylar.gizlilikPolitikasiTR,
          privacyPolicyEN: onaylar.privacyPolicyEN,
          kvkk: onaylar.kvkk,
          uyelikSozlesmesi: onaylar.uyelikSozlesmesi,
          onayTarihi: Timestamp.now(),
        }
      };

      await setDoc(doc(db, 'diyetisyenler', user.uid), diyetisyenData);

      // Onay loglarını kaydet
      await this.saveOnayLoglari(user.uid, email, adSoyad, onaylar);

      return {
        uid: user.uid,
        email: user.email || '',
        adSoyad: adSoyad,
        rol: 'diyetisyen',
      };
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      throw error;
    }
  },

  // Onay loglarını kaydet
  async saveOnayLoglari(
    userId: string,
    email: string,
    adSoyad: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ): Promise<void> {
    try {
      const logData = {
        diyetisyenId: userId,
        diyetisyenEmail: email,
        diyetisyenAdSoyad: adSoyad,
        islemTipi: 'yasal_onaylar',
        aciklama: 'Diyetisyen kayıt sırasında yasal evrakları onayladı',
        detaylar: {
          gizlilikPolitikasiTR: onaylar.gizlilikPolitikasiTR,
          privacyPolicyEN: onaylar.privacyPolicyEN,
          kvkk: onaylar.kvkk,
          uyelikSozlesmesi: onaylar.uyelikSozlesmesi,
        },
        tarih: Timestamp.now(),
        ipAdresi: await this.getClientIP(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      };

      await setDoc(doc(db, 'yasalOnayLoglari', `${userId}_${Date.now()}`), logData);
    } catch (error) {
      console.error('Onay log kayıt hatası:', error);
      // Log hatası kayıt işlemini durdurmamalı
    }
  },

  // Client IP adresini al (basit versiyon)
  async getClientIP(): Promise<string> {
    try {
      if (typeof window !== 'undefined') {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
      }
      return 'unknown';
    } catch {
      return 'unknown';
    }
  },

  // Kullanıcı rolünü kontrol et
  async checkUserRole(user: User): Promise<UserData | null> {
    try {
      // Admin kontrolü yap
      const adminDoc = await getDoc(doc(db, 'adminler', user.uid));
      
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        const isActive = adminData.status === 'approved' || 
                         adminData.aktif === true || 
                         adminData.aktif === 'true' ||
                         adminData.status === 'active';
        
        if (isActive) {
          // Son giriş tarihini güncelle
          await updateDoc(doc(db, 'adminler', user.uid), {
            updateAt: new Date(),
            sonGirisTarihi: new Date(),
          });
          
          return {
            uid: user.uid,
            email: user.email || '',
            adSoyad: adminData['Name Surname'] || adminData.adSoyad || user.displayName || '',
            rol: adminData.role || adminData.rol || 'admin',
          };
        } else {
          await this.signOutUser();
          throw new Error('Admin hesabı aktif değil. Lütfen yönetici ile iletişime geçin.');
        }
      }
      
      // Admin değilse diyetisyen kontrolü yap
      const diyetisyenDoc = await getDoc(doc(db, 'diyetisyenler', user.uid));
      
      if (diyetisyenDoc.exists()) {
        const diyetisyenData = diyetisyenDoc.data();
        
        return {
          uid: user.uid,
          email: user.email || '',
          adSoyad: diyetisyenData.adSoyad || user.displayName || '',
          rol: 'diyetisyen',
        };
      }
      
      // Ne admin ne diyetisyen
      await this.signOutUser();
      throw new Error('Bu kullanıcı için yetki bulunamadı. Lütfen yönetici ile iletişime geçin.');
    } catch (error: any) {
      console.error('Rol kontrolü hatası:', error);
      throw error;
    }
  },

  // Diyetisyenin yasal onaylarını kontrol et
  async checkYasalOnaylar(userId: string): Promise<{
    hasOnaylar: boolean;
    onaylar?: any;
  }> {
    try {
      const diyetisyenDoc = await getDoc(doc(db, 'diyetisyenler', userId));
      
      if (!diyetisyenDoc.exists()) {
        return { hasOnaylar: false };
      }

      const data = diyetisyenDoc.data();
      const yasalOnaylar = data.yasalOnaylar;

      if (!yasalOnaylar) {
        return { hasOnaylar: false };
      }

      const hasAllOnaylar =
        yasalOnaylar.gizlilikPolitikasiTR === true &&
        yasalOnaylar.privacyPolicyEN === true &&
        yasalOnaylar.kvkk === true &&
        yasalOnaylar.uyelikSozlesmesi === true;

      return {
        hasOnaylar: hasAllOnaylar,
        onaylar: yasalOnaylar,
      };
    } catch (error) {
      console.error('Yasal onay kontrolü hatası:', error);
      return { hasOnaylar: false };
    }
  },

  // Yasal onayları güncelle
  async updateYasalOnaylar(
    userId: string,
    onaylar: {
      gizlilikPolitikasiTR: boolean;
      privacyPolicyEN: boolean;
      kvkk: boolean;
      uyelikSozlesmesi: boolean;
    }
  ): Promise<void> {
    try {
      const diyetisyenDoc = await getDoc(doc(db, 'diyetisyenler', userId));
      
      if (!diyetisyenDoc.exists()) {
        throw new Error('Diyetisyen kaydı bulunamadı.');
      }

      const data = diyetisyenDoc.data();

      await updateDoc(doc(db, 'diyetisyenler', userId), {
        yasalOnaylar: {
          gizlilikPolitikasiTR: onaylar.gizlilikPolitikasiTR,
          privacyPolicyEN: onaylar.privacyPolicyEN,
          kvkk: onaylar.kvkk,
          uyelikSozlesmesi: onaylar.uyelikSozlesmesi,
          onayTarihi: Timestamp.now(),
        },
        sonGuncelleme: Timestamp.now(),
      });

      // Onay loglarını kaydet
      await this.saveOnayLoglari(
        userId,
        data.email || '',
        data.adSoyad || '',
        onaylar
      );
    } catch (error) {
      console.error('Yasal onay güncelleme hatası:', error);
      throw error;
    }
  },

  // Mevcut kullanıcıyı kontrol et
  async getCurrentUser(): Promise<UserData | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    try {
      return await this.checkUserRole(user);
    } catch (error) {
      console.error('Kullanıcı kontrolü hatası:', error);
      return null;
    }
  },

  // Çıkış
  async signOutUser(): Promise<void> {
    await signOut(auth);
  },

  // Şifre sıfırlama email'i gönder
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Şifre sıfırlama email gönderme hatası:', error);
      
      // Firebase hata kodlarına göre özel mesajlar
      if (error.code === 'auth/user-not-found') {
        throw new Error('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Geçersiz e-posta adresi.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.');
      }
      
      throw error;
    }
  },

  // Auth state değişikliğini dinle
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth.onAuthStateChanged(callback);
  },
};
