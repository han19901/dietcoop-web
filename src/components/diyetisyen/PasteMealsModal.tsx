import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wand2,
  ClipboardPaste,
  Calendar,
  Hash,
  AlignLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
  Trash2,
  Utensils,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/context/ToastContext';
import {
  parseMealPlanText,
  ParsedMealPlan,
} from '@/services/utils/mealPlanParser';

const FORMAT_TEMPLATES = {
  numbered: {
    label: 'Numaralı Gün',
    description: 'Gün 1, Gün 2, ...',
    icon: Hash,
    text: `Gün 1:
KAHVALTI:
1 su bardağı süt
2 dilim tam buğday ekmek
1 adet haşlanmış yumurta

ARA ÖĞÜN:
1 orta boy elma + 6 adet badem

ÖĞLE YEMEĞİ:
150 gr ızgara tavuk göğsü
1 kase mevsim salata
4 yemek kaşığı bulgur pilavı

AKŞAM YEMEĞİ:
1 porsiyon sebze yemeği
1 kase yoğurt

Gün 2:
KAHVALTI:
...`,
  },
  weekday: {
    label: 'Gün Adı',
    description: 'Pazartesi, Salı, ...',
    icon: Calendar,
    text: `Pazartesi:
KAHVALTI:
1 su bardağı süt
2 dilim peynir
5 adet zeytin

ÖĞLE YEMEĞİ:
150 gr ızgara somon
1 kase yeşillik

İKİNDİ:
1 avuç kuruyemiş

AKŞAM YEMEĞİ:
1 kase çorba
1 porsiyon sebze yemeği

Salı:
KAHVALTI:
...`,
  },
  simple: {
    label: 'Sadece Öğünler',
    description: 'Gün başlığı yok',
    icon: AlignLeft,
    text: `KAHVALTI:
2 dilim tam buğday ekmek
1 yumurta
1 dilim peynir

ARA ÖĞÜN:
1 elma

ÖĞLE YEMEĞİ:
150 gr tavuk
1 kase salata

AKŞAM YEMEĞİ:
1 porsiyon sebze yemeği
1 kase yoğurt`,
  },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (parsed: ParsedMealPlan) => void;
  hasExistingMeals: boolean;
}

export default function PasteMealsModal({ isOpen, onClose, onApply, hasExistingMeals }: Props) {
  const { showError } = useToast();

  const [pastedText, setPastedText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedMealPlan | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const livePreview = useMemo(() => {
    if (!pastedText.trim()) return null;
    const lines = pastedText.split('\n');
    let dayCount = 0;
    let mealCount = 0;
    let itemLineCount = 0;

    const dayRegex =
      /(g[üu]n\s*\d+|day\s*\d+|^\s*\d+\s*[.\-]?\s*g[üu]n|^(pazartesi|sal[iı]|[çc]ar[şs]amba|per[şs]embe|cuma|cumartesi|pazar|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b)/i;
    const mealRegex =
      /\b(KAHVALTI|KAHVALTİ|SABAH|ARA\s*Ö[ĞG]Ü?N|ARA|İKİNDİ|IKINDI|KU[ŞS]LUK|ATI[ŞS]TIRMA|SNACK|Ö[ĞG]LE|OGLE|LUNCH|AK[ŞS]AM|AKSAM|DINNER|BREAKFAST)\s*:/i;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (dayRegex.test(trimmed)) {
        dayCount++;
      } else if (mealRegex.test(trimmed)) {
        mealCount++;
      } else if (/[a-zA-Z0-9çğıöşü]/.test(trimmed)) {
        itemLineCount++;
      }
    });

    return { dayCount, mealCount, itemLineCount };
  }, [pastedText]);

  const handleParse = () => {
    if (!pastedText.trim()) {
      showError('Lütfen önce öğün listesini yapıştırın.');
      return;
    }

    setParsing(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const endDate = format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      );
      const result = parseMealPlanText(
        pastedText,
        today,
        endDate,
        undefined, // otomatik tespit
        true // template mode
      );

      const totalMeals = result.parsedDays.reduce((s, d) => s + d.meals.length, 0);
      if (totalMeals === 0) {
        showError(
          "Yapıştırılan metin anlaşılamadı. 'KAHVALTI:', 'ARA ÖĞÜN:', 'ÖĞLE YEMEĞİ:', 'AKŞAM YEMEĞİ:' gibi başlıklar veya 'Gün 1:' / 'Pazartesi:' gibi gün başlıkları kullanın."
        );
        setParsed(null);
        return;
      }
      setParsed(result);
    } catch (err: any) {
      showError(err.message || 'Yapıştırma çözümlenirken bir hata oluştu.');
    } finally {
      setParsing(false);
    }
  };

  const totalParsedMeals =
    parsed?.parsedDays.reduce((s, d) => s + d.meals.length, 0) || 0;
  const totalParsedItems =
    parsed?.parsedDays.reduce(
      (s, d) => s + d.meals.reduce((ss, m) => ss + m.items.length, 0),
      0
    ) || 0;

  const handleConfirmApply = () => {
    if (!parsed) return;
    if (hasExistingMeals && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onApply(parsed);
    handleClose();
  };

  const handleClose = () => {
    if (parsing) return;
    setPastedText('');
    setParsed(null);
    setConfirmReplace(false);
    onClose();
  };

  const handleClear = () => {
    setPastedText('');
    setParsed(null);
    setConfirmReplace(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="card w-full max-w-4xl my-8 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-dark-card-hover">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-lg bg-accent-green/15 text-accent-green">
                  <ClipboardPaste size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Öğünleri Yapıştır</h3>
                  <p className="text-sm text-dark-text-secondary mt-1">
                    Hazır listenizi yapıştırın; sistem öğünleri otomatik tanıyıp şablon
                    formatına çevirsin.
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={parsing}
                className="p-2 rounded-lg hover:bg-dark-card-hover text-dark-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto -mr-2 pr-2 mt-4 flex-1">
              {/* Hazır format şablonları */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles size={16} className="text-accent-green" />
                  Hızlı Başlangıç — Bir formatla başla
                </h4>
                <p className="text-sm text-dark-text-secondary mb-3">
                  Aşağıdaki butonlardan birini seçince örnek format yapıştırılır; sonra
                  kendi içeriğinizle değiştirebilirsiniz.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(FORMAT_TEMPLATES).map(([key, tpl]) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (
                            pastedText.trim() &&
                            !window.confirm(
                              'Yapıştırma alanında zaten bir metin var. Bu örnekle değiştirilsin mi?'
                            )
                          ) {
                            return;
                          }
                          setPastedText(tpl.text);
                          setParsed(null);
                        }}
                        className="bg-accent-green/10 border border-accent-green/40 hover:border-accent-green rounded-lg p-3 text-center transition-all"
                      >
                        <Icon size={20} className="mx-auto text-accent-green" />
                        <div className="font-semibold text-sm mt-1.5">{tpl.label}</div>
                        <div className="text-xs text-dark-text-secondary mt-0.5">
                          {tpl.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <div className="mt-5">
                <label className="label flex items-center justify-between">
                  <span>Öğün Listesi</span>
                  {pastedText && (
                    <button
                      onClick={handleClear}
                      className="text-xs text-dark-text-secondary hover:text-accent-red flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Temizle
                    </button>
                  )}
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    setParsed(null);
                    setConfirmReplace(false);
                  }}
                  rows={12}
                  placeholder={`Gün 1:\nKAHVALTI:\n1 su bardağı süt\n2 dilim tam buğday ekmek\n...`}
                  className="input w-full font-mono text-sm leading-relaxed resize-y min-h-[220px]"
                />
                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <span className="text-xs text-dark-text-secondary">
                    {pastedText.length} karakter
                  </span>
                  {livePreview &&
                    (livePreview.dayCount > 0 ||
                      livePreview.mealCount > 0 ||
                      livePreview.itemLineCount > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {livePreview.dayCount > 0 && (
                          <span className="badge badge-success inline-flex items-center gap-1">
                            <Calendar size={11} />
                            {livePreview.dayCount} gün
                          </span>
                        )}
                        {livePreview.mealCount > 0 && (
                          <span className="badge badge-success inline-flex items-center gap-1">
                            <Utensils size={11} />
                            {livePreview.mealCount} öğün
                          </span>
                        )}
                        {livePreview.itemLineCount > 0 && (
                          <span className="badge badge-info inline-flex items-center gap-1">
                            ~{livePreview.itemLineCount} öğe
                          </span>
                        )}
                      </div>
                    )}
                </div>
                {livePreview &&
                  livePreview.dayCount === 0 &&
                  livePreview.mealCount === 0 &&
                  pastedText.length > 50 && (
                    <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Hiç gün veya öğün başlığı algılanmadı. "Gün 1:" veya "KAHVALTI:" gibi
                      başlıklar eklemeyi deneyin.
                    </p>
                  )}
              </div>

              {/* Önizleme */}
              {parsed && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Önizleme</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-success">
                        {parsed.parsedDays.length} gün
                      </span>
                      <span className="badge badge-success">{totalParsedMeals} öğün</span>
                      <span className="badge badge-info">{totalParsedItems} öğe</span>
                    </div>
                  </div>

                  {parsed.warnings.length > 0 && (
                    <div className="card bg-yellow-500/10 border-yellow-500/30 py-3 px-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={16}
                          className="text-yellow-500 mt-0.5 flex-shrink-0"
                        />
                        <div className="text-sm text-dark-text-secondary space-y-1">
                          {parsed.warnings.slice(0, 4).map((w, i) => (
                            <div key={i}>{w}</div>
                          ))}
                          {parsed.warnings.length > 4 && (
                            <div className="opacity-70">
                              ...ve {parsed.warnings.length - 4} uyarı daha
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Günler / öğünler dökümü — birden fazla gün varsa hepsi şablonun
                      öğün listesine eklenir, sıralı şekilde */}
                  <div className="space-y-3 max-h-[260px] overflow-y-auto">
                    {parsed.parsedDays.map((day) => (
                      <div
                        key={day.dayNumber || day.date}
                        className="bg-dark-card-hover rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            Gün {day.dayNumber || '?'}
                          </span>
                          <span className="text-xs text-dark-text-secondary">
                            {day.meals.length} öğün
                          </span>
                        </div>
                        <div className="space-y-1">
                          {day.meals.map((meal, i) => (
                            <div key={i} className="text-xs text-dark-text-secondary">
                              <span className="text-accent-green font-semibold">
                                {meal.mealType}:
                              </span>{' '}
                              {meal.items.length > 0
                                ? meal.items
                                    .slice(0, 4)
                                    .map((it) => it.name)
                                    .join(', ') +
                                  (meal.items.length > 4 ? '...' : '')
                                : '(boş)'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {parsed.parsedDays.length > 1 && (
                    <p className="text-xs text-dark-text-secondary">
                      Birden çok gün algılandı. Tüm günlerin öğünleri tek bir şablonda
                      sıralı olarak (her günün öğünleri ardışık) yer alacak — tıpkı mobil
                      uygulamadaki gibi.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-dark-card-hover mt-4 flex-wrap">
              <div className="text-xs text-dark-text-secondary">
                💡 KAHVALTI / ARA ÖĞÜN / ÖĞLE YEMEĞİ / AKŞAM YEMEĞİ • "Pazartesi:" • "1 su
                bardağı", "150 gr", "yarım", "½", "1-2"
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleClose}
                  disabled={parsing}
                  className="btn-secondary"
                >
                  Vazgeç
                </button>
                {parsed ? (
                  confirmReplace && hasExistingMeals ? (
                    <button onClick={handleConfirmApply} className="btn-danger flex items-center gap-2">
                      <AlertTriangle size={16} /> Mevcutu sil ve uygula
                    </button>
                  ) : (
                    <button onClick={handleConfirmApply} className="btn-primary flex items-center gap-2">
                      <Sparkles size={16} />
                      Şablona Uygula
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleParse}
                    disabled={parsing || !pastedText.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    {parsing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Wand2 size={16} />
                    )}
                    Çözümle ve Önizle
                  </button>
                )}
              </div>
            </div>
            {confirmReplace && hasExistingMeals && (
              <p className="text-xs text-yellow-500 mt-2 text-right">
                Şablonda zaten öğün var. Uygulanırsa mevcut öğünler silinip yapıştırılan
                metinden gelenlerle değiştirilir.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
