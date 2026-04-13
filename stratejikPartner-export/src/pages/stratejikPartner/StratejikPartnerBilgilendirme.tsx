import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, BarChart3, FileText, DollarSign } from 'lucide-react';
import AnimatedBackground from '@/components/common/AnimatedBackground';

export default function StratejikPartnerBilgilendirme() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          {!showContent ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex items-center gap-8 mb-8"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 rounded-2xl bg-[#00ff88]/20 border-2 border-[#00ff88]/50 flex items-center justify-center p-3"
                >
                  <img
                    src="/growerdisilogo.svg"
                    alt="With Grower"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/DietCoop Logo.png';
                    }}
                  />
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                  className="text-4xl text-[#00ff88] font-bold"
                >
                  ×
                </motion.div>
                <motion.div
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 rounded-2xl bg-[#00ff88]/20 border-2 border-[#00ff88]/50 flex items-center justify-center p-3"
                >
                  <img src="/DietCoop Logo.png" alt="DietCoop" className="w-full h-full object-contain" />
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-3xl sm:text-4xl font-bold text-white text-center mb-4 font-cormorant"
              >
                Stratejik Partner Süreç Bilgilendirme Ekranı
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-white/70 text-center max-w-lg mb-12"
              >
                DietCoop ile With Grower arasındaki stratejik işbirliği kapsamında
                süreç takibi ve performans verilerine hoş geldiniz.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                onClick={() => setShowContent(true)}
                className="flex items-center gap-2 px-8 py-4 bg-[#00ff88] text-black font-semibold rounded-xl hover:bg-[#00ff88]/90 transition-all"
              >
                Devam Et
                <ArrowRight size={20} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-dark-card/90 backdrop-blur-xl rounded-3xl border border-[#00ff88]/20 p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  Dashboard Özellikleri
                </h2>
                <div className="grid gap-4 mb-8">
                  {[
                    { icon: Users, title: 'Görüşmeler & Randevular', desc: 'Yapılan tüm görüşme ve randevu kayıtları' },
                    { icon: BarChart3, title: 'Satış & Ciro Takibi', desc: 'Aylık, 3-6-12 aylık ciro performansı' },
                    { icon: FileText, title: 'Süreç Logları', desc: 'Arama, teklif, ziyaret ve tüm aktivite kayıtları' },
                    { icon: DollarSign, title: 'Finansal Geçmiş', desc: 'Ödemeler, bekleyen bakiye, tahsil edilen tutarlar' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-xl bg-black/30 border border-white/5"
                    >
                      <item.icon className="w-8 h-8 text-[#00ff88] flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-white">{item.title}</h3>
                        <p className="text-sm text-white/60">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/stratejikpartner/dashboard')}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#00ff88] text-black font-semibold rounded-xl hover:bg-[#00ff88]/90 transition-all"
                >
                  Dashboard'a Git
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
