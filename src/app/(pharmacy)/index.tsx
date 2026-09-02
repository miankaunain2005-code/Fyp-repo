import SideDrawer from "@/src/components/SideDrawer";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
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

export default function PharmacyDashboard() {
    const { user } = useAuth();

    const pharmacyName =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Pharmacist";

    const [drawerVisible, setDrawerVisible] = useState(false);

    const [loading, setLoading] = useState(true);

    const [pending, setPending] = useState<any[]>([]);
    const [results, setResults] = useState<any[] | null>(null);

    const [search, setSearch] = useState("");

    const [todayBills, setTodayBills] = useState(0);
    const [inventoryCount, setInventoryCount] = useState(0);

    const loadDashboard = async () => {
        setLoading(true);

        try {
            // Pending Prescriptions
            const prescriptionQuery = query(
                collection(db, "prescriptions"),
                where("dispensedAtPharmacy", "==", false)
            );

            const prescriptionSnap = await getDocs(
                prescriptionQuery
            );

            const pendingData = prescriptionSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPending(pendingData);

            // Bills

            try {
                const billSnap = await getDocs(
                    collection(db, "bills")
                );

                setTodayBills(billSnap.size);
            } catch { }

            // Medicines

            try {
                const medSnap = await getDocs(
                    collection(db, "medicines")
                );

                setInventoryCount(medSnap.size);
            } catch { }
        } catch (error) {
            console.log(error);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const searchPatient = () => {
        if (!search.trim()) {
            setResults(null);
            return;
        }

        const term = search.toLowerCase();

        setResults(
            pending.filter(
                (item: any) =>
                    item.patientId
                        ?.toLowerCase()
                        .includes(term) ||
                    item.patientName
                        ?.toLowerCase()
                        .includes(term) ||
                    item.phone?.includes(search)
            )
        );
    };

    const list =
        results !== null ? results : pending;

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}

            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>
                        MediCare AI
                    </Text>

                    <Text style={styles.subtitle}>
                        Pharmacy Dashboard
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.menuBtn}
                    onPress={() => setDrawerVisible(true)}
                >
                    <Ionicons
                        name="menu"
                        size={24}
                        color="#2563EB"
                    />
                </TouchableOpacity>
            </View>

            {/* WELCOME CARD */}

            <View style={styles.welcomeCard}>
                <View>
                    <Text style={styles.welcome}>
                        Welcome Back 👋
                    </Text>

                    <Text style={styles.pharmacyName}>
                        {pharmacyName}
                    </Text>

                    <Text style={styles.pendingText}>
                        {pending.length} Pending
                        Prescriptions
                    </Text>
                </View>

                <MaterialCommunityIcons
                    name="pill"
                    size={70}
                    color="#ffffff55"
                />
            </View>

            {/* SEARCH */}

            <View style={styles.searchBox}>
                <Ionicons
                    name="search"
                    size={20}
                    color="#64748B"
                />

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search Patient ID / Name / Phone"
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                />

                <TouchableOpacity
                    onPress={searchPatient}
                >
                    <Ionicons
                        name="arrow-forward-circle"
                        size={34}
                        color="#2563EB"
                    />
                </TouchableOpacity>
            </View>

            {/* STATS */}

            <View style={styles.statsRow}>

                <View style={styles.statCard}>
                    <Ionicons
                        name="document-text"
                        size={30}
                        color="#2563EB"
                    />

                    <Text style={styles.statNumber}>
                        {pending.length}
                    </Text>

                    <Text style={styles.statTitle}>
                        Pending
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons
                        name="receipt"
                        size={30}
                        color="#16A34A"
                    />

                    <Text style={styles.statNumber}>
                        {todayBills}
                    </Text>

                    <Text style={styles.statTitle}>
                        Bills
                    </Text>
                </View>

            </View>

            <View style={styles.statsRow}>

                <View style={styles.statCard}>
                    <MaterialCommunityIcons
                        name="pill"
                        size={30}
                        color="#F59E0B"
                    />

                    <Text style={styles.statNumber}>
                        {inventoryCount}
                    </Text>

                    <Text style={styles.statTitle}>
                        Medicines
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Ionicons
                        name="people"
                        size={30}
                        color="#8B5CF6"
                    />

                    <Text style={styles.statNumber}>
                        {pending.length}
                    </Text>

                    <Text style={styles.statTitle}>
                        Patients
                    </Text>
                </View>

            </View>

            {/* QUICK ACTIONS */}

            <Text style={styles.sectionTitle}>
                Quick Actions
            </Text>

            <View style={styles.actionRow}>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        router.push(
                            "/(pharmacy)/bill-history"
                        )
                    }
                >
                    <Ionicons
                        name="receipt-outline"
                        size={28}
                        color="#2563EB"
                    />

                    <Text style={styles.actionText}>
                        Bill History
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        router.push(
                            "/(pharmacy)/prescription-history"
                        )
                    }
                >
                    <Ionicons
                        name="document-text-outline"
                        size={28}
                        color="#16A34A"
                    />

                    <Text style={styles.actionText}>
                        Prescriptions
                    </Text>
                </TouchableOpacity>

            </View>

            <View style={styles.actionRow}>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() =>
                        router.push(
                            "/(pharmacy)/inventory"
                        )
                    }
                >
                    <MaterialCommunityIcons
                        name="pill"
                        size={28}
                        color="#F59E0B"
                    />

                    <Text style={styles.actionText}>
                        Inventory
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={loadDashboard}
                >
                    <Ionicons
                        name="refresh"
                        size={28}
                        color="#8B5CF6"
                    />

                    <Text style={styles.actionText}>
                        Refresh
                    </Text>
                </TouchableOpacity>

            </View>

            <Text style={styles.sectionTitle}>
                Pending Prescriptions
            </Text>
            {loading ? (
                <ActivityIndicator
                    size="large"
                    color="#2563EB"
                    style={{ marginTop: 40 }}
                />
            ) : list.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons
                        name="document-text-outline"
                        size={70}
                        color="#CBD5E1"
                    />

                    <Text style={styles.emptyTitle}>
                        No Pending Prescriptions
                    </Text>

                    <Text style={styles.emptySub}>
                        All prescriptions have been dispensed.
                    </Text>
                </View>
            ) : (
                list.map((item: any) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        onPress={() =>
                            router.push({
                                pathname:
                                    "/(pharmacy)/prescription-history",
                                params: {
                                    prescriptionId: item.id,
                                },
                            })
                        }
                    >
                        <View style={styles.avatar}>
                            <Ionicons
                                name="person"
                                size={26}
                                color="#2563EB"
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>
                                {item.patientName}
                            </Text>

                            <Text style={styles.info}>
                                Patient ID : {item.patientId}
                            </Text>

                            <Text style={styles.info}>
                                Phone : {item.phone}
                            </Text>

                            <Text style={styles.info}>
                                Doctor : {item.doctorName}
                            </Text>
                        </View>

                        <Ionicons
                            name="chevron-forward"
                            size={24}
                            color="#94A3B8"
                        />
                    </TouchableOpacity>
                ))
            )}

            <View style={{ height: 90 }} />

            <SideDrawer
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                name={pharmacyName}
                roleLabel="Pharmacy"
                accentColor="#F59E0B"
                menuItems={[
                    {
                        icon: "document-text-outline",
                        label: "Pending Prescriptions",
                        onPress: () => { },
                    },
                    {
                        icon: "receipt-outline",
                        label: "Bill History",
                        onPress: () =>
                            router.push("/(pharmacy)/bill-history"),
                    },
                    {
                        icon: "time-outline",
                        label: "Prescription History",
                        onPress: () =>
                            router.push(
                                "/(pharmacy)/prescription-history"
                            ),
                    },
                    {
                        icon: "medkit-outline",
                        label: "Medicine Inventory",
                        onPress: () =>
                            router.push(
                                "/(pharmacy)/inventory"
                            ),
                    },
                ]}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EEF5FF",
        paddingHorizontal: 20,
    },

    header: {
        marginTop: 60,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    logo: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E3A8A",
    },

    subtitle: {
        color: "#64748B",
        marginTop: 3,
        fontSize: 15,
    },

    menuBtn: {
        width: 52,
        height: 52,
        backgroundColor: "#fff",
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
        elevation: 5,
    },

    welcomeCard: {
        backgroundColor: "#2563EB",
        borderRadius: 24,
        padding: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
    },

    welcome: {
        color: "#fff",
        fontSize: 16,
    },

    pharmacyName: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "700",
        marginTop: 4,
    },

    pendingText: {
        color: "#DBEAFE",
        marginTop: 10,
        fontSize: 15,
    },

    searchBox: {
        backgroundColor: "#fff",
        height: 58,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        elevation: 4,
    },

    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 18,
    },

    statCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 18,
        alignItems: "center",
        paddingVertical: 22,
        elevation: 4,
    },

    statNumber: {
        fontSize: 24,
        fontWeight: "700",
        marginTop: 10,
        color: "#0F172A",
    },

    statTitle: {
        color: "#64748B",
        marginTop: 6,
    },

    sectionTitle: {
        fontSize: 21,
        fontWeight: "700",
        color: "#0F172A",
        marginTop: 28,
        marginBottom: 14,
    },

    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    actionCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 18,
        alignItems: "center",
        paddingVertical: 20,
        elevation: 4,
    },

    actionText: {
        marginTop: 10,
        fontWeight: "600",
        color: "#334155",
        textAlign: "center",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
        elevation: 4,
    },

    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },

    name: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
    },

    info: {
        marginTop: 4,
        color: "#64748B",
        fontSize: 13,
    },

    emptyContainer: {
        alignItems: "center",
        marginTop: 70,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#475569",
        marginTop: 15,
    },

    emptySub: {
        marginTop: 8,
        color: "#94A3B8",
        textAlign: "center",
        paddingHorizontal: 25,
    },
});