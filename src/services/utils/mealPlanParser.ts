/**
 * Mobil tarafındaki `DietCoop-Mobile/src/services/mealPlanParser.ts` dosyasının
 * web port'u. Web tarafındaki şablon "Yapıştırma ile Ekle" akışı için
 * `parseMealPlanText` template modunda kullanılır.
 *
 * Mantık birebir aynı korunmuştur. Sadece şu değişiklikler yapılmıştır:
 *  - `FoodUnit` enum yerine string literal type (web tarafında string union)
 *  - `parseMeasurement` / `convertToFoodUnit` `@/services/utils/measurementLookup`'dan import edilir
 */
import { parse, format, eachDayOfInterval } from 'date-fns';
import { parseMeasurement, convertToFoodUnit } from './measurementLookup';
import type { FoodUnit } from '@/types/mealTemplate';

export interface ParsedMealItem {
  name: string;
  amount: number;
  unit: FoodUnit;
  displayUnit?: string;
  convertedAmount?: number;
  convertedUnit?: string;
  description?: string;
  calories?: number;
  originalText: string;
}

export interface ParsedMeal {
  mealType: string;
  mealNumber: number | null;
  globalMealNumber?: number;
  items: ParsedMealItem[];
  isComplete: boolean;
  originalText: string;
}

export interface ParsedDay {
  dayNumber: number | null;
  date: string;
  meals: ParsedMeal[];
  isComplete: boolean;
  missingMeals: number[];
}

export interface ParsedMealPlan {
  totalDays: number;
  parsedDays: ParsedDay[];
  missingDays: number[];
  warnings: string[];
  expectedMealCount: number;
}

const mealCategoryKeywords: Record<string, string> = {
  KAHVALTI: 'KAHVALTI',
  KAHVALTİ: 'KAHVALTI',
  KAHVALTİSİ: 'KAHVALTI',
  SABAH: 'KAHVALTI',
  'SABAH KAHVALTISI': 'KAHVALTI',
  BREAKFAST: 'KAHVALTI',
  MORNING: 'KAHVALTI',
  'ARA ÖĞÜN': 'ARA ÖĞÜN',
  'ARA OGUN': 'ARA ÖĞÜN',
  ARAÖĞÜN: 'ARA ÖĞÜN',
  ARA: 'ARA ÖĞÜN',
  İKİNDİ: 'ARA ÖĞÜN',
  IKINDI: 'ARA ÖĞÜN',
  KUŞLUK: 'ARA ÖĞÜN',
  KUSLUK: 'ARA ÖĞÜN',
  ATIŞTIRMALIK: 'ARA ÖĞÜN',
  ATISTIRMALIK: 'ARA ÖĞÜN',
  ATIŞTIRMA: 'ARA ÖĞÜN',
  ATISTIRMA: 'ARA ÖĞÜN',
  'GECE ATIŞTIRMASI': 'ARA ÖĞÜN',
  GECE: 'ARA ÖĞÜN',
  SNACK: 'ARA ÖĞÜN',
  SNACKS: 'ARA ÖĞÜN',
  'ÖĞLE YEMEĞİ': 'ÖĞLE YEMEĞİ',
  'OGLE YEMEGI': 'ÖĞLE YEMEĞİ',
  'ÖĞLEN YEMEĞİ': 'ÖĞLE YEMEĞİ',
  'OGLEN YEMEGI': 'ÖĞLE YEMEĞİ',
  ÖĞLE: 'ÖĞLE YEMEĞİ',
  ÖĞLEN: 'ÖĞLE YEMEĞİ',
  OGLE: 'ÖĞLE YEMEĞİ',
  OGLEN: 'ÖĞLE YEMEĞİ',
  LUNCH: 'ÖĞLE YEMEĞİ',
  NOON: 'ÖĞLE YEMEĞİ',
  'AKŞAM YEMEĞİ': 'AKŞAM YEMEĞİ',
  'AKSAM YEMEGI': 'AKŞAM YEMEĞİ',
  AKŞAM: 'AKŞAM YEMEĞİ',
  AKSAM: 'AKŞAM YEMEĞİ',
  DINNER: 'AKŞAM YEMEĞİ',
  EVENING: 'AKŞAM YEMEĞİ',
  SUPPER: 'AKŞAM YEMEĞİ',
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MEAL_HEADER_PATTERNS = (() => {
  const keywords = Object.keys(mealCategoryKeywords).sort((a, b) => b.length - a.length);
  const alternation = keywords.map(escapeRegex).join('|');
  return {
    headerOnlyRegex: new RegExp(
      `^\\s*(?:\\d+\\s*[.\\-)]\\s*)?(?:${alternation})\\s*[:：]?\\s*$`,
      'i'
    ),
    headerPrefixRegex: new RegExp(
      `^\\s*(?:\\d+\\s*[.\\-)]\\s*)?(?:${alternation})\\s*[:：]\\s*`,
      'i'
    ),
  };
})();

const dayNameToNumber: Record<string, number> = {
  pazartesi: 1,
  salı: 2,
  sali: 2,
  çarşamba: 3,
  carsamba: 3,
  perşembe: 4,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
  pazar: 7,
  pzt: 1,
  pts: 1,
  sal: 2,
  çar: 3,
  car: 3,
  crş: 3,
  crs: 3,
  per: 4,
  prş: 4,
  prs: 4,
  cum: 5,
  cmt: 6,
  cts: 6,
  paz: 7,
  pzr: 7,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
  mon: 1,
  tue: 2,
  tues: 2,
  wed: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

function detectDayNumber(line: string): number | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const turkishDayMatch = trimmed.match(/g[üu]n\s*(\d+)/i);
  if (turkishDayMatch) return parseInt(turkishDayMatch[1]);

  const reverseDayMatch = trimmed.match(/^(\d+)\s*[.\-]?\s*g[üu]n/i);
  if (reverseDayMatch) return parseInt(reverseDayMatch[1]);

  const englishDayMatch = trimmed.match(/^day\s*(\d+)/i);
  if (englishDayMatch) return parseInt(englishDayMatch[1]);

  if (trimmed.length <= 30) {
    const firstWord = trimmed
      .toLowerCase()
      .replace(/[:.\-,;()]/g, ' ')
      .trim()
      .split(/\s+/)[0];
    if (firstWord && dayNameToNumber[firstWord] !== undefined) {
      const wordCount = trimmed.split(/\s+/).length;
      const endsWithColon = /[:：]\s*$/.test(trimmed);
      if (endsWithColon || wordCount <= 3) {
        return dayNameToNumber[firstWord];
      }
    }
  }

  return null;
}

export function parseMealPlanText(
  text: string,
  planStartDate: string,
  planEndDate: string,
  expectedDailyMealCount?: number,
  isTemplateMode?: boolean
): ParsedMealPlan {
  const startDate = parse(planStartDate, 'yyyy-MM-dd', new Date());
  const endDate = parse(planEndDate, 'yyyy-MM-dd', new Date());

  const allDates = isTemplateMode ? [] : eachDayOfInterval({ start: startDate, end: endDate });
  const dateStrings = allDates.map((date) => format(date, 'yyyy-MM-dd'));
  const totalDays = isTemplateMode
    ? 999999
    : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let detectedDailyMealCount = expectedDailyMealCount;

  const lines = text.split('\n').map((line) => line.trim());

  const parsedDays: ParsedDay[] = [];
  const warnings: string[] = [];

  const dayNumbers: Map<number, number> = new Map();

  lines.forEach((line, index) => {
    const dayNum = detectDayNumber(line);
    if (dayNum !== null) {
      dayNumbers.set(index, dayNum);
    }
  });

  const mealGroups: Array<{
    startLine: number;
    endLine: number;
    mealType: string;
    dayNumber?: number;
  }> = [];
  let currentGroup: { startLine: number; endLine?: number; mealType: string; dayNumber?: number } | null = null;
  let currentDayNumber: number | undefined = undefined;

  lines.forEach((line, index) => {
    const upperLine = line.toUpperCase();

    const detectedDayNum = detectDayNumber(line);
    if (detectedDayNum !== null) {
      currentDayNumber = detectedDayNum;
      if (currentGroup) {
        mealGroups.push({
          ...currentGroup,
          endLine: index - 1,
          dayNumber: currentGroup.dayNumber || currentDayNumber,
        });
        currentGroup = null;
      }
      return;
    }

    if (!line.trim()) {
      if (currentGroup) {
        mealGroups.push({ ...currentGroup, endLine: index - 1 });
        currentGroup = null;
      }
      return;
    }

    let foundMealType: string | null = null;
    for (const [keyword, mealType] of Object.entries(mealCategoryKeywords)) {
      if (upperLine.includes(keyword.toUpperCase()) && upperLine.includes(':')) {
        foundMealType = mealType;
        break;
      }
    }

    if (foundMealType) {
      if (currentGroup) {
        mealGroups.push({ ...currentGroup, endLine: index - 1 });
      }
      currentGroup = {
        startLine: index,
        mealType: foundMealType,
        dayNumber: currentDayNumber || dayNumbers.get(index) || undefined,
      };
    } else if (currentGroup) {
      currentGroup = { ...currentGroup, endLine: index };
    } else {
      if (index === 0 || !currentGroup) {
        currentGroup = {
          startLine: index,
          mealType: 'KAHVALTI',
          dayNumber: currentDayNumber || dayNumbers.get(index) || undefined,
        };
      }
    }
  });

  if (currentGroup) {
    const cg = currentGroup as { startLine: number; endLine?: number; mealType: string; dayNumber?: number };
    mealGroups.push({ ...cg, endLine: lines.length - 1 });
  }

  const hasDayNumbers = dayNumbers.size > 0;

  if (hasDayNumbers) {
    const daysMap = new Map<number, ParsedDay>();

    mealGroups.forEach((group) => {
      const dayNum = group.dayNumber;
      if (dayNum && dayNum <= totalDays && !daysMap.has(dayNum)) {
        const date = dateStrings[dayNum - 1];
        daysMap.set(dayNum, {
          dayNumber: dayNum,
          date,
          meals: [],
          isComplete: false,
          missingMeals: [],
        });
      }
    });

    let currentDayNum = 1;
    let lastMealType: string | null = null;

    mealGroups.forEach((group) => {
      let dayNum = group.dayNumber;

      if (dayNum) {
        currentDayNum = dayNum;
      } else {
        dayNum = currentDayNum;

        if (group.mealType === 'KAHVALTI' && lastMealType === 'KAHVALTI') {
          dayNum = Math.max(1, currentDayNum - 1);
          const day = daysMap.get(dayNum);
          if (day) {
            const mealLines = lines.slice(group.startLine + 1, (group.endLine ?? group.startLine) + 1);
            const items = parseMealItems(mealLines);

            day.meals.unshift({
              mealType: group.mealType,
              mealNumber: null,
              items,
              isComplete: items.length > 0,
              originalText: lines.slice(group.startLine, (group.endLine ?? group.startLine) + 1).join('\n'),
            });
            lastMealType = group.mealType;
            return;
          }
        } else if (group.mealType === 'KAHVALTI' && lastMealType !== 'KAHVALTI') {
          currentDayNum = currentDayNum + 1;
          dayNum = currentDayNum;
        }
      }

      lastMealType = group.mealType;

      if (dayNum) {
        if (!daysMap.has(dayNum)) {
          const date = isTemplateMode
            ? format(new Date(startDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
            : dateStrings[dayNum - 1] ||
              format(new Date(startDate.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
          daysMap.set(dayNum, {
            dayNumber: dayNum,
            date,
            meals: [],
            isComplete: false,
            missingMeals: [],
          });
        }

        const day = daysMap.get(dayNum)!;
        const mealLines = lines.slice(group.startLine, (group.endLine ?? group.startLine) + 1);
        const items = parseMealItems(mealLines);

        day.meals.push({
          mealType: group.mealType,
          mealNumber: null,
          items,
          isComplete: items.length > 0,
          originalText: lines.slice(group.startLine, (group.endLine ?? group.startLine) + 1).join('\n'),
        });
      }
    });

    let globalMealNumber = 1;
    const sortedDays = Array.from(daysMap.values()).sort(
      (a, b) => (a.dayNumber || 0) - (b.dayNumber || 0)
    );

    if (!detectedDailyMealCount) {
      const maxMealsInDay = Math.max(...sortedDays.map((day) => day.meals.length), 0);
      detectedDailyMealCount = maxMealsInDay || 4;
    }

    sortedDays.forEach((day) => {
      assignMealNumbers(day);

      day.meals
        .filter((meal) => meal.mealNumber !== null)
        .sort((a, b) => (a.mealNumber || 0) - (b.mealNumber || 0))
        .forEach((meal) => {
          meal.globalMealNumber = globalMealNumber++;
        });

      checkDayCompleteness(day, detectedDailyMealCount!);
    });

    parsedDays.push(...sortedDays);
  } else {
    let currentDayIndex = 0;
    let lastMealType: string | null = null;

    const breakfastCount = mealGroups.filter((g) => g.mealType === 'KAHVALTI').length;

    if (!detectedDailyMealCount && breakfastCount > 0) {
      const totalMealCount = mealGroups.length;
      detectedDailyMealCount = Math.ceil(totalMealCount / breakfastCount) || 4;
    } else if (!detectedDailyMealCount) {
      detectedDailyMealCount = 4;
    }

    mealGroups.forEach((group) => {
      if (group.mealType === 'KAHVALTI' && lastMealType !== 'KAHVALTI') {
        currentDayIndex++;
        if (currentDayIndex > totalDays) {
          warnings.push(`Plan süresinden fazla gün bulundu. Sadece ilk ${totalDays} gün parse edildi.`);
          return;
        }
      }

      if (currentDayIndex === 0 && parsedDays.length === 0) {
        currentDayIndex = 1;
      }

      const dayIdx = Math.max(0, currentDayIndex - 1);

      if (!isTemplateMode && dayIdx >= dateStrings.length) {
        warnings.push('Plan süresinden fazla gün bulundu');
        return;
      }

      const date = isTemplateMode
        ? format(new Date(startDate.getTime() + dayIdx * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        : dateStrings[dayIdx] ||
          format(new Date(startDate.getTime() + dayIdx * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      let day = parsedDays.find((d) => d.date === date);

      if (!day) {
        day = {
          dayNumber: dayIdx + 1,
          date,
          meals: [],
          isComplete: false,
          missingMeals: [],
        };
        parsedDays.push(day);
      }

      const mealLines = lines.slice(group.startLine, (group.endLine ?? group.startLine) + 1);
      const items = parseMealItems(mealLines);

      day.meals.push({
        mealType: group.mealType,
        mealNumber: null,
        items,
        isComplete: items.length > 0,
        originalText: lines.slice(group.startLine, (group.endLine ?? group.startLine) + 1).join('\n'),
      });

      lastMealType = group.mealType;
    });

    let globalMealNumber = 1;
    parsedDays
      .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
      .forEach((day) => {
        assignMealNumbers(day);

        day.meals
          .filter((meal) => meal.mealNumber !== null)
          .sort((a, b) => (a.mealNumber || 0) - (b.mealNumber || 0))
          .forEach((meal) => {
            meal.globalMealNumber = globalMealNumber++;
          });

        checkDayCompleteness(day, detectedDailyMealCount || 4);
      });
  }

  const parsedDates = new Set(parsedDays.map((d) => d.date));
  const missingDays: number[] = [];

  if (!isTemplateMode) {
    dateStrings.forEach((date, index) => {
      if (!parsedDates.has(date)) {
        missingDays.push(index + 1);
      }
    });
  }

  const finalTotalDays = isTemplateMode ? parsedDays.length : totalDays;

  const totalMealsParsed = parsedDays.reduce((sum, d) => sum + d.meals.length, 0);
  const totalItemsParsed = parsedDays.reduce(
    (sum, d) => sum + d.meals.reduce((s, m) => s + m.items.length, 0),
    0
  );

  if (totalMealsParsed === 0) {
    warnings.push(
      "Hiç öğün başlığı bulunamadı. Lütfen 'KAHVALTI:', 'ARA ÖĞÜN:', 'ÖĞLE YEMEĞİ:', 'AKŞAM YEMEĞİ:' gibi kategori başlıkları kullanın."
    );
  }

  const emptyMeals: string[] = [];
  parsedDays.forEach((day) => {
    day.meals.forEach((meal) => {
      if (meal.items.length === 0) {
        emptyMeals.push(`Gün ${day.dayNumber} - ${meal.mealType}`);
      }
    });
  });
  if (emptyMeals.length > 0 && emptyMeals.length <= 5) {
    warnings.push(`İçeriği bulunamayan öğünler: ${emptyMeals.join(', ')}.`);
  } else if (emptyMeals.length > 5) {
    warnings.push(
      `${emptyMeals.length} öğünde içerik bulunamadı. İlk birkaçı: ${emptyMeals.slice(0, 3).join(', ')}…`
    );
  }

  if (parsedDays.length > 1) {
    const mealCounts = parsedDays.map((d) => d.meals.length);
    const minMeals = Math.min(...mealCounts);
    const maxMeals = Math.max(...mealCounts);
    if (maxMeals - minMeals >= 2) {
      warnings.push(
        `Günlük öğün sayısı tutarsız: en az ${minMeals}, en çok ${maxMeals} öğün. Lütfen önizlemeyi kontrol edin.`
      );
    }
  }

  let fallbackItemCount = 0;
  parsedDays.forEach((d) =>
    d.meals.forEach((m) =>
      m.items.forEach((it) => {
        if (it.unit === 'adet' && it.description?.startsWith('Aralık:')) {
          fallbackItemCount++;
        }
      })
    )
  );
  if (totalItemsParsed > 0 && fallbackItemCount / totalItemsParsed > 0.3) {
    warnings.push(
      `${fallbackItemCount} öğenin miktarı/birimi tam anlaşılamadı. Önizlemeden manuel düzeltebilirsiniz.`
    );
  }

  return {
    totalDays: finalTotalDays,
    parsedDays: parsedDays.sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0)),
    missingDays,
    warnings,
    expectedMealCount: detectedDailyMealCount || 4,
  };
}

function parseMealItems(lines: string[]): ParsedMealItem[] {
  const items: ParsedMealItem[] = [];

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    if (MEAL_HEADER_PATTERNS.headerOnlyRegex.test(trimmedLine)) continue;

    let cleanLine = trimmedLine.replace(MEAL_HEADER_PATTERNS.headerPrefixRegex, '').trim();

    cleanLine = cleanLine
      .replace(/^[-•*▪→·▶►–—]+\s*/, '')
      .replace(/^\d+\s*[.)]\s+/, '')
      .replace(/^[a-zçğıöşü]\s*[.)]\s+/i, '')
      .replace(/,\s*$/, '')
      .trim();

    if (!cleanLine) continue;

    const parsedItems = parseMealLine(cleanLine);
    for (const item of parsedItems) {
      if (item) items.push(item);
    }
  }

  return items;
}

function parseMealLine(line: string): ParsedMealItem[] {
  const items: ParsedMealItem[] = [];

  const caloriePatterns = [
    /(?:\(|[-–—])\s*(\d+)\s*(?:kcal|kalori|cal)/i,
    /(\d+)\s*(?:kcal|kalori|cal)/i,
    /(?:kcal|kalori|cal)\s*[:=]\s*(\d+)/i,
  ];

  let calories: number | undefined = undefined;
  for (const pattern of caloriePatterns) {
    const match = line.match(pattern);
    if (match) {
      calories = parseInt(match[1]);
      break;
    }
  }

  let cleanLine = line
    .replace(/(?:\(|[-–—])\s*\d+\s*(?:kcal|kalori|cal)\s*\)?/gi, '')
    .replace(/\d+\s*(?:kcal|kalori|cal)/gi, '')
    .replace(/(?:kcal|kalori|cal)\s*[:=]\s*\d+/gi, '')
    .trim();

  const parts = splitLineIntoItems(cleanLine);

  parts.forEach((part) => {
    const trimmedPart = part.trim();
    if (!trimmedPart) return;
    const parsedItem = parseSingleItemSimple(trimmedPart, calories, line);
    if (parsedItem) {
      if (!parsedItem.name || !parsedItem.name.trim()) {
        parsedItem.name = trimmedPart;
      }
      items.push(parsedItem);
    }
  });

  return items;
}

function splitLineIntoItems(line: string): string[] {
  if (line.includes('+')) {
    const result: string[] = [];
    let currentPart = '';
    let parenDepth = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '(') {
        parenDepth++;
        currentPart += char;
      } else if (char === ')') {
        parenDepth--;
        currentPart += char;
      } else if (char === '+' && parenDepth === 0) {
        if (currentPart.trim()) {
          result.push(currentPart.trim());
        }
        currentPart = '';
        while (i + 1 < line.length && line[i + 1] === ' ') i++;
      } else {
        currentPart += char;
      }
    }

    if (currentPart.trim()) result.push(currentPart.trim());

    if (result.length > 1) {
      const finalResult: string[] = [];
      result.forEach((part) => {
        if (part.includes(',')) {
          const commaParts: string[] = [];
          let cur = '';
          let pd = 0;
          for (let j = 0; j < part.length; j++) {
            const c = part[j];
            if (c === '(') {
              pd++;
              cur += c;
            } else if (c === ')') {
              pd--;
              cur += c;
            } else if (c === ',' && pd === 0) {
              if (cur.trim()) commaParts.push(cur.trim());
              cur = '';
            } else {
              cur += c;
            }
          }
          if (cur.trim()) commaParts.push(cur.trim());
          commaParts.forEach((commaPart) => {
            if (/\s+ve\s+/i.test(commaPart)) {
              const veParts = commaPart.split(/\s+ve\s+/i).map((p) => p.trim()).filter((p) => p);
              finalResult.push(...veParts);
            } else {
              finalResult.push(commaPart);
            }
          });
        } else if (/\s+ve\s+/i.test(part)) {
          const veParts = part.split(/\s+ve\s+/i).map((p) => p.trim()).filter((p) => p);
          finalResult.push(...veParts);
        } else {
          finalResult.push(part);
        }
      });
      return finalResult.filter((p) => p);
    }
  }

  if (line.includes(',')) {
    const result: string[] = [];
    let currentPart = '';
    let parenDepth = 0;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '(') {
        parenDepth++;
        currentPart += char;
      } else if (char === ')') {
        parenDepth--;
        currentPart += char;
      } else if (char === ',' && parenDepth === 0) {
        if (currentPart.trim()) result.push(currentPart.trim());
        currentPart = '';
      } else {
        currentPart += char;
      }
    }

    if (currentPart.trim()) result.push(currentPart.trim());

    if (result.length > 1) {
      const finalResult: string[] = [];
      result.forEach((part) => {
        if (/\s+ve\s+/i.test(part)) {
          const veParts = part.split(/\s+ve\s+/i).map((p) => p.trim()).filter((p) => p);
          finalResult.push(...veParts);
        } else {
          finalResult.push(part);
        }
      });
      const filtered = finalResult.filter((p) => p && p.trim());
      if (filtered.length > 0) return filtered;
    }
  }

  if (line.trim()) return [line];
  return [];
}

function parseSingleItemSimple(
  text: string,
  calories: number | undefined,
  originalLine: string
): ParsedMealItem | null {
  const trimmedText = text.trim();
  if (!trimmedText) return null;

  const unicodeFractions: Record<string, string> = {
    '½': '0.5',
    '¼': '0.25',
    '¾': '0.75',
    '⅓': '0.333',
    '⅔': '0.667',
    '⅕': '0.2',
    '⅖': '0.4',
    '⅗': '0.6',
    '⅘': '0.8',
    '⅙': '0.167',
    '⅚': '0.833',
    '⅛': '0.125',
    '⅜': '0.375',
    '⅝': '0.625',
    '⅞': '0.875',
  };
  let normalizedText = text;
  for (const [frac, decimal] of Object.entries(unicodeFractions)) {
    normalizedText = normalizedText.replace(
      new RegExp(`(\\d+)\\s*${frac}`, 'g'),
      (_match: string, num: string) => `${parseFloat(num) + parseFloat(decimal)}`
    );
    normalizedText = normalizedText.replace(new RegExp(frac, 'g'), decimal);
  }

  normalizedText = normalizedText.replace(
    /^(\d+)\s+(\d+)\/(\d+)\s+/,
    (_match: string, whole: string, num: string, den: string) => {
      const total = parseInt(whole) + parseInt(num) / parseInt(den);
      return `${total} `;
    }
  );

  normalizedText = normalizedText.replace(
    /^(\d+)\/(\d+)\s+/,
    (_match: string, num: string, den: string) => {
      const total = parseInt(num) / parseInt(den);
      return `${total} `;
    }
  );

  const parenthesisMatch = normalizedText.match(/^(.+?)\s*\(([^)]+)\)(.*)$/);
  let mainText = normalizedText;
  let alternatives: string | undefined = undefined;

  if (parenthesisMatch) {
    const beforeParen = parenthesisMatch[1].trim();
    const parenContent = parenthesisMatch[2].trim();
    const afterParen = parenthesisMatch[3].trim();

    const numUnitInParen = parenContent.match(
      /^(\d+(?:[.,]\d+)?)\s*(gr|gram|g|ml|kg|adet|tane|dilim|porsiyon)\.?\s*$/i
    );
    if (numUnitInParen) {
      const num = numUnitInParen[1].replace(',', '.');
      const unit = numUnitInParen[2];
      const cleanedBefore = beforeParen.replace(/^\d+(?:[.,]\d+)?\s+/, '').trim();
      mainText = `${num} ${unit} ${cleanedBefore}${afterParen ? ' ' + afterParen : ''}`.trim();
    } else {
      mainText = beforeParen + (afterParen ? ' ' + afterParen : '');
      alternatives = parenContent;
    }
  }

  const quantityMap: Record<string, { amount: number; desc: string }> = {
    bolca: { amount: 1, desc: 'bolca' },
    az: { amount: 0.5, desc: 'az' },
    yarım: { amount: 0.5, desc: 'yarım' },
  };

  let quantityAmount: number | undefined = undefined;
  let quantityDesc: string | undefined = undefined;

  for (const [key, value] of Object.entries(quantityMap)) {
    const pattern = new RegExp(`^${key}\\s+`, 'i');
    if (pattern.test(mainText)) {
      quantityAmount = value.amount;
      quantityDesc = value.desc;
      mainText = mainText.replace(pattern, '').trim();
      break;
    }
  }

  const measurement = parseMeasurement(mainText);

  if (measurement) {
    const unit = convertToFoodUnit(measurement.unit) as FoodUnit;

    const isCategoryUnit =
      measurement.unit === 'adet' ||
      measurement.unit === 'dilim' ||
      measurement.unit === 'kase' ||
      measurement.unit === 'bardak' ||
      measurement.unit === 'kasik' ||
      measurement.unit === 'porsiyon';

    let convertedAmount: number | undefined;
    let convertedUnit: string | undefined;
    if (
      isCategoryUnit &&
      measurement.convertedUnit &&
      (measurement.convertedUnit === 'gram' || measurement.convertedUnit === 'ml') &&
      measurement.convertedUnit !== measurement.unit
    ) {
      convertedAmount = measurement.convertedAmount;
      convertedUnit = measurement.convertedUnit;
    }

    let description = extractDescription(mainText);
    if (alternatives) {
      description = description ? `${description} (${alternatives})` : alternatives;
    }
    if (quantityDesc) {
      description = description ? `${quantityDesc}, ${description}` : quantityDesc;
    }

    const finalAmount =
      quantityAmount !== undefined && isCategoryUnit ? quantityAmount : measurement.amount;

    return {
      name: extractItemName(mainText, measurement.originalText),
      amount: finalAmount,
      unit,
      displayUnit: measurement.displayUnit,
      convertedAmount,
      convertedUnit,
      description,
      calories,
      originalText: originalLine,
    };
  }

  const numberMatch = mainText.match(
    /^(\d+(?:[.,]\d+)?)\s*[-–—]?\s*(\d+(?:[.,]\d+)?)?\s*(.+)/
  );

  if (numberMatch) {
    const amount1 = parseFloat(numberMatch[1].replace(',', '.'));
    const amount2 = numberMatch[2] ? parseFloat(numberMatch[2].replace(',', '.')) : null;
    const rest = numberMatch[3].trim();
    const fallbackAmount = amount2 ? (amount1 + amount2) / 2 : amount1;
    const rangeDesc = amount2 ? `Aralık: ${amount1}-${amount2}` : undefined;

    return {
      name: rest,
      amount: fallbackAmount,
      unit: 'adet',
      description: alternatives || quantityDesc || rangeDesc,
      calories,
      originalText: originalLine,
    };
  }

  const finalName = mainText.trim() || trimmedText;
  return {
    name: finalName,
    amount: quantityAmount !== undefined ? quantityAmount : 1,
    unit: 'adet',
    description: alternatives || quantityDesc,
    calories,
    originalText: originalLine,
  };
}

function extractItemName(text: string, measurementText: string): string {
  let name = text;

  if (measurementText) {
    const escaped = measurementText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    name = name.replace(new RegExp(escaped, 'gi'), ' ').trim();
  }

  const unitKeywords = [
    'su bardağı',
    'su bardagi',
    'çay bardağı',
    'cay bardagi',
    'kahve fincanı',
    'kahve fincani',
    'büyük fincan',
    'buyuk fincan',
    'kupa',
    'bardağı',
    'bardak',
    'fincan',
    'yemek kaşığı',
    'yemek kasigi',
    'tatlı kaşığı',
    'tatli kasigi',
    'çay kaşığı',
    'cay kasigi',
    'kaşığı',
    'kasigi',
    'kaşık',
    'kasik',
    'kepçe',
    'kepce',
    'kase',
    'çanak',
    'canak',
    'porsiyon',
    'küçük boy',
    'kucuk boy',
    'orta boy',
    'büyük boy',
    'buyuk boy',
    'avuç içi',
    'avuc ici',
    'parmak ucu',
    'tutam',
    'çimdik',
    'cimdik',
    'yaprak',
    'avuç',
    'avuc',
    'dilim',
    'adet',
    'tane',
    'mililitre',
    'gram',
    'litre',
    'liter',
    'kilogram',
    'kilo',
    'kg',
    'lt',
    'ml',
    'gr',
    'g',
  ];

  const sortedKeywords = [...unitKeywords].sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    name = name.replace(regex, ' ');
  }

  name = name.replace(/^\s*\d+(?:[.,]\d+)?\s*[-–—]?\s*\d*(?:[.,]\d+)?\s*/, ' ');

  const descriptions = [
    'ızgara edilmiş',
    'kaymaksız',
    'taze',
    'çiğ',
    'pişmiş',
    'haşlanmış',
    'buharda pişirilmiş',
    'kavrulmuş',
    'kızartılmış',
  ];
  for (const desc of descriptions) {
    name = name.replace(new RegExp(desc, 'gi'), ' ');
  }

  name = name.replace(/\s+/g, ' ').trim();

  if (!name) return text.trim();

  return name;
}

function extractDescription(text: string): string | undefined {
  const descriptions: string[] = [];

  const descKeywords = [
    'ızgara edilmiş',
    'kaymaksız',
    'taze',
    'çiğ',
    'pişmiş',
    'haşlanmış',
    'buharda pişirilmiş',
    'kavrulmuş',
    'kızartılmış',
    'evde mayalanmış',
    'seçme',
    'sele',
  ];

  descKeywords.forEach((keyword) => {
    if (text.toLowerCase().includes(keyword)) {
      descriptions.push(keyword);
    }
  });

  return descriptions.length > 0 ? descriptions.join(', ') : undefined;
}

function assignMealNumbers(day: ParsedDay) {
  const mealOrder: Record<string, number> = {
    KAHVALTI: 1,
    'ARA ÖĞÜN': 2,
    'ÖĞLE YEMEĞİ': 3,
    'AKŞAM YEMEĞİ': 4,
  };

  day.meals.sort((a, b) => {
    const orderA = mealOrder[a.mealType] || 999;
    const orderB = mealOrder[b.mealType] || 999;
    return orderA - orderB;
  });

  let currentNumber = 1;
  let lastMealType = '';
  let araOgunCount = 0;

  day.meals.forEach((meal) => {
    if (meal.mealType === 'ARA ÖĞÜN') {
      if (lastMealType !== 'ARA ÖĞÜN') {
        araOgunCount = 0;
      }
      araOgunCount++;

      if (currentNumber > 1) {
        meal.mealNumber = currentNumber;
        currentNumber++;
      } else {
        meal.mealNumber = 2;
        currentNumber = 3;
      }
    } else {
      const baseNumber = mealOrder[meal.mealType] || currentNumber;
      meal.mealNumber = baseNumber;
      currentNumber = baseNumber + 1;
    }

    lastMealType = meal.mealType;
  });
}

function checkDayCompleteness(day: ParsedDay, expectedMealCount: number) {
  const mealNumbers = day.meals.map((m) => m.mealNumber).filter((n) => n !== null) as number[];
  const missingMeals: number[] = [];

  for (let i = 1; i <= expectedMealCount; i++) {
    if (!mealNumbers.includes(i)) {
      missingMeals.push(i);
    }
  }

  day.missingMeals = missingMeals;
  day.isComplete = missingMeals.length === 0 && day.meals.length > 0;
}
