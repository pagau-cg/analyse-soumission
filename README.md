# Soumission ST — v2 (prototype simplifié)

Analyse comparative + validation vs devis pour les soumissions ST reçues par courriel.
Objectif : 1 à 2 pages par lot, rapide, standard.

## Mise en route

1. Copier `.env.local.example` en `.env.local` et renseigner `ANTHROPIC_API_KEY`.
2. `npm install`
3. `npm run dev` (port 3100)
4. Ouvrir http://localhost:3100

## Flux

1. Créer un projet (n° + nom)
2. Créer un lot (nom + spécialité + sections devis attendues + budget)
3. Uploader les PDF des soumissions reçues
4. Les champs clés sont extraits automatiquement (fournisseur, prix, inclusions/exclusions, signataire, références)
5. Les drapeaux rouges se calculent (prix >15% médiane, non signé par ing., clauses atypiques, etc.)
6. Exporter le rapport Word (.docx) : tableau comparatif + fiches synthèse + validation vs devis

## Ce qui a été volontairement laissé de côté

- Annotation PDF couleur par thème
- Matrice de couverture graphique
- Mode Opus "analyse en profondeur"
- Fiches longues par fournisseur
- Import BSDQ consolidé

Peut être rajouté plus tard si vraiment utile. Pour l'instant, on garde simple.
