import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Globe, 
  Download, 
  Copy,
  CheckCircle,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Save,
  Trash2,
  ExternalLink,
  QrCode
} from 'lucide-react';
import html2canvas from 'html2canvas';
import QRCode from 'react-qr-code';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { kartvizitService } from '@/services/firebase/firestore';
import { Kartvizit } from '@/types/kartvizit';
import ConfirmModal from '@/components/common/ConfirmModal';

interface KartvizitData {
  adSoyad: string;
  unvan: string;
  telefon: string;
  email: string;
  adres: string;
  sirket: string;
  website: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  facebook: string;
}

export default function Kartvizitler() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const kartvizitRef = useRef<HTMLDivElement>(null);
  const [kartvizitler, setKartvizitler] = useState<Kartvizit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedKartvizit, setSelectedKartvizit] = useState<Kartvizit | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [kartvizitToDelete, setKartvizitToDelete] = useState<string | null>(null);
  
  const [kartvizitData, setKartvizitData] = useState<KartvizitData>({
    adSoyad: '',
    unvan: '',
    telefon: '',
    email: '',
    adres: '',
    sirket: '',
    website: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    facebook: '',
  });
  const [shareLink, setShareLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKartvizitler();
  }, []);

  const loadKartvizitler = async () => {
    try {
      setLoading(true);
      const data = await kartvizitService.getAll();
      setKartvizitler(data);
    } catch (error) {
      console.error('Kartvizitler yüklenirken hata:', error);
      showToast('Kartvizitler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof KartvizitData, value: string) => {
    setKartvizitData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) {
      showToast('Giriş yapmanız gerekiyor', 'error');
      return;
    }

    if (!kartvizitData.adSoyad || !kartvizitData.telefon || !kartvizitData.email) {
      showToast('Ad Soyad, Telefon ve E-posta zorunludur', 'error');
      return;
    }

    try {
      setSaving(true);
      const kartvizitId = await kartvizitService.create({
        ...kartvizitData,
        olusturanAdminId: user.uid,
        aktif: true,
      });

      const link = `${window.location.origin}/kartvizit/${kartvizitId}`;
      setShareLink(link);
      
      showToast('Kartvizit kaydedildi ve paylaşım linki oluşturuldu!', 'success');
      await loadKartvizitler();
      
      // Formu temizle
      setKartvizitData({
        adSoyad: '',
        unvan: '',
        telefon: '',
        email: '',
        adres: '',
        sirket: '',
        website: '',
        instagram: '',
        linkedin: '',
        twitter: '',
        facebook: '',
      });
    } catch (error) {
      console.error('Kartvizit kaydedilirken hata:', error);
      showToast('Kartvizit kaydedilirken hata oluştu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectKartvizit = (kartvizit: Kartvizit) => {
    setSelectedKartvizit(kartvizit);
    setKartvizitData({
      adSoyad: kartvizit.adSoyad,
      unvan: kartvizit.unvan || '',
      telefon: kartvizit.telefon,
      email: kartvizit.email,
      adres: kartvizit.adres || '',
      sirket: kartvizit.sirket || '',
      website: kartvizit.website || '',
      instagram: kartvizit.instagram || '',
      linkedin: kartvizit.linkedin || '',
      twitter: kartvizit.twitter || '',
      facebook: kartvizit.facebook || '',
    });
    const link = `${window.location.origin}/kartvizit/${kartvizit.id}`;
    setShareLink(link);
  };

  const handleDelete = async () => {
    if (!kartvizitToDelete) return;

    try {
      await kartvizitService.delete(kartvizitToDelete);
      showToast('Kartvizit silindi', 'success');
      await loadKartvizitler();
      if (selectedKartvizit?.id === kartvizitToDelete) {
        setSelectedKartvizit(null);
        setShareLink('');
        setKartvizitData({
          adSoyad: '',
          unvan: '',
          telefon: '',
          email: '',
          adres: '',
          sirket: '',
          website: '',
          instagram: '',
          linkedin: '',
          twitter: '',
          facebook: '',
        });
      }
    } catch (error) {
      console.error('Kartvizit silinirken hata:', error);
      showToast('Kartvizit silinirken hata oluştu', 'error');
    } finally {
      setDeleteModalOpen(false);
      setKartvizitToDelete(null);
    }
  };

  const generateVCF = (data?: KartvizitData) => {
    const vcfData = data || kartvizitData;
    const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${vcfData.adSoyad}
ORG:${vcfData.sirket || ''}
TITLE:${vcfData.unvan || ''}
TEL;TYPE=CELL:${vcfData.telefon}
EMAIL:${vcfData.email}
ADR;TYPE=WORK:;;${vcfData.adres || ''};;;
URL:${vcfData.website || ''}
END:VCARD`;

    const blob = new Blob([vcfContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vcfData.adSoyad || 'kartvizit'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('VCF dosyası indirildi!', 'success');
  };

  const generateImage = async () => {
    if (!kartvizitRef.current) return;

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
          showToast('Kartvizit görseli indirildi!', 'success');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Görsel oluşturma hatası:', error);
      showToast('Görsel oluşturulurken hata oluştu', 'error');
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      showToast('Link kopyalandı!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeRef.current || !shareLink) return;

    try {
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `kartvizit-qr-${selectedKartvizit?.id || 'yeni'}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast('QR kod indirildi!', 'success');
        }
      }, 'image/png');
    } catch (error) {
      console.error('QR kod indirme hatası:', error);
      showToast('QR kod indirilirken hata oluştu', 'error');
    }
  };

  const getKartvizitDataForPreview = (): KartvizitData => {
    return selectedKartvizit ? {
      adSoyad: selectedKartvizit.adSoyad,
      unvan: selectedKartvizit.unvan || '',
      telefon: selectedKartvizit.telefon,
      email: selectedKartvizit.email,
      adres: selectedKartvizit.adres || '',
      sirket: selectedKartvizit.sirket || '',
      website: selectedKartvizit.website || '',
      instagram: selectedKartvizit.instagram || '',
      linkedin: selectedKartvizit.linkedin || '',
      twitter: selectedKartvizit.twitter || '',
      facebook: selectedKartvizit.facebook || '',
    } : kartvizitData;
  };

  const previewData = getKartvizitDataForPreview();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-dark-text">Kartvizitler</h1>
          <p className="text-dark-text-secondary mt-2">
            Profesyonel kartvizitlerinizi oluşturun, kaydedin ve paylaşın
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sol: Form ve Liste */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Form Bölümü */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-card rounded-xl p-4 sm:p-6 border border-dark-card-hover"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-dark-text">Kartvizit Bilgileri</h2>
              {selectedKartvizit && (
                <button
                  onClick={() => {
                    setSelectedKartvizit(null);
                    setShareLink('');
                    setKartvizitData({
                      adSoyad: '',
                      unvan: '',
                      telefon: '',
                      email: '',
                      adres: '',
                      sirket: '',
                      website: '',
                      instagram: '',
                      linkedin: '',
                      twitter: '',
                      facebook: '',
                    });
                  }}
                  className="text-xs text-dark-text-secondary hover:text-dark-text"
                >
                  Yeni
                </button>
              )}
            </div>
            
            <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <User size={16} className="inline mr-2" />
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={kartvizitData.adSoyad}
                  onChange={(e) => handleInputChange('adSoyad', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Briefcase size={16} className="inline mr-2" />
                  Unvan
                </label>
                <input
                  type="text"
                  value={kartvizitData.unvan}
                  onChange={(e) => handleInputChange('unvan', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="Örn: Uzman Diyetisyen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={kartvizitData.telefon}
                  onChange={(e) => handleInputChange('telefon', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="+90 555 123 45 67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Mail size={16} className="inline mr-2" />
                  E-posta *
                </label>
                <input
                  type="email"
                  value={kartvizitData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="ornek@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Briefcase size={16} className="inline mr-2" />
                  Şirket
                </label>
                <input
                  type="text"
                  value={kartvizitData.sirket}
                  onChange={(e) => handleInputChange('sirket', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="Şirket Adı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Adres
                </label>
                <textarea
                  value={kartvizitData.adres}
                  onChange={(e) => handleInputChange('adres', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  rows={2}
                  placeholder="Adres bilgisi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                  <Globe size={16} className="inline mr-2" />
                  Web Sitesi
                </label>
                <input
                  type="url"
                  value={kartvizitData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                           text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="pt-4 border-t border-dark-card-hover">
                <h3 className="text-sm font-semibold text-dark-text-secondary mb-4">Sosyal Medya</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                      <Instagram size={16} className="inline mr-2" />
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={kartvizitData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                               text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                      placeholder="@kullaniciadi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                      <Linkedin size={16} className="inline mr-2" />
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={kartvizitData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                               text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                      placeholder="linkedin.com/in/kullaniciadi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                      <Twitter size={16} className="inline mr-2" />
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={kartvizitData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                               text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                      placeholder="@kullaniciadi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text-secondary mb-2">
                      <Facebook size={16} className="inline mr-2" />
                      Facebook
                    </label>
                    <input
                      type="text"
                      value={kartvizitData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-card-hover rounded-lg 
                               text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-green"
                      placeholder="facebook.com/kullaniciadi"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !kartvizitData.adSoyad || !kartvizitData.telefon || !kartvizitData.email}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-accent-green 
                       text-black rounded-lg font-semibold hover:bg-accent-green/90 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={20} />
              {selectedKartvizit ? 'Güncelle' : 'Kaydet ve Paylaşım Linki Oluştur'}
            </button>
          </motion.div>

          {/* Kayıtlı Kartvizitler Listesi */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-dark-card rounded-xl p-4 sm:p-6 border border-dark-card-hover"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-3 sm:mb-4">Kayıtlı Kartvizitler</h2>
            
            {loading ? (
              <div className="text-center text-dark-text-secondary py-8">Yükleniyor...</div>
            ) : kartvizitler.length === 0 ? (
              <div className="text-center text-dark-text-secondary py-8">
                Henüz kartvizit kaydedilmemiş
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {kartvizitler.map((kartvizit) => (
                  <div
                    key={kartvizit.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedKartvizit?.id === kartvizit.id
                        ? 'bg-accent-green/20 border-accent-green'
                        : 'bg-dark-bg border-dark-card-hover hover:border-dark-card-hover/50'
                    }`}
                    onClick={() => handleSelectKartvizit(kartvizit)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-dark-text truncate">{kartvizit.adSoyad}</p>
                        {kartvizit.unvan && (
                          <p className="text-sm text-dark-text-secondary truncate">{kartvizit.unvan}</p>
                        )}
                        <p className="text-xs text-dark-text-secondary truncate">{kartvizit.email}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setKartvizitToDelete(kartvizit.id);
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

        {/* Sağ: Önizleme ve İşlemler */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="bg-dark-card rounded-xl p-4 sm:p-6 border border-dark-card-hover">
              <h2 className="text-lg sm:text-xl font-semibold text-dark-text mb-4 sm:mb-6">Önizleme</h2>
              
              {/* Kartvizit Tasarımı - Mobil Optimize */}
              <div className="flex justify-center">
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
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1 truncate">
                            {previewData.adSoyad || 'Ad Soyad'}
                          </h3>
                          {previewData.unvan && (
                            <p className="text-xs sm:text-sm text-[#00ff88] font-medium truncate">{previewData.unvan}</p>
                          )}
                        </div>
                      </div>
                      {previewData.sirket && (
                        <p className="text-xs sm:text-sm text-white/60 mb-1 sm:mb-2 pl-0 sm:pl-14 md:pl-20 truncate">{previewData.sirket}</p>
                      )}
                    </div>

                    {/* Alt Bölüm - İletişim Bilgileri */}
                    <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
                      {previewData.telefon && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
                          <Phone size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0" />
                          <span className="truncate text-[10px] sm:text-xs">{previewData.telefon}</span>
                        </div>
                      )}
                      {previewData.email && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
                          <Mail size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0" />
                          <span className="truncate text-[10px] sm:text-xs">{previewData.email}</span>
                        </div>
                      )}
                      {previewData.website && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-white/80">
                          <Globe size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0" />
                          <span className="truncate text-[10px] sm:text-xs">{previewData.website}</span>
                        </div>
                      )}
                      {/* Şirket Adresi - Her zaman göster */}
                      <div className="flex items-start gap-1.5 sm:gap-2 text-white/70 pt-0.5 sm:pt-1">
                        <MapPin size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0 mt-0.5" />
                        <span className="text-[9px] sm:text-[10px] leading-tight">
                          Üniversiteler Mah. 1597. Cad. No:3/87 Çankaya Ankara
                        </span>
                      </div>
                      {previewData.adres && (
                        <div className="flex items-start gap-1.5 sm:gap-2 text-white/70">
                          <MapPin size={10} className="sm:w-3 sm:h-3 text-[#00ff88] flex-shrink-0 mt-0.5" />
                          <span className="text-[9px] sm:text-[10px] leading-tight line-clamp-2">{previewData.adres}</span>
                        </div>
                      )}
                    </div>

                    {/* Sosyal Medya */}
                    {(previewData.instagram || previewData.linkedin || 
                      previewData.twitter || previewData.facebook) && (
                      <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                        {previewData.instagram && (
                          <a href={`https://instagram.com/${previewData.instagram.replace('@', '')}`} 
                             target="_blank" rel="noopener noreferrer"
                             className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                            <Instagram size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                          </a>
                        )}
                        {previewData.linkedin && (
                          <a href={`https://${previewData.linkedin}`} 
                             target="_blank" rel="noopener noreferrer"
                             className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                            <Linkedin size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                          </a>
                        )}
                        {previewData.twitter && (
                          <a href={`https://twitter.com/${previewData.twitter.replace('@', '')}`} 
                             target="_blank" rel="noopener noreferrer"
                             className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#00ff88]/20 hover:border hover:border-[#00ff88]/50 transition-all group">
                            <Twitter size={14} className="sm:w-4 sm:h-4 text-white/70 group-hover:text-[#00ff88]" />
                          </a>
                        )}
                        {previewData.facebook && (
                          <a href={`https://${previewData.facebook}`} 
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
            </div>

            {/* Aksiyon Butonları */}
            <div className="bg-dark-card rounded-xl p-4 sm:p-6 border border-dark-card-hover">
              <h3 className="text-base sm:text-lg font-semibold text-dark-text mb-3 sm:mb-4">İşlemler</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => generateVCF(selectedKartvizit ? previewData : undefined)}
                  disabled={!previewData.adSoyad || !previewData.telefon || !previewData.email}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-green 
                           text-black rounded-lg font-semibold hover:bg-accent-green/90 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Download size={20} />
                  VCF Olarak İndir (Telefona Kaydet)
                </button>

                <button
                  onClick={generateImage}
                  disabled={!previewData.adSoyad}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dark-card-hover 
                           text-dark-text rounded-lg font-semibold hover:bg-dark-card-hover/80 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Download size={20} />
                  Görsel Olarak İndir
                </button>

                {shareLink && (
                  <>
                    <div className="mt-4 p-4 bg-dark-bg rounded-lg border border-dark-card-hover">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-accent-green" />
                        <span className="text-sm font-medium text-dark-text">Paylaşım Linki:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={shareLink}
                          readOnly
                          className="flex-1 px-3 py-2 bg-dark-card border border-dark-card-hover 
                                   rounded-lg text-dark-text text-sm"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="p-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 
                                   transition-all"
                          title="Kopyala"
                        >
                          {copied ? (
                            <CheckCircle size={20} className="text-accent-green" />
                          ) : (
                            <Copy size={20} className="text-dark-text" />
                          )}
                        </button>
                        <a
                          href={shareLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 
                                   transition-all"
                          title="Yeni Sekmede Aç"
                        >
                          <ExternalLink size={20} className="text-dark-text" />
                        </a>
                      </div>
                    </div>

                    {/* QR Kod */}
                    <div className="mt-4 p-4 bg-dark-bg rounded-lg border border-dark-card-hover">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <QrCode size={16} className="text-accent-green" />
                          <span className="text-sm font-medium text-dark-text">QR Kod:</span>
                        </div>
                        <button
                          onClick={downloadQRCode}
                          className="px-3 py-1.5 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 
                                   transition-all text-xs text-dark-text flex items-center gap-2"
                        >
                          <Download size={14} />
                          İndir
                        </button>
                      </div>
                      <div className="flex justify-center">
                        <div 
                          ref={qrCodeRef}
                          className="bg-white p-4 rounded-lg"
                        >
                          <QRCode
                            value={shareLink}
                            size={200}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 200 200`}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-dark-text-secondary text-center mt-3">
                        QR kodu tarayarak kartvizite erişebilirsiniz
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setKartvizitToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Kartvizit Sil"
        message="Bu kartviziti silmek istediğinizden emin misiniz? Paylaşım linki de geçersiz olacaktır."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  );
}
