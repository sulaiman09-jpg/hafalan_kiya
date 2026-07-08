/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Calendar, Clock, MapPin, Sparkles, BookOpen, User } from "lucide-react";
import { apiService } from "../services/api";
import { Jadwal } from "../types";

export default function JadwalView() {
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    hari: "Senin",
    jam: "07:30 - 09:00",
    kelas: "7A",
    guru: "Ustazah Maisyaroh",
    jenis: "Hafalan" as "Hafalan" | "Murojaah" | "Ujian"
  });

  const [filterDay, setFilterDay] = useState("Semua");

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const data = await apiService.getJadwal();
      setJadwalList(data);
    } catch (err) {
      console.error("Gagal mengambil jadwal:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiService.addJadwal(formData);
      setIsFormOpen(false);
      await fetchJadwal();
    } catch (err: any) {
      alert("Gagal menambahkan jadwal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJadwal = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus slot jadwal ini?")) return;
    try {
      await apiService.deleteJadwal(id);
      await fetchJadwal();
    } catch (err: any) {
      alert("Gagal menghapus jadwal: " + err.message);
    }
  };

  const days = ["Semua", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const filteredJadwal = filterDay === "Semua" 
    ? jadwalList 
    : jadwalList.filter(j => j.hari === filterDay);

  if (loading && jadwalList.length === 0) {
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
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Jadwal Halaqah Tahfidz</h2>
          <p className="text-sm text-gray-500">Agenda pembelajaran mingguan untuk setoran baru, murojaah bersama, dan ujian kenaikan juz.</p>
        </div>
        {!isFormOpen && (
          <button
            id="new-jadwal-btn"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Jadwal Baru</span>
          </button>
        )}
      </div>

      {/* Insert Schedule Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5.5 h-5.5 mr-2 text-emerald-600" /> Form Tambah Slot Halaqah
            </h3>
            <button
              id="close-jadwal-form"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1 bg-gray-150 text-gray-650 rounded-lg text-xs"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleSaveJadwal} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hari</label>
              <select
                id="jadwal-form-hari"
                value={formData.hari}
                onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              >
                {days.filter(d => d !== "Semua").map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jam Kegiatan</label>
              <input
                id="jadwal-form-jam"
                type="text"
                value={formData.jam}
                onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                placeholder="Contoh: 07:30 - 09:00"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kelas Halaqah</label>
              <input
                id="jadwal-form-kelas"
                type="text"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                placeholder="Contoh: 7A, 7B"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Guru Pengampu</label>
              <input
                id="jadwal-form-guru"
                type="text"
                value={formData.guru}
                onChange={(e) => setFormData({ ...formData, guru: e.target.value })}
                placeholder="Contoh: Ustazah Maisyaroh"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jenis Kegiatan</label>
              <select
                id="jadwal-form-jenis"
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              >
                <option value="Hafalan">Hafalan (Setoran Baru)</option>
                <option value="Murojaah">Murojaah (Sima'an Mandiri)</option>
                <option value="Ujian">Ujian (Wisuda/Kenaikan Juz)</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-center justify-end space-x-3 pt-3 border-t">
              <button
                id="cancel-jadwal-save"
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                id="save-jadwal-submit"
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10"
              >
                Simpan Slot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Filter Days */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {days.map(d => (
          <button
            id={`day-filter-btn-${d}`}
            key={d}
            onClick={() => setFilterDay(d)}
            className={`
              px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200
              ${filterDay === d 
                ? "bg-emerald-650 text-white dark:bg-emerald-700" 
                : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300"
              }
            `}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Schedule visualizer grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJadwal.length > 0 ? (
          filteredJadwal.map((slot) => (
            <div 
              key={slot.id} 
              className={`p-5 rounded-2xl border bg-white dark:bg-gray-900 shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                slot.jenis === 'Hafalan' ? 'border-l-4 border-l-emerald-550' :
                slot.jenis === 'Murojaah' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-red-500'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    slot.jenis === 'Hafalan' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    slot.jenis === 'Murojaah' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                    'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                  }`}>
                    {slot.jenis}
                  </span>
                  <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">{slot.hari}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="flex items-center text-gray-550 font-semibold">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" /> {slot.jam} WIB
                  </p>
                  <p className="flex items-center font-bold text-gray-850 dark:text-white">
                    <BookOpen className="w-4 h-4 mr-2 text-gray-400" /> Halaqah Kelas {slot.kelas}
                  </p>
                  <p className="flex items-center text-gray-600 dark:text-gray-300">
                    <User className="w-4 h-4 mr-2 text-gray-400" /> {slot.guru}
                  </p>
                </div>
              </div>

              <button
                id={`delete-jadwal-btn-${slot.id}`}
                onClick={() => slot.id && handleDeleteJadwal(slot.id)}
                className="absolute top-4 right-4 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                title="Hapus Agenda"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white dark:bg-gray-900 border p-12 text-center text-gray-500 rounded-3xl">
            Tidak ada agenda halaqah untuk hari {filterDay}.
          </div>
        )}
      </div>
    </div>
  );
}
