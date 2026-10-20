import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
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

export default function PharmacyBillHistory() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    try {
      const snap = await getDocs(collection(db, "bills")); // source filter hataya
      const data = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
      setBills(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // Search khali ho to sab bills dikha do (pharmacy ke liye recent
  // bills dekhna bhi useful hai), lekin search laga ho to sirf
  // matching results dikhao.
  const filteredBills = useMemo(() => {
    if (!search.trim()) return bills;

    const term = search.trim().toLowerCase();

    return bills.filter(
      (item: any) =>
        item.patientId?.toLowerCase().includes(term) ||
        item.patientName?.toLowerCase().includes(term) ||
        item.phone?.includes(search.trim()),
    );
  }, [search, bills]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "";
    const date = new Date(timestamp.seconds * 1000);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>

        <Text style={styles.headerTitle}>🧾 Pharmacy Bill History</Text>
        <Text style={styles.headerSub}>
          {filteredBills.length} bill{filteredBills.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          placeholder="Search Patient ID / Name / Phone"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {filteredBills.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={70} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>
            {search.trim() ? "No Matching Bills" : "No Bills Yet"}
          </Text>
          <Text style={styles.emptySub}>
            {search.trim()
              ? "Try a different name, ID, or phone number."
              : "Bills generated at the counter will appear here."}
          </Text>
        </View>
      ) : (
        filteredBills.map((bill: any) => (
          <TouchableOpacity
            key={bill.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(pharmacy)/bill-detail",
                params: { billId: bill.id },
              })
            }
          >
            <View style={styles.row}>
              <Ionicons name="person" size={20} color="#0D9488" />
              <Text style={styles.name}>{bill.patientName}</Text>
              <View
                style={[
                  styles.sourceBadge,
                  {
                    backgroundColor:
                      bill.source === "online" ? "#DBEAFE" : "#DCFCE7",
                  },
                ]}
              >
                <Text
                  style={{
                    color: bill.source === "online" ? "#0D9488" : "#16A34A",
                    fontWeight: "700",
                    fontSize: 11,
                  }}
                >
                  {bill.source === "online"
                    ? "🚚 Online Order"
                    : "🏥 Pharmacy Counter"}
                </Text>
              </View>
            </View>
            <Text style={styles.info}>
              ID: {bill.patientId} • {bill.phone}
            </Text>
            <Text style={styles.info}>Doctor: {bill.doctorName || "N/A"}</Text>
            <Text style={styles.info}>Items: {bill.items?.length}</Text>
            <Text style={styles.date}>{formatDate(bill.createdAt)}</Text>
            <View style={styles.footerRow}>
              <Text style={styles.total}>Rs {bill.total?.toFixed(0)}</Text>
              <Text style={styles.pharmacist}>By: {bill.pharmacistName}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#DBEAFE", marginTop: 4 },
  searchBox: {
    marginHorizontal: 15,
    marginTop: 18,
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: "#111827" },
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
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "700", marginLeft: 8, color: "#0F172A" },
  info: { color: "#6B7280", marginBottom: 3 },
  date: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  sourceBadge: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  total: { fontSize: 18, fontWeight: "800", color: "#0D9488" },
  pharmacist: { color: "#6B7280", fontSize: 13 },
});
