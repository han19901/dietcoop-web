import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AnimatedBackground from '@/components/common/AnimatedBackground';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import YasalOnayModal from '@/components/common/YasalOnayModal';
import { Chrome, Mail, Lock, AlertCircle, User, FileText, ExternalLink, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  adSoyad: string;
  gizlilikPolitikasiTR: boolean;
  privacyPolicyEN: boolean;
  kvkk: boolean;
  uyelikSozlesmesi: boolean;
}

export default function Login() {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signUpWithGoogle,
    checkYasalOnaylar,
    updateYasalOnaylar,
    sendPasswordResetEmail,
    loading, 
    user 
  } = useAuth();
  const [error, setError] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOnayModal, setShowOnayModal] = useState(false);
  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  const loginForm = useForm<LoginFormData>();
  const signUpForm = useForm<SignUpFormData>();

  // Login sonrası onay kontrolü
  useEffect(() => {
    const checkOnaylar = async () => {
      if (user && user.rol === 'diyetisyen') {
        const onayKontrol = await checkYasalOnaylar(user.uid);
        if (!onayKontrol.hasOnaylar) {
          setShowOnayModal(true);
        }
      }
    };

    if (user) {
      checkOnaylar();
    }
  }, [user, checkYasalOnaylar]);

  // Eğer kullanıcı zaten giriş yapmışsa ve onayları varsa yönlendir
  if (user && !showOnayModal) {
    return <LoadingSpinner />;
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      if (isSignUp) {
        // Kayıt modunda - önce onay modalı göster
        setIsGoogleSignUp(true);
        setShowOnayModal(true);
      } else {
        // Giriş modunda
        await signInWithGoogle();
      }
    } catch (err: any) {
      console.error('Google giriş hatası:', err);
      
      let errorMessage = 'Google ile giriş yapılırken bir hata oluştu.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Giriş penceresi kapatıldı. Lütfen tekrar deneyin.';
      }
      
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignUpWithOnaylar = async (onaylar: {
    gizlilikPolitikasiTR: boolean;
    privacyPolicyEN: boolean;
    kvkk: boolean;
    uyelikSozlesmesi: boolean;
  }) => {
    try {
      setGoogleLoading(true);
      setError('');
      setShowOnayModal(false);
      setIsGoogleSignUp(false);
      
      await signUpWithGoogle(onaylar);
    } catch (err: any) {
      console.error('Google kayıt hatası:', err);
      
      let errorMessage = 'Google ile kayıt olurken bir hata oluştu.';
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setShowOnayModal(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginOnayUpdate = async (onaylar: {
    gizlilikPolitikasiTR: boolean;
    privacyPolicyEN: boolean;
    kvkk: boolean;
    uyelikSozlesmesi: boolean;
  }) => {
    try {
      if (user) {
        await updateYasalOnaylar(user.uid, onaylar);
        setShowOnayModal(false);
        // Sayfayı yenile
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Onay güncelleme hatası:', err);
      setError('Onaylar güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setEmailLoading(true);
      setError('');
      await signInWithEmail(data.email, data.password);
    } catch (err: any) {
      console.error('Email giriş hatası:', err);
      let errorMessage = 'Giriş yapılırken bir hata oluştu.';
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'E-posta veya şifre hatalı.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }

    try {
      setForgotPasswordLoading(true);
      setError('');
      await sendPasswordResetEmail(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
    } catch (err: any) {
      console.error('Şifre sıfırlama hatası:', err);
      let errorMessage = 'Şifre sıfırlama email\'i gönderilirken bir hata oluştu.';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const onSignUpSubmit = async (data: SignUpFormData) => {
    try {
      setEmailLoading(true);
      setError('');

      // Şifre kontrolü
      if (data.password !== data.confirmPassword) {
        setError('Şifreler eşleşmiyor.');
        setEmailLoading(false);
        return;
      }

      // Onay kontrolü
      if (!data.gizlilikPolitikasiTR || !data.privacyPolicyEN || !data.kvkk || !data.uyelikSozlesmesi) {
        setError('Lütfen tüm yasal evrakları onaylayın.');
        setEmailLoading(false);
        return;
      }

      await signUpWithEmail(
        data.email,
        data.password,
        data.adSoyad,
        {
          gizlilikPolitikasiTR: data.gizlilikPolitikasiTR,
          privacyPolicyEN: data.privacyPolicyEN,
          kvkk: data.kvkk,
          uyelikSozlesmesi: data.uyelikSozlesmesi,
        }
      );
    } catch (err: any) {
      console.error('Kayıt hatası:', err);
      let errorMessage = 'Kayıt olurken bir hata oluştu.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu e-posta adresi zaten kullanılıyor.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <AnimatedBackground />
        <div className="z-10">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Geri Butonu */}
      {isSignUp ? (
        <button
          onClick={() => {
            setIsSignUp(false);
            setError('');
            signUpForm.reset();
          }}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Giriş Sayfasına Dön</span>
        </button>
      ) : (
        <Link
          to="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Ana Sayfaya Dön</span>
        </Link>
      )}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="card">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <img 
              src="/DietCoop Logo.png" 
              alt="DietCoop" 
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold mb-2">
              {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
            </h1>
            <p className="text-dark-text-secondary">
              {isSignUp 
                ? 'DietCoop sistemine kayıt olun' 
                : 'DietCoop sistemine hoş geldiniz'}
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-500/10 
                       border border-red-500/30 rounded-xl text-red-400 mb-6 backdrop-blur-sm shadow-lg"
            >
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium leading-relaxed">{error}</span>
            </motion.div>
          )}

          <div className="space-y-6">
            {!isSignUp && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || emailLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 
                           bg-white text-gray-900 rounded-lg font-semibold
                           hover:bg-gray-100 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome size={20} />
                  <span>{googleLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'}</span>
                </motion.button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-card-hover"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-dark-card text-dark-text-secondary">
                      veya
                    </span>
                  </div>
                </div>
              </>
            )}

            {isSignUp ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || emailLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 
                           bg-white text-gray-900 rounded-lg font-semibold
                           hover:bg-gray-100 transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Chrome size={20} />
                  <span>{googleLoading ? 'Kayıt yapılıyor...' : 'Google ile Kayıt Ol'}</span>
                </motion.button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dark-card-hover"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-dark-card text-dark-text-secondary">
                      veya
                    </span>
                  </div>
                </div>

                <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="adSoyad" className="label">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
                    <input
                      id="adSoyad"
                      type="text"
                      {...signUpForm.register('adSoyad', {
                        required: 'Ad soyad gereklidir',
                        minLength: {
                          value: 3,
                          message: 'Ad soyad en az 3 karakter olmalıdır',
                        },
                      })}
                      className="input pl-10"
                      placeholder="Adınız Soyadınız"
                      disabled={googleLoading || emailLoading}
                    />
                  </div>
                  {signUpForm.formState.errors.adSoyad && (
                    <p className="mt-1 text-sm text-accent-red">
                      {signUpForm.formState.errors.adSoyad.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-email" className="label">
                    E-posta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
                    <input
                      id="signup-email"
                      type="email"
                      {...signUpForm.register('email', {
                        required: 'E-posta gereklidir',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Geçerli bir e-posta adresi giriniz',
                        },
                      })}
                      className="input pl-10"
                      placeholder="ornek@email.com"
                      disabled={googleLoading || emailLoading}
                    />
                  </div>
                  {signUpForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-accent-red">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="signup-password" className="label">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
                    <input
                      id="signup-password"
                      type="password"
                      {...signUpForm.register('password', {
                        required: 'Şifre gereklidir',
                        minLength: {
                          value: 6,
                          message: 'Şifre en az 6 karakter olmalıdır',
                        },
                      })}
                      className="input pl-10"
                      placeholder="••••••••"
                      disabled={googleLoading || emailLoading}
                    />
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-accent-red">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="label">
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
                    <input
                      id="confirm-password"
                      type="password"
                      {...signUpForm.register('confirmPassword', {
                        required: 'Şifre tekrar gereklidir',
                      })}
                      className="input pl-10"
                      placeholder="••••••••"
                      disabled={googleLoading || emailLoading}
                    />
                  </div>
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-accent-red">
                      {signUpForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Yasal Onay Kutucukları */}
                <div className="space-y-3 p-4 bg-dark-card-hover/50 rounded-xl border border-dark-card-hover">
                  <p className="text-sm font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    Yasal Evraklar
                  </p>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...signUpForm.register('gizlilikPolitikasiTR', {
                          required: 'Bu evrakı onaylamanız gerekmektedir',
                        })}
                        className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                        disabled={googleLoading || emailLoading}
                      />
                      <div className="flex-1">
                        <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                          <Link 
                            to="/hukuki-evraklar/privacy-policy-dietitian-tr" 
                            target="_blank"
                            className="inline-flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Gizlilik Politikası (TR)
                            <ExternalLink size={12} />
                          </Link>
                          {' '}metnini okudum ve kabul ediyorum.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...signUpForm.register('privacyPolicyEN', {
                          required: 'This document must be approved',
                        })}
                        className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                        disabled={googleLoading || emailLoading}
                      />
                      <div className="flex-1">
                        <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                          <Link 
                            to="/hukuki-evraklar/privacy-policy-dietitian-en" 
                            target="_blank"
                            className="inline-flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Privacy Policy (EN)
                            <ExternalLink size={12} />
                          </Link>
                          {' '}I have read and accept.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...signUpForm.register('kvkk', {
                          required: 'Bu evrakı onaylamanız gerekmektedir',
                        })}
                        className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                        disabled={googleLoading || emailLoading}
                      />
                      <div className="flex-1">
                        <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                          <Link 
                            to="/hukuki-evraklar/kvkk-aydinlatma-diyetisyen" 
                            target="_blank"
                            className="inline-flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            KVKK Aydınlatma Metni
                            <ExternalLink size={12} />
                          </Link>
                          {' '}metnini okudum ve kabul ediyorum.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...signUpForm.register('uyelikSozlesmesi', {
                          required: 'Bu evrakı onaylamanız gerekmektedir',
                        })}
                        className="mt-1 w-4 h-4 rounded border-dark-card-hover text-accent-primary focus:ring-accent-primary focus:ring-2"
                        disabled={googleLoading || emailLoading}
                      />
                      <div className="flex-1">
                        <span className="text-sm text-dark-text group-hover:text-accent-primary transition-colors">
                          <Link 
                            to="/hukuki-evraklar/diyetisyen-uyelik-sozlesmesi" 
                            target="_blank"
                            className="inline-flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Diyetisyen Üyelik Sözleşmesi
                            <ExternalLink size={12} />
                          </Link>
                          {' '}metnini okudum ve kabul ediyorum.
                        </span>
                      </div>
                    </label>
                  </div>

                  {(signUpForm.formState.errors.gizlilikPolitikasiTR ||
                    signUpForm.formState.errors.privacyPolicyEN ||
                    signUpForm.formState.errors.kvkk ||
                    signUpForm.formState.errors.uyelikSozlesmesi) && (
                    <p className="mt-2 text-sm text-accent-red">
                      Lütfen tüm yasal evrakları onaylayın.
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={googleLoading || emailLoading}
                  className="btn-primary w-full"
                >
                  {emailLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </motion.button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError('');
                      signUpForm.reset();
                    }}
                    className="text-sm text-accent-primary hover:underline"
                  >
                    Zaten hesabınız var mı? Giriş yapın
                  </button>
                </div>
                </form>
              </>
            ) : (
              <>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="label">
                      E-posta
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
                      <input
                        id="email"
                        type="email"
                        {...loginForm.register('email', {
                          required: 'E-posta gereklidir',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Geçerli bir e-posta adresi giriniz',
                          },
                        })}
                        className="input pl-10"
                        placeholder="ornek@email.com"
                        disabled={googleLoading || emailLoading}
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-accent-red">
                        {loginForm.formState.errors.email.message}
                      </p>
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
                        {...loginForm.register('password', {
                          required: 'Şifre gereklidir',
                          minLength: {
                            value: 6,
                            message: 'Şifre en az 6 karakter olmalıdır',
                          },
                        })}
                        className="input pl-10"
                        placeholder="••••••••"
                        disabled={googleLoading || emailLoading}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-accent-red">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPasswordModal(true);
                        setError('');
                        setForgotPasswordEmail(loginForm.getValues('email') || '');
                      }}
                      className="text-sm text-accent-primary hover:underline"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={googleLoading || emailLoading}
                    className="btn-primary w-full"
                  >
                    {emailLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </motion.button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError('');
                      loginForm.reset();
                    }}
                    className="text-sm text-accent-primary hover:underline"
                  >
                    Hesabınız yok mu? Kayıt olun
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Yasal Onay Modal */}
      <YasalOnayModal
        isOpen={showOnayModal}
        onClose={() => {
          if (!isGoogleSignUp && user?.rol === 'diyetisyen') {
            // Login sonrası modal - kapatılamaz
            return;
          }
          setShowOnayModal(false);
          setIsGoogleSignUp(false);
        }}
        onConfirm={isGoogleSignUp ? handleGoogleSignUpWithOnaylar : handleLoginOnayUpdate}
        title={isGoogleSignUp ? 'Yasal Evrakları Onaylayın' : 'Yasal Evrakları Onaylamanız Gerekiyor'}
        description={
          isGoogleSignUp
            ? 'Devam edebilmek için lütfen aşağıdaki yasal evrakları okuyup onaylayın.'
            : 'Sistemi kullanmaya devam edebilmek için lütfen aşağıdaki yasal evrakları okuyup onaylayın.'
        }
        isRequired={true}
      />

      {/* Şifre Sıfırlama Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full"
          >
            {!forgotPasswordSuccess ? (
              <>
                <h2 className="text-2xl font-bold mb-4">Şifremi Unuttum</h2>
                <p className="text-dark-text-secondary mb-6">
                  E-posta adresinize şifre sıfırlama linki göndereceğiz. Lütfen e-posta adresinizi girin.
                </p>
                
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-4">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium leading-relaxed">{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="forgot-email" className="label">
                      E-posta
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={20} />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="input pl-10"
                        placeholder="ornek@email.com"
                        disabled={forgotPasswordLoading}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPasswordModal(false);
                        setForgotPasswordEmail('');
                        setError('');
                        setForgotPasswordSuccess(false);
                      }}
                      className="btn-secondary flex-1"
                      disabled={forgotPasswordLoading}
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotPasswordLoading || !forgotPasswordEmail.trim()}
                      className="btn-primary flex-1"
                    >
                      {forgotPasswordLoading ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-accent-green bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                    <Mail size={32} className="text-accent-green" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">E-posta Gönderildi</h2>
                  <p className="text-dark-text-secondary mb-4">
                    <strong>{forgotPasswordEmail}</strong> adresine şifre sıfırlama linki gönderildi. 
                    Lütfen e-posta kutunuzu kontrol edin ve linke tıklayarak şifrenizi sıfırlayın.
                  </p>
                  <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg p-3 mb-6">
                    <p className="text-sm text-yellow-500 font-medium">
                      ⚠️ Spam mailleri kontrol etmeyi unutmayın!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setForgotPasswordEmail('');
                      setError('');
                      setForgotPasswordSuccess(false);
                    }}
                    className="btn-primary w-full"
                  >
                    Tamam
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
