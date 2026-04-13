import { useState } from 'react';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/services/firebase/config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default function GoogleLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Sadece redirect kullan (popup sorunları nedeniyle)
      await signInWithRedirect(auth, googleProvider);
      // Redirect sonucu Login.tsx'deki useEffect'te kontrol edilecek
    } catch (err: any) {
      console.error('Google giriş hatası:', err);
      setError('Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 
                 bg-white text-gray-900 rounded-lg font-semibold
                 hover:bg-gray-100 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Chrome size={20} />
        <span>{loading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</span>
      </motion.button>
      
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-accent-red text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}



