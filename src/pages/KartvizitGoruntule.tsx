import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Download,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  ArrowLeft
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { kartvizitService } from '@/services/firebase/firestore';
import { Kartvizit } from '@/types/kartvizit';

export default function KartvizitGoruntule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [kartvizitData, setKartvizitData] = useState<Kartvizit | null>(null);
  const [loading, setLoading] = useState(true);
  const kartvizitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadKartvizit();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadKartvizit = async () => {
    if (!id) return;
    
    try {
      const kartvizit = await kartvizitService.getById(id);
      if (kartvizit && kartvizit.aktif) {
        setKartvizitData(kartvizit);
      } else {
        setKartvizitData(null);
      }
    } catch (error) {
      console.error('Kartvizit yüklenirken hata:', error);
      setKartvizitData(null);
    } finally {
      setLoading(false);
    }
  };

  const generateVCF = () => {
    if (!kartvizitData) return;

    const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${kartvizitData.adSoyad}
ORG:${kartvizitData.sirket || ''}
TITLE:${kartvizitData.unvan || ''}
TEL;TYPE=CELL:${kartvizitData.telefon}
EMAIL:${kartvizitData.email}
ADR;TYPE=WORK:;;${kartvizitData.adres || ''};;;
URL:${kartvizitData.website || ''}
END:VCARD`;

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kartvizitData.adSoyad || 'kartvizit'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateImage = async () => {
    if (!kartvizitRef.current || !kartvizitData) return;

    try {
      const canvas = await html2canvas(kartvizitRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${kartvizitData.adSoyad || 'kartvizit'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Görsel oluşturma hatası:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  if (!kartvizitData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Kartvizit bulunamadı</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-[#00ff88] text-black rounded-lg hover:bg-[#00ff88]/90"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-6 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-8 flex items-center gap-2 text-white/70 hover:text-white transition text-sm sm:text-base"
        >
          <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          Geri Dön
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl border border-white/10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">Kartvizit</h1>

          {/* Kartvizit Tasarımı - Mobil Optimize */}
          <div className="flex justify-center mb-8">
            <div
              ref={kartvizitRef}
              className="w-full max-w-md bg-black rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl text-white border-2 border-[#00ff88]/30 relative overflow-hidden"
              style={{ aspectRatio: '5.5/3.5', minHeight: '280px' }}
            >
              {/* Arka Plan Dekoratif Elementler */}
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-[#00ff88]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-[#00ff88]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="h-full flex flex-col justify-between relative z-10">
                {/* Üst Bölüm - Web Siteleri */}
                <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[8px] sm:text-[9px] md:text-[10px] text-white/60">
                    <a href="https://www.bagertek.com" target="_blank" rel="noopener noreferrer" 
                       className="hover:text-[#00ff88] transition-colors break-all">www.bagertek.com</a>
                    <span className="text-white/30 hidden sm:inline">•</span>
                    <a href="https://www.dietcoop.com" target="_blank" rel="noopener noreferrer" 
                       className="hover:text-[#00ff88] transition-colors break-all">www.dietcoop.com</a>
                    <span className="text-white/30 hidden sm:inline">•</span>
                    <a href="https://www.diyetdeposu.com" target="_blank" rel="noopener noreferrer" 
                       className="hover:text-[#00ff88] transition-colors break-all">www.diyetdeposu.com</a>
                  </div>
                </div>

                {/* Orta Bölüm - Logo ve İsim */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-[#00ff88]/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-[#00ff88]/30 p-1.5 sm:p-2 flex-shrink-0">
                      <img 
                        src="/DietCoop Logo.png" 
                        alt="DietCoop" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 truncate">{kartvizitData.adSoyad}</h3>
                      {kartvizitData.unvan && (
                        <p className="text-xs sm:text-sm text-[#00ff88] font-medium truncate">{kartvizitData.unvan}</p>
                      )}
                    </div>
                  </div>
                  {kartvizitData.sirket && (
                    <p className="text-xs sm:text-sm text-white/60 mb-1 sm:mb-2 pl-0 sm:pl-14 md:pl-20 truncate">{kartvizitData.sirket}</p>
                  )}
                </div>

                {/* Alt Bölüm - İletişim Bilgileri */}
                <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
                  {kartvizitData.telefon && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
                      <Phone size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0" />
                      <span className="truncate text-[10px] sm:text-xs">{kartvizitData.telefon}</span>
                    </div>
                  )}
                  {kartvizitData.email && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
                      <Mail size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0" />
                      <span className="truncate text-[10px] sm:text-xs">{kartvizitData.email}</span>
                    </div>
                  )}
                  {kartvizitData.website && (
                    <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
                      <Globe size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0" />
                      <span className="truncate text-[10px] sm:text-xs">{kartvizitData.website}</span>
                    </div>
                  )}
                  {/* Şirket Adresi - Her zaman göster */}
                  <div className="flex items-start gap-1.5 sm:gap-2 text-white/70 pt-0.5 sm:pt-1">
                    <MapPin size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0 mt-0.5" />
                    <span className="text-[9px] sm:text-[10px] leading-tight">
                      Üniversiteler Mah. 1597. Cad. No:3/87 Çankaya Ankara
                    </span>
                  </div>
                  {kartvizitData.adres && (
                    <div className="flex items-start gap-1.5 sm:gap-2 text-white/70">
                      <MapPin size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0 mt-0.5" />
                      <span className="text-[9px] sm:text-[10px] leading-tight line-clamp-2">{kartvizitData.adres}</span>
                    </div>
                  )}
                </div>

                {/* Sosyal Medya */}
                {(kartvizitData.instagram || kartvizitData.linkedin || 
                  kartvizitData.twitter || kartvizitData.facebook) && (
                  <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                    {kartvizitData.instagram && (
                      <a href={`https://instagram.com/${kartvizitData.instagram.replace('@', '')}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                        <Instagram size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                      </a>
                    )}
                    {kartvizitData.linkedin && (
                      <a href={`https://${kartvizitData.linkedin}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                        <Linkedin size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                      </a>
                    )}
                    {kartvizitData.twitter && (
                      <a href={`https://twitter.com/${kartvizitData.twitter.replace('@', '')}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                        <Twitter size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                      </a>
                    )}
                    {kartvizitData.facebook && (
                      <a href={`https://${kartvizitData.facebook}`} 
                         target="_blank" rel="noopener noreferrer"
                         className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                        <Facebook size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-4 sm:mt-6">
            <button
              onClick={generateVCF}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#00ff88] 
                       text-black rounded-lg font-semibold hover:bg-[#00ff88]/90 transition-all text-sm sm:text-base"
            >
              <Download size={18} className="sm:w-5 sm:h-5" />
              Telefona Kaydet (VCF)
            </button>

            <button
              onClick={generateImage}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 
                       text-white rounded-lg font-semibold hover:bg-white/20 transition-all text-sm sm:text-base"
            >
              <Download size={18} className="sm:w-5 sm:h-5" />
              Görsel İndir
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
