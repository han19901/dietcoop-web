import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HukukiEvrakDetayProps {
  evrakId?: string;
}

const evrakMap: Record<string, { title: string; pdfPath: string }> = {
  'diyetisyen-uyelik-sozlesmesi': {
    title: 'Diyetisyen Üyelik Sözleşmesi',
    pdfPath: '/hukuki-evraklar/Diyetisyen Üyelik Sözleşmesi.pdf'
  },
  'kvkk-aydinlatma-diyetisyen': {
    title: 'KVKK Aydınlatma Metni (Diyetisyen Kullanıcılar İçin)',
    pdfPath: '/hukuki-evraklar/KVKK Aydınlatma Metni (Diyetisyen Kullanıcılar İçin).pdf'
  },
  'acik-riza-diyetisyen': {
    title: 'Açık Rıza Metni (Diyetisyen Kullanıcılar İçin)',
    pdfPath: '/hukuki-evraklar/Açık Rıza Metni Diyetisyen Kullanıcılar İçin.pdf'
  },
  'kvkk-aydinlatma-danisan': {
    title: 'KVKK Aydınlatma Metni (Danışan Kullanıcıları İçin)',
    pdfPath: '/hukuki-evraklar/KVKK Aydınlatma Metni(Danışan Kullanıcıları İçin).pdf'
  },
  'acik-riza-danisan': {
    title: 'Açık Rıza Metni (Danışan Kullanıcılar İçin)',
    pdfPath: '/hukuki-evraklar/Açık Rıza Metni Danışan Kullanıcılar İçin.pdf'
  },
  'mesafeli-satis-sozlesmesi': {
    title: 'Mesafeli Satış Sözleşmesi',
    pdfPath: '/hukuki-evraklar/Mesafeli Satış Sözleşmesi.pdf'
  },
  'elektronik-ticaret-bilgilendirme': {
    title: 'Elektronik Ticaret Bilgilendirme Metni',
    pdfPath: '/hukuki-evraklar/Elektronik Ticaret Bilgilendirme Metni.pdf'
  },
  'on-bilgilendirme-formu': {
    title: 'Ön Bilgilendirme Formu',
    pdfPath: '/hukuki-evraklar/Ön Bilgilendirme Formu.pdf'
  },
  'privacy-policy-client-tr': {
    title: 'Gizlilik Politikası (Danışan - TR)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Client_TR.pdf'
  },
  'privacy-policy-client-en': {
    title: 'Privacy Policy (Client - EN)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Client_EN.pdf'
  },
  'privacy-policy-dietitian-tr': {
    title: 'Gizlilik Politikası (Diyetisyen - TR)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Dietitian_TR.pdf'
  },
  'privacy-policy-dietitian-en': {
    title: 'Privacy Policy (Dietitian - EN)',
    pdfPath: '/hukuki-evraklar/PrivacyPolicy_Dietitian_EN.pdf'
  }
};

export default function HukukiEvrakDetay({ evrakId }: HukukiEvrakDetayProps = {}) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Önce prop'tan, sonra URL'den, son olarak location path'inden al
  let finalEvrakId = evrakId || id;
  
  // Eğer hala bulunamadıysa location path'inden çıkar
  if (!finalEvrakId) {
    const path = location.pathname;
    if (path.includes('PrivacyPolicy_Client_EN')) finalEvrakId = 'PrivacyPolicy_Client_EN';
    else if (path.includes('PrivacyPolicy_Client_TR')) finalEvrakId = 'PrivacyPolicy_Client_TR';
    else if (path.includes('PrivacyPolicy_Dietitian_EN')) finalEvrakId = 'PrivacyPolicy_Dietitian_EN';
    else if (path.includes('PrivacyPolicy_Dietitian_TR')) finalEvrakId = 'PrivacyPolicy_Dietitian_TR';
    else if (path.includes('DiyetisyenUyelikSozlesmesi')) finalEvrakId = 'DiyetisyenUyelikSozlesmesi';
    else if (path.includes('KVKKAydinlatmaDiyetisyen')) finalEvrakId = 'KVKKAydinlatmaDiyetisyen';
    else if (path.includes('AcikRizaDiyetisyen')) finalEvrakId = 'AcikRizaDiyetisyen';
    else if (path.includes('KVKKAydinlatmaDanisan')) finalEvrakId = 'KVKKAydinlatmaDanisan';
    else if (path.includes('AcikRizaDanisan')) finalEvrakId = 'AcikRizaDanisan';
    else if (path.includes('MesafeliSatisSozlesmesi')) finalEvrakId = 'MesafeliSatisSozlesmesi';
    else if (path.includes('ElektronikTicaretBilgilendirme')) finalEvrakId = 'ElektronikTicaretBilgilendirme';
    else if (path.includes('OnBilgilendirmeFormu')) finalEvrakId = 'OnBilgilendirmeFormu';
    else finalEvrakId = path.replace('/hukuki-evraklar/', '').replace('.html', '').replace('/', '');
  }
  
  // URL path'inden evrak ID'sini çıkar (örn: /PrivacyPolicy_Client_EN.html -> privacy-policy-client-en)
  let evrakKey = finalEvrakId;
  if (finalEvrakId.includes('PrivacyPolicy_Client_EN') || finalEvrakId === 'privacy-policy-client-en') evrakKey = 'privacy-policy-client-en';
  else if (finalEvrakId.includes('PrivacyPolicy_Client_TR') || finalEvrakId === 'privacy-policy-client-tr') evrakKey = 'privacy-policy-client-tr';
  else if (finalEvrakId.includes('PrivacyPolicy_Dietitian_EN') || finalEvrakId === 'privacy-policy-dietitian-en') evrakKey = 'privacy-policy-dietitian-en';
  else if (finalEvrakId.includes('PrivacyPolicy_Dietitian_TR') || finalEvrakId === 'privacy-policy-dietitian-tr') evrakKey = 'privacy-policy-dietitian-tr';
  else if (finalEvrakId.includes('DiyetisyenUyelikSozlesmesi') || finalEvrakId === 'diyetisyen-uyelik-sozlesmesi') evrakKey = 'diyetisyen-uyelik-sozlesmesi';
  else if (finalEvrakId.includes('KVKKAydinlatmaDiyetisyen') || finalEvrakId === 'kvkk-aydinlatma-diyetisyen') evrakKey = 'kvkk-aydinlatma-diyetisyen';
  else if (finalEvrakId.includes('AcikRizaDiyetisyen') || finalEvrakId === 'acik-riza-diyetisyen') evrakKey = 'acik-riza-diyetisyen';
  else if (finalEvrakId.includes('KVKKAydinlatmaDanisan') || finalEvrakId === 'kvkk-aydinlatma-danisan') evrakKey = 'kvkk-aydinlatma-danisan';
  else if (finalEvrakId.includes('AcikRizaDanisan') || finalEvrakId === 'acik-riza-danisan') evrakKey = 'acik-riza-danisan';
  else if (finalEvrakId.includes('MesafeliSatisSozlesmesi') || finalEvrakId === 'mesafeli-satis-sozlesmesi') evrakKey = 'mesafeli-satis-sozlesmesi';
  else if (finalEvrakId.includes('ElektronikTicaretBilgilendirme') || finalEvrakId === 'elektronik-ticaret-bilgilendirme') evrakKey = 'elektronik-ticaret-bilgilendirme';
  else if (finalEvrakId.includes('OnBilgilendirmeFormu') || finalEvrakId === 'on-bilgilendirme-formu') evrakKey = 'on-bilgilendirme-formu';

  const evrak = evrakMap[evrakKey];

  useEffect(() => {
    if (!evrak) {
      setError('Evrak bulunamadı');
      setIsLoading(false);
      return;
    }

    // PDF yüklenmesini kontrol et - direkt PDF linki ile
    const checkPdf = async () => {
      try {
        const response = await fetch(evrak.pdfPath, { method: 'HEAD' });
        if (response.ok) {
          setIsLoading(false);
        } else {
          setError('PDF bulunamadı');
          setIsLoading(false);
        }
      } catch (err) {
        // PDF yüklenmeye çalışırken hata olursa, yine de göster
        setIsLoading(false);
      }
    };
    
    checkPdf();
  }, [evrak]);

  if (!evrak) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg-secondary to-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Evrak Bulunamadı</h1>
          <Link to="/hukuki-evraklar" className="text-accent-green hover:underline">
            Yasal Sorumluluk Metinleri sayfasına dön
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg-secondary to-dark-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - iOS ve Android için minimal */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {evrak.title}
          </h1>
          <p className="text-white/60 text-sm">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* PDF Viewer - iOS ve Android için optimize */}
        <div className="bg-dark-card border border-dark-card-hover rounded-lg overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green mx-auto mb-4"></div>
                <p className="text-white/60">PDF yükleniyor...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <a
                  href={evrak.pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-accent-green/10 border border-accent-green/30 rounded-lg text-accent-green hover:bg-accent-green/20 transition"
                >
                  PDF'i Yeni Sekmede Aç
                </a>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="w-full" style={{ minHeight: '80vh' }}>
              {/* iOS ve Android için optimize edilmiş PDF görüntüleyici */}
              <iframe
                src={`${encodeURI(evrak.pdfPath)}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-screen min-h-[600px] md:min-h-[800px]"
                title={evrak.title}
                style={{
                  border: 'none',
                  WebkitOverflowScrolling: 'touch',
                  display: 'block'
                }}
                onLoad={() => setIsLoading(false)}
                allow="fullscreen"
              />
            </div>
          )}
        </div>

        {/* Action Buttons - iOS ve Android için */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <a
            href={evrak.pdfPath}
            download
            className="flex items-center justify-center gap-2 px-6 py-3 bg-dark-card border border-dark-card-hover rounded-lg text-white hover:bg-dark-card-hover transition"
          >
            <Download size={18} />
            <span>PDF İndir</span>
          </a>
          <a
            href={evrak.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-accent-green/10 border border-accent-green/30 rounded-lg text-accent-green hover:bg-accent-green/20 transition"
          >
            <ExternalLink size={18} />
            <span>Yeni Sekmede Aç</span>
          </a>
        </div>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-dark-card-hover">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition text-sm"
          >
            <ArrowLeft size={16} />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

