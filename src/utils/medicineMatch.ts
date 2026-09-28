// src/utils/medicineMatch.ts

export type InventoryMedicine = {
  id: string;
  name: string;
  salt?: string;
  strength?: string;
  stock?: number;
  price?: number;
  [key: string]: any;
};

export const normalizeMedicineName = (value: any): string => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
};

const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

/**
 * Doctor ke typed medicine name ko inventory se match karta hai.
 * Agar match na mile, undefined return hota hai — is case mein
 * calling code ko "not in inventory, but still allow adding" wala
 * flow follow karna chahiye.
 */
export const findMedicineInInventory = (
  typedName: string,
  medicines: InventoryMedicine[],
): InventoryMedicine | undefined => {
  const prescribedName = normalizeMedicineName(typedName);
  if (!prescribedName) return undefined;

  // 1. Exact match
  let match = medicines.find(
    (m) => normalizeMedicineName(m.name) === prescribedName,
  );
  if (match) return match;

  // 2. Substring match — sirf tab jab ek hi unique candidate ho
  const substringCandidates = medicines.filter((m) => {
    const inventoryName = normalizeMedicineName(m.name);
    return (
      inventoryName.includes(prescribedName) ||
      prescribedName.includes(inventoryName)
    );
  });
  if (substringCandidates.length === 1) {
    return substringCandidates[0];
  }

  // 3. Fuzzy match (typo tolerance) — "flagel" vs "flagyl"
  let bestMatch: InventoryMedicine | undefined;
  let bestDistance = Infinity;

  for (const m of medicines) {
    const inventoryName = normalizeMedicineName(m.name);
    if (Math.abs(inventoryName.length - prescribedName.length) > 3) continue;

    const distance = levenshteinDistance(prescribedName, inventoryName);
    const threshold = prescribedName.length <= 5 ? 1 : 2;

    if (distance <= threshold && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = m;
    }
  }

  return bestMatch;
};

/**
 * Autocomplete ke liye: type karte hue top suggestions.
 */
export const getMedicineSuggestions = (
  query: string,
  medicines: InventoryMedicine[],
  limit: number = 6,
): InventoryMedicine[] => {
  const q = normalizeMedicineName(query);
  if (!q || q.length < 2) return [];

  const scored = medicines
    .map((m) => {
      const name = normalizeMedicineName(m.name);
      let score = Infinity;

      if (name === q) score = 0;
      else if (name.startsWith(q)) score = 1;
      else if (name.includes(q)) score = 2;
      else {
        const distance = levenshteinDistance(q, name);
        const threshold = q.length <= 5 ? 2 : 3;
        if (distance <= threshold) score = 3 + distance;
      }

      return { medicine: m, score };
    })
    .filter((item) => item.score < Infinity)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((item) => item.medicine);

  return scored;
};
