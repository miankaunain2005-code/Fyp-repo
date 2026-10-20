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
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));
};

export const createAppointment = async (data: any) => {
  const docRef = await addDoc(collection(db, "appointments"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getUserById = async (uid: string) => {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) return null;
  return snapshot.data();
};

// 
export const findPendingDuplicate = async (
  field: "userId" | "patientId",
  value: string,
  patientId: string,
  doctorId: string,
) => {
  const q = query(
    collection(db, "appointments"),
    where(field, "==", value),
    where("doctorId", "==", doctorId),
  );
  const snap = await getDocs(q);
  const today = new Date().toDateString();

  const found = snap.docs
    .map((d) => d.data() as any)
    .find(
      (a) =>
        a.patientId === patientId &&
        a.date === today &&
        a.status !== "Completed",
    );

  return found || null;
};

export const findEmailForLogin = async (
  identifier: string,
): Promise<string | null> => {
  const value = identifier.trim();
  if (!value) return null;

  if (value.includes("@")) return value.toLowerCase();

  const nameSnap = await getDocs(
    query(collection(db, "users"), where("name", "==", value)),
  );
  if (!nameSnap.empty) return nameSnap.docs[0].data().email as string;

  const phoneSnap = await getDocs(
    query(collection(db, "users"), where("phone", "==", value)),
  );
  if (!phoneSnap.empty) return phoneSnap.docs[0].data().email as string;

  const patientSnap = await getDocs(
    query(collection(db, "patients"), where("phone", "==", value)),
  );
  if (!patientSnap.empty) {
    const patientId = patientSnap.docs[0].data().patientId;
    const userSnap = await getDocs(
      query(collection(db, "users"), where("patientId", "==", patientId)),
    );
    if (!userSnap.empty) return userSnap.docs[0].data().email as string;
  }

  return null;
};

export const getMedicines = async () => {
  const snapshot = await getDocs(collection(db, "medicines"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};
