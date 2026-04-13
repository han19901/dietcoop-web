import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Save, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { ayarlarService, aktiviteLogService } from '@/services/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Ayarlar as AyarlarType, GiderKalemi } from '@/types/settings';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function Ayarlar() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [giderKalemleri, setGiderKalemleri] = useState<GiderKalemi[]>([]);
  const [editingKalem, setEditingKalem] = useState<GiderKalemi | null>(null);
  const [showKalemModal, setShowKalemModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingKalem, setDeletingKalem] = useState<GiderKalemi | null>(null);
  const [kalemFormData, setKalemFormData] = useState({ ad: '', renk: 'bg-blue-500' });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AyarlarType>();

  useEffect(() => {
    loadAyarlar();
  }, []);

  const loadAyarlar = async () => {
    try {
      const data = await ayarlarService.get();
      if (data) {
        reset(data);
        setGiderKalemleri(data.giderKalemleri || []);
      } else {
        // İlk kurulum - varsayılan değerler
        const defaultAyarlar: Partial<AyarlarType> = {
          kdvOrani: 20,
          paketFiyatlari: {
            esnekPaket: 199,
            largePaket: 159,
            xlPaket: 129,
          },
          bankaHesapBilgileri: {
            iban: '',
            aliciAdi: 'DietCoop',
            bankaAdi: '',
          },
          otomatikOdemeHesaplama: true,
          otomatikPasiflestirme: true,
          pasiflestirmeGunSayisi: 5,
          mobilUygulamaSyncAktif: true,
          varsayilanDenemeSuresiGunSayisi: 15,
          otomatikDenemeSuresiAktif: true,
          giderKalemleri: [],
        };
        reset(defaultAyarlar);
        setGiderKalemleri([]);
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
      setError('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AyarlarType) => {
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const updateData: Partial<AyarlarType> = {
        ...data,
        giderKalemleri,
        sonGuncelleme: Timestamp.now(),
        guncelleyenAdmin: user.uid,
      };

      await ayarlarService.update(updateData, user.uid);

      await aktiviteLogService.log(
        user.uid,
        'Ayarlar Güncellendi',
        'Sistem ayarları güncellendi'
      );

      setSuccess(true);
      showSuccess('Ayarlar başarıyla kaydedildi');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      setError('Ayarlar kaydedilirken bir hata oluştu');
      showError('Ayarlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleKalemEkle = () => {
    if (!kalemFormData.ad.trim()) {
      showError('Gider kalemi adı gereklidir');
      return;
    }

    const yeniKalem: GiderKalemi = {
      id: Date.now().toString(),
      ad: kalemFormData.ad.trim(),
      renk: kalemFormData.renk,
      aktif: true,
      sira: giderKalemleri.length,
      olusturmaTarihi: Timestamp.now(),
    };

    if (editingKalem) {
      // Düzenleme
      setGiderKalemleri(prev =>
        prev.map(k => k.id === editingKalem.id ? { ...yeniKalem, id: editingKalem.id } : k)
      );
      showSuccess('Gider kalemi güncellendi');
    } else {
      // Yeni ekleme
      setGiderKalemleri(prev => [...prev, yeniKalem]);
      showSuccess('Gider kalemi eklendi');
    }

    setKalemFormData({ ad: '', renk: 'bg-blue-500' });
    setEditingKalem(null);
    setShowKalemModal(false);
  };

  const handleKalemSil = async () => {
    if (!deletingKalem) return;

    setGiderKalemleri(prev => prev.filter(k => k.id !== deletingKalem.id));
    setDeleteModalOpen(false);
    setDeletingKalem(null);
    showSuccess('Gider kalemi silindi');
  };

  const handleKalemDuzenle = (kalem: GiderKalemi) => {
    setEditingKalem(kalem);
    setKalemFormData({ ad: kalem.ad, renk: kalem.renk });
    setShowKalemModal(true);
  };

  const handleKalemAktiflik = (kalemId: string) => {
    setGiderKalemleri(prev =>
      prev.map(k => k.id === kalemId ? { ...k, aktif: !k.aktif } : k)
    );
  };

  const renkSecenekleri = [
    { deger: 'bg-blue-500', isim: 'Mavi' },
    { deger: 'bg-green-500', isim: 'Yeşil' },
    { deger: 'bg-red-500', isim: 'Kırmızı' },
    { deger: 'bg-yellow-500', isim: 'Sarı' },
    { deger: 'bg-purple-500', isim: 'Mor' },
    { deger: 'bg-pink-500', isim: 'Pembe' },
    { deger: 'bg-indigo-500', isim: 'İndigo' },
    { deger: 'bg-orange-500', isim: 'Turuncu' },
    { deger: 'bg-cyan-500', isim: 'Cyan' },
    { deger: 'bg-gray-500', isim: 'Gri' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ayarlar</h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 p-4 bg-accent-red bg-opacity-20 
                   border border-accent-red border-opacity-30 rounded-lg text-accent-red backdrop-blur-sm"
        >
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2 p-4 bg-accent-green bg-opacity-20 
                   border border-accent-green border-opacity-30 rounded-lg text-accent-green backdrop-blur-sm"
        >
          <Save size={20} />
          <span className="font-medium">Ayarlar başarıyla kaydedildi</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Gider Kalemleri Yönetimi */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gider Kalemleri</h2>
            <button
              type="button"
              onClick={() => {
                setEditingKalem(null);
                setKalemFormData({ ad: '', renk: 'bg-blue-500' });
                setShowKalemModal(true);
              }}
              className="px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 flex items-center gap-2"
            >
              <Plus size={18} />
              Yeni Kalem Ekle
            </button>
          </div>
          <p className="text-sm text-dark-text-secondary mb-4">
            Gider eklerken kullanılacak kalemleri buradan yönetebilirsiniz.
          </p>
          {giderKalemleri.length === 0 ? (
            <p className="text-dark-text-secondary text-center py-8">
              Henüz gider kalemi eklenmemiş
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-border">
                    <th className="text-left p-4">Sıra</th>
                    <th className="text-left p-4">Kalem Adı</th>
                    <th className="text-left p-4">Renk</th>
                    <th className="text-center p-4">Durum</th>
                    <th className="text-center p-4">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {giderKalemleri.map((kalem, index) => (
                    <tr key={kalem.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-semibold">{kalem.ad}</td>
                      <td className="p-4">
                        <span className={`badge ${kalem.renk}`}>
                          {renkSecenekleri.find(r => r.deger === kalem.renk)?.isim || 'Renk'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={kalem.aktif}
                            onChange={() => handleKalemAktiflik(kalem.id)}
                            className="w-4 h-4"
                          />
                        </label>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleKalemDuzenle(kalem)}
                            className="p-2 hover:bg-dark-card-hover rounded transition-colors"
                            title="Düzenle"
                          >
                            <Edit size={18} className="text-accent-blue" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingKalem(kalem);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 hover:bg-dark-card-hover rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={18} className="text-accent-red" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paket Fiyatları */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Paket Fiyatları</h2>
          <p className="text-sm text-dark-text-secondary mb-4">
            Bu fiyatlar yeni oluşturulacak faturalarda kullanılacaktır. Mevcut faturalar etkilenmeyecektir.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Esnek Paket (0-10 Danışan) - ₺</label>
              <input
                type="number"
                step="0.01"
                {...register('paketFiyatlari.esnekPaket', {
                  required: 'Bu alan gereklidir',
                  min: { value: 0, message: 'Fiyat 0\'dan büyük olmalıdır' },
                })}
                className="input"
                placeholder="199"
              />
              {errors.paketFiyatlari?.esnekPaket && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.paketFiyatlari.esnekPaket.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Large Paket (11-20 Danışan) - ₺</label>
              <input
                type="number"
                step="0.01"
                {...register('paketFiyatlari.largePaket', {
                  required: 'Bu alan gereklidir',
                  min: { value: 0, message: 'Fiyat 0\'dan büyük olmalıdır' },
                })}
                className="input"
                placeholder="159"
              />
              {errors.paketFiyatlari?.largePaket && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.paketFiyatlari.largePaket.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">XL Paket (21+ Danışan) - ₺</label>
              <input
                type="number"
                step="0.01"
                {...register('paketFiyatlari.xlPaket', {
                  required: 'Bu alan gereklidir',
                  min: { value: 0, message: 'Fiyat 0\'dan büyük olmalıdır' },
                })}
                className="input"
                placeholder="129"
              />
              {errors.paketFiyatlari?.xlPaket && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.paketFiyatlari.xlPaket.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* KDV Oranı */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">KDV Oranı</h2>
          <p className="text-sm text-dark-text-secondary mb-4">
            Fatura ve ödeme hesaplamalarında kullanılacak KDV oranı.
          </p>
          <div className="max-w-xs">
            <label className="label">KDV Oranı (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('kdvOrani', {
                required: 'Bu alan gereklidir',
                min: { value: 0, message: 'KDV oranı 0\'dan küçük olamaz' },
                max: { value: 100, message: 'KDV oranı 100\'den büyük olamaz' },
              })}
              className="input"
            />
            {errors.kdvOrani && (
              <p className="mt-1 text-sm text-accent-red">
                {errors.kdvOrani.message}
              </p>
            )}
          </div>
        </div>

        {/* Banka Hesap Bilgileri */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Banka Hesap Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <label className="label">IBAN</label>
              <input
                type="text"
                {...register('bankaHesapBilgileri.iban', {
                  required: 'IBAN gereklidir',
                })}
                className="input"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
              {errors.bankaHesapBilgileri?.iban && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.bankaHesapBilgileri.iban.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Alıcı Adı</label>
              <input
                type="text"
                {...register('bankaHesapBilgileri.aliciAdi', {
                  required: 'Alıcı adı gereklidir',
                })}
                className="input"
              />
              {errors.bankaHesapBilgileri?.aliciAdi && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.bankaHesapBilgileri.aliciAdi.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Banka Adı (Opsiyonel)</label>
              <input
                type="text"
                {...register('bankaHesapBilgileri.bankaAdi')}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Sistem Ayarları */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Sistem Ayarları</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('otomatikOdemeHesaplama')}
                className="w-5 h-5 rounded border-dark-card-hover bg-dark-card 
                         text-accent-green focus:ring-accent-green"
              />
              <span>Otomatik Ödeme Hesaplama</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('otomatikPasiflestirme')}
                className="w-5 h-5 rounded border-dark-card-hover bg-dark-card 
                         text-accent-green focus:ring-accent-green"
              />
              <span>Otomatik Pasifleştirme</span>
            </label>

            <div>
              <label className="label">Pasifleştirme Gün Sayısı</label>
              <input
                type="number"
                min="1"
                {...register('pasiflestirmeGunSayisi', {
                  required: 'Bu alan gereklidir',
                  min: { value: 1, message: 'En az 1 gün olmalıdır' },
                })}
                className="input"
              />
              {errors.pasiflestirmeGunSayisi && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.pasiflestirmeGunSayisi.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Deneme Süresi Ayarları */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Deneme Süresi Ayarları</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('otomatikDenemeSuresiAktif')}
                className="w-5 h-5 rounded border-dark-card-hover bg-dark-card 
                         text-accent-green focus:ring-accent-green"
              />
              <span>Otomatik Deneme Süresi Aktif</span>
            </label>
            <p className="text-sm text-dark-text-secondary ml-8">
              Diyetisyen kabul edildiğinde otomatik olarak deneme süresi başlatılır
            </p>

            <div>
              <label className="label">Varsayılan Deneme Süresi (Gün)</label>
              <select
                {...register('varsayilanDenemeSuresiGunSayisi', {
                  required: 'Bu alan gereklidir',
                })}
                className="input"
              >
                <option value={7}>7 Gün (1 Hafta)</option>
                <option value={15}>15 Gün</option>
                <option value={30}>30 Gün</option>
              </select>
              {errors.varsayilanDenemeSuresiGunSayisi && (
                <p className="mt-1 text-sm text-accent-red">
                  {errors.varsayilanDenemeSuresiGunSayisi.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mobil Uygulama Ayarları */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Mobil Uygulama Ayarları</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('mobilUygulamaSyncAktif')}
                className="w-5 h-5 rounded border-dark-card-hover bg-dark-card 
                         text-accent-green focus:ring-accent-green"
              />
              <span>Mobil Uygulama Senkronizasyonu Aktif</span>
            </label>

            <div>
              <label className="label">API Key (Opsiyonel)</label>
              <input
                type="text"
                {...register('mobilUygulamaApiKey')}
                className="input"
                placeholder="Mobil uygulama API anahtarı"
              />
            </div>
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={20} />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </form>

      {/* Gider Kalemi Ekleme/Düzenleme Modal */}
      {showKalemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingKalem ? 'Gider Kalemi Düzenle' : 'Yeni Gider Kalemi Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowKalemModal(false);
                  setEditingKalem(null);
                  setKalemFormData({ ad: '', renk: 'bg-blue-500' });
                }}
                className="text-dark-text-secondary hover:text-dark-text"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kalem Adı *</label>
                <input
                  type="text"
                  value={kalemFormData.ad}
                  onChange={(e) => setKalemFormData({ ...kalemFormData, ad: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                  placeholder="Örn: Kırtasiye"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Renk</label>
                <div className="grid grid-cols-5 gap-2">
                  {renkSecenekleri.map((renk) => (
                    <button
                      key={renk.deger}
                      type="button"
                      onClick={() => setKalemFormData({ ...kalemFormData, renk: renk.deger })}
                      className={`h-10 rounded-lg ${renk.deger} ${
                        kalemFormData.renk === renk.deger ? 'ring-2 ring-white' : ''
                      }`}
                      title={renk.isim}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleKalemEkle}
                  className="flex-1 px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 font-semibold"
                >
                  {editingKalem ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowKalemModal(false);
                    setEditingKalem(null);
                    setKalemFormData({ ad: '', renk: 'bg-blue-500' });
                  }}
                  className="flex-1 px-4 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80"
                >
                  İptal
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingKalem(null);
        }}
        onConfirm={handleKalemSil}
        title="Gider Kalemini Sil"
        message={`"${deletingKalem?.ad}" kalemini silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  );
}
