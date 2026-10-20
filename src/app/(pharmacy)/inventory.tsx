import SideDrawer from "@/src/components/SideDrawer";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function InventoryScreen() {
  const { user } = useAuth();

  const pharmacyName =
    user?.displayName || user?.email?.split("@")[0] || "Pharmacist";

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "medicines"));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMedicines(data);
      setFiltered(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const searchMedicine = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(medicines);
      return;
    }
    const keyword = text.toLowerCase();
    const result = medicines.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.salt?.toLowerCase().includes(keyword) ||
        item.manufacturer?.toLowerCase().includes(keyword),
    );
    setFiltered(result);
  };

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>MediCare AI</Text>
            <Text style={styles.subLogo}>
              Medicine Stock — Search Only (Read-only)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setDrawerVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#0D9488" />
          </TouchableOpacity>
        </View>

        {/* Info banner — hospital policy reminder
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#0D9488" />
          <Text style={styles.infoBannerText}>
            Yeh screen sirf stock check karne ke liye hai. Koi bhi medicine bina
            prescription dispense nahi hoti — bill sirf{" "}
            <Text style={{ fontWeight: "700" }}>Prescription History</Text> se
            generate hota hai.
          </Text>
        </View> */}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="medkit" size={28} color="#0D9488" />
            <Text style={styles.statValue}>{medicines.length}</Text>
            <Text style={styles.statLabel}>Medicines</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="warning" size={28} color="#F59E0B" />
            <Text style={styles.statValue}>
              {
                medicines.filter((m: any) => m.stock > 0 && m.stock <= 10)
                  .length
              }
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={28} color="#DC2626" />
            <Text style={styles.statValue}>
              {medicines.filter((m: any) => m.stock <= 0).length}
            </Text>
            <Text style={styles.statLabel}>Out</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={22} color="#64748B" />
          <TextInput
            placeholder="Search medicine, salt, or manufacturer..."
            value={search}
            onChangeText={searchMedicine}
            style={styles.input}
          />
        </View>

        {/* Loading */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0D9488"
            style={{ marginTop: 40 }}
          />
        ) : (
          filtered.map((item: any) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{item.name}</Text>
                  <Text style={styles.medSalt}>{item.salt}</Text>
                  <Text style={styles.medInfo}>{item.strength}</Text>
                  <Text style={styles.medInfo}>{item.manufacturer}</Text>
                </View>

                <View>
                  {item.stock <= 0 ? (
                    <View style={styles.outBadge}>
                      <Text style={styles.badgeText}>OUT</Text>
                    </View>
                  ) : item.stock <= 10 ? (
                    <View style={styles.lowBadge}>
                      <Text style={styles.badgeText}>LOW</Text>
                    </View>
                  ) : (
                    <View style={styles.inBadge}>
                      <Text style={styles.badgeText}>IN STOCK</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.bottomRow}>
                <Text style={styles.price}>Rs {item.price}</Text>
                <Text style={styles.stock}>Stock : {item.stock}</Text>
              </View>
            </View>
          ))
        )}

        {!loading && filtered.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons name="search-outline" size={60} color="#CBD5E1" />
            <Text style={{ color: "#94A3B8", marginTop: 10 }}>
              No medicine found.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        name={pharmacyName}
        roleLabel="Pharmacy"
        accentColor="#F59E0B"
        menuItems={[
          {
            icon: "document-text-outline",
            label: "Prescriptions (Dispense Here)",
            onPress: () => router.push("/(pharmacy)/prescription-history"),
          },
          {
            icon: "bag-handle-outline",
            label: "Online Orders",
            onPress: () => router.push("/(pharmacy)/online-orders"),
          },
          {
            icon: "receipt-outline",
            label: "Bill History",
            onPress: () => router.push("/(pharmacy)/bill-history"),
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF5FF", paddingHorizontal: 18 },
  header: {
    marginTop: 60,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: 28, fontWeight: "700", color: "#157e75" },
  subLogo: { color: "#64748B", marginTop: 4, fontSize: 13, maxWidth: 220 },
  menuBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 10,
    color: "#1E3A8A",
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  statLabel: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "600",
    fontSize: 13,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 20,
    elevation: 3,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  medName: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  medSalt: { color: "#0D9488", marginTop: 4, fontWeight: "600" },
  medInfo: { color: "#64748B", marginTop: 1 },
  inBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lowBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  outBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { fontWeight: "700", fontSize: 11 },
  bottomRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  price: { fontSize: 20, fontWeight: "700", color: "#16A34A" },
  stock: { color: "#64748B", fontWeight: "600" },
});
