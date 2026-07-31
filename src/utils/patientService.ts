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
    where,
} from "firebase/firestore";

import { updateDoc } from "firebase/firestore";

export const updatePatient = async (
    patientId: string,
    data: any
) => {

    await updateDoc(
        doc(db, "patients", patientId),
        data
    );

};

// Generate Patient ID
export const generatePatientId = async () => {

    const counterRef = doc(db, "counters", "patient");
    //runtransaction islia use kra k dublicatie patient id na genrate hujye aik typ py agr 2 new patient aty to 

    const patientId = await runTransaction(db, async (transaction) => {

        const counterDoc = await transaction.get(counterRef);

        let lastNumber = 0;

        if (counterDoc.exists()) {
            lastNumber = counterDoc.data().lastNumber || 0;
        }

        lastNumber++;

        transaction.set(
            counterRef,
            {
                lastNumber,
            },
            { merge: true }
        );

        //padstring length of string k lia p-000004

        return `P-${lastNumber.toString().padStart(6, "0")}`;
    });

    return patientId;
};

// Find Existing Patient
export const findPatient = async (
    phone: string,
    name: string,
    gender: string,
    DOB: string,
    age: string
) => {

    const q = query(
        collection(db, "patients"),
        where("phone", "==", phone),
        where("name", "==", name),
        where("gender", "==", gender),
        where("DOB", "==", DOB),
        where("age", "==", age)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data();
};

// Create New Patient
export const createPatient = async (data: any) => {

    await setDoc(
        doc(db, "patients", data.patientId),
        {
            //...data its me copying whole data in once  otherivise we have to write like name:data.name

            ...data,
            createdAt: serverTimestamp(),
        }
    );

    return data.patientId;
};

// Get Patient By Patient ID
export const getPatient = async (patientId: string) => {

    const ref = doc(db, "patients", patientId);

    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
};
