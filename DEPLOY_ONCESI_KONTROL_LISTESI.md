# Deploy Öncesi Kontrol Listesi

## ⚠️ ÖNEMLİ: Deploy'dan Önce Yapılması Gerekenler

Service account'lar ve rol atamaları **deploy'dan ÖNCE** yapılmalıdır. Deploy işlemi sadece Cloud Functions kodunu Firebase'e gönderir, service account'ları oluşturmaz.

---

## ✅ Deploy Öncesi Yapılacaklar

### 1. Service Account Dosyaları

#### Web Panel Klasörü (`DietCoop Web Sitesi`)
- ✅ `mobile-app-service-account.json` → `dietcoop-432fa` projesinden indirilmiş olmalı
- ✅ Dosya klasörde mevcut mu? → **KONTROL ET**

#### Mobil App Klasörü (`DietCoop Mobil App`)
- ❓ `web-panel-service-account.json` → `webdietcoop` projesinden indirilmiş olmalı
- ❓ Dosya klasörde mevcut mu? → **KONTROL ET**

**Nasıl Kontrol Edilir:**
1. İlgili klasörü açın
2. JSON dosyasının varlığını kontrol edin
3. Dosyanın içindeki `project_id` değerini kontrol edin (doğru projeden mi?)

---

### 2. Google Cloud Console'da Rol Atamaları

#### A) Web Panel → Mobil App Erişimi

**Service Account:** `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com`  
**Proje:** `dietcoop-432fa` (Mobil App)  
**Rol:** `Cloud Datastore User`

**Kontrol:**
1. [Google Cloud Console](https://console.cloud.google.com/) → `dietcoop-432fa` projesini seçin
2. **IAM & Admin** → **IAM** sekmesine gidin
3. Service account email'ini arayın
4. Rol atanmış mı kontrol edin

**Eğer yoksa:**
- **GRANT ACCESS** → Email girin → **Cloud Datastore User** seçin → **SAVE**

#### B) Mobil App → Web Panel Erişimi

**Service Account:** `firebase-adminsdk-XXXXX@webdietcoop.iam.gserviceaccount.com`  
**Proje:** `webdietcoop` (Web Panel)  
**Rol:** `Cloud Datastore User`

**Kontrol:**
1. [Google Cloud Console](https://console.cloud.google.com/) → `webdietcoop` projesini seçin
2. **IAM & Admin** → **IAM** sekmesine gidin
3. Service account email'ini arayın (Mobil App'teki JSON dosyasındaki `client_email` değeri)
4. Rol atanmış mı kontrol edin

**Eğer yoksa:**
- **GRANT ACCESS** → Email girin → **Cloud Datastore User** seçin → **SAVE**

---

## 🚀 Deploy İşlemi

**Deploy sadece şunları yapar:**
- ✅ Cloud Functions kodunu Firebase'e gönderir
- ✅ Kod içindeki service account dosyalarını kullanır
- ❌ Service account'ları oluşturmaz
- ❌ Roller atamaz

**Deploy'dan sonra:**
- Cloud Functions çalışmaya başlar
- Service account'ları kullanarak cross-project erişim yapar
- **Eğer roller atanmamışsa:** Cloud Functions hata verecek!

---

## 📋 Kontrol Listesi

Deploy'dan önce şunları kontrol edin:

- [ ] Web Panel klasöründe `mobile-app-service-account.json` var mı?
- [ ] Mobil App klasöründe `web-panel-service-account.json` var mı?
- [ ] `dietcoop-432fa` projesinde service account'a rol atanmış mı?
- [ ] `webdietcoop` projesinde service account'a rol atanmış mı?
- [ ] Her iki service account dosyası da `.gitignore`'da mı?

---

## ⚠️ Hata Senaryosu

**Eğer deploy'dan sonra şu hatayı alırsanız:**

```
Error: 7 PERMISSION_DENIED: Missing or insufficient permissions
```

**Sebep:** Service account'a rol atanmamış!

**Çözüm:**
1. Google Cloud Console'a gidin
2. İlgili projede IAM sayfasını açın
3. Service account'a `Cloud Datastore User` rolü atayın
4. Cloud Functions'ı yeniden deploy edin (veya otomatik olarak çalışır)

---

## 🎯 Özet

| İşlem | Zaman | Nerede |
|-------|-------|--------|
| Service Account Oluşturma | Deploy'dan ÖNCE | Firebase Console |
| Service Account İndirme | Deploy'dan ÖNCE | Firebase Console → Download JSON |
| Rol Atama | Deploy'dan ÖNCE | Google Cloud Console → IAM |
| Deploy | Sonra | `firebase deploy --only functions` |

**Deploy'dan sonra service account'lar otomatik oluşmaz!** Manuel olarak oluşturup rol atamanız gerekiyor.








