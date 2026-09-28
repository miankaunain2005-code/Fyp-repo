// src/utils/inputFormatters.ts

// DOB ko "DD-MM-YYYY" format mein auto-convert karta hai
// User sirf numbers type karega, dashes khud aa jayenge
export const formatDOBInput = (text: string): string => {
  const digits = text.replace(/\D/g, "").slice(0, 8); // sirf 8 digits allow (DDMMYYYY)

  let formatted = digits;

  if (digits.length > 4) {
    formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  } else if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return formatted;
};
// Sirf digits nikal deta hai — Firestore mein isi form mein store hoga
export const normalizeDigits = (value: string): string =>
  (value || "").replace(/\D/g, "");

// Phone ko "03XX-XXXXXXX" format mein auto-convert karta hai
export const formatPhoneInput = (text: string): string => {
  const digits = text.replace(/\D/g, "").slice(0, 11); // sirf 11 digits allow

  let formatted = digits;

  if (digits.length > 4) {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return formatted;
};
