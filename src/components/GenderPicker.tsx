import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function GenderPicker({
    value, onChange, dark,
}: { value: string; onChange: (v: string) => void; dark?: boolean }) {
    return (
        <View style={s.row}>
            {["Male", "Female"].map((g) => (
                <TouchableOpacity
                    key={g}
                    onPress={() => onChange(g)}
                    style={[s.btn, dark && s.btnDark, value === g && s.active]}
                >
                    <Text style={[s.txt, dark && { color: "#fff" }, value === g && { color: "#fff" }]}>
                        {g}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    row: { flexDirection: "row", gap: 10, marginBottom: 12 },
    btn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#D1D5DB", alignItems: "center", backgroundColor: "#fff" },
    btnDark: { backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)" },
    active: { backgroundColor: "#0D9488", borderColor: "#0D9488" },
    txt: { fontWeight: "700", color: "#374151" },
});