import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  let dates = "";
  if (r.createdAt?.seconds) {
    const d = new Date(r.createdAt.seconds * 1000);
    dates = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  const meds = (r.items || r.tests || [])
    .map((i: any) => i.selectedName || i.name)
    .join(" ");
  const kind = r.kind === "lab" ? "lab test" : "pharmacy";
  const status = r.kind === "lab" ? (r.paid ? "paid" : "unpaid") : r.status;
  return [r.patientName, r.patientId, r.doctorName, r.orderNo, status, kind, meds, dates]
    .join(" ")
    .toLowerCase();
};

export default function OrderHistory() {
  const { user, profile } = useAuth();

  const [byUser, setByUser] = useState<any[]>([]);
  const [byPatient, setByPatient] = useState<any[]>([]);
  const [labByUser, setLabByUser] = useState<any[]>([]);
  const [labByPatient, setLabByPatient] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"mine" | "others">("mine");
  const [search, setSearch] = useState("");

  // ---------- Pharmacy bills ----------
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "bills"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (s) => {
        setByUser(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.log("[bills-byUser]", e.code);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!profile?.patientId) return;
    const q = query(
      collection(db, "bills"),
      where("patientId", "==", profile.patientId),
    );
    const unsub = onSnapshot(
      q,
      (s) => setByPatient(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.log("[bills-byPatient]", e.code),
    );
    return () => unsub();
  }, [profile?.patientId]);

  // ---------- Lab bills ----------
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "labOrders"), where("userId", "==", user.uid));
    const unsub = onSnapshot(
      q,
      (s) =>
        setLabByUser(
          s.docs.map((d) => ({ id: d.id, ...(d.data() as any), kind: "lab" })),
        ),
      (e) => console.log("[lab-bill-user]", e.code),
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!profile?.patientId) return;
    const q = query(
      collection(db, "labOrders"),
      where("patientId", "==", profile.patientId),
    );
    const unsub = onSnapshot(
      q,
      (s) =>
        setLabByPatient(
          s.docs.map((d) => ({ id: d.id, ...(d.data() as any), kind: "lab" })),
        ),
      (e) => console.log("[lab-bill-patient]", e.code),
    );
    return () => unsub();
  }, [profile?.patientId]);

  // ---------- Sab ek list mein ----------
  const all = useMemo(() => {
    const m = new Map<string, any>();
    [...byUser, ...byPatient, ...labByUser, ...labByPatient].forEach((r) =>
      m.set((r.kind === "lab" ? "lab_" : "bill_") + r.id, r),
    );
    return Array.from(m.values()).sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
  }, [byUser, byPatient, labByUser, labByPatient]);

  const pid = profile?.patientId;
  const mine = all.filter((r) => pid && r.patientId === pid);
  const others = all.filter((r) => !pid || r.patientId !== pid);

  const term = search.trim().toLowerCase().replace(/\//g, "-");
  const bills = (scope === "mine" ? mine : others).filter(
    (r) => !term || searchText(r).includes(term),
  );

  const openBill = (bill: any) => {
    if (bill.kind === "lab") {
      router.push({
        pathname: "/(main)/lab-bill-details",
        params: { orderId: bill.id },
      });
    } else {
      router.push({
        pathname: "/(main)/bill-details",
        params: { billId: bill.id },
      });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>🧾 My Bills & Orders</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.tab, scope === "mine" && styles.tabActive]}
          onPress={() => setScope("mine")}
        >
          <Text style={[styles.tabText, scope === "mine" && styles.tabTextActive]}>
            Myself ({mine.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, scope === "others" && styles.tabActive]}
          onPress={() => setScope("others")}
        >
          <Text style={[styles.tabText, scope === "others" && styles.tabTextActive]}>
            Someone Else ({others.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Name, Patient ID, Medicine/Test ya Date (06-10-2026)"
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
        <ActivityIndicator size="large" color="#0D9488" style={{ marginTop: 40 }} />
      ) : bills.length === 0 ? (
        <Text style={styles.emptyText}>
          {term ? "Koi match nahi mila." : "No bills yet."}
        </Text>
      ) : (
        bills.map((bill) => {
          const isLab = bill.kind === "lab";
          return (
            <TouchableOpacity
              key={(isLab ? "lab_" : "bill_") + bill.id}
              style={styles.card}
              onPress={() => openBill(bill)}
            >
              <View style={styles.rowTop}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <Ionicons
                    name={isLab ? "flask" : bill.source === "counter" ? "storefront" : "home"}
                    size={20}
                    color={isLab ? "#0D9488" : "#0D9488"}
                  />
                  <Text style={styles.source}>
                    {isLab
                      ? "🧪 Lab Test"
                      : bill.source === "counter"
                        ? "Hospital Pharmacy"
                        : "Home Delivery"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>

              <Text style={styles.patient}>
                👤 {bill.patientName} • {bill.patientId}
                {isLab ? ` • ${bill.orderNo}` : ""}
              </Text>

              {isLab
                ? (bill.tests || []).map((t: any, i: number) => (
                  <Text key={i} style={styles.item}>
                    • {t.name} — Rs {t.price}
                  </Text>
                ))
                : bill.items?.map((item: any, i: number) => (
                  <Text key={i} style={styles.item}>
                    • {item.selectedName || item.name} x {item.qty}
                  </Text>
                ))}

              <View style={styles.footerRow}>
                <Text
                  style={[
                    styles.status,
                    isLab && { color: bill.paid ? "#16A34A" : "#D97706" },
                  ]}
                >
                  {isLab ? (bill.paid ? "Paid" : "Unpaid") : bill.status}
                </Text>
                <Text style={styles.total}>
                  Rs {Number(bill.total || 0).toFixed(0)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF" },
  title: {
    fontSize: 26,
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
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 12,
    elevation: 3,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  source: { marginLeft: 8, fontWeight: "700", color: "#0F172A" },
  patient: { color: "#64748B", fontSize: 13, marginBottom: 6 },
  item: { color: "#374151", marginBottom: 3 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  status: { color: "#16A34A", fontWeight: "700" },
  total: { fontWeight: "800", color: "#0D9488", fontSize: 16 },
});