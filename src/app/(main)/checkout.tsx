import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { getUserById } from "@/src/utils/firestoreService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CheckoutScreen() {
  const { user } = useAuth();

  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  // Delivery information
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const q = query(collection(db, "cart"), where("userId", "==", user?.uid));

      const snap = await getDocs(q);

      setCart(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })),
      );
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * (item.quantity || 1),
    0,
  );

  // Open delivery information popup
  const openDeliveryForm = () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Add medicines before placing an order.");
      return;
    }

    setShowDeliveryModal(true);
  };

  // Final order creation
  const placeOrder = async () => {
    if (!phone.trim()) {
      Alert.alert("Phone Number Required", "Please enter your phone number.");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Address Required", "Please enter your delivery address.");
      return;
    }

    setPlacing(true);

    try {
      const userData = await getUserById(user?.uid || "");

      // BILL / ORDER CREATE
      const orderRef = await addDoc(collection(db, "orders"), {
        source: "online",

        userId: user?.uid || "",

        patientId: userData?.patientId || "",

        patientName: userData?.name || user?.displayName || "",

        patientPhone: phone.trim(),

        deliveryAddress: address.trim(),

        pharmacyName: "MediCare AI Pharmacy",

        pharmacyPhone: "03001234567",

        items: cart.map((item) => ({
          name: item.name,

          salt: item.salt || "",

          strength: item.strength || "",

          requestedPrice: Number(item.price),

          qty: Number(item.quantity) || 1,

          medicineId: item.medicineId || "",
        })),

        requestedTotal: total,

        status: "Placed",

        createdAt: serverTimestamp(),
      });

      // Clear cart
      for (const item of cart) {
        await deleteDoc(doc(db, "cart", item.id));
      }

      // Close modal
      setShowDeliveryModal(false);

      Alert.alert(
        "Order Placed ✅",
        "Your order has been placed successfully. Pharmacy will process your order.",
        [
          {
            text: "OK",
            onPress: () => router.push("/(main)/order-history"),
          },
          {
            text: "View Order",
            onPress: () =>
              router.replace({
                pathname: "/(main)/order-success",
                params: {
                  orderId: orderRef.id,
                },
              }),
          },
        ],
      );
    } catch (error: any) {
      console.log("=== ORDER ERROR ===");
      console.log("Code:", error.code);
      console.log("Message:", error.message);

      Alert.alert("Error", error.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Checkout</Text>

        {cart.length === 0 ? (
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        ) : (
          cart.map((item) => (
            <View key={item.id} style={styles.card}>
              <View>
                <Text style={styles.name}>{item.name}</Text>

                <Text style={styles.salt}>{item.salt}</Text>
              </View>

              <Text style={styles.price}>
                Rs {item.price} x {item.quantity || 1}
              </Text>
            </View>
          ))
        )}

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total</Text>

          <Text style={styles.totalValue}>Rs {total.toFixed(0)}</Text>
        </View>

        <TouchableOpacity
          style={styles.placeBtn}
          onPress={openDeliveryForm}
          disabled={placing || cart.length === 0}
        >
          <Ionicons name="checkmark-circle" size={22} color="#fff" />

          <Text style={styles.placeBtnText}>Place Order</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* DELIVERY INFORMATION MODAL */}

      <Modal
        visible={showDeliveryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeliveryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Delivery Information</Text>

                <Text style={styles.modalSubtitle}>
                  Enter your contact and delivery details
                </Text>
              </View>

              <TouchableOpacity onPress={() => setShowDeliveryModal(false)}>
                <Ionicons name="close" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* PHONE */}

            <Text style={styles.inputLabel}>Phone Number</Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" />

              <TextInput
                style={styles.input}
                placeholder="03XXXXXXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={15}
              />
            </View>

            {/* ADDRESS */}

            <Text style={styles.inputLabel}>Delivery Address</Text>

            <View style={[styles.inputWrapper, styles.addressWrapper]}>
              <Ionicons name="location-outline" size={20} color="#64748B" />

              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Enter your complete delivery address"
                placeholderTextColor="#94A3B8"
                multiline
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#2563EB"
              />

              <Text style={styles.infoText}>
                This information will be shared with the hospital pharmacy for
                order delivery.
              </Text>
            </View>

            {/* CONFIRM */}

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={placeOrder}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />

                  <Text style={styles.confirmBtnText}>
                    Confirm & Place Order
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* CANCEL */}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowDeliveryModal(false)}
              disabled={placing}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FF",
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 20,
    marginBottom: 20,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 40,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  salt: {
    color: "#64748B",
    marginTop: 3,
  },

  price: {
    fontWeight: "700",
    color: "#2563EB",
  },

  totalBox: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    elevation: 3,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },

  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#2563EB",
  },

  placeBtn: {
    backgroundColor: "#16A34A",
    marginTop: 20,
    height: 55,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  placeBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 8,
  },

  // MODAL

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 7,
    marginTop: 5,
  },

  inputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 15,
    backgroundColor: "#F8FAFC",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#0F172A",
  },

  addressWrapper: {
    height: 90,
    alignItems: "flex-start",
    paddingTop: 14,
  },

  addressInput: {
    textAlignVertical: "top",
  },

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
    marginBottom: 18,
  },

  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: "#475569",
  },

  confirmBtn: {
    height: 52,
    backgroundColor: "#16A34A",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  confirmBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  cancelBtn: {
    alignItems: "center",
    paddingVertical: 13,
  },

  cancelBtnText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },
});
