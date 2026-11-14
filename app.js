(() => {
"use strict";

const ZONES = [
  { id: "WORLD", nom: "Monde" },
  { id: "EU", nom: "Europe", bbox: [-25, 34, 45, 80], centre: [12, 57] },
  { id: "AS", nom: "Asie", bbox: [25, -13, 150, 55], centre: [90, 25] },
  { id: "AF", nom: "Afrique", bbox: [-26, -36, 74, 38], centre: [22, 0] },
  { id: "NA", nom: "Amérique du Nord", bbox: [-140, 7, -20, 76], centre: [-85, 45] },
  { id: "SA", nom: "Amérique du Sud", bbox: [-82, -56, -34, 13], centre: [-60, -20] },
  { id: "OC", nom: "Océanie", bbox: [112, -48, 235, 22], centre: [175, -12] },
  { id: "AN", nom: "Antarctique", bbox: [-180, -90, 180, -46], centre: [0, -90] },
  { id: "REV", nom: "À réviser" },  // les pays mis de côté par le joueur, une liste par thème
];
const ICONES = {
  flags: '<path d="M5 21V4M5 4h12l-2.5 4 2.5 4H5"/>',
  caps: '<path d="M3 21h18M5 21v-9M19 21v-9M9.5 21v-6M14.5 21v-6M2 11h20L12 4z"/>',
  map: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.2"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  liste: '<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  reviser: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  point: '<circle cx="12" cy="12" r="3.5" fill="currentColor"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="3 3"/>',
  ecritures: '<path d="M3 19l5-14 5 14M4.8 14h6.4M15 8h6M18 6v2M16 16c2.5-1.5 4-4.5 4.5-8"/>',
  dico: '<path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/>',
};
const icone = (nom) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[nom]}</svg>`;
// Cases du menu. Les trois premiers jeux suivent le mode de réponse choisi dans
// la colonne (4 choix ou saisie libre) ; « Placer » se joue toujours au clic.
const SECTIONS = [
  { titre: "Jeux", jeux: [
    ["flags", "Drapeaux", "Reconnais le pays à son drapeau"],
    ["caps", "Capitales", "Trouve la capitale à partir du drapeau"],
    ["map", "Nommer sur la carte", "Un pays est surligné : lequel ?"],
    ["placer", "Placer sur la carte", "Trouve le pays demandé sur la carte"]] },
  { titre: "Comme dans GeoGuessr", jeux: [
    ["ecritures", "Langues", "Dans quel pays lit-on ce mot ?"],
    ["dico-ecritures", "Repères : langues", "Écritures, lettres spéciales et pays de chaque langue"],
    ["dico-panneaux", "Repères : panneaux", "La signalisation de chaque pays, en exemples"]] },
  { titre: "Découvrir", jeux: [
    ["explore", "Explorer la carte", "Drapeau, capitale et infos de chaque pays"],
    ["liste", "Liste", "Tous les drapeaux et capitales"]] },
];
const REPONSES = [["qcm", "4 choix"], ["saisie", "Saisie libre"]];
const NOMS_THEMES = { flags: "Drapeaux", caps: "Capitales", map: "Carte", ecritures: "Langues" };
const estDico = (t) => t.startsWith("dico-");
const NOMS_MODES = { qcm: "4 choix", saisie: "Saisie libre", placer: "Placer" };
const SOUS_REGIONS = {
  "Northern Europe": "Europe du Nord", "Western Europe": "Europe de l'Ouest",
  "Southern Europe": "Europe du Sud", "Eastern Europe": "Europe de l'Est",
  "Central Europe": "Europe centrale", "Southeast Europe": "Europe du Sud-Est",
  "Western Asia": "Asie de l'Ouest", "Central Asia": "Asie centrale", "Southern Asia": "Asie du Sud",
  "Eastern Asia": "Asie de l'Est", "South-Eastern Asia": "Asie du Sud-Est",
  "Northern Africa": "Afrique du Nord", "Western Africa": "Afrique de l'Ouest",
  "Middle Africa": "Afrique centrale", "Eastern Africa": "Afrique de l'Est",
  "Southern Africa": "Afrique australe", "Caribbean": "Caraïbes",
  "Central America": "Amérique centrale", "North America": "Amérique du Nord",
  "South America": "Amérique du Sud", "Australia and New Zealand": "Australie et Nouvelle-Zélande",
  "Melanesia": "Mélanésie", "Micronesia": "Micronésie", "Polynesia": "Polynésie",
  "Antarctic": "Antarctique",
};
// Langues que les navigateurs ne savent pas toujours nommer en français.
const NOMS_LANGUES = {
  bar: "bavarois", smi: "same", gsw: "suisse allemand", nrf: "jersiais", nfr: "guernesiais",
  arc: "araméen", lao: "lao", tet: "tétoum", zdj: "comorien", lua: "tshiluba",
  pov: "créole de Guinée-Bissau", mfe: "créole mauricien", ber: "berbère", hgm: "khoekhoe",
  kwn: "kwangali", loz: "lozi", crs: "créole seychellois", bwg: "chibarwe", kck: "kalanga",
  khi: "langues khoïsan", ndc: "ndau", toi: "tonga (Zambie)", zib: "langue des signes zimbabwéenne",
  mey: "hassanya", bjz: "créole bélizien", jam: "patois jamaïcain", pap: "papiamento",
  hif: "hindi des Fidji", gil: "gilbertin", nzs: "langue des signes néo-zélandaise",
  pau: "paluan", tpi: "tok pisin", tvl: "tuvaluan", cal: "carolinien",
  rar: "maori des îles Cook", niu: "niuéen", tkl: "tokelau", pih: "norfuk",
};
// Bonne réponse : on enchaîne presque aussitôt. Mauvaise : réglable au curseur.
const DELAI_JUSTE = 100;

const $ = (s) => document.querySelector(s);
const PAR_NUM = new Map(PAYS.filter((p) => p.num).map((p) => [p.num, p]));
const PAR_CODE = new Map(PAYS.map((p) => [p.code, p]));
const DOUBLES = new Set(DRAPEAUX_DOUBLES);
const nombre = new Intl.NumberFormat("fr-FR");
const nomsLangues = new Intl.DisplayNames(["fr"], { type: "language" });
const nomsMonnaies = new Intl.DisplayNames(["fr"], { type: "currency" });

// --- Préférences (simple confort, la page marche sans) ---------------------

// delaiErreur : temps (ms) avant la question suivante après une mauvaise réponse.
// reponse : mode de réponse des quiz (4 choix ou saisie libre), choisi au menu.
let etat = { theme: "flags", mode: "qcm", zone: "WORLD", delaiErreur: 500, reponse: "qcm" };
try { Object.assign(etat, JSON.parse(localStorage.getItem("geo-etat")) || {}); } catch (e) {}
delete etat.ensemble;
delete etat.delai;  // ancien réglage (délai commun aux bonnes et mauvaises réponses)
if (!["qcm", "saisie"].includes(etat.reponse)) etat.reponse = "qcm";
function sauver() {
  try { localStorage.setItem("geo-etat", JSON.stringify(etat)); } catch (e) {}
}

// Pays « à réviser », séparément pour les drapeaux, les capitales et la carte
// (la liste « carte » sert aux deux jeux de carte : nommer et placer).
const THEMES_REV = ["flags", "caps", "map"];
const NOMS_REV = { flags: "drapeau", caps: "capitale", map: "emplacement" };
const REVISER = { flags: new Set(), caps: new Set(), map: new Set() };
try {
  const lu = JSON.parse(localStorage.getItem("mappemonde-reviser")) || {};
  for (const t of THEMES_REV) for (const c of lu[t] || []) REVISER[t].add(c);
} catch (e) {}
function sauverRevision() {
  const donnees = {};
  for (const t of THEMES_REV) donnees[t] = [...REVISER[t]];
  try { localStorage.setItem("mappemonde-reviser", JSON.stringify(donnees)); } catch (e) {}
}
function marquer(theme, codes, oui) {
  for (const c of codes) {
    if (oui) REVISER[theme].add(c);
    else REVISER[theme].delete(c);
  }
  sauverRevision();
}

// --- Outils ---------------------------------------------------------------

function melanger(t) {
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

function normaliser(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[’'`\-.,]/g, " ")
    .replace(/\bst\b/g, "saint").replace(/\bste\b/g, "sainte")
    .replace(/\s+/g, " ").trim()
    .replace(/^(le|la|les|l|el) /, "");
}

function distance(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prec = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prec + (a[i - 1] === b[j - 1] ? 0 : 1));
      prec = tmp;
    }
  }
  return d[b.length];
}

const pourCapitales = () => etat.theme === "caps";
const pourEcritures = () => etat.theme === "ecritures";
// Dans le jeu des langues, une question est un mot ({ l: langue, mot, sens, pays: [codes] }) ;
// la réponse est un des pays de la langue.
const estMot = (p) => p && p.mot !== undefined;
const paysDuMot = (m) => m.pays.map((c) => PAR_CODE.get(c));
const listePays = (m, max = 4) => {
  const noms = paysDuMot(m).map((p) => p.nom);
  return noms.length > max ? `${noms.slice(0, max).join(", ")}… (${noms.length} pays)` : noms.join(", ");
};
const attendu = (p) => (estMot(p) ? listePays(p) : pourCapitales() ? p.cap : p.nom);
const acceptees = (p) => (estMot(p) ? paysDuMot(p).flatMap((q) => [q.nom, ...q.altN])
  : pourCapitales() ? [...p.capitales.map((c) => c.nom), ...p.altC]
  : [p.nom, ...p.altN]);
// Les autres réponses possibles, qu'une saisie ne doit pas pouvoir « corriger » en la bonne.
const autresReponses = (p) => (estMot(p)
  ? PAYS.filter((q) => !p.pays.includes(q.code)).flatMap((q) => [q.nom, ...q.altN])
  : PAYS.filter((q) => q !== p).flatMap((q) => acceptees(q)));
// Plusieurs continents se cumulent : leur zone a pour id « EU+AS » (ordre de ZONES).
const COMBINEES = new Map();
function zoneCombinee(id) {
  if (COMBINEES.has(id)) return COMBINEES.get(id);
  const parts = id.split("+").map((i) => ZONES.find((z) => z.id === i)).filter((z) => z && z.bbox);
  if (!parts.length) return ZONES[0];
  const b = [Math.min(...parts.map((z) => z.bbox[0])), Math.min(...parts.map((z) => z.bbox[1])),
    Math.max(...parts.map((z) => z.bbox[2])), Math.max(...parts.map((z) => z.bbox[3]))];
  const z = { id, nom: parts.map((q) => q.nom).join(" + ") };
  // Continents voisins (Europe + Asie, Europe + Afrique…) : carte cadrée sur eux ;
  // trop éloignés pour un seul cadre : carte du monde.
  if (b[2] - b[0] <= 250 && b[3] - b[1] <= 130) {
    z.bbox = b;
    z.centre = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
  }
  COMBINEES.set(id, z);
  return z;
}
const zoneDe = (id) => ZONES.find((z) => z.id === id) || zoneCombinee(id);
const continentsDe = (z) => (z === "WORLD" || z === "REV" ? [] : z.split("+"));
const dansZone = (p, z) => z === "WORLD" || continentsDe(z).includes(p.ct)
  || (z === "REV" && THEMES_REV.some((t) => REVISER[t].has(p.code)));
// Clic sur une région du menu : Monde et « À réviser » sont seuls ; un continent
// s'ajoute aux continents déjà choisis, ou s'en retire.
function basculerZone(id) {
  if (id === "WORLD" || id === "REV") return id;
  const choisis = new Set(continentsDe(etat.zone));
  if (choisis.has(id)) choisis.delete(id);
  else choisis.add(id);
  const ids = ZONES.filter((z) => choisis.has(z.id)).map((z) => z.id);
  return !ids.length || ids.length === ZONES.filter((z) => z.bbox).length ? "WORLD" : ids.join("+");
}
const drapeau = (p) => `flags/${p.code}.svg`;

// Pays proposés pour le thème et la zone : sans capitale → pas de quiz des
// capitales ; drapeau identique à celui d'un autre pays → ni quiz des drapeaux,
// ni quiz des capitales (la question n'y montre que le drapeau).
const jouable = (p, theme) => (theme !== "caps" || (p.capitales.length && !DOUBLES.has(p.code)))
  && (theme !== "flags" || !DOUBLES.has(p.code))
  && (theme !== "map" || (p.num && FORMES.has(p.num)) || (p.ll && aUnPoint(p)));
// En zone « À réviser », chaque jeu ne prend que les pays de sa propre liste
// (les jeux GeoGuessr n'en ont pas).
function selection(z = etat.zone, theme = etat.theme) {
  if (theme === "ecritures") return z === "REV" ? [] : motsDe(z);
  return PAYS.filter((p) => (z === "REV" ? REVISER[theme].has(p.code) : dansZone(p, z)) && jouable(p, theme));
}

// --- Langues -----------------------------------------------------------------
const ECRITURE = new Map(ECRITURES.map((e) => [e.id, e]));
// Pays d'une langue dans la zone (la bonne réponse proposée en est tirée).
const paysLangueDans = (l, z) => l.pays.split(" ").filter((c) => PAR_CODE.has(c) && dansZone(PAR_CODE.get(c), z));
const languesDe = (z) => LANGUES.filter((l) => paysLangueDans(l, z).length);
const motsDe = (z) => languesDe(z).flatMap((l) => l.mots.map(([mot, sens]) =>
  ({ l, mot, sens, pays: l.pays.split(" ").filter((c) => PAR_CODE.has(c)), code: "" })));
// Une partie : autant de mots en alphabet latin que dans les autres écritures,
// deux mots au plus par langue, 60 questions au plus.
function tirageLangues(mots) {
  const parLangue = new Map();
  for (const m of melanger(mots.slice())) parLangue.set(m.l, [...(parLangue.get(m.l) || []), m]);
  const latin = [], autres = [];
  for (const [l, liste] of parLangue) (l.ecriture === "latin" ? latin : autres).push(...liste.slice(0, 2));
  const n = Math.min(30, latin.length, autres.length) || Math.max(latin.length, autres.length);
  return melanger([...melanger(latin).slice(0, n), ...melanger(autres).slice(0, n)]);
}
// Questions d'une nouvelle partie du jeu courant.
const questionsDuJeu = () => (pourEcritures() ? tirageLangues(selection()) : selection());

// --- Photos des panneaux (base fixe, photos.js), pour le dictionnaire ----------
const photosDe = (theme, p) => PHOTOS_JEUX[theme][p.code] || [];

// Carte à dessiner : en « À réviser », le continent commun s'il n'y en a qu'un, sinon le monde.
function zoneCarte(z, pays) {
  if (z !== "REV") return zoneDe(z);
  const cts = new Set(pays.map((p) => p.ct));
  return cts.size === 1 ? zoneDe([...cts][0]) : zoneDe("WORLD");
}

// Exact (aux accents, tirets et articles près), ou à une faute de frappe près,
// sauf si la saisie est exactement une AUTRE réponse (Gambie ≠ Zambie).
function verifier(saisie, p) {
  const s = normaliser(saisie);
  if (!s) return { ok: false };
  const bonnes = acceptees(p).map(normaliser);
  if (bonnes.includes(s)) return { ok: true };
  const autres = new Set(autresReponses(p).map(normaliser));
  if (autres.has(s)) return { ok: false };
  const proche = bonnes.some((b) => distance(s, b) <= (b.length >= 10 ? 2 : b.length >= 5 ? 1 : 0));
  return { ok: proche, approx: proche };
}
window.verifierReponse = (saisie, code, theme) => {
  const avant = etat.theme;
  etat.theme = theme;
  try { return verifier(saisie, PAR_CODE.get(code)); } finally { etat.theme = avant; }
};

// --- Carte ----------------------------------------------------------------

// Une forme par clé : code numérique, ou nom quand le fond de carte n'a pas de
// code (Kosovo, Somaliland). Chypre du Nord est fusionnée à Chypre. DECOUPES
// (decoupes.js) remplace la France et la Norvège par leur partie métropolitaine
// et ajoute les départements d'outre-mer, le Svalbard et les nations du
// Royaume-Uni, qui remplacent la forme du Royaume-Uni.
const FORMES = (() => {
  const topo = window.WORLD;
  const groupes = new Map();
  for (const geo of topo.objects.countries.geometries) {
    const nom = geo.properties.name;
    const cle = nom === "N. Cyprus" ? "196"
      : nom === "Ashmore and Cartier Is." ? "ashmore" : geo.id || nom;
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(geo);
  }
  const res = new Map();
  for (const [cle, liste] of groupes) {
    res.set(cle, liste.length === 1 ? topojson.feature(topo, liste[0])
      : { type: "Feature", geometry: topojson.merge(topo, liste) });
  }
  res.delete("826");
  for (const [cle, geometry] of Object.entries(DECOUPES)) res.set(cle, { type: "Feature", geometry });
  return res;
})();
// Pays qu'on peut montrer sur la carte (forme ou point) : tous sauf le
// Royaume-Uni, dessiné par ses quatre nations.
const SUR_CARTE = new Set(PAYS.filter((p) => (p.num && FORMES.has(p.num)) || p.ll).map((p) => p.code));
// Pays avec un point par défaut (réglable pays par pays dans la Liste).
// Europe, Asie, Afrique : choisis à la main. Ailleurs, les mêmes critères :
// micro-États noyés dans les frontières, et petites îles ou archipels isolés en
// pleine mer (jusqu'à ~5 000 km², comme le Cap-Vert ou La Réunion). Pas les îles
// proches d'une côte (Malte, Jersey, Bahreïn, Trinité) ni les plus grandes
// (Fidji, Vanuatu, Malouines), qu'on trouve et clique en zoomant.
const POINTS_PAR_DEFAUT = new Set([
  // Europe
  "ad", "gi", "li", "mc", "sm", "va",
  // Asie
  "cc", "cx", "hk", "mo", "mv", "sg", "tl",
  // Afrique
  "cv", "eh", "io", "mu", "re", "sc", "sh", "st", "yt",
  // Amérique du Nord : Antilles et îles isolées
  "ag", "ai", "aw", "bb", "bl", "bm", "bq", "cw", "dm", "gd", "gp", "kn", "ky",
  "lc", "mf", "mq", "ms", "sx", "tc", "vc", "vg", "vi",
  // Océanie
  "as", "ck", "fm", "gu", "ki", "mh", "mp", "nf", "nr", "nu", "pf", "pn", "pw",
  "tk", "to", "tv", "um", "wf", "ws",
  // Antarctique et mers australes
  "bv", "gs", "hm", "tf",
]);
// Et toutes les îles de moins de 30 000 km² sans frontière terrestre (Malte,
// Jamaïque, Fidji…) : petites sur la carte, elles ont toutes leur point.
const ILE_PETITE = (p) => {
  const i = INFOS[p.code];
  return !!i && !(i.voisins && i.voisins.length) && i.sup > 0 && i.sup < 30000;
};
const POINT_DEFAUT = (p) => POINTS_PAR_DEFAUT.has(p.code) || ILE_PETITE(p);
// Choix du joueur, pays par pays, depuis la Liste (code -> true/false) ; sinon la règle ci-dessus.
let CHOIX_POINTS = {};
try { CHOIX_POINTS = JSON.parse(localStorage.getItem("worldwise-points")) || {}; } catch (e) {}
// Un choix devenu identique au réglage par défaut n'a plus lieu d'être gardé.
for (const p of PAYS) if (p.code in CHOIX_POINTS && CHOIX_POINTS[p.code] === POINT_DEFAUT(p)) delete CHOIX_POINTS[p.code];
const aUnPoint = (p) => (p.code in CHOIX_POINTS ? CHOIX_POINTS[p.code] : POINT_DEFAUT(p));
function choisirPoint(p, oui) {
  const defaut = POINT_DEFAUT(p);
  if (oui === defaut) delete CHOIX_POINTS[p.code];
  else CHOIX_POINTS[p.code] = oui;
  try { localStorage.setItem("worldwise-points", JSON.stringify(CHOIX_POINTS)); } catch (e) {}
}
const PARTIES = (p) => PAYS.filter((q) => q.partie && q.de === p.code);

const W = 960, H = 600;

function cadre(b) {
  const pts = [];
  for (let x = b[0]; x <= b[2]; x += 5) for (let y = b[1]; y <= b[3]; y += 5) pts.push([x, y]);
  pts.push([b[2], b[3]], [b[0], b[3]], [b[2], b[1]]);
  return { type: "MultiPoint", coordinates: pts };
}

const MONDE = [-180, -70, 180, 84];

function projection(z, h = H) {
  const ext = [[8, 8], [W - 8, h - 8]];
  if (!z.bbox) return d3.geoNaturalEarth1().fitExtent(ext, cadre(MONDE));
  // L'Antarctique, écrasé en bande sur un planisphère, est vu du pôle.
  if (z.id === "AN") return d3.geoAzimuthalEqualArea().rotate([0, 90]).clipAngle(90).fitExtent(ext, cadre(z.bbox));
  // Les continents sont des morceaux du planisphère de la vue Monde, juste
  // agrandis ; seule une zone à cheval sur le 180e méridien (Océanie) est
  // recentrée pour ne pas être coupée en deux.
  const lon = z.bbox[2] > 180 ? -z.centre[0] : 0;
  return d3.geoNaturalEarth1().rotate([lon, 0]).fitExtent(ext, cadre(z.bbox));
}

// Sur un écran en hauteur (téléphone), la carte prend la hauteur disponible au lieu
// d'un cadre 960 × 600 : l'Afrique ou l'Europe s'affichent en grand (la vue Monde, plus large que haute, ne change pas).
function hauteurCarte(svg, z) {
  const larg = svg.getBoundingClientRect().width;
  const maxH = parseFloat(getComputedStyle(svg).maxHeight);
  if (!larg || !isFinite(maxH)) return H;
  const hMax = Math.min(W * 1.5, (W * maxH) / larg);
  if (hMax <= H) return H;
  const [[, y0], [, y1]] = d3.geoPath(projection(z, hMax)).bounds(cadre(z.bbox || MONDE));
  return Math.round(Math.max(H, Math.min(hMax, y1 - y0 + 16)));
}

function creerCarte(conteneur) {
  const R = 5, R_ANNEAU = 16;
  const svg = d3.select(conteneur).select("svg");
  let g, marqueurs, anneau, chemin, k = 1, h = H;
  let elems = new Map(); // code -> { chemin, marq, forme, centre }
  let transitoires = [];
  const zoom = d3.zoom().scaleExtent([1, 60]).clickDistance(5).on("zoom", (ev) => {
    k = ev.transform.k;
    g.attr("transform", ev.transform);
    g.selectAll("circle.marq").attr("r", R / Math.sqrt(k));
    if (anneau.attr("data-on")) anneau.attr("r", R_ANNEAU / k);
    placerNoms();
  });

  // Noms écrits sur la carte : chacun n'apparaît que s'il tient dans son pays
  // (ou, pour un point, une fois assez zoomé) et ne chevauche aucun autre nom ;
  // en zoomant, de plus en plus de noms s'affichent.
  const TAILLE_NOM = 10.5; // en pixels à l'écran, quel que soit l'appareil
  let noms = null, etiquettes = [];
  function placerNoms() {
    if (!noms) return;
    const ecranParUnite = (svg.node().getBoundingClientRect().width || W) / W;
    const t = TAILLE_NOM / ecranParUnite / k;
    noms.attr("font-size", t).attr("stroke-width", 3 / ecranParUnite / k);
    const poses = [];
    for (const n of etiquettes) {
      const l = n.l * t, hh = t;
      let ok = n.point ? k >= 3 : n.w * 1.15 >= l && n.h >= hh * 1.1;
      const x0 = n.point ? n.x + 7 / Math.sqrt(k) : n.x - l / 2;
      const b = [x0 - t * 0.2, n.y - hh * 0.6, x0 + l + t * 0.2, n.y + hh * 0.6];
      if (ok) ok = !poses.some((a) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]);
      if (ok) poses.push(b);
      n.el.attr("display", ok ? null : "none");
      if (n.point) n.el.attr("x", x0);
    }
  }

  conteneur.querySelector(".zoom-plus").onclick = () => svg.transition().duration(200).call(zoom.scaleBy, 2);
  conteneur.querySelector(".zoom-moins").onclick = () => svg.transition().duration(200).call(zoom.scaleBy, 0.5);
  conteneur.querySelector(".zoom-reset").onclick = () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);

  // actifs : codes cliquables ; les autres pays sont dessinés en fond.
  function dessiner(z, actifs, auClic, { titres = false, avecNoms = false } = {}) {
    svg.selectAll("*").remove();
    elems = new Map();
    transitoires = [];
    noms = null; etiquettes = [];
    h = hauteurCarte(svg.node(), z);
    svg.attr("viewBox", `0 0 ${W} ${h}`);
    const proj = projection(z, h);
    chemin = d3.geoPath(proj);
    g = svg.append("g");

    for (const [cle, f] of FORMES) {
      const p = PAR_NUM.get(cle);
      const actif = p && actifs.has(p.code);
      const el = g.append("path").attr("d", chemin(f)).attr("class", actif ? "pays" : "pays hors");
      if (actif) {
        el.attr("data-code", p.code).on("click", () => auClic(p));
        if (titres) el.append("title").text(p.nom);
        elems.set(p.code, { chemin: el, forme: f });
      }
    }

    // Seuls les pays qui ont un point (réglable dans la Liste) en reçoivent un ;
    // les autres n'ont que leur territoire, sans aucune zone de clic en plus.
    marqueurs = g.append("g");
    for (const p of PAYS) {
      if (!actifs.has(p.code)) continue;
      const e = elems.get(p.code) || {};
      elems.set(p.code, e);
      const point = aUnPoint(p);
      // Un point se place au centre géographique du pays (sur la sphère) : le centre
      // du dessin à plat tombe n'importe où pour un archipel à cheval sur le 180e
      // méridien (Kiribati se retrouvait sur l'Afrique dans la carte du monde).
      e.centre = !e.forme ? (p.ll ? proj(p.ll) : null)
        : point ? proj(p.ll || d3.geoCentroid(e.forme)) : chemin.centroid(e.forme);
      const pt = point ? e.centre : null;
      if (pt && isFinite(pt[0])) {
        e.marq = marqueurs.append("circle").attr("class", "marq point").attr("data-code", p.code)
          .attr("cx", pt[0]).attr("cy", pt[1]).attr("r", R)
          .on("click", () => auClic(p));
        if (titres) e.marq.append("title").text(p.nom);
      }
    }
    if (avecNoms) creerNoms(actifs);
    anneau = g.append("circle").attr("class", "anneau").attr("r", 0);
    svg.call(zoom).call(zoom.transform, d3.zoomIdentity);
  }

  // Le nom se place au centre du plus grand morceau du pays (la France
  // métropolitaine, pas la Guyane) ; les plus grands pays passent en premier.
  function creerNoms(actifs) {
    noms = g.append("g").attr("class", "noms");
    for (const p of PAYS) {
      const e = elems.get(p.code);
      if (!actifs.has(p.code) || !e || !e.centre || !isFinite(e.centre[0])) continue;
      let n;
      if (e.forme) {
        const geo = e.forme.geometry || e.forme;
        const morceaux = geo.type === "MultiPolygon"
          ? geo.coordinates.map((c) => ({ type: "Polygon", coordinates: c })) : [geo];
        let best = null, aire = -1;
        for (const m of morceaux) { const a = chemin.area(m); if (a > aire) { aire = a; best = m; } }
        const [[x0, y0], [x1, y1]] = chemin.bounds(best);
        const [x, y] = chemin.centroid(best);
        if (!isFinite(x)) continue;
        n = { x, y, w: x1 - x0, h: y1 - y0, aire: chemin.area(e.forme), point: false };
      } else if (e.marq) {
        n = { x: e.centre[0], y: e.centre[1], w: 0, h: 0, aire: 0, point: true };
      } else continue;
      if (e.marq && n.w < 1) n.point = true;
      n.el = noms.append("text").attr("class", "nom" + (n.point ? " nom-point" : ""))
        .attr("x", n.x).attr("y", n.y).text(p.nom);
      etiquettes.push(n);
    }
    // Largeur du texte pour une taille de 1 (mesurée une fois).
    noms.attr("font-size", 100);
    for (const n of etiquettes) {
      let l = 0;
      try { l = n.el.node().getComputedTextLength() / 100; } catch (err) {}
      n.l = l || n.el.text().length * 0.58;
    }
    etiquettes.sort((a, b) => (a.point - b.point) || b.aire - a.aire);
  }

  // Un pays sans forme propre (Royaume-Uni) est montré par ses nations.
  function classer(p, cls, transitoire = true) {
    const e = elems.get(p.code);
    if (!e || (!e.chemin && !e.marq)) {
      for (const q of PARTIES(p)) classer(q, cls, transitoire);
      return;
    }
    for (const el of [e.chemin, e.marq]) if (el) el.classed(cls, true);
    if (transitoire) transitoires.push([p, cls]);
  }

  function montrerAnneau(p, cls = "") {
    const e = elems.get(p.code);
    if (!e || !e.marq || !e.centre) return;
    anneau.attr("data-on", 1).attr("class", "anneau " + cls)
      .attr("cx", e.centre[0]).attr("cy", e.centre[1]).attr("r", R_ANNEAU / k);
    anneau.raise();
  }

  function nettoyer() {
    for (const [p, cls] of transitoires) {
      const e = elems.get(p.code);
      for (const el of [e.chemin, e.marq]) if (el) el.classed(cls, false);
    }
    transitoires = [];
    anneau.attr("data-on", null).attr("r", 0);
  }

  // Zoome sur un pays (recherche, lien vers un voisin).
  function centrer(p) {
    const parties = PARTIES(p).map((q) => elems.get(q.code)).filter((e) => e && e.forme);
    const propre = elems.get(p.code);
    const e = (propre && propre.centre) ? propre : (parties.length
      ? { forme: { type: "FeatureCollection", features: parties.map((q) => q.forme) }, centre: parties[0].centre }
      : null);
    if (!e || !e.centre) return;
    let [[x0, y0], [x1, y1]] = e.forme ? chemin.bounds(e.forme)
      : [[e.centre[0] - 4, e.centre[1] - 4], [e.centre[0] + 4, e.centre[1] + 4]];
    if (!isFinite(x0) || x1 - x0 > W * 0.9) [[x0, y0], [x1, y1]] = [e.centre, e.centre];
    const s = Math.max(1, Math.min(12, 0.5 / Math.max((x1 - x0) / W, (y1 - y0) / h, 0.04)));
    const t = d3.zoomIdentity.translate(W / 2, h / 2).scale(s).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    svg.transition().duration(450).call(zoom.transform, t);
  }

  return { dessiner, classer, montrerAnneau, nettoyer, centrer, a: (p) => elems.has(p.code) };
}

const carteJeu = creerCarte($("#carte-jeu"));
const carteExplorer = creerCarte($("#carte-explorer"));

// --- Écrans ----------------------------------------------------------------

function ecran(id) {
  for (const s of document.querySelectorAll("main > section")) s.hidden = s.id !== id;
  document.body.classList.toggle("large", id === "explorer" || (id === "jeu" && etat.theme === "map"));
  document.body.classList.toggle("accueil", id === "menu");
  window.scrollTo(0, 0);
}

function segment(el, items, actif, auChoix, desactive = () => false) {
  el.innerHTML = "";
  for (const [v, libelle] of items) {
    const b = document.createElement("button");
    b.textContent = libelle;
    b.classList.toggle("on", v === actif);
    b.disabled = desactive(v);
    b.onclick = () => auChoix(v);
    el.append(b);
  }
}

// Une combinaison de continents choisie au menu s'ajoute aux onglets (après Monde).
function libellesZones(compte, actuelle) {
  const zones = [...ZONES];
  if (actuelle.includes("+")) zones.splice(1, 0, zoneDe(actuelle));
  return zones.map((z) => [z.id, `${z.nom} (${compte(z.id)})`]);
}

// --- Menu ------------------------------------------------------------------

const echapper = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const auHasard = (t) => t[Math.floor(Math.random() * t.length)];

// Fond de carte simplifié de chaque zone pour les illustrations du menu :
// les points à moins de 2 px du précédent sont ignorés (tracés légers, rendu rapide).
const fonds = new Map();
function fondCarte(zid) {
  if (fonds.has(zid)) return fonds.get(zid);
  const proj = projection(zoneDe(zid));
  const filtre = (sortie) => {
    let px, py, lx, ly, reste = false;
    return {
      point(x, y) {
        if (px === undefined || Math.abs(x - px) + Math.abs(y - py) >= 2) {
          sortie.point(x, y); px = x; py = y; reste = false;
        } else { lx = x; ly = y; reste = true; }
      },
      lineStart() { px = undefined; reste = false; sortie.lineStart(); },
      lineEnd() { if (reste) sortie.point(lx, ly); sortie.lineEnd(); },
      polygonStart() { sortie.polygonStart(); },
      polygonEnd() { sortie.polygonEnd(); },
      sphere() { if (sortie.sphere) sortie.sphere(); },
    };
  };
  const chemin = d3.geoPath({ stream: (s) => proj.stream(filtre(s)) });
  if (chemin.digits) chemin.digits(1);
  const pays = [];
  let base = "";
  for (const [cle, f] of FORMES) {
    const d = chemin(f);
    if (!d) continue;
    const p = PAR_NUM.get(cle);
    if (p && dansZone(p, zid)) {
      const teinte = (p.code.charCodeAt(0) * 7 + p.code.charCodeAt(1)) % 5;
      base += `<path class="c${teinte}" d="${d}"/>`;
      pays.push({ p, d, aire: chemin.area(f), centre: chemin.centroid(f) });
    } else {
      base += `<path class="hors" d="${d}"/>`;
    }
  }
  // Pays assez grands pour être mis en avant, et pas au bord de l'illustration.
  const vedettes = pays.filter((i) => i.centre[0] > 240 && i.centre[0] < 720 && i.centre[1] > 170 && i.centre[1] < 430)
    .sort((a, b) => b.aire - a.aire).slice(0, 12);
  const res = { base, vedettes: vedettes.length ? vedettes : pays.sort((a, b) => b.aire - a.aire).slice(0, 5) };
  fonds.set(zid, res);
  return res;
}

const svgCarte = (zid, cls, dessus = "") =>
  `<svg class="apercu ${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${fondCarte(zid).base}${dessus}</svg>`;

const VISUELS = {
  flags(zid) {
    const liste = melanger(selection(zid, "flags"));
    const images = Array.from({ length: 18 }, (_, i) => liste[i % liste.length]);
    return `<div class="mosaique">${images.map((p) => `<img src="${drapeau(p)}" alt="" loading="lazy">`).join("")}</div>`;
  },
  caps(zid) {
    let [p, ...autres] = melanger(selection(zid, "caps"));
    if (autres.length < 2) [p, ...autres] = [p || PAR_CODE.get("fr"), ...melanger(selection("WORLD", "caps")).filter((q) => q !== p)];
    const pastilles = melanger([p, ...autres.slice(0, 2)])
      .map((q) => `<span class="pastille${q === p ? " bonne" : ""}">${echapper(q.capitales[0].nom)}</span>`).join("");
    return `<div class="papier"><div class="quiz-capitale"><img class="drapeau-imprime" src="${drapeau(p)}" alt="">` +
      `<div class="pastilles">${pastilles}</div></div></div>`;
  },
  map(zid) {
    const v = auHasard(fondCarte(zid).vedettes);
    const [x, y] = v.centre;
    // La bulle est décalée en haut à droite pour ne pas cacher le pays.
    return svgCarte(zid, "gris", `<path class="vedette" d="${v.d}"/>` +
      `<line class="lien-bulle" x1="${x}" y1="${y}" x2="${x + 50}" y2="${y - 50}"/><circle class="bulle-point" cx="${x}" cy="${y}" r="6"/>` +
      `<g transform="translate(${x + 62},${y - 62})"><circle class="bulle" r="34"/><text class="bulle-texte" y="15" text-anchor="middle">?</text></g>`);
  },
  placer(zid) {
    const v = auHasard(fondCarte(zid).vedettes);
    const [x, y] = v.centre;
    return svgCarte(zid, "gris", `<circle class="onde" cx="${x}" cy="${y}" r="26"/><circle class="onde" cx="${x}" cy="${y}" r="52"/>` +
      `<g transform="translate(${x},${y})"><path class="epingle" d="M0 0C-16-22-26-36-26-50a26 26 0 1 1 52 0c0 14-10 28-26 50z"/><circle class="epingle-trou" cy="-50" r="9"/></g>`);
  },
  explore(zid) {
    const v = auHasard(fondCarte(zid).vedettes);
    return svgCarte(zid, "couleurs", `<path class="vedette" d="${v.d}"/>`) +
      `<div class="mini-fiche"><img src="${drapeau(v.p)}" alt=""><span><strong>${echapper(v.p.nom)}</strong>` +
      `${echapper(v.p.cap || "")}</span></div>`;
  },
  ecritures(zid) {
    const choix = melanger(languesDe(zid === "REV" ? "WORLD" : zid).slice()).slice(0, 3);
    return `<div class="papier"><div class="enseignes">${choix.map((l, i) =>
      `<span class="enseigne-mini e${i}">${echapper(auHasard(l.mots)[0])}</span>`).join("")}</div></div>`;
  },
  "dico-ecritures"(zid) {
    const choix = melanger(languesDe(zid).slice()).slice(0, 3);
    return `<div class="papier"><div class="mini-liste">${choix.map((l) =>
      `<div class="dico-ligne"><strong>${echapper(l.nom)}</strong><span>${echapper(l.mots[0][0])}</span></div>`).join("")}</div></div>`;
  },
  "dico-panneaux"(zid) {
    const photos = melanger(paysPanneaux(zid).flatMap((p) => photosDe("panneaux", p).slice(0, 1))).slice(0, 6);
    return `<div class="mosaique mosaique-photos">${photos.map(([f]) => `<img src="${f}" alt="" loading="lazy">`).join("")}</div>`;
  },
  liste(zid) {
    const lignes = melanger(PAYS.filter((p) => dansZone(p, zid) && p.capitales.length)).slice(0, 4);
    return `<div class="papier"><div class="mini-liste">${lignes.map((p) =>
      `<div><img src="${drapeau(p)}" alt=""><strong>${echapper(p.nom)}</strong><span>${echapper(p.cap)}</span></div>`).join("")}</div></div>`;
  },
};

function construireMenu() {
  $("#sous-titre").textContent = `Drapeaux, capitales et carte des ${PAYS.length} pays et territoires du monde`;
  const zones = $("#seg-zone");
  zones.innerHTML = "";
  for (const z of ZONES) {
    const on = z.id === etat.zone || continentsDe(etat.zone).includes(z.id);
    const b = el("button", (on ? "on " : "") + (z.id === "REV" ? "zone-rev" : ""));
    b.setAttribute("aria-pressed", on);
    const nom = el("span", null, z.nom);
    if (z.id === "REV") nom.insertAdjacentHTML("afterbegin", icone("reviser"));
    b.append(nom, el("span", "nombre", PAYS.filter((p) => dansZone(p, z.id)).length));
    b.onclick = () => { etat.zone = basculerZone(z.id); sauver(); construireMenu(); };
    zones.append(b);
  }
  segment($("#seg-reponse"), REPONSES, etat.reponse, (v) => { etat.reponse = v; sauver(); construireMenu(); });
  afficherDelai();

  const jeux = $("#jeux");
  jeux.innerHTML = "";
  const nomReponse = etat.reponse === "qcm" ? "4 choix" : "saisie libre";
  for (const section of SECTIONS) {
    const bloc = el("section", "bloc-jeux");
    bloc.append(el("h2", null, section.titre));
    const tuiles = el("div", "tuiles");
    for (const [choix, titre, desc] of section.jeux) {
      if (estDico(choix)) {
        tuiles.append(tuile(choix, titre, desc, choix === "dico-ecritures"
          ? `${languesDe(zoneDico()).length} langues` : `${paysDico(zoneDico()).length} pays`));
        continue;
      }
      const decouverte = choix === "liste" || choix === "explore";
      const geo = choix === "ecritures";
      const n = decouverte ? PAYS.filter((p) => dansZone(p, etat.zone)).length
        : choix === "ecritures" ? (etat.zone === "REV" ? 0 : languesDe(etat.zone).length)
        : selection(etat.zone, choix === "placer" ? "map" : choix).length;
      const vide = n === 0 && etat.zone === "REV";
      const compte = vide ? (choix === "liste" ? "Choisis-y les pays à réviser"
        : decouverte ? "Aucun pays à réviser" : geo ? "Pas de liste « à réviser » pour ce jeu"
        : "Aucun pays à réviser pour ce jeu")
        : decouverte ? `${n} pays et territoires`
        : choix === "ecritures" ? `${n} langues · ${nomReponse}`
        : `${n} question${n > 1 ? "s" : ""}${choix === "placer" ? "" : ` · ${nomReponse}`}`;
      const b = tuile(choix, titre, desc, compte);
      b.disabled = vide && choix !== "liste";
      tuiles.append(b);
    }
    bloc.append(tuiles);
    jeux.append(bloc);
  }
}

function tuile(choix, titre, desc, compte) {
  const b = el("button", `tuile tuile-${choix}`);
  b.dataset.jeu = choix;
  b.innerHTML = `<div class="visuel">${VISUELS[choix](zoneVisuel(choix))}</div>`;
  const texte = el("div", "texte");
  const tete = el("div", "tete");
  tete.innerHTML = `<span class="icone">${icone(choix === "placer" ? "map" : estDico(choix) ? "dico" : choix)}</span>`;
  tete.append(el("strong", null, titre));
  texte.append(tete, el("span", "desc", desc), el("span", "compte", compte));
  b.append(texte);
  b.onclick = () => lancer(choix);
  return b;
}

// Illustrations en zone « À réviser » : les pays de la liste quand il y en a, sinon le monde.
function zoneVisuel(choix) {
  if (etat.zone !== "REV") return etat.zone;
  if (["map", "placer", "explore", "ecritures"].includes(choix) || estDico(choix)) return "WORLD";
  const n = choix === "liste" ? PAYS.filter((p) => dansZone(p, "REV")).length : selection("REV", choix).length;
  return n ? "REV" : "WORLD";
}

function menu() {
  if (jeu) clearTimeout(jeu.timer);
  construireMenu();
  ecran("menu");
}

function lancer(choix) {
  if (choix === "liste") {
    zoneRevue = etat.zone === "REV" && !PAYS.some((p) => dansZone(p, "REV")) ? "WORLD" : etat.zone;
    return revue();
  }
  if (choix === "explore") return explorer(etat.zone);
  if (estDico(choix)) return dictionnaire(choix, zoneDico());
  etat.theme = choix === "placer" ? "map" : choix;
  etat.mode = choix === "placer" ? "placer" : etat.reponse;
  sauver();
  demarrer(questionsDuJeu());
}

// --- Jeu -------------------------------------------------------------------

let jeu = null;

// Deux curseurs (menu et barre de jeu) pour le même réglage.
const curseurs = document.querySelectorAll(".curseur-delai");
function afficherDelai() {
  const texte = `${(etat.delaiErreur / 1000).toLocaleString("fr-FR")} s`;
  for (const c of curseurs) c.value = etat.delaiErreur;
  for (const o of document.querySelectorAll(".valeur-delai")) o.textContent = texte;
}
for (const c of curseurs) {
  c.addEventListener("input", () => {
    etat.delaiErreur = Number(c.value);
    afficherDelai();
    sauver();
  });
}

function demarrer(liste) {
  if (!liste.length) return menu();  // « À réviser » vidée entre-temps
  jeu = { liste: melanger(liste.slice()), i: 0, ok: 0, ko: 0, erreurs: [], bloque: false, timer: null };
  ecran("jeu");
  $("#titre-jeu").textContent = `${NOMS_THEMES[etat.theme]} · ${NOMS_MODES[etat.mode]} · ${zoneDe(etat.zone).nom}`;
  afficherDelai();
  const carte = etat.theme === "map";
  $("#carte-jeu").hidden = !carte;
  $("#carte-jeu").classList.toggle("cliquable", etat.mode === "placer");
  if (carte) carteJeu.dessiner(zoneCarte(etat.zone, jeu.liste), new Set(jeu.liste.map((p) => p.code)), clicCarte);
  question();
}

function question() {
  const p = jeu.liste[jeu.i];
  jeu.bloque = false;
  $("#progres").textContent = `${jeu.i + 1} / ${jeu.liste.length}`;
  afficherScore();
  $("#retour").textContent = "";
  $("#retour").className = "";

  const q = $("#question");
  if (pourEcritures()) {
    // Le pays proposé parmi les 4 choix : un des pays de la langue, dans la zone si possible.
    const z = etat.zone === "REV" ? "WORLD" : etat.zone;
    const dans = p.pays.filter((c) => dansZone(PAR_CODE.get(c), z));
    p.bon = PAR_CODE.get(auHasard(dans.length ? dans : p.pays));
    p.code = p.bon.code;
    q.innerHTML = '<div class="enseigne"></div><p class="consigne">Dans quel pays ?</p>';
    q.querySelector(".enseigne").textContent = p.mot;
  } else if (etat.theme === "flags" || etat.theme === "caps") {
    q.innerHTML = `<img class="drapeau" alt="drapeau à identifier" src="${drapeau(p)}">`;
  } else if (etat.mode === "placer") {
    q.innerHTML = "Où se trouve <strong></strong> ?";
    q.querySelector("strong").textContent = p.nom;
  } else {
    q.textContent = "Quel est ce pays ?";
    carteJeu.classer(p, "cible");
    carteJeu.montrerAnneau(p);
  }

  q.dataset.code = p.code;
  const zoneRep = $("#reponses");
  zoneRep.innerHTML = "";
  if (etat.mode === "qcm") {
    for (const option of propositions(p)) {
      const b = document.createElement("button");
      b.textContent = attendu(option);
      b.onclick = () => choisir(b, option, p);
      b.dataset.code = option.code;
      zoneRep.append(b);
    }
  } else if (etat.mode === "saisie") {
    const form = document.createElement("form");
    form.innerHTML = `<input autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go"
      role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggestions"
      placeholder="${pourCapitales() ? "Capitale" : "Pays"}… (Entrée pour valider, vide pour passer)">
      <ul id="suggestions" class="suggestions" role="listbox" hidden></ul>`;
    const input = form.querySelector("input");
    const sugg = brancherSuggestions(input, form.querySelector("ul"), () => form.requestSubmit());
    form.onsubmit = (e) => {
      e.preventDefault();
      if (jeu.bloque) return;
      sugg.prendre();
      sugg.fermer();
      const r = verifier(input.value, p);
      input.disabled = true;
      input.classList.add(r.ok ? "good" : "bad");
      const complet = pourCapitales() && p.capitales.length > 1 ? `Capitales : ${p.cap}`
        : pourEcritures() ? detailMot(p) : "";
      repondre(p, r.ok, r.ok ? (r.approx && !estMot(p) ? `Orthographe : ${attendu(p)}` : complet)
        : `Réponse : ${attendu(p)}${pourEcritures() ? ` · ${detailMot(p)}` : ""}`);
    };
    zoneRep.append(form);
    input.focus();
  }

  const suivant = jeu.liste[jeu.i + 1];
  if (suivant && (etat.theme === "flags" || etat.theme === "caps")) new Image().src = drapeau(suivant);
}

// « Polonais · boulangerie », dit après la réponse.
const detailMot = (m) => `${m.l.nom} · « ${m.sens} »`;


// --- Suggestions de la saisie libre -----------------------------------------
// Tous les pays (ou toutes les capitales) du monde sont proposés, pas seulement
// ceux du quiz : la liste aide à aller vite sans souffler la réponse.
const CANDIDATS = {};
function candidats() {
  const theme = pourCapitales() ? "caps" : "noms";
  if (CANDIDATS[theme]) return CANDIDATS[theme];
  const parNom = new Map();
  const ajouter = (nom, autres = []) => {
    const c = parNom.get(nom) || { nom, n: normaliser(nom), cles: new Set() };
    for (const a of [nom, ...autres]) c.cles.add(normaliser(a));
    parNom.set(nom, c);
  };
  for (const p of PAYS) {
    if (theme === "noms") ajouter(p.nom, p.altN);
    else p.capitales.forEach((c) => ajouter(c.nom, p.capitales.length === 1 ? p.altC : []));
  }
  return (CANDIDATS[theme] = [...parNom.values()].map((c) => ({ ...c, cles: [...c.cles] })));
}

// Rang d'un candidat pour la saisie s (plus petit = mieux), ou -1 s'il ne correspond pas.
function rang(c, s) {
  if (c.n === s || c.cles.includes(s)) return 0;
  if (c.n.startsWith(s)) return 1;
  if (c.n.split(" ").some((m) => m.startsWith(s))) return 2;
  if (c.cles.some((k) => k.startsWith(s) || k.split(" ").some((m) => m.startsWith(s)))) return 3;
  if (s.length >= 3 && c.cles.some((k) => k.includes(s))) return 4;
  return -1;
}

function brancherSuggestions(input, ul, valider) {
  const MAX = 6;
  let items = [], actif = -1;
  const surligner = (i) => {
    actif = i;
    [...ul.children].forEach((li, j) => li.setAttribute("aria-selected", j === i));
    if (i >= 0) input.setAttribute("aria-activedescendant", ul.children[i].id);
    else input.removeAttribute("aria-activedescendant");
  };
  const fermer = () => {
    items = []; ul.innerHTML = ""; ul.hidden = true;
    input.setAttribute("aria-expanded", "false");
    surligner(-1);
  };
  const ouvrir = () => {
    const s = normaliser(input.value);
    if (!s || input.disabled) return fermer();
    items = candidats()
      .map((c) => [rang(c, s), c])
      .filter(([r]) => r >= 0)
      .sort((a, b) => a[0] - b[0] || a[1].nom.localeCompare(b[1].nom, "fr"))
      .slice(0, MAX)
      .map(([, c]) => c);
    if (!items.length) return fermer();
    ul.innerHTML = "";
    items.forEach((c, i) => {
      const li = document.createElement("li");
      li.id = `suggestion-${i}`;
      li.setAttribute("role", "option");
      li.textContent = c.nom;
      li.onmousedown = (e) => e.preventDefault();  // garde le clavier ouvert
      li.onclick = () => { surligner(i); valider(); };
      ul.append(li);
    });
    ul.hidden = false;
    input.setAttribute("aria-expanded", "true");
    surligner(0);  // Entrée prend la première suggestion
    ul.scrollIntoView({ block: "nearest" });
  };
  input.addEventListener("input", ouvrir);
  input.addEventListener("keydown", (e) => {
    if (!items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = items.length;
      surligner((actif + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Escape") {
      e.preventDefault();
      fermer();
    } else if (e.key === "Tab" && actif >= 0) {
      e.preventDefault();
      input.value = items[actif].nom;
      ouvrir();
    }
  });
  return {
    prendre: () => { if (actif >= 0 && items[actif]) input.value = items[actif].nom; },
    fermer,
  };
}

// 3 leurres du même continent, pris dans la même sélection : plus instructif
// que des réponses absurdes.
function propositions(p) {
  // Langues : des pays où on écrit une langue voisine (même alphabet, puis
  // alphabet ressemblant), jamais un pays où la langue du mot se lit aussi.
  if (pourEcritures()) {
    const ecr = ECRITURE.get(p.l.ecriture);
    const voisines = (f) => melanger(LANGUES.filter((l) => l !== p.l && f(l)).slice())
      .flatMap((l) => melanger(l.pays.split(" ").slice()));
    const ordre = [
      ...voisines((l) => l.ecriture === p.l.ecriture),
      ...voisines((l) => ecr.famille && ECRITURE.get(l.ecriture).famille === ecr.famille),
      ...melanger(PAYS.map((q) => q.code)),
    ];
    const z = etat.zone === "REV" ? "WORLD" : etat.zone;
    const possibles = [...new Set(ordre)].filter((c) => PAR_CODE.has(c) && !p.pays.includes(c) && !PAR_CODE.get(c).partie);
    // de la zone choisie d'abord (en Europe, des leurres européens)
    const leurres = [...possibles.filter((c) => dansZone(PAR_CODE.get(c), z)), ...possibles]
      .filter((c, i, t) => t.indexOf(c) === i).slice(0, 3).map((c) => PAR_CODE.get(c));
    return melanger([p.bon, ...leurres]);
  }
  const vus = new Set([attendu(p)]);
  const leurres = [];
  const candidats = selection("WORLD").filter((q) => q !== p);
  const memeContinent = melanger(candidats.filter((q) => q.ct === p.ct));
  for (const q of [...memeContinent, ...melanger(candidats)]) {
    if (vus.has(attendu(q))) continue;
    vus.add(attendu(q));
    leurres.push(q);
    if (leurres.length === 3) break;
  }
  return melanger([p, ...leurres]);
}

function choisir(bouton, option, p) {
  if (jeu.bloque) return;
  const juste = pourEcritures() ? option === p.bon : option === p;
  for (const b of document.querySelectorAll("#reponses button")) {
    b.disabled = true;
    if (b.dataset.code === p.code) b.classList.add("good");
  }
  if (!juste) bouton.classList.add("bad");
  // Les couleurs des boutons suffisent ; pour un mot, on dit aussi la langue, le sens et ses pays.
  repondre(p, juste, pourEcritures() ? `${detailMot(p)}${juste ? "" : ` · ${listePays(p)}`}` : "");
}

function clicCarte(clique) {
  if (!jeu || jeu.bloque || etat.mode !== "placer") return;
  const p = jeu.liste[jeu.i];
  const juste = clique === p;
  if (juste) {
    carteJeu.classer(p, "good");
  } else {
    carteJeu.classer(clique, "bad");
    carteJeu.classer(p, "good");
    carteJeu.montrerAnneau(p, "good");
  }
  repondre(p, juste, juste ? "" : `Vous avez cliqué : ${clique.nom}`);
}

function afficherScore() {
  $("#score").innerHTML = `<span class="ok">✓ ${jeu.ok}</span>  <span class="ko">✗ ${jeu.ko}</span>`;
}

function repondre(p, juste, message) {
  jeu.bloque = true;
  jeu.dernier = juste;
  if (juste) jeu.ok++;
  else { jeu.ko++; jeu.erreurs.push(p); }
  afficherScore();
  const r = $("#retour");
  r.className = juste ? "good" : "bad";
  r.textContent = message;
  if (document.activeElement && !document.activeElement.classList.contains("curseur-delai")) document.activeElement.blur();
  jeu.timer = setTimeout(suivant, juste ? DELAI_JUSTE : etat.delaiErreur);
}

function suivant() {
  if (!jeu || !jeu.bloque) return;
  clearTimeout(jeu.timer);
  if (etat.theme === "map") {
    carteJeu.nettoyer();
    carteJeu.classer(jeu.liste[jeu.i], jeu.dernier ? "trouve" : "rate", false);
  }
  jeu.i++;
  if (jeu.i >= jeu.liste.length) fin();
  else question();
}

function fin() {
  const total = jeu.liste.length;
  $("#fin-titre").textContent = `${jeu.ok} / ${total}  ·  ${Math.round((100 * jeu.ok) / total)} %`;
  $("#fin-detail").textContent = jeu.erreurs.length
    ? `${jeu.erreurs.length} erreur(s) à revoir :`
    : "Aucune erreur.";
  $("#rejouer-erreurs").hidden = !jeu.erreurs.length;
  if (pourEcritures()) remplirMots($("#fin-erreurs"), jeu.erreurs);
  else remplirTable($("#fin-erreurs"), jeu.erreurs, REVISER[etat.theme] ? [etat.theme] : [], majBoutonsFin);
  majBoutonsFin();
  jeu.bloque = false;
  ecran("fin");
}

// Boutons de l'écran de fin, recalculés à chaque ajout ou retrait.
function majBoutonsFin() {
  const t = etat.theme;
  if (!REVISER[t]) {  // jeux GeoGuessr : pas de liste « à réviser »
    for (const id of ["#ajouter-erreurs", "#retirer-reussis", "#fin-aide"]) $(id).hidden = true;
    return;
  }
  const manquantes = [...new Set(jeu.erreurs)].filter((p) => !REVISER[t].has(p.code));
  const tout = $("#ajouter-erreurs");
  tout.hidden = !manquantes.length;
  tout.textContent = manquantes.length === 1 ? "Ajouter l'erreur aux « à réviser »"
    : `Ajouter les ${manquantes.length} erreurs aux « à réviser »`;
  tout.onclick = () => {
    marquer(t, manquantes.map((p) => p.code), true);
    remplirTable($("#fin-erreurs"), jeu.erreurs, [t], majBoutonsFin);
    majBoutonsFin();
  };
  const erreurs = new Set(jeu.erreurs);
  const acquis = etat.zone === "REV" ? jeu.liste.filter((p) => !erreurs.has(p) && REVISER[t].has(p.code)) : [];
  const retirer = $("#retirer-reussis");
  retirer.hidden = !acquis.length;
  retirer.textContent = acquis.length === 1 ? "Retirer le pays réussi des « à réviser »"
    : `Retirer les ${acquis.length} pays réussis des « à réviser »`;
  retirer.onclick = () => { marquer(t, acquis.map((p) => p.code), false); majBoutonsFin(); };
  const aide = $("#fin-aide");
  aide.hidden = !jeu.erreurs.length;
  aide.innerHTML = `${icone(t)} ajoute ou retire un pays de tes « à réviser » (${NOMS_REV[t]}).`;
}

// Bouton « à réviser » d'un pays pour un thème (allumé = dans la liste).
function boutonRevision(p, theme, apres) {
  const b = el("button", "rev");
  b.dataset.theme = theme;
  b.dataset.code = p.code;
  const maj = () => {
    const oui = REVISER[theme].has(p.code);
    b.classList.toggle("on", oui);
    b.setAttribute("aria-pressed", String(oui));
    b.title = `${oui ? "Retirer des" : "Ajouter aux"} « à réviser » (${NOMS_REV[theme]})`;
    b.setAttribute("aria-label", `${b.title} : ${p.nom}`);
  };
  b.innerHTML = icone(theme);
  b.onclick = () => {
    marquer(theme, [p.code], !REVISER[theme].has(p.code));
    maj();
    if (apres) apres();
  };
  maj();
  return b;
}

function boutonPoint(p, apres) {
  const b = el("button", "rev rev-point");
  b.dataset.code = p.code;
  const maj = () => {
    const oui = aUnPoint(p);
    b.classList.toggle("on", oui);
    b.setAttribute("aria-pressed", String(oui));
    b.title = oui ? "Point affiché sur la carte : le retirer" : "Pas de point sur la carte : en afficher un";
    b.setAttribute("aria-label", `${b.title} (${p.nom})`);
  };
  b.innerHTML = icone("point");
  b.onclick = () => { choisirPoint(p, !aUnPoint(p)); maj(); if (apres) apres(); };
  maj();
  return b;
}

// Erreurs du jeu des écritures : le mot, son écriture, sa langue et son sens.
function remplirMots(table, liste) {
  table.innerHTML = "";
  for (const m of new Set(liste)) {
    const tr = table.insertRow();
    const mot = tr.insertCell();
    mot.className = "mot";
    mot.textContent = m.mot;
    const nom = tr.insertCell();
    nom.textContent = m.l.nom;
    nom.append(el("small", null, `« ${m.sens} » · ${listePays(m, 6)}`));
    tr.insertCell().className = "cap";
  }
}

// themes : boutons « à réviser » en bout de ligne (aucun, celui du quiz, ou les trois dans la liste) ;
// points : bouton du point sur la carte (dans la liste).
function remplirTable(table, liste, themes = [], apres = null, points = false) {
  table.innerHTML = "";
  for (const p of new Set(liste)) {
    const tr = table.insertRow();
    tr.insertCell().innerHTML = `<img alt="" loading="lazy" src="${drapeau(p)}">`;
    const nom = tr.insertCell();
    nom.textContent = p.nom;
    if (p.territoire) {
      const s = document.createElement("small");
      s.textContent = p.de ? `territoire · ${PAR_CODE.get(p.de).nom}` : "territoire";
      nom.append(s);
    }
    nom.append(el("small", "cap-mini", p.cap || "—"));  // capitale sous le nom, sur téléphone
    const cap = tr.insertCell();
    cap.className = "cap";
    cap.textContent = p.cap || "—";
    if (!themes.length) continue;
    const revs = tr.insertCell();
    revs.className = "revs";
    const boutons = el("div", "boutons");
    revs.append(boutons);
    for (const t of themes) boutons.append(jouable(p, t) ? boutonRevision(p, t, apres) : el("span", "rev-vide"));
    if (points) boutons.append(SUR_CARTE.has(p.code) ? boutonPoint(p, apres) : el("span", "rev-vide"));
  }
}

// --- Exploration ------------------------------------------------------------

let zoneExplorer = "WORLD";

function explorer(z, choisi = null) {
  zoneExplorer = z;
  ecran("explorer");
  segment($("#seg-explorer"), libellesZones((id) => PAYS.filter((p) => dansZone(p, id)).length, etat.zone),
    z, (v) => explorer(v));
  carteExplorer.dessiner(zoneDe(z), new Set(PAYS.filter((p) => dansZone(p, z)).map((p) => p.code)),
    (p) => selectionner(p), { titres: true, avecNoms: true });
  if (choisi) selectionner(choisi, true);
  else $("#fiche").innerHTML = '<p class="vide">Choisis un pays sur la carte, ou cherche-le ci-dessus.</p>';
}

function selectionner(p, centrer = false) {
  if (!dansZone(p, zoneExplorer)) return explorer(p.ct, p);
  carteExplorer.nettoyer();
  carteExplorer.classer(p, "cible");
  carteExplorer.montrerAnneau(p);
  if (centrer) carteExplorer.centrer(p);
  afficherFiche(p);
}

function el(tag, cls, texte) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (texte != null) e.textContent = texte;
  return e;
}

function puces(liste) {
  const div = el("div", "puces");
  for (const q of liste) {
    const b = el("button", "puce", q.nom);
    b.onclick = () => selectionner(q, true);
    div.append(b);
  }
  return div;
}

function langue(code, nomAnglais) {
  let nom = NOMS_LANGUES[code] || nomAnglais;
  if (!NOMS_LANGUES[code]) {
    try {
      const fr = nomsLangues.of(code);
      if (fr && fr.toLowerCase() !== code) nom = fr;
    } catch (e) {}
  }
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

function monnaie(code) {
  let nom = code;
  try { nom = nomsMonnaies.of(code); } catch (e) {}
  return nom === code ? code : `${nom} (${code})`;
}

function afficherFiche(p) {
  const info = INFOS[p.code] || {};
  const fiche = $("#fiche");
  fiche.innerHTML = "";
  fiche.dataset.code = p.code;
  const img = el("img", "fiche-drapeau");
  img.src = drapeau(p);
  img.alt = `drapeau : ${p.nom}`;
  fiche.append(img, el("h2", null, p.nom));
  if (p.territoire) fiche.append(el("p", "statut", p.statut || `Territoire rattaché à ${PAR_CODE.get(p.de).nom}`));
  if (p.altN.length) fiche.append(el("p", "statut", `Aussi appelé : ${p.altN.join(", ")}`));

  const dl = el("dl");
  const ligne = (titre, contenu) => {
    if (contenu == null || contenu === "") return;
    dl.append(el("dt", null, titre));
    const dd = el("dd");
    if (contenu instanceof Node) dd.append(contenu); else dd.textContent = contenu;
    dl.append(dd);
  };

  if (p.capitales.length) {
    const ul = el("ul", "capitales");
    for (const c of p.capitales) {
      const li = el("li", null, c.nom);
      if (c.role) li.append(el("span", "role", ` — ${c.role}`));
      ul.append(li);
    }
    ligne(p.capitales.length > 1 ? "Capitales" : "Capitale", ul);
  } else {
    ligne("Capitale", "Aucune");
  }
  const sr = SOUS_REGIONS[info.sr] || info.sr;
  ligne("Continent", zoneDe(p.ct).nom + (sr && sr !== zoneDe(p.ct).nom ? ` · ${sr}` : ""));
  if (info.pop) ligne("Population", `${nombre.format(info.pop)} hab. (${info.an})`);
  if (info.sup) ligne("Superficie", `${nombre.format(info.sup)} km²`);
  if (info.pop && info.sup) ligne("Densité", `${nombre.format(Math.round(info.pop / info.sup))} hab./km²`);
  const langues = Object.entries(info.langues || {}).map(([c, n]) => langue(c, n));
  if (langues.length) ligne(langues.length > 1 ? "Langues officielles" : "Langue officielle", langues.join(", "));
  const monnaies = (info.monnaies || []).map(monnaie);
  if (monnaies.length) ligne(monnaies.length > 1 ? "Monnaies" : "Monnaie", monnaies.join(", "));
  ligne("Indicatif", info.tel);
  ligne("Domaine internet", info.tld);
  if (p.de) ligne("Rattaché à", puces([PAR_CODE.get(p.de)]));
  const nations = PARTIES(p);
  if (nations.length) ligne("Nations", puces(nations));
  const territoires = PAYS.filter((q) => q.de === p.code && !q.partie);
  if (territoires.length) ligne("Territoires", puces(territoires));
  const voisins = (info.voisins || []).map((c) => PAR_CODE.get(c)).filter(Boolean)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  ligne("Frontières", voisins.length ? puces(voisins) : "Aucune frontière terrestre");
  fiche.append(dl);
  if (p.note) fiche.append(el("p", "note", p.note));
}

// Recherche : nom exact (ou autre nom) choisi dans la liste, ou premier nom
// qui commence par la saisie quand on appuie sur Entrée.
const recherche = $("#recherche");
$("#noms-pays").innerHTML = PAYS.map((p) => `<option value="${p.nom.replace(/"/g, "&quot;")}">`).join("");
function trouver(texte, approx) {
  const s = normaliser(texte);
  if (!s) return null;
  const noms = (p) => [p.nom, ...p.altN].map(normaliser);
  return PAYS.find((p) => noms(p).includes(s))
    || (approx ? PAYS.find((p) => noms(p).some((n) => n.startsWith(s))) : null);
}
recherche.addEventListener("input", () => {
  const p = trouver(recherche.value, false);
  if (p) { selectionner(p, true); recherche.blur(); }
});
recherche.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const p = trouver(recherche.value, true);
  if (p) { recherche.value = p.nom; selectionner(p, true); recherche.blur(); }
});

// --- Révision --------------------------------------------------------------

let zoneRevue = "WORLD";
function revue() {
  segment($("#seg-revue"), libellesZones((id) => PAYS.filter((p) => dansZone(p, id)).length, etat.zone),
    zoneRevue, (v) => { zoneRevue = v; revue(); });
  const liste = PAYS.filter((p) => dansZone(p, zoneRevue))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  $("#revue-compte").textContent = `${liste.length} pays et territoires`;
  const aide = $("#revue-aide");
  const majPoints = () => {
    const n = PAYS.filter((p) => SUR_CARTE.has(p.code) && aUnPoint(p)).length;
    aide.querySelector(".nb-points").textContent = `${n} pays ont un point.`;
  };
  remplirTable($("#revue-table"), liste, THEMES_REV, majPoints, true);
  aide.innerHTML = `Marque les pays à réviser : ${icone("flags")} drapeau, ${icone("caps")} capitale, ` +
    `${icone("map")} emplacement. Joue-les ensuite avec la région « À réviser » du menu.<br>` +
    `${icone("point")} affiche ou retire le point d'un pays sur les cartes. <span class="nb-points"></span> ` +
    `<button class="lien copier-points">Copier la liste des points</button>`;
  majPoints();
  aide.querySelector(".copier-points").onclick = (e) => {
    const noms = PAYS.filter((p) => SUR_CARTE.has(p.code) && aUnPoint(p)).map((p) => p.nom).sort((a, b) => a.localeCompare(b, "fr"));
    const texte = `Points sur la carte (${noms.length}) : ${noms.join(", ")}`;
    const fait = () => { e.target.textContent = "Copié !"; setTimeout(() => { e.target.textContent = "Copier la liste des points"; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(texte).then(fait, () => window.prompt("Liste des points :", texte));
    else window.prompt("Liste des points :", texte);
  };
  ecran("revue");
}

// --- Repères (dictionnaires des jeux GeoGuessr) -------------------------------

const zoneDico = () => (etat.zone === "REV" ? "WORLD" : etat.zone);
const paysPanneaux = (z) => PAYS.filter((p) => photosDe("panneaux", p).length && dansZone(p, z));
// Dans le dictionnaire, aussi les pays qui ont une fiche mais pas (encore) de photo.
const paysDico = (z) => PAYS.filter((p) => (photosDe("panneaux", p).length || NOTES_PANNEAUX[p.code]) && dansZone(p, z));
const nomsPays = (codes) => codes.split(" ").map((c) => PAR_CODE.get(c)).filter(Boolean).map((p) => p.nom).join(", ");

function dictionnaire(type, z) {
  const ecr = type === "dico-ecritures";
  const compte = (id) => (ecr ? languesDe(id).length : paysDico(id).length);
  segment($("#seg-dico"), libellesZones(compte, etat.zone).filter(([id]) => id !== "REV"), z,
    (v) => dictionnaire(type, v));
  const contenu = $("#dico-contenu");
  contenu.innerHTML = "";
  if (ecr) {
    // Par écriture : comment la reconnaître, puis chacune de ses langues (lettres
    // spéciales, pays, exemples ; survoler un exemple donne son sens).
    const langues = languesDe(z);
    $("#dico-titre").textContent = `Repères : ${langues.length} langues`;
    for (const e of ECRITURES) {
      const siennes = langues.filter((l) => l.ecriture === e.id);
      if (!siennes.length) continue;
      const tete = el("article", "fiche-dico fiche-ecriture");
      tete.append(el("h3", null, `Alphabet ${e.nom.toLowerCase()}`), el("p", null, e.reperes));
      if (e.confusion) tete.append(el("p", "dico-confusion", `À ne pas confondre : ${e.confusion}`));
      contenu.append(tete);
      for (const l of siennes) {
        const fiche = el("article", "fiche-dico");
        fiche.append(el("h3", null, l.nom));
        const ex = el("div", "dico-exemples");
        for (const [mot, sens] of l.mots) {
          const m = el("span", "enseigne-mini", mot);
          m.title = sens;
          ex.append(m);
        }
        fiche.append(ex, el("p", null, l.indices), el("p", "dico-ou", `Pays : ${nomsPays(l.pays)}.`));
        contenu.append(fiche);
      }
    }
  } else {
    const liste = paysDico(z).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    $("#dico-titre").textContent = `Repères : panneaux de ${liste.length} pays`;
    for (const p of liste) {
      const f = el("article", "fiche-dico");
      const h = el("h3");
      h.innerHTML = `<img class="drapeau-mini" alt="" src="${drapeau(p)}">`;
      h.append(p.nom);
      f.append(h);
      if (NOTES_PANNEAUX[p.code]) f.append(el("p", null, NOTES_PANNEAUX[p.code]));
      const galerie = el("div", "dico-galerie");
      for (const [fichier, auteur] of photosDe("panneaux", p)) {
        const lien = el("a");
        lien.href = fichier;
        lien.target = "_blank";
        lien.title = `Photo : ${auteur ? `${auteur}, ` : ""}Mapillary (CC BY-SA 4.0)`;
        const img = el("img");
        img.loading = "lazy";
        img.alt = `Panneau, ${p.nom}`;
        img.src = fichier;
        lien.append(img);
        galerie.append(lien);
      }
      f.append(galerie);
      contenu.append(f);
    }
    contenu.append(el("p", "dico-source", "Repères des pays d'Europe d'après la carte de la signalisation européenne de u/Melongated. Photos : Mapillary (CC BY-SA 4.0)."));
  }
  ecran("dico");
}

// --- Application installable -------------------------------------------------

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  // Quand une nouvelle version prend la main, la page se recharge d'elle-même
  // une fois : la mise à jour se voit tout de suite, sans recharger à la main.
  const avait = !!navigator.serviceWorker.controller;
  let recharge = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (avait && !recharge) { recharge = true; location.reload(); }
  });
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
}
let invitation = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  invitation = e;
  $("#installer").hidden = false;
});
$("#installer").onclick = async () => {
  if (!invitation) return;
  invitation.prompt();
  await invitation.userChoice;
  invitation = null;
  $("#installer").hidden = true;
};

// --- Événements -----------------------------------------------------------

$("#quitter").onclick = menu;
$("#fin-menu").onclick = menu;
$("#explorer-menu").onclick = menu;
$("#recommencer").onclick = () => demarrer(questionsDuJeu());
$("#rejouer-erreurs").onclick = () => demarrer(jeu.erreurs);
$("#revue-menu").onclick = menu;
$("#dico-menu").onclick = menu;

menu();
})();
