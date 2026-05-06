import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Utensils,
  Tag,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  mealTemplateService,
  normalizeMealsForSave,
} from '@/services/firebase/mealTemplateService';
import {
  FOOD_UNIT_OPTIONS,
  FoodUnit,
  MEAL_TYPE_PRESETS,
  MealTemplateItem,
  MealTemplateMeal,
} from '@/types/mealTemplate';
import PasteMealsModal from '@/components/diyetisyen/PasteMealsModal';
import { ParsedMealPlan } from '@/services/utils/mealPlanParser';

interface DraftItem extends MealTemplateItem {
  _key: string;
}

interface DraftMeal {
  _key: string;
  mealType: string;
  items: DraftItem[];
  collapsed: boolean;
}

const newKey = () => Math.random().toString(36).slice(2, 11);

const emptyItem = (): DraftItem => ({
  _key: newKey(),
  name: '',
  amount: 1,
  unit: 'porsiyon',
  calories: 0,
  displayUnit: '',
});

const emptyMeal = (mealType = 'KAHVALTI'): DraftMeal => ({
  _key: newKey(),
  mealType,
  collapsed: false,
  items: [emptyItem()],
});

function fromTemplateMeals(meals: MealTemplateMeal[]): DraftMeal[] {
  if (!meals || meals.length === 0) return [emptyMeal()];
  return meals.map((m) => ({
    _key: newKey(),
    mealType: m.mealType || 'KAHVALTI',
    collapsed: false,
    items:
      m.items.length > 0
        ? m.items.map((it) => ({
          _key: newKey(),
          name: it.name || '',
          amount: Number(it.amount) || 0,
          unit: (it.unit as FoodUnit) || 'porsiyon',
          calories: Number(it.calories) || 0,
          displayUnit: it.displayUnit || '',
        }))
        : [emptyItem()],
  }));
}

export default function DiyetisyenSablonOlustur() {
  const { user } = useAuth();
  const { id: routeId } = useParams<{ id: string }>();
  const isEditMode = Boolean(routeId);
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [meals, setMeals] = useState<DraftMeal[]>([emptyMeal()]);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [nameError, setNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Edit modunda mevcut şablonu yükle
  useEffect(() => {
    if (!isEditMode || !routeId || !user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const tpl = await mealTemplateService.get(routeId);
        if (cancelled) return;
        setName(tpl.name);
        setCategory(tpl.category || '');
        setMeals(fromTemplateMeals(tpl.meals));
      } catch (error: any) {
        showError(error.message || 'Şablon yüklenemedi');
        navigate('/diyetisyen/sablonlar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, routeId, user?.uid]);

  const totalItems = useMemo(
    () => meals.reduce((sum, m) => sum + m.items.filter((i) => i.name.trim()).length, 0),
    [meals]
  );

  const totalCalories = useMemo(
    () =>
      meals.reduce(
        (sum, m) =>
          sum + m.items.reduce((s, i) => s + (Number(i.calories) || 0), 0),
        0
      ),
    [meals]
  );

  const updateMeal = (mealKey: string, patch: Partial<DraftMeal>) => {
    setMeals((prev) => prev.map((m) => (m._key === mealKey ? { ...m, ...patch } : m)));
  };

  const updateItem = (
    mealKey: string,
    itemKey: string,
    patch: Partial<DraftItem>
  ) => {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey
          ? {
            ...m,
            items: m.items.map((i) =>
              i._key === itemKey ? { ...i, ...patch } : i
            ),
          }
          : m
      )
    );
  };

  const addMeal = () => {
    const used = new Set(meals.map((m) => m.mealType));
    const next = MEAL_TYPE_PRESETS.find((p) => !used.has(p)) || 'ARA ÖĞÜN';
    setMeals((prev) => [...prev, emptyMeal(next)]);
  };

  const removeMeal = (mealKey: string) => {
    setMeals((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((m) => m._key !== mealKey);
    });
  };

  const addItem = (mealKey: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey ? { ...m, items: [...m.items, emptyItem()] } : m
      )
    );
  };

  const removeItem = (mealKey: string, itemKey: string) => {
    setMeals((prev) =>
      prev.map((m) =>
        m._key === mealKey
          ? {
            ...m,
            items:
              m.items.length === 1
                ? [emptyItem()]
                : m.items.filter((i) => i._key !== itemKey),
          }
          : m
      )
    );
  };

  const validateBeforeSave = (): string | null => {
    if (!name.trim()) return 'Şablon adı zorunludur.';
    const cleanedMeals = meals
      .map((m) => ({
        ...m,
        items: m.items.filter((it) => it.name.trim()),
      }))
      .filter((m) => m.items.length > 0);
    if (cleanedMeals.length === 0) {
      return 'En az bir öğüne en az bir öğe ekleyin (boş şablon kaydetmek için "Boş Olarak Kaydet" seçeneğini kullanın).';
    }
    return null;
  };

  const buildPayload = () => {
    const cleanedMeals: MealTemplateMeal[] = meals
      .map((m) => ({
        mealType: m.mealType,
        mealNumber: 0, // service will reindex
        items: m.items
          .filter((it) => it.name.trim())
          .map<MealTemplateItem>((it) => ({
          name: it.name,
          amount: Number(it.amount) || 0,
          unit: it.unit,
          calories: Number(it.calories) || 0,
          ...(it.displayUnit && it.displayUnit.trim()
            ? { displayUnit: it.displayUnit.trim() }
            : {}),
        })),
      }))
      .filter((m) => m.items.length > 0);

    return {
      name: name.trim(),
      category: category.trim() ? category.trim() : null,
      meals: normalizeMealsForSave(cleanedMeals),
    };
  };

  const handlePasteApply = (parsed: ParsedMealPlan) => {
    // Mobil tarafındaki MealParsePreviewScreen.handleSaveMeals (isTemplateMode) ile aynı
    // mantık: günleri sırala, her günün öğünlerini sırala, hepsini düz bir listeye topla.
    // mealNumber'lar kaydederken normalizeMealsForSave tarafından her gün için 1'den
    // yeniden başlatıldığı için burada öğünleri günler arası ardışık koymamız yeterli.
    const flatDrafts: DraftMeal[] = parsed.parsedDays
      .slice()
      .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
      .flatMap((day) =>
        day.meals
          .filter((m) => m.items.length > 0)
          .slice()
          .sort((a, b) => (a.mealNumber || 0) - (b.mealNumber || 0))
          .map<DraftMeal>((meal) => ({
            _key: newKey(),
            mealType: meal.mealType,
            collapsed: false,
            items:
              meal.items.length > 0
                ? meal.items.map<DraftItem>((it) => ({
                    _key: newKey(),
                    name: it.name,
                    amount: Number(it.amount) || 0,
                    unit: (it.unit as FoodUnit) || 'adet',
                    calories: Number(it.calories) || 0,
                    displayUnit: it.displayUnit || '',
                  }))
                : [emptyItem()],
          }))
      );

    if (flatDrafts.length === 0) {
      showWarning('Geçerli öğün bulunamadı. Yapıştırılan metni kontrol edin.');
      return;
    }

    setMeals(flatDrafts);
    showSuccess(
      `${flatDrafts.length} öğün şablona eklendi. İsterseniz aşağıdan düzenleyebilirsiniz.`
    );
  };

  const hasNonEmptyMeals = meals.some((m) => m.items.some((i) => i.name.trim()));

  const focusNameField = () => {
    setNameError(true);
    showError('Lütfen önce şablon adını girin.');
    // Input'u görünür alana getir ve odakla
    nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => nameInputRef.current?.focus(), 200);
  };

  const handleSave = async (allowEmpty = false) => {
    if (!name.trim()) {
      focusNameField();
      return;
    }

    const error = validateBeforeSave();
    if (error && !allowEmpty) {
      showWarning(error);
      return;
    }

    setSaving(true);
    try {
      let payload = buildPayload();
      if (allowEmpty && payload.meals.length === 0) {
        payload = { ...payload, meals: [] };
      }

      if (isEditMode && routeId) {
        await mealTemplateService.update(routeId, payload);
        showSuccess('Şablon güncellendi.');
      } else {
        await mealTemplateService.create(payload);
        showSuccess('Şablon oluşturuldu. Mobil uygulamanızda da görünecek.');
      }
      navigate('/diyetisyen/sablonlar');
    } catch (err: any) {
      showError(err.message || 'Şablon kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-accent-green" size={32} />
        <span className="ml-3 text-dark-text-secondary">Şablon yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/diyetisyen/sablonlar')}
            className="p-2 rounded-lg bg-dark-card hover:bg-dark-card-hover transition-colors"
            title="Geri"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
            </h1>
            <p className="text-dark-text-secondary mt-1">
              {isEditMode
                ? 'Değişiklikler kaydedildiğinde mobil uygulamada da güncellenir.'
                : 'Şablonunuzu hazırlayın; kaydettiğinizde mobil uygulamada da kullanabileceksiniz.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setPasteOpen(true)}
            disabled={saving}
            className="btn-secondary flex items-center gap-2 border-accent-green/40 hover:border-accent-green text-accent-green"
            title="Hazır listenizi yapıştırarak öğünleri otomatik oluşturun"
          >
            <ClipboardPaste size={16} />
            Yapıştırma ile Ekle
          </button>
          {!isEditMode && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-secondary flex items-center gap-2"
              title={!name.trim() ? 'Önce şablon adını girin' : undefined}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Boş Olarak Kaydet
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
            title={!name.trim() ? 'Önce şablon adını girin' : undefined}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditMode ? 'Değişiklikleri Kaydet' : 'Şablonu Kaydet'}
          </button>
        </div>
      </motion.div>

      {/* Şablon Bilgileri */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card"
      >
        <h2 className="text-lg font-semibold mb-4">Şablon Bilgileri</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Şablon Adı <span className="text-accent-red">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError(false);
              }}
              placeholder="Örn: Akdeniz Diyeti — Standart"
              className={`input w-full ${
                nameError
                  ? 'border-accent-red focus:border-accent-red focus:ring-accent-red animate-pulse'
                  : ''
              }`}
              maxLength={100}
              aria-invalid={nameError}
              aria-required="true"
            />
            {nameError && (
              <p className="text-xs text-accent-red mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                Şablon adı zorunludur — kaydetmeden önce buraya bir ad yazın.
              </p>
            )}
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Tag size={14} /> Kategori (opsiyonel)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Örn: Akdeniz Diyeti, Düşük Karbonhidrat"
              className="input w-full"
              maxLength={60}
            />
          </div>
        </div>

        {/* Özet */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-dark-card-hover rounded-lg p-3">
            <p className="text-xs text-dark-text-secondary">Öğün</p>
            <p className="text-2xl font-bold mt-1">{meals.length}</p>
          </div>
          <div className="bg-dark-card-hover rounded-lg p-3">
            <p className="text-xs text-dark-text-secondary">Toplam Öğe</p>
            <p className="text-2xl font-bold mt-1">{totalItems}</p>
          </div>
          <div className="bg-dark-card-hover rounded-lg p-3">
            <p className="text-xs text-dark-text-secondary">Tahmini Kalori</p>
            <p className="text-2xl font-bold mt-1">{Math.round(totalCalories)} kcal</p>
          </div>
        </div>
      </motion.div>

      {/* Öğünler */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {meals.map((meal, mealIdx) => (
            <motion.div
              key={meal._key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="card"
            >
              {/* Öğün başlığı */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="p-3 rounded-lg bg-accent-green/10 text-accent-green">
                  <Utensils size={18} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-dark-text-secondary mb-1">
                    Öğün #{mealIdx + 1}
                  </p>
                  <input
                    type="text"
                    value={meal.mealType}
                    onChange={(e) =>
                      updateMeal(meal._key, { mealType: e.target.value.toUpperCase() })
                    }
                    list={`meal-types-${meal._key}`}
                    placeholder="Örn: KAHVALTI, ARA ÖĞÜN, ÖĞLE YEMEĞİ"
                    className="input w-full text-base font-semibold"
                  />
                  <datalist id={`meal-types-${meal._key}`}>
                    {MEAL_TYPE_PRESETS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateMeal(meal._key, { collapsed: !meal.collapsed })
                    }
                    className="p-2 rounded-lg hover:bg-dark-card-hover text-dark-text-secondary"
                    title={meal.collapsed ? 'Aç' : 'Kapat'}
                  >
                    {meal.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                  <button
                    onClick={() => removeMeal(meal._key)}
                    disabled={meals.length === 1}
                    className="p-2 rounded-lg hover:bg-dark-card-hover text-dark-text-secondary hover:text-accent-red transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Öğünü kaldır"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Öğeler */}
              {!meal.collapsed && (
                <div className="mt-5 space-y-3">
                  {meal.items.map((item, idx) => (
                    <div
                      key={item._key}
                      className="grid grid-cols-12 gap-2 lg:gap-3 items-start"
                    >
                      <div className="col-span-12 lg:col-span-5">
                        {idx === 0 && (
                          <label className="label hidden lg:block">Yiyecek / İçecek</label>
                        )}
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(meal._key, item._key, { name: e.target.value })
                          }
                          placeholder="Örn: Tam buğday ekmek"
                          className="input w-full"
                        />
                      </div>

                      <div className="col-span-4 lg:col-span-2">
                        {idx === 0 && (
                          <label className="label hidden lg:block">Miktar</label>
                        )}
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={item.amount}
                          onChange={(e) =>
                            updateItem(meal._key, item._key, {
                              amount: Number(e.target.value),
                            })
                          }
                          className="input w-full"
                        />
                      </div>

                      <div className="col-span-8 lg:col-span-3">
                        {idx === 0 && (
                          <label className="label hidden lg:block">Birim</label>
                        )}
                        <select
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(meal._key, item._key, {
                              unit: e.target.value as FoodUnit,
                            })
                          }
                          className="input w-full"
                        >
                          {FOOD_UNIT_OPTIONS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-10 lg:col-span-1">
                        {idx === 0 && (
                          <label className="label hidden lg:block">kcal</label>
                        )}
                        <input
                          type="number"
                          min={0}
                          value={item.calories}
                          onChange={(e) =>
                            updateItem(meal._key, item._key, {
                              calories: Number(e.target.value),
                            })
                          }
                          className="input w-full"
                          placeholder="0"
                        />
                      </div>

                      <div className="col-span-2 lg:col-span-1 flex justify-end pt-1 lg:pt-0">
                        {idx === 0 && (
                          <span className="label hidden lg:block opacity-0">.</span>
                        )}
                        <button
                          onClick={() => removeItem(meal._key, item._key)}
                          className="p-2 rounded-lg hover:bg-dark-card-hover text-dark-text-secondary hover:text-accent-red transition-all"
                          title="Öğeyi sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* displayUnit (opsiyonel ölçü adı) — küçük yardımcı */}
                      <div className="col-span-12 lg:col-span-12 -mt-1">
                        <input
                          type="text"
                          value={item.displayUnit || ''}
                          onChange={(e) =>
                            updateItem(meal._key, item._key, {
                              displayUnit: e.target.value,
                            })
                          }
                          placeholder='Spesifik ölçü adı (opsiyonel) — örn. "su bardağı", "küçük boy", "yemek kaşığı"'
                          className="input w-full text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(meal._key)}
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} /> Öğe Ekle
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addMeal}
          className="w-full text-center py-6 rounded-xl border-2 border-dashed border-accent-green/60 bg-accent-green/5 text-accent-green hover:bg-accent-green/10 hover:border-accent-green transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={20} />
          <span>Yeni Öğün Ekle</span>
        </button>
      </div>

      {/* Bilgi notu */}
      <div className="card bg-accent-blue/10 border-accent-blue/30 flex items-start gap-3">
        <AlertCircle className="text-accent-blue flex-shrink-0" size={20} />
        <div className="text-sm text-dark-text-secondary leading-relaxed">
          Şablonlar mobil uygulamada da görünür ve diyet planı oluştururken hızlıca eklenebilir.
          Aynı şablon adıyla birden çok kayıt oluşturabilir, kategori vererek listeyi düzenli
          tutabilirsiniz. <span className="text-dark-text">İpucu:</span> "Spesifik ölçü adı"
          alanını doldurursanız (örn. <span className="text-accent-blue">"su bardağı"</span>),
          mobilde danışana gösterilen birim daha doğal görünür.
        </div>
      </div>

      <PasteMealsModal
        isOpen={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onApply={handlePasteApply}
        hasExistingMeals={hasNonEmptyMeals}
      />
    </div>
  );
}
