import SlipPopup from "@/src/components/SlipPopup";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReceptionAppointments() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const { user, role } = useAuth();
  useEffect(() => {
    if (!user?.uid || role !== "reception") return;
    const q = query(collection(db, "appointments"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          });
        setAppointments(data);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsub();
  }, [user?.uid, role]);

  const filteredList = useMemo(() => {
    let list = appointments;

    if (filter === "pending") {
      list = list.filter((a: any) => a.status !== "Completed");
    } else if (filter === "completed") {
      list = list.filter((a: any) => a.status === "Completed");
    }

    const term = search.trim().toLowerCase();
    if (!term) return list;

    return list.filter(
      (a: any) =>
        a.name?.toLowerCase().includes(term) ||
        a.patientId?.toLowerCase().includes(term) ||
        a.phone?.includes(search.trim()) ||
        a.doctorName?.toLowerCase().includes(term) ||
        a.token?.toLowerCase().includes(term),
    );
  }, [search, filter, appointments]);
  const openSlip = async (item: any) => {
    let activationCode: string | null = null;
    try {
      const snap = await getDocs(
        query(collection(db, "patientCodes"), where("patientId", "==", item.patientId)),
      );
      if (!snap.empty) activationCode = snap.docs[0].data().code || null;
    } catch (e) {
      console.log("[slip-code]", e);
    }
    setSelected({ ...item, activationCode });
    setVisible(true);
  };
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>All Appointments</Text>
          <Text style={styles.headerSub}>{filteredList.length} results</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Search Name / Patient ID / Phone / Token"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      <View style={styles.chipsRow}>
        {(["all", "pending", "completed"] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.chip, filter === key && styles.chipActive]}
            onPress={() => setFilter(key)}
          >
            <Text
              style={[styles.chipText, filter === key && styles.chipTextActive]}
            >
              {key === "all"
                ? "All"
                : key === "pending"
                  ? "Pending"
                  : "Completed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D9488"
          style={{ marginTop: 60 }}
        />
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={70} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Appointments Found</Text>
        </View>
      ) : (
        filteredList.map((item: any) => (
          <TouchableOpacity key={item.id} style={styles.card} onPress={() => openSlip(item)}>

            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenText}>{item.token}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.info}>ID: {item.patientId}</Text>
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

              <Text style={styles.info}>👨‍⚕️ Dr. {item.doctorName}</Text>
              <Text style={styles.info}>📞 {item.phone}</Text>
              <Text style={styles.dateText}>
                {item.date} • {item.time}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <SlipPopup visible={visible} data={selected} onClose={() => setVisible(false)} />
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDFA" },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff30",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#CCFBF1", marginTop: 4 },
  searchBox: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    elevation: 3,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 14, color: "#111827" },
  chipsRow: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
  chipText: { color: "#64748B", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  emptyContainer: { alignItems: "center", marginTop: 70 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    marginTop: 14,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 16,
    padding: 15,
    elevation: 3,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  tokenBadge: {
    backgroundColor: "#F0FDFA",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tokenText: { color: "#0D9488", fontWeight: "800", fontSize: 12 },
  patientName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  info: { color: "#64748B", marginTop: 3, fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  dateText: { color: "#94A3B8", marginTop: 8, fontSize: 12 },
});
