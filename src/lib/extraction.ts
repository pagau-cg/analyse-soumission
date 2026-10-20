import fs from "node:fs/promises";
import { getClient, MODEL } from "./anthropic";
import type { Soumission, Lot } from "./types";

const EXTRACTION_TOOL = {
  name: "enregistrer_extraction",
  description: "Enregistre les champs extraits d'une soumission de sous-traitant",
  input_schema: {
    type: "object" as const,
    properties: {
      fournisseur: { type: "string", description: "Nom de l'entreprise soumissionnaire" },
      dateSoumission: { type: "string", description: "Date de la soumission (AAAA-MM-JJ si possible)" },
      prixAvantTaxes: { type: "number", description: "Prix total avant taxes en dollars (nombre, sans symboles)" },
      prixApresTaxes: { type: "number", description: "Prix total après taxes en dollars" },
      validiteJours: { type: "number", description: "Nombre de jours de validité de la soumission" },
      signataire: { type: "string", description: "Nom de la personne qui signe la soumission" },
      ingenieur: { type: "boolean", description: "Vrai si le signataire est un ingénieur (titre ing. présent)" },
      inclusions: {
        type: "array",
        items: { type: "string" },
        description: "Liste des éléments inclus (clauses, portée, items). Concis et factuel.",
      },
      exclusions: {
        type: "array",
        items: { type: "string" },
        description: "Liste des éléments explicitement exclus ou non inclus.",
      },
      referencesDevis: {
        type: "array",
        items: { type: "string" },
        description: "Sections du devis et plans référencés (ex: '08 44 13', 'Plan A-101', 'Addenda 1').",
      },
      conditionsPaiement: { type: "string", description: "Conditions de paiement (ex: 'Net 30', '30% commande', escomptes)" },
      notesComplementaires: { type: "string", description: "1 à 3 phrases max résumant tout élément notable non couvert ailleurs" },
    },
    required: ["fournisseur", "inclusions", "exclusions"],
  },
} as const;

export async function extraireSoumission(soumission: Soumission, lot: Lot): Promise<Partial<Soumission>> {
  const pdfBuffer = await fs.readFile(soumission.cheminPdf);
  const pdfBase64 = pdfBuffer.toString("base64");

  const client = getClient();
  const sys = `Tu es un analyste d'estimation chez Construction Gauthier. Tu reçois une soumission d'un sous-traitant pour le lot "${lot.nom}" (devis attendu : ${lot.devisRef || "non spécifié"}). Extrais les champs demandés de façon factuelle, concise, sans paraphraser. Ne pas inventer de chiffres.`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: sys,
    tools: [EXTRACTION_TOOL as any],
    tool_choice: { type: "tool", name: "enregistrer_extraction" } as any,
    messages: [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
        } as any,
        { type: "text", text: "Analyse cette soumission et enregistre les champs extraits avec l'outil fourni." },
      ],
    }],
  });

  const toolUse = resp.content.find((b: any) => b.type === "tool_use") as any;
  if (!toolUse) throw new Error("Pas de résultat tool_use retourné par le modèle");
  return toolUse.input as Partial<Soumission>;
}

export function calculerDrapeauxRouges(soumissions: any[]): Record<string, string[]> {
  const prix = soumissions.map((s: any) => s.prixAvantTaxes).filter((n: any) => typeof n === "number") as number[];
  const med = median(prix);
  const result: Record<string, string[]> = {};
  for (const s of soumissions as any[]) {
    const flags: string[] = [];
    if (!s.ingenieur) flags.push("Non signée par un ingénieur");
    if (s.prixAvantTaxes && med && Math.abs(s.prixAvantTaxes - med) / med > 0.15) {
      flags.push(`Prix écart >15% vs médiane (${Math.round(med).toLocaleString("fr-CA")} $)`);
    }
    if ((s.exclusions || []).some((e: string) => /pas responsable|aucune garantie|sans garantie/i.test(e))) {
      flags.push("Clause de déresponsabilisation détectée");
    }
    if (!s.signataire) flags.push("Signataire non identifié");
    if (!s.validiteJours || s.validiteJours < 30) flags.push("Validité < 30 jours ou absente");
    result[s.id] = flags;
  }
  return result;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
