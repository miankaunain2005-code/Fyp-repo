import { db } from "@/src/config/firebaseConfig";
import { normalizeDigits } from "@/src/utils/inputFormatters";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function FindReport() {
    const [key, setKey] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const search = async () => {
        const k = key.trim().toUpperCase();
        if (!k || !phone.trim()) {
            Alert.alert("Required", "Order No ya Patient ID, aur phone dono daalein.");
            return;
        }
        setLoading(true);
        try {
            const field = k.startsWith("LAB-") ? "orderNo" : "patientId";
            const snap = await getDocs(query(collection(db, "labOrders"), where(field, "==", k)));
            const list = snap.docs
                .map((d) => ({ id: d.id, ...(d.data() as any) }))
                .filter((o) => normalizeDigits(o.phone) === normalizeDigits(phone))
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setResults(list);
            if (list.length === 0) Alert.alert("Nahi Mila", "Order No/ID aur phone match nahi hue.");
        } catch (e) {
            console.log(e);
            Alert.alert("Error", "Search nahi ho saki.");
        }
        setLoading(false);
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>Find Report</Text>
            </View>
            <View style={s.card}>
                <Text style={{ color: "#64748B", marginBottom: 10 }}>
                    Privacy ki wajah se sirf Order No ya Patient ID plus phone se report milti hai.
                </Text>
                <TextInput placeholder="LAB-0001 ya P-000012" value={key} onChangeText={setKey} autoCapitalize="characters" style={s.input} />
                <TextInput placeholder="Patient ka phone" value={phone} onChangeText={setPhone} keyboardType="number-pad" style={s.input} />
                <TouchableOpacity style={s.btn} onPress={search} disabled={loading}>
                    {loading ? <ActivityIndicator color="#0D9488" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Search</Text>}
                </TouchableOpacity>
            </View>
            {results.map((o) => (
                <TouchableOpacity key={o.id} style={s.card}
                    onPress={() => router.push({ pathname: "/(lab)/order-detail", params: { orderId: o.id } })}>
                    <Text style={{ fontWeight: "800", color: "#0D9488" }}>{o.orderNo} • {o.status}</Text>
                    <Text style={{ fontWeight: "700", marginTop: 4 }}>{o.patientName}</Text>
                    <Text style={{ color: "#64748B" }}>{(o.tests || []).map((t: any) => t.name).join(", ")}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 14 },
    card: { backgroundColor: "#fff", margin: 15, marginBottom: 0, borderRadius: 15, padding: 15, elevation: 3 },
    input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 },
    btn: { backgroundColor: "#0D9488", height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center" },
});