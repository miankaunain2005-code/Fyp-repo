import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function PrescriptionDetails() {
  const { prescriptionId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (prescriptionId) {
      loadPrescription();
    }
  }, [prescriptionId]);

  const loadPrescription = async () => {
    try {
      setLoading(true);
      setData(null);

      console.log("LOADING PRESCRIPTION ID:", prescriptionId);

      const snap = await getDoc(
        doc(db, "prescriptions", prescriptionId as string),
      );

      console.log("FETCHED PRESCRIPTION ID:", snap.id);

      console.log("FETCHED PRESCRIPTION DATA:", snap.data());

      if (snap.exists()) {
        setData({
          id: snap.id,
          ...snap.data(),
        });
      } else {
        setData(null);
      }
    } catch (error) {
      console.log("PRESCRIPTION LOAD ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#0D9488" />

        <Text style={styles.loadingText}>Loading Prescription...</Text>
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
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Prescription</Text>

        <Text style={styles.headerSubTitle}>Medical Consultation Report</Text>
      </View>

      {/* PATIENT */}

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

      {/* DOCTOR */}

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
      {/* CONSULTATION */}

      <View style={styles.card}>
        <Text style={styles.heading}>🩺 Consultation</Text>

        <Text style={styles.sectionTitle}>Symptoms</Text>

        <Text style={styles.description}>{data.symptoms || "N/A"}</Text>

        <Text style={styles.sectionTitle}>Diagnosis</Text>

        <Text style={styles.description}>{data.diagnosis || "N/A"}</Text>

        <Text style={styles.sectionTitle}>Clinical Notes</Text>

        <Text style={styles.description}>{data.notes || "No Notes"}</Text>
      </View>

      {/* MEDICINES */}

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

      {/* 👇 FIX: ab yeh sahi screen (order-from-prescription) pe jayega,
                jahan har medicine ke saamne "Add to Cart" button hota hai */}
      <TouchableOpacity
        style={styles.orderButton}
        onPress={() =>
          router.push({
            pathname: "/(main)/order-from-prescription",
            params: { prescriptionId: data.id },
          })
        }
      >
        <Ionicons name="cart" size={22} color="#fff" />

        <Text style={styles.buttonText}>Order Medicines (Home Delivery)</Text>
      </TouchableOpacity>

      {/* ACTION BUTTONS */}

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={() =>
          Alert.alert("Coming Soon", "PDF Download will be added in next step.")
        }
      >
        <Ionicons name="download" size={22} color="#fff" />

        <Text style={styles.buttonText}>Download PDF</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={() =>
          Alert.alert(
            "Coming Soon",
            "Share feature will be added in next step.",
          )
        }
      >
        <Ionicons name="share-social" size={22} color="#fff" />

        <Text style={styles.buttonText}>Share Prescription</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

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
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  headerSubTitle: {
    color: "#E5E7EB",
    fontSize: 15,
    marginTop: 5,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 18,
    padding: 18,
    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  heading: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  label: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },

  value: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },

  description: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 14,
    color: "#374151",
    fontSize: 15,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderButton: {
    backgroundColor: "#F59E0B",
    marginHorizontal: 15,
    marginTop: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  medicineCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  medicineName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  medicineInfo: {
    color: "#4B5563",
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 22,
  },

  downloadButton: {
    backgroundColor: "#0D9488",
    marginHorizontal: 15,
    marginTop: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  shareButton: {
    backgroundColor: "#16A34A",
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 40,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 10,
  },
});
