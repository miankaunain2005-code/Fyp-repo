import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const pad = (n: number) => String(n).padStart(2, "0");
const dateText = (o: any) => {
    const s = o.createdAt?.seconds;
    if (!s) return "";
    const d = new Date(s * 1000);
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

export default function LabHistory() {
    const { user, role } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [tab, setTab] = useState<"reports" | "bills">("reports");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user?.uid || role !== "lab") return;
        const unsub = onSnapshot(
            collection(db, "labOrders"),
            (s) =>
                setOrders(
                    s.docs
                        .map((d) => ({ id: d.id, ...(d.data() as any) }))
                        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
                ),
            (e) => console.log("[lab-history]", e.code),
        );
        return () => unsub();
    }, [user?.uid, role]);

    const list = useMemo(() => {
        let l = tab === "reports" ? orders.filter((o) => ["Report Ready", "Delivered"].includes(o.status)) : orders;
        const t = search.trim().toLowerCase().replace(/\//g, "-");
        if (!t) return l;
        return l.filter((o) =>
            [o.orderNo, o.patientName, o.patientId, o.phone, dateText(o)].join(" ").toLowerCase().includes(t),
        );
    }, [orders, tab, search]);

    const collected = list.filter((o) => o.paid).reduce((s, o) => s + Number(o.total || 0), 0);
    const pending = list.filter((o) => !o.paid).reduce((s, o) => s + Number(o.total || 0), 0);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>Lab History</Text>
            </View>

            <View style={s.toggle}>
                {(["reports", "bills"] as const).map((k) => (
                    <TouchableOpacity key={k} style={[s.tab, tab === k && s.tabOn]} onPress={() => setTab(k)}>
                        <Text style={[s.tabT, tab === k && { color: "#fff" }]}>{k === "reports" ? "Reports" : "Bills"}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.search}>
                <Ionicons name="search" size={18} color="#64748B" />
                <TextInput placeholder="Order No / Name / ID / Phone / Date (06-10-2026)" value={search}
                    onChangeText={setSearch} style={{ flex: 1, marginLeft: 8 }} />
            </View>

            {tab === "bills" && (
                <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 15, marginTop: 12 }}>
                    <View style={s.stat}><Text style={[s.sv, { color: "#16A34A" }]}>Rs {collected}</Text><Text style={s.sl}>Paid</Text></View>
                    <View style={s.stat}><Text style={[s.sv, { color: "#D97706" }]}>Rs {pending}</Text><Text style={s.sl}>Unpaid</Text></View>
                </View>
            )}

            {list.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 40 }}>Kuch nahi mila.</Text>
            ) : (
                list.map((o) => (
                    <TouchableOpacity key={o.id} style={s.card}
                        onPress={() => router.push({ pathname: "/(lab)/order-detail", params: { orderId: o.id } })}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ fontWeight: "800", color: "#0D9488" }}>{o.orderNo}</Text>
                            <Text style={{ color: "#64748B", fontSize: 12 }}>{o.status}</Text>
                        </View>
                        <Text style={{ fontWeight: "700", fontSize: 16, marginTop: 4 }}>{o.patientName}</Text>
                        <Text style={s.info}>ID: {o.patientId} • {o.phone}</Text>
                        <Text style={s.info}>{(o.tests || []).map((t: any) => t.name).join(", ")}</Text>
                        <Text style={[s.info, { marginTop: 6 }]}>{dateText(o).split(" ").slice(1).join(" ")}</Text>
                        {tab === "bills" && (
                            <Text style={{ fontWeight: "800", marginTop: 6 }}>
                                Rs {Number(o.total || 0)} {o.paid ? "• Paid ✅" : "• Unpaid"}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))
            )}
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 14 },
    toggle: { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 14, padding: 4, marginHorizontal: 15, marginTop: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
    tabOn: { backgroundColor: "#0D9488" },
    tabT: { color: "#64748B", fontWeight: "700" },
    search: { marginHorizontal: 15, marginTop: 12, backgroundColor: "#fff", borderRadius: 14, height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, elevation: 2 },
    stat: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center", elevation: 2 },
    sv: { fontSize: 18, fontWeight: "800" },
    sl: { color: "#64748B", fontSize: 12 },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 12, borderRadius: 15, padding: 15, elevation: 3 },
    info: { color: "#64748B", marginTop: 3, fontSize: 13 },
});