# Service Account Proje Açıklaması

## ⚠️ ÖNEMLİ: Service Account'lar Projelerinde Görünür

Service account'lar **kendi projelerinde** görünür. Deploy işlemi bunu değiştirmez!

---

## 📋 Mevcut Durum

### Web Panel Klasörü (`DietCoop Web Sitesi`)

**Dosya:** `mobile-app-service-account.json`  
**Proje Kaynağı:** `dietcoop-432fa` (Mobil App projesi)  
**Service Account Email:** `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com`

**Bu service account nerede görünür?**
- ✅ `dietcoop-432fa` projesinde görünür
- ❌ `webdietcoop` projesinde görünmez (normal!)

**Neden?**
- Bu service account Mobil App projesinden (`dietcoop-432fa`) oluşturuldu
- Web Panel'in Mobil App'e erişmesi için kullanılıyor
- Ama kendisi `webdietcoop` projesine ait değil

---

### Mobil App Klasörü (`DietCoop Mobil App`)

**Dosya:** `web-panel-service-account.json` (henüz yok, oluşturulacak)  
**Proje Kaynağı:** `webdietcoop` (Web Panel projesi)  
**Service Account Email:** `firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com`

**Bu service account nerede görünür?**
- ✅ `webdietcoop` projesinde görünür (şu anda görünüyor!)
- ❌ `dietcoop-432fa` projesinde görünmez (normal!)

**Neden?**
- Bu service account Web Panel projesinden (`webdietcoop`) oluşturuldu
- Mobil App'in Web Panel'e erişmesi için kullanılacak
- Ama kendisi `dietcoop-432fa` projesine ait değil

---

## 🎯 Karışıklık Açıklaması

**Yanlış Beklenti:**
> "`mobile-app-service-account.json` dosyası `webdietcoop` projesinde görünmeli"

**Doğru Durum:**
> "`mobile-app-service-account.json` dosyası `dietcoop-432fa` projesinde görünür"

**Sebep:**
- Service account'lar **kendi projelerinde** görünür
- `mobile-app-service-account.json` → `dietcoop-432fa` projesinden → `dietcoop-432fa` projesinde görünür
- `web-panel-service-account.json` → `webdietcoop` projesinden → `webdietcoop` projesinde görünür

---

## ✅ Şu Anki Durum Kontrolü

### `webdietcoop` Projesinde Görünen Service Account

```
firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com
```

**Bu doğru!** Bu service account:
- ✅ `webdietcoop` projesine ait
- ✅ Mobil App klasörüne indirilecek (`web-panel-service-account.json`)
- ✅ Mobil App'in Web Panel'e erişmesi için kullanılacak

---

### `dietcoop-432fa` Projesinde Görünen Service Account

```
firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com
```

**Bu da doğru!** Bu service account:
- ✅ `dietcoop-432fa` projesine ait
- ✅ Web Panel klasöründe mevcut (`mobile-app-service-account.json`)
- ✅ Web Panel'in Mobil App'e erişmesi için kullanılıyor

---

## 📊 Özet Tablo

| Dosya | Proje Kaynağı | Nerede Görünür | Kullanım Amacı |
|-------|--------------|----------------|----------------|
| `mobile-app-service-account.json` | `dietcoop-432fa` | `dietcoop-432fa` projesinde | Web Panel → Mobil App |
| `web-panel-service-account.json` | `webdietcoop` | `webdietcoop` projesinde | Mobil App → Web Panel |

---

## ⚠️ Deploy İşlemi

**Deploy işlemi service account'ları görünür yapmaz!**

- Service account'lar zaten Google Cloud'da mevcut
- Deploy sadece Cloud Functions kodunu gönderir
- Cloud Functions kodunda service account dosyaları kullanılır
- Service account'lar projelerinde görünmeye devam eder

---

## ✅ Kontrol Listesi

### `webdietcoop` Projesinde:
- [x] `firebase-adminsdk-fbsvc@webdietcoop.iam.gserviceaccount.com` görünüyor ✅
- [ ] JSON key'i indirildi mi? (`web-panel-service-account.json`)
- [ ] Rol ataması yapıldı mı? (`Cloud Datastore User`)

### `dietcoop-432fa` Projesinde:
- [ ] `firebase-adminsdk-fbsvc@dietcoop-432fa.iam.gserviceaccount.com` görünüyor mu? (Kontrol et)
- [x] JSON key'i indirildi mi? (`mobile-app-service-account.json`) ✅
- [ ] Rol ataması yapıldı mı? (`Cloud Datastore User`)

---

## 🎯 Sonuç

**Her şey normal!** `mobile-app-service-account.json` dosyasının `webdietcoop` projesinde görünmemesi normaldir çünkü bu service account `dietcoop-432fa` projesine aittir.

**Yapılacaklar:**
1. `webdietcoop` projesindeki service account'un JSON key'ini indir → `web-panel-service-account.json`
2. Her iki projede de rol ataması yap (`Cloud Datastore User`)
3. Deploy et

Deploy işlemi service account'ları görünür yapmaz, sadece Cloud Functions kodunu gönderir.








