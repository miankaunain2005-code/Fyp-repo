import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PrescriptionHistory() {
  const { user, loading: authLoading, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>(""); // 👈 TEMPORARY DEBUG

  useEffect(() => {
    // 👇 TEMPORARY DEBUG LOG — batayega ke restart ke waqt
    // user object kab available hota hai
    console.log("=== PRESCRIPTION HISTORY DEBUG ===");
    console.log("authLoading:", authLoading);
    console.log("user:", user);
    console.log("user?.uid:", user?.uid);

    if (!user) {
      setDebugInfo(`User null hai abhi. authLoading = ${authLoading}`);
      // 👇 FIX: pehle yahan setLoading(false) nahi hota tha
      // agar user hamesha ke liye null reh jaye (auth fail ho)
      // to spinner hamesha chalta rehta. Ab agar authLoading
      // false ho chuki hai aur user phir bhi null hai, loading band karo.
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    setDebugInfo(`Querying prescriptions where userId == ${user.uid}`);

    const q = query(
      collection(db, "prescriptions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"), //order by use krny k lia hmye data base ma  index create krna prta hm isy sort method sy b krtskty
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        console.log("Snapshot received. Doc count:", snapshot.docs.length);

        const data = snapshot.docs.map((doc) => {
          console.log("Doc data:", doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
          };
        });

        setList(data);
        setLoading(false);
        setDebugInfo(
          `Found ${data.length} prescription(s) for uid: ${user.uid}`,
        );
      },
      (error) => {
        // 👇 Yeh sabse zaroori hai — agar permission-denied ya
        // index-missing error aata hai to yahan dikhega
        console.log("=== FIRESTORE QUERY ERROR ===");
        console.log(error);
        setDebugInfo(`ERROR: ${error.message}`);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user, authLoading]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />

        <Text style={styles.loadingText}>Loading Prescription History...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={45} color="#fff" />

        <Text style={styles.title}>Prescription History</Text>

        <Text style={styles.subtitle}>
          View all your previous prescriptions
        </Text>
      </View>

      {/* 👇 TEMPORARY DEBUG BOX — screen pe hi dikhega, delete kar dena baad mein
      <View style={styles.debugBox}>
        <Text style={styles.debugText}>DEBUG: {debugInfo}</Text>
        <Text style={styles.debugText}>Current uid: {user?.uid || "NULL"}</Text>
      </View> */}

      {list.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-outline" size={70} color="#94A3B8" />

          <Text style={styles.emptyTitle}>No Prescription Found</Text>

          <Text style={styles.emptySubTitle}>
            Your prescriptions will appear here after doctor consultation.
          </Text>
        </View>
      ) : (
        list.map((item: any) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.patientName}>👤 {item.patientName}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Patient ID</Text>

              <Text style={styles.value}>{item.patientId}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Doctor</Text>

              <Text style={styles.value}>{item.doctorName}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Date</Text>

              <Text style={styles.value}>{item.date}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Time</Text>

              <Text style={styles.value}>{item.time}</Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({
                  pathname: "/(main)/prescription-details",
                  params: {
                    prescriptionId: item.id,
                  },
                })
              }
            >
              <Ionicons name="eye" size={20} color="#fff" />

              <Text style={styles.buttonText}>View Prescription</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },

  header: {
    backgroundColor: "#2563EB",
    paddingTop: 55,
    paddingBottom: 30,
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 10,
  },

  subtitle: {
    color: "#E5E7EB",
    fontSize: 15,
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  debugBox: {
    backgroundColor: "#FEF3C7",
    margin: 15,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },

  debugText: {
    color: "#92400E",
    fontSize: 11,
    fontFamily: "monospace",
  },

  emptyCard: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    elevation: 4,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  emptySubTitle: {
    marginTop: 10,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 18,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  cardHeader: {
    marginBottom: 18,
  },

  patientName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    marginRight: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  label: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },

  value: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
    textAlign: "right",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
