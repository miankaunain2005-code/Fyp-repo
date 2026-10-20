import GenderPicker from "@/src/components/GenderPicker";
import { useAuth } from "@/src/context/AuthContext";
import { formatDOBInput, formatPhoneInput } from "@/src/utils/inputFormatters";
import { createLabOrder, getLabTests, orderTotal, toOrderTest } from "@/src/utils/labService";
import { createActivationCode, createPatient, findPatient, generatePatientId } from "@/src/utils/patientService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";

const askExisting = (p: any) =>
    new Promise<"cancel" | "ok" | "okCode">((resolve) => {
        const linked = !!p.linkedUserId;
        const buttons: any[] = [
            { text: "Wapas", style: "cancel", onPress: () => resolve("cancel") },
            { text: "Isi mein order", onPress: () => resolve("ok") },
        ];
        if (!linked) buttons.push({ text: "Order + Naya Code", onPress: () => resolve("okCode") });
        Alert.alert(
            "Patient Pehle Se Registered ✅",
            `Name: ${p.name}\nPatient ID: ${p.patientId}\nApp Account: ${linked ? "Haan" : "Nahi"}`,
            buttons, { cancelable: false },
        );
    });

export default function NewLabOrder() {
    const { user, profile } = useAuth();
    const busy = useRef(false);

    const [name, setName] = useState("");
    const [DOB, setDOB] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [age, setAge] = useState("");
    const [notes, setNotes] = useState("");
    const [paid, setPaid] = useState(false);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [picked, setPicked] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [slip, setSlip] = useState<any>(null);

    useEffect(() => { getLabTests().then(setCatalog).catch(console.log); }, []);

    const tests = catalog.filter((t) => picked.includes(t.id)).map(toOrderTest);
    const total = orderTotal(tests);

    const submit = async () => {
        if (busy.current) return;
        if (!name.trim() || !DOB.trim() || !phone.trim() || !gender || !age.trim()) {
            Alert.alert("Required", "Patient ki saari details bharein.");
            return;
        }
        if (tests.length === 0) {
            Alert.alert("Required", "Kam az kam ek test chunein.");
            return;
        }
        busy.current = true;
        setSaving(true);
        try {
            const existing = await findPatient(phone, name, gender, DOB);
            let patientId = "";
            let linkedUserId = "";
            let code: string | null = null;

            if (existing) {
                const c = await askExisting(existing);
                if (c === "cancel") return;
                patientId = existing.patientId;
                linkedUserId = existing.linkedUserId || "";
                if (c === "okCode" && !linkedUserId) code = await createActivationCode(patientId);
            } else {
                patientId = await generatePatientId();
                await createPatient({ patientId, name, phone, gender, DOB, age });
                code = await createActivationCode(patientId);
            }

            const res = await createLabOrder({
                patientId, userId: linkedUserId, patientName: name.trim(), phone, DOB, gender, age,
                doctorId: "", doctorName: "", source: "walkin", requestedNotes: notes,
                tests, total, paid, status: "Requested", remarks: "",
                technicianId: user?.uid || "", technicianName: profile?.name || "Lab",
            });

            setSlip({ orderNo: res.orderNo, patientId, name: name.trim(), tests, total, paid, code });
        } catch (e) {
            console.log(e);
            Alert.alert("Error", "Order nahi ban saka.");
        } finally {
            busy.current = false;
            setSaving(false);
        }
    };

    const closeSlip = () => { setSlip(null); router.back(); };

    return (
        <ScrollView style={s.c} showsVerticalScrollIndicator={false}>
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={s.title}>New Lab Order</Text>
            </View>

            <View style={s.card}>
                <Text style={s.h}>👤 Patient</Text>
                <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={s.input} />
                <TextInput placeholder="DD-MM-YYYY" value={DOB} onChangeText={(t) => setDOB(formatDOBInput(t))} keyboardType="number-pad" maxLength={10} style={s.input} />
                <TextInput placeholder="03XX-XXXXXXX" value={phone} onChangeText={(t) => setPhone(formatPhoneInput(t))} keyboardType="number-pad" maxLength={12} style={s.input} />
                <GenderPicker value={gender} onChange={setGender} />
                <TextInput placeholder="Age" value={age} onChangeText={setAge} keyboardType="number-pad" style={s.input} />
            </View>

            <View style={s.card}>
                <Text style={s.h}>🧪 Tests</Text>
                {catalog.length === 0 && (
                    <Text style={{ color: "#DC2626" }}>Catalog khali hai. Dashboard → Test Catalog se default tests load karein.</Text>
                )}
                {catalog.map((t) => {
                    const on = picked.includes(t.id);
                    return (
                        <TouchableOpacity key={t.id} onPress={() => setPicked((p) => on ? p.filter((x) => x !== t.id) : [...p, t.id])}
                            style={[s.test, on && s.testOn]}>
                            <Ionicons name={on ? "checkbox" : "square-outline"} size={22} color={on ? "#0D9488" : "#94A3B8"} />
                            <Text style={{ flex: 1, marginLeft: 10, fontWeight: "600" }}>{t.name}</Text>
                            <Text style={{ fontWeight: "700" }}>Rs {t.price}</Text>
                        </TouchableOpacity>
                    );
                })}
                <TextInput placeholder="Notes / doctor ki prescription (optional)" value={notes}
                    onChangeText={setNotes} multiline style={[s.input, { minHeight: 70, textAlignVertical: "top", marginTop: 10 }]} />
            </View>

            <View style={s.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={s.h}>Total: Rs {total}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ marginRight: 8 }}>Paid</Text>
                        <Switch value={paid} onValueChange={setPaid} />
                    </View>
                </View>
            </View>

            <TouchableOpacity style={s.btn} onPress={submit} disabled={saving}>
                {saving ? <ActivityIndicator color="#0D9488" /> : <Text style={s.btnT}>Order Banayein & Slip</Text>}
            </TouchableOpacity>

            <Modal visible={!!slip} transparent animationType="slide">
                <View style={s.overlay}>
                    <View style={s.slip}>
                        <Text style={{ fontSize: 22, fontWeight: "800" }}>🧪 LAB SLIP</Text>
                        <Text style={s.orderNo}>{slip?.orderNo}</Text>
                        <Text style={{ color: "#16A34A", fontWeight: "700", marginTop: 4 }}>Patient ID: {slip?.patientId}</Text>
                        <Text>Name: {slip?.name}</Text>
                        {(slip?.tests || []).map((t: any, i: number) => (
                            <Text key={i} style={{ marginTop: 3 }}>• {t.name} — Rs {t.price}</Text>
                        ))}
                        <Text style={{ fontWeight: "800", marginTop: 8 }}>Total: Rs {slip?.total} {slip?.paid ? "(Paid)" : "(Unpaid)"}</Text>
                        {slip?.code && (
                            <View style={s.codeBox}>
                                <Text style={{ color: "#065F46", fontWeight: "700", fontSize: 12 }}>App Activation Code</Text>
                                <Text style={s.code}>{slip.code}</Text>
                                <Text style={{ color: "#065F46", fontSize: 11, textAlign: "center" }}>
                                    App par signup mein Patient ID aur ye code daalein. Lab reports app mein aa jayengi.
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity style={s.btn} onPress={closeSlip}>
                            <Text style={s.btnT}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    c: { flex: 1, backgroundColor: "#F5F3FF" },
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 14 },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 15, elevation: 3 },
    h: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
    input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
    test: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 8 },
    testOn: { borderColor: "#0D9488", backgroundColor: "#F5F3FF" },
    btn: { backgroundColor: "#0D9488", marginHorizontal: 15, marginTop: 18, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    btnT: { color: "#fff", fontWeight: "700", fontSize: 16 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    slip: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
    orderNo: { fontSize: 20, fontWeight: "800", color: "#0D9488", marginTop: 4 },
    codeBox: { marginTop: 12, backgroundColor: "#ECFDF5", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#A7F3D0" },
    code: { fontSize: 28, fontWeight: "800", letterSpacing: 6, color: "#047857", marginVertical: 4 },
});