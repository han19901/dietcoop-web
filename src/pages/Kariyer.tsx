import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Calendar,
  Send,
  CheckCircle,
  Menu,
  X,
  Home as HomeIcon,
  HelpCircle,
  Package,
  MessageCircle,
  Sparkles,
  Upload,
  User,
  Share2,
  Linkedin,
  Twitter,
  Mail,
  Users,
  Copy
} from 'lucide-react';
import { ilanService, basvuruService } from '@/services/firebase/firestore';
import { cvStorageService } from '@/services/firebase/cvStorageService';
import { Ilan } from '@/types/ilan';
import { Basvuru } from '@/types/basvuru';
import { useToast } from '@/context/ToastContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import SEO from '../components/seo/SEO';

export default function Kariyer() {
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [basvuruSayilari, setBasvuruSayilari] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIlan, setSelectedIlan] = useState<Ilan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    adSoyad: '',
    email: '',
    telefon: '',
    ozgecmis: '',
    cvFile: null as File | null,
  });

  useEffect(() => {
    loadIlanlar();
  }, []);

  useEffect(() => {
    // İlanlar yüklendikten sonra hash kontrolü
    if (ilanlar.length > 0) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#ilan-')) {
        const ilanId = hash.replace('#ilan-', '');
        const ilan = ilanlar.find(i => i.id === ilanId);
        if (ilan) {
          setTimeout(() => {
            handleIlanClick(ilan);
          }, 300);
        }
      }
    }
  }, [ilanlar]);

  // Dışarı tıklanınca paylaşım menüsünü kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showShareMenu && !(e.target as HTMLElement).closest('.share-menu-container')) {
        setShowShareMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  const generateShareLink = (ilanId: string) => {
    return `${window.location.origin}/kariyer#ilan-${ilanId}`;
  };

  const copyShareLink = (ilanId: string) => {
    const link = generateShareLink(ilanId);
    navigator.clipboard.writeText(link);
    setCopiedLink(ilanId);
    setShowShareMenu(null);
    showSuccess('Link kopyalandı');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const shareToWhatsApp = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const text = encodeURIComponent(`${ilan.baslik} - DietCoop Kariyer Fırsatları\n\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToLinkedIn = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const url = encodeURIComponent(link);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToTwitter = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const text = encodeURIComponent(`${ilan.baslik} - DietCoop Kariyer Fırsatları`);
    const url = encodeURIComponent(link);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToEmail = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const subject = encodeURIComponent(`${ilan.baslik} - DietCoop Kariyer Fırsatları`);
    const body = encodeURIComponent(`Merhaba,\n\nDietCoop'ta açık bir pozisyon var:\n\n${ilan.baslik}\n\nDetaylar için: ${link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(null);
  };

  const loadIlanlar = async () => {
    try {
      setLoading(true);
      const aktifIlanlar = await ilanService.getAktifIlanlar();
      setIlanlar(aktifIlanlar);
      
      // Her ilan için başvuru sayısını yükle
      const sayilar: Record<string, number> = {};
      for (const ilan of aktifIlanlar) {
        if (ilan.id) {
          try {
            const basvurular = await basvuruService.getByIlanId(ilan.id);
            sayilar[ilan.id] = basvurular.length;
          } catch (error) {
            console.error(`İlan ${ilan.id} başvuru sayısı yüklenirken hata:`, error);
            sayilar[ilan.id] = 0;
          }
        }
      }
      setBasvuruSayilari(sayilar);
    } catch (error) {
      console.error('İlanlar yüklenirken hata:', error);
      showError('İlanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleIlanClick = (ilan: Ilan) => {
    setSelectedIlan(ilan);
    setShowForm(true);
    setFormData({
      adSoyad: '',
      email: '',
      telefon: '',
      ozgecmis: '',
      cvFile: null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, cvFile: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIlan) return;

    if (!formData.cvFile) {
      showError('Lütfen CV dosyanızı yükleyin');
      return;
    }

    setSubmitting(true);

    try {
      // CV'yi yükle
      const cvBilgileri = await cvStorageService.uploadCV(formData.cvFile);

      // Başvuruyu oluştur
      const basvuruData: Omit<Basvuru, 'id' | 'basvuruTarihi'> = {
        ilanId: selectedIlan.id!,
        ilanBaslik: selectedIlan.baslik,
        adSoyad: formData.adSoyad,
        email: formData.email,
        telefon: formData.telefon,
        cvUrl: cvBilgileri.cvUrl,
        cvDosyaAdi: cvBilgileri.cvDosyaAdi,
      };
      
      // ozgecmis boşsa ekleme
      if (formData.ozgecmis && formData.ozgecmis.trim()) {
        basvuruData.ozgecmis = formData.ozgecmis.trim();
      }
      
      await basvuruService.create(basvuruData);

      showSuccess('Başvurunuz başarıyla gönderildi!');
      setShowForm(false);
      setSelectedIlan(null);
      setShowSuccessMessage(true);
      setFormData({
        adSoyad: '',
        email: '',
        telefon: '',
        ozgecmis: '',
        cvFile: null,
      });
      
      // 5 saniye sonra teşekkür mesajını kapat
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } catch (error: any) {
      console.error('Başvuru gönderilirken hata:', error);
      showError(error.message || 'Başvuru gönderilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const getCalismaSekliText = (sekil?: string) => {
    const map: Record<string, string> = {
      'tam-zamanli': 'Tam Zamanlı',
      'yarı-zamanli': 'Yarı Zamanlı',
      'uzaktan': 'Uzaktan',
      'hibrit': 'Hibrit',
    };
    return map[sekil || ''] || sekil;
  };

  const getDeneyimSeviyesiText = (seviye?: string) => {
    const map: Record<string, string> = {
      'stajyer': 'Stajyer',
      'junior': 'Junior',
      'mid': 'Mid-Level',
      'senior': 'Senior',
      'lead': 'Lead',
    };
    return map[seviye || ''] || seviye;
  };

  return (
    <>
      <SEO
        title="Kariyer - DietCoop"
        description="DietCoop'ta kariyer fırsatları. Açık pozisyonlarımızı inceleyin ve başvurun."
        keywords="kariyer, iş ilanları, dietcoop kariyer, diyetisyen iş ilanları"
        url="https://www.dietcoop.com/kariyer"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition"
                aria-label="Menü"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="hidden md:flex items-center space-x-6 mx-auto">
                <Link to="/" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                  <HomeIcon size={18} />
                  Başlangıç
                </Link>
                <Link to="/#nasil-calisir" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                  <HelpCircle size={18} />
                  Nasıl Çalışır
                </Link>
                <Link to="/aplikasyon-ozellikleri" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                  <Sparkles size={18} />
                  Aplikasyon Özellikleri
                </Link>
                <Link to="/#paketlerimiz" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                  <Package size={18} />
                  Paketlerimiz
                </Link>
                <Link to="/#sss" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                  <MessageCircle size={18} />
                  SSS
                </Link>
                <Link to="/kariyer" className="text-[#00ff88] hover:text-[#00ff88]/90 transition text-base font-medium flex items-center gap-2 border-b-2 border-[#00ff88] pb-1">
                  <Briefcase size={18} />
                  Kariyer
                </Link>
                <Link to="/login" className="px-4 py-2 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90 transition font-medium">
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden fixed top-20 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/5 z-40"
            >
              <div className="px-4 py-4 space-y-2">
                <Link to="/" className="block px-4 py-2 text-white/70 hover:text-white transition">Başlangıç</Link>
                <Link to="/#nasil-calisir" className="block px-4 py-2 text-white/70 hover:text-white transition">Nasıl Çalışır</Link>
                <Link to="/aplikasyon-ozellikleri" className="block px-4 py-2 text-white/70 hover:text-white transition">Aplikasyon Özellikleri</Link>
                <Link to="/#paketlerimiz" className="block px-4 py-2 text-white/70 hover:text-white transition">Paketlerimiz</Link>
                <Link to="/#sss" className="block px-4 py-2 text-white/70 hover:text-white transition">SSS</Link>
                <Link to="/kariyer" className="block px-4 py-2 text-[#00ff88] transition">Kariyer</Link>
                <Link to="/login" className="block px-4 py-2 bg-[#00ff88] text-black rounded-lg text-center font-medium">Giriş Yap</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#00ff88] to-white bg-clip-text text-transparent">
                Kariyer Fırsatları
              </h1>
              <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto">
                DietCoop ailesine katılın ve dijital sağlık alanında kariyerinizi şekillendirin
              </p>
            </motion.div>
          </div>
        </section>

        {/* İlanlar Listesi */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ff88]"></div>
                <p className="mt-4 text-white/70">İlanlar yükleniyor...</p>
              </div>
            ) : ilanlar.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase size={64} className="mx-auto mb-4 text-white/30" />
                <h2 className="text-2xl font-bold mb-2">Şu anda açık pozisyon bulunmamaktadır</h2>
                <p className="text-white/70">Yeni pozisyonlar için bizi takip etmeye devam edin!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ilanlar.map((ilan, index) => (
                  <motion.div
                    key={ilan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleIlanClick(ilan)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#00ff88]/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-[#00ff88] group-hover:text-[#00ff88] transition">
                        {ilan.baslik}
                      </h3>
                      <Briefcase size={24} className="text-white/30 flex-shrink-0 ml-2" />
                    </div>
                    
                    {ilan.departman && (
                      <p className="text-white/60 text-sm mb-2">{ilan.departman}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {ilan.konum && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <MapPin size={16} />
                          <span>{ilan.konum}</span>
                        </div>
                      )}
                      {ilan.calismaSekli && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Clock size={16} />
                          <span>{getCalismaSekliText(ilan.calismaSekli)}</span>
                        </div>
                      )}
                      {ilan.deneyimSeviyesi && (
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <User size={16} />
                          <span>{getDeneyimSeviyesiText(ilan.deneyimSeviyesi)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-white/50 text-xs mb-4">
                      <Calendar size={14} />
                      <span>
                        Başvuru: {format(ilan.basvuruBaslangicTarihi.toDate(), 'dd MMM yyyy', { locale: tr })} - {format(ilan.basvuruBitisTarihi.toDate(), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </div>

                    <p className="text-white/70 text-sm line-clamp-3 mb-4">
                      {ilan.aciklama}
                    </p>

                    {/* Başvuru Sayısı */}
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-4">
                      <Users size={16} className="text-[#00ff88]" />
                      <span>
                        <span className="font-medium text-white">{basvuruSayilari[ilan.id!] || 0}</span> başvuru
                      </span>
                    </div>

                    {/* Paylaşım ve Başvur Butonları */}
                    <div className="flex items-center gap-2">
                      {/* Paylaşım Menüsü */}
                      <div className="relative share-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShareMenu(showShareMenu === ilan.id! ? null : ilan.id!);
                          }}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-white/70 hover:text-white"
                          title="Paylaş"
                        >
                          <Share2 size={18} />
                        </button>
                        
                        {showShareMenu === ilan.id! && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-0 mb-2 bg-gray-900 border border-white/10 rounded-lg p-2 shadow-lg z-10 min-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-1">
                              <button
                                onClick={() => shareToWhatsApp(ilan)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition text-white text-sm"
                              >
                                <MessageCircle size={16} className="text-green-400" />
                                WhatsApp
                              </button>
                              <button
                                onClick={() => shareToLinkedIn(ilan)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition text-white text-sm"
                              >
                                <Linkedin size={16} className="text-blue-400" />
                                LinkedIn
                              </button>
                              <button
                                onClick={() => shareToTwitter(ilan)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition text-white text-sm"
                              >
                                <Twitter size={16} className="text-blue-300" />
                                Twitter
                              </button>
                              <button
                                onClick={() => shareToEmail(ilan)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition text-white text-sm"
                              >
                                <Mail size={16} className="text-gray-400" />
                                E-posta
                              </button>
                              <button
                                onClick={() => copyShareLink(ilan.id!)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition text-white text-sm"
                              >
                                {copiedLink === ilan.id! ? (
                                  <>
                                    <CheckCircle size={16} className="text-[#00ff88]" />
                                    Kopyalandı
                                  </>
                                ) : (
                                  <>
                                    <Copy size={16} />
                                    Link Kopyala
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIlanClick(ilan);
                        }}
                        className="flex-1 py-2 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        Başvur
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Başvuru Formu Modal */}
        <AnimatePresence>
          {showForm && selectedIlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-[#00ff88]">{selectedIlan.baslik}</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-white/70 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* İlan Detayları */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">İlan Detayları</h3>
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{selectedIlan.aciklama}</p>
                  </div>

                  {selectedIlan.departman && (
                    <div>
                      <span className="text-white/50 text-xs">Departman: </span>
                      <span className="text-white/70 text-sm">{selectedIlan.departman}</span>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {selectedIlan.konum && (
                      <div>
                        <span className="text-white/50 text-xs">Konum: </span>
                        <span className="text-white/70">{selectedIlan.konum}</span>
                      </div>
                    )}
                    {selectedIlan.calismaSekli && (
                      <div>
                        <span className="text-white/50 text-xs">Çalışma Şekli: </span>
                        <span className="text-white/70">{getCalismaSekliText(selectedIlan.calismaSekli)}</span>
                      </div>
                    )}
                    {selectedIlan.deneyimSeviyesi && (
                      <div>
                        <span className="text-white/50 text-xs">Deneyim: </span>
                        <span className="text-white/70">{getDeneyimSeviyesiText(selectedIlan.deneyimSeviyesi)}</span>
                      </div>
                    )}
                    {selectedIlan.maasAraligi && (
                      <div>
                        <span className="text-white/50 text-xs">Maaş: </span>
                        <span className="text-white/70">{selectedIlan.maasAraligi}</span>
                      </div>
                    )}
                  </div>

                  {selectedIlan.gereksinimler && selectedIlan.gereksinimler.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium text-sm mb-2">Gereksinimler:</h4>
                      <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                        {selectedIlan.gereksinimler.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedIlan.sorumluluklar && selectedIlan.sorumluluklar.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium text-sm mb-2">Sorumluluklar:</h4>
                      <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                        {selectedIlan.sorumluluklar.map((sorum, idx) => (
                          <li key={idx}>{sorum}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedIlan.avantajlar && selectedIlan.avantajlar.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium text-sm mb-2">Avantajlar:</h4>
                      <ul className="list-disc list-inside space-y-1 text-white/70 text-sm">
                        {selectedIlan.avantajlar.map((avantaj, idx) => (
                          <li key={idx}>{avantaj}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10">
                    <span className="text-white/50 text-xs">Başvuru Tarihleri: </span>
                    <span className="text-white/70 text-sm">
                      {format(selectedIlan.basvuruBaslangicTarihi.toDate(), 'dd MMM yyyy', { locale: tr })} - {format(selectedIlan.basvuruBitisTarihi.toDate(), 'dd MMM yyyy', { locale: tr })}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Ad Soyad *</label>
                    <input
                      type="text"
                      required
                      value={formData.adSoyad}
                      onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition"
                      />
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-2">Telefon *</label>
                      <input
                        type="tel"
                        required
                        value={formData.telefon}
                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">CV Dosyası * (PDF, DOC, DOCX - Max 5MB)</label>
                    <div className="relative">
                      <input
                        type="file"
                        required
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="cv-upload"
                      />
                      <label
                        htmlFor="cv-upload"
                        className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-white/10 transition"
                      >
                        <Upload size={20} />
                        <span>{formData.cvFile ? formData.cvFile.name : 'CV Dosyası Seçin'}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm mb-2">Özgeçmiş (Opsiyonel)</label>
                    <textarea
                      value={formData.ozgecmis}
                      onChange={(e) => setFormData({ ...formData, ozgecmis: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition resize-none"
                      placeholder="Kendiniz hakkında kısa bilgi..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Başvuruyu Gönder
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Teşekkür Mesajı (Başvuru sonrası) */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-8 right-8 bg-[#00ff88] text-black p-4 rounded-lg shadow-lg z-50 max-w-sm"
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={24} />
                <div>
                  <p className="font-bold">Başvurunuz Alındı!</p>
                  <p className="text-sm">En kısa sürede size dönüş yapacağız.</p>
                </div>
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="ml-auto text-black/70 hover:text-black transition"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
