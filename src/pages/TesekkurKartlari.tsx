import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Calendar,
  UserPlus,
  Save,
  Copy,
  CheckCircle,
  ExternalLink,
  Trash2,
  Download,
  Plus,
  X,
  Heart,
  MessageSquare,
  Clock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { tesekkurKartiService } from '@/services/firebase/firestore';
import { TesekkurKarti, ETKINLIK_TIPLERI, getEtkinlikAltBaslik } from '@/types/tesekkurKarti';
import ConfirmModal from '@/components/common/ConfirmModal';

const DEFAULT_MESAJ = `Bugün gerçekleştirmiş olduğumuz toplantı için teşekkür ederiz. DietCoop adına çok verimli bir görüşme gerçekleştirdik. Potansiyel işbirliğimiz için teşekkür eder, birlikte güzel projelere imza atmayı dileriz.`;

export default function TesekkurKartlari() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const kartRef = useRef<HTMLDivElement>(null);
  const [kartlar, setKartlar] = useState<TesekkurKarti[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedKart, setSelectedKart] = useState<TesekkurKarti | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [kartToDelete, setKartToDelete] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firmaAdi: '',
    etkinlikTipi: 'toplanti' as TesekkurKarti['etkinlikTipi'],
    toplantiyaKatilanKisi: '',
    toplantiTarihi: new Date().toISOString().split('T')[0],
    toplantiSaati: '',
    dietcoopKatilimcilar: [''],
    ozelMesaj: '',
  });

  useEffect(() => {
    loadKartlar();
  }, []);

  const loadKartlar = async () => {
    try {
      setLoading(true);
      const data = await tesekkurKartiService.getAll();
      setKartlar(data);
    } catch (error) {
      console.error('Teşekkür kartları yüklenirken hata:', error);
      showToast('Teşekkür kartları yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDietcoopKatilimciChange = (index: number, value: string) => {
    const newList = [...formData.dietcoopKatilimcilar];
    newList[index] = value;
    setFormData((prev) => ({ ...prev, dietcoopKatilimcilar: newList }));
  };

  const addDietcoopKatilimci = () => {
    setFormData((prev) => ({
      ...prev,
      dietcoopKatilimcilar: [...prev.dietcoopKatilimcilar, ''],
    }));
  };

  const removeDietcoopKatilimci = (index: number) => {
    if (formData.dietcoopKatilimcilar.length <= 1) return;
    const newList = formData.dietcoopKatilimcilar.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, dietcoopKatilimcilar: newList }));
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Giriş yapmanız gerekiyor', 'error');
      return;
    }
    if (!formData.firmaAdi || !formData.toplantiyaKatilanKisi || !formData.toplantiTarihi) {
      showToast('Firma adı, katılımcı ve tarih zorunludur', 'error');
      return;
    }

    const dietcoopList = formData.dietcoopKatilimcilar.filter((s) => s.trim());
    if (dietcoopList.length === 0) {
      showToast('En az bir DietCoop katılımcısı girin', 'error');
      return;
    }

    try {
      setSaving(true);

      if (selectedKart) {
        await tesekkurKartiService.update(selectedKart.id, {
          firmaAdi: formData.firmaAdi,
          etkinlikTipi: formData.etkinlikTipi,
          toplantiyaKatilanKisi: formData.toplantiyaKatilanKisi,
          toplantiTarihi: formData.toplantiTarihi,
          toplantiSaati: formData.toplantiSaati || undefined,
          dietcoopKatilimcilar: dietcoopList,
          ozelMesaj: formData.ozelMesaj || undefined,
        });
        showToast('Teşekkür kartı güncellendi!', 'success');
        await loadKartlar();
        const guncelKart = await tesekkurKartiService.getById(selectedKart.id);
        if (guncelKart) setSelectedKart(guncelKart);
        return;
      }

      const yeniKartId = await tesekkurKartiService.create({
        firmaAdi: formData.firmaAdi,
        etkinlikTipi: formData.etkinlikTipi,
        toplantiyaKatilanKisi: formData.toplantiyaKatilanKisi,
        toplantiTarihi: formData.toplantiTarihi,
        toplantiSaati: formData.toplantiSaati || undefined,
        dietcoopKatilimcilar: dietcoopList,
        ozelMesaj: formData.ozelMesaj || undefined,
        olusturanAdminId: user.uid,
        aktif: true,
      });

      showToast('Teşekkür kartı oluşturuldu! Paylaşım linki hazır.', 'success');
      await loadKartlar();
      const yeniKart = await tesekkurKartiService.getById(yeniKartId);
      if (yeniKart) setSelectedKart(yeniKart);
      setFormData({
        firmaAdi: '',
        etkinlikTipi: 'toplanti',
        toplantiyaKatilanKisi: '',
        toplantiTarihi: new Date().toISOString().split('T')[0],
        toplantiSaati: '',
        dietcoopKatilimcilar: [''],
        ozelMesaj: '',
      });
    } catch (error) {
      console.error('Teşekkür kartı oluşturulurken hata:', error);
      showToast('Teşekkür kartı oluşturulurken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectKart = (kart: TesekkurKarti) => {
    setSelectedKart(kart);
    setFormData({
      firmaAdi: kart.firmaAdi,
      etkinlikTipi: kart.etkinlikTipi || 'toplanti',
      toplantiyaKatilanKisi: kart.toplantiyaKatilanKisi,
      toplantiTarihi: kart.toplantiTarihi,
      toplantiSaati: kart.toplantiSaati || '',
      dietcoopKatilimcilar: kart.dietcoopKatilimcilar?.length ? kart.dietcoopKatilimcilar : [''],
      ozelMesaj: kart.ozelMesaj || '',
    });
  };

  const handleDelete = async () => {
    if (!kartToDelete) return;
    try {
      await tesekkurKartiService.delete(kartToDelete);
      showToast('Teşekkür kartı silindi', 'success');
      await loadKartlar();
      if (selectedKart?.id === kartToDelete) {
        setSelectedKart(null);
        setFormData({
          firmaAdi: '',
          etkinlikTipi: 'toplanti',
          toplantiyaKatilanKisi: '',
          toplantiTarihi: new Date().toISOString().split('T')[0],
          toplantiSaati: '',
          dietcoopKatilimcilar: [''],
          ozelMesaj: '',
        });
      }
    } catch (error) {
      console.error('Teşekkür kartı silinirken hata:', error);
      showToast('Teşekkür kartı silinirken hata oluştu', 'error');
    } finally {
      setDeleteModalOpen(false);
      setKartToDelete(null);
    }
  };

  const getShareLink = () => {
    if (!selectedKart) return '';
    return `${window.location.origin}/tesekkur-karti/${selectedKart.id}`;
  };

  const copyToClipboard = () => {
    const link = getShareLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      showToast('Link kopyalandı!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTarih = (tarih: string) => {
    const [y, m, d] = tarih.split('-');
    const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${parseInt(d)} ${aylar[parseInt(m) - 1]} ${y}`;
  };

  const generateImage = async () => {
    if (!kartRef.current) return;
    const displayData = selectedKart || {
      firmaAdi: formData.firmaAdi,
      etkinlikTipi: formData.etkinlikTipi,
      toplantiyaKatilanKisi: formData.toplantiyaKatilanKisi,
      toplantiTarihi: formData.toplantiTarihi,
      toplantiSaati: formData.toplantiSaati,
      dietcoopKatilimcilar: formData.dietcoopKatilimcilar.filter((s) => s.trim()),
      ozelMesaj: formData.ozelMesaj,
    };

    if (!displayData.firmaAdi || !displayData.toplantiyaKatilanKisi) {
      showToast('Önizleme için firma adı ve katılımcı girin', 'error');
      return;
    }

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
          link.download = `tesekkur-karti-${displayData.firmaAdi.replace(/\s+/g, '-')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast('Teşekkür kartı indirildi!', 'success');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Görsel oluşturma hatası:', error);
      showToast('Görsel oluşturulurken hata oluştu', 'error');
    }
  };

  const previewData = selectedKart || {
    firmaAdi: formData.firmaAdi,
    etkinlikTipi: formData.etkinlikTipi,
    toplantiyaKatilanKisi: formData.toplantiyaKatilanKisi,
    toplantiTarihi: formData.toplantiTarihi,
    toplantiSaati: formData.toplantiSaati,
    dietcoopKatilimcilar: formData.dietcoopKatilimcilar.filter((s) => s.trim()),
    ozelMesaj: formData.ozelMesaj,
  };

  const TesekkurKartiTasarim = ({ data }: { data: typeof previewData }) => (
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00ff88] font-cormorant tracking-wide mb-2">
            TEŞEKKÜR KARTI
          </h1>
          <p className="text-white/60 text-sm">{getEtkinlikAltBaslik(data.etkinlikTipi || 'toplanti')}</p>
        </div>

        {/* Firma */}
        <div className="text-center mb-6">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Sayın</p>
          <p className="text-xl sm:text-2xl font-semibold text-white font-cormorant">
            {data.firmaAdi || 'Firma Adı'}
          </p>
        </div>

        {/* Mesaj */}
        <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/90 text-sm sm:text-base leading-relaxed text-center font-cormorant">
            {data.ozelMesaj || DEFAULT_MESAJ}
          </p>
        </div>

        {/* Detaylar */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-white/80">
            <Users size={18} className="text-[#00ff88] flex-shrink-0" />
            <div>
              <span className="text-white/50 text-xs">Toplantıya Katılan:</span>
              <p className="text-sm font-medium">{data.toplantiyaKatilanKisi || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <Calendar size={18} className="text-[#00ff88] flex-shrink-0" />
            <div>
              <span className="text-white/50 text-xs">Tarih {data.toplantiSaati ? 've Saat' : ''}:</span>
              <p className="text-sm font-medium">
                {data.toplantiTarihi ? formatTarih(data.toplantiTarihi) : '—'}
                {data.toplantiSaati ? ` • ${data.toplantiSaati}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-white/80">
            <UserPlus size={18} className="text-[#00ff88] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-white/50 text-xs">DietCoop Tarafı:</span>
              <p className="text-sm font-medium">
                {data.dietcoopKatilimcilar?.length ? data.dietcoopKatilimcilar.join(', ') : '—'}
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
        <div className="flex justify-center gap-4 mt-6 pt-6 border-t border-white/10">
          <a
            href="https://www.dietcoop.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-[#00ff88] transition-colors text-xs"
          >
            dietcoop.com
          </a>
          <a
            href="https://www.instagram.com/dietcoop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-[#00ff88] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.919-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.919.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/company/dietcoop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-[#00ff88] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-dark-text flex items-center gap-3">
            <Heart size={32} className="text-accent-green" />
            Teşekkür Kartları
          </h1>
          <p className="text-dark-text-secondary mt-2">
            Toplantı sonrası firmalara özel teşekkür kartları oluşturun ve paylaşın
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Form */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-card rounded-xl p-6 border border-dark-card-hover"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark-text flex items-center gap-2">
                <MessageSquare size={22} className="text-accent-green" />
                Yeni Teşekkür Kartı
              </h2>
              {selectedKart && (
                <button
                  onClick={() => {
                    setSelectedKart(null);
                    setFormData({
                      firmaAdi: '',
                      etkinlikTipi: 'toplanti',
                      toplantiyaKatilanKisi: '',
                      toplantiTarihi: new Date().toISOString().split('T')[0],
                      toplantiSaati: '',
                      dietcoopKatilimcilar: [''],
                      ozelMesaj: '',
                    });
                  }}
                  className="text-xs text-dark-text-secondary hover:text-dark-text"
                >
                  Yeni
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Building2 size={16} className="inline mr-2" />
                  Firma Adı *
                </label>
                <input
                  type="text"
                  value={formData.firmaAdi}
                  onChange={(e) => handleInputChange('firmaAdi', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="Örn: ABC Şirketi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Etkinlik Tipi
                </label>
                <select
                  value={formData.etkinlikTipi}
                  onChange={(e) => {
                  const val = e.target.value ?? 'toplanti';
                  handleInputChange('etkinlikTipi', val);
                }}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                >
                  {ETKINLIK_TIPLERI.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Users size={16} className="inline mr-2" />
                  Toplantıya Katılan Kişi *
                </label>
                <input
                  type="text"
                  value={formData.toplantiyaKatilanKisi}
                  onChange={(e) => handleInputChange('toplantiyaKatilanKisi', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="Örn: Ahmet Yılmaz, Müdür"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Toplantı Tarihi *
                </label>
                <input
                  type="date"
                  value={formData.toplantiTarihi}
                  onChange={(e) => handleInputChange('toplantiTarihi', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Saat (İsteğe bağlı)
                </label>
                <input
                  type="time"
                  value={formData.toplantiSaati}
                  onChange={(e) => handleInputChange('toplantiSaati', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <UserPlus size={16} className="inline mr-2" />
                  DietCoop Katılımcıları *
                </label>
                <div className="space-y-2">
                  {formData.dietcoopKatilimcilar.map((katilimci, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={katilimci}
                        onChange={(e) => handleDietcoopKatilimciChange(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                        placeholder={`Katılımcı ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeDietcoopKatilimci(index)}
                        disabled={formData.dietcoopKatilimcilar.length <= 1}
                        className="p-2 text-accent-red hover:bg-accent-red/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDietcoopKatilimci}
                    className="flex items-center gap-2 text-sm text-accent-green hover:text-accent-green/80"
                  >
                    <Plus size={16} />
                    Katılımcı Ekle
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  Özel Mesaj (İsteğe bağlı)
                </label>
                <textarea
                  value={formData.ozelMesaj}
                  onChange={(e) => handleInputChange('ozelMesaj', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  rows={4}
                  placeholder="Boş bırakırsanız varsayılan mesaj kullanılır"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !formData.firmaAdi || !formData.toplantiyaKatilanKisi || !formData.toplantiTarihi}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-accent-green text-black rounded-lg font-semibold hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={20} />
              {selectedKart ? 'Güncelle' : 'Kart Oluştur ve Link Al'}
            </button>
          </motion.div>

          {/* Kayıtlı Kartlar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-card rounded-xl p-6 border border-dark-card-hover"
          >
            <h2 className="text-lg font-semibold text-dark-text mb-4">Oluşturulan Kartlar</h2>
            {loading ? (
              <div className="text-center text-dark-text-secondary py-8">Yükleniyor...</div>
            ) : kartlar.length === 0 ? (
              <div className="text-center text-dark-text-secondary py-8">Henüz kart oluşturulmamış</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {kartlar.map((kart) => (
                  <div
                    key={kart.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedKart?.id === kart.id
                        ? 'bg-accent-green/20 border-accent-green'
                        : 'bg-dark-bg border-dark-card-hover hover:border-dark-card-hover/50'
                    }`}
                    onClick={() => handleSelectKart(kart)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark-text truncate">{kart.firmaAdi}</p>
                        <p className="text-xs text-dark-text-secondary truncate">{formatTarih(kart.toplantiTarihi)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setKartToDelete(kart.id);
                          setDeleteModalOpen(true);
                        }}
                        className="ml-2 p-1.5 text-accent-red hover:bg-accent-red/20 rounded transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sağ: Önizleme ve Paylaşım */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-card rounded-xl p-6 border border-dark-card-hover"
          >
            <h2 className="text-xl font-semibold text-dark-text mb-6">Önizleme</h2>
            <TesekkurKartiTasarim data={previewData} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-card rounded-xl p-6 border border-dark-card-hover"
          >
            <h3 className="text-lg font-semibold text-dark-text mb-4">İşlemler</h3>
            <div className="space-y-3">
              <button
                onClick={generateImage}
                disabled={!previewData.firmaAdi || !previewData.toplantiyaKatilanKisi}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-green text-black rounded-lg font-semibold hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download size={20} />
                Görsel Olarak İndir
              </button>

              {selectedKart && (
                <div className="p-4 bg-dark-bg rounded-lg border border-dark-card-hover">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-accent-green" />
                    <span className="text-sm font-medium text-dark-text">Paylaşım Linki:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={getShareLink()}
                      readOnly
                      className="flex-1 px-3 py-2 bg-dark-card border border-dark-card-hover rounded-lg text-dark-text text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-all"
                      title="Kopyala"
                    >
                      {copied ? <CheckCircle size={20} className="text-accent-green" /> : <Copy size={20} className="text-dark-text" />}
                    </button>
                    <a
                      href={getShareLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition-all"
                      title="Yeni Sekmede Aç"
                    >
                      <ExternalLink size={20} className="text-dark-text" />
                    </a>
                  </div>
                  <p className="text-xs text-dark-text-secondary mt-2">
                    Bu linki firmayla paylaşarak teşekkür kartına erişmelerini sağlayabilirsiniz.
                  </p>
                </div>
              )}

              {!selectedKart && (
                <p className="text-sm text-dark-text-secondary text-center py-4">
                  Paylaşım linki almak için önce bir kart oluşturun veya listeden seçin.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setKartToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Teşekkür Kartı Sil"
        message="Bu teşekkür kartını silmek istediğinizden emin misiniz? Paylaşım linki de geçersiz olacaktır."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  );
}
