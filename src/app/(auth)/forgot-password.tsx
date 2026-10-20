import BackButton from "@/src/components/BackButton";
import { auth } from "@/src/config/firebaseConfig";
import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Email daalein.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    } catch (e: any) {
      if (e?.code === "auth/invalid-email") {
        setLoading(false);
        Alert.alert("Wrong Email", "Write Email in proper format .");
        return;
      }
      if (e?.code === "auth/too-many-requests") {
        setLoading(false);
        Alert.alert("Stop", "Too many attempt occur Try again Later.");
        return;
      }
      console.log("RESET ERROR:", e?.code);
    }
    setLoading(false);
    Alert.alert(
      "Check Your Email 📧",
      "If an account exists with this email address, a password reset link has been sent. Please also check your spam folder.",
      [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.backButton}>
        <BackButton />
      </View>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}> Enter your  registered email , We will sent  reset link .</Text>
      <TextInput placeholder="you@example.com" value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" style={styles.input} />
      <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 18, alignItems: "center" }}>
        <Text style={{ color: "#0D9488", fontWeight: "700" }}>Back to  Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#64748B", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 14, marginBottom: 16 },
  btn: { backgroundColor: "#0D9488", padding: 16, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  backButton: {
    position: "absolute",
    top: 50,
    left: 24,
  },
});