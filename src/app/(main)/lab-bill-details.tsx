import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LabBillDetails() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [o, setO] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        return onSnapshot(doc(db, "labOrders", orderId),
            (s) => { setO(s.exists() ? { id: s.id, ...(s.data() as any) } : null); setLoading(false); },
            () => setLoading(false));
    }, [orderId]);

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
    if (!o) return <View style={s.center}><Text>Bill nahi mila.</Text></View>;

    const ready = o.status === "Report Ready" || o.status === "Delivered";
    const when = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : "";

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F4F7FC" }}>
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>🧪 Lab Bill</Text>
            </View>

            <View style={s.card}>
                <Text style={s.h}>{o.orderNo}</Text>
                <Text style={s.i}>Patient: {o.patientName} ({o.patientId})</Text>
                <Text style={s.i}>Tareekh: {when}</Text>
                {!!o.doctorName && <Text style={s.i}>Dr. {o.doctorName}</Text>}
                <Text style={s.i}>Report: {o.status}</Text>
            </View>

            <View style={s.card}>
                <Text style={s.h}>Tests</Text>
                {(o.tests || []).map((t: any, i: number) => (
                    <View key={i} style={s.row}>
                        <Text style={{ flex: 1 }}>{t.name}</Text>
                        <Text style={{ fontWeight: "700" }}>Rs {t.price}</Text>
                    </View>
                ))}
                <View style={[s.row, { borderTopWidth: 2 }]}>
                    <Text style={{ flex: 1, fontWeight: "800" }}>Total</Text>
                    <Text style={{ fontWeight: "800", color: "#0D9488" }}>Rs {Number(o.total || 0)}</Text>
                </View>
                <Text style={{ marginTop: 8, fontWeight: "700", color: o.paid ? "#16A34A" : "#D97706" }}>
                    {o.paid ? "Paid ✅" : "Unpaid"}
                </Text>
            </View>

            <TouchableOpacity
                style={[s.btn, !ready && { opacity: 0.5 }]}
                disabled={!ready}
                onPress={() => router.push({ pathname: "/(main)/lab-report-details", params: { orderId: o.id } })}
            >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{ready ? "Report Dekhein" : "Report abhi tayar nahi"}</Text>
            </TouchableOpacity>
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 14 },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 14, borderRadius: 15, padding: 15, elevation: 3 },
    h: { fontSize: 17, fontWeight: "800", marginBottom: 6 },
    i: { color: "#64748B", marginTop: 3 },
    row: { flexDirection: "row", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
    btn: { backgroundColor: "#0D9488", marginHorizontal: 15, marginTop: 16, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});