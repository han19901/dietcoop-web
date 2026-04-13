import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, CreditCard, Settings, Calendar } from 'lucide-react';
import AnimatedBackground from '@/components/common/AnimatedBackground';

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl"
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            src="/DietCoop Logo.png"
            alt="DietCoop"
            className="h-24 mx-auto mb-8"
          />
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold mb-6 gradient-text"
          >
            DietCoop Yönetim Sistemi
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-dark-text-secondary mb-8"
          >
            Diyetisyenlerin ödeme ve aktiflik durumlarını yönetin, 
            <br />
            sisteminizi tek merkezden kontrol edin.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/login"
              className="btn-primary flex items-center gap-2 justify-center text-lg px-8 py-4"
            >
              Giriş Yap
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12"
          >
            Özellikler
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Diyetisyen Yönetimi',
                description: 'Tüm diyetisyenleri tek yerden yönetin, durumlarını takip edin.',
              },
              {
                icon: CreditCard,
                title: 'Ödeme Takibi',
                description: 'Ödemeleri takip edin, onaylayın ve geçmişe bakın.',
              },
              {
                icon: Calendar,
                title: 'Deneme Süresi',
                description: '15 veya 30 günlük deneme süreleri başlatın.',
              },
              {
                icon: Settings,
                title: 'Sistem Ayarları',
                description: 'Fiyatlandırma ve sistem ayarlarını yönetin.',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-accent-green bg-opacity-20 rounded-lg">
                      <Icon className="text-accent-green" size={32} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-dark-text-secondary">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-card-hover py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-dark-text-secondary">
          <p>&copy; 2025 DietCoop. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}


