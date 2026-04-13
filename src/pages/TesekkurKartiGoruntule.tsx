import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, UserPlus, Download, ArrowLeft, Heart } from 'lucide-react';
import { getEtkinlikAltBaslik } from '@/types/tesekkurKarti';
import html2canvas from 'html2canvas';
import { tesekkurKartiService } from '@/services/firebase/firestore';
import { TesekkurKarti } from '@/types/tesekkurKarti';

const DEFAULT_MESAJ = `Bugün gerçekleştirmiş olduğumuz toplantı için teşekkür ederiz. DietCoop adına çok verimli bir görüşme gerçekleştirdik. Potansiyel işbirliğimiz için teşekkür eder, birlikte güzel projelere imza atmayı dileriz.`;

export default function TesekkurKartiGoruntule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [kartData, setKartData] = useState<TesekkurKarti | null>(null);
  const [loading, setLoading] = useState(true);
  const kartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadKart();
    else setLoading(false);
  }, [id]);

  const loadKart = async () => {
    if (!id) return;
    try {
      const kart = await tesekkurKartiService.getById(id);
      if (kart && kart.aktif) {
        setKartData(kart);
      } else {
        setKartData(null);
      }
    } catch (error) {
      console.error('Teşekkür kartı yüklenirken hata:', error);
      setKartData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTarih = (tarih: string) => {
    const [y, m, d] = tarih.split('-');
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${parseInt(d)} ${aylar[parseInt(m) - 1]} ${y}`;
  };

  const generateImage = async () => {
    if (!kartRef.current || !kartData) return;
    try {
      const canvas = await html2canvas(kartRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `tesekkur-karti-${kartData.firmaAdi.replace(/\s+/g, '-')}.png`;
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

  if (!kartData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Teşekkür kartı bulunamadı</p>
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
          Ana Sayfaya Dön
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-xl border border-white/10"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-center">Teşekkür Kartı</h1>

          {/* Kart Tasarımı */}
          <div className="flex justify-center mb-8">
            <div
              ref={kartRef}
              className="w-full max-w-2xl mx-auto bg-gradient-to-br from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a] rounded-2xl overflow-hidden border-2 border-[#00ff88]/30 shadow-2xl relative"
              style={{ minHeight: '520px' }}
            >
              {/* Dekoratif köşe süsleri */}
              <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-[#00ff88]/40 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-[#00ff88]/40 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-[#00ff88]/40 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-[#00ff88]/40 rounded-br-2xl" />

              <div className="p-8 sm:p-12 relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-[#00ff88]/10 rounded-xl flex items-center justify-center border border-[#00ff88]/30">
                    <img src="/DietCoop Logo.png" alt="DietCoop" className="w-12 h-12 object-contain" />
                  </div>
                </div>

                {/* Başlık */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#00ff88] font-cormorant tracking-wide mb-2">
                    TEŞEKKÜR KARTI
                  </h2>
                  <p className="text-white/60 text-sm">{getEtkinlikAltBaslik(kartData.etkinlikTipi || 'toplanti')}</p>
                </div>

                {/* Firma */}
                <div className="text-center mb-6">
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Sayın</p>
                  <p className="text-xl sm:text-2xl font-semibold text-white font-cormorant">{kartData.firmaAdi}</p>
                </div>

                {/* Mesaj */}
                <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed text-center font-cormorant">
                    {kartData.ozelMesaj || DEFAULT_MESAJ}
                  </p>
                </div>

                {/* Detaylar */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-white/80">
                    <Users size={18} className="text-[#00ff88] flex-shrink-0" />
                    <div>
                      <span className="text-white/50 text-xs">Toplantıya Katılan:</span>
                      <p className="text-sm font-medium">{kartData.toplantiyaKatilanKisi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/80">
                    <Calendar size={18} className="text-[#00ff88] flex-shrink-0" />
                    <div>
                      <span className="text-white/50 text-xs">Tarih {kartData.toplantiSaati ? 've Saat' : ''}:</span>
                      <p className="text-sm font-medium">
                        {formatTarih(kartData.toplantiTarihi)}
                        {kartData.toplantiSaati ? ` • ${kartData.toplantiSaati}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-white/80">
                    <UserPlus size={18} className="text-[#00ff88] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white/50 text-xs">DietCoop Tarafı:</span>
                      <p className="text-sm font-medium">
                        {kartData.dietcoopKatilimcilar?.length ? kartData.dietcoopKatilimcilar.join(', ') : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alt imza */}
                <div className="flex justify-center items-center gap-2 pt-4 border-t border-white/10">
                  <Heart size={16} className="text-[#00ff88]" fill="#00ff88" />
                  <span className="text-[#00ff88] font-semibold text-sm">DietCoop</span>
                  <span className="text-white/40 text-xs">adına</span>
                </div>

                {/* Sosyal Medya */}
                <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-white/10">
                  <a
                    href="https://www.dietcoop.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-[#00ff88] transition-colors text-sm"
                  >
                    dietcoop.com
                  </a>
                  <a
                    href="https://www.instagram.com/dietcoop/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-[#00ff88] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.919-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.919.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.linkedin.com/company/dietcoop/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-[#00ff88] transition-colors"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* İndir Butonu */}
          <div className="flex justify-center">
            <button
              onClick={generateImage}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#00ff88] text-black rounded-lg font-semibold hover:bg-[#00ff88]/90 transition-all"
            >
              <Download size={20} />
              Kartı İndir
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
