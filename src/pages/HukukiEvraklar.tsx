import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

interface HukukiEvrak {
  id: string;
  title: string;
  pdfPath: string;
  category: 'diyetisyen' | 'danisan' | 'genel';
}

const hukukiEvraklar: HukukiEvrak[] = [
  {
    id: 'diyetisyen-uyelik-sozlesmesi',
    title: 'Diyetisyen Üyelik Sözleşmesi',
    pdfPath: '/hukuki-evraklar/Diyetisyen Üyelik Sözleşmesi.pdf',
    category: 'diyetisyen'
  },
  {
    id: 'kvkk-aydinlatma-diyetisyen',
    title: 'KVKK Aydınlatma Metni (Diyetisyen Kullanıcılar İçin)',
    pdfPath: '/hukuki-evraklar/KVKK Aydınlatma Metni (Diyetisyen Kullanıcılar İçin).pdf',
    category: 'diyetisyen'
  },
  {
    id: 'acik-riza-diyetisyen',
    title: 'Açık Rıza Metni (Diyetisyen Kullanıcılar İçin)',
    pdfPath: '/hukuki-evraklar/Açık Rıza Metni Diyetisyen Kullanıcılar İçin.pdf',
    category: 'diyetisyen'
  },
  {
    id: 'kvkk-aydinlatma-danisan',
    title: 'KVKK Aydınlatma Metni (Danışan Kullanıcıları İçin)',
    pdfPath: '/hukuki-evraklar/KVKK Aydınlatma Metni(Danışan Kullanıcıları İçin).pdf',
    category: 'danisan'
  },
  {
    id: 'acik-riza-danisan',
    title: 'Açık Rıza Metni (Danışan Kullanıcılar İçin)',
    pdfPath: '/hukuki-evraklar/Açık Rıza Metni Danışan Kullanıcılar İçin.pdf',
    category: 'danisan'
  },
  {
    id: 'mesafeli-satis-sozlesmesi',
    title: 'Mesafeli Satış Sözleşmesi',
    pdfPath: '/hukuki-evraklar/Mesafeli Satış Sözleşmesi.pdf',
    category: 'genel'
  },
  {
    id: 'elektronik-ticaret-bilgilendirme',
    title: 'Elektronik Ticaret Bilgilendirme Metni',
    pdfPath: '/hukuki-evraklar/Elektronik Ticaret Bilgilendirme Metni.pdf',
    category: 'genel'
  },
  {
    id: 'on-bilgilendirme-formu',
    title: 'Ön Bilgilendirme Formu',
    pdfPath: '/hukuki-evraklar/Ön Bilgilendirme Formu.pdf',
    category: 'genel'
  },
  {
    id: 'privacy-policy-client-tr',
    title: 'Gizlilik Politikası (Danışan - TR)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Client_TR.pdf',
    category: 'danisan'
  },
  {
    id: 'privacy-policy-client-en',
    title: 'Privacy Policy (Client - EN)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Client_EN.pdf',
    category: 'danisan'
  },
  {
    id: 'privacy-policy-dietitian-tr',
    title: 'Gizlilik Politikası (Diyetisyen - TR)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Dietitian_TR.pdf',
    category: 'diyetisyen'
  },
  {
    id: 'privacy-policy-dietitian-en',
    title: 'Privacy Policy (Dietitian - EN)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Dietitian_EN.pdf',
    category: 'diyetisyen'
  }
];

export default function HukukiEvraklar() {
  // Privacy Policy'leri ayrı tut
  const privacyPolicies = hukukiEvraklar.filter(e => 
    e.id.includes('privacy-policy')
  );
  
  // Diğer evraklar
  const diyetisyenEvraklar = hukukiEvraklar.filter(e => 
    e.category === 'diyetisyen' && !e.id.includes('privacy-policy')
  );
  const danisanEvraklar = hukukiEvraklar.filter(e => 
    e.category === 'danisan' && !e.id.includes('privacy-policy')
  );
  const genelEvraklar = hukukiEvraklar.filter(e => 
    e.category === 'genel' && !e.id.includes('privacy-policy')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg-secondary to-dark-bg">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
          >
            <ArrowLeft size={20} />
            <span>Ana Sayfaya Dön</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Yasal Sorumluluk Metinleri
          </h1>
          <p className="text-white/60 text-lg">
            DietCoop platformuna ait tüm yasal sorumluluk metinleri ve sözleşmeler
          </p>
        </div>

        {/* Gizlilik Politikaları - Yasal Sorumluluk Metinleri altında */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Gizlilik Politikaları</h2>
          <p className="text-white/60 text-sm mb-6">
            Türkçe ve İngilizce gizlilik politikaları
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {privacyPolicies.map((evrak) => (
              <Link
                key={evrak.id}
                to={`/hukuki-evraklar/${evrak.id}`}
                className="bg-dark-card border border-dark-card-hover rounded-lg p-6 hover:border-accent-green/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-accent-green/10 p-3 rounded-lg group-hover:bg-accent-green/20 transition">
                    <FileText className="text-accent-green" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2 group-hover:text-accent-green transition text-sm">
                      {evrak.title}
                    </h3>
                    <p className="text-white/40 text-xs">PDF Görüntüle</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Diyetisyen Evraklar */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Diyetisyen Kullanıcılar İçin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diyetisyenEvraklar.map((evrak) => (
              <Link
                key={evrak.id}
                to={`/hukuki-evraklar/${evrak.id}`}
                className="bg-dark-card border border-dark-card-hover rounded-lg p-6 hover:border-accent-green/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-accent-green/10 p-3 rounded-lg group-hover:bg-accent-green/20 transition">
                    <FileText className="text-accent-green" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2 group-hover:text-accent-green transition">
                      {evrak.title}
                    </h3>
                    <p className="text-white/40 text-sm">PDF Görüntüle</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Danışan Evraklar */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Danışan Kullanıcılar İçin</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {danisanEvraklar.map((evrak) => (
              <Link
                key={evrak.id}
                to={`/hukuki-evraklar/${evrak.id}`}
                className="bg-dark-card border border-dark-card-hover rounded-lg p-6 hover:border-accent-green/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-accent-green/10 p-3 rounded-lg group-hover:bg-accent-green/20 transition">
                    <FileText className="text-accent-green" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2 group-hover:text-accent-green transition">
                      {evrak.title}
                    </h3>
                    <p className="text-white/40 text-sm">PDF Görüntüle</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Genel Evraklar */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Genel Evraklar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {genelEvraklar.map((evrak) => (
              <Link
                key={evrak.id}
                to={`/hukuki-evraklar/${evrak.id}`}
                className="bg-dark-card border border-dark-card-hover rounded-lg p-6 hover:border-accent-green/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-accent-green/10 p-3 rounded-lg group-hover:bg-accent-green/20 transition">
                    <FileText className="text-accent-green" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-2 group-hover:text-accent-green transition">
                      {evrak.title}
                    </h3>
                    <p className="text-white/40 text-sm">PDF Görüntüle</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

