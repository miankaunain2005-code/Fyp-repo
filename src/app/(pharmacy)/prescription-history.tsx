import { db } from "@/src/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PrescriptionHistory() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "prescriptions"),
        orderBy("createdAt", "desc"),
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPrescriptions(data);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const filteredData = useMemo(() => {
    if (!search.trim()) return prescriptions;

    const term = search.toLowerCase();

    return prescriptions.filter(
      (item: any) =>
        item.patientName?.toLowerCase().includes(term) ||
        item.patientId?.toLowerCase().includes(term) ||
        item.phone?.includes(search),
    );
  }, [search, prescriptions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPrescriptions();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) return "";

    const date = new Date(timestamp.seconds * 1000);

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.headerTitle}>Prescription History</Text>

            <Text style={styles.headerSub}>
              {filteredData.length} Prescriptions
            </Text>
          </View>
        </View>

        {/* SEARCH */}

        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" />

          <TextInput
            placeholder="Search Patient ID / Name / Phone"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
        </View>

        {/* LOADING */}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={{ marginTop: 80 }}
          />
        ) : filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color="#CBD5E1" />

            <Text style={styles.emptyTitle}>No Prescriptions Found</Text>

            <Text style={styles.emptySub}>
              There are no prescriptions available.
            </Text>
          </View>
        ) : (
          filteredData.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(pharmacy)/prescription-detail",
                  params: {
                    prescriptionId: item.id,
                  },
                })
              }
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={28} color="#0D9488" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{item.patientName}</Text>

                <Text style={styles.info}>Patient ID : {item.patientId}</Text>

                <Text style={styles.info}>Phone : {item.phone}</Text>

                <Text style={styles.info}>Doctor : {item.doctorName}</Text>

                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: item.dispensedAtPharmacy
                      ? "#DCFCE7"
                      : "#FEF3C7",
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.dispensedAtPharmacy ? "#16A34A" : "#D97706",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {item.dispensedAtPharmacy ? "Dispensed" : "Pending"}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 70 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },

  header: {
    backgroundColor: "#0D9488",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff30",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  headerSub: {
    color: "#DBEAFE",
    marginTop: 4,
  },

  searchBox: {
    marginHorizontal: 18,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#111827",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 25,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
    marginTop: 16,
  },

  emptySub: {
    marginTop: 8,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  patientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  info: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  date: {
    marginTop: 8,
    fontSize: 12,
    color: "#94A3B8",
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
});
