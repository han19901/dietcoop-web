import { Timestamp } from 'firebase/firestore';

export type FaturaDurumu = 'beklemede' | 'odendi' | 'gecikmis' | 'iptal';
export type PaketTipi = 'esnek' | 'large' | 'xl';

export interface FaturaDanisanDetay {
  danisanId: string;
  danisanAdi: string;
  planOlusturmaTarihi: Timestamp;
  planSayisi: number; // Ay içinde bu danışana yapılan toplam plan sayısı
}

export interface Fatura {
  id?: string;
  diyetisyenId: string;
  diyetisyenEmail: string;
  diyetisyenAdSoyad: string;
  uyeNumarasi: string;
  
  // Fatura Dönemi
  faturaDonemi: {
    yil: number;
    ay: number; // 1-12
    baslangicTarihi: Timestamp; // Ayın 1'i
    bitisTarihi: Timestamp; // Ayın son günü (28, 29, 30 veya 31)
  };
  
  // Paket ve Fiyatlandırma
  paketTipi: PaketTipi;
  danisanSayisi: number; // Ay içinde plan yapılan toplam benzersiz danışan sayısı
  danisanBasiUcret: number; // Pakete göre belirlenen ücret (199, 159, 129)
  tutar: number; // danisanSayisi * danisanBasiUcret
  kdvOrani: number;
  kdvTutari: number;
  toplamTutar: number;
  
  // İskonto Bilgileri
  iskontoOrani?: number; // İskonto oranı (%)
  iskontoTutari?: number; // İskonto tutarı (₺)
  
  // Danışan Detayları
  danisanDetaylari: FaturaDanisanDetay[];
  
  // Ödeme Bilgileri
  odemeYontemi: 'bankaHavalesi';
  faturaDurumu: FaturaDurumu;
  olusturmaTarihi: Timestamp;
  sonOdemeTarihi: Timestamp; // Oluşturma tarihinden 5 gün sonra
  odemeTarihi?: Timestamp;
  onayTarihi?: Timestamp;
  onaylayanAdmin?: string;
  
  // Banka Havalesi Bilgileri
  bankaHavalesi?: {
    iban: string;
    aliciAdi: string;
    aciklama: string;
    onayTarihi?: Timestamp;
  };
  
  // Oransal Hesaplama Bilgileri
  oransalHesaplama?: {
    aktif: boolean; // Oransal hesaplama yapıldı mı?
    ilkAktifDiyetPlaniTarihi: Timestamp; // İlk aktif diyet planı oluşturulma tarihi
    aktifGunSayisi: number; // Ay içinde aktif olunan gün sayısı
    ayinToplamGunu: number; // Ayın toplam gün sayısı (28, 29, 30, 31)
    normalTutar: number; // Oransal hesaplama öncesi tutar
    oransalTutar: number; // Oransal hesaplama sonrası tutar (fatura tutarı)
  };
  
  // Fatura Bilgileri (Vergi/TC Kimlik)
  faturaBilgileri?: {
    vergiNumarasi?: string;
    tcKimlikNo?: string;
    vergiDairesi?: string;
    adres?: string;
    sehir?: string;
    postaKodu?: string;
  };
}
