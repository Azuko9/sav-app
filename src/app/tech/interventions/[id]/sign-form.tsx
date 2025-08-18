"use client";

import { useRef, useState, useEffect } from "react";
import { signAction } from "./sign-actions";

export default function SignForm({ id }: { id: string }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasStroke, setHasStroke] = useState(false);
    const [pending, setPending] = useState(false);

    // Resize canvas on mount for crisp lines
    useEffect(() => {
        const canvas = canvasRef.current!;
        const dpr = window.devicePixelRatio || 1;
        const width = Math.min(720, window.innerWidth - 48); // responsive
        const height = 200;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#111827"; // neutral-900
    }, []);

    function pos(e: React.MouseEvent | React.TouchEvent) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const p = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
        return { x: p.clientX - rect.left, y: p.clientY - rect.top };
    }

    function start(e: any) {
        e.preventDefault();
        setDrawing(true);
        setHasStroke(true);
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = pos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    function move(e: any) {
        if (!drawing) return;
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = pos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    function end() {
        setDrawing(false);
    }
    function clear() {
        const c = canvasRef.current!;
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        setHasStroke(false);
    }

    async function handleSubmit() {
        if (!hasStroke) return alert("Merci de dessiner une signature.");
        setPending(true);
        try {
            const dataUrl = canvasRef.current!.toDataURL("image/png");
            const res = await signAction(id, dataUrl);
            if (!res.ok) {
                alert(res.message || "Erreur lors de la signature.");
            }
            // signAction redirige côté serveur si OK
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="space-y-4">
            <div
                className="rounded-xl border bg-white p-3 select-none touch-none"
                onMouseLeave={end}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full h-[200px] bg-white rounded-md"
                    onMouseDown={start}
                    onMouseMove={move}
                    onMouseUp={end}
                    onTouchStart={start}
                    onTouchMove={move}
                    onTouchEnd={end}
                />
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={pending}
                    className="rounded-xl border px-4 py-2 hover:shadow disabled:opacity-50"
                >
                    {pending ? "Enregistrement…" : "Signer et verrouiller"}
                </button>
                <button
                    type="button"
                    onClick={clear}
                    className="rounded-xl border px-4 py-2 hover:shadow"
                >
                    Effacer
                </button>
            </div>

            <p className="text-xs text-neutral-500">
                En signant, la fiche passe à l’état <b>LOCKED</b> et n’est plus modifiable par le TECH.
            </p>
        </div>
    );
}
