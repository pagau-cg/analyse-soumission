import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, BorderStyle } from "docx";
import type { Lot, Projet, Soumission } from "./types";

function p(text: string, opts: { bold?: boolean; size?: number } = {}) {
  return new Paragraph({ children: [new TextRun({ text, bold: opts.bold, size: opts.size || 20 })] });
}
function h(text: string, level: HeadingLevel = HeadingLevel.HEADING_1) {
  return new Paragraph({ text, heading: level });
}
function cell(text: string, opts: { bold?: boolean; shade?: string; size?: number } = {}) {
  return new TableCell({
    shading: opts.shade ? { fill: opts.shade } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold, size: opts.size || 18 })] })],
  });
}

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "888888" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER, insideHorizontal: BORDER, insideVertical: BORDER };

export async function genererRapport(
  projet: Projet,
  lot: Lot,
  soumissions: Soumission[],
  drapeaux: Record<string, string[]>,
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(h(`Analyse comparative — ${projet.numero} ${projet.nom}`, HeadingLevel.TITLE));
  children.push(p(`Lot : ${lot.nom}${lot.specialite ? " (" + lot.specialite + ")" : ""}`, { bold: true }));
  children.push(p(`Date : ${new Date().toLocaleDateString("fr-CA")}  —  Estimateur : ${projet.estimateur || "—"}`));
  if (lot.budget) children.push(p(`Budget alloué : ${lot.budget.toLocaleString("fr-CA")} $`));
  children.push(p(""));

  // Tableau comparatif
  children.push(h("Tableau comparatif", HeadingLevel.HEADING_2));
  const headers = ["Fournisseur", "Prix avant tx", "Signataire", "Validité", "Drapeaux"];
  const rows: TableRow[] = [
    new TableRow({ children: headers.map(h => cell(h, { bold: true, shade: "e5e7eb" })) }),
    ...soumissions.map(s => new TableRow({
      children: [
        cell(s.fournisseur || "—", { bold: true }),
        cell(s.prixAvantTaxes != null ? s.prixAvantTaxes.toLocaleString("fr-CA") + " $" : "—"),
        cell((s.signataire || "—") + (s.ingenieur ? " (ing.)" : "")),
        cell(s.validiteJours ? s.validiteJours + " j" : "—"),
        cell((drapeaux[s.id] || []).join(" • ") || "—", { shade: (drapeaux[s.id] || []).length ? "fef3c7" : undefined }),
      ],
    })),
  ];
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERS,
    rows,
  });
  (children as any[]).push(table);
  children.push(p(""));

  // Fiches par soumissionnaire (synthèse courte)
  children.push(h("Détails par soumissionnaire", HeadingLevel.HEADING_2));
  for (const s of soumissions) {
    children.push(h(s.fournisseur || "Fournisseur inconnu", HeadingLevel.HEADING_3));
    children.push(p(`Prix : ${s.prixAvantTaxes != null ? s.prixAvantTaxes.toLocaleString("fr-CA") + " $ avant taxes" : "—"}${s.prixApresTaxes ? " / " + s.prixApresTaxes.toLocaleString("fr-CA") + " $ après taxes" : ""}`));
    if (s.signataire) children.push(p(`Signé par : ${s.signataire}${s.ingenieur ? " (ingénieur)" : ""}`));
    if (s.conditionsPaiement) children.push(p(`Paiement : ${s.conditionsPaiement}`));
    if (s.referencesDevis && s.referencesDevis.length) children.push(p(`Références : ${s.referencesDevis.join(", ")}`));
    if (s.inclusions && s.inclusions.length) {
      children.push(p("Inclusions :", { bold: true }));
      for (const inc of s.inclusions) children.push(p("• " + inc));
    }
    if (s.exclusions && s.exclusions.length) {
      children.push(p("Exclusions :", { bold: true }));
      for (const exc of s.exclusions) children.push(p("• " + exc));
    }
    if ((drapeaux[s.id] || []).length) {
      children.push(p("Drapeaux rouges :", { bold: true }));
      for (const f of drapeaux[s.id]) children.push(p("⚠ " + f));
    }
    if (s.notesComplementaires) children.push(p(`Notes : ${s.notesComplementaires}`));
    children.push(p(""));
  }

  // Validation vs devis
  if (lot.devisRef) {
    children.push(h("Validation vs documents d'appel d'offres", HeadingLevel.HEADING_2));
    children.push(p(`Sections attendues : ${lot.devisRef}`));
    children.push(p("Vérification manuelle de la couverture par soumissionnaire à effectuer avant émission."));
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}
