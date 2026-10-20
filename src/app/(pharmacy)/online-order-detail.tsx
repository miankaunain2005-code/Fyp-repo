import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function OnlineOrderDetail() {
  const params = useLocalSearchParams<{
    orderId?: string | string[];
  }>();
  const { user, profile } = useAuth();
  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [order, setOrder] = useState<any>(null);

  const [medicines, setMedicines] = useState<any[]>([]);

  /*
   * Pharmacist ka actual dispensing cart.
   *
   * Patient ki requested medicines automatically
   * is cart mein add nahi hongi.
   */
  const [cart, setCart] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  /*
   *
   * LOAD ORDER + MEDICINES
   *
   */
  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (!orderId) {
        console.log("ORDER ID MISSING");
        console.log("PARAMS:", params);

        Alert.alert("Order Error", "Order ID is missing.");

        return;
      }

      console.log("LOADING ORDER ID:", orderId);

      const orderSnap = await getDoc(doc(db, "orders", orderId));

      console.log("ORDER EXISTS:", orderSnap.exists());

      if (!orderSnap.exists()) {
        console.log("ORDER NOT FOUND FOR ID:", orderId);

        return;
      }

      const orderData = {
        id: orderSnap.id,
        ...orderSnap.data(),
      };

      console.log("ORDER DATA:", orderData);

      setOrder(orderData);

      const medicineSnap = await getDocs(collection(db, "medicines"));

      const medicineData = medicineSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setMedicines(medicineData);
    } catch (error) {
      console.log("ONLINE ORDER LOAD ERROR:", error);

      Alert.alert("Error", "Unable to load online order.");
    } finally {
      setLoading(false);
    }
  };
  /*
   *
   * ADD MEDICINE TO DISPENSING CART
   *
   */

  const addToCart = (medicine: any, requestedQty?: number) => {
    const availableStock = Number(medicine.stock) || 0;

    if (availableStock <= 0) {
      Alert.alert(
        "Out of Stock",
        `${medicine.name} is currently out of stock.`,
      );

      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === medicine.id);

      const qtyToAdd = Number(requestedQty) > 0 ? Number(requestedQty) : 1;

      /*
       * Medicine already cart mein hai
       */

      if (existing) {
        const newQty = Number(existing.qty) + qtyToAdd;

        if (newQty > availableStock) {
          Alert.alert(
            "Stock Limit",
            `Only ${availableStock} item(s) are available.`,
          );

          return prev;
        }

        return prev.map((item) =>
          item.medicineId === medicine.id
            ? {
              ...item,
              qty: newQty,
            }
            : item,
        );
      }

      /*
       * Requested quantity stock se zyada hai
       */

      if (qtyToAdd > availableStock) {
        Alert.alert(
          "Insufficient Stock",
          `Only ${availableStock} item(s) are available.`,
        );

        return prev;
      }

      /*
       * New medicine add
       */

      return [
        ...prev,
        {
          medicineId: medicine.id,

          name: medicine.name || "",

          salt: medicine.salt || "",

          strength: medicine.strength || "",

          price: Number(medicine.price) || 0,

          qty: qtyToAdd,

          stock: availableStock,
        },
      ];
    });
  };

  /*
   *
   * ADD PATIENT REQUESTED MEDICINE
   *
   */

  const addRequestedMedicine = (requestedItem: any) => {
    /*
     * Inventory mein medicine find karo.
     *
     * Pehle medicineId,
     * phir name se match.
     */

    const medicine = medicines.find(
      (item) =>
        item.id === requestedItem.medicineId ||
        item.name?.toLowerCase()?.trim() ===
        requestedItem.name?.toLowerCase()?.trim(),
    );

    if (!medicine) {
      Alert.alert(
        "Medicine Not Found",
        `${requestedItem.name} is not available in pharmacy inventory.`,
      );

      return;
    }

    if (Number(medicine.stock) <= 0) {
      Alert.alert(
        "Out of Stock",
        `${medicine.name} is currently out of stock.`,
      );

      return;
    }

    /*
     * Pharmacist requested medicine
     * dispensing cart mein add karega.
     */

    addToCart(medicine, Number(requestedItem.qty) || 1);
  };

  /*
   *
   * UPDATE CART QUANTITY
   *
   */

  const updateQty = (medicineId: string, value: string) => {
    /*
     * Empty string temporarily allow karte hain
     * taake user TextInput edit kar sake.
     *
     * Final validation dispense ke waqt hogi.
     */

    setCart((prev) =>
      prev.map((item) => {
        if (item.medicineId !== medicineId) {
          return item;
        }

        return {
          ...item,
          qty: value,
        };
      }),
    );
  };

  /*
   *
   * REMOVE MEDICINE FROM CART
   *
   */

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  /*
   *
   * CART TOTAL
   *
   */

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.qty || 0);
    }, 0);
  }, [cart]);

  /*
   *
   * SEARCH INVENTORY
   *
   */

  const filteredMedicines = useMemo(() => {
    if (!search.trim()) {
      return medicines;
    }

    const keyword = search.toLowerCase();

    return medicines.filter(
      (item) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.salt?.toLowerCase().includes(keyword) ||
        item.manufacturer?.toLowerCase().includes(keyword),
    );
  }, [search, medicines]);

  /*
   *
   * VALIDATE DISPENSING CART
   *
   */

  const validateCart = () => {
    if (cart.length === 0) {
      Alert.alert("Cart Empty", "Please add medicines to dispense.");

      return false;
    }

    for (const item of cart) {
      const medicine = medicines.find((m) => m.id === item.medicineId);

      if (!medicine) {
        Alert.alert(
          "Medicine Missing",
          `${item.name} no longer exists in inventory.`,
        );

        return false;
      }

      const qty = Number(item.qty);

      const currentStock = Number(medicine.stock);

      /*
       * Quantity valid honi chahiye
       */

      if (!Number.isFinite(qty) || qty <= 0) {
        Alert.alert(
          "Invalid Quantity",
          `Enter a valid quantity for ${item.name}.`,
        );

        return false;
      }

      /*
       * Decimal quantity allow nahi
       */

      if (!Number.isInteger(qty)) {
        Alert.alert(
          "Invalid Quantity",
          `Quantity for ${item.name} must be a whole number.`,
        );

        return false;
      }

      /*
       * Stock check
       */

      if (qty > currentStock) {
        Alert.alert(
          "Insufficient Stock",
          `${item.name} has only ${currentStock} item(s) available.`,
        );

        return false;
      }
    }

    return true;
  };

  /*
   *
   * DISPENSE ORDER
   *
   * FLOW:
   *
   * 1. Stock deduct
   * 2. Stock history create
   * 3. Final bill generate
   * 4. Order status = Dispensed
   *
   * Sab operations writeBatch mein
   * hain, yani ek operation fail ho
   * to partial data save nahi hoga.
   *
   */

  const dispenseOrder = async () => {
    if (!order) {
      Alert.alert("Order Error", "Order information is missing.");

      return;
    }

    if (order.status === "Dispensed") {
      Alert.alert(
        "Already Dispensed",
        "This order has already been dispensed.",
      );

      return;
    }

    if (!validateCart()) {
      return;
    }
    if (busy.current) return;
    busy.current = true;

    setSaving(true);

    try {
      const batch = writeBatch(db);

      const dispensedAt = Timestamp.now();

      /*
       *
       * FINAL DISPENSED ITEMS
       *
       */

      const finalItems = cart.map((item) => ({
        medicineId: item.medicineId,

        name: item.name || "",

        salt: item.salt || "",

        strength: item.strength || "",

        price: Number(item.price) || 0,

        qty: Number(item.qty),

        subtotal: (Number(item.price) || 0) * Number(item.qty),
      }));

      /*
       *
       * 1. DEDUCT MEDICINE STOCK
       *
       * 2. CREATE STOCK HISTORY
       *
       */

      for (const item of cart) {
        const medicine = medicines.find((m) => m.id === item.medicineId);

        if (!medicine) {
          throw new Error(`${item.name} no longer exists in inventory.`);
        }

        const currentStock = Number(medicine.stock);

        const dispenseQty = Number(item.qty);

        const remainingStock = currentStock - dispenseQty;

        if (remainingStock < 0) {
          throw new Error(`Insufficient stock for ${item.name}.`);
        }

        /*
         * MEDICINE STOCK UPDATE
         */

        const medicineRef = doc(db, "medicines", item.medicineId);

        batch.update(medicineRef, {
          stock: remainingStock,
        });

        /*
         * STOCK HISTORY
         */

        const historyRef = doc(collection(db, "stockHistory"));

        batch.set(historyRef, {
          billNumber: `ON-${Date.now()}`,
          source: "online",
          status: "Dispensed",
          orderId: order.id,
          userId: order.userId || "",
          patientId: order.patientId || "",
          patientName: order.patientName || "",
          patientPhone: order.patientPhone || "",
          deliveryAddress: order.deliveryAddress || "",
          items: finalItems,
          total: Number(total),
          pharmacistId: user?.uid || "",
          pharmacistName:
            profile?.name || user?.email?.split("@")[0] || "Pharmacist",
          createdAt: dispensedAt,
          dispensedAt: dispensedAt,
        });
      }

      /*
       *
       * 3. GENERATE FINAL BILL
       *
       */

      const billRef = doc(collection(db, "bills"));

      batch.set(billRef, {
        /*
         * Basic Bill Information
         */

        billNumber: `ON-${Date.now()}`,

        source: "online",

        status: "Dispensed",

        /*
         * Relationship
         */

        orderId: order.id,

        userId: order.userId || "",

        patientId: order.patientId || "",

        /*
         * Patient Information
         */

        patientName: order.patientName || "",

        patientPhone: order.patientPhone || "",

        deliveryAddress: order.deliveryAddress || "",

        /*
         * Actual Dispensed Medicines
         */

        items: finalItems,

        /*
         * Financial Information
         */

        total: Number(total),

        /*
         * Dates
         */

        createdAt: dispensedAt,

        dispensedAt: dispensedAt,
      });

      /*
       *
       * 4. UPDATE ORIGINAL ORDER
       *
       */

      const orderRef = doc(db, "orders", order.id);

      batch.update(orderRef, {
        status: "Dispensed",

        /*
         * Actual medicines jo pharmacist
         * ne dispense ki hain.
         *
         * Original order.items patient ki
         * requested medicines rahengi.
         */

        dispensedItems: finalItems,

        dispensedTotal: Number(total),

        billId: billRef.id,

        dispensedAt: dispensedAt,
      });

      /*
       *
       * COMMIT ALL OPERATIONS
       *
       */

      await batch.commit();

      Alert.alert(
        "Order Dispensed ✅",
        "Bill has been generated and medicines have been dispensed successfully.",
        [
          {
            text: "OK",

            onPress: () => router.replace("/(pharmacy)/online-orders"),
          },
        ],
      );
    } catch (error: any) {
      console.log("DISPENSE ORDER ERROR:", error);

      Alert.alert(
        "Dispensing Failed",
        error?.message || "Unable to dispense this order.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  /*
   *
   * ORDER NOT FOUND
   *
   */

  if (!order) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={70} color="#94A3B8" />

        <Text style={styles.notFound}>Order not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View
          style={{
            marginLeft: 14,
          }}
        >
          <Text style={styles.headerTitle}>Online Order</Text>

          <Text style={styles.headerSub}>Order ID: {order.id.slice(0, 8)}</Text>
        </View>
      </View>

      {/* ================= PATIENT INFO ================= */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Patient Information</Text>

        <Text style={styles.info}>{order.patientName || "Patient"}</Text>

        <Text style={styles.subInfo}>
          Patient ID: {order.patientId || "N/A"}
        </Text>

        <Text style={styles.subInfo}>📞 {order.patientPhone || "N/A"}</Text>
      </View>

      {/* ================= DELIVERY ADDRESS ================= */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Delivery Address</Text>

        <Text style={styles.address}>
          {order.deliveryAddress || "Address not available"}
        </Text>
      </View>

      {/* ================= REQUESTED MEDICINES ================= */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>💊 Patient Requested Medicines</Text>

        {!order.items || order.items.length === 0 ? (
          <Text style={styles.emptyText}>No requested medicines found.</Text>
        ) : (
          order.items.map((item: any, index: number) => {
            /*
             * Find same medicine in inventory
             */

            const inventoryMedicine = medicines.find(
              (m) =>
                m.id === item.medicineId ||
                m.name?.toLowerCase()?.trim() ===
                item.name?.toLowerCase()?.trim(),
            );

            const available =
              inventoryMedicine && Number(inventoryMedicine.stock) > 0;

            return (
              <View key={item.medicineId || index} style={styles.requestedItem}>
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.medName}>{item.name}</Text>

                  {!!item.salt && (
                    <Text style={styles.medSalt}>{item.salt}</Text>
                  )}

                  {!!item.strength && (
                    <Text style={styles.medSalt}>{item.strength}</Text>
                  )}

                  <Text style={styles.requestQty}>
                    Requested Qty: {item.qty}
                  </Text>
                </View>

                {available ? (
                  <TouchableOpacity
                    style={styles.addRequestedBtn}
                    onPress={() => addRequestedMedicine(item)}
                  >
                    <Ionicons name="add" size={18} color="#fff" />

                    <Text style={styles.addRequestedText}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.outBadge}>
                    <Text style={styles.outText}>OUT OF STOCK</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* ================= MANUAL INVENTORY ================= */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>➕ Add Medicine Manually</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" />

          <TextInput
            placeholder="Search medicine..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {filteredMedicines.map((medicine: any) => (
          <View key={medicine.id} style={styles.inventoryRow}>
            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.medName}>{medicine.name}</Text>

              {!!medicine.salt && (
                <Text style={styles.medSalt}>{medicine.salt}</Text>
              )}

              {!!medicine.strength && (
                <Text style={styles.medSalt}>{medicine.strength}</Text>
              )}

              <Text style={styles.stockText}>Stock: {medicine.stock}</Text>

              <Text style={styles.priceText}>Rs {medicine.price}</Text>
            </View>

            <TouchableOpacity
              disabled={Number(medicine.stock) <= 0}
              style={[
                styles.manualAddBtn,

                Number(medicine.stock) <= 0 && styles.disabledBtn,
              ]}
              onPress={() => addToCart(medicine)}
            >
              <Ionicons name="cart" size={18} color="#fff" />

              <Text style={styles.manualAddText}>Add</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ================= DISPENSING CART ================= */}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛒 Dispensing Cart</Text>

        {cart.length === 0 ? (
          <Text style={styles.emptyText}>No medicines added yet.</Text>
        ) : (
          cart.map((item) => (
            <View key={item.medicineId} style={styles.cartItem}>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.medName}>{item.name}</Text>

                {!!item.salt && <Text style={styles.medSalt}>{item.salt}</Text>}

                {!!item.strength && (
                  <Text style={styles.medSalt}>{item.strength}</Text>
                )}

                <Text style={styles.priceText}>Rs {item.price}</Text>
              </View>

              <View style={styles.cartRight}>
                <TextInput
                  value={String(item.qty)}
                  keyboardType="number-pad"
                  onChangeText={(value) => updateQty(item.medicineId, value)}
                  style={styles.qtyInput}
                />

                <TouchableOpacity
                  onPress={() => removeFromCart(item.medicineId)}
                >
                  <Ionicons name="trash-outline" size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ================= TOTAL ================= */}

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Dispensed Total</Text>

        <Text style={styles.totalValue}>Rs {total.toFixed(0)}</Text>
      </View>

      {/* ================= DISPENSE BUTTON ================= */}

      <TouchableOpacity
        style={[styles.dispenseBtn, saving && styles.disabledBtn]}
        onPress={dispenseOrder}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0D9488" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />

            <Text style={styles.dispenseBtnText}>Generate Bill & Dispense</Text>
          </>
        )}
      </TouchableOpacity>

      <View
        style={{
          height: 80,
        }}
      />
    </ScrollView>
  );
}

/*
 *
 * STYLES
 *
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  notFound: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: "700",
    color: "#64748B",
  },

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

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSub: {
    color: "#DBEAFE",
    marginTop: 4,
    fontSize: 12,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },

  info: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  subInfo: {
    color: "#64748B",
    marginTop: 5,
  },

  address: {
    color: "#475569",
    lineHeight: 22,
  },

  requestedItem: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  medName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  medSalt: {
    color: "#64748B",
    marginTop: 3,
    fontSize: 13,
  },

  requestQty: {
    color: "#0D9488",
    marginTop: 6,
    fontWeight: "600",
    fontSize: 13,
  },

  addRequestedBtn: {
    backgroundColor: "#0D9488",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  addRequestedText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "700",
  },

  outBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },

  outText: {
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "800",
  },

  searchBox: {
    height: 50,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#0F172A",
  },

  inventoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  stockText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },

  priceText: {
    marginTop: 4,
    color: "#16A34A",
    fontWeight: "700",
  },

  manualAddBtn: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  manualAddText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "700",
  },

  disabledBtn: {
    opacity: 0.5,
  },

  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 15,
  },

  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingVertical: 12,
  },

  cartRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  qtyInput: {
    width: 55,
    height: 42,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    textAlign: "center",
    marginRight: 12,
    color: "#0F172A",
  },

  totalCard: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },

  totalLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0D9488",
  },

  dispenseBtn: {
    height: 56,
    marginHorizontal: 15,
    backgroundColor: "#16A34A",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  dispenseBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});
