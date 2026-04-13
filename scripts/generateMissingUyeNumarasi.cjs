/**
 * Eksik üye numaraları olan diyetisyenler için üye numarası oluşturma script'i
 * 
 * Kullanım:
 * node scripts/generateMissingUyeNumarasi.cjs
 * 
 * Veya belirli bir diyetisyen için:
 * node scripts/generateMissingUyeNumarasi.cjs --diyetisyenId=xxx
 * 
 * Veya sadece web'ten kayıt olanlar için:
 * node scripts/generateMissingUyeNumarasi.cjs --kayitYeri=web
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Service account dosyasını yükle
const serviceAccountPath = path.join(__dirname, '..', 'mobile-app-service-account.json');

// firebase-admin modülünü functions klasöründen yükle
const functionsPath = path.join(__dirname, '..', 'functions');
process.chdir(functionsPath);

if (!require('fs').existsSync(serviceAccountPath)) {
  console.error('❌ mobile-app-service-account.json dosyası bulunamadı!');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Firebase Admin'i başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dietcoop-432fa.firebaseio.com",
});

const db = admin.firestore();

// Üye numarası oluşturma fonksiyonu
async function generateUniqueUyeNumarasi() {
  const prefix = "DC";
  let uyeNumarasi = "";
  let exists = true;
  
  // Benzersiz bir üye numarası bulana kadar dene
  while (exists) {
    // 6 haneli rastgele sayı oluştur
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    uyeNumarasi = `${prefix}${randomNum}`;
    
    // Bu üye numarası zaten var mı kontrol et
    const snapshot = await db.collection("diyetisyenler")
      .where("uyeNumarasi", "==", uyeNumarasi)
      .limit(1)
      .get();
    
    exists = !snapshot.empty;
  }
  
  return uyeNumarasi;
}

// Ana fonksiyon
async function generateMissingUyeNumarasi() {
  try {
    console.log('🔍 Eksik üye numaraları kontrol ediliyor...\n');

    // Komut satırı argümanlarını parse et
    const args = process.argv.slice(2);
    const diyetisyenId = args.find(arg => arg.startsWith('--diyetisyenId='))?.split('=')[1];
    const kayitYeri = args.find(arg => arg.startsWith('--kayitYeri='))?.split('=')[1];

    let query = db.collection("diyetisyenler");

    // Belirli bir diyetisyen için
    if (diyetisyenId) {
      console.log(`📌 Belirli diyetisyen kontrol ediliyor: ${diyetisyenId}\n`);
      const doc = await query.doc(diyetisyenId).get();
      
      if (!doc.exists) {
        console.error(`❌ Diyetisyen bulunamadı: ${diyetisyenId}`);
        process.exit(1);
      }

      const data = doc.data();
      const uyeNumarasi = data.uyeNumarasi;

      if (!uyeNumarasi || uyeNumarasi.trim() === "") {
        console.log(`⚠️  Üye numarası eksik: ${diyetisyenId}`);
        console.log(`   Email: ${data.email || 'N/A'}`);
        console.log(`   Ad Soyad: ${data.adSoyad || 'N/A'}`);
        console.log(`   Kayıt Yeri: ${data.kayitYeri || 'N/A'}\n`);

        const newUyeNumarasi = await generateUniqueUyeNumarasi();
        await db.collection("diyetisyenler").doc(diyetisyenId).update({
          uyeNumarasi: newUyeNumarasi,
          sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`✅ Üye numarası oluşturuldu: ${newUyeNumarasi}\n`);
      } else {
        console.log(`✅ Üye numarası zaten mevcut: ${uyeNumarasi}\n`);
      }

      process.exit(0);
    }

    // Tüm diyetisyenleri getir
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('❌ Hiç diyetisyen bulunamadı!');
      process.exit(1);
    }

    console.log(`📊 Toplam ${snapshot.size} diyetisyen kontrol ediliyor...\n`);

    let eksikSayisi = 0;
    let guncellenenSayisi = 0;
    let hataSayisi = 0;
    const eksikOlanlar = [];

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
        eksikOlanlar.push({
          id: diyetisyenId,
          email: data.email || 'N/A',
          adSoyad: data.adSoyad || 'N/A',
          kayitYeri: data.kayitYeri || 'N/A',
        });

        try {
          const newUyeNumarasi = await generateUniqueUyeNumarasi();
          await db.collection("diyetisyenler").doc(diyetisyenId).update({
            uyeNumarasi: newUyeNumarasi,
            sonGuncelleme: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`✅ [${guncellenenSayisi + 1}/${eksikSayisi}] ${data.adSoyad || diyetisyenId} - ${newUyeNumarasi}`);
          guncellenenSayisi++;
        } catch (error) {
          console.error(`❌ Hata (${diyetisyenId}):`, error.message);
          hataSayisi++;
        }
      }
    }

    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('📊 ÖZET');
    console.log('='.repeat(50));
    console.log(`Toplam diyetisyen: ${snapshot.size}`);
    console.log(`Eksik üye numarası: ${eksikSayisi}`);
    console.log(`Başarıyla güncellenen: ${guncellenenSayisi}`);
    console.log(`Hata sayısı: ${hataSayisi}`);

    if (eksikOlanlar.length > 0 && guncellenenSayisi < eksikSayisi) {
      console.log('\n⚠️  Güncellenemeyen diyetisyenler:');
      eksikOlanlar.slice(guncellenenSayisi).forEach((d, index) => {
        console.log(`   ${index + 1}. ${d.adSoyad} (${d.email}) - ${d.id}`);
      });
    }

    console.log('\n✅ İşlem tamamlandı!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Genel hata:', error);
    process.exit(1);
  }
}

// Script'i çalıştır
generateMissingUyeNumarasi();
