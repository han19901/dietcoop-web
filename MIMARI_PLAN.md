# DietCoop Admin Panel - Mimari Plan

## 📋 Proje Özeti
DietCoop mobil uygulaması için diyetisyen ödeme ve aktiflik yönetim sistemi. Firebase tabanlı, siyah temalı, modern ve canlı bir admin paneli.

## 🏗️ Teknoloji Stack

### Frontend
- **Framework**: React 18+ (Vite ile)
- **Styling**: Tailwind CSS (siyah tema)
- **Animasyonlar**: Framer Motion
- **Form Yönetimi**: React Hook Form
- **State Management**: React Context API / Zustand
- **Routing**: React Router v6
- **UI Components**: Custom components (siyah tema)

### Backend & Services
- **Hosting**: Firebase Hosting
- **Authentication**: Firebase Authentication (Google + Email/Password)
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage (logolar, belgeler)
- **Functions**: Firebase Cloud Functions (gerekirse)

## 📁 Proje Yapısı

```
dietcoop-admin/
├── public/
│   ├── logos/
│   │   ├── DietCoop Logo.png
│   │   └── dietcoop logo.svg
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── AnimatedBackground.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── GoogleLogin.tsx
│   │   ├── diyetisyen/
│   │   │   ├── DiyetisyenList.tsx
│   │   │   ├── DiyetisyenCard.tsx
│   │   │   ├── DiyetisyenDetail.tsx
│   │   │   ├── PaymentModal.tsx
│   │   │   └── TrialPeriodModal.tsx
│   │   └── admin/
│   │       ├── SettingsPanel.tsx
│   │       ├── PricingSettings.tsx
│   │       └── DiscountSettings.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Diyetisyenler.tsx
│   │   ├── Odemeler.tsx
│   │   ├── Ayarlar.tsx
│   │   └── DenemeSuresi.tsx
│   ├── services/
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   ├── firestore.ts
│   │   │   └── storage.ts
│   │   ├── api/
│   │   │   ├── diyetisyenService.ts
│   │   │   ├── paymentService.ts
│   │   │   └── settingsService.ts
│   │   └── utils/
│   │       ├── dateUtils.ts
│   │       ├── paymentUtils.ts
│   │       └── validation.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDiyetisyen.ts
│   │   └── usePayment.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── AppContext.tsx
│   ├── types/
│   │   ├── diyetisyen.ts
│   │   ├── payment.ts
│   │   └── settings.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.css
│   ├── App.tsx
│   └── main.tsx
├── firebase.json
├── .firebaserc
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🗄️ Firestore Veritabanı Yapısı

### Collections

#### 1. `diyetisyenler` Collection
```typescript
{
  id: string (auto-generated)
  email: string
  adSoyad: string
  telefon?: string
  uyeNumarasi: string (unique)
  olusturmaTarihi: Timestamp
  sonGuncelleme: Timestamp
  
  // Ödeme Bilgileri
  odemeDurumu: 'aktif' | 'beklemede' | 'suresiDolmus' | 'deneme'
  sonOdemeTarihi?: Timestamp
  birSonrakiOdemeTarihi?: Timestamp
  aktiflikDurumu: 'aktif' | 'pasif' | 'askiyaAlindi'
  
  // Fiyatlandırma
  danisanBasiUcret: number (kişiye özel)
  iskontoOrani: number (kişiye özel, 0-100)
  aktifDanisanSayisi: number
  
  // Deneme Süresi
  denemeSuresi: {
    aktif: boolean
    baslangicTarihi?: Timestamp
    bitisTarihi?: Timestamp
    gunSayisi: 15 | 30
  }
  
  // Mobil Uygulama Entegrasyonu
  mobilUygulamaId?: string (mobil app'ten gelen ID)
  mobilUygulamadanKayit: boolean
  
  // API Kontrolü
  apiErisimDurumu: 'aktif' | 'kisitli' | 'kapali'
  kisitlamaNedeni?: string
}
```

#### 2. `odemeler` Collection
```typescript
{
  id: string (auto-generated)
  diyetisyenId: string
  diyetisyenEmail: string
  diyetisyenAdSoyad: string
  uyeNumarasi: string
  
  // Ödeme Detayları
  tutar: number
  kdvOrani: number
  toplamTutar: number
  odemeYontemi: 'bankaHavalesi' | 'krediKarti'
  odemeDurumu: 'beklemede' | 'onaylandi' | 'iptal'
  
  // Dönem Bilgisi
  donemBaslangic: Timestamp
  donemBitis: Timestamp
  gunSayisi: number (30)
  danisanSayisi: number
  
  // Banka Havalesi Bilgileri
  bankaHavalesi?: {
    iban: string
    aliciAdi: string
    aciklama: string
    onayTarihi?: Timestamp
  }
  
  // Kredi Kartı (gelecekte)
  krediKarti?: {
    transactionId?: string
    odemeTarihi?: Timestamp
  }
  
  olusturmaTarihi: Timestamp
  onayTarihi?: Timestamp
  onaylayanAdmin?: string
}
```

#### 3. `ayarlar` Collection (Singleton)
```typescript
{
  id: 'genelAyarlar'
  
  // Varsayılan Fiyatlandırma
  varsayilanDanisanBasiUcret: number
  varsayilanIskontoOrani: number
  
  // Banka Bilgileri
  bankaHesapBilgileri: {
    iban: string
    aliciAdi: string
    bankaAdi?: string
  }
  
  // Sistem Ayarları
  otomatikOdemeHesaplama: boolean
  otomatikPasiflestirme: boolean
  pasiflestirmeGunSayisi: number
  
  // API Ayarları
  mobilUygulamaApiKey?: string
  mobilUygulamaSyncAktif: boolean
  
  sonGuncelleme: Timestamp
  guncelleyenAdmin: string
}
```

#### 4. `adminler` Collection
```typescript
{
  id: string (Firebase Auth UID)
  email: string
  adSoyad: string
  rol: 'superAdmin' | 'admin'
  olusturmaTarihi: Timestamp
  sonGirisTarihi: Timestamp
  aktif: boolean
}
```

#### 5. `aktiviteLoglari` Collection
```typescript
{
  id: string (auto-generated)
  diyetisyenId?: string
  adminId: string
  islemTipi: string
  aciklama: string
  detaylar?: object
  tarih: Timestamp
}
```

## 🔐 Authentication Yapısı

### Giriş Yöntemleri
1. **Google Authentication**: Firebase Auth ile
2. **Email/Password**: Firebase Auth ile

### Yetkilendirme
- Admin rolü kontrolü Firestore `adminler` collection'ından yapılacak
- Sadece admin rolüne sahip kullanıcılar sisteme giriş yapabilir
- Mobil uygulamadan gelen kullanıcılar otomatik olarak `diyetisyenler` collection'ına eklenecek

## 🔄 Mobil Uygulama Entegrasyonu

### Senaryo 1: Mobil Uygulamadan Yeni Kayıt
1. Mobil uygulamada diyetisyen kayıt olur
2. Firebase Auth ile authentication yapılır
3. Cloud Function veya Firestore Trigger ile:
   - `diyetisyenler` collection'ına kayıt eklenir
   - `mobilUygulamadanKayit: true` işaretlenir
   - `mobilUygulamaId` set edilir
   - Varsayılan deneme süresi başlatılabilir

### Senaryo 2: Admin Panelden Manuel Ekleme
1. Admin panel üzerinden diyetisyen eklenir
2. Email gönderilir (Firebase Auth ile hesap oluşturulur)
3. `diyetisyenler` collection'ına kayıt eklenir
4. `mobilUygulamadanKayit: false` işaretlenir

### API Kontrol Mekanizması
- Her API isteğinde `diyetisyenler` collection'ından kontrol yapılır
- `apiErisimDurumu` ve `odemeDurumu` kontrol edilir
- Aktif ve ödemesi yapılmış diyetisyenler için erişim sağlanır

## 💳 Ödeme Sistemi

### Banka Havalesi Akışı
1. Admin, diyetisyen için ödeme oluşturur
2. Sistem otomatik olarak:
   - Danışan sayısına göre tutarı hesaplar
   - İskonto varsa uygular
   - KDV ekler
   - IBAN ve alıcı adını gösterir
   - Açıklama metnini oluşturur (kopyalanabilir)
3. Diyetisyen ödeme yapar
4. Admin ödemeyi onaylar
5. `odemeDurumu` ve `aktiflikDurumu` güncellenir
6. `birSonrakiOdemeTarihi` hesaplanır

### Ödeme Hesaplama Formülü
```
Tutar = (danisanSayisi * danisanBasiUcret) * (1 - iskontoOrani/100)
KDV = Tutar * 0.20
Toplam = Tutar + KDV
```

### Otomatik Kontrol Mekanizması
- Cloud Function ile günlük kontrol yapılır
- `birSonrakiOdemeTarihi` geçmişse:
  - `odemeDurumu: 'suresiDolmus'` yapılır
  - `aktiflikDurumu: 'pasif'` yapılır
  - `apiErisimDurumu: 'kapali'` yapılır
  - Bildirim gönderilir (gelecekte)

## 🎨 UI/UX Tasarım Prensipleri

### Renk Paleti (Siyah Tema)
- **Arka Plan**: #000000 (siyah)
- **Kartlar**: #1a1a1a, #252525 (koyu gri tonları)
- **Metin**: #ffffff (beyaz), #b3b3b3 (açık gri)
- **Vurgu**: #00ff88 (yeşil), #ff6b6b (kırmızı), #4dabf7 (mavi)
- **Gradient**: Siyah'dan koyu griye geçişler

### Animasyonlar
- Sayfa geçişleri: Fade in/out
- Kartlar: Hover efektleri, scale animasyonları
- Giriş sayfası: Özel animasyonlu arka plan
- Loading: Skeleton screens, spinner animasyonları

### Responsive Tasarım
- Mobile-first yaklaşım
- Tablet ve desktop için optimize edilmiş layout
- Sidebar mobilde hamburger menü olarak

## 📱 Sayfa Yapısı

### 1. Login Sayfası (`/login`)
- Google ile giriş butonu
- Email/Password formu
- Animasyonlu arka plan
- DietCoop logosu

### 2. Dashboard (`/`)
- Özet istatistikler (aktif diyetisyen, bekleyen ödemeler, vb.)
- Son aktiviteler
- Grafikler (Chart.js veya Recharts)
- Hızlı aksiyonlar

### 3. Diyetisyenler (`/diyetisyenler`)
- Liste görünümü (kartlar)
- Filtreleme (ödeme durumu, aktiflik durumu)
- Arama (isim, email, üye numarası)
- Detay sayfası (`/diyetisyenler/:id`)
- Toplu işlemler

### 4. Ödemeler (`/odemeler`)
- Ödeme listesi
- Yeni ödeme oluşturma
- Ödeme onaylama
- Ödeme geçmişi

### 5. Ayarlar (`/ayarlar`)
- Genel ayarlar
- Fiyatlandırma ayarları
- Banka hesap bilgileri
- İskonto oranları
- Sistem ayarları

### 6. Deneme Süresi (`/deneme-suresi`)
- Deneme süresi başlatma
- Aktif deneme süreleri listesi
- Deneme süresi geçmişi

## 🔧 Önemli Özellikler

### 1. Otomatik Deneme Süresi
- Admin, diyetisyene 15 veya 30 günlük deneme süresi tanımlayabilir
- Deneme süresi bitince otomatik pasifleştirme
- Bildirim sistemi (gelecekte)

### 2. Kişiye Özel Fiyatlandırma
- Her diyetisyen için özel `danisanBasiUcret` ve `iskontoOrani`
- Varsayılan değerlerden farklı olabilir
- Admin panelden kolayca değiştirilebilir

### 3. API Erişim Kontrolü
- `apiErisimDurumu` field'ı ile kontrol
- Mobil uygulama her istekte bu durumu kontrol eder
- Pasif diyetisyenler için API erişimi kısıtlanır

### 4. Aktivite Logları
- Tüm admin işlemleri loglanır
- Kim, ne zaman, ne yaptı bilgisi tutulur
- Audit trail için önemli

## 🚀 Deployment

### Firebase Hosting
- Production build: `npm run build`
- Deploy: `firebase deploy --only hosting`
- Custom domain yapılandırması

### Environment Variables
- Firebase config (public)
- API keys (Firebase Functions'da saklanacak)

## 📊 Performans Optimizasyonları

1. **Firestore Indexing**: Tüm sorgular için index'ler oluşturulacak
2. **Pagination**: Liste sayfalarında sayfalama
3. **Lazy Loading**: Route bazlı code splitting
4. **Image Optimization**: Logo ve görseller optimize edilecek
5. **Caching**: Firestore cache stratejisi

## 🔒 Güvenlik

1. **Firestore Security Rules**: Sadece adminler erişebilir
2. **Authentication**: Firebase Auth ile güvenli giriş
3. **Input Validation**: Tüm formlar validate edilecek
4. **XSS Protection**: React otomatik olarak sağlar
5. **CSRF Protection**: Firebase Auth ile otomatik

## 📝 Sonraki Adımlar

1. ✅ Proje yapısını oluştur
2. ✅ Firebase config'i ayarla
3. ✅ Authentication sistemi kur
4. ✅ Ana sayfaları oluştur
5. ✅ Diyetisyen yönetim sayfaları
6. ✅ Ödeme sistemi
7. ✅ Ayarlar sayfası
8. ✅ Mobil uygulama entegrasyonu hazırlığı
9. ⏳ Kredi kartı ödeme entegrasyonu (gelecekte)

## 🎯 Kullanıcı Deneyimi Akışı

1. **Giriş**: Google veya Email/Password ile
2. **Dashboard**: Hızlı bakış ve özetler
3. **Diyetisyen Yönetimi**: Liste, detay, düzenleme
4. **Ödeme İşlemleri**: Ödeme oluşturma, onaylama
5. **Ayarlar**: Sistem konfigürasyonu
6. **Deneme Süresi**: Yeni diyetisyenler için deneme başlatma

---

**Not**: Bu mimari plan, projenin temel yapısını ve akışını tanımlar. Geliştirme sırasında gerekli değişiklikler yapılabilir.














