import { normalizeDigits } from "@/src/utils/inputFormatters";
import { createActivationCode, getPatient } from "@/src/utils/patientService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function PatientCode() {
  const [patientId, setPatientId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const generate = async () => {
    if (!patientId.trim() || !phone.trim()) {
      Alert.alert("Required", "Patient ID aur phone dono daalein.");
      return;
    }
    setLoading(true);
    setCode(null);
    try {
      const pid = patientId.trim().toUpperCase();
      const patient: any = await getPatient(pid);

      if (
        !patient ||
        normalizeDigits(patient.phone) !== normalizeDigits(phone)
      ) {
        Alert.alert("Not Found", "Patient ID aur phone match nahi hue.");
      } else if (patient.linkedUserId) {
        Alert.alert(
          "Already Linked",
          "Is patient ka app account pehle se linked hai. Code ki zaroorat nahi.",
        );
      } else {
        setCode(await createActivationCode(pid));
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Code nahi ban saka.");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.title}>Activation Code</Text>
      </View>

      <View style={s.card}>
        <Text style={s.note}>
          If patient slip is lost then with the help of patientId or phone
          generatenew code and previous code is discard
        </Text>
        <TextInput
          placeholder="Patient ID (P-000012)"
          value={patientId}
          onChangeText={setPatientId}
          autoCapitalize="characters"
          style={s.input}
        />
        <TextInput
          placeholder="Patient ka phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="number-pad"
          style={s.input}
        />
        <TouchableOpacity style={s.btn} onPress={generate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0D9488" />
          ) : (
            <Text style={s.btnText}>Genrate new Code </Text>
          )}
        </TouchableOpacity>

        {code && (
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>Naya Code</Text>
            <Text style={s.code}>{code}</Text>
            <Text style={s.hint}>
              Ye patient ko bata dein ya likh kar dein.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff30",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 15 },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 15,
    padding: 16,
    elevation: 3,
  },
  note: { color: "#64748B", marginBottom: 12, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#0D9488",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  codeBox: {
    marginTop: 18,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  codeLabel: { color: "#065F46", fontWeight: "700" },
  code: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 8,
    color: "#047857",
    marginVertical: 6,
  },
  hint: { color: "#065F46", fontSize: 12 },
});
