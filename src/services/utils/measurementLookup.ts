/**
 * Türkçe ölçü birimleri lookup table — mobil tarafındaki
 * `DietCoop-Mobile/src/utils/measurementLookup.ts` ile birebir aynı veri ve mantık.
 * Sadece import (FoodUnit) gerekmediği için saf string literal kullanır.
 */

export interface MeasurementConversion {
  ml?: number;
  gram?: number;
  unit: string; // FoodUnit kategorisi
  displayName: string;
  defaultAmount?: number;
}

export const measurementLookup: Record<string, MeasurementConversion> = {
  // ── Bardak / Fincan / Kupa ──
  'su bardağı': { unit: 'bardak', displayName: 'su bardağı', ml: 200, defaultAmount: 1 },
  'su bardagi': { unit: 'bardak', displayName: 'su bardağı', ml: 200, defaultAmount: 1 },
  'çay bardağı': { unit: 'bardak', displayName: 'çay bardağı', ml: 95, defaultAmount: 1 },
  'cay bardagi': { unit: 'bardak', displayName: 'çay bardağı', ml: 95, defaultAmount: 1 },
  'kahve fincanı': { unit: 'bardak', displayName: 'kahve fincanı', ml: 75, defaultAmount: 1 },
  'kahve fincani': { unit: 'bardak', displayName: 'kahve fincanı', ml: 75, defaultAmount: 1 },
  'büyük fincan': { unit: 'bardak', displayName: 'büyük fincan', ml: 250, defaultAmount: 1 },
  'buyuk fincan': { unit: 'bardak', displayName: 'büyük fincan', ml: 250, defaultAmount: 1 },
  'kupa': { unit: 'bardak', displayName: 'kupa', ml: 250, defaultAmount: 1 },

  // ── Kaşık ──
  'yemek kaşığı': { unit: 'kasik', displayName: 'yemek kaşığı', gram: 12, ml: 15, defaultAmount: 1 },
  'yemek kasigi': { unit: 'kasik', displayName: 'yemek kaşığı', gram: 12, ml: 15, defaultAmount: 1 },
  'tatlı kaşığı': { unit: 'kasik', displayName: 'tatlı kaşığı', gram: 6, ml: 8, defaultAmount: 1 },
  'tatli kasigi': { unit: 'kasik', displayName: 'tatlı kaşığı', gram: 6, ml: 8, defaultAmount: 1 },
  'çay kaşığı': { unit: 'kasik', displayName: 'çay kaşığı', gram: 3, ml: 5, defaultAmount: 1 },
  'cay kasigi': { unit: 'kasik', displayName: 'çay kaşığı', gram: 3, ml: 5, defaultAmount: 1 },

  // ── Kepçe ──
  'kepçe': { unit: 'ml', displayName: 'kepçe', ml: 125, defaultAmount: 125 },
  'kepce': { unit: 'ml', displayName: 'kepçe', ml: 125, defaultAmount: 125 },

  // ── Kase / Çanak ──
  'kase': { unit: 'kase', displayName: 'kase', gram: 180, defaultAmount: 1 },
  'çanak': { unit: 'kase', displayName: 'çanak', gram: 275, defaultAmount: 1 },
  'canak': { unit: 'kase', displayName: 'çanak', gram: 275, defaultAmount: 1 },

  // ── Porsiyon ──
  'porsiyon': { unit: 'porsiyon', displayName: 'porsiyon', gram: 175, defaultAmount: 1 },

  // ── Dilim ──
  'dilim': { unit: 'dilim', displayName: 'dilim', gram: 25, defaultAmount: 1 },

  // ── Boy sıfatları ──
  'küçük boy': { unit: 'adet', displayName: 'küçük boy', gram: 90, defaultAmount: 1 },
  'kucuk boy': { unit: 'adet', displayName: 'küçük boy', gram: 90, defaultAmount: 1 },
  'orta boy': { unit: 'adet', displayName: 'orta boy', gram: 135, defaultAmount: 1 },
  'büyük boy': { unit: 'adet', displayName: 'büyük boy', gram: 215, defaultAmount: 1 },
  'buyuk boy': { unit: 'adet', displayName: 'büyük boy', gram: 215, defaultAmount: 1 },

  // ── Avuç / Tutam / Yaprak ──
  'avuç içi': { unit: 'gram', displayName: 'avuç içi', gram: 30, defaultAmount: 1 },
  'avuc ici': { unit: 'gram', displayName: 'avuç içi', gram: 30, defaultAmount: 1 },
  'avuç': { unit: 'gram', displayName: 'avuç', gram: 30, defaultAmount: 1 },
  'avuc': { unit: 'gram', displayName: 'avuç', gram: 30, defaultAmount: 1 },
  'parmak ucu': { unit: 'gram', displayName: 'parmak ucu', gram: 5, defaultAmount: 1 },
  'tutam': { unit: 'gram', displayName: 'tutam', gram: 2, defaultAmount: 1 },
  'çimdik': { unit: 'gram', displayName: 'çimdik', gram: 1, defaultAmount: 1 },
  'cimdik': { unit: 'gram', displayName: 'çimdik', gram: 1, defaultAmount: 1 },
  'yaprak': { unit: 'adet', displayName: 'yaprak', gram: 10, defaultAmount: 1 },

  // ── Genel "bardak" / "fincan" fallback ──
  'bardağı': { unit: 'bardak', displayName: 'bardak', ml: 200, defaultAmount: 1 },
  'bardak': { unit: 'bardak', displayName: 'bardak', ml: 200, defaultAmount: 1 },
  'fincan': { unit: 'bardak', displayName: 'fincan', ml: 75, defaultAmount: 1 },

  // ── Genel "kaşık" fallback ──
  'kaşığı': { unit: 'kasik', displayName: 'kaşık', gram: 12, defaultAmount: 1 },
  'kasigi': { unit: 'kasik', displayName: 'kaşık', gram: 12, defaultAmount: 1 },
  'kaşık': { unit: 'kasik', displayName: 'kaşık', gram: 12, defaultAmount: 1 },
  'kasik': { unit: 'kasik', displayName: 'kaşık', gram: 12, defaultAmount: 1 },

  // ── Adet / Tane (en sona) ──
  'adet': { unit: 'adet', displayName: 'adet', defaultAmount: 1 },
  'tane': { unit: 'adet', displayName: 'tane', defaultAmount: 1 },
};

export function parseMeasurement(text: string): {
  amount: number;
  unit: string;
  displayUnit?: string;
  originalText: string;
  convertedAmount?: number;
  convertedUnit?: string;
} | null {
  const lowerText = text.toLowerCase().trim();

  const kgMatch = lowerText.match(
    /(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?\s*(?:kg|kilo|kilogram)\b/i
  );
  if (kgMatch) {
    const a1 = parseFloat(kgMatch[1].replace(',', '.'));
    const a2 = kgMatch[2] ? parseFloat(kgMatch[2].replace(',', '.')) : null;
    const avg = a2 ? (a1 + a2) / 2 : a1;
    return {
      amount: avg * 1000,
      unit: 'gram',
      originalText: kgMatch[0],
      convertedAmount: avg * 1000,
      convertedUnit: 'gram',
    };
  }

  const gramMatch = lowerText.match(
    /(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?\s*(?:gram|gr|g)\b/i
  );
  if (gramMatch) {
    const a1 = parseFloat(gramMatch[1].replace(',', '.'));
    const a2 = gramMatch[2] ? parseFloat(gramMatch[2].replace(',', '.')) : null;
    const avg = a2 ? (a1 + a2) / 2 : a1;
    return { amount: avg, unit: 'gram', originalText: gramMatch[0] };
  }

  const ltMatch = lowerText.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|litre|liter)\b/i);
  if (ltMatch) {
    const a = parseFloat(ltMatch[1].replace(',', '.'));
    return {
      amount: a * 1000,
      unit: 'ml',
      originalText: ltMatch[0],
      convertedAmount: a * 1000,
      convertedUnit: 'ml',
    };
  }

  const mlMatch = lowerText.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|mililitre)\b/i);
  if (mlMatch) {
    const a = parseFloat(mlMatch[1].replace(',', '.'));
    return { amount: a, unit: 'ml', originalText: mlMatch[0] };
  }

  for (const [key, conversion] of Object.entries(measurementLookup)) {
    if (!lowerText.includes(key)) continue;

    const keyIndex = lowerText.indexOf(key);
    const before = lowerText.slice(0, keyIndex).trimEnd();
    const numBeforeMatch = before.match(
      /(\d+(?:[.,]\d+)?)\s*[-–—]?\s*(\d+(?:[.,]\d+)?)?\s*$/
    );
    let userAmount = 1;
    let amountText = '';
    if (numBeforeMatch) {
      const a1 = parseFloat(numBeforeMatch[1].replace(',', '.'));
      const a2 = numBeforeMatch[2] ? parseFloat(numBeforeMatch[2].replace(',', '.')) : null;
      userAmount = a2 ? (a1 + a2) / 2 : a1;
      amountText = numBeforeMatch[0].trim();
    }

    const originalText = amountText ? `${amountText} ${key}` : key;

    if (conversion.unit === 'gram' && conversion.gram) {
      return {
        amount: userAmount * conversion.gram,
        unit: 'gram',
        originalText,
      };
    }
    if (conversion.unit === 'ml' && conversion.ml) {
      return {
        amount: userAmount * conversion.ml,
        unit: 'ml',
        originalText,
      };
    }

    let convertedAmount: number | undefined;
    let convertedUnit: string | undefined;
    if (conversion.gram) {
      convertedAmount = userAmount * conversion.gram;
      convertedUnit = 'gram';
    } else if (conversion.ml) {
      convertedAmount = userAmount * conversion.ml;
      convertedUnit = 'ml';
    }

    return {
      amount: userAmount,
      unit: conversion.unit,
      displayUnit: conversion.displayName,
      originalText,
      convertedAmount,
      convertedUnit,
    };
  }

  const numberMatch = lowerText.match(
    /(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?\s*(adet|tane|dilim)\b/i
  );
  if (numberMatch) {
    const a1 = parseFloat(numberMatch[1].replace(',', '.'));
    const a2 = numberMatch[2] ? parseFloat(numberMatch[2].replace(',', '.')) : null;
    const avg = a2 ? (a1 + a2) / 2 : a1;
    const unit = numberMatch[3] === 'dilim' ? 'dilim' : 'adet';
    return { amount: avg, unit, originalText: numberMatch[0] };
  }

  return null;
}

export function convertToFoodUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    gram: 'gram',
    ml: 'ml',
    adet: 'adet',
    dilim: 'dilim',
    kase: 'kase',
    bardak: 'bardak',
    porsiyon: 'porsiyon',
    kasik: 'kasik',
    'yemek kaşığı': 'kasik',
    'yemek kasigi': 'kasik',
    'tatlı kaşığı': 'kasik',
    'tatli kasigi': 'kasik',
    'çay kaşığı': 'kasik',
    'cay kasigi': 'kasik',
  };

  const lowerUnit = unit.toLowerCase();
  if (unitMap[lowerUnit]) return unitMap[lowerUnit];

  if (
    lowerUnit.includes('kaşığı') ||
    lowerUnit.includes('kasigi') ||
    lowerUnit.includes('kaşık') ||
    lowerUnit.includes('kasik')
  ) {
    return 'kasik';
  }

  return unitMap[lowerUnit] || 'adet';
}
