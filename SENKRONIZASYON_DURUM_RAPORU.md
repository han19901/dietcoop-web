# Senkronizasyon Durum Raporu

## ✅ Test Sonuçları

### 1. Service Account Durumu
- ✅ **Mobil App Service Account ÇALIŞIYOR**
- ✅ Mobil App'ten 3 diyetisyen başarıyla okundu:
  - `B2yiROSu02b9yYZsIUEGISPlQ8l1`: Ayşe Tüfekci (diyetisyen@diyet.com)
  - `ST0MqMOGTDTwRyefE5QfxDcLdnG2`: Omer Tufekci (oguzhan90tufekci@gmail.com)
  - `kmJgoZRj9LQzKHsFbD2ZlrHsEZB3`: Çağrı Aslan (berkeridil6@gmail.com)

### 2. Cloud Functions Durumu
- ✅ `getDiyetisyen` → Deploy edildi
- ✅ `getAktifDanisanSayisi` → Deploy edildi
- ✅ `getPasifDanisanSayisi` → Deploy edildi
- ✅ `syncDiyetisyenToMobileApp` → Deploy edildi (Web Panel → Mobil App)

### 3. Eksik Olan
- ❌ **Mobil App'ten Web Panel'e senkronizasyon Cloud Function'ı YOK**
  - Bu Cloud Function Mobil App projesinde (`dietcoop-432fa`) deploy edilmeli
  - Mobil App'teki `users` collection'ında diyetisyen değiştiğinde Web Panel'e senkronize etmeli

---

## 🔍 Sorun Analizi

### Neden Diyetisyenler Web Panel'de Yok?

1. **Mobil App'ten Web Panel'e senkronizasyon Cloud Function'ı eksik**
   - Mobil App projesinde (`dietcoop-432fa`) Cloud Function deploy edilmemiş
   - Bu Function, Mobil App'teki `users` collection'ında diyetisyen değişikliklerini dinleyip Web Panel'e senkronize etmeli

2. **Mevcut durum:**
   - Web Panel → Mobil App senkronizasyonu VAR ✅
   - Mobil App → Web Panel senkronizasyonu YOK ❌

---

## 📋 Yapılması Gerekenler

### Faz 3: Mobil App'ten Web Panel'e Senkronizasyon

**Mobil App Projesinde (`dietcoop-432fa`):**

1. **Cloud Functions klasörü oluştur** (eğer yoksa)
   ```bash
   cd "DietCoop Mobil App"
   firebase init functions
   ```

2. **Service Account oluştur ve indir**
   - `webdietcoop` projesinden service account oluştur
   - JSON key'i indir → `web-panel-service-account.json`
   - `functions` klasörüne kopyala

3. **Cloud Function oluştur**
   - `functions/src/index.ts` dosyasına `syncDietitianToWebPanel` function'ı ekle
   - Bu function `users/{userId}` collection'ını dinleyecek
   - Diyetisyen (`role === 'dietitian'`) değiştiğinde Web Panel'e senkronize edecek

4. **Deploy et**
   ```bash
   firebase deploy --only functions
   ```

---

## 🧪 Test Etme

### Cloud Functions'ları Test Et

**1. getDiyetisyen Test:**
```bash
curl -X POST https://us-central1-webdietcoop.cloudfunctions.net/getDiyetisyen \
  -H "Content-Type: application/json" \
  -d '{"diyetisyenId": "B2yiROSu02b9yYZsIUEGISPlQ8l1"}'
```

**2. getAktifDanisanSayisi Test:**
```bash
curl -X POST https://us-central1-webdietcoop.cloudfunctions.net/getAktifDanisanSayisi \
  -H "Content-Type: application/json" \
  -d '{"diyetisyenId": "B2yiROSu02b9yYZsIUEGISPlQ8l1"}'
```

**3. Manuel Senkronizasyon Test:**
- Mobil App'te bir diyetisyen bilgisini güncelle
- Cloud Function loglarını kontrol et
- Web Panel'de diyetisyenin güncellendiğini kontrol et

---

## 📝 Cloud Function Kodu (Mobil App için)

```typescript
// functions/src/index.ts (Mobil App projesinde)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";

// Mobil App Firebase Admin
admin.initializeApp();

// Web Panel Service Account
const webPanelServiceAccount = require(path.join(__dirname, "../web-panel-service-account.json"));
admin.initializeApp({
  credential: admin.credential.cert(webPanelServiceAccount),
  databaseURL: "https://webdietcoop.firebaseio.com",
}, "webPanel");

const webPanelDb = admin.app("webPanel").firestore();

// Diyetisyen değiştiğinde Web Panel'e senkronize et
export const syncDietitianToWebPanel = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const userData = change.after.exists ? change.after.data() : null;
    const userId = context.params.userId;

    // Sadece diyetisyenleri senkronize et
    if (userData?.role !== "dietitian") {
      return;
    }

    try {
      if (userData) {
        const syncData: any = {
          id: userId,
          email: userData.email,
          adSoyad: `${userData.name || ""} ${userData.surname || ""}`.trim(),
          telefon: userData.phone || "",
          aktifDanisanSayisi: userData.aktifDanisanSayisi || 0,
          pasifDanisanSayisi: userData.pasifDanisanSayisi || 0,
          olusturmaTarihi: userData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
          kayitYeri: "mobil",
          mobilUygulamadanKayit: true,
          onayDurumu: userData.status === "approved" ? "onaylandi" : "beklemede",
        };

        await webPanelDb.collection("diyetisyenler")
          .doc(userId)
          .set(syncData, { merge: true });

        console.log(`Diyetisyen ${userId} web panele senkronize edildi`);
      }
    } catch (error: any) {
      console.error("Senkronizasyon hatası:", error);
      // Hata durumunda throw etme, log'la
    }
  });
```

---

## ✅ Sonuç

- Service Account çalışıyor ✅
- Cloud Functions (Web Panel tarafı) çalışıyor ✅
- Mobil App'ten Web Panel'e senkronizasyon eksik ❌

**Sonraki Adım:** Mobil App projesinde Cloud Function deploy etmek.







