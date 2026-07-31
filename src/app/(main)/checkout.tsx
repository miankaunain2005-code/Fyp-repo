import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { getUserById } from "@/src/utils/firestoreService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CheckoutScreen() {
    const { user } = useAuth();
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);

    useEffect(() => { loadCart(); }, []);

    const loadCart = async () => {
        try {
            const q = query(collection(db, "cart"), where("userId", "==", user?.uid));
            const snap = await getDocs(q);
            setCart(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.log(error);
        }
        setLoading(false);
    };

    const total = cart.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);

    const placeOrder = async () => {
        if (cart.length === 0) { Alert.alert("Empty Cart", "Add medicines before placing an order."); return; }
        setPlacing(true);
        try {
            const userData = await getUserById(user?.uid || "");

            await addDoc(collection(db, "bills"), {
                source: "online",
                userId: user?.uid,
                patientId: userData?.patientId || "",
                patientName: userData?.name || user?.displayName || "",
                items: cart.map((item) => ({ name: item.name, salt: item.salt, price: item.price, qty: item.quantity || 1 })),
                total,
                status: "Placed",
                createdAt: serverTimestamp(),
            });

            for (const item of cart) { await deleteDoc(doc(db, "cart", item.id)); }

            Alert.alert("Order Placed ✅", "Your order has been placed successfully.", [
                { text: "OK", onPress: () => router.push("/(main)/order-history") },
            ]);
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to place order.");
        }
        setPlacing(false);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Checkout</Text>

            {cart.length === 0 ? (
                <Text style={styles.emptyText}>Your cart is empty.</Text>
            ) : (
                cart.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.salt}>{item.salt}</Text>
                        </View>
                        <Text style={styles.price}>Rs {item.price} x {item.quantity || 1}</Text>
                    </View>
                ))
            )}

            <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>Rs {total.toFixed(0)}</Text>
            </View>

            <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} disabled={placing || cart.length === 0}>
                {placing ? <ActivityIndicator color="#fff" /> : (
                    <><Ionicons name="checkmark-circle" size={22} color="#fff" /><Text style={styles.placeBtnText}>Place Order</Text></>
                )}
            </TouchableOpacity>
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#EEF5FF", padding: 20 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 28, fontWeight: "800", color: "#0F172A", marginTop: 20, marginBottom: 20 },
    emptyText: { textAlign: "center", color: "#64748B", marginTop: 40 },
    card: { backgroundColor: "#fff", borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    name: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
    salt: { color: "#64748B", marginTop: 3 },
    price: { fontWeight: "700", color: "#2563EB" },
    totalBox: { backgroundColor: "#fff", padding: 18, borderRadius: 15, flexDirection: "row", justifyContent: "space-between", marginTop: 15, elevation: 3 },
    totalLabel: { fontSize: 18, fontWeight: "700" },
    totalValue: { fontSize: 24, fontWeight: "800", color: "#2563EB" },
    placeBtn: { backgroundColor: "#16A34A", marginTop: 20, height: 55, borderRadius: 15, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    placeBtnText: { color: "#fff", fontSize: 17, fontWeight: "700", marginLeft: 8 },
});