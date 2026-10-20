import GenderPicker from "@/src/components/GenderPicker";
import SlipPopup from "@/src/components/SlipPopup";
import { useAuth } from "@/src/context/AuthContext";
import {
  createAppointment,
  findPendingDuplicate,
  getDoctors,
  getUserById,
} from "@/src/utils/firestoreService";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import {
  createPatient,
  findPatient,
  generatePatientId,
  generateToken,
  getPatient,
  updatePatient,
} from "@/src/utils/patientService";
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

export default function Consult() {
  const { user } = useAuth();

  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [DOB, setDOB] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [bookingFor, setBookingFor] = useState<"self" | "other">("self");
  const [slip, setSlip] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const busy = useRef(false); // foran lock (double tap rokne ke liye)
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPatient = async () => {
      if (bookingFor !== "self") {
        setName("");
        setDOB("");
        setPhone("");
        setGender("");
        setAge("");
        return;
      }
      if (!user) return;
      const userData = await getUserById(user.uid);
      if (!userData?.patientId) return;
      const patient: any = await getPatient(userData.patientId);
      if (!patient) return;
      setName(patient.name || "");
      setDOB(patient.DOB || "");
      setPhone(patient.phone || "");
      setGender(patient.gender || "");
      setAge(patient.age || "");
    };
    loadPatient();
    loadDoctors();
  }, [bookingFor, user]);

  const loadDoctors = async () => {
    const data = await getDoctors();
    setDoctors(data);
  };

  const doGenerate = async () => {
    if (!selectedDoctor) {
      Alert.alert("Required", "Please select a doctor");
      return;
    }
    if (!name || !DOB || !phone || !gender || !age) {
      Alert.alert("Required", "Please fill all fields");
      return;
    }
    if (!user) {
      Alert.alert("Login", "Please login first");
      return;
    }

    let patientId = "";

    if (bookingFor === "self") {
      const userData: any = await getUserById(user.uid);
      if (!userData) {
        Alert.alert("Error", "User not found");
        return;
      }
      patientId = userData.patientId;
      await updatePatient(patientId, { name, phone, gender, DOB, age });
    } else {
      const patient = await findPatient(phone, name, gender, DOB);

      if (patient) {
        patientId = patient.patientId;
        Alert.alert(
          "Existing Patient Found ✅",
          `Ye patient pehle se registered hai. Purani Patient ID (${patientId}) use ho rahi hai.`,
        );
      } else {
        patientId = await generatePatientId();
        await createPatient({ patientId, name, phone, gender, DOB, age });
        Alert.alert(
          "New Patient Registered 🆕",
          `Nayi Patient ID bani hai: ${patientId}`,
        );
      }
    }

    // Duplicate check: aaj, usi doctor ke saath, pending
    const dup = await findPendingDuplicate(
      "userId",
      user.uid,
      patientId,
      selectedDoctor.uid,
    );
    if (dup) {
      Alert.alert(
        "Appointment Pehle Se Hai",
        `${name} ki ${selectedDoctor.name} ke saath aaj ki appointment pehle se maujood hai (Token: ${dup.token}).`,
      );
      return;
    }

    const token = await generateToken(); const data = {
      token,
      patientId,
      userId: user.uid,
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
    };

    try {
      await createAppointment(data);
      setSlip(data);
      setVisible(true);
      if (bookingFor === "other") {
        setName("");
        setDOB("");
        setPhone("");
        setGender("");
        setAge("");
      }
      setSelectedDoctor(null);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Appointment save nahi ho saki.");
    }
  };

  const generateSlip = async () => {
    if (busy.current) return; // dusra tap ignore
    busy.current = true;
    setSaving(true);
    try {
      await doGenerate();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Kuch masla hua. Dobara try karein.");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
    >
      <Text style={styles.title}>Consult Doctor</Text>

      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontWeight: "700", marginBottom: 10 }}>Booking For</Text>
        <TouchableOpacity onPress={() => setBookingFor("self")}>
          <Text>{bookingFor === "self" ? "🔘" : "⚪"} Myself</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setBookingFor("other")}>
          <Text>{bookingFor === "other" ? "🔘" : "⚪"} Someone Else</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Date of Birth (DD-MM-YYYY)"
        value={DOB}
        onChangeText={(t) => setDOB(formatDOBInput(t))}
        keyboardType="number-pad"
        maxLength={10}
        style={styles.input}
      />
      <TextInput
        placeholder="Phone (03XX-XXXXXXX)"
        value={phone}
        onChangeText={(t) => setPhone(formatPhoneInput(t))}
        keyboardType="number-pad"
        maxLength={12}
        style={styles.input}
      />
      <GenderPicker value={gender} onChange={setGender} />
      <TextInput
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        style={styles.input}
      />

      <Text style={{ fontWeight: "700", marginTop: 15, marginBottom: 10 }}>
        Select Doctor
      </Text>

      {doctors.map((item: any) => (
        <TouchableOpacity
          key={item.uid}
          onPress={() => setSelectedDoctor(item)}
          style={{
            backgroundColor:
              selectedDoctor?.uid === item.uid ? "#0D9488" : "#fff",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: selectedDoctor?.uid === item.uid ? "#fff" : "#000",
              fontWeight: "700",
            }}
          >
            👨‍⚕️ Dr. {item.name}
          </Text>
          <Text
            style={{
              color: selectedDoctor?.uid === item.uid ? "#E5E7EB" : "#666",
            }}
          >
            {item.specialization || "General Physician"}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.btn, saving && { opacity: 0.6 }]}
        onPress={generateSlip}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0D9488" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            Generate Slip
          </Text>
        )}
      </TouchableOpacity>

      <SlipPopup
        visible={visible}
        data={slip}
        onClose={() => setVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    marginTop: 40,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#0D9488",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
});
