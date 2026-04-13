import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Filter,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { basvuruService, ilanService } from '@/services/firebase/firestore';
import { Basvuru } from '@/types/basvuru';
import { Ilan } from '@/types/ilan';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ConfirmModal from '@/components/common/ConfirmModal';
import * as XLSX from 'xlsx';

export default function Basvurular() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [basvurular, setBasvurular] = useState<Basvuru[]>([]);
  const [ilanlar, setIlanlar] = useState<Ilan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBasvuru, setSelectedBasvuru] = useState<Basvuru | null>(null);
  const [showCvModal, setShowCvModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [basvuruToDelete, setBasvuruToDelete] = useState<string | null>(null);
  const [filterIlanId, setFilterIlanId] = useState<string>('all');
  const [filterDurum, setFilterDurum] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [basvuruData, ilanData] = await Promise.all([
        basvuruService.getAll(),
        ilanService.getAll(),
      ]);
      setBasvurular(basvuruData);
      setIlanlar(ilanData);
    } catch (error) {
      console.error('Veriler yüklenirken hata:', error);
      showToast('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredBasvurular = basvurular.filter(basvuru => {
    if (filterIlanId !== 'all' && basvuru.ilanId !== filterIlanId) return false;
    if (filterDurum !== 'all' && basvuru.durum !== filterDurum) return false;
    return true;
  });

  const handleViewCv = (basvuru: Basvuru) => {
    setSelectedBasvuru(basvuru);
    setShowCvModal(true);
  };

  const handleDownloadCv = async (basvuru: Basvuru) => {
    try {
      const response = await fetch(basvuru.cvUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = basvuru.cvDosyaAdi;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('CV indirildi', 'success');
    } catch (error) {
      console.error('CV indirme hatası:', error);
      showToast('CV indirilirken bir hata oluştu', 'error');
    }
  };

  const handleDelete = async () => {
    if (!basvuruToDelete) return;

    try {
      await basvuruService.delete(basvuruToDelete);
      showToast('Başvuru başarıyla silindi', 'success');
      setDeleteModalOpen(false);
      setBasvuruToDelete(null);
      await loadData();
    } catch (error) {
      console.error('Başvuru silme hatası:', error);
      showToast('Başvuru silinirken bir hata oluştu', 'error');
    }
  };

  const handleUpdateDurum = async (basvuruId: string, durum: Basvuru['durum']) => {
    if (!user) return;

    try {
      await basvuruService.update(basvuruId, {
        durum: durum,
        guncelleyenAdmin: user.uid,
      });
      showToast('Başvuru durumu güncellendi', 'success');
      await loadData();
    } catch (error) {
      console.error('Başvuru güncelleme hatası:', error);
      showToast('Başvuru güncellenirken bir hata oluştu', 'error');
    }
  };

  const handleExportExcel = () => {
    try {
      const data = filteredBasvurular.map(basvuru => ({
        'Ad Soyad': basvuru.adSoyad,
        'Email': basvuru.email,
        'Telefon': basvuru.telefon,
        'İlan': basvuru.ilanBaslik,
        'Başvuru Tarihi': format(basvuru.basvuruTarihi.toDate(), 'dd/MM/yyyy HH:mm', { locale: tr }),
        'Durum': basvuru.durum === 'beklemede' ? 'Beklemede' : 
                 basvuru.durum === 'gorusme' ? 'Görüşme' :
                 basvuru.durum === 'kabul-edildi' ? 'Kabul Edildi' :
                 basvuru.durum === 'reddedildi' ? 'Reddedildi' : basvuru.durum,
        'Özgeçmiş': basvuru.ozgecmis || '',
        'Notlar': basvuru.notlar || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Başvurular');
      
      const fileName = `basvurular_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast('Excel dosyası indirildi', 'success');
    } catch (error) {
      console.error('Excel export hatası:', error);
      showToast('Excel dosyası oluşturulurken bir hata oluştu', 'error');
    }
  };

  const getDurumColor = (durum?: string) => {
    const colors: Record<string, string> = {
      'beklemede': 'bg-yellow-500/20 text-yellow-400',
      'gorusme': 'bg-blue-500/20 text-blue-400',
      'kabul-edildi': 'bg-green-500/20 text-green-400',
      'reddedildi': 'bg-red-500/20 text-red-400',
    };
    return colors[durum || ''] || 'bg-gray-500/20 text-gray-400';
  };

  const getDurumText = (durum?: string) => {
    const texts: Record<string, string> = {
      'beklemede': 'Beklemede',
      'gorusme': 'Görüşme',
      'kabul-edildi': 'Kabul Edildi',
      'reddedildi': 'Reddedildi',
    };
    return texts[durum || ''] || durum || 'Bilinmiyor';
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
        <h1 className="text-3xl font-bold text-dark-text">Başvurular</h1>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition font-medium"
        >
          <FileSpreadsheet size={20} />
          Excel İndir
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-dark-card border border-dark-card-hover rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-dark-text-secondary" />
            <span className="text-dark-text-secondary text-sm">Filtrele:</span>
          </div>

          <div>
            <label className="block text-dark-text-secondary text-xs mb-1">İlan</label>
            <select
              value={filterIlanId}
              onChange={(e) => setFilterIlanId(e.target.value)}
              className="px-3 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text text-sm focus:outline-none focus:border-accent-green transition"
            >
              <option value="all">Tümü</option>
              {ilanlar.map(ilan => (
                <option key={ilan.id} value={ilan.id}>{ilan.baslik}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-dark-text-secondary text-xs mb-1">Durum</label>
            <select
              value={filterDurum}
              onChange={(e) => setFilterDurum(e.target.value)}
              className="px-3 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text text-sm focus:outline-none focus:border-accent-green transition"
            >
              <option value="all">Tümü</option>
              <option value="beklemede">Beklemede</option>
              <option value="gorusme">Görüşme</option>
              <option value="kabul-edildi">Kabul Edildi</option>
              <option value="reddedildi">Reddedildi</option>
            </select>
          </div>

          {(filterIlanId !== 'all' || filterDurum !== 'all') && (
            <button
              onClick={() => {
                setFilterIlanId('all');
                setFilterDurum('all');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg text-dark-text-secondary hover:text-dark-text transition text-sm"
            >
              <X size={16} />
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {filteredBasvurular.length === 0 ? (
        <div className="text-center py-20 bg-dark-card rounded-lg border border-dark-card-hover">
          <FileText size={64} className="mx-auto mb-4 text-dark-text-secondary opacity-50" />
          <p className="text-dark-text-secondary">Başvuru bulunmamaktadır</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBasvurular.map((basvuru) => (
            <motion.div
              key={basvuru.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-card border border-dark-card-hover rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-dark-text">{basvuru.adSoyad}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDurumColor(basvuru.durum)}`}>
                      {getDurumText(basvuru.durum)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-text-secondary text-sm mb-2">
                    <Briefcase size={14} />
                    <span>{basvuru.ilanBaslik}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-dark-text-secondary text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>{basvuru.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} />
                      <span>{basvuru.telefon}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{format(basvuru.basvuruTarihi.toDate(), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {basvuru.ozgecmis && (
                <div className="mb-4 p-3 bg-dark-card-hover rounded-lg">
                  <p className="text-dark-text-secondary text-sm line-clamp-3">{basvuru.ozgecmis}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-dark-card-hover">
                <button
                  onClick={() => handleViewCv(basvuru)}
                  className="flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                >
                  <Eye size={16} />
                  CV Görüntüle
                </button>
                <button
                  onClick={() => handleDownloadCv(basvuru)}
                  className="flex items-center gap-2 px-3 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80 transition text-dark-text-secondary text-sm"
                >
                  <Download size={16} />
                  CV İndir
                </button>
                <select
                  value={basvuru.durum || 'beklemede'}
                  onChange={(e) => handleUpdateDurum(basvuru.id!, e.target.value as Basvuru['durum'])}
                  className="px-3 py-2 bg-dark-card-hover border border-dark-card-hover rounded-lg text-dark-text text-sm focus:outline-none focus:border-accent-green transition"
                >
                  <option value="beklemede">Beklemede</option>
                  <option value="gorusme">Görüşme</option>
                  <option value="kabul-edildi">Kabul Edildi</option>
                  <option value="reddedildi">Reddedildi</option>
                </select>
                <button
                  onClick={() => {
                    setBasvuruToDelete(basvuru.id!);
                    setDeleteModalOpen(true);
                  }}
                  className="ml-auto px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CV Görüntüleme Modal */}
      {showCvModal && selectedBasvuru && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-dark-card border border-dark-card-hover rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-dark-text">
                {selectedBasvuru.adSoyad} - CV
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadCv(selectedBasvuru)}
                  className="px-3 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 transition text-sm font-medium flex items-center gap-2"
                >
                  <Download size={16} />
                  İndir
                </button>
                <button
                  onClick={() => {
                    setShowCvModal(false);
                    setSelectedBasvuru(null);
                  }}
                  className="text-dark-text-secondary hover:text-dark-text transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <h3 className="text-dark-text-secondary text-sm mb-1">İletişim Bilgileri</h3>
                <div className="bg-dark-card-hover rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-dark-text">
                    <Mail size={16} className="text-dark-text-secondary" />
                    <span>{selectedBasvuru.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-text">
                    <Phone size={16} className="text-dark-text-secondary" />
                    <span>{selectedBasvuru.telefon}</span>
                  </div>
                </div>
              </div>

              {selectedBasvuru.ozgecmis && (
                <div>
                  <h3 className="text-dark-text-secondary text-sm mb-1">Özgeçmiş</h3>
                  <div className="bg-dark-card-hover rounded-lg p-4">
                    <p className="text-dark-text whitespace-pre-wrap">{selectedBasvuru.ozgecmis}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-dark-card-hover pt-4">
              <h3 className="text-dark-text-secondary text-sm mb-2">CV Dosyası</h3>
              <iframe
                src={selectedBasvuru.cvUrl}
                className="w-full h-96 border border-dark-card-hover rounded-lg"
                title="CV Preview"
              />
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBasvuruToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Başvuruyu Sil"
        message="Bu başvuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
      />
    </div>
  );
}
