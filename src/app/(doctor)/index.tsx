import SideDrawer from "@/src/components/SideDrawer";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DoctorDashboard() {
    const { user } = useAuth();
    const doctorName = user?.displayName || user?.email?.split("@")[0] || "Doctor";
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "appointments"), where("doctorId", "==", user.uid));
        const unsub = onSnapshot(q, (snap) => {
            setAppointments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, [user]);

    const todayStr = new Date().toDateString();
    const todaysAppointments = appointments.filter((a: any) => a.date === todayStr);
    const todayAppointments = todaysAppointments.length;
    const completedPatients = todaysAppointments.filter((a: any) => a.status === "Completed").length;
    const pendingPatients = todaysAppointments.filter((a: any) => a.status !== "Completed").length;
    const upcomingList = todaysAppointments.filter((a: any) => a.status !== "Completed").slice(0, 5);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.logo}>MediCare AI</Text>
                    <Text style={styles.subLogo}>Doctor Dashboard</Text>
                </View>
                <TouchableOpacity style={styles.notification} onPress={() => setDrawerVisible(true)}>
                    <Ionicons name="menu" size={24} color="#1E40AF" />
                </TouchableOpacity>
            </View>

            <View style={styles.animationContainer}>
                <LottieView
                    source={require("../../assets/lottie/AI application in healthcare.json")}
                    autoPlay loop style={{ width: 170, height: 170 }}
                />
            </View>

            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Ionicons name="medical" size={55} color="#2563EB" />
                </View>
                <View style={{ marginLeft: 18 }}>
                    <Text style={styles.welcome}>Welcome Back</Text>
                    <Text style={styles.name}>Dr. {doctorName}</Text>
                    <Text style={styles.speciality}>General Physician</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Dashboard Overview</Text>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Ionicons name="calendar" size={34} color="#2563EB" />
                    <Text style={styles.statValue}>{todayAppointments}</Text>
                    <Text style={styles.statTitle}>Today's Appointments</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="people" size={34} color="#F59E0B" />
                    <Text style={styles.statValue}>{pendingPatients}</Text>
                    <Text style={styles.statTitle}>Waiting Patients</Text>
                </View>
            </View>

            <View style={styles.completeCard}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.completeNumber}>{completedPatients}</Text>
                    <Text style={styles.completeText}>Consultations Completed Today</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.grid}>
                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/search-patient")}>
                    <Ionicons name="search" size={55} color="#2563EB" />
                    <Text style={styles.actionTitle}>Search Patient</Text>
                    <Text style={styles.actionSubtitle}>Search using Patient ID</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(doctor)/prisciptionhistory")}>
                    <Ionicons name="document-text" size={55} color="#10B981" />
                    <Text style={styles.actionTitle}>Prescriptions</Text>
                    <Text style={styles.actionSubtitle}>View History</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Today's Appointments</Text>

            {upcomingList.length === 0 ? (
                <Text style={{ color: "#64748B", marginBottom: 20 }}>No pending appointments today.</Text>
            ) : (
                upcomingList.map((item: any) => (
                    <TouchableOpacity key={item.id} style={styles.appointmentCard}>
                        <View style={styles.patientIcon}>
                            <Ionicons name="person" size={35} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientName}>{item.name}</Text>
                            <Text style={styles.patientInfo}>Token : {item.token}</Text>
                            <Text style={styles.patientInfo}>{item.time}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.openButton}
                            onPress={() =>
                                router.push({
                                    pathname: "/(doctor)/consultation",
                                    params: {
                                        appointmentId: item.id, token: item.token, patientName: item.name,
                                        age: item.age, gender: item.gender, phone: item.phone,
                                        date: item.date, time: item.time, patientId: item.patientId,
                                        userId: item.userId, doctorId: item.doctorId,
                                        doctorName: item.doctorName, doctorEmail: item.doctorEmail,
                                    },
                                })
                            }
                        >
                            <Text style={styles.openText}>Open</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))
            )}
            <View style={{ height: 120 }} />
            <SideDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                name={`Dr. ${doctorName}`}
                roleLabel="Doctor"
                accentColor="#2563EB"
                menuItems={[
                    { icon: "search-outline", label: "Search Patient", onPress: () => router.push("/(doctor)/search-patient") },
                    { icon: "document-text-outline", label: "Prescription History", onPress: () => router.push("/(doctor)/prisciptionhistory") },
                ]}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#EEF5FF", paddingHorizontal: 20 },
    topBar: { marginTop: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    logo: { fontSize: 28, fontWeight: "700", color: "#1E3A8A" },
    subLogo: { color: "#64748B", marginTop: 3, fontSize: 15 },
    notification: { width: 55, height: 55, backgroundColor: "#fff", borderRadius: 30, justifyContent: "center", alignItems: "center", elevation: 4 },
    animationContainer: { justifyContent: "center", alignItems: "center", marginTop: 20 },
    profileCard: { backgroundColor: "#fff", borderRadius: 25, padding: 20, flexDirection: "row", alignItems: "center", marginTop: 15, elevation: 4 },
    avatar: { width: 85, height: 85, borderRadius: 45, justifyContent: "center", alignItems: "center", backgroundColor: "#DBEAFE" },
    welcome: { color: "#64748B", fontSize: 16 },
    name: { fontSize: 30, fontWeight: "700", color: "#0F172A" },
    speciality: { color: "#2563EB", marginTop: 5, fontWeight: "600" },
    sectionTitle: { fontSize: 24, fontWeight: "700", color: "#0F172A", marginTop: 30, marginBottom: 15 },
    statsRow: { flexDirection: "row", justifyContent: "space-between" },
    statCard: { width: "48%", backgroundColor: "#fff", borderRadius: 22, paddingVertical: 25, alignItems: "center", elevation: 4 },
    statValue: { fontSize: 34, fontWeight: "700", marginTop: 10, color: "#0F172A" },
    statTitle: { marginTop: 10, color: "#64748B", textAlign: "center", paddingHorizontal: 10 },
    completeCard: { backgroundColor: "#fff", borderRadius: 22, padding: 20, flexDirection: "row", alignItems: "center", marginTop: 18, elevation: 4 },
    completeNumber: { fontSize: 34, fontWeight: "700", color: "#0F172A" },
    completeText: { color: "#64748B", marginTop: 3 },
    actionCard: { width: "48%", backgroundColor: "#fff", borderRadius: 22, alignItems: "center", paddingVertical: 30, marginBottom: 18, elevation: 4 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    actionTitle: { marginTop: 15, fontSize: 17, fontWeight: "700", color: "#0F172A" },
    actionSubtitle: { marginTop: 6, color: "#64748B", textAlign: "center", fontSize: 13 },
    appointmentCard: { backgroundColor: "#fff", borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "center", marginBottom: 18, elevation: 4 },
    patientIcon: { width: 65, height: 65, borderRadius: 35, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", marginRight: 15 },
    patientName: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
    patientInfo: { marginTop: 4, color: "#64748B" },
    openButton: { backgroundColor: "#2563EB", paddingHorizontal: 22, paddingVertical: 10, borderRadius: 15 },
    openText: { color: "#fff", fontWeight: "700" },
});