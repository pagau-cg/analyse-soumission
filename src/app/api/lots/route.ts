import { NextResponse } from "next/server";
import { listLots, saveLot, newId } from "@/lib/storage";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projetId = url.searchParams.get("projetId") || undefined;
  return NextResponse.json(await listLots(projetId));
}
export async function POST(req: Request) {
  const body = await req.json();
  const l = {
    id: newId(),
    projetId: body.projetId,
    nom: body.nom,
    specialite: body.specialite,
    devisRef: body.devisRef,
    budget: body.budget,
    createdAt: new Date().toISOString(),
  };
  await saveLot(l);
  return NextResponse.json(l);
}
