import LabReportView from "@/src/components/LabReportView";
import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function LabReportDetails() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        const unsub = onSnapshot(doc(db, "labOrders", orderId),
            (s) => { setOrder(s.exists() ? { id: s.id, ...(s.data() as any) } : null); setLoading(false); },
            (e) => { console.log("[lab-details]", e.code); setLoading(false); });
        return () => unsub();
    }, [orderId]);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F4F7FC" }}>
            <View style={{ backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 14 }}>Lab Report</Text>
            </View>
            {loading ? <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 40 }} />
                : order ? <LabReportView order={order} />
                    : <Text style={{ textAlign: "center", marginTop: 40 }}>Report nahi mili.</Text>}
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}