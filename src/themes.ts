/**
 * Système de thèmes UI.
 *
 * Chaque thème expose un ensemble de variables CSS qui sont appliquées via la classe
 * `theme-<name>` sur le <body>. Les composants utilisent ensuite ces variables via
 * la syntaxe Tailwind `bg-(--bg-main)`, `text-(--text-primary)`, etc.
 *
 * Ajout d'un nouveau thème :
 *   1. Ajouter une entrée dans THEMES ci-dessous.
 *   2. Ajouter la classe `.theme-<name>` dans src/index.css avec les variables.
 */

export type ThemeId = "light" | "night" | "graphite" | "blue" | "rose" | "emerald" | "lavender";

export interface Theme {
  id: ThemeId;
  label: string;
  description: string;
  emoji: string;
  preview: { bg: string; card: string; accent: string };
}

export const THEMES: Theme[] = [
  {
    id: "light",
    label: "Lumière",
    description: "Thème clair par défaut — indigo & violet",
    emoji: "☀️",
    preview: { bg: "#f8fafc", card: "#ffffff", accent: "#4318FF" },
  },
  {
    id: "night",
    label: "Nuit",
    description: "Mode sombre profond — bleu nuit & cyan",
    emoji: "🌙",
    preview: { bg: "#0b1120", card: "#131a2b", accent: "#22d3ee" },
  },
  {
    id: "graphite",
    label: "Graphite",
    description: "Gris anthracite élégant — accent orange",
    emoji: "⬛",
    preview: { bg: "#1e1f22", card: "#2a2b2f", accent: "#f97316" },
  },
  {
    id: "blue",
    label: "Océan",
    description: "Bleu ciel apaisant — accent indigo",
    emoji: "🌊",
    preview: { bg: "#eff6ff", card: "#ffffff", accent: "#2563eb" },
  },
  {
    id: "rose",
    label: "Rose",
    description: "Romantique & doux — rose pastel",
    emoji: "💗",
    preview: { bg: "#fff1f2", card: "#ffffff", accent: "#e11d48" },
  },
  {
    id: "emerald",
    label: "Émeraude",
    description: "Vert menthe frais — accent émeraude",
    emoji: "🌿",
    preview: { bg: "#f0fdf4", card: "#ffffff", accent: "#059669" },
  },
  {
    id: "lavender",
    label: "Lavande",
    description: "Violet doux — accent violet",
    emoji: "💜",
    preview: { bg: "#faf5ff", card: "#ffffff", accent: "#8b5cf6" },
  },
];

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
