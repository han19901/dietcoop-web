# Service Account Rol Atama Talimatları

## ⚠️ ÖNEMLİ
Service account'lar varsayılan olarak **hiçbir role sahip değildir**. Cross-project erişim için manuel rol ataması yapmanız **ZORUNLUDUR**.

---

## 📋 Gerekli Rol Atamaları

### 1️⃣ Web Panel → Mobil App Erişimi

**Service Account:** `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com`  
**Proje:** `dietcoop-432fa` (Mobil App)  
**Dosya:** `mobile-app-service-account.json`

**Gerekli Roller:**
- ✅ `Cloud Datastore User` (`roles/datastore.user`) - Firestore okuma/yazma için
- VEYA
- ✅ `Firebase Admin` (`roles/firebase.admin`) - Tüm Firebase servislerine erişim (daha geniş)

**Nasıl Atanır:**

#### Yöntem 1: Google Cloud Console (Önerilen)

1. [Google Cloud Console](https://console.cloud.google.com/) → `dietcoop-432fa` projesini seçin
2. Sol menüden **"IAM & Admin"** → **"IAM"** sekmesine gidin
3. **"GRANT ACCESS"** (Erişim Ver) butonuna tıklayın
4. **"New principals"** alanına service account email'ini girin:
   ```
   firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com
   ```
5. **"Select a role"** menüsünden **"Cloud Datastore User"** seçin
6. **"SAVE"** (Kaydet) butonuna tıklayın

#### Yöntem 2: gcloud CLI

```bash
# dietcoop-432fa projesine geç
gcloud config set project dietcoop-432fa

# Service account'a Cloud Datastore User rolü ver
gcloud projects add-iam-policy-binding dietcoop-432fa \
    --member="serviceAccount:firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com" \
    --role="roles/datastore.user"
```

---

### 2️⃣ Mobil App → Web Panel Erişimi

**Service Account:** `firebase-adminsdk-XXXXX@webdietcoop.iam.gserviceaccount.com`  
**Proje:** `webdietcoop` (Web Panel)  
**Dosya:** `web-panel-service-account.json` (Mobil App klasöründe olacak)

**Gerekli Roller:**
- ✅ `Cloud Datastore User` (`roles/datastore.user`) - Firestore yazma için
- VEYA
- ✅ `Firebase Admin` (`roles/firebase.admin`) - Tüm Firebase servislerine erişim

**Nasıl Atanır:**

#### Yöntem 1: Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → `webdietcoop` projesini seçin
2. Sol menüden **"IAM & Admin"** → **"IAM"** sekmesine gidin
3. **"GRANT ACCESS"** (Erişim Ver) butonuna tıklayın
4. **"New principals"** alanına service account email'ini girin:
   ```
   firebase-adminsdk-XXXXX@webdietcoop.iam.gserviceaccount.com
   ```
   (XXXXX yerine gerçek service account ID'si gelecek)
5. **"Select a role"** menüsünden **"Cloud Datastore User"** seçin
6. **"SAVE"** (Kaydet) butonuna tıklayın

#### Yöntem 2: gcloud CLI

```bash
# webdietcoop projesine geç
gcloud config set project webdietcoop

# Service account'a Cloud Datastore User rolü ver
gcloud projects add-iam-policy-binding webdietcoop \
    --member="serviceAccount:firebase-adminsdk-XXXXX@webdietcoop.iam.gserviceaccount.com" \
    --role="roles/datastore.user"
```

---

## 🔍 Rol Kontrolü

Rol atamasının başarılı olup olmadığını kontrol etmek için:

1. Google Cloud Console → IAM sayfasına gidin
2. Service account email'ini arayın
3. Atanan rolleri kontrol edin

---

## 📝 Özet Tablo

| Service Account | Proje (Rol Atanacak) | Gerekli Rol | Kullanım Amacı |
|----------------|---------------------|-------------|----------------|
| `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com` | `dietcoop-432fa` | `roles/datastore.user` | Web Panel → Mobil App okuma/yazma |
| `firebase-adminsdk-XXXXX@webdietcoop.iam.gserviceaccount.com` | `webdietcoop` | `roles/datastore.user` | Mobil App → Web Panel yazma |

---

## ⚠️ Güvenlik Notları

1. **En Az Ayrıcalık İlkesi:** Sadece gerekli rolleri atayın
2. **Cloud Datastore User vs Firebase Admin:**
   - `roles/datastore.user` → Sadece Firestore erişimi (ÖNERİLEN)
   - `roles/firebase.admin` → Tüm Firebase servisleri (daha geniş, dikkatli kullanın)
3. **Test:** Rol atamasından sonra Cloud Functions'ı test edin

---

## 🧪 Test

Rol atamasından sonra Cloud Functions'ı deploy edip test edin:

```bash
# Web Panel klasöründe
cd "DietCoop Web Sitesi"
firebase deploy --only functions
```

Hata alırsanız:
- Service account email'ini kontrol edin
- Rol atamasının doğru projede yapıldığından emin olun
- Google Cloud Console'da IAM sayfasını kontrol edin








