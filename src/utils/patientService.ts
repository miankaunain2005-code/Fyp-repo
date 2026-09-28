import { db } from "@/src/config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { normalizeDigits } from "./inputFormatters";

export const updatePatient = async (patientId: string, data: any) => {
  const cleanData = { ...data };
  if (cleanData.phone !== undefined)
    cleanData.phone = normalizeDigits(cleanData.phone);
  if (cleanData.DOB !== undefined)
    cleanData.DOB = normalizeDigits(cleanData.DOB);
  await updateDoc(doc(db, "patients", patientId), cleanData);
};

// Generate Patient ID
export const generatePatientId = async () => {
  const counterRef = doc(db, "counters", "patient");

  const patientId = await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let lastNumber = 0;
    if (counterDoc.exists()) {
      lastNumber = counterDoc.data().lastNumber || 0;
    }
    lastNumber++;
    transaction.set(counterRef, { lastNumber }, { merge: true });
    return `P-${lastNumber.toString().padStart(6, "0")}`;
  });

  return patientId;
};

// Find Existing Patient — sab kuch normalize karke compare
export const findPatient = async (
  phone: string,
  name: string,
  gender: string,
  DOB: string,
  age: string,
) => {
  const q = query(
    collection(db, "patients"),
    where("phone", "==", normalizeDigits(phone)),
    where("name", "==", name),
    where("gender", "==", gender),
    where("DOB", "==", normalizeDigits(DOB)),
    where("age", "==", age),
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
};

// Create New Patient — phone/DOB normalize karke save
export const createPatient = async (data: any) => {
  const cleanData = {
    ...data,
    phone: normalizeDigits(data.phone),
    DOB: normalizeDigits(data.DOB),
  };

  await setDoc(doc(db, "patients", data.patientId), {
    ...cleanData,
    createdAt: serverTimestamp(),
  });

  return data.patientId;
};

export const findMatchingPatientForSignup = async (
  name: string,
  DOB: string,
  gender: string,
  phone: string,
) => {
  const q = query(
    collection(db, "patients"),
    where("name", "==", name.trim()),
    where("DOB", "==", normalizeDigits(DOB)),
    where("gender", "==", gender.trim()),
    where("phone", "==", normalizeDigits(phone)),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docData: any = snapshot.docs[0].data();
  return {
    patientId: docData.patientId as string,
    name: docData.name as string,
    phone: docData.phone as string,
    gender: docData.gender as string,
    DOB: docData.DOB as string,
    age: docData.age as string,
  };
};

// Get Patient By Patient ID
export const getPatient = async (patientId: string) => {
  const ref = doc(db, "patients", patientId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return snapshot.data();
};
