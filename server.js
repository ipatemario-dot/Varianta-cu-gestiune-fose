const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DB = path.join(__dirname, 'data.json');

const INITIAL_DB = {
  users: [
    { id: 1, name: "Administrator",  role: "gestionar", active: true },
    { id: 2, name: "Gestionar PAFS", role: "gestionar", active: true },
    { id: 3, name: "Gestionar PP-C", role: "gestionar", active: true },
    { id: 4, name: "Operator 1",     role: "operator",  active: true }
  ],
  gestiuni: [
    { id: "pafs", label: "PAFS — Fibra de Sticla", color: "#185FA5", bg: "#E6F1FB" },
    { id: "ppc",  label: "PP-C — Polipropilena",   color: "#3B6D11", bg: "#EAF3DE" }
  ],
  mats: {
    pafs: [
      { id: 1, denumire: "Corecombomat 300",                   categorie: "Armare", um: "m²", sectie: "Hala 1 - RTM Light", stoc: 0, stocMin: 0, producator: "", furnizor: "C-L Composites", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Produs in China" },
      { id: 2, denumire: "Rasina alimentara CLRX",             categorie: "Rasina", um: "kg", sectie: "Hala 1 - RTM Light", stoc: 0, stocMin: 0, producator: "", furnizor: "C-L Composites", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Produsa in Italia" },
      { id: 3, denumire: "Pasta fibra de sticla (kit lipire)", categorie: "Adeziv", um: "kg", sectie: "Hala 1 - RTM Light", stoc: 0, stocMin: 0, producator: "", furnizor: "C-L Composites", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Produsa in Italia" }
    ],
    ppc: [
      { id: 101, denumire: "Electrod de sudura rotund O4mm PP-C gri cu suport",   categorie: "Electrozi",  um: "kg",     sectie: "Gestiune PP-C", stoc: 0.8, stocMin: 0, producator: "", furnizor: "", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Stoc initial 10/05/2026" },
      { id: 102, denumire: "Electrod de sudura rotund O4mm PP-C gri fara suport", categorie: "Electrozi",  um: "kg",     sectie: "Gestiune PP-C", stoc: 50,  stocMin: 0, producator: "", furnizor: "", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Stoc initial 10/05/2026" },
      { id: 103, denumire: "Placa PP-C gri 4.5X1500X2510 mm",                    categorie: "Placi PP-C", um: "bucata", sectie: "Gestiune PP-C", stoc: 358, stocMin: 0, producator: "", furnizor: "", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Stoc initial 10/05/2026" },
      { id: 104, denumire: "Placa PP-C gri 4.5x1500x3000 mm",                    categorie: "Placi PP-C", um: "bucata", sectie: "Gestiune PP-C", stoc: 50,  stocMin: 0, producator: "", furnizor: "", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Stoc initial 10/05/2026" },
      { id: 105, denumire: "Placa PP-C gri 4.5X1500X3200 mm",                    categorie: "Placi PP-C", um: "bucata", sectie: "Gestiune PP-C", stoc: 100, stocMin: 0, producator: "", furnizor: "", timpLivrare: "", cantMin: "", tipPlata: "La termen", note: "Stoc initial 10/05/2026" }
    ]
  },
  movs: { pafs: [], ppc: [] },
  // ── Productie Butoaie ──────────────────────────────────────────────────────
  productie: {
    tipuri: [
      { id: "b100", label: "Butoi 100L",    stocInitialButoaie: 153, stocInitialCapac:  9, stocInitialPicior:  6 },
      { id: "b150", label: "Butoi 150L",    stocInitialButoaie: 146, stocInitialCapac: 10, stocInitialPicior:  8 },
      { id: "b200", label: "Butoi 200L",    stocInitialButoaie: 161, stocInitialCapac: 20, stocInitialPicior: 20 },
      { id: "b300", label: "Butoi 300L",    stocInitialButoaie: 237, stocInitialCapac: 21, stocInitialPicior: 21 },
      { id: "b500", label: "Butoi 500L",    stocInitialButoaie:  18, stocInitialCapac:  6, stocInitialPicior:  7 },
      { id: "dam",  label: "Damingeana 50L",stocInitialButoaie: 114, stocInitialCapac: 60, stocInitialPicior: 65 }
    ],
    // Eveniment unificat: type = "productie" | "imbinare" | "vanzare"
    // productie: tipId, capac, picior (piese produse in acea zi)
    // imbinare:  tipId, cantitate (butoaie asamblate — scade capac+picior, adauga butoi)
    // vanzare:   tipId, cantitate, client
    events: []
  }
};

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function defaultFoseRez() {
  return {
    components: [
      { id: "cil_d12_ind", label: "Cilindru D1.2m rasina industriala", category: "Cilindri", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "industrial" },
      { id: "cil_d16_ind", label: "Cilindru D1.6m rasina industriala", category: "Cilindri", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "industrial" },
      { id: "cil_d20_ind", label: "Cilindru D2.0m rasina industriala", category: "Cilindri", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "industrial" },
      { id: "cil_d24_ind", label: "Cilindru D2.4m rasina industriala", category: "Cilindri", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "industrial" },
      { id: "cil_d30_ind", label: "Cilindru D3.0m rasina industriala", category: "Cilindri", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "industrial" },
      { id: "cil_d12_food", label: "Cilindru D1.2m rasina alimentara", category: "Cilindri alimentari", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "alimentara" },
      { id: "cil_d16_food", label: "Cilindru D1.6m rasina alimentara", category: "Cilindri alimentari", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "alimentara" },
      { id: "cil_d20_food", label: "Cilindru D2.0m rasina alimentara", category: "Cilindri alimentari", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "alimentara" },
      { id: "cil_d24_food", label: "Cilindru D2.4m rasina alimentara", category: "Cilindri alimentari", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "alimentara" },
      { id: "cil_d30_food", label: "Cilindru D3.0m rasina alimentara", category: "Cilindri alimentari", um: "buc", initial: 0, sectie: "Hala Cilindru", resin: "alimentara" },
      { id: "capac_d12_intrare", label: "Capac intrare D1.2m", category: "Capace cilindru", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_d12_iesire", label: "Capac iesire D1.2m", category: "Capace cilindru", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_d16_univ", label: "Capac cilindru Universal D1.6m", category: "Capace cilindru", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_d20_univ", label: "Capac cilindru Universal D2.0m", category: "Capace cilindru", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_d24_univ", label: "Capac cilindru Universal D2.4m", category: "Capace cilindru", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_d30_univ", label: "Capac cilindru Universal D3.0m", category: "Capace cilindru", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_food_d12", label: "Capac alimentar D1.2m", category: "Capace alimentare", um: "buc", initial: 0, sectie: "Componente", resin: "alimentara" },
      { id: "capac_food_d16", label: "Capac alimentar D1.6m", category: "Capace alimentare", um: "buc", initial: 0, sectie: "Componente", resin: "alimentara" },
      { id: "capac_food_d20", label: "Capac alimentar D2.0m", category: "Capace alimentare", um: "buc", initial: 0, sectie: "Componente", resin: "alimentara" },
      { id: "capac_food_d24", label: "Capac alimentar D2.4m", category: "Capace alimentare", um: "buc", initial: 0, sectie: "Componente", resin: "alimentara" },
      { id: "capac_food_d30", label: "Capac alimentar D3.0m", category: "Capace alimentare", um: "buc", initial: 0, sectie: "Componente", resin: "alimentara" },
      { id: "gura_dn520", label: "Gura de vizitare DN520mm", category: "Guri vizitare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "gura_dn800", label: "Gura de vizitare DN800mm", category: "Guri vizitare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "gura_dn1000", label: "Gura de vizitare DN1000mm", category: "Guri vizitare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "capac_gura_dn520", label: "Capac gura de vizitare DN520mm", category: "Capace guri vizitare", um: "buc", initial: 0, sectie: "Componente", coverFor: "gura_dn520" },
      { id: "capac_gura_dn800", label: "Capac gura de vizitare DN800mm", category: "Capace guri vizitare", um: "buc", initial: 0, sectie: "Componente", coverFor: "gura_dn800" },
      { id: "capac_gura_dn1000", label: "Capac gura de vizitare DN1000mm", category: "Capace guri vizitare", um: "buc", initial: 0, sectie: "Componente", coverFor: "gura_dn1000" },
      { id: "camera_rot_d12", label: "Camera rotunda fosa D1.2m", category: "Camere interioare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "camera_pat_d12", label: "Camera patrata fosa D1.2m", category: "Camere interioare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "camera_rot_d16", label: "Camera Rotunda fosa D1.6m", category: "Camere interioare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "camera_pat_d16", label: "Camera Patrata fosa D1.6m", category: "Camere interioare", um: "buc", initial: 0, sectie: "Componente" },
      { id: "camera_rot_d20", label: "Camera Rotunda fosa D2.0m", category: "Camere interioare", um: "buc", initial: 0, sectie: "Componente" }
    ],
    products: [],
    events: []
  };
}

function readDB() {
  if (!fs.existsSync(DB)) { const d = clone(INITIAL_DB); d.foserez = defaultFoseRez(); fs.writeFileSync(DB, JSON.stringify(d, null, 2)); return d; }
  try {
    const d = JSON.parse(fs.readFileSync(DB, 'utf8'));
    if (!d.users) d.users = INITIAL_DB.users;
    if (!Array.isArray(d.gestiuni) || d.gestiuni.length === 0) d.gestiuni = INITIAL_DB.gestiuni;
    if (!d.mats || typeof d.mats !== 'object') d.mats = {};
    if (!d.movs || typeof d.movs !== 'object') d.movs = {};
    d.gestiuni.forEach(g => {
      if (!Array.isArray(d.mats[g.id])) d.mats[g.id] = [];
      if (!Array.isArray(d.movs[g.id])) d.movs[g.id] = [];
    });
    if (!d.productie) d.productie = INITIAL_DB.productie;
    if (!Array.isArray(d.productie.tipuri)) d.productie.tipuri = INITIAL_DB.productie.tipuri;
    if (!Array.isArray(d.productie.events)) d.productie.events = [];
    if (!d.foserez) d.foserez = defaultFoseRez();
    if (!Array.isArray(d.foserez.components) || d.foserez.components.length === 0) d.foserez.components = defaultFoseRez().components;
    if (!Array.isArray(d.foserez.products)) d.foserez.products = [];
    if (!Array.isArray(d.foserez.events)) d.foserez.events = [];
    return d;
  } catch(e) { return INITIAL_DB; }
}

function writeDB(data) { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

app.get('/api/data', (req, res) => res.json(readDB()));
app.post('/api/data', (req, res) => {
  try { writeDB(req.body); res.json({ ok: true, ts: Date.now() }); }
  catch(e) { res.status(500).json({ error: e.message }); }
});
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`FIBROMAR pornit pe portul ${PORT}`));
