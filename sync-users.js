const https = require('https');

const options = {
  hostname: 'us-central1-webdietcoop.cloudfunctions.net',
  path: '/syncExistingMobileAppUsers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Mevcut mobil uygulama kullanıcılarını senkronize ediliyor...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ Senkronizasyon tamamlandı!');
      console.log('\nSonuçlar:');
      console.log(`- Toplam: ${result.total || 'N/A'}`);
      console.log(`- Başarılı: ${result.successCount || 0}`);
      console.log(`- Hata: ${result.errorCount || 0}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\nHatalar:');
        result.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.email || error.uid}: ${error.error}`);
        });
      }
    } catch (e) {
      console.log('Yanıt:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Hata:', error.message);
});

req.end();





