import { NextResponse } from "next/server";
import { listProjets, saveProjet, newId } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(await listProjets());
}
export async function POST(req: Request) {
  const body = await req.json();
  const p = {
    id: newId(),
    numero: body.numero || "",
    nom: body.nom || "",
    estimateur: body.estimateur || "",
    createdAt: new Date().toISOString(),
  };
  await saveProjet(p);
  return NextResponse.json(p);
}
