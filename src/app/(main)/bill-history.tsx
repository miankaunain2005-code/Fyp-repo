import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<any[]>([]);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    try {
      const q = query(
        collection(db, "bills"),
        where("userId", "==", user?.uid),
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
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

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>🧾 My Bills & Orders</Text>

      {bills.length === 0 ? (
        <Text style={styles.emptyText}>No bills yet.</Text>
      ) : (
        bills.map((bill: any) => (
          <TouchableOpacity
            key={bill.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(main)/bill-details",
                params: { billId: bill.id },
              })
            }
          >
            <View style={styles.rowTop}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name={bill.source === "counter" ? "storefront" : "home"}
                  size={20}
                  color="#2563EB"
                />
                <Text style={styles.source}>
                  {bill.source === "counter"
                    ? "Hospital Pharmacy"
                    : "Home Delivery"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>

            {bill.items?.map((item: any, i: number) => (
              <Text key={i} style={styles.item}>
                • {item.name} x {item.qty}
              </Text>
            ))}

            <View style={styles.footerRow}>
              <Text style={styles.status}>{bill.status}</Text>
              <Text style={styles.total}>Rs {bill.total?.toFixed(0)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF", padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 20,
    marginBottom: 20,
  },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  source: { marginLeft: 8, fontWeight: "700", color: "#0F172A" },
  item: { color: "#374151", marginBottom: 3 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  status: { color: "#16A34A", fontWeight: "700" },
  total: { fontWeight: "800", color: "#2563EB", fontSize: 16 },
});
