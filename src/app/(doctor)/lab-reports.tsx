import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DoctorLabReports() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, "labOrders"), where("doctorId", "==", user.uid));
        const unsub = onSnapshot(q,
            (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
                .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))),
            (e) => console.log("[doc-lab]", e.code));
        return () => unsub();
    }, [user?.uid]);

    const list = useMemo(() => {
        const t = search.trim().toLowerCase();
        if (!t) return orders;
        return orders.filter((o) => [o.orderNo, o.patientName, o.patientId, o.phone].join(" ").toLowerCase().includes(t));
    }, [orders, search]);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#EEF5FF" }}>
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ marginLeft: 14 }}>
                    <Text style={s.title}>Lab Reports</Text>
                    <Text style={{ color: "#DBEAFE" }}>Sirf aap ke diye hue tests</Text>
                </View>
            </View>
            <View style={s.search}>
                <Ionicons name="search" size={20} color="#64748B" />
                <TextInput placeholder="Patient ID / Name / Phone / Order No" value={search}
                    onChangeText={setSearch} style={{ flex: 1, marginLeft: 10 }} />
            </View>
            {list.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 40 }}>Koi lab order nahi.</Text>
            ) : list.map((o) => {
                const ready = o.status === "Report Ready" || o.status === "Delivered";
                return (
                    <TouchableOpacity key={o.id} style={s.card}
                        onPress={() => router.push({ pathname: "/(doctor)/lab-report-view", params: { orderId: o.id } })}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ fontWeight: "800", color: "#0D9488" }}>{o.orderNo}</Text>
                            <Text style={{ fontWeight: "700", color: ready ? "#16A34A" : "#D97706" }}>{o.status}</Text>
                        </View>
                        <Text style={{ fontSize: 17, fontWeight: "700", marginTop: 4 }}>{o.patientName}</Text>
                        <Text style={{ color: "#64748B" }}>ID: {o.patientId}</Text>
                        <Text style={{ color: "#64748B" }}>{(o.tests || []).map((t: any) => t.name).join(", ") || o.requestedNotes}</Text>
                    </TouchableOpacity>
                );
            })}
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "700" },
    search: { margin: 15, backgroundColor: "#fff", borderRadius: 14, height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, elevation: 2 },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 12, borderRadius: 15, padding: 15, elevation: 3 },
});