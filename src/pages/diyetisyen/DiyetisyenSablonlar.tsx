import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Edit3,
  Filter,
  Tag,
  Utensils,
  Calendar,
  Loader2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { mealTemplateService } from '@/services/firebase/mealTemplateService';
import { MealTemplate } from '@/types/mealTemplate';

function formatRelative(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function countItems(template: MealTemplate): number {
  return template.meals.reduce((sum, m) => sum + (m.items?.length || 0), 0);
}

export default function DiyetisyenSablonlar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<MealTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await mealTemplateService.list();
      setTemplates(list);
    } catch (error: any) {
      showError(error.message || 'Şablonlar getirilemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) loadTemplates();
  }, [user?.uid]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return templates.filter((t) => {
      if (activeCategory !== 'all') {
        if (activeCategory === '__none__' && t.category) return false;
        if (activeCategory !== '__none__' && t.category !== activeCategory) return false;
      }
      if (!q) return true;
      const name = t.name.toLocaleLowerCase('tr-TR');
      const cat = (t.category || '').toLocaleLowerCase('tr-TR');
      return name.includes(q) || cat.includes(q);
    });
  }, [templates, search, activeCategory]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mealTemplateService.delete(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showSuccess('Şablon silindi.');
      setDeleteTarget(null);
    } catch (error: any) {
      showError(error.message || 'Şablon silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="text-accent-green" size={28} />
            Şablonlar Kütüphanesi
          </h1>
          <p className="text-dark-text-secondary mt-1">
            Diyet planı hazırlarken hızlıca ekleyebileceğiniz hazır öğün setleri.
            Buradan oluşturduğunuz her şablon mobil uygulamanızda da anında görünür.
          </p>
        </div>

        <button
          onClick={() => navigate('/diyetisyen/sablonlar/yeni')}
          className="btn-primary flex items-center justify-center gap-2 self-start lg:self-auto"
        >
          <Plus size={20} />
          Yeni Şablon Oluştur
        </button>
      </motion.div>

      {/* Filtre çubuğu */}
      <div className="card flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-secondary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Şablon adı veya kategori ara..."
            className="input w-full pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-dark-text-secondary" />
          <button
            onClick={() => setActiveCategory('all')}
            className={`badge transition-all ${
              activeCategory === 'all' ? 'badge-success' : 'badge-info opacity-60 hover:opacity-100'
            }`}
          >
            Tümü
          </button>
          {categories.length > 0 && (
            <button
              onClick={() => setActiveCategory('__none__')}
              className={`badge transition-all ${
                activeCategory === '__none__' ? 'badge-success' : 'badge-info opacity-60 hover:opacity-100'
              }`}
            >
              Kategorisiz
            </button>
          )}
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`badge transition-all ${
                activeCategory === c ? 'badge-success' : 'badge-info opacity-60 hover:opacity-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-accent-green" size={32} />
          <span className="ml-3 text-dark-text-secondary">Şablonlar yükleniyor...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="mx-auto text-dark-text-secondary" size={48} />
          <h3 className="text-xl font-semibold mt-4">
            {templates.length === 0 ? 'Henüz şablon eklemediniz' : 'Filtreyle eşleşen şablon yok'}
          </h3>
          <p className="text-dark-text-secondary mt-2 max-w-md mx-auto">
            {templates.length === 0
              ? 'Sık kullandığınız öğün setlerini şablon olarak kaydedin; her yeni planda saatler kazanın.'
              : 'Aramayı temizlemeyi veya farklı bir kategori seçmeyi deneyin.'}
          </p>
          {templates.length === 0 && (
            <button
              onClick={() => navigate('/diyetisyen/sablonlar/yeni')}
              className="btn-primary inline-flex items-center gap-2 mt-6"
            >
              <Plus size={18} /> İlk şablonumu oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t, idx) => {
            const itemCount = countItems(t);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                className="card group flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{t.name}</h3>
                    {t.category ? (
                      <span className="badge badge-info inline-flex items-center gap-1 mt-2">
                        <Tag size={12} />
                        {t.category}
                      </span>
                    ) : (
                      <span className="text-xs text-dark-text-secondary mt-2 inline-block">
                        Kategori yok
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/diyetisyen/sablonlar/${t.id}`)}
                      className="p-2 rounded-lg hover:bg-dark-card-hover text-dark-text-secondary hover:text-accent-green transition-all"
                      title="Düzenle"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="p-2 rounded-lg hover:bg-dark-card-hover text-dark-text-secondary hover:text-accent-red transition-all"
                      title="Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-dark-text-secondary">
                    <Utensils size={14} className="text-accent-green" />
                    <span>{t.meals.length} öğün</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-text-secondary">
                    <FileText size={14} className="text-accent-blue" />
                    <span>{itemCount} öğe</span>
                  </div>
                  <div className="flex items-center gap-2 text-dark-text-secondary col-span-2">
                    <Calendar size={14} />
                    <span>{formatRelative(t.updatedAt || t.createdAt)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/diyetisyen/sablonlar/${t.id}`)}
                  className="btn-secondary mt-5 w-full text-sm"
                >
                  Düzenle
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Silme onay modal'ı */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-md w-full"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-accent-red/20">
                  <AlertTriangle className="text-accent-red" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Şablonu sil</h3>
                  <p className="text-dark-text-secondary text-sm mt-2">
                    "<span className="text-dark-text font-semibold">{deleteTarget.name}</span>"
                    şablonu kalıcı olarak silinecek. Mobil uygulamadan da kaldırılır.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="btn-secondary"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-danger flex items-center gap-2"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  Sil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
