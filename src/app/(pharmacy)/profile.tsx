import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

export default function PharmacyProfile() {
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();

      setName(data?.name || user.displayName || "");
      setPharmacyName(data?.pharmacyName || "MediCare AI Pharmacy");
      setPhone(data?.phone || "");
      setAddress(data?.address || "");
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Name is required.");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user!.uid), {
        name,
        pharmacyName,
        phone,
        address,
      });
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSub}>Pharmacy Account</Text>
        </View>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="medkit" size={50} color="#0D9488" />
        </View>
        <Text style={styles.pharmName}>{pharmacyName}</Text>
        <Text style={styles.pharmSub}>Managed by {name}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>Pharmacy Information</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Ionicons
              name={editing ? "close" : "create-outline"}
              size={22}
              color="#0D9488"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Pharmacist Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={editing}
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        <Text style={styles.label}>Pharmacy Name</Text>
        <TextInput
          value={pharmacyName}
          onChangeText={setPharmacyName}
          editable={editing}
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          editable={editing}
          keyboardType="phone-pad"
          style={[styles.input, !editing && styles.inputDisabled]}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          editable={editing}
          multiline
          style={[
            styles.input,
            styles.textArea,
            !editing && styles.inputDisabled,
          ]}
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

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#b8e7e3", marginTop: 3 },
  avatarSection: { alignItems: "center", marginTop: 25, marginBottom: 5 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#b8e7e3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  pharmName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  pharmSub: { color: "#64748B", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 15,
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
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
    marginTop: 10,
  },
  value: { color: "#111827", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    color: "#111827",
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  inputDisabled: { backgroundColor: "#F9FAFB", color: "#6B7280" },
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
    marginHorizontal: 15,
    marginTop: 20,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "700", marginLeft: 8 },
});
