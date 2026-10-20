import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification,
  signInWithEmailAndPassword, signOut, User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebaseConfig";
import { normalizeDigits } from "../utils/inputFormatters";
import { createPatient, generatePatientId, linkPatientToUser } from "../utils/patientService";
import { storage } from "../utils/storage";

type Role = "patient" | "doctor" | "pharmacy" | "reception" | "admin" | "lab" | null;

type AuthContextType = {
  user: User | null;
  role: Role;
  profile: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string, email: string, password: string, phone: string,
    DOB: string, gender: string, age: string,
    existingPatientId?: string | null, activationCode?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = storage.getString("user");
    if (cached) {
      try { setRole(JSON.parse(cached).role); } catch { }
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          const d = snap.data();
          setRole((d?.role as Role) ?? null);
          setProfile(d ?? null);
          storage.set("user", JSON.stringify({
            uid: firebaseUser.uid, email: firebaseUser.email,
            role: d?.role, patientId: d?.patientId,
          }));
        } catch (e) {
          console.log("AUTH PROFILE LOAD ERROR:", e);
        }
      } else {
        storage.remove("user");
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
    setProfile(snap.data() ?? null);
  };

  const login = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", res.user.uid));
    const d = snap.data();
    setRole((d?.role as Role) ?? null);
    setProfile(d ?? null);
    storage.set("user", JSON.stringify({
      uid: res.user.uid, email: res.user.email, role: d?.role, patientId: d?.patientId,
    }));
    setUser(res.user);
  };

  const register = async (
    name: string, email: string, password: string, phone: string,
    DOB: string, gender: string, age: string,
    existingPatientId?: string | null, activationCode?: string,
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const cleanPhone = normalizeDigits(phone);
    const cleanDOB = normalizeDigits(DOB);
    const withCode = !!(existingPatientId && activationCode);
    let patientId = "";

    try {
      if (withCode) {
        patientId = existingPatientId!.trim().toUpperCase();
        await linkPatientToUser(patientId, activationCode!, res.user.uid);
      } else {
        patientId = await generatePatientId();
        await createPatient({
          patientId, name, phone: cleanPhone, gender, DOB: cleanDOB, age,
          linkedUserId: res.user.uid,
        });
      }

      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid, name, phone: cleanPhone, email: cleanEmail,
        role: "patient", patientId,
        recordLinked: withCode, // false = baad mein profile se link kar sakta hai
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      await res.user.delete().catch(() => { }); // adha bana account saaf
      throw e;
    }

    await sendEmailVerification(res.user).catch((e) => console.log("VERIFY MAIL:", e));

    storage.set("user", JSON.stringify({
      uid: res.user.uid, email: cleanEmail, role: "patient", patientId,
    }));
    setRole("patient");
    setProfile({
      uid: res.user.uid, name, email: cleanEmail, role: "patient",
      patientId, recordLinked: withCode,
    });
    setUser(res.user);
  };

  const logout = async () => {
    await signOut(auth);
    storage.remove("user");
    setUser(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, role, loading, profile, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};