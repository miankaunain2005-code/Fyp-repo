import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User
} from "firebase/auth";

import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { auth, db } from "../config/firebaseConfig";
import {
    createPatient,
    generatePatientId,
} from "../utils/patientService";
import { storage } from "../utils/storage";

type AuthContextType = {
    user: User | null;
    role: "patient" | "doctor" | "pharmacy" | null;
    loading: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<void>;

    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<void>;

    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const [user, setUser] = useState<User | null>(null);

    const [role, setRole] = useState<
        "patient" | "doctor" | "pharmacy" | null
    >(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cached = storage.getString("user");

        if (cached) {
            const data = JSON.parse(cached);
            setRole(data.role);
        }
    }, []);

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser) => {

                setUser(firebaseUser);

                if (firebaseUser) {

                    const snap = await getDoc(
                        doc(db, "users", firebaseUser.uid)
                    );

                    const userData = snap.data();

                    setRole(userData?.role ?? null);

                    storage.set(
                        "user",
                        JSON.stringify({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: userData?.role,
                            patientId: userData?.patientId,
                        })
                    );

                } else {

                    storage.remove("user");
                    setRole(null);

                }

                setLoading(false);

            }
        );

        return unsubscribe;

    }, []);

    const login = async (
        email: string,
        password: string
    ) => {

        const res =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const snap = await getDoc(
            doc(db, "users", res.user.uid)
        );

        const userData = snap.data();

        setRole(userData?.role ?? null);

        storage.set(
            "user",
            JSON.stringify({
                uid: res.user.uid,
                email: res.user.email,
                role: userData?.role,
                patientId: userData?.patientId,
            })
        );

        setUser(res.user);

    };

    const register = async (
        name: string,
        email: string,
        password: string,
        role: "patient" | "doctor" | "pharmacy" = "patient"
    ) => {

        const res =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        let patientId = "";

        if (role === "patient") {

            patientId = await generatePatientId();

            await createPatient({
                patientId,
                name,
                phone: "",
                gender: "",
                age: "",
            });

        }

        await setDoc(doc(db, "users", res.user.uid), {
            uid: res.user.uid,
            name,
            email,
            role,
            patientId: role === "patient" ? patientId : "",
            createdAt: serverTimestamp(),
        });

        storage.set(
            "user",
            JSON.stringify({
                uid: res.user.uid,
                email: res.user.email,
                role,
                patientId,
            })
        );

        setRole(role);
        setUser(res.user);

    };

    const logout = async () => {

        await signOut(auth);

        storage.remove("user");

        setUser(null);
        setRole(null);

    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {

    const ctx = useContext(AuthContext);

    if (!ctx)
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );

    return ctx;
};
