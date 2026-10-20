import SlipPopup from "@/src/components/SlipPopup";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReceptionDashboard() {
  const { user, role, profile, logout } = useAuth();
  const [selected, setSelected] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const receptionistName =
    profile?.name || user?.email?.split("@")[0] || "Receptionist";

  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid || role !== "reception") return;

    const q = query(collection(db, "appointments"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.log("[reception-home] listener error:", error.code),
    );
    return () => unsub();
  }, [user?.uid, role]);

  const todayStr = new Date().toDateString();
  const todaysAppointments = appointments.filter(
    (a: any) => a.date === todayStr,
  );
  const pendingCount = todaysAppointments.filter(
    (a: any) => a.status !== "Completed",
  ).length;
  const completedCount = todaysAppointments.filter(
    (a: any) => a.status === "Completed",
  ).length;

  const recentList = todaysAppointments
    .sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };
  const openSlip = async (item: any) => {
    let activationCode: string | null = null
    try {
      const snap = await getDocs(
        query(collection(db, "patientCodes"), where("patientId", "==", item.patientId))
      )
      if (!snap.empty) activationCode = snap.docs[0].data().code || null;
    } catch (e) {
      console.log("[slip-code]", e);
    }
    setSelected({ ...item, activationCode })
    setVisible(true)

  }
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.logo}>MediCare AI</Text>
          <Text style={styles.subLogo}>Reception Desk</Text>
        </View>

        {/* <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#DC2626" />
        </TouchableOpacity> */}
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.avatar}>
          <Ionicons name="people" size={40} color="#0D9488" />
        </View>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.name}>{receptionistName}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={30} color="#0D9488" />
          <Text style={styles.statValue}>{todaysAppointments.length}</Text>
          <Text style={styles.statTitle}>Todays Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={30} color="#F59E0B" />
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statTitle}>Waiting</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={30} color="#16A34A" />
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statTitle}>Completed</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryAction}
        onPress={() => router.push("/(reception)/book-appointment")}
      >
        <Ionicons name="person-add" size={26} color="#fff" />
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.primaryActionTitle}>New Walk-in Booking</Text>
          <Text style={styles.primaryActionSub}>
            Book appointment for a patient at counter
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={() => router.push("/(reception)/appointments")}
      >
        <Ionicons name="list" size={24} color="#0D9488" />
        <Text style={styles.secondaryActionText}>View All Appointments</Text>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={() => router.push("/(reception)/patient-code")}
      >
        <Ionicons name="key-outline" size={24} color="#0D9488" />
        <Text style={styles.secondaryActionText}>Patient Activation Code</Text>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Bookings</Text>

      {recentList.length === 0 ? (
        <Text style={{ color: "#64748B", marginBottom: 20 }}>
          No bookings yet today.
        </Text>
      ) : (
        recentList.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.appointmentCard}
            onPress={() => openSlip(item)}
          >
            <View style={styles.appointmentCard}>
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenText}>{item.token}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientInfo}>Dr. {item.doctorName}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.status === "Completed" ? "#16A34A" : "#D97706",
                    fontWeight: "700",
                    fontSize: 11,
                  }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

        ))
      )}
      <SlipPopup
        visible={visible}
        data={selected}
        onClose={() => setVisible(false)}
      />
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDFA", paddingHorizontal: 20 },
  topBar: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: 26, fontWeight: "700", color: "#157e75" },
  subLogo: { color: "#64748B", marginTop: 3 },
  logoutBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#CCFBF1",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: { color: "#64748B", fontSize: 14 },
  name: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statCard: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 18,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
    color: "#0F172A",
  },
  statTitle: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 11,
    textAlign: "center",
  },
  primaryAction: {
    backgroundColor: "#0D9488",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    elevation: 4,
  },
  primaryActionTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  primaryActionSub: { color: "#CCFBF1", marginTop: 4, fontSize: 12 },
  secondaryAction: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    elevation: 3,
  },
  secondaryActionText: {
    flex: 1,
    marginLeft: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 28,
    marginBottom: 14,
  },
  appointmentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
  },
  tokenBadge: {
    backgroundColor: "#F0FDFA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 12,
  },
  tokenText: { color: "#0D9488", fontWeight: "800", fontSize: 12 },
  patientName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  patientInfo: { color: "#64748B", marginTop: 3, fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
});
