# Oransal Faturalandırma Sistemi Planı (Güncellenmiş)

## 📋 Genel Bakış

Mevcut sistemde diyetisyenler ayın başından sonuna kadar tüm ay için faturalandırılıyor. Yeni sistemde, diyetisyenin **ilk aktif diyet planı oluşturduğu tarihten** ayın sonuna kadar olan gün sayısına göre oransal faturalandırma yapılacak.

## 🎯 Temel Prensipler

1. **İlk Aktif Diyet Planı Tarihi = Faturalandırmanın Başlangıcı**
   - Diyetisyen kayıt tarihi değil, **ilk aktif diyet planı oluşturduğu tarih** baz alınır
   - Sistem zaten aktif diyet planlarını takip ediyor, bu baz alınacak

2. **Aktiflik Durumu Loglama YOK**
   - Sistemde aktif olması için zaten danışanı olması lazım
   - Danışan başına ücret kesildiği için aktiflik logu gereksiz
   - Pasifleştirme/aktifleştirme durumları takip edilmeyecek

3. **Vergi Numarası Önceliği**
   - Eğer diyetisyenin vergi numarası varsa, faturayı vergi numarasına göre kes
   - Vergi numarası yoksa TC Kimlik numarasına göre kes

4. **Kullanım Gün Sayısı Gösterimi**
   - Fatura detayında diyetisyene kullanım gün sayısı gösterilecek
   - "X gün aktif olduğunuz için oransal faturalandırma yapılmıştır" açıklaması

## 📊 Senaryolar

### Senaryo 1: Ayın Başında İlk Diyet Planı
- **Diyetisyen Kayıt Tarihi:** 1 Ocak 2024
- **İlk Aktif Diyet Planı Tarihi:** 1 Ocak 2024
- **Fatura Dönemi:** Ocak 2024
- **Aktif Gün Sayısı:** 31 gün (1 Ocak - 31 Ocak)
- **Hesaplama:** 
  - Normal Tutar: 10 danışan × 199 TL = 1,990 TL
  - Oransal Tutar: 1,990 TL / 31 × 31 = **1,990 TL** ✅

### Senaryo 2: Ayın Ortasında İlk Diyet Planı
- **Diyetisyen Kayıt Tarihi:** 1 Ocak 2024
- **İlk Aktif Diyet Planı Tarihi:** 15 Ocak 2024
- **Fatura Dönemi:** Ocak 2024
- **Aktif Gün Sayısı:** 17 gün (15 Ocak - 31 Ocak)
- **Hesaplama:**
  - Normal Tutar: 10 danışan × 199 TL = 1,990 TL
  - Oransal Tutar: 1,990 TL / 31 × 17 = **1,090.32 TL** ✅

### Senaryo 3: Ayın Sonunda İlk Diyet Planı
- **Diyetisyen Kayıt Tarihi:** 1 Ocak 2024
- **İlk Aktif Diyet Planı Tarihi:** 28 Ocak 2024
- **Fatura Dönemi:** Ocak 2024
- **Aktif Gün Sayısı:** 4 gün (28 Ocak - 31 Ocak)
- **Hesaplama:**
  - Normal Tutar: 10 danışan × 199 TL = 1,990 TL
  - Oransal Tutar: 1,990 TL / 31 × 4 = **256.77 TL** ✅

### Senaryo 4: Kayıt Sonrası İlk Diyet Planı (ÖNEMLİ)
- **Diyetisyen Kayıt Tarihi:** 20 Ocak 2024
- **İlk Aktif Diyet Planı Tarihi:** 25 Ocak 2024 (ilk danışanına diyet planı oluşturdu)
- **Fatura Dönemi:** Ocak 2024
- **Aktif Gün Sayısı:** 7 gün (25 Ocak - 31 Ocak)
- **Hesaplama:**
  - Normal Tutar: 1 danışan × 199 TL = 199 TL
  - Oransal Tutar: 199 TL / 31 × 7 = **44.94 TL** ✅
- **Not:** Kayıt tarihi (20 Ocak) değil, ilk aktif diyet planı tarihi (25 Ocak) baz alınır

### Senaryo 5: Diyet Planı Farklı Tarihlerde
- **Diyetisyen Kayıt Tarihi:** 1 Ocak 2024
- **İlk Aktif Diyet Planı Tarihi:** 8 Ocak 2024 (Danışan A için)
- **İkinci Aktif Diyet Planı Tarihi:** 15 Ocak 2024 (Danışan B için)
- **Fatura Dönemi:** Ocak 2024
- **Aktif Gün Sayısı:** 24 gün (8 Ocak - 31 Ocak) - İlk aktif diyet planı tarihi baz alınır
- **Hesaplama:**
  - Normal Tutar: 2 danışan × 199 TL = 398 TL
  - Oransal Tutar: 398 TL / 31 × 24 = **307.87 TL** ✅
- **Not:** Her danışan için ayrı tarih olsa bile, ilk aktif diyet planı tarihi baz alınır

## 🔧 Teknik Detaylar

### 1. İlk Aktif Diyet Planı Tarihi Hesaplama

```typescript
function hesaplaIlkAktifDiyetPlaniTarihi(
  diyetPlanlari: DiyetPlani[]
): Date | null {
  if (diyetPlanlari.length === 0) return null;
  
  // Tüm diyet planlarını tarihe göre sırala
  const siraliPlanlar = diyetPlanlari.sort((a, b) => 
    a.olusturmaTarihi.toMillis() - b.olusturmaTarihi.toMillis()
  );
  
  // En eski aktif diyet planının tarihini döndür
  return siraliPlanlar[0].olusturmaTarihi.toDate();
}
```

### 2. Aktif Gün Sayısı Hesaplama

```typescript
function hesaplaAktifGunSayisi(
  ilkAktifDiyetPlaniTarihi: Date,
  faturaDonemi: { ay: number; yil: number }
): number {
  // Ayın son gününü hesapla
  const ayinSonGunu = new Date(faturaDonemi.yil, faturaDonemi.ay, 0);
  
  // İlk aktif diyet planı tarihi ayın ilk gününden önceyse, ayın ilk gününü al
  const ayinIlkGunu = new Date(faturaDonemi.yil, faturaDonemi.ay - 1, 1);
  const baslangicTarihi = ilkAktifDiyetPlaniTarihi > ayinIlkGunu 
    ? ilkAktifDiyetPlaniTarihi 
    : ayinIlkGunu;
  
  // Bitiş tarihi ayın son günü
  const bitisTarihi = ayinSonGunu;
  
  // Gün farkını hesapla (inclusive: başlangıç ve bitiş dahil)
  const gunFarki = Math.ceil(
    (bitisTarihi.getTime() - baslangicTarihi.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(1, gunFarki + 1); // En az 1 gün
}
```

### 3. Oransal Tutar Hesaplama

```typescript
function hesaplaOransalTutar(
  normalTutar: number,
  aktifGunSayisi: number,
  ayinToplamGunu: number
): number {
  const oransalTutar = (normalTutar / ayinToplamGunu) * aktifGunSayisi;
  return Math.round(oransalTutar * 100) / 100; // 2 ondalık basamağa yuvarla
}
```

### 4. Ayın Toplam Gün Sayısı

```typescript
function getAyinToplamGunu(ay: number, yil: number): number {
  // Ayın son gününü al (0. gün = önceki ayın son günü)
  return new Date(yil, ay, 0).getDate();
}
```

## 📝 Veri Yapısı Değişiklikleri

### Fatura Interface Güncellemesi

```typescript
export interface Fatura {
  // ... mevcut alanlar
  
  // YENİ ALANLAR
  oransalHesaplama: {
    aktif: boolean; // Oransal hesaplama yapıldı mı?
    ilkAktifDiyetPlaniTarihi: Timestamp; // İlk aktif diyet planı oluşturulma tarihi
    aktifGunSayisi: number; // Ay içinde aktif olunan gün sayısı
    ayinToplamGunu: number; // Ayın toplam gün sayısı (28, 29, 30, 31)
    normalTutar: number; // Oransal hesaplama öncesi tutar
    oransalTutar: number; // Oransal hesaplama sonrası tutar (fatura tutarı)
  };
  
  // Vergi numarası bilgisi (eğer varsa)
  faturaBilgileri?: {
    vergiNumarasi?: string;
    tcKimlikNo?: string;
    vergiDairesi?: string;
    adres?: string;
    sehir?: string;
    postaKodu?: string;
  };
}
```

## 🔄 İş Akışı

### Fatura Oluşturma Süreci

1. **Dönem Belirleme**
   - Fatura dönemi: Ay/Yıl (örn: Ocak 2024)

2. **Diyet Planlarını Getir**
   - `getDiyetPlanlariByAy` fonksiyonu ile ay içindeki tüm diyet planlarını getir
   - Mobil uygulamadan çekilen diyet planları

3. **İlk Aktif Diyet Planı Tarihini Bul**
   - Tüm diyet planlarını tarihe göre sırala
   - En eski diyet planının tarihini al
   - Bu tarih faturalandırmanın başlangıcı olacak

4. **Aktif Gün Sayısını Hesapla**
   - İlk aktif diyet planı tarihinden ayın sonuna kadar olan gün sayısı
   - Formül: `(Ayın Son Günü - İlk Aktif Diyet Planı Tarihi) + 1`

5. **Normal Tutar Hesaplama**
   - Mevcut sistem: Danışan sayısı × Paket fiyatı
   - Her danışan için 1 kez faturalandırma (ay içinde kaç plan yapılırsa yapılsın)

6. **Oransal Tutar Hesaplama**
   - Normal Tutar / Ayın Toplam Günü × Aktif Gün Sayısı
   - 2 ondalık basamağa yuvarla

7. **Vergi Numarası Kontrolü**
   - Diyetisyenin vergi numarası varsa faturaya ekle
   - Vergi numarası yoksa TC Kimlik numarasını kullan

8. **Fatura Kaydetme**
   - Oransal tutarı `toplamTutar` olarak kaydet
   - `oransalHesaplama` bilgilerini kaydet
   - `faturaBilgileri` (vergi/TC kimlik) bilgilerini kaydet

## 🎨 UI Değişiklikleri

### Admin Faturalar Sayfası
- Faturada "Oransal Hesaplama" badge'i göster
- Aktif gün sayısı ve normal tutar bilgisi
- Tooltip: "Bu fatura oransal hesaplama ile oluşturulmuştur"
- İlk aktif diyet planı tarihi bilgisi

### Diyetisyen Faturalar Sayfası
- Faturada aktif gün sayısı bilgisi
- "X gün aktif olduğunuz için oransal faturalandırma yapılmıştır" açıklaması
- İlk aktif diyet planı tarihi bilgisi

### Fatura Detay Modal
```
Normal Tutar: 1,990 TL
Aktif Gün: 17 / 31
Oransal Tutar: 1,090.32 TL
Hesaplama: 1,990 / 31 × 17 = 1,090.32 TL
İlk Aktif Diyet Planı: 15 Ocak 2024
```

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Mevcut Faturalar
- **Karar:** Mevcut faturalar için geriye dönük hesaplama yapılmayacak
- Sadece yeni oluşturulan faturalar için geçerli

### 2. Diyet Planı Tarihi
- Mobil uygulamadan çekilen diyet planlarının `olusturmaTarihi` alanı kullanılacak
- Eğer tarih bilgisi yoksa, diyetisyenin kayıt tarihi kullanılabilir (fallback)

### 3. Ayın Gün Sayısı
- Şubat: 28/29 gün (artık yıl kontrolü)
- Nisan, Haziran, Eylül, Kasım: 30 gün
- Diğer aylar: 31 gün
- JavaScript ile dinamik hesaplama: `new Date(yil, ay, 0).getDate()`

### 4. Edge Cases
- **Diyet planı yoksa:** Diyetisyenin kayıt tarihi baz alınır (fallback)
- **Ayın son günü diyet planı:** 1 gün aktif sayılır
- **Ayın ilk günü diyet planı:** Tüm ay aktif sayılır

### 5. Vergi Numarası Önceliği
- Önce `vergiNumarasi` kontrolü yap
- Varsa faturaya vergi bilgilerini ekle
- Yoksa `tcKimlikNo` kullan

## 🚀 Uygulama Adımları

### Faz 1: Veri Yapısı Güncelleme
1. `Fatura` interface'ine `oransalHesaplama` alanı ekle
2. `Fatura` interface'ine `faturaBilgileri` alanı ekle
3. `faturaOlusturmaService.ts` güncelle

### Faz 2: Utility Fonksiyonları
1. `faturaUtils.ts` içine `hesaplaIlkAktifDiyetPlaniTarihi` fonksiyonu ekle
2. `faturaUtils.ts` içine `hesaplaAktifGunSayisi` fonksiyonu ekle
3. `faturaUtils.ts` içine `hesaplaOransalTutar` fonksiyonu ekle
4. `faturaUtils.ts` içine `getAyinToplamGunu` fonksiyonu ekle

### Faz 3: Fatura Oluşturma Güncelleme
1. `createFaturaForDiyetisyen` fonksiyonunu güncelle
2. Diyet planlarını getir
3. İlk aktif diyet planı tarihini bul
4. Aktif gün sayısını hesapla
5. Oransal tutarı hesapla
6. Vergi numarası kontrolü yap
7. Faturaya kaydet

### Faz 4: UI Güncellemeleri
1. Fatura listesi sayfalarını güncelle (Admin ve Diyetisyen)
2. Fatura detay modal'ını güncelle
3. Oransal hesaplama bilgilerini göster
4. Kullanım gün sayısı açıklaması ekle

### Faz 5: Test ve Doğrulama
1. Senaryoları test et
2. Edge case'leri kontrol et
3. UI'da bilgilerin doğru gösterildiğini kontrol et
4. Vergi numarası kontrolünü test et

## 📊 Örnek Kod

### Tam Hesaplama Fonksiyonu

```typescript
import { Diyetisyen } from '@/types/diyetisyen';
import { Fatura } from '@/types/fatura';
import { Timestamp } from 'firebase/firestore';
import { mobileAppService } from '@/services/firebase/mobileAppService';

interface DiyetPlani {
  olusturmaTarihi: Timestamp;
  // ... diğer alanlar
}

async function hesaplaOransalFatura(
  diyetisyen: Diyetisyen,
  faturaDonemi: { ay: number; yil: number },
  normalTutar: number
): Promise<{
  oransalTutar: number;
  aktifGunSayisi: number;
  ilkAktifDiyetPlaniTarihi: Date | null;
}> {
  // 1. Diyet planlarını getir
  const diyetPlanlari = await mobileAppService.getDiyetPlanlariByAy(
    diyetisyen.id!,
    faturaDonemi.ay,
    faturaDonemi.yil
  );

  // 2. İlk aktif diyet planı tarihini bul
  let ilkAktifDiyetPlaniTarihi: Date;
  if (diyetPlanlari.length > 0) {
    const siraliPlanlar = diyetPlanlari.sort((a, b) => 
      a.olusturmaTarihi.toMillis() - b.olusturmaTarihi.toMillis()
    );
    ilkAktifDiyetPlaniTarihi = siraliPlanlar[0].olusturmaTarihi.toDate();
  } else {
    // Fallback: Diyetisyenin kayıt tarihi
    ilkAktifDiyetPlaniTarihi = diyetisyen.olusturmaTarihi.toDate();
  }

  // 3. Ayın toplam gün sayısını hesapla
  const ayinToplamGunu = new Date(faturaDonemi.yil, faturaDonemi.ay, 0).getDate();

  // 4. Aktif gün sayısını hesapla
  const ayinIlkGunu = new Date(faturaDonemi.yil, faturaDonemi.ay - 1, 1);
  const ayinSonGunu = new Date(faturaDonemi.yil, faturaDonemi.ay, 0);
  
  const baslangicTarihi = ilkAktifDiyetPlaniTarihi > ayinIlkGunu 
    ? ilkAktifDiyetPlaniTarihi 
    : ayinIlkGunu;
  
  const gunFarki = Math.ceil(
    (ayinSonGunu.getTime() - baslangicTarihi.getTime()) / (1000 * 60 * 60 * 24)
  );
  const aktifGunSayisi = Math.max(1, gunFarki + 1);

  // 5. Oransal tutarı hesapla
  const oransalTutar = Math.round(
    (normalTutar / ayinToplamGunu) * aktifGunSayisi * 100
  ) / 100;

  return {
    oransalTutar,
    aktifGunSayisi,
    ilkAktifDiyetPlaniTarihi,
  };
}
```

## ❓ Sorular ve Kararlar

1. **İlk aktif diyet planı tarihi nasıl belirlenecek?**
   - ✅ Mobil uygulamadan çekilen diyet planlarının `olusturmaTarihi` alanı
   - Fallback: Diyetisyenin kayıt tarihi

2. **Diyet planı yoksa ne olacak?**
   - ✅ Diyetisyenin kayıt tarihi baz alınır (fallback)

3. **Vergi numarası kontrolü nasıl yapılacak?**
   - ✅ Önce `diyetisyen.vergiNumarasi` kontrolü
   - Varsa faturaya vergi bilgilerini ekle
   - Yoksa `diyetisyen.tcKimlikNo` kullan

4. **Kullanım gün sayısı gösterimi nerede olacak?**
   - ✅ Fatura detay modal'ında
   - ✅ Diyetisyen faturalar sayfasında açıklama olarak

5. **Mevcut faturalar için geriye dönük hesaplama?**
   - ✅ Hayır, sadece yeni faturalar için geçerli

## ✅ Sonuç

Bu plan ile daha adil bir faturalandırma sistemi oluşturulacak. Diyetisyenler sadece ilk aktif diyet planı oluşturdukları tarihten itibaren aktif oldukları günler için ödeme yapacak. Sistem zaten aktif diyet planlarını takip ettiği için ekstra loglama gerekmeyecek.
