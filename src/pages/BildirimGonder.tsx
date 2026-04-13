import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { bildirimService } from '@/services/firebase/bildirimService';
import { diyetisyenService } from '@/services/firebase/firestore';
import { aktiviteLogService } from '@/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export default function BildirimGonder() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [gonderimTipi, setGonderimTipi] = useState<'genel' | 'ozel'>('genel');
  const [selectedDiyetisyenId, setSelectedDiyetisyenId] = useState<string>('');
  const [baslik, setBaslik] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [diyetisyenler, setDiyetisyenler] = useState<Array<{ id: string; adSoyad: string; email: string }>>([]);
  const [loadingDiyetisyenler, setLoadingDiyetisyenler] = useState(false);

  useEffect(() => {
    if (gonderimTipi === 'ozel') {
      loadDiyetisyenler();
    }
  }, [gonderimTipi]);

  const loadDiyetisyenler = async () => {
    setLoadingDiyetisyenler(true);
    try {
      const data = await diyetisyenService.getAll();
      setDiyetisyenler(
        data
          .filter((d) => d.id)
          .map((d) => ({
            id: d.id!,
            adSoyad: d.adSoyad,
            email: d.email,
          }))
      );
    } catch (error) {
      console.error('Diyetisyenler yüklenirken hata:', error);
      showError('Diyetisyenler yüklenirken bir hata oluştu');
    } finally {
      setLoadingDiyetisyenler(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!baslik.trim() || !mesaj.trim()) {
      showError('Başlık ve mesaj alanları zorunludur');
      return;
    }

    if (gonderimTipi === 'ozel' && !selectedDiyetisyenId) {
      showError('Lütfen bir diyetisyen seçin');
      return;
    }

    setSending(true);

    try {
      if (gonderimTipi === 'genel') {
        // Genel bildirim gönder
        await bildirimService.createGenel(
          baslik.trim(),
          mesaj.trim(),
          'genel',
          link.trim() || undefined,
          user?.uid,
          user?.adSoyad || user?.email || 'Admin'
        );

        await aktiviteLogService.log(
          user!.uid,
          'Genel Bildirim Gönderildi',
          `Tüm diyetisyenlere bildirim gönderildi: ${baslik}`,
          undefined
        );

        showSuccess('Genel bildirim başarıyla gönderildi');
      } else {
        // Özel bildirim gönder
        const selectedDiyetisyen = diyetisyenler.find((d) => d.id === selectedDiyetisyenId);
        if (!selectedDiyetisyen) {
          showError('Seçilen diyetisyen bulunamadı');
          return;
        }

        await bildirimService.create({
          diyetisyenId: selectedDiyetisyenId,
          diyetisyenEmail: selectedDiyetisyen.email,
          diyetisyenAdSoyad: selectedDiyetisyen.adSoyad,
          tip: 'ozel',
          baslik: baslik.trim(),
          mesaj: mesaj.trim(),
          link: link.trim() || undefined,
          durum: 'aktif',
          goruldu: false,
          olusturmaTarihi: Timestamp.now(),
          olusturanAdminId: user?.uid,
          olusturanAdminAd: user?.adSoyad || user?.email || 'Admin',
        });

        await aktiviteLogService.log(
          user!.uid,
          'Özel Bildirim Gönderildi',
          `${selectedDiyetisyen.adSoyad} için bildirim gönderildi: ${baslik}`,
          selectedDiyetisyenId
        );

        showSuccess(`${selectedDiyetisyen.adSoyad} için bildirim başarıyla gönderildi`);
      }

      // Formu temizle
      setBaslik('');
      setMesaj('');
      setLink('');
      setSelectedDiyetisyenId('');
    } catch (error: any) {
      console.error('Bildirim gönderme hatası:', error);
      showError(error.message || 'Bildirim gönderilirken bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Bildirim Gönder</h1>
        <p className="text-dark-text-secondary mt-2">
          Tüm diyetisyenlere genel bildirim veya belirli bir diyetisyene özel bildirim gönderebilirsiniz.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gönderim Tipi */}
          <div>
            <label className="label">Gönderim Tipi</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gonderimTipi"
                  value="genel"
                  checked={gonderimTipi === 'genel'}
                  onChange={(e) => {
                    setGonderimTipi(e.target.value as 'genel' | 'ozel');
                    if (e.target.value === 'ozel') {
                      loadDiyetisyenler();
                    }
                  }}
                  className="w-4 h-4"
                />
                <Users size={20} />
                <span>Genel Bildirim (Tüm Diyetisyenler)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gonderimTipi"
                  value="ozel"
                  checked={gonderimTipi === 'ozel'}
                  onChange={(e) => {
                    setGonderimTipi(e.target.value as 'genel' | 'ozel');
                    if (e.target.value === 'ozel') {
                      loadDiyetisyenler();
                    }
                  }}
                  className="w-4 h-4"
                />
                <User size={20} />
                <span>Özel Bildirim</span>
              </label>
            </div>
          </div>

          {/* Diyetisyen Seçimi (Özel bildirim için) */}
          {gonderimTipi === 'ozel' && (
            <div>
              <label className="label">Diyetisyen Seçin</label>
              {loadingDiyetisyenler ? (
                <div className="text-dark-text-secondary">Yükleniyor...</div>
              ) : (
                <select
                  value={selectedDiyetisyenId}
                  onChange={(e) => setSelectedDiyetisyenId(e.target.value)}
                  className="input"
                  required={gonderimTipi === 'ozel'}
                >
                  <option value="">Diyetisyen seçin...</option>
                  {diyetisyenler.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.adSoyad} ({d.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Başlık */}
          <div>
            <label className="label">Başlık *</label>
            <input
              type="text"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className="input"
              placeholder="Bildirim başlığı"
              required
              maxLength={100}
            />
          </div>

          {/* Mesaj */}
          <div>
            <label className="label">Mesaj *</label>
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              className="input"
              placeholder="Bildirim mesajı"
              rows={5}
              required
              maxLength={500}
            />
            <p className="text-xs text-dark-text-secondary mt-1">
              {mesaj.length}/500 karakter
            </p>
          </div>

          {/* Link (Opsiyonel) */}
          <div>
            <label className="label">Yönlendirme Linki (Opsiyonel)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="input"
              placeholder="/diyetisyen/faturalar"
            />
            <p className="text-xs text-dark-text-secondary mt-1">
              Bildirime tıklandığında yönlendirilecek sayfa (örn: /diyetisyen/faturalar)
            </p>
          </div>

          {/* Uyarı */}
          {gonderimTipi === 'genel' && (
            <div className="p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-500 mb-1">Genel Bildirim Uyarısı</p>
                <p className="text-sm text-dark-text-secondary">
                  Bu bildirim tüm diyetisyenlere gönderilecektir. Lütfen mesajınızı dikkatli yazın.
                </p>
              </div>
            </div>
          )}

          {/* Gönder Butonu */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !baslik.trim() || !mesaj.trim()}
              className="btn-primary flex items-center gap-2"
            >
              <Send size={18} />
              {sending ? 'Gönderiliyor...' : 'Bildirim Gönder'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
