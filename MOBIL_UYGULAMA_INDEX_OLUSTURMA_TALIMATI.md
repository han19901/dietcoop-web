# Mobil Uygulama Firestore Index Oluşturma Talimatı

## 📋 Gerekli Index

**Collection:** `dietPlans`  
**Proje:** `dietcoop-432fa` (Mobil Uygulama)

### Index Detayları:
- **Field 1:** `dietitianId` (Ascending)
- **Field 2:** `createdAt` (Ascending)

Bu index, web panel'den mobil uygulamadaki diyet planlarını tarih aralığına göre sorgularken kullanılır.

---

## 🚀 Yöntem 1: Firebase Console'dan Manuel Oluşturma (Önerilen)

### Adım 1: Firebase Console'a Giriş
1. [Firebase Console](https://console.firebase.google.com/) adresine git
2. **`dietcoop-432fa`** projesini seç (Mobil Uygulama projesi)

### Adım 2: Firestore Indexes Sayfasına Git
1. Sol menüden **"Firestore Database"** seçeneğine tıkla
2. Üst menüden **"Indexes"** sekmesine tıkla
3. **"Create Index"** butonuna tıkla

### Adım 3: Index Bilgilerini Gir
1. **Collection ID:** `dietPlans` yaz
2. **Query scope:** `Collection` seçili olsun

### Adım 4: Field'ları Ekle
**Field 1:**
- **Field path:** `dietitianId`
- **Order:** `Ascending` (▲)

**Field 2:**
- **"Add field"** butonuna tıkla
- **Field path:** `createdAt`
- **Order:** `Ascending` (▲)

### Adım 5: Index'i Oluştur
1. **"Create"** butonuna tıkla
2. Index oluşturulmaya başlanacak (birkaç dakika sürebilir)
3. Index durumu **"Enabled"** olduğunda hazır demektir

---

## 🔗 Yöntem 2: Hata Mesajındaki Linki Kullan (Hızlı)

Eğer sistem hata verirse, hata mesajında şu şekilde bir link olacak:

```
https://console.firebase.google.com/v1/r/project/dietcoop-432fa/firestore/indexes?create_composite=...
```

Bu linke tıklayarak direkt index oluşturma sayfasına gidebilirsin. Link otomatik olarak tüm ayarları doldurur, sadece **"Create"** butonuna tıklaman yeterli.

---

## ✅ Index Durumunu Kontrol Etme

1. Firebase Console → `dietcoop-432fa` projesi
2. Firestore Database → Indexes
3. Oluşturduğun index'i listede görebilirsin
4. **Status:** 
   - 🟡 **Building:** Index oluşturuluyor (birkaç dakika sürebilir)
   - 🟢 **Enabled:** Index hazır ve kullanılabilir

---

## 📝 Notlar

- Index oluşturma işlemi genellikle **2-10 dakika** sürer
- Index oluşturulana kadar sistem alternatif sorgu yöntemini kullanır (daha yavaş ama çalışır)
- Index hazır olduğunda sistem otomatik olarak optimize sorguyu kullanmaya başlar
- Index oluşturulduktan sonra sistem daha hızlı çalışacak

---

## 🔍 Index Gerekli Olan Sorgu

```typescript
// Bu sorgu için index gerekiyor:
dietPlans
  .where("dietitianId", "==", diyetisyenId)
  .where("createdAt", ">=", baslangicTarihi)
  .where("createdAt", "<=", bitisTarihi)
```

---

## 🆘 Sorun Giderme

**Index oluşturulmuyor mu?**
- Firebase Console'da doğru projede (`dietcoop-432fa`) olduğundan emin ol
- Collection adının `dietPlans` (büyük/küçük harf duyarlı) olduğunu kontrol et
- Field adlarının doğru olduğunu kontrol et: `dietitianId` ve `createdAt`

**Index oluşturuldu ama hala hata alıyorum?**
- Index'in durumunun **"Enabled"** olduğundan emin ol
- Birkaç dakika bekle, index'in tamamen aktif olması zaman alabilir
- Tarayıcıyı yenile ve tekrar dene

---

## 📞 Destek

Index oluşturma ile ilgili sorun yaşarsan, Firebase Console'daki hata mesajlarını kontrol et veya Firebase dokümantasyonuna bak.
