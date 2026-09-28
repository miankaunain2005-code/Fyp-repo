import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Medicine = {
  id: string;
  name: string;
  salt: string;
  strength: string;
  manufacturer: string;
  price: number;
  stock: number;
};

export default function EditMedicine() {
  const { user } = useAuth();

  const params = useLocalSearchParams<{ id?: string }>();

  const medicineId = typeof params.id === "string" ? params.id : undefined;

  const [search, setSearch] = useState("");

  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null,
  );

  const [loadingMedicines, setLoadingMedicines] = useState(true);

  const [quantityToAdd, setQuantityToAdd] = useState("");

  const [updating, setUpdating] = useState(false);

  const pharmacistName =
    user?.displayName || user?.email?.split("@")[0] || "Pharmacist";

  //  LOAD MEDICINES

  useEffect(() => {
    const medicinesRef = collection(db, "medicines");

    const unsubscribe = onSnapshot(
      medicinesRef,
      (snapshot) => {
        const medicineList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Medicine[];

        setMedicines(medicineList);

        setLoadingMedicines(false);

        // If coming from duplicate alert
        if (medicineId) {
          const medicine = medicineList.find((item) => item.id === medicineId);

          if (medicine) {
            setSelectedMedicine(medicine);
          }
        }
      },
      (error) => {
        console.log("LOAD MEDICINES ERROR:", error);

        setLoadingMedicines(false);
      },
    );

    return () => unsubscribe();
  }, [medicineId]);

  //  SEARCH

  const filteredMedicines = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return medicines;
    }

    return medicines.filter(
      (medicine) =>
        medicine.name?.toLowerCase().includes(searchText) ||
        medicine.salt?.toLowerCase().includes(searchText) ||
        medicine.strength?.toLowerCase().includes(searchText) ||
        medicine.manufacturer?.toLowerCase().includes(searchText),
    );
  }, [search, medicines]);

  //  STOCK CALCULATION

  const addedQuantity = Number(quantityToAdd) || 0;

  const currentStock = selectedMedicine?.stock || 0;

  const newStock = currentStock + addedQuantity;

  //  UPDATE STOCK

  const handleUpdateStock = async () => {
    if (!selectedMedicine) {
      Alert.alert("Select Medicine", "Please select a medicine first.");

      return;
    }

    const quantity = Number(quantityToAdd);

    if (
      !quantityToAdd.trim() ||
      isNaN(quantity) ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      Alert.alert(
        "Invalid Quantity",
        "Please enter a valid whole number greater than 0.",
      );

      return;
    }

    setUpdating(true);

    try {
      const medicineRef = doc(db, "medicines", selectedMedicine.id);

      await runTransaction(db, async (transaction) => {
        const medicineSnapshot = await transaction.get(medicineRef);

        if (!medicineSnapshot.exists()) {
          throw new Error("Medicine no longer exists.");
        }

        const currentData = medicineSnapshot.data();

        const previousStock = Number(currentData.stock) || 0;

        const updatedStock = previousStock + quantity;

        // UPDATE MEDICINE STOCK

        transaction.update(medicineRef, {
          stock: updatedStock,

          updatedAt: serverTimestamp(),

          updatedBy: user?.uid || null,

          updatedByName: pharmacistName,
        });

        // CREATE STOCK HISTORY

        const historyRef = doc(collection(db, "stockHistory"));

        transaction.set(historyRef, {
          medicineId: selectedMedicine.id,

          medicineName: currentData.name || "",

          action: "STOCK_ADDED",

          previousStock,

          addedStock: quantity,

          newStock: updatedStock,

          updatedBy: user?.uid || null,

          updatedByName: pharmacistName,

          createdAt: serverTimestamp(),
        });
      });

      Alert.alert(
        "Stock Updated 💊",
        `${selectedMedicine.name} stock has been updated successfully.`,
        [
          {
            text: "OK",

            onPress: () => {
              setQuantityToAdd("");

              router.back();
            },
          },
        ],
      );
    } catch (error) {
      console.log("UPDATE STOCK ERROR:", error);

      Alert.alert("Error", "Unable to update stock. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/*  HEADER  */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View>
            <Text style={styles.headerTitle}>Update Stock</Text>

            <Text style={styles.headerSubtitle}>Manage pharmacy inventory</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/*  SEARCH  */}

          {!selectedMedicine && (
            <>
              <Text style={styles.sectionTitle}>Select Medicine</Text>

              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={21} color="#64748B" />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search medicine..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
              </View>

              {loadingMedicines ? (
                <ActivityIndicator
                  size="large"
                  color="#2563EB"
                  style={{
                    marginTop: 30,
                  }}
                />
              ) : (
                <View style={styles.medicineList}>
                  {filteredMedicines.map((medicine) => (
                    <TouchableOpacity
                      key={medicine.id}
                      style={styles.medicineItem}
                      onPress={() => {
                        setSelectedMedicine(medicine);

                        setSearch("");
                      }}
                    >
                      <View style={styles.medicineIcon}>
                        <Ionicons name="medical" size={22} color="#2563EB" />
                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text style={styles.medicineName}>{medicine.name}</Text>

                        <Text style={styles.medicineInfo}>
                          {medicine.salt}
                          {" • "}
                          {medicine.strength}
                        </Text>

                        <Text style={styles.manufacturer}>
                          {medicine.manufacturer}
                        </Text>
                      </View>

                      <View style={styles.stockBadge}>
                        <Text style={styles.stockBadgeText}>
                          {medicine.stock}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {!filteredMedicines.length && (
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name={"search-outline"}
                        size={35}
                        color="#94A3B8"
                      />

                      <Text style={styles.emptyText}>No medicine found</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/*  SELECTED MEDICINE  */}

          {selectedMedicine && (
            <>
              <View style={styles.selectedCard}>
                <View style={styles.selectedHeader}>
                  <View style={styles.medicineIcon}>
                    <Ionicons name="medical" size={25} color="#2563EB" />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.selectedName}>
                      {selectedMedicine.name}
                    </Text>

                    <Text style={styles.selectedInfo}>
                      {selectedMedicine.salt}
                      {" • "}
                      {selectedMedicine.strength}
                    </Text>
                  </View>

                  {!medicineId && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedMedicine(null);

                        setQuantityToAdd("");
                      }}
                    >
                      <Ionicons name="close-circle" size={26} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.selectedManufacturer}>
                  {selectedMedicine.manufacturer}
                </Text>
              </View>

              {/* CURRENT STOCK */}

              <View style={styles.stockCard}>
                <Text style={styles.stockLabel}>Current Stock</Text>

                <Text style={styles.currentStock}>{currentStock}</Text>

                <Text style={styles.stockUnits}>Units available</Text>
              </View>

              {/* ADD QUANTITY */}

              <Text style={styles.inputLabel}>Quantity to Add</Text>

              <View style={styles.quantityContainer}>
                <Ionicons name="add-circle-outline" size={22} color="#2563EB" />

                <TextInput
                  value={quantityToAdd}
                  onChangeText={setQuantityToAdd}
                  placeholder="Enter quantity"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  style={styles.quantityInput}
                />
              </View>

              {/* NEW TOTAL */}

              <View style={styles.newStockCard}>
                <Text style={styles.newStockLabel}>New Total Stock</Text>

                <Text style={styles.newStockValue}>{newStock}</Text>
              </View>

              {/* UPDATE BUTTON */}

              <TouchableOpacity
                style={[styles.updateButton, updating && styles.disabledButton]}
                onPress={handleUpdateStock}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={22} color="#fff" />

                    <Text style={styles.updateButtonText}>Update Stock</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View
          style={{
            height: 40,
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  header: {
    backgroundColor: "#2563EB",

    paddingTop: 55,

    paddingBottom: 28,

    paddingHorizontal: 20,

    flexDirection: "row",

    alignItems: "center",

    borderBottomLeftRadius: 25,

    borderBottomRightRadius: 25,
  },

  backButton: {
    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: "rgba(255,255,255,0.18)",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 14,
  },

  headerTitle: {
    color: "#fff",

    fontSize: 24,

    fontWeight: "700",
  },

  headerSubtitle: {
    color: "#DBEAFE",

    marginTop: 4,

    fontSize: 13,
  },

  content: {
    padding: 16,
  },

  sectionTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: "#0F172A",

    marginBottom: 12,
  },

  searchContainer: {
    height: 54,

    backgroundColor: "#fff",

    borderRadius: 12,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,

    marginLeft: 10,

    color: "#0F172A",

    fontSize: 15,
  },

  medicineList: {
    marginTop: 14,
  },

  medicineItem: {
    backgroundColor: "#fff",

    borderRadius: 14,

    padding: 14,

    marginBottom: 10,

    flexDirection: "row",

    alignItems: "center",

    elevation: 2,
  },

  medicineIcon: {
    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: "#EFF6FF",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 12,
  },

  medicineName: {
    fontSize: 16,

    fontWeight: "700",

    color: "#0F172A",
  },

  medicineInfo: {
    fontSize: 13,

    color: "#64748B",

    marginTop: 3,
  },

  manufacturer: {
    fontSize: 12,

    color: "#94A3B8",

    marginTop: 3,
  },

  stockBadge: {
    minWidth: 42,

    height: 30,

    borderRadius: 15,

    backgroundColor: "#EFF6FF",

    justifyContent: "center",

    alignItems: "center",

    paddingHorizontal: 8,
  },

  stockBadgeText: {
    color: "#2563EB",

    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",

    paddingVertical: 40,
  },

  emptyText: {
    color: "#64748B",

    marginTop: 10,
  },

  selectedCard: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 16,

    elevation: 2,

    marginBottom: 16,
  },

  selectedHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  selectedName: {
    fontSize: 18,

    fontWeight: "700",

    color: "#0F172A",
  },

  selectedInfo: {
    color: "#64748B",

    marginTop: 4,
  },

  selectedManufacturer: {
    color: "#64748B",

    marginLeft: 58,

    marginTop: 5,

    fontSize: 13,
  },

  stockCard: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 22,

    alignItems: "center",

    elevation: 2,

    marginBottom: 20,
  },

  stockLabel: {
    color: "#64748B",

    fontSize: 14,
  },

  currentStock: {
    color: "#2563EB",

    fontSize: 40,

    fontWeight: "700",

    marginTop: 6,
  },

  stockUnits: {
    color: "#94A3B8",

    fontSize: 12,

    marginTop: 3,
  },

  inputLabel: {
    fontSize: 14,

    fontWeight: "600",

    color: "#334155",

    marginBottom: 8,
  },

  quantityContainer: {
    height: 54,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: 12,

    backgroundColor: "#fff",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,
  },

  quantityInput: {
    flex: 1,

    marginLeft: 10,

    color: "#0F172A",

    fontSize: 16,
  },

  newStockCard: {
    backgroundColor: "#EFF6FF",

    borderRadius: 14,

    padding: 18,

    alignItems: "center",

    marginTop: 18,
  },

  newStockLabel: {
    color: "#475569",

    fontSize: 13,
  },

  newStockValue: {
    color: "#2563EB",

    fontSize: 32,

    fontWeight: "700",

    marginTop: 4,
  },

  updateButton: {
    height: 55,

    borderRadius: 13,

    backgroundColor: "#2563EB",

    marginTop: 22,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",
  },

  updateButtonText: {
    color: "#fff",

    fontWeight: "700",

    fontSize: 16,

    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
