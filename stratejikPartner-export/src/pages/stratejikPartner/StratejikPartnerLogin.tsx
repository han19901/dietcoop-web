import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AnimatedBackground from '@/components/common/AnimatedBackground';

export default function StratejikPartnerLogin() {
  const { signInWithEmail, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('withgrower@bagertek.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user?.rol === 'stratejikPartner') {
      navigate('/stratejikpartner/bilgilendirme');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      navigate('/stratejikpartner/bilgilendirme');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-dark-card/90 backdrop-blur-xl rounded-3xl border border-[#00ff88]/20 p-8 shadow-2xl shadow-[#00ff88]/5">
            <div className="flex justify-center gap-4 mb-8">
              <img
                src="/growerdisilogo.svg"
                alt="Grower"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/DietCoop Logo.png';
                }}
              />
              <div className="w-px bg-white/20" />
              <img src="/DietCoop Logo.png" alt="DietCoop" className="w-16 h-16 object-contain" />
            </div>

            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Stratejik Partner Girişi
            </h1>
            <p className="text-white/60 text-sm text-center mb-8">
              DietCoop x With Grower Ortaklığı
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-transparent"
                    placeholder="withgrower@bagertek.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#00ff88] text-black font-semibold rounded-xl hover:bg-[#00ff88]/90 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Sparkles className="w-5 h-5 animate-pulse" />
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
