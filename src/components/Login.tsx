import { useState } from "react";
import { useApp } from "../store";
import { Lock, User, Sparkles } from "lucide-react";
import Logo from "./Logo";

export default function Login() {
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await login(username, password);
      if (!ok) {
        setError("Identifiants incorrects. Veuillez réessayer.");
      }
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-rose-50/30 to-indigo-50/40 p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/60 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-8 py-10 text-center relative">
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div
                className="absolute"
                style={{
                  top: "-30px", left: "-10px", width: "160px", height: "260px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)",
                  clipPath: "polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)",
                  transform: "rotate(-18deg)",
                }}
              />
              <div
                className="absolute"
                style={{
                  bottom: "-40px", right: "10px", width: "120px", height: "220px",
                  background: "linear-gradient(0deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)",
                  clipPath: "polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)",
                  transform: "rotate(14deg)",
                }}
              />
              <div
                className="absolute"
                style={{
                  top: "-20px", right: "60px", width: "90px", height: "200px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)",
                  clipPath: "polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)",
                  transform: "rotate(24deg)",
                }}
              />
            </div>
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-2.5 mb-4 shadow-lg">
              <Logo className="w-full h-full" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">EventFlow Pro</h1>
            <p className="text-indigo-100 mt-1 text-sm">Gestion d'événements pour professionnels</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Connexion</h2>
              <p className="text-sm text-slate-500 mt-1">Accédez à votre espace de coordination</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Identifiant</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                  placeholder="admin, marie, marie2..."
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium text-sm hover:from-indigo-700 hover:to-violet-700 transition shadow-lg shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Se connecter
                </>
              )}
            </button>

            {/* Demo credentials hint
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-1">
              <p className="font-medium text-slate-600 mb-2">Comptes de démonstration :</p>
              <p className="text-slate-500"><span className="font-semibold text-indigo-600">admin</span> / Admin2026 — Coordinateur</p>
              <p className="text-slate-500"><span className="font-semibold text-emerald-600">marie</span> / mariage2026 — Mariée</p>
              <p className="text-slate-500"><span className="font-semibold text-amber-600">marie2</span> / mariage2026 — Marié</p>
            </div> */}
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 EventFlow Pro · Propulsé par Lems Coordination
        </p>
      </div>
    </div>
  );
}
