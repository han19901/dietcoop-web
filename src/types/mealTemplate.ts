// Mobil tarafındaki FoodUnit ile birebir aynı (dietcoop-432fa Firestore'da bu değerler kullanılır)
export type FoodUnit =
  | 'gram'
  | 'ml'
  | 'adet'
  | 'dilim'
  | 'kase'
  | 'bardak'
  | 'porsiyon'
  | 'kasik';

export const FOOD_UNIT_OPTIONS: { value: FoodUnit; label: string }[] = [
  { value: 'gram', label: 'gram (gr)' },
  { value: 'ml', label: 'mililitre (ml)' },
  { value: 'adet', label: 'adet' },
  { value: 'dilim', label: 'dilim' },
  { value: 'kase', label: 'kase' },
  { value: 'bardak', label: 'bardak / fincan / kupa' },
  { value: 'kasik', label: 'kaşık' },
  { value: 'porsiyon', label: 'porsiyon' },
];

// Mobil tarafının kullandığı varsayılan öğün başlıkları
export const MEAL_TYPE_PRESETS = [
  'KAHVALTI',
  'ARA ÖĞÜN',
  'ÖĞLE YEMEĞİ',
  'AKŞAM YEMEĞİ',
] as const;

export interface MealTemplateItem {
  name: string;
  amount: number;
  unit: FoodUnit;
  calories: number;
  /** Spesifik Türkçe ölçü adı (örn. "su bardağı"). UI'da unit yerine bu gösterilir. */
  displayUnit?: string;
}

export interface MealTemplateMeal {
  mealType: string; // KAHVALTI, ARA ÖĞÜN, ...
  mealNumber: number; // Gün içindeki sıra (1'den başlar)
  items: MealTemplateItem[];
}

export interface MealTemplate {
  id: string;
  name: string;
  category?: string | null;
  dietitianId: string;
  meals: MealTemplateMeal[];
  createdAt: string | null; // ISO string (Cloud Function dönüşü)
  updatedAt: string | null;
}

export interface MealTemplateInput {
  name: string;
  category?: string | null;
  meals: MealTemplateMeal[];
}
