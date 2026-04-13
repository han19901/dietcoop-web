/**
 * Super Admin Ekleme Scripti
 * 
 * Bu script Firebase Admin SDK kullanarak Firestore'a direkt admin kaydı ekler.
 * Firestore security rules'u bypass eder.
 * 
 * Kullanım:
 * 1. Firebase Admin SDK service account key dosyasını proje köküne ekleyin (serviceAccountKey.json)
 * 2. npm install firebase-admin (eğer yoksa)
 * 3. node scripts/addSuperAdmin.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Service account key dosyası kontrolü
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ HATA: serviceAccountKey.json dosyası bulunamadı!');
  console.log('\n📝 Firebase Admin SDK için service account key dosyası gerekiyor:');
  console.log('1. Firebase Console > Project Settings > Service Accounts');
  console.log('2. "Generate new private key" butonuna tıklayın');
  console.log('3. İndirilen JSON dosyasını proje köküne "serviceAccountKey.json" olarak kaydedin');
  console.log('4. Scripti tekrar çalıştırın\n');
  process.exit(1);
}

// Firebase Admin SDK'yı başlat
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Admin bilgileri
const adminData = {
  uid: 'R6Ak5OQYmPgdrz4vFZP0k9lb36n2',
  email: 'tufekcioguzhan@gmail.com',
  adSoyad: 'Ömer Oğuzhan Tüfekci',
};

async function addSuperAdmin() {
  try {
    console.log('🔄 Admin kaydı ekleniyor...');
    console.log('📋 Bilgiler:');
    console.log(`   UID: ${adminData.uid}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Ad Soyad: ${adminData.adSoyad}`);
    console.log(`   Rol: superAdmin`);
    console.log('');

    const adminRef = db.collection('adminler').doc(adminData.uid);
    
    // Mevcut kaydı kontrol et
    const existingDoc = await adminRef.get();
    
    const firestoreData = {
      email: adminData.email,
      'Name Surname': adminData.adSoyad,
      adSoyad: adminData.adSoyad,
      role: 'superAdmin',
      rol: 'superAdmin',
      status: 'approved',
      aktif: true,
      olusturmaTarihi: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      sonGirisTarihi: admin.firestore.Timestamp.now(),
      updateAt: admin.firestore.Timestamp.now(),
    };

    if (existingDoc.exists) {
      // Mevcut kaydı güncelle
      await adminRef.set(firestoreData, { merge: true });
      console.log('✅ Mevcut admin kaydı güncellendi!');
    } else {
      // Yeni kayıt oluştur
      await adminRef.set(firestoreData);
      console.log('✅ Yeni admin kaydı oluşturuldu!');
    }

    // Kaydı doğrula
    const verifyDoc = await adminRef.get();
    if (verifyDoc.exists) {
      const data = verifyDoc.data();
      console.log('\n✅ Admin kaydı başarıyla eklendi/güncellendi!');
      console.log('\n📊 Kayıt Detayları:');
      console.log(`   UID: ${verifyDoc.id}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Ad Soyad: ${data.adSoyad || data['Name Surname']}`);
      console.log(`   Rol: ${data.role || data.rol}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Aktif: ${data.aktif}`);
      console.log('\n🎉 Artık admin olarak giriş yapabilirsiniz!');
    } else {
      console.error('❌ HATA: Kayıt oluşturuldu ancak doğrulama başarısız!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Scripti çalıştır
addSuperAdmin();












