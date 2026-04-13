# DietCoop Admin Panel

DietCoop mobil uygulaması için diyetisyen ödeme ve aktiflik yönetim sistemi.

## 🚀 Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Firebase yapılandırması:
   - `.env` dosyası oluşturun ve Firebase bilgilerinizi ekleyin:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Production build:
```bash
npm run build
```

## 🔥 Firebase Kurulumu

### Firestore Collections

Sistem aşağıdaki collection'ları kullanır:

- `adminler` - Admin kullanıcıları
- `diyetisyenler` - Diyetisyen bilgileri
- `odemeler` - Ödeme kayıtları
- `ayarlar` - Sistem ayarları (singleton: `genelAyarlar`)
- `aktiviteLoglari` - Aktivite logları

### İlk Admin Kullanıcısı Oluşturma

Firebase Console'dan manuel olarak `adminler` collection'ına admin kullanıcısı ekleyin:

```javascript
{
  id: "firebase-auth-uid",
  email: "admin@example.com",
  adSoyad: "Admin Kullanıcı",
  rol: "superAdmin",
  olusturmaTarihi: Timestamp.now(),
  sonGirisTarihi: Timestamp.now(),
  aktif: true
}
```

### İlk Ayarlar Oluşturma

`ayarlar` collection'ına `genelAyarlar` ID'si ile ilk ayarları ekleyin:

```javascript
{
  id: "genelAyarlar",
  varsayilanDanisanBasiUcret: 199,
  varsayilanIskontoOrani: 0,
  bankaHesapBilgileri: {
    iban: "TR00 0000 0000 0000 0000 0000 00",
    aliciAdi: "DietCoop",
    bankaAdi: ""
  },
  otomatikOdemeHesaplama: true,
  otomatikPasiflestirme: true,
  pasiflestirmeGunSayisi: 5,
  mobilUygulamaSyncAktif: true,
  sonGuncelleme: Timestamp.now(),
  guncelleyenAdmin: "admin-uid"
}
```

## 📦 Özellikler

- ✅ Google ve Email/Password ile giriş
- ✅ Diyetisyen yönetimi
- ✅ Ödeme takibi ve onaylama
- ✅ Banka havalesi ödeme sistemi
- ✅ Deneme süresi yönetimi
- ✅ Kişiye özel fiyatlandırma
- ✅ Otomatik ödeme kontrolü
- ✅ API erişim kontrolü
- ✅ Aktivite logları

## 🎨 Tasarım

- Siyah tema
- Modern ve canlı animasyonlar
- Responsive tasarım
- Framer Motion animasyonları

## 📱 Mobil Uygulama Entegrasyonu

Mobil uygulamadan kayıt olan diyetisyenler otomatik olarak `diyetisyenler` collection'ına eklenir. Sistem `mobilUygulamadanKayit` flag'i ile bunları ayırt eder.

API kontrolü için mobil uygulama her istekte `diyetisyenler` collection'ından kontrol yapmalı:
- `odemeDurumu` === 'aktif'
- `apiErisimDurumu` === 'aktif'
- `aktiflikDurumu` === 'aktif'

## 🚢 Deployment

Firebase Hosting'e deploy etmek için:

```bash
firebase deploy --only hosting
```

## 📝 Notlar

- Kredi kartı ödeme sistemi şu an aktif değil, gelecekte eklenecek
- Otomatik pasifleştirme için Cloud Function kurulması önerilir
- Mobil uygulama senkronizasyonu için Cloud Function kullanılabilir














