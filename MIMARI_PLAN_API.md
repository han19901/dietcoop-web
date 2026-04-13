# DietCoop API Mimari Planı

## 📋 Genel Bakış

Bu doküman, DietCoop mobil uygulama ve web admin paneli arasındaki entegrasyon mimarisini, API yapısını ve iş akışlarını detaylandırır.

---

## 🏗️ Sistem Mimarisi

### 1. Veri Yapısı

#### 1.1. Diyetisyen Kayıt Sistemi
- **Kayıt Yeri:** Mobil uygulama (Firebase Authentication)
- **Veri Saklama:** Firestore `diyetisyenler` collection
- **Senkronizasyon:** Mobil uygulama kayıt olduğunda web paneline otomatik kayıt

#### 1.2. Eşleşme Verileri (Mobil Uygulamadan)
- **Kaynak:** Mobil uygulamada zaten mevcut eşleşme sistemi
- **Veri Yeri:** Mobil uygulamanın kullandığı Firestore collection'ları
  - **SORU:** Mobil uygulamada eşleşme verileri hangi collection'da tutuluyor?
    - Örnek: `eslesmeler`, `matches`, `diyetisyenDanisan`, vb.
  - **SORU:** Aktif/pasif durumu nasıl belirleniyor?
    - Örnek: `durum: 'aktif' | 'pasif'`, `isActive: boolean`, vb.
- **Web Panel:** Bu verileri okuyarak aktif/pasif danışan sayılarını gösterir
- **Not:** Web panel yeni eşleşme collection'ı oluşturmayacak, mevcut verileri kullanacak
- **Önemli:** Mobil uygulama eşleşme durumlarını günceller, web panel sadece okur

#### 1.3. Ortak Veri Formatı
```typescript
// Her iki tarafta da aynı format kullanılacak
interface Diyetisyen {
  id: string; // Firebase Auth UID
  email: string;
  adSoyad: string;
  telefon?: string;
  uyeNumarasi: string; // Unique, otomatik oluşturulacak
  olusturmaTarihi: Timestamp;
  sonGuncelleme: Timestamp;
  
  // Ödeme Bilgileri
  odemeDurumu: 'aktif' | 'beklemede' | 'suresiDolmus' | 'deneme';
  sonOdemeTarihi?: Timestamp;
  birSonrakiOdemeTarihi?: Timestamp;
  aktiflikDurumu: 'aktif' | 'pasif' | 'askiyaAlindi';
  
  // Fiyatlandırma
  danisanBasiUcret: number;
  iskontoOrani: number;
  aktifDanisanSayisi: number;
  paketHakki: number; // Satın alınan paket hakkı (örn: 10)
  
  // Deneme Süresi
  denemeSuresi: {
    aktif: boolean;
    baslangicTarihi?: Timestamp;
    bitisTarihi?: Timestamp;
    gunSayisi: 7 | 15 | 30;
  };
  
  // Mobil Uygulama Entegrasyonu
  mobilUygulamaId?: string;
  mobilUygulamadanKayit: boolean;
  
  // API Kontrolü
  apiErisimDurumu: 'aktif' | 'kisitli' | 'kapali';
  kisitlamaNedeni?: string;
  
  // Onay ve Evrak Durumu
  onayDurumu?: 'beklemede' | 'onaylandi' | 'reddedildi';
  evrakDurumu?: 'beklemede' | 'yuklendi' | 'onaylandi' | 'reddedildi';
  evrakIstemeTarihi?: Timestamp;
  onayTarihi?: Timestamp;
  onaylayanAdmin?: string;
}
```

---

## 🔄 İş Akışları

### 2.1. Diyetisyen Kayıt Akışı

#### Mobil Uygulama Tarafı:
1. Diyetisyen Firebase Authentication ile kayıt olur
2. `diyetisyenler` collection'ına kayıt oluşturulur:
   ```typescript
   {
     id: firebaseAuth.uid,
     email: user.email,
     adSoyad: user.displayName,
     mobilUygulamadanKayit: true,
     onayDurumu: 'beklemede',
     odemeDurumu: 'deneme',
     denemeSuresi: {
       aktif: true,
       baslangicTarihi: Timestamp.now(),
       bitisTarihi: Timestamp.fromDate(addDays(now, 15)),
       gunSayisi: 15
     },
     paketHakki: 0, // Deneme süresinde sınırsız
     aktifDanisanSayisi: 0
   }
   ```

#### Web Panel Tarafı:
- Otomatik olarak yeni kayıt görünür
- Admin onayı bekler
- Onaylandıktan sonra deneme süresi başlar

---

### 2.2. Eşleşme İsteği Akışı

#### Mobil Uygulama Tarafı:

**Mevcut Sistem:** Mobil uygulamada zaten eşleşme sistemi mevcut ve çalışıyor.

**Yapılacaklar:**

1. **Limit Kontrolü Eklenecek:**
   ```typescript
   // Mobil uygulamada eşleşme isteği gönderilmeden önce kontrol
   
   // 1. Deneme süresi kontrolü
   if (diyetisyen.denemeSuresi.aktif) {
     // Sınırsız eşleşme - direkt kabul et
     // Mevcut eşleşme akışına devam et
   }
   
   // 2. Paket hakkı kontrolü
   const aktifDanisanSayisi = await getAktifDanisanSayisiFromFirestore(diyetisyenId);
   const paketHakki = diyetisyen.paketHakki; // Web panelden güncellenmiş değer
   
   if (aktifDanisanSayisi < paketHakki) {
     // Paket hakkı içinde - kabul et
     // Mevcut eşleşme akışına devam et
   } else {
     // Limit aşıldı - UYARI GÖSTER
     showError("Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz.");
     // Eşleşme isteği gönderilmez
   }
   ```

2. **Mevcut Eşleşme Verileri:**
   - Mobil uygulama zaten eşleşme verilerini Firestore'da tutuyor
   - Web panel bu verileri okuyarak aktif/pasif danışan sayılarını gösterir
   - Web panel yeni collection oluşturmayacak, mevcut verileri kullanacak

---

### 2.3. Ödeme Onayı Akışı

#### Web Panel Tarafı:

**Admin ödeme onayladığında:**

1. **Ödeme Kaydı Güncelleme:**
   ```typescript
   await odemeService.update(odemeId, {
     odemeDurumu: 'onaylandi',
     onayTarihi: Timestamp.now(),
     onaylayanAdmin: adminId
   });
   ```

2. **Diyetisyen Güncelleme:**
   ```typescript
   await diyetisyenService.update(diyetisyenId, {
     odemeDurumu: 'aktif',
     paketHakki: odeme.danisanSayisi, // Örnek: 10
     aktiflikDurumu: 'aktif',
     apiErisimDurumu: 'aktif',
     sonOdemeTarihi: Timestamp.now(),
     birSonrakiOdemeTarihi: odeme.donemBitis
   });
   ```

3. **Paket Hakkı Güncelleme:**
   ```typescript
   // Web panel sadece paketHakki günceller
   // Mobil uygulama limit kontrolünde bu değeri kullanacak
   await diyetisyenService.update(diyetisyenId, {
     paketHakki: odeme.danisanSayisi, // Örnek: 10
   });
   
   // NOT: Eşleşme durumlarını mobil uygulama güncelleyecek
   // Web panel sadece paketHakki değerini günceller
   // Mobil uygulama bu değere göre limit kontrolü yapacak
   ```

4. **Mobil Uygulamaya Bildirim:**
   ```typescript
   // Firebase Cloud Messaging (FCM) ile push notification
   await sendNotification(diyetisyenId, {
     title: "Ödeme Onaylandı",
     body: "Hesabınız aktif edildi. Bekleyen danışanlarınız aktif hale getirildi.",
     data: {
       type: "odeme_onaylandi",
       diyetisyenId: diyetisyenId
     }
   });
   ```

---

### 2.4. Deneme Süresi Bitişi Kontrolü

#### Web Panel Tarafı (Cron Job / Cloud Function):

**Günlük kontrol:**

```typescript
// Her gün çalışacak Cloud Function
export const checkDenemeSuresi = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const diyetisyenler = await diyetisyenService.getAll();
    
    for (const diyetisyen of diyetisyenler) {
      if (diyetisyen.denemeSuresi.aktif && 
          diyetisyen.denemeSuresi.bitisTarihi &&
          isDatePast(diyetisyen.denemeSuresi.bitisTarihi)) {
        
        // Deneme süresi bitti
        const aktifDanisanSayisi = await eslesmeService.getAktifSayisi(diyetisyen.id);
        
        if (aktifDanisanSayisi > 0 && diyetisyen.paketHakki === 0) {
          // Ödeme yapılmamış - bekleme durumuna geç
          await diyetisyenService.update(diyetisyen.id, {
            denemeSuresi: { ...diyetisyen.denemeSuresi, aktif: false },
            odemeDurumu: 'beklemede',
            aktiflikDurumu: 'aktif', // Danışanlar mağdur olmasın
            apiErisimDurumu: 'kisitli'
          });
          
          // Mobil uygulamaya bildirim gönder
          await sendNotification(diyetisyen.id, {
            title: "Deneme Süresi Bitti",
            body: "DietCoop hesabınız bekleme durumunda. Lütfen hesabınızı güncelleyerek devam edin.",
            data: { type: "deneme_suresi_bitti" }
          });
        }
      }
    }
  });
```

---

## 🔌 API Endpoint'leri

### 3.1. Mobil Uygulama → Web Panel

#### 3.1.1. Diyetisyen Durum Kontrolü
```
GET /api/diyetisyen/{diyetisyenId}/durum
```

**Response:**
```typescript
{
  odemeDurumu: 'aktif' | 'beklemede' | 'suresiDolmus' | 'deneme';
  paketHakki: number;
  aktifDanisanSayisi: number;
  bekleyenDanisanSayisi: number;
  denemeSuresi: {
    aktif: boolean;
    kalanGun?: number;
  };
  uyariMesaji?: string; // Limit aşıldığında gösterilecek mesaj
}
```

#### 3.1.2. Eşleşme İsteği Gönderme
```
POST /api/eslesme-istegi
```

**Request:**
```typescript
{
  diyetisyenId: string;
  danisanEmail: string;
  danisanAdi?: string;
}
```

**Response (Başarılı):**
```typescript
{
  success: true;
  eslesmeId: string;
  durum: 'aktif' | 'beklemede';
  message: string;
}
```

**Response (Limit Aşıldı):**
```typescript
{
  success: false;
  code: "LIMIT_EXCEEDED";
  message: "Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz.";
}
```

#### 3.1.3. Bekleyen Eşleşmeleri Listeleme
```
GET /api/diyetisyen/{diyetisyenId}/bekleyen-eslesmeler
```

**Response:**
```typescript
{
  bekleyenEslesmeler: Array<{
    id: string;
    danisanEmail: string;
    danisanAdi?: string;
    olusturmaTarihi: Timestamp;
  }>;
  toplamSayi: number;
}
```

---

### 3.2. Web Panel → Mobil Uygulama (Push Notifications)

#### 3.2.1. Ödeme Onaylandı Bildirimi
```typescript
{
  type: "odeme_onaylandi";
  diyetisyenId: string;
  paketHakki: number;
  aktiflestirilenDanisanSayisi: number;
}
```

#### 3.2.2. Deneme Süresi Bitti Bildirimi
```typescript
{
  type: "deneme_suresi_bitti";
  diyetisyenId: string;
  aktifDanisanSayisi: number;
}
```

#### 3.2.3. Limit Aşıldı Bildirimi
```typescript
{
  type: "limit_asildi";
  diyetisyenId: string;
  paketHakki: number;
  aktifDanisanSayisi: number;
}
```

---

## 📊 Veri Senkronizasyonu

### 4.1. Firestore Collection Yapısı

#### 4.1.1. `diyetisyenler` Collection
- **Ortak:** Hem mobil hem web buradan okur/yazar
- **Senkronizasyon:** Real-time Firestore listener'ları kullanılacak

#### 4.1.2. Eşleşme Verileri (Mobil Uygulamadan)
- **Not:** Web panel yeni collection oluşturmayacak
- **Kaynak:** Mobil uygulamanın mevcut Firestore collection'ları
- **Kullanım:** Web panel bu verileri okuyarak:
  - Aktif danışan sayısını gösterir
  - Pasif/bekleyen danışan sayısını gösterir
  - Diyetisyen detay sayfasında listeler
- **Güncelleme:** Mobil uygulama eşleşme durumlarını günceller, web panel sadece okur

#### 4.1.3. `odemeler` Collection
- **Web Panel:** Ödeme oluşturur ve onaylar
- **Mobil Uygulama:** Sadece okur (read-only)

---

## 🎯 Mobil Uygulama Tarafında Yapılacaklar

### 5.1. Giriş Ekranı Kontrolü

```typescript
// Diyetisyen giriş yaptığında
const checkDiyetisyenDurum = async (diyetisyenId: string) => {
  const durum = await getDiyetisyenDurum(diyetisyenId);
  
  if (durum.odemeDurumu === 'beklemede' && durum.aktifDanisanSayisi > 0) {
    // Kapatılamayan overlay göster
    showOverlay({
      title: "DietCoop hesabınız bekleme durumunda",
      message: "Lütfen hesabınızı güncelleyerek devam edin.",
      closable: false
    });
  }
};
```

### 5.2. Eşleşme İsteği Gönderme

```typescript
// Mobil uygulamada mevcut eşleşme isteği fonksiyonuna limit kontrolü eklenecek

const sendEslesmeIstegi = async (danisanEmail: string) => {
  // 1. Diyetisyen durumunu kontrol et (diyetisyenler collection'dan)
  const diyetisyen = await getDiyetisyenFromFirestore(currentUser.uid);
  
  // 2. Deneme süresi kontrolü
  if (diyetisyen.denemeSuresi.aktif) {
    // Sınırsız - mevcut eşleşme akışına devam et
    return await mevcutEslesmeFonksiyonu(danisanEmail);
  }
  
  // 3. Paket hakkı kontrolü
  const aktifDanisanSayisi = await getAktifDanisanSayisiFromFirestore(currentUser.uid);
  const paketHakki = diyetisyen.paketHakki || 0;
  
  if (aktifDanisanSayisi >= paketHakki) {
    // Limit aşıldı - uyarı göster ve eşleşme isteği gönderme
    showError("Limitinize ulaştınız, hesabınızı güncelleyerek bekleyen danışanlarınızı aktif hale getirebilirsiniz.");
    return;
  }
  
  // 4. Limit içinde - mevcut eşleşme akışına devam et
  return await mevcutEslesmeFonksiyonu(danisanEmail);
};
```

### 5.3. Ana Ekran Uyarı Overlay'i

```typescript
// Ana ekranda sürekli kontrol et
useEffect(() => {
  const checkStatus = async () => {
    const durum = await getDiyetisyenDurum(diyetisyenId);
    
    if (durum.odemeDurumu === 'beklemede' && durum.aktifDanisanSayisi > 0) {
      setShowOverlay(true);
    }
  };
  
  checkStatus();
  const interval = setInterval(checkStatus, 60000); // Her 1 dakikada kontrol
  
  return () => clearInterval(interval);
}, []);
```

---

## 🖥️ Web Panel Tarafında Yapılacaklar

### 6.1. Ödeme Onayı Sonrası İşlemler

```typescript
const handleApprovePayment = async (odeme: Odeme) => {
  // 1. Ödemeyi onayla
  await odemeService.update(odeme.id, {
    odemeDurumu: 'onaylandi',
    onayTarihi: Timestamp.now()
  });
  
  // 2. Diyetisyeni güncelle
  await diyetisyenService.update(odeme.diyetisyenId, {
    odemeDurumu: 'aktif',
    paketHakki: odeme.danisanSayisi,
    aktiflikDurumu: 'aktif'
  });
  
  // 3. Bekleyen eşleşmeleri aktifleştir
  await activatePendingMatches(odeme.diyetisyenId, odeme.danisanSayisi);
  
  // 4. Push notification gönder
  await sendPaymentApprovedNotification(odeme.diyetisyenId);
};
```

### 6.2. Bekleyen Eşleşmeleri Aktifleştirme

```typescript
const activatePendingMatches = async (
  diyetisyenId: string, 
  yeniPaketHakki: number
) => {
  const aktifSayisi = await eslesmeService.getAktifSayisi(diyetisyenId);
  const bekleyenler = await eslesmeService.getBekleyen(diyetisyenId);
  
  const aktiflestirilecekSayi = Math.min(
    bekleyenler.length,
    yeniPaketHakki - aktifSayisi
  );
  
  for (let i = 0; i < aktiflestirilecekSayi; i++) {
    await eslesmeService.update(bekleyenler[i].id, {
      durum: 'aktif',
      aktiflestirmeTarihi: Timestamp.now()
    });
  }
  
  return aktiflestirilecekSayi;
};
```

---

## 🔔 Push Notification Yapısı

### 7.1. Firebase Cloud Messaging (FCM)

#### 7.1.1. Token Yönetimi
- Mobil uygulama FCM token'ını `diyetisyenler` collection'ına kaydedecek
- Web panel ödeme onayladığında bu token ile bildirim gönderecek

#### 7.1.2. Bildirim Tipleri

**Ödeme Onaylandı:**
```typescript
{
  notification: {
    title: "Ödeme Onaylandı",
    body: "Hesabınız aktif edildi."
  },
  data: {
    type: "odeme_onaylandi",
    diyetisyenId: "...",
    paketHakki: "10"
  }
}
```

**Deneme Süresi Bitti:**
```typescript
{
  notification: {
    title: "Deneme Süresi Bitti",
    body: "DietCoop hesabınız bekleme durumunda."
  },
  data: {
    type: "deneme_suresi_bitti"
  }
}
```

---

## 📝 Kontrol Listesi

### Mobil Uygulama Tarafı

- [ ] **Limit Kontrolü:** Eşleşme isteği göndermeden önce `paketHakki` ve `aktifDanisanSayisi` kontrolü eklenecek
- [ ] **Uyarı Mesajları:** Limit aşıldığında kullanıcıya uyarı gösterilecek (ödeme/abonelik kelimeleri kullanılmayacak)
- [ ] **Deneme Süresi Kontrolü:** Deneme süresi aktifse sınırsız eşleşme izni verilecek
- [ ] **Ana Ekran Overlay:** Ödeme durumu beklemede ve aktif danışan varsa kapatılamayan overlay gösterilecek
- [ ] **FCM Token Yönetimi:** Diyetisyen giriş yaptığında FCM token'ı `diyetisyenler` collection'ına kaydedilecek
- [ ] **Push Notification Handler:** Ödeme onayı, deneme süresi bitişi bildirimleri için handler eklenecek
- [ ] **Diyetisyen Durum Kontrolü:** Giriş yaptığında `diyetisyenler` collection'ından durum kontrolü yapılacak
- [ ] **Real-time Listener:** `diyetisyenler` collection'ına real-time listener eklenerek ödeme durumu değişiklikleri anlık takip edilecek

### Web Panel Tarafı

- [ ] **Mobil Uygulama Verilerini Okuma:** Mobil uygulamanın kullandığı Firestore collection'larından eşleşme verilerini okuma servisi eklenecek
- [ ] **Aktif/Pasif Danışan Sayısı:** Mobil uygulamadan aktif ve pasif danışan sayılarını gösterme
- [ ] **Ödeme Onayı Sonrası:** `paketHakki` güncellemesi yapılacak (mobil uygulama limit kontrolünde kullanacak)
- [ ] **Push Notification Servisi:** Ödeme onayı, deneme süresi bitişi için FCM ile bildirim gönderme
- [ ] **Deneme Süresi Kontrolü:** Cloud Function ile günlük kontrol ve otomatik bekleme durumuna geçiş
- [ ] **Diyetisyen Detay Sayfası:** Mobil uygulamadan gelen aktif/pasif danışan listesi gösterimi
- [ ] **Ödeme Modal:** Paket hakkı bilgisi gösterimi ve güncelleme
- [ ] **Real-time Listener:** `diyetisyenler` collection'ına listener eklenerek anlık güncellemeler

### Ortak

- [ ] Veri formatları standardize edilecek
- [ ] API endpoint'leri dokümante edilecek
- [ ] Error handling mekanizmaları eklenecek
- [ ] Logging sistemi kurulacak
- [ ] Test senaryoları yazılacak

---

## 🚀 Uygulama Sırası

### Faz 1: Temel Altyapı
1. Mobil uygulamanın mevcut eşleşme verilerini okuma servisi (web panel)
2. Mobil uygulamada limit kontrolü ekleme
3. Web panelde aktif/pasif danışan sayılarını görüntüleme

### Faz 2: Limit Kontrolü
1. Mobil uygulamada `paketHakki` ve `aktifDanisanSayisi` kontrolü
2. Limit aşıldığında uyarı mesajları
3. Web panelde paket hakkı ve aktif danışan sayısı gösterimi

### Faz 3: Ödeme Entegrasyonu
1. Ödeme onayı sonrası otomatik aktifleştirme
2. Push notification sistemi
3. Real-time durum güncellemeleri

### Faz 4: Deneme Süresi Yönetimi
1. Deneme süresi bitişi kontrolü (Cloud Function)
2. Otomatik bekleme durumuna geçiş
3. Uyarı overlay'leri

### Faz 5: Test ve Optimizasyon
1. End-to-end testler
2. Performans optimizasyonu
3. Dokümantasyon tamamlama

---

## 🔒 Güvenlik Notları

1. **API Güvenliği:**
   - Tüm API endpoint'leri Firebase Authentication ile korunacak
   - Diyetisyen sadece kendi verilerine erişebilecek

2. **Veri Doğrulama:**
   - Tüm input'lar server-side validate edilecek
   - Firestore Security Rules güncellenecek

3. **Rate Limiting:**
   - Eşleşme isteği gönderme için rate limit eklenecek
   - Spam koruması yapılacak

---

## 📞 İletişim ve Destek

Sorularınız için:
- Web Panel: Admin panel üzerinden
- Mobil Uygulama: Uygulama içi destek

---

**Son Güncelleme:** 2025-12-19
**Versiyon:** 1.0.0

