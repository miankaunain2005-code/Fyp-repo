import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import {
  calculatePrescribedQuantity,
  getQuantityBreakdown,
} from "@/src/utils/prescriptionQuantity";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderFromPrescription() {
  const { prescriptionId } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<any>(null);
  const [stockList, setStockList] = useState<any[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      load();
      loadAddedItems();
    }, [user?.uid, prescriptionId]),
  );

  const load = async () => {
    try {
      const snap = await getDoc(
        doc(db, "prescriptions", prescriptionId as string),
      );
      if (snap.exists()) setPrescription({ id: snap.id, ...snap.data() });

      const medSnap = await getDocs(collection(db, "medicines"));
      setStockList(medSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };
  const loadAddedItems = async () => {
    try {
      if (!user?.uid) return;

      const q = query(collection(db, "cart"), where("userId", "==", user.uid));

      const snap = await getDocs(q);

      const ids = snap.docs.map((d) => d.data().medicineId).filter(Boolean);

      setAddedIds(ids);
    } catch (error) {
      console.log(error);
    }
  };

  const findStock = (medicineName: string) =>
    stockList.find(
      (s) => s.name?.toLowerCase() === medicineName?.toLowerCase(),
    );

  const findAlternative = (stockItem: any) =>
    stockList.find(
      (s) =>
        s.salt === stockItem?.salt && s.stock > 0 && s.name !== stockItem?.name,
    );

  //  FIX: ab "med" (prescription ka medicine object) bhi le rahe hain,
  // taake uska quantity cart mein "maxQuantity" ke taur pe save ho sake.
  // Isse patient prescription se zyada quantity add nahi kar sakega.
  const addToCart = async (item: any, med: any) => {
    try {
      const cartQuery = query(
        collection(db, "cart"),
        where("userId", "==", user?.uid),
        where("medicineId", "==", item.id),
      );

      const cartSnapshot = await getDocs(cartQuery);

      if (!cartSnapshot.empty) {
        Alert.alert(
          "Already in Cart",
          `${item.name} is already added to your cart.`,
        );
        return;
      }

      const prescribedQty = calculatePrescribedQuantity(med);

      // Stock se zyada nahi bhej sakte, chahe doctor ne zyada likha ho
      const availableQty = Math.min(prescribedQty, item.stock || prescribedQty);

      await addDoc(collection(db, "cart"), {
        userId: user?.uid,
        medicineId: item.id,
        name: item.name,
        salt: item.salt,
        price: item.price,
        createdAt: new Date(),
        quantity: availableQty, // 👈 by default full amount
        maxQuantity: prescribedQty, // 👈 sahi calculation
        prescriptionId: prescription?.id || null,
      });

      setAddedIds((prev) => [...prev, item.id]);

      Alert.alert(
        "Added ✅",
        `${item.name} added to cart (Qty: ${availableQty})`,
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to add medicine");
    }
  };

  //  FIX: "med" ab yahan tak pass ho raha hai (pehle sirf stockItem jata tha)
  const handleAdd = (stockItem: any, med: any) => {
    if (!stockItem || stockItem.stock <= 0) {
      const alt = stockItem ? findAlternative(stockItem) : null;
      if (alt) {
        Alert.alert(
          "Out of Stock — Alternative Available 💊",
          `${alt.name} available instead. Add it?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Add Alternative", onPress: () => addToCart(alt, med) },
          ],
        );
      } else {
        Alert.alert(
          "Out of Stock ❌",
          "No alternative available for this medicine.",
        );
      }
      return;
    }
    addToCart(stockItem, med);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  if (!prescription)
    return (
      <View style={styles.center}>
        <Text>Prescription not found.</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Order Medicines</Text>
        <Text style={styles.headerSubTitle}>
          From prescription — {prescription.doctorName}
        </Text>
      </View>

      {(prescription.medicines || []).map((med: any, index: number) => {
        const stockItem = findStock(med.medicineName);
        const isAdded = stockItem && addedIds.includes(stockItem.id);
        const inStock = stockItem && stockItem.stock > 0;

        return (
          <View key={index} style={styles.card}>
            <Text style={styles.medName}>💊 {med.medicineName}</Text>
            <Text style={styles.medInfo}>Dosage: {med.dosage}</Text>
            <Text style={styles.medInfo}>Duration: {med.duration}</Text>
            <Text style={styles.medInfo}>
              Prescribed Quantity: {calculatePrescribedQuantity(med)}
            </Text>
            <Text style={[styles.medInfo, { fontSize: 12, color: "#94A3B8" }]}>
              ({getQuantityBreakdown(med)})
            </Text>

            {stockItem ? (
              <Text style={styles.price}>
                💰 Rs {stockItem.price} {!inStock && "— Out of Stock"}
              </Text>
            ) : (
              <Text style={styles.notFound}>
                ⚠ Not available in pharmacy stock
              </Text>
            )}

            <TouchableOpacity
              style={[styles.addBtn, isAdded && { backgroundColor: "#9CA3AF" }]}
              onPress={() => handleAdd(stockItem, med)}
              disabled={isAdded}
            >
              <Ionicons
                name={isAdded ? "checkmark" : "cart"}
                size={18}
                color="#fff"
              />
              <Text style={styles.addBtnText}>
                {isAdded ? "Added to Cart" : "Add to Cart"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity
        style={styles.goToCartBtn}
        onPress={() => router.push("/(main)/cart")}
      >
        <Ionicons name="cart" size={20} color="#fff" />
        <Text style={styles.goToCartText}>Go to Cart</Text>
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#F59E0B",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerSubTitle: { color: "#FEF3C7", marginTop: 5 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  medName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  medInfo: { color: "#6B7280", marginBottom: 3 },
  price: { color: "#16A34A", fontWeight: "700", marginTop: 6 },
  notFound: { color: "#DC2626", fontWeight: "600", marginTop: 6 },
  addBtn: {
    backgroundColor: "#2563EB",
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
  goToCartBtn: {
    backgroundColor: "#16A34A",
    marginHorizontal: 15,
    marginTop: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  goToCartText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
