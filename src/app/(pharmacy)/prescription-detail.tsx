import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { calculatePrescribedQuantity } from "@/src/utils/prescriptionQuantity";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
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

export default function PrescriptionDetail() {
  const { prescriptionId } = useLocalSearchParams();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [prescription, setPrescription] = useState<any>(null);

  const [allMedicines, setAllMedicines] = useState<any[]>([]);

  const [billItems, setBillItems] = useState<any[]>([]);
  const normalizeMedicineName = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "");
  };

  const normalizeSalt = (value: any) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  };

  const findMedicineInInventory = (
    prescriptionMedicine: any,
    medicines: any[],
  ) => {
    const prescribedName = normalizeMedicineName(
      prescriptionMedicine.medicineName,
    );

    const prescribedSalt = normalizeSalt(prescriptionMedicine.salt);

    // 1. Exact medicine name

    let match = medicines.find(
      (m) => normalizeMedicineName(m.name) === prescribedName,
    );

    if (match) return match;

    // 2. If prescription has salt, use name + salt

    if (prescribedSalt) {
      match = medicines.find(
        (m) =>
          normalizeSalt(m.salt) === prescribedSalt &&
          (normalizeMedicineName(m.name).includes(prescribedName) ||
            prescribedName.includes(normalizeMedicineName(m.name))),
      );

      if (match) return match;
    }

    // 3. Common small spelling difference

    const candidates = medicines.filter((m) => {
      const inventoryName = normalizeMedicineName(m.name);

      return (
        inventoryName.includes(prescribedName) ||
        prescribedName.includes(inventoryName)
      );
    });

    if (candidates.length === 1) {
      return candidates[0];
    }

    return undefined;
  };
  // Kisi bhi string (e.g. "2", "2 Tablets", "3 Days") se pehla number nikalta hai
  const parseNumber = (value: any, defaultValue: number = 1): number => {
    const match = String(value ?? "").match(/\d+(\.\d+)?/);
    if (!match) return defaultValue;
    const num = Number(match[0]);
    return isNaN(num) || num <= 0 ? defaultValue : num;
  };

  // const calculateTotalQuantity = (medicine: any) => {
  //   // Per-dose quantity: doctor ne "quantity" field mein diya
  //   // (e.g. "2" ya "2 Tablets" -> 2)
  //   const perDose = parseNumber(medicine.quantity, 1);

  //   // Din mein kitni baar lena hai: morning/afternoon/night
  //   // checkboxes count karke nikalte hain
  //   const timesPerDay =
  //     (medicine.morning ? 1 : 0) +
  //     (medicine.afternoon ? 1 : 0) +
  //     (medicine.night ? 1 : 0);

  //   // Agar doctor ne koi timing select nahi ki, default 1 baar/din
  //   const frequencyPerDay = timesPerDay > 0 ? timesPerDay : 1;

  //   // Duration: "3 Days" -> 3
  //   const durationDays = parseNumber(medicine.duration, 1);

  //   return perDose * frequencyPerDay * durationDays;
  // };

  const load = async () => {
    // Prescription

    const prescriptionSnap = await getDoc(
      doc(db, "prescriptions", prescriptionId as string),
    );

    if (!prescriptionSnap.exists()) {
      setLoading(false);
      return;
    }

    try {
      const prescriptionData = {
        id: prescriptionSnap.id,
        ...prescriptionSnap.data(),
      } as any;

      setPrescription(prescriptionData);

      // Inventory

      const medicineSnap = await getDocs(collection(db, "medicines"));

      const medicines = medicineSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      setAllMedicines(medicines);

      // Prepare Bill Items

      const items = (prescriptionData.medicines || []).map((medicine: any) => {
        const stockMedicine = findMedicineInInventory(medicine, medicines);

        // TOTAL QUANTITY

        const totalQuantity = calculatePrescribedQuantity(medicine);
        const perDose = parseNumber(medicine.quantity, 1);
        const timesPerDay =
          (medicine.morning ? 1 : 0) +
          (medicine.afternoon ? 1 : 0) +
          (medicine.night ? 1 : 0) || 1;
        const durationDays = parseNumber(medicine.duration, 1);
        const quantityBreakdown = `${perDose} × ${timesPerDay}/day × ${durationDays} days`;

        // ALTERNATES
        //
        // IMPORTANT:
        // Only calculate/show alternatives when the
        // prescribed medicine is unavailable.

        let alternates: any[] = [];

        const prescribedMedicineUnavailable =
          !stockMedicine || Number(stockMedicine.stock || 0) < totalQuantity;

        if (prescribedMedicineUnavailable) {
          const prescribedSalt = normalizeSalt(
            medicine.salt || stockMedicine?.salt,
          );

          if (prescribedSalt) {
            alternates = medicines.filter((m) => {
              const sameSalt = normalizeSalt(m.salt) === prescribedSalt;

              const isDifferentMedicine = stockMedicine
                ? m.id !== stockMedicine.id
                : true;

              const enoughStock = Number(m.stock || 0) >= totalQuantity;

              return sameSalt && isDifferentMedicine && enoughStock;
            });
          }
        }

        return {
          medicineId: stockMedicine?.id,
          originalName: medicine.medicineName,
          selectedName: stockMedicine?.name || medicine.medicineName,
          dosage: medicine.dosage || "",
          instructions: medicine.instructions || "",
          prescribedQty: totalQuantity,
          quantityBreakdown, // 👈 naya field
          qty: String(totalQuantity),
          price: stockMedicine ? String(stockMedicine.price || 0) : "0",
          stock: stockMedicine ? Number(stockMedicine.stock || 0) : 0,
          inStock:
            !!stockMedicine &&
            Number(stockMedicine.stock || 0) >= totalQuantity,
          alternateMedicines: alternates,
          replaced: false,
        };
      });

      setBillItems(items);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };
  useEffect(() => { load(); }, [prescriptionId]);

  const updateItem = (index: number, field: string, value: any) => {
    setBillItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
            ...item,
            [field]: value,
          }
          : item,
      ),
    );
  };
  const replaceMedicine = (index: number, medicine: any) => {
    setBillItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const alternates = allMedicines.filter(
          (m) =>
            m.salt?.toLowerCase() === medicine.salt?.toLowerCase() &&
            m.strength === medicine.strength &&
            Number(m.stock || 0) >= Number(item.qty) &&
            m.id !== medicine.id,
        );

        return {
          ...item,

          medicineId: medicine.id,

          selectedName: medicine.name,

          price: String(medicine.price),

          stock: medicine.stock,

          inStock: Number(medicine.stock || 0) >= Number(item.qty),
          replaced: true,

          alternateMedicines: alternates,
        };
      }),
    );
  };

  const total = billItems.reduce((sum, item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;

    return sum + qty * price;
  }, 0);

  const validateStock = () => {
    for (const item of billItems) {
      const qty = Number(item.qty);
      const stock = Number(item.stock || 0);

      // Quantity valid honi chahiye
      if (!Number.isInteger(qty) || qty <= 0) {
        Alert.alert(
          "Invalid Quantity",
          `Please enter a valid quantity for ${item.selectedName}.`,
        );
        return false;
      }

      // Medicine inventory mein available nahi
      if (!item.medicineId || stock <= 0) {
        Alert.alert(
          "Medicine Unavailable",
          `${item.selectedName} is out of stock.\nPlease select an alternate medicine.`,
        );
        return false;
      }

      // Pharmacist requested quantity stock se zyada nahi ho sakti
      if (qty > stock) {
        Alert.alert(
          "Insufficient Stock",
          `${item.selectedName} has only ${stock} item(s) available.\n\nDoctor prescribed: ${item.prescribedQty}\nDispense quantity: ${qty}`,
        );
        return false;
      }
    }

    return true;
  };

  const generateBill = async () => {
    if (busy.current) return;

    if (billItems.length === 0) {
      Alert.alert("Error", "No medicines found.");
      return;
    }
    if (prescription?.dispensedAtPharmacy) {
      Alert.alert(
        "Already Dispensed",
        "Is prescription ka bill pehle ban chuka hai.",
      );
      return;
    }
    if (!validateStock()) return;

    busy.current = true;
    setSaving(true);

    try {
      for (const item of billItems) {
        const medicine = allMedicines.find((m) => m.id === item.medicineId);
        if (!medicine) throw new Error(`${item.selectedName} not found.`);

        const remaining = Number(medicine.stock) - Number(item.qty);
        if (remaining < 0) {
          throw new Error(`${item.selectedName} stock is insufficient.`);
        }

        await updateDoc(doc(db, "medicines", item.medicineId), {
          stock: remaining,
        });
      }

      await addDoc(collection(db, "bills"), {
        source: "counter",
        prescriptionId: prescription.id,
        userId: prescription.userId || "",
        patientId: prescription.patientId,
        patientName: prescription.patientName,
        phone: prescription.phone,
        doctorName: prescription.doctorName,
        pharmacistId: user?.uid,
        pharmacistName:
          profile?.name || user?.email?.split("@")[0] || "Pharmacist",
        items: billItems,
        total,
        status: "Paid",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "prescriptions", prescription.id), {
        dispensedAtPharmacy: true,
        dispensedAt: serverTimestamp(),
      });

      Alert.alert("Success", "Bill generated successfully.", [
        { text: "OK", onPress: () => router.replace("/(pharmacy)") },
      ]);
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Billing Failed",
        error?.message || "Unable to generate bill.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
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
        <Text style={styles.headerTitle}>💊 Dispense Prescription</Text>
        <Text style={styles.headerSubTitle}>{prescription.patientName}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>👤 Patient Info</Text>
        <Text style={styles.infoText}>ID: {prescription.patientId}</Text>
        <Text style={styles.infoText}>Phone: {prescription.phone}</Text>
        <Text style={styles.infoText}>Doctor: {prescription.doctorName}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardHeading}>💊 Medicines</Text>

        {billItems.map((item, index) => (
          <View key={index} style={styles.medRow}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={styles.medName}>{item.selectedName}</Text>

              {item.inStock ? (
                <View
                  style={{
                    backgroundColor: "#DCFCE7",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 15,
                  }}
                >
                  <Text
                    style={{
                      color: "#16A34A",
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    IN STOCK
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor: "#FEE2E2",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 15,
                  }}
                >
                  <Text
                    style={{
                      color: "#DC2626",
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    OUT OF STOCK
                  </Text>
                </View>
              )}
            </View>

            {item.replaced && (
              <Text
                style={{
                  color: "#0D9488",
                  marginTop: 5,
                  fontWeight: "600",
                }}
              >
                Replaced from {item.originalName}
              </Text>
            )}

            <Text style={styles.medSub}>{item.dosage}</Text>

            <Text style={styles.medSub}>{item.instructions}</Text>

            <Text style={{ marginTop: 8, color: "#64748B" }}>
              Doctor Prescribed : {item.prescribedQty}
            </Text>

            {item.quantityBreakdown && (
              <Text style={{ marginTop: 3, color: "#94A3B8", fontSize: 12 }}>
                ({item.quantityBreakdown})
              </Text>
            )}

            <Text
              style={{
                marginTop: 5,
                color: "#64748B",
              }}
            >
              Available Stock : {item.stock}
            </Text>
            {item.stock < item.prescribedQty && item.stock > 0 && (
              <Text
                style={{
                  marginTop: 5,
                  color: "#DC2626",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                ⚠️ Full prescribed quantity is not available
              </Text>
            )}
            {/* Qty + Price */}

            <View style={styles.rowInputs}>
              <View
                style={{
                  flex: 1,
                  marginRight: 10,
                }}
              >
                <Text style={styles.label}> Dispense Quantity</Text>

                <TextInput
                  value={item.qty}
                  keyboardType="number-pad"
                  onChangeText={(v) => updateItem(index, "qty", v)}
                  style={styles.input}
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.label}>Price</Text>

                <TextInput
                  value={item.price}
                  keyboardType="number-pad"
                  onChangeText={(v) => updateItem(index, "price", v)}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Alternate Medicines */}

            {!item.inStock && item.alternateMedicines.length > 0 && (
              <View
                style={{
                  marginTop: 18,
                }}
              >
                <Text
                  style={{
                    color: "#0D9488",
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  Suggested Alternatives
                </Text>

                {item.alternateMedicines.map((alt: any) => (
                  <TouchableOpacity
                    key={alt.id}
                    style={{
                      backgroundColor: "#EFF6FF",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 10,
                    }}
                    onPress={() => replaceMedicine(index, alt)}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#0D9488",
                      }}
                    >
                      {alt.name}
                    </Text>

                    <Text
                      style={{
                        color: "#64748B",
                        marginTop: 4,
                      }}
                    >
                      Salt : {alt.salt}
                    </Text>

                    <Text
                      style={{
                        color: "#16A34A",
                        marginTop: 4,
                      }}
                    >
                      Stock : {alt.stock}
                    </Text>

                    <Text
                      style={{
                        color: "#0D9488",
                        marginTop: 8,
                        fontWeight: "700",
                      }}
                    >
                      Replace Medicine
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!item.inStock && item.alternateMedicines.length === 0 && (
              <View
                style={{
                  backgroundColor: "#FEF2F2",
                  padding: 14,
                  borderRadius: 12,
                  marginTop: 15,
                }}
              >
                <Text
                  style={{
                    color: "#DC2626",
                    fontWeight: "700",
                  }}
                >
                  No Alternate Medicine Available
                </Text>

                <Text
                  style={{
                    color: "#7F1D1D",
                    marginTop: 5,
                  }}
                >
                  Bill cannot be generated until this medicine is available.
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Bill</Text>
        <Text style={styles.totalValue}>Rs {total.toFixed(0)}</Text>
      </View>

      <TouchableOpacity
        style={styles.generateBtn}
        onPress={generateBill}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0D9488" />
        ) : (
          <>
            <Ionicons name="receipt" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Bill & Dispense</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
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
  headerSubTitle: { color: "#E5E7EB", marginTop: 5 },
  card: {
    backgroundColor: "#fff",
    margin: 15,
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
  infoText: { color: "#374151", marginBottom: 5 },
  medRow: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    marginTop: 12,
  },
  medName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  medSub: { color: "#6B7280", marginTop: 3, fontSize: 13 },
  warning: { color: "#DC2626", marginTop: 5, fontSize: 12, fontWeight: "600" },
  rowInputs: { flexDirection: "row", marginTop: 10 },
  label: { color: "#6B7280", marginBottom: 5, fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  totalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  totalLabel: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  totalValue: { fontSize: 24, fontWeight: "800", color: "#0D9488" },
  generateBtn: {
    backgroundColor: "#16A34A",
    marginHorizontal: 15,
    marginTop: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
