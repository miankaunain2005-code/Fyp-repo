import { findMedicineInInventory, InventoryMedicine } from "./medicineMatch";

export type ParsedMedicine = {
    medicineName: string;
    dosage: string;
    quantity: string;
    duration: string;
    instructions: string;
    morning: boolean;
    afternoon: boolean;
    night: boolean;
    matched: boolean;
    stock: number | null;
    issues: string[];
};

export type ParsedVoice = {
    symptoms: string;
    diagnosis: string;
    notes: string;
    medicines: ParsedMedicine[];
};

const NUM: Record<string, number> = {
    one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, four: 4, char: 4, chaar: 4,
    five: 5, panch: 5, paanch: 5, six: 6, chhe: 6, seven: 7, saat: 7,
    eight: 8, aath: 8, nine: 9, nau: 9, ten: 10, das: 10,
};
const N = "(\\d+|" + Object.keys(NUM).join("|") + ")";
const toNum = (t: string) => (/^\d+$/.test(t) ? parseInt(t, 10) : NUM[t] ?? 1);

const DUR_SRC = `\\b(?:for\\s+)?${N}\\s*(days?|din|dino|weeks?|hafta|hafte|haftay|months?|mahina|mahine)\\b`;
const QTY_SRC = `\\b${N}\\s*(?:tablets?|tabs?|capsules?|caps?|goli|golia|golian|pills?)\\b`;
const TIMES_SRC = `\\b${N}\\s*(?:times?|baar|dafa)\\b`;
const DOSE = /\b(\d+(?:\.\d+)?)\s*(mg|milligrams?|mcg|micrograms?|ml|gm|grams?|g)\b/i;
const MORN = /\b(morning|subah|subha)\b/i;
const AFT = /\b(afternoon|noon|dopahar|dophar|duphar)\b/i;
const NIGHT = /\b(night|raat|evening|shaam|sham|bedtime)\b/i;
const AFTER = /\b(after\s*(?:meals?|food|eating)|khane\s*ke\s*baad)\b/i;
const BEFORE = /\b(before\s*(?:meals?|food)|khane\s*se\s*pehle|empty\s*stomach|khali\s*pait)\b/i;
const WITH = /\bwith\s*(food|water|milk)\b/i;
const TAIL = /^\s*(?:after\s*(?:meals?|food|eating)|before\s*(?:meals?|food)|with\s*(?:food|water|milk)|khane\s*ke\s*baad|khane\s*se\s*pehle)/i;
const MARKERS = /\b(symptoms?|complaints?|diagnosis|clinical\s+notes?|notes?|medicines?|medications?|prescription|prescribe|rx|alamat|alamaat|tashkhees|dawai|dawaiyan)\b/gi;

type Key = "symptoms" | "diagnosis" | "notes" | "medicines";
const keyOf = (w: string): Key => {
    const x = w.toLowerCase();
    if (/^(symptom|complaint|alamat|alamaat)/.test(x)) return "symptoms";
    if (/^(diagnos|tashkhees)/.test(x)) return "diagnosis";
    if (/note/.test(x)) return "notes";
    return "medicines";
};

const cap = (s: string) => {
    const t = s.replace(/\s+/g, " ").trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
};
const title = (s: string) =>
    s.split(" ").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const idx = (re: RegExp, s: string) => {
    const m = re.exec(s);
    return m ? m.index : -1;
};

function chunkMedicines(t: string): string[] {
    const out: string[] = [];
    for (const piece of t.split(/\b(?:next|then|phir|another|agla|agli)\b/i)) {
        let rest = piece.trim();
        while (rest) {
            const m = new RegExp(DUR_SRC, "i").exec(rest);
            if (!m) { out.push(rest); break; }
            let end = m.index + m[0].length;
            const tail = TAIL.exec(rest.slice(end));
            if (tail) end += tail[0].length;
            out.push(rest.slice(0, end).trim());
            rest = rest.slice(end).trim();
        }
    }
    return out.filter((c) => c.length > 1);
}

function frequency(c: string): number {
    if (/\b(thrice|tds|tid|teen\s*baar)\b/i.test(c)) return 3;
    if (/\b(twice|bd|bid|do\s*baar)\b/i.test(c)) return 2;
    if (/\b(qid)\b/i.test(c)) return 4;
    const t = new RegExp(TIMES_SRC, "i").exec(c);
    if (t) return toNum(t[1]);
    if (/\b(once|od|ek\s*baar)\b/i.test(c)) return 1;
    return 0;
}

function parseChunk(c: string, inventory: InventoryMedicine[]): ParsedMedicine | null {
    const dur = new RegExp(DUR_SRC, "i").exec(c);
    const qty = new RegExp(QTY_SRC, "i").exec(c);
    const dose = DOSE.exec(c);

    let duration = "";
    if (dur) {
        const n = toNum(dur[1]);
        const u = dur[2].toLowerCase()[0];
        const days = u === "w" || u === "h" ? n * 7 : u === "m" ? n * 30 : n;
        duration = `${days} Days`;
    }

    let dosage = "";
    if (dose) {
        const u = dose[2].toLowerCase();
        const unit = u.startsWith("milli") ? "mg" : u.startsWith("micro") ? "mcg"
            : u === "gm" || u.startsWith("gram") ? "g" : u;
        dosage = `${dose[1]} ${unit}`;
    }

    let quantity = "1 Tablet";
    if (qty) {
        const n = toNum(qty[1]);
        quantity = `${n} ${n === 1 ? "Tablet" : "Tablets"}`;
    }

    let morning = MORN.test(c);
    let afternoon = AFT.test(c);
    let night = NIGHT.test(c);
    if (!morning && !afternoon && !night) {
        const f = frequency(c);
        if (f === 1) morning = true;
        else if (f === 2) { morning = true; night = true; }
        else if (f >= 3) { morning = true; afternoon = true; night = true; }
    }

    const ins: string[] = [];
    if (AFTER.test(c)) ins.push("After Meal");
    if (BEFORE.test(c)) ins.push("Before Meal");
    const w = WITH.exec(c);
    if (w) ins.push(`With ${cap(w[1])}`);

    // Naam = pehle keyword se pehle ka hissa
    const positions = [
        dur?.index ?? -1, qty?.index ?? -1, dose?.index ?? -1,
        idx(MORN, c), idx(AFT, c), idx(NIGHT, c), idx(AFTER, c), idx(BEFORE, c), idx(WITH, c),
        idx(/\b(once|twice|thrice|od|bd|bid|tds|tid|qid)\b/i, c),
        idx(new RegExp(TIMES_SRC, "i"), c),
    ].filter((i) => i >= 0);
    let name = (positions.length ? c.slice(0, Math.min(...positions)) : c).trim();
    while (/^(?:and|also|give|prescribe|add|take|tablet|tab|capsule|cap|syrup|injection|please|medicine|medicines)\s+/i.test(name)) {
        name = name.replace(/^(?:and|also|give|prescribe|add|take|tablet|tab|capsule|cap|syrup|injection|please|medicine|medicines)\s+/i, "");
    }
    name = name.replace(/\s+(?:tablets?|tabs?|capsules?|caps?)$/i, "").trim();

    if (!name && !duration && !dosage) return null;

    const hit = name ? findMedicineInInventory(name, inventory) : undefined;
    const stock = hit ? Number(hit.stock || 0) : null;
    const issues: string[] = [];
    if (!name) issues.push("Dawai ka naam nahi mila");
    else if (!hit) issues.push("Inventory mein nahi (phir bhi likh sakte hain)");
    else if ((stock ?? 0) <= 0) issues.push("Out of stock (pharmacy alternative degi)");
    if (!duration) issues.push("Din nahi mile");
    if (!morning && !afternoon && !night) issues.push("Timing nahi mili");

    return {
        medicineName: hit ? hit.name : title(name),
        dosage, quantity, duration,
        instructions: ins.join(", "),
        morning, afternoon, night,
        matched: !!hit, stock, issues,
    };
}

export function parseVoice(raw: string, inventory: InventoryMedicine[]): ParsedVoice {
    const text = raw
        .toLowerCase()
        .replace(/[,;:!?]/g, " ")
        .replace(/\.(\s|$)/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const sec: Record<Key, string> = { symptoms: "", diagnosis: "", notes: "", medicines: "" };

    const re = new RegExp(MARKERS.source, "gi");
    const marks: { key: Key; start: number; end: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        marks.push({ key: keyOf(m[1]), start: m.index, end: m.index + m[0].length });
    }

    if (marks.length === 0) {
        sec.medicines = text;
    } else {
        sec.symptoms = text.slice(0, marks[0].start).trim();
        marks.forEach((mk, i) => {
            const next = marks[i + 1]?.start ?? text.length;
            sec[mk.key] = (sec[mk.key] + " " + text.slice(mk.end, next)).trim();
        });
    }

    const medicines = chunkMedicines(sec.medicines)
        .map((c) => parseChunk(c, inventory))
        .filter((x): x is ParsedMedicine => !!x);

    return {
        symptoms: cap(sec.symptoms),
        diagnosis: cap(sec.diagnosis),
        notes: cap(sec.notes),
        medicines,
    };
}