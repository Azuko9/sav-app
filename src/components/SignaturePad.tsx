"use client";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "react";

export default function SignaturePad({
    value, onChange,
}: { value: string | null; onChange: (v: string | null) => void }) {
    const ref = useRef<SignatureCanvas | null>(null);
    return (
        <div className="space-y-2">
            <div className="border rounded bg-white inline-block">
                <SignatureCanvas
                    ref={(c) => { ref.current = c; }}
                    penColor="black"
                    canvasProps={{ width: 600, height: 180 }}
                    onEnd={() => onChange(ref.current?.toDataURL("image/png") ?? null)}
                />
            </div>
            <div className="flex gap-2">
                <button className="border rounded px-3 py-1 text-sm" onClick={() => { ref.current?.clear(); onChange(null); }}>
                    Effacer
                </button>
            </div>
        </div>
    );
}

