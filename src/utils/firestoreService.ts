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

    const snapshot = await getDocs(
        query(
            collection(db, "users"),
            where("role", "==", "doctor")
        )
    )
    return snapshot.docs.map(doc => ({
        id: doc.id,
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

export const getMedicines = async () => {
    const snapshot = await getDocs(
        collection(db, "medicines")
    );

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};
