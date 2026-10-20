import { db } from "@/src/config/firebaseConfig";
import {
  collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, query,
  runTransaction, serverTimestamp, setDoc, updateDoc, where,
} from "firebase/firestore";
import { normalizeDigits } from "./inputFormatters";

const makeNameKey = (n: string) =>
  String(n || "").trim().toLowerCase().replace(/\s+/g, " ");

export const updatePatient = async (patientId: string, data: any) => {
  const clean = { ...data };
  if (clean.phone !== undefined) clean.phone = normalizeDigits(clean.phone);
  if (clean.DOB !== undefined) clean.DOB = normalizeDigits(clean.DOB);
  if (clean.name !== undefined) {
    clean.name = String(clean.name).trim();
    clean.nameKey = makeNameKey(clean.name);
  }
  await updateDoc(doc(db, "patients", patientId), clean);
};

export const generatePatientId = async () => {
  const ref = doc(db, "counters", "patient");
  return await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    const n = (s.exists() ? s.data().lastNumber || 0 : 0) + 1;
    tx.set(ref, { lastNumber: n }, { merge: true });
    return `P-${String(n).padStart(6, "0")}`;
  });
};

// Din ke hisaab se sequential token: TKN-001, TKN-002...
export const generateToken = async () => {
  const day = new Date().toDateString().replace(/\s/g, "_");
  const ref = doc(db, "counters", `token_${day}`);
  return await runTransaction(db, async (tx) => {
    const s = await tx.get(ref);
    const n = (s.exists() ? s.data().last || 0 : 0) + 1;
    tx.set(ref, { last: n }, { merge: true });
    return `TKN-${String(n).padStart(3, "0")}`;
  });
};

// Match: phone + naam (case-insensitive) + gender + DOB. Merge ho chuke records skip.
export const findPatient = async (
  phone: string, name: string, gender: string, DOB: string,
) => {
  const snap = await getDocs(
    query(
      collection(db, "patients"),
      where("phone", "==", normalizeDigits(phone)),
      where("nameKey", "==", makeNameKey(name)),
      where("gender", "==", gender.trim()),
      where("DOB", "==", normalizeDigits(DOB)),
    ),
  );
  const d = snap.docs.map((x) => x.data() as any).find((p) => !p.mergedInto);
  return d || null;
};

export const createPatient = async (data: any) => {
  await setDoc(doc(db, "patients", data.patientId), {
    ...data,
    name: String(data.name).trim(),
    nameKey: makeNameKey(data.name),
    gender: String(data.gender).trim(),
    phone: normalizeDigits(data.phone),
    DOB: normalizeDigits(data.DOB),
    linkedUserId: data.linkedUserId || "",
    createdAt: serverTimestamp(),
  });
  return data.patientId;
};

// Signup par sirf info dene ke liye (link isse NAHI hota)
export const findMatchingPatientForSignup = async (
  name: string, DOB: string, gender: string, phone: string,
) => {
  const found = await findPatient(phone, name, gender, DOB);
  if (!found) return null;
  return {
    patientId: found.patientId as string,
    linkedUserId: (found.linkedUserId as string) || null,
  };
};

export const getPatient = async (patientId: string) => {
  const snap = await getDoc(doc(db, "patients", patientId));
  return snap.exists() ? snap.data() : null;
};

/* ---------------- ACTIVATION CODE ---------------- */

const randomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Reception: naya code, purane codes khatam
export const createActivationCode = async (patientId: string) => {
  const old = await getDocs(
    query(collection(db, "patientCodes"), where("patientId", "==", patientId)),
  );
  for (const d of old.docs) await deleteDoc(d.ref);

  const code = randomCode();
  await setDoc(doc(db, "patientCodes", `${patientId}_${code}`), {
    patientId, code, createdAt: serverTimestamp(),
  });
  return code;
};

export const verifyActivationCode = async (patientId: string, code: string) => {
  const id = `${patientId.trim().toUpperCase()}_${code.trim()}`;
  return (await getDoc(doc(db, "patientCodes", id))).exists();
};

// Signup ke waqt (account abhi bana hai): record account se jodna
export const linkPatientToUser = async (
  patientId: string, code: string, uid: string,
) => {
  const pid = patientId.trim().toUpperCase();
  const c = code.trim();
  await updateDoc(doc(db, "patients", pid), { linkedUserId: uid, linkCode: c });
  await updateDoc(doc(db, "patients", pid), { linkCode: deleteField() });
  await deleteDoc(doc(db, "patientCodes", `${pid}_${c}`));
};

/* ------------- BAAD MEIN LINK (Profile se) ------------- */

// Code ke baghair bane account ko baad mein purane hospital record se jodna.
// Sirf tab jab naye khaali record par koi booking/prescription na ho.
export const linkExistingRecord = async (
  uid: string, currentPid: string, targetPidRaw: string, codeRaw: string,
) => {
  const target = targetPidRaw.trim().toUpperCase();
  const code = codeRaw.trim();

  if (!target || !code) throw new Error("Enter Patient ID and Activationcode both.");
  if (target === currentPid) throw new Error(" This record is Already connected with your  account .");

  if (!(await verifyActivationCode(target, code))) {
    throw new Error("Patient ID ya code galat hai, ya pehle use ho chuka hai.");
  }

  const targetSnap = await getDoc(doc(db, "patients", target));
  if (!targetSnap.exists()) throw new Error("Ye Patient ID maujood nahi.");
  if ((targetSnap.data() as any).linkedUserId) {
    throw new Error("Ye record pehle se kisi account se linked hai.");
  }

  // Beech mein bani bookings check (userId se, kyunke rules yehi allow karte hain)
  for (const col of ["appointments", "prescriptions"]) {
    const s = await getDocs(
      query(
        collection(db, col),
        where("userId", "==", uid),
        where("patientId", "==", currentPid),
        limit(1),
      ),
    );
    if (!s.empty) {
      throw new Error(
        "Is account par pehle se appointments/prescriptions hain. Reception se rabta karein, wo records merge kar denge.",
      );
    }
  }

  // 1) naya record account se link (rules code ki maujoodgi dekhte hain)
  await updateDoc(doc(db, "patients", target), { linkedUserId: uid, linkCode: code });
  await updateDoc(doc(db, "patients", target), { linkCode: deleteField() });
  await deleteDoc(doc(db, "patientCodes", `${target}_${code}`));

  // 2) user ki patientId badlo
  await updateDoc(doc(db, "users", uid), { patientId: target, recordLinked: true });

  // 3) purana khaali record merged mark (dobara match nahi hoga)
  await updateDoc(doc(db, "patients", currentPid), { mergedInto: target });

  return target;
};