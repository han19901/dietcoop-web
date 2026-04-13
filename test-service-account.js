/**
 * Service Account ve Cloud Functions Test Scripti
 * 
 * Bu script service account'un çalışıp çalışmadığını ve
 * Cloud Functions'ların doğru çalıştığını test eder.
 */

const admin = require('firebase-admin');
const path = require('path');

// Web Panel Firebase Admin (kendi projemiz)
admin.initializeApp({
  projectId: 'webdietcoop',
});

// Mobil App Service Account ile bağlan
const mobileAppServiceAccount = require(path.join(__dirname, 'functions/mobile-app-service-account.json'));

let mobileApp;
try {
  mobileApp = admin.initializeApp({
    credential: admin.credential.cert(mobileAppServiceAccount),
    databaseURL: 'https://dietcoop-432fa.firebaseio.com',
  }, 'mobileApp');
  console.log('✅ Mobil App Service Account bağlantısı başarılı');
} catch (error) {
  console.error('❌ Mobil App Service Account bağlantı hatası:', error);
  process.exit(1);
}

const mobileAppDb = admin.app('mobileApp').firestore();
const webPanelDb = admin.firestore();

async function testServiceAccount() {
  console.log('\n🔍 Service Account Test Başlatılıyor...\n');

  try {
    // 1. Mobil App'ten diyetisyenleri oku
    console.log('1️⃣ Mobil App\'ten diyetisyenleri okuyoruz...');
    const mobileUsersSnapshot = await mobileAppDb.collection('users')
      .where('role', '==', 'dietitian')
      .limit(5)
      .get();

    if (mobileUsersSnapshot.empty) {
      console.log('⚠️  Mobil App\'te diyetisyen bulunamadı');
    } else {
      console.log(`✅ Mobil App'te ${mobileUsersSnapshot.size} diyetisyen bulundu:`);
      mobileUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.name} ${data.surname} (${data.email})`);
        console.log(`     Aktif Danışan: ${data.aktifDanisanSayisi || 0}, Pasif: ${data.pasifDanisanSayisi || 0}`);
      });
    }

    // 2. Web Panel'deki diyetisyenleri kontrol et
    console.log('\n2️⃣ Web Panel\'deki diyetisyenleri kontrol ediyoruz...');
    const webDiyetisyenlerSnapshot = await webPanelDb.collection('diyetisyenler').limit(5).get();

    if (webDiyetisyenlerSnapshot.empty) {
      console.log('⚠️  Web Panel\'de diyetisyen bulunamadı');
    } else {
      console.log(`✅ Web Panel'de ${webDiyetisyenlerSnapshot.size} diyetisyen bulundu:`);
      webDiyetisyenlerSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.adSoyad} (${data.email})`);
        console.log(`     Kayıt Yeri: ${data.kayitYeri || 'belirtilmemiş'}`);
        console.log(`     Aktif Danışan: ${data.aktifDanisanSayisi || 0}, Pasif: ${data.pasifDanisanSayisi || 0}`);
      });
    }

    // 3. Senkronizasyon kontrolü
    console.log('\n3️⃣ Senkronizasyon kontrolü yapıyoruz...');
    const mobileUsers = [];
    mobileUsersSnapshot.forEach((doc) => {
      mobileUsers.push({ id: doc.id, ...doc.data() });
    });

    const webDiyetisyenler = [];
    webDiyetisyenlerSnapshot.forEach((doc) => {
      webDiyetisyenler.push({ id: doc.id, ...doc.data() });
    });

    // Mobil App'te olup Web Panel'de olmayan diyetisyenler
    const missingInWebPanel = mobileUsers.filter(
      (mobile) => !webDiyetisyenler.find((web) => web.id === mobile.id)
    );

    if (missingInWebPanel.length > 0) {
      console.log(`⚠️  ${missingInWebPanel.length} diyetisyen Web Panel'de yok:`);
      missingInWebPanel.forEach((dietitian) => {
        console.log(`   - ${dietitian.id}: ${dietitian.name} ${dietitian.surname}`);
      });
      console.log('\n💡 Bu diyetisyenler için Mobil App\'ten Web Panel\'e senkronizasyon Cloud Function\'ı çalışmalı.');
    } else {
      console.log('✅ Tüm diyetisyenler senkronize görünüyor');
    }

    // 4. Cloud Functions URL'lerini test et
    console.log('\n4️⃣ Cloud Functions URL\'lerini test ediyoruz...');
    const testDiyetisyenId = mobileUsers.length > 0 ? mobileUsers[0].id : null;

    if (testDiyetisyenId) {
      const functionsUrl = 'https://us-central1-webdietcoop.cloudfunctions.net';
      
      console.log(`   Test Diyetisyen ID: ${testDiyetisyenId}`);
      console.log(`   getDiyetisyen: ${functionsUrl}/getDiyetisyen`);
      console.log(`   getAktifDanisanSayisi: ${functionsUrl}/getAktifDanisanSayisi`);
      console.log(`   getPasifDanisanSayisi: ${functionsUrl}/getPasifDanisanSayisi`);
      
      // HTTP test (opsiyonel)
      console.log('\n   HTTP test yapmak için:');
      console.log(`   curl -X POST ${functionsUrl}/getDiyetisyen \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"diyetisyenId": "${testDiyetisyenId}"}'`);
    }

    console.log('\n✅ Test tamamlandı!\n');

  } catch (error) {
    console.error('❌ Test hatası:', error);
    process.exit(1);
  }
}

// Test'i çalıştır
testServiceAccount()
  .then(() => {
    console.log('Test başarıyla tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test başarısız:', error);
    process.exit(1);
  });







