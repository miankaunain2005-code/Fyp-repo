import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CartScreen() {
    const { user } = useAuth();
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        try {
            const q = query(collection(db, "cart"), where("userId", "==", user?.uid));
            const snap = await getDocs(q);

            const data = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setCart(
                data.map((item: any) => ({
                    ...item,
                    quantity: item.quantity || 1,
                }))
            );
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchCart(); }, []));

    //  FIX: maxQty param add kiya. Agar item prescription se aaya hai
    // (maxQuantity field set hai) to us limit se aage quantity nahi badhegi.
    // Agar maxQty undefined hai (pharmacy.tsx se general add hua item),
    // to koi limit nahi lagti.
    const increaseQty = async (id: string, currentQty: number, maxQty?: number) => {
        if (maxQty && currentQty >= maxQty) {
            Alert.alert(
                "Limit Reached",
                `Prescription ke mutabiq is medicine ki sirf ${maxQty} quantity allow hai.`
            );
            return;
        }

        const newQty = currentQty + 1;
        setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
        try { await updateDoc(doc(db, "cart", id), { quantity: newQty }); } catch (error) { console.log(error); }
    };

    const decreaseQty = async (id: string, currentQty: number) => {
        if (currentQty <= 1) return;
        const newQty = currentQty - 1;
        setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item)));
        try { await updateDoc(doc(db, "cart", id), { quantity: newQty }); } catch (error) { console.log(error); }
    };

    const removeItem = async (id: string) => {
        try {
            await deleteDoc(doc(db, "cart", id));
            setCart((prev) => prev.filter((item) => item.id !== id));
        } catch (error) { console.log(error); }
    };

    const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.salt}>{item.salt}</Text>
                <Text style={styles.price}>Rs {item.price * item.quantity}</Text>
                {/*  agar prescription-linked item hai to limit dikhado */}
                {item.maxQuantity ? (
                    <Text style={styles.limitText}>
                        Prescribed limit: {item.maxQuantity}
                    </Text>
                ) : null}
            </View>
            <View style={styles.right}>
                <View style={styles.qtyContainer}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id, item.quantity)}>
                        <Text style={styles.qtyText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => increaseQty(item.id, item.quantity, item.maxQuantity)}
                    >
                        <Text style={styles.qtyText}>+</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Remove</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🛒 My Cart</Text>
            {cart.length === 0 ? (
                <View style={styles.center}><Text style={{ fontSize: 20, fontWeight: "700" }}>Cart Empty</Text></View>
            ) : (
                <>
                    <FlatList data={cart} renderItem={renderItem} keyExtractor={(item) => item.id} />
                    <View style={styles.totalBox}>
                        <Text style={{ fontSize: 18, fontWeight: "700" }}>Total</Text>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: "#2563EB" }}>Rs {total}</Text>
                    </View>
                    <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push("/(main)/checkout")}>
                        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Checkout</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#EEF5FF", padding: 15 },
    header: { fontSize: 28, fontWeight: "800", marginBottom: 15 },
    card: { backgroundColor: "#fff", borderRadius: 15, padding: 15, marginBottom: 12, flexDirection: "row", justifyContent: "space-between" },
    name: { fontSize: 18, fontWeight: "700" },
    salt: { color: "#666", marginTop: 5 },
    price: { marginTop: 8, color: "#2563EB", fontWeight: "700" },
    limitText: { marginTop: 4, color: "#F59E0B", fontSize: 12, fontWeight: "600" },
    right: { alignItems: "center" },
    qtyContainer: { flexDirection: "row", alignItems: "center" },
    qtyBtn: { width: 35, height: 35, backgroundColor: "#2563EB", justifyContent: "center", alignItems: "center", borderRadius: 8 },
    qtyText: { color: "#fff", fontSize: 20, fontWeight: "700" },
    qtyValue: { marginHorizontal: 12, fontSize: 18, fontWeight: "700" },
    removeBtn: { marginTop: 10, backgroundColor: "#EF4444", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    totalBox: { backgroundColor: "#fff", padding: 18, borderRadius: 15, flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    checkoutBtn: { backgroundColor: "#22C55E", padding: 16, borderRadius: 15, alignItems: "center", marginTop: 15, marginBottom: 80 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
