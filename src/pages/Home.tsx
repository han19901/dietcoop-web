import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft,
  Calendar, 
  Clock,
  FileText,
  BarChart3,
  ChevronDown,
  Instagram,
  Linkedin,
  Home as HomeIcon,
  HelpCircle,
  Package,
  MessageCircle,
  Menu,
  X,
  Sparkles,
  Briefcase
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { ayarlarService } from '@/services/firebase/firestore';
import SEO from '../components/seo/SEO';

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentSlogan, setCurrentSlogan] = useState(0);
  const [currentImage, setCurrentImage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [paketFiyatlari, setPaketFiyatlari] = useState({
    esnekPaket: 199,
    largePaket: 159,
    xlPaket: 129,
  });
  
  const slogans = [
    "Dijital Diyetisyen Ekosistemi",
    "Dijitalleşen Dünyada Sende Yerini Al",
    "Hız, Kalite ve İnovasyon",
    "Tüm Kontroller Sende"
  ];

  const sloganAnimations = [
    { 
      initial: { opacity: 0, y: 30 }, 
      animate: { opacity: 1, y: 0 }, 
      exit: { opacity: 0, y: -30 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
    { 
      initial: { opacity: 0, y: 20 }, 
      animate: { opacity: 1, y: 0 }, 
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
    { 
      initial: { opacity: 0, x: -50 }, 
      animate: { opacity: 1, x: 0 }, 
      exit: { opacity: 0, x: 50 },
      transition: { duration: 0.8, ease: "easeIn" }
    },
    { 
      initial: { opacity: 0, y: 20, scale: 0.95 }, 
      animate: { opacity: 1, y: 0, scale: 1 }, 
      exit: { opacity: 0, y: -20, scale: 1.05 },
      transition: { duration: 0.65, ease: "easeOut", type: "spring", stiffness: 100 }
    }
  ];

  useEffect(() => {
    const sloganInterval = setInterval(() => {
      setCurrentSlogan((prev) => (prev + 1) % slogans.length);
    }, 4000);
    return () => clearInterval(sloganInterval);
  }, [slogans.length]);

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev >= 13 ? 1 : prev + 1));
    }, 3000);
    return () => clearInterval(imageInterval);
  }, []);

  useEffect(() => {
    // Ayarlardan paket fiyatlarını çek
    const loadPaketFiyatlari = async () => {
      try {
        const ayarlar = await ayarlarService.get();
        if (ayarlar?.paketFiyatlari) {
          setPaketFiyatlari(ayarlar.paketFiyatlari);
        }
      } catch (error) {
        console.error('Paket fiyatları yüklenirken hata:', error);
      }
    };
    loadPaketFiyatlari();
  }, []);

  const nextImage = () => {
    setCurrentImage((prev) => (prev >= 13 ? 1 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev <= 1 ? 13 : prev - 1));
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
    }
  };

  const faqs = [
    {
      question: "DietCoop'un açılımı nedir?",
      answer: "DietCoop, İngilizce Diet Cooperation yani Türkçesiyle Diyet İşbirliği sunan, Diyetisyeni ve Danışanı birleştiren bir ekosistemin teknolojik altyapısını sağlayan aplikasyondur."
    },
    {
      question: "Paket seçmem gerekiyor mu?",
      answer: "Hayır! DietCoop'da paket seçimi yoktur. Sistemimiz tamamen kullan-öde (pay-as-you-go) modeliyle çalışır. Aktif danışan sayınıza göre otomatik olarak en uygun fiyatlandırma paketine yükseltilirsiniz. Örneğin, 0-10 danışan için Esnek Paket (199 TL/danışan), 11-20 danışan için Large Paket (159 TL/danışan), 21+ danışan için XL Paket (129 TL/danışan) fiyatlandırması otomatik uygulanır."
    },
    {
      question: "Nasıl faturalandırılıyorum?",
      answer: "Ay sonunda sadece o ay içinde diyet planı oluşturduğunuz danışanlar için faturalandırılırsınız. Örneğin, Ocak ayında 8 danışan için plan oluşturduysanız, sadece 8 danışan için Esnek Paket fiyatından faturalandırılırsınız. Aynı danışana ay içinde birden fazla plan oluştursanız bile, o danışan için sadece bir kez faturalandırılırsınız. Ayrıca, ayın ortasında ilk diyet planını oluşturduysanız, sadece aktif olduğunuz günler için oransal faturalandırma yapılır. 📊 Örnek Senaryo: Ocak ayında 8 danışan için plan oluşturdunuz → Esnek Paket. Şubat ayında 15 danışan için plan oluşturdunuz → Large Paket. Mart ayında 25 danışan için plan oluşturdunuz → XL Paket. 💰 Her ay sadece o ay içinde aktif olan danışanlarınız için faturalandırılırsınız. Kullanmadığınız için ödeme yapmazsınız!"
    },
    {
      question: "Deneme süresi var mı?",
      answer: "Evet, yeni kayıt olan diyetisyenler için deneme süresi bulunmaktadır. Deneme süresi boyunca ücretsiz olarak sistemi kullanabilirsiniz. Deneme süresi bitiminden itibaren aktif danışan sayınıza göre faturalandırma başlar."
    },
    {
      question: "Danışanlarımı nasıl takip edebileceğim?",
      answer: "DietCoop ile danışanlarınıza görevler atarsınız, günlük öğün, sıvı miktarı, egzersiz, ölçümler (KG, bel, kalça vb.), ve bunları anlık olarak sistem sizin belirlediğiniz saat ve tarihlerde danışanlarınıza hatırlatır ve notlamaları düzenli ve güncel olarak aplikasyon üzerinden almanızı sağlar."
    },
    {
      question: "Sistem bana ek gelir sağlar mı?",
      answer: "Evet, DietCoop ile daha fazla danışanı etkili şekilde yönetebilir, zaman kazanarak daha fazla danışana hizmet verebilirsiniz."
    },
    {
      question: "DietCoop kullanmak zor mu?",
      answer: "DietCoop bir danışan için telefonda mesaj yazabilmek kadar kolay bir kullanım sunar. Danışanlarınız bu konuda çok rahat edecekler. Siz diyetisyenlerimiz ise, kolay arayüzü, düşük işgücüne karşılık çok yüksek zaman tasarrufu sağlayan bu sistem ile danışanlarınıza karşı çok prestijli bir takip sistemi elde etmiş olursunuz."
    },
    {
      question: "Kaç danışanla aynı anda çalışabilirim?",
      answer: "DietCoop ile sınırsız sayıda danışanla aynı anda çalışabilirsiniz. Sistem ölçeklenebilir yapısı sayesinde büyümenize destek olur."
    },
    {
      question: "DietCoop diyetisyen etik değerlerine uygun mu?",
      answer: "Evet, DietCoop diyetisyen etik değerlerine tam uyumludur. Tüm veriler güvenli şekilde saklanır ve gizlilik prensipleri korunur."
    }
  ];

  // SEO için structured data
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DietCoop',
    url: 'https://www.dietcoop.com',
    logo: 'https://www.dietcoop.com/DietCoop Logo.png',
    description: 'DietCoop, diyetisyenler için tasarlanmış kapsamlı dijital diyet yönetim platformu. Danışan takibi, diyet planı oluşturma, istatistikler ve daha fazlası tek platformda.',
    sameAs: [
      'https://www.instagram.com/dietcoop',
      'https://www.linkedin.com/company/dietcoop'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-532-100-52-85',
      contactType: 'Diyetisyen Destek Hattı',
      areaServed: 'TR',
      availableLanguage: 'Turkish'
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Esnek Paket',
        price: paketFiyatlari.esnekPaket,
        priceCurrency: 'TRY',
        description: 'Aktif danışan başına fiyatlandırma'
      },
      {
        '@type': 'Offer',
        name: 'Large Paket',
        price: paketFiyatlari.largePaket,
        priceCurrency: 'TRY',
        description: 'Aktif danışan başına fiyatlandırma'
      },
      {
        '@type': 'Offer',
        name: 'XL Paket',
        price: paketFiyatlari.xlPaket,
        priceCurrency: 'TRY',
        description: 'Aktif danışan başına fiyatlandırma'
      }
    ]
  };

  // FAQ Structured Data
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  const structuredData = [organizationData, faqData];

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="DietCoop - Dijital Diyetisyen Ekosistemi | Profesyonel Diyet Yönetim Platformu"
        description="DietCoop ile diyetisyen işinizi dijitalleştirin. Danışan takibi, diyet planı oluşturma, istatistikler, mesajlaşma ve daha fazlası tek platformda. Sınırsız danışan, otomatik takip, detaylı raporlar."
        keywords="diyetisyen, diyet planı, danışan takibi, dijital diyet, diyet uygulaması, diyetisyen yazılımı, diyet yönetimi, sağlık teknolojisi, beslenme takibi, diyetisyen platformu, dijital diyetisyen, diyet planı oluşturma, danışan yönetim sistemi"
        image="/DietCoop Logo.png"
        url="/"
        type="website"
        structuredData={structuredData}
        canonical="https://www.dietcoop.com/"
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition"
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 mx-auto">
              <a href="#baslangic" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <HomeIcon size={18} />
                Başlangıç
              </a>
              <a href="#nasil-calisir" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <HelpCircle size={18} />
                Nasıl Çalışır
              </a>
              <Link to="/aplikasyon-ozellikleri" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <Sparkles size={18} />
                Aplikasyon Özellikleri
              </Link>
              <a href="#paketlerimiz" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <Package size={18} />
                Paketlerimiz
              </a>
              <a href="#sss" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <MessageCircle size={18} />
                SSS
              </a>
              <Link to="/kariyer" className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2">
                <Briefcase size={18} />
                Kariyer
              </Link>
              <Link to="/login" className="bg-[#00ff88] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[#00ff88]/90 transition text-base">
                Giriş Yap
              </Link>
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="md:hidden flex items-center gap-2">
              <Link 
                to="/login" 
                className="bg-[#00ff88] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#00ff88]/90 transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Giriş
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-white/10 py-4"
              >
              <div className="flex flex-col space-y-3">
                <a 
                  href="#baslangic" 
                  className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HomeIcon size={18} />
                  Başlangıç
                </a>
                <a 
                  href="#nasil-calisir" 
                  className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HelpCircle size={18} />
                  Nasıl Çalışır
                </a>
                <Link 
                  to="/aplikasyon-ozellikleri" 
                  className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Sparkles size={18} />
                  Aplikasyon Özellikleri
                </Link>
                <a 
                  href="#paketlerimiz" 
                  className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package size={18} />
                  Paketlerimiz
                </a>
                <a 
                  href="#sss" 
                  className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MessageCircle size={18} />
                  SSS
                </a>
                <Link 
                  to="/kariyer" 
                  className="text-white/70 hover:text-white transition text-base font-medium flex items-center gap-2 px-2 py-2 hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Briefcase size={18} />
                  Kariyer
                </Link>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="baslangic" className="relative pt-32 pb-20 px-4 min-h-screen flex flex-col justify-center">
        <div className="max-w-7xl mx-auto text-center w-full relative z-10">
          {/* Optimized Slider Container */}
          <div className="relative mb-16 mt-8">
            <div 
              className="relative overflow-hidden rounded-3xl mx-auto bg-black touch-pan-y" 
              style={{ width: '100%', maxWidth: '800px', aspectRatio: '4/3' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Slider Wrapper */}
              <motion.div
                className="flex h-full"
                animate={{
                  x: `calc(-${(currentImage - 1) * 100}% / 13)`
                }}
                transition={{
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                style={{
                  width: '1300%',
                  display: 'flex',
                  height: '100%'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => {
                  const isActive = currentImage === num;
                  const prevNum = currentImage <= 1 ? 13 : currentImage - 1;
                  const nextNum = currentImage >= 13 ? 1 : currentImage + 1;
                  const isPrev = num === prevNum;
                  const isNext = num === nextNum;
                  const isVisible = isActive || isPrev || isNext;
                  
                  return (
                    <div
                      key={num}
                      className="h-full flex-shrink-0 relative bg-black"
                      style={{
                        width: 'calc(100% / 13)',
                        minWidth: 'calc(100% / 13)'
                      }}
                    >
                      <img
                        src={`/Anlık ${num}.jpg`}
                        alt={`DietCoop ${num}`}
                        className="w-full h-full object-contain"
                        style={{
                          filter: isActive 
                            ? 'brightness(1) contrast(1.1)' 
                            : isVisible
                            ? 'brightness(0.4) contrast(0.9)'
                            : 'brightness(0.2) contrast(0.7)',
                          transition: 'filter 0.8s ease'
                        }}
                      />
                      {!isActive && (
                        <div className={`absolute inset-0 ${isVisible ? 'bg-black/50' : 'bg-black/70'}`} />
                      )}
                    </div>
                  );
                })}
              </motion.div>

              {/* Slider Navigation Buttons - Hidden on mobile */}
              <button
                onClick={prevImage}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full p-4 transition-all duration-300 group shadow-lg hover:shadow-[#00ff88]/50"
                aria-label="Önceki resim"
              >
                <ArrowLeft className="text-white w-7 h-7 group-hover:text-[#00ff88] transition-all group-hover:scale-110" strokeWidth={2.5} />
              </button>
              <button
                onClick={nextImage}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full p-4 transition-all duration-300 group shadow-lg hover:shadow-[#00ff88]/50"
                aria-label="Sonraki resim"
              >
                <ArrowRight className="text-white w-7 h-7 group-hover:text-[#00ff88] transition-all group-hover:scale-110" strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          {/* Slogan - Efektli */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative mb-4 block w-full"
          >
            <div className="relative inline-block overflow-hidden">
              <motion.div
                className="absolute inset-0 -z-10"
                style={{
                  width: '200%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent 30%, rgba(0,255,136,0.5) 50%, transparent 70%)',
                }}
                animate={{
                  x: ["-100%", "0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2,
                }}
              />
              <motion.h1 
                key={currentSlogan}
                initial={sloganAnimations[currentSlogan].initial}
                animate={sloganAnimations[currentSlogan].animate}
                exit={sloganAnimations[currentSlogan].exit}
                transition={sloganAnimations[currentSlogan].transition}
                className="text-3xl md:text-5xl font-bold leading-tight relative z-10 px-6 py-2 font-cormorant"
              >
                {slogans[currentSlogan]}
              </motion.h1>
            </div>
          </motion.div>
          
          {/* Alt başlık - Efektli */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative mb-12 block w-full"
          >
            <div className="relative inline-block overflow-hidden">
              <motion.div
                className="absolute inset-0 -z-10"
                style={{
                  width: '200%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent 30%, rgba(0,255,136,0.5) 50%, transparent 70%)',
                }}
                animate={{
                  x: ["-100%", "0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 1,
                  repeatDelay: 2,
                }}
              />
              <p className="text-xl md:text-2xl text-white/60 font-light relative z-10 px-6 py-2 font-cormorant">
                Danışan Takibi artık çok kolay
              </p>
            </div>
          </motion.div>
          
          {/* Butonlar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              to="/login" 
              className="bg-[#00ff88] text-black px-8 py-4 rounded-lg font-semibold hover:bg-[#00ff88]/90 transition flex items-center gap-2 justify-center text-lg"
            >
              Giriş Yap
              <ArrowRight size={20} />
            </Link>
            <a 
              href="#nasil-calisir" 
              className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition flex items-center gap-2 justify-center text-lg"
            >
              Nasıl Çalışır?
              <ChevronDown size={20} />
            </a>
          </motion.div>
        </div>
      </section>


      {/* Ana Bölüm */}
      <section id="nasil-calisir" className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Danışan Takibi Otomatikleşiyor
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto font-light">
              DietCoop, diyetisyen ile danışan arasındaki süreci dijitalleştirir.
              Planlama, takip ve hatırlatmaları otomatikleştirerek tüm yönetimi kolaylaştırır.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Calendar,
                title: "Günlük Rutinler",
                description: "Danışanınızın günlük diyet planına uydu mu, ne kadar su içti, gibi bilgiler artık size otomatik olarak gelecek."
              },
              {
                icon: Clock,
                title: "Kontroller",
                description: "Kilo, ölçüm gibi bir çok hatırlatmayı sistem sizin belirlediğiniz tarihlerde otomatik hatırlatmasını yapar ve bilgileri size gönderir."
              },
              {
                icon: FileText,
                title: "Diyet Planlaması",
                description: "Planlamanızı danışanınıza özel olarak girdiğinizde, tüm diyet planı artık kendi telefonunda gözükecek."
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition group"
                >
                  <div className="w-14 h-14 bg-[#00ff88]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#00ff88]/30 transition">
                    <Icon className="text-[#00ff88]" size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/60 font-light leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Resim 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <img
                src="/1.jpg"
                alt="DietCoop Feature"
                className="w-full h-auto object-contain"
                style={{
                  backgroundColor: '#000000',
                  filter: 'contrast(1.1) brightness(0.95)'
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-16"
          >
            <BarChart3 className="text-[#00ff88] mx-auto mb-6" size={56} />
            <h3 className="text-3xl font-bold mb-4">Süreç Yönetimi</h3>
            <p className="text-xl text-white/60 font-light max-w-2xl mx-auto">
              Diyet uyum oranını, egzersiz uyum oranı gibi bir çok veriye oturduğunuz yerden ulaşabileceksiniz.
            </p>
          </motion.div>

          {/* Resim 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <img
                src="/2.jpg"
                alt="DietCoop Feature"
                className="w-full h-auto object-contain mix-blend-screen"
                style={{
                  backgroundColor: '#000000',
                  filter: 'contrast(1.1) brightness(0.95)'
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Planla Takip Et Destekle */}
      <section className="py-32 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Planla · Takip Et · Destekle
            </h2>
            <p className="text-xl text-white/60 font-light">
              DietCoop ile danışan yönetimi üç basit adımda. Planını hazırla, süreci takip et ve danışanını destekle.
            </p>
          </motion.div>

          {/* Resim 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <img
                src="/3.jpg"
                alt="DietCoop Feature"
                className="w-full h-auto object-contain"
                style={{
                  backgroundColor: '#000000',
                  filter: 'contrast(1.1) brightness(0.95)'
                }}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Planla",
                description: "Diyet planını oluştur. Kaç gün süreceğini belirle, hedefleri, öğünleri ve ölçüm aralıklarını ayarla. 7 günlük planı hazırla, sistem bunu otomatik olarak ilgili tarih aralığına göre görevlere ve bildirimlere dönüştürsün."
              },
              {
                step: "2",
                title: "Takip et",
                description: "Takip ekranından danışanının plana uyumunu kolayca gözlemle."
              },
              {
                step: "3",
                title: "Destekle",
                description: "Danışan plana uyumu artırmak için özelleştirilmiş bildirimleri otomatik alır. Mobil uygulamadan yaptığı geri dönüşleri sen, DietCoop diyetisyeni olarak, kendi ekranından anında görebilirsin."
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8"
              >
                <div className="text-7xl font-bold text-[#00ff88]/30 mb-6 font-times">{item.step}</div>
                <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/60 font-light leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Paketlerimiz */}
      <section id="paketlerimiz" className="py-32 px-4 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">Paketlerimiz</h2>
            <div className="max-w-3xl mx-auto mb-8">
              <div className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-2xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-[#00ff88] mb-4">💡 Kullan-Öde Sistemi</h3>
                <p className="text-white/80 text-lg leading-relaxed mb-4">
                  DietCoop'da <strong className="text-white">paket seçimi yok</strong>! Sistemimiz tamamen <strong className="text-[#00ff88]">kullan-öde (pay-as-you-go)</strong> modeliyle çalışır.
                </p>
                <p className="text-white/70 text-base leading-relaxed mb-4">
                  Aktif danışan sayınıza göre otomatik olarak en uygun fiyatlandırma paketine yükseltilirsiniz. Ay sonunda sadece o ay içinde diyet planı oluşturduğunuz danışanlar için faturalandırılırsınız.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              {
                name: "Esnek Paket",
                price: paketFiyatlari.esnekPaket.toString(),
                period: "TL / ay",
                description: "0-10 Danışan için",
                danisanRange: "0-10 Danışan",
                highlight: false
              },
              {
                name: "Large Paket",
                price: paketFiyatlari.largePaket.toString(),
                period: "TL / ay",
                danisanRange: "11-20 Danışan",
                highlight: false
              },
              {
                name: "XL Paket",
                price: paketFiyatlari.xlPaket.toString(),
                period: "TL / ay",
                danisanRange: "21+ Danışan",
                highlight: false
              },
              {
                name: "Kurumsal Paket",
                price: "Özel",
                period: "Fiyatlandırma",
                danisanRange: "Kurumsal",
                highlight: true
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/5 border rounded-3xl p-10 hover:bg-white/10 transition-all duration-300 ${plan.highlight ? 'border-[#00ff88] bg-white/10 scale-105' : 'border-white/10 hover:border-white/20'}`}
              >
                <div className="text-center mb-8">
                  <div className="inline-block px-4 py-2 bg-[#00ff88]/10 rounded-full mb-4">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="text-white/70 mb-6 font-medium text-lg">{plan.danisanRange}</p>
                  <div className="mb-4">
                    <span className="text-5xl font-bold font-times text-[#00ff88]">{plan.price}</span>
                    <span className="text-white/60 ml-2 text-base font-times">{plan.period}</span>
                  </div>
                  <p className="text-white/50 text-sm">Danışan başına aylık</p>
                </div>
                <Link to="/login" className="bg-[#00ff88] text-black w-full py-4 rounded-xl font-semibold hover:bg-[#00ff88]/90 transition flex items-center justify-center gap-2 text-center block shadow-lg shadow-[#00ff88]/20 hover:shadow-[#00ff88]/40">
                  Giriş Yap
                  <ArrowRight size={20} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SSS */}
      <section id="sss" className="py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">Sık Sorulan Sorular</h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition"
                >
                  <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                  <ChevronDown 
                    className={`transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`}
                    size={24}
                  />
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-white/60 font-light leading-relaxed pt-2">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <img src="/DietCoop Logo.png" alt="DietCoop" className="h-10 mb-6" />
              <p className="text-white/60 font-light text-sm leading-relaxed">
                Diyetisyen ve danışan arasındaki süreci dijitalleştirerek, takip ve yönetimi otomatikleştiriyoruz.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kariyer</h4>
              <a href="https://www.indietsummit.com" target="_blank" rel="noopener noreferrer" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Uluslararası Diyet Zirvesi
              </a>
              <a href="https://www.kampuscoop.com" target="_blank" rel="noopener noreferrer" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Stajyerlerimiz için
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Bağlantılar</h4>
              <a href="https://www.diyetdeposu.com" target="_blank" rel="noopener noreferrer" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Tedarikçiler için
              </a>
              <Link to="/hukuki-evraklar" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Yasal Sorumluluk Metinleri
              </Link>
              <a href="/PrivacyPolicy_Client_TR.html" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Gizlilik Politikası (Danışan - TR)
              </a>
              <a href="/PrivacyPolicy_Client_EN.html" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Privacy Policy (Client - EN)
              </a>
              <a href="/PrivacyPolicy_Dietitian_TR.html" className="block text-white/60 hover:text-white transition text-sm mb-2 font-light">
                Gizlilik Politikası (Diyetisyen - TR)
              </a>
              <a href="/PrivacyPolicy_Dietitian_EN.html" className="block text-white/60 hover:text-white transition text-sm font-light">
                Privacy Policy (Dietitian - EN)
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-4">İletişim</h4>
              <div className="space-y-3 text-sm font-light">
                <div>
                  <p className="text-white/50 mb-2 text-xs">Diyetisyen WhatsApp Destek Hattı</p>
                  <a href="https://wa.me/905321005285" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 hover:underline flex items-center gap-2">
                    <span>📱</span> 0532 100 52 85
                  </a>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <a href="https://www.instagram.com/dietcoop/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#00ff88] transition">
                  <Instagram size={24} />
                </a>
                <a href="https://www.linkedin.com/company/dietcoop/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#00ff88] transition">
                  <Linkedin size={24} />
                </a>
              </div>
            </div>
          </div>
          <div className="text-center text-white/40 pt-8 border-t border-white/10 text-sm font-light">
            <p>&copy; 2025 DietCoop. Tüm hakları saklıdır.</p>
            <p className="mt-2">
              DietCoop bir{' '}
              <a 
                href="https://www.bagertek.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-[#00ff88] transition-colors underline"
              >
                Bağer Teknoloji
              </a>
              {' '}iştirakidir.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
