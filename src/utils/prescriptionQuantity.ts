// src/utils/prescriptionQuantity.ts

// Kisi bhi string (e.g. "2", "2 Tablets", "3 Days") se pehla number nikalta hai
export const parseNumber = (value: any, defaultValue: number = 1): number => {
  const match = String(value ?? "").match(/\d+(\.\d+)?/);
  if (!match) return defaultValue;
  const num = Number(match[0]);
  return isNaN(num) || num <= 0 ? defaultValue : num;
};

/**
 * Doctor ki prescription se total quantity calculate karta hai:
 * (per-dose quantity) x (din mein kitni baar - morning/afternoon/night)
 * x (kitne din / duration)
 */
export const calculatePrescribedQuantity = (medicine: any): number => {
  const perDose = parseNumber(medicine.quantity, 1);

  const timesPerDay =
    (medicine.morning ? 1 : 0) +
    (medicine.afternoon ? 1 : 0) +
    (medicine.night ? 1 : 0);

  const frequencyPerDay = timesPerDay > 0 ? timesPerDay : 1;

  const durationDays = parseNumber(medicine.duration, 1);

  return perDose * frequencyPerDay * durationDays;
};

// UI mein dikhane ke liye breakdown string, e.g. "2 × 3/day × 3 days"
export const getQuantityBreakdown = (medicine: any): string => {
  const perDose = parseNumber(medicine.quantity, 1);
  const timesPerDay =
    (medicine.morning ? 1 : 0) +
      (medicine.afternoon ? 1 : 0) +
      (medicine.night ? 1 : 0) || 1;
  const durationDays = parseNumber(medicine.duration, 1);

  return `${perDose} × ${timesPerDay}/day × ${durationDays} days`;
};
