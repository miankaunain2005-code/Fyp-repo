import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// NOTE: Yeh screen jaan-boojh kar doctorId se filter NAHI karti.
// Wajah: agar 2 saal baad koi patient wapis aaye aur uski ID/naam search ho,
// to us patient ki SAARI prescriptions (chahe kisi bhi doctor ne likhi ho)
// yahan dikhni chahiye — taake continuity of care maintain ho.

export default function DoctorPrescriptionHistory() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    // Auth abhi load ho raha hai
    if (authLoading) {
      return;
    }

    // Doctor login nahi hai
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    console.log("Loading prescriptions for doctor:", user.uid);
    const q = query(
      collection(db, "prescriptions"),
      where("doctorId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;

            return bTime - aTime;
          });

        setPrescriptions(data);
        setLoading(false);
        setRefreshing(false);
      },

      (error) => {
        setLoading(false);
        setRefreshing(false);
      },
    );

    // Screen leave hone par listener band
    return () => unsubscribe();
  }, [user?.uid, authLoading]);

  // Search khali ho to kuch mat dikhao — doctor ko poori DB scroll
  // nahi karni chahiye, sirf specific patient dhoondna hai.
  const filteredData = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.trim().toLowerCase();
    return prescriptions.filter(
      (item: any) =>
        item.patientId?.toLowerCase().includes(term) ||
        item.patientName?.toLowerCase().includes(term) ||
        item.phone?.includes(search.trim()),
    );
  }, [search, prescriptions]);

  const onRefresh = () => {
    setRefreshing(true);

    // onSnapshot realtime hai,
    // isliye data automatically update hota hai
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>Patient Prescription History</Text>
          <Text style={styles.headerSub}>
            Search patient to view preciption
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Patient ID / Name / Phone"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D9488"
          style={{ marginTop: 80 }}
        />
      ) : !search.trim() ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={70} color="#CBD5E1" />
          <Text style={styles.emptyTitle}> Search Patient </Text>
          <Text style={styles.emptySub}>
            Add Patient name phone number patient id to view presciption
          </Text>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={70} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No record Found</Text>
          <Text style={styles.emptySub}>patient history not found</Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>
            {filteredData.length} prescription
            {filteredData.length > 1 ? "s" : ""} found
          </Text>

          {filteredData.map((item: any) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={26} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{item.patientName}</Text>
                  <Text style={styles.info}>ID: {item.patientId}</Text>
                </View>
              </View>

              <Text style={styles.info}>👨‍⚕️ Doctor: {item.doctorName}</Text>
              <Text style={styles.info}>
                🩺 Diagnosis: {item.diagnosis || "N/A"}
              </Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(doctor)/prescription-view",
                    params: { prescriptionId: item.id },
                  })
                }
              >
                <Ionicons name="eye" size={18} color="#fff" />
                <Text style={styles.viewBtnText}>View Full Prescription</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
  headerSub: { color: "#DBEAFE", marginTop: 4, fontSize: 13, maxWidth: 260 },
  searchBox: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },
  input: { flex: 1, marginLeft: 12, fontSize: 15, color: "#111827" },
  resultCount: {
    color: "#64748B",
    marginTop: 18,
    marginLeft: 20,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
    marginTop: 14,
  },
  emptySub: {
    marginTop: 8,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  patientName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  info: { color: "#64748B", marginTop: 3, fontSize: 13 },
  date: { color: "#94A3B8", marginTop: 8, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  viewBtn: {
    marginTop: 14,
    backgroundColor: "#0D9488",
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  viewBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
});
