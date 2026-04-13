# DietCoop Kayıt Senkronizasyon Mimarisi

## 📋 Genel Bakış

Bu doküman, DietCoop mobil uygulama ve web admin paneli arasındaki kayıt senkronizasyon mimarisini, veri paylaşımını ve kontrol mekanizmalarını detaylandırır.

---

## 🎯 Amaç

1. **Ortak Veri Havuzu:** Her iki platform da aynı Firestore collection'ını kullanacak
2. **Çift Yönlü Senkronizasyon:** Mobil uygulamadan kayıt → Web panelde görünür, Web panelden kayıt → Mobil uygulamada görünür
3. **Veri Gizliliği:** Ödeme ve evrak bilgileri mobil uygulamada görünmeyecek
4. **Anlık Danışan Sayısı:** Mobil uygulamadan aktif/pasif danışan sayıları çekilecek
5. **Otomatik Ücretlendirme:** Aktif danışan sayısına göre otomatik ücret hesaplama
6. **Kullanım Kısıtlaması:** Ödeme yapılmazsa belirli kısıtlamalar uygulanacak

---

## 🏗️ Sistem Mimarisi

### 1. Ortak Veri Yapısı

#### 1.1. Firestore Collection: `diyetisyenler`

**Ortak Kullanım:** Hem mobil uygulama hem web panel bu collection'ı kullanacak.

```typescript
interface Diyetisyen {
  // Temel Bilgiler (Her iki tarafta görünür)
  id: string; // Firebase Auth UID
  email: string;
  adSoyad: string;
  telefon?: string;
  uyeNumarasi: string; // Unique, otomatik oluşturulacak
  profilFotografi?: string;
  olusturmaTarihi: Timestamp;
  sonGuncelleme: Timestamp;
  
  // Kayıt Bilgisi
  kayitYeri: 'mobil' | 'web'; // Hangi platformdan kayıt olduğu
  mobilUygulamadanKayit: boolean;
  
  // Mobil Uygulamada Görünen Alanlar
  aktifDanisanSayisi: number; // Mobil uygulamadan güncellenecek
  pasifDanisanSayisi?: number; // Mobil uygulamadan güncellenecek
  
  // Deneme Süresi (Her iki tarafta görünür)
  denemeSuresi: {
    aktif: boolean;
    baslangicTarihi?: Timestamp;
    bitisTarihi?: Timestamp;
    gunSayisi: 7 | 15 | 30;
  };
  
  // API Kontrolü (Her iki tarafta görünür)
  apiErisimDurumu: 'aktif' | 'kisitli' | 'kapali';
  kisitlamaNedeni?: string;
  
  // Web Panelde Görünen Alanlar (Mobil uygulamada GİZLİ)
  // ⚠️ Bu alanlar mobil uygulamada görünmeyecek:
  odemeDurumu?: 'aktif' | 'beklemede' | 'suresiDolmus' | 'deneme';
  sonOdemeTarihi?: Timestamp;
  birSonrakiOdemeTarihi?: Timestamp;
  aktiflikDurumu?: 'aktif' | 'pasif' | 'askiyaAlindi';
  paketHakki?: number; // Satın alınan paket hakkı
  danisanBasiUcret?: number;
  iskontoOrani?: number;
  onayDurumu?: 'beklemede' | 'onaylandi' | 'reddedildi';
  evrakDurumu?: 'beklemede' | 'yuklendi' | 'onaylandi' | 'reddedildi';
  evrakIstemeTarihi?: Timestamp;
  onayTarihi?: Timestamp;
  onaylayanAdmin?: string;
}
```

---

## 🔄 Senkronizasyon Akışları

### 2.1. Mobil Uygulamadan Kayıt

#### Akış:
1. **Mobil Uygulama:** Diyetisyen Firebase Authentication ile kayıt olur
2. **Cloud Function / Trigger:** Otomatik olarak `diyetisyenler` collection'ına kayıt oluşturulur:
   ```typescript
   {
     id: firebaseAuth.uid,
     email: user.email,
     adSoyad: user.displayName || formData.adSoyad,
     telefon: formData.telefon,
     uyeNumarasi: generateUniqueUyeNumarasi(), // Otomatik oluşturulacak
     kayitYeri: 'mobil',
     mobilUygulamadanKayit: true,
     olusturmaTarihi: Timestamp.now(),
     sonGuncelleme: Timestamp.now(),
     aktifDanisanSayisi: 0,
     denemeSuresi: {
       aktif: true,
       baslangicTarihi: Timestamp.now(),
       bitisTarihi: Timestamp.fromDate(addDays(now, 15)),
       gunSayisi: 15
     },
     apiErisimDurumu: 'aktif',
     onayDurumu: 'beklemede' // Web panelde admin onayı bekler
   }
   ```

3. **Web Panel:** 
   - Real-time listener ile yeni kayıt görünür
   - Admin onayı bekler
   - Onaylandıktan sonra deneme süresi başlar

---

### 2.2. Web Panelden Kayıt

#### Akış:
1. **Web Panel:** Admin diyetisyen ekler
2. **Firebase Auth:** Email/Password ile hesap oluşturulur (veya Google ile)
3. **Firestore:** `diyetisyenler` collection'ına kayıt oluşturulur:
   ```typescript
   {
     id: firebaseAuth.uid,
     email: formData.email,
     adSoyad: formData.adSoyad,
     telefon: formData.telefon,
     uyeNumarasi: generateUniqueUyeNumarasi(),
     kayitYeri: 'web',
     mobilUygulamadanKayit: false,
     olusturmaTarihi: Timestamp.now(),
     sonGuncelleme: Timestamp.now(),
     aktifDanisanSayisi: 0,
     denemeSuresi: {
       aktif: false,
       gunSayisi: 15
     },
     apiErisimDurumu: 'aktif',
     onayDurumu: 'onaylandi', // Web panelden eklenen direkt onaylı
     onayTarihi: Timestamp.now(),
     onaylayanAdmin: adminId
   }
   ```

4. **Mobil Uygulama:**
   - Diyetisyen mobil uygulamaya giriş yapabilir
   - Sadece görünmesi gereken alanları görür (ödeme bilgileri gizli)

---

## 📊 Danışan Sayısı Güncelleme

### 3.1. Mobil Uygulamadan Güncelleme

#### Akış:
1. **Mobil Uygulama:** Diyetisyen danışan ekler/çıkarır
2. **Firestore Update:** `diyetisyenler` collection'ında `aktifDanisanSayisi` güncellenir:
   ```typescript
   // Mobil uygulamada danışan eklendiğinde
   await updateDoc(doc(db, 'diyetisyenler', diyetisyenId), {
     aktifDanisanSayisi: yeniAktifSayisi,
     sonGuncelleme: Timestamp.now()
   });
   ```

3. **Web Panel:**
   - Real-time listener ile anlık güncelleme alır
   - Otomatik ücret hesaplama tetiklenir (gerekirse)

---

### 3.2. Web Panelden Okuma

#### Akış:
1. **Web Panel:** Diyetisyen detay sayfası açıldığında
2. **Firestore Read:** `diyetisyenler` collection'ından okur:
   ```typescript
   const diyetisyen = await getDoc(doc(db, 'diyetisyenler', diyetisyenId));
   const aktifDanisanSayisi = diyetisyen.data().aktifDanisanSayisi;
   ```

3. **Ücret Hesaplama:**
   ```typescript
   const tutar = aktifDanisanSayisi * danisanBasiUcret;
   const iskontoTutari = tutar * (iskontoOrani / 100);
   const kdvTutari = (tutar - iskontoTutari) * 0.20;
   const toplamTutar = tutar - iskontoTutari + kdvTutari;
   ```

---

## 🔒 Veri Gizliliği ve Güvenlik

### 4.1. Firestore Security Rules

#### Mobil Uygulama İçin:
```javascript
match /diyetisyenler/{diyetisyenId} {
  // Diyetisyen sadece kendi kaydını okuyabilir
  allow read: if request.auth != null && request.auth.uid == diyetisyenId;
  
  // Diyetisyen sadece belirli alanları güncelleyebilir
  allow update: if request.auth != null && 
                 request.auth.uid == diyetisyenId &&
                 // Sadece bu alanlar güncellenebilir
                 !request.resource.data.diff(resource.data).affectedKeys()
                   .hasAny(['odemeDurumu', 'paketHakki', 'onayDurumu', 'evrakDurumu']);
  
  // Yeni kayıt oluşturulamaz (sadece Cloud Function)
  allow create: if false;
}
```

#### Web Panel İçin:
```javascript
match /diyetisyenler/{diyetisyenId} {
  // Admin tüm kayıtları okuyabilir
  allow read: if isAdmin();
  
  // Admin tüm alanları güncelleyebilir
  allow update: if isAdmin();
  
  // Admin yeni kayıt oluşturabilir
  allow create: if isAdmin();
}

function isAdmin() {
  return request.auth != null && 
         exists(/databases/$(database)/documents/adminler/$(request.auth.uid));
}
```

---

### 4.2. Mobil Uygulamada Veri Filtreleme

#### Okuma Sırasında:
```typescript
// Mobil uygulamada diyetisyen bilgilerini okurken
const getDiyetisyenForMobile = async (diyetisyenId: string) => {
  const doc = await getDoc(doc(db, 'diyetisyenler', diyetisyenId));
  const data = doc.data();
  
  // Hassas bilgileri kaldır
  const {
    odemeDurumu,
    sonOdemeTarihi,
    birSonrakiOdemeTarihi,
    aktiflikDurumu,
    paketHakki,
    danisanBasiUcret,
    iskontoOrani,
    onayDurumu,
    evrakDurumu,
    evrakIstemeTarihi,
    onayTarihi,
    onaylayanAdmin,
    ...publicData
  } = data;
  
  return publicData;
};
```

---

## 💰 DietCoop Ödeme Modeli ve Uyarı Metinleri

### 5.1. Deneme Süresi

**Kurallar:**
- Diyetisyen sınırsız eşleşme isteği gönderebilir
- Deneme bitince sistem aktif danışan sayısını kontrol eder
- Eğer ödeme yapılmamışsa girişte uyarı mesajı çıkar

**Uyarı Mesajı:**
```
"DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin."
```

**Akış:**
```typescript
// Deneme süresi bitişi kontrolü
if (denemeSuresi.bitisTarihi < now && paketHakki === 0) {
  // Bekleme durumuna geç
  apiErisimDurumu = 'kisitli';
  odemeDurumu = 'beklemede';
  
  // Mobil uygulamada overlay göster
  showOverlay("DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin.");
}
```

---

### 5.2. Paket Satın Alma

**Kurallar:**
- Diyetisyen belirli bir danışan sayısı için paket alır (ör. 10 kişi)
- Sistem bu paketi `paketHakki` olarak tanımlar
- Paket hakkı ödeme onayı sonrası güncellenir

**Akış:**
```typescript
// Ödeme onayı sonrası
await diyetisyenService.update(diyetisyenId, {
  paketHakki: odeme.danisanSayisi, // Örnek: 10
  odemeDurumu: 'aktif',
  apiErisimDurumu: 'aktif'
});
```

---

### 5.3. Limit Kontrolü

**Kurallar:**
- Diyetisyen yeni eşleşme isteği gönderdiğinde sistem kontrol eder:
  - **Aktif danışan ≤ paket hakkı** → Eşleşme kabul edilir
  - **Aktif danışan > paket hakkı** → Fazla danışanlar bekleme kuyruğuna alınır

**Kontrol Mantığı:**
```typescript
const checkLimit = async (diyetisyenId: string) => {
  const diyetisyen = await getDiyetisyen(diyetisyenId);
  
  // Deneme süresi aktifse sınırsız
  if (diyetisyen.denemeSuresi?.aktif) {
    return { allowed: true, reason: 'deneme_suresi' };
  }
  
  const aktifDanisanSayisi = diyetisyen.aktifDanisanSayisi || 0;
  const paketHakki = diyetisyen.paketHakki || 0;
  
  if (aktifDanisanSayisi < paketHakki) {
    // Paket hakkı içinde - kabul et
    return { allowed: true, reason: 'paket_hakki_icinde' };
  } else {
    // Limit aşıldı - bekleme kuyruğuna ekle
    return {
      allowed: false,
      reason: 'limit_asildi',
      message: "Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz."
    };
  }
};
```

---

### 5.4. Bekleme Kuyruğu

**Kurallar:**
- Fazla danışanlar sistemde "beklemede" statüsünde kalır
- Diyetisyen onları görebilir ancak diyet planı tanımlayamaz
- Uyarı mesajı çıkar

**Uyarı Mesajı:**
```
"Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz."
```

**Mobil Uygulamada Gösterim:**
```typescript
// Beklemedeki danışanlar listesi
const bekleyenDanisanlar = await getBekleyenDanisanlar(diyetisyenId);

// Her birinde uyarı göster
bekleyenDanisanlar.forEach(danisan => {
  showWarning(danisan.id, "Beklemede - Hesabınızı güncelleyerek aktif hale getirebilirsiniz.");
  
  // Diyet planı tanımlama butonu disabled
  disableDietPlanButton(danisan.id);
});
```

---

### 5.5. Paket Yükseltme

**Kurallar:**
- Diyetisyen ödeme yaparak paketini yükseltirse:
  - Beklemedeki danışanlar otomatik aktifleşir
  - Yeni eşleşme talepleri kabul edilir

**Akış:**
```typescript
// Ödeme onayı sonrası
const yeniPaketHakki = odeme.danisanSayisi; // Örnek: 15 (10'dan 15'e yükseldi)
const aktifSayisi = diyetisyen.aktifDanisanSayisi; // Örnek: 10

// Beklemedeki danışanları aktifleştir
const bekleyenler = await getBekleyenDanisanlar(diyetisyenId);
const aktiflestirilecekSayi = Math.min(
  bekleyenler.length,
  yeniPaketHakki - aktifSayisi // 15 - 10 = 5 kişi aktifleşir
);

for (let i = 0; i < aktiflestirilecekSayi; i++) {
  await updateDanisanDurumu(bekleyenler[i].id, 'aktif');
}

// Paket hakkını güncelle
await diyetisyenService.update(diyetisyenId, {
  paketHakki: yeniPaketHakki,
  odemeDurumu: 'aktif',
  apiErisimDurumu: 'aktif'
});
```

---

### 5.6. Ödeme Yapılmadığında

**Kurallar:**
- Sistem arka planda aktif danışanların planlarını çalıştırmaya devam eder (danışan mağdur olmaz)
- Diyetisyen uygulamaya giriş yaptığında ana ekranda kapatılamayan bir uyarı overlay çıkar
- Web tarafında da aynı şekilde uyarı gösterilir

**Mobil Uygulama Uyarı Mesajı:**
```
"DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin."
```

**Web Panel Uyarı Mesajı:**
```
"DietCoop Diyetisyen Hesabınız Bekleme Durumundadır. Lütfen hesabınızı güncelleyerek devam edin."
```

**Mobil Uygulamada Overlay:**
```typescript
// Ana ekranda sürekli kontrol
useEffect(() => {
  const checkStatus = async () => {
    const diyetisyen = await getDiyetisyen(diyetisyenId);
    
    // Ödeme durumu beklemede ve aktif danışan varsa
    if (diyetisyen.apiErisimDurumu === 'kisitli' && 
        diyetisyen.aktifDanisanSayisi > 0) {
      // Kapatılamayan overlay göster
      showOverlay({
        title: "DietCoop hesabınız bekleme durumunda",
        message: "Lütfen hesabınızı güncelleyerek devam edin.",
        closable: false, // Kapatılamaz
        persistent: true // Sürekli görünür
      });
    }
  };
  
  checkStatus();
  const interval = setInterval(checkStatus, 60000); // Her 1 dakikada kontrol
  
  return () => clearInterval(interval);
}, []);
```

**Web Panelde Uyarı:**
```typescript
// Diyetisyen giriş yaptığında kontrol
if (diyetisyen.apiErisimDurumu === 'kisitli' && 
    diyetisyen.aktifDanisanSayisi > 0) {
  // Banner göster
  showBanner({
    type: 'warning',
    message: "DietCoop Diyetisyen Hesabınız Bekleme Durumundadır. Lütfen hesabınızı güncelleyerek devam edin.",
    persistent: true
  });
}
```

**Önemli Not:**
- Aktif danışanların diyet planları çalışmaya devam eder
- Sadece yeni eşleşme istekleri engellenir
- Diyetisyen mevcut danışanlarına hizmet vermeye devam edebilir

---

## 💰 Otomatik Ücretlendirme

### 5.7. Aktif Danışan Sayısına Göre Hesaplama

#### Web Panel Tarafı:

**Ödeme Oluşturma:**
```typescript
const createPaymentFromActivePatients = async (diyetisyenId: string) => {
  // 1. Diyetisyen bilgilerini al
  const diyetisyen = await getDoc(doc(db, 'diyetisyenler', diyetisyenId));
  const diyetisyenData = diyetisyen.data();
  
  // 2. Aktif danışan sayısını al (mobil uygulamadan güncellenmiş)
  const aktifDanisanSayisi = diyetisyenData.aktifDanisanSayisi || 0;
  
  // 3. Ücret hesapla
  const danisanBasiUcret = diyetisyenData.danisanBasiUcret || 199;
  const iskontoOrani = diyetisyenData.iskontoOrani || 0;
  
  const tutar = aktifDanisanSayisi * danisanBasiUcret;
  const iskontoTutari = tutar * (iskontoOrani / 100);
  const kdvTutari = (tutar - iskontoTutari) * 0.20;
  const toplamTutar = tutar - iskontoTutari + kdvTutari;
  
  // 4. Ödeme kaydı oluştur
  await addDoc(collection(db, 'odemeler'), {
    diyetisyenId: diyetisyenId,
    diyetisyenEmail: diyetisyenData.email,
    diyetisyenAdSoyad: diyetisyenData.adSoyad,
    uyeNumarasi: diyetisyenData.uyeNumarasi,
    tutar: tutar - iskontoTutari,
    kdvOrani: 20,
    toplamTutar: toplamTutar,
    danisanSayisi: aktifDanisanSayisi,
    odemeYontemi: 'bankaHavalesi',
    odemeDurumu: 'beklemede',
    donemBaslangic: Timestamp.now(),
    donemBitis: Timestamp.fromDate(addDays(now, 30)),
    gunSayisi: 30,
    olusturmaTarihi: Timestamp.now()
  });
};
```

---

## 🚫 Kullanım Kısıtlamaları

### 6.1. Ödeme Yapılmadığında

#### Mobil Uygulamada Kontrol:

**Giriş Kontrolü:**
```typescript
const checkDiyetisyenAccess = async (diyetisyenId: string) => {
  const diyetisyen = await getDoc(doc(db, 'diyetisyenler', diyetisyenId));
  const data = diyetisyen.data();
  
  // Deneme süresi kontrolü
  if (data.denemeSuresi?.aktif) {
    return { allowed: true, reason: 'deneme_suresi' };
  }
  
  // API erişim durumu kontrolü
  if (data.apiErisimDurumu === 'kapali') {
    return { 
      allowed: false, 
      reason: 'hesap_kapali',
      message: 'DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin.'
    };
  }
  
  if (data.apiErisimDurumu === 'kisitli') {
    return { 
      allowed: true, 
      reason: 'kisitli_erisim',
      message: 'DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin.'
    };
  }
  
  return { allowed: true, reason: 'aktif' };
};
```

**Ana Ekran Overlay:**
```typescript
// Ödeme durumu beklemede ve aktif danışan varsa
if (apiErisimDurumu === 'kisitli' && aktifDanisanSayisi > 0) {
  // Kapatılamayan overlay göster
  showOverlay({
    title: "DietCoop hesabınız bekleme durumunda",
    message: "Lütfen hesabınızı güncelleyerek devam edin.",
    closable: false
  });
}
```

**Eşleşme İsteği Kontrolü:**
```typescript
const canSendMatchRequest = async (diyetisyenId: string) => {
  const diyetisyen = await getDoc(doc(db, 'diyetisyenler', diyetisyenId));
  const data = diyetisyen.data();
  
  // Deneme süresi aktifse sınırsız
  if (data.denemeSuresi?.aktif) {
    return { allowed: true };
  }
  
  // Paket hakkı kontrolü
  const paketHakki = data.paketHakki || 0;
  const aktifDanisanSayisi = data.aktifDanisanSayisi || 0;
  
  if (aktifDanisanSayisi >= paketHakki) {
    return {
      allowed: false,
      message: "Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz."
    };
  }
  
  return { allowed: true };
};
```

---

## 🔌 API Yapısı

### 7.1. Mobil Uygulama → Web Panel

#### Gerekli Değil:
- Mobil uygulama direkt Firestore kullanacak
- API endpoint'e gerek yok
- Real-time listener'lar kullanılacak

---

### 7.2. Web Panel → Mobil Uygulama

#### Push Notifications (FCM):

**Ödeme Onaylandı:**
```typescript
await sendNotification(diyetisyenId, {
  title: "Ödeme Onaylandı",
  body: "Hesabınız aktif edildi.",
  data: {
    type: "odeme_onaylandi",
    paketHakki: yeniPaketHakki
  }
});
```

**Deneme Süresi Bitti:**
```typescript
await sendNotification(diyetisyenId, {
  title: "Deneme Süresi Bitti",
  body: "DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin.",
  data: {
    type: "deneme_suresi_bitti"
  }
});
```

---

## 📋 Kontrol Listesi

### Mobil Uygulama Tarafında Yapılacaklar

#### Kayıt Sistemi:
- [ ] Firebase Authentication entegrasyonu kontrol edilecek
- [ ] Kayıt olduğunda `diyetisyenler` collection'ına otomatik kayıt oluşturulacak
- [ ] `kayitYeri: 'mobil'` ve `mobilUygulamadanKayit: true` set edilecek
- [ ] `uyeNumarasi` otomatik oluşturulacak (unique)
- [ ] Varsayılan deneme süresi başlatılacak

#### Veri Okuma:
- [ ] Diyetisyen bilgileri okunurken hassas alanlar filtrelenecek
- [ ] Sadece görünmesi gereken alanlar gösterilecek
- [ ] Real-time listener ile anlık güncellemeler takip edilecek

#### Danışan Sayısı Güncelleme:
- [ ] Danışan eklendiğinde `aktifDanisanSayisi` güncellenecek
- [ ] Danışan çıkarıldığında `aktifDanisanSayisi` güncellenecek
- [ ] Pasif danışan sayısı da güncellenecek (varsa)
- [ ] `sonGuncelleme` timestamp'i güncellenecek

#### Limit Kontrolü:
- [ ] Eşleşme isteği göndermeden önce `paketHakki` kontrolü yapılacak
- [ ] Deneme süresi aktifse sınırsız eşleşme izni verilecek
- [ ] Limit aşıldığında uyarı mesajı gösterilecek: "Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz."
- [ ] Uyarı mesajlarında "ödeme", "abonelik" kelimeleri kullanılmayacak
- [ ] Beklemedeki danışanlar listelenecek
- [ ] Beklemedeki danışanlar için diyet planı tanımlama butonu disabled olacak

#### Kullanım Kısıtlamaları:
- [ ] Giriş yaptığında `apiErisimDurumu` kontrol edilecek
- [ ] `apiErisimDurumu === 'kapali'` ise giriş engellenecek
- [ ] `apiErisimDurumu === 'kisitli'` ve aktif danışan varsa overlay gösterilecek
- [ ] Overlay mesajı: "DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin."
- [ ] Overlay kapatılamaz olacak (closable: false)
- [ ] Overlay sürekli görünür olacak (persistent: true)
- [ ] Ana ekranda sürekli kontrol yapılacak (her 1 dakikada)
- [ ] Aktif danışanların planları çalışmaya devam edecek (danışan mağdur olmayacak)

#### Push Notifications:
- [ ] FCM token yönetimi eklenecek
- [ ] Diyetisyen giriş yaptığında token kaydedilecek
- [ ] Push notification handler'ları eklenecek
- [ ] Ödeme onayı bildirimi işlenecek
- [ ] Deneme süresi bitişi bildirimi işlenecek

---

### Web Panel Tarafında Yapılacaklar

#### Kayıt Sistemi:
- [ ] Diyetisyen ekleme formu güncellenecek
- [ ] Kayıt olduğunda `kayitYeri: 'web'` set edilecek
- [ ] `mobilUygulamadanKayit: false` set edilecek
- [ ] `uyeNumarasi` otomatik oluşturulacak
- [ ] Firebase Auth ile hesap oluşturulacak

#### Veri Okuma:
- [ ] Tüm alanlar görüntülenecek (ödeme, evrak bilgileri dahil)
- [ ] Real-time listener ile anlık güncellemeler
- [ ] Mobil uygulamadan gelen kayıtlar otomatik görünecek

#### Danışan Sayısı Okuma:
- [ ] `aktifDanisanSayisi` mobil uygulamadan okunacak
- [ ] Diyetisyen detay sayfasında gösterilecek
- [ ] Anlık güncellemeler için real-time listener

#### Otomatik Ücretlendirme:
- [ ] Aktif danışan sayısına göre ücret hesaplama
- [ ] Ödeme oluşturma fonksiyonu güncellenecek
- [ ] `paketHakki` güncellemesi yapılacak (ödeme onayı sonrası)

#### Ödeme Onayı:
- [ ] Ödeme onaylandığında `paketHakki` güncellenecek
- [ ] `odemeDurumu: 'aktif'` yapılacak
- [ ] `apiErisimDurumu: 'aktif'` yapılacak
- [ ] Beklemedeki danışanlar otomatik aktifleştirilecek (paket hakkı yeterliyse)
- [ ] Aktifleştirilen danışan sayısı hesaplanacak
- [ ] Push notification gönderilecek
- [ ] Overlay kaldırılacak

#### Deneme Süresi Kontrolü:
- [ ] Cloud Function ile günlük kontrol
- [ ] Deneme süresi bitince aktif danışan sayısı kontrol edilecek
- [ ] Eğer ödeme yapılmamışsa (`paketHakki === 0`) bekleme durumuna geçiş
- [ ] `odemeDurumu: 'beklemede'` yapılacak
- [ ] `apiErisimDurumu: 'kisitli'` yapılacak
- [ ] Aktif danışanların planları çalışmaya devam edecek
- [ ] Push notification gönderilecek
- [ ] Mobil uygulamada overlay tetiklenecek

---

### Ortak Yapılacaklar

#### Firestore Security Rules:
- [ ] Mobil uygulama için kurallar güncellenecek
- [ ] Web panel için kurallar güncellenecek
- [ ] Hassas alanların okunması engellenecek (mobil için)

#### Veri Formatı:
- [ ] Ortak veri yapısı standardize edilecek
- [ ] Field isimleri tutarlı olacak
- [ ] Timestamp formatları standart olacak

#### Test Senaryoları:
- [ ] Mobil uygulamadan kayıt → Web panelde görünme
- [ ] Web panelden kayıt → Mobil uygulamada görünme
- [ ] Danışan sayısı güncelleme → Web panelde görünme
- [ ] Ödeme onayı → Mobil uygulamada bildirim
- [ ] Limit kontrolü testleri
- [ ] Kullanım kısıtlaması testleri

---

## 🔍 Kontrol Edilmesi Gerekenler

### Mobil Uygulama Tarafında:

1. **Mevcut Kayıt Sistemi:**
   - [ ] Şu anda kayıt nasıl yapılıyor?
   - [ ] Firebase Authentication kullanılıyor mu?
   - [ ] Firestore'a kayıt yapılıyor mu?
   - [ ] Hangi collection kullanılıyor?

2. **Eşleşme Sistemi:**
   - [ ] Eşleşme verileri hangi collection'da?
   - [ ] Aktif/pasif durumu nasıl belirleniyor?
   - [ ] Danışan sayısı nasıl hesaplanıyor?

3. **Veri Yapısı:**
   - [ ] Mevcut `diyetisyenler` collection yapısı nedir?
   - [ ] Hangi alanlar var?
   - [ ] Field isimleri neler?

4. **Güvenlik:**
   - [ ] Firestore Security Rules nasıl?
   - [ ] Diyetisyen kendi verilerini okuyabiliyor mu?
   - [ ] Başka diyetisyenlerin verilerini görebiliyor mu?

---

### Web Panel Tarafında:

1. **Mevcut Sistem:**
   - [ ] Diyetisyen ekleme nasıl yapılıyor?
   - [ ] Firebase Auth entegrasyonu var mı?
   - [ ] `diyetisyenler` collection yapısı nedir?

2. **Veri Okuma:**
   - [ ] Real-time listener kullanılıyor mu?
   - [ ] Anlık güncellemeler nasıl yapılıyor?

3. **Ödeme Sistemi:**
   - [ ] Ödeme oluşturma nasıl yapılıyor?
   - [ ] Danışan sayısı nasıl alınıyor?
   - [ ] Ücret hesaplama formülü nedir?

---

## 📝 Yol Haritası

### Faz 1: Kayıt Senkronizasyonu
1. **Mobil Uygulama:**
   - Kayıt olduğunda `diyetisyenler` collection'ına otomatik kayıt
   - `kayitYeri: 'mobil'` ve `mobilUygulamadanKayit: true` set etme
   - Varsayılan deneme süresi başlatma

2. **Web Panel:**
   - Diyetisyen ekleme formu güncelleme
   - `kayitYeri: 'web'` set etme
   - Real-time listener ile yeni kayıtları görüntüleme

3. **Ortak:**
   - Firestore Security Rules güncelleme
   - Veri formatı standardizasyonu

---

### Faz 2: Danışan Sayısı Senkronizasyonu
1. **Mobil Uygulama:**
   - Danışan eklendiğinde `aktifDanisanSayisi` güncelleme
   - Danışan çıkarıldığında `aktifDanisanSayisi` güncelleme
   - Real-time listener ile anlık güncellemeler

2. **Web Panel:**
   - `aktifDanisanSayisi` okuma ve görüntüleme
   - Otomatik ücret hesaplama (aktif danışan sayısına göre)

---

### Faz 3: Limit Kontrolü ve Bekleme Kuyruğu
1. **Mobil Uygulama:**
   - Eşleşme isteği göndermeden önce limit kontrolü
   - Deneme süresi kontrolü (sınırsız eşleşme)
   - Paket hakkı kontrolü
   - Limit aşıldığında uyarı mesajı: "Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz."
   - Beklemedeki danışanlar listesi
   - Beklemedeki danışanlar için diyet planı butonu disabled

2. **Web Panel:**
   - Ödeme onayı sonrası `paketHakki` güncelleme
   - Beklemedeki danışanları otomatik aktifleştirme
   - Paket yükseltme işlemleri

---

### Faz 4: Kullanım Kısıtlamaları
1. **Mobil Uygulama:**
   - Giriş kontrolü (`apiErisimDurumu`)
   - Ana ekran overlay (kapatılamayan): "DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin."
   - Sürekli durum kontrolü (her 1 dakikada)
   - Aktif danışanların planlarının çalışmaya devam etmesi (danışan mağdur olmayacak)

2. **Web Panel:**
   - Diyetisyen giriş kontrolü
   - Banner uyarısı: "DietCoop Diyetisyen Hesabınız Bekleme Durumundadır. Lütfen hesabınızı güncelleyerek devam edin."
   - Deneme süresi bitişi kontrolü (Cloud Function)

---

### Faz 5: Bildirimler ve Son Dokunuşlar
1. **Push Notifications:**
   - FCM token yönetimi
   - Ödeme onayı bildirimi
   - Deneme süresi bitişi bildirimi
   - Paket yükseltme bildirimi

2. **Test ve Doğrulama:**
   - End-to-end testler
   - Senaryo testleri
   - Performans optimizasyonu

---

## 📝 Sonraki Adımlar

1. **Bilgi Toplama:**
   - Mobil uygulama geliştiricisi ile görüşme
   - Mevcut veri yapılarını inceleme
   - Firestore Security Rules kontrolü
   - Eşleşme collection yapısını öğrenme

2. **Mimari Onayı:**
   - Bu dokümanın gözden geçirilmesi
   - Gerekli düzeltmelerin yapılması
   - Onay alınması

3. **Uygulama:**
   - Faz 1'den başlayarak sırayla uygulama
   - Her faz sonrası test ve doğrulama
   - Bir sonraki faza geçmeden önce onay

---

**Son Güncelleme:** 2025-12-19
**Versiyon:** 1.0.0
**Durum:** Onay Bekliyor ⏳

