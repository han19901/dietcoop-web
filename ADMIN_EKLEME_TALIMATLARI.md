# Super Admin Ekleme Talimatları

Ömer Oğuzhan Tüfekci için super admin kaydı ekleme yöntemleri.

## Bilgiler
- **UID**: `R6Ak5OQYmPgdrz4vFZP0k9lb36n2`
- **Email**: `tufekcioguzhan@gmail.com`
- **Ad Soyad**: `Ömer Oğuzhan Tüfekci`
- **Rol**: `superAdmin`

---

## Yöntem 1: Firebase Console'dan Manuel Ekleme (ÖNERİLEN)

Bu en kolay ve güvenli yöntemdir.

### Adımlar:

1. **Firebase Console'a gidin**
   - https://console.firebase.google.com/
   - Projenizi seçin: `webdietcoop`

2. **Firestore Database'e gidin**
   - Sol menüden "Firestore Database" seçin

3. **`adminler` koleksiyonuna gidin**
   - Koleksiyonlar listesinden `adminler` koleksiyonunu bulun
   - Eğer yoksa, "Koleksiyon ekle" ile oluşturun

4. **Yeni doküman ekleyin**
   - "Doküman ekle" butonuna tıklayın
   - **Doküman ID**: `R6Ak5OQYmPgdrz4vFZP0k9lb36n2` (UID ile aynı olmalı!)

5. **Aşağıdaki alanları ekleyin:**

```json
{
  "email": "tufekcioguzhan@gmail.com",
  "Name Surname": "Ömer Oğuzhan Tüfekci",
  "adSoyad": "Ömer Oğuzhan Tüfekci",
  "role": "superAdmin",
  "rol": "superAdmin",
  "status": "approved",
  "aktif": true,
  "olusturmaTarihi": [Firebase Timestamp - şu anki zaman],
  "createdAt": [Firebase Timestamp - şu anki zaman],
  "sonGirisTarihi": [Firebase Timestamp - şu anki zaman],
  "updateAt": [Firebase Timestamp - şu anki zaman]
}
```

6. **Alan tipleri:**
   - `email`: string
   - `Name Surname`: string
   - `adSoyad`: string
   - `role`: string
   - `rol`: string
   - `status`: string
   - `aktif`: boolean
   - `olusturmaTarihi`: timestamp (şu anki zaman)
   - `createdAt`: timestamp (şu anki zaman)
   - `sonGirisTarihi`: timestamp (şu anki zaman)
   - `updateAt`: timestamp (şu anki zaman)

7. **Kaydedin ve test edin**
   - "Kaydet" butonuna tıklayın
   - Artık admin olarak giriş yapabilirsiniz!

---

## Yöntem 2: Node.js Script ile Ekleme

Firebase Admin SDK kullanarak otomatik ekleme.

### Gereksinimler:
- Node.js yüklü olmalı
- Firebase Admin SDK service account key dosyası

### Adımlar:

1. **Firebase Admin SDK'yı yükleyin:**
```bash
npm install firebase-admin
```

2. **Service Account Key dosyasını alın:**
   - Firebase Console > Project Settings > Service Accounts
   - "Generate new private key" butonuna tıklayın
   - İndirilen JSON dosyasını proje köküne `serviceAccountKey.json` olarak kaydedin

3. **Scripti çalıştırın:**
```bash
node scripts/addSuperAdmin.js
```

4. **Başarı mesajını kontrol edin:**
   - Script başarılı olursa "✅ Admin kaydı başarıyla eklendi!" mesajını göreceksiniz

---

## Yöntem 3: Web Arayüzünden Ekleme

Şifrenizi biliyorsanız web arayüzünden ekleyebilirsiniz.

### Adımlar:

1. **Tarayıcıda şu adrese gidin:**
   ```
   http://localhost:5173/admin/add-admin
   ```
   (veya production URL'iniz)

2. **Şifrenizi girin**
   - Firebase Auth şifrenizi girin

3. **"Admin Kaydını Ekle" butonuna tıklayın**
   - Sistem otomatik olarak admin kaydınızı ekleyecektir

---

## Sorun Giderme

### "Bu kullanıcı admin yetkisine sahip değil" hatası
- Firestore'da `adminler` koleksiyonunda UID'nizle kayıt olup olmadığını kontrol edin
- Kayıt varsa, `status` alanının `approved` olduğundan emin olun
- `aktif` alanının `true` olduğundan emin olun

### "Admin hesabı aktif değil" hatası
- Firestore'daki kaydınızda `status: 'approved'` ve `aktif: true` olduğundan emin olun

### Giriş yapamıyorum
1. Firebase Auth'da hesabınızın aktif olduğundan emin olun
2. Firestore'da `adminler` koleksiyonunda kaydınızın olduğundan emin olun
3. Kayıt bilgilerinin doğru olduğundan emin olun (UID, email, status, aktif)

---

## Önemli Notlar

- **UID önemli**: Doküman ID'si mutlaka Firebase Auth UID'nizle aynı olmalı (`R6Ak5OQYmPgdrz4vFZP0k9lb36n2`)
- **Status**: `status` alanı mutlaka `'approved'` olmalı
- **Aktif**: `aktif` alanı mutlaka `true` olmalı
- **Rol**: `role` veya `rol` alanı `'superAdmin'` olmalı

---

## Kontrol Listesi

Admin kaydınızı ekledikten sonra kontrol edin:

- [ ] Firestore'da `adminler` koleksiyonunda kaydınız var
- [ ] Doküman ID'si UID'nizle aynı (`R6Ak5OQYmPgdrz4vFZP0k9lb36n2`)
- [ ] `status` alanı `'approved'`
- [ ] `aktif` alanı `true`
- [ ] `role` veya `rol` alanı `'superAdmin'`
- [ ] `email` alanı doğru (`tufekcioguzhan@gmail.com`)
- [ ] `adSoyad` veya `Name Surname` alanı doğru (`Ömer Oğuzhan Tüfekci`)
- [ ] Giriş yapabiliyorsunuz

---

## Destek

Sorun yaşıyorsanız:
1. Firebase Console'dan Firestore veritabanını kontrol edin
2. Browser console'da hata mesajlarını kontrol edin
3. Firebase Auth'da hesabınızın aktif olduğundan emin olun












