import { NextResponse } from "next/server";
import { getLot, getProjet, listSoumissions } from "@/lib/storage";
import { calculerDrapeauxRouges } from "@/lib/extraction";
import { genererRapport } from "@/lib/rapport";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lotId = url.searchParams.get("lotId");
  if (!lotId) return NextResponse.json({ error: "lotId requis" }, { status: 400 });
  const lot = await getLot(lotId);
  if (!lot) return NextResponse.json({ error: "Lot introuvable" }, { status: 404 });
  const projet = await getProjet(lot.projetId);
  if (!projet) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  const soumissions = await listSoumissions(lotId);
  const drapeaux = calculerDrapeauxRouges(soumissions);
  for (const s of soumissions) s.drapeauxRouges = drapeaux[s.id] || [];
  const buf = await genererRapport(projet, lot, soumissions, drapeaux);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Analyse-${projet.numero}-${lot.nom.replace(/[^\w-]+/g, "_")}.docx"`,
    },
  });
}
