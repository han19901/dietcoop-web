/**
 * Paket tipleri ve fiyatlandırma
 */
export type PaketTipi = 'esnek' | 'large' | 'xl';

export interface PaketBilgisi {
  tip: PaketTipi;
  ad: string;
  minDanisan: number;
  maxDanisan: number | null; // null ise sınırsız
  danisanBasiUcret: number;
}

// Varsayılan paket fiyatları (ayarlardan gelmezse bunlar kullanılacak)
const DEFAULT_PAKET_FIYATLARI = {
  esnekPaket: 199,
  largePaket: 159,
  xlPaket: 129,
};

/**
 * Ayarlardan paket fiyatlarını getirir
 * @returns Paket fiyatları
 */
export async function getPaketFiyatlari(): Promise<{
  esnekPaket: number;
  largePaket: number;
  xlPaket: number;
}> {
  try {
    const { ayarlarService } = await import('../firebase/firestore');
    const ayarlar = await ayarlarService.get();
    
    if (ayarlar?.paketFiyatlari) {
      return ayarlar.paketFiyatlari;
    }
    
    return DEFAULT_PAKET_FIYATLARI;
  } catch (error) {
    console.error('Paket fiyatları alınırken hata:', error);
    return DEFAULT_PAKET_FIYATLARI;
  }
}

/**
 * Paket bilgilerini oluşturur (ayarlardan fiyatları çeker)
 * @param paketFiyatlari Paket fiyatları
 * @returns Paket bilgileri dizisi
 */
export function createPaketler(paketFiyatlari: {
  esnekPaket: number;
  largePaket: number;
  xlPaket: number;
}): PaketBilgisi[] {
  return [
    {
      tip: 'esnek',
      ad: 'Esnek Paket',
      minDanisan: 0,
      maxDanisan: 10,
      danisanBasiUcret: paketFiyatlari.esnekPaket,
    },
    {
      tip: 'large',
      ad: 'Large Paket',
      minDanisan: 11,
      maxDanisan: 20,
      danisanBasiUcret: paketFiyatlari.largePaket,
    },
    {
      tip: 'xl',
      ad: 'XL Paket',
      minDanisan: 21,
      maxDanisan: null, // Sınırsız
      danisanBasiUcret: paketFiyatlari.xlPaket,
    },
  ];
}

/**
 * Danışan sayısına göre paket tipini belirler
 * @param danisanSayisi Ay içinde plan yapılan benzersiz danışan sayısı
 * @returns Paket tipi
 */
export function getPaketTipi(danisanSayisi: number): PaketTipi {
  if (danisanSayisi <= 10) {
    return 'esnek';
  } else if (danisanSayisi <= 20) {
    return 'large';
  } else {
    return 'xl';
  }
}

// Varsayılan paketler (mevcut faturalar için kullanılır)
const DEFAULT_PAKETLER: PaketBilgisi[] = [
  {
    tip: 'esnek',
    ad: 'Esnek Paket',
    minDanisan: 0,
    maxDanisan: 10,
    danisanBasiUcret: 199, // Varsayılan, mevcut faturalar için
  },
  {
    tip: 'large',
    ad: 'Large Paket',
    minDanisan: 11,
    maxDanisan: 20,
    danisanBasiUcret: 159, // Varsayılan, mevcut faturalar için
  },
  {
    tip: 'xl',
    ad: 'XL Paket',
    minDanisan: 21,
    maxDanisan: null, // Sınırsız
    danisanBasiUcret: 129, // Varsayılan, mevcut faturalar için
  },
];

/**
 * Paket bilgisini getirir (sync versiyon - varsayılan fiyatları kullanır)
 * Mevcut faturalar için kullanılır (faturadaki bilgiler zaten var)
 * @param paketTipi Paket tipi
 * @returns Paket bilgisi
 */
export function getPaketBilgisi(paketTipi: PaketTipi): PaketBilgisi {
  const paket = DEFAULT_PAKETLER.find((p) => p.tip === paketTipi);
  if (!paket) {
    throw new Error(`Bilinmeyen paket tipi: ${paketTipi}`);
  }
  return paket;
}

/**
 * Danışan sayısına göre paket bilgisini getirir (sync versiyon - varsayılan fiyatları kullanır)
 * Mevcut faturalar için kullanılır (faturadaki bilgiler zaten var)
 * @param danisanSayisi Ay içinde plan yapılan benzersiz danışan sayısı
 * @returns Paket bilgisi
 */
export function getPaketBilgisiByDanisanSayisi(danisanSayisi: number): PaketBilgisi {
  const paketTipi = getPaketTipi(danisanSayisi);
  return getPaketBilgisi(paketTipi);
}

/**
 * Paket bilgisini getirir (async versiyon - ayarlardan fiyatları çeker)
 * Yeni faturalar için kullanılır
 * @param paketTipi Paket tipi
 * @param paketFiyatlari Paket fiyatları (opsiyonel, yoksa ayarlardan çekilir)
 * @returns Paket bilgisi
 */
// Async versiyonlar artık calculateFaturaTutari içinde kullanılıyor

/**
 * Fatura tutarını hesaplar (ayarlardan paket fiyatlarını çeker)
 * @param danisanSayisi Ay içinde plan yapılan benzersiz danışan sayısı
 * @param kdvOrani KDV oranı (varsayılan 20)
 * @param paketFiyatlari Paket fiyatları (opsiyonel, yoksa ayarlardan çekilir)
 * @returns Hesaplanan tutarlar
 */
export async function calculateFaturaTutari(
  danisanSayisi: number,
  kdvOrani: number = 20,
  paketFiyatlari?: { esnekPaket: number; largePaket: number; xlPaket: number }
): Promise<{
  paketTipi: PaketTipi;
  danisanBasiUcret: number;
  tutar: number;
  kdvTutari: number;
  toplamTutar: number;
}> {
  const paketTipi = getPaketTipi(danisanSayisi);
  const fiyatlar = paketFiyatlari || await getPaketFiyatlari();
  const paketler = createPaketler(fiyatlar);
  const paketBilgisi = paketler.find((p) => p.tip === paketTipi);
  if (!paketBilgisi) {
    throw new Error(`Bilinmeyen paket tipi: ${paketTipi}`);
  }
  const tutar = danisanSayisi * paketBilgisi.danisanBasiUcret;
  const kdvTutari = tutar * (kdvOrani / 100);
  const toplamTutar = tutar + kdvTutari;

  return {
    paketTipi: paketBilgisi.tip,
    danisanBasiUcret: paketBilgisi.danisanBasiUcret,
    tutar: Math.round(tutar * 100) / 100,
    kdvTutari: Math.round(kdvTutari * 100) / 100,
    toplamTutar: Math.round(toplamTutar * 100) / 100,
  };
}
