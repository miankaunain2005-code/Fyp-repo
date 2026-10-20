import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
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

const pad = (n: number) => String(n).padStart(2, "0");

const searchText = (r: any) => {
  let dates = r.date || "";
  if (r.createdAt?.seconds) {
    const d = new Date(r.createdAt.seconds * 1000);
    dates += ` ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return [r.patientName, r.patientId, r.doctorName, r.diagnosis, dates]
    .join(" ")
    .toLowerCase();
};

export default function PrescriptionHistory() {
  const { user, profile } = useAuth();

  const [byUser, setByUser] = useState<any[]>([]);
  const [byPatient, setByPatient] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"mine" | "others">("mine");
  const [search, setSearch] = useState("");

  // Jo maine khud book/order kiya (apne ya kisi aur ke liye)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "prescriptions"),
      where("userId", "==", user.uid),
    );
    const unsub = onSnapshot(
      q,
      (s) => {
        setByUser(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.log("[presc-byUser]", e.code);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  // Meri patientId ka record (purani walk-in history bhi)
  useEffect(() => {
    if (!profile?.patientId) return;
    const q = query(
      collection(db, "prescriptions"),
      where("patientId", "==", profile.patientId),
    );
    const unsub = onSnapshot(
      q,
      (s) => setByPatient(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.log("[presc-byPatient]", e.code),
    );
    return () => unsub();
  }, [profile?.patientId]);

  const all = useMemo(() => {
    const m = new Map<string, any>();
    [...byUser, ...byPatient].forEach((r) => m.set(r.id, r));
    return Array.from(m.values()).sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
  }, [byUser, byPatient]);

  const pid = profile?.patientId;
  const mine = all.filter((r) => pid && r.patientId === pid);
  const others = all.filter((r) => !pid || r.patientId !== pid);

  const term = search.trim().toLowerCase().replace(/\//g, "-");
  const list = (scope === "mine" ? mine : others).filter(
    (r) => !term || searchText(r).includes(term),
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={45} color="#fff" />
        <Text style={styles.title}>Prescription History</Text>
        <Text style={styles.subtitle}>Apni ya kisi aur ki prescriptions</Text>
      </View>

      {/* TOGGLE */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.tab, scope === "mine" && styles.tabActive]}
          onPress={() => setScope("mine")}
        >
          <Text
            style={[styles.tabText, scope === "mine" && styles.tabTextActive]}
          >
            Myself ({mine.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, scope === "others" && styles.tabActive]}
          onPress={() => setScope("others")}
        >
          <Text
            style={[styles.tabText, scope === "others" && styles.tabTextActive]}
          >
            Someone Else ({others.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Name, Patient ID, Doctor ya Date (06-10-2026)"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D9488"
          style={{ marginTop: 40 }}
        />
      ) : list.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-outline" size={60} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            {term ? "Koi match nahi mila" : "No Prescription Found"}
          </Text>
        </View>
      ) : (
        list.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.patientName}>👤 {item.patientName}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Patient ID</Text>
              <Text style={styles.value}>{item.patientId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Doctor</Text>
              <Text style={styles.value}>{item.doctorName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{item.date}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>{item.time}</Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({
                  pathname: "/(main)/prescription-details",
                  params: { prescriptionId: item.id },
                })
              }
            >
              <Ionicons name="eye" size={20} color="#fff" />
              <Text style={styles.buttonText}>View Prescription</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 55,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  title: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 10 },
  subtitle: { color: "#E5E7EB", fontSize: 14, marginTop: 5 },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 15,
    marginTop: 16,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabActive: { backgroundColor: "#0D9488" },
  tabText: { color: "#64748B", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  searchBox: {
    marginHorizontal: 15,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#111827" },
  emptyCard: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    elevation: 4,
  },
  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
  },
  patientName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { color: "#6B7280", fontWeight: "600", fontSize: 15 },
  value: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
    textAlign: "right",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#0D9488",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 },
});
