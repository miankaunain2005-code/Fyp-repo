import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const pad = (n: number) => String(n).padStart(2, "0");
const dateText = (o: any) => {
    const s = o.createdAt?.seconds;
    if (!s) return "";
    const d = new Date(s * 1000);
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

export default function LabReports() {
    const { user, profile } = useAuth();
    const [byUser, setByUser] = useState<any[]>([]);
    const [byPatient, setByPatient] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scope, setScope] = useState<"mine" | "others">("mine");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, "labOrders"), where("userId", "==", user.uid));
        const unsub = onSnapshot(q,
            (s) => { setByUser(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))); setLoading(false); },
            (e) => { console.log("[lab-byUser]", e.code); setLoading(false); });
        return () => unsub();
    }, [user?.uid]);

    useEffect(() => {
        if (!profile?.patientId) return;
        const q = query(collection(db, "labOrders"), where("patientId", "==", profile.patientId));
        const unsub = onSnapshot(q,
            (s) => setByPatient(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
            (e) => console.log("[lab-byPatient]", e.code));
        return () => unsub();
    }, [profile?.patientId]);

    const all = useMemo(() => {
        const m = new Map<string, any>();
        [...byUser, ...byPatient].forEach((r) => m.set(r.id, r));
        return Array.from(m.values()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [byUser, byPatient]);

    const pid = profile?.patientId;
    const mine = all.filter((r) => pid && r.patientId === pid);
    const others = all.filter((r) => !pid || r.patientId !== pid);
    const term = search.trim().toLowerCase().replace(/\//g, "-");
    const list = (scope === "mine" ? mine : others).filter((r) =>
        !term || [r.orderNo, r.patientName, r.patientId, r.doctorName, r.status, dateText(r),
        (r.tests || []).map((t: any) => t.name).join(" ")].join(" ").toLowerCase().includes(term));

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F4F7FC" }}>
            <View style={s.header}>
                <Ionicons name="flask" size={42} color="#fff" />
                <Text style={s.title}>Lab Reports</Text>
            </View>

            <View style={s.toggle}>
                {(["mine", "others"] as const).map((k) => (
                    <TouchableOpacity key={k} style={[s.tab, scope === k && s.tabOn]} onPress={() => setScope(k)}>
                        <Text style={[s.tabT, scope === k && { color: "#fff" }]}>
                            {k === "mine" ? `Myself (${mine.length})` : `Someone Else (${others.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.search}>
                <Ionicons name="search" size={20} color="#64748B" />
                <TextInput placeholder="Name, Test, Order No ya Date (06-10-2026)" value={search}
                    onChangeText={setSearch} style={{ flex: 1, marginLeft: 10 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 40 }} />
            ) : list.length === 0 ? (
                <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 40 }}>
                    {term ? "Koi match nahi mila." : "Abhi koi lab report nahi."}
                </Text>
            ) : (
                list.map((o) => {
                    const ready = o.status === "Report Ready" || o.status === "Delivered";
                    return (
                        <TouchableOpacity key={o.id} style={s.card}
                            onPress={() => router.push({ pathname: "/(main)/lab-report-details", params: { orderId: o.id } })}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontWeight: "800", color: "#0D9488" }}>{o.orderNo}</Text>
                                <View style={[s.badge, { backgroundColor: ready ? "#DCFCE7" : "#FEF3C7" }]}>
                                    <Text style={{ fontWeight: "700", fontSize: 11, color: ready ? "#16A34A" : "#D97706" }}>{o.status}</Text>
                                </View>
                            </View>
                            <Text style={s.name}>👤 {o.patientName}</Text>
                            <Text style={s.info}>{(o.tests || []).map((t: any) => t.name).join(", ") || "Tests abhi select nahi"}</Text>
                            {!!o.doctorName && <Text style={s.info}>Dr. {o.doctorName}</Text>}
                            <Text style={s.info}>{dateText(o).split(" ").slice(1).join(" ")}</Text>
                        </TouchableOpacity>
                    );
                })
            )}
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 26, alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    title: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 8 },
    toggle: { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 14, padding: 4, marginHorizontal: 15, marginTop: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
    tabOn: { backgroundColor: "#0D9488" },
    tabT: { color: "#64748B", fontWeight: "700", fontSize: 13 },
    search: { marginHorizontal: 15, marginTop: 12, backgroundColor: "#fff", borderRadius: 14, height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, elevation: 2 },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 12, borderRadius: 15, padding: 15, elevation: 3 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    name: { fontSize: 17, fontWeight: "800", marginTop: 6, color: "#0F172A" },
    info: { color: "#64748B", marginTop: 3, fontSize: 13 },
});