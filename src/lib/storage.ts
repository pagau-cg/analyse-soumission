import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Projet, Lot, Soumission, ID } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJETS = path.join(DATA_DIR, "projets.json");
const LOTS = path.join(DATA_DIR, "lots.json");
const SOUMISSIONS = path.join(DATA_DIR, "soumissions.json");
const PDF_DIR = path.join(DATA_DIR, "pdf");

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(PDF_DIR, { recursive: true });
  for (const f of [PROJETS, LOTS, SOUMISSIONS]) {
    try { await fs.access(f); } catch { await fs.writeFile(f, "[]"); }
  }
}

async function readAll<T>(file: string): Promise<T[]> {
  await ensure();
  return JSON.parse(await fs.readFile(file, "utf8"));
}
async function writeAll<T>(file: string, items: T[]): Promise<void> {
  await fs.writeFile(file, JSON.stringify(items, null, 2));
}

export const newId = (): ID => crypto.randomUUID();

export async function listProjets(): Promise<Projet[]> { return readAll(PROJETS); }
export async function getProjet(id: ID) { return (await listProjets()).find(p => p.id === id); }
export async function saveProjet(p: Projet) {
  const all = await listProjets();
  const i = all.findIndex(x => x.id === p.id);
  if (i >= 0) all[i] = p; else all.push(p);
  await writeAll(PROJETS, all);
}

export async function listLots(projetId?: ID): Promise<Lot[]> {
  const all = await readAll<Lot>(LOTS);
  return projetId ? all.filter(l => l.projetId === projetId) : all;
}
export async function getLot(id: ID) { return (await listLots()).find(l => l.id === id); }
export async function saveLot(l: Lot) {
  const all = await listLots();
  const i = all.findIndex(x => x.id === l.id);
  if (i >= 0) all[i] = l; else all.push(l);
  await writeAll(LOTS, all);
}

export async function listSoumissions(lotId?: ID): Promise<Soumission[]> {
  const all = await readAll<Soumission>(SOUMISSIONS);
  return lotId ? all.filter(s => s.lotId === lotId) : all;
}
export async function getSoumission(id: ID) { return (await listSoumissions()).find(s => s.id === id); }
export async function saveSoumission(s: Soumission) {
  const all = await listSoumissions();
  const i = all.findIndex(x => x.id === s.id);
  if (i >= 0) all[i] = s; else all.push(s);
  await writeAll(SOUMISSIONS, all);
}
export async function deleteSoumission(id: ID) {
  const all = (await listSoumissions()).filter(s => s.id !== id);
  await writeAll(SOUMISSIONS, all);
}

export async function savePdf(sourcePath: string, nomOrig: string): Promise<string> {
  await ensure();
  const dest = path.join(PDF_DIR, `${newId()}-${path.basename(nomOrig)}`);
  await fs.copyFile(sourcePath, dest);
  return dest;
}
export async function writePdfFromBuffer(buf: Buffer, nomOrig: string): Promise<string> {
  await ensure();
  const dest = path.join(PDF_DIR, `${newId()}-${path.basename(nomOrig)}`);
  await fs.writeFile(dest, buf);
  return dest;
}
