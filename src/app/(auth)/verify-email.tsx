import { auth } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function VerifyEmail() {
    const { user, logout } = useAuth();
    const [checking, setChecking] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const check = async (silent = false) => {
        try {
            await auth.currentUser?.reload();
            if (auth.currentUser?.emailVerified) {
                router.replace("/(main)");
                return;
            }
            if (!silent) Alert.alert("Abhi Verify Nahi", "Email ka link click karein, phir dobara try karein.");
        } catch (e) {
            console.log(e);
        }
    };

    useEffect(() => {
        const t = setInterval(() => check(true), 4000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const resend = async () => {
        try {
            if (!auth.currentUser) return;
            await sendEmailVerification(auth.currentUser);
            setCooldown(60);
            Alert.alert("Bhej Diya", "Spam folder bhi check karein.");
        } catch {
            Alert.alert("Ruk Jayein", "Bohat zyada requests. Thori der baad try karein.");
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    return (
        <View style={s.container}>
            <Text style={{ fontSize: 56 }}>📧</Text>
            <Text style={s.title}>Email Verify Karein</Text>
            <Text style={s.sub}>
                Humne verification link bheja hai:{"\n"}
                <Text style={{ fontWeight: "800", color: "#0F172A" }}>{user?.email}</Text>
                {"\n\n"}Link click karein, app khud aage barh jayegi.
            </Text>

            <TouchableOpacity
                style={s.btn}
                onPress={async () => { setChecking(true); await check(); setChecking(false); }}
            >
                {checking ? <ActivityIndicator color="#0D9488" /> : <Text style={s.btnText}>Maine Verify Kar Liya</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={resend} disabled={cooldown > 0} style={{ marginTop: 18 }}>
                <Text style={[s.link, cooldown > 0 && { color: "#94A3B8" }]}>
                    {cooldown > 0 ? `Dobara bhejein (${cooldown}s)` : "Link dobara bhejein"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={{ marginTop: 22 }}>
                <Text style={{ color: "#DC2626", fontWeight: "700" }}>Logout / Galat email</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 28, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginTop: 14 },
    sub: { textAlign: "center", color: "#64748B", marginTop: 12, lineHeight: 22 },
    btn: { backgroundColor: "#0D9488", paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, marginTop: 28, minWidth: 240, alignItems: "center" },
    btnText: { color: "#fff", fontWeight: "700" },
    link: { color: "#0D9488", fontWeight: "700" },
}); 