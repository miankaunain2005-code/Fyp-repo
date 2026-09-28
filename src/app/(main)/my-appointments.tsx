import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import SlipPopup from "@/src/components/SlipPopup";

export default function MyAppointments() {
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
    );
    //.map method ya alg alg card bnta distinguidh krta h or sb aik br chlta phr nxt k lia
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setList(data);
    });

    return () => unsub();
  }, [user]);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>My Appointments</Text>

      {list.length === 0 && (
        <Text style={{ marginTop: 20, color: "gray" }}>
          No appointments yet
        </Text>
      )}

      {list.map((item, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            setSelected(item);
            setVisible(true);
          }}
          style={{
            backgroundColor: "#fff",
            padding: 15,
            marginTop: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#2c20d6", fontSize: 16, fontWeight: "bold" }}>
            Token: {item.token}
          </Text>
          <Text style={{ color: "#249d30", fontSize: 16, fontWeight: "bold" }}>
            Patient ID: {item.patientId}
          </Text>
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
            Doctor: {item.doctorName}
          </Text>
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
            Name: {item.name}
          </Text>
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
            Date: {item.date}
          </Text>
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
            Status: {item.status}
          </Text>
        </TouchableOpacity>
      ))}

      {/* POPUP */}
      <SlipPopup
        visible={visible}
        data={selected}
        onClose={() => setVisible(false)}
      />
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}
