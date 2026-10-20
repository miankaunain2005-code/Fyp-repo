import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useState } from "react";

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

export default function AddMedicine() {
  const { user } = useAuth();

  // FORM STATES
  const [name, setName] = useState("");
  const [salt, setSalt] = useState("");
  const [strength, setStrength] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  // SAVING STATE
  const [saving, setSaving] = useState(false);

  // COUNT OF MEDICINES ADDED IN THIS SESSION
  const [addedCount, setAddedCount] = useState(0);

  const normalizeValue = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const pharmacistName =
    user?.displayName || user?.email?.split("@")[0] || "Pharmacist";

  // --------------------------------------------------
  // CLEAR FORM
  // --------------------------------------------------

  const clearForm = () => {
    setName("");
    setSalt("");
    setStrength("");
    setManufacturer("");
    setPrice("");
    setStock("");
  };

  // --------------------------------------------------
  // ADD MEDICINE
  // --------------------------------------------------

  const handleAddMedicine = async () => {
    // VALIDATION
    if (
      !name.trim() ||
      !salt.trim() ||
      !strength.trim() ||
      !manufacturer.trim() ||
      !price.trim() ||
      !stock.trim()
    ) {
      Alert.alert("Missing Information", "Please fill all medicine details.");
      return;
    }

    const medicinePrice = Number(price);
    const medicineStock = Number(stock);

    // PRICE VALIDATION
    if (isNaN(medicinePrice) || medicinePrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid medicine price.");
      return;
    }

    // STOCK VALIDATION
    if (
      isNaN(medicineStock) ||
      medicineStock < 0 ||
      !Number.isInteger(medicineStock)
    ) {
      Alert.alert("Invalid Stock", "Stock must be a whole number.");
      return;
    }

    // NORMALIZED VALUES
    const normalizedName = normalizeValue(name);
    const normalizedSalt = normalizeValue(salt);
    const normalizedStrength = normalizeValue(strength);
    const normalizedManufacturer = normalizeValue(manufacturer);

    // UNIQUE MEDICINE KEY
    const medicineKey = `${normalizedName}_${normalizedSalt}_${normalizedStrength}_${normalizedManufacturer}`;

    setSaving(true);

    try {
      const medicinesRef = collection(db, "medicines");

      // --------------------------------------------------
      // DUPLICATE CHECK
      // --------------------------------------------------

      const duplicateQuery = query(
        medicinesRef,
        where("medicineKey", "==", medicineKey),
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      // --------------------------------------------------
      // DUPLICATE FOUND
      // --------------------------------------------------

      if (!duplicateSnapshot.empty) {
        const existingMedicine = duplicateSnapshot.docs[0];

        Alert.alert(
          "Medicine Already Exists",
          `${name.trim()} (${strength.trim()}) is already available in inventory.\n\nYou cannot add the same medicine again. Do you want to update its stock?`,
          [
            {
              text: "Keep Adding",
              style: "cancel",
            },
            {
              text: "Update Stock",
              onPress: () => {
                router.push({
                  pathname: "/(pharmacy)/edit-medicine",
                  params: {
                    id: existingMedicine.id,
                  },
                });
              },
            },
          ],
        );

        return;
      }

      // --------------------------------------------------
      // ADD NEW MEDICINE
      // --------------------------------------------------

      await addDoc(medicinesRef, {
        name: name.trim(),
        salt: salt.trim(),
        strength: strength.trim(),
        manufacturer: manufacturer.trim(),

        // Used for duplicate checking
        medicineKey,

        price: medicinePrice,
        stock: medicineStock,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        createdBy: user?.uid || null,
        createdByName: pharmacistName,
      });

      // INCREASE SESSION COUNT
      setAddedCount((prev) => prev + 1);

      // CLEAR FORM FOR NEXT MEDICINE
      clearForm();
    } catch (error) {
      console.log("ADD MEDICINE ERROR:", error);

      Alert.alert("Error", "Unable to add medicine. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // FINISH
  // --------------------------------------------------

  const handleFinish = () => {
    router.back();
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (addedCount > 0) {
                Alert.alert(
                  "Finish Adding Medicines?",
                  `You have added ${addedCount} ${addedCount === 1 ? "medicine" : "medicines"
                  } in this session.`,
                  [
                    {
                      text: "Stay",
                      style: "cancel",
                    },
                    {
                      text: "Finish",
                      onPress: handleFinish,
                    },
                  ],
                );
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Add Medicine</Text>

            <Text style={styles.headerSubtitle}>
              Add multiple medicines to pharmacy inventory
            </Text>
          </View>
        </View>

        {/* ADDED COUNT */}

        {addedCount > 0 && (
          <View style={styles.successBanner}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>
                Medicines Added Successfully
              </Text>

              <Text style={styles.successText}>
                {addedCount}{" "}
                {addedCount === 1 ? "medicine has" : "medicines have"} been
                added. You can add more below.
              </Text>
            </View>
          </View>
        )}

        {/* FORM CARD */}

        <View style={styles.formCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={32} color="#0D9488" />
          </View>

          <Text style={styles.formTitle}>Medicine Information</Text>

          {/* MEDICINE NAME */}

          <Text style={styles.label}>Medicine Name</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="medical-outline" size={20} color="#64748B" />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Panadol"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          {/* SALT */}

          <Text style={styles.label}>Salt / Generic Name</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="flask-outline" size={20} color="#64748B" />

            <TextInput
              value={salt}
              onChangeText={setSalt}
              placeholder="e.g. Paracetamol"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          {/* STRENGTH */}

          <Text style={styles.label}>Strength</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="fitness-outline" size={20} color="#64748B" />

            <TextInput
              value={strength}
              onChangeText={setStrength}
              placeholder="e.g. 500mg"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          {/* MANUFACTURER */}

          <Text style={styles.label}>Manufacturer</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color="#64748B" />

            <TextInput
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="e.g. GSK"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          {/* PRICE */}

          <Text style={styles.label}>Price (Rs)</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="cash-outline" size={20} color="#64748B" />

            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 50"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          {/* STOCK */}

          <Text style={styles.label}>Initial Stock</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="cube-outline" size={20} color="#64748B" />

            <TextInput
              value={stock}
              onChangeText={setStock}
              placeholder="e.g. 100"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          {/* ADD MEDICINE BUTTON */}

          <TouchableOpacity
            style={[styles.addButton, saving && styles.disabledButton]}
            onPress={handleAddMedicine}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#0D9488" />
            ) : (
              <>
                <Ionicons name="add-circle" size={22} color="#fff" />

                <Text style={styles.addButtonText}>Add Medicine</Text>
              </>
            )}
          </TouchableOpacity>

          {/* FINISH BUTTON */}

          <TouchableOpacity
            style={[
              styles.finishButton,
              addedCount === 0 && styles.disabledFinishButton,
            ]}
            onPress={handleFinish}
            disabled={addedCount === 0}
          >
            <Ionicons
              name="checkmark-done-circle-outline"
              size={22}
              color={addedCount === 0 ? "#94A3B8" : "#0D9488"}
            />

            <Text
              style={[
                styles.finishButtonText,
                addedCount === 0 && styles.disabledFinishButtonText,
              ]}
            >
              Finish & Go Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SPACE */}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  // HEADER

  header: {
    backgroundColor: "#0D9488",
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

  // SUCCESS BANNER

  successBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
  },

  successIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },

  successText: {
    fontSize: 12,
    color: "#15803D",
    marginTop: 3,
  },

  // FORM CARD

  formCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 22,
    borderRadius: 18,
    padding: 18,
    elevation: 3,
  },

  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },

  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 22,
  },

  // LABEL

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 7,
    marginTop: 5,
  },

  // INPUT

  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "#F8FAFC",
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: "#0F172A",
    fontSize: 15,
  },

  // ADD BUTTON

  addButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#0D9488",
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  disabledButton: {
    opacity: 0.6,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },

  // FINISH BUTTON

  finishButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#0D9488",
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
  },

  disabledFinishButton: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },

  finishButtonText: {
    color: "#0D9488",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },

  disabledFinishButtonText: {
    color: "#94A3B8",
  },
});
