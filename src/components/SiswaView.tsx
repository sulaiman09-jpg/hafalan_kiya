/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  X, 
  UserPlus, 
  Phone, 
  MapPin, 
  User, 
  AlertTriangle 
} from "lucide-react";
import { apiService } from "../services/api";
import { Siswa } from "../types";

export default function SiswaView() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [filteredSiswa, setFilteredSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentSiswa, setCurrentSiswa] = useState<Partial<Siswa>>({});
  const [nisToDelete, setNisToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchSiswa();
  }, []);

  useEffect(() => {
    let result = siswaList;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s => s.nama.toLowerCase().includes(query) || s.nis.includes(query)
      );
    }

    if (selectedClass !== "Semua") {
      result = result.filter(s => s.kelas === selectedClass);
    }

    setFilteredSiswa(result);
    setCurrentPage(1); // Reset to page 1 on filter
  }, [siswaList, searchQuery, selectedClass]);

  const fetchSiswa = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSiswa();
      setSiswaList(data);
    } catch (err: any) {
      console.error(err);
      setError("Gagal mengambil data siswa.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setCurrentSiswa({
      nis: "",
      nama: "",
      kelas: "7A",
      jk: "L",
      alamat: "",
      orang_tua: "",
      hp: "",
      foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      guru_tahfidz: "Ustazah Maisyaroh",
      wali_kelas: "Budi Santoso, M.Pd"
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (siswa: Siswa) => {
    setCurrentSiswa(siswa);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiswa.nis || !currentSiswa.nama || !currentSiswa.kelas) {
      setError("NIS, Nama, dan Kelas wajib diisi.");
      return;
    }

    try {
      const isEdit = siswaList.some(s => s.nis === currentSiswa.nis);
      if (isEdit) {
        await apiService.updateSiswa(currentSiswa.nis!, currentSiswa);
      } else {
        await apiService.addSiswa(currentSiswa as Siswa);
      }
      setIsModalOpen(false);
      fetchSiswa();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data siswa.");
    }
  };

  const handleOpenDeleteConfirm = (nis: string) => {
    setNisToDelete(nis);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteSiswa = async () => {
    if (!nisToDelete) return;
    try {
      await apiService.deleteSiswa(nisToDelete);
      setIsDeleteConfirmOpen(false);
      setNisToDelete(null);
      fetchSiswa();
    } catch (err: any) {
      alert("Gagal menghapus siswa: " + err.message);
    }
  };

  // Get unique classes for filter
  const classes = ["Semua", ...Array.from(new Set(siswaList.map(s => s.kelas)))];

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSiswa.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-850 rounded-xl w-1/4" />
        <div className="h-12 bg-gray-200 dark:bg-gray-850 rounded-xl" />
        <div className="h-96 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Data Siswa</h2>
          <p className="text-sm text-gray-500">Kelola informasi profil siswa, penugasan guru tahfidz, dan wali kelas.</p>
        </div>
        <button
          id="add-siswa-btn"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Siswa</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="siswa-search-input"
            type="text"
            placeholder="Cari nama atau NIS siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kelas:</span>
          <select
            id="siswa-class-filter"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          >
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Siswa Table / Grid */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-850/40 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">Foto / Nama</th>
                <th className="px-6 py-4">NIS</th>
                <th className="px-6 py-4">Kelas / JK</th>
                <th className="px-6 py-4">Orang Tua</th>
                <th className="px-6 py-4">Pembimbing Tahfidz</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-800 dark:text-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((siswa) => (
                  <tr key={siswa.nis} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={siswa.foto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"}
                          alt={siswa.nama}
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500/10"
                        />
                        <div>
                          <p className="font-bold text-gray-950 dark:text-white">{siswa.nama}</p>
                          <p className="text-xs text-gray-450">{siswa.alamat}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{siswa.nis}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-2">{siswa.kelas}</span>
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 font-bold">
                        {siswa.jk === "L" ? "Laki-laki" : "Perempuan"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{siswa.orang_tua}</p>
                      <p className="text-xs text-gray-450 flex items-center mt-0.5">
                        <Phone className="w-3 h-3 mr-1" /> {siswa.hp}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg inline-block">
                        {siswa.guru_tahfidz || "Belum Ditentukan"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">Wali: {siswa.wali_kelas}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          id={`edit-siswa-btn-${siswa.nis}`}
                          onClick={() => handleOpenEditModal(siswa)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
                          title="Edit Siswa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-siswa-btn-${siswa.nis}`}
                          onClick={() => handleOpenDeleteConfirm(siswa.nis)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-600 transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Siswa tidak ditemukan. Silakan tambahkan siswa baru atau ubah pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-850/20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSiswa.length)} dari {filteredSiswa.length} siswa
            </span>
            <div className="flex items-center space-x-2">
              <button
                id="pagination-prev"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg text-xs disabled:opacity-50"
              >
                Kembali
              </button>
              <span className="text-xs font-bold text-gray-750 dark:text-gray-300 px-2">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                id="pagination-next"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 bg-white hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg text-xs disabled:opacity-50"
              >
                Lanjut
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div id="siswa-editor-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-emerald-600" />
                {siswaList.some(s => s.nis === currentSiswa.nis) ? "Edit Data Siswa" : "Tambah Siswa Baru"}
              </h3>
              <button 
                id="close-siswa-modal"
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiswa} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">NIS (Nomor Induk Siswa)</label>
                  <input
                    id="siswa-form-nis"
                    type="text"
                    value={currentSiswa.nis || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, nis: e.target.value })}
                    disabled={siswaList.some(s => s.nis === currentSiswa.nis)}
                    placeholder="Contoh: 1006"
                    className="w-full px-4 py-2.5 bg-gray-50 disabled:bg-gray-100 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap Siswa</label>
                  <input
                    id="siswa-form-nama"
                    type="text"
                    value={currentSiswa.nama || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, nama: e.target.value })}
                    placeholder="Contoh: Muhammad Akhyar"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kelas</label>
                  <input
                    id="siswa-form-kelas"
                    type="text"
                    value={currentSiswa.kelas || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, kelas: e.target.value })}
                    placeholder="Contoh: 7A, 7B"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jenis Kelamin</label>
                  <div className="flex items-center space-x-4 h-10">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="jk"
                        value="L"
                        checked={currentSiswa.jk === "L"}
                        onChange={() => setCurrentSiswa({ ...currentSiswa, jk: "L" })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Laki-laki</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        name="jk"
                        value="P"
                        checked={currentSiswa.jk === "P"}
                        onChange={() => setCurrentSiswa({ ...currentSiswa, jk: "P" })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Perempuan</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Orang Tua / Wali</label>
                  <input
                    id="siswa-form-parent"
                    type="text"
                    value={currentSiswa.orang_tua || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, orang_tua: e.target.value })}
                    placeholder="Nama bapak atau ibu..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor HP / WhatsApp</label>
                  <input
                    id="siswa-form-hp"
                    type="text"
                    value={currentSiswa.hp || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, hp: e.target.value })}
                    placeholder="Contoh: 0812xxxxxxxx"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Guru Tahfidz Pembimbing</label>
                  <input
                    id="siswa-form-guru"
                    type="text"
                    value={currentSiswa.guru_tahfidz || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, guru_tahfidz: e.target.value })}
                    placeholder="Contoh: Ustazah Maisyaroh"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Wali Kelas</label>
                  <input
                    id="siswa-form-wali"
                    type="text"
                    value={currentSiswa.wali_kelas || ""}
                    onChange={(e) => setCurrentSiswa({ ...currentSiswa, wali_kelas: e.target.value })}
                    placeholder="Contoh: Budi Santoso, M.Pd"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Lengkap</label>
                <textarea
                  id="siswa-form-alamat"
                  rows={2}
                  value={currentSiswa.alamat || ""}
                  onChange={(e) => setCurrentSiswa({ ...currentSiswa, alamat: e.target.value })}
                  placeholder="Masukkan alamat tinggal siswa secara rinci..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Link Foto Profil (Opsional)</label>
                <input
                  id="siswa-form-foto"
                  type="text"
                  value={currentSiswa.foto || ""}
                  onChange={(e) => setCurrentSiswa({ ...currentSiswa, foto: e.target.value })}
                  placeholder="URL Gambar Unsplash atau server..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end space-x-3">
                <button
                  id="cancel-siswa-save"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  id="save-siswa-submit"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div id="siswa-delete-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="bg-red-50 dark:bg-red-950 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white">Konfirmasi Hapus</h4>
            </div>
            <p className="text-xs text-gray-650 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus siswa dengan NIS **{nisToDelete}**? Tindakan ini tidak dapat dibatalkan dan seluruh histori setoran siswa ini akan diarsipkan.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="cancel-siswa-delete"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                id="confirm-siswa-delete"
                onClick={handleDeleteSiswa}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/10"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
