import { db } from "@/src/config/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

export const getDoctors = async () => {
  const q = query(collection(db, "users"), where("role", "==", "doctor"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  }));
};

export const createAppointment = async (data: any) => {
  const docRef = await addDoc(collection(db, "appointments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getUserById = async (uid: string) => {
  const ref = doc(db, "users", uid);

  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
};
export const findEmailForLogin = async (
  identifier: string,
): Promise<string | null> => {
  const value = identifier.trim();
  if (!value) return null;

  // 1. Agar "@" hai to seedha email samjho
  if (value.includes("@")) {
    return value.toLowerCase();
  }

  // 2. Name se users collection mein dhoondo
  const nameQuery = query(collection(db, "users"), where("name", "==", value));
  const nameSnap = await getDocs(nameQuery);
  if (!nameSnap.empty) {
    return nameSnap.docs[0].data().email as string;
  }

  // 3. Phone se users collection mein dhoondo (doctor/pharmacy/reception
  // apna phone "users" doc mein save karte hain profile screen se)
  const phoneQuery = query(
    collection(db, "users"),
    where("phone", "==", value),
  );
  const phoneSnap = await getDocs(phoneQuery);
  if (!phoneSnap.empty) {
    return phoneSnap.docs[0].data().email as string;
  }

  // 4. Patient ka phone "patients" collection mein hota hai —
  // wahan se patientId nikal kar users mein us patientId ka email dhoondo
  const patientQuery = query(
    collection(db, "patients"),
    where("phone", "==", value),
  );
  const patientSnap = await getDocs(patientQuery);
  if (!patientSnap.empty) {
    const patientId = patientSnap.docs[0].data().patientId;
    const userByPatientQuery = query(
      collection(db, "users"),
      where("patientId", "==", patientId),
    );
    const userByPatientSnap = await getDocs(userByPatientQuery);
    if (!userByPatientSnap.empty) {
      return userByPatientSnap.docs[0].data().email as string;
    }
  }

  return null;
};

export const getMedicines = async () => {
  const snapshot = await getDocs(collection(db, "medicines"));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
