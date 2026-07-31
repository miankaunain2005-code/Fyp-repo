import SideDrawer from "@/src/components/SideDrawer";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useState } from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function HomeScreen() {
    const { user } = useAuth();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const userName =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Patient";

    const appointment = {
        token: "A-102",
        date: "15 May 2026",
        time: "04:30 PM",
        doctor: "Dr. Ahmed",
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Top Header */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.logo}>MediCare AI</Text>
                    <Text style={styles.subLogo}>Smart OPD & Pharmacy</Text>
                </View>

                <TouchableOpacity style={styles.bell} onPress={() => setDrawerVisible(true)}>
                    <Ionicons name="menu" size={26} color="#1E3A8A" />
                </TouchableOpacity>
            </View>

            <View style={{ justifyContent: "center", alignItems: "center" }}>
                <LottieView
                    source={require("../../assets/lottie/AI application in healthcare.json")}
                    autoPlay
                    loop
                    style={{ width: 150, height: 150 }}
                />
            </View>

            {/* Welcome */}
            <View style={styles.userSection}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={50} color="#3B82F6" />
                </View>
                <View style={{ marginLeft: 15 }}>
                    <Text style={styles.welcome}>Welcome,</Text>
                    <Text style={styles.userName}>{userName}</Text>
                </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(main)/prescriptionhistory")}>
                    <Text style={styles.primaryText}>View Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(main)/profile")}>
                    <Text style={styles.secondaryText}>View Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Appointment */}
            <View style={styles.appointmentCard}>
                <View style={styles.appointmentIcon}>
                    <Ionicons name="calendar" size={34} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.appointmentText}>Your next appointment</Text>
                    <Text style={styles.dayText}>Token: {appointment.token}</Text>
                </View>
                <View>
                    <Text style={styles.dateText}>📅 {appointment.date}</Text>
                    <Text style={styles.timeText}>🕓 {appointment.time}</Text>
                </View>
            </View>

            {/* Section */}
            <Text style={styles.sectionTitle}>What do you need?</Text>

            <View style={styles.grid}>
                <TouchableOpacity style={styles.card} onPress={() => router.push("/(main)/consult")}>
                    <View style={[styles.iconCircle, { backgroundColor: "#DBEAFE" }]}>
                        <Ionicons name="medical" size={32} color="#3B82F6" />
                    </View>
                    <Text style={styles.cardTitle}>Consult Doctor</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push("/(main)/prescriptionhistory")}>
                    <View style={[styles.iconCircle, { backgroundColor: "#DCFCE7" }]}>
                        <Ionicons name="document-text" size={32} color="#16A34A" />
                    </View>
                    <Text style={styles.cardTitle}>Prescription History</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push("/ai")}>
                    <View style={[styles.iconCircle, { backgroundColor: "#EDE9FE" }]}>
                        <MaterialCommunityIcons name="face-agent" size={32} color="#7C3AED" />
                    </View>
                    <Text style={styles.cardTitle}>AI Chatbot</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push("/pharmacy")}>
                    <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
                        <Ionicons name="medkit" size={32} color="#F59E0B" />
                    </View>
                    <Text style={styles.cardTitle}>Pharmacy</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push("/(main)/order-history")}>
                    <View style={[styles.iconCircle, { backgroundColor: "#FEE2E2" }]}>
                        <Ionicons name="receipt" size={32} color="#DC2626" />
                    </View>
                    <Text style={styles.cardTitle}>My Bills</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.card} onPress={() => router.push("/(main)/cart")}>
                    <View style={[styles.iconCircle, { backgroundColor: "#E0F2FE" }]}>
                        <Ionicons name="cart" size={32} color="#0284C7" />
                    </View>
                    <Text style={styles.cardTitle}>My Cart</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 120 }} />

            <SideDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                name={userName}
                roleLabel="Patient"
                accentColor="#3B82F6"
                menuItems={[
                    { icon: "person-circle-outline", label: "My Profile", onPress: () => router.push("/(main)/profile") },
                    { icon: "document-text-outline", label: "Prescription History", onPress: () => router.push("/(main)/prescriptionhistory") },
                    { icon: "receipt-outline", label: "My Bills & Orders", onPress: () => router.push("/(main)/order-history") },
                    { icon: "cart-outline", label: "My Cart", onPress: () => router.push("/(main)/cart") },
                ]}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#EEF5FF", paddingHorizontal: 20 },
    topBar: { marginTop: 60, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    logo: { fontSize: 28, fontWeight: "700", color: "#1E3A8A" },
    subLogo: { color: "#64748B", marginTop: 3 },
    bell: { backgroundColor: "#fff", width: 55, height: 55, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 3 },
    userSection: { flexDirection: "row", alignItems: "center", marginTop: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
    welcome: { fontSize: 18, color: "#475569" },
    userName: { fontSize: 34, fontWeight: "700", color: "#0F172A" },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 25 },
    primaryButton: { width: "48%", height: 55, borderRadius: 30, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center" },
    secondaryButton: { width: "48%", height: 55, borderRadius: 30, borderWidth: 1, borderColor: "#BFDBFE", justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    primaryText: { color: "#fff", fontWeight: "700" },
    secondaryText: { color: "#3B82F6", fontWeight: "700" },
    appointmentCard: { marginTop: 25, backgroundColor: "#fff", borderRadius: 24, padding: 20, flexDirection: "row", alignItems: "center" },
    appointmentIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", marginRight: 15 },
    appointmentText: { color: "#64748B" },
    dayText: { fontSize: 28, fontWeight: "700", color: "#0F172A" },
    dateText: { color: "#334155", marginBottom: 5 },
    timeText: { color: "#334155" },
    sectionTitle: { marginTop: 35, marginBottom: 15, fontSize: 24, fontWeight: "700", color: "#0F172A" },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    card: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 24,
        alignItems: "center",
        paddingVertical: 28,
        marginBottom: 18,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    cardTitle: { fontWeight: "600", fontSize: 15, color: "#0F172A", textAlign: "center", paddingHorizontal: 10 },
});