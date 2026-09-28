// src/utils/forgotPasswordService.ts
import { auth, db } from "@/src/config/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

// Phone se patientId dhoondo, phir patientId se uska "users" account (email) nikaalo
export const findAccountByPhone = async (phone: string) => {
  const patientQuery = query(
    collection(db, "patients"),
    where("phone", "==", phone.trim()),
  );
  const patientSnap = await getDocs(patientQuery);
  if (patientSnap.empty) return null;

  const patientId = patientSnap.docs[0].data().patientId;

  const userQuery = query(
    collection(db, "users"),
    where("patientId", "==", patientId),
  );
  const userSnap = await getDocs(userQuery);
  if (userSnap.empty) return null;

  return { email: userSnap.docs[0].data().email as string, patientId };
};

export const triggerPasswordReset = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
