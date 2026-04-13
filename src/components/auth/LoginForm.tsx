import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const { signInWithEmail } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-posta veya şifre hatalı. Lütfen Firebase Console > Authentication bölümünden hesabınızın kayıtlı olduğundan ve şifrenizin doğru olduğundan emin olun.';
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi. Lütfen geçerli bir e-posta girin.';
      case 'auth/user-disabled':
        return 'Bu hesap devre dışı bırakılmış. Lütfen destek ekibiyle iletişime geçin.';
      case 'auth/too-many-requests':
        return 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';
      case 'auth/network-request-failed':
        return 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
      case 'auth/operation-not-allowed':
        return 'Bu giriş yöntemi etkin değil. Lütfen yönetici ile iletişime geçin.';
      default:
        return 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError('');
      const admin = await signInWithEmail(data.email, data.password);
      if (admin) {
        // Başarılı giriş - AuthContext'in güncellenmesi için sayfayı yenile
        console.log('LoginForm: Başarılı giriş, admin paneline yönlendiriliyor...');
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.href = '/admin';
      }
    } catch (err: any) {
      console.error('Giriş hatası:', err);
      const errorMessage = err.code ? getFirebaseErrorMessage(err.code) : (err.message || 'Giriş yapılırken bir hata oluştu');
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center gap-2 p-4 bg-accent-red bg-opacity-20 
                   border border-accent-red border-opacity-30 rounded-lg text-accent-red backdrop-blur-sm"
        >
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      <div>
        <label htmlFor="email" className="label">
          E-posta
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'E-posta gereklidir',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Geçerli bir e-posta adresi giriniz',
              },
            })}
            className="input pl-10"
            placeholder="ornek@email.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-accent-red">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Şifre
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
          <input
            id="password"
            type="password"
            {...register('password', {
              required: 'Şifre gereklidir',
              minLength: {
                value: 6,
                message: 'Şifre en az 6 karakter olmalıdır',
              },
            })}
            className="input pl-10"
            placeholder="••••••••"
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-accent-red">{errors.password.message}</p>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </motion.button>
    </motion.form>
  );
}



