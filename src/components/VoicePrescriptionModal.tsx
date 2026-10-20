import { useVoiceDictation } from "@/src/hooks/useVoiceDictation";
import { InventoryMedicine } from "@/src/utils/medicineMatch";
import { ParsedMedicine, ParsedVoice, parseVoice } from "@/src/utils/voiceParser";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    inventory: InventoryMedicine[];
    onConfirm: (data: ParsedVoice) => void;
};

export default function VoicePrescriptionModal({ visible, onClose, inventory, onConfirm }: Props) {
    const [lang, setLang] = useState("en-US");
    const [step, setStep] = useState<"record" | "review">("record");
    const [symptoms, setSymptoms] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [meds, setMeds] = useState<ParsedMedicine[]>([]);

    const v = useVoiceDictation(lang);

    const close = () => {
        v.abort();
        setStep("record");
        v.setText("");
        onClose();
    };

    const process = () => {
        v.stop();
        const full = (v.text + " " + v.interim).trim();
        if (!full) {
            Alert.alert("Kuch nahi bola", "Pehle bolein ya text likhein.");
            return;
        }
        const p = parseVoice(full, inventory);
        setSymptoms(p.symptoms);
        setDiagnosis(p.diagnosis);
        setNotes(p.notes);
        setMeds(p.medicines);
        setStep("review");
    };

    const editMed = (i: number, patch: Partial<ParsedMedicine>) =>
        setMeds((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));

    const confirm = () => {
        if (meds.some((m) => !m.medicineName.trim())) {
            Alert.alert("Naam zaroori", "Har dawai ka naam likhein ya us card ko hata dein.");
            return;
        }
        onConfirm({ symptoms, diagnosis, notes, medicines: meds });
        close();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={close}>
            <View style={s.screen}>
                <View style={s.header}>
                    <TouchableOpacity style={s.closeBtn} onPress={close}>
                        <Ionicons name="close" size={22} color="#334155" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={s.title}>🎙 Voice Prescription</Text>
                        <Text style={s.sub}>{step === "record" ? "Bolein, phir Process dabayein" : "Check karein, phir Confirm"}</Text>
                    </View>
                </View>

                {step === "record" ? (
                    <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
                        <View style={s.langRow}>
                            {[["en-US", "English"], ["en-IN", "English (India)"]].map(([code, label]) => (
                                <TouchableOpacity key={code} onPress={() => setLang(code)}
                                    style={[s.langBtn, lang === code && s.langOn]} disabled={v.listening}>
                                    <Text style={[s.langT, lang === code && { color: "#fff" }]}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={s.tip}>
                            <Text style={{ fontWeight: "800", color: "#1E40AF" }}>Is tarah bolein</Text>
                            <Text style={s.tipT}>
                                Symptoms fever and sore throat. Diagnosis viral infection. Medicines Panadol 500 mg morning afternoon night 5 days after meal. Next Augmentin 625 twice a day 7 days.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[s.mic, v.listening && { backgroundColor: "#DC2626" }]}
                            onPress={v.listening ? v.stop : v.start}
                        >
                            <Ionicons name={v.listening ? "stop" : "mic"} size={30} color="#fff" />
                            <Text style={s.micT}>{v.listening ? "Stop" : "Start Recording"}</Text>
                        </TouchableOpacity>

                        {!!v.error && <Text style={s.err}>{v.error}</Text>}

                        <Text style={s.label}>Text (edit kar sakte hain)</Text>
                        <TextInput
                            value={v.text}
                            onChangeText={v.setText}
                            multiline
                            placeholder="Yahan aap ki awaaz ka text aayega..."
                            style={s.box}
                        />
                        {!!v.interim && <Text style={s.interim}>{v.interim}</Text>}

                        <TouchableOpacity style={s.primary} onPress={process}>
                            <Text style={s.primaryT}>Process Karein</Text>
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
                        <Text style={s.label}>Symptoms</Text>
                        <TextInput value={symptoms} onChangeText={setSymptoms} multiline style={s.box} />
                        <Text style={s.label}>Diagnosis</Text>
                        <TextInput value={diagnosis} onChangeText={setDiagnosis} multiline style={s.box} />
                        <Text style={s.label}>Clinical Notes</Text>
                        <TextInput value={notes} onChangeText={setNotes} multiline style={s.box} />

                        <Text style={[s.label, { marginTop: 14 }]}>Medicines ({meds.length})</Text>
                        {meds.length === 0 && <Text style={s.mut}>Koi dawai nahi mili. Medicines keyword ke baad bolein.</Text>}

                        {meds.map((m, i) => (
                            <View key={i} style={s.card}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <TextInput value={m.medicineName} onChangeText={(t) => editMed(i, { medicineName: t, matched: false })}
                                        placeholder="Dawai ka naam" style={[s.in, { flex: 1, fontWeight: "800" }]} />
                                    <TouchableOpacity onPress={() => setMeds((p) => p.filter((_, j) => j !== i))} style={{ marginLeft: 10 }}>
                                        <Ionicons name="trash-outline" size={22} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>

                                {m.matched && (m.stock ?? 0) > 0 && <Text style={s.ok}>✅ Inventory mein hai (stock {m.stock})</Text>}
                                {m.issues.map((x, k) => <Text key={k} style={s.warn}>⚠ {x}</Text>)}

                                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                                    <TextInput value={m.dosage} onChangeText={(t) => editMed(i, { dosage: t })} placeholder="Dose (500 mg)" style={[s.in, { flex: 1 }]} />
                                    <TextInput value={m.quantity} onChangeText={(t) => editMed(i, { quantity: t })} placeholder="Qty (1 Tablet)" style={[s.in, { flex: 1 }]} />
                                </View>
                                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                                    <TextInput value={m.duration} onChangeText={(t) => editMed(i, { duration: t })} placeholder="Din (5 Days)" style={[s.in, { flex: 1 }]} />
                                    <TextInput value={m.instructions} onChangeText={(t) => editMed(i, { instructions: t })} placeholder="Hidayat" style={[s.in, { flex: 1 }]} />
                                </View>

                                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                                    {([["morning", "🌞 Morning"], ["afternoon", "☀ Afternoon"], ["night", "🌙 Night"]] as const).map(([k, label]) => (
                                        <TouchableOpacity key={k} onPress={() => editMed(i, { [k]: !m[k] } as any)}
                                            style={[s.tm, m[k] && s.tmOn]}>
                                            <Text style={[s.tmT, m[k] && { color: "#fff" }]}>{label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={s.primary} onPress={confirm}>
                            <Text style={s.primaryT}>✅ Confirm aur Form Mein Bharein</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep("record")} style={{ alignItems: "center", padding: 14 }}>
                            <Text style={{ color: "#64748B", fontWeight: "700" }}>← Wapas (dobara bolein)</Text>
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F8FAFC" },
    header: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingTop: 48, paddingBottom: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
    closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center", marginRight: 12 },
    title: { fontSize: 19, fontWeight: "800", color: "#0F172A" },
    sub: { color: "#64748B", fontSize: 12, marginTop: 3 },
    langRow: { flexDirection: "row", gap: 8 },
    langBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", backgroundColor: "#fff" },
    langOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
    langT: { fontWeight: "700", color: "#334155", fontSize: 13 },
    tip: { backgroundColor: "#EFF6FF", borderRadius: 12, padding: 12, marginTop: 14 },
    tipT: { color: "#334155", marginTop: 6, lineHeight: 20, fontSize: 13 },
    mic: { backgroundColor: "#2563EB", borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 16 },
    micT: { color: "#fff", fontWeight: "800", marginTop: 6 },
    err: { color: "#DC2626", marginTop: 10, fontSize: 12 },
    label: { color: "#334155", fontWeight: "800", marginTop: 16, marginBottom: 6 },
    box: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, padding: 12, minHeight: 70, textAlignVertical: "top" },
    interim: { color: "#94A3B8", marginTop: 6, fontStyle: "italic" },
    primary: { backgroundColor: "#16A34A", borderRadius: 12, height: 52, justifyContent: "center", alignItems: "center", marginTop: 20 },
    primaryT: { color: "#fff", fontWeight: "800", fontSize: 15 },
    mut: { color: "#94A3B8" },
    card: { backgroundColor: "#fff", borderRadius: 14, padding: 12, marginTop: 10, borderWidth: 1, borderColor: "#E2E8F0" },
    in: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: "#fff" },
    ok: { color: "#16A34A", fontSize: 12, marginTop: 6, fontWeight: "700" },
    warn: { color: "#B45309", fontSize: 12, marginTop: 4 },
    tm: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center" },
    tmOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
    tmT: { fontSize: 12, fontWeight: "700", color: "#334155" },
});