import type { User, Project } from "./data";

/**
 * Projets visibles par un utilisateur selon son rôle.
 *
 * Règles (centralisées ici pour éviter la duplication entre le calcul du store
 * et la sélection au login) :
 *  - super_admin : tous les projets ;
 *  - admin       : les projets de son agence ;
 *  - planner     : les projets de son agence où il est planificateur assigné ;
 *  - client      : les projets où il est client assigné.
 */
export function visibleProjectsFor(user: User | null, projects: Project[]): Project[] {
  if (!user) return [];
  switch (user.role) {
    case "super_admin":
      return projects;
    case "admin":
      return projects.filter((p) => p.agency_id === user.agency_id);
    case "planner":
      return projects.filter(
        (p) => p.agency_id === user.agency_id && p.assigned_planners.includes(user.id)
      );
    default:
      return projects.filter((p) => p.assigned_clients.includes(user.id));
  }
}
