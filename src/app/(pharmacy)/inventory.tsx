import SideDrawer from "@/src/components/SideDrawer";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { useBill } from "@/src/context/BillContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Pharmacist";

  const {
    billItems,
    addToBill,
    totalItems,
    totalAmount,
  } = useBill();

  const [drawerVisible, setDrawerVisible] = useState(false);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [medicines, setMedicines] = useState<any[]>([]);

  const [filtered, setFiltered] = useState<any[]>([]);

  const loadMedicines = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(
        collection(db, "medicines")
      );

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        qty: 1,
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

    const keyword =
      text.toLowerCase();

    const result = medicines.filter(
      (item: any) =>
        item.name?.toLowerCase().includes(keyword) ||
        item.salt?.toLowerCase().includes(keyword) ||
        item.manufacturer?.toLowerCase().includes(keyword)
    );

    setFiltered(result);
  };
  const changeQty = (
    id: string,
    type: "pluse" | "minus"
  ) => {

    setFiltered((prev: any[]) =>
      prev.map((item) => {

        if (item.id !== id)
          return item;

        let qty = item.qty;

        if (type === "pluse") {

          if (qty >= item.stock) {

            Alert.alert(
              "Limit Reached",
              `Only ${item.stock} items available in stock.`
            );

            return item;
          }

          qty++;
        } else {

          qty = Math.max(1, qty - 1);
        }

        return {
          ...item,
          qty,
        };
      })
    );
  };


  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>

          <View>
            <Text style={styles.logo}>
              MediCare AI
            </Text>

            <Text style={styles.subLogo}>
              Pharmacy Inventory
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() =>
              setDrawerVisible(true)
            }
          >
            <Ionicons
              name="menu"
              size={24}
              color="#2563EB"
            />
          </TouchableOpacity>

        </View>

        {/* Stats */}

        <View style={styles.statsRow}>

          <View style={styles.statCard}>
            <Ionicons
              name="medkit"
              size={28}
              color="#2563EB"
            />

            <Text style={styles.statValue}>
              {medicines.length}
            </Text>

            <Text style={styles.statLabel}>
              Medicines
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="warning"
              size={28}
              color="#F59E0B"
            />

            <Text style={styles.statValue}>
              {
                medicines.filter(
                  (m: any) =>
                    m.stock > 0 &&
                    m.stock <= 10
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Low Stock
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="close-circle"
              size={28}
              color="#DC2626"
            />

            <Text style={styles.statValue}>
              {
                medicines.filter(
                  (m: any) =>
                    m.stock <= 0
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Out
            </Text>
          </View>

        </View>

        {/* Search */}

        <View style={styles.searchBox}>

          <Ionicons
            name="search"
            size={22}
            color="#64748B"
          />

          <TextInput
            placeholder="Search medicine..."
            value={search}
            onChangeText={searchMedicine}
            style={styles.input}
          />

        </View>

        {/* Loading */}

        {loading ? (

          <ActivityIndicator
            size="large"
            color="#2563EB"
            style={{
              marginTop: 40,
            }}
          />

        ) : (

          <>
            {filtered.map(
              (item: any) => (
                <View
                  key={item.id}
                  style={styles.card}
                >
                  <View style={styles.cardTop}>

                    <View style={{ flex: 1 }}>

                      <Text style={styles.medName}>
                        {item.name}
                      </Text>

                      <Text style={styles.medSalt}>
                        {item.salt}
                      </Text>

                      <Text style={styles.medInfo}>
                        {item.strength}
                      </Text>

                      <Text style={styles.medInfo}>
                        {item.manufacturer}
                      </Text>

                    </View>

                    <View>

                      {item.stock <= 0 ? (

                        <View
                          style={styles.outBadge}
                        >
                          <Text style={styles.badgeText}>
                            OUT
                          </Text>
                        </View>

                      ) : item.stock <= 10 ? (

                        <View
                          style={styles.lowBadge}
                        >
                          <Text style={styles.badgeText}>
                            LOW
                          </Text>
                        </View>

                      ) : (

                        <View
                          style={styles.inBadge}
                        >
                          <Text style={styles.badgeText}>
                            IN
                          </Text>
                        </View>

                      )}

                    </View>

                  </View>

                  <View style={styles.bottomRow}>

                    {/* Left Side */}
                    <View style={styles.leftSection}>
                      <Text style={styles.price}>
                        Rs {item.price}
                      </Text>

                      <Text style={styles.stock}>
                        Stock : {item.stock}
                      </Text>
                    </View>

                    {/* Right Side */}
                    <View style={styles.rightSection}>

                      <View style={styles.qtyRow}>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => changeQty(item.id, "minus")}
                        >
                          <Ionicons name="remove" size={18} color="#fff" />
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>
                          {item.qty}
                        </Text>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => changeQty(item.id, "pluse")}
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>

                      </View>

                      <TouchableOpacity
                        style={styles.addBtn}
                        disabled={item.stock <= 0}
                        onPress={() => addToBill(item)}
                      >
                        <Ionicons
                          name="cart"
                          size={18}
                          color="#fff"
                        />

                        <Text style={styles.addBtnText}>
                          Add To Cart
                        </Text>
                      </TouchableOpacity>

                    </View>

                  </View>

                </View>
              ))
            }
          </>

        )}

        <View style={styles.billSummary}>

          <View>

            <Text style={styles.billTitle}>
              Bill Summary
            </Text>

            <Text style={styles.billSub}>
              {totalItems} Items
            </Text>

            <Text style={styles.billPrice}>
              Rs {totalAmount}
            </Text>

          </View>

          <TouchableOpacity
            style={styles.billBtn}
            disabled={billItems.length === 0}


            onPress={() => {

              if (billItems.length === 0) {
                Alert.alert(
                  "Bill Empty",
                  "Please add medicines first."
                );
                return;
              }

              router.push("/(pharmacy)/bill-cart")

            }}
          >
            <Ionicons
              name="arrow-forward"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

        </View>

        <View style={{ height: 120 }} />

      </ScrollView >



      <SideDrawer
        visible={drawerVisible}
        onClose={() =>
          setDrawerVisible(false)
        }
        name={pharmacyName}
        roleLabel="Pharmacy"
        accentColor="#F59E0B"
        menuItems={[
          {
            icon: "cube-outline",
            label: "Inventory",
            onPress: () => { },
          },
          {
            icon: "receipt-outline",
            label: "Bill History",
            onPress: () =>
              router.push(
                "/(pharmacy)/bill-history"
              ),
          },
        ]}
      />

    </>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FF",
    paddingHorizontal: 18,
  },

  header: {
    marginTop: 60,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  subLogo: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 14,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  qtyText: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 12,
  },

  addBtn: {
    width: 130,
    height: 40,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 15,
  },

  billSummary: {
    marginTop: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
  },

  billTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  billSub: {
    color: "#64748B",
    marginTop: 4,
  },

  billPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#16A34A",
    marginTop: 6,
  },

  billBtn: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  menuBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
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

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftSection: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  medSalt: {
    color: "#2563EB",
    marginTop: 4,
    fontWeight: "600",
  },

  medInfo: {
    color: "#64748B",
    marginTop: 1,
  },

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

  badgeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  bottomRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 14,
  },
  rightSection: {
    width: 140,
    alignItems: "center",
    marginTop: -24,
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  stock: {
    color: "#64748B",
    marginTop: 6,
  },

  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
});


