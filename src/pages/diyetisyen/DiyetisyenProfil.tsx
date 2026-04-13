import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, X, User, Mail, Phone, Calendar, MapPin, Building2, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { diyetisyenService } from '@/services/firebase/firestore';
import { Diyetisyen } from '@/types/diyetisyen';
import { formatDate } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';

export default function DiyetisyenProfil() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [diyetisyen, setDiyetisyen] = useState<Diyetisyen | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    adSoyad: '',
    telefon: '',
    tcKimlikNo: '',
    vergiNumarasi: '',
    vergiDairesi: '',
    adres: '',
    sehir: '',
    postaKodu: '',
  });

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    
    try {
      const diyetisyenData = await diyetisyenService.getByUserId(user.uid);
      
      if (!diyetisyenData) {
        setLoading(false);
        return;
      }

      setDiyetisyen(diyetisyenData);
      setFormData({
        adSoyad: diyetisyenData.adSoyad,
        telefon: diyetisyenData.telefon || '',
        tcKimlikNo: diyetisyenData.tcKimlikNo || '',
        vergiNumarasi: diyetisyenData.vergiNumarasi || '',
        vergiDairesi: diyetisyenData.vergiDairesi || '',
        adres: diyetisyenData.adres || '',
        sehir: diyetisyenData.sehir || '',
        postaKodu: diyetisyenData.postaKodu || '',
      });
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!diyetisyen?.id || !formData.adSoyad.trim()) return;
    
    // TC Kimlik No kontrolü (11 haneli olmalı)
    if (formData.tcKimlikNo && formData.tcKimlikNo.length !== 11) {
      showError('TC Kimlik Numarası 11 haneli olmalıdır');
      return;
    }
    
    // Vergi numarası varsa, vergi dairesi ve adres zorunlu
    if (formData.vergiNumarasi && (!formData.vergiDairesi.trim() || !formData.adres.trim())) {
      showError('Vergi numarası girildiğinde vergi dairesi ve adres bilgileri zorunludur');
      return;
    }
    
    setSaving(true);
    try {
      await diyetisyenService.update(diyetisyen.id, {
        adSoyad: formData.adSoyad.trim(),
        telefon: formData.telefon.trim() || undefined,
        tcKimlikNo: formData.tcKimlikNo.trim() || undefined,
        vergiNumarasi: formData.vergiNumarasi.trim() || undefined,
        vergiDairesi: formData.vergiDairesi.trim() || undefined,
        adres: formData.adres.trim() || undefined,
        sehir: formData.sehir.trim() || undefined,
        postaKodu: formData.postaKodu.trim() || undefined,
        sonGuncelleme: Timestamp.now(),
      });
      
      await loadData();
      setIsEditing(false);
      showSuccess('Profil bilgileri başarıyla güncellendi');
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      showError('Güncelleme sırasında bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (diyetisyen) {
      setFormData({
        adSoyad: diyetisyen.adSoyad,
        telefon: diyetisyen.telefon || '',
        tcKimlikNo: diyetisyen.tcKimlikNo || '',
        vergiNumarasi: diyetisyen.vergiNumarasi || '',
        vergiDairesi: diyetisyen.vergiDairesi || '',
        adres: diyetisyen.adres || '',
        sehir: diyetisyen.sehir || '',
        postaKodu: diyetisyen.postaKodu || '',
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  if (!diyetisyen) {
    return (
      <div className="card text-center py-12">
        <p className="text-dark-text-secondary text-lg">Diyetisyen bilgileri bulunamadı</p>
      </div>
    );
  }

  const kayitYeri = diyetisyen.kayitYeri || (diyetisyen.mobilUygulamadanKayit ? 'mobil' : 'web');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold">Profil Bilgileri</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Edit size={18} />
            Düzenle
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kişisel Bilgiler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User size={24} />
            Kişisel Bilgiler
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Ad Soyad</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.adSoyad}
                  onChange={(e) => setFormData({ ...formData, adSoyad: e.target.value })}
                  className="input"
                  placeholder="Ad Soyad"
                />
              ) : (
                <p className="text-lg font-semibold">{diyetisyen.adSoyad}</p>
              )}
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <Mail size={16} />
                E-posta
              </label>
              <p className="text-lg font-semibold">{diyetisyen.email}</p>
              <p className="text-sm text-dark-text-secondary mt-1">E-posta değiştirilemez</p>
            </div>
            
            <div>
              <label className="label flex items-center gap-2">
                <Phone size={16} />
                Telefon
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  className="input"
                  placeholder="Telefon numarası"
                />
              ) : (
                <p className="text-lg font-semibold">{diyetisyen.telefon || '-'}</p>
              )}
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <FileText size={16} />
                TC Kimlik Numarası
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.tcKimlikNo}
                  onChange={(e) => setFormData({ ...formData, tcKimlikNo: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="input"
                  placeholder="11 haneli TC Kimlik Numarası"
                  maxLength={11}
                />
              ) : (
                <p className="text-lg font-semibold">{diyetisyen.tcKimlikNo || '-'}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.adSoyad.trim()}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Save size={18} />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X size={18} />
                  İptal
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Vergi ve Adres Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Building2 size={24} />
            Vergi ve Adres Bilgileri
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label flex items-center gap-2">
                <FileText size={16} />
                Vergi Numarası (Opsiyonel)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.vergiNumarasi}
                  onChange={(e) => setFormData({ ...formData, vergiNumarasi: e.target.value.replace(/\D/g, '') })}
                  className="input"
                  placeholder="Vergi Numarası"
                />
              ) : (
                <p className="text-lg font-semibold">{diyetisyen.vergiNumarasi || '-'}</p>
              )}
            </div>

            {formData.vergiNumarasi && (
              <>
                <div>
                  <label className="label flex items-center gap-2">
                    <Building2 size={16} />
                    Vergi Dairesi
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.vergiDairesi}
                      onChange={(e) => setFormData({ ...formData, vergiDairesi: e.target.value })}
                      className="input"
                      placeholder="Vergi Dairesi"
                    />
                  ) : (
                    <p className="text-lg font-semibold">{diyetisyen.vergiDairesi || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="label flex items-center gap-2">
                    <MapPin size={16} />
                    Adres
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.adres}
                      onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                      className="input"
                      placeholder="Adres"
                      rows={3}
                    />
                  ) : (
                    <p className="text-lg font-semibold">{diyetisyen.adres || '-'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Şehir</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.sehir}
                        onChange={(e) => setFormData({ ...formData, sehir: e.target.value })}
                        className="input"
                        placeholder="Şehir"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{diyetisyen.sehir || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Posta Kodu</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.postaKodu}
                        onChange={(e) => setFormData({ ...formData, postaKodu: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                        className="input"
                        placeholder="Posta Kodu"
                        maxLength={5}
                      />
                    ) : (
                      <p className="text-lg font-semibold">{diyetisyen.postaKodu || '-'}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {!formData.vergiNumarasi && !isEditing && (
              <p className="text-sm text-dark-text-secondary">
                Vergi numarası girildiğinde adres bilgileri de girilmelidir.
              </p>
            )}
          </div>
        </motion.div>

        {/* Hesap Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={24} />
            Hesap Bilgileri
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Üye Numarası</label>
              <p className="text-lg font-semibold">{diyetisyen.uyeNumarasi}</p>
            </div>
            
            <div>
              <label className="label">Üyelik Tarihi</label>
              <p className="text-lg font-semibold">{formatDate(diyetisyen.olusturmaTarihi)}</p>
            </div>
            
            <div>
              <label className="label">Kayıt Yeri</label>
              <p className="text-lg font-semibold">
                {kayitYeri === 'mobil' ? 'Mobil Uygulama' : 'Web Panel'}
              </p>
            </div>
            
            <div>
              <label className="label">Aktiflik Durumu</label>
              <span className={`badge ${
                diyetisyen.aktiflikDurumu === 'aktif' ? 'badge-success' :
                diyetisyen.aktiflikDurumu === 'pasif' ? 'badge-danger' :
                'badge-warning'
              }`}>
                {diyetisyen.aktiflikDurumu === 'aktif' ? 'Aktif' :
                 diyetisyen.aktiflikDurumu === 'pasif' ? 'Pasif' :
                 'Askıya Alındı'}
              </span>
            </div>
            
            <div>
              <label className="label">Ödeme Durumu</label>
              <span className={`badge ${
                diyetisyen.odemeDurumu === 'aktif' ? 'badge-success' :
                diyetisyen.odemeDurumu === 'deneme' ? 'badge-info' :
                diyetisyen.odemeDurumu === 'beklemede' ? 'badge-warning' :
                'badge-danger'
              }`}>
                {diyetisyen.odemeDurumu === 'aktif' ? 'Aktif' :
                 diyetisyen.odemeDurumu === 'deneme' ? 'Deneme Süresi' :
                 diyetisyen.odemeDurumu === 'beklemede' ? 'Beklemede' :
                 'Süresi Dolmuş'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

