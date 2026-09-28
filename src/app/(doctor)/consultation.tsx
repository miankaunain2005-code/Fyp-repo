import { useAuth } from "@/src/context/AuthContext";
import {
  getMedicineSuggestions,
  InventoryMedicine,
} from "@/src/utils/medicineMatch";
import { router, useLocalSearchParams } from "expo-router";
import { getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/src/config/firebaseConfig";

// Medicine Type

type Medicine = {
  medicineName: string;
  dosage: string;
  quantity: string;
  duration: string;
  instructions: string;

  morning: boolean;
  afternoon: boolean;
  night: boolean;
};

export default function ConsultationScreen() {
  // Route Params
  const {
    appointmentId,
    patientId,
    userId,

    patientName,
    age,
    gender,
    phone,

    token,
    date,
    time,

    doctorId,
    doctorName,
    doctorEmail,
  } = useLocalSearchParams();
  console.log("DOCTOR NAME RECEIVED:", doctorName);
  console.log("DOCTOR ID RECEIVED:", doctorId);

  // Consultation
  const { user } = useAuth();

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  // Medicine Form
  const [inventoryMedicines, setInventoryMedicines] = useState<
    InventoryMedicine[]
  >([]);
  const [suggestions, setSuggestions] = useState<InventoryMedicine[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [medicineName, setMedicineName] = useState("");
  const handleMedicineNameChange = (text: string) => {
    setMedicineName(text);

    if (text.trim().length >= 2) {
      const matches = getMedicineSuggestions(text, inventoryMedicines, 6);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (medicine: InventoryMedicine) => {
    setMedicineName(medicine.name);
    setShowSuggestions(false);
  };
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");

  // Timing

  const [morning, setMorning] = useState(false);
  const [afternoon, setAfternoon] = useState(false);
  const [night, setNight] = useState(false);

  // Medicines

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  // Add Medicine
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const snap = await getDocs(collection(db, "medicines"));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as InventoryMedicine[];
        setInventoryMedicines(data);
      } catch (error) {
        console.log("Failed to load medicine inventory:", error);
      }
    };
    loadInventory();
  }, []);
  const addMedicine = () => {
    if (
      !medicineName.trim() ||
      !dosage.trim() ||
      !quantity.trim() ||
      !duration.trim()
    ) {
      Alert.alert("Required", "Please fill all medicine details.");
      return;
    }

    const newMedicine: Medicine = {
      medicineName,
      dosage,
      quantity,
      duration,
      instructions,
      morning,
      afternoon,
      night,
    };
    //ya previos med b store rekhy ga agr add medcine krty to
    setMedicines((prev) => [...prev, newMedicine]);

    // Clear Form
    setMedicineName("");
    setDosage("");
    setQuantity("");
    setDuration("");
    setInstructions("");

    setMorning(false);
    setAfternoon(false);
    setNight(false);
  };

  // Remove Medicine

  const removeMedicine = (index: number) => {
    //filter array ma kuch item rekhny or kuch remove krny k lia huta
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Prescription

  const savePrescription = async () => {
    if (!symptoms.trim()) {
      Alert.alert("Required", "Please enter symptoms.");
      return;
    }

    if (!diagnosis.trim()) {
      Alert.alert("Required", "Please enter diagnosis.");
      return;
    }

    if (medicines.length === 0) {
      Alert.alert("Required", "Please add at least one medicine.");
      return;
    }
    //try catch is a good practice for catch the error
    try {
      await addDoc(collection(db, "prescriptions"), {
        appointmentId,
        patientId,
        userId,
        patientName,
        age,
        gender,
        phone,
        token,
        date,
        time,
        symptoms,
        diagnosis,
        notes,
        medicines,
        doctorId: doctorId || user?.uid || "",
        doctorName:
          doctorName ||
          user?.displayName ||
          user?.email?.split("@")[0] ||
          "Doctor",
        doctorEmail: doctorEmail || user?.email || "",
        status: "Pending",
        dispensedAtPharmacy: false, // 👈 naya field
        createdAt: serverTimestamp(),
      });

      if (appointmentId) {
        await updateDoc(doc(db, "appointments", appointmentId as string), {
          status: "Completed",
          consultationCompleted: true,
        });
      }

      Alert.alert("Success", "Prescription submitted successfully.", [
        {
          text: "OK",
          onPress: () => router.push("/(doctor)"),
        },
      ]);
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to submit prescription.");
    }
  };
  return (
    <View style={styles.container}>
      {/*  HEADER  */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🩺 Consultation</Text>

        <Text style={styles.headerSubTitle}>Doctor Prescription Panel</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 130,
        }}
      >
        {/*  PATIENT CARD  */}

        <View style={styles.patientCard}>
          <Text style={styles.cardHeading}>👤 Patient Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{patientName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Token</Text>
            <Text style={styles.value}>#{token}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Patient ID</Text>

            <Text style={styles.value}>{patientId}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{age}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{gender}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Appointment</Text>
            <Text style={styles.value}>
              {date} | {time}
            </Text>
          </View>
        </View>

        {/*  CONSULTATION  */}

        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>🩺 Consultation</Text>

          <Text style={styles.inputTitle}>Symptoms</Text>

          <TextInput
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Enter patient symptoms..."
            multiline
            style={styles.textArea}
          />

          <Text style={styles.inputTitle}>Diagnosis</Text>

          <TextInput
            value={diagnosis}
            onChangeText={setDiagnosis}
            placeholder="Enter diagnosis..."
            multiline
            style={styles.textArea}
          />

          <Text style={styles.inputTitle}>Clinical Notes</Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Doctor notes..."
            multiline
            style={styles.textArea}
          />
        </View>

        {/*  PRESCRIPTION  */}

        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>💊 Prescription</Text>

          <Text style={styles.inputTitle}>Medicine Name</Text>

          <Text style={styles.inputTitle}>Medicine Name</Text>
          <TextInput
            placeholder="e.g. Panadol"
            value={medicineName}
            onChangeText={handleMedicineNameChange}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            style={styles.input}
          />

          {showSuggestions && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginTop: -8,
                marginBottom: 10,
                maxHeight: 220,
                overflow: "hidden",
              }}
            >
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => selectSuggestion(item)}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: "700", color: "#111827" }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: "#6B7280", fontSize: 12 }}>
                      {item.strength || ""}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: (item.stock || 0) > 0 ? "#16A34A" : "#DC2626",
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {(item.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={{ padding: 10, backgroundColor: "#F9FAFB" }}>
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  Not in the list? Keep typing to prescribe manually.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.inputTitle}>Dosage</Text>

          <TextInput
            placeholder="e.g. 500 mg"
            value={dosage}
            onChangeText={setDosage}
            style={styles.input}
          />

          <Text style={styles.inputTitle}>Quantity</Text>

          <TextInput
            placeholder="e.g. 2 Tablets"
            value={quantity}
            onChangeText={setQuantity}
            style={styles.input}
          />

          <Text style={styles.inputTitle}>Duration</Text>

          <TextInput
            placeholder="e.g. 5 Days"
            value={duration}
            onChangeText={setDuration}
            style={styles.input}
          />

          <Text style={styles.inputTitle}>Instructions</Text>

          <TextInput
            placeholder="e.g. After Meal"
            value={instructions}
            onChangeText={setInstructions}
            multiline
            style={styles.textArea}
          />

          {/* Timing */}

          <Text style={styles.inputTitle}>Timing</Text>

          <View style={styles.timingRow}>
            <TouchableOpacity
              style={[styles.timeButton, morning && styles.timeButtonActive]}
              onPress={() => setMorning(!morning)}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  morning && styles.timeButtonTextActive,
                ]}
              >
                🌞 Morning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeButton, afternoon && styles.timeButtonActive]}
              onPress={() => setAfternoon(!afternoon)}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  afternoon && styles.timeButtonTextActive,
                ]}
              >
                ☀ Afternoon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeButton, night && styles.timeButtonActive]}
              onPress={() => setNight(!night)}
            >
              <Text
                style={[
                  styles.timeButtonText,
                  night && styles.timeButtonTextActive,
                ]}
              >
                🌙 Night
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addMedicineButton}
            onPress={addMedicine}
          >
            <Text style={styles.addMedicineText}>➕ Add Medicine</Text>
          </TouchableOpacity>
        </View>

        {/*  ADDED MEDICINES  */}

        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>💊 Added Medicines</Text>

          {medicines.length === 0 ? (
            <Text style={styles.emptyText}>No medicines added yet.</Text>
          ) : (
            //Ye array ke har item par ek baar chalta hai.
            medicines.map((item, index) => (
              <View
                key={index} //index store krta h
                style={styles.medicineCard}
              >
                <Text style={styles.medicineName}>
                  💊 {item.medicineName}//current med name
                </Text>

                <Text style={styles.medicineInfo}>Dosage : {item.dosage}</Text>

                <Text style={styles.medicineInfo}>
                  Quantity : {item.quantity}
                </Text>

                <Text style={styles.medicineInfo}>
                  Duration : {item.duration}
                </Text>

                <Text style={styles.medicineInfo}>
                  Instructions : {item.instructions}
                </Text>

                <Text style={styles.medicineInfo}>
                  Timing :{item.morning ? " 🌞 Morning" : ""}
                  {item.afternoon ? " ☀ Afternoon" : ""}
                  {item.night ? " 🌙 Night" : ""}
                </Text>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeMedicine(index)}
                >
                  <Text style={styles.deleteButtonText}>
                    🗑 Remove Medicine
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/*  AI VOICE ASSISTANT  */}

        <View style={styles.voiceCard}>
          <Text style={styles.voiceTitle}>🎤 AI Voice Assistant</Text>

          <Text style={styles.voiceDescription}>
            Speak the complete prescription. AI will automatically fill: •
            Symptoms • Diagnosis • Medicines • Dosage • Quantity • Duration •
            Timing
          </Text>

          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() =>
              Alert.alert(
                "Coming Soon 🚀",
                "AI Voice Prescription will be added in the backend phase.",
              )
            }
          >
            <Text style={styles.voiceButtonText}>🎙 Start Recording</Text>
          </TouchableOpacity>
        </View>

        {/*  PART 5  */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={savePrescription}
        >
          <Text style={styles.submitButtonText}>✅ Submit Prescription</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  headerSubTitle: {
    color: "#E5E7EB",
    marginTop: 5,
    fontSize: 15,
  },

  patientCard: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },

  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },

  cardHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
    color: "#1F2937",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  label: {
    color: "#6B7280",
    fontWeight: "600",
  },

  value: {
    color: "#111827",
    fontWeight: "700",
  },

  inputTitle: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "600",
    color: "#374151",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },

  timingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  timeButton: {
    flex: 1,
    marginHorizontal: 3,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },

  timeButtonActive: {
    backgroundColor: "#2563EB",
  },

  timeButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },

  timeButtonTextActive: {
    color: "#fff",
  },

  addMedicineButton: {
    backgroundColor: "#2563EB",
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  addMedicineText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },

  medicineCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  medicineName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    color: "#111827",
  },

  medicineInfo: {
    color: "#4B5563",
    marginBottom: 4,
  },

  deleteButton: {
    backgroundColor: "#EF4444",
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  voiceCard: {
    backgroundColor: "#EEF4FF",
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  voiceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E40AF",
  },

  voiceDescription: {
    marginTop: 10,
    color: "#374151",
    lineHeight: 22,
  },

  voiceButton: {
    backgroundColor: "#DC2626",
    marginTop: 18,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  voiceButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  submitButton: {
    backgroundColor: "#16A34A",
    marginHorizontal: 15,
    marginBottom: 40,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },

  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
