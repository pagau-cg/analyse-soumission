"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Soumission, Lot, Projet } from "@/lib/types";

export default function LotPage() {
  const { id, lotId } = useParams<{ id: string; lotId: string }>();
  const [projet, setProjet] = useState<Projet | null>(null);
  const [lot, setLot] = useState<Lot | null>(null);
  const [soumissions, setSoumissions] = useState<Soumission[]>([]);
  const [upload, setUpload] = useState(false);

  async function reload() {
    const projets = await (await fetch("/api/projets")).json();
    setProjet(projets.find((x: Projet) => x.id === id) || null);
    const lots = await (await fetch(`/api/lots?projetId=${id}`)).json();
    setLot(lots.find((x: Lot) => x.id === lotId) || null);
    const s = await (await fetch(`/api/soumissions?lotId=${lotId}`)).json();
    setSoumissions(s);
  }
  useEffect(() => { reload(); }, [id, lotId]);

  async function uploader(f: File) {
    setUpload(true);
    const fd = new FormData();
    fd.append("lotId", lotId);
    fd.append("fichier", f);
    try {
      await fetch("/api/soumissions", { method: "POST", body: fd });
    } finally {
      setUpload(false);
      reload();
    }
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cette soumission ?")) return;
    await fetch(`/api/soumissions?id=${id}`, { method: "DELETE" });
    reload();
  }

  if (!projet || !lot) return <div>Chargement…</div>;

  const prix = soumissions.map(s => s.prixAvantTaxes).filter((n): n is number => typeof n === "number");
  const med = prix.length ? [...prix].sort((a, b) => a - b)[Math.floor(prix.length / 2)] : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projets/${projet.id}`} className="text-sm text-slate-500">← {projet.numero} {projet.nom}</Link>
        <h1 className="text-2xl font-bold">{lot.nom}</h1>
        <p className="text-slate-500">
          {lot.specialite || "—"} • Devis : {lot.devisRef || "—"} • Budget : {lot.budget ? lot.budget.toLocaleString("fr-CA") + " $" : "—"}
        </p>
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Importer soumissions PDF</h2>
        <input type="file" accept="application/pdf" multiple onChange={async e => {
          const files = Array.from(e.target.files || []);
          for (const f of files) await uploader(f);
        }} />
        {upload && <div className="text-sm text-amber-700">Analyse en cours…</div>}
      </div>

      <div className="bg-white border rounded">
        <div className="p-4 flex items-center justify-between">
          <h2 className="font-semibold">Soumissions reçues ({soumissions.length})</h2>
          {soumissions.length > 1 && (
            <a href={`/api/rapport?lotId=${lotId}`} className="bg-slate-900 text-white px-4 py-2 rounded">Exporter rapport (.docx)</a>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">Fournisseur</th>
              <th className="text-right p-2">Prix avant tx</th>
              <th className="text-left p-2">Signataire</th>
              <th className="text-left p-2">Validité</th>
              <th className="text-left p-2">Drapeaux</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {soumissions.map(s => {
              const flags = computeFlags(s, med);
              return (
                <tr key={s.id} className="border-t align-top">
                  <td className="p-2 font-medium">{s.fournisseur || <span className="text-slate-400">en attente…</span>}</td>
                  <td className="p-2 text-right">{s.prixAvantTaxes ? s.prixAvantTaxes.toLocaleString("fr-CA") + " $" : "—"}</td>
                  <td className="p-2">{s.signataire || "—"}{s.ingenieur ? " (ing.)" : ""}</td>
                  <td className="p-2">{s.validiteJours ? s.validiteJours + " j" : "—"}</td>
                  <td className="p-2">
                    {flags.length === 0 ? <span className="text-green-700">—</span> : (
                      <ul className="list-disc pl-4 text-amber-800">{flags.map((f, i) => <li key={i}>{f}</li>)}</ul>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    <button className="text-red-700 text-xs" onClick={() => supprimer(s.id)}>Supprimer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        {soumissions.map(s => (
          <div key={s.id} className="bg-white border rounded p-4">
            <div className="font-semibold mb-2">{s.fournisseur || s.fichier}</div>
            {s.erreur && <div className="text-red-700 text-sm">Erreur : {s.erreur}</div>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500 text-xs mb-1">INCLUSIONS</div>
                <ul className="list-disc pl-4">{(s.inclusions || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">EXCLUSIONS</div>
                <ul className="list-disc pl-4">{(s.exclusions || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            </div>
            {s.referencesDevis && s.referencesDevis.length > 0 && (
              <div className="mt-2 text-sm"><span className="text-slate-500">Références : </span>{s.referencesDevis.join(", ")}</div>
            )}
            {s.conditionsPaiement && (
              <div className="text-sm"><span className="text-slate-500">Paiement : </span>{s.conditionsPaiement}</div>
            )}
            {s.notesComplementaires && (
              <div className="mt-2 text-sm italic text-slate-700">{s.notesComplementaires}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function computeFlags(s: Soumission, med: number): string[] {
  const flags: string[] = [];
  if (!s.ingenieur && s.statut === "extrait") flags.push("Non signée par un ingénieur");
  if (s.prixAvantTaxes && med && Math.abs(s.prixAvantTaxes - med) / med > 0.15) {
    flags.push(`Prix >15% vs médiane`);
  }
  if ((s.exclusions || []).some(e => /pas responsable|aucune garantie|sans garantie/i.test(e))) {
    flags.push("Clause de déresponsabilisation");
  }
  if (s.statut === "extrait" && !s.signataire) flags.push("Signataire non identifié");
  if (s.statut === "extrait" && (!s.validiteJours || s.validiteJours < 30)) flags.push("Validité < 30 j");
  return flags;
}
