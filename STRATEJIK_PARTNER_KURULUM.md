# Stratejik Partner Dashboard Kurulum Talimatları

## 1. Firebase Authentication - Kullanıcı Oluşturma

1. Firebase Console'a gidin: https://console.firebase.google.com
2. Projenizi seçin
3. **Authentication** > **Users** > **Add user**
4. Şu bilgileri girin:
   - **Email:** withgrower@bagertek.com
   - **Password:** 1123456

## 2. Firestore - Stratejik Partner Giriş Kaydı

Firestore Console'da `stratejikPartnerGiris` koleksiyonuna yeni bir doküman ekleyin:

**Koleksiyon:** `stratejikPartnerGiris`
**Doküman ID:** (otomatik veya `withgrower`)

**Alanlar:**
```
email: "withgrower@bagertek.com"
firmaAdi: "With Grower"
aktif: true
olusturmaTarihi: (şu anki tarih - Timestamp)
```

## 3. Grower Logo

`public/growerdisilogo.svg` dosyası placeholder olarak oluşturuldu. Gerçek logonuzu eklemek için:
- `public/growerdisilogo.png` dosyasını ekleyin VEYA
- `public/growerdisilogo.svg` dosyasını kendi logonuzla değiştirin

## 4. Erişim

- **Giriş URL:** https://your-domain.com/stratejikpartner
- **Email:** withgrower@bagertek.com
- **Şifre:** 1123456

## 5. Firestore Kurallarını Güncelleme

```bash
firebase deploy --only firestore:rules
```

## 6. Firestore Index'lerini Güncelleme

```bash
firebase deploy --only firestore:indexes
```
