// src/utils/emailOtpService.ts
import { db } from "@/src/config/firebaseConfig";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

const EMAILJS_SERVICE_ID = "service_zqes3rs";
const EMAILJS_TEMPLATE_ID = "template_8tkt77d";
const EMAILJS_PUBLIC_KEY = "WSl0WVZ_2zWvI2rI6";
const EMAILJS_PRIVATE_KEY = "3GonhUsMiV5oVroVSaAJm"; // 👈 naya

const OTP_EXPIRY_MINUTES = 5;

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpDocId = (email: string) => email.trim().toLowerCase();

export const sendEmailOtp = async (email: string): Promise<void> => {
  const otp = generateOtp();
  const normalizedEmail = email.trim().toLowerCase();

  await setDoc(doc(db, "emailOtps", otpDocId(normalizedEmail)), {
    otp,
    email: normalizedEmail,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    ),
  });

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY, // 👈 naya
      template_params: {
        to_email: normalizedEmail,
        otp_code: otp,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log("EMAILJS ERROR:", errorText);
    throw new Error("Email bhejne mein masla hua. Dobara try karein.");
  }
};

export const verifyEmailOtp = async (
  email: string,
  inputOtp: string,
): Promise<boolean> => {
  const normalizedEmail = email.trim().toLowerCase();
  const ref = doc(db, "emailOtps", otpDocId(normalizedEmail));
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;

  const data = snap.data();
  const expiresAtMillis = data.expiresAt?.toMillis?.() ?? 0;

  if (Date.now() > expiresAtMillis) {
    await deleteDoc(ref);
    return false;
  }

  if (data.otp !== inputOtp.trim()) return false;

  await deleteDoc(ref);
  return true;
};
