# CG-Mapper

**Coarse-grained molecule GUI — an all-atom → Martini 3 mapping tool.**

CG-Mapper is a browser app for building a **manual coarse-grained (CG) mapping**
of a molecule: you load an all-atom structure, group atoms into Martini 3 beads
with guidance, and export the mapping, the CG structure, and a Martini topology
(`.itp`). It is a mapping *assistant* — it proposes and formats, but you make the
scientific decisions.

---

## What it does

- **Load** a molecule from a **PDB file** or a **SMILES string** (SMILES is
  parsed with RDKit for real bond orders and aromaticity, then embedded in 3D).
- **View** the all-atom molecule in an interactive 3D viewer (3Dmol.js) with
  correct single/double/aromatic bonds.
- **Select** atoms by clicking them in the 3D view or the atom table (the two
  stay in sync).
- **Create Martini 3 beads** from a selection: choose bead **size** (Regular /
  Small / Tiny) and **type** (Q / P / N / C / X / W). Atoms may be **shared**
  between beads (as in real Martini ring mappings).
- **Get suggestions**: a bond-aware engine reads the selection's chemistry
  (functional groups, aromaticity, branching, charge) and suggests a bead size
  and type, with **example structures** from the Martini 3 framework. Suggestions
  never override your choice — you apply them when you want.
- **Export**:
  - **Mapping JSON** — save the bead definitions.
  - **CG structure** — `.pdb` (Å) or GROMACS `.gro` (nm), one particle per bead.
  - **Martini topology `.itp`** — atoms, bonds, constraints, angles, proper and
    improper dihedrals, and exclusions, derived from the atom-level connectivity.

> ℹ️ A reference-MD + Boltzmann-inversion workflow exists in the codebase but is
> **archived for now** (not shown in the UI). See *Roadmap* below.

---

## Quick start

Requirements: **Node.js 18+** (developed on Node 22).

```bash
git clone https://github.com/Namnabat-Mohsen/cg-mapper.git
cd cg-mapper
npm install
npm run dev
```

Open **http://localhost:3000**.

To build for production:

```bash
npm run build
npm start
```

RDKit (used for SMILES) is loaded on demand from a CDN at runtime, so SMILES
input needs an internet connection the first time it is used.

---

## How to use — step by step

The app is a 3-step wizard (top stepper).

### Step 1 — Load

Choose one:

- **Option A — PDB file.** Upload an all-atom `.pdb`. Bonds are inferred from
  geometry (covalent-radius cutoffs; short bonds flagged as double/aromatic).
- **Option B — SMILES string.** Type a SMILES (e.g. `CCO`, `c1ccccc1`,
  `CC(=O)Oc1ccccc1C(=O)O`) and press **Load**. RDKit adds hydrogens, assigns
  real bond orders and aromaticity, and generates a 3D conformer.

When a molecule loads you advance to step 2 automatically.

### Step 2 — Map beads

1. **Select atoms.** Click atom spheres in the 3D view, or rows in the **Atom
   list**. Selected atoms turn **yellow** in both places. A live counter shows
   how many are selected; **Clear** deselects all.
2. **Read the suggestion.** With atoms selected, a **Martini 3 suggestion** card
   appears: a recommended label (e.g. `TC5`), a confidence badge, the reasoning
   for size and type, detected features (aromatic ring, carbonyl, …), and
   example molecules for that bead class. Click **Use suggestion** to load it
   into the picker — or ignore it.
3. **Pick size and type.** Set the bead **Size** (R/S/T) and **Type** yourself
   in the picker; the combined Martini label is shown (e.g. `SP2`).
4. **Create the bead.** Click **Create bead** — a bead is placed at the
   geometric center of the selection, its atoms take the bead's color, and a
   translucent bead sphere appears in the 3D view.
5. **Edit in the mapping table.** Rename beads, change size/type/radius, and
   delete beads. The atom list's **Bead** column shows each atom's assignment
   (an atom shared between beads shows all of them).
6. Repeat until every atom you care about is assigned. The header shows
   *"N of M atoms assigned to K beads."*

The **📖 Martini 3 reference** button (top-right) opens a panel of bead sizes and
chemical types with example structures, any time you need it.

### Step 3 — Export

Three groups of downloads:

- **Mapping (JSON).** `Download .json` / `Copy` / `Preview`. Captures every bead
  (id, name, Martini size/type/label, atom serials, position, radius, color)
  plus counts and provenance.
- **CG structure.** `Download .pdb` (Å) or `Download .gro` (nm). One CG particle
  per bead, single residue.
- **CG topology (.itp).** `Download .itp`, with toggles for **Ring constraints**,
  **Proper dihedrals**, and **Planarity impropers**. See the topology notes
  below.

---

## The Martini topology (`.itp`)

Connectivity is derived from the atom-level bonds (which beads bond, form angles,
dihedrals). GROMACS function types used:

| Section | `funct` | Meaning |
|---|---|---|
| `[ bonds ]` | 1 | harmonic; length (nm), Kb |
| `[ constraints ]` | 1 | rigid; length (nm) — for rigid in-ring bonds |
| `[ angles ]` | 2 | Martini cosine angle; θ₀ (deg), Ka |
| `[ dihedrals ]` proper | 1 | periodic; φ₀ (deg), Kd, multiplicity |
| `[ dihedrals ]` improper | 2 | harmonic out-of-plane; ξ₀=0 for planarity |
| `[ exclusions ]` | — | pairwise within each rigid ring |

Rules:

- **Constraints** are used only for genuinely rigid rings — **aromatic** ring
  systems or **3-bead** rings (a triangle is rigid). Larger aliphatic rings stay
  flexible with `[ bonds ]` + `[ angles ]`.
- An **angle** is skipped only for a fully-constrained triangle (all three sides
  rigid), whose shape the constraints already fix.
- **Impropers** are added to keep aromatic ring systems of **≥ 4 beads** planar;
  fused/complex systems are flagged for manual handling rather than guessed.
- Bead **masses** follow Martini 3 by size (R = 72, S = 54, T = 36 amu).

> ⚠️ **This is a template topology.** Equilibrium values are measured from a
> single conformer, and **force constants are documented defaults**, not
> parametrized values. Validate and tune against a reference before production
> use. Q-type beads are written with charge 0 — set their charges manually.

---

## Tech stack

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS**
- **3Dmol.js** — 3D molecular viewer
- **RDKit (MinimalLib, WASM)** — SMILES parsing / chemistry
- **smiles-drawer** — 2D example structures

Project layout:

```
src/
  app/page.tsx            wizard UI (Load / Map / Export)
  components/             viewer, mapping table, suggestion card, reference, export, stepper, header
  lib/
    pdbParser, smiles, rdkit, embed3d   input + 3D
    chem, topology, geom3               bonds, term enumeration, geometry
    beads, suggest, martiniExamples     Martini data + suggestions
    exporters, itp                      JSON / PDB / GRO / topology
```

---

## Limitations

- Bead centers are **geometric** (mass/fractional weights for shared atoms are a
  future step).
- The SMILES 3D embedding is a fast in-browser conformer, not a full force-field
  minimization — good for defining mappings, not a substitute for MD.
- Bond/aromatic perception for PDB input is distance-based and can misclassify
  distorted geometries; SMILES input is more reliable.
- Best suited to small molecules; large/fused systems and proteins are not the
  current focus.

## Roadmap

- Re-enable the **reference-MD bundle + Boltzmann-inversion** workflow (fit
  bonded parameters from a trajectory) once it is validated end-to-end.
- Per-bead **charges**, **mass-weighted** centers and fractional weights.
- Load/import a saved mapping; validation panel; assisted auto-mapping.

---

*CG-Mapper is a mapping assistant. Its suggestions and generated topology are
starting points to validate — not a replacement for careful Martini
parametrization.*
