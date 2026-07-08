/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LoginView from "./components/LoginView";
import Navigation from "./components/Navigation";
import DashboardView from "./components/DashboardView";
import SiswaView from "./components/SiswaView";
import SuratView from "./components/SuratView";
import SetoranView from "./components/SetoranView";
import MurojaahView from "./components/MurojaahView";
import JadwalView from "./components/JadwalView";
import SertifikatView from "./components/SertifikatView";
import LaporanView from "./components/LaporanView";
import ConfigView from "./components/ConfigView";
import { Moon, Sun, LogOut } from "lucide-react";
import { UserRole } from "./types";

export default function App() {
  const [user, setUser] = useState<{ username: string; role: UserRole; name: string; relation?: any } | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);

  // Load session & theme
  useEffect(() => {
    const savedUser = localStorage.getItem("hafalan_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedTheme = localStorage.getItem("hafalan_theme");
    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleLoginSuccess = (userObj: any, relationObj: any) => {
    const sessionUser = {
      username: userObj.username,
      role: userObj.role as UserRole,
      name: userObj.nama,
      relation: relationObj
    };
    setUser(sessionUser);
    localStorage.setItem("hafalan_user", JSON.stringify(sessionUser));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("hafalan_user");
  };

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("hafalan_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("hafalan_theme", "light");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300 flex items-center justify-center">
        {/* Dark mode switch on login screen */}
        <button
          id="toggle-dark-mode-login"
          onClick={toggleDarkMode}
          className="absolute top-6 right-6 p-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-full shadow-lg border border-gray-100 dark:border-gray-800 hover:scale-105 active:scale-95 transition-all"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
        </button>
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Render proper View based on activeTab
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView 
            currentRole={user.role} 
            userName={user.name} 
            relation={user.relation} 
            setActiveTab={setActiveTab} 
          />
        );
      case "siswa":
        return <SiswaView />;
      case "surat":
        return <SuratView />;
      case "setoran":
        return <SetoranView />;
      case "murojaah":
        return <MurojaahView />;
      case "jadwal":
        return <JadwalView />;
      case "sertifikat":
        return <SertifikatView />;
      case "laporan":
        return <LaporanView />;
      case "config":
        return <ConfigView />;
      default:
        return (
          <DashboardView 
            currentRole={user.role} 
            userName={user.name} 
            relation={user.relation} 
            setActiveTab={setActiveTab} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 dark:text-gray-100 font-sans transition-colors duration-300 flex">
      {/* Sidebar Navigation */}
      <Navigation 
        currentRole={user.role}
        userName={user.name}
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        theme={darkMode ? "dark" : "light"}
        setTheme={(t) => {
          setDarkMode(t === "dark");
          if (t === "dark") {
            document.documentElement.classList.add("dark");
            localStorage.setItem("hafalan_theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("hafalan_theme", "light");
          }
        }}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-850 h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30 shadow-sm print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl">
              Role: {user.role}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              id="header-dark-mode-toggle"
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-xl transition-all"
              title="Ganti Tema"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Profile banner & Logout dropdown */}
            <div className="flex items-center space-x-3 border-l border-gray-100 dark:border-gray-800 pl-4">
              <div className="text-right">
                <p className="text-xs font-black text-gray-950 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{user.username}</p>
              </div>
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                title="Keluar Aplikasi"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Active view render scroll body */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}
