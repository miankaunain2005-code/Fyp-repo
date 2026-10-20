import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const COLORS: any = {
    Requested: ["#FEF3C7", "#D97706"], "Sample Collected": ["#DBEAFE", "#2563EB"],
    Processing: ["#EDE9FE", "#0D9488"], "Report Ready": ["#DCFCE7", "#16A34A"],
    Delivered: ["#E2E8F0", "#475569"],
};

export default function LabDashboard() {
    const { user, role, profile } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"active" | "ready" | "all">("active");

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
            (e) => console.log("[lab-orders]", e.code),
        );
        return () => unsub();
    }, [user?.uid, role]);

    const list = useMemo(() => {
        let l = orders;
        if (filter === "active") l = l.filter((o) => ["Requested", "Sample Collected", "Processing"].includes(o.status));
        if (filter === "ready") l = l.filter((o) => o.status === "Report Ready");
        const t = search.trim().toLowerCase();
        if (!t) return l;
        return l.filter((o) =>
            [o.orderNo, o.patientName, o.patientId, o.phone].join(" ").toLowerCase().includes(t),
        );
    }, [orders, filter, search]);



    const active = orders.filter((o) => ["Requested", "Sample Collected", "Processing"].includes(o.status)).length;
    const ready = orders.filter((o) => o.status === "Report Ready").length;

    return (
        <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
            <View style={s.top}>
                <View>
                    <Text style={s.logo}>MediCare AI</Text>
                    <Text style={s.sub}>Lab • {profile?.name || "Technician"}</Text>
                </View>

            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>


            </View>
            <View style={s.stats}>
                <View style={s.stat}><Text style={s.statV}>{active}</Text><Text style={s.statL}>In Progress</Text></View>
                <View style={s.stat}><Text style={[s.statV, { color: "#16A34A" }]}>{ready}</Text><Text style={s.statL}>Report Ready</Text></View>
                <View style={s.stat}><Text style={s.statV}>{orders.length}</Text><Text style={s.statL}>Total</Text></View>
            </View>

            <TouchableOpacity style={s.primary} onPress={() => router.push("/(lab)/new-order")}>
                <Ionicons name="add-circle" size={26} color="#fff" />
                <Text style={s.primaryT}>New Lab Order</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={s.second} onPress={() => router.push("/(lab)/find-report")}>
                    <Ionicons name="search" size={20} color="#0D9488" /><Text style={s.secondT}>Find Report</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.second, { marginTop: 10 }]} onPress={() => router.push("/(lab)/history")}>
                    <Ionicons name="time" size={20} color="#0D9488" /><Text style={s.secondT}>Report & Bill History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.second} onPress={() => router.push("/(lab)/catalog")}>
                    <Ionicons name="flask" size={20} color="#0D9488" /><Text style={s.secondT}>Test Catalog</Text>
                </TouchableOpacity>
            </View>

            <View style={s.searchBox}>
                <Ionicons name="search" size={18} color="#64748B" />
                <TextInput placeholder="Order No / Name / Patient ID / Phone" value={search}
                    onChangeText={setSearch} style={{ flex: 1, marginLeft: 8 }} />
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {(["active", "ready", "all"] as const).map((k) => (
                    <TouchableOpacity key={k} onPress={() => setFilter(k)} style={[s.chip, filter === k && s.chipOn]}>
                        <Text style={[s.chipT, filter === k && { color: "#fff" }]}>
                            {k === "active" ? "In Progress" : k === "ready" ? "Ready" : "All"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {list.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 40 }}>Koi order nahi.</Text>
            ) : (
                list.map((o) => {
                    const c = COLORS[o.status] || ["#E2E8F0", "#475569"];
                    return (
                        <TouchableOpacity key={o.id} style={s.card}
                            onPress={() => router.push({ pathname: "/(lab)/order-detail", params: { orderId: o.id } })}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={s.orderNo}>{o.orderNo}</Text>
                                <View style={[s.badge, { backgroundColor: c[0] }]}>
                                    <Text style={{ color: c[1], fontWeight: "700", fontSize: 11 }}>{o.status}</Text>
                                    {!!o.technicianName && o.status !== "Requested" && (
                                        <Text style={s.info}>🧑‍🔬 {o.technicianName}</Text>
                                    )}
                                </View>
                            </View>
                            <Text style={s.pname}>{o.patientName}</Text>
                            <Text style={s.info}>ID: {o.patientId} • {o.phone}</Text>
                            <Text style={s.info}>{(o.tests || []).map((t: any) => t.name).join(", ") || "Tests abhi select nahi"}</Text>


                            {!!o.lockedBy &&
                                Date.now() - (o.lockedAtMs || 0) < 20 * 60 * 1000 && (
                                    <Text style={[s.info, { color: "#DC2626", fontWeight: "700" }]}>
                                        🔒 {o.lockedByName} kaam kar raha hai
                                    </Text>
                                )}

                            {o.source === "doctor" && <Text style={s.info}>👨‍⚕️ Dr. {o.doctorName}</Text>}
                            <Text style={s.total}>Rs {Number(o.total || 0)} {o.paid ? "• Paid ✅" : "• Unpaid"}</Text>
                        </TouchableOpacity>
                    );
                })
            )}
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F5F3FF", paddingHorizontal: 18 },
    top: { marginTop: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    logo: { fontSize: 26, fontWeight: "700", color: "#157e75" },
    sub: { color: "#64748B", marginTop: 3 },
    iconBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 3 },
    stats: { flexDirection: "row", gap: 10, marginTop: 20 },
    stat: { flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 16, alignItems: "center", elevation: 2 },
    statV: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
    statL: { color: "#64748B", fontSize: 11, marginTop: 3 },
    primary: { backgroundColor: "#0D9488", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 },
    primaryT: { color: "#fff", fontSize: 17, fontWeight: "700" },
    second: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 8, elevation: 2 },
    secondT: { fontWeight: "700", color: "#0F172A" },
    searchBox: { marginTop: 16, backgroundColor: "#fff", borderRadius: 14, height: 48, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, elevation: 2 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
    chipOn: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
    chipT: { color: "#64748B", fontWeight: "600", fontSize: 13 },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 15, marginTop: 12, elevation: 3 },
    orderNo: { fontWeight: "800", color: "#0D9488" },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    pname: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginTop: 6 },
    info: { color: "#64748B", marginTop: 3, fontSize: 13 },
    total: { marginTop: 8, fontWeight: "800", color: "#0F172A" },
});