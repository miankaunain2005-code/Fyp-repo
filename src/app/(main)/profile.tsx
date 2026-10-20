import GenderPicker from "@/src/components/GenderPicker";
import { useAuth } from "@/src/context/AuthContext";
import { getUserById } from "@/src/utils/firestoreService";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import { getPatient, linkExistingRecord, updatePatient } from "@/src/utils/patientService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
export default function PatientProfile() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [DOB, setDOB] = useState("");
  const [age, setAge] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkPid, setLinkPid] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [linking, setLinking] = useState(false);

  const handleLink = async () => {
    if (linking || !user) return;
    setLinking(true);
    try {
      const newPid = await linkExistingRecord(user.uid, patientId, linkPid, linkCode);
      await refreshProfile();
      setPatientId(newPid);
      setLinkOpen(false);
      setLinkPid("");
      setLinkCode("");
      await loadProfile(); // naye record ki details dikhao
      Alert.alert("Ho Gaya ✅", `Aap ka account ${newPid} se jur gaya. Purani history ab "Myself" mein dikhegi.`);
    } catch (e: any) {
      Alert.alert("Link Nahi Hua", e?.message || "Dobara try karein.");
    }
    setLinking(false);
  };
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!user) return;

      const userData = await getUserById(user.uid);
      if (!userData?.patientId) {
        setLoading(false);
        return;
      }

      setPatientId(userData.patientId);

      const patient = await getPatient(userData.patientId);
      if (patient) {
        setName(patient.name || "");
        setPhone(patient.phone || "");
        setGender(patient.gender || "");
        setDOB(patient.DOB || "");
        setAge(patient.age || "");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required", "Name and phone are required.");
      return;
    }

    setSaving(true);
    try {
      await updatePatient(patientId, { name, phone, gender, DOB, age });
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to update profile.");
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="#0D9488" />
        </View>
        <Text style={styles.headerName}>{name || "Patient"}</Text>
        <Text style={styles.headerSub}>Patient ID: {patientId}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>Personal Information</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons
              name={editing ? "close" : "create-outline"}
              size={22}
              color="#0D9488"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={editing}
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneInput(text))}
          editable={editing}
          keyboardType="number-pad"
          maxLength={12}
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        <Text style={styles.label}>Gender</Text>
        {editing ? (
          <GenderPicker value={gender} onChange={setGender} />
        ) : (
          <TextInput value={gender} editable={false} style={[styles.input, styles.inputDisabled]} />
        )}

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          value={DOB}
          onChangeText={(text) => setDOB(formatDOBInput(text))}
          editable={editing}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        <Text style={styles.label}>Age</Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          editable={editing}
          keyboardType="number-pad"
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        {editing && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#0D9488" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>
      {profile?.recordLinked === false && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>🏥 Hospital Record</Text>
          <Text style={{ color: "#64748B", marginBottom: 12, lineHeight: 20 }}>
            Have you visited this hospital before? Enter the Patient ID and Activation Code from your slip to link your previous medical history to this account.          </Text>
          <TouchableOpacity style={styles.saveBtn} onPress={() => setLinkOpen(true)}>
            <Text style={styles.saveBtnText}>Link Hospital Record</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={linkOpen} transparent animationType="fade" onRequestClose={() => setLinkOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20 }}>
            <Text style={styles.cardHeading}>Link Hospital Record</Text>
            <TextInput
              placeholder="Patient ID (P-000012)"
              value={linkPid}
              onChangeText={setLinkPid}
              autoCapitalize="characters"
              style={[styles.input, { marginTop: 8 }]}
            />
            <TextInput
              placeholder="Activation Code (6 digit)"
              value={linkCode}
              onChangeText={setLinkCode}
              keyboardType="number-pad"
              maxLength={6}
              style={[styles.input, { marginTop: 10 }]}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleLink} disabled={linking}>
              {linking ? <ActivityIndicator color="#0D9488" /> : <Text style={styles.saveBtnText}>Link Karein</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLinkOpen(false)} style={{ alignItems: "center", marginTop: 14 }}>
              <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF5FF",
  },
  header: {
    backgroundColor: "#0D9488",
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  headerName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "#DBEAFE", marginTop: 5, fontSize: 13 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 18,
    padding: 18,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardHeading: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  label: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 10,
  },
  value: { color: "#0F172A", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    color: "#0F172A",
  },
  inputDisabled: { backgroundColor: "#F8FAFC", color: "#64748B" },
  saveBtn: {
    backgroundColor: "#0D9488",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  logoutBtn: {
    backgroundColor: "#EF4444",
    marginHorizontal: 18,
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
});
