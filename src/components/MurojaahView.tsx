/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  Calendar,
  Bell
} from "lucide-react";
import { apiService } from "../services/api";
import { Murojaah, Siswa, Surat } from "../types";

export default function MurojaahView() {
  const [murojaahList, setMurojaahList] = useState<Murojaah[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [suratList, setSuratList] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    nis: "",
    surat: 114,
    nilai: 90,
    catatan: ""
  });

  // Dynamic warnings state
  const [inactivityAlerts, setInactivityAlerts] = useState<any[]>([]);

  // Current simulation date (July 7, 2026)
  const TODAY = new Date("2026-07-07");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [murojaah, siswa, surat] = await Promise.all([
        apiService.getMurojaah(),
        apiService.getSiswa(),
        apiService.getSurat()
      ]);
      setMurojaahList(murojaah);
      setSiswaList(siswa);
      setSuratList(surat);

      if (siswa.length > 0) {
        setFormData(prev => ({ ...prev, nis: siswa[0].nis }));
      }

      // Calculate automated reminders
      calculateReminders(murojaah, siswa);
    } catch (err) {
      console.error("Gagal mengambil data murojaah:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateReminders = (murojaahs: Murojaah[], siswas: Siswa[]) => {
    const alerts: any[] = [];
    
    siswas.forEach(s => {
      // Find latest murojaah date for this student
      const studentMurojaahs = murojaahs.filter(m => m.nis === s.nis);
      if (studentMurojaahs.length === 0) {
        alerts.push({
          nis: s.nis,
          nama: s.nama,
          kelas: s.kelas,
          daysIdle: 999, // Never murojaah
          level: "danger",
          message: "Belum pernah tercatat melakukan murojaah!"
        });
        return;
      }

      // Sort to find newest
      const sorted = [...studentMurojaahs].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      const latestDate = new Date(sorted[0].tanggal);
      
      // Calculate diff
      const diffTime = Math.abs(TODAY.getTime() - latestDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 30) {
        alerts.push({
          nis: s.nis,
          nama: s.nama,
          kelas: s.kelas,
          daysIdle: diffDays,
          level: "danger",
          message: `URGENT: Tidak Murojaah ${diffDays} Hari!`
        });
      } else if (diffDays >= 14) {
        alerts.push({
          nis: s.nis,
          nama: s.nama,
          kelas: s.kelas,
          daysIdle: diffDays,
          level: "warning",
          message: `Perhatian: Tidak Murojaah ${diffDays} Hari`
        });
      } else if (diffDays >= 7) {
        alerts.push({
          nis: s.nis,
          nama: s.nama,
          kelas: s.kelas,
          daysIdle: diffDays,
          level: "info",
          message: `Peringatan: Tidak Murojaah ${diffDays} Hari`
        });
      }
    });

    setInactivityAlerts(alerts.sort((a, b) => b.daysIdle - a.daysIdle));
  };

  const handleSaveMurojaah = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis) {
      alert("Siswa wajib dipilih!");
      return;
    }

    try {
      setLoading(true);
      await apiService.addMurojaah(formData);
      setIsFormOpen(false);
      setFormData(prev => ({ ...prev, catatan: "" }));
      await fetchData();
    } catch (err: any) {
      alert("Gagal mencatat murojaah: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMurojaah = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan murojaah ini?")) return;
    try {
      await apiService.deleteMurojaah(id);
      await fetchData();
    } catch (err: any) {
      alert("Gagal menghapus murojaah: " + err.message);
    }
  };

  const getStudentName = (nis: string) => {
    return siswaList.find(s => s.nis === nis)?.nama || `Santri ${nis}`;
  };

  const getStudentClass = (nis: string) => {
    return siswaList.find(s => s.nis === nis)?.kelas || "-";
  };

  const getSurahName = (no: number) => {
    return suratList.find(s => s.nomor === no)?.latin || `Surat ${no}`;
  };

  if (loading && murojaahList.length === 0) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-850 rounded-xl w-1/4" />
        <div className="h-96 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Murojaah Santri</h2>
          <p className="text-sm text-gray-500">Mencatat pengulangan (murojaah) surat-surat yang telah dihafal untuk menjaga kemutqinan hafalan.</p>
        </div>
        {!isFormOpen && (
          <button
            id="new-murojaah-btn"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-5 h-5" />
            <span>Catat Murojaah Baru</span>
          </button>
        )}
      </div>

      {/* Automated Reminder Alerts Bar */}
      {inactivityAlerts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-gray-850 dark:text-white flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-500 animate-swing" />
            <span>Reminder Otomatis Idle Murojaah (Sistem Cerdas)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {inactivityAlerts.slice(0, 6).map((alertItem) => (
              <div 
                key={alertItem.nis} 
                className={`p-3.5 rounded-2xl border flex items-start space-x-3 text-xs ${
                  alertItem.level === 'danger' 
                    ? 'bg-red-50/70 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400' 
                    : alertItem.level === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                    : 'bg-blue-50/70 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
                }`}
              >
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black truncate">{alertItem.nama} ({alertItem.kelas})</p>
                  <p className="font-medium mt-0.5">{alertItem.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Box */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5.5 h-5.5 mr-2 text-emerald-600" /> Form Pencatatan Murojaah Baru
            </h3>
            <button
              id="close-murojaah-form"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-lg text-xs"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleSaveMurojaah} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Siswa</label>
              <select
                id="murojaah-form-siswa"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              >
                {siswaList.map(s => (
                  <option key={s.nis} value={s.nis}>{s.nama} ({s.kelas})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal</label>
              <input
                id="murojaah-form-tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Surat yang Diulang</label>
              <select
                id="murojaah-form-surat"
                value={formData.surat}
                onChange={(e) => setFormData({ ...formData, surat: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              >
                {suratList.map(s => (
                  <option key={s.nomor} value={s.nomor}>QS. {s.latin} ({s.arab})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nilai Kelancaran (0 - 100)</label>
              <input
                id="murojaah-form-nilai"
                type="number"
                min={0}
                max={100}
                value={formData.nilai}
                onChange={(e) => setFormData({ ...formData, nilai: Number(e.target.value) })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan Murojaah (Perbaikan / Evaluasi)</label>
              <textarea
                id="murojaah-form-catatan"
                rows={2}
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Tulis ulasan makhraj yang sering dilupakan, atau catatan khusus lainnya..."
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end space-x-3 pt-3 border-t">
              <button
                id="cancel-murojaah-save"
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                id="save-murojaah-submit"
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Murojaah Logs List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-850/30 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Siswa / Kelas</th>
                <th className="px-6 py-4">Surat Murojaah</th>
                <th className="px-6 py-4">Skor / Status</th>
                <th className="px-6 py-4">Catatan Perkembangan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {murojaahList.length > 0 ? (
                [...murojaahList].reverse().map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-850/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-500 whitespace-nowrap">{m.tanggal}</td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-gray-900 dark:text-white">{getStudentName(m.nis)}</p>
                      <p className="text-[10px] text-gray-400">Kelas {getStudentClass(m.nis)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">QS. {getSurahName(m.surat)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 font-bold rounded-lg ${
                        m.nilai >= 85 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : m.nilai >= 70
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {m.status || (m.nilai >= 85 ? "Lancar" : m.nilai >= 70 ? "Sedang" : "Perlu Diulang")} (N: {m.nilai})
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={m.catatan}>{m.catatan || "-"}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        id={`delete-murojaah-btn-${m.id}`}
                        onClick={() => handleDeleteMurojaah(m.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-600 transition-colors"
                        title="Hapus Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada riwayat murojaah. Daftarkan murojaah murid Anda untuk menjaga hafalannya!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
