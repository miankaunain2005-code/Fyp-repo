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

export default function OnlineOrders() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(data);
    } catch (error) {
      console.log("ONLINE ORDERS ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return orders;
    }

    return orders.filter(
      (item: any) =>
        item.patientName?.toLowerCase().includes(term) ||
        item.patientId?.toLowerCase().includes(term) ||
        item.patientPhone?.includes(search),
    );
  }, [orders, search]);

  const formatDate = (timestamp: any) => {
    if (!timestamp?.seconds) {
      return "Just now";
    }

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Placed":
        return {
          backgroundColor: "#FEF3C7",
          color: "#D97706",
        };

      case "Processing":
        return {
          backgroundColor: "#DBEAFE",
          color: "#2563EB",
        };

      case "Dispensed":
        return {
          backgroundColor: "#DCFCE7",
          color: "#16A34A",
        };

      case "Delivered":
        return {
          backgroundColor: "#DCFCE7",
          color: "#15803D",
        };

      case "Cancelled":
        return {
          backgroundColor: "#FEE2E2",
          color: "#DC2626",
        };

      default:
        return {
          backgroundColor: "#E2E8F0",
          color: "#475569",
        };
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>Online Orders</Text>

          <Text style={styles.headerSub}>
            {orders.filter((item) => item.status === "Placed").length} New
            Orders
          </Text>
        </View>
      </View>

      {/* SEARCH */}

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#64748B" />

        <TextInput
          placeholder="Search patient..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* LOADING */}

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563EB"
          style={{ marginTop: 80 }}
        />
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-check-outline" size={80} color="#CBD5E1" />

          <Text style={styles.emptyTitle}>No Online Orders</Text>

          <Text style={styles.emptySub}>
            New patient orders will appear here.
          </Text>
        </View>
      ) : (
        filteredOrders.map((item: any) => {
          const statusStyle = getStatusStyle(item.status);

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => {
                console.log("OPENING ORDER:", item);
                console.log("ORDER ID:", item.id);
                router.push({
                  pathname: "/(pharmacy)/online-order-detail",
                  params: {
                    orderId: item.id,
                  },
                });
              }}
            >
              {/* TOP */}

              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={26} color="#2563EB" />
                </View>

                <View
                  style={{
                    flex: 1,
                    marginLeft: 12,
                  }}
                >
                  <Text style={styles.patientName}>{item.patientName}</Text>

                  <Text style={styles.phone}>📞 {item.patientPhone}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusStyle.backgroundColor,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: statusStyle.color,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* ADDRESS */}

              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={18} color="#64748B" />

                <Text style={styles.address} numberOfLines={2}>
                  {item.deliveryAddress}
                </Text>
              </View>

              {/* BOTTOM */}

              <View style={styles.bottomRow}>
                <View>
                  <Text style={styles.smallLabel}>Medicines</Text>

                  <Text style={styles.itemCount}>
                    {item.items?.length || 0} Items
                  </Text>
                </View>

                <View>
                  <Text style={styles.smallLabel}>Order Total</Text>

                  <Text style={styles.total}>
                    Rs {Number(item.total || 0).toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* DATE */}

              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

              {/* OPEN BUTTON */}

              <View style={styles.openBtn}>
                <Text style={styles.openBtnText}>View & Process</Text>

                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF5FF",
  },

  header: {
    backgroundColor: "#2563EB",
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
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#111827",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: "700",
    color: "#334155",
  },

  emptySub: {
    marginTop: 8,
    color: "#94A3B8",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    elevation: 4,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  patientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  phone: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  addressRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  address: {
    flex: 1,
    marginLeft: 8,
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  smallLabel: {
    color: "#94A3B8",
    fontSize: 12,
  },

  itemCount: {
    color: "#0F172A",
    fontWeight: "700",
    marginTop: 4,
  },

  total: {
    color: "#16A34A",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "right",
  },

  date: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 14,
  },

  openBtn: {
    marginTop: 15,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  openBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginRight: 8,
  },
});
