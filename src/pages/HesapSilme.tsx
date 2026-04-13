import { Link } from 'react-router-dom';
import { Mail, ExternalLink, AlertTriangle, Info, Shield } from 'lucide-react';

export default function HesapSilme() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">DietCoop</h1>
          <p className="text-emerald-100 text-lg">Hesap Silme</p>
        </div>

        <div className="p-6 md:p-8">
          {/* Hesabınızı Silmek İçin */}
          <section className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Hesabınızı Silmek İçin</h2>
            <p className="text-gray-700 mb-6">
              DietCoop uygulamasından hesabınızı silmek için aşağıdaki yöntemlerden birini kullanabilirsiniz:
            </p>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full text-sm font-bold">1</span>
                Uygulama İçinden Silme (Önerilen)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-10">
                <li>DietCoop mobil uygulamasını açın</li>
                <li>Profil sayfanıza gidin</li>
                <li>"Hesabımı Sonlandır" butonuna tıklayın</li>
                <li>Onay dialog'unu kabul edin</li>
                <li>Hesap silme isteğiniz 24 saat sonra otomatik olarak işleme alınacaktır</li>
                <li>24 saat içinde "Silme İsteğini İptal Et" butonuna tıklayarak iptal edebilirsiniz</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-emerald-500 text-white rounded-full text-sm font-bold">2</span>
                E-posta ile Silme
              </h3>
              <p className="text-gray-700 mb-3">
                Hesap silme talebinizi{' '}
                <a 
                  href="mailto:destek@dietcoop.com" 
                  className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1"
                >
                  <Mail size={16} />
                  destek@dietcoop.com
                </a>
                {' '}adresine e-posta göndererek de yapabilirsiniz:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-6">
                <li>E-postanızda kullanıcı adınızı (e-posta adresinizi) belirtin</li>
                <li>Hesap silme talebinizi açıkça belirtin</li>
                <li>Talebiniz 7 iş günü içinde işleme alınacaktır</li>
              </ul>
            </div>
          </section>

          {/* Silinen Veriler */}
          <section className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Silinen Veriler</h2>
            <p className="text-gray-700 mb-4">
              Hesabınız silindiğinde aşağıdaki veriler kalıcı olarak silinir:
            </p>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-emerald-600 mb-2">Diyetisyen Hesapları için:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Kişisel bilgileriniz (ad, soyad, e-posta, telefon, adres)</li>
                <li>Profil fotoğrafınız</li>
                <li>Diyet planlarınız</li>
                <li>Eşleşme kayıtlarınız</li>
                <li>Bildirimleriniz</li>
                <li>Öğün şablonlarınız</li>
                <li>Firebase Authentication hesabınız</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-emerald-600 mb-2">Danışan Hesapları için:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Kişisel bilgileriniz (ad, soyad, e-posta, telefon, adres)</li>
                <li>Profil fotoğrafınız</li>
                <li>Sağlık bilgileriniz (boy, kilo, sağlık durumları)</li>
                <li>Diyet planlarınız (soft delete - finansal raporlar için saklanır)</li>
                <li>Eşleşme kayıtlarınız</li>
                <li>Bildirimleriniz</li>
                <li>Firebase Authentication hesabınız</li>
              </ul>
            </div>
          </section>

          {/* Korunan Veriler */}
          <section className="mb-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-start gap-3 mb-4">
              <Info className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-2xl font-semibold text-blue-700 mb-2">Korunan Veriler</h2>
                <p className="text-gray-700 font-semibold">
                  Önemli: Aşağıdaki veriler yasal zorunluluklar ve finansal raporlama gereksinimleri nedeniyle saklanır:
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Diyetisyen Hesapları için:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>Sonuç kartları (diet plan results)</strong> - Danışanların erişimi için korunur
                  <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                    <li>Diyetisyen bilgileri anonimleştirilir: "Silinmiş Diyetisyen" olarak işaretlenir</li>
                    <li>Diyetisyen erişimi kapatılır, ancak danışanlar sonuç kartlarını görebilir</li>
                  </ul>
                </li>
                <li>
                  <strong>WebDietCoop'a gönderilen finansal rapor verileri</strong> - Silinmiş olarak işaretlenir ancak finansal raporlar için saklanır
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Danışan Hesapları için:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>DiyetDeposu'ndaki geçmiş siparişler</strong> - Finansal raporlar için korunur
                </li>
                <li>
                  <strong>Sonuç kartları</strong> - Diyetisyenlerin erişimi için korunur
                  <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                    <li>Danışan bilgileri anonimleştirilir: "Silinmiş Danışan" olarak işaretlenir</li>
                    <li>Danışan erişimi kapatılır, ancak diyetisyenler sonuç kartlarını görebilir</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          {/* Veri Saklama Süreleri */}
          <section className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Veri Saklama Süreleri</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Silinen hesapların verileri <strong>90 gün içinde</strong> tamamen silinir (yasal zorunluluklar hariç)</li>
              <li>Finansal raporlama için gerekli veriler yasal zorunluluklar gereği saklanır</li>
              <li>Sonuç kartları, ilgili diyetisyen ve danışan her ikisi de hesap silene kadar saklanır</li>
              <li>Her iki taraf da hesap silerse, sonuç kartları da silinir</li>
            </ul>
          </section>

          {/* Önemli Uyarı */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">⚠️ Önemli Uyarı</h3>
                <p className="text-gray-700">
                  Hesap silme işlemi <strong>geri alınamaz</strong>. Hesabınızı silmeden önce tüm önemli verilerinizi yedeklediğinizden emin olun.
                </p>
              </div>
            </div>
          </div>

          {/* İletişim */}
          <section className="mb-8 p-6 bg-gray-100 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={24} className="text-emerald-600" />
              İletişim
            </h2>
            <p className="text-gray-700 mb-3">
              Hesap silme işlemi hakkında sorularınız için:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>E-posta:</strong>{' '}
                <a 
                  href="mailto:destek@dietcoop.com" 
                  className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1"
                >
                  <Mail size={16} />
                  destek@dietcoop.com
                </a>
              </li>
              <li>
                <strong>Web:</strong>{' '}
                <a 
                  href="https://www.dietcoop.com/destek" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1"
                >
                  <ExternalLink size={16} />
                  https://www.dietcoop.com/destek
                </a>
              </li>
            </ul>
          </section>

          {/* Gizlilik Politikası */}
          <section className="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-emerald-500">
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Gizlilik Politikası</h2>
            <p className="text-gray-700 mb-3">
              Hesap silme işlemi hakkında daha fazla bilgi için:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <Link 
                  to="/PrivacyPolicy_Client_TR.html" 
                  className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1"
                >
                  <ExternalLink size={16} />
                  Danışan Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link 
                  to="/PrivacyPolicy_Dietitian_TR.html" 
                  className="text-emerald-600 hover:text-emerald-700 underline inline-flex items-center gap-1"
                >
                  <ExternalLink size={16} />
                  Diyetisyen Gizlilik Politikası
                </Link>
              </li>
            </ul>
          </section>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200 text-gray-500 text-sm">
            <p>&copy; 2024 DietCoop. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </div>
    </div>
  );
}





