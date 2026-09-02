import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    updateDoc,
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

export default function PrescriptionDetail() {
    const { prescriptionId } = useLocalSearchParams();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [prescription, setPrescription] = useState<any>(null);

    const [allMedicines, setAllMedicines] = useState<any[]>([]);

    const [billItems, setBillItems] = useState<any[]>([]);

    useEffect(() => { load(); }, []);

    const load = async () => {

        // Prescription

        const prescriptionSnap = await getDoc(
            doc(db, "prescriptions", prescriptionId as string)
        );

        if (!prescriptionSnap.exists()) {
            setLoading(false);
            return;
        }

        try {

            const prescriptionData = {
                id: prescriptionSnap.id,
                ...prescriptionSnap.data(),
            } as any;

            setPrescription(prescriptionData);

            // Inventory

            const medicineSnap = await getDocs(
                collection(db, "medicines")
            );

            const medicines = medicineSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            setAllMedicines(medicines);

            // Prepare Bill Items

            const items = (prescriptionData.medicines || []).map(
                (medicine: any) => {
                    const stockMedicine = medicines.find(
                        (m) =>
                            m.name?.toLowerCase() ===
                            medicine.medicineName?.toLowerCase()
                    );

                    // Alternate Medicines

                    const alternates = medicines.filter(
                        (m) =>
                            m.salt &&
                            stockMedicine?.salt &&
                            m.salt.toLowerCase() === stockMedicine.salt.toLowerCase() &&
                            m.strength === stockMedicine.strength &&
                            m.stock > 0 &&
                            m.name !== stockMedicine.name
                    );

                    return {
                        medicineId: stockMedicine?.id,

                        originalName: medicine.medicineName,

                        selectedName: stockMedicine
                            ? stockMedicine.name
                            : medicine.medicineName,

                        dosage: medicine.dosage,

                        instructions: medicine.instructions,

                        qty: String(medicine.quantity || 1),

                        price: stockMedicine
                            ? String(stockMedicine.price)
                            : "0",

                        stock: stockMedicine?.stock || 0,

                        inStock:
                            stockMedicine &&
                            stockMedicine.stock >=
                            Number(medicine.quantity || 1),

                        alternateMedicines: alternates,

                        replaced: false,
                    };
                }
            );

            setBillItems(items);
        } catch (error) {
            console.log(error);
        }

        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const updateItem = (
        index: number,
        field: string,
        value: any
    ) => {
        setBillItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item
            )
        );
    };
    const replaceMedicine = (
        index: number,
        medicine: any
    ) => {
        setBillItems((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;

                const alternates = allMedicines.filter(
                    (m) =>
                        m.salt?.toLowerCase() === medicine.salt?.toLowerCase() &&
                        m.strength === medicine.strength &&
                        m.stock > 0 &&
                        m.id !== medicine.id
                );

                return {
                    ...item,

                    medicineId: medicine.id,

                    selectedName: medicine.name,

                    price: String(medicine.price),

                    stock: medicine.stock,

                    inStock: true,

                    replaced: true,

                    alternateMedicines: alternates,
                };
            })
        );
    };

    const total = billItems.reduce((sum, item) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;

        return sum + qty * price;
    }, 0);

    const validateStock = () => {
        for (const item of billItems) {
            const qty = Number(item.qty);

            if (!item.inStock) {
                Alert.alert(
                    "Medicine Unavailable",
                    `${item.selectedName} is out of stock.\nPlease select an alternate medicine.`
                );
                return false;
            }

            if (qty <= 0) {
                Alert.alert(
                    "Invalid Quantity",
                    `Please enter a valid quantity for ${item.selectedName}.`
                );
                return false;
            }

            if (qty > item.stock) {
                Alert.alert(
                    "Insufficient Stock",
                    `${item.selectedName} has only ${item.stock} item(s) available.`
                );
                return false;
            }
        }

        return true;
    };

    const generateBill = async () => {
        if (billItems.length === 0) {
            Alert.alert("Error", "No medicines found.");
            return;
        }

        if (!validateStock()) {
            return;
        }

        setSaving(true);

        try {
            // Deduct stock

            for (const item of billItems) {
                const medicineRef = doc(
                    db,
                    "medicines",
                    item.medicineId
                );

                const medicine = allMedicines.find(
                    (m) => m.id === item.medicineId
                );

                if (!medicine) {
                    throw new Error(
                        `${item.selectedName} not found.`
                    );
                }

                const remaining =
                    Number(medicine.stock) -
                    Number(item.qty);

                if (remaining < 0) {
                    throw new Error(
                        `${item.selectedName} stock is insufficient.`
                    );
                }

                await updateDoc(medicineRef, {
                    stock: remaining,
                });
            }

            // Save Bill

            await addDoc(collection(db, "bills"), {
                source: "counter",

                prescriptionId: prescription.id,

                userId: prescription.userId,

                patientId: prescription.patientId,

                patientName: prescription.patientName,

                phone: prescription.phone,

                doctorName: prescription.doctorName,

                pharmacistId: user?.uid,

                pharmacistName:
                    user?.displayName ||
                    user?.email,

                items: billItems,

                total,

                status: "Paid",

                createdAt: serverTimestamp(),
            });

            // Update Prescription

            await updateDoc(
                doc(db, "prescriptions", prescription.id),
                {
                    dispensedAtPharmacy: true,
                    dispensedAt: serverTimestamp(),
                }
            );
            Alert.alert(
                "Success",
                "Bill generated successfully.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace("/(pharmacy)");
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.log(error);

            Alert.alert(
                "Billing Failed",
                error?.message ||
                "Unable to generate bill."
            );
        }

        setSaving(false);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
    if (!prescription) return <View style={styles.center}><Text>Prescription not found.</Text></View>;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>💊 Dispense Prescription</Text>
                <Text style={styles.headerSubTitle}>{prescription.patientName}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardHeading}>👤 Patient Info</Text>
                <Text style={styles.infoText}>ID: {prescription.patientId}</Text>
                <Text style={styles.infoText}>Phone: {prescription.phone}</Text>
                <Text style={styles.infoText}>Doctor: {prescription.doctorName}</Text>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardHeading}>
                    💊 Medicines
                </Text>

                {billItems.map((item, index) => (
                    <View key={index} style={styles.medRow}>

                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Text style={styles.medName}>
                                {item.selectedName}
                            </Text>

                            {item.inStock ? (
                                <View
                                    style={{
                                        backgroundColor: "#DCFCE7",
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 15,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#16A34A",
                                            fontWeight: "700",
                                            fontSize: 12,
                                        }}
                                    >
                                        IN STOCK
                                    </Text>
                                </View>
                            ) : (
                                <View
                                    style={{
                                        backgroundColor: "#FEE2E2",
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 15,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#DC2626",
                                            fontWeight: "700",
                                            fontSize: 12,
                                        }}
                                    >
                                        OUT OF STOCK
                                    </Text>
                                </View>
                            )}
                        </View>

                        {item.replaced && (
                            <Text
                                style={{
                                    color: "#2563EB",
                                    marginTop: 5,
                                    fontWeight: "600",
                                }}
                            >
                                Replaced from {item.originalName}
                            </Text>
                        )}

                        <Text style={styles.medSub}>
                            {item.dosage}
                        </Text>

                        <Text style={styles.medSub}>
                            {item.instructions}
                        </Text>

                        <Text
                            style={{
                                marginTop: 8,
                                color: "#64748B",
                            }}
                        >
                            Available Stock : {item.stock}
                        </Text>

                        {/* Qty + Price */}

                        <View style={styles.rowInputs}>

                            <View
                                style={{
                                    flex: 1,
                                    marginRight: 10,
                                }}
                            >
                                <Text style={styles.label}>
                                    Quantity
                                </Text>

                                <TextInput
                                    value={item.qty}
                                    keyboardType="number-pad"
                                    onChangeText={(v) =>
                                        updateItem(index, "qty", v)
                                    }
                                    style={styles.input}
                                />
                            </View>

                            <View
                                style={{
                                    flex: 1,
                                }}
                            >
                                <Text style={styles.label}>
                                    Price
                                </Text>

                                <TextInput
                                    value={item.price}
                                    keyboardType="number-pad"
                                    onChangeText={(v) =>
                                        updateItem(index, "price", v)
                                    }
                                    style={styles.input}
                                />
                            </View>

                        </View>

                        {/* Alternate Medicines */}

                        {!item.inStock &&
                            item.alternateMedicines.length > 0 && (
                                <View
                                    style={{
                                        marginTop: 18,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#2563EB",
                                            fontWeight: "700",
                                            marginBottom: 10,
                                        }}
                                    >
                                        Suggested Alternatives
                                    </Text>

                                    {item.alternateMedicines.map(
                                        (alt: any) => (
                                            <TouchableOpacity
                                                key={alt.id}
                                                style={{
                                                    backgroundColor: "#EFF6FF",
                                                    borderRadius: 12,
                                                    padding: 12,
                                                    marginBottom: 10,
                                                }}
                                                onPress={() =>
                                                    replaceMedicine(index, alt)
                                                }
                                            >
                                                <Text
                                                    style={{
                                                        fontWeight: "700",
                                                        color: "#1E3A8A",
                                                    }}
                                                >
                                                    {alt.name}
                                                </Text>

                                                <Text
                                                    style={{
                                                        color: "#64748B",
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    Salt : {alt.salt}
                                                </Text>

                                                <Text
                                                    style={{
                                                        color: "#16A34A",
                                                        marginTop: 4,
                                                    }}
                                                >
                                                    Stock : {alt.stock}
                                                </Text>

                                                <Text
                                                    style={{
                                                        color: "#2563EB",
                                                        marginTop: 8,
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    Replace Medicine
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    )}
                                </View>
                            )}

                        {!item.inStock &&
                            item.alternateMedicines.length === 0 && (
                                <View
                                    style={{
                                        backgroundColor: "#FEF2F2",
                                        padding: 14,
                                        borderRadius: 12,
                                        marginTop: 15,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#DC2626",
                                            fontWeight: "700",
                                        }}
                                    >
                                        No Alternate Medicine Available
                                    </Text>

                                    <Text
                                        style={{
                                            color: "#7F1D1D",
                                            marginTop: 5,
                                        }}
                                    >
                                        Bill cannot be generated until this
                                        medicine is available.
                                    </Text>
                                </View>
                            )}

                    </View>
                ))}
            </View>

            <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Bill</Text>
                <Text style={styles.totalValue}>Rs {total.toFixed(0)}</Text>
            </View>

            <TouchableOpacity style={styles.generateBtn} onPress={generateBill} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                    <><Ionicons name="receipt" size={20} color="#fff" /><Text style={styles.generateBtnText}>Generate Bill & Dispense</Text></>
                )}
            </TouchableOpacity>
            <View style={{ height: 60 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F4F7FC" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { backgroundColor: "#2563EB", paddingTop: 55, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
    headerSubTitle: { color: "#E5E7EB", marginTop: 5 },
    card: { backgroundColor: "#fff", margin: 15, borderRadius: 15, padding: 15, elevation: 3 },
    cardHeading: { fontSize: 17, fontWeight: "700", marginBottom: 12, color: "#1F2937" },
    infoText: { color: "#374151", marginBottom: 5 },
    medRow: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12, marginTop: 12 },
    medName: { fontSize: 16, fontWeight: "700", color: "#111827" },
    medSub: { color: "#6B7280", marginTop: 3, fontSize: 13 },
    warning: { color: "#DC2626", marginTop: 5, fontSize: 12, fontWeight: "600" },
    rowInputs: { flexDirection: "row", marginTop: 10 },
    label: { color: "#6B7280", marginBottom: 5, fontSize: 13, fontWeight: "600" },
    input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
    totalCard: { backgroundColor: "#fff", marginHorizontal: 15, borderRadius: 15, padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 3 },
    totalLabel: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
    totalValue: { fontSize: 24, fontWeight: "800", color: "#2563EB" },
    generateBtn: { backgroundColor: "#16A34A", marginHorizontal: 15, marginTop: 20, height: 55, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" },
    generateBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 },
});
