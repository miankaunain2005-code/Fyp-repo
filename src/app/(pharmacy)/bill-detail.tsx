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

export default function BillDetail() {
  const { billId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);

  useEffect(() => {
    load();
  }, [billId]);

  const load = async () => {
    try {
      const snap = await getDoc(doc(db, "bills", billId as string));
      if (snap.exists()) {
        setBill({ id: snap.id, ...snap.data() });
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // Full date + time, e.g. "9 Sep 2026, 4:30 PM"
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
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.center}>
        <Ionicons name="receipt-outline" size={70} color="#94A3B8" />
        <Text style={styles.notFoundText}>Bill not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>🧾 Bill Details</Text>
          <Text style={styles.headerSub}>
            {bill.status === "Paid" ? "Payment Completed" : bill.status}
          </Text>
        </View>
      </View>

      {/* PURCHASE TIME — sabse zaroori info upar */}
      <View style={styles.timeCard}>
        <Ionicons name="time-outline" size={26} color="#2563EB" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.timeLabel}>Purchased On</Text>
          <Text style={styles.timeValue}>{formatDateTime(bill.createdAt)}</Text>
        </View>
      </View>

      {/* PATIENT INFO */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>👤 Patient Information</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{bill.patientName || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Patient ID</Text>
          <Text style={styles.value}>{bill.patientId || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{bill.phone || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Doctor</Text>
          <Text style={styles.value}>{bill.doctorName || "N/A"}</Text>
        </View>
      </View>

      {/* PURCHASED MEDICINES */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>💊 Purchased Medicines</Text>

        {(bill.items || []).map((item: any, index: number) => {
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const subtotal = qty * price;

          return (
            <View
              key={index}
              style={[
                styles.medRow,
                index === 0 && {
                  borderTopWidth: 0,
                  marginTop: 0,
                  paddingTop: 0,
                },
              ]}
            >
              <View style={styles.medRowTop}>
                <Text style={styles.medName}>
                  {item.selectedName || item.name}
                </Text>
                <Text style={styles.medSubtotal}>Rs {subtotal.toFixed(0)}</Text>
              </View>

              {item.replaced && (
                <Text style={styles.replacedNote}>
                  Replaced from {item.originalName}
                </Text>
              )}

              {!!item.dosage && (
                <Text style={styles.medInfo}>Dosage: {item.dosage}</Text>
              )}

              {!!item.instructions && (
                <Text style={styles.medInfo}>
                  Instructions: {item.instructions}
                </Text>
              )}

              <View style={styles.qtyPriceRow}>
                <Text style={styles.qtyPriceText}>
                  Qty: <Text style={styles.qtyPriceBold}>{qty}</Text>
                </Text>
                <Text style={styles.qtyPriceText}>
                  Unit Price:{" "}
                  <Text style={styles.qtyPriceBold}>Rs {price}</Text>
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* TOTAL */}
      <View style={styles.totalCard}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.itemCountText}>
            {(bill.items || []).length} item
            {(bill.items || []).length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Text style={styles.totalValue}>
          Rs {Number(bill.total || 0).toFixed(0)}
        </Text>
      </View>

      {/* DISPENSED BY */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>🧑‍⚕️ Dispensed By</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Pharmacist</Text>
          <Text style={styles.value}>{bill.pharmacistName || "N/A"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bill ID</Text>
          <Text style={styles.value} numberOfLines={1}>
            {bill.id}
          </Text>
        </View>
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
  notFoundText: {
    marginTop: 15,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#2563EB",
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
  headerSub: { color: "#DBEAFE", marginTop: 4, fontSize: 13 },

  timeCard: {
    backgroundColor: "#EFF6FF",
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  timeLabel: { color: "#1E40AF", fontSize: 12, fontWeight: "600" },
  timeValue: {
    color: "#1E3A8A",
    fontSize: 17,
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
    marginBottom: 12,
    color: "#1F2937",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { color: "#6B7280", fontSize: 14, fontWeight: "600" },
  value: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 10,
  },

  medRow: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    marginTop: 12,
  },
  medRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  medName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  medSubtotal: { fontSize: 16, fontWeight: "800", color: "#16A34A" },
  replacedNote: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  medInfo: { color: "#6B7280", fontSize: 13, marginTop: 4 },
  qtyPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
  },
  qtyPriceText: { color: "#6B7280", fontSize: 13 },
  qtyPriceBold: { color: "#111827", fontWeight: "700" },

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
  itemCountText: { color: "#94A3B8", fontSize: 12, marginTop: 3 },
  totalValue: { fontSize: 26, fontWeight: "800", color: "#2563EB" },
});
