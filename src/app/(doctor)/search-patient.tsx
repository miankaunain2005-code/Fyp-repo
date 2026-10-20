import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import {
    ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

export default function SearchPatient() {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [results, setResults] = useState<any[]>([]);
    const [patient, setPatient] = useState<any>(null);

    const searchPatient = async () => {
        if (!search.trim()) {
            Alert.alert("Required", "Enter patientid, name or phone");
            return;
        }
        setLoading(true);
        setPatient(null);
        try {
            const q = query(collection(db, "appointments"), where("doctorId", "==", user?.uid));
            const snap = await getDocs(q);
            const term = search.trim().toLowerCase();

            const matches = snap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((item: any) => {
                    return (
                        item.patientId?.toLowerCase().includes(term) ||
                        item.phone?.includes(search.trim()) ||
                        item.name?.toLowerCase().includes(term)
                    );
                });

            if (matches.length === 0) {
                Alert.alert("Not Found", "No matching patient found.");
                setResults([]);
            } else {
                setResults(matches);
            }
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Search Patient</Text>
            <Text style={styles.subtitle}>Enter Patient ID, Phone or Name</Text>

            <View style={styles.searchBox}>
                <Ionicons name="search" size={22} color="#2563EB" />
                <TextInput
                    placeholder="P-000001 / 03001234567 / Ali"
                    value={search}
                    onChangeText={setSearch}
                    style={styles.input}
                />
            </View>

            <TouchableOpacity style={styles.searchBtn} onPress={searchPatient}>
                {loading ? <ActivityIndicator color="#0D9488" /> : <Text style={styles.searchText}>Search</Text>}
            </TouchableOpacity>

            {!patient && results.length > 0 && (
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.resultCount}>{results.length} result{results.length > 1 ? "s" : ""} found</Text>
                    {results.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.resultCard} onPress={() => setPatient(item)}>
                            <View style={styles.resultIcon}>
                                <Ionicons name="person" size={26} color="#2563EB" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.resultName}>{item.name}</Text>
                                <Text style={styles.resultInfo}>Token: {item.token} • {item.date}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {patient && (
                <View style={styles.patientCard}>
                    <TouchableOpacity onPress={() => setPatient(null)} style={{ marginBottom: 10 }}>
                        <Text style={{ color: "#2563EB", fontWeight: "700" }}>← Back to results</Text>
                    </TouchableOpacity>

                    <View style={styles.avatar}>
                        <Ionicons name="person" size={45} color="#2563EB" />
                    </View>

                    <Text style={styles.name}>{patient.name}</Text>

                    <View style={styles.row}><Text style={styles.label}>Appointment Token</Text><Text style={styles.value}>{patient.token}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Age</Text><Text style={styles.value}>{patient.age}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Gender</Text><Text style={styles.value}>{patient.gender}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Patient ID</Text><Text style={styles.value}>{patient.patientId}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{patient.phone}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Doctor</Text><Text style={styles.value}>{patient.doctorName}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{patient.date}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Time</Text><Text style={styles.value}>{patient.time}</Text></View>

                    <View style={styles.statusBox}><Text style={styles.statusText}>{patient.status}</Text></View>

                    <TouchableOpacity
                        style={[styles.openBtn, patient.consultationCompleted && { backgroundColor: "#9CA3AF" }]}
                        disabled={patient.consultationCompleted}
                        onPress={() =>
                            router.push({
                                pathname: "/doctor-consultation",
                                params: {
                                    appointmentId: patient.id, token: patient.token, patientName: patient.name,
                                    age: patient.age, gender: patient.gender, phone: patient.phone,
                                    date: patient.date, time: patient.time, patientId: patient.patientId,
                                    userId: patient.userId, doctorId: patient.doctorId,
                                    doctorName: patient.doctorName, doctorEmail: patient.doctorEmail,
                                },
                            })
                        }
                    >
                        <Ionicons name="medkit" size={22} color="#fff" />
                        <Text style={styles.openText}>
                            {patient.consultationCompleted ? "Consultation Completed" : "Open Consultation"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#EEF5FF", padding: 20 },
    title: { fontSize: 30, fontWeight: "800", color: "#0F172A", marginTop: 25 },
    subtitle: { marginTop: 25, marginBottom: 10, color: "#64748B", fontSize: 15 },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, height: 60, elevation: 4 },
    input: { flex: 1, marginLeft: 12, fontSize: 16 },
    searchBtn: { backgroundColor: "#0D9488", height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 20, elevation: 4 },
    searchText: { color: "#fff", fontSize: 18, fontWeight: "700" },
    resultCount: { color: "#64748B", marginBottom: 10, fontWeight: "600" },
    resultCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 15, padding: 15, marginBottom: 10, elevation: 3 },
    resultIcon: { width: 45, height: 45, borderRadius: 25, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", marginRight: 12 },
    resultName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    resultInfo: { color: "#64748B", marginTop: 3, fontSize: 13 },
    patientCard: { marginTop: 30, backgroundColor: "#fff", borderRadius: 25, padding: 22, elevation: 5, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", alignSelf: "center" },
    name: { textAlign: "center", marginTop: 15, fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 20 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    label: { color: "#64748B", fontSize: 16 },
    value: { fontWeight: "700", fontSize: 16, color: "#0F172A" },
    statusBox: { alignSelf: "center", marginTop: 10, backgroundColor: "#DCFCE7", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 30 },
    statusText: { color: "#16A34A", fontWeight: "700" },
    openBtn: { marginTop: 30, backgroundColor: "#0D9488", height: 60, borderRadius: 18, justifyContent: "center", alignItems: "center", flexDirection: "row" },
    openText: { color: "#fff", fontWeight: "700", fontSize: 18, marginLeft: 10 },
});