import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PatientBillDetails() {
  const { billId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    load();
  }, [billId]);

  const load = async () => {
    try {
      const snap = await getDoc(doc(db, "bills", billId as string));
      if (snap.exists()) setBill({ id: snap.id, ...snap.data() });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp?.seconds) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return (
      date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={70} color="#94A3B8" />
        <Text style={styles.notFound}>Bill not found.</Text>
      </View>
    );
  }

  const isOnline = bill.source === "online";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>🧾 Bill Details</Text>
        </View>
      </View>

      {/* SOURCE BADGE — sabse pehle, sabse zaroori info */}
      <View
        style={[
          styles.sourceCard,
          { backgroundColor: isOnline ? "#EFF6FF" : "#F0FDF4" },
        ]}
      >
        <Ionicons
          name={isOnline ? "bicycle" : "storefront"}
          size={28}
          color={isOnline ? "#2563EB" : "#16A34A"}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.sourceTitle}>
            {isOnline
              ? "Online Order (Home Delivery)"
              : "Hospital Pharmacy (Counter)"}
          </Text>
          <Text style={styles.sourceSub}>
            {isOnline
              ? `Delivered to: ${bill.deliveryAddress || "N/A"}`
              : "Dispensed at pharmacy counter"}
          </Text>
        </View>
      </View>

      {/* PURCHASE TIME */}
      <View style={styles.timeCard}>
        <Ionicons name="time-outline" size={24} color="#2563EB" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.timeLabel}>Purchased On</Text>
          <Text style={styles.timeValue}>{formatDateTime(bill.createdAt)}</Text>
        </View>
      </View>

      {/* MEDICINES */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>💊 Medicines</Text>
        {(bill.items || []).map((item: any, index: number) => {
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          return (
            <View key={index} style={styles.medRow}>
              <View style={styles.medRowTop}>
                <Text style={styles.medName}>
                  {item.selectedName || item.name}
                </Text>
                <Text style={styles.medSubtotal}>
                  Rs {(qty * price).toFixed(0)}
                </Text>
              </View>
              <Text style={styles.medInfo}>
                Qty: {qty} × Rs {price}
              </Text>
            </View>
          );
        })}
      </View>

      {/* TOTAL */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          Rs {Number(bill.total || 0).toFixed(0)}
        </Text>
      </View>

      {/* DISPENSED BY */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>🧑‍⚕️ Dispensed By</Text>
        <Text style={styles.value}>{bill.pharmacistName || "N/A"}</Text>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
  },
  notFound: {
    marginTop: 15,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
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
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  sourceCard: {
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  sourceTitle: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  sourceSub: { color: "#64748B", fontSize: 12, marginTop: 3, maxWidth: 250 },
  timeCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  timeLabel: { color: "#64748B", fontSize: 12 },
  timeValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1F2937",
  },
  medRow: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 10,
  },
  medRowTop: { flexDirection: "row", justifyContent: "space-between" },
  medName: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
  medSubtotal: { fontSize: 15, fontWeight: "800", color: "#16A34A" },
  medInfo: { color: "#6B7280", fontSize: 13, marginTop: 3 },
  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  totalValue: { fontSize: 24, fontWeight: "800", color: "#0D9488" },
  value: { color: "#111827", fontWeight: "700" },
});
