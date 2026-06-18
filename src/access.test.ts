import { describe, it, expect } from "vitest";
import { visibleProjectsFor } from "./access";
import type { User, Project } from "./data";

function user(partial: Partial<User>): User {
  return {
    id: "u",
    agency_id: "ag1",
    username: "u",
    password: "x",
    name: "U",
    role: "planner",
    color: "#000",
    theme: "light",
    ...partial,
  };
}

function project(partial: Partial<Project>): Project {
  return {
    id: "p",
    agency_id: "ag1",
    name: "P",
    couple: "A & B",
    date: "2026-01-01",
    venue: "",
    status: "en_cours",
    color: "#000",
    assigned_planners: [],
    assigned_clients: [],
    budget: 0,
    notes: "",
    ...partial,
  };
}

const projects: Project[] = [
  project({ id: "p1", agency_id: "ag1", assigned_planners: ["pl1"], assigned_clients: ["cl1"] }),
  project({ id: "p2", agency_id: "ag1", assigned_planners: ["pl2"], assigned_clients: [] }),
  project({ id: "p3", agency_id: "ag2", assigned_planners: ["pl1"], assigned_clients: ["cl1"] }),
];

describe("visibleProjectsFor", () => {
  it("retourne [] sans utilisateur", () => {
    expect(visibleProjectsFor(null, projects)).toEqual([]);
  });

  it("super_admin voit tous les projets, toutes agences", () => {
    const u = user({ id: "sa", agency_id: null, role: "super_admin" });
    expect(visibleProjectsFor(u, projects).map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("admin voit uniquement les projets de son agence", () => {
    const u = user({ id: "ad", agency_id: "ag1", role: "admin" });
    expect(visibleProjectsFor(u, projects).map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("planner voit les projets de son agence où il est assigné", () => {
    const u = user({ id: "pl1", agency_id: "ag1", role: "planner" });
    // p3 a pl1 assigné mais appartient à ag2 -> exclu.
    expect(visibleProjectsFor(u, projects).map((p) => p.id)).toEqual(["p1"]);
  });

  it("client voit les projets où il est client, indépendamment de l'agence", () => {
    const u = user({ id: "cl1", agency_id: null, role: "client" });
    expect(visibleProjectsFor(u, projects).map((p) => p.id)).toEqual(["p1", "p3"]);
  });
});
