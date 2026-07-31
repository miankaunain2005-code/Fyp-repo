import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

export default function PharmacyScreen() {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchMedicines = async () => {
        try {
            const snap = await getDocs(collection(db, "medicines"));
            const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setMedicines(list);
            setFiltered(list);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMedicines(); }, []);

    const handleSearch = (text: string) => {
        setSearch(text);
        if (!text.trim()) { setFiltered(medicines); return; }
        setFiltered(medicines.filter((item) => item.name?.toLowerCase().includes(text.toLowerCase())));
    };

    const checkPrescription = async (medicineName: string) => {
        try {
            const q = query(collection(db, "prescriptions"), where("userId", "==", user?.uid));
            const snap = await getDocs(q);
            return snap.docs.some((doc) => {
                const meds = doc.data().medicines || [];
                return meds.some((m: any) => m.medicineName?.toLowerCase() === medicineName.toLowerCase());
            });
        } catch (error) {
            console.log("Prescription Error:", error);
            return false;
        }
    };

    const showAlternative = (item: any) => {
        const alt = medicines.find((m) => m.salt === item.salt && m.stock > 0 && m.name !== item.name);
        if (!alt) { Alert.alert("No Alternative", "No substitute available"); return; }
        Alert.alert("Alternative Found 💊", `${alt.name} available`, [
            { text: "Cancel", style: "cancel" },
            { text: "Add Alternative", onPress: () => addToCart(alt) },
        ]);
    };

    const addToCart = async (item: any) => {
        if (item.stock <= 0) {
            Alert.alert(
                "Out of Stock ❌",
                `${item.name} is not available`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Show Alternative 💊", onPress: () => showAlternative(item) },
                ]
            );
            return;
        }

        // 👇 FIXED: ab default prescription required hai (jab tak explicitly false na ho)
        const needsPrescription = item.requiresPrescription !== false;

        if (needsPrescription) {
            const allowed = await checkPrescription(item.name);
            if (!allowed) {
                Alert.alert(
                    "Prescription Required 🚫",
                    `Doctor prescription is needed to add to cart .`
                );
                return;
            }
        }

        try {
            await addDoc(collection(db, "cart"), {
                userId: user?.uid,
                medicineId: item.id,
                name: item.name,
                salt: item.salt,
                price: item.price,
                createdAt: new Date(),
                quantity: 1,
            });
            Alert.alert("Success ✅", `${item.name} added to cart`);
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Failed to add medicine");
        }
    };
    const renderItem = ({ item }: any) => (
        <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.salt}>🧪 {item.salt}</Text>
            <Text style={styles.price}>💰 Rs {item.price}</Text>

            {item.requiresPrescription !== false && (
                <Text style={styles.rxBadge}>℞ Prescription Required</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={() => addToCart(item)}>
                <Text style={styles.buttonText}>Add to Cart</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>💊 Pharmacy</Text>
            </View>

            <TextInput placeholder="Search medicine..." value={search} onChangeText={handleSearch} style={styles.search} />

            <TouchableOpacity style={styles.cartBtn} onPress={() => router.push("/cart")}>
                <Text style={styles.cartBtnText}>🛒 View Cart</Text>
            </TouchableOpacity>

            <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={renderItem} showsVerticalScrollIndicator={false} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: "#f5f5f5" },
    header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
    search: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginBottom: 10 },
    card: { backgroundColor: "#fff", padding: 15, marginBottom: 10, borderRadius: 10, elevation: 2 },
    name: { fontSize: 18, fontWeight: "bold" },
    salt: { marginTop: 5, color: "#555" },
    price: { marginTop: 5, fontWeight: "600" },
    rxBadge: { marginTop: 6, color: "#DC2626", fontWeight: "700", fontSize: 12 },
    button: { marginTop: 10, backgroundColor: "#4CAF50", padding: 10, borderRadius: 8, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "bold" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    cartBtn: { backgroundColor: "#FF9800", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 15, elevation: 3 },
    cartBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});