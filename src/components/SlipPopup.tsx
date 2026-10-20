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

          {data?.activationCode ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>App Activation Code</Text>
              <Text style={styles.codeValue}>{data.activationCode}</Text>
              <Text style={styles.codeHint}>
                App par signup karte waqt Patient ID aur ye code daalein. Purani
                history mil jayegi. Code kisi ko na batayein.
              </Text>
            </View>
          ) : null}

          <Text style={styles.symptoms}>Symptoms: {data?.symptoms || "-"}</Text>

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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  token: { fontSize: 18, fontWeight: "700", color: "#2563EB" },
  patientId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 6,
    marginBottom: 6,
  },
  symptoms: { marginTop: 10 },
  time: { marginTop: 10, color: "#555" },
  btn: {
    marginTop: 15,
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  codeBox: {
    marginTop: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  codeLabel: { color: "#065F46", fontWeight: "700", fontSize: 12 },
  codeValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 6,
    color: "#047857",
    marginVertical: 4,
  },
  codeHint: { color: "#065F46", fontSize: 11, textAlign: "center" },
});
