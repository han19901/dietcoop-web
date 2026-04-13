# Fiyatlandırma ve İskonto Sistemi - Detaylı Analiz Raporu

## 📋 Genel Bakış

Bu doküman, sistemdeki fiyatlandırma ve iskonto mekanizmalarının detaylı analizini içermektedir.

---

## 1. AYARLAR BÖLÜMÜ - MEVCUT DURUM

### 1.1. Paket Fiyatları ✅ (KULLANILIYOR)

**Konum:** `src/pages/Ayarlar.tsx` (Satır 305-369)

**Kullanım:**
- ✅ **Fatura oluşturma** (`src/services/utils/faturaUtils.ts` - `createFaturaAsync`)
- ✅ **Paket tipi belirleme** (`src/services/utils/paketUtils.ts` - `calculateFaturaTutari`)
- ✅ **Yeni faturalarda kullanılıyor**

**Paketler:**
- Esnek Paket (0-10 Danışan): Ayarlardan belirleniyor
- Large Paket (11-20 Danışan): Ayarlardan belirleniyor
- XL Paket (21+ Danışan): Ayarlardan belirleniyor

**Sonuç:** ✅ **KALMALI** - Sistemin temel fiyatlandırma mekanizması

---

### 1.2. Varsayılan Fiyatlandırma ❌ (GEREKSIZ)

#### 1.2.1. Varsayılan Danışan Başı Ücret (`varsayilanDanisanBasiUcret`)

**Konum:** `src/pages/Ayarlar.tsx` (Satır 375-391)

**Kullanım Yerleri:**
1. ✅ `src/pages/DiyetisyenDetail.tsx` (Satır 162, 167, 208-209)
   - Yeni diyetisyen oluşturulurken varsayılan değer olarak atanıyor
   - Eğer diyetisyen'in `danisanBasiUcret` değeri yoksa, varsayılan değer kullanılıyor

**Fatura Oluşturmada Kullanımı:**
- ❌ **KULLANILMIYOR** - Fatura oluşturma işleminde paket fiyatları kullanılıyor
- Fatura oluşturma: `src/services/utils/faturaUtils.ts` - `createFaturaAsync` (Satır 264-265)
  ```typescript
  const { paketTipi, danisanBasiUcret, tutar, kdvTutari, toplamTutar } =
    await calculateFaturaTutari(danisanSayisi, kdvOrani, paketFiyatlari);
  ```

**Sonuç:** ❌ **KALDIRILABİLİR** - Sadece yeni diyetisyen oluşturulurken varsayılan değer olarak kullanılıyor, fatura oluşturmada kullanılmıyor.

**Öneri:** Yeni diyetisyen oluşturulurken varsayılan değer olarak paket fiyatlarından Esnek Paket fiyatını kullanabiliriz.

---

#### 1.2.2. Varsayılan İskonto Oranı (`varsayilanIskontoOrani`)

**Konum:** `src/pages/Ayarlar.tsx` (Satır 393-412)

**Kullanım Yerleri:**
1. ✅ `src/pages/DiyetisyenDetail.tsx` (Satır 163, 174)
   - Yeni diyetisyen oluşturulurken varsayılan değer olarak atanıyor (0)
   - Eğer diyetisyen'in `iskontoOrani` değeri yoksa, varsayılan değer (0) kullanılıyor

**Fatura Oluşturmada Kullanımı:**
- ❌ **KULLANILMIYOR** - Fatura oluşturma işleminde diyetisyen'in kendi `iskontoOrani` değeri kullanılıyor (ama şu an kullanılmıyor - aşağıda detay)

**Sonuç:** ❌ **KALDIRILABİLİR** - Sadece yeni diyetisyen oluşturulurken varsayılan değer (0) olarak kullanılıyor. Diyetisyen sayfasından zaten iskonto oranı belirlenebiliyor.

**Öneri:** Yeni diyetisyen oluşturulurken varsayılan değer olarak 0 kullanılabilir (kod içinde sabit değer).

---

#### 1.2.3. KDV Oranı (`kdvOrani`) ✅ (KULLANILIYOR)

**Konum:** `src/pages/Ayarlar.tsx` (Satır 414-433)

**Kullanım Yerleri:**
1. ✅ `src/services/utils/faturaUtils.ts` - `createFaturaAsync` (Satır 249, 265)
2. ✅ `src/services/fatura/faturaOlusturmaService.ts` - `createFaturaForDiyetisyen` (Satır 84)
3. ✅ `src/services/firebase/firestore.ts` - `odemeService.create` (Satır 325)
4. ✅ `src/services/utils/paymentUtils.ts` - `calculatePaymentAmount` (Satır 10)

**Sonuç:** ✅ **KALMALI** - Sistemin temel KDV hesaplama mekanizması

---

## 2. İSKONTO ORANI - MEVCUT DURUM

### 2.1. Diyetisyen Bazında İskonto Oranı

**Konum:** `src/types/diyetisyen.ts` - `Diyetisyen` interface

**Kullanım Yerleri:**

#### 2.1.1. Diyetisyen Sayfasında İskonto Belirleme ✅

**Konum:** `src/pages/DiyetisyenDetail.tsx`
- Diyetisyen sayfasında `iskontoOrani` alanı var
- Kullanıcı diyetisyen sayfasından iskonto oranını belirleyebiliyor

#### 2.1.2. Ödeme Oluşturmada İskonto Kullanımı ✅

**Konum:** `src/services/firebase/firestore.ts` - `odemeService.create` (Satır 315-350)

**Kod:**
```typescript
const iskontoOrani = diyetisyen?.iskontoOrani || 0;

// İskonto hesaplama: Danışan başına indirim = danışan başına ücret * iskonto oranı
const danisanBasiIndirim = danisanBasiUcret * (iskontoOrani / 100);

// İskonto sonrası tutar = (danışan başına ücret - danışan başına indirim) * danışan sayısı
const iskontoSonrasiTutar = (danisanBasiUcret - danisanBasiIndirim) * aktifDanisanSayisi;

// KDV hesaplama: İskonto sonrası tutar üzerinden
const kdvTutari = iskontoSonrasiTutar * (kdvOrani / 100);

// Toplam tutar
const toplamTutar = iskontoSonrasiTutar + kdvTutari;
```

**Sonuç:** ✅ **ÖDEME OLUŞTURMADA KULLANILIYOR** - İskonto oranı ödeme hesaplamasına yansıyor

#### 2.1.3. Fatura Oluşturmada İskonto Kullanımı ❌

**Konum:** `src/services/utils/faturaUtils.ts` - `createFaturaAsync` (Satır 241-373)

**Durum:** ❌ **İSKONTO HESAPLANMIYOR**

**Mevcut Kod:**
```typescript
const { paketTipi, danisanBasiUcret, tutar, kdvTutari, toplamTutar } =
  await calculateFaturaTutari(danisanSayisi, kdvOrani, paketFiyatlari);
```

**Eksik:** 
- Diyetisyen'in `iskontoOrani` değeri alınmıyor
- İskonto hesaplanmıyor
- İskonto sonrası tutar hesaplanmıyor
- Fatura tipinde `iskontoOrani` veya `iskontoTutari` alanı yok

**Sonuç:** ❌ **FATURA OLUŞTURMADA İSKONTO KULLANILMIYOR**

---

### 2.2. Fatura Tipinde İskonto Alanı

**Konum:** `src/types/fatura.ts` - `Fatura` interface

**Durum:** ❌ **İSKONTO ALANI YOK**

**Mevcut Alanlar:**
- `paketTipi: PaketTipi`
- `danisanSayisi: number`
- `danisanBasiUcret: number`
- `tutar: number`
- `kdvOrani: number`
- `kdvTutari: number`
- `toplamTutar: number`

**Eksik Alanlar:**
- ❌ `iskontoOrani?: number` - İskonto oranı
- ❌ `iskontoTutari?: number` - İskonto tutarı

**Sonuç:** ❌ **FATURA TİPİNDE İSKONTO ALANI YOK**

---

### 2.3. Fatura Görüntüleme Sayfalarında İskonto Gösterimi

**Konum:** 
- `src/pages/Faturalar.tsx`
- `src/pages/diyetisyen/DiyetisyenFaturalar.tsx`
- `src/pages/DiyetisyenDetail.tsx`

**Durum:** ❌ **İSKONTO GÖSTERİLMİYOR**

**Gösterilen Alanlar:**
- Paket tipi
- Danışan sayısı
- Birim fiyat (danisanBasiUcret)
- Tutar (tutar)
- KDV tutarı (kdvTutari)
- Toplam tutar (toplamTutar)

**Eksik Gösterim:**
- ❌ İskonto oranı gösterilmiyor
- ❌ İskonto tutarı gösterilmiyor

**Sonuç:** ❌ **FATURA GÖRÜNTÜLEME SAYFALARINDA İSKONTO GÖSTERİLMİYOR**

---

## 3. ÖZET VE ÖNERİLER

### 3.1. Kaldırılması Gerekenler

#### ❌ 1. Varsayılan Danışan Başı Ücret (`varsayilanDanisanBasiUcret`)
- **Neden:** Fatura oluşturmada kullanılmıyor, sadece yeni diyetisyen oluşturulurken varsayılan değer olarak kullanılıyor
- **Alternatif:** Yeni diyetisyen oluşturulurken paket fiyatlarından Esnek Paket fiyatını kullanabiliriz

#### ❌ 2. Varsayılan İskonto Oranı (`varsayilanIskontoOrani`)
- **Neden:** Fatura oluşturmada kullanılmıyor, sadece yeni diyetisyen oluşturulurken varsayılan değer (0) olarak kullanılıyor
- **Alternatif:** Yeni diyetisyen oluşturulurken varsayılan değer olarak 0 kullanılabilir (kod içinde sabit değer)

### 3.2. Kalması Gerekenler

#### ✅ 1. Paket Fiyatları
- Sistemin temel fiyatlandırma mekanizması
- Fatura oluşturmada kullanılıyor

#### ✅ 2. KDV Oranı
- Sistemin temel KDV hesaplama mekanizması
- Fatura ve ödeme hesaplamalarında kullanılıyor

### 3.3. Eklenmesi Gerekenler

#### ✅ 1. Fatura Tipine İskonto Alanları
- `iskontoOrani?: number` - İskonto oranı
- `iskontoTutari?: number` - İskonto tutarı

#### ✅ 2. Fatura Oluşturmada İskonto Hesaplama
- Diyetisyen'in `iskontoOrani` değerini al
- İskonto tutarını hesapla
- İskonto sonrası tutarı hesapla
- KDV'yi iskonto sonrası tutar üzerinden hesapla

#### ✅ 3. Fatura Görüntüleme Sayfalarında İskonto Gösterimi
- İskonto oranını göster
- İskonto tutarını göster
- İskonto sonrası tutarı göster

---

## 4. YAPILACAK DEĞİŞİKLİKLER

### 4.1. Ayarlar Sayfasından Kaldırılacaklar

1. **Varsayılan Danışan Başı Ücret** alanı kaldırılacak
2. **Varsayılan İskonto Oranı** alanı kaldırılacak
3. **Varsayılan Fiyatlandırma** bölümü kaldırılacak (sadece KDV Oranı kalacak)

### 4.2. DiyetisyenDetail.tsx'te Güncellemeler

1. `varsayilanDanisanBasiUcret` yerine paket fiyatlarından Esnek Paket fiyatını kullan
2. `varsayilanIskontoOrani` yerine sabit 0 değeri kullan

### 4.3. Fatura Tipine Eklenecekler

1. `iskontoOrani?: number` alanı eklenecek
2. `iskontoTutari?: number` alanı eklenecek

### 4.4. Fatura Oluşturmada Eklenecekler

1. Diyetisyen'in `iskontoOrani` değeri alınacak
2. İskonto tutarı hesaplanacak
3. İskonto sonrası tutar hesaplanacak
4. KDV iskonto sonrası tutar üzerinden hesaplanacak

### 4.5. Fatura Görüntüleme Sayfalarında Eklenecekler

1. İskonto oranı gösterilecek
2. İskonto tutarı gösterilecek
3. İskonto sonrası tutar gösterilecek

---

## 5. KOD DEĞİŞİKLİKLERİ DETAYLARI

### 5.1. Dosya: `src/types/fatura.ts`

**Eklenecek:**
```typescript
export interface Fatura {
  // ... mevcut alanlar ...
  
  // İskonto Bilgileri
  iskontoOrani?: number; // İskonto oranı (%)
  iskontoTutari?: number; // İskonto tutarı (₺)
}
```

### 5.2. Dosya: `src/services/utils/faturaUtils.ts`

**Güncellenecek:** `createFaturaAsync` fonksiyonu

**Eklenecek:**
```typescript
// Diyetisyen'in iskonto oranını al
const iskontoOrani = diyetisyen?.iskontoOrani || 0;

// İskonto hesaplama
let iskontoTutari = 0;
let finalTutar = tutar;
let finalKdvTutari = kdvTutari;
let finalToplamTutar = toplamTutar;

if (iskontoOrani > 0 && finalTutar > 0) {
  // İskonto tutarı = tutar * iskonto oranı / 100
  iskontoTutari = Math.round((finalTutar * iskontoOrani / 100) * 100) / 100;
  
  // İskonto sonrası tutar
  finalTutar = Math.round((finalTutar - iskontoTutari) * 100) / 100;
  
  // KDV iskonto sonrası tutar üzerinden hesaplanır
  finalKdvTutari = Math.round((finalTutar * kdvOrani / 100) * 100) / 100;
  
  // Toplam tutar
  finalToplamTutar = Math.round((finalTutar + finalKdvTutari) * 100) / 100;
}
```

### 5.3. Dosya: `src/pages/Ayarlar.tsx`

**Kaldırılacak:**
- Varsayılan Danışan Başı Ücret alanı (Satır 375-391)
- Varsayılan İskonto Oranı alanı (Satır 393-412)
- Varsayılan Fiyatlandırma bölümü başlığı (Satır 371-373)

**Kalacak:**
- KDV Oranı alanı (ayrı bir bölüm olarak)

### 5.4. Dosya: `src/pages/DiyetisyenDetail.tsx`

**Güncellenecek:**
- `varsayilanDanisanBasiUcret` yerine paket fiyatlarından Esnek Paket fiyatını kullan
- `varsayilanIskontoOrani` yerine sabit 0 değeri kullan

### 5.5. Dosya: `src/pages/Faturalar.tsx`

**Eklenecek:** İskonto bilgilerinin gösterimi

### 5.6. Dosya: `src/pages/diyetisyen/DiyetisyenFaturalar.tsx`

**Eklenecek:** İskonto bilgilerinin gösterimi

---

## 6. TEST SENARYOLARI

### 6.1. Fatura Oluşturma Testi

1. **İskonto Oranı 0 Olan Diyetisyen:**
   - Fatura oluştur
   - İskonto tutarı 0 olmalı
   - Toplam tutar normal hesaplanmalı

2. **İskonto Oranı %10 Olan Diyetisyen:**
   - Fatura oluştur
   - İskonto tutarı doğru hesaplanmalı
   - İskonto sonrası tutar doğru hesaplanmalı
   - KDV iskonto sonrası tutar üzerinden hesaplanmalı

3. **İskonto Oranı %50 Olan Diyetisyen:**
   - Fatura oluştur
   - İskonto tutarı doğru hesaplanmalı
   - Toplam tutar doğru hesaplanmalı

### 6.2. Fatura Görüntüleme Testi

1. **İskonto Oranı 0 Olan Fatura:**
   - İskonto bilgileri gösterilmemeli veya "İskonto Yok" yazmalı

2. **İskonto Oranı > 0 Olan Fatura:**
   - İskonto oranı gösterilmeli
   - İskonto tutarı gösterilmeli
   - İskonto sonrası tutar gösterilmeli

---

## 7. SONUÇ

### 7.1. Kaldırılacaklar ✅
- ✅ Varsayılan Danışan Başı Ücret
- ✅ Varsayılan İskonto Oranı
- ✅ Varsayılan Fiyatlandırma bölümü (sadece KDV Oranı kalacak)

### 7.2. Kalacaklar ✅
- ✅ Paket Fiyatları
- ✅ KDV Oranı

### 7.3. Eklenecekler ✅
- ✅ Fatura tipine iskonto alanları
- ✅ Fatura oluşturmada iskonto hesaplama
- ✅ Fatura görüntüleme sayfalarında iskonto gösterimi

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2026-01-19  
**Versiyon:** 1.0
