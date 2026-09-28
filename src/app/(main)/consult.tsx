import SlipPopup from "@/src/components/SlipPopup";
import { useAuth } from "@/src/context/AuthContext";
import {
  createAppointment,
  getDoctors,
  getUserById,
} from "@/src/utils/firestoreService";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import {
  createPatient,
  findPatient,
  generatePatientId,
  getPatient,
  updatePatient,
} from "@/src/utils/patientService";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Consult() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [DOB, setDOB] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [bookingFor, setBookingFor] = useState<"self" | "other">("self");
  const [slip, setSlip] = useState<any>(null);
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

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
      const patient = await getPatient(userData.patientId);
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

  const generateSlip = async () => {
    if (!selectedDoctor) {
      alert("Please select a doctor");
      return;
    }
    if (!name || !DOB || !phone || !gender || !age) {
      alert("Please fill all fields");
      return;
    }

    let patientId = "";

    if (bookingFor === "self") {
      if (!user) {
        alert("Please login first");
        return;
      }
      const userData = await getUserById(user.uid);
      if (!userData) {
        alert("User not found");
        return;
      }
      patientId = userData.patientId;
      await updatePatient(patientId, { name, phone, gender, DOB, age });
    } else {
      // 👇 Ab age bhi pass ho raha hai match check ke liye
      const patient = await findPatient(phone, name, gender, DOB, age);

      if (patient) {
        // Existing patient mila — user ko batao
        patientId = patient.patientId;
        Alert.alert(
          "Existing Patient Found ✅",
          `Ye patient pehle se exist karta hai. Purani Patient ID (${patientId}) use ki ja rahi hai.`,
        );
      } else {
        // Naya patient — nayi ID banao
        patientId = await generatePatientId();
        await createPatient({ patientId, name, phone, gender, DOB, age });
        Alert.alert(
          "New Patient Registered 🆕",
          `Nayi Patient ID generate hui hai: ${patientId}`,
        );
      }
    }

    const token = "TKN-" + Math.floor(1000 + Math.random() * 9000);
    const data = {
      token,
      patientId,
      userId: user?.uid,
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
      setName("");
      setDOB("");
      setPhone("");
      setGender("");
      setAge("");
    } catch (error) {
      console.log(error);
      alert("Firestore save failed");
    }
  };

  return (
    <View style={styles.container}>
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
        onChangeText={(text) => setDOB(formatDOBInput(text))}
        keyboardType="number-pad"
        maxLength={10}
        style={styles.input}
      />
      <TextInput
        placeholder="Phone (03XX-XXXXXXX)"
        value={phone}
        onChangeText={(text) => setPhone(formatPhoneInput(text))}
        keyboardType="number-pad"
        maxLength={12}
        style={styles.input}
      />
      <TextInput
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
        style={styles.input}
      />
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
              selectedDoctor?.uid === item.uid ? "#2563EB" : "#fff",
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

      <TouchableOpacity style={styles.btn} onPress={generateSlip}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>Generate Slip</Text>
      </TouchableOpacity>

      <SlipPopup
        visible={visible}
        data={slip}
        onClose={() => setVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#EEF5FF",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
});
