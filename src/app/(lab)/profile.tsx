import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { formatPhoneInput, normalizeDigits } from "@/src/utils/inputFormatters";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function LabProfile() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        (async () => {
            try {
                if (!user) return;
                const d = (await getDoc(doc(db, "users", user.uid))).data();
                setName(d?.name || "");
                setPhone(d?.phone || "");
            } catch (e) { console.log(e); }
            setLoading(false);
        })();
    }, [user]);

    const save = async () => {
        if (!name.trim()) { Alert.alert("Required", "Name zaroori hai."); return; }
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user!.uid), { name: name.trim(), phone: normalizeDigits(phone) });
            setEditing(false);
            Alert.alert("Saved", "Profile update ho gayi.");
        } catch { Alert.alert("Error", "Update nahi hui."); }
        setSaving(false);
    };

    const handleLogout = () =>
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/login"); } },
        ]);

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0D9488" /></View>;

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>My Profile</Text>
            </View>
            <View style={s.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={s.h}>Lab Technician</Text>
                    <TouchableOpacity onPress={() => setEditing(!editing)}>
                        <Ionicons name={editing ? "close" : "create-outline"} size={22} color="#0D9488" />
                    </TouchableOpacity>
                </View>
                <Text style={s.label}>Full Name</Text>
                <TextInput value={name} onChangeText={setName} editable={editing} style={[s.input, !editing && s.dis]} />
                <Text style={s.label}>Phone</Text>
                <TextInput value={phone} onChangeText={(t) => setPhone(formatPhoneInput(t))} editable={editing}
                    keyboardType="number-pad" maxLength={12} style={[s.input, !editing && s.dis]} />
                <Text style={s.label}>Email</Text>
                <Text style={{ fontWeight: "700" }}>{user?.email}</Text>
                {editing && (
                    <TouchableOpacity style={s.btn} onPress={save} disabled={saving}>
                        {saving ? <ActivityIndicator color="#0D9488" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>}
                    </TouchableOpacity>
                )}
            </View>
            <TouchableOpacity style={s.logout} onPress={handleLogout}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 14 },
    card: { backgroundColor: "#fff", margin: 15, borderRadius: 15, padding: 16, elevation: 3 },
    h: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
    label: { color: "#6B7280", fontSize: 13, fontWeight: "600", marginTop: 10, marginBottom: 5 },
    input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12 },
    dis: { backgroundColor: "#F9FAFB", color: "#6B7280" },
    btn: { backgroundColor: "#0D9488", height: 48, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 16 },
    logout: { backgroundColor: "#EF4444", marginHorizontal: 15, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});