import imagepath from "@/src/constraints/imagepath";
import { useAuth } from "@/src/context/AuthContext";
import { sendEmailOtp, verifyEmailOtp } from "@/src/utils/emailOtpService";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import { findMatchingPatientForSignup } from "@/src/utils/patientService";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignupScreen() {
  useEffect(() => {
    Alert.alert(
      "Before You Sign Up",
      "If you have visited this hospital before (even at the reception desk), please enter the same Name, Date of Birth, and Gender you gave earlier.\n\n" +
        "This helps us find your old record automatically — so all your past prescriptions and bills will show up in your account.\n\n" +
        "If this is your first time, just fill in your correct details below.",
      [{ text: "Got It", style: "default" }],
    );
  }, []);

  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [DOB, setDOB] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<any>(null);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const validateForm = () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !phone.trim() ||
      !DOB.trim() ||
      !gender.trim() ||
      !age.trim()
    ) {
      Alert.alert("Error", "Please fill all fields");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Purana record match hota hai ya nahi — dono case mein
      // aage email verification zaroori hai
      const match = await findMatchingPatientForSignup(
        name,
        DOB,
        gender,
        phone,
      );
      setPendingMatch(match);

      setSendingOtp(true);
      await sendEmailOtp(email);
      setSendingOtp(false);
      setLoading(false);
      setOtpVisible(true);

      Alert.alert(
        "Verification Code sent 📧",
        `6 digit otp sent on this email ${email} .`,
      );
    } catch (error: any) {
      setLoading(false);
      setSendingOtp(false);
      console.log("SIGNUP OTP ERROR:", error);
      Alert.alert("Error", error?.message || "Something went wrong.");
    }
  };

  const handleOtpVerify = async () => {
    if (!otp.trim()) {
      Alert.alert("Required", "Verification code daalein.");
      return;
    }
    setOtpLoading(true);
    try {
      const isValid = await verifyEmailOtp(email, otp);
      if (!isValid) {
        setOtpLoading(false);
        Alert.alert(
          "Verification Failed",
          "Code galat hai ya expire ho chuka hai.",
        );
        return;
      }
      setOtpVisible(false);
      await completeSignup(pendingMatch?.patientId || null);
    } catch {
      Alert.alert("Error", "Verification mein masla hua.");
    }
    setOtpLoading(false);
  };

  const resendOtp = async () => {
    setSendingOtp(true);
    try {
      await sendEmailOtp(email);
      Alert.alert("Code Dobara Bheja Gaya", `${email} check karein.`);
    } catch {
      Alert.alert("Error", "Code bhejne mein masla hua.");
    }
    setSendingOtp(false);
  };

  const completeSignup = async (existingPatientId: string | null) => {
    setLoading(true);
    try {
      await register(
        name,
        email,
        password,
        phone,
        DOB,
        gender,
        age,
        existingPatientId,
      );
      router.replace("/login");
    } catch (error: any) {
      console.log("REGISTER ERROR:", error?.code, error?.message);
      Alert.alert("Signup Failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={imagepath.background} style={styles.bg}>
      <View style={styles.overlay} />

      <View style={styles.card}>
        <Text style={styles.logo}>🤖 MediCare AI</Text>
        <Text style={styles.subtitle}>Smart OPD & Pharmacy System</Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#fff"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#fff"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Phone (03XX-XXXXXXX)"
          placeholderTextColor="#fff"
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneInput(text))}
          keyboardType="number-pad"
          maxLength={11}
          style={styles.input}
        />
        <TextInput
          placeholder="Date of Birth (DD-MM-YYYY)"
          placeholderTextColor="#fff"
          value={DOB}
          onChangeText={(text) => setDOB(formatDOBInput(text))}
          keyboardType="number-pad"
          maxLength={10}
          style={styles.input}
        />

        <TextInput
          placeholder="Gender"
          placeholderTextColor="#fff"
          value={gender}
          onChangeText={setGender}
          style={styles.input}
        />

        <TextInput
          placeholder="Age"
          placeholderTextColor="#fff"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#fff"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#fff"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading || sendingOtp}
        >
          {loading || sendingOtp ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>

        <Modal visible={otpVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.otpCard}>
              <TouchableOpacity
                style={styles.otpCloseBtn}
                onPress={() => setOtpVisible(false)}
              >
                <Text style={styles.otpCloseText}>✕</Text>
              </TouchableOpacity>

              <View style={styles.otpIconCircle}>
                <Text style={{ fontSize: 30 }}>📧</Text>
              </View>

              <Text style={styles.otpTitle}>Verify Your Email</Text>
              <Text style={styles.otpSubtitle}>
                We sent a 6-digit code to{"\n"}
                <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                  {email}
                </Text>
              </Text>

              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor="#CBD5E1"
                maxLength={6}
                style={styles.otpInput}
              />

              <TouchableOpacity
                style={styles.otpVerifyBtn}
                onPress={handleOtpVerify}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.otpVerifyText}>
                    Verify & Create Account
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={resendOtp}
                disabled={sendingOtp}
                style={{ marginTop: 16 }}
              >
                <Text style={styles.otpResendText}>
                  {sendingOtp ? "Sending..." : "Didn't get the code? Resend"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  logo: { fontSize: 30, color: "#fff", fontWeight: "700", textAlign: "center" },
  subtitle: {
    color: "#ddd",
    textAlign: "center",
    marginBottom: 25,
    marginTop: 5,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    color: "#fff",
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 12,
    marginTop: 5,
  },
  btnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  link: { color: "#ddd", textAlign: "center", marginTop: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  otpCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  otpCloseBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  otpCloseText: { color: "#64748B", fontSize: 15, fontWeight: "700" },
  otpIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  otpInput: {
    width: "100%",
    height: 58,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 10,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginBottom: 18,
  },
  otpVerifyBtn: {
    width: "100%",
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  otpVerifyText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  otpResendText: { color: "#2563EB", fontWeight: "600", fontSize: 13 },
});
