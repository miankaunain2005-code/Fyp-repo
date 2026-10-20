import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useState } from "react";

export function useVoiceDictation(lang: string) {
    const [listening, setListening] = useState(false);
    const [text, setText] = useState("");
    const [interim, setInterim] = useState("");
    const [error, setError] = useState("");

    useSpeechRecognitionEvent("start", () => setListening(true));
    useSpeechRecognitionEvent("end", () => {
        setListening(false);
        setInterim("");
    });
    useSpeechRecognitionEvent("result", (e: any) => {
        const t: string = e.results?.[0]?.transcript ?? "";
        if (e.isFinal) {
            setText((p) => (p + " " + t).trim());
            setInterim("");
        } else {
            setInterim(t);
        }
    });
    useSpeechRecognitionEvent("error", (e: any) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        setError(`${e.error}: ${e.message || ""}`);
    });

    const start = async () => {
        try {
            const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!perm.granted) {
                setError("Mic ki permission nahi mili. Settings se allow karein.");
                return;
            }
            setError("");
            ExpoSpeechRecognitionModule.start({
                lang,
                interimResults: true,
                continuous: true,
            });
        } catch (e: any) {
            setError(e?.message || "Recording shuru nahi hui.");
        }
    };

    const stop = () => {
        try { ExpoSpeechRecognitionModule.stop(); } catch { }
    };
    const abort = () => {
        try { ExpoSpeechRecognitionModule.abort(); } catch { }
    };

    return { listening, text, setText, interim, error, start, stop, abort };
}