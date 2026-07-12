import { useState, useEffect, useRef } from "react";
import { useApp } from "../store";
import { api } from "../apiClient";
import { cn } from "../utils/cn";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Printer,
  Calendar as CalendarIcon,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Upload,
} from "lucide-react";

// ============================================================================
//  Types
// ============================================================================
export interface ConducteurAction {
  id: string;
  content: string;
  sort_order: number;
}

export interface ConducteurResponsable {
  id: string;
  type: "vendor" | "user";
  ref_id: string;
  label: string; // nom affiché
  scope: string; // ex: "Orchestre religieux uniquement"
  color: string;
}

export interface ConducteurPhase {
  id: string;
  title: string;
  time_slot: string; // "14:00 — 15:00"
  actions: ConducteurAction[];
  note?: string;
  custom_html?: string;
  responsables: ConducteurResponsable[];
  completed: boolean;
  sort_order: number;
}

export interface ConducteurJour {
  id: string;
  label: string; // "Vodiondry", "Mariage civil", etc.
  date: string;
  subtitle: string; // "J-1 Veille", "Jour officiel"
  time_start: string;
  time_end: string;
  guest_count?: number;
  notes?: string;
  phases: ConducteurPhase[];
  sort_order: number;
}

const STORAGE_KEY = "weddingplan_conducteur_v1";

// Extrait "HH:MM" (le premier trouvé) d'une chaîne libre type "14:00 — 15:00"
// et le convertit en minutes depuis minuit, pour trier chronologiquement.
// Renvoie Infinity si aucune heure n'est trouvée (l'élément passe en fin de liste).
function parseTimeToMinutes(value: string): number {
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Infinity;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

// Trie par heure de début réelle ; en cas d'égalité (ou heures manquantes des
// deux côtés), retombe sur sort_order pour un ordre stable et modifiable.
// Réservé aux phases : elles vivent toutes dans le même jour, donc comparer
// seulement l'heure suffit.
function compareByTime<T extends { sort_order: number }>(
  getTime: (item: T) => string
): (a: T, b: T) => number {
  return (a, b) => {
    const diff = parseTimeToMinutes(getTime(a)) - parseTimeToMinutes(getTime(b));
    return diff !== 0 ? diff : a.sort_order - b.sort_order;
  };
}

// Trie les "jours" par date réelle puis heure de début. Contrairement aux
// phases (toutes dans le même jour), un conducteur peut s'étaler sur
// plusieurs dates (ex: Vodiondry le 15, Jour du Mariage le 16) — comparer
// uniquement l'heure de début ignorerait la date et inverserait l'ordre
// des jours (ex: 08:00 le 16 passerait avant 18:00 le 15).
function compareJoursByDateTime(a: ConducteurJour, b: ConducteurJour): number {
  const dateDiff = (a.date || "").localeCompare(b.date || "");
  if (dateDiff !== 0) return dateDiff;
  const diff = parseTimeToMinutes(a.time_start) - parseTimeToMinutes(b.time_start);
  return diff !== 0 ? diff : a.sort_order - b.sort_order;
}

// ============================================================================
//  Données de démonstration (Madagascar — 3 cérémonies)
// ============================================================================
const DEFAULT_CONDUCTEUR: ConducteurJour[] = [
  {
    id: "j_veille",
    label: "Veille du mariage",
    date: "2026-07-15",
    subtitle: "J-1 — Installation",
    time_start: "08:00",
    time_end: "20:00",
    guest_count: 0,
    notes: "Journée dédiée à l'installation et aux tests techniques.",
    sort_order: 1,
    phases: [
      {
        id: "v_p1",
        title: "Installation matérielle",
        time_slot: "08:00 — 12:00",
        actions: [
          { id: "a1", content: "Arrivée équipe coordination", sort_order: 1 },
          { id: "a2", content: "Livraison matériel décoration — Jennya", sort_order: 2 },
          { id: "a3", content: "Installation complète de la décoration", sort_order: 3 },
          { id: "a4", content: "Livraison et installation jeux de lumières", sort_order: 4 },
        ],
        responsables: [
          { id: "r1", type: "vendor", ref_id: "jennya", label: "Jennya", scope: "Décoration complète", color: "#7551FF" },
          { id: "r2", type: "user", ref_id: "p_lem_002", label: "Sophie", scope: "Supervision", color: "#06b6d4" },
        ],
        completed: false,
        sort_order: 1,
      },
      {
        id: "v_p2",
        title: "Tests techniques",
        time_slot: "14:00 — 17:00",
        actions: [
          { id: "a5", content: "Balance et tests son orchestre Album Music", sort_order: 1 },
          { id: "a6", content: "Tests jeux de lumières", sort_order: 2 },
          { id: "a7", content: "Tests écrans géants Mi Rec", sort_order: 3 },
          { id: "a8", content: "Tour de vérification générale — Coordinateur", sort_order: 4 },
        ],
        responsables: [
          { id: "r3", type: "vendor", ref_id: "album", label: "Album Music", scope: "Balance uniquement", color: "#05CD99" },
          { id: "r4", type: "vendor", ref_id: "mre", label: "MRE", scope: "Sonorisation salle uniquement (pas église)", color: "#FFCE20" },
        ],
        completed: false,
        sort_order: 2,
      },
    ],
  },
  {
    id: "j_vodiondry",
    label: "Vodiondry",
    date: "2026-07-16",
    subtitle: "J — Cérémonie traditionnelle",
    time_start: "09:00",
    time_end: "11:15",
    guest_count: 230,
    notes: "Cérémonie traditionnelle malgache — Jour séparé du civil si nécessaire.",
    sort_order: 2,
    phases: [
      {
        id: "vod_p1",
        title: "Accueil et mise en place",
        time_slot: "09:00 — 09:45",
        actions: [
          { id: "a9", content: "<strong>09:00</strong> — Accueil des invités côté Madame", sort_order: 1 },
          { id: "a10", content: "Arrivée côté Monsieur à l'extérieur, attente protocolaire", sort_order: 2 },
          { id: "a11", content: "Mise en place des familles et vérification protocole", sort_order: 3 },
        ],
        responsables: [
          { id: "r5", type: "user", ref_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", label: "Coordinateur Lems", scope: "Protocole entier", color: "#4318FF" },
        ],
        completed: false,
        sort_order: 1,
      },
      {
        id: "vod_p2",
        title: "Cérémonie Vodiondry",
        time_slot: "10:15 — 11:15",
        actions: [
          { id: "a12", content: "<strong>10:00</strong> — Entrée protocolaire invités côté Monsieur", sort_order: 1 },
          { id: "a13", content: "<strong>10:15</strong> — Début de la cérémonie", sort_order: 2 },
          { id: "a14", content: "Discours des porte-paroles", sort_order: 3 },
          { id: "a15", content: "<strong>11:15</strong> — Fin du Vodiondry", sort_order: 4 },
        ],
        responsables: [
          { id: "r6", type: "vendor", ref_id: "mre", label: "MRE", scope: "Sonorisation Vodiondry", color: "#FFCE20" },
          { id: "r7", type: "vendor", ref_id: "mirec", label: "Mi Rec Production", scope: "Photo/Vidéo Vodiondry", color: "#4318FF" },
        ],
        note: "Orchestre Album Music ne joue PAS pendant le Vodiondry (scope limité au religieux).",
        completed: false,
        sort_order: 2,
      },
    ],
  },
  {
    id: "j_civil",
    label: "Mariage civil",
    date: "2026-07-16",
    subtitle: "J — Cérémonie officielle",
    time_start: "11:45",
    time_end: "12:15",
    guest_count: 230,
    sort_order: 3,
    phases: [
      {
        id: "civ_p1",
        title: "Cérémonie civile",
        time_slot: "11:45 — 12:15",
        actions: [
          { id: "a16", content: "<strong>11:45</strong> — Début du mariage civil", sort_order: 1 },
          { id: "a17", content: "Échange des consentements", sort_order: 2 },
          { id: "a18", content: "Signature des registres", sort_order: 3 },
          { id: "a19", content: "<strong>12:15</strong> — Fin du mariage civil", sort_order: 4 },
        ],
        responsables: [
          { id: "r8", type: "vendor", ref_id: "mre", label: "MRE", scope: "Sonorisation civil", color: "#FFCE20" },
        ],
        completed: false,
        sort_order: 1,
      },
    ],
  },
  {
    id: "j_religieux",
    label: "Mariage religieux",
    date: "2026-07-16",
    subtitle: "J — Cérémonie pastorale",
    time_start: "13:00",
    time_end: "14:00",
    guest_count: 230,
    sort_order: 4,
    phases: [
      {
        id: "rel_p1",
        title: "Cérémonie religieuse",
        time_slot: "13:00 — 14:00",
        actions: [
          { id: "a20", content: "<strong>13:00</strong> — Début cérémonie religieuse", sort_order: 1 },
          { id: "a21", content: "Lectures bibliques et chants", sort_order: 2 },
          { id: "a22", content: "Échange des alliances", sort_order: 3 },
          { id: "a23", content: "<strong>14:00</strong> — Bénédiction finale", sort_order: 4 },
        ],
        responsables: [
          { id: "r9", type: "vendor", ref_id: "album", label: "Album Music", scope: "Orchestre religieux complet", color: "#05CD99" },
          { id: "r10", type: "vendor", ref_id: "mre", label: "MRE", scope: "Sonorisation église + micro pasteurs", color: "#FFCE20" },
          { id: "r11", type: "vendor", ref_id: "mirec", label: "Mi Rec Production", scope: "Photo/Vidéo complet", color: "#4318FF" },
        ],
        completed: false,
        sort_order: 1,
      },
    ],
  },
  {
    id: "j_reception",
    label: "Réception & soirée",
    date: "2026-07-16",
    subtitle: "J — Fête",
    time_start: "14:00",
    time_end: "23:00",
    guest_count: 230,
    sort_order: 5,
    phases: [
      {
        id: "r_p1",
        title: "Grand cocktail & séquences protocolaires",
        time_slot: "14:00 — 15:00",
        actions: [
          { id: "a24", content: "<strong>14:00</strong> — Début du grand cocktail", sort_order: 1 },
          { id: "a25", content: "Remerciements par Papa de Ny Andry", sort_order: 2 },
          { id: "a26", content: "Séquence gâteaux — Kabary Pasteur Jocelyn", sort_order: 3 },
          { id: "a27", content: "<strong>14:25</strong> — Service du cocktail", sort_order: 4 },
        ],
        responsables: [
          { id: "r12", type: "vendor", ref_id: "vazaha", label: "Vazaha", scope: "Cocktail uniquement", color: "#EE5D50" },
          { id: "r13", type: "vendor", ref_id: "album", label: "Album Music", scope: "Ambiance cocktail", color: "#05CD99" },
        ],
        completed: false,
        sort_order: 1,
      },
      {
        id: "r_p2",
        title: "Entrée des mariés — Spectacle ✨",
        time_slot: "15:00 — 15:30",
        actions: [
          { id: "a28", content: "<strong>15:15</strong> — Annonce entrée des mariés", sort_order: 1 },
          { id: "a29", content: "Entrée avec pyrotechnie, confettis, fumée lourde", sort_order: 2 },
          { id: "a30", content: "Spectacle cirque style Aladin", sort_order: 3 },
          { id: "a31", content: "Ouverture de danse — Tango russe", sort_order: 4 },
        ],
        note: "🎬 Synchronisation parfaite régie / FX / DJ / artistes requise.",
        responsables: [
          { id: "r14", type: "vendor", ref_id: "prestafx", label: "Prestataire FX", scope: "Pyrotechnie + fumée", color: "#FF6B35" },
          { id: "r15", type: "vendor", ref_id: "prestalumieres", label: "Prestataire lumières", scope: "Jeux de lumières complets", color: "#00BCD4" },
        ],
        completed: false,
        sort_order: 2,
      },
    ],
  },
];

// Bascule localStorage (démo) <-> API D1, comme dans store.tsx.
const USE_API = import.meta.env.VITE_USE_API === "true";

// ============================================================================
//  Hook persistence
// ============================================================================
function readLocalConducteur(key: string): ConducteurJour[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function useConducteur(projectId: string) {
  const key = `${STORAGE_KEY}_${projectId}`;
  const [jours, setJoursState] = useState<ConducteurJour[]>(() => {
    return readLocalConducteur(key) ?? (USE_API ? [] : DEFAULT_CONDUCTEUR);
  });

  useEffect(() => {
    if (!USE_API || !projectId) return;
    // Ne va chercher l'API QUE si ce navigateur n'a aucune donnée locale —
    // pour ne jamais écraser silencieusement des données saisies localement
    // (ex: sur un téléphone) tant qu'elles n'ont pas été explicitement
    // exportées/importées vers la base via les boutons dédiés.
    if (readLocalConducteur(key)) return;
    api.listConducteur(projectId).then(setJoursState).catch(() => {});
  }, [projectId]);

  // Le localStorage sert TOUJOURS de copie de secours locale, même en mode
  // API : la persistance réseau peut échouer silencieusement (voir les
  // .catch(() => {}) dans les mutations), mieux vaut ne jamais dépendre du
  // seul réseau pour ne pas perdre de saisie.
  const setJours = (next: ConducteurJour[]) => {
    setJoursState(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return { jours, setJours };
}

// ============================================================================
//  Composant principal
// ============================================================================
export default function Conducteur() {
  const { currentProject, currentProjectId, vendors, users, canEdit } = useApp();
  const { jours, setJours } = useConducteur(currentProjectId);
  const [showJourModal, setShowJourModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState<{ jourId: string; phase: ConducteurPhase | null } | null>(null);
  const [editingJour, setEditingJour] = useState<ConducteurJour | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  if (!currentProject) {
    return <div className="text-center py-12 text-slate-500">Aucun projet sélectionné</div>;
  }

  const sortedJours = [...jours].sort(compareJoursByDateTime);

  const totalPhases = jours.reduce((s, j) => s + j.phases.length, 0);
  const completedPhases = jours.reduce((s, j) => s + j.phases.filter((p) => p.completed).length, 0);

  // Regroupe les événements par date pour un affichage continu
  const datesUniques = Array.from(new Set(sortedJours.map((j) => j.date)));

  const addJour = (jour: ConducteurJour) => {
    setJours([...jours, jour]);
    if (USE_API) api.createJour(currentProjectId, jour).catch(() => {});
  };

  const deleteJour = (jourId: string) => {
    if (!confirm("Supprimer cet événement du conducteur ? Toutes les phases seront perdues.")) return;
    const next = jours.filter((j) => j.id !== jourId);
    setJours(next);
    if (USE_API) api.deleteJour(jourId).catch(() => {});
  };

  const updatePhase = (jourId: string, phaseId: string, patch: Partial<ConducteurPhase>) => {
    let updatedPhase: ConducteurPhase | null = null;
    setJours(
      jours.map((j) => {
        if (j.id !== jourId) return j;
        return {
          ...j,
          phases: j.phases.map((p) => {
            if (p.id !== phaseId) return p;
            updatedPhase = { ...p, ...patch };
            return updatedPhase;
          }),
        };
      })
    );
    if (USE_API && updatedPhase) {
      const patchKeys = Object.keys(patch);
      // Bascule "terminé" seule (clic sur la checkbox) -> appel léger, sans
      // repasser toutes les actions/responsables pour rien.
      if (patchKeys.length === 1 && patchKeys[0] === "completed") {
        api.updatePhaseCompleted(phaseId, !!patch.completed).catch(() => {});
      } else {
        api.updatePhase(updatedPhase).catch(() => {});
      }
    }
  };

  const addPhase = (jourId: string, phase: ConducteurPhase) => {
    setJours(
      jours.map((j) => (j.id === jourId ? { ...j, phases: [...j.phases, phase] } : j))
    );
    if (USE_API) api.createPhase(jourId, phase).catch(() => {});
  };

  const deletePhase = (jourId: string, phaseId: string) => {
    if (!confirm("Supprimer cette phase ?")) return;
    setJours(
      jours.map((j) =>
        j.id === jourId ? { ...j, phases: j.phases.filter((p) => p.id !== phaseId) } : j
      )
    );
    if (USE_API) api.deletePhase(phaseId).catch(() => {});
  };

  // Exporte le conducteur actuellement chargé (localStorage ou API) en fichier
  // JSON téléchargeable — utile pour migrer des données saisies dans un
  // navigateur (mode démo) vers la base réelle sur un autre navigateur/poste.
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(jours, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conducteur_${currentProjectId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJsonFile = async (file: File) => {
    let imported: ConducteurJour[];
    try {
      imported = JSON.parse(await file.text());
    } catch {
      alert("Fichier JSON invalide.");
      return;
    }
    if (!Array.isArray(imported)) {
      alert("Format invalide : un tableau de jours (comme exporté par « Exporter ») est attendu.");
      return;
    }
    if (
      !confirm(
        `Importer ${imported.length} jour(s) (${imported.reduce((s, j) => s + j.phases.length, 0)} phase(s)) ? ` +
          `Ceci remplace le conducteur actuellement affiché${USE_API ? " et l'enregistre en base" : ""}.`
      )
    )
      return;

    setJours(imported);
    if (USE_API) {
      for (const jour of imported) {
        await api.createJour(currentProjectId, jour).catch(() => {});
        for (const phase of jour.phases) {
          await api.createPhase(jour.id, phase).catch(() => {});
        }
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            Conducteur Jour J
          </h1>
          <p className="text-slate-500 mt-1">
            Déroulé minute par minute — {currentProject.couple}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">{completedPhases}/{totalPhases} phases terminées</span>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" />
            Imprimer
          </button>
          <button
            onClick={handleExportJson}
            title="Télécharger ce conducteur en fichier JSON"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          {canEdit && (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportJsonFile(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => importInputRef.current?.click()}
                title="Importer un conducteur depuis un fichier JSON exporté"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Upload className="w-4 h-4" />
                Importer
              </button>
            </>
          )}
          {canEdit && (
            <button
              onClick={() => { setEditingJour(null); setShowJourModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition"
            >
              <Plus className="w-4 h-4" />
              Nouvel événement
            </button>
          )}
        </div>
      </div>

      {/* Info banner — multi-jours */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white relative overflow-hidden print:bg-white print:text-slate-900 print:border">
        <div className="absolute -right-10 -top-10 text-[200px] opacity-10 select-none">🎉</div>
        <div className="relative">
          <p className="text-xs uppercase tracking-wider opacity-70 mb-1">Conducteur complet</p>
          <h2 className="text-2xl font-bold">{currentProject.couple}</h2>
          <p className="opacity-80 mt-1 text-sm">
            {jours.length} événement{jours.length > 1 ? "s" : ""} — du {new Date(jours[0]?.date || currentProject.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au {new Date(jours[jours.length - 1]?.date || currentProject.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoStat label="Événements" value={String(jours.length)} />
            <InfoStat label="Phases totales" value={String(totalPhases)} />
            <InfoStat label="Phases terminées" value={`${completedPhases}/${totalPhases}`} />
            <InfoStat label="Jours" value={String(datesUniques.length)} />
          </div>
        </div>
      </div>

      {/* Sommaire des événements (navigation rapide) */}
      {sortedJours.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm print:hidden">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            Sommaire de la journée — {sortedJours.length} événements
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedJours.map((j, idx) => {
              const phaseCompleted = j.phases.filter((p) => p.completed).length;
              return (
                <a
                  key={j.id}
                  href={`#event-${j.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(`event-${j.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition group"
                >
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{j.label}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {j.time_start}–{j.time_end} · {phaseCompleted}/{j.phases.length} ✓
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Tous les événements affichés en continu */}
      <div className="space-y-8">
        {datesUniques.map((date) => {
          const eventsThisDate = sortedJours.filter((j) => j.date === date);
          return (
            <div key={date} className="space-y-4">
              {/* Séparateur de date */}
              <div className="flex items-center gap-3 print:break-before-auto">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
              </div>

              {eventsThisDate.map((jour, eventIdx) => {
                const globalIdx = sortedJours.findIndex((x) => x.id === jour.id);
                return (
                  <div key={jour.id} id={`event-${jour.id}`} className="space-y-4 scroll-mt-24">
                    <JourHeader
                      jour={jour}
                      index={globalIdx + 1}
                      canEdit={canEdit}
                      onEdit={() => { setEditingJour(jour); setShowJourModal(true); }}
                      onDelete={() => deleteJour(jour.id)}
                      onAddPhase={() => setShowPhaseModal({ jourId: jour.id, phase: null })}
                    />

                    <div className="relative pl-8 space-y-4 print:pl-0">
                      <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-300 via-violet-300 to-pink-300 print:hidden" />

                      {jour.phases
                        .slice()
                        .sort(compareByTime((p) => p.time_slot))
                        .map((phase) => (
                          <PhaseCard
                            key={phase.id}
                            phase={phase}
                            canEdit={canEdit}
                            onToggle={() => updatePhase(jour.id, phase.id, { completed: !phase.completed })}
                            onEdit={() => setShowPhaseModal({ jourId: jour.id, phase })}
                            onDelete={() => deletePhase(jour.id, phase.id)}
                          />
                        ))}

                      {jour.phases.length === 0 && (
                        <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                          Aucune phase pour cet événement.
                        </div>
                      )}
                    </div>
                    {eventIdx < eventsThisDate.length - 1 && <div className="h-2" />}
                  </div>
                );
              })}
            </div>
          );
        })}

        {sortedJours.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            Aucun événement dans le conducteur. {canEdit && "Cliquez sur « Nouvel événement » pour commencer."}
          </div>
        )}
      </div>

      {/* Modals */}
      {showJourModal && (
        <JourModal
          jour={editingJour}
          nextSortOrder={Math.max(0, ...jours.map((j) => j.sort_order)) + 1}
          onClose={() => { setShowJourModal(false); setEditingJour(null); }}
          onSave={(j) => {
            if (editingJour) {
              setJours(jours.map((x) => (x.id === j.id ? j : x)));
              if (USE_API) api.updateJour(j).catch(() => {});
            } else {
              addJour(j);
            }
            setShowJourModal(false);
            setEditingJour(null);
          }}
        />
      )}

      {showPhaseModal && (
        <PhaseModal
          phase={showPhaseModal.phase}
          nextSortOrder={
            Math.max(0, ...(jours.find((j) => j.id === showPhaseModal.jourId)?.phases.map((p) => p.sort_order) || [0])) + 1
          }
          vendors={vendors}
          users={users}
          onClose={() => setShowPhaseModal(null)}
          onSave={(p) => {
            if (showPhaseModal.phase) {
              updatePhase(showPhaseModal.jourId, p.id, p);
            } else {
              addPhase(showPhaseModal.jourId, p);
            }
            setShowPhaseModal(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
//  Sous-composants
// ============================================================================

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function JourHeader({ jour, index, canEdit, onEdit, onDelete, onAddPhase }: {
  jour: ConducteurJour; index?: number; canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddPhase: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {index !== undefined ? (
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {index}
              </span>
            ) : (
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
            )}
            <h2 className="text-xl font-bold text-slate-900">{jour.label}</h2>
            {jour.subtitle && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{jour.subtitle}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              {new Date(jour.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              {jour.time_start} — {jour.time_end}
            </span>
            {jour.guest_count !== undefined && jour.guest_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                ~{jour.guest_count} invités
              </span>
            )}
          </div>
          {jour.notes && (
            <p className="mt-3 text-sm text-slate-500 italic bg-amber-50 border-l-4 border-amber-300 px-3 py-2 rounded">
              <AlertCircle className="w-4 h-4 inline mr-1 text-amber-600" />
              {jour.notes}
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button onClick={onAddPhase} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white flex items-center gap-1">
              <Plus className="w-4 h-4" /> Phase
            </button>
            <button onClick={onEdit} aria-label="Modifier la phase" title="Modifier" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onDelete} aria-label="Supprimer la phase" title="Supprimer" className="p-2 rounded-lg text-red-500 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseCard({ phase, canEdit, onToggle, onEdit, onDelete }: {
  phase: ConducteurPhase;
  canEdit: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      "relative bg-white rounded-2xl border shadow-sm overflow-hidden transition group print:break-inside-avoid",
      phase.completed ? "border-emerald-200 opacity-75" : "border-slate-100 hover:shadow-md"
    )}>
      {/* Color strip */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5",
        phase.completed ? "bg-emerald-500" : "bg-gradient-to-b from-indigo-500 to-violet-500"
      )} />

      {/* Dot on timeline */}
      <div className="absolute -left-[30px] top-6 w-4 h-4 rounded-full bg-white border-4 border-indigo-500 print:hidden" />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              onClick={onToggle}
              disabled={!canEdit}
              aria-pressed={phase.completed}
              aria-label={phase.completed ? "Marquer comme non terminé" : "Marquer comme terminé"}
              title={canEdit ? (phase.completed ? "Marquer comme non terminé" : "Marquer comme terminé") : undefined}
              className={cn(
                "mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition",
                phase.completed
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-slate-300 hover:border-indigo-400",
                !canEdit && "cursor-default"
              )}
            >
              {phase.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-slate-900",
                phase.completed && "line-through text-slate-500"
              )}>
                {phase.title}
              </h3>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700">{phase.time_slot}</span>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition print:hidden flex-shrink-0">
              <button onClick={onEdit} aria-label="Modifier la phase" title="Modifier" className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={onDelete} aria-label="Supprimer la phase" title="Supprimer" className="p-1.5 rounded hover:bg-red-50 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        {phase.actions.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {phase.actions
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm text-slate-700 py-1 border-b border-slate-100 last:border-0">
                  <span className="text-indigo-500 mt-0.5">▸</span>
                  <span className="flex-1" dangerouslySetInnerHTML={{ __html: a.content }} />
                </li>
              ))}
          </ul>
        )}

        {/* Note */}
        {phase.note && (
          <div className="mb-3 bg-amber-50 border-l-4 border-amber-400 px-3 py-2 rounded text-xs text-amber-900 italic">
            <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
            {phase.note}
          </div>
        )}

        {/* Custom HTML (menu, etc.) */}
        {phase.custom_html && (
          <div className="mb-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div dangerouslySetInnerHTML={{ __html: phase.custom_html }} />
          </div>
        )}

        {/* Responsables with scope */}
        {phase.responsables.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Responsables ({phase.responsables.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {phase.responsables.map((r) => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-200 transition">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
                    style={{ backgroundColor: r.color }}
                  >
                    {r.label.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{r.label}</p>
                    {r.scope && <p className="text-[10px] text-slate-500 leading-tight">{r.scope}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
//  Modals
// ============================================================================

function JourModal({ jour, nextSortOrder, onClose, onSave }: {
  jour: ConducteurJour | null;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (j: ConducteurJour) => void;
}) {
  const [form, setForm] = useState<ConducteurJour>(jour || {
    id: `j_${Date.now()}`,
    label: "",
    date: "",
    subtitle: "",
    time_start: "08:00",
    time_end: "23:00",
    guest_count: 0,
    notes: "",
    phases: [],
    sort_order: nextSortOrder,
  });

  return (
    <Modal title={jour ? "Modifier l'événement" : "Nouvel événement"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Titre (ex: Vodiondry, Mariage civil, Réception...)">
          <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Sous-titre (ex: J-1 Veille)">
            <input className="input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Heure début"><input type="time" className="input" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} /></Field>
          <Field label="Heure fin"><input type="time" className="input" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} /></Field>
          <Field label="Invités (est.)"><input type="number" className="input" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: parseInt(e.target.value) || 0 })} /></Field>
        </div>
        <Field label="Notes"><textarea className="input min-h-16" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Enregistrer</button>
      </div>
    </Modal>
  );
}

function PhaseModal({ phase, nextSortOrder, vendors, users, onClose, onSave }: {
  phase: ConducteurPhase | null;
  nextSortOrder: number;
  vendors: any[];
  users: any[];
  onClose: () => void;
  onSave: (p: ConducteurPhase) => void;
}) {
  const [form, setForm] = useState<ConducteurPhase>(phase || {
    id: `ph_${Date.now()}`,
    title: "",
    time_slot: "",
    actions: [],
    note: "",
    custom_html: "",
    responsables: [],
    completed: false,
    sort_order: nextSortOrder,
  });
  const [actionsText, setActionsText] = useState(phase?.actions.map((a) => a.content).join("\n") || "");
  const [newResp, setNewResp] = useState<{ type: "vendor" | "user"; ref_id: string; scope: string }>({ type: "vendor", ref_id: "", scope: "" });

  const addResponsable = () => {
    if (!newResp.ref_id) return;
    const ref = newResp.type === "vendor" ? vendors.find((v) => v.id === newResp.ref_id) : users.find((u) => u.id === newResp.ref_id);
    if (!ref) return;
    setForm({
      ...form,
      responsables: [
        ...form.responsables,
        {
          id: `r_${Date.now()}`,
          type: newResp.type,
          ref_id: newResp.ref_id,
          label: ref.name,
          scope: newResp.scope,
          color: ref.color,
        },
      ],
    });
    setNewResp({ type: "vendor", ref_id: "", scope: "" });
  };

  const removeResponsable = (id: string) => {
    setForm({ ...form, responsables: form.responsables.filter((r) => r.id !== id) });
  };

  const save = () => {
    if (!form.title || !form.time_slot) { alert("Titre et créneau requis"); return; }
    const actions = actionsText.split("\n").map((l, i) => ({
      id: form.actions[i]?.id || `a_${Date.now()}_${i}`,
      content: l.trim(),
      sort_order: i + 1,
    })).filter((a) => a.content);
    onSave({ ...form, actions });
  };

  return (
    <Modal title={phase ? "Modifier la phase" : "Nouvelle phase"} onClose={onClose} wide>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Field label="Titre de la phase">
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
          </div>
          <Field label="Créneau horaire">
            <input className="input" value={form.time_slot} onChange={(e) => setForm({ ...form, time_slot: e.target.value })} placeholder="14:00 — 15:00" />
          </Field>
        </div>

        <Field label="Actions / Étapes (une par ligne, HTML léger autorisé)">
          <textarea className="input min-h-28 font-mono text-xs" value={actionsText} onChange={(e) => setActionsText(e.target.value)} placeholder={"<strong>14:00</strong> — Début du cocktail\nService des boissons\nAmbiance musicale"} />
        </Field>

        <Field label="Note / Attention (facultatif)">
          <input className="input" value={form.note || ""} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </Field>

        <Field label="HTML personnalisé / Menu (facultatif)">
          <textarea className="input min-h-20 font-mono text-xs" value={form.custom_html || ""} onChange={(e) => setForm({ ...form, custom_html: e.target.value })} placeholder="<h4>🥗 Entrées</h4>..." />
        </Field>

        {/* Responsables avec scope */}
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            Responsables (scope partiel possible)
          </p>
          <div className="space-y-1.5 mb-2">
            {form.responsables.map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: r.color }}>
                  {r.label.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.label}</p>
                  <p className="text-xs text-slate-500 truncate">{r.scope || "(sans scope)"}</p>
                </div>
                <button onClick={() => removeResponsable(r.id)} className="p-1 rounded hover:bg-red-100 text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_auto] gap-2 items-end">
            <select className="input" value={newResp.type} onChange={(e) => setNewResp({ ...newResp, type: e.target.value as any, ref_id: "" })}>
              <option value="vendor">Prestataire</option>
              <option value="user">Utilisateur</option>
            </select>
            <select className="input" value={newResp.ref_id} onChange={(e) => setNewResp({ ...newResp, ref_id: e.target.value })}>
              <option value="">— Choisir —</option>
              {(newResp.type === "vendor" ? vendors : users).map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
            <input className="input" placeholder="Scope : ex. 'Religieux uniquement'" value={newResp.scope} onChange={(e) => setNewResp({ ...newResp, scope: e.target.value })} />
            <button onClick={addResponsable} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm">＋</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
        <button onClick={save} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Enregistrer</button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn("bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto", wide ? "max-w-3xl" : "max-w-lg")}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" title="Fermer" className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
