import { useState } from "react";
import { useApp } from "../store";
import { User } from "../data";
import { cn } from "../utils/cn";
import {
  Search,
  Plus,
  Shield,
  User as UserIcon,
  Mail,
  Edit2,
  Trash2,
  X,
  Heart,
  AlertCircle,
  Lock,
  Copy,
  Check,
} from "lucide-react";

export default function Team() {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Vérifier les permissions
  const canManageTeam = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Filtrer : cacher le superadmin sauf si on est superadmin
  const visibleUsers = users.filter((u) => {
    if (u.role === "super_admin") return currentUser?.role === "super_admin";
    return true;
  });

  const filtered = visibleUsers.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Équipe</h1>
          <p className="text-slate-500 mt-1">Gérez les membres ayant accès au projet</p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 hover:shadow-xl transition"
          >
            <Plus className="w-4 h-4" />
            Inviter membre
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => {
          const isAdmin = u.role === "admin" || u.role === "super_admin";
          const isSelf = u.id === currentUser?.id;
          const isSuperAdmin = u.role === "super_admin";
          const canEdit = canManageTeam && !isSuperAdmin;

          return (
            <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="h-16 relative" style={{ backgroundColor: u.color + "20" }}>
                <div className="absolute -bottom-8 left-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.name.charAt(0)}
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold",
                    isSuperAdmin ? "bg-amber-100 text-amber-700" : isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {isSuperAdmin ? <Shield className="w-3 h-3" /> : isAdmin ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Client"}
                  </span>
                </div>
              </div>
              <div className="px-5 pt-10 pb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-lg">{u.name}</h3>
                  {isSelf && (
                    <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Vous</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  @{u.username}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Rôle</p>
                    <p className="text-sm font-medium text-slate-700">
                      {isSuperAdmin ? "Administrateur système" : isAdmin ? "Coordinateur de l'événement" : "Partie prenante"}
                    </p>
                  </div>
                </div>

                {canEdit && !isSelf && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Modifier
                    </button>
                    <button
                      onClick={() => setUserToDelete(u)}
                      aria-label={`Supprimer ${u.name}`}
                      title="Supprimer"
                      className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && canManageTeam && (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onSave={(u) => { addUser(u); setShowAdd(false); }}
          existingIds={users.map((u) => u.id)}
        />
      )}

      {editingUser && canManageTeam && editingUser.role !== "super_admin" && (
        <EditMemberModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(u) => {
            updateUser(u);
            setEditingUser(null);
          }}
        />
      )}

      {userToDelete && canManageTeam && userToDelete.role !== "super_admin" && (
        <DeleteMemberModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
}

function AddMemberModal({ onClose, onSave, existingIds }: { onClose: () => void; onSave: (u: User) => void; existingIds: string[] }) {
  const COLORS = ["#4318FF", "#05CD99", "#FFCE20", "#EE5D50", "#7551FF", "#FF6B35", "#00BCD4", "#EC4899"];
  const [form, setForm] = useState<Partial<User>>({
    name: "",
    username: "",
    password: "",
    role: "client",
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });

  const handleSave = () => {
    if (!form.name || !form.username || !form.password) { alert("Tous les champs sont requis"); return; }
    const id = `u_${Date.now()}`;
    if (existingIds.includes(id)) { alert("Erreur ID"); return; }
    onSave({
      id,
      agency_id: null, // sera rempli par le parent si besoin (admin)
      name: form.name!,
      username: form.username!,
      password: form.password!,
      role: form.role as "admin" | "client" | "planner",
      color: form.color!,
      theme: "light",
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-semibold">Inviter un membre</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" title="Fermer" className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nom complet</span>
            <input className="input" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Sophie Martin" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Identifiant</span>
            <input className="input" value={form.username || ""} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="sophie" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Mot de passe</span>
            <input type="text" className="input" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Rôle</span>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "client" })}>
                <option value="client">Client</option>
                <option value="admin">Coordinateur (Admin)</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">Couleur</span>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn("w-7 h-7 rounded-full border-2 transition", form.color === c ? "border-slate-900 scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </label>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium">Inviter</button>
        </div>
      </div>
    </div>
  );
}

function EditMemberModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
  const COLORS = ["#4318FF", "#05CD99", "#FFCE20", "#EE5D50", "#7551FF", "#FF6B35", "#00BCD4", "#EC4899"];
  const [form, setForm] = useState<User>(user);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generateDefaultPassword = () => {
    const length = 12;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pwd = "";
    for (let i = 0; i < length; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleResetPassword = () => {
    const pwd = generateDefaultPassword();
    setNewPassword(pwd);
    setShowResetPassword(true);
  };

  const handleConfirmReset = () => {
    setForm({ ...form, password: newPassword });
    onSave({ ...form, password: newPassword });
    setShowResetPassword(false);
  };

  const handleSave = () => {
    if (!form.name || !form.username) {
      alert("Le nom et l'identifiant sont requis");
      return;
    }
    onSave(form);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showResetPassword) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Mot de passe réinitialisé</h2>
            </div>
            <button onClick={() => { setShowResetPassword(false); setNewPassword(""); }} className="p-1 rounded hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-700">
              Le mot de passe pour <strong>{form.name}</strong> a été réinitialisé. Communiquez ce mot de passe temporaire à l'utilisateur :
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-2">Mot de passe temporaire :</p>
              <p className="font-mono text-lg font-semibold text-slate-900 break-all">{newPassword}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                💡 L'utilisateur devra changer ce mot de passe à sa première connexion via Paramètres → Sécurité.
              </p>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier"}
            </button>
            <button
              onClick={() => { setShowResetPassword(false); setNewPassword(""); }}
              className="px-4 py-2 rounded-lg text-sm bg-slate-600 text-white font-medium hover:bg-slate-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Modifier le membre</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" title="Fermer" className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Nom complet</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Sophie Martin" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Identifiant</span>
            <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="sophie" disabled />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Rôle</span>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User["role"] })}>
              <option value="client">Client</option>
              <option value="planner">Planificateur</option>
              <option value="admin">Coordinateur (Admin)</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Couleur</span>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn("w-7 h-7 rounded-full border-2 transition", form.color === c ? "border-slate-900 scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </label>
        </div>
        <div className="p-6 border-t border-slate-100 space-y-3">
          <button
            onClick={handleResetPassword}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition"
          >
            <Lock className="w-4 h-4" />
            Réinitialiser le mot de passe
          </button>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white font-medium">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteMemberModal({ user, onClose, onConfirm }: { user: User; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">Supprimer le membre</h2>
          </div>
          <button onClick={onClose} aria-label="Fermer" title="Fermer" className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <p className="text-slate-700 mb-2">
            Êtes-vous sûr(e) de vouloir supprimer <strong>{user.name}</strong> de l'équipe ?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <p className="text-sm text-red-700">
              ⚠️ <strong>Cette action est irréversible.</strong> L'utilisateur sera supprimé et toutes ses assignations seront perdues.
            </p>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Annuler</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white font-medium hover:bg-red-700">Supprimer</button>
        </div>
      </div>
    </div>
  );
}
