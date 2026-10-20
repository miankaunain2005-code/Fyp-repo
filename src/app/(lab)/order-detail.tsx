import LabReportView from "@/src/components/LabReportView";
import { db } from "@/src/config/firebaseConfig";
import { useAuth } from "@/src/context/AuthContext";
import { computeFlag, getLabTests, orderTotal, toOrderTest } from "@/src/utils/labService";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";

const LOCK_MS = 20 * 60 * 1000;
const isFresh = (o: any) => !!o?.lockedBy && Date.now() - (o.lockedAtMs || 0) < LOCK_MS;

export default function LabOrderDetail() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { user, profile } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [tests, setTests] = useState<any[]>([]);
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [catalog, setCatalog] = useState<any[]>([]);
    const editing = useRef(false);
    const busy = useRef(false);
    const iHoldLock = useRef(false);

    // custom field modal
    const [fieldFor, setFieldFor] = useState<number | null>(null);
    const [fName, setFName] = useState("");
    const [fUnit, setFUnit] = useState("");
    const [fLow, setFLow] = useState("");
    const [fHigh, setFHigh] = useState("");
    const [fSave, setFSave] = useState(true);

    // ---------- live order ----------
    useEffect(() => {
        if (!orderId) return;
        const unsub = onSnapshot(
            doc(db, "labOrders", orderId),
            (s) => {
                if (s.exists()) {
                    const d: any = { id: s.id, ...s.data() };
                    setOrder(d);
                    if (!editing.current) {
                        setTests(d.tests || []);
                        setRemarks(d.remarks || "");
                    }
                }
                setLoading(false);
            },
            (e) => { console.log("[lab-detail]", e.code); setLoading(false); },
        );
        return () => unsub();
    }, [orderId]);

    // ---------- lock ----------
    useEffect(() => {
        if (!orderId || !user?.uid) return;
        const ref = doc(db, "labOrders", orderId);
        let timer: any;

        (async () => {
            try {
                await runTransaction(db, async (tx) => {
                    const snap = await tx.get(ref);
                    if (!snap.exists()) return;
                    const d: any = snap.data();
                    if (d.status === "Report Ready" || d.status === "Delivered") return;
                    if (isFresh(d) && d.lockedBy !== user.uid) {
                        throw new Error("LOCKED:" + (d.lockedByName || "Doosra technician"));
                    }
                    tx.update(ref, {
                        lockedBy: user.uid,
                        lockedByName: profile?.name || "Lab",
                        lockedAtMs: Date.now(),
                    });
                    iHoldLock.current = true;
                });
                if (iHoldLock.current) {
                    timer = setInterval(() => {
                        updateDoc(ref, { lockedAtMs: Date.now() }).catch(() => { });
                    }, 5 * 60 * 1000);
                }
            } catch (e: any) {
                if (String(e?.message).startsWith("LOCKED:")) {
                    Alert.alert(
                        "Order Busy",
                        `${String(e.message).replace("LOCKED:", "")} is order par kaam kar raha hai. Aap kisi aur order par kaam karein.`,
                    );
                } else {
                    console.log("[lab-lock]", e);
                }
            }
        })();

        return () => {
            clearInterval(timer);
            if (iHoldLock.current) {
                iHoldLock.current = false;
                updateDoc(ref, { lockedBy: "", lockedByName: "", lockedAtMs: 0 }).catch(() => { });
            }
        };
    }, [orderId, user?.uid]);

    const locked = order?.status === "Report Ready" || order?.status === "Delivered";
    const lockedByOther = !!order && isFresh(order) && order.lockedBy !== user?.uid && !locked;
    const readOnly = locked || lockedByOther;
    const total = orderTotal(tests);

    const setValue = (ti: number, pi: number, v: string) => {
        editing.current = true;
        setTests((prev) =>
            prev.map((t, i) =>
                i !== ti ? t : {
                    ...t,
                    parameters: t.parameters.map((p: any, j: number) =>
                        j !== pi ? p : { ...p, value: v, flag: computeFlag(v, p.low, p.high) }),
                }),
        );
    };

    const update = async (data: any) => {
        await updateDoc(doc(db, "labOrders", order.id), data);
    };

    const collectSample = async () => {
        try {
            await update({
                status: "Sample Collected", sampleAt: serverTimestamp(),
                technicianId: user?.uid || "", technicianName: profile?.name || "Lab",
            });
        } catch { Alert.alert("Error", "Update nahi hua."); }
    };

    const openAdd = async () => {
        setCatalog(await getLabTests());
        setAddOpen(true);
    };

    const addTest = async (t: any) => {
        if (tests.some((x) => x.testId === t.id)) {
            Alert.alert("Pehle se hai", "Ye test order mein maujood hai.");
            return;
        }
        const next = [...tests, toOrderTest(t)];
        setTests(next);
        setAddOpen(false);
        try { await update({ tests: next, total: orderTotal(next) }); }
        catch { Alert.alert("Error", "Test add nahi hua."); }
    };

    const removeTest = async (i: number) => {
        const next = tests.filter((_, idx) => idx !== i);
        setTests(next);
        try { await update({ tests: next, total: orderTotal(next) }); } catch { }
    };

    const togglePaid = async () => {
        try { await update({ paid: !order.paid }); } catch { }
    };

    const saveDraft = async () => {
        try {
            await update({ tests, remarks, total, status: order.status === "Requested" ? order.status : "Processing" });
            editing.current = false;
            Alert.alert("Saved", "Draft save ho gaya.");
        } catch { Alert.alert("Error", "Save nahi hua."); }
    };

    const markReady = async () => {
        if (busy.current) return;
        if (order.status === "Report Ready" || order.status === "Delivered") {
            Alert.alert("Pehle se Ready", "Ye report kisi aur ne ready kar di hai.");
            return;
        }
        if (tests.length === 0) {
            Alert.alert("Tests nahi", "Pehle test add karein.");
            return;
        }
        const empty = tests.some((t) => t.parameters.some((p: any) => !String(p.value || "").trim()));
        if (empty) {
            Alert.alert("Adhoori Report", "Har parameter ki value bharein.");
            return;
        }
        busy.current = true;
        setSaving(true);
        try {
            await update({
                tests, remarks, total, status: "Report Ready", readyAt: serverTimestamp(),
                technicianId: user?.uid || "", technicianName: profile?.name || "Lab",
                lockedBy: "", lockedByName: "", lockedAtMs: 0,
            });
            editing.current = false;
            iHoldLock.current = false;
            Alert.alert("Report Ready ✅", "Report patient ki app mein aur lab history mein save ho gayi.");
        } catch { Alert.alert("Error", "Report save nahi hui."); }
        finally { busy.current = false; setSaving(false); }
    };

    const markDelivered = async () => {
        try { await update({ status: "Delivered", deliveredAt: serverTimestamp() }); } catch { }
    };

    // ---------- custom field ----------
    const addField = async () => {
        if (fieldFor === null) return;
        if (!fName.trim()) { Alert.alert("Required", "Field ka naam likhein."); return; }
        const low = fLow.trim() === "" ? null : Number(fLow);
        const high = fHigh.trim() === "" ? null : Number(fHigh);
        if ((low !== null && isNaN(low)) || (high !== null && isNaN(high))) {
            Alert.alert("Galat", "Range mein sirf number likhein.");
            return;
        }
        const param = { name: fName.trim(), unit: fUnit.trim(), low, high, value: "", flag: "", custom: true };
        const target = tests[fieldFor];

        if ((target.parameters || []).some((p: any) => p.name.toLowerCase() === param.name.toLowerCase())) {
            Alert.alert("Pehle se hai", "Is naam ki field maujood hai.");
            return;
        }

        const next = tests.map((t, i) =>
            i === fieldFor ? { ...t, parameters: [...t.parameters, param] } : t);
        setTests(next);

        try {
            await update({ tests: next });
            if (fSave && target.testId) {
                const cat = (await getLabTests()).find((c: any) => c.id === target.testId);
                if (cat && !(cat.parameters || []).some((p: any) => p.name.toLowerCase() === param.name.toLowerCase())) {
                    await updateDoc(doc(db, "labTests", target.testId), {
                        parameters: [...(cat.parameters || []), { name: param.name, unit: param.unit, low, high }],
                    });
                }
            }
        } catch { Alert.alert("Error", "Field save nahi hui."); }

        setFieldFor(null); setFName(""); setFUnit(""); setFLow(""); setFHigh("");
    };

    const removeField = async (ti: number, pi: number) => {
        const next = tests.map((t, i) =>
            i === ti ? { ...t, parameters: t.parameters.filter((_: any, j: number) => j !== pi) } : t);
        setTests(next);
        try { await update({ tests: next }); } catch { }
    };

    if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#0D9488" /></View>;
    if (!order) return <View style={s.center}><Text>Order nahi mila.</Text></View>;

    const flagColor = (f: string) => (f === "High" ? "#DC2626" : f === "Low" ? "#D97706" : "#16A34A");

    return (
        <ScrollView style={s.c} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={s.header}>
                <TouchableOpacity style={s.back} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ marginLeft: 14 }}>
                    <Text style={s.title}>{order.orderNo}</Text>
                    <Text style={{ color: "#DDD6FE" }}>{order.status}</Text>
                </View>
            </View>

            {lockedByOther && (
                <View style={{ backgroundColor: "#FEE2E2", marginHorizontal: 15, marginTop: 14, borderRadius: 12, padding: 12 }}>
                    <Text style={{ color: "#991B1B", fontWeight: "700" }}>
                        🔒 {order.lockedByName} is order par kaam kar raha hai. Aap sirf dekh sakte hain.
                    </Text>
                </View>
            )}

            <View style={s.card}>
                <Text style={s.h}>👤 {order.patientName}</Text>
                <Text style={s.info}>Patient ID: {order.patientId} • {order.phone}</Text>
                <Text style={s.info}>{order.gender} • Age {order.age}</Text>
                {order.source === "doctor" && <Text style={s.info}>👨‍⚕️ Dr. {order.doctorName} ne likha</Text>}
                {!!order.requestedNotes && (
                    <View style={s.note}><Text style={{ fontWeight: "700" }}>Doctor ke notes</Text><Text>{order.requestedNotes}</Text></View>
                )}
            </View>

            {order.status === "Requested" && !readOnly && (
                <TouchableOpacity style={s.btn} onPress={collectSample}>
                    <Text style={s.btnT}>🩸 Sample Collected</Text>
                </TouchableOpacity>
            )}

            {tests.map((t, ti) => (
                <View key={ti} style={s.card}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={s.h}>{t.name}</Text>
                        {!readOnly && order.status === "Requested" && (
                            <TouchableOpacity onPress={() => removeTest(ti)}><Ionicons name="trash-outline" size={20} color="#DC2626" /></TouchableOpacity>
                        )}
                    </View>
                    {t.parameters.map((p: any, pi: number) => (
                        <View key={pi} style={s.prow}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontWeight: "600" }}>{p.name}</Text>
                                <Text style={s.info}>
                                    {p.low != null || p.high != null ? `Normal: ${p.low ?? ""} - ${p.high ?? ""}` : "Text result"} {p.unit}
                                </Text>
                                {p.custom && !readOnly && (
                                    <TouchableOpacity onPress={() => removeField(ti, pi)}>
                                        <Text style={{ color: "#DC2626", fontSize: 12 }}>Hatayein</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                value={String(p.value || "")}
                                onChangeText={(v) => setValue(ti, pi, v)}
                                editable={!readOnly && order.status !== "Requested"}
                                keyboardType={p.low != null || p.high != null ? "decimal-pad" : "default"}
                                placeholder="-"
                                style={[s.val, (readOnly || order.status === "Requested") && { backgroundColor: "#F1F5F9" }]}
                            />
                            {!!p.flag && <Text style={{ width: 56, textAlign: "right", fontWeight: "800", color: flagColor(p.flag) }}>{p.flag}</Text>}
                        </View>
                    ))}
                    {!readOnly && (
                        <TouchableOpacity onPress={() => setFieldFor(ti)} style={{ marginTop: 10 }}>
                            <Text style={{ color: "#0D9488", fontWeight: "700" }}>+ Field Add Karein</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            {!readOnly && (
                <TouchableOpacity style={s.ghost} onPress={openAdd}>
                    <Ionicons name="add" size={20} color="#0D9488" />
                    <Text style={{ color: "#0D9488", fontWeight: "700", marginLeft: 6 }}>Aur Test Add Karein</Text>
                </TouchableOpacity>
            )}

            <View style={s.card}>
                <Text style={s.h}>Remarks</Text>
                <TextInput
                    value={remarks}
                    onChangeText={(v) => { editing.current = true; setRemarks(v); }}
                    editable={!readOnly}
                    multiline
                    placeholder="Technician ka note (optional)"
                    style={[s.input, { minHeight: 70, textAlignVertical: "top" }]}
                />
            </View>

            <View style={s.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={s.h}>Bill: Rs {total}</Text>
                    <TouchableOpacity
                        onPress={togglePaid}
                        disabled={readOnly}
                        style={[s.paid, order.paid && { backgroundColor: "#DCFCE7" }]}
                    >
                        <Text style={{ fontWeight: "700", color: order.paid ? "#16A34A" : "#D97706" }}>{order.paid ? "Paid ✅" : "Mark Paid"}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {!readOnly && order.status !== "Requested" && (
                <>
                    <TouchableOpacity style={[s.btn, { backgroundColor: "#475569" }]} onPress={saveDraft}>
                        <Text style={s.btnT}>Save Draft</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, { backgroundColor: "#16A34A" }]} onPress={markReady} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnT}>✅ Report Ready (Dispense)</Text>}
                    </TouchableOpacity>
                </>
            )}
            {order.status === "Report Ready" && (
                <TouchableOpacity style={[s.btn, { backgroundColor: "#2563EB" }]} onPress={markDelivered}>
                    <Text style={s.btnT}>Mark Delivered</Text>
                </TouchableOpacity>

            )}
            {locked && <LabReportView order={order} />}
            {/* Test add modal */}
            <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, maxHeight: "70%" }}>
                        <Text style={s.h}>Test Chunein</Text>
                        <ScrollView>
                            {catalog.map((t) => (
                                <TouchableOpacity key={t.id} style={s.pick} onPress={() => addTest(t)}>
                                    <Text style={{ flex: 1, fontWeight: "600" }}>{t.name}</Text>
                                    <Text>Rs {t.price}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity onPress={() => setAddOpen(false)} style={{ alignItems: "center", marginTop: 12 }}>
                            <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom field modal */}
            <Modal visible={fieldFor !== null} transparent animationType="fade" onRequestClose={() => setFieldFor(null)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 18 }}>
                        <Text style={s.h}>Nayi Field</Text>
                        <TextInput placeholder="Naam (e.g. MCV)" value={fName} onChangeText={setFName} style={[s.input, { marginBottom: 8 }]} />
                        <TextInput placeholder="Unit (e.g. fL)" value={fUnit} onChangeText={setFUnit} style={[s.input, { marginBottom: 8 }]} />
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <TextInput placeholder="Normal se" value={fLow} onChangeText={setFLow} keyboardType="decimal-pad" style={[s.input, { flex: 1 }]} />
                            <TextInput placeholder="Normal tak" value={fHigh} onChangeText={setFHigh} keyboardType="decimal-pad" style={[s.input, { flex: 1 }]} />
                        </View>
                        <TouchableOpacity onPress={() => setFSave(!fSave)} style={{ marginTop: 12 }}>
                            <Text>{fSave ? "✅" : "⬜"} Catalog mein bhi save karein (agli baar khud aaye)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.btn, { marginHorizontal: 0 }]} onPress={addField}>
                            <Text style={s.btnT}>Add Karein</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setFieldFor(null)} style={{ alignItems: "center", marginTop: 12 }}>
                            <Text style={{ color: "#64748B", fontWeight: "700" }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const s = StyleSheet.create({
    c: { flex: 1, backgroundColor: "#F5F3FF" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { backgroundColor: "#0D9488", paddingTop: 55, paddingBottom: 22, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#ffffff30", justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 20, fontWeight: "800" },
    card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 14, borderRadius: 15, padding: 15, elevation: 3 },
    h: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
    info: { color: "#64748B", marginTop: 2, fontSize: 13 },
    note: { backgroundColor: "#FEF3C7", borderRadius: 10, padding: 10, marginTop: 10 },
    btn: { backgroundColor: "#0D9488", marginHorizontal: 15, marginTop: 14, height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    btnT: { color: "#fff", fontWeight: "700", fontSize: 16 },
    prow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
    val: { width: 90, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 8, textAlign: "center", marginHorizontal: 8 },
    ghost: { marginHorizontal: 15, marginTop: 14, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: "#0D9488", borderStyle: "dashed", flexDirection: "row", justifyContent: "center", alignItems: "center" },
    input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12 },
    paid: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: "#FEF3C7" },
    pick: { flexDirection: "row", padding: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
});