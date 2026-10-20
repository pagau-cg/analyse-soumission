"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Projet } from "@/lib/types";

export default function Home() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [numero, setNumero] = useState("");
  const [nom, setNom] = useState("");
  const [estimateur, setEstimateur] = useState("");

  async function reload() {
    const r = await fetch("/api/projets");
    setProjets(await r.json());
  }
  useEffect(() => { reload(); }, []);

  async function creer() {
    if (!numero || !nom) return;
    await fetch("/api/projets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ numero, nom, estimateur }) });
    setNumero(""); setNom(""); setEstimateur("");
    reload();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projets</h1>

      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Nouveau projet</h2>
        <div className="grid grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="N° projet (ex 24-042)" value={numero} onChange={e => setNumero(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Estimateur" value={estimateur} onChange={e => setEstimateur(e.target.value)} />
        </div>
        <button onClick={creer} className="bg-slate-900 text-white px-4 py-2 rounded">Créer</button>
      </div>

      <div className="bg-white border rounded divide-y">
        {projets.length === 0 && <div className="p-4 text-slate-500">Aucun projet</div>}
        {projets.map(p => (
          <Link key={p.id} href={`/projets/${p.id}`} className="block p-4 hover:bg-slate-50">
            <div className="font-semibold">{p.numero} — {p.nom}</div>
            <div className="text-sm text-slate-500">Estimateur : {p.estimateur || "—"}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
