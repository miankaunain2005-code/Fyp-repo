import { Ionicons } from "@expo/vector-icons";
import {
    deleteDoc,
    doc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { db } from "@/src/config/firebaseConfig";
import { getAllLabTests, seedLabTests } from "@/src/utils/labService";

type Param = {
    name: string;
    unit: string;
    low: string;
    high: string;
};

type LabTest = {
    id: string;
    name?: string;
    category?: string;
    price?: number;
    active?: boolean;
    parameters?: {
        name?: string;
        unit?: string;
        low?: number | string | null;
        high?: number | string | null;
    }[];
};

const emptyParam = (): Param => ({
    name: "",
    unit: "",
    low: "",
    high: "",
});

export default function Catalog() {
    const [tests, setTests] = useState<LabTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [price, setPrice] = useState("");
    const [params, setParams] = useState<Param[]>([emptyParam()]);
    const [search, setSearch] = useState("");

    const load = async () => {
        try {
            setTests((await getAllLabTests()) as LabTest[]);
        } catch (error) {
            console.log("[catalog load]", error);
            Alert.alert("Unable to Load Tests", "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const startNew = () => {
        setEditId(null);
        setName("");
        setCategory("");
        setPrice("");
        setParams([emptyParam()]);
        setOpen(true);
    };

    const startEdit = (test: LabTest) => {
        setEditId(test.id);
        setName(test.name || "");
        setCategory(test.category || "");
        setPrice(String(test.price ?? ""));
        setParams(
            test.parameters?.length
                ? test.parameters.map((parameter) => ({
                    name: parameter.name || "",
                    unit: parameter.unit || "",
                    low:
                        parameter.low == null ? "" : String(parameter.low),
                    high:
                        parameter.high == null ? "" : String(parameter.high),
                }))
                : [emptyParam()]
        );
        setOpen(true);
    };

    const setParam = (index: number, key: keyof Param, value: string) => {
        setParams((current) =>
            current.map((parameter, i) =>
                i === index ? { ...parameter, [key]: value } : parameter
            )
        );
    };

    const moveParam = (index: number, direction: -1 | 1) => {
        setParams((current) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= current.length) return current;
            const copy = [...current];
            [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
            return copy;
        });
    };

    const save = async () => {
        if (!name.trim()) {
            Alert.alert("Required Field", "Please enter a test name.");
            return;
        }

        const numericPrice = Number(price);
        if (price.trim() === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
            Alert.alert("Invalid Price", "Please enter a valid price.");
            return;
        }

        const cleanParameters: {
            name: string;
            unit: string;
            low: number | null;
            high: number | null;
        }[] = [];

        for (const parameter of params) {
            if (!parameter.name.trim()) continue;

            const low =
                parameter.low.trim() === "" ? null : Number(parameter.low);
            const high =
                parameter.high.trim() === "" ? null : Number(parameter.high);

            if (
                (low !== null && !Number.isFinite(low)) ||
                (high !== null && !Number.isFinite(high))
            ) {
                Alert.alert(
                    "Invalid Range",
                    `Please enter valid numeric ranges for "${parameter.name}".`
                );
                return;
            }

            cleanParameters.push({
                name: parameter.name.trim(),
                unit: parameter.unit.trim(),
                low,
                high,
            });
        }

        if (cleanParameters.length === 0) {
            Alert.alert(
                "Required Field",
                "Please add at least one test parameter."
            );
            return;
        }

        setSaving(true);
        try {
            const id =
                editId ||
                `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;

            const existingTest = editId
                ? tests.find((test) => test.id === editId)
                : undefined;

            await setDoc(
                doc(db, "labTests", id),
                {
                    name: name.trim(),
                    category: category.trim() || "General",
                    price: numericPrice,
                    parameters: cleanParameters,
                    // Editing a test keeps its current status. New tests start active.
                    active: existingTest ? existingTest.active !== false : true,
                    ...(editId ? {} : { createdAt: serverTimestamp() }),
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            setOpen(false);
            await load();
            Alert.alert("Saved", "The lab test has been saved successfully.");
        } catch (error) {
            console.log("[catalog save]", error);
            Alert.alert(
                "Save Failed",
                "The test could not be saved. Check your Firestore rules and lab account role."
            );
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = (test: LabTest) => {
        const nextActive = test.active === false;

        Alert.alert(
            nextActive ? "Activate Test?" : "Deactivate Test?",
            nextActive
                ? "This test will be marked as available again."
                : "This test will be temporarily unavailable. You can activate it again later.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: nextActive ? "Activate" : "Deactivate",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, "labTests", test.id), {
                                active: nextActive,
                                updatedAt: serverTimestamp(),
                            });
                            await load();
                        } catch (error) {
                            console.log("[catalog status]", error);
                            Alert.alert("Update Failed", "The test status could not be changed.");
                        }
                    },
                },
            ]
        );
    };

    const deleteTest = (test: LabTest) => {
        Alert.alert(
            "Delete Test?",
            `“${test.name || "This test"}” will be removed from the lab test catalog. Patient orders and reports in other collections will not be deleted by this action. However, any screen that loads test details from this catalog may no longer find them.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Test",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "labTests", test.id));
                            setTests((current) => current.filter((item) => item.id !== test.id));
                            Alert.alert("Deleted", "The test was removed from the catalog.");
                        } catch (error) {
                            console.log("[catalog delete]", error);
                            Alert.alert(
                                "Delete Failed",
                                "The test could not be deleted. Confirm that your Firestore rules allow lab users to delete labTests."
                            );
                        }
                    },
                },
            ]
        );
    };

    const seed = async () => {
        try {
            await seedLabTests();
            await load();
            Alert.alert("Sample Tests Added", "Sample tests have been loaded.");
        } catch (error) {
            console.log("[catalog seed]", error);
            Alert.alert("Unable to Add Samples", "Please check your Firestore rules and try again.");
        }
    };

    const filteredTests = tests.filter((test) => {
        const searchText = search.trim().toLowerCase();
        if (!searchText) return true;
        return (
            (test.name || "").toLowerCase().includes(searchText) ||
            (test.category || "").toLowerCase().includes(searchText)
        );
    });

    return (
        <View style={styles.screen}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="flask" size={25} color="#FFFFFF" />
                    </View>
                    <Text style={styles.headerTitle}>Test Catalog</Text>
                    <Text style={styles.headerSubtitle}>
                        Manage your hospitals laboratory tests
                    </Text>
                    <View style={styles.headerSummary}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryNumber}>{tests.length}</Text>
                            <Text style={styles.summaryLabel}>Total tests</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryNumber}>
                                {tests.filter((test) => test.active !== false).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryNumber}>
                                {tests.filter((test) => test.active === false).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Inactive</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={startNew} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add New Test</Text>
                </TouchableOpacity>

                <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={20} color="#64748B" />
                    <TextInput
                        placeholder="Search by test name or category"
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                    {!!search && (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitle}>Laboratory Tests</Text>
                    <Text style={styles.sectionCount}>{filteredTests.length} tests</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color="#0D9488" />
                        <Text style={styles.mutedText}>Loading tests...</Text>
                    </View>
                ) : filteredTests.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="flask-outline" size={30} color="#0D9488" />
                        </View>
                        <Text style={styles.emptyTitle}>
                            {tests.length === 0 ? "No tests added yet" : "No matching tests"}
                        </Text>
                        <Text style={styles.emptyText}>
                            {tests.length === 0
                                ? "Add your first laboratory test to get started."
                                : "Try another test name or category."}
                        </Text>
                        {tests.length === 0 && (
                            <TouchableOpacity style={styles.sampleButton} onPress={seed}>
                                <Text style={styles.sampleButtonText}>Load Sample Tests</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    filteredTests.map((test) => {
                        const isActive = test.active !== false;
                        return (
                            <View key={test.id} style={styles.testCard}>
                                <View style={styles.cardTop}>
                                    <View style={styles.testIcon}>
                                        <Ionicons name="flask-outline" size={22} color="#0D9488" />
                                    </View>
                                    <View style={styles.testInfo}>
                                        <Text style={styles.testName}>{test.name || "Unnamed test"}</Text>
                                        <Text style={styles.testCategory}>{test.category || "General"}</Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            isActive ? styles.activeBadge : styles.inactiveBadge,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.statusDot,
                                                { backgroundColor: isActive ? "#059669" : "#D97706" },
                                            ]}
                                        />
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: isActive ? "#047857" : "#B45309" },
                                            ]}
                                        >
                                            {isActive ? "Active" : "Inactive"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.priceRow}>
                                    <View>
                                        <Text style={styles.priceLabel}>Test price</Text>
                                        <Text style={styles.priceValue}>
                                            Rs {Number(test.price || 0).toLocaleString("en-PK")}
                                        </Text>
                                    </View>
                                    <View style={styles.parameterCount}>
                                        <Ionicons name="list-outline" size={16} color="#64748B" />
                                        <Text style={styles.parameterCountText}>
                                            {test.parameters?.length || 0} parameters
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardActions}>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => startEdit(test)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="create-outline" size={18} color="#0D9488" />
                                        <Text style={styles.editButtonText}>Edit</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.statusButton}
                                        onPress={() => toggleActive(test)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={isActive ? "eye-off-outline" : "eye-outline"}
                                            size={18}
                                            color={isActive ? "#B45309" : "#047857"}
                                        />
                                        <Text
                                            style={[
                                                styles.statusButtonText,
                                                { color: isActive ? "#B45309" : "#047857" },
                                            ]}
                                        >
                                            {isActive ? "Deactivate" : "Activate"}
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => deleteTest(test)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}

                <View style={{ height: 36 }} />
            </ScrollView>

            <Modal
                visible={open}
                animationType="slide"
                onRequestClose={() => !saving && setOpen(false)}
            >
                <View style={styles.modalScreen}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.modalClose}
                            onPress={() => !saving && setOpen(false)}
                            disabled={saving}
                        >
                            <Ionicons name="close" size={23} color="#334155" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>
                                {editId ? "Edit Test" : "Add New Test"}
                            </Text>
                            <Text style={styles.modalSubtitle}>
                                Enter test details and result parameters
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.modalContent}
                    >
                        <Text style={styles.inputLabel}>Test name *</Text>
                        <TextInput
                            placeholder="e.g. Complete Blood Count (CBC)"
                            placeholderTextColor="#94A3B8"
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            autoCapitalize="words"
                        />

                        <Text style={styles.inputLabel}>Category</Text>
                        <TextInput
                            placeholder="e.g. Hematology"
                            placeholderTextColor="#94A3B8"
                            value={category}
                            onChangeText={setCategory}
                            style={styles.input}
                            autoCapitalize="words"
                        />

                        <Text style={styles.inputLabel}>Price (Rs) *</Text>
                        <TextInput
                            placeholder="Enter test price"
                            placeholderTextColor="#94A3B8"
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="decimal-pad"
                            style={styles.input}
                        />

                        <View style={styles.parameterHeading}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.parameterTitle}>Result Parameters *</Text>
                                <Text style={styles.parameterHint}>
                                    Add the fields that will appear in the test result.
                                </Text>
                            </View>
                            <View style={styles.parameterNumber}>
                                <Text style={styles.parameterNumberText}>{params.length}</Text>
                            </View>
                        </View>

                        <Text style={styles.rangeHint}>
                            Minimum and maximum ranges are optional for text-based results, such as color.
                        </Text>

                        {params.map((parameter, index) => (
                            <View key={index} style={styles.parameterCard}>
                                <View style={styles.parameterCardHeader}>
                                    <Text style={styles.parameterCardTitle}>
                                        Parameter {index + 1}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setParams((current) =>
                                                current.length === 1
                                                    ? [emptyParam()]
                                                    : current.filter((_, i) => i !== index)
                                            )
                                        }
                                        style={styles.removeParameter}
                                    >
                                        <Ionicons name="trash-outline" size={17} color="#DC2626" />
                                        <Text style={styles.removeParameterText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    placeholder="Parameter name (e.g. Hemoglobin)"
                                    placeholderTextColor="#94A3B8"
                                    value={parameter.name}
                                    onChangeText={(value) => setParam(index, "name", value)}
                                    style={styles.input}
                                />

                                <View style={styles.rangeRow}>
                                    <View style={{ flex: 1.1 }}>
                                        <Text style={styles.smallInputLabel}>Unit</Text>
                                        <TextInput
                                            placeholder="g/dL"
                                            placeholderTextColor="#94A3B8"
                                            value={parameter.unit}
                                            onChangeText={(value) => setParam(index, "unit", value)}
                                            style={styles.smallInput}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.smallInputLabel}>Minimum</Text>
                                        <TextInput
                                            placeholder="Optional"
                                            placeholderTextColor="#94A3B8"
                                            value={parameter.low}
                                            onChangeText={(value) => setParam(index, "low", value)}
                                            keyboardType="decimal-pad"
                                            style={styles.smallInput}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.smallInputLabel}>Maximum</Text>
                                        <TextInput
                                            placeholder="Optional"
                                            placeholderTextColor="#94A3B8"
                                            value={parameter.high}
                                            onChangeText={(value) => setParam(index, "high", value)}
                                            keyboardType="decimal-pad"
                                            style={styles.smallInput}
                                        />
                                    </View>
                                </View>

                                <View style={styles.reorderRow}>
                                    <TouchableOpacity
                                        onPress={() => moveParam(index, -1)}
                                        disabled={index === 0}
                                        style={[styles.reorderButton, index === 0 && styles.disabledButton]}
                                    >
                                        <Ionicons name="arrow-up" size={17} color="#475569" />
                                        <Text style={styles.reorderText}>Move up</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => moveParam(index, 1)}
                                        disabled={index === params.length - 1}
                                        style={[
                                            styles.reorderButton,
                                            index === params.length - 1 && styles.disabledButton,
                                        ]}
                                    >
                                        <Ionicons name="arrow-down" size={17} color="#475569" />
                                        <Text style={styles.reorderText}>Move down</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addParameterButton}
                            onPress={() => setParams((current) => [...current, emptyParam()])}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#0D9488" />
                            <Text style={styles.addParameterText}>Add Parameter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, saving && { opacity: 0.65 }]}
                            onPress={save}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
                                    <Text style={styles.saveButtonText}>
                                        {editId ? "Save Changes" : "Create Test"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => !saving && setOpen(false)}
                            style={styles.cancelButton}
                            disabled={saving}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <View style={{ height: 28 }} />
                    </ScrollView>
                </View>
            </Modal>
            <View style={{ height: 60 }}></View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#F1F5F9" },
    scrollContent: { paddingBottom: 18 },
    header: {
        backgroundColor: "#0F766E",
        paddingTop: 54,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: "rgba(255,255,255,0.17)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
    },
    headerTitle: { color: "#FFFFFF", fontSize: 27, fontWeight: "800" },
    headerSubtitle: { color: "#CCFBF1", fontSize: 13, marginTop: 5 },
    headerSummary: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 16,
        marginTop: 22,
        paddingVertical: 13,
    },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryNumber: { color: "#FFFFFF", fontSize: 21, fontWeight: "800" },
    summaryLabel: { color: "#CCFBF1", fontSize: 11, marginTop: 3 },
    summaryDivider: { width: 1, height: 31, backgroundColor: "rgba(255,255,255,0.25)" },
    addButton: {
        backgroundColor: "#0D9488",
        marginHorizontal: 16,
        marginTop: 17,
        marginBottom: 13,
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    addButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15, marginLeft: 8 },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 13,
        paddingHorizontal: 13,
        marginHorizontal: 16,
        minHeight: 49,
    },
    searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 9, color: "#0F172A", fontSize: 13 },
    sectionHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 18,
        marginTop: 23,
        marginBottom: 3,
    },
    sectionTitle: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
    sectionCount: { color: "#64748B", fontSize: 12, fontWeight: "600" },
    loadingBox: { alignItems: "center", paddingVertical: 45, gap: 12 },
    mutedText: { color: "#64748B", fontSize: 13 },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        marginHorizontal: 16,
        marginTop: 14,
        padding: 25,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    emptyIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: "#CCFBF1",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: { color: "#0F172A", fontSize: 16, fontWeight: "800", marginTop: 14 },
    emptyText: { color: "#64748B", textAlign: "center", fontSize: 13, marginTop: 6, lineHeight: 19 },
    sampleButton: { backgroundColor: "#475569", paddingHorizontal: 17, paddingVertical: 11, borderRadius: 10, marginTop: 17 },
    sampleButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
    testCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 17,
        padding: 15,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        elevation: 1,
    },
    cardTop: { flexDirection: "row", alignItems: "center" },
    testIcon: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: "#CCFBF1",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },
    testInfo: { flex: 1, paddingRight: 5 },
    testName: { color: "#0F172A", fontSize: 15, fontWeight: "800" },
    testCategory: { color: "#64748B", fontSize: 12, marginTop: 4 },
    statusBadge: { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
    activeBadge: { backgroundColor: "#D1FAE5" },
    inactiveBadge: { backgroundColor: "#FEF3C7" },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
    statusText: { fontSize: 11, fontWeight: "800" },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        marginTop: 15,
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    priceLabel: { color: "#64748B", fontSize: 11 },
    priceValue: { color: "#0F766E", fontSize: 20, fontWeight: "800", marginTop: 2 },
    parameterCount: { flexDirection: "row", alignItems: "center", gap: 5 },
    parameterCountText: { color: "#475569", fontSize: 12, fontWeight: "600" },
    cardActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 13,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    editButton: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, backgroundColor: "#CCFBF1", borderRadius: 10, paddingVertical: 10 },
    editButtonText: { color: "#0F766E", fontWeight: "800", fontSize: 12 },
    statusButton: { flex: 1.25, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, backgroundColor: "#FFFBEB", borderRadius: 10, paddingVertical: 10 },
    statusButtonText: { fontWeight: "800", fontSize: 12 },
    deleteButton: { flex: 0.9, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4, backgroundColor: "#FEF2F2", borderRadius: 10, paddingVertical: 10 },
    deleteButtonText: { color: "#DC2626", fontWeight: "800", fontSize: 12 },
    modalScreen: { flex: 1, backgroundColor: "#F8FAFC" },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 18,
        paddingTop: 48,
        paddingBottom: 17,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    modalClose: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 12 },
    modalTitle: { color: "#0F172A", fontSize: 21, fontWeight: "800" },
    modalSubtitle: { color: "#64748B", fontSize: 12, marginTop: 4 },
    modalContent: { padding: 18, paddingBottom: 35 },
    inputLabel: { color: "#334155", fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 7 },
    input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, color: "#0F172A", fontSize: 14, marginBottom: 12 },
    parameterHeading: { flexDirection: "row", alignItems: "center", marginTop: 13, marginBottom: 10 },
    parameterTitle: { color: "#0F172A", fontSize: 17, fontWeight: "800" },
    parameterHint: { color: "#64748B", fontSize: 12, marginTop: 4 },
    parameterNumber: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#CCFBF1", alignItems: "center", justifyContent: "center", marginLeft: 8 },
    parameterNumberText: { color: "#0F766E", fontWeight: "800" },
    rangeHint: { color: "#64748B", fontSize: 12, lineHeight: 18, marginBottom: 12 },
    parameterCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 12 },
    parameterCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    parameterCardTitle: { color: "#334155", fontSize: 13, fontWeight: "800" },
    removeParameter: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
    removeParameterText: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
    rangeRow: { flexDirection: "row", gap: 8 },
    smallInputLabel: { color: "#64748B", fontSize: 11, fontWeight: "700", marginBottom: 5 },
    smallInput: { minWidth: 0, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 11, color: "#0F172A", fontSize: 13, marginBottom: 10 },
    reorderRow: { flexDirection: "row", justifyContent: "flex-end", gap: 9 },
    reorderButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
    disabledButton: { opacity: 0.35 },
    reorderText: { color: "#475569", fontSize: 11, fontWeight: "700" },
    addParameterButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, borderWidth: 1.5, borderColor: "#0D9488", borderStyle: "dashed", borderRadius: 12, paddingVertical: 13, marginTop: 2 },
    addParameterText: { color: "#0D9488", fontSize: 13, fontWeight: "800" },
    saveButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: "#0D9488", minHeight: 52, borderRadius: 13, marginTop: 20 },
    saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    cancelButton: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
    cancelButtonText: { color: "#64748B", fontWeight: "700", fontSize: 14 },
});
