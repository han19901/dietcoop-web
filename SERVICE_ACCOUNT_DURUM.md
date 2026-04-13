# Service Account Durum Kontrolü

## ✅ Şu Anki Durum

### Web Panel Klasörü (`DietCoop Web Sitesi`)
- ✅ `mobile-app-service-account.json` → `dietcoop-432fa` projesinden
- ✅ Service Account Email: `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com`
- ⚠️ **ROL ATAMASI GEREKLİ:** Bu service account'a `dietcoop-432fa` projesinde rol atanmalı

### Mobil App Klasörü (`DietCoop Mobil App`)
- ❓ `web-panel-service-account.json` → `webdietcoop` projesinden (henüz yok mu?)
- ⚠️ **EĞER YOKSA:** `webdietcoop` projesinden yeni service account oluşturup indirmeniz gerekiyor
- ⚠️ **ROL ATAMASI GEREKLİ:** Bu service account'a `webdietcoop` projesinde rol atanmalı

---

## 📋 Yapılacaklar Listesi

### 1. Mobil App için Service Account (Eğer Yoksa)

**Eğer Mobil App klasöründe `web-panel-service-account.json` yoksa:**

1. [Firebase Console](https://console.firebase.google.com/) → `webdietcoop` projesini seçin
2. Sol menüden **⚙️ Project Settings** → **Service Accounts** sekmesine gidin
3. **"Generate New Private Key"** butonuna tıklayın
4. JSON dosyasını indirin
5. Dosyayı `web-panel-service-account.json` olarak **Mobil App klasörüne** kaydedin
6. Mobil App klasöründeki `.gitignore`'a ekleyin

---

### 2. Rol Atamaları (HER İKİSİ İÇİN ZORUNLU)

#### A) Web Panel → Mobil App Erişimi

**Service Account:** `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com`  
**Proje:** `dietcoop-432fa` (Mobil App)

**Adımlar:**
1. [Google Cloud Console](https://console.cloud.google.com/) → `dietcoop-432fa` projesini seçin
2. Sol menüden **IAM & Admin** → **IAM** sekmesine gidin
3. **"GRANT ACCESS"** (Erişim Ver) butonuna tıklayın
4. **"New principals"** alanına: `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com`
5. **"Select a role"** → **"Cloud Datastore User"** seçin
6. **"SAVE"** (Kaydet)

#### B) Mobil App → Web Panel Erişimi

**Service Account:** `firebase-adminsdk-XXXXX@webdietcoop.iam.gserviceaccount.com`  
**Proje:** `webdietcoop` (Web Panel)

**Adımlar:**
1. [Google Cloud Console](https://console.cloud.google.com/) → `webdietcoop` projesini seçin
2. Sol menüden **IAM & Admin** → **IAM** sekmesine gidin
3. **"GRANT ACCESS"** (Erişim Ver) butonuna tıklayın
4. **"New principals"** alanına service account email'ini girin (JSON dosyasındaki `client_email` değeri)
5. **"Select a role"** → **"Cloud Datastore User"** seçin
6. **"SAVE"** (Kaydet)

---

## 🔍 Kontrol

### Mobil App klasöründe `web-panel-service-account.json` var mı?

**Kontrol etmek için:**
- Mobil App klasörünü açın
- `web-panel-service-account.json` dosyası var mı bakın
- Varsa, içindeki `project_id` değerinin `webdietcoop` olduğundan emin olun

**Eğer yoksa:** Yukarıdaki "1. Mobil App için Service Account" adımlarını takip edin.

---

## ✅ Özet

| Durum | Açıklama |
|-------|----------|
| **Web Panel Service Account** | ✅ Var (`mobile-app-service-account.json`) |
| **Mobil App Service Account** | ❓ Kontrol et (`web-panel-service-account.json`) |
| **Rol Ataması (Web Panel → Mobil App)** | ⚠️ Yapılmalı (`dietcoop-432fa` projesinde) |
| **Rol Ataması (Mobil App → Web Panel)** | ⚠️ Yapılmalı (`webdietcoop` projesinde) |

---

## 🎯 Sonuç

**Yeni service account oluşturmanıza gerek YOK** (eğer Mobil App klasöründe `web-panel-service-account.json` varsa).

**Sadece rol ataması yapmanız gerekiyor:**
1. `dietcoop-432fa` projesinde → `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com` → `Cloud Datastore User`
2. `webdietcoop` projesinde → Mobil App'teki service account email'i → `Cloud Datastore User`








