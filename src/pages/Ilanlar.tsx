import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  Clock,
  User,
  Copy,
  CheckCircle,
  X,
  Save,
  Share2,
  MessageCircle,
  Linkedin,
  Twitter,
  Mail,
  Users
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ilanService, basvuruService } from '@/services/firebase/firestore';
import { Ilan } from '@/types/ilan';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function Ilanlar() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [basvuruSayilari, setBasvuruSayilari] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIlan, setEditingIlan] = useState<Ilan | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ilanToDelete, setIlanToDelete] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    departman: '',
    konum: '',
    calismaSekli: '' as Ilan['calismaSekli'],
    deneyimSeviyesi: '' as Ilan['deneyimSeviyesi'],
    basvuruBaslangicTarihi: '',
    basvuruBitisTarihi: '',
    aktif: true,
    maasAraligi: '',
    gereksinimler: '',
    sorumluluklar: '',
    avantajlar: '',
  });

  useEffect(() => {
    loadIlanlar();
  }, []);

  // Dışarı tıklanınca paylaşım menüsünü kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showShareMenu && !(e.target as HTMLElement).closest('.share-menu-container')) {
        setShowShareMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  const loadIlanlar = async () => {
    try {
      setLoading(true);
      const data = await ilanService.getAll();
      setIlanlar(data);
      
      // Her ilan için başvuru sayısını yükle
      const sayilar: Record<string, number> = {};
      for (const ilan of data) {
        if (ilan.id) {
          try {
            const basvurular = await basvuruService.getByIlanId(ilan.id);
            sayilar[ilan.id] = basvurular.length;
          } catch (error) {
            console.error(`İlan ${ilan.id} başvuru sayısı yüklenirken hata:`, error);
            sayilar[ilan.id] = 0;
          }
        }
      }
      setBasvuruSayilari(sayilar);
    } catch (error) {
      console.error('İlanlar yüklenirken hata:', error);
      showToast('İlanlar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      baslik: '',
      aciklama: '',
      departman: '',
      konum: '',
      calismaSekli: undefined,
      deneyimSeviyesi: undefined,
      basvuruBaslangicTarihi: '',
      basvuruBitisTarihi: '',
      aktif: true,
      maasAraligi: '',
      gereksinimler: '',
      sorumluluklar: '',
      avantajlar: '',
    });
    setEditingIlan(null);
  };

  const handleEdit = (ilan: Ilan) => {
    setEditingIlan(ilan);
    setFormData({
      baslik: ilan.baslik,
      aciklama: ilan.aciklama,
      departman: ilan.departman || '',
      konum: ilan.konum || '',
      calismaSekli: ilan.calismaSekli,
      deneyimSeviyesi: ilan.deneyimSeviyesi,
      basvuruBaslangicTarihi: format(ilan.basvuruBaslangicTarihi.toDate(), 'yyyy-MM-dd'),
      basvuruBitisTarihi: format(ilan.basvuruBitisTarihi.toDate(), 'yyyy-MM-dd'),
      aktif: ilan.aktif,
      maasAraligi: ilan.maasAraligi || '',
      gereksinimler: ilan.gereksinimler?.join('\n') || '',
      sorumluluklar: ilan.sorumluluklar?.join('\n') || '',
      avantajlar: ilan.avantajlar?.join('\n') || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const baslangicTarihi = new Date(formData.basvuruBaslangicTarihi);
      baslangicTarihi.setHours(0, 0, 0, 0);
      const bitisTarihi = new Date(formData.basvuruBitisTarihi);
      bitisTarihi.setHours(23, 59, 59, 999);

      const ilanData: Omit<Ilan, 'id' | 'olusturmaTarihi'> = {
        baslik: formData.baslik,
        aciklama: formData.aciklama,
        departman: formData.departman || undefined,
        konum: formData.konum || undefined,
        calismaSekli: formData.calismaSekli || undefined,
        deneyimSeviyesi: formData.deneyimSeviyesi || undefined,
        basvuruBaslangicTarihi: Timestamp.fromDate(baslangicTarihi),
        basvuruBitisTarihi: Timestamp.fromDate(bitisTarihi),
        aktif: formData.aktif,
        maasAraligi: formData.maasAraligi || undefined,
        gereksinimler: formData.gereksinimler ? formData.gereksinimler.split('\n').filter(s => s.trim()) : undefined,
        sorumluluklar: formData.sorumluluklar ? formData.sorumluluklar.split('\n').filter(s => s.trim()) : undefined,
        avantajlar: formData.avantajlar ? formData.avantajlar.split('\n').filter(s => s.trim()) : undefined,
        olusturanAdmin: user.uid,
        guncelleyenAdmin: user.uid,
      };

      if (editingIlan) {
        await ilanService.update(editingIlan.id!, ilanData);
        showToast('İlan başarıyla güncellendi', 'success');
      } else {
        await ilanService.create(ilanData);
        showToast('İlan başarıyla oluşturuldu', 'success');
      }

      setShowModal(false);
      resetForm();
      await loadIlanlar();
    } catch (error) {
      console.error('İlan kaydetme hatası:', error);
      showToast('İlan kaydedilirken bir hata oluştu', 'error');
    }
  };

  const handleDelete = async () => {
    if (!ilanToDelete) return;

    try {
      await ilanService.delete(ilanToDelete);
      showToast('İlan başarıyla silindi', 'success');
      setDeleteModalOpen(false);
      setIlanToDelete(null);
      await loadIlanlar();
    } catch (error) {
      console.error('İlan silme hatası:', error);
      showToast('İlan silinirken bir hata oluştu', 'error');
    }
  };

  const generateShareLink = (ilanId: string) => {
    return `${window.location.origin}/kariyer#ilan-${ilanId}`;
  };

  const copyShareLink = (ilanId: string) => {
    const link = generateShareLink(ilanId);
    navigator.clipboard.writeText(link);
    setCopiedLink(ilanId);
    setShowShareMenu(null);
    showToast('Link kopyalandı', 'success');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const shareToWhatsApp = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const text = encodeURIComponent(`${ilan.baslik} - DietCoop Kariyer Fırsatları\n\n${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToLinkedIn = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const url = encodeURIComponent(link);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToTwitter = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const text = encodeURIComponent(`${ilan.baslik} - DietCoop Kariyer Fırsatları`);
    const url = encodeURIComponent(link);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToFacebook = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const url = encodeURIComponent(link);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    setShowShareMenu(null);
  };

  const shareToEmail = (ilan: Ilan) => {
    const link = generateShareLink(ilan.id!);
    const subject = encodeURIComponent(`${ilan.baslik} - DietCoop Kariyer Fırsatları`);
    const body = encodeURIComponent(`Merhaba,\n\nDietCoop'ta açık bir pozisyon var:\n\n${ilan.baslik}\n\nDetaylar için: ${link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(null);
  };

  const getCalismaSekliText = (sekil?: string) => {
    const map: Record<string, string> = {
      'tam-zamanli': 'Tam Zamanlı',
      'yarı-zamanli': 'Yarı Zamanlı',
      'uzaktan': 'Uzaktan',
      'hibrit': 'Hibrit',
    };
    return map[sekil || ''] || sekil;
  };

  const getDeneyimSeviyesiText = (seviye?: string) => {
    const map: Record<string, string> = {
      'stajyer': 'Stajyer',
      'junior': 'Junior',
      'mid': 'Mid-Level',
      'senior': 'Senior',
      'lead': 'Lead',
    };
    return map[seviye || ''] || seviye;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">İş İlanları</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition font-medium"
        >
          <Plus size={20} />
          Yeni İlan
        </button>
      </div>

      {ilanlar.length === 0 ? (
        <div className="text-center py-20 bg-dark-card rounded-lg border border-dark-card-hover">
          <Briefcase size={64} className="mx-auto mb-4 text-dark-text-secondary opacity-50" />
          <p className="text-dark-text-secondary">Henüz ilan bulunmamaktadır</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ilanlar.map((ilan) => (
            <motion.div
              key={ilan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-card border border-dark-card-hover rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark-text mb-2">{ilan.baslik}</h3>
                  {ilan.departman && (
                    <p className="text-dark-text-secondary text-sm mb-2">{ilan.departman}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  ilan.aktif ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {ilan.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-dark-text-secondary">
                {ilan.konum && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{ilan.konum}</span>
                  </div>
                )}
                {ilan.calismaSekli && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{getCalismaSekliText(ilan.calismaSekli)}</span>
                  </div>
                )}
                {ilan.deneyimSeviyesi && (
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{getDeneyimSeviyesiText(ilan.deneyimSeviyesi)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>
                    {format(ilan.basvuruBaslangicTarihi.toDate(), 'dd MMM', { locale: tr })} - {format(ilan.basvuruBitisTarihi.toDate(), 'dd MMM yyyy', { locale: tr })}
                  </span>
                </div>
              </div>

              <p className="text-dark-text-secondary text-sm line-clamp-3">{ilan.aciklama}</p>

              {/* Başvuru Sayısı */}
              <div className="flex items-center gap-2 text-dark-text-secondary text-sm">
                <Users size={16} className="text-accent-green" />
                <span>
                  <span className="font-medium text-dark-text">{basvuruSayilari[ilan.id!] || 0}</span> başvuru
                </span>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-dark-card-hover">
                {/* Paylaşım Menüsü */}
                <div className="relative share-menu-container">
                  <button
                    onClick={() => setShowShareMenu(showShareMenu === ilan.id! ? null : ilan.id!)}
                    className="px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary"
                    title="Paylaş"
                  >
                    <Share2 size={16} />
                  </button>
                  
                  {showShareMenu === ilan.id! && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-0 mb-2 bg-dark-card border border-dark-card-hover rounded-lg p-2 shadow-lg z-10 min-w-[200px]"
                    >
                      <div className="space-y-1">
                        <button
                          onClick={() => shareToWhatsApp(ilan)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                        >
                          <MessageCircle size={16} className="text-green-400" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() => shareToLinkedIn(ilan)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                        >
                          <Linkedin size={16} className="text-blue-400" />
                          LinkedIn
                        </button>
                        <button
                          onClick={() => shareToTwitter(ilan)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                        >
                          <Twitter size={16} className="text-blue-300" />
                          Twitter
                        </button>
                        <button
                          onClick={() => shareToFacebook(ilan)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </button>
                        <button
                          onClick={() => shareToEmail(ilan)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                        >
                          <Mail size={16} className="text-gray-400" />
                          E-posta
                        </button>
                        <button
                          onClick={() => copyShareLink(ilan.id!)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                        >
                          {copiedLink === ilan.id! ? (
                            <>
                              <CheckCircle size={16} className="text-accent-green" />
                              Kopyalandı
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              Link Kopyala
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <button
                  onClick={() => handleEdit(ilan)}
                  className="px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary"
                  title="Düzenle"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    setIlanToDelete(ilan.id!);
                    setDeleteModalOpen(true);
                  }}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* İlan Ekleme/Düzenleme Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-card border border-dark-card-hover rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text">
                {editingIlan ? 'İlan Düzenle' : 'Yeni İlan Oluştur'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-dark-text-secondary hover:text-dark-text transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Başlık *</label>
                  <input
                    type="text"
                    required
                    value={formData.baslik}
                    onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  />
                </div>

                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Departman</label>
                  <input
                    type="text"
                    value={formData.departman}
                    onChange={(e) => setFormData({ ...formData, departman: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-dark-text-secondary text-sm mb-2">Açıklama *</label>
                <textarea
                  required
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Konum</label>
                  <input
                    type="text"
                    value={formData.konum}
                    onChange={(e) => setFormData({ ...formData, konum: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  />
                </div>

                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Çalışma Şekli</label>
                  <select
                    value={formData.calismaSekli || ''}
                    onChange={(e) => setFormData({ ...formData, calismaSekli: e.target.value as Ilan['calismaSekli'] })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  >
                    <option value="">Seçiniz</option>
                    <option value="tam-zamanli">Tam Zamanlı</option>
                    <option value="yarı-zamanli">Yarı Zamanlı</option>
                    <option value="uzaktan">Uzaktan</option>
                    <option value="hibrit">Hibrit</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Deneyim Seviyesi</label>
                  <select
                    value={formData.deneyimSeviyesi || ''}
                    onChange={(e) => setFormData({ ...formData, deneyimSeviyesi: e.target.value as Ilan['deneyimSeviyesi'] })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  >
                    <option value="">Seçiniz</option>
                    <option value="stajyer">Stajyer</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid-Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Maaş Aralığı</label>
                  <input
                    type="text"
                    value={formData.maasAraligi}
                    onChange={(e) => setFormData({ ...formData, maasAraligi: e.target.value })}
                    placeholder="Örn: 15.000 - 25.000 TL"
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Başvuru Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={formData.basvuruBaslangicTarihi}
                    onChange={(e) => setFormData({ ...formData, basvuruBaslangicTarihi: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  />
                </div>

                <div>
                  <label className="block text-dark-text-secondary text-sm mb-2">Başvuru Bitiş Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={formData.basvuruBitisTarihi}
                    onChange={(e) => setFormData({ ...formData, basvuruBitisTarihi: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-dark-text-secondary text-sm mb-2">Gereksinimler (Her satıra bir madde)</label>
                <textarea
                  value={formData.gereksinimler}
                  onChange={(e) => setFormData({ ...formData, gereksinimler: e.target.value })}
                  rows={3}
                  placeholder="Örn:&#10;Lisans mezunu&#10;2+ yıl deneyim&#10;İyi seviyede İngilizce"
                  className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition resize-none"
                />
              </div>

              <div>
                <label className="block text-dark-text-secondary text-sm mb-2">Sorumluluklar (Her satıra bir madde)</label>
                <textarea
                  value={formData.sorumluluklar}
                  onChange={(e) => setFormData({ ...formData, sorumluluklar: e.target.value })}
                  rows={3}
                  placeholder="Örn:&#10;Proje yönetimi&#10;Ekip koordinasyonu"
                  className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition resize-none"
                />
              </div>

              <div>
                <label className="block text-dark-text-secondary text-sm mb-2">Avantajlar (Her satıra bir madde)</label>
                <textarea
                  value={formData.avantajlar}
                  onChange={(e) => setFormData({ ...formData, avantajlar: e.target.value })}
                  rows={3}
                  placeholder="Örn:&#10;Esnek çalışma saatleri&#10;Uzaktan çalışma imkanı"
                  className="w-full px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text focus:outline-none focus:border-accent-green transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                  className="w-4 h-4 text-accent-green bg-dark-card-hover border-dark-card-hover rounded focus:ring-accent-green"
                />
                <label htmlFor="aktif" className="text-dark-text-secondary text-sm">
                  İlan aktif olsun
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text hover:bg-dark-card-hover/80 transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition font-medium flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editingIlan ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setIlanToDelete(null);
        }}
        onConfirm={handleDelete}
        title="İlanı Sil"
        message="Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
