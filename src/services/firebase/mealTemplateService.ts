import { auth } from './config';
import {
  MealTemplate,
  MealTemplateInput,
  MealTemplateMeal,
} from '@/types/mealTemplate';

const CLOUD_FUNCTIONS_URL =
  import.meta.env.VITE_CLOUD_FUNCTIONS_URL ||
  'https://us-central1-webdietcoop.cloudfunctions.net';

/**
 * Cloud Function çağrısı yapan ortak yardımcı.
 * - Web panel id token'ını Authorization: Bearer header'ında gönderir.
 * - Cloud Function bu token'ı doğrulayıp uid'i dietitianId olarak kullanır,
 *   ardından mobil Firebase projesine (dietcoop-432fa) okuma/yazma yapar.
 */
async function callFunction<T = any>(
  functionName: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: any; query?: Record<string, string> } = {}
): Promise<T> {
  const { method = 'POST', body, query } = options;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Giriş yapmış kullanıcı bulunamadı. Lütfen tekrar giriş yapın.');
  }
  const idToken = await currentUser.getIdToken();

  let url = `${CLOUD_FUNCTIONS_URL}/${functionName}`;
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  };
  if (body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const text = await response.text();

  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Geçersiz sunucu yanıtı: ${text.slice(0, 200)}`);
    }
  }

  if (!response.ok) {
    const message = json?.error || `İstek başarısız oldu (HTTP ${response.status})`;
    throw new Error(message);
  }

  return json as T;
}

export const mealTemplateService = {
  async list(): Promise<MealTemplate[]> {
    const result = await callFunction<{ templates: MealTemplate[] }>(
      'listMealTemplates',
      { method: 'POST', body: {} }
    );
    return result.templates || [];
  },

  async get(templateId: string): Promise<MealTemplate> {
    const result = await callFunction<{ template: MealTemplate }>(
      'getMealTemplate',
      { method: 'POST', body: { templateId } }
    );
    return result.template;
  },

  async create(input: MealTemplateInput): Promise<string> {
    const result = await callFunction<{ templateId: string }>(
      'createMealTemplate',
      { method: 'POST', body: input }
    );
    return result.templateId;
  },

  async update(
    templateId: string,
    input: MealTemplateInput
  ): Promise<void> {
    await callFunction('updateMealTemplate', {
      method: 'POST',
      body: { templateId, ...input },
    });
  },

  async delete(templateId: string): Promise<void> {
    await callFunction('deleteMealTemplate', {
      method: 'POST',
      body: { templateId },
    });
  },
};

/**
 * Mobil tarafındaki MealTemplateService.createTemplate ile aynı temizleme:
 * mealNumber'ları her gün için 1'den başlatır ve undefined alanları temizler.
 */
export function normalizeMealsForSave(meals: MealTemplateMeal[]): MealTemplateMeal[] {
  return meals
    .filter((m) => m.items.length > 0)
    .map((meal, index) => ({
      mealType: meal.mealType,
      mealNumber: index + 1,
      items: meal.items.map((item) => ({
        name: item.name.trim(),
        amount: Number(item.amount) || 0,
        unit: item.unit,
        calories: Number(item.calories) || 0,
        ...(item.displayUnit && item.displayUnit.trim()
          ? { displayUnit: item.displayUnit.trim() }
          : {}),
      })),
    }));
}
