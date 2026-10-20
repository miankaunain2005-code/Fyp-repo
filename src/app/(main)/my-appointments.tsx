import SlipPopup from "@/src/components/SlipPopup";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const pad = (n: number) => String(n).padStart(2, "0");

const searchText = (r: any) => {
  let dates = r.date || "";
  if (r.createdAt?.seconds) {
    const d = new Date(r.createdAt.seconds * 1000);
    dates += ` ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return [r.name, r.patientId, r.doctorName, r.token, r.status, dates]
    .join(" ")
    .toLowerCase();
};

export default function MyAppointments() {
  const { user, profile } = useAuth();

  const [byUser, setByUser] = useState<any[]>([]);
  const [byPatient, setByPatient] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"mine" | "others">("mine");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
    );
    const unsub = onSnapshot(
      q,
      (s) => {
        setByUser(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.log("[appt-byUser]", e.code);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!profile?.patientId) return;
    const q = query(
      collection(db, "appointments"),
      where("patientId", "==", profile.patientId),
    );
    const unsub = onSnapshot(
      q,
      (s) => setByPatient(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.log("[appt-byPatient]", e.code),
    );
    return () => unsub();
  }, [profile?.patientId]);

  const all = useMemo(() => {
    const m = new Map<string, any>();
    [...byUser, ...byPatient].forEach((r) => m.set(r.id, r));
    return Array.from(m.values()).sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
  }, [byUser, byPatient]);

  const pid = profile?.patientId;
  const mine = all.filter((r) => pid && r.patientId === pid);
  const others = all.filter((r) => !pid || r.patientId !== pid);

  const term = search.trim().toLowerCase().replace(/\//g, "-");
  const list = (scope === "mine" ? mine : others).filter(
    (r) => !term || searchText(r).includes(term),
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>My Appointments</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.tab, scope === "mine" && styles.tabActive]}
          onPress={() => setScope("mine")}
        >
          <Text
            style={[styles.tabText, scope === "mine" && styles.tabTextActive]}
          >
            Myself ({mine.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, scope === "others" && styles.tabActive]}
          onPress={() => setScope("others")}
        >
          <Text
            style={[styles.tabText, scope === "others" && styles.tabTextActive]}
          >
            Someone Else ({others.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Name, Patient ID, Doctor ya Date (06-10-2026)"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0D9488"
          style={{ marginTop: 40 }}
        />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>
          {term ? "Match didnot fount." : "Appoinments not booked yet ."}
        </Text>
      ) : (
        list.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => {
              setSelected(item);
              setVisible(true);
            }}
          >
            <View style={styles.rowTop}>
              <Text style={styles.name}>{item.name}</Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.status === "Completed" ? "#DCFCE7" : "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.status === "Completed" ? "#16A34A" : "#D97706",
                    fontWeight: "700",
                    fontSize: 11,
                  }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.info}>Patient ID: {item.patientId}</Text>
            <Text style={styles.info}>Token: {item.token}</Text>
            <Text style={styles.info}>Doctor: {item.doctorName}</Text>
            <Text style={styles.date}>
              {item.date} • {item.time}
            </Text>
          </TouchableOpacity>
        ))
      )}

      <SlipPopup
        visible={visible}
        data={selected}
        onClose={() => setVisible(false)}
      />
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 60,
    marginHorizontal: 15,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 15,
    marginTop: 16,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabActive: { backgroundColor: "#0D9488" },
  tabText: { color: "#64748B", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  searchBox: {
    marginHorizontal: 15,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: "#111827" },
  empty: { textAlign: "center", color: "#94A3B8", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  name: { fontSize: 17, fontWeight: "800", color: "#0F172A", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  info: { color: "#64748B", marginTop: 2, fontSize: 13 },
  date: { color: "#94A3B8", marginTop: 8, fontSize: 12 },
});
