import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import {
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";

import SlipPopup from "@/src/components/SlipPopup";

export default function MyAppointments() {

    const [list, setList] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [visible, setVisible] = useState(false);
    const { user } = useAuth();
    useEffect(() => {

        if (!user) return;

        const q = query(
            collection(db, "appointments"),
            where("userId", "==", user.uid)
        );
        //.map method ya alg alg card bnta distinguidh krta h or sb aik br chlta phr nxt k lia 
        const unsub = onSnapshot(q, (snapshot) => {

            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setList(data);

        });

        return () => unsub();

    }, [user]);

    return (
        <ScrollView style={{ padding: 20 }}>

            <Text style={{ fontSize: 22, fontWeight: "800" }}>
                My Appointments
            </Text>

            {list.length === 0 && (
                <Text style={{ marginTop: 20, color: "gray" }}>
                    No appointments yet
                </Text>
            )}

            {list.map((item, i) => (
                <TouchableOpacity
                    key={i}
                    onPress={() => {
                        setSelected(item);
                        setVisible(true);
                    }}
                    style={{
                        backgroundColor: "#fff",
                        padding: 15,
                        marginTop: 10,
                        borderRadius: 10
                    }}
                >
                    <Text>Token: {item.token}</Text>
                    <Text>Patient ID: {item.patientId}</Text>
                    <Text>Doctor: {item.doctorName}</Text>
                    <Text>Name: {item.name}</Text>
                    <Text>Date: {item.date}</Text>
                    <Text>Status: {item.status}</Text>
                </TouchableOpacity>
            ))}

            {/* POPUP */}
            <SlipPopup
                visible={visible}
                data={selected}
                onClose={() => setVisible(false)}
            />

        </ScrollView>
    );
}
