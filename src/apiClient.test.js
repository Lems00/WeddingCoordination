import { describe, it, expect } from "vitest";
import {
  taskFromDb,
  taskToApi,
  vendorFromDb,
  vendorToApi,
  expenseFromDb,
  expenseToApi,
  notificationFromDb,
  projectFromDb,
} from "./apiClient.js";

describe("mapping tâches (front <-> DB)", () => {
  const dbRow = {
    id: "P01",
    project_id: "proj1",
    phase: "Préparation",
    category: "Coordination",
    name: "Signature contrat",
    duration: "1 jour",
    start_date: "2026-06-02",
    end_date: "2026-06-02",
    responsible_user_id: "u1",
    responsible_name: "Coordinateur",
    predecessor: "P00",
    status: "En cours",
    sort_order: 0,
  };

  it("DB -> front : name->task, responsible_name->responsible", () => {
    const t = taskFromDb(dbRow);
    expect(t.task).toBe("Signature contrat");
    expect(t.responsible).toBe("Coordinateur");
    expect(t.predecessor).toBe("P00");
    expect(t.responsible_user_id).toBe("u1");
  });

  it("aller-retour DB -> front -> API préserve les champs clés", () => {
    const apiBody = taskToApi(taskFromDb(dbRow));
    expect(apiBody.name).toBe("Signature contrat");
    expect(apiBody.responsible_name).toBe("Coordinateur");
    expect(apiBody.predecessor).toBe("P00");
    expect(apiBody.status).toBe("En cours");
  });
});

describe("mapping prestataires (statut code <-> libellé)", () => {
  it("DB code -> libellé affiché", () => {
    expect(vendorFromDb({ id: "v", project_id: "p", name: "X", role: "r", color: "#fff", statut: "confirme" }).statut).toBe("Confirmé");
    expect(vendorFromDb({ id: "v", project_id: "p", name: "X", role: "r", color: "#fff", statut: "en_recherche" }).statut).toBe("En recherche");
  });

  it("libellé -> code, avec repli en_recherche pour inconnu", () => {
    expect(vendorToApi({ id: "v", project_id: "p", name: "X", role: "r", color: "#fff", statut: "Confirmé" }).statut).toBe("confirme");
    expect(vendorToApi({ id: "v", project_id: "p", name: "X", role: "r", color: "#fff", statut: "n'importe quoi" }).statut).toBe("en_recherche");
  });
});

describe("mapping dépenses (paid booléen <-> entier)", () => {
  it("DB 1/0 -> booléen", () => {
    expect(expenseFromDb({ id: "e", project_id: "p", label: "L", category: "c", amount: "10", date: "2026", paid: 1 }).paid).toBe(true);
    expect(expenseFromDb({ id: "e", project_id: "p", label: "L", category: "c", amount: 10, date: "2026", paid: 0 }).paid).toBe(false);
  });

  it("amount est normalisé en nombre", () => {
    expect(expenseFromDb({ id: "e", project_id: "p", label: "L", category: "c", amount: "1500", date: "2026", paid: 0 }).amount).toBe(1500);
  });

  it("front -> API conserve paid en booléen", () => {
    expect(expenseToApi({ id: "e", project_id: "p", label: "L", category: "c", amount: 10, date: "2026", paid: true }).paid).toBe(true);
  });
});

describe("mapping notifications & projets", () => {
  it("is_read entier -> booléen", () => {
    expect(notificationFromDb({ id: "n", user_id: "u", is_read: 1 }).is_read).toBe(true);
    expect(notificationFromDb({ id: "n", user_id: "u", is_read: 0 }).is_read).toBe(false);
  });

  it("projet : tableaux d'assignation par défaut à []", () => {
    const p = projectFromDb({ id: "p", couple: "A & B" });
    expect(p.assigned_planners).toEqual([]);
    expect(p.assigned_clients).toEqual([]);
  });
});
