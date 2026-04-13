import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { giderService, ayarlarService } from '@/services/firebase/firestore';
import { Gider, GiderKategorisi } from '@/types/gider';
import { GiderKalemi } from '@/types/settings';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/services/utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import ConfirmModal from '@/components/common/ConfirmModal';

const kategoriIsimleri: Record<GiderKategorisi, string> = {
  kirtasiye: 'Kırtasiye',
  yiyecekIcecek: 'Yiyecek İçecek',
  telefonFaks: 'Telefon Faks',
  iskiSu: 'İSKİ Su',
  elektrik: 'Elektrik',
  reklamTanitim: 'Reklam Tanıtım',
  kargoKurye: 'Kargo Kurye',
  temizlik: 'Temizlik',
  teknikServis: 'Teknik Servis',
  smmYmmAvukat: 'SMM YMM Avukat',
  bursGideri: 'Burs Gideri',
  internetSarfMalz: 'İnternet Sarf Malz.',
  noter: 'Noter',
  bilgSarfMalzemleri: 'Bilg. Sarf Malzemeleri',
  vergiResimVeHarclar: 'Vergi Resim ve Harçlar',
  digerCesitli: 'Diğer Çeşitli',
  personelSaglik: 'Personel Sağlık',
  sehirIciUlasim: 'Şehir İçi Ulaşım',
  temsilVeAgirlama: 'Temsil ve Ağırlama',
  apartmanAidatlari: 'Apartman Aidatları',
  isyeriSigortalama: 'İşyeri Sigortalama',
  kiralamar: 'Kiralamar',
  igdasDogalgaz: 'İGDAŞ Doğalgaz',
  aracSigortalama: 'Araç Sigortalama',
  kucukDemirbaslar: 'Küçük Demirbaşlar',
  buroBakimOnarim: 'Büro Bakım Onarım',
  aracYakit: 'Araç Yakıt',
  kurye: 'Kurye',
  gazeteVeDergi: 'Gazete ve Dergi',
  aracOtopark: 'Araç Otopark',
  aracBakimVeOnarim: 'Araç Bakım ve Onarım',
  matbaa: 'Matbaa',
  maas: 'Maaş',
  bankaKomisyon: 'Banka Komisyon',
  krediKartiKomisyonlari: 'Kredi Kartı Komisyonları',
  bagkur: 'BAĞKUR',
  prim: 'Prim',
  yurtIciUlasim: 'Yurt İçi Ulaşım',
  aracVergi: 'Araç Vergi',
  ssk: 'SSK',
  ogs: 'OGS',
  kanunenKabulEdilmeyen: 'Kanunen Kabul Edilmeyen',
  fiyatFarklari: 'Fiyat Farkları',
  yurtdisiUlasimKonaklama: 'Yurtdışı Ulaşım & Konaklama',
  aracKiralama: 'Araç Kiralama',
  kidemIhbar: 'Kıdem İhbar',
  digerHaberlesmeGid: 'Diğer Haberleşme Gid.',
};

// Renk paleti - kategorilere renk atama
const getKategoriRengi = (kategori: GiderKategorisi): string => {
  const renkMap: Record<string, string> = {
    // Maaş ve Personel
    maas: 'bg-blue-500',
    personelSaglik: 'bg-blue-400',
    ssk: 'bg-blue-600',
    bagkur: 'bg-blue-600',
    prim: 'bg-blue-500',
    kidemIhbar: 'bg-blue-400',
    
    // Kira ve Aidatlar
    kiralamar: 'bg-purple-500',
    apartmanAidatlari: 'bg-purple-400',
    
    // Faturalar ve Hizmetler
    elektrik: 'bg-yellow-500',
    iskiSu: 'bg-yellow-400',
    igdasDogalgaz: 'bg-yellow-600',
    telefonFaks: 'bg-yellow-500',
    internetSarfMalz: 'bg-yellow-400',
    digerHaberlesmeGid: 'bg-yellow-500',
    
    // Araç Giderleri
    aracYakit: 'bg-green-500',
    aracBakimVeOnarim: 'bg-green-400',
    aracSigortalama: 'bg-green-600',
    aracVergi: 'bg-green-500',
    aracOtopark: 'bg-green-400',
    aracKiralama: 'bg-green-500',
    ogs: 'bg-green-400',
    
    // Ofis ve Büro
    kirtasiye: 'bg-pink-500',
    bilgSarfMalzemleri: 'bg-pink-400',
    buroBakimOnarim: 'bg-pink-500',
    temizlik: 'bg-pink-400',
    teknikServis: 'bg-pink-500',
    kucukDemirbaslar: 'bg-pink-400',
    
    // Ulaşım
    sehirIciUlasim: 'bg-indigo-500',
    yurtIciUlasim: 'bg-indigo-400',
    yurtdisiUlasimKonaklama: 'bg-indigo-500',
    kargoKurye: 'bg-indigo-400',
    kurye: 'bg-indigo-500',
    
    // Hukuki ve Mali
    smmYmmAvukat: 'bg-red-500',
    noter: 'bg-red-400',
    vergiResimVeHarclar: 'bg-red-600',
    bankaKomisyon: 'bg-red-500',
    krediKartiKomisyonlari: 'bg-red-400',
    
    // Pazarlama ve Tanıtım
    reklamTanitim: 'bg-orange-500',
    gazeteVeDergi: 'bg-orange-400',
    matbaa: 'bg-orange-500',
    
    // Diğer
    yiyecekIcecek: 'bg-cyan-500',
    temsilVeAgirlama: 'bg-cyan-400',
    bursGideri: 'bg-cyan-500',
    isyeriSigortalama: 'bg-cyan-400',
    kanunenKabulEdilmeyen: 'bg-gray-600',
    fiyatFarklari: 'bg-gray-500',
    digerCesitli: 'bg-gray-500',
  };
  
  return renkMap[kategori] || 'bg-gray-500';
};

const kategoriRenkleri: Record<GiderKategorisi, string> = {
  kirtasiye: getKategoriRengi('kirtasiye'),
  yiyecekIcecek: getKategoriRengi('yiyecekIcecek'),
  telefonFaks: getKategoriRengi('telefonFaks'),
  iskiSu: getKategoriRengi('iskiSu'),
  elektrik: getKategoriRengi('elektrik'),
  reklamTanitim: getKategoriRengi('reklamTanitim'),
  kargoKurye: getKategoriRengi('kargoKurye'),
  temizlik: getKategoriRengi('temizlik'),
  teknikServis: getKategoriRengi('teknikServis'),
  smmYmmAvukat: getKategoriRengi('smmYmmAvukat'),
  bursGideri: getKategoriRengi('bursGideri'),
  internetSarfMalz: getKategoriRengi('internetSarfMalz'),
  noter: getKategoriRengi('noter'),
  bilgSarfMalzemleri: getKategoriRengi('bilgSarfMalzemleri'),
  vergiResimVeHarclar: getKategoriRengi('vergiResimVeHarclar'),
  digerCesitli: getKategoriRengi('digerCesitli'),
  personelSaglik: getKategoriRengi('personelSaglik'),
  sehirIciUlasim: getKategoriRengi('sehirIciUlasim'),
  temsilVeAgirlama: getKategoriRengi('temsilVeAgirlama'),
  apartmanAidatlari: getKategoriRengi('apartmanAidatlari'),
  isyeriSigortalama: getKategoriRengi('isyeriSigortalama'),
  kiralamar: getKategoriRengi('kiralamar'),
  igdasDogalgaz: getKategoriRengi('igdasDogalgaz'),
  aracSigortalama: getKategoriRengi('aracSigortalama'),
  kucukDemirbaslar: getKategoriRengi('kucukDemirbaslar'),
  buroBakimOnarim: getKategoriRengi('buroBakimOnarim'),
  aracYakit: getKategoriRengi('aracYakit'),
  kurye: getKategoriRengi('kurye'),
  gazeteVeDergi: getKategoriRengi('gazeteVeDergi'),
  aracOtopark: getKategoriRengi('aracOtopark'),
  aracBakimVeOnarim: getKategoriRengi('aracBakimVeOnarim'),
  matbaa: getKategoriRengi('matbaa'),
  maas: getKategoriRengi('maas'),
  bankaKomisyon: getKategoriRengi('bankaKomisyon'),
  krediKartiKomisyonlari: getKategoriRengi('krediKartiKomisyonlari'),
  bagkur: getKategoriRengi('bagkur'),
  prim: getKategoriRengi('prim'),
  yurtIciUlasim: getKategoriRengi('yurtIciUlasim'),
  aracVergi: getKategoriRengi('aracVergi'),
  ssk: getKategoriRengi('ssk'),
  ogs: getKategoriRengi('ogs'),
  kanunenKabulEdilmeyen: getKategoriRengi('kanunenKabulEdilmeyen'),
  fiyatFarklari: getKategoriRengi('fiyatFarklari'),
  yurtdisiUlasimKonaklama: getKategoriRengi('yurtdisiUlasimKonaklama'),
  aracKiralama: getKategoriRengi('aracKiralama'),
  kidemIhbar: getKategoriRengi('kidemIhbar'),
  digerHaberlesmeGid: getKategoriRengi('digerHaberlesmeGid'),
};

export default function Giderler() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [giderler, setGiderler] = useState<Gider[]>([]);
  const [filteredGiderler, setFilteredGiderler] = useState<Gider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState<string | 'all'>('all');
  const [yilFilter, setYilFilter] = useState<number>(new Date().getFullYear());
  const [ayFilter, setAyFilter] = useState<number | 'all'>(new Date().getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [editingGider, setEditingGider] = useState<Gider | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingGider, setDeletingGider] = useState<Gider | null>(null);
  const [giderKalemleri, setGiderKalemleri] = useState<GiderKalemi[]>([]);

  const [formData, setFormData] = useState({
    aciklama: '',
    tutar: '',
    kategori: '',
    tarih: new Date().toISOString().split('T')[0],
    faturaNo: '',
    notlar: '',
  });

  useEffect(() => {
    loadGiderler();
    loadGiderKalemleri();
  }, []);

  useEffect(() => {
    filterGiderler();
  }, [giderler, searchTerm, kategoriFilter, yilFilter, ayFilter, giderKalemleri]);

  const loadGiderler = async () => {
    try {
      setLoading(true);
      const data = await giderService.getAll();
      setGiderler(data);
    } catch (error) {
      console.error('Giderler yüklenirken hata:', error);
      showError('Giderler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadGiderKalemleri = async () => {
    try {
      const ayarlar = await ayarlarService.get();
      if (ayarlar?.giderKalemleri) {
        setGiderKalemleri(ayarlar.giderKalemleri.filter(k => k.aktif));
      }
    } catch (error) {
      console.error('Gider kalemleri yüklenirken hata:', error);
    }
  };

  const filterGiderler = () => {
    let filtered = [...giderler];

    if (searchTerm) {
      filtered = filtered.filter(
        (g) =>
          g.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.faturaNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          g.notlar?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (kategoriFilter !== 'all') {
      filtered = filtered.filter((g) => {
        // Hem kategori hem de kategoriId ile eşleşmeyi kontrol et
        return g.kategori === kategoriFilter || g.kategoriId === kategoriFilter;
      });
    }

    if (yilFilter) {
      filtered = filtered.filter((g) => {
        const tarih = g.tarih.toDate();
        return tarih.getFullYear() === yilFilter;
      });
    }

    if (ayFilter !== 'all') {
      filtered = filtered.filter((g) => {
        const tarih = g.tarih.toDate();
        return tarih.getMonth() + 1 === ayFilter;
      });
    }

    setFilteredGiderler(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const tarih = new Date(formData.tarih);
      tarih.setHours(12, 0, 0, 0);

      const giderData: Omit<Gider, 'id'> = {
        aciklama: formData.aciklama,
        tutar: parseFloat(formData.tutar),
        kategori: formData.kategori,
        tarih: Timestamp.fromDate(tarih),
        ...(formData.faturaNo?.trim() && { faturaNo: formData.faturaNo.trim() }),
        ...(formData.notlar?.trim() && { notlar: formData.notlar.trim() }),
        olusturmaTarihi: Timestamp.now(),
        olusturanAdmin: user.uid,
      };

      if (editingGider) {
        const updateData: Partial<Gider> = {
          aciklama: giderData.aciklama,
          tutar: giderData.tutar,
          kategori: giderData.kategori,
          tarih: giderData.tarih,
          olusturmaTarihi: editingGider.olusturmaTarihi,
          olusturanAdmin: editingGider.olusturanAdmin,
          guncelleyenAdmin: user.uid,
        };
        
        // Sadece dolu alanları ekle
        if (formData.faturaNo?.trim()) {
          updateData.faturaNo = formData.faturaNo.trim();
        }
        if (formData.notlar?.trim()) {
          updateData.notlar = formData.notlar.trim();
        }
        
        await giderService.update(editingGider.id!, updateData);
        showSuccess('Gider başarıyla güncellendi');
      } else {
        await giderService.create(giderData);
        showSuccess('Gider başarıyla eklendi');
      }

      setShowModal(false);
      resetForm();
      await loadGiderler();
    } catch (error) {
      console.error('Gider kaydetme hatası:', error);
      showError('Gider kaydedilirken bir hata oluştu');
    }
  };

  const handleEdit = (gider: Gider) => {
    setEditingGider(gider);
    const tarih = gider.tarih.toDate();
    setFormData({
      aciklama: gider.aciklama,
      tutar: gider.tutar.toString(),
      kategori: gider.kategori,
      tarih: tarih.toISOString().split('T')[0],
      faturaNo: gider.faturaNo || '',
      notlar: gider.notlar || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingGider) return;

    try {
      await giderService.delete(deletingGider.id!);
      showSuccess('Gider başarıyla silindi');
      setDeleteModalOpen(false);
      setDeletingGider(null);
      await loadGiderler();
    } catch (error) {
      console.error('Gider silme hatası:', error);
      showError('Gider silinirken bir hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      aciklama: '',
      tutar: '',
      kategori: giderKalemleri.length > 0 ? giderKalemleri[0].id : (Object.keys(kategoriIsimleri)[0] || ''),
      tarih: new Date().toISOString().split('T')[0],
      faturaNo: '',
      notlar: '',
    });
    setEditingGider(null);
  };

  // Kategori adını ve rengini getir (dinamik kalemler veya eski enum)
  const getKategoriAdi = (kategori: string): string => {
    // Önce dinamik kalemlerde ara
    const dinamikKalem = giderKalemleri.find(k => k.id === kategori);
    if (dinamikKalem) return dinamikKalem.ad;
    
    // Eski enum değerlerini kontrol et
    if (kategori in kategoriIsimleri) {
      return kategoriIsimleri[kategori as GiderKategorisi];
    }
    
    return kategori; // Fallback
  };

  const getKategoriRengiFromString = (kategori: string): string => {
    // Önce dinamik kalemlerde ara
    const dinamikKalem = giderKalemleri.find(k => k.id === kategori);
    if (dinamikKalem) return dinamikKalem.renk;
    
    // Eski enum değerlerini kontrol et
    if (kategori in kategoriRenkleri) {
      return kategoriRenkleri[kategori as GiderKategorisi];
    }
    
    return 'bg-gray-500'; // Fallback
  };

  // Tüm kategorileri birleştir (dinamik + eski enum)
  const tumKategoriler = [
    ...giderKalemleri.map(k => ({ id: k.id, ad: k.ad, renk: k.renk, tip: 'dinamik' as const })),
    ...Object.entries(kategoriIsimleri).map(([id, ad]) => ({
      id,
      ad,
      renk: getKategoriRengi(id as GiderKategorisi),
      tip: 'enum' as const,
    })),
  ];

  const toplamGider = filteredGiderler.reduce((toplam, g) => toplam + g.tutar, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <h1 className="text-3xl font-bold">Giderler</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 flex items-center gap-2"
        >
          <Plus size={18} />
          Yeni Gider Ekle
        </button>
      </motion.div>

      {/* Özet Kart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-dark-text-secondary text-sm mb-1">Toplam Gider</p>
            <p className="text-3xl font-bold text-accent-red">
              {toplamGider.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} ₺
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent-red bg-opacity-20">
            <Calendar className="text-accent-red" size={24} />
          </div>
        </div>
      </motion.div>

      {/* Filtreler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-text-secondary" size={18} />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg"
            />
          </div>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
          >
            <option value="all">Tüm Kategoriler</option>
            {tumKategoriler.map((kat) => (
              <option key={kat.id} value={kat.id}>{kat.ad}</option>
            ))}
          </select>
          <select
            value={yilFilter}
            onChange={(e) => setYilFilter(Number(e.target.value))}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(yil => (
              <option key={yil} value={yil}>{yil}</option>
            ))}
          </select>
          <select
            value={ayFilter}
            onChange={(e) => setAyFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
          >
            <option value="all">Tüm Aylar</option>
            {['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'].map((ay, index) => (
              <option key={index} value={index + 1}>{ay}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Giderler Listesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-xl font-bold mb-4">Gider Listesi ({filteredGiderler.length})</h2>
        {filteredGiderler.length === 0 ? (
          <p className="text-dark-text-secondary text-center py-8">
            Gider bulunamadı
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left p-4">Tarih</th>
                  <th className="text-left p-4">Açıklama</th>
                  <th className="text-left p-4">Kategori</th>
                  <th className="text-right p-4">Tutar</th>
                  <th className="text-left p-4">Fatura No</th>
                  <th className="text-center p-4">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredGiderler.map((gider) => (
                  <tr key={gider.id} className="border-b border-dark-border hover:bg-dark-card-hover">
                    <td className="p-4">{formatDate(gider.tarih)}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold">{gider.aciklama}</p>
                        {gider.notlar && (
                          <p className="text-sm text-dark-text-secondary mt-1">{gider.notlar}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${getKategoriRengiFromString(gider.kategori)}`}>
                        {getKategoriAdi(gider.kategori)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold">
                      {gider.tutar.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ₺
                    </td>
                    <td className="p-4">{gider.faturaNo || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(gider)}
                          className="p-2 hover:bg-dark-card-hover rounded transition-colors"
                          title="Düzenle"
                        >
                          <Edit size={18} className="text-accent-blue" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingGider(gider);
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
      </motion.div>

      {/* Gider Ekleme/Düzenleme Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingGider ? 'Gider Düzenle' : 'Yeni Gider Ekle'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-dark-text-secondary hover:text-dark-text"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Açıklama *</label>
                <input
                  type="text"
                  required
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                  placeholder="Örn: Ofis kirası"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tutar (₺) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.tutar}
                    onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Kategori *</label>
                  <select
                    required
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                  >
                    <option value="">Kategori Seçin</option>
                    {tumKategoriler.map((kat) => (
                      <option key={kat.id} value={kat.id}>{kat.ad}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tarih *</label>
                  <input
                    type="date"
                    required
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fatura No</label>
                  <input
                    type="text"
                    value={formData.faturaNo}
                    onChange={(e) => setFormData({ ...formData, faturaNo: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notlar</label>
                <textarea
                  value={formData.notlar}
                  onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-lg"
                  rows={3}
                  placeholder="Ek notlar..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent-green text-black rounded-lg hover:bg-accent-green/90 font-semibold"
                >
                  {editingGider ? 'Güncelle' : 'Kaydet'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-dark-card-hover rounded-lg hover:bg-dark-card-hover/80"
                >
                  İptal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Silme Onay Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingGider(null);
        }}
        onConfirm={handleDelete}
        title="Gideri Sil"
        message={`"${deletingGider?.aciklama}" giderini silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </div>
  );
}
