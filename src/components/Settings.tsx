import { useState } from "react";
import { useApp } from "../store";
import { THEMES, ThemeId } from "../themes";
import { cn } from "../utils/cn";
import { Palette, User, Shield, LogOut, Heart, Check, Lock, X } from "lucide-react";

export default function Settings() {
  const { currentUser, setUserTheme, updateUser } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Tous les champs sont requis" });
      return;
    }
    if (currentUser?.password !== oldPassword) {
      setPasswordMessage({ type: "error", text: "Ancien mot de passe incorrect" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Le mot de passe doit contenir au moins 6 caractères" });
      return;
    }

    updateUser({ ...currentUser, password: newPassword });
    setPasswordMessage({ type: "success", text: "Mot de passe changé avec succès" });
    setTimeout(() => {
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(null);
    }, 2000);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 mt-1">Personnalisez votre expérience</p>
      </div>

      {/* Profile */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-600" />
          Mon profil
        </h2>
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">{currentUser.name}</h3>
            <p className="text-sm text-slate-500">@{currentUser.username}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-600">
                {currentUser.role === "super_admin" ? "Super administrateur" : currentUser.role === "admin" ? "Agence" : currentUser.role === "planner" ? "Planner" : "Client"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-indigo-600" />
          Sécurité
        </h2>
        <p className="text-sm text-slate-600 mb-4">Changez votre mot de passe pour sécuriser votre compte</p>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Lock className="w-4 h-4" />
          Changer le mot de passe
        </button>
      </section>

      {/* Theme */}
      <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">
          <Palette className="w-5 h-5 text-indigo-600" />
          Thème de l'interface
        </h2>
        <p className="text-sm text-slate-500 mb-5">Choisissez l'ambiance visuelle de votre espace de travail</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const active = currentUser.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setUserTheme(currentUser.id, t.id as ThemeId);
                  document.body.className = `theme-${t.id}`;
                }}
                className={cn(
                  "relative rounded-2xl border-2 p-4 text-left transition overflow-hidden",
                  active ? "border-indigo-500 shadow-lg" : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
                )}
              >
                {active && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl shadow-md overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: t.preview.bg }}
                  >
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full" style={{ backgroundColor: t.preview.accent }} />
                    <div className="absolute bottom-1 left-1 w-6 h-3 rounded" style={{ backgroundColor: t.preview.card, opacity: 0.8 }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{t.emoji}</span> {t.label}
                    </p>
                    <p className="text-xs text-slate-500">{t.description}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.preview.bg }} />
                  <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.preview.accent }} />
                  <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: t.preview.card }} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5" />
          Session
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Déconnectez-vous pour changer d'utilisateur ou terminer votre session.
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-rose-400" />
          EventFlow Pro · © 2026 Lems Coordination
        </p>
      </section>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Changer le mot de passe</h2>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPasswordMessage(null); }} className="p-1 rounded hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Ancien mot de passe</span>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe</span>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Confirmer le mot de passe</span>
                <input
                  type="password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              {passwordMessage && (
                <div className={cn(
                  "p-3 rounded-lg text-sm",
                  passwordMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                )}>
                  {passwordMessage.text}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordMessage(null); }}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
