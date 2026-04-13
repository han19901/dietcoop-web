# DietCoop Senkronizasyon Yol Haritası

## 📋 Mobil Uygulama Yapısı Analizi

### Mevcut Durum:

**Firebase Projesi:** `dietcoop-432fa` (Mobil Uygulama)

**Collection'lar:**
- `users` - Kullanıcılar (dietitian, client, admin rolleri)
- `matches` - Eşleşmeler (dietitianId, clientId, status)
- `dietPlans` - Diyet planları
- Diğer collection'lar (mealTrackings, notifications, vb.)

**Önemli Noktalar:**
- Diyetisyen bilgileri `users` collection'ında tutuluyor
- Eşleşmeler `matches` collection'ında tutuluyor
- Aktif/pasif danışan sayısı şu anda otomatik hesaplanmıyor
- Status: `pending`, `accepted`, `rejected`, `ended`

---

## 🎯 Web Panel Yapısı

**Firebase Projesi:** `webdietcoop` (Web Panel - tahmin)

**Collection'lar:**
- `diyetisyenler` - Diyetisyen kayıtları
- `odemeler` - Ödeme kayıtları
- `ayarlar` - Genel ayarlar
- `aktiviteLoglari` - Admin aktivite logları

---

## 🚀 Uygulama Planı

### Faz 1: Mobil Uygulamada Diyetisyen Sayısı Hesaplama (Öncelikli)

**Amaç:** Mobil uygulamada aktif/pasif danışan sayılarını otomatik hesaplamak ve `users` collection'ında tutmak.

#### Adım 1.1: `users` Collection'ına Alan Ekleme

**Mobil Uygulamada:**
```typescript
// src/types/index.ts - User interface'ine ekle
export interface User {
  // ... mevcut alanlar
  aktifDanisanSayisi?: number; // Yeni alan
  pasifDanisanSayisi?: number; // Yeni alan
  sonGuncelleme?: Date; // Danışan sayısı güncelleme zamanı
}
```

#### Adım 1.2: Danışan Sayısı Hesaplama Servisi

**Mobil Uygulamada Yeni Dosya:** `src/services/firebase/dietitianStats.ts`

```typescript
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { MatchStatus } from '@/types';

export class DietitianStatsService {
  // Diyetisyenin aktif/pasif danışan sayılarını hesapla ve güncelle
  static async updateDietitianStats(dietitianId: string): Promise<void> {
    try {
      // Aktif eşleşmeleri say (ACCEPTED status)
      const activeMatchesQuery = query(
        collection(db, 'matches'),
        where('dietitianId', '==', dietitianId),
        where('status', '==', MatchStatus.ACCEPTED)
      );
      const activeSnapshot = await getDocs(activeMatchesQuery);
      const aktifDanisanSayisi = activeSnapshot.size;

      // Pasif eşleşmeleri say (ENDED status)
      const endedMatchesQuery = query(
        collection(db, 'matches'),
        where('dietitianId', '==', dietitianId),
        where('status', '==', MatchStatus.ENDED)
      );
      const endedSnapshot = await getDocs(endedMatchesQuery);
      const pasifDanisanSayisi = endedSnapshot.size;

      // users collection'ında güncelle
      await updateDoc(doc(db, 'users', dietitianId), {
        aktifDanisanSayisi,
        pasifDanisanSayisi,
        sonGuncelleme: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Danışan sayısı güncelleme hatası:', error);
      throw new Error(error.message || 'Danışan sayısı güncellenemedi');
    }
  }

  // Eşleşme değiştiğinde otomatik güncelleme
  static async onMatchChange(dietitianId: string): Promise<void> {
    await this.updateDietitianStats(dietitianId);
  }
}
```

#### Adım 1.3: Match Service'e Entegrasyon

**Mobil Uygulamada:** `src/services/firebase/match.ts` dosyasını güncelle

Her eşleşme işleminden sonra danışan sayısını güncelle:

```typescript
// acceptMatch, rejectMatch, endMatch fonksiyonlarına ekle
import { DietitianStatsService } from './dietitianStats';

// Örnek: acceptMatch fonksiyonuna ekle
static async acceptMatch(matchId: string): Promise<void> {
  try {
    // Match dokümanını al
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    const matchData = matchDoc.data();
    
    await updateDoc(doc(db, 'matches', matchId), {
      status: MatchStatus.ACCEPTED,
      respondedAt: serverTimestamp(),
    });
    
    // Danışan sayısını güncelle
    if (matchData?.dietitianId) {
      await DietitianStatsService.updateDietitianStats(matchData.dietitianId);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Eşleşme kabul edilemedi');
  }
}
```

#### Adım 1.4: Cloud Function ile Otomatik Güncelleme (Opsiyonel)

**Mobil Uygulama Projesinde:** `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Match değiştiğinde diyetisyen istatistiklerini güncelle
export const updateDietitianStatsOnMatchChange = functions.firestore
  .document('matches/{matchId}')
  .onWrite(async (change, context) => {
    const matchData = change.after.exists ? change.after.data() : null;
    
    if (matchData?.dietitianId) {
      const dietitianId = matchData.dietitianId;
      const db = admin.firestore();
      
      // Aktif eşleşmeleri say
      const activeMatches = await db.collection('matches')
        .where('dietitianId', '==', dietitianId)
        .where('status', '==', 'accepted')
        .get();
      
      // Pasif eşleşmeleri say
      const endedMatches = await db.collection('matches')
        .where('dietitianId', '==', dietitianId)
        .where('status', '==', 'ended')
        .get();
      
      // users collection'ında güncelle
      await db.collection('users').doc(dietitianId).update({
        aktifDanisanSayisi: activeMatches.size,
        pasifDanisanSayisi: endedMatches.size,
        sonGuncelleme: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
```

---

### Faz 2: Web Panelde Service Account Kurulumu

**Amaç:** Web panelin mobil uygulama Firebase projesinden veri okumasını sağlamak.

#### Adım 2.1: Service Account Oluşturma

**Mobil Uygulama Firebase Projesinde (`dietcoop-432fa`):**
1. Firebase Console → Project Settings → Service Accounts
2. "Generate New Private Key" tıkla
3. JSON dosyasını indir → `web-panel-service-account.json` olarak kaydet
4. **ÖNEMLİ:** `.gitignore`'a ekle!

#### Adım 2.2: Web Panelde Service Account Entegrasyonu

**Web Panelde Yeni Dosya:** `src/services/firebase/mobileAppService.ts`

```typescript
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let mobileApp: App | null = null;
let mobileAppDb: Firestore | null = null;

// Mobil uygulama Firebase projesine bağlan
const initMobileAppConnection = () => {
  if (!mobileApp) {
    const serviceAccount = require('../../web-panel-service-account.json');
    
    mobileApp = initializeApp({
      credential: cert(serviceAccount),
      databaseURL: 'https://dietcoop-432fa.firebaseio.com'
    }, 'mobileApp');
    
    mobileAppDb = getFirestore(mobileApp);
  }
  
  return mobileAppDb!;
};

export const mobileAppService = {
  // Diyetisyen bilgilerini mobil uygulamadan oku
  async getDiyetisyen(diyetisyenId: string) {
    const db = initMobileAppConnection();
    const doc = await db.collection('users').doc(diyetisyenId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      email: data?.email,
      name: data?.name,
      surname: data?.surname,
      aktifDanisanSayisi: data?.aktifDanisanSayisi || 0,
      pasifDanisanSayisi: data?.pasifDanisanSayisi || 0,
      // ... diğer gerekli alanlar
    };
  },
  
  // Aktif danışan sayısını mobil uygulamadan oku
  async getAktifDanisanSayisi(diyetisyenId: string): Promise<number> {
    const diyetisyen = await this.getDiyetisyen(diyetisyenId);
    return diyetisyen?.aktifDanisanSayisi || 0;
  },
  
  // Pasif danışan sayısını mobil uygulamadan oku
  async getPasifDanisanSayisi(diyetisyenId: string): Promise<number> {
    const diyetisyen = await this.getDiyetisyen(diyetisyenId);
    return diyetisyen?.pasifDanisanSayisi || 0;
  }
};
```

#### Adım 2.3: Web Panelde Diyetisyen Servisini Güncelleme

**Web Panelde:** `src/services/firebase/firestore.ts` - `diyetisyenService` güncelle

```typescript
import { mobileAppService } from './mobileAppService';

export const diyetisyenService = {
  // ... mevcut fonksiyonlar
  
  async getById(id: string): Promise<Diyetisyen | null> {
    // Önce kendi collection'ından oku
    const doc = await getDoc(doc(db, 'diyetisyenler', id));
    
    if (!doc.exists()) {
      return null;
    }
    
    const data = doc.data();
    
    // Mobil uygulamadan aktif/pasif danışan sayılarını oku
    const aktifSayisi = await mobileAppService.getAktifDanisanSayisi(id);
    const pasifSayisi = await mobileAppService.getPasifDanisanSayisi(id);
    
    return {
      id: doc.id,
      ...data,
      aktifDanisanSayisi: aktifSayisi, // Mobil uygulamadan
      pasifDanisanSayisi: pasifSayisi, // Mobil uygulamadan
    } as Diyetisyen;
  }
};
```

---

### Faz 3: Mobil Uygulamadan Web Panele Senkronizasyon

**Amaç:** Mobil uygulamada diyetisyen kaydı oluşturulduğunda/güncellendiğinde web panelde de görünmesini sağlamak.

#### Adım 3.1: Web Panel Service Account Oluşturma

**Web Panel Firebase Projesinde:**
1. Firebase Console → Project Settings → Service Accounts
2. "Generate New Private Key" tıkla
3. JSON dosyasını indir → `mobile-app-service-account.json` olarak kaydet
4. **ÖNEMLİ:** `.gitignore`'a ekle!

#### Adım 3.2: Mobil Uygulamada Cloud Function

**Mobil Uygulama Projesinde:** `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Web panel service account
const webPanelServiceAccount = require('./web-panel-service-account.json');
const webPanelApp = admin.initializeApp({
  credential: admin.credential.cert(webPanelServiceAccount),
  databaseURL: 'https://webdietcoop.firebaseio.com' // Web panel projesi
}, 'webPanel');

// Diyetisyen (users collection) değiştiğinde web panele senkronize et
export const syncDietitianToWebPanel = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userData = change.after.exists ? change.after.data() : null;
    const userId = context.params.userId;
    
    // Sadece diyetisyenleri senkronize et
    if (userData?.role !== 'dietitian') {
      return;
    }
    
    const webPanelDb = webPanelApp.firestore();
    
    try {
      if (userData) {
        const syncData = {
          id: userId,
          email: userData.email,
          adSoyad: `${userData.name} ${userData.surname}`,
          telefon: userData.phone || '',
          aktifDanisanSayisi: userData.aktifDanisanSayisi || 0,
          pasifDanisanSayisi: userData.pasifDanisanSayisi || 0,
          olusturmaTarihi: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
          kayitYeri: 'mobil',
          mobilUygulamadanKayit: true,
          onayDurumu: userData.status === 'approved' ? 'onaylandi' : 'beklemede',
        };
        
        await webPanelDb.collection('diyetisyenler')
          .doc(userId)
          .set(syncData, { merge: true });
          
        console.log(`Diyetisyen ${userId} web panele senkronize edildi`);
      }
    } catch (error) {
      console.error('Senkronizasyon hatası:', error);
      throw error;
    }
  });
```

---

### Faz 4: Web Panelden Mobil Uygulamaya Senkronizasyon

**Amaç:** Web panelde diyetisyen eklendiğinde/güncellendiğinde mobil uygulamada da görünmesini sağlamak.

#### Adım 4.1: Web Panelde Cloud Function

**Web Panel Projesinde:** `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Mobil uygulama service account
const mobileAppServiceAccount = require('./mobile-app-service-account.json');
const mobileAppApp = admin.initializeApp({
  credential: admin.credential.cert(mobileAppServiceAccount),
  databaseURL: 'https://dietcoop-432fa.firebaseio.com'
}, 'mobileApp');

// Diyetisyen değiştiğinde mobil uygulamaya senkronize et
export const syncDiyetisyenToMobileApp = functions.firestore
  .document('diyetisyenler/{diyetisyenId}')
  .onWrite(async (change, context) => {
    const diyetisyenData = change.after.exists ? change.after.data() : null;
    const diyetisyenId = context.params.diyetisyenId;
    
    // Kendi yazdığı kaydı tekrar senkronize etme (sonsuz döngü önleme)
    if (diyetisyenData?.kayitYeri === 'mobil') {
      return;
    }
    
    const mobileAppDb = mobileAppApp.firestore();
    
    try {
      if (diyetisyenData) {
        // Ad soyadı ayır
        const [name, ...surnameParts] = (diyetisyenData.adSoyad || '').split(' ');
        const surname = surnameParts.join(' ') || '';
        
        const syncData = {
          email: diyetisyenData.email,
          name: name || '',
          surname: surname,
          phone: diyetisyenData.telefon || '',
          role: 'dietitian',
          status: diyetisyenData.onayDurumu === 'onaylandi' ? 'approved' : 'pending',
          aktifDanisanSayisi: diyetisyenData.aktifDanisanSayisi || 0,
          pasifDanisanSayisi: diyetisyenData.pasifDanisanSayisi || 0,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        await mobileAppDb.collection('users')
          .doc(diyetisyenId)
          .set(syncData, { merge: true });
          
        console.log(`Diyetisyen ${diyetisyenId} mobil uygulamaya senkronize edildi`);
      }
    } catch (error) {
      console.error('Senkronizasyon hatası:', error);
      throw error;
    }
  });
```

---

### Faz 5: Ödeme Hesaplama Güncelleme

**Amaç:** Ödeme oluştururken aktif danışan sayısını mobil uygulamadan okumak.

#### Adım 5.1: Ödeme Servisini Güncelleme

**Web Panelde:** `src/services/firebase/firestore.ts` - `odemeService` güncelle

```typescript
import { mobileAppService } from './mobileAppService';

export const odemeService = {
  // ... mevcut fonksiyonlar
  
  async create(data: Omit<Odeme, 'id'>): Promise<string> {
    // Mobil uygulamadan aktif danışan sayısını oku
    const aktifDanisanSayisi = await mobileAppService.getAktifDanisanSayisi(data.diyetisyenId);
    
    // Ücret hesapla (aktif danışan sayısına göre)
    const diyetisyen = await diyetisyenService.getById(data.diyetisyenId);
    const danisanBasiUcret = diyetisyen?.danisanBasiUcret || 199;
    const iskontoOrani = diyetisyen?.iskontoOrani || 0;
    
    const tutar = aktifDanisanSayisi * danisanBasiUcret;
    const iskontoTutari = tutar * (iskontoOrani / 100);
    const kdvTutari = (tutar - iskontoTutari) * 0.20;
    const toplamTutar = tutar - iskontoTutari + kdvTutari;
    
    const odemeData = {
      ...data,
      danisanSayisi: aktifDanisanSayisi, // Mobil uygulamadan
      tutar: tutar - iskontoTutari,
      kdvOrani: 20,
      toplamTutar,
      olusturmaTarihi: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'odemeler'), odemeData);
    return docRef.id;
  }
};
```

---

## 📋 Kontrol Listesi

### Mobil Uygulama Tarafında:

- [ ] `users` collection'ına `aktifDanisanSayisi` ve `pasifDanisanSayisi` alanları eklendi
- [ ] `DietitianStatsService` oluşturuldu
- [ ] `MatchService` güncellendi (her eşleşme işleminden sonra sayıları güncelle)
- [ ] Cloud Function oluşturuldu (otomatik güncelleme için)
- [ ] Test edildi (eşleşme oluşturulduğunda sayılar güncelleniyor mu?)

### Web Panel Tarafında:

- [ ] Service account oluşturuldu (mobil uygulama projesi için)
- [ ] `mobileAppService` oluşturuldu
- [ ] `diyetisyenService.getById` güncellendi (mobil uygulamadan okuma)
- [ ] `odemeService.create` güncellendi (aktif danışan sayısını mobil uygulamadan okuma)
- [ ] Cloud Function oluşturuldu (mobil uygulamaya senkronizasyon)
- [ ] Test edildi (mobil uygulamadan veri okunuyor mu?)

### Ortak:

- [ ] Service account dosyaları `.gitignore`'a eklendi
- [ ] Environment variables ayarlandı
- [ ] İlk senkronizasyon yapıldı (mevcut kayıtlar)
- [ ] Hata yönetimi eklendi
- [ ] Logging eklendi

---

## 🚨 Önemli Notlar

1. **Collection İsimleri:**
   - Mobil uygulama: `users` (dietitian bilgileri burada)
   - Web panel: `diyetisyenler` (dietitian bilgileri burada)
   - Senkronizasyon sırasında field mapping yapılmalı

2. **Field Mapping:**
   - Mobil: `name` + `surname` → Web: `adSoyad`
   - Mobil: `role: 'dietitian'` → Web: `kayitYeri: 'mobil'`
   - Mobil: `status: 'approved'` → Web: `onayDurumu: 'onaylandi'`

3. **Sonsuz Döngü Önleme:**
   - Web panelden yazılan kayıt `kayitYeri: 'web'` olmalı
   - Mobil uygulamadan yazılan kayıt `kayitYeri: 'mobil'` olmalı
   - Cloud Function'da kontrol yapılmalı

4. **İlk Senkronizasyon:**
   - Mevcut kayıtları senkronize etmek için one-time script gerekir
   - Her iki tarafta da mevcut kayıtlar kontrol edilmeli

---

**Son Güncelleme:** 2025-12-19
**Versiyon:** 1.0.0
**Durum:** Uygulama Bekliyor ⏳












