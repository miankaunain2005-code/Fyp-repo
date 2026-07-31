import imagepath from "@/src/constraints/imagepath";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import React, { useState } from "react";
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

export default function SignupScreen() {
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (
            !name.trim() ||
            !email.trim() ||
            !password.trim() ||
            !confirmPassword.trim()
        ) {
            Alert.alert("Error", "Please fill all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            await register(
                name,
                email,
                password
            );
            router.replace("/login");
        } catch (error: any) {
            console.log("REGISTER ERROR:", error?.code);
            console.log("REGISTER MESSAGE:", error?.message);

            Alert.alert(
                "Signup Failed",
                error?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground source={imagepath.background} style={styles.bg}>
            <View style={styles.overlay} />

            <View style={styles.card}>
                <Text style={styles.logo}>🤖 MediCare AI</Text>

                <Text style={styles.subtitle}>
                    Smart OPD & Pharmacy System
                </Text>

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
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>
                            Create Account
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push("/login")}
                >
                    <Text style={styles.link}>
                        Already have an account? Login
                    </Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        justifyContent: "center",
    },

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

    logo: {
        fontSize: 30,
        color: "#fff",
        fontWeight: "700",
        textAlign: "center",
    },

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

    link: {
        color: "#ddd",
        textAlign: "center",
        marginTop: 18,
    },
});
