/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Calendar, 
  GraduationCap, 
  Award, 
  FileText, 
  Activity, 
  BookMarked,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";
import { UserRole } from "../types";

interface NavigationProps {
  currentRole: UserRole;
  userName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export default function Navigation({
  currentRole,
  userName,
  activeTab,
  setActiveTab,
  onLogout,
  theme,
  setTheme,
}: NavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const allItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS, UserRole.ORANG_TUA, UserRole.SISWA] },
    { id: "siswa", label: "Data Siswa", icon: Users, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS] },
    { id: "surat", label: "Master Surat", icon: BookMarked, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS, UserRole.ORANG_TUA, UserRole.SISWA] },
    { id: "setoran", label: "Setoran Hafalan", icon: BookOpen, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS, UserRole.ORANG_TUA, UserRole.SISWA] },
    { id: "murojaah", label: "Murojaah", icon: FileText, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS, UserRole.ORANG_TUA, UserRole.SISWA] },
    { id: "jadwal", label: "Jadwal", icon: Calendar, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS, UserRole.ORANG_TUA, UserRole.SISWA] },
    { id: "sertifikat", label: "Sertifikat & Ujian", icon: Award, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS, UserRole.ORANG_TUA, UserRole.SISWA] },
    { id: "laporan", label: "Laporan", icon: GraduationCap, roles: [UserRole.ADMIN, UserRole.GURU, UserRole.WALI_KELAS] },
    { id: "config", label: "Pengaturan GAS", icon: Settings, roles: [UserRole.ADMIN] },
  ];

  const visibleItems = allItems.filter(item => item.roles.includes(currentRole));

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getInitials = (name: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-emerald-900 text-white shadow-md">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 animate-pulse text-emerald-400" />
          <span className="font-bold tracking-tight">Sistem Hafalan</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            id="mobile-theme-toggle"
            onClick={toggleTheme} 
            className="p-2 hover:bg-emerald-800 rounded-lg transition-colors text-emerald-100"
            title="Toggle Tema"
          >
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </button>
          <button 
            id="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 hover:bg-emerald-800 rounded-lg transition-colors text-emerald-100"
            title="Buka Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          id="mobile-nav-overlay"
          className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 dark:bg-emerald-950 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static md:h-screen shadow-2xl shrink-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Logo */}
          <div className="p-6 flex items-center justify-between border-b border-emerald-800/40 dark:border-emerald-900/45 shrink-0">
            <div className="flex items-center space-x-3 text-white">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-tight text-white">Sistem Hafalan</h1>
                <p className="text-emerald-400 text-[10px] uppercase tracking-widest font-semibold">Juz Amma Dashboard</p>
              </div>
            </div>
            <button 
              id="sidebar-close-btn"
              onClick={() => setIsOpen(false)} 
              className="md:hidden text-emerald-200 hover:text-white transition-colors"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? "bg-emerald-800/50 text-white shadow-inner" 
                      : "text-emerald-100/60 hover:bg-emerald-800/20 hover:text-white"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-emerald-300 opacity-100" : "opacity-70"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel with Profile, Theme toggle and Logout */}
        <div className="shrink-0 border-t border-emerald-800/40 dark:border-emerald-900/45 p-4 space-y-3 bg-emerald-950/20">
          {/* User Profile Summary */}
          <div className="p-3.5 bg-emerald-800/50 dark:bg-emerald-900/40 rounded-2xl">
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider">LOGGED IN AS</p>
            <div className="flex items-center space-x-3 mt-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-emerald-900 text-xs shadow-md shadow-amber-450/10 shrink-0">
                {getInitials(userName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-bold leading-none truncate" title={userName}>{userName}</p>
                <p className="text-emerald-400 text-[10px] uppercase font-semibold mt-0.5 tracking-wide truncate">{currentRole}</p>
              </div>
            </div>
          </div>

          {/* Theme Toggle (Desktop Only) */}
          <button
            id="sidebar-theme-toggle"
            onClick={toggleTheme}
            className="hidden md:flex w-full items-center justify-between px-3.5 py-2 text-xs font-semibold text-emerald-100/60 hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-3">
              {theme === "light" ? <Moon className="w-4 h-4 text-emerald-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>{theme === "light" ? "Mode Gelap" : "Mode Terang"}</span>
            </div>
            <div className="w-8 h-4 rounded-full bg-emerald-800 dark:bg-emerald-900 relative transition-colors">
              <div className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
            </div>
          </button>

          {/* Logout button */}
          <button
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2 text-xs font-bold text-red-350 hover:text-red-100 hover:bg-red-950/25 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
