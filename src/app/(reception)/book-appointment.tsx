import SlipPopup from "@/src/components/SlipPopup";
import { useAuth } from "@/src/context/AuthContext";
import { createAppointment, getDoctors } from "@/src/utils/firestoreService";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import {
  createPatient,
  findPatient,
  generatePatientId,
} from "@/src/utils/patientService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function BookAppointment() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [DOB, setDOB] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const [saving, setSaving] = useState(false);

  const [visible, setVisible] = useState(false);
  const [slip, setSlip] = useState<any>(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const data = await getDoctors();
    setDoctors(data);
  };

  const clearForm = () => {
    setName("");
    setDOB("");
    setPhone("");
    setGender("");
    setAge("");
    setSelectedDoctor(null);
  };

  const generateSlip = async () => {
    if (!selectedDoctor) {
      Alert.alert("Required", "Please select a doctor");
      return;
    }

    if (
      !name.trim() ||
      !DOB.trim() ||
      !phone.trim() ||
      !gender.trim() ||
      !age.trim()
    ) {
      Alert.alert("Required", "Please fill all patient details");
      return;
    }

    setSaving(true);

    try {
      // Same matching logic jo patient ki self-signup mein hoti hai —
      // agar ye patient pehle bhi aa chuka hai (kisi bhi maadhyam se),
      // to purani patientId use karo, naya duplicate na bane.
      const existing = await findPatient(phone, name, gender, DOB, age);

      let patientId = "";

      if (existing) {
        patientId = existing.patientId;
      } else {
        patientId = await generatePatientId();
        await createPatient({ patientId, name, phone, gender, DOB, age });
      }

      const token = "TKN-" + Math.floor(1000 + Math.random() * 9000);

      const data = {
        token,
        patientId,
        userId: null, // 👈 walk-in patient ka koi app account nahi hai abhi
        name,
        DOB,
        phone,
        gender,
        age,
        doctorId: selectedDoctor.uid,
        doctorName: selectedDoctor.name,
        doctorEmail: selectedDoctor.email,
        specialization: selectedDoctor.specialization || "General Physician",
        status: "Pending",
        date: new Date().toDateString(),
        time: new Date().toLocaleTimeString(),
        bookedBy: "reception",
        bookedByUid: user?.uid || "",
      };

      await createAppointment(data);

      setSlip(data);
      setVisible(true);
      clearForm();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to book appointment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>New Walk-in Booking</Text>
          <Text style={styles.headerSub}>
            Register patient & book appointment
          </Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#0D9488" />
        <Text style={styles.infoBannerText}>
          If this patient has visited before or has the app, entering the same
          Name, DOB, Gender & Phone will link this booking to their existing
          record automatically.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>👤 Patient Information</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="e.g. Ali Raza"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="DD-MM-YYYY"
          value={DOB}
          onChangeText={(text) => setDOB(formatDOBInput(text))}
          keyboardType="number-pad"
          maxLength={10}
          style={styles.input}
        />

        <TextInput
          placeholder="03XX-XXXXXXX"
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneInput(text))}
          keyboardType="number-pad"
          maxLength={12}
          style={styles.input}
        />

        <Text style={styles.label}>Gender</Text>
        <TextInput
          placeholder="Male / Female"
          value={gender}
          onChangeText={setGender}
          style={styles.input}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          placeholder="e.g. 28"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>👨‍⚕️ Select Doctor</Text>

        {doctors.length === 0 ? (
          <Text style={styles.emptyText}>No doctors available.</Text>
        ) : (
          doctors.map((item: any) => (
            <TouchableOpacity
              key={item.uid}
              onPress={() => setSelectedDoctor(item)}
              style={[
                styles.doctorCard,
                selectedDoctor?.uid === item.uid && styles.doctorCardActive,
              ]}
            >
              <Text
                style={[
                  styles.doctorName,
                  selectedDoctor?.uid === item.uid && styles.doctorNameActive,
                ]}
              >
                Dr. {item.name}
              </Text>
              <Text
                style={[
                  styles.doctorSpec,
                  selectedDoctor?.uid === item.uid && styles.doctorSpecActive,
                ]}
              >
                {item.specialization || "General Physician"}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={generateSlip}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.submitBtnText}>Book Appointment</Text>
          </>
        )}
      </TouchableOpacity>

      <SlipPopup
        visible={visible}
        data={slip}
        onClose={() => setVisible(false)}
      />

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FDFA" },
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
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#CCFBF1", marginTop: 4, fontSize: 12 },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#CCFBF1",
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 14,
    padding: 14,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 10,
    color: "#134E4A",
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
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
  label: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  emptyText: { color: "#94A3B8", textAlign: "center", paddingVertical: 15 },
  doctorCard: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  doctorCardActive: {
    backgroundColor: "#0D9488",
    borderColor: "#0D9488",
  },
  doctorName: { fontWeight: "700", color: "#111827" },
  doctorNameActive: { color: "#fff" },
  doctorSpec: { color: "#6B7280", marginTop: 3 },
  doctorSpecActive: { color: "#CCFBF1" },
  submitBtn: {
    backgroundColor: "#16A34A",
    marginHorizontal: 15,
    marginTop: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
