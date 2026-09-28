import { db } from "@/src/config/firebaseConfig";
import { sendEmailOtp, verifyEmailOtp } from "@/src/utils/emailOtpService";
import { triggerPasswordReset } from "@/src/utils/forgotPasswordService";
import { router } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);

  const checkAccountExists = async (value: string) => {
    const q = query(
      collection(db, "users"),
      where("email", "==", value.trim().toLowerCase()),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const sendOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Email daalein.");
      return;
    }
    setLoading(true);
    try {
      const exists = await checkAccountExists(email);
      if (!exists) {
        setLoading(false);
        Alert.alert("Not Found", "Account not registerd on this email.");
        return;
      }
      await sendEmailOtp(email);
      setStep("otp");
    } catch {
      Alert.alert("Error", "Code fetching wrong.");
    }
    setLoading(false);
  };

  const verifyAndReset = async () => {
    setLoading(true);
    try {
      const isValid = await verifyEmailOtp(email, otp);
      if (!isValid) {
        setLoading(false);
        Alert.alert(
          "Verification Failed",
          "Code galat hai ya expire ho chuka hai.",
        );
        return;
      }
      await triggerPasswordReset(email);
      Alert.alert(
        "Reset Link Bhej Diya ✅",
        `Aapke email (${email}) par password reset link bhej diya gaya hai.`,
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }],
      );
    } catch {
      Alert.alert("Error", "Kuch masla hua.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      {step === "email" ? (
        <>
          <Text style={styles.subtitle}>Apna registered email daalein</Text>
          <TextInput
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.btn}
            onPress={sendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Send Code</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            {email} par bheja gaya code daalein
          </Text>
          <TextInput
            placeholder="6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.btn}
            onPress={verifyAndReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Verify & Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#64748B", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
