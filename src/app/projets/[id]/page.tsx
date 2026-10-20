"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Lot, Projet } from "@/lib/types";

export default function ProjetPage() {
  const { id } = useParams<{ id: string }>();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [nom, setNom] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [devisRef, setDevisRef] = useState("");
  const [budget, setBudget] = useState<string>("");

  async function reload() {
    const p = await (await fetch("/api/projets")).json();
    setProjet(p.find((x: Projet) => x.id === id) || null);
    const l = await (await fetch(`/api/lots?projetId=${id}`)).json();
    setLots(l);
  }
  useEffect(() => { reload(); }, [id]);

  async function creerLot() {
    if (!nom) return;
    await fetch("/api/lots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projetId: id, nom, specialite, devisRef, budget: budget ? Number(budget) : undefined }) });
    setNom(""); setSpecialite(""); setDevisRef(""); setBudget("");
    reload();
  }

  if (!projet) return <div>Chargement…</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-500">← Projets</Link>
        <h1 className="text-2xl font-bold">{projet.numero} — {projet.nom}</h1>
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Nouveau lot</h2>
        <div className="grid grid-cols-4 gap-3">
          <input className="border p-2 rounded" placeholder="Nom du lot" value={nom} onChange={e => setNom(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Spécialité (ex 08 44 13)" value={specialite} onChange={e => setSpecialite(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Sections devis attendues" value={devisRef} onChange={e => setDevisRef(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Budget $" value={budget} onChange={e => setBudget(e.target.value)} />
        </div>
        <button onClick={creerLot} className="bg-slate-900 text-white px-4 py-2 rounded">Créer</button>
      </div>

      <div className="bg-white border rounded divide-y">
        {lots.length === 0 && <div className="p-4 text-slate-500">Aucun lot</div>}
        {lots.map(l => (
          <Link key={l.id} href={`/projets/${projet.id}/lots/${l.id}`} className="block p-4 hover:bg-slate-50">
            <div className="font-semibold">{l.nom}</div>
            <div className="text-sm text-slate-500">
              {l.specialite || "—"} • Devis : {l.devisRef || "—"} • Budget : {l.budget ? l.budget.toLocaleString("fr-CA") + " $" : "—"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
