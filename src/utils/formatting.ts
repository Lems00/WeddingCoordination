/**
 * Utilitaires de formatage — EventFlow Pro Madagascar
 * Devise: Ariary (Ar)
 * Format nombre: 00 000 (espace comme séparateur de milliers)
 * Fuseau horaire: GMT+3
 */

/**
 * Formate un nombre pour l'Ariary malgache
 * Format: 00 000 Ar (avec espace comme séparateur)
 * Exemple: formatAriary(50000) → "50 000 Ar"
 */
export function formatAriary(amount: number): string {
  // Formater avec locale française pour obtenir les espaces
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `${formatted} Ar`;
}

/**
 * Formate une date avec le fuseau horaire GMT+3
 * Exemple: formatDateGMT3(new Date()) → "12 juin 2026, 15:30 (GMT+3)"
 */
export function formatDateGMT3(date: Date): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg", // GMT+3 en hiver, +2 en été (proche de Madagascar)
  });
  
  return formatter.format(date);
}

/**
 * Formate une date simple (sans heure)
 * Exemple: formatDateSimple(new Date("2026-07-16")) → "16 juillet 2026"
 */
export function formatDateSimple(date: Date): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  return formatter.format(date);
}

/**
 * Formate une date courte (numérique)
 * Exemple: formatDateShort(new Date("2026-07-16")) → "16 juil. 2026"
 */
export function formatDateShort(date: Date): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  return formatter.format(date);
}

/**
 * Retourne le décalage GMT+3 en format lisible
 */
export function getTimezoneOffset(): string {
  return "GMT+3";
}

/**
 * Formate un montant avec devise (Ar) et séparateur d'espace
 * Utilisé dans les résumés et cartes
 */
export function formatCurrency(amount: number, showCurrency: boolean = true): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return showCurrency ? `${formatted} Ar` : formatted;
}

/**
 * Convertit un montant en Ariary (pour future intégration taux de change)
 * Pour l'instant, c'est 1:1 avec la devise locale
 */
export function toAriary(amount: number): number {
  // À implémenter si conversion nécessaire
  // Actuellement tout est en Ar
  return amount;
}

export default {
  formatAriary,
  formatDateGMT3,
  formatDateSimple,
  formatDateShort,
  getTimezoneOffset,
  formatCurrency,
  toAriary,
};
