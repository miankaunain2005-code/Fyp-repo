import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderSuccess() {
  const { orderId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    loadOrder();
  }, []);

  const loadOrder = async () => {
    try {
      const snap = await getDoc(doc(db, "orders", orderId as string));

      if (snap.exists()) {
        setOrder({
          id: snap.id,
          ...snap.data(),
        });
      }
    } catch (error) {
      console.log("ORDER LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const callPharmacy = () => {
    const phone = order?.pharmacyPhone;

    if (!phone || phone === "03XXXXXXXXX") {
      Alert.alert(
        "Contact Not Available",
        "Pharmacy phone number is not configured yet.",
      );
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />

        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={70} color="#EF4444" />

        <Text style={styles.notFoundText}>Order not found.</Text>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.replace("/(main)/order-from-prescription")}
        >
          <Text style={styles.historyBtnText}>Go to Order History</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SUCCESS ICON */}

      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={55} color="#fff" />
      </View>

      <Text style={styles.title}>Order Placed Successfully!</Text>

      <Text style={styles.subtitle}>
        Your order has been received and is waiting for pharmacy confirmation.
      </Text>

      {/* ORDER STATUS */}

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.label}>Current Status</Text>

            <Text style={styles.statusText}>🟡 {order.status || "Placed"}</Text>
          </View>

          <Ionicons name="cube-outline" size={35} color="#F59E0B" />
        </View>
      </View>

      {/* ORDER DETAILS */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Order Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Order ID</Text>

          <Text style={styles.orderId} numberOfLines={1}>
            {order.id}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Amount</Text>

          <Text style={styles.total}>
            Rs {Number(order.total || 0).toFixed(0)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Items</Text>

          <Text style={styles.value}>{order.items?.length || 0} Medicines</Text>
        </View>
      </View>

      {/* PHARMACY DETAILS */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏥 Pharmacy Contact</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Pharmacy</Text>

          <Text style={styles.value}>
            {order.pharmacyName || "MediCare AI Pharmacy"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>

          <Text style={styles.value}>
            {order.pharmacyPhone || "Not Available"}
          </Text>
        </View>

        <TouchableOpacity style={styles.callBtn} onPress={callPharmacy}>
          <Ionicons name="call" size={20} color="#fff" />

          <Text style={styles.callBtnText}>Call Pharmacy</Text>
        </TouchableOpacity>
      </View>
      {/* DELIVERY DETAILS */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Delivery Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>
            {order.patientPhone || "Not Available"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Address</Text>

          <Text style={styles.value}>
            {order.deliveryAddress || "Not Available"}
          </Text>
        </View>
      </View>

      {/* TRACK ORDER */}

      <TouchableOpacity
        style={styles.trackBtn}
        onPress={() => router.replace("/(main)/order-from-prescription")}
      >
        <Ionicons name="location-outline" size={22} color="#fff" />

        <Text style={styles.trackBtnText}>Track My Order</Text>
      </TouchableOpacity>

      {/* CONTINUE */}

      <TouchableOpacity
        style={styles.continueBtn}
        onPress={() => router.replace("/(main)/prescriptionhistory")}
      >
        <Text style={styles.continueBtnText}>Continue Shopping</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    padding: 20,
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#64748B",
  },

  notFoundText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
  },

  successIcon: {
    width: 105,
    height: 105,
    borderRadius: 55,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  statusCard: {
    backgroundColor: "#FFFBEB",
    width: "100%",
    borderRadius: 16,
    padding: 18,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  label: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  value: {
    fontSize: 14,
    color: "#157e75",
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },

  statusText: {
    fontSize: 18,
    color: "#92400E",
    fontWeight: "800",
    marginTop: 5,
  },

  orderId: {
    fontSize: 12,
    color: "#0D9488",
    fontWeight: "700",
    maxWidth: "65%",
    textAlign: "right",
  },

  total: {
    fontSize: 18,
    color: "#16A34A",
    fontWeight: "800",
  },

  callBtn: {
    height: 50,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  callBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  trackBtn: {
    width: "100%",
    height: 55,
    backgroundColor: "#0D9488",
    borderRadius: 14,
    marginTop: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  trackBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 8,
  },

  continueBtn: {
    marginTop: 18,
    paddingVertical: 12,
  },

  continueBtnText: {
    fontSize: 16,
    color: "#0D9488",
    fontWeight: "700",
  },

  historyBtn: {
    backgroundColor: "#0D9488",
    marginTop: 20,
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 12,
  },

  historyBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
