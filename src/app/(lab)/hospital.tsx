import { getHospital, saveHospital } from "@/src/utils/labService";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function HospitalSettings() {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");

    useEffect(() => {
        getHospital()
            .then((h) => { setName(h.name || ""); setAddress(h.address || ""); setPhone(h.phone || ""); })
            .catch((e) => console.log("[hospital]", e));
    }, []);

    const save = async () => {
        if (!name.trim()) { Alert.alert("Required", "Hospital ka naam likhein."); return; }
        try {
            await saveHospital({ name: name.trim(), address: address.trim(), phone: phone.trim() });
            Alert.alert("Saved ✅", "Ab ye har lab report ke upar aayega.");
        } catch { Alert.alert("Error", "Save nahi hua. Rules (settings) publish karein."); }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#F5F3FF" }}>
            <View style={s.header}>
                <Text style={s.title}>Hospital Details</Text>
                <Text style={{ color: "#CCFBF1", marginTop: 4 }}>Report ke upar ye dikhega</Text>
            </View>
            <View style={s.card}>
                <TextInput placeholder="Hospital / Lab ka naam" value={name} onChangeText={setName} style={s.input} />
                <TextInput placeholder="Address" value={address} onChangeText={setAddress} style={s.input} />
                <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={s.input} />
                <TouchableOpacity style={s.btn} onPress={save}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    header: { backgroundColor: "#0D9488", paddingTop: 60, paddingBottom: 22, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    title: { color: "#fff", fontSize: 22, fontWeight: "800" },
    card: { backgroundColor: "#fff", margin: 15, borderRadius: 15, padding: 15, elevation: 3 },
    input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10 },
    btn: { backgroundColor: "#0D9488", height: 50, borderRadius: 10, justifyContent: "center", alignItems: "center" },
});