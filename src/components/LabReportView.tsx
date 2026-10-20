import { getHospital } from "@/src/utils/labService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const flagColor = (f: string) => (f === "High" ? "#DC2626" : "#D97706");
const fmt = (t: any) => (t?.seconds ? new Date(t.seconds * 1000).toLocaleString() : "-");

export default function LabReportView({ order }: { order: any }) {
    const [hospital, setHospital] = useState<any>({ name: "", address: "", phone: "" });
    useEffect(() => { getHospital().then(setHospital).catch(() => { }); }, []);

    const ready = order.status === "Report Ready" || order.status === "Delivered";

    return (
        <View>
            <View style={s.card}>
                {!!hospital.name && <Text style={s.hosp}>{hospital.name}</Text>}
                {!!hospital.address && <Text style={s.hsub}>{hospital.address}</Text>}
                {!!hospital.phone && <Text style={s.hsub}>Phone: {hospital.phone}</Text>}
                <Text style={s.title}>LABORATORY REPORT</Text>

                <View style={s.grid}>
                    <Text style={s.k}>Patient</Text><Text style={s.v}>{order.patientName}</Text>
                    <Text style={s.k}>Patient ID</Text><Text style={s.v}>{order.patientId}</Text>
                    <Text style={s.k}>Age / Gender</Text><Text style={s.v}>{order.age} / {order.gender}</Text>
                    <Text style={s.k}>Order No</Text><Text style={s.v}>{order.orderNo}</Text>
                    <Text style={s.k}>Referred By</Text><Text style={s.v}>{order.doctorName ? `Dr. ${order.doctorName}` : "Self"}</Text>
                    <Text style={s.k}>Reported</Text><Text style={s.v}>{ready ? fmt(order.readyAt) : "Pending"}</Text>
                </View>
            </View>

            {!ready && (
                <View style={s.card}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="hourglass-outline" size={20} color="#D97706" />
                        <Text style={{ marginLeft: 8, fontWeight: "700" }}>Report abhi tayar nahi</Text>
                    </View>
                    <Text style={s.hsub}>Tayar hote hi yahan khud aa jayegi.</Text>
                    {(order.tests || []).map((t: any, i: number) => (
                        <Text key={i} style={{ marginTop: 6 }}>• {t.name}</Text>
                    ))}
                </View>
            )}

            {ready && (order.tests || []).map((t: any, ti: number) => (
                <View key={ti} style={s.card}>
                    <Text style={s.test}>{t.name}</Text>
                    <View style={[s.tr, s.th]}>
                        <Text style={[s.c1, s.thT]}>Parameter</Text>
                        <Text style={[s.c2, s.thT]}>Result</Text>
                        <Text style={[s.c3, s.thT]}>Unit</Text>
                        <Text style={[s.c4, s.thT]}>Normal</Text>
                    </View>
                    {(t.parameters || []).map((p: any, pi: number) => {
                        const abn = p.flag === "High" || p.flag === "Low";
                        return (
                            <View key={pi} style={s.tr}>
                                <Text style={s.c1}>{p.name}</Text>
                                <Text style={[s.c2, abn && { color: flagColor(p.flag), fontWeight: "800" }]}>
                                    {p.value}{abn ? (p.flag === "High" ? " ▲" : " ▼") : ""}
                                </Text>
                                <Text style={s.c3}>{p.unit}</Text>
                                <Text style={s.c4}>{p.low != null || p.high != null ? `${p.low ?? ""}-${p.high ?? ""}` : "-"}</Text>
                            </View>
                        );
                    })}
                </View>
            ))}

            {ready && !!order.remarks && (
                <View style={s.card}>
                    <Text style={s.test}>Remarks</Text>
                    <Text>{order.remarks}</Text>
                </View>
            )}

            {ready && (
                <Text style={[s.hsub, { textAlign: "center", marginTop: 14 }]}>
                    Computer generated report. {order.technicianName ? `Lab: ${order.technicianName}` : ""}
                </Text>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 14, borderRadius: 15, padding: 15, elevation: 3 },
    hosp: { textAlign: "center", fontSize: 20, fontWeight: "800", color: "#0F172A" },
    hsub: { textAlign: "center", color: "#64748B", fontSize: 12, marginTop: 3 },
    title: { textAlign: "center", fontWeight: "800", letterSpacing: 2, color: "#0D9488", marginVertical: 12 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    k: { width: "35%", color: "#64748B", fontSize: 13, paddingVertical: 4 },
    v: { width: "65%", fontWeight: "700", fontSize: 13, paddingVertical: 4 },
    test: { fontSize: 16, fontWeight: "800", marginBottom: 8, color: "#0D9488" },
    tr: { flexDirection: "row", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
    th: { backgroundColor: "#F1F5F9", borderTopWidth: 0, borderRadius: 6 },
    thT: { fontWeight: "800", fontSize: 12 },
    c1: { flex: 3, fontSize: 13, paddingLeft: 4 },
    c2: { flex: 2, fontSize: 13, fontWeight: "700" },
    c3: { flex: 1.5, fontSize: 12, color: "#64748B" },
    c4: { flex: 2, fontSize: 12, color: "#64748B" },
});