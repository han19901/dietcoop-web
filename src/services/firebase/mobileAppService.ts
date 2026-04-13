/**
 * Mobil Uygulama Firebase Projesinden Veri Okuma Servisi
 * 
 * NOT: Bu servis browser'da çalışır ve Cloud Functions üzerinden veri okur.
 * firebase-admin Node.js ortamında çalışır, browser'da çalışmaz.
 * Bu yüzden tüm işlemler Cloud Functions üzerinden yapılır.
 */

// Cache için interface
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number; // 5 dakika cache süresi
}

// Cache storage
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

// Cache key oluştur
function getCacheKey(diyetisyenId: string, baslangicTarihi: Date, bitisTarihi: Date): string {
  return `diyetPlanlari_${diyetisyenId}_${baslangicTarihi.getTime()}_${bitisTarihi.getTime()}`;
}

// Cache'den oku
function getFromCache(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  // Cache süresi dolmuş mu?
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

// Cache'e yaz
function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiry: Date.now() + CACHE_DURATION
  });
}

// Cache temizle (eski entry'leri sil)
function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
    }
  }
}

// Her 10 dakikada bir cache temizle
setInterval(cleanCache, 10 * 60 * 1000);

export interface MobileAppDiyetisyen {
  id: string;
  email?: string;
  name?: string;
  surname?: string;
  aktifDanisanSayisi?: number;
  pasifDanisanSayisi?: number;
  sonGuncelleme?: Date;
}

export const mobileAppService = {
  /**
   * Diyetisyen bilgilerini mobil uygulamadan oku
   * Cloud Functions üzerinden HTTP isteği yapar
   */
  async getDiyetisyen(diyetisyenId: string): Promise<MobileAppDiyetisyen | null> {
    const requestId = `getDiyetisyen_${Date.now()}`;
    
    try {
      // Cloud Functions URL'i environment variable'dan al veya default kullan
      const CLOUD_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || 
        'https://us-central1-webdietcoop.cloudfunctions.net';
      
      const url = `${CLOUD_FUNCTIONS_URL}/getDiyetisyen`;
      
      console.log(`[${requestId}] 📤 Mobil uygulamadan diyetisyen bilgisi çekiliyor:`, {
        url: url,
        diyetisyenId: diyetisyenId,
        method: 'POST',
        timestamp: new Date().toISOString()
      });
      
      const requestBody = JSON.stringify({ diyetisyenId });
      console.log(`[${requestId}] Request body:`, requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log(`[${requestId}] 📥 Cloud Function response alındı:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        timestamp: new Date().toISOString()
      });

      // CORS header kontrolü
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      console.log(`[${requestId}] CORS Header kontrolü:`, {
        'Access-Control-Allow-Origin': corsHeader,
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] ❌ Cloud Function hatası:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          corsHeader: corsHeader,
          timestamp: new Date().toISOString()
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Bilinmeyen hata' };
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[${requestId}] ✅ Mobil uygulamadan diyetisyen bilgisi başarıyla alındı:`, {
        data: data,
        timestamp: new Date().toISOString()
      });
      return data;
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Mobil uygulamadan diyetisyen bilgisi alınamadı:`, {
        error: error.message,
        errorName: error.name,
        diyetisyenId: diyetisyenId,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        // CORS hatası kontrolü
        isCorsError: error.message?.includes('CORS') || error.message?.includes('fetch') || error.name === 'TypeError',
      });
      
      // CORS hatası özel mesajı
      if (error.message?.includes('CORS') || error.message?.includes('fetch') || error.name === 'TypeError') {
        console.error(`[${requestId}] ⚠️ CORS hatası tespit edildi!`, {
          message: 'CORS policy hatası - Cloud Function CORS header\'ları göndermiyor olabilir',
          suggestion: 'Firebase Console\'dan Cloud Functions loglarını kontrol edin',
          timestamp: new Date().toISOString()
        });
      }
      
      return null;
    }
  },

  /**
   * Aktif danışan sayısını mobil uygulamadan oku
   */
  async getAktifDanisanSayisi(diyetisyenId: string): Promise<number> {
    const diyetisyen = await this.getDiyetisyen(diyetisyenId);
    return diyetisyen?.aktifDanisanSayisi || 0;
  },

  /**
   * Pasif danışan sayısını mobil uygulamadan oku
   */
  async getPasifDanisanSayisi(diyetisyenId: string): Promise<number> {
    const diyetisyen = await this.getDiyetisyen(diyetisyenId);
    return diyetisyen?.pasifDanisanSayisi || 0;
  },

  /**
   * Ay içindeki diyet planlarını mobil uygulamadan oku
   * @param diyetisyenId Diyetisyen ID
   * @param baslangicTarihi Ay başlangıç tarihi
   * @param bitisTarihi Ay bitiş tarihi
   * @returns Diyet planları (danışanId, danışanAdi, olusturmaTarihi)
   */
  async getDiyetPlanlariByAy(
    diyetisyenId: string,
    baslangicTarihi: Date,
    bitisTarihi: Date
  ): Promise<Array<{
    danisanId: string;
    danisanAdi: string;
    olusturmaTarihi: Date;
  }>> {
    // Cache kontrolü
    const cacheKey = getCacheKey(diyetisyenId, baslangicTarihi, bitisTarihi);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    const requestId = `getDiyetPlanlariByAy_${Date.now()}`;
    
    try {
      const CLOUD_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || 
        'https://us-central1-webdietcoop.cloudfunctions.net';
      
      const url = `${CLOUD_FUNCTIONS_URL}/getDiyetPlanlariByAy`;
      
      const requestBody = JSON.stringify({
        diyetisyenId,
        baslangicTarihi: baslangicTarihi.toISOString(),
        bitisTarihi: bitisTarihi.toISOString(),
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] ❌ Cloud Function hatası:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          url: url,
          requestBody: requestBody
        });
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Bilinmeyen hata' };
        }
        
        const errorMessage = errorData.error || errorData.details || `HTTP error! status: ${response.status}`;
        console.error(`[${requestId}] Hata detayları:`, errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Tarihleri Date objesine çevir
      const planlar = (data.planlar || []).map((plan: any) => ({
        danisanId: plan.danisanId,
        danisanAdi: plan.danisanAdi,
        olusturmaTarihi: new Date(plan.olusturmaTarihi),
      }));
      
      // Cache'e kaydet
      setCache(cacheKey, planlar);
      
      return planlar;
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Mobil uygulamadan diyet planları alınamadı:`, {
        error: error.message,
        errorName: error.name,
        diyetisyenId: diyetisyenId,
        timestamp: new Date().toISOString(),
      });
      
      // Hata durumunda boş array döndür
      return [];
    }
  },
};

