import imagepath from "@/src/constraints/imagepath";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
    const { login, role } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!role) return;

        if (role === "patient") {
            router.replace("/(main)");
        } else if (role === "doctor") {
            router.replace("/(doctor)");
        }
        else if (role === "pharmacy") {
            router.replace("/(pharmacy)");
        }

    }, [role]);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert("Login Failed", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground source={imagepath.background} style={styles.bg}>
            <View style={styles.overlay} />

            <Text style={styles.logo}>🤖 MediCare AI</Text>
            <Text style={styles.subtitle}>Smart OPD & Pharmacy System</Text>

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
                placeholder="Password"
                placeholderTextColor="#fff"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={styles.link}>New user? Create account</Text>
            </TouchableOpacity>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1, justifyContent: "center" },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
    logo: { fontSize: 28, color: "white", fontWeight: "bold", textAlign: "center" },
    subtitle: { color: "#ddd", textAlign: "center", marginBottom: 20 },
    input: { backgroundColor: "rgba(255,255,255,0.15)", padding: 12, borderRadius: 12, marginBottom: 10, color: "white", marginHorizontal: 20 },
    button: { backgroundColor: "#4CAF50", padding: 14, borderRadius: 12, marginTop: 10, marginHorizontal: 20 },
    btnText: { textAlign: "center", color: "white", fontWeight: "bold" },
    link: { color: "#ccc", textAlign: "center", marginTop: 15 },
});