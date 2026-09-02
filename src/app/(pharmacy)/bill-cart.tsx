import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { useBill } from "@/src/context/BillContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
export default function Billcart() {


    const { user } = useAuth();
    const [patientId, setPatientId] = useState("")
    const [phone, setPhone] = useState("")
    const {
        billItems,
        removeFromBill,
        clearBill,
        totalItems,
        totalAmount,
    } = useBill();


    const generateBill = async () => {

        if (!patientId.trim()) {
            Alert.alert(
                "Patient ID Required"
            );
            return;
        }

        if (billItems.length === 0) {
            Alert.alert(
                "Bill is Empty"
            );
            return;
        }

        try {

            //  FIX: Pehle SAB items ka stock validate karo,
            // stock deduct karna shuru karne se pehle.
            // Isse partial/negative deduction se bachte hain.
            for (const item of billItems) {

                const ref = doc(db, "medicines", item.id);
                const snap = await getDoc(ref);

                if (!snap.exists()) {
                    Alert.alert(
                        "Medicine Not Found",
                        `${item.name} ab system mein maujood nahi hai.`
                    );
                    return;
                }

                const currentStock = snap.data().stock || 0;

                if (currentStock < item.qty) {
                    Alert.alert(
                        "Insufficient Stock",
                        `${item.name} ka stock sirf ${currentStock} hai, lekin bill mein ${item.qty} hai. Quantity kam karein.`
                    );
                    return;
                }
            }

            // Ab safely stock deduct karo (validation pass ho chuki hai)
            for (const item of billItems) {

                const ref = doc(
                    db,
                    "medicines",
                    item.id
                );

                const snap = await getDoc(ref);

                if (!snap.exists())
                    continue;

                const stock =
                    snap.data().stock || 0;

                await updateDoc(ref, {
                    stock: stock - item.qty,
                });

            }

            // Save Bill
            await addDoc(
                collection(db, "billHistory"),
                {

                    patientId,

                    phone,

                    pharmacistId: user?.uid,

                    pharmacistName:
                        user?.displayName,

                    medicines: billItems,

                    totalItems,

                    totalAmount,

                    createdAt:
                        serverTimestamp(),

                }
            );

            Alert.alert(
                "Success",
                "Bill Generated Successfully"
            );

            clearBill();

            setPatientId("");

            setPhone("");

            router.back();

        } catch (e) {

            console.log(e);

            Alert.alert(
                "Error",
                "Something went wrong"
            );

        }

    };
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>
                Patient Bill
            </Text>
            <Text>
                Review medicines before genratiing bill, you can remove any medcine from the list by clicking on the remove button
            </Text>
            {billItems.map((item) => (
                <View key={item.id} style={styles.card}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>
                            {item.name}

                        </Text>
                        <Text style={styles.medInfo}>
                            Qty:{item.qty}
                        </Text>
                        <Text style={styles.medInfo}>
                            Price:{item.price}
                        </Text>
                        <Text style={styles.total}>
                            Total;Rs{item.qty * item.price}
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.removeBtn}
                        onPress={() =>
                            removeFromBill(item.id)
                        }
                    >
                        <Ionicons
                            name="trash"
                            size={20}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            ))}

            <TextInput
                placeholder="Patient ID"
                value={patientId}
                onChangeText={setPatientId}
                style={styles.input}
            />

            <TextInput
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
            />


            <View style={styles.summary}>

                <Text style={styles.summaryText}>
                    Total Items : {totalItems}
                </Text>

                <Text style={styles.summaryAmount}>
                    Grand Total : Rs {totalAmount}
                </Text>

            </View>

            <TouchableOpacity
                style={styles.generateBtn}
                onPress={generateBill}
            >

                <Ionicons
                    name="receipt"
                    size={22}
                    color="#fff"
                />

                <Text style={styles.generateText}>
                    Generate Bill
                </Text>

            </TouchableOpacity>

            <View style={{ height: 40 }} />

        </ScrollView>
    );
}
const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#EEF5FF",
        paddingHorizontal: 18,
        paddingTop: 60,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E3A8A",
    },

    subTitle: {
        marginTop: 6,
        color: "#64748B",
        fontSize: 14,
        marginBottom: 22,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        elevation: 3,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    medName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
    },

    medInfo: {
        marginTop: 4,
        color: "#64748B",
        fontSize: 14,
    },

    total: {
        marginTop: 8,
        fontSize: 17,
        fontWeight: "700",
        color: "#16A34A",
    },

    removeBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "#DC2626",
        justifyContent: "center",
        alignItems: "center",
    },

    input: {
        backgroundColor: "#fff",
        height: 55,
        borderRadius: 14,
        paddingHorizontal: 16,
        marginTop: 14,
        fontSize: 16,
        elevation: 3,
    },

    summary: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 18,
        marginTop: 22,
        elevation: 4,
    },

    summaryText: {
        fontSize: 17,
        fontWeight: "600",
        color: "#0F172A",
    },

    summaryAmount: {
        marginTop: 10,
        fontSize: 24,
        fontWeight: "800",
        color: "#16A34A",
    },

    generateBtn: {
        marginTop: 24,
        height: 56,
        borderRadius: 16,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        elevation: 5,
    },

    generateText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
        marginLeft: 10,
    },

});
