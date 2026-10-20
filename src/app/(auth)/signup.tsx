import GenderPicker from "@/src/components/GenderPicker";
import imagepath from "@/src/constraints/imagepath";
import { useAuth } from "@/src/context/AuthContext";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import { findMatchingPatientForSignup, verifyActivationCode } from "@/src/utils/patientService";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from "react-native";

export default function SignupScreen() {
  useEffect(() => {
    Alert.alert(
      "Before You Sign Up",
      "Agar aap pehle is hospital se checkup karwa chuke hain, to slip par likha Patient ID aur Activation Code neeche daalein. Isse purani history account mein aa jayegi.\n\nSlip nahi hai? Account bana lein, baad mein Profile se record link kar sakte hain.",
      [{ text: "Got It" }],
    );
  }, []);

  const { register } = useAuth();
  const busy = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [DOB, setDOB] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [hospitalPid, setHospitalPid] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const emailMismatch =
    confirmEmail.length > 0 &&
    email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase();

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !confirmEmail.trim() || !password ||
      !confirmPassword || !phone.trim() || !DOB.trim() || !gender.trim() || !age.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return false;
    }
    if (emailMismatch) {
      Alert.alert("Error", "Dono email match nahi kar rahi");
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
    if (busy.current) return;
    if (!validateForm()) return;

    const hasPid = hospitalPid.trim().length > 0;
    const hasCode = activationCode.trim().length > 0;
    if (hasPid !== hasCode) {
      Alert.alert("Incomplete", "Patient ID aur Activation Code dono daalein, ya dono khali chhor dein.");
      return;
    }

    busy.current = true;
    setLoading(true);
    try {
      let linkId: string | null = null;
      let note = "";

      if (hasPid) {
        const ok = await verifyActivationCode(hospitalPid, activationCode);
        if (!ok) {
          Alert.alert("Code Galat", "Patient ID ya Activation Code galat hai, ya pehle use ho chuka hai. Reception se naya code le sakte hain.");
          return;
        }
        linkId = hospitalPid.trim().toUpperCase();
        note = `Aap ka purana record (${linkId}) account se jur gaya hai.\n\n`;
      } else {
        const match = await findMatchingPatientForSignup(name, DOB, gender, phone);
        if (match) {
          // Popup: user decide kare
          const goBack = await new Promise<boolean>((resolve) =>
            Alert.alert(
              "Purana Record Mila 📋",
              match.linkedUserId
                ? `Is naam ka record (${match.patientId}) pehle se kisi app account se linked hai.\n\nNaya account ban sakta hai, lekin purani history nahi dikhegi.`
                : `Aap ne pehle hospital mein checkup karwaya hai (${match.patientId}).\n\nHistory chahiye to slip se Patient ID aur Activation Code daalein. Warna naya account ban jayega, aur baad mein Profile se record link kar sakte hain.`,
              [
                { text: "Code Daalta Hoon", onPress: () => resolve(true) },
                { text: "Naya Account Banao", onPress: () => resolve(false) },
              ],
              { cancelable: false },
            ),
          );
          if (goBack) return;
        }
      }

      await register(name, email, password, phone, DOB, gender, age, linkId, linkId ? activationCode.trim() : undefined);

      Alert.alert("Account Ban Gaya ✅", `${note}Verification link ${email.trim()} par bheja gaya hai. Link click karke aage barhein.`);
      router.replace("/(auth)/verify-email");
    } catch (error: any) {
      console.log("SIGNUP ERROR:", error?.code, error?.message);
      const msg =
        error?.code === "auth/email-already-in-use" ? "Is email se account pehle se hai. Login ya Forgot Password use karein."
          : error?.code === "auth/invalid-email" ? "Email sahi format mein likhein."
            : error?.message || "Something went wrong";
      Alert.alert("Signup Failed", msg);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={imagepath.background} style={styles.bg}>
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.logo}>🤖 MediCare AI</Text>
          <Text style={styles.subtitle}>Smart OPD & Pharmacy System</Text>

          <TextInput placeholder="Full Name" placeholderTextColor="#fff" value={name} onChangeText={setName} style={styles.input} />
          <TextInput placeholder="Email" placeholderTextColor="#fff" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          <TextInput placeholder="Confirm Email" placeholderTextColor="#fff" value={confirmEmail} onChangeText={setConfirmEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          {emailMismatch && (
            <Text style={{ color: "#FCA5A5", marginTop: -6, marginBottom: 10, fontSize: 12 }}>
              ❌ Dono email match nahi kar rahi
            </Text>
          )}
          <TextInput placeholder="Phone (03XX-XXXXXXX)"
            placeholderTextColor="#fff"
            value={phone} onChangeText={(t) =>
              setPhone(formatPhoneInput(t))}
            keyboardType="number-pad"
            maxLength={12}
            style={styles.input} />
          <TextInput placeholder="Date of Birth (DD-MM-YYYY)" placeholderTextColor="#fff" value={DOB} onChangeText={(t) => setDOB(formatDOBInput(t))} keyboardType="number-pad" maxLength={10} style={styles.input} />
          <GenderPicker dark value={gender} onChange={setGender} />
          <TextInput placeholder="Age" placeholderTextColor="#fff" value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.input} />
          <TextInput placeholder="Password" placeholderTextColor="#fff" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
          <TextInput placeholder="Confirm Password" placeholderTextColor="#fff" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={styles.input} />

          <Text style={{ color: "#ddd", marginTop: 6, marginBottom: 8, fontSize: 12 }}>
            Pehle hospital aaye the? Slip wali details daalein (optional)
          </Text>
          <TextInput placeholder="Patient ID (e.g. P-000012)" placeholderTextColor="#fff" value={hospitalPid} onChangeText={setHospitalPid} autoCapitalize="characters" style={styles.input} />
          <TextInput placeholder="Activation Code (6 digit)" placeholderTextColor="#fff" value={activationCode} onChangeText={setActivationCode} keyboardType="number-pad" maxLength={6} style={styles.input} />

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#0D9488" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
