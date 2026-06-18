import type {
  User,
  Project,
  Task,
  Vendor,
  BudgetExpense,
  Notification,
  TaskStatus,
} from "./data";

export function setToken(token: string | null): void;
export function getToken(): string | null;

export interface AuthResponse {
  ok: boolean;
  token: string;
  user: Pick<User, "id" | "name" | "role" | "color" | "theme" | "agency_id">;
  error?: string;
}

export const api: {
  health(): Promise<unknown>;

  login(username: string, password: string): Promise<AuthResponse>;

  listUsers(): Promise<User[]>;
  createUser(user: User): Promise<{ id: string; ok: boolean }>;
  updateUser(user: User): Promise<{ ok: boolean }>;
  deleteUser(id: string): Promise<{ ok: boolean }>;

  listProjects(): Promise<Project[]>;
  createProject(project: Project): Promise<{ id: string; ok: boolean }>;
  updateProject(project: Project): Promise<{ ok: boolean }>;
  deleteProject(id: string): Promise<{ ok: boolean }>;

  listTasks(projectId?: string): Promise<Task[]>;
  createTask(task: Task): Promise<{ id: string; ok: boolean }>;
  updateTask(task: Task): Promise<{ ok: boolean }>;
  updateTaskStatus(id: string, projectId: string, status: TaskStatus): Promise<{ ok: boolean }>;
  deleteTask(id: string, projectId?: string): Promise<{ ok: boolean }>;

  listVendors(projectId: string): Promise<Vendor[]>;
  createVendor(vendor: Vendor): Promise<{ id: string; ok: boolean }>;
  updateVendor(vendor: Vendor): Promise<{ ok: boolean }>;
  deleteVendor(id: string): Promise<{ ok: boolean }>;

  listExpenses(projectId: string): Promise<BudgetExpense[]>;
  createExpense(expense: BudgetExpense): Promise<{ id: string; ok: boolean }>;
  updateExpense(expense: BudgetExpense): Promise<{ ok: boolean }>;
  deleteExpense(id: string): Promise<{ ok: boolean }>;

  listNotifications(userId: string): Promise<Notification[]>;
  createNotification(n: Notification): Promise<{ id: string; ok: boolean }>;
  markNotificationRead(id: string): Promise<{ ok: boolean }>;
  markAllNotificationsRead(userId: string): Promise<{ ok: boolean }>;
};
