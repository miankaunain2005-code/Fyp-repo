import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SlipPopup({ visible, data, onClose }: any) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>🏥 OPD SLIP</Text>

                    <Text style={styles.token}>Token: {data?.token}</Text>

                    <Text style={styles.patientId}>Patient ID: {data?.patientId}</Text>

                    <Text>Name: {data?.name}</Text>
                    <Text>Age: {data?.age}</Text>
                    <Text>DOB: {data?.DOB}</Text>
                    <Text>Gender: {data?.gender}</Text>
                    <Text>Phone: {data?.phone}</Text>
                    <Text>Doctor: {data?.doctorName}</Text>

                    <Text style={styles.symptoms}>
                        Symptoms: {data?.symptoms || "-"}
                    </Text>

                    <Text style={styles.time}>
                        📅 {data?.date} | 🕒 {data?.time}
                    </Text>

                    <TouchableOpacity style={styles.btn} onPress={onClose}>
                        <Text style={{ color: "#fff" }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    card: { width: "85%", backgroundColor: "#fff", padding: 20, borderRadius: 20 },
    title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
    token: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
    patientId: { fontSize: 16, fontWeight: "700", color: "#16A34A", marginTop: 6, marginBottom: 6 },
    symptoms: { marginTop: 10 },
    time: { marginTop: 10, color: "#555" },
    btn: { marginTop: 15, backgroundColor: "#2563EB", padding: 12, borderRadius: 10, alignItems: "center" },
});