# 🗺️ Roadmap — EventFlow Pro

Plan d'évolution du SaaS de gestion d'événements. Les fonctionnalités sont
classées par priorité et par domaine. Cases à cocher pour le suivi.

> Légende priorité : 🔴 Haute · 🟠 Moyenne · 🟢 Basse

---

## ✅ Déjà livré (v1)

- [x] Authentification multi-rôles (super_admin, admin/agence, planner, client)
- [x] Multi-projets avec assignation de plusieurs planificateurs
- [x] Tâches : vues Liste, Kanban (drag & drop), Gantt
- [x] Gantt : ligne « aujourd'hui » + zoom Jour/Semaine/Mois
- [x] Calendrier mensuel des tâches
- [x] Conducteur Jour J multi-événements (page unique) avec responsables à scope
- [x] Prestataires (avec statuts et scope partiel)
- [x] Budget (dépenses payées / en attente, répartition par catégorie)
- [x] Notifications in-app (cloche + dropdown)
- [x] 7 thèmes personnalisables par utilisateur
- [x] Codes couleur de l'équipe assignée (légende centralisée)
- [x] Barre latérale réductible
- [x] Schéma SQL Cloudflare D1 prêt
- [x] Serveur local (port 4040) + guide de déploiement

---

## 🔴 Priorité haute (v2)

### Backend & persistance
- [x] **Pages Functions JavaScript** (CORS, projets, tâches, notifications, health)
- [x] Schéma D1 + `wrangler.toml` + client API front (`src/apiClient.js`)
- [ ] Brancher le store front sur l'API D1 (remplacer localStorage)
- [ ] Hash des mots de passe (argon2 / bcrypt) côté serveur
- [ ] Sessions / JWT + refresh tokens
- [ ] Synchronisation temps réel (WebSocket / Durable Objects)
- [ ] Sauvegarde & restauration des données par projet

### Collaboration
- [ ] **Commentaires** sur les tâches (fil de discussion + mentions @)
- [ ] Historique d'activité par projet (audit log déjà dans le schéma)
- [ ] Attribution multiple sur une même tâche
- [ ] Notifications par e-mail (résumé quotidien + alertes)

### Tâches & planning
- [ ] **Dépendances visuelles** sur le Gantt (flèches entre tâches liées)
- [ ] Calcul automatique du chemin critique (CPM)
- [ ] Récurrence de tâches (modèles réutilisables)
- [ ] Sous-tâches / checklists imbriquées
- [ ] Glisser-déposer pour replanifier directement sur le Gantt/Calendrier

---

## 🟠 Priorité moyenne (v3)

### Gestion documentaire
- [ ] Upload de fichiers (contrats, devis, plans) via R2 (Cloudflare)
- [ ] Galerie photos par projet / moodboard
- [ ] Signature électronique des contrats
- [ ] Génération de PDF (conducteur, budget, fiches prestataires)

### Budget avancé
- [ ] Devis et factures liés aux prestataires
- [ ] Échéancier de paiements + rappels automatiques
- [ ] Multi-devises avec taux de change
- [ ] Comparatif budget prévu vs. réel + alertes de dépassement
- [ ] Export comptable (CSV / Excel)

### Invités & logistique
- [ ] **Module liste d'invités** (RSVP, régimes alimentaires, table)
- [ ] Plan de table interactif (drag & drop)
- [ ] Envoi d'invitations + suivi des réponses
- [ ] QR codes d'accès / pointage le jour J

### Prestataires
- [ ] Annuaire / marketplace de prestataires réutilisable entre projets
- [ ] Notation et avis internes des prestataires
- [ ] Fiches missions imprimables par prestataire
- [ ] Contrats types par catégorie de prestataire

---

## 🟢 Priorité basse (v4+)

### Productivité
- [ ] Modèles de projets par type d'événement (mariage, séminaire, gala…)
- [ ] Duplication d'un projet existant
- [ ] Bibliothèque de conducteurs types (réutilisables)
- [ ] Vue « Ma journée » personnalisée par utilisateur
- [ ] Recherche globale (tâches, prestataires, notes…)

### Analyse & reporting
- [ ] Tableau de bord analytique multi-projets (pour l'agence)
- [ ] Indicateurs de performance (taux de complétion, retards…)
- [ ] Rapport de fin d'événement (debrief)
- [ ] Statistiques prestataires (fiabilité, coûts moyens)

### Expérience utilisateur
- [ ] Application mobile (PWA installable + mode hors-ligne)
- [ ] Notifications push (mobile / navigateur)
- [ ] Internationalisation (FR / EN / MG malgache)
- [ ] Accessibilité (WCAG AA, navigation clavier complète)
- [ ] Mode présentation / plein écran pour le conducteur le jour J

### Intégrations
- [ ] Synchronisation Google Calendar / Outlook
- [ ] Intégration WhatsApp / SMS (rappels prestataires & invités)
- [ ] Connexion à des outils de paiement (Stripe, Mobile Money)
- [ ] Webhooks / API publique pour intégrations tierces
- [ ] Import depuis Excel / Google Sheets

### Administration agence
- [ ] Facturation des agences (abonnement SaaS multi-tenant)
- [ ] Gestion des quotas (nombre de projets / collaborateurs)
- [ ] Personnalisation marque blanche (logo, couleurs, domaine)
- [ ] Rôles et permissions granulaires personnalisables

---

## 🔧 Dette technique & qualité

- [ ] Tests unitaires (Vitest) sur la logique du store
- [ ] Tests end-to-end (Playwright)
- [ ] Découpage du bundle (lazy-loading des pages)
- [ ] Optimisation des performances (virtualisation des longues listes)
- [ ] CI/CD (GitHub Actions → Cloudflare Pages)
- [ ] Monitoring d'erreurs (Sentry)
- [ ] Documentation développeur (architecture, conventions)

---

## 💡 Idées à explorer

- Assistant IA pour générer un rétroplanning à partir de la date et du type d'événement
- Suggestion automatique de prestataires selon le budget et le lieu
- Détection automatique des conflits d'horaire dans le conducteur
- Météo intégrée pour les événements en extérieur
- Mode « checklist live » synchronisé entre l'équipe le jour J
- Chronomètre / minuteur par phase du conducteur le jour J

---

_Dernière mise à jour : structurer les priorités selon les retours clients._
