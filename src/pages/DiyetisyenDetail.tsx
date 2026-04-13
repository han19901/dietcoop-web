import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Ban, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Upload,
  Send,
  AlertCircle,
  Save,
  X,
  Paperclip,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { diyetisyenService, faturaService, aktiviteLogService, ayarlarService, eslesmeService } from '@/services/firebase/firestore';
import { mesajService, Mesaj } from '@/services/firebase/mesajService';
import { mobileAppService } from '@/services/firebase/mobileAppService';
import { Diyetisyen } from '@/types/diyetisyen';
import { Fatura } from '@/types/fatura';
import { Eslesme } from '@/types/eslesme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/services/utils/dateUtils';
import TrialPeriodModal from '@/components/diyetisyen/TrialPeriodModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { getPaketBilgisiByDanisanSayisi, getPaketBilgisi } from '@/services/utils/paketUtils';
import { createFaturaForDiyetisyenOncekiAy } from '@/services/fatura/faturaOlusturmaService';
import { Timestamp } from 'firebase/firestore';
import { addDays } from 'date-fns';

export default function DiyetisyenDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [diyetisyen, setDiyetisyen] = useState<Diyetisyen | null>(null);
  const [faturalar, setFaturalar] = useState<Fatura[]>([]);
  const [bekleyenEslesmeler, setBekleyenEslesmeler] = useState<Eslesme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showEndTrialModal, setShowEndTrialModal] = useState(false);
  const [creatingFatura, setCreatingFatura] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Mesaj[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isEditingIskonto, setIsEditingIskonto] = useState(false);
  const [iskontoOrani, setIskontoOrani] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      // Önce ID ile dene
      let diyetisyenData = await diyetisyenService.getById(id);
      
      // Eğer bulunamazsa, tüm diyetisyenlerden ara
      if (!diyetisyenData) {
        const allDiyetisyenler = await diyetisyenService.getAll();
        // ID, üye numarası veya email ile eşleşen diyetisyeni bul
        diyetisyenData = allDiyetisyenler.find(
          d => d.id === id || d.uyeNumarasi === id || d.email === id
        ) || null;
      }
      
      if (!diyetisyenData) {
        setLoading(false);
        return;
      }
      
      // Diyetisyen ID'sini garantile
      if (!diyetisyenData.id) {
        const allDiyetisyenler = await diyetisyenService.getAll();
        const found = allDiyetisyenler.find(
          d => d.uyeNumarasi === diyetisyenData?.uyeNumarasi || d.email === diyetisyenData?.email
        );
        if (found && found.id) {
          diyetisyenData = found;
        }
      }
      
      const diyetisyenId = diyetisyenData.id || id;
      
      // Mobil uygulamadan gelen diyetisyenler için eksik bilgileri tamamla
      if (diyetisyenData.mobilUygulamadanKayit || diyetisyenData.kayitYeri === 'mobil') {
        const updateNeeded: any = {};
        let needsUpdate = false;
        
        // Üye numarası yoksa veya boşsa kesinlikle oluştur
        if (!diyetisyenData.uyeNumarasi || 
            diyetisyenData.uyeNumarasi.trim() === '' || 
            diyetisyenData.uyeNumarasi === null || 
            diyetisyenData.uyeNumarasi === undefined) {
          const generateId = `generateUyeNumarasi_${Date.now()}`;
          
          try {
            // Cloud Function'dan üye numarası oluştur
            const CLOUD_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || 
              'https://us-central1-webdietcoop.cloudfunctions.net';
            
            const url = `${CLOUD_FUNCTIONS_URL}/generateUyeNumarasi`;
            
            const requestBody = JSON.stringify({ diyetisyenId });
            
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: requestBody,
            });
            
            if (response.ok) {
              const data = await response.json();
              updateNeeded.uyeNumarasi = data.uyeNumarasi;
              diyetisyenData.uyeNumarasi = data.uyeNumarasi;
              needsUpdate = true;
            } else {
              const errorText = await response.text();
              console.error(`[${generateId}] ❌ Üye numarası oluşturma hatası:`, {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText,
                timestamp: new Date().toISOString()
              });
            }
          } catch (error: any) {
            console.error(`[${generateId}] ❌ Üye numarası oluşturma exception:`, {
              error: error.message,
              errorName: error.name,
              stack: error.stack,
              diyetisyenId: diyetisyenId,
              timestamp: new Date().toISOString(),
              isCorsError: error.message?.includes('CORS') || error.message?.includes('fetch') || error.name === 'TypeError',
            });
            
            // CORS hatası özel mesajı
            if (error.message?.includes('CORS') || error.message?.includes('fetch') || error.name === 'TypeError') {
              console.error(`[${generateId}] ⚠️ CORS hatası tespit edildi!`, {
                message: 'CORS policy hatası - Cloud Function CORS header\'ları göndermiyor olabilir',
                suggestion: 'Firebase Console\'dan Cloud Functions loglarını kontrol edin',
                timestamp: new Date().toISOString()
              });
            }
            // Hata olsa bile devam et
          }
        }
        
        // Ayarları oku
        const ayarlar = await ayarlarService.get();
        // Paket fiyatlarından Esnek Paket fiyatını varsayılan olarak kullan
        const varsayilanDanisanBasiUcret = ayarlar?.paketFiyatlari?.esnekPaket || 199;
        
        // Danışan başı ücret yoksa ata
        if (!diyetisyenData.danisanBasiUcret || diyetisyenData.danisanBasiUcret === 0) {
          updateNeeded.danisanBasiUcret = varsayilanDanisanBasiUcret;
          diyetisyenData.danisanBasiUcret = varsayilanDanisanBasiUcret;
          needsUpdate = true;
        }
        
        // İskonto oranı yoksa ata (varsayılan: 0)
        if (diyetisyenData.iskontoOrani === undefined || diyetisyenData.iskontoOrani === null) {
          updateNeeded.iskontoOrani = 0;
          diyetisyenData.iskontoOrani = 0;
          needsUpdate = true;
        }
        
        // Paket hakkı yoksa ata
        if (!diyetisyenData.paketHakki && diyetisyenData.paketHakki !== 0) {
          updateNeeded.paketHakki = 0;
          diyetisyenData.paketHakki = 0;
          needsUpdate = true;
        }
        
        // Aktif danışan sayısı yoksa ata
        if (diyetisyenData.aktifDanisanSayisi === undefined || diyetisyenData.aktifDanisanSayisi === null) {
          updateNeeded.aktifDanisanSayisi = 0;
          diyetisyenData.aktifDanisanSayisi = 0;
          needsUpdate = true;
        }
        
        // Güncelleme varsa yap
        if (needsUpdate && Object.keys(updateNeeded).length > 0) {
          try {
            await diyetisyenService.update(diyetisyenId, updateNeeded);
            // Güncelleme sonrası veriyi yeniden yükle
            await loadData();
            return; // loadData içinde tekrar çağrılmasın diye
          } catch (error) {
            console.error('❌ Diyetisyen güncelleme hatası:', error);
          }
        }
      } else {
        // Eğer danisanBasiUcret yoksa, paket fiyatlarından Esnek Paket fiyatını al (sadece görüntüleme için)
        if (!diyetisyenData.danisanBasiUcret || diyetisyenData.danisanBasiUcret === 0) {
          const ayarlar = await ayarlarService.get();
          diyetisyenData.danisanBasiUcret = ayarlar?.paketFiyatlari?.esnekPaket || 199;
        }
      }
      
      // Faturaları yükle - hata olursa boş array döndür
      let faturalarData: Fatura[] = [];
      try {
        faturalarData = await faturaService.getByDiyetisyenId(diyetisyenId);
      } catch (error) {
        console.warn('Faturalar yüklenirken hata:', error);
        // Hata durumunda boş array kullan
      }
      
      // Mobil uygulamadan diyet planlarını çekerek benzersiz danışan sayısını hesapla
      if (diyetisyenData.mobilUygulamadanKayit || diyetisyenData.kayitYeri === 'mobil') {
        try {
          const mobileUserId = diyetisyenData.mobilUygulamaId || diyetisyenData.id || id;
          // Son 12 ay için tüm diyet planlarını çek ve benzersiz danışan sayısını hesapla
          const now = new Date();
          const baslangicTarihi = new Date(now.getFullYear(), now.getMonth() - 11, 1); // Son 12 ay
          const bitisTarihi = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // Bu ayın sonu
          
          const planlar = await mobileAppService.getDiyetPlanlariByAy(
            mobileUserId,
            baslangicTarihi,
            bitisTarihi
          );
          
          // Deneme süresi kontrolü
          let filtreliPlanlar = planlar;
          if (diyetisyenData.denemeSuresi?.aktif && diyetisyenData.denemeSuresi.bitisTarihi) {
            const denemeBitis = diyetisyenData.denemeSuresi.bitisTarihi.toDate();
            const denemeSuresiBitti = denemeBitis < now;
            
            // Sadece deneme süresi henüz bitmemişse filtre uygula
            if (!denemeSuresiBitti) {
              filtreliPlanlar = planlar.filter(p => p.olusturmaTarihi > denemeBitis);
            }
          }
          
          // Benzersiz danışan sayısı (her danışan için 1 kez)
          const benzersizDanisanlar = new Set(filtreliPlanlar.map(p => p.danisanId));
          const danisanSayisi = benzersizDanisanlar.size;
          
          diyetisyenData.aktifDanisanSayisi = danisanSayisi;
        } catch (error) {
          console.warn('[DiyetisyenDetail] Mobil uygulamadan diyet planları alınamadı:', error);
          // Hata durumunda web panel değerini kullan
        }
      }
      
      setDiyetisyen(diyetisyenData);
      setFaturalar(faturalarData);
      setIskontoOrani(diyetisyenData.iskontoOrani || 0);
      
      // Bekleyen eşleşmeleri yükle - hata olursa boş array döndür
      try {
        const bekleyenData = await eslesmeService.getBekleyen(diyetisyenId);
        setBekleyenEslesmeler(bekleyenData);
      } catch (error: any) {
        console.warn('Bekleyen eşleşmeler yüklenirken hata:', error);
        // Index hatası veya permissions hatası durumunda boş array kullan
        setBekleyenEslesmeler([]);
      }
      
      // Mesajları yükle
      try {
        const mesajlarData = await mesajService.getByDiyetisyenId(diyetisyenId);
        setMessages(mesajlarData);
      } catch (error) {
        console.warn('Mesajlar yüklenirken hata:', error);
        setMessages([]);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'aktif' | 'pasif' | 'askiyaAlindi') => {
    if (!diyetisyen || !user) return;
    
    try {
      await diyetisyenService.update(diyetisyen.id!, {
        aktiflikDurumu: newStatus,
        apiErisimDurumu: newStatus === 'aktif' ? 'aktif' : 'kapali',
      });
      
      await aktiviteLogService.log(
        user.uid,
        'Diyetisyen Durum Değişikliği',
        `${diyetisyen.adSoyad} için durum ${newStatus} olarak değiştirildi`,
        diyetisyen.id
      );
      
      await loadData();
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
    }
  };

  const handleEndTrial = async () => {
    if (!diyetisyen || !user) return;
    
    try {
      const now = new Date();
      
      // Deneme süresini sonlandır
      await diyetisyenService.update(diyetisyen.id!, {
        denemeSuresi: {
          aktif: false,
          baslangicTarihi: diyetisyen.denemeSuresi?.baslangicTarihi,
          bitisTarihi: Timestamp.fromDate(now), // Bitiş tarihini şu anki zamana ayarla
          gunSayisi: diyetisyen.denemeSuresi?.gunSayisi || 15, // Mevcut gün sayısını koru veya varsayılan değer kullan
        },
      });
      
      await aktiviteLogService.log(
        user.uid,
        'Deneme Süresi Sonlandırıldı',
        `${diyetisyen.adSoyad} için deneme süresi sonlandırıldı`,
        diyetisyen.id
      );
      
      showSuccess('Deneme süresi başarıyla sonlandırıldı');
      setShowEndTrialModal(false);
      await loadData();
    } catch (error) {
      console.error('Deneme süresi sonlandırma hatası:', error);
      showError('Deneme süresi sonlandırılırken bir hata oluştu');
    }
  };

  const handleApprove = async () => {
    if (!diyetisyen || !user) return;
    
    try {
      // Sistem ayarlarını yükle
      const ayarlar = await ayarlarService.get();
      const varsayilanDenemeSuresi = ayarlar?.varsayilanDenemeSuresiGunSayisi || 15;
      const otomatikDenemeSuresiAktif = ayarlar?.otomatikDenemeSuresiAktif !== false; // Varsayılan true
      
      const now = new Date();
      const bitisTarihi = addDays(now, varsayilanDenemeSuresi);
      
      // Diyetisyeni onayla ve otomatik deneme süresi başlat
      const updateData: any = {
        onayDurumu: 'onaylandi',
        onayTarihi: Timestamp.now(),
        onaylayanAdmin: user.uid,
        aktiflikDurumu: 'aktif',
        apiErisimDurumu: 'aktif',
      };
      
      // Eğer otomatik deneme süresi aktifse ve diyetisyenin daha önce deneme süresi yoksa
      if (otomatikDenemeSuresiAktif && !diyetisyen.denemeSuresi?.aktif) {
        updateData.denemeSuresi = {
          aktif: true,
          baslangicTarihi: Timestamp.fromDate(now),
          bitisTarihi: Timestamp.fromDate(bitisTarihi),
          gunSayisi: varsayilanDenemeSuresi,
        };
        updateData.odemeDurumu = 'deneme';
      } else {
        updateData.odemeDurumu = 'aktif';
      }
      
      await diyetisyenService.update(diyetisyen.id!, updateData);
      
      await aktiviteLogService.log(
        user.uid,
        'Diyetisyen Onaylandı',
        otomatikDenemeSuresiAktif && !diyetisyen.denemeSuresi?.aktif
          ? `${diyetisyen.adSoyad} onaylandı ve ${varsayilanDenemeSuresi} günlük deneme süresi başlatıldı`
          : `${diyetisyen.adSoyad} onaylandı`,
        diyetisyen.id
      );
      
      await loadData();
    } catch (error) {
      console.error('Onay hatası:', error);
    }
  };

  const handleReject = async () => {
    if (!diyetisyen || !user) return;
    
    try {
      await diyetisyenService.update(diyetisyen.id!, {
        onayDurumu: 'reddedildi',
        aktiflikDurumu: 'pasif',
        apiErisimDurumu: 'kapali',
      });
      
      await aktiviteLogService.log(
        user.uid,
        'Diyetisyen Reddedildi',
        `${diyetisyen.adSoyad} reddedildi`,
        diyetisyen.id
      );
      
      await loadData();
    } catch (error) {
      console.error('Red hatası:', error);
    }
  };

  const handleRequestDocuments = async () => {
    if (!diyetisyen || !user) return;
    
    try {
      await diyetisyenService.update(diyetisyen.id!, {
        evrakDurumu: 'beklemede',
        evrakIstemeTarihi: Timestamp.now(),
      });
      
      await aktiviteLogService.log(
        user.uid,
        'Evrak İstendi',
        `${diyetisyen.adSoyad} için evrak yüklemesi istendi`,
        diyetisyen.id
      );
      
      await loadData();
    } catch (error) {
      console.error('Evrak isteme hatası:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const validFiles = files.filter(file => 
      allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')
    );
    const newFiles = [...selectedFiles, ...validFiles].slice(0, 5);
    setSelectedFiles(newFiles);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && selectedFiles.length === 0) || !diyetisyen || !user) return;
    
    try {
      await mesajService.sendMessage(
        diyetisyen.id!,
        user.uid,
        'admin',
        user.adSoyad || 'Admin',
        messageText || '(Dosya eklendi)',
        user.uid,
        selectedFiles.length > 0 ? selectedFiles : undefined
      );
      
      setMessageText('');
      setSelectedFiles([]);
      
      // Mesajları yeniden yükle
      const mesajlarData = await mesajService.getByDiyetisyenId(diyetisyen.id!);
      setMessages(mesajlarData);
      
      await aktiviteLogService.log(
        user.uid,
        'Mesaj Gönderildi',
        `${diyetisyen.adSoyad} için mesaj gönderildi: ${messageText.substring(0, 50)}...`,
        diyetisyen.id
      );
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      showError('Mesaj gönderilirken bir hata oluştu');
    }
  };

  const handleSaveIskonto = async () => {
    if (!diyetisyen || !user) return;
    
    try {
      await diyetisyenService.update(diyetisyen.id!, {
        iskontoOrani: iskontoOrani,
      });
      
      await aktiviteLogService.log(
        user.uid,
        'İskonto Oranı Güncellendi',
        `${diyetisyen.adSoyad} için iskonto oranı %${iskontoOrani} olarak güncellendi`,
        diyetisyen.id
      );
      
      setIsEditingIskonto(false);
      await loadData();
    } catch (error) {
      console.error('İskonto güncelleme hatası:', error);
    }
  };

  const handleCancelIskonto = () => {
    if (diyetisyen) {
      setIskontoOrani(diyetisyen.iskontoOrani || 0);
    }
    setIsEditingIskonto(false);
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
        <p className="text-dark-text-secondary text-lg mb-4">Diyetisyen bulunamadı</p>
        <button onClick={() => navigate('/admin/diyetisyenler')} className="btn-secondary">
          Geri Dön
        </button>
      </div>
    );
  }

  const needsApproval = diyetisyen.onayDurumu === 'beklemede' || !diyetisyen.onayDurumu;

  const handleCreateFatura = async () => {
    if (!diyetisyen || !user) return;

    try {
      setCreatingFatura(true);
      await createFaturaForDiyetisyenOncekiAy(diyetisyen.id!);
      await aktiviteLogService.log(
        user.uid,
        'Fatura Oluşturuldu',
        `${diyetisyen.adSoyad} için önceki ayın faturası oluşturuldu`,
        diyetisyen.id
      );
      await loadData();
    } catch (error: any) {
      console.error('Fatura oluşturma hatası:', error);
      showError(error.message || 'Fatura oluşturulurken bir hata oluştu');
    } finally {
      setCreatingFatura(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/diyetisyenler')} className="btn-secondary">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold">{diyetisyen.adSoyad}</h1>
      </div>

      {/* Onay Durumu Banner */}
      {needsApproval && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-yellow-500/10 border-yellow-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-500" size={24} />
              <div>
                <h3 className="font-bold text-yellow-500">Onay Bekliyor</h3>
                <p className="text-sm text-dark-text-secondary">
                  Bu diyetisyen henüz onaylanmadı. Kabul veya red edebilirsiniz.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Kabul Et
              </button>
              <button
                onClick={handleReject}
                className="btn-danger flex items-center gap-2"
              >
                <XCircle size={18} />
                Reddet
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          {/* Genel Bilgiler */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Genel Bilgiler</h2>
              <button className="btn-secondary">
                <Edit size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">E-posta:</span>
                <span className="font-semibold">{diyetisyen.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Telefon:</span>
                <span className="font-semibold">{diyetisyen.telefon || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Üye Numarası:</span>
                <span className="font-semibold">{diyetisyen.uyeNumarasi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Kayıt Tarihi:</span>
                <span className="font-semibold">{formatDate(diyetisyen.olusturmaTarihi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Mobil Uygulamadan Kayıt:</span>
                <span className="font-semibold">
                  {diyetisyen.mobilUygulamadanKayit ? 'Evet' : 'Hayır'}
                </span>
              </div>
            </div>
          </div>

          {/* Fatura Bilgileri */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Fatura Bilgileri</h2>
              <button 
                onClick={handleCreateFatura}
                disabled={creatingFatura}
                className="btn-primary"
              >
                <FileText size={18} />
                {creatingFatura ? 'Oluşturuluyor...' : 'Fatura Oluştur'}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Ödeme Durumu:</span>
                <span className={`badge ${
                  diyetisyen.odemeDurumu === 'aktif' ? 'badge-success' :
                  diyetisyen.odemeDurumu === 'beklemede' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {diyetisyen.odemeDurumu === 'aktif' ? 'Aktif' :
                   diyetisyen.odemeDurumu === 'beklemede' ? 'Beklemede' :
                   'Süresi Dolmuş'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Aktiflik Durumu:</span>
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
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">API Erişim Durumu:</span>
                <span className={`badge ${
                  diyetisyen.apiErisimDurumu === 'aktif' ? 'badge-success' :
                  diyetisyen.apiErisimDurumu === 'kisitli' ? 'badge-warning' :
                  'badge-danger'
                }`}>
                  {diyetisyen.apiErisimDurumu === 'aktif' ? 'Aktif' :
                   diyetisyen.apiErisimDurumu === 'kisitli' ? 'Kısıtlı' :
                   'Kapalı'}
                </span>
              </div>
              {(() => {
                const sonFatura = faturalar
                  .filter(f => f.faturaDurumu === 'odendi')
                  .sort((a, b) => b.olusturmaTarihi.toMillis() - a.olusturmaTarihi.toMillis())[0];
                return sonFatura && (
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">Son Ödenen Fatura:</span>
                    <span className="font-semibold">
                      {sonFatura.faturaDonemi.ay}/{sonFatura.faturaDonemi.yil}
                    </span>
                  </div>
                );
              })()}
              {(() => {
                const beklemedeFatura = faturalar.find(f => f.faturaDurumu === 'beklemede' || f.faturaDurumu === 'gecikmis');
                return beklemedeFatura && (
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">Bekleyen Fatura:</span>
                    <span className={`font-semibold ${beklemedeFatura.faturaDurumu === 'gecikmis' ? 'text-accent-red' : 'text-yellow-500'}`}>
                      {beklemedeFatura.faturaDonemi.ay}/{beklemedeFatura.faturaDonemi.yil} - {beklemedeFatura.toplamTutar.toFixed(2)} ₺
                      {beklemedeFatura.faturaDurumu === 'gecikmis' && ' (Gecikmiş)'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Fiyatlandırma */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Fiyatlandırma</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Aktif Danışan Sayısı:</span>
                <span className="font-semibold">{diyetisyen.aktifDanisanSayisi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Mevcut Paket:</span>
                <span className="font-semibold">
                  {(() => {
                    const paketBilgisi = getPaketBilgisiByDanisanSayisi(diyetisyen.aktifDanisanSayisi);
                    return paketBilgisi.ad;
                  })()}
                </span>
              </div>
              {bekleyenEslesmeler.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Bekleyen Eşleşme:</span>
                  <span className="font-semibold text-yellow-500">{bekleyenEslesmeler.length}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Danışan Başı Ücret:</span>
                <span className="font-semibold">{diyetisyen.danisanBasiUcret} ₺</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary">İskonto Oranı:</span>
                {isEditingIskonto ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={iskontoOrani}
                      onChange={(e) => setIskontoOrani(Number(e.target.value))}
                      className="input w-24 text-right"
                    />
                    <span className="font-semibold">%</span>
                    <button
                      onClick={handleSaveIskonto}
                      className="btn-primary p-2"
                      title="Kaydet"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleCancelIskonto}
                      className="btn-secondary p-2"
                      title="İptal"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">%{diyetisyen.iskontoOrani}</span>
                    <button
                      onClick={() => setIsEditingIskonto(true)}
                      className="btn-secondary p-2"
                      title="Düzenle"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bekleyen Eşleşmeler */}
          {bekleyenEslesmeler.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Bekleyen Eşleşmeler</h2>
                <span className="badge badge-warning">{bekleyenEslesmeler.length} Bekliyor</span>
              </div>
              <div className="space-y-2">
                {bekleyenEslesmeler.map((eslesme) => (
                  <div
                    key={eslesme.id}
                    className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{eslesme.danisanAdi || eslesme.danisanEmail}</p>
                      <p className="text-sm text-dark-text-secondary">
                        {eslesme.danisanEmail}
                      </p>
                      <p className="text-xs text-dark-text-secondary mt-1">
                        Talep Tarihi: {formatDate(eslesme.olusturmaTarihi)}
                      </p>
                    </div>
                    <span className="badge badge-warning">Beklemede</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-500">
                  <AlertCircle size={16} className="inline mr-2" />
                  Bu eşleşmeler paket hakkınızı aştığı için beklemede. Ödeme yaparak aktif hale getirebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {/* Evrak Durumu */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Evrak Durumu</h2>
              <button
                onClick={handleRequestDocuments}
                className="btn-secondary flex items-center gap-2"
              >
                <Upload size={18} />
                Evrak İste
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-text-secondary">Durum:</span>
                <span className={`badge ${
                  diyetisyen.evrakDurumu === 'onaylandi' ? 'badge-success' :
                  diyetisyen.evrakDurumu === 'yuklendi' ? 'badge-info' :
                  diyetisyen.evrakDurumu === 'reddedildi' ? 'badge-danger' :
                  'badge-warning'
                }`}>
                  {diyetisyen.evrakDurumu === 'onaylandi' ? 'Onaylandı' :
                   diyetisyen.evrakDurumu === 'yuklendi' ? 'Yüklendi' :
                   diyetisyen.evrakDurumu === 'reddedildi' ? 'Reddedildi' :
                   'Beklemede'}
                </span>
              </div>
              {diyetisyen.evrakIstemeTarihi && (
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">İsteme Tarihi:</span>
                  <span className="font-semibold">{formatDate(diyetisyen.evrakIstemeTarihi)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mesajlaşma */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare size={24} />
              Mesajlaşma
            </h2>
            <div className="space-y-4">
              {/* Mesaj Listesi */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-dark-text-secondary text-center py-8">
                    Henüz mesaj yok
                  </p>
                ) : (
                  messages.map((message) => {
                    const isAdmin = message.senderRol === 'admin';
                    return (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          isAdmin
                            ? 'bg-accent-green bg-opacity-20 ml-auto'
                            : 'bg-dark-card-hover'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1">{message.senderName}</p>
                        <p className="text-sm">{message.text}</p>
                        
                        {/* Dosyalar */}
                        {message.dosyalar && message.dosyalar.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.dosyalar.map((dosya, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-dark-card rounded text-sm">
                                {dosya.dosyaTipi === 'image' ? (
                                  <ImageIcon size={16} className="text-accent-green" />
                                ) : (
                                  <FileText size={16} className="text-accent-blue" />
                                )}
                                <a
                                  href={dosya.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent-green hover:underline flex-1"
                                >
                                  {dosya.dosyaAdi}
                                </a>
                                {dosya.dosyaTipi === 'image' && (
                                  <img
                                    src={dosya.url}
                                    alt={dosya.dosyaAdi}
                                    className="max-w-[150px] max-h-[150px] rounded cursor-pointer"
                                    onClick={() => window.open(dosya.url, '_blank')}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs text-dark-text-secondary mt-1">
                          {formatDate(message.olusturmaTarihi)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Seçili Dosyalar */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-dark-card-hover px-2 py-1 rounded text-xs"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon size={14} className="text-accent-green" />
                      ) : (
                        <FileText size={14} className="text-accent-blue" />
                      )}
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-dark-text-secondary hover:text-accent-red"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Mesaj Gönderme */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="admin-file-input"
                />
                <label
                  htmlFor="admin-file-input"
                  className="btn-secondary flex items-center gap-2 cursor-pointer"
                  title="Resim veya PDF ekle"
                >
                  <Paperclip size={18} />
                </label>
                
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mesaj yazın..."
                  className="input flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() && selectedFiles.length === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send size={18} />
                  Gönder
                </button>
              </div>
            </div>
          </div>

          {/* Fatura Geçmişi */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Fatura Geçmişi</h2>
            {faturalar.length === 0 ? (
              <p className="text-dark-text-secondary text-center py-8">
                Henüz fatura kaydı bulunmuyor
              </p>
            ) : (
              <div className="space-y-3">
                {faturalar.map((fatura) => {
                  const paketBilgisi = getPaketBilgisi(fatura.paketTipi);
                  const ayIsimleri = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                  return (
                    <div
                      key={fatura.id}
                      className="flex items-center justify-between p-4 bg-dark-card-hover rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {ayIsimleri[fatura.faturaDonemi.ay - 1]} {fatura.faturaDonemi.yil}
                        </p>
                        <p className="text-sm text-dark-text-secondary">
                          {paketBilgisi.ad} - {fatura.danisanSayisi} danışan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{fatura.toplamTutar.toFixed(2)} ₺</p>
                        <span className={`badge ${
                          fatura.faturaDurumu === 'odendi' ? 'badge-success' :
                          fatura.faturaDurumu === 'beklemede' ? 'badge-warning' :
                          fatura.faturaDurumu === 'gecikmis' ? 'badge-danger' :
                          'badge-secondary'
                        }`}>
                          {fatura.faturaDurumu === 'odendi' ? 'Ödendi' :
                           fatura.faturaDurumu === 'beklemede' ? 'Beklemede' :
                           fatura.faturaDurumu === 'gecikmis' ? 'Gecikmiş' :
                           'İptal'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Kolon - Hızlı İşlemler */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Hızlı İşlemler</h2>
            <div className="space-y-3">
              {needsApproval && (
                <>
                  <button
                    onClick={handleApprove}
                    className="btn-primary w-full flex items-center gap-2 justify-center"
                  >
                    <CheckCircle size={18} />
                    Kabul Et
                  </button>
                  <button
                    onClick={handleReject}
                    className="btn-danger w-full flex items-center gap-2 justify-center"
                  >
                    <XCircle size={18} />
                    Reddet
                  </button>
                </>
              )}
              
              <button
                onClick={() => setShowTrialModal(true)}
                className="btn-secondary w-full flex items-center gap-2 justify-center"
              >
                <Calendar size={18} />
                Deneme Süresi Başlat
              </button>
              
              {diyetisyen.denemeSuresi?.aktif && (
                <button
                  onClick={() => setShowEndTrialModal(true)}
                  className="btn-danger w-full flex items-center gap-2 justify-center"
                >
                  <XCircle size={18} />
                  Deneme Süresini Sonlandır
                </button>
              )}
              
              {diyetisyen.aktiflikDurumu === 'aktif' ? (
                <button
                  onClick={() => handleStatusChange('pasif')}
                  className="btn-danger w-full flex items-center gap-2 justify-center"
                >
                  <Ban size={18} />
                  Pasifleştir
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('aktif')}
                  className="btn-primary w-full flex items-center gap-2 justify-center"
                >
                  <CheckCircle size={18} />
                  Aktifleştir
                </button>
              )}
            </div>
          </div>

          {/* Deneme Süresi Bilgisi */}
          {diyetisyen.denemeSuresi?.aktif && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Deneme Süresi</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-dark-text-secondary">Gün Sayısı:</span>
                  <span className="font-semibold">{diyetisyen.denemeSuresi?.gunSayisi || 0} gün</span>
                </div>
                {diyetisyen.denemeSuresi?.baslangicTarihi && (
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">Başlangıç:</span>
                    <span className="font-semibold">
                      {formatDate(diyetisyen.denemeSuresi.baslangicTarihi)}
                    </span>
                  </div>
                )}
                {diyetisyen.denemeSuresi?.bitisTarihi && (
                  <div className="flex justify-between">
                    <span className="text-dark-text-secondary">Bitiş:</span>
                    <span className="font-semibold">
                      {formatDate(diyetisyen.denemeSuresi.bitisTarihi)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTrialModal && diyetisyen && (
        <TrialPeriodModal
          diyetisyen={diyetisyen}
          onClose={() => setShowTrialModal(false)}
          onSuccess={loadData}
        />
      )}

      {showEndTrialModal && diyetisyen && (
        <ConfirmModal
          isOpen={showEndTrialModal}
          onClose={() => setShowEndTrialModal(false)}
          onConfirm={handleEndTrial}
          title="Deneme Süresini Sonlandır"
          message={`${diyetisyen.adSoyad} için deneme süresini sonlandırmak istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sonlandır"
          cancelText="İptal"
          type="danger"
        />
      )}
    </div>
  );
}
