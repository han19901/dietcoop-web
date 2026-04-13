# Service Account JSON Key İndirme Talimatları

## ✅ Mevcut Durum

**Service Account Email:** `firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com`  
**Proje:** `webdietcoop`  
**Durum:** Service account mevcut ✅

---

## 📥 JSON Key İndirme Adımları

### Yöntem 1: Firebase Console (Önerilen)

1. [Firebase Console](https://console.firebase.google.com/) → `webdietcoop` projesini seçin
2. Sol üst köşedeki **⚙️ Project Settings** (Proje Ayarları) ikonuna tıklayın
3. Üst menüden **"Service Accounts"** sekmesine gidin
4. **"Generate New Private Key"** (Yeni Özel Anahtar Oluştur) butonuna tıklayın
5. Açılan uyarı penceresinde **"Generate Key"** (Anahtar Oluştur) butonuna tıklayın
6. JSON dosyası otomatik olarak indirilecek
7. İndirilen dosyayı **Mobil App klasörüne** (`DietCoop Mobil App`) taşıyın
8. Dosya adını `web-panel-service-account.json` olarak değiştirin

---

### Yöntem 2: Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → `webdietcoop` projesini seçin
2. Sol menüden **IAM & Admin** → **Service Accounts** sekmesine gidin
3. `firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com` satırını bulun
4. Sağdaki **"⋮"** (üç nokta) menüsüne tıklayın
5. **"Manage Keys"** (Anahtarları Yönet) seçeneğine tıklayın
6. **"ADD KEY"** → **"Create New Key"** seçin
7. **"JSON"** formatını seçin
8. **"CREATE"** (Oluştur) butonuna tıklayın
9. JSON dosyası otomatik olarak indirilecek
10. İndirilen dosyayı **Mobil App klasörüne** (`DietCoop Mobil App`) taşıyın
11. Dosya adını `web-panel-service-account.json` olarak değiştirin

---

## ✅ Dosya Kontrolü

İndirdiğiniz JSON dosyasında şu alanlar olmalı:

```json
{
  "type": "service_account",
  "project_id": "webdietcoop",  // ← Bu "webdietcoop" olmalı
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com",
  ...
}
```

**Önemli:** `project_id` değeri `webdietcoop` olmalı!

---

## 🔐 Rol Atama (ZORUNLU)

JSON key'i indirdikten sonra, bu service account'a rol atamanız gerekiyor:

### Adımlar:

1. [Google Cloud Console](https://console.cloud.google.com/) → `webdietcoop` projesini seçin
2. Sol menüden **IAM & Admin** → **IAM** sekmesine gidin
3. **"GRANT ACCESS"** (Erişim Ver) butonuna tıklayın
4. **"New principals"** alanına service account email'ini girin:
   ```
   firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com
   ```
5. **"Select a role"** menüsünden **"Cloud Datastore User"** seçin
   - Arama kutusuna "datastore" yazabilirsiniz
6. **"SAVE"** (Kaydet) butonuna tıklayın

---

## 📁 Dosya Konumu

İndirdiğiniz JSON dosyası şu konumda olmalı:

```
DietCoop Mobil App/
  └── web-panel-service-account.json
```

---

## ⚠️ Güvenlik

- ✅ JSON dosyasını `.gitignore`'a ekleyin (Mobil App klasöründe)
- ✅ JSON dosyasını asla Git'e commit etmeyin
- ✅ JSON dosyasını paylaşmayın

---

## 🧪 Test

JSON key'i indirip rol atamasını yaptıktan sonra:

1. Mobil App klasöründe `web-panel-service-account.json` dosyasının varlığını kontrol edin
2. Dosyanın içindeki `project_id` değerinin `webdietcoop` olduğunu kontrol edin
3. Google Cloud Console → IAM sayfasında rol atamasını kontrol edin

---

## ✅ Kontrol Listesi

- [ ] JSON key'i Firebase Console'dan indirdim
- [ ] Dosyayı Mobil App klasörüne taşıdım
- [ ] Dosya adını `web-panel-service-account.json` yaptım
- [ ] `project_id` değerinin `webdietcoop` olduğunu kontrol ettim
- [ ] Google Cloud Console'da rol ataması yaptım (`Cloud Datastore User`)
- [ ] Mobil App klasöründeki `.gitignore`'a dosyayı ekledim

---

## 🎯 Sonraki Adım

JSON key'i indirip rol atamasını yaptıktan sonra:
1. Mobil App klasöründe Cloud Functions kurulumu yapılacak
2. Cloud Functions'ta bu service account kullanılacak
3. Web Panel'e senkronizasyon başlayacak








