import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { collection, onSnapshot, orderBy, query, where, } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function PrescriptionHistory() {

    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [list, setList] = useState<any[]>([]);

    useEffect(() => {

        if (!user) return;

        const q = query(
            collection(db, "prescriptions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snapshot) => {

                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setList(data);
                setLoading(false);
            },
            (error) => {
                console.log(error);
                setLoading(false);
            }
        );

        return () => unsub();

    }, [user]);

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator
                    size="large"
                    color="#2563EB"
                />

                <Text style={styles.loadingText}>
                    Loading Prescription History...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >

            <View style={styles.header}>

                <Ionicons
                    name="document-text"
                    size={45}
                    color="#fff"
                />

                <Text style={styles.title}>
                    Prescription History
                </Text>

                <Text style={styles.subtitle}>
                    View all your previous prescriptions
                </Text>

            </View>

            {list.length === 0 ? (

                <View style={styles.emptyCard}>

                    <Ionicons
                        name="document-outline"
                        size={70}
                        color="#94A3B8"
                    />

                    <Text style={styles.emptyTitle}>
                        No Prescription Found
                    </Text>

                    <Text style={styles.emptySubTitle}>
                        Your prescriptions will appear here after doctor consultation.
                    </Text>

                </View>

            ) : (

                list.map((item: any) => (

                    <View
                        key={item.id}
                        style={styles.card}
                    >

                        <View style={styles.cardHeader}>

                            <Text style={styles.patientName}>
                                👤 {item.patientName}
                            </Text>



                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>
                                Patient ID
                            </Text>

                            <Text style={styles.value}>
                                {item.patientId}
                            </Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>
                                Doctor
                            </Text>

                            <Text style={styles.value}>
                                {item.doctorName}
                            </Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>
                                Date
                            </Text>

                            <Text style={styles.value}>
                                {item.date}
                            </Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>
                                Time
                            </Text>

                            <Text style={styles.value}>
                                {item.time}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={() =>
                                router.push({
                                    pathname: "/(main)/profile",
                                    params: {
                                        prescriptionId: item.id,
                                    },
                                })
                            }
                        >
                            <Ionicons
                                name="eye"
                                size={20}
                                color="#fff"
                            />

                            <Text style={styles.buttonText}>
                                View Prescription
                            </Text>
                        </TouchableOpacity>

                    </View>

                ))

            )}

            <View style={{ height: 30 }} />

        </ScrollView>
    );
}
const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F4F7FC",
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F7FC",
    },

    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: "#6B7280",
        fontWeight: "600",
    },

    header: {
        backgroundColor: "#2563EB",
        paddingTop: 55,
        paddingBottom: 30,
        alignItems: "center",
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },

    title: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "800",
        marginTop: 10,
    },

    subtitle: {
        color: "#E5E7EB",
        fontSize: 15,
        marginTop: 5,
        textAlign: "center",
        paddingHorizontal: 20,
    },

    emptyCard: {
        margin: 20,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        elevation: 4,
    },

    emptyTitle: {
        marginTop: 15,
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
    },

    emptySubTitle: {
        marginTop: 10,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
        fontSize: 15,
    },

    card: {
        backgroundColor: "#fff",
        marginHorizontal: 15,
        marginTop: 18,
        borderRadius: 18,
        padding: 18,
        elevation: 4,

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    cardHeader: {
        marginBottom: 18,
    },

    patientName: {
        fontSize: 19,
        fontWeight: "800",
        color: "#111827",
        flex: 1,
        marginRight: 10,
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },

    label: {
        color: "#6B7280",
        fontWeight: "600",
        fontSize: 15,
    },

    value: {
        color: "#111827",
        fontWeight: "700",
        fontSize: 15,
        flexShrink: 1,
        textAlign: "right",
    },

    button: {
        marginTop: 20,
        backgroundColor: "#2563EB",
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 8,
    },

});

