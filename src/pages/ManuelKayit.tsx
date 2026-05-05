import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Info,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { adminUserService } from '@/services/firebase/adminUserService';

type FormState = {
  email: string;
  password: string;
  name: string;
  surname: string;
  role: 'client' | 'dietitian';
  phone: string;
};

const initialForm: FormState = {
  email: '',
  password: '',
  name: '',
  surname: '',
  role: 'client',
  phone: '',
};

export default function ManuelKayit() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastResult, setLastResult] = useState<{
    uid: string;
    email: string;
    password: string;
  } | null>(null);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const generatePassword = () => {
    // Kolay iletilebilen, yeterince güçlü bir geçici şifre üret (10 karakter, karışık)
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`${label} kopyalandı`);
    } catch {
      showError('Kopyalanamadı');
    }
  };

  const validate = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) return 'Geçerli bir e-posta girin';
    if (form.password.length < 6) return 'Şifre en az 6 karakter olmalı';
    if (!form.name.trim()) return 'Ad gerekli';
    if (!form.surname.trim()) return 'Soyad gerekli';
    if (form.phone) {
      const cleaned = form.phone.replace(/[^0-9+]/g, '');
      if (!/^(\+?\d{10,15})$/.test(cleaned)) {
        return 'Telefon numarası formatı geçersiz (örn: 05XXYYYZZDD veya +905XXYYYZZDD)';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const validationError = validate();
    if (validationError) {
      showError(validationError);
      return;
    }

    setLoading(true);
    setLastResult(null);
    try {
      const result = await adminUserService.createMobileUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: form.name.trim(),
        surname: form.surname.trim(),
        role: form.role,
        phone: form.phone.trim() || undefined,
      });

      showSuccess('Kullanıcı başarıyla oluşturuldu');
      setLastResult({
        uid: result.uid,
        email: result.email,
        password: form.password,
      });
      setForm(initialForm);
    } catch (err: any) {
      console.error('Manuel kayıt hatası:', err);
      showError(err?.message || 'Kullanıcı oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 rounded-xl bg-accent-green bg-opacity-20 border border-accent-green border-opacity-30">
          <UserPlus size={24} className="text-accent-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-text">Manuel Kullanıcı Kaydı</h1>
          <p className="text-sm text-dark-text-secondary">
            Mobil uygulamadan kayıt olamamış kullanıcıları buradan sisteme ekleyin.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-xl p-4 flex gap-3"
      >
        <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-dark-text-secondary leading-relaxed">
          Oluşturulan hesap mobil uygulamaya giriş yapabilir hale gelir. Kullanıcı
          girdiğiniz <strong>e-posta ve şifre</strong> ile oturum açar. Yasal onaylar
          admin tarafından onaylanmış olarak kaydedilir. Şifreyi kullanıcıya güvenli
          bir kanal üzerinden iletin; isterseniz kullanıcı ilk girişten sonra şifresini
          kendisi değiştirebilir.
        </div>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-dark-card border border-dark-card-hover rounded-xl p-6 space-y-5"
      >
        {/* Rol seçimi */}
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">
            Kullanıcı Tipi
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['client', 'dietitian'] as const).map((r) => (
              <button
                type="button"
                key={r}
                disabled={loading}
                onClick={() => handleChange('role', r)}
                className={`px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                  form.role === r
                    ? 'bg-accent-green bg-opacity-20 border-accent-green text-accent-green'
                    : 'bg-dark-bg border-dark-card-hover text-dark-text-secondary hover:border-dark-text-secondary'
                }`}
              >
                {r === 'client' ? 'Danışan' : 'Diyetisyen'}
              </button>
            ))}
          </div>
        </div>

        {/* Ad / Soyad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Ad"
            icon={<UserIcon size={18} />}
            value={form.name}
            onChange={(v) => handleChange('name', v)}
            placeholder="Ad"
            disabled={loading}
            autoComplete="given-name"
          />
          <FormField
            label="Soyad"
            icon={<UserIcon size={18} />}
            value={form.surname}
            onChange={(v) => handleChange('surname', v)}
            placeholder="Soyad"
            disabled={loading}
            autoComplete="family-name"
          />
        </div>

        {/* Email */}
        <FormField
          label="E-posta"
          icon={<Mail size={18} />}
          type="email"
          value={form.email}
          onChange={(v) => handleChange('email', v)}
          placeholder="ornek@mail.com"
          disabled={loading}
          autoComplete="email"
        />

        {/* Phone */}
        <FormField
          label="Telefon (opsiyonel)"
          icon={<Phone size={18} />}
          type="tel"
          value={form.phone}
          onChange={(v) => handleChange('phone', v)}
          placeholder="05XXYYYZZDD veya +905XXYYYZZDD"
          disabled={loading}
          autoComplete="tel"
        />

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">
            Şifre
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary">
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="En az 6 karakter"
              disabled={loading}
              autoComplete="new-password"
              className="w-full pl-10 pr-24 py-3 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-accent-green disabled:opacity-50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={loading}
                className="p-2 text-dark-text-secondary hover:text-dark-text rounded"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                disabled={loading}
                className="px-2 py-1 text-xs text-accent-green border border-accent-green border-opacity-40 rounded hover:bg-accent-green hover:bg-opacity-10"
              >
                Üret
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-dark-text-secondary">
            En az 6 karakter. Güvenli bir şifre oluşturmak için "Üret"e tıklayın.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setForm(initialForm)}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-dark-card-hover text-dark-text-secondary hover:text-dark-text disabled:opacity-50"
          >
            Temizle
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-accent-green text-black font-semibold hover:bg-opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Kullanıcıyı Oluştur
              </>
            )}
          </button>
        </div>
      </motion.form>

      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-dark-text font-semibold">Kullanıcı oluşturuldu</h3>
                <p className="text-sm text-dark-text-secondary">
                  Aşağıdaki bilgileri kullanıcıya güvenli bir kanal üzerinden iletin.
                  Bu ekran yenilendiğinde şifre bir daha gösterilmez.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <ResultRow label="UID" value={lastResult.uid} onCopy={copyToClipboard} />
                <ResultRow label="E-posta" value={lastResult.email} onCopy={copyToClipboard} />
                <ResultRow label="Şifre" value={lastResult.password} onCopy={copyToClipboard} mono />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

type FormFieldProps = {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  autoComplete?: string;
};

function FormField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  autoComplete,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-dark-text mb-2">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-3 py-3 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text placeholder-dark-text-secondary focus:outline-none focus:border-accent-green disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  onCopy: (text: string, label: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="bg-dark-bg border border-dark-card-hover rounded-lg px-3 py-2 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-dark-text-secondary">
          {label}
        </div>
        <div
          className={`text-dark-text truncate ${mono ? 'font-mono' : ''}`}
          title={value}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, label)}
        className="p-1.5 text-dark-text-secondary hover:text-dark-text rounded"
        aria-label={`${label} kopyala`}
      >
        <Copy size={16} />
      </button>
    </div>
  );
}
