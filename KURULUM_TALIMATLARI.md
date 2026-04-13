# DietCoop Web Sitesi - Kurulum Talimatları

## 📋 Gereksinimler

1. **Node.js** (v18 veya üzeri) - [İndir](https://nodejs.org/)
2. **npm** (Node.js ile birlikte gelir)

## 🚀 Kurulum Adımları

### 1. Node.js Kontrolü
```bash
node --version
npm --version
```

Eğer komutlar çalışmıyorsa, Node.js'i yükleyin.

### 2. Bağımlılıkları Yükleme
```bash
npm install
```

Bu komut `package.json` dosyasındaki tüm bağımlılıkları yükler.

### 3. (Opsiyonel) Firebase Environment Variables
`.env` dosyası oluşturun (root klasörde):
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

**Not:** Eğer `.env` dosyası yoksa, sistem `src/services/firebase/config.ts` dosyasındaki default değerleri kullanacaktır.

### 4. Development Server'ı Başlatma
```bash
npm run dev
```

Server başladıktan sonra tarayıcıda şu adrese gidin:
- http://localhost:5173

### 5. Build (Production)
```bash
npm run build
```

Build dosyaları `dist/` klasörüne oluşturulur.

## 📁 Klasör Yapısı

```
DietCoop Web Sitesi/
├── src/                    # Kaynak kodlar
│   ├── pages/             # Sayfa bileşenleri
│   ├── components/         # React bileşenleri
│   ├── services/          # Firebase servisleri
│   └── ...
├── public/                # Statik dosyalar
│   ├── İcerik/           # Aplikasyon özellikleri resimleri
│   └── ...
├── dist/                  # Build çıktısı (npm run build sonrası)
├── node_modules/          # Bağımlılıklar (npm install sonrası)
├── package.json           # Proje bağımlılıkları
├── vite.config.ts        # Vite yapılandırması
├── tsconfig.json          # TypeScript yapılandırması
└── firebase.json          # Firebase yapılandırması
```

## ✅ Kontrol Listesi

- [x] `package.json` mevcut
- [x] `vite.config.ts` mevcut
- [x] `tsconfig.json` mevcut
- [x] `tailwind.config.js` mevcut
- [x] `postcss.config.js` mevcut
- [x] `index.html` mevcut
- [x] `firebase.json` mevcut
- [x] `.firebaserc` mevcut
- [x] `.gitignore` mevcut
- [x] `src/` klasörü ve tüm alt klasörler mevcut
- [x] `public/` klasörü ve içeriği mevcut
- [x] `node_modules/` mevcut (231 klasör)
- [ ] Node.js yüklü mü? (Kontrol edin: `node --version`)
- [ ] `.env` dosyası (Opsiyonel - Firebase config'de default değerler var)

## 🔧 Sorun Giderme

### "npm komutu bulunamadı" hatası
- Node.js yüklü değildir. [Node.js'i indirip yükleyin](https://nodejs.org/)

### "ERR_CONNECTION_REFUSED" hatası
- Development server çalışmıyor. `npm run dev` komutunu çalıştırın.

### Bağımlılık hataları
- `npm install` komutunu çalıştırın.

### Port 5173 kullanımda
- Vite otomatik olarak başka bir port kullanacaktır. Terminal çıktısına bakın.

## 📝 Notlar

- Firebase config dosyasında default değerler mevcut, bu yüzden `.env` dosyası zorunlu değildir.
- `node_modules` klasörü mevcut ve 231 klasör içeriyor, bu bağımlılıkların yüklü olduğunu gösterir.
- Eğer sorun yaşarsanız, `npm install` komutunu tekrar çalıştırabilirsiniz.








