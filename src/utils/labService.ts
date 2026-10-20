import { db } from "@/src/config/firebaseConfig";
import {
    addDoc, collection, doc, getDoc, getDocs, runTransaction,
    serverTimestamp, setDoc,
} from "firebase/firestore";

export type LabParam = {
    name: string; unit: string; low: number | null; high: number | null;
    value?: string; flag?: string; custom?: boolean;
};

type Def = { id: string; name: string; category: string; price: number; parameters: LabParam[] };

const P = (name: string, unit: string, low: number | null, high: number | null): LabParam =>
    ({ name, unit, low, high });

const FULL_CBC: LabParam[] = [
    P("Hemoglobin", "g/dL", 13, 17), P("RBC", "million/µL", 4.5, 5.9),
    P("Hematocrit (PCV)", "%", 40, 52), P("MCV", "fL", 80, 100),
    P("MCH", "pg", 27, 33), P("MCHC", "g/dL", 32, 36),
    P("RDW", "%", 11.5, 14.5), P("WBC", "/µL", 4000, 11000),
    P("Neutrophils", "%", 40, 75), P("Lymphocytes", "%", 20, 45),
    P("Monocytes", "%", 2, 10), P("Eosinophils", "%", 1, 6),
    P("Basophils", "%", 0, 1), P("Platelets", "/µL", 150000, 450000),
    P("MPV", "fL", 7.5, 11.5),
];

export const DEFAULT_TESTS: Def[] = [
    { id: "cbc", name: "CBC (Complete Blood Count)", category: "Hematology", price: 600, parameters: FULL_CBC },
    { id: "rbs", name: "Blood Sugar (Random)", category: "Biochemistry", price: 200, parameters: [P("Glucose Random", "mg/dL", 70, 140)] },
    { id: "fbs", name: "Blood Sugar (Fasting)", category: "Biochemistry", price: 200, parameters: [P("Glucose Fasting", "mg/dL", 70, 100)] },
    {
        id: "lft", name: "LFT (Liver Function)", category: "Biochemistry", price: 900, parameters: [
            P("ALT", "U/L", 7, 56), P("AST", "U/L", 10, 40), P("Bilirubin Total", "mg/dL", 0.1, 1.2)]
    },
    {
        id: "lipid", name: "Lipid Profile", category: "Biochemistry", price: 1200, parameters: [
            P("Cholesterol", "mg/dL", 0, 200), P("HDL", "mg/dL", 40, 100),
            P("LDL", "mg/dL", 0, 100), P("Triglycerides", "mg/dL", 0, 150)]
    },
    { id: "creat", name: "Serum Creatinine", category: "Biochemistry", price: 400, parameters: [P("Creatinine", "mg/dL", 0.6, 1.3)] },
];

export const seedLabTests = async () => {
    for (const t of DEFAULT_TESTS) {
        await setDoc(doc(db, "labTests", t.id), { ...t, active: true, createdAt: serverTimestamp() });
    }
};

const sortByName = (a: any, b: any) => String(a.name).localeCompare(String(b.name));

// Order/test chunne ke liye: sirf active
export const getLabTests = async () => {
    const snap = await getDocs(collection(db, "labTests"));
    return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((t: any) => t.active !== false)
        .sort(sortByName);
};

// Catalog screen ke liye: sab (inactive bhi)
export const getAllLabTests = async () => {
    const snap = await getDocs(collection(db, "labTests"));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).sort(sortByName);
};

export const toOrderTest = (t: any) => ({
    testId: t.id, name: t.name, price: Number(t.price) || 0,
    parameters: (t.parameters || []).map((p: LabParam) => ({ ...p, value: "", flag: "" })),
});

export const computeFlag = (value: string, low: number | null, high: number | null) => {
    const n = parseFloat(value);
    if (isNaN(n) || (low == null && high == null)) return value.trim() ? "Normal" : "";
    if (low != null && n < low) return "Low";
    if (high != null && n > high) return "High";
    return "Normal";
};

export const orderTotal = (tests: any[]) =>
    tests.reduce((s, t) => s + (Number(t.price) || 0), 0);

export const generateOrderNo = async () => {
    const ref = doc(db, "counters", "labOrder");
    return await runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        const n = (s.exists() ? s.data().last || 0 : 0) + 1;
        tx.set(ref, { last: n }, { merge: true });
        return `LAB-${String(n).padStart(4, "0")}`;
    });
};

export const createLabOrder = async (data: any) => {
    const orderNo = await generateOrderNo();
    const ref = await addDoc(collection(db, "labOrders"), {
        ...data, orderNo, createdAt: serverTimestamp(),
    });
    return { id: ref.id, orderNo };
};

// Hospital ka naam/address/phone (report ke upar)
export const getHospital = async () => {
    const s = await getDoc(doc(db, "settings", "hospital"));
    return s.exists()
        ? (s.data() as any)
        : { name: "", address: "", phone: "" };
};

export const saveHospital = async (h: any) => {
    await setDoc(doc(db, "settings", "hospital"), h, { merge: true });
};