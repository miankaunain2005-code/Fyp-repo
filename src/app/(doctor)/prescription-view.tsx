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

export default function DoctorPrescriptionView() {
  const { prescriptionId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const snap = await getDoc(
        doc(db, "prescriptions", prescriptionId as string),
      );
      if (snap.exists()) setData({ id: snap.id, ...snap.data() });
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loader}>
        <Ionicons name="document-outline" size={70} color="#94A3B8" />
        <Text style={styles.loadingText}>Prescription not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>📋 Prescription</Text>
          <Text style={styles.headerSubTitle}>Read-only view</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>👤 Patient Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{data.patientName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Patient ID</Text>
          <Text style={styles.value}>{data.patientId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Age</Text>
          <Text style={styles.value}>{data.age}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gender</Text>
          <Text style={styles.value}>{data.gender}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{data.phone}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>👨‍⚕️ Doctor Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Doctor</Text>
          <Text style={styles.value}>{data.doctorName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{data.date}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{data.time}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>🩺 Consultation</Text>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        <Text style={styles.description}>{data.symptoms || "N/A"}</Text>
        <Text style={styles.sectionTitle}>Diagnosis</Text>
        <Text style={styles.description}>{data.diagnosis || "N/A"}</Text>
        <Text style={styles.sectionTitle}>Clinical Notes</Text>
        <Text style={styles.description}>{data.notes || "No Notes"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>💊 Prescribed Medicines</Text>
        {data.medicines?.map((item: Medicine, index: number) => (
          <View key={index} style={styles.medicineCard}>
            <Text style={styles.medicineName}>💊 {item.medicineName}</Text>
            <Text style={styles.medicineInfo}>Dosage : {item.dosage}</Text>
            <Text style={styles.medicineInfo}>Quantity : {item.quantity}</Text>
            <Text style={styles.medicineInfo}>Duration : {item.duration}</Text>
            <Text style={styles.medicineInfo}>
              Instructions : {item.instructions}
            </Text>
            <Text style={styles.medicineInfo}>
              Timing :{item.morning ? " 🌞 Morning" : ""}
              {item.afternoon ? " ☀ Afternoon" : ""}
              {item.night ? " 🌙 Night" : ""}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7FC" },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
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
  headerSubTitle: { color: "#E5E7EB", fontSize: 13, marginTop: 3 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
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
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  description: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  medicineCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  medicineName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  medicineInfo: { color: "#4B5563", fontSize: 14, marginBottom: 5 },
});
