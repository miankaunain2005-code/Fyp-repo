import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PharmacyBillHistory() {
    const [loading, setLoading] = useState(true);
    const [bills, setBills] = useState<any[]>([]);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const q = query(collection(db, "bills"), where("source", "==", "counter"));
            const snap = await getDocs(q);
            const data = snap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setBills(data);
        } catch (error) { console.log(error); }
        setLoading(false);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🧾 Pharmacy Bill History</Text>
            </View>

            {bills.length === 0 ? (
                <Text style={styles.emptyText}>No bills generated yet.</Text>
            ) : (
                bills.map((bill: any) => (
                    <View key={bill.id} style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons name="person" size={20} color="#2563EB" />
                            <Text style={styles.name}>{bill.patientName}</Text>
                        </View>
                        <Text style={styles.info}>ID: {bill.patientId} • {bill.phone}</Text>
                        <Text style={styles.info}>Items: {bill.items?.length}</Text>
                        <View style={styles.footerRow}>
                            <Text style={styles.total}>Rs {bill.total?.toFixed(0)}</Text>
                            <Text style={styles.pharmacist}>By: {bill.pharmacistName}</Text>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F7FC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { backgroundColor: "#2563EB", paddingTop: 55, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
    emptyText: { color: "#64748B", textAlign: "center", marginTop: 40 },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 15, elevation: 3 },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    name: { fontSize: 16, fontWeight: "700", marginLeft: 8, color: "#0F172A" },
    info: { color: "#6B7280", marginBottom: 3 },
    footerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10 },
    total: { fontSize: 18, fontWeight: "800", color: "#2563EB" },
    pharmacist: { color: "#6B7280", fontSize: 13 },
});