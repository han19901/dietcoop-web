import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as path from "path";
import express = require("express");

// Firebase Admin'i başlat (Web Panel projesi - webdietcoop)
admin.initializeApp();

// Mobil uygulama Firebase projesine erişim (dietcoop-432fa)
// Web Panel'in Mobil App'i okuması ve yazması için mobile-app-service-account.json kullanılır
const mobileAppServiceAccount = require(path.join(__dirname, "../mobile-app-service-account.json"));
admin.initializeApp({
  credential: admin.credential.cert(mobileAppServiceAccount),
  databaseURL: "https://dietcoop-432fa.firebaseio.com",
}, "mobileApp");

const mobileAppDb = admin.app("mobileApp").firestore();
const webPanelDb = admin.firestore();

// Üye numarası oluşturma fonksiyonu
async function generateUniqueUyeNumarasi(): Promise<string> {
  const prefix = "DC";
  let uyeNumarasi: string = "";
  let exists = true;
  
  // Benzersiz bir üye numarası bulana kadar dene
  while (exists) {
    // 6 haneli rastgele sayı oluştur
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    uyeNumarasi = `${prefix}${randomNum}`;
    
    // Bu üye numarası zaten var mı kontrol et
    const snapshot = await webPanelDb.collection("diyetisyenler")
      .where("uyeNumarasi", "==", uyeNumarasi)
      .limit(1)
      .get();
    
    exists = !snapshot.empty;
  }
  
  return uyeNumarasi;
}

// CORS ayarları - DietCoop domain'lerine izin ver
const corsOptions = {
  origin: [
    "https://www.dietcoop.com",
    "https://dietcoop.com",
    "http://localhost:5173",
    "http://localhost:3000",
    /\.dietcoop\.com$/, // Tüm dietcoop.com subdomain'leri
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

// CORS helper function - Origin kontrolü
function isOriginAllowed(origin: string | undefined, allowedOrigins: any): boolean {
  if (!origin) return false;
  
  if (Array.isArray(allowedOrigins)) {
    return allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
  } else if (allowedOrigins === true) {
    return true;
  }
  return false;
}

// CORS headers'ı set et
function setCorsHeaders(req: express.Request, res: express.Response): void {
  const origin = req.headers.origin;
  
  // OPTIONS (preflight) isteği için her zaman origin'e izin ver
  if (req.method === "OPTIONS") {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      // Origin yoksa bile header'ları set et
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
    res.setHeader("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(", "));
    res.setHeader("Access-Control-Max-Age", "3600");
    return;
  }
  
  // Normal istekler için origin kontrolü yap
  if (origin) {
    if (isOriginAllowed(origin, corsOptions.origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      // Origin izinli değilse bile header'ları set et (bazı tarayıcılar için)
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  }
  
  // Her zaman bu header'ları set et
  res.setHeader("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(", "));
  res.setHeader("Access-Control-Max-Age", "3600");
}

// CORS wrapper - Express app kullanarak (KESIN ÇALIŞAN YÖNTEM)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const corsHandler = (
  handler: (_req: express.Request, _res: express.Response) => Promise<void> | void
) => {
  // Her fonksiyon için ayrı Express app oluştur
  const app = express();
  
  // OPTIONS (preflight) isteği için özel middleware - EN ÖNCE BU ÇALIŞMALI
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin;
    
    // OPTIONS isteği ise hemen cevap ver
    if (req.method === "OPTIONS") {
      // CORS headers'ı set et
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
      } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
      res.setHeader("Access-Control-Allow-Methods", corsOptions.methods.join(", "));
      res.setHeader("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(", "));
      res.setHeader("Access-Control-Max-Age", "3600");
      res.status(corsOptions.optionsSuccessStatus || 204).end();
      return;
    }
    
    // CORS headers'ı her zaman set et
    setCorsHeaders(req, res);
    next();
  });
  
  // Body parser
  app.use(express.json());
  
  // Handler'ı route olarak ekle - TÜM İSTEKLER İÇİN
  app.use(async (req: express.Request, res: express.Response) => {
    const requestId = `${req.method}_${Date.now()}`;
    console.log(`[${requestId}] İstek geldi:`, {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      headers: Object.keys(req.headers),
      timestamp: new Date().toISOString()
    });
    
    // CORS headers'ı her response'a ekle
    setCorsHeaders(req, res);
    
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error(`[${requestId}] Handler error:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      if (!res.headersSent) {
        res.status(500).json({ 
          error: error.message || "Sunucu hatası",
          requestId: requestId,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
  
  // Express app'i Firebase Functions'a bağla
  return functions.https.onRequest(app);
};

/**
 * Mobil uygulamadan diyetisyen bilgilerini oku
 * HTTP endpoint olarak kullanılabilir
 */
export const getDiyetisyen = corsHandler(async (request: express.Request, response: express.Response) => {
  try {
    console.log("getDiyetisyen çağrıldı", {
      method: request.method,
      body: request.body,
      query: request.query,
      origin: request.headers.origin
    });
    
    let diyetisyenId: string | undefined;
    
    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      diyetisyenId = body?.diyetisyenId;
    } else if (request.method === "GET") {
      diyetisyenId = request.query.diyetisyenId as string;
    }

    console.log("Parametreler:", { diyetisyenId });

    if (!diyetisyenId) {
      const errorMsg = "diyetisyenId gerekli";
      console.error(errorMsg, { diyetisyenId });
      response.status(400).json({ error: errorMsg });
      return;
    }

    // Mobil uygulama Firebase projesinden diyetisyen bilgilerini oku
    const docRef = await mobileAppDb.collection("users").doc(diyetisyenId).get();

    if (!docRef.exists) {
      console.error("Diyetisyen bulunamadı:", diyetisyenId);
      response.status(404).json({ error: "Diyetisyen bulunamadı" });
      return;
    }

    const data = docRef.data();

    // Debug: Mobil uygulamadan gelen veriyi logla
    console.log("[getDiyetisyen] Mobil uygulamadan gelen veri:", {
      id: docRef.id,
      email: data?.email,
      name: data?.name,
      surname: data?.surname,
      aktifDanisanSayisi: data?.aktifDanisanSayisi,
      pasifDanisanSayisi: data?.pasifDanisanSayisi,
      sonGuncelleme: data?.sonGuncelleme,
      dataKeys: Object.keys(data || {}),
      rawData: data
    });

    // Sadece gerekli alanları döndür
    const result = {
      id: docRef.id,
      email: data?.email,
      name: data?.name,
      surname: data?.surname,
      aktifDanisanSayisi: data?.aktifDanisanSayisi ?? 0,
      pasifDanisanSayisi: data?.pasifDanisanSayisi ?? 0,
      sonGuncelleme: data?.sonGuncelleme?.toDate?.() || null,
    };

    console.log("[getDiyetisyen] Döndürülen sonuç:", result);

    response.status(200).json(result);
  } catch (error: any) {
    console.error("getDiyetisyen genel hatası:", error);
    console.error("Hata stack:", error.stack);
    if (!response.headersSent) {
      response.status(500).json({ 
        error: error.message || "Sunucu hatası",
        details: error.toString(),
        stack: error.stack
      });
    }
  }
});

/**
 * Mobil uygulamadan aktif danışan sayısını oku
 */
export const getAktifDanisanSayisi = corsHandler(async (request, response) => {
  try {
    let diyetisyenId: string | undefined;
    
    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      diyetisyenId = body?.diyetisyenId;
    } else if (request.method === "GET") {
      diyetisyenId = request.query.diyetisyenId as string;
    }

    if (!diyetisyenId) {
      response.status(400).json({ error: "diyetisyenId gerekli" });
      return;
    }

    const docRef = await mobileAppDb.collection("users").doc(diyetisyenId).get();

    if (!docRef.exists) {
      response.status(404).json({ error: "Diyetisyen bulunamadı" });
      return;
    }

    const data = docRef.data();
    const aktifDanisanSayisi = data?.aktifDanisanSayisi || 0;

    response.status(200).json({ aktifDanisanSayisi });
  } catch (error: any) {
    console.error("getAktifDanisanSayisi hatası:", error);
    response.status(500).json({ error: error.message || "Sunucu hatası" });
  }
});

/**
 * Mobil uygulamadan ay içindeki diyet planlarını oku
 */
export const getDiyetPlanlariByAy = corsHandler(async (request: express.Request, response: express.Response) => {
  try {
    console.log("getDiyetPlanlariByAy çağrıldı", {
      method: request.method,
      body: request.body,
      query: request.query
    });

    let diyetisyenId: string | undefined;
    let baslangicTarihi: string | undefined;
    let bitisTarihi: string | undefined;
    
    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      diyetisyenId = body?.diyetisyenId;
      baslangicTarihi = body?.baslangicTarihi;
      bitisTarihi = body?.bitisTarihi;
    } else if (request.method === "GET") {
      diyetisyenId = request.query.diyetisyenId as string;
      baslangicTarihi = request.query.baslangicTarihi as string;
      bitisTarihi = request.query.bitisTarihi as string;
    }

    console.log("Parametreler:", { diyetisyenId, baslangicTarihi, bitisTarihi });

    if (!diyetisyenId || !baslangicTarihi || !bitisTarihi) {
      const errorMsg = "diyetisyenId, baslangicTarihi ve bitisTarihi gerekli";
      console.error(errorMsg, { diyetisyenId, baslangicTarihi, bitisTarihi });
      response.status(400).json({ error: errorMsg });
      return;
    }

    let baslangic: Date;
    let bitis: Date;
    
    try {
      baslangic = new Date(baslangicTarihi);
      bitis = new Date(bitisTarihi);
      
      if (isNaN(baslangic.getTime()) || isNaN(bitis.getTime())) {
        throw new Error("Geçersiz tarih formatı");
      }
    } catch (dateError) {
      console.error("Tarih dönüştürme hatası:", dateError);
      response.status(400).json({ 
        error: "Geçersiz tarih formatı", 
        details: dateError instanceof Error ? dateError.message : String(dateError)
      });
      return;
    }

    console.log("Tarih aralığı:", { 
      baslangic: baslangic.toISOString(), 
      bitis: bitis.toISOString() 
    });

      // Mobil uygulamadan dietPlans collection'ını oku
      try {
        const dietPlansRef = mobileAppDb.collection("dietPlans");
        const baslangicTimestamp = admin.firestore.Timestamp.fromDate(baslangic);
        const bitisTimestamp = admin.firestore.Timestamp.fromDate(bitis);
        
        console.log("Firestore sorgusu başlatılıyor:", {
          collection: "dietPlans",
          dietitianId: diyetisyenId,
          baslangicTimestamp: baslangicTimestamp.toDate().toISOString(),
          bitisTimestamp: bitisTimestamp.toDate().toISOString()
        });

        // Index gerektirmeyen sorgu: Önce dietitianId ile filtrele, sonra memory'de tarih filtresi yap
        // Bu yaklaşım daha fazla veri çeker ama index gerektirmez
        let snapshot;
        try {
          // Önce composite index ile dene
          snapshot = await dietPlansRef
            .where("dietitianId", "==", diyetisyenId)
            .where("createdAt", ">=", baslangicTimestamp)
            .where("createdAt", "<=", bitisTimestamp)
            .get();
        } catch (indexError: any) {
          // Index hatası varsa alternatif yöntem kullan
          if (indexError.code === 9 || indexError.message?.includes("index")) {
            console.warn("Composite index bulunamadı, alternatif sorgu kullanılıyor:", indexError.message);
            
            // Sadece dietitianId ile filtrele (bu index genelde otomatik oluşur)
            const allPlans = await dietPlansRef
              .where("dietitianId", "==", diyetisyenId)
              .get();
            
            // Tarih filtresini memory'de yap
            const filteredDocs = allPlans.docs.filter(doc => {
              const planData = doc.data();
              const createdAt = planData.createdAt || planData.created_at || planData.dateCreated;
              
              if (!createdAt) return false;
              
              let planDate: Date;
              if (createdAt.toDate && typeof createdAt.toDate === "function") {
                planDate = createdAt.toDate();
              } else if (createdAt instanceof admin.firestore.Timestamp) {
                planDate = createdAt.toDate();
              } else if (createdAt instanceof Date) {
                planDate = createdAt;
              } else {
                planDate = new Date(createdAt);
              }
              
              return planDate >= baslangic && planDate <= bitis;
            });
            
            // FilteredDocs'u QuerySnapshot benzeri bir yapıya çevir
            snapshot = {
              docs: filteredDocs,
              empty: filteredDocs.length === 0,
              size: filteredDocs.length
            } as any;
            
            console.log(`Alternatif sorgu ile ${filteredDocs.length} plan bulundu`);
          } else {
            throw indexError;
          }
        }

      console.log(`Toplam ${snapshot.docs.length} diyet planı bulundu`);

      const planlar: Array<{
        danisanId: string;
        danisanAdi: string;
        olusturmaTarihi: string;
      }> = [];

      // Danışan bilgilerini almak için users collection'ını oku
      const danisanMap = new Map<string, string>();

      for (const doc of snapshot.docs) {
        try {
          const planData = doc.data();
          
          // Daha kapsamlı clientId arama
          const clientId = planData.clientId 
            || planData.client?.id 
            || planData.userId 
            || planData.user?.id
            || planData.client
            || planData.user;
          
          console.log("Plan işleniyor:", {
            docId: doc.id,
            clientId: clientId,
            planDataKeys: Object.keys(planData),
            planDataSample: {
              clientId: planData.clientId,
              client: planData.client,
              userId: planData.userId,
              user: planData.user,
              createdAt: planData.createdAt ? (planData.createdAt.toDate ? planData.createdAt.toDate().toISOString() : String(planData.createdAt)) : null
            }
          });
          
          // clientId yoksa planı atlama, "unknown" olarak işaretle
          const finalClientId = clientId || `unknown_${doc.id}`;
          
          if (finalClientId && !finalClientId.startsWith("unknown_") && !danisanMap.has(finalClientId)) {
            // Danışan bilgisini al
            try {
              const clientDoc = await mobileAppDb.collection("users").doc(finalClientId).get();
              if (clientDoc.exists) {
                const clientData = clientDoc.data();
                const ad = clientData?.name || clientData?.firstName || "";
                const soyad = clientData?.surname || clientData?.lastName || "";
                const danisanAdi = `${ad} ${soyad}`.trim() || "Bilinmeyen Danışan";
                danisanMap.set(finalClientId, danisanAdi);
                console.log(`Danışan bilgisi alındı: ${finalClientId} -> ${danisanAdi}`);
              } else {
                danisanMap.set(finalClientId, "Bilinmeyen Danışan");
                console.log(`Danışan bulunamadı: ${finalClientId}`);
              }
            } catch (error) {
              console.error(`Danışan bilgisi alınamadı (${finalClientId}):`, error);
              danisanMap.set(finalClientId, "Bilinmeyen Danışan");
            }
          } else if (finalClientId.startsWith("unknown_")) {
            danisanMap.set(finalClientId, "Bilinmeyen Danışan");
          }

          const createdAt = planData.createdAt || planData.created_at || planData.dateCreated || planData.created;
          if (createdAt) {
            try {
              let tarih: Date;
              if (createdAt.toDate && typeof createdAt.toDate === "function") {
                tarih = createdAt.toDate();
              } else if (createdAt instanceof admin.firestore.Timestamp) {
                tarih = createdAt.toDate();
              } else if (createdAt instanceof Date) {
                tarih = createdAt;
              } else if (typeof createdAt === "string" || typeof createdAt === "number") {
                tarih = new Date(createdAt);
              } else {
                throw new Error("Bilinmeyen tarih formatı");
              }
              
              if (isNaN(tarih.getTime())) {
                throw new Error("Geçersiz tarih değeri");
              }

              planlar.push({
                danisanId: finalClientId,
                danisanAdi: danisanMap.get(finalClientId) || "Bilinmeyen Danışan",
                olusturmaTarihi: tarih.toISOString(),
              });
              
              console.log(`Plan eklendi: ${finalClientId} - ${tarih.toISOString()}`);
            } catch (dateError) {
              console.error(`Tarih dönüştürme hatası (${finalClientId}):`, dateError, "createdAt:", createdAt);
              // Tarih hatası olsa bile planı ekle (tarih olarak şu anki zamanı kullan)
              planlar.push({
                danisanId: finalClientId,
                danisanAdi: danisanMap.get(finalClientId) || "Bilinmeyen Danışan",
                olusturmaTarihi: new Date().toISOString(),
              });
            }
          } else {
            console.warn("createdAt bulunamadı, plan atlanıyor:", doc.id, "Plan data keys:", Object.keys(planData));
          }
        } catch (docError) {
          console.error(`Plan işlenirken hata (${doc.id}):`, docError);
        }
      }
      
      console.log(`Toplam ${planlar.length} plan işlendi, ${danisanMap.size} benzersiz danışan bulundu`);

      console.log(`Toplam ${planlar.length} plan işlendi`);
      response.status(200).json({ planlar });
    } catch (queryError: any) {
      console.error("Firestore sorgu hatası:", queryError);
      response.status(500).json({ 
        error: "Firestore sorgu hatası", 
        details: queryError.message || String(queryError),
        stack: queryError.stack
      });
      return;
    }
  } catch (error: any) {
    console.error("getDiyetPlanlariByAy genel hatası:", error);
    console.error("Hata stack:", error.stack);
    response.status(500).json({ 
      error: error.message || "Sunucu hatası",
      details: error.toString(),
      stack: error.stack
    });
  }
});

/**
 * Mobil uygulamadan pasif danışan sayısını oku
 */
export const getPasifDanisanSayisi = corsHandler(async (request, response) => {
  try {
    let diyetisyenId: string | undefined;
    
    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      diyetisyenId = body?.diyetisyenId;
    } else if (request.method === "GET") {
      diyetisyenId = request.query.diyetisyenId as string;
    }

    if (!diyetisyenId) {
      response.status(400).json({ error: "diyetisyenId gerekli" });
      return;
    }

    const docRef = await mobileAppDb.collection("users").doc(diyetisyenId).get();

    if (!docRef.exists) {
      response.status(404).json({ error: "Diyetisyen bulunamadı" });
      return;
    }

    const data = docRef.data();
    const pasifDanisanSayisi = data?.pasifDanisanSayisi || 0;

    // CORS artık corsHandler wrapper'ı tarafından handle ediliyor(response);
    response.status(200).json({ pasifDanisanSayisi });
  } catch (error: any) {
    console.error("getPasifDanisanSayisi hatası:", error);
    response.status(500).json({ error: error.message || "Sunucu hatası" });
  }
});

/**
 * Mobil uygulamadan diyetisyenin aktiflik durumunu oku
 * Mobil uygulama bu function'ı çağırarak web panel'deki aktiflik durumunu öğrenir
 */
export const getDietitianStatus = corsHandler(async (request, response) => {
  try {
    let diyetisyenId: string | undefined;
    
    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      diyetisyenId = body?.diyetisyenId;
    } else if (request.method === "GET") {
      diyetisyenId = request.query.diyetisyenId as string;
    }

    if (!diyetisyenId) {
      response.status(400).json({ error: "diyetisyenId gerekli" });
      return;
    }

    // Web Panel Firebase projesinden diyetisyen bilgilerini oku
    const webPanelDb = admin.firestore();
    const docRef = await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).get();

    if (!docRef.exists) {
      response.status(404).json({ error: "Diyetisyen bulunamadı" });
      return;
    }

    const data = docRef.data();
    
    // Aktiflik durumunu mobil uygulamanın beklediği formata çevir
    // Web panel: 'aktif' | 'pasif' | 'askiyaAlindi'
    // Mobil app: 'Aktif' | 'Pasif' | 'Askıya Alındı'
    let aktiflikDurumu = "Aktif"; // Varsayılan
    const webAktiflikDurumu = data?.aktiflikDurumu;
    if (webAktiflikDurumu === "aktif") {
      aktiflikDurumu = "Aktif";
    } else if (webAktiflikDurumu === "pasif") {
      aktiflikDurumu = "Pasif";
    } else if (webAktiflikDurumu === "askiyaAlindi") {
      aktiflikDurumu = "Askıya Alındı";
    }

    response.status(200).json({
      aktiflikDurumu: aktiflikDurumu,
    });
  } catch (error: any) {
    console.error("getDietitianStatus hatası:", error);
    response.status(500).json({ error: error.message || "Sunucu hatası" });
  }
});

/**
 * Üye numarası oluşturma endpoint'i (HTTP)
 * Frontend'den çağrılabilir - Mevcut diyetisyenler için üye numarası oluşturur
 */
export const generateUyeNumarasi = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `generateUyeNumarasi_${Date.now()}`;
  
  try {
    console.log(`[${functionId}] generateUyeNumarasi başladı`);
    
    const diyetisyenId = request.body?.diyetisyenId || request.query.diyetisyenId;
    console.log(`[${functionId}] Request body/query:`, { 
      body: request.body, 
      query: request.query,
      diyetisyenId 
    });
    
    if (!diyetisyenId) {
      console.error(`[${functionId}] diyetisyenId eksik`);
      response.status(400).json({ 
        error: "diyetisyenId gerekli",
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Diyetisyeni kontrol et
    console.log(`[${functionId}] Diyetisyen kontrol ediliyor:`, diyetisyenId);
    const diyetisyenDoc = await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).get();
    
    if (!diyetisyenDoc.exists) {
      console.error(`[${functionId}] Diyetisyen bulunamadı:`, diyetisyenId);
      response.status(404).json({ 
        error: "Diyetisyen bulunamadı",
        diyetisyenId: diyetisyenId,
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const diyetisyenData = diyetisyenDoc.data();
    console.log(`[${functionId}] Diyetisyen verisi:`, {
      id: diyetisyenDoc.id,
      uyeNumarasi: diyetisyenData?.uyeNumarasi,
      mobilUygulamadanKayit: diyetisyenData?.mobilUygulamadanKayit,
      kayitYeri: diyetisyenData?.kayitYeri
    });
    
    // Eğer zaten üye numarası varsa, onu döndür
    if (diyetisyenData?.uyeNumarasi && diyetisyenData.uyeNumarasi.trim() !== "") {
      console.log(`[${functionId}] ✅ Üye numarası zaten mevcut:`, diyetisyenData.uyeNumarasi);
      response.status(200).json({ 
        uyeNumarasi: diyetisyenData.uyeNumarasi, 
        mevcut: true,
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Üye numarası oluştur
    console.log(`[${functionId}] Yeni üye numarası oluşturuluyor...`);
    const uyeNumarasi = await generateUniqueUyeNumarasi();
    console.log(`[${functionId}] ✅ Üye numarası oluşturuldu:`, uyeNumarasi);
    
    // Ayarları oku (varsayılan değerler için)
    const ayarlarDoc = await webPanelDb.collection("ayarlar").doc("genelAyarlar").get();
    const ayarlar = ayarlarDoc.exists ? ayarlarDoc.data() : null;
    const varsayilanDanisanBasiUcret = ayarlar?.varsayilanDanisanBasiUcret || 199;
    const varsayilanIskontoOrani = ayarlar?.varsayilanIskontoOrani || 0;
    console.log(`[${functionId}] Ayarlar:`, {
      varsayilanDanisanBasiUcret,
      varsayilanIskontoOrani
    });
    
    // Diyetisyeni güncelle - üye numarası ve eksik alanları doldur
    const updateData: any = {
      uyeNumarasi: uyeNumarasi,
      sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Mobil uygulamadan gelen diyetisyenler için varsayılan değerleri de ata
    if (diyetisyenData?.mobilUygulamadanKayit || diyetisyenData?.kayitYeri === "mobil") {
      console.log(`[${functionId}] Mobil uygulamadan kayıt - varsayılan değerler atanıyor`);
      if (!diyetisyenData.danisanBasiUcret || diyetisyenData.danisanBasiUcret === 0) {
        updateData.danisanBasiUcret = varsayilanDanisanBasiUcret;
      }
      if (diyetisyenData.iskontoOrani === undefined || diyetisyenData.iskontoOrani === null) {
        updateData.iskontoOrani = varsayilanIskontoOrani;
      }
      if (!diyetisyenData.paketHakki && diyetisyenData.paketHakki !== 0) {
        updateData.paketHakki = 0;
      }
      if (diyetisyenData.aktifDanisanSayisi === undefined || diyetisyenData.aktifDanisanSayisi === null) {
        updateData.aktifDanisanSayisi = 0;
      }
    }
    
    console.log(`[${functionId}] Firestore güncelleme yapılıyor:`, updateData);
    await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).update(updateData);
    console.log(`[${functionId}] ✅ Firestore güncelleme tamamlandı`);

    console.log(`[${functionId}] ✅ Diyetisyen ${diyetisyenId} için üye numarası oluşturuldu: ${uyeNumarasi}`);
    
    response.status(200).json({ 
      uyeNumarasi, 
      olusturuldu: true,
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[${functionId}] ❌ generateUyeNumarasi hatası:`, {
      message: error.message,
      stack: error.stack,
      diyetisyenId: request.body?.diyetisyenId || request.query?.diyetisyenId,
      timestamp: new Date().toISOString()
    });
    response.status(500).json({ 
      error: error.message || "Sunucu hatası",
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Mobil uygulamadan gelen diyetisyenler için üye numarası ve varsayılan değerler atama
 * onCreate: Yeni kayıt geldiğinde çalışır
 * onWrite: Mevcut kayıtlar için de çalışır (üye numarası eksikse oluşturur)
 */
export const processMobileAppDiyetisyen = functions.firestore
  .document("diyetisyenler/{diyetisyenId}")
  .onWrite(async (change, context) => {
    const diyetisyenData = change.after.exists ? change.after.data() : null;
    const diyetisyenId = context.params.diyetisyenId;

    if (!diyetisyenData) {
      return; // Silme işlemi
    }

    // Sadece mobil uygulamadan gelen kayıtlar için işlem yap
    if (!diyetisyenData?.mobilUygulamadanKayit && diyetisyenData?.kayitYeri !== "mobil") {
      console.log(`Diyetisyen ${diyetisyenId} mobil uygulamadan gelmedi, işlem atlandı`);
      return;
    }

    // Üye numarası varsa ve diğer alanlar da doluysa, işlem yapma (sonsuz döngü önleme)
    const beforeData = change.before.exists ? change.before.data() : null;
    
    // Onay durumu değişikliğini kontrol et (beklemede -> onaylandi)
    const onayDurumuDegisti = beforeData && 
                               beforeData.onayDurumu !== "onaylandi" && 
                               diyetisyenData.onayDurumu === "onaylandi";
    
    if (beforeData && 
        beforeData.uyeNumarasi && 
        beforeData.uyeNumarasi.trim() !== "" &&
        beforeData.danisanBasiUcret &&
        beforeData.iskontoOrani !== undefined &&
        !onayDurumuDegisti) {
      // Sadece üye numarası eksikse güncelle
      if (diyetisyenData.uyeNumarasi && diyetisyenData.uyeNumarasi.trim() !== "") {
        console.log(`Diyetisyen ${diyetisyenId} zaten üye numarasına sahip, işlem atlandı`);
        return;
      }
    }

    try {
      // Ayarları oku (varsayılan değerler için)
      const ayarlarDoc = await webPanelDb.collection("ayarlar").doc("genelAyarlar").get();
      const ayarlar = ayarlarDoc.exists ? ayarlarDoc.data() : null;
      
      const varsayilanDanisanBasiUcret = ayarlar?.varsayilanDanisanBasiUcret || 199;
      const varsayilanIskontoOrani = ayarlar?.varsayilanIskontoOrani || 0;
      const varsayilanDenemeSuresiGunSayisi = ayarlar?.varsayilanDenemeSuresiGunSayisi || 15;

      // Üye numarası yoksa veya boşsa kesinlikle oluştur
      let uyeNumarasi = diyetisyenData.uyeNumarasi;
      if (!uyeNumarasi || uyeNumarasi.trim() === "" || uyeNumarasi === null || uyeNumarasi === undefined) {
        uyeNumarasi = await generateUniqueUyeNumarasi();
        console.log(`Diyetisyen ${diyetisyenId} için üye numarası oluşturuldu: ${uyeNumarasi}`);
      }

      // Güncelleme verileri
      const updateData: any = {
        uyeNumarasi: uyeNumarasi,
        kayitYeri: "mobil",
        mobilUygulamadanKayit: true,
        sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Varsayılan değerler yoksa ata
      if (!diyetisyenData.danisanBasiUcret || diyetisyenData.danisanBasiUcret === 0) {
        updateData.danisanBasiUcret = varsayilanDanisanBasiUcret;
      }
      
      if (diyetisyenData.iskontoOrani === undefined || diyetisyenData.iskontoOrani === null) {
        updateData.iskontoOrani = varsayilanIskontoOrani;
      }

      if (!diyetisyenData.paketHakki || diyetisyenData.paketHakki === 0) {
        updateData.paketHakki = 0; // Deneme süresinde paket hakkı yok
      }

      if (!diyetisyenData.aktifDanisanSayisi || diyetisyenData.aktifDanisanSayisi === undefined) {
        updateData.aktifDanisanSayisi = 0;
      }

      if (!diyetisyenData.pasifDanisanSayisi || diyetisyenData.pasifDanisanSayisi === undefined) {
        updateData.pasifDanisanSayisi = 0;
      }

      // Deneme süresi kontrolü ve başlatma
      // 1. Eğer onay durumu "onaylandi" ise ve deneme süresi yoksa veya aktif değilse başlat
      // 2. Eğer onay durumu "beklemede" ise deneme süresini başlatma
      if (diyetisyenData.onayDurumu === "onaylandi") {
        // Onaylandı - deneme süresi yoksa veya aktif değilse başlat
        if (!diyetisyenData.denemeSuresi || !diyetisyenData.denemeSuresi.aktif) {
          const now = new Date();
          const bitisTarihi = new Date(now);
          bitisTarihi.setDate(bitisTarihi.getDate() + varsayilanDenemeSuresiGunSayisi);
          
          updateData.denemeSuresi = {
            aktif: true,
            baslangicTarihi: admin.firestore.Timestamp.fromDate(now),
            bitisTarihi: admin.firestore.Timestamp.fromDate(bitisTarihi),
            gunSayisi: varsayilanDenemeSuresiGunSayisi,
          };
          updateData.odemeDurumu = "deneme";
          console.log(`Diyetisyen ${diyetisyenId} onaylandı, deneme süresi başlatıldı: ${varsayilanDenemeSuresiGunSayisi} gün`);
        }
      } else if (diyetisyenData.onayDurumu !== "onaylandi") {
        // Onaylanmamış - deneme süresini başlatma
        if (!diyetisyenData.denemeSuresi) {
          // Sadece yapıyı hazırla, aktif etme
          updateData.denemeSuresi = {
            aktif: false,
            gunSayisi: varsayilanDenemeSuresiGunSayisi,
          };
        } else if (diyetisyenData.denemeSuresi.aktif) {
          // Eğer aktif deneme süresi varsa, onaylanmadığı için pasif yap
          updateData.denemeSuresi = {
            ...diyetisyenData.denemeSuresi,
            aktif: false,
          };
        }
        // Ödeme durumu onaylanana kadar "beklemede" olmalı
        if (!diyetisyenData.odemeDurumu || diyetisyenData.odemeDurumu === "deneme") {
          updateData.odemeDurumu = "beklemede";
        }
        console.log(`Diyetisyen ${diyetisyenId} onaylanmadı, deneme süresi başlatılmadı`);
      }

      // API erişim durumu yoksa varsayılan değer ata
      if (!diyetisyenData.apiErisimDurumu) {
        updateData.apiErisimDurumu = "aktif";
      }

      // Aktiflik durumu yoksa varsayılan değer ata
      if (!diyetisyenData.aktiflikDurumu) {
        updateData.aktiflikDurumu = "aktif";
      }

      // Onay durumu yoksa varsayılan değer ata
      if (!diyetisyenData.onayDurumu) {
        updateData.onayDurumu = "beklemede";
      }

      // Güncellemeleri yap
      await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).update(updateData);
      
      console.log(`Diyetisyen ${diyetisyenId} için üye numarası ve varsayılan değerler atandı:`, {
        uyeNumarasi,
        danisanBasiUcret: updateData.danisanBasiUcret,
        iskontoOrani: updateData.iskontoOrani,
      });
    } catch (error: any) {
      console.error(`Diyetisyen ${diyetisyenId} için varsayılan değerler atanırken hata:`, error);
      // Hata durumunda throw etme, log'la
    }
  });

/**
 * Web'ten kayıt olan diyetisyenler için üye numarası oluşturma
 * onCreate: Yeni kayıt geldiğinde çalışır
 * onWrite: Mevcut kayıtlar için de çalışır (üye numarası eksikse oluşturur)
 */
export const processWebDiyetisyen = functions.firestore
  .document("diyetisyenler/{diyetisyenId}")
  .onWrite(async (change, context) => {
    const diyetisyenData = change.after.exists ? change.after.data() : null;
    const diyetisyenId = context.params.diyetisyenId;

    if (!diyetisyenData) {
      return; // Silme işlemi
    }

    // Sadece web'ten kayıt olanlar için işlem yap
    const isWebKayit = (diyetisyenData?.kayitYeri === "web" || diyetisyenData?.kayitYeri === undefined) && 
                       !diyetisyenData?.mobilUygulamadanKayit;
    
    if (!isWebKayit) {
      console.log(`Diyetisyen ${diyetisyenId} web'ten kayıt olmadı, işlem atlandı`);
      return;
    }

    // Üye numarası zaten varsa ve doluysa, işlem yapma (sonsuz döngü önleme)
    const beforeData = change.before.exists ? change.before.data() : null;
    if (beforeData && 
        beforeData.uyeNumarasi && 
        beforeData.uyeNumarasi.trim() !== "") {
      // Üye numarası zaten varsa işlem yapma
      if (diyetisyenData.uyeNumarasi && diyetisyenData.uyeNumarasi.trim() !== "") {
        console.log(`Diyetisyen ${diyetisyenId} zaten üye numarasına sahip, işlem atlandı`);
        return;
      }
    }

    // Üye numarası yoksa veya boşsa oluştur
    if (!diyetisyenData.uyeNumarasi || 
        diyetisyenData.uyeNumarasi.trim() === "" || 
        diyetisyenData.uyeNumarasi === null || 
        diyetisyenData.uyeNumarasi === undefined) {
      try {
        const uyeNumarasi = await generateUniqueUyeNumarasi();
        console.log(`Diyetisyen ${diyetisyenId} (web kayıt) için üye numarası oluşturuldu: ${uyeNumarasi}`);
        
        // Üye numarasını güncelle
        await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).update({
          uyeNumarasi: uyeNumarasi,
          sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Diyetisyen ${diyetisyenId} için üye numarası başarıyla atandı: ${uyeNumarasi}`);
      } catch (error: any) {
        console.error(`Diyetisyen ${diyetisyenId} için üye numarası oluşturulurken hata:`, error);
        // Hata durumunda throw etme, log'la
      }
    }
  });

/**
 * Faz 4: Web Panelden Mobil Uygulamaya Senkronizasyon
 * Diyetisyen değiştiğinde mobil uygulamaya senkronize et
 * 
 * NOT: Mobil App service account gereklidir (mobile-app-service-account.json)
 * Şimdilik kod hazır, service account eklendiğinde aktif olacak
 */
export const syncDiyetisyenToMobileApp = functions.firestore
  .document("diyetisyenler/{diyetisyenId}")
  .onWrite(async (change, context) => {
    const diyetisyenData = change.after.exists ? change.after.data() : null;
    const beforeData = change.before.exists ? change.before.data() : null;
    const diyetisyenId = context.params.diyetisyenId;

    // Sonsuz döngü önleme: sadece mobile'e yazılacak alanlar değiştiğinde sync yap.
    // (Eski "kayitYeri/mobilUygulamadanKayit" flag tabanlı kontrol, mobilden kaydolan
    // kullanıcıların admin onayını asla mobile'e yansıtmıyordu — bu yüzden kaldırıldı.)
    const syncRelevantFields = [
      "email",
      "adSoyad",
      "telefon",
      "onayDurumu",
      "aktiflikDurumu",
      "aktifDanisanSayisi",
      "pasifDanisanSayisi",
    ];
    const hasRelevantChange = !beforeData || !diyetisyenData || syncRelevantFields.some(
      (field) => JSON.stringify(beforeData?.[field]) !== JSON.stringify(diyetisyenData?.[field])
    );
    if (!hasRelevantChange) {
      console.log(`Diyetisyen ${diyetisyenId} sync-relevant alanları değişmedi, atlandı`);
      return;
    }

    // ────────────────────────────────────────────────────────────────────
    // ANTI-LOOP GUARD
    //
    // Mobile cloud function `syncDietitianToWebPanel` `deletedAt` görürse
    // web doc'una `email: deleted_dietitian_${Date.now()}@deleted.local` ve
    // `adSoyad: "Silinmiş Diyetisyen"` yazar. Buradan da mobile'a geri sync
    // edersek mobile users değişir → mobile sync tekrar tetiklenir → yeni
    // Date.now() ile yeniden yazılır → SONSUZ DÖNGÜ.
    //
    // Bu yüzden silinmiş işaretli diyetisyenleri mobile'a geri yansıtmıyoruz —
    // mobile zaten silinmiş bilgiyi tutuyor, web'in onu mobile'a yazması
    // gereksiz ve döngü tetikliyor.
    // ────────────────────────────────────────────────────────────────────
    const isDeletedDoc = diyetisyenData?.isDeleted === true;
    const emailLooksLikeDeletedPlaceholder =
      typeof diyetisyenData?.email === "string" &&
      diyetisyenData.email.startsWith("deleted_dietitian_") &&
      diyetisyenData.email.endsWith("@deleted.local");
    const adSoyadIsDeletedPlaceholder = diyetisyenData?.adSoyad === "Silinmiş Diyetisyen";
    if (isDeletedDoc || emailLooksLikeDeletedPlaceholder || adSoyadIsDeletedPlaceholder) {
      console.log(
        `[syncDiyetisyenToMobileApp] Diyetisyen ${diyetisyenId} silinmiş işaretli, ` +
          "mobile'a geri yazılmadı (sonsuz döngü engelleme).",
      );
      return;
    }

    try {
      if (diyetisyenData) {
        // Ad soyadı ayır
        const adSoyad = diyetisyenData.adSoyad || "";
        const nameParts = adSoyad.split(" ");
        const name = nameParts[0] || "";
        const surname = nameParts.slice(1).join(" ") || "";

        // Aktiflik durumunu mobil uygulamanın beklediği formata çevir
        // Web panel: 'aktif' | 'pasif' | 'askiyaAlindi'
        // Mobil app: 'Aktif' | 'Pasif' | 'Askıya Alındı'
        let aktiflikDurumu = "Aktif"; // Varsayılan
        const webAktiflikDurumu = diyetisyenData.aktiflikDurumu;
        if (webAktiflikDurumu === "aktif") {
          aktiflikDurumu = "Aktif";
        } else if (webAktiflikDurumu === "pasif") {
          aktiflikDurumu = "Pasif";
        } else if (webAktiflikDurumu === "askiyaAlindi") {
          aktiflikDurumu = "Askıya Alındı";
        }

        const syncData: any = {
          email: diyetisyenData.email,
          name: name,
          surname: surname,
          phone: diyetisyenData.telefon || "",
          role: "dietitian",
          status: diyetisyenData.onayDurumu === "onaylandi" ? "approved" : "pending",
          aktifDanisanSayisi: diyetisyenData.aktifDanisanSayisi || 0,
          pasifDanisanSayisi: diyetisyenData.pasifDanisanSayisi || 0,
          aktiflikDurumu: aktiflikDurumu, // Mobil uygulamanın beklediği format
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Mobil uygulamaya yaz (mobile-app-service-account.json ile)
        await mobileAppDb.collection("users")
          .doc(diyetisyenId)
          .set(syncData, { merge: true });

        console.log(`Diyetisyen ${diyetisyenId} mobil uygulamaya senkronize edildi (aktiflikDurumu: ${aktiflikDurumu})`);
      }
    } catch (error: any) {
      console.error("Senkronizasyon hatası:", error);
      // Hata durumunda throw etme, log'la (sonsuz döngü önleme)
    }
  });

/**
 * Mevcut mobil uygulama kullanıcılarını web panel projesine senkronize et
 * Bu endpoint bir kez çalıştırılmalı (one-time sync)
 */
export const syncExistingMobileAppUsers = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `syncExistingMobileAppUsers_${Date.now()}`;
  
  try {
    console.log(`[${functionId}] Mevcut mobil uygulama kullanıcılarını senkronize etme başladı`);
    
    // Mobil uygulamadan tüm diyetisyenleri al
    const mobileAppUsers = await mobileAppDb.collection("users")
      .where("role", "==", "dietitian")
      .get();
    
    console.log(`[${functionId}] ${mobileAppUsers.size} diyetisyen bulundu`);
    
    const webPanelAuth = admin.auth();
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];
    
    for (const userDoc of mobileAppUsers.docs) {
      const userData = userDoc.data();
      const uid = userDoc.id;
      
      try {
        // Kullanıcı zaten var mı kontrol et
        try {
          await webPanelAuth.getUser(uid);
          console.log(`[${functionId}] Kullanıcı zaten mevcut: ${uid}`);
          successCount++;
          continue;
        } catch (error: any) {
          if (error.code !== "auth/user-not-found") {
            throw error;
          }
        }
        
        // Yeni kullanıcı oluştur
        await webPanelAuth.createUser({
          uid: uid,
          email: userData.email || "",
          displayName: `${userData.name || ""} ${userData.surname || ""}`.trim() || "",
          emailVerified: false,
        });
        
        console.log(`[${functionId}] ✅ Kullanıcı senkronize edildi: ${uid} (${userData.email})`);
        successCount++;
      } catch (error: any) {
        console.error(`[${functionId}] ❌ Kullanıcı senkronize edilemedi: ${uid}`, error.message);
        errorCount++;
        errors.push({
          uid: uid,
          email: userData.email,
          error: error.message,
        });
      }
    }
    
    console.log(`[${functionId}] ✅ Senkronizasyon tamamlandı: ${successCount} başarılı, ${errorCount} hata`);
    
    response.status(200).json({ 
      success: true,
      message: "Senkronizasyon tamamlandı",
      total: mobileAppUsers.size,
      successCount: successCount,
      errorCount: errorCount,
      errors: errors,
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[${functionId}] ❌ syncExistingMobileAppUsers hatası:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    response.status(500).json({ 
      error: error.message || "Sunucu hatası",
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Mobil uygulamadan şifre güncelleme
 * Mobil uygulamada şifre değiştirildiğinde, web panel projesinde de şifreyi günceller
 */
export const updatePasswordFromMobileApp = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `updatePasswordFromMobileApp_${Date.now()}`;
  
  try {
    console.log(`[${functionId}] updatePasswordFromMobileApp başladı`);
    
    const body = request.body as any;
    const { uid, email, password } = body;
    
    if (!uid || !email || !password) {
      console.error(`[${functionId}] uid, email veya password eksik`);
      response.status(400).json({ 
        error: "uid, email ve password gerekli",
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`[${functionId}] Mobil uygulamadan şifre güncelleme:`, { uid, email });

    // Web panel Firebase projesinde şifreyi güncelle
    const webPanelAuth = admin.auth();
    
    try {
      // Kullanıcı var mı kontrol et
      try {
        await webPanelAuth.getUser(uid);
        // Kullanıcı varsa şifreyi güncelle
        await webPanelAuth.updateUser(uid, {
          password: password,
        });
        console.log(`[${functionId}] ✅ Şifre güncellendi: ${uid}`);
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // Kullanıcı yoksa oluştur
          console.log(`[${functionId}] Kullanıcı bulunamadı, yeni kullanıcı oluşturuluyor: ${uid}`);
          await webPanelAuth.createUser({
            uid: uid,
            email: email,
            password: password,
            emailVerified: false,
          });
          console.log(`[${functionId}] ✅ Yeni kullanıcı oluşturuldu ve şifre ayarlandı: ${uid}`);
        } else {
          throw error;
        }
      }
      
      response.status(200).json({ 
        success: true,
        message: "Şifre başarıyla güncellendi",
        uid: uid,
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`[${functionId}] Şifre güncelleme hatası:`, {
        message: error.message,
        code: error.code,
        uid: uid,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  } catch (error: any) {
    console.error(`[${functionId}] ❌ updatePasswordFromMobileApp hatası:`, {
      message: error.message,
      stack: error.stack,
      body: request.body,
      timestamp: new Date().toISOString()
    });
    response.status(500).json({ 
      error: error.message || "Sunucu hatası",
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Mobil uygulamadan gelen Auth senkronizasyonu
 * Mobil uygulamada yeni kullanıcı oluşturulduğunda, web panel projesinde de aynı kullanıcıyı oluşturur
 * 
 * NOT: Bu endpoint mobil uygulama tarafından çağrılmalı
 * Mobil uygulama projesinde Auth onCreate trigger'ı bu endpoint'i çağırmalı
 */
/**
 * Eksik üye numaraları olan tüm diyetisyenler için üye numarası oluşturma endpoint'i
 * HTTP GET veya POST ile çağrılabilir
 */
export const generateAllMissingUyeNumarasi = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `generateAllMissingUyeNumarasi_${Date.now()}`;
  
  try {
    console.log(`[${functionId}] generateAllMissingUyeNumarasi başladı`);
    
    // Query parametrelerini al
    const kayitYeri = request.query.kayitYeri as string | undefined;
    const diyetisyenId = request.query.diyetisyenId as string | undefined;
    
    let query = webPanelDb.collection("diyetisyenler");

    // Belirli bir diyetisyen için
    if (diyetisyenId) {
      console.log(`[${functionId}] Belirli diyetisyen kontrol ediliyor: ${diyetisyenId}`);
      const doc = await query.doc(diyetisyenId).get();
      
      if (!doc.exists) {
        response.status(404).json({ 
          error: "Diyetisyen bulunamadı",
          diyetisyenId: diyetisyenId,
          functionId: functionId
        });
        return;
      }

      const data = doc.data();
      const uyeNumarasi = data?.uyeNumarasi;

      if (!uyeNumarasi || uyeNumarasi.trim() === "") {
        const newUyeNumarasi = await generateUniqueUyeNumarasi();
        await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).update({
          uyeNumarasi: newUyeNumarasi,
          sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
        });

        response.status(200).json({ 
          success: true,
          diyetisyenId: diyetisyenId,
          uyeNumarasi: newUyeNumarasi,
          olusturuldu: true,
          functionId: functionId
        });
      } else {
        response.status(200).json({ 
          success: true,
          diyetisyenId: diyetisyenId,
          uyeNumarasi: uyeNumarasi,
          mevcut: true,
          functionId: functionId
        });
      }
      return;
    }

    // Tüm diyetisyenleri getir
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      response.status(200).json({ 
        success: true,
        message: "Hiç diyetisyen bulunamadı",
        toplam: 0,
        eksik: 0,
        guncellenen: 0,
        functionId: functionId
      });
      return;
    }

    let eksikSayisi = 0;
    let guncellenenSayisi = 0;
    let hataSayisi = 0;
    const guncellenenler: Array<{id: string, uyeNumarasi: string}> = [];
    const hatalar: Array<{id: string, hata: string}> = [];

    // Her diyetisyeni kontrol et
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const diyetisyenId = doc.id;
      const uyeNumarasi = data.uyeNumarasi;

      // Kayıt yeri filtresi
      if (kayitYeri && data.kayitYeri !== kayitYeri) {
        continue;
      }

      // Üye numarası eksik mi kontrol et
      if (!uyeNumarasi || uyeNumarasi.trim() === "" || uyeNumarasi === null || uyeNumarasi === undefined) {
        eksikSayisi++;
        
        try {
          const newUyeNumarasi = await generateUniqueUyeNumarasi();
          await webPanelDb.collection("diyetisyenler").doc(diyetisyenId).update({
            uyeNumarasi: newUyeNumarasi,
            sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
          });

          guncellenenSayisi++;
          guncellenenler.push({ id: diyetisyenId, uyeNumarasi: newUyeNumarasi });
          console.log(`[${functionId}] ✅ ${data.adSoyad || diyetisyenId} - ${newUyeNumarasi}`);
        } catch (error: any) {
          hataSayisi++;
          hatalar.push({ id: diyetisyenId, hata: error.message });
          console.error(`[${functionId}] ❌ Hata (${diyetisyenId}):`, error.message);
        }
      }
    }

    console.log(`[${functionId}] ✅ İşlem tamamlandı: ${guncellenenSayisi}/${eksikSayisi} güncellendi`);

    response.status(200).json({ 
      success: true,
      toplam: snapshot.size,
      eksik: eksikSayisi,
      guncellenen: guncellenenSayisi,
      hata: hataSayisi,
      guncellenenler: guncellenenler.slice(0, 100), // İlk 100'ü göster
      hatalar: hatalar.slice(0, 100), // İlk 100'ü göster
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[${functionId}] ❌ generateAllMissingUyeNumarasi hatası:`, error);
    response.status(500).json({ 
      error: error.message || "Sunucu hatası",
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Otomatik/Manuel fatura kesme endpoint'i (HTTP)
 * Admin panelden veya Cloud Scheduler'dan çağrılabilir
 * Her ayın 1'inde Cloud Scheduler ile otomatik çağrılabilir
 */
export const otomatikFaturaKesme = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `otomatikFaturaKesme_${Date.now()}`;
  
  try {
    console.log(`[${functionId}] Otomatik fatura kesme başladı`);
    
    // Önceki ayın faturalarını oluştur
    // Not: Bu fonksiyon src/services/fatura/faturaOlusturmaService.ts'de tanımlı
    // HTTP endpoint olarak çağrılabilir veya Cloud Scheduler ile otomatik çalıştırılabilir
    
    // Şimdilik manuel çağrı için hazır, Cloud Scheduler kurulumu için dokümantasyon eklenecek
    response.status(200).json({
      success: true,
      message: "Fatura kesme işlemi admin panelden 'Faturalar' sayfasından yapılabilir",
      functionId: functionId,
      timestamp: new Date().toISOString(),
      note: "Cloud Scheduler kurulumu için: Her ayın 1'inde bu endpoint'i çağıracak bir scheduler oluşturun"
    });
  } catch (error: any) {
    console.error(`[${functionId}] ❌ Otomatik fatura kesme hatası:`, error);
    response.status(500).json({
      error: error.message || "Sunucu hatası",
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  }
});

export const syncAuthFromMobileApp = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `syncAuthFromMobileApp_${Date.now()}`;
  
  try {
    console.log(`[${functionId}] syncAuthFromMobileApp başladı`);
    
    const body = request.body as any;
    const { uid, email, displayName, emailVerified, password } = body;
    
    if (!uid || !email) {
      console.error(`[${functionId}] uid veya email eksik`);
      response.status(400).json({ 
        error: "uid ve email gerekli",
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log(`[${functionId}] Mobil uygulamadan Auth senkronizasyonu:`, { uid, email });

    // Web panel Firebase projesinde kullanıcı oluştur
    const webPanelAuth = admin.auth();
    
    try {
      // Önce kullanıcı zaten var mı kontrol et
      try {
        await webPanelAuth.getUser(uid);
        console.log(`[${functionId}] Kullanıcı zaten mevcut: ${uid}`);
        response.status(200).json({ 
          success: true,
          message: "Kullanıcı zaten mevcut",
          uid: uid,
          functionId: functionId,
          timestamp: new Date().toISOString()
        });
        return;
      } catch (error: any) {
        // Kullanıcı yoksa devam et
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      // Yeni kullanıcı oluştur
      const createUserData: any = {
        uid: uid,
        email: email,
        emailVerified: emailVerified || false,
        displayName: displayName || "",
      };

      // Şifre varsa ekle
      if (password) {
        createUserData.password = password;
      }

      await webPanelAuth.createUser(createUserData);
      
      console.log(`[${functionId}] ✅ Auth kullanıcısı web panel projesine senkronize edildi: ${uid}`);
      
      response.status(200).json({ 
        success: true,
        message: "Auth kullanıcısı başarıyla senkronize edildi",
        uid: uid,
        functionId: functionId,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error(`[${functionId}] Auth senkronizasyon hatası:`, {
        message: error.message,
        code: error.code,
        uid: uid,
        timestamp: new Date().toISOString()
      });
      
      // Kullanıcı zaten varsa hata değil
      if (error.code === "auth/uid-already-exists") {
        response.status(200).json({ 
          success: true,
          message: "Kullanıcı zaten mevcut",
          uid: uid,
          functionId: functionId,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      throw error;
    }
  } catch (error: any) {
    console.error(`[${functionId}] ❌ syncAuthFromMobileApp hatası:`, {
      message: error.message,
      stack: error.stack,
      body: request.body,
      timestamp: new Date().toISOString()
    });
    response.status(500).json({
      error: error.message || "Sunucu hatası",
      functionId: functionId,
      timestamp: new Date().toISOString()
    });
  }
});

// Telefon numarasını E.164 (+90...) formatına çevir
function normalizePhoneNumberForAuth(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/\s+/g, "").replace(/[()-]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0")) {
      cleaned = "+90" + cleaned.substring(1);
    } else if (cleaned.startsWith("90")) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+90" + cleaned;
    }
  }
  return cleaned;
}

/**
 * Admin panelinden manuel kullanıcı kaydı oluştur
 *
 * Kullanım: Mobil uygulamadan kayıt olurken sorun yaşayan kullanıcıları admin
 * panel üzerinden manuel olarak sisteme eklemek için kullanılır. Fonksiyon hem
 * Mobil Firebase projesinde Authentication kaydı hem de Firestore users dokümanı
 * oluşturur. Böylece kullanıcı uygulamaya email + şifre ile giriş yapıp hemen
 * kullanmaya başlayabilir.
 *
 * Güvenlik: Yalnızca web panel'de superAdmin / admin olarak işaretlenmiş
 * kullanıcıların ID token'ı ile çağrılabilir.
 */
export const adminCreateMobileUser = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `adminCreateMobileUser_${Date.now()}`;

  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Yalnızca POST desteklenir", functionId });
      return;
    }

    // 1) Admin ID token kontrolü
    const authHeader = request.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      response.status(401).json({ error: "Authorization bearer token eksik", functionId });
      return;
    }
    const idToken = authHeader.substring("Bearer ".length);

    const webPanelAuth = admin.auth();
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await webPanelAuth.verifyIdToken(idToken);
    } catch (err: any) {
      console.error(`[${functionId}] Geçersiz token:`, err.message);
      response.status(401).json({ error: "Geçersiz veya süresi dolmuş token", functionId });
      return;
    }

    // Admin koleksiyonundan rol kontrolü
    const adminSnap = await webPanelDb.collection("adminler").doc(decoded.uid).get();
    if (!adminSnap.exists) {
      response.status(403).json({ error: "Bu işlem için admin yetkisi gerekli", functionId });
      return;
    }
    const adminData = adminSnap.data() || {};
    const isActiveAdmin =
      adminData.status === "approved" ||
      adminData.status === "active" ||
      adminData.aktif === true ||
      adminData.aktif === "true";
    const roleValue = (adminData.role || adminData.rol || "").toString();
    if (!isActiveAdmin || (roleValue !== "admin" && roleValue !== "superAdmin")) {
      response.status(403).json({ error: "Yetersiz yetki", functionId });
      return;
    }

    // 2) Body doğrula
    const body = (typeof request.body === "string" ? JSON.parse(request.body) : request.body) || {};
    const rawEmail: string = (body.email || "").toString().trim().toLowerCase();
    const password: string = (body.password || "").toString();
    const name: string = (body.name || "").toString().trim();
    const surname: string = (body.surname || "").toString().trim();
    const role: string = (body.role || "client").toString();
    const rawPhone: string = (body.phone || "").toString().trim();

    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) errors.push("Geçerli bir e-posta girin");
    if (!password || password.length < 6) errors.push("Şifre en az 6 karakter olmalı");
    if (!name) errors.push("Ad gerekli");
    if (!surname) errors.push("Soyad gerekli");
    if (role !== "client" && role !== "dietitian") errors.push("Rol client veya dietitian olmalı");

    let normalizedPhone: string | undefined;
    if (rawPhone) {
      const phoneOnlyDigits = rawPhone.replace(/[^0-9+]/g, "");
      if (!/^(\+?\d{10,15})$/.test(phoneOnlyDigits)) {
        errors.push("Telefon numarası formatı geçersiz");
      } else {
        normalizedPhone = normalizePhoneNumberForAuth(rawPhone);
      }
    }

    if (errors.length > 0) {
      response.status(400).json({ error: errors.join(". "), functionId });
      return;
    }

    // 3) Mobil Firebase projesinde Auth + Firestore kaydı oluştur
    const mobileAppAuth = admin.app("mobileApp").auth();

    // Email ile mevcut kullanıcı var mı?
    try {
      const existing = await mobileAppAuth.getUserByEmail(rawEmail);
      if (existing) {
        response.status(409).json({
          error: "Bu e-posta ile zaten bir kullanıcı kayıtlı. Lütfen farklı bir e-posta girin veya mevcut kullanıcıyı kullanın.",
          functionId,
        });
        return;
      }
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") {
        console.error(`[${functionId}] getUserByEmail hata:`, err);
        throw err;
      }
    }

    // Telefon ile mevcut kullanıcı var mı? (varsa çakışmayı raporla)
    if (normalizedPhone) {
      try {
        const existingByPhone = await mobileAppAuth.getUserByPhoneNumber(normalizedPhone);
        if (existingByPhone) {
          response.status(409).json({
            error: "Bu telefon numarası başka bir kullanıcıya bağlı. Lütfen farklı bir numara girin.",
            functionId,
          });
          return;
        }
      } catch (err: any) {
        if (err.code === "auth/invalid-phone-number") {
          response.status(400).json({ error: "Telefon numarası Firebase tarafından reddedildi", functionId });
          return;
        }
        if (err.code !== "auth/user-not-found") {
          console.error(`[${functionId}] getUserByPhoneNumber hata:`, err);
        }
      }
    }

    // Firebase Auth kullanıcısı oluştur
    const createPayload: admin.auth.CreateRequest = {
      email: rawEmail,
      password: password,
      displayName: `${name} ${surname}`.trim(),
      emailVerified: true,
    };
    if (normalizedPhone) {
      createPayload.phoneNumber = normalizedPhone;
    }

    let createdUser: admin.auth.UserRecord;
    try {
      createdUser = await mobileAppAuth.createUser(createPayload);
    } catch (err: any) {
      console.error(`[${functionId}] createUser hata:`, err);
      let userMessage = err.message || "Kullanıcı oluşturulamadı";
      if (err.code === "auth/email-already-exists") {
        userMessage = "Bu e-posta ile zaten bir kullanıcı kayıtlı";
      } else if (err.code === "auth/phone-number-already-exists") {
        userMessage = "Bu telefon numarası başka bir kullanıcıya bağlı";
      } else if (err.code === "auth/invalid-phone-number") {
        userMessage = "Telefon numarası formatı geçersiz";
      } else if (err.code === "auth/invalid-email") {
        userMessage = "E-posta adresi geçersiz";
      } else if (err.code === "auth/weak-password") {
        userMessage = "Şifre çok zayıf (en az 6 karakter olmalı)";
      }
      response.status(400).json({ error: userMessage, code: err.code, functionId });
      return;
    }

    const uid = createdUser.uid;
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    // Firestore users dokümanı oluştur (mobilin beklediği şema)
    const userDocData: any = {
      email: rawEmail,
      name: name,
      surname: surname,
      role: role,
      status: "approved",
      createdAt: serverTimestamp,
      updatedAt: serverTimestamp,
      createdBy: "admin-panel",
      createdByAdminUid: decoded.uid,
      legalConsents: {
        privacyPolicy: true,
        kvkkAydinlatma: true,
        acikRiza: true,
        consentedAt: serverTimestamp,
        platform: "web",
        source: "admin-panel",
      },
    };
    if (normalizedPhone) {
      userDocData.phone = normalizedPhone;
    }

    try {
      await mobileAppDb.collection("users").doc(uid).set(userDocData);
    } catch (err: any) {
      console.error(`[${functionId}] Firestore yazma hatası, Auth kullanıcısı rollback ediliyor:`, err);
      try {
        await mobileAppAuth.deleteUser(uid);
      } catch (delErr: any) {
        console.error(`[${functionId}] Auth rollback başarısız:`, delErr);
      }
      response.status(500).json({ error: "Kullanıcı dokümanı oluşturulamadı: " + err.message, functionId });
      return;
    }

    // Yasal onay log kaydı (best-effort)
    try {
      await mobileAppDb.collection("legalConsentLogs").add({
        userId: uid,
        userEmail: rawEmail,
        userName: name,
        userSurname: surname,
        userRole: role,
        privacyPolicy: true,
        kvkkAydinlatma: true,
        acikRiza: true,
        platform: "web",
        source: "admin-panel",
        createdByAdminUid: decoded.uid,
        consentedAt: serverTimestamp,
        createdAt: serverTimestamp,
      });
    } catch (consentErr: any) {
      console.warn(`[${functionId}] Yasal onay log kaydı oluşturulamadı (kullanıcı kaydı tamamlandı):`, consentErr.message);
    }

    console.log(`[${functionId}] ✅ Admin tarafından mobil kullanıcı oluşturuldu: ${uid} (${rawEmail}) role=${role}`);

    response.status(200).json({
      success: true,
      uid: uid,
      email: rawEmail,
      message: "Kullanıcı başarıyla oluşturuldu. Mobil uygulamadan bu e-posta ve şifre ile giriş yapabilir.",
      functionId,
    });
  } catch (error: any) {
    console.error(`[${functionId}] adminCreateMobileUser genel hata:`, {
      message: error.message,
      stack: error.stack,
    });
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

// ============================================================================
// MEAL TEMPLATE (Öğün Şablonu) — Cross-project CRUD
// Web panel'deki diyetisyen ID token'ı ile mobil Firebase projesine
// (dietcoop-432fa) `mealTemplates` koleksiyonuna yazma/okuma yapılır.
// Web ve mobil aynı diyetisyen UID'sini paylaştığı için (mobile-app sync),
// token'dan gelen uid doğrudan dietitianId olarak kullanılabilir.
// ============================================================================

interface MealTemplateItemPayload {
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  displayUnit?: string;
}

interface MealTemplateMealPayload {
  mealType: string;
  mealNumber: number;
  items: MealTemplateItemPayload[];
}

/**
 * Authorization: Bearer <web panel id token>'ı doğrula.
 * Diyetisyen rolü kontrolü yapar; uyumlu UID'i döner.
 */
async function authenticateDiyetisyen(
  request: express.Request
): Promise<{ uid: string } | { error: string; status: number }> {
  const authHeader = request.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: "Authorization bearer token eksik", status: 401 };
  }
  const idToken = authHeader.substring("Bearer ".length);
  const webPanelAuth = admin.auth();
  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await webPanelAuth.verifyIdToken(idToken);
  } catch (err: any) {
    return { error: "Geçersiz veya süresi dolmuş token", status: 401 };
  }

  // Diyetisyen kaydı var mı kontrol et
  const diyetisyenSnap = await webPanelDb
    .collection("diyetisyenler")
    .doc(decoded.uid)
    .get();
  if (!diyetisyenSnap.exists) {
    // Admin de izin alabilir
    const adminSnap = await webPanelDb.collection("adminler").doc(decoded.uid).get();
    if (!adminSnap.exists) {
      return { error: "Diyetisyen kaydı bulunamadı", status: 403 };
    }
  }

  return { uid: decoded.uid };
}

function sanitizeTemplateMeals(rawMeals: any): MealTemplateMealPayload[] {
  if (!Array.isArray(rawMeals)) return [];
  return rawMeals.map((meal: any, index: number) => {
    const mealType = typeof meal?.mealType === "string" ? meal.mealType.trim() : "";
    const mealNumber = Number.isFinite(Number(meal?.mealNumber))
      ? Number(meal.mealNumber)
      : index + 1;
    const items = Array.isArray(meal?.items)
      ? meal.items.map((item: any) => {
        const out: MealTemplateItemPayload = {
          name: typeof item?.name === "string" ? item.name.trim() : "",
          amount: Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0,
          unit: typeof item?.unit === "string" ? item.unit : "gram",
          calories: Number.isFinite(Number(item?.calories)) ? Number(item.calories) : 0,
        };
        if (typeof item?.displayUnit === "string" && item.displayUnit.trim()) {
          out.displayUnit = item.displayUnit.trim();
        }
        return out;
      })
      : [];
    return { mealType, mealNumber, items };
  });
}

/**
 * Diyetisyenin tüm şablonlarını listele
 */
export const listMealTemplates = corsHandler(async (
  request: express.Request,
  response: express.Response
) => {
  const functionId = `listMealTemplates_${Date.now()}`;
  try {
    if (request.method !== "GET" && request.method !== "POST") {
      response.status(405).json({ error: "GET veya POST desteklenir", functionId });
      return;
    }
    const authResult = await authenticateDiyetisyen(request);
    if ("error" in authResult) {
      response.status(authResult.status).json({ error: authResult.error, functionId });
      return;
    }
    const dietitianId = authResult.uid;

    const snapshot = await mobileAppDb
      .collection("mealTemplates")
      .where("dietitianId", "==", dietitianId)
      .get();

    const templates = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        category: data.category || null,
        dietitianId: data.dietitianId,
        meals: data.meals || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    // Memory'de en yeni önce sırala
    templates.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });

    response.status(200).json({ templates, functionId });
  } catch (error: any) {
    console.error(`[${functionId}] listMealTemplates hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

/**
 * Tek bir şablonu getir
 */
export const getMealTemplate = corsHandler(async (
  request: express.Request,
  response: express.Response
) => {
  const functionId = `getMealTemplate_${Date.now()}`;
  try {
    const authResult = await authenticateDiyetisyen(request);
    if ("error" in authResult) {
      response.status(authResult.status).json({ error: authResult.error, functionId });
      return;
    }
    const dietitianId = authResult.uid;

    let templateId: string | undefined;
    if (request.method === "POST") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      templateId = body?.templateId;
    } else {
      templateId = request.query.templateId as string;
    }
    if (!templateId) {
      response.status(400).json({ error: "templateId gerekli", functionId });
      return;
    }

    const docRef = await mobileAppDb.collection("mealTemplates").doc(templateId).get();
    if (!docRef.exists) {
      response.status(404).json({ error: "Şablon bulunamadı", functionId });
      return;
    }
    const data = docRef.data() || {};
    if (data.dietitianId !== dietitianId) {
      response.status(403).json({ error: "Bu şablona erişim yetkiniz yok", functionId });
      return;
    }

    response.status(200).json({
      template: {
        id: docRef.id,
        name: data.name || "",
        category: data.category || null,
        dietitianId: data.dietitianId,
        meals: data.meals || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      },
      functionId,
    });
  } catch (error: any) {
    console.error(`[${functionId}] getMealTemplate hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

/**
 * Yeni şablon oluştur
 */
export const createMealTemplate = corsHandler(async (
  request: express.Request,
  response: express.Response
) => {
  const functionId = `createMealTemplate_${Date.now()}`;
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "POST desteklenir", functionId });
      return;
    }
    const authResult = await authenticateDiyetisyen(request);
    if ("error" in authResult) {
      response.status(authResult.status).json({ error: authResult.error, functionId });
      return;
    }
    const dietitianId = authResult.uid;

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const name = (body?.name || "").toString().trim();
    const category = body?.category ? body.category.toString().trim() : null;
    const meals = sanitizeTemplateMeals(body?.meals);

    if (!name) {
      response.status(400).json({ error: "Şablon adı gerekli", functionId });
      return;
    }

    const docData = {
      dietitianId,
      name,
      category: category || null,
      meals,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await mobileAppDb.collection("mealTemplates").add(docData);

    response.status(200).json({
      success: true,
      templateId: docRef.id,
      functionId,
    });
  } catch (error: any) {
    console.error(`[${functionId}] createMealTemplate hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

/**
 * Var olan şablonu güncelle
 */
export const updateMealTemplate = corsHandler(async (
  request: express.Request,
  response: express.Response
) => {
  const functionId = `updateMealTemplate_${Date.now()}`;
  try {
    if (request.method !== "POST" && request.method !== "PUT") {
      response.status(405).json({ error: "POST/PUT desteklenir", functionId });
      return;
    }
    const authResult = await authenticateDiyetisyen(request);
    if ("error" in authResult) {
      response.status(authResult.status).json({ error: authResult.error, functionId });
      return;
    }
    const dietitianId = authResult.uid;

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const templateId = (body?.templateId || "").toString().trim();
    const name = (body?.name || "").toString().trim();
    const category = body?.category !== undefined
      ? (body.category ? body.category.toString().trim() : null)
      : undefined;
    const meals = sanitizeTemplateMeals(body?.meals);

    if (!templateId) {
      response.status(400).json({ error: "templateId gerekli", functionId });
      return;
    }
    if (!name) {
      response.status(400).json({ error: "Şablon adı gerekli", functionId });
      return;
    }

    const docRef = mobileAppDb.collection("mealTemplates").doc(templateId);
    const snap = await docRef.get();
    if (!snap.exists) {
      response.status(404).json({ error: "Şablon bulunamadı", functionId });
      return;
    }
    const existing = snap.data() || {};
    if (existing.dietitianId !== dietitianId) {
      response.status(403).json({ error: "Bu şablona erişim yetkiniz yok", functionId });
      return;
    }

    const updateData: any = {
      name,
      meals,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (category !== undefined) {
      updateData.category = category;
    }

    await docRef.update(updateData);
    response.status(200).json({ success: true, functionId });
  } catch (error: any) {
    console.error(`[${functionId}] updateMealTemplate hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

/**
 * Şablonu sil
 */
export const deleteMealTemplate = corsHandler(async (
  request: express.Request,
  response: express.Response
) => {
  const functionId = `deleteMealTemplate_${Date.now()}`;
  try {
    if (request.method !== "POST" && request.method !== "DELETE") {
      response.status(405).json({ error: "POST/DELETE desteklenir", functionId });
      return;
    }
    const authResult = await authenticateDiyetisyen(request);
    if ("error" in authResult) {
      response.status(authResult.status).json({ error: authResult.error, functionId });
      return;
    }
    const dietitianId = authResult.uid;

    let templateId: string | undefined;
    if (request.method === "DELETE") {
      templateId = (request.query.templateId as string) || undefined;
    } else {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      templateId = body?.templateId;
    }
    if (!templateId) {
      response.status(400).json({ error: "templateId gerekli", functionId });
      return;
    }

    const docRef = mobileAppDb.collection("mealTemplates").doc(templateId);
    const snap = await docRef.get();
    if (!snap.exists) {
      response.status(404).json({ error: "Şablon bulunamadı", functionId });
      return;
    }
    const existing = snap.data() || {};
    if (existing.dietitianId !== dietitianId) {
      response.status(403).json({ error: "Bu şablona erişim yetkiniz yok", functionId });
      return;
    }

    await docRef.delete();
    response.status(200).json({ success: true, functionId });
  } catch (error: any) {
    console.error(`[${functionId}] deleteMealTemplate hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

// ════════════════════════════════════════════════════════════════════════════
// HESAP SİLME — Admin Onaylı Akış
// ════════════════════════════════════════════════════════════════════════════
//
// Akış:
//  1) Mobil tarafta requestAccountDeletion → status="awaiting_admin_approval"
//  2) Admin web panelinden onaylar → processAccountDeletion (bu dosya)
//  3) Admin reddederse → rejectAccountDeletion (bu dosya)
//
// Otomatik 24h silme YOK. Eski client-side checkAndProcessDeletions de
// kaldırıldı. Tüm silme akışı admin onayından geçer.

/**
 * Authorization: Bearer <web id token> doğrula ve admin yetkisini kontrol et.
 * Admin değilse {error, status} döner.
 */
async function authenticateAdmin(
  request: express.Request
): Promise<{ uid: string; adminData: any } | { error: string; status: number }> {
  const authHeader = request.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { error: "Authorization bearer token eksik", status: 401 };
  }
  const idToken = authHeader.substring("Bearer ".length);

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err: any) {
    return { error: "Geçersiz veya süresi dolmuş token", status: 401 };
  }

  const adminSnap = await webPanelDb.collection("adminler").doc(decoded.uid).get();
  if (!adminSnap.exists) {
    return { error: "Bu işlem için admin yetkisi gerekli", status: 403 };
  }
  const adminData = adminSnap.data() || {};
  const isActiveAdmin =
    adminData.status === "approved" ||
    adminData.status === "active" ||
    adminData.aktif === true ||
    adminData.aktif === "true";
  const roleValue = (adminData.role || adminData.rol || "").toString();
  if (!isActiveAdmin || (roleValue !== "admin" && roleValue !== "superAdmin")) {
    return { error: "Yetersiz yetki", status: 403 };
  }

  return { uid: decoded.uid, adminData };
}

/**
 * Admin için bekleyen / işlenmiş hesap silme isteklerini listele.
 * Query params:
 *  - status: "awaiting_admin_approval" | "approved" | "rejected" | "completed" | "all" (default: awaiting_admin_approval)
 *  - limit: 1-200 (default: 50)
 */
export const listAccountDeletionRequests = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `listAccountDeletionRequests_${Date.now()}`;
  try {
    if (request.method !== "GET" && request.method !== "POST") {
      response.status(405).json({ error: "Yalnızca GET/POST desteklenir", functionId });
      return;
    }

    const auth = await authenticateAdmin(request);
    if ("error" in auth) {
      response.status(auth.status).json({ error: auth.error, functionId });
      return;
    }

    const params = request.method === "GET" ? request.query : (request.body || {});
    const requestedStatus = (params.status || "awaiting_admin_approval").toString();
    const rawLimit = parseInt((params.limit || "50").toString(), 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 50 : rawLimit, 1), 200);

    let query: admin.firestore.Query = mobileAppDb.collection("deletionRequests");
    if (requestedStatus !== "all") {
      query = query.where("status", "==", requestedStatus);
    }
    query = query.orderBy("requestedAt", "desc").limit(limit);

    const snap = await query.get();
    const items = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        userId: d.userId,
        userEmail: d.userEmail || "",
        userName: d.userName || "",
        userSurname: d.userSurname || "",
        userPhone: d.userPhone || "",
        userRole: d.userRole,
        status: d.status,
        requestedAt: d.requestedAt?.toDate?.()?.toISOString() || null,
        reviewedAt: d.reviewedAt?.toDate?.()?.toISOString() || null,
        completedAt: d.completedAt?.toDate?.()?.toISOString() || null,
        cancelledAt: d.cancelledAt?.toDate?.()?.toISOString() || null,
        rejectedAt: d.rejectedAt?.toDate?.()?.toISOString() || null,
        rejectionReason: d.rejectionReason || null,
        reviewedByAdminId: d.reviewedByAdminId || null,
      };
    });

    response.status(200).json({ items, count: items.length, functionId });
  } catch (error: any) {
    console.error(`[${functionId}] listAccountDeletionRequests hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

/**
 * Admin onayı sonrası hesap silme işlemini yürüt.
 *
 * Body: { requestId: string }
 *
 * Yaptıkları:
 *  - mobileAppDb tarafında ilgili kullanıcının verilerini siler/anonimleştirir
 *    (rol bazlı: dietitian → hard delete, client → soft delete; mevcut akışla aynı)
 *  - webPanelDb tarafında diyetisyenler/{uid} dokümanını "deleted" olarak işaretler
 *    (sonsuz sync döngüsünü engeller)
 *  - Mobile Auth kaydını siler
 *  - deletionRequests dokümanını status: "completed" olarak işaretler
 *  - deletedAccounts koleksiyonuna log düşer
 */
export const processAccountDeletion = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `processAccountDeletion_${Date.now()}`;
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Yalnızca POST desteklenir", functionId });
      return;
    }

    const auth = await authenticateAdmin(request);
    if ("error" in auth) {
      response.status(auth.status).json({ error: auth.error, functionId });
      return;
    }

    const body = (typeof request.body === "string" ? JSON.parse(request.body) : request.body) || {};
    const requestId: string = (body.requestId || "").toString().trim();
    if (!requestId) {
      response.status(400).json({ error: "requestId gerekli", functionId });
      return;
    }

    const requestRef = mobileAppDb.collection("deletionRequests").doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
      response.status(404).json({ error: "Silme isteği bulunamadı", functionId });
      return;
    }

    const reqData = requestSnap.data() || {};
    if (reqData.status !== "awaiting_admin_approval" && reqData.status !== "pending") {
      response.status(409).json({
        error: `Bu istek artık onaylanamaz (mevcut durum: ${reqData.status})`,
        functionId,
      });
      return;
    }

    const userId: string = reqData.userId;
    const userRole: string = reqData.userRole;

    if (!userId || !userRole) {
      response.status(400).json({ error: "İstek verisi eksik (userId/userRole)", functionId });
      return;
    }

    // Mevcut kullanıcı snapshot'ını al (silmeden önce log için)
    const userSnap = await mobileAppDb.collection("users").doc(userId).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    // ─── Onaylama kaydı ───
    await requestRef.update({
      status: "approved",
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedByAdminId: auth.uid,
    });

    // ─── Silme işlemi ───
    if (userRole === "dietitian") {
      await deleteDietitianAccountServer(userId, functionId);
    } else if (userRole === "client") {
      await deleteClientAccountServer(userId, functionId);
    } else if (userRole === "admin") {
      // Admin hesabı için şimdilik sadece users dokümanını işaretle
      await mobileAppDb.collection("users").doc(userId).set({
        status: "deleted",
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // ─── Auth silme (mobile Firebase) ───
    try {
      await admin.app("mobileApp").auth().deleteUser(userId);
      console.log(`[${functionId}] ✅ Mobile Auth kullanıcısı silindi: ${userId}`);
    } catch (authErr: any) {
      if (authErr.code !== "auth/user-not-found") {
        console.warn(`[${functionId}] ⚠️ Mobile Auth silinemedi:`, authErr.message);
      }
    }

    // ─── deletedAccounts log ───
    try {
      await mobileAppDb.collection("deletedAccounts").add({
        userId,
        email: userData.email || reqData.userEmail || "",
        phone: userData.phone || reqData.userPhone || "",
        name: userData.name || reqData.userName || "",
        surname: userData.surname || reqData.userSurname || "",
        fullName: `${userData.name || reqData.userName || ""} ${userData.surname || reqData.userSurname || ""}`.trim(),
        role: userRole,
        registrationDate: userData.createdAt || null,
        deletionDate: admin.firestore.FieldValue.serverTimestamp(),
        approvedByAdminId: auth.uid,
        deletionRequestId: requestId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logErr: any) {
      console.warn(`[${functionId}] ⚠️ deletedAccounts log yazılamadı:`, logErr.message);
    }

    // ─── İsteği completed olarak işaretle ───
    await requestRef.update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`[${functionId}] ✅ Silme tamamlandı - userId: ${userId}, role: ${userRole}`);
    response.status(200).json({
      success: true,
      message: "Hesap silindi",
      userId,
      functionId,
    });
  } catch (error: any) {
    console.error(`[${functionId}] processAccountDeletion hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

/**
 * Admin reddi sonrası hesap silme isteğini iptal et (kullanıcı silinmez).
 *
 * Body: { requestId: string, reason?: string }
 */
export const rejectAccountDeletion = corsHandler(async (request: express.Request, response: express.Response) => {
  const functionId = `rejectAccountDeletion_${Date.now()}`;
  try {
    if (request.method !== "POST") {
      response.status(405).json({ error: "Yalnızca POST desteklenir", functionId });
      return;
    }

    const auth = await authenticateAdmin(request);
    if ("error" in auth) {
      response.status(auth.status).json({ error: auth.error, functionId });
      return;
    }

    const body = (typeof request.body === "string" ? JSON.parse(request.body) : request.body) || {};
    const requestId: string = (body.requestId || "").toString().trim();
    const reason: string = (body.reason || "").toString().trim();
    if (!requestId) {
      response.status(400).json({ error: "requestId gerekli", functionId });
      return;
    }

    const requestRef = mobileAppDb.collection("deletionRequests").doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
      response.status(404).json({ error: "Silme isteği bulunamadı", functionId });
      return;
    }
    const reqData = requestSnap.data() || {};
    if (reqData.status !== "awaiting_admin_approval" && reqData.status !== "pending") {
      response.status(409).json({
        error: `Bu istek artık reddedilemez (mevcut durum: ${reqData.status})`,
        functionId,
      });
      return;
    }

    await requestRef.update({
      status: "rejected",
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      rejectionReason: reason || null,
      reviewedByAdminId: auth.uid,
    });

    // Kullanıcının users dokümanındaki ayna durumu temizle
    try {
      await mobileAppDb.collection("users").doc(reqData.userId).update({
        "deletionRequest.status": "rejected",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (userErr: any) {
      console.warn(`[${functionId}] ⚠️ users.deletionRequest.status güncellenemedi:`, userErr.message);
    }

    console.log(`[${functionId}] ✅ Silme isteği reddedildi - requestId: ${requestId}`);
    response.status(200).json({ success: true, functionId });
  } catch (error: any) {
    console.error(`[${functionId}] rejectAccountDeletion hata:`, error);
    if (!response.headersSent) {
      response.status(500).json({ error: error.message || "Sunucu hatası", functionId });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Server-side silme yardımcıları (mobile client'taki AccountDeletionService'in
// admin SDK karşılığı). Loop riski olmaması için web doc'unu da deleted
// olarak işaretler.
// ─────────────────────────────────────────────────────────────────────────

async function deleteDietitianAccountServer(dietitianId: string, functionId: string): Promise<void> {
  console.log(`[${functionId}] [deleteDietitianAccountServer] ${dietitianId} siliniyor (hard delete)`);

  // 1) Sonuç kartlarından diyetisyen erişimini kapat (anonimleştir)
  try {
    const resultsSnap = await mobileAppDb.collection("dietPlanResults")
      .where("dietitianId", "==", dietitianId)
      .get();
    if (!resultsSnap.empty) {
      const stableDeletedDietitianId = `deleted_dietitian_${dietitianId}`;
      const batch = mobileAppDb.batch();
      resultsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          dietitianId: stableDeletedDietitianId,
          dietitianName: "Silinmiş Diyetisyen",
          dietitianEmail: `${stableDeletedDietitianId}@deleted.local`,
          dietitianAccessRevoked: true,
          originalDietitianId: dietitianId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (e: any) {
    console.warn(`[${functionId}] dietPlanResults anonimleştirme hatası:`, e.message);
  }

  // 2) Diyet planlarını sil
  await deleteCollectionByQuery(mobileAppDb.collection("dietPlans").where("dietitianId", "==", dietitianId), functionId, "dietPlans");

  // 3) Eşleşmeleri sil
  await deleteCollectionByQuery(mobileAppDb.collection("matches").where("dietitianId", "==", dietitianId), functionId, "matches");

  // 4) Bildirimleri sil
  await deleteCollectionByQuery(mobileAppDb.collection("notifications").where("userId", "==", dietitianId), functionId, "notifications");

  // 5) Meal template'leri sil
  await deleteCollectionByQuery(mobileAppDb.collection("mealTemplates").where("dietitianId", "==", dietitianId), functionId, "mealTemplates");

  // 6) WEB doc'unu deleted olarak işaretle (sync döngüsü kapatıcı)
  //    Bu, mobile users delete edildikten sonra web'in mobile'ı resurrect
  //    etmesini engellemek için KRİTİK.
  try {
    await webPanelDb.collection("diyetisyenler").doc(dietitianId).set({
      isDeleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      email: `deleted_dietitian_${dietitianId}@deleted.local`,
      adSoyad: "Silinmiş Diyetisyen",
      telefon: "",
      sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`[${functionId}] ✅ Web diyetisyen doc deleted olarak işaretlendi: ${dietitianId}`);
  } catch (webErr: any) {
    console.warn(`[${functionId}] ⚠️ Web doc işaretlenemedi:`, webErr.message);
  }

  // 7) Mobile users dokümanını sil (HARD DELETE)
  try {
    await mobileAppDb.collection("users").doc(dietitianId).delete();
    console.log(`[${functionId}] ✅ Mobile users dokümanı silindi: ${dietitianId}`);
  } catch (e: any) {
    console.warn(`[${functionId}] ⚠️ Mobile users silinemedi:`, e.message);
  }

  // 8) Orphaned result cards (hem diyetisyen hem danışan silinmişse)
  try {
    const orphanedSnap = await mobileAppDb.collection("dietPlanResults")
      .where("dietitianAccessRevoked", "==", true)
      .where("clientAccessRevoked", "==", true)
      .get();
    if (!orphanedSnap.empty) {
      const batch = mobileAppDb.batch();
      orphanedSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[${functionId}] ${orphanedSnap.size} orphan sonuç kartı silindi`);
    }
  } catch (e: any) {
    console.warn(`[${functionId}] orphan kartlar silinemedi:`, e.message);
  }
}

async function deleteClientAccountServer(clientId: string, functionId: string): Promise<void> {
  console.log(`[${functionId}] [deleteClientAccountServer] ${clientId} siliniyor (soft delete)`);

  // 1) Sonuç kartlarından danışan erişimini kapat
  try {
    const resultsSnap = await mobileAppDb.collection("dietPlanResults")
      .where("clientId", "==", clientId)
      .get();
    if (!resultsSnap.empty) {
      const stableDeletedClientId = `deleted_client_${clientId}`;
      const batch = mobileAppDb.batch();
      resultsSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          clientId: stableDeletedClientId,
          clientName: "Silinmiş Danışan",
          clientEmail: `${stableDeletedClientId}@deleted.local`,
          clientAccessRevoked: true,
          originalClientId: clientId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (e: any) {
    console.warn(`[${functionId}] dietPlanResults anonimleştirme hatası:`, e.message);
  }

  // 2) Diyet planlarını soft delete olarak işaretle
  try {
    const plansSnap = await mobileAppDb.collection("dietPlans")
      .where("clientId", "==", clientId)
      .get();
    if (!plansSnap.empty) {
      const batch = mobileAppDb.batch();
      plansSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isDeleted: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (e: any) {
    console.warn(`[${functionId}] dietPlans soft delete hatası:`, e.message);
  }

  // 3) Eşleşmeleri sonlandır
  try {
    const matchesSnap = await mobileAppDb.collection("matches")
      .where("clientId", "==", clientId)
      .get();
    if (!matchesSnap.empty) {
      const batch = mobileAppDb.batch();
      matchesSnap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: "ended",
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (e: any) {
    console.warn(`[${functionId}] matches sonlandırma hatası:`, e.message);
  }

  // 4) users dokümanını soft delete (silmek yerine anonimleştir)
  try {
    const stableDeletedEmail = `deleted_client_${clientId}@deleted.local`;
    await mobileAppDb.collection("users").doc(clientId).set({
      status: "deleted",
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      email: stableDeletedEmail,
      name: "Silinmiş Kullanıcı",
      surname: "",
      profileImage: null,
      phone: null,
      address: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      district: null,
      postalCode: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e: any) {
    console.warn(`[${functionId}] users soft delete hatası:`, e.message);
  }

  // 5) Orphaned result cards
  try {
    const orphanedSnap = await mobileAppDb.collection("dietPlanResults")
      .where("dietitianAccessRevoked", "==", true)
      .where("clientAccessRevoked", "==", true)
      .get();
    if (!orphanedSnap.empty) {
      const batch = mobileAppDb.batch();
      orphanedSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  } catch (e: any) {
    console.warn(`[${functionId}] orphan kartlar silinemedi:`, e.message);
  }
}

/**
 * Sorgu sonucundaki tüm dokümanları batch'lerle (max 500/batch) sil.
 */
async function deleteCollectionByQuery(
  query: admin.firestore.Query,
  functionId: string,
  label: string
): Promise<void> {
  try {
    const snap = await query.get();
    if (snap.empty) return;
    const batchSize = 450;
    let processed = 0;
    while (processed < snap.docs.length) {
      const batch = mobileAppDb.batch();
      const slice = snap.docs.slice(processed, processed + batchSize);
      slice.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      processed += slice.length;
    }
    console.log(`[${functionId}] ${snap.size} ${label} dokümanı silindi`);
  } catch (e: any) {
    console.warn(`[${functionId}] ${label} silinemedi:`, e.message);
  }
}