/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Star,
  Sparkles,
  Award,
  BookMarked
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line 
} from "recharts";
import { apiService } from "../services/api";
import { UserRole } from "../types";

interface DashboardProps {
  currentRole: UserRole;
  userName: string;
  relation: any;
  setActiveTab: (tab: string) => void;
}

export default function DashboardView({ currentRole, userName, relation, setActiveTab }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [surahList, setSurahList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [dashboardData, setoranData, surahs] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getSetoran(),
          apiService.getSurat()
        ]);
        setStats(dashboardData);
        setRecentLogs(setoranData.slice(-5).reverse());
        setSurahList(surahs);
      } catch (err) {
        console.error("Gagal mengambil data dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-850 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
          <div className="h-80 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Get Surah details map
  const surahMap = new Map<number, any>(surahList.map(s => [s.nomor, s]));

  // Prepare chart data
  const progressChartData = stats?.ranking?.slice(0, 5).map((p: any) => ({
    name: p.nama,
    "Selesai (Surat)": p.suratSelesai,
    "Persen (%)": p.persentase,
  })) || [];

  // Trend data of last 10 memorizations
  const trendData = stats?.progressSiswa?.slice(0, 6).map((p: any) => ({
    name: p.nama.split(" ")[0],
    "Selesai": p.suratSelesai
  })) || [];

  // Filter student/parent specific dashboard data
  const isStudent = currentRole === UserRole.SISWA;
  const isParent = currentRole === UserRole.ORANG_TUA;

  let currentSiswaStats = null;
  if ((isStudent || isParent) && relation) {
    currentSiswaStats = stats?.progressSiswa?.find((p: any) => p.nis === relation.nis);
  }

  // Helper for Surah details
  const getSurahName = (no: number) => {
    return (surahMap.get(no) as any)?.latin || `Surat ${no}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Assalamu'alaikum, {userName}</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">
            {(isStudent || isParent) 
              ? `Semangat murojaah hari ini! Anda telah menyelesaikan ${currentSiswaStats?.suratSelesai || 12} surat dari Juz Amma.`
              : `Mari bimbing generasi muda menjadi para penghafal Al-Qur'an yang mutqin.`}
          </p>
        </div>
        <div className="flex space-x-3 items-center">
          <div className="bg-white dark:bg-gray-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-gray-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-600 dark:text-gray-300">
              {(isStudent || isParent)
                ? `Status: ${currentSiswaStats?.suratSelesai >= 30 ? "Hafidz Premium" : currentSiswaStats?.suratSelesai >= 15 ? "Hafidz Menengah" : "Hafidz Junior"}`
                : `Status: Pengajar Tahfidz`}
            </span>
          </div>
          <button 
            id="header-start-setoran-btn"
            onClick={() => setActiveTab("setoran")}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 text-sm"
          >
            Mulai Setoran
          </button>
        </div>
      </header>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-505 font-semibold text-gray-500 uppercase tracking-wider">Total Siswa</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalSiswa || 0}</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-450 mt-3 border-t border-gray-50 dark:border-gray-800/50 pt-2 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Aktif di seluruh angkatan
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-550 font-semibold text-gray-500 uppercase tracking-wider">Setoran Selesai</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.totalSetoran || 0}</h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-xl text-amber-600 dark:text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-450 mt-3 border-t border-gray-50 dark:border-gray-800/50 pt-2 flex items-center">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1">
              {stats?.setoranLulus || 0}
            </span> Lulus uji kelancaran
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-550 font-semibold text-gray-500 uppercase tracking-wider">Nilai Rata-rata</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.avgNilai || 0} / 100</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-xl text-blue-600 dark:text-blue-400">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-450 mt-3 border-t border-gray-50 dark:border-gray-800/50 pt-2">
            Predikat: <span className="font-bold text-blue-600">
              {(stats?.avgNilai >= 90) ? "A (Sangat Baik)" : (stats?.avgNilai >= 80) ? "B (Baik)" : "C (Cukup)"}
            </span>
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-550 font-semibold text-gray-500 uppercase tracking-wider">Hafalan Kelas (%)</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.rataRataPersentase || 0}%</h3>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-xl text-purple-600 dark:text-purple-400">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3.5 border-t border-gray-50 dark:border-gray-800/50 pt-2">
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full rounded-full transition-all" 
                style={{ width: `${stats?.rataRataPersentase || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Special Block for Students / Parents */}
      {currentSiswaStats && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-emerald-950/10 border border-amber-200/50 dark:border-emerald-900/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="bg-amber-100 dark:bg-amber-950 p-1.5 rounded-lg text-amber-600 dark:text-amber-400">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <h4 className="font-extrabold text-gray-900 dark:text-white tracking-tight">Badge Hafidz Anda</h4>
            </div>
            <h5 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
              {currentSiswaStats.suratSelesai >= 30 ? "Hafidz Premium (Juz 30 Mutqin)" : currentSiswaStats.suratSelesai >= 15 ? "Hafidz Menengah" : "Hafidz Junior"}
            </h5>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Anda telah menyelesaikan **{currentSiswaStats.suratSelesai} dari 37 Surat** di Juz Amma ({currentSiswaStats.persentase}%). 
              Target selanjutnya adalah meningkatkan makhraj dan memperbanyak murojaah harian.
            </p>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-500">
              <span>PROGRESS JUZ AMMA</span>
              <span>{currentSiswaStats.persentase}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-850 h-3 rounded-full overflow-hidden border border-gray-300/30">
              <div 
                className="bg-amber-500 dark:bg-emerald-600 h-full rounded-full" 
                style={{ width: `${currentSiswaStats.persentase}%` }}
              />
            </div>
            <button 
              id="dash-setoran-tab-btn"
              onClick={() => setActiveTab("setoran")}
              className="mt-3 w-full py-2 bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-850 dark:hover:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center space-x-1"
            >
              <span>Uji Setoran Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Visual Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" /> Top 5 Hafalan Santri (Surat)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "10px", color: "#FFF" }} 
                  itemStyle={{ color: "#10B981" }}
                />
                <Bar dataKey="Selesai (Surat)" fill="#10B981" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-amber-500 fill-amber-500" /> Grafik Progress Pencapaian
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "10px", color: "#FFF" }} 
                />
                <Line type="monotone" dataKey="Selesai" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* List Feed Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Recent Logs */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-emerald-600" /> Setoran Hafalan Terbaru
            </h4>
            <button 
              id="dash-setoran-view-all"
              onClick={() => setActiveTab("setoran")} 
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentLogs.map((log: any) => {
              const studentName = stats?.progressSiswa?.find((p: any) => p.nis === log.nis)?.nama || `Santri ${log.nis}`;
              return (
                <div key={log.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{studentName}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      QS. {getSurahName(log.surat)} (Ayat {log.ayat_awal}-{log.ayat_akhir})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                      log.status === 'Lulus' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {log.status} (N: {log.nilai})
                    </span>
                    <p className="text-[10px] text-gray-450 mt-1">{log.tanggal}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Leaderboard / Ranking */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-amber-500" /> Ranking Hafalan Terbanyak
          </h4>
          <div className="space-y-3.5">
            {stats?.ranking?.slice(0, 4).map((p: any, idx: number) => (
              <div key={p.nis} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-850/40 p-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? "bg-amber-100 text-amber-850 dark:bg-amber-950" :
                  idx === 1 ? "bg-slate-200 text-slate-800" :
                  idx === 2 ? "bg-orange-100 text-orange-850" : "bg-gray-100 text-gray-600"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{p.nama}</p>
                  <p className="text-[10px] text-gray-400">{p.kelas} — {p.suratSelesai} Surat</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{p.persentase}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
