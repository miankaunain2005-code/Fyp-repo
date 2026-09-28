import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
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

export default function PharmacyScreen() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "dispensed">("all");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "prescriptions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPrescriptions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Search: patient ID, phone, doctor name, ya date (jaisa type ki gayi ho)
  const filteredList = useMemo(() => {
    let list = prescriptions;

    if (filter === "pending") {
      list = list.filter((item: any) => !item.dispensedAtPharmacy);
    } else if (filter === "dispensed") {
      list = list.filter((item: any) => item.dispensedAtPharmacy);
    }

    const term = search.trim().toLowerCase();
    if (!term) return list;

    return list.filter((item: any) => {
      const dateStr = formatDate(item.createdAt).toLowerCase();
      return (
        item.patientId?.toLowerCase().includes(term) ||
        item.phone?.includes(search.trim()) ||
        item.doctorName?.toLowerCase().includes(term) ||
        dateStr.includes(term)
      );
    });
  }, [search, filter, prescriptions]);

  const pendingCount = prescriptions.filter(
    (item: any) => !item.dispensedAtPharmacy,
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

      {/* POLICY BANNER */}
      <View style={styles.policyCard}>
        <Ionicons name="shield-checkmark" size={24} color="#2563EB" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.policyTitle}>Prescription Required</Text>
          <Text style={styles.policyText}>
            Medicines are dispensed only against a doctor's prescription. Select
            one below to order.
          </Text>
        </View>
      </View>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{prescriptions.length}</Text>
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
            {prescriptions.length - pendingCount}
          </Text>
          <Text style={styles.statLabel}>Dispensed</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Search by Patient ID, Phone, Doctor or Date"
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

      {/* LIST */}
      <Text style={styles.sectionTitle}>Your Prescriptions</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 30 }}
        />
      ) : prescriptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Prescription Yet</Text>
          <Text style={styles.emptySub}>
            You need a doctor's prescription before you can order medicines from
            this pharmacy.
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
            Try a different Patient ID, phone number, doctor name, or date.
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
                <Ionicons name="document-text" size={22} color="#2563EB" />
              </View>

              <View style={{ flex: 1 }}>
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
              <Ionicons name="chevron-forward" size={16} color="#2563EB" />
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
    backgroundColor: "#2563EB",
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
  pharmacyName: { color: "#fff", fontSize: 21, fontWeight: "800" },
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
  chipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
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
    backgroundColor: "#2563EB",
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
  prescDoctor: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  prescDate: { color: "#94A3B8", fontSize: 12, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  prescDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
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
    color: "#2563EB",
    fontWeight: "700",
    fontSize: 13,
    marginRight: 4,
  },
});
