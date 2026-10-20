import { NextResponse } from "next/server";
import { listSoumissions, saveSoumission, writePdfFromBuffer, newId, getLot, deleteSoumission } from "@/lib/storage";
import { extraireSoumission } from "@/lib/extraction";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lotId = url.searchParams.get("lotId") || undefined;
  return NextResponse.json(await listSoumissions(lotId));
}

export async function POST(req: Request) {
  const form = await req.formData();
  const lotId = String(form.get("lotId") || "");
  const file = form.get("fichier") as File | null;
  if (!lotId || !file) return NextResponse.json({ error: "lotId et fichier requis" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const chemin = await writePdfFromBuffer(buf, file.name);
  const soumission = {
    id: newId(),
    lotId,
    fichier: file.name,
    cheminPdf: chemin,
    statut: "attente_extraction" as const,
    createdAt: new Date().toISOString(),
  };
  await saveSoumission(soumission);

  // Extraction immédiate
  const lot = await getLot(lotId);
  if (!lot) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  try {
    const extrait = await extraireSoumission(soumission, lot);
    const majore = { ...soumission, ...extrait, statut: "extrait" as const, updatedAt: new Date().toISOString() };
    await saveSoumission(majore);
    return NextResponse.json(majore);
  } catch (e: any) {
    const err = { ...soumission, statut: "erreur" as const, erreur: e.message, updatedAt: new Date().toISOString() };
    await saveSoumission(err);
    return NextResponse.json(err, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await deleteSoumission(id);
  return NextResponse.json({ ok: true });
}
