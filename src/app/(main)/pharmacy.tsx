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
  return [r.patientName, r.patientId, r.phone, r.doctorName, dates]
    .join(" ")
    .toLowerCase();
};

const formatDate = (timestamp: any) => {
  if (!timestamp?.seconds) return "";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function PharmacyScreen() {
  const { user, profile } = useAuth();

  const [byUser, setByUser] = useState<any[]>([]);
  const [byPatient, setByPatient] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [scope, setScope] = useState<"mine" | "others">("mine");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "dispensed">("all");

  // Jo maine book kiya (apne ya kisi aur ke liye)
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
        console.log("[pharmacy-byUser]", e.code);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  // Meri patientId ki prescriptions (walk-in history jo link ho chuki)
  useEffect(() => {
    if (!profile?.patientId) return;
    const q = query(
      collection(db, "prescriptions"),
      where("patientId", "==", profile.patientId),
    );
    const unsub = onSnapshot(
      q,
      (s) => setByPatient(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.log("[pharmacy-byPatient]", e.code),
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

  const current = scope === "mine" ? mine : others;

  const filteredList = useMemo(() => {
    let list = current;

    if (filter === "pending") {
      list = list.filter((i: any) => !i.dispensedAtPharmacy);
    } else if (filter === "dispensed") {
      list = list.filter((i: any) => i.dispensedAtPharmacy);
    }

    const term = search.trim().toLowerCase().replace(/\//g, "-");
    if (!term) return list;
    return list.filter((i: any) => searchText(i).includes(term));
  }, [current, filter, search]);

  const pendingCount = current.filter(
    (i: any) => !i.dispensedAtPharmacy,
  ).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.pharmacyIcon}>
          <Ionicons name="medkit" size={34} color="#fff" />
        </View>
        <Text style={styles.pharmacyName}>MediCare AI Pharmacy</Text>
        <Text style={styles.pharmacySub}>
          Hospital Pharmacy • In-house medicine dispensing
        </Text>
      </View>

      {/* POLICY */}
      <View style={styles.policyCard}>
        <Ionicons name="shield-checkmark" size={24} color="#0D9488" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.policyTitle}>Prescription Required</Text>
          <Text style={styles.policyText}>
            Medicines sirf doctor ki prescription par milti hain. Neeche se
            prescription chun kar order karein.
          </Text>
        </View>
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

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{current.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#D97706" }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending Order</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#16A34A" }]}>
            {current.length - pendingCount}
          </Text>
          <Text style={styles.statLabel}>Dispensed</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Name, Patient ID, Doctor ya Date (06-10-2026)"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER CHIPS */}
      <View style={styles.chipsRow}>
        {(["all", "pending", "dispensed"] as const).map((key) => (
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
                  : "Dispensed"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        {scope === "mine" ? "Your Prescriptions" : "Prescriptions of Others"}
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D9488"
          style={{ marginTop: 30 }}
        />
      ) : current.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Prescription Yet</Text>
          <Text style={styles.emptySub}>
            Medicine order karne ke liye pehle doctor ki prescription zaroori
            hai.
          </Text>
          <TouchableOpacity
            style={styles.consultBtn}
            onPress={() => router.push("/(main)/consult")}
          >
            <Ionicons name="medical" size={20} color="#fff" />
            <Text style={styles.consultBtnText}>Consult a Doctor</Text>
          </TouchableOpacity>
        </View>
      ) : filteredList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="search-outline" size={50} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Match Found</Text>
          <Text style={styles.emptySub}>
            Dusra naam, Patient ID, doctor ya date try karein.
          </Text>
        </View>
      ) : (
        filteredList.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.prescCard}
            onPress={() =>
              router.push({
                pathname: "/(main)/prescription-details",
                params: { prescriptionId: item.id },
              })
            }
          >
            <View style={styles.prescTop}>
              <View style={styles.prescIcon}>
                <Ionicons name="document-text" size={22} color="#0D9488" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.prescPatient}>👤 {item.patientName}</Text>
                <Text style={styles.prescDoctor}>Dr. {item.doctorName}</Text>
                <Text style={styles.prescDate}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: item.dispensedAtPharmacy
                      ? "#DCFCE7"
                      : "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.dispensedAtPharmacy ? "#16A34A" : "#D97706",
                    fontWeight: "700",
                    fontSize: 11,
                  }}
                >
                  {item.dispensedAtPharmacy ? "Dispensed" : "Pending"}
                </Text>
              </View>
            </View>

            <View style={styles.prescDivider} />

            <View style={styles.prescBottom}>
              <Text style={styles.prescMeta}>
                Patient ID:{" "}
                <Text style={styles.prescMetaBold}>{item.patientId}</Text>
              </Text>
              <Text style={styles.prescMeta}>
                {item.medicines?.length || 0} medicine(s)
              </Text>
            </View>

            <View style={styles.viewRow}>
              <Text style={styles.viewText}>View & Order Medicines</Text>
              <Ionicons name="chevron-forward" size={16} color="#0D9488" />
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 60,
    paddingBottom: 28,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  pharmacyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  pharmacyName: { color: "#157e75", fontSize: 21, fontWeight: "800" },
  pharmacySub: { color: "#DBEAFE", marginTop: 4, fontSize: 12 },
  policyCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    elevation: 3,
  },
  policyTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  policyText: { marginTop: 4, color: "#64748B", fontSize: 12, lineHeight: 17 },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 18,
    marginTop: 16,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabActive: { backgroundColor: "#0D9488" },
  tabText: { color: "#64748B", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 16,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 3 },
  searchBox: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#111827" },
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
  chipActive: { backgroundColor: "#0D9488", borderColor: "#2563EB" },
  chipText: { color: "#64748B", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 22,
    marginHorizontal: 18,
    marginBottom: 12,
  },
  emptyCard: {
    marginHorizontal: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
  },
  emptySub: {
    marginTop: 8,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
  consultBtn: {
    marginTop: 18,
    backgroundColor: "#0D9488",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  consultBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  prescCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 16,
    padding: 15,
    elevation: 3,
  },
  prescTop: { flexDirection: "row", alignItems: "center" },
  prescIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  prescPatient: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  prescDoctor: { fontSize: 13, color: "#475569", marginTop: 2 },
  prescDate: { color: "#94A3B8", fontSize: 12, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  prescDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  prescBottom: { flexDirection: "row", justifyContent: "space-between" },
  prescMeta: { color: "#64748B", fontSize: 12 },
  prescMetaBold: { color: "#0F172A", fontWeight: "700" },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  viewText: {
    color: "#0D9488",
    fontWeight: "700",
    fontSize: 13,
    marginRight: 4,
  },
});
