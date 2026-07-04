import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FlaskConical, Search, Loader2, Plus, X, ChevronRight,
} from "lucide-react";
import SmilesDrawer from "smiles-drawer";

// ─── ALL CLASS 11 & 12 COMPOUNDS ───────────────────────────────────────────
const CATEGORIES: { label: string; compounds: { name: string; smiles: string; formula?: string }[] }[] = [
  {
    label: "Alkanes",
    compounds: [
      { name: "Methane", smiles: "C", formula: "CH₄" },
      { name: "Ethane", smiles: "CC", formula: "C₂H₆" },
      { name: "Propane", smiles: "CCC", formula: "C₃H₈" },
      { name: "Butane", smiles: "CCCC", formula: "C₄H₁₀" },
      { name: "Isobutane", smiles: "CC(C)C", formula: "C₄H₁₀" },
      { name: "Pentane", smiles: "CCCCC", formula: "C₅H₁₂" },
      { name: "Isopentane", smiles: "CCC(C)C", formula: "C₅H₁₂" },
      { name: "Neopentane", smiles: "CC(C)(C)C", formula: "C₅H₁₂" },
      { name: "Hexane", smiles: "CCCCCC", formula: "C₆H₁₄" },
      { name: "Heptane", smiles: "CCCCCCC", formula: "C₇H₁₆" },
      { name: "Octane", smiles: "CCCCCCCC", formula: "C₈H₁₈" },
      { name: "Cyclopentane", smiles: "C1CCCC1", formula: "C₅H₁₀" },
      { name: "Cyclohexane", smiles: "C1CCCCC1", formula: "C₆H₁₂" },
      { name: "Methylcyclohexane", smiles: "CC1CCCCC1" },
    ],
  },
  {
    label: "Alkenes",
    compounds: [
      { name: "Ethene", smiles: "C=C", formula: "C₂H₄" },
      { name: "Propene", smiles: "CC=C", formula: "C₃H₆" },
      { name: "But-1-ene", smiles: "CCC=C", formula: "C₄H₈" },
      { name: "But-2-ene (cis)", smiles: "C(/C=C/C)", formula: "C₄H₈" },
      { name: "Isobutylene", smiles: "CC(=C)C", formula: "C₄H₈" },
      { name: "1,3-Butadiene", smiles: "C=CC=C", formula: "C₄H₆" },
      { name: "Isoprene", smiles: "CC(=C)C=C", formula: "C₅H₈" },
      { name: "Cyclopentene", smiles: "C1CC=CC1" },
      { name: "Cyclohexene", smiles: "C1CCC=CC1" },
    ],
  },
  {
    label: "Alkynes",
    compounds: [
      { name: "Ethyne", smiles: "C#C", formula: "C₂H₂" },
      { name: "Propyne", smiles: "CC#C", formula: "C₃H₄" },
      { name: "But-1-yne", smiles: "CCC#C", formula: "C₄H₆" },
      { name: "But-2-yne", smiles: "CC#CC", formula: "C₄H₆" },
      { name: "Pent-1-yne", smiles: "CCCC#C" },
    ],
  },
  {
    label: "Aromatic",
    compounds: [
      { name: "Benzene", smiles: "c1ccccc1", formula: "C₆H₆" },
      { name: "Toluene", smiles: "Cc1ccccc1", formula: "C₇H₈" },
      { name: "o-Xylene", smiles: "Cc1ccccc1C" },
      { name: "m-Xylene", smiles: "Cc1cccc(C)c1" },
      { name: "p-Xylene", smiles: "Cc1ccc(C)cc1" },
      { name: "Naphthalene", smiles: "c1ccc2ccccc2c1", formula: "C₁₀H₈" },
      { name: "Anthracene", smiles: "c1ccc2cc3ccccc3cc2c1" },
      { name: "Phenanthrene", smiles: "c1ccc2c(c1)ccc1ccccc12" },
      { name: "Styrene", smiles: "C=Cc1ccccc1" },
      { name: "Biphenyl", smiles: "c1ccc(-c2ccccc2)cc1" },
    ],
  },
  {
    label: "Haloalkanes",
    compounds: [
      { name: "Chloromethane", smiles: "CCl", formula: "CH₃Cl" },
      { name: "Bromomethane", smiles: "CBr", formula: "CH₃Br" },
      { name: "Iodomethane", smiles: "CI", formula: "CH₃I" },
      { name: "Chloroethane", smiles: "CCCl" },
      { name: "1-Chloropropane", smiles: "CCCCl" },
      { name: "2-Chloropropane", smiles: "CC(Cl)C" },
      { name: "DCM", smiles: "ClCCl", formula: "CH₂Cl₂" },
      { name: "Chloroform", smiles: "ClC(Cl)Cl", formula: "CHCl₃" },
      { name: "CCl₄", smiles: "ClC(Cl)(Cl)Cl", formula: "CCl₄" },
      { name: "1,2-Dibromoethane", smiles: "BrCCBr" },
      { name: "Chlorobenzene", smiles: "Clc1ccccc1" },
      { name: "Bromobenzene", smiles: "Brc1ccccc1" },
      { name: "o-Dichlorobenzene", smiles: "Clc1ccccc1Cl" },
      { name: "DDT", smiles: "ClC(c1ccc(Cl)cc1)(c1ccc(Cl)cc1)C(Cl)(Cl)Cl" },
      { name: "Freon-12", smiles: "FC(F)(Cl)Cl" },
      { name: "CHCl=CCl₂", smiles: "ClC=C(Cl)Cl" },
    ],
  },
  {
    label: "Alcohols & Phenols",
    compounds: [
      { name: "Methanol", smiles: "CO", formula: "CH₃OH" },
      { name: "Ethanol", smiles: "CCO", formula: "C₂H₅OH" },
      { name: "Propan-1-ol", smiles: "CCCO" },
      { name: "Propan-2-ol", smiles: "CC(O)C" },
      { name: "Butan-1-ol", smiles: "CCCCO" },
      { name: "Butan-2-ol", smiles: "CCC(O)C" },
      { name: "2-Methylpropan-1-ol", smiles: "CC(C)CO" },
      { name: "tert-Butanol", smiles: "CC(C)(C)O" },
      { name: "Ethylene Glycol", smiles: "OCCO" },
      { name: "Glycerol", smiles: "OCC(O)CO" },
      { name: "Phenol", smiles: "Oc1ccccc1", formula: "C₆H₅OH" },
      { name: "o-Cresol", smiles: "Cc1ccccc1O" },
      { name: "p-Cresol", smiles: "Cc1ccc(O)cc1" },
      { name: "Catechol", smiles: "Oc1ccccc1O" },
      { name: "Resorcinol", smiles: "Oc1cccc(O)c1" },
      { name: "Hydroquinone", smiles: "Oc1ccc(O)cc1" },
      { name: "Naphthol (α)", smiles: "Oc1cccc2ccccc12" },
      { name: "Benzyl Alcohol", smiles: "OCc1ccccc1" },
    ],
  },
  {
    label: "Ethers",
    compounds: [
      { name: "Dimethyl Ether", smiles: "COC" },
      { name: "Diethyl Ether", smiles: "CCOCC" },
      { name: "Methyl tert-Butyl Ether", smiles: "COC(C)(C)C" },
      { name: "Anisole", smiles: "COc1ccccc1" },
      { name: "Diphenyl Ether", smiles: "c1ccc(Oc2ccccc2)cc1" },
      { name: "Tetrahydrofuran", smiles: "C1CCCO1" },
      { name: "1,4-Dioxane", smiles: "C1COCCO1" },
      { name: "Crown Ether (18-c-6)", smiles: "C1COCCOCCOCCOCCOCCO1" },
    ],
  },
  {
    label: "Aldehydes",
    compounds: [
      { name: "Methanal", smiles: "C=O", formula: "HCHO" },
      { name: "Ethanal", smiles: "CC=O", formula: "CH₃CHO" },
      { name: "Propanal", smiles: "CCC=O" },
      { name: "Butanal", smiles: "CCCC=O" },
      { name: "Benzaldehyde", smiles: "O=Cc1ccccc1" },
      { name: "Cinnamaldehyde", smiles: "O=C/C=C/c1ccccc1" },
      { name: "Vanillin", smiles: "COc1cc(C=O)ccc1O" },
      { name: "Salicylaldehyde", smiles: "OC(=O)c1ccccc1O" },
      { name: "p-Nitrobenzaldehyde", smiles: "O=Cc1ccc([N+](=O)[O-])cc1" },
    ],
  },
  {
    label: "Ketones",
    compounds: [
      { name: "Propanone (Acetone)", smiles: "CC(C)=O" },
      { name: "Butanone (MEK)", smiles: "CCC(C)=O" },
      { name: "Pentan-2-one", smiles: "CCCC(C)=O" },
      { name: "Pentan-3-one", smiles: "CCC(=O)CC" },
      { name: "Cyclohexanone", smiles: "O=C1CCCCC1" },
      { name: "Acetophenone", smiles: "CC(=O)c1ccccc1" },
      { name: "Benzophenone", smiles: "O=C(c1ccccc1)c1ccccc1" },
      { name: "Methyl vinyl ketone", smiles: "CC(=O)C=C" },
    ],
  },
  {
    label: "Carboxylic Acids",
    compounds: [
      { name: "Formic Acid", smiles: "OC=O", formula: "HCOOH" },
      { name: "Acetic Acid", smiles: "CC(=O)O", formula: "CH₃COOH" },
      { name: "Propionic Acid", smiles: "CCC(=O)O" },
      { name: "Butyric Acid", smiles: "CCCC(=O)O" },
      { name: "Valeric Acid", smiles: "CCCCC(=O)O" },
      { name: "Oxalic Acid", smiles: "OC(=O)C(=O)O" },
      { name: "Malonic Acid", smiles: "OC(=O)CC(=O)O" },
      { name: "Succinic Acid", smiles: "OC(=O)CCC(=O)O" },
      { name: "Glutaric Acid", smiles: "OC(=O)CCCC(=O)O" },
      { name: "Adipic Acid", smiles: "OC(=O)CCCCC(=O)O" },
      { name: "Lactic Acid", smiles: "CC(O)C(=O)O" },
      { name: "Pyruvic Acid", smiles: "CC(=O)C(=O)O" },
      { name: "Citric Acid", smiles: "OC(=O)CC(O)(CC(=O)O)C(=O)O" },
      { name: "Tartaric Acid", smiles: "OC(=O)[C@@H](O)[C@H](O)C(=O)O" },
      { name: "Benzoic Acid", smiles: "OC(=O)c1ccccc1" },
      { name: "Phthalic Acid", smiles: "OC(=O)c1ccccc1C(=O)O" },
      { name: "Salicylic Acid", smiles: "OC(=O)c1ccccc1O" },
      { name: "Acrylic Acid", smiles: "OC(=O)C=C" },
    ],
  },
  {
    label: "Esters",
    compounds: [
      { name: "Methyl Formate", smiles: "COC=O" },
      { name: "Ethyl Formate", smiles: "CCOC=O" },
      { name: "Methyl Acetate", smiles: "COC(C)=O" },
      { name: "Ethyl Acetate", smiles: "CCOC(C)=O" },
      { name: "n-Butyl Acetate", smiles: "CCCCOC(C)=O" },
      { name: "Methyl Benzoate", smiles: "COC(=O)c1ccccc1" },
      { name: "Ethyl Benzoate", smiles: "CCOC(=O)c1ccccc1" },
      { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
      { name: "Dimethyl Phthalate", smiles: "COC(=O)c1ccccc1C(=O)OC" },
    ],
  },
  {
    label: "Amines",
    compounds: [
      { name: "Methylamine", smiles: "CN", formula: "CH₃NH₂" },
      { name: "Ethylamine", smiles: "CCN" },
      { name: "Propylamine", smiles: "CCCN" },
      { name: "Dimethylamine", smiles: "CNC" },
      { name: "Trimethylamine", smiles: "CN(C)C" },
      { name: "Diethylamine", smiles: "CCNCC" },
      { name: "Aniline", smiles: "Nc1ccccc1", formula: "C₆H₅NH₂" },
      { name: "o-Toluidine", smiles: "Cc1ccccc1N" },
      { name: "p-Toluidine", smiles: "Cc1ccc(N)cc1" },
      { name: "Diphenylamine", smiles: "c1ccc(Nc2ccccc2)cc1" },
      { name: "Ethylenediamine", smiles: "NCCN" },
      { name: "Pyridine", smiles: "c1ccncc1" },
    ],
  },
  {
    label: "Amides & Urea",
    compounds: [
      { name: "Formamide", smiles: "NC=O" },
      { name: "Acetamide", smiles: "CC(N)=O" },
      { name: "Benzamide", smiles: "NC(=O)c1ccccc1" },
      { name: "Urea", smiles: "NC(=O)N", formula: "CO(NH₂)₂" },
      { name: "Nylon 6,6 unit", smiles: "NCCCCCCNC(=O)CCCCC(=O)" },
      { name: "Paracetamol", smiles: "CC(=O)Nc1ccc(O)cc1" },
    ],
  },
  {
    label: "Nitrogen Heterocycles",
    compounds: [
      { name: "Pyridine", smiles: "c1ccncc1" },
      { name: "Pyrimidine", smiles: "c1cnccn1" },
      { name: "Pyrazine", smiles: "c1cnccn1" },
      { name: "Imidazole", smiles: "c1cnc[nH]1" },
      { name: "Indole", smiles: "c1ccc2[nH]ccc2c1" },
      { name: "Quinoline", smiles: "c1ccc2ncccc2c1" },
      { name: "Purine", smiles: "c1ncc2[nH]cnc2n1" },
      { name: "Piperidine", smiles: "C1CCNCC1" },
      { name: "Morpholine", smiles: "C1CNCCO1" },
      { name: "Piperazine", smiles: "C1CNCCN1" },
    ],
  },
  {
    label: "Biomolecules",
    compounds: [
      { name: "Glucose", smiles: "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O", formula: "C₆H₁₂O₆" },
      { name: "Fructose", smiles: "OC[C@@H](O)[C@](O)(CO)C(=O)CO" },
      { name: "Galactose", smiles: "OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@H]1O" },
      { name: "Ribose", smiles: "OC[C@H]1OC(O)[C@@H](O)[C@H]1O" },
      { name: "Sucrose", smiles: "OC[C@H]1O[C@@](CO)(O[C@H]2O[C@@H](CO)[C@@H](O)[C@H](O)[C@H]2O)[C@@H](O)[C@@H]1O" },
      { name: "Maltose", smiles: "OC[C@H]1OC(O[C@H]2[C@H](O)[C@@H](O)[C@H](O)O[C@@H]2CO)[C@H](O)[C@@H](O)[C@H]1O" },
      { name: "Lactose", smiles: "OC[C@H]1O[C@@H](O[C@H]2[C@@H](CO)O[C@@H](O)[C@H](O)[C@@H]2O)[C@H](O)[C@@H](O)[C@H]1O" },
      { name: "Adenine", smiles: "Nc1ncnc2[nH]cnc12" },
      { name: "Guanine", smiles: "Nc1nc2[nH]cnc2c(=O)[nH]1" },
      { name: "Cytosine", smiles: "Nc1cc[nH]c(=O)n1" },
      { name: "Thymine", smiles: "Cc1c[nH]c(=O)[nH]c1=O" },
      { name: "Uracil", smiles: "O=c1cc[nH]c(=O)[nH]1" },
      { name: "ATP", smiles: "Nc1ncnc2c1ncn2[C@@H]1O[C@H](COP(=O)(O)OP(=O)(O)OP(=O)(O)O)[C@@H](O)[C@H]1O" },
      { name: "Glycine", smiles: "NCC(=O)O" },
      { name: "Alanine", smiles: "C[C@@H](N)C(=O)O" },
      { name: "Valine", smiles: "CC(C)[C@@H](N)C(=O)O" },
      { name: "Leucine", smiles: "CC(C)C[C@@H](N)C(=O)O" },
      { name: "Phenylalanine", smiles: "N[C@@H](Cc1ccccc1)C(=O)O" },
      { name: "Tryptophan", smiles: "N[C@@H](Cc1c[nH]c2ccccc12)C(=O)O" },
      { name: "Cholesterol", smiles: "CC(C)CCC[C@@H](C)[C@H]1CC[C@H]2[C@@H]1CC=C1[C@@H]2CC[C@@H](O)C1" },
    ],
  },
  {
    label: "Inorganic",
    compounds: [
      { name: "Water", smiles: "O", formula: "H₂O" },
      { name: "Ammonia", smiles: "N", formula: "NH₃" },
      { name: "Hydrogen Peroxide", smiles: "OO", formula: "H₂O₂" },
      { name: "Carbon Dioxide", smiles: "O=C=O", formula: "CO₂" },
      { name: "Carbon Monoxide", smiles: "[C-]#[O+]", formula: "CO" },
      { name: "Sulfur Dioxide", smiles: "O=S=O", formula: "SO₂" },
      { name: "Sulfur Trioxide", smiles: "O=S(=O)=O", formula: "SO₃" },
      { name: "Nitric Oxide", smiles: "[N]=O", formula: "NO" },
      { name: "Nitrogen Dioxide", smiles: "O=[N]=O", formula: "NO₂" },
      { name: "Ozone", smiles: "[O-][O+]=O", formula: "O₃" },
      { name: "Nitric Acid", smiles: "O[N+](=O)[O-]", formula: "HNO₃" },
      { name: "Sulfuric Acid", smiles: "OS(=O)(=O)O", formula: "H₂SO₄" },
      { name: "Phosphoric Acid", smiles: "OP(=O)(O)O", formula: "H₃PO₄" },
      { name: "Hydrochloric Acid", smiles: "Cl", formula: "HCl" },
      { name: "Hypochlorous Acid", smiles: "ClO", formula: "HClO" },
      { name: "Chloric Acid", smiles: "OCl(=O)=O" },
      { name: "Perchloric Acid", smiles: "OCl(=O)(=O)=O" },
      { name: "Boric Acid", smiles: "OB(O)O", formula: "H₃BO₃" },
      { name: "Calcium Carbonate", smiles: "[Ca+2].[O-]C([O-])=O" },
      { name: "Sodium Hydroxide", smiles: "[Na+].[OH-]" },
    ],
  },
  {
    label: "Polymers / Monomers",
    compounds: [
      { name: "Ethylene (PE)", smiles: "C=C" },
      { name: "Propylene (PP)", smiles: "CC=C" },
      { name: "Vinyl Chloride (PVC)", smiles: "ClC=C" },
      { name: "Styrene (PS)", smiles: "C=Cc1ccccc1" },
      { name: "Acrylonitrile (PAN)", smiles: "C=CC#N" },
      { name: "Methyl Acrylate (PMMA)", smiles: "C=CC(=O)OC" },
      { name: "Isoprene (Rubber)", smiles: "CC(=C)C=C" },
      { name: "Chloroprene", smiles: "ClC(=C)C=C" },
      { name: "Caprolactam (Nylon-6)", smiles: "O=C1CCCCCN1" },
      { name: "Adipic Acid (Nylon-6,6)", smiles: "OC(=O)CCCCC(=O)O" },
      { name: "Terephthalic Acid (PET)", smiles: "OC(=O)c1ccc(C(=O)O)cc1" },
      { name: "Ethylene Glycol (PET)", smiles: "OCCO" },
      { name: "Bisphenol-A (PC)", smiles: "CC(C)(c1ccc(O)cc1)c1ccc(O)cc1" },
    ],
  },
  {
    label: "Drugs & Vitamins",
    compounds: [
      { name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(=O)O" },
      { name: "Paracetamol", smiles: "CC(=O)Nc1ccc(O)cc1" },
      { name: "Ibuprofen", smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O" },
      { name: "Caffeine", smiles: "Cn1cnc2c1c(=O)n(c(=O)n2C)C" },
      { name: "Nicotine", smiles: "CN1CCC[C@H]1c1cccnc1" },
      { name: "Morphine", smiles: "OC1=CC2=C(C=C1)C1C(N(CC1)C)CC3CC(=O)CCC23" },
      { name: "Penicillin G", smiles: "CC1([C@@H](N2[C@H](S1)[C@@H](C2=O)NC(=O)Cc1ccccc1)C(=O)O)C" },
      { name: "Vitamin C", smiles: "OC[C@@H](O)[C@H]1OC(=O)C(O)=C1O" },
      { name: "Niacin (B3)", smiles: "OC(=O)c1cccnc1" },
      { name: "Dopamine", smiles: "NCCc1ccc(O)c(O)c1" },
      { name: "Serotonin", smiles: "NCCc1c[nH]c2ccc(O)cc12" },
      { name: "Adrenaline", smiles: "CNC[C@@H](O)c1ccc(O)c(O)c1" },
      { name: "Melatonin", smiles: "COc1ccc2[nH]cc(CCNC(C)=O)c2c1" },
      { name: "Capsaicin", smiles: "COc1cc(CNC(=O)CCCC/C=C/CC(C)C)ccc1O" },
    ],
  },
];

// All compounds flattened for search
const ALL_COMPOUNDS = CATEGORIES.flatMap((c) => c.compounds);

const SIZE_OPTIONS = [
  { label: "Small", value: 300, desc: "300 px" },
  { label: "Medium", value: 500, desc: "500 px" },
  { label: "Large", value: 700, desc: "700 px" },
];

interface ChemStructureProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInsert: (dataUrl: string, label: string, sizeW: number) => void;
}

export default function ChemStructure({ open, onOpenChange, onInsert }: ChemStructureProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [smiles, setSmiles] = useState("");
  const [compoundName, setCompoundName] = useState("");
  const [sizeW, setSizeW] = useState(500);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawerRef = useRef<any>(null);

  // Filtered compounds in active category by search
  const filtered = query.trim()
    ? ALL_COMPOUNDS.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.formula || "").toLowerCase().includes(query.toLowerCase()),
      )
    : CATEGORIES[activeCategory].compounds;

  useEffect(() => {
    drawerRef.current = new SmilesDrawer.Drawer({
      width: 500,
      height: 300,
      bondThickness: 1.4,
      bondLength: 28,
      fontSizeLarge: 11,
      fontSizeSmall: 8,
      padding: 20,
      compactDrawing: false,
      explicitHydrogens: false,
      themes: {
        dark: {
          C: "#facc15", O: "#facc15", N: "#facc15",
          F: "#facc15", CL: "#facc15", BR: "#facc15",
          I: "#facc15", P: "#facc15", S: "#facc15",
          B: "#facc15", SI: "#facc15", H: "#facc15",
          BACKGROUND: "transparent",
        },
      },
    });
  }, []);

  const drawSmiles = useCallback((smilesStr: string) => {
    const canvas = canvasRef.current;
    const drawer = drawerRef.current;
    if (!canvas || !drawer || !smilesStr) return;
    SmilesDrawer.parse(
      smilesStr,
      (tree: any) => { drawer.draw(tree, canvas, "dark", false); },
      (err: any) => { console.error("Draw error:", err); },
    );
  }, []);

  useEffect(() => {
    if (!smiles) return;
    const id = requestAnimationFrame(() => drawSmiles(smiles));
    return () => cancelAnimationFrame(id);
  }, [smiles, drawSmiles]);

  const loadCompound = (s: string, name: string) => {
    setError("");
    setCompoundName(name);
    setSmiles(s);
  };

  // PubChem search
  const searchPubChem = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSmiles("");
    setCompoundName("");
    try {
      const res = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query.trim())}/property/IsomericSMILES,IUPACName/JSON`,
      );
      if (!res.ok) throw new Error("Compound not found in PubChem.");
      const data = await res.json();
      const props = data?.PropertyTable?.Properties?.[0];
      if (!props?.IsomericSMILES) throw new Error("No structure available.");
      setCompoundName(props.IUPACName || query.trim());
      setSmiles(props.IsomericSMILES);
    } catch (e: any) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas || !smiles) return;
    const dataUrl = canvas.toDataURL("image/png");
    onInsert(dataUrl, compoundName, sizeW);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[92vh] overflow-hidden p-0 gap-0 flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-950/60 to-blue-950/60 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/30 border border-violet-500/40">
            <FlaskConical className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold">Chemistry Structure Generator</DialogTitle>
            <p className="text-xs text-muted-foreground">Class 11 &amp; 12 • {ALL_COMPOUNDS.length}+ compounds</p>
          </div>
        </div>

        {/* ── Body: two-column layout ── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* LEFT: category sidebar */}
          <aside className="w-36 flex-shrink-0 border-r border-border overflow-y-auto bg-black/20">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.label}
                onClick={() => { setActiveCategory(idx); setQuery(""); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between transition ${
                  activeCategory === idx && !query
                    ? "bg-violet-600 text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="truncate">{cat.label}</span>
                {activeCategory === idx && !query && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
              </button>
            ))}
          </aside>

          {/* RIGHT: content */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Search bar */}
            <div className="flex gap-2 p-3 border-b border-border flex-shrink-0">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchPubChem()}
                placeholder="Search any compound or search PubChem…"
                className="flex-1 h-8 text-xs bg-black/30"
              />
              <Button
                onClick={searchPubChem}
                disabled={loading}
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white h-8 px-3 text-xs"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Search className="h-3.5 w-3.5 mr-1" />Search</>}
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-500/30 px-3 py-2 text-xs text-red-400 flex-shrink-0">
                <X className="h-3.5 w-3.5 flex-shrink-0" />{error}
              </div>
            )}

            {/* Main content: compound grid + preview */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* Compound list */}
              <div className="w-52 flex-shrink-0 border-r border-border overflow-y-auto p-2 space-y-0.5">
                {(query ? [{ label: `Results (${filtered.length})`, compounds: filtered }] : [CATEGORIES[activeCategory]]).map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 py-1 font-medium">
                      {group.label}
                    </p>
                    {group.compounds.length === 0 && (
                      <p className="text-[11px] text-muted-foreground px-2 py-2">No matches</p>
                    )}
                    {group.compounds.map((c) => (
                      <button
                        key={c.name + c.smiles}
                        onClick={() => loadCompound(c.smiles, c.name)}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition ${
                          compoundName === c.name
                            ? "bg-violet-600 text-white"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <span className="block font-medium truncate">{c.name}</span>
                        {c.formula && (
                          <span className={`block text-[10px] ${compoundName === c.name ? "text-violet-200" : "text-muted-foreground"}`}>
                            {c.formula}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Preview + insert controls */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0 p-3 gap-3">
                {/* Canvas preview */}
                <div className="relative rounded-xl border border-border/60 overflow-hidden bg-black/40 flex-shrink-0" style={{ height: 240 }}>
                  {!smiles && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-transparent z-10">
                      <FlaskConical className="h-8 w-8 text-gray-500" />
                      <p className="text-xs text-gray-400">Click a compound to preview</p>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={240}
                    style={{ display: "block", width: "100%", height: "100%", background: "transparent" }}
                  />
                  {compoundName && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-900/70 text-white text-[11px] px-2.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                      {compoundName}
                    </div>
                  )}
                </div>

                {/* SMILES */}
                {smiles && (
                  <div className="rounded-lg bg-black/20 border border-border/40 px-3 py-1.5 text-[11px] font-mono text-muted-foreground break-all select-all flex-shrink-0">
                    <span className="text-violet-400 mr-1.5">SMILES:</span>{smiles}
                  </div>
                )}

                {/* Size picker */}
                {smiles && (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">Insert size</p>
                    <div className="flex gap-2">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSizeW(opt.value)}
                          className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                            sizeW === opt.value
                              ? "bg-violet-600 border-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]"
                              : "border-border/50 hover:border-violet-500/50 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="block font-semibold">{opt.label}</span>
                          <span className="block text-[10px] opacity-70">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="px-5 py-3 border-t border-border bg-card/40 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleInsert}
            disabled={!smiles}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Insert into Slide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
