/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { apiService } from "../services/api";
import { UserRole } from "../types";

interface LoginProps {
  onLoginSuccess: (user: any, relation: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(username, password);
      onLoginSuccess(response.user, response.relation);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Periksa kembali username dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string, role: string) => {
    setUsername(user);
    setPassword("123");
    setError(null);
  };

  const demoAccounts = [
    { name: "Admin", username: "admin", role: "Super Admin" },
    { name: "Guru Tahfidz", username: "maisyaroh", role: "Pendidik" },
    { name: "Wali Kelas", username: "budi", role: "Pengawas" },
    { name: "Siswa", username: "kiya", role: "Santri" },
    { name: "Orang Tua", username: "ortu_kiya", role: "Wali Murid" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 dark:from-slate-950 dark:via-gray-900 dark:to-emerald-950/20 px-4 py-12 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="w-full max-w-md z-10">
        {/* App Title Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-emerald-100 dark:bg-emerald-950/50 p-4 rounded-3xl text-emerald-600 dark:text-emerald-400 mb-4 shadow-xl border border-emerald-200/50 dark:border-emerald-900/30">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Sistem Hafalan Juz Amma</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Pelacakan Setoran, Murojaah & Penilaian Berbasis AI</p>
        </div>

        {/* Login Glassmorphism Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl p-8 border border-white/40 dark:border-gray-800/50 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Masuk ke Portal</h2>

          {error && (
            <div id="login-error-alert" className="mb-5 flex items-start space-x-2 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-3.5 rounded-xl border border-red-100 dark:border-red-900/20 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Nama Pengguna (Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-850/30 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Kata Sandi (Password)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-850/30 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20 hover:scale-[1.01] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Guide */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Akses Cepat Akun Demo (Pass: 123)</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  id={`demo-btn-${acc.username}`}
                  key={acc.username}
                  onClick={() => handleQuickFill(acc.username, acc.name)}
                  className="px-3 py-2 bg-gray-50 hover:bg-emerald-50 text-left dark:bg-gray-800/40 dark:hover:bg-emerald-950/20 border border-gray-100 dark:border-gray-800 rounded-xl transition-all"
                >
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">{acc.name}</p>
                  <p className="text-[10px] text-gray-450 truncate">{acc.username}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-450 mt-6">
          Sistem Hafalan Juz Amma &copy; {new Date().getFullYear()} — SMP Islam Terpadu
        </p>
      </div>
    </div>
  );
}
