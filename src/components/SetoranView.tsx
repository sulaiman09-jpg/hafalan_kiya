/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  BookOpen, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  Award,
  Sparkles,
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import { apiService } from "../services/api";
import { Setoran, Siswa, Guru, Surat } from "../types";

export default function SetoranView() {
  const [setoranList, setSetoranList] = useState<Setoran[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [suratList, setSuratList] = useState<Surat[]>([]);

  const [filteredSetoran, setFilteredSetoran] = useState<Setoran[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    nis: "",
    guru: "",
    surat: 114,
    ayat_awal: 1,
    ayat_akhir: 6,
    kelancaran: 85,
    tajwid: 85,
    makhraj: 85,
    irama: 80,
    adab: 90,
    catatan: "",
  });

  // AI states
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiTranscript, setAiTranscript] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let result = setoranList;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => {
        const student = siswaList.find(st => st.nis === s.nis);
        const surah = suratList.find(su => su.nomor === s.surat);
        return (
          student?.nama.toLowerCase().includes(q) ||
          surah?.latin.toLowerCase().includes(q) ||
          s.nis.includes(q)
        );
      });
    }

    if (selectedClass !== "Semua") {
      result = result.filter(s => {
        const student = siswaList.find(st => st.nis === s.nis);
        return student?.kelas === selectedClass;
      });
    }

    setFilteredSetoran(result.slice().reverse()); // Newest first
  }, [setoranList, searchQuery, selectedClass, siswaList, suratList]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [setoran, siswa, guru, surat] = await Promise.all([
        apiService.getSetoran(),
        apiService.getSiswa(),
        apiService.getGuru(),
        apiService.getSurat()
      ]);
      setSetoranList(setoran);
      setSiswaList(siswa);
      setGuruList(guru);
      setSuratList(surat);

      if (siswa.length > 0) {
        setFormData(prev => ({
          ...prev,
          nis: siswa[0].nis,
          guru: guru[0]?.nama || "Ustazah Maisyaroh"
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil data setoran:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.min(100, Math.max(0, value))
    }));
  };

  // Auto calculate values on frontend for visualization
  const calculatedAverage = Math.round(
    (formData.kelancaran + formData.tajwid + formData.makhraj + formData.irama + formData.adab) / 5
  );

  let calculatedStatus: "Lulus" | "Mengulang" | "Perlu Bimbingan" = "Lulus";
  if (calculatedAverage < 70) {
    calculatedStatus = "Perlu Bimbingan";
  } else if (calculatedAverage < 80) {
    calculatedStatus = "Mengulang";
  }

  const handleSaveSetoran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.guru) {
      alert("Siswa dan Guru harus dipilih!");
      return;
    }

    try {
      setLoading(true);
      await apiService.addSetoran(formData);
      setIsFormOpen(false);
      setIsAiPanelOpen(false);
      setAiResult(null);
      setAiNotes("");
      setAiTranscript("");
      await fetchInitialData();
    } catch (err: any) {
      alert("Gagal menyimpan setoran: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSetoran = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data setoran ini?")) return;
    try {
      await apiService.deleteSetoran(id);
      await fetchInitialData();
    } catch (err: any) {
      alert("Gagal menghapus setoran: " + err.message);
    }
  };

  const runAiAnalysis = async () => {
    if (!aiTranscript && !aiNotes) {
      alert("Tulis catatan atau transkrip bacaan siswa terlebih dahulu!");
      return;
    }

    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await apiService.analyzeTajweed({
        transcript: aiTranscript,
        surat: formData.surat,
        notes: aiNotes
      });
      setAiResult(res);
    } catch (err: any) {
      alert("AI gagal menganalisis: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiScores = () => {
    if (!aiResult) return;
    const { scores, status, analysis } = aiResult;
    setFormData(prev => ({
      ...prev,
      kelancaran: scores.kelancaran || prev.kelancaran,
      tajwid: scores.tajwid || prev.tajwid,
      makhraj: scores.makhraj || prev.makhraj,
      irama: scores.irama || prev.irama,
      adab: scores.adab || prev.adab,
      catatan: `[AI Analisis]: ${analysis.replace(/###|#|\*\*|\*/g, "").substring(0, 150)}...`
    }));
    alert("Nilai dan Catatan hasil AI berhasil diterapkan ke form!");
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

  const classes = ["Semua", ...Array.from(new Set(siswaList.map(s => s.kelas)))];

  if (loading && setoranList.length === 0) {
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
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Setoran Hafalan Juz Amma</h2>
          <p className="text-sm text-gray-500">Mencatat, melacak, menilai setoran hafalan harian murid, dilengkapi asisten penilaian tajwid AI.</p>
        </div>
        {!isFormOpen && (
          <button
            id="new-setoran-btn"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Setoran Baru</span>
          </button>
        )}
      </div>

      {/* Insert / Edit Form */}
      {isFormOpen && (
        <div className="bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-950/40 rounded-3xl shadow-xl overflow-hidden p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <PlusCircle className="w-5.5 h-5.5 mr-2 text-emerald-600" /> Form Input Setoran & Penilaian Rubrik
            </h3>
            <button
              id="close-setoran-form"
              onClick={() => {
                setIsFormOpen(false);
                setIsAiPanelOpen(false);
                setAiResult(null);
              }}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 text-gray-500 rounded-lg text-xs"
            >
              Tutup Form
            </button>
          </div>

          <form onSubmit={handleSaveSetoran} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Core fields */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Siswa</label>
                <select
                  id="setoran-form-siswa"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                >
                  {siswaList.map(s => (
                    <option key={s.nis} value={s.nis}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Guru Penerima</label>
                <select
                  id="setoran-form-guru"
                  value={formData.guru}
                  onChange={(e) => setFormData({ ...formData, guru: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                >
                  {guruList.map(g => (
                    <option key={g.id} value={g.nama}>{g.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Setoran</label>
                <input
                  id="setoran-form-tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Surat Juz Amma</label>
                <select
                  id="setoran-form-surat"
                  value={formData.surat}
                  onChange={(e) => {
                    const selectedNo = Number(e.target.value);
                    const selectedS = suratList.find(s => s.nomor === selectedNo);
                    setFormData({ 
                      ...formData, 
                      surat: selectedNo,
                      ayat_awal: 1,
                      ayat_akhir: selectedS ? selectedS.ayat : 10
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                >
                  {suratList.map(s => (
                    <option key={s.nomor} value={s.nomor}>QS. {s.latin} ({s.arab})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ayat Awal</label>
                <input
                  id="setoran-form-ayat-awal"
                  type="number"
                  min={1}
                  value={formData.ayat_awal}
                  onChange={(e) => setFormData({ ...formData, ayat_awal: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ayat Akhir</label>
                <input
                  id="setoran-form-ayat-akhir"
                  type="number"
                  min={1}
                  value={formData.ayat_akhir}
                  onChange={(e) => setFormData({ ...formData, ayat_akhir: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>
            </div>

            {/* AI Assistant Button Trigger */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-5 h-5 animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm">Gunakan Asisten Tajwid AI (Gemini)</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-450">AI akan menganalisis kesalahan tajwid, menentukan skor rubrik, dan menulis catatan otomatis.</p>
                </div>
              </div>
              <button
                id="toggle-ai-panel-btn"
                type="button"
                onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-emerald-600/10"
              >
                <span>{isAiPanelOpen ? "Sembunyikan Panel AI" : "Buka Panel AI"}</span>
              </button>
            </div>

            {/* AI Sub-panel Workspace */}
            {isAiPanelOpen && (
              <div id="ai-assistant-panel" className="bg-slate-50 dark:bg-gray-850 p-5 rounded-3xl border border-gray-200 dark:border-gray-850 space-y-4 animate-in slide-in-from-top-4">
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center">
                  <Sparkles className="w-4.5 h-4.5 mr-1.5" /> Ruang Analisis Asisten AI
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ketik Transkrip Bacaan Murid (Opsional)</label>
                    <textarea
                      id="ai-transcript-input"
                      rows={3}
                      value={aiTranscript}
                      onChange={(e) => setAiTranscript(e.target.value)}
                      placeholder="Tulis tulisan arab / latin pelafalan siswa..."
                      className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Catatan Kesalahan dari Guru (Opsional)</label>
                    <textarea
                      id="ai-notes-input"
                      rows={3}
                      value={aiNotes}
                      onChange={(e) => setAiNotes(e.target.value)}
                      placeholder="Misal: Kurang panjang di mad thabi'i ayat 2, qalqalah kufuwan kurang mantap..."
                      className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    id="run-ai-btn"
                    type="button"
                    disabled={aiLoading}
                    onClick={runAiAnalysis}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analisis Tajwid dengan Gemini AI</span>
                      </>
                    )}
                  </button>

                  {aiResult && (
                    <button
                      id="apply-ai-btn"
                      type="button"
                      onClick={applyAiScores}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs"
                    >
                      Terapkan Hasil AI ke Form
                    </button>
                  )}
                </div>

                {/* AI response card */}
                {aiResult && (
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-950 text-xs space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <span className="font-extrabold text-emerald-800">Hasil Analisis Tajwid AI:</span>
                      <span className="font-black text-amber-600">Skor Terhitung: {aiResult.scores?.nilai}% ({aiResult.status})</span>
                    </div>
                    <div className="prose prose-sm max-h-48 overflow-y-auto leading-relaxed dark:text-gray-300">
                      <p className="whitespace-pre-line">{aiResult.analysis}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rubrik Penilaian Inputs */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Rubrik Penilaian Skor (0 - 100)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl border">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Kelancaran</label>
                  <input
                    id="rubrik-kelancaran"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.kelancaran}
                    onChange={(e) => handleScoreChange("kelancaran", Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-center font-bold"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl border">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tajwid</label>
                  <input
                    id="rubrik-tajwid"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.tajwid}
                    onChange={(e) => handleScoreChange("tajwid", Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-center font-bold"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl border">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Makhraj</label>
                  <input
                    id="rubrik-makhraj"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.makhraj}
                    onChange={(e) => handleScoreChange("makhraj", Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-center font-bold"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl border">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Irama/Lagu</label>
                  <input
                    id="rubrik-irama"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.irama}
                    onChange={(e) => handleScoreChange("irama", Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-center font-bold"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-850 p-3 rounded-2xl border">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Adab/Sikap</label>
                  <input
                    id="rubrik-adab"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.adab}
                    onChange={(e) => handleScoreChange("adab", Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-sm text-center font-bold"
                  />
                </div>
              </div>

              {/* Dynamic grades presentation bar */}
              <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl flex items-center justify-between border border-gray-150">
                <div>
                  <p className="text-xs text-gray-500">Nilai Rata-rata Terhitung</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{calculatedAverage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Rekomendasi Status Kelulusan</p>
                  <span className={`inline-block mt-1 px-3 py-1 font-bold text-xs rounded-lg ${
                    calculatedStatus === 'Lulus' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : calculatedStatus === 'Mengulang'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                  }`}>
                    {calculatedStatus}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan Penilaian Tambahan (Feedback Guru)</label>
              <textarea
                id="setoran-form-catatan"
                rows={2}
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Tulis ulasan kesalahan pelafalan, nasehat murajaah untuk orang tua, atau apresiasi..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-850">
              <button
                id="cancel-setoran-submit"
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
              >
                Batal
              </button>
              <button
                id="save-setoran-submit"
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10"
              >
                Simpan Setoran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Setoran Logs Table list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Simple filters header */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-850/20 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-84">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="setoran-search-input"
              type="text"
              placeholder="Cari nama santri, surah, atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border rounded-xl text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Filter Kelas:</span>
            <select
              id="setoran-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-gray-900 border rounded-lg text-xs"
            >
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-850/30 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Siswa / Kelas</th>
                <th className="px-6 py-4">Surat / Ayat</th>
                <th className="px-6 py-4">Nilai Akhir / Status</th>
                <th className="px-6 py-4">Ulasan Feedback Guru</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
              {filteredSetoran.length > 0 ? (
                filteredSetoran.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-850/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-500 whitespace-nowrap">{log.tanggal}</td>
                    <td className="px-6 py-4">
                      <p className="font-extrabold text-gray-900 dark:text-white">{getStudentName(log.nis)}</p>
                      <p className="text-[10px] text-gray-450 mt-0.5">NIS: {log.nis} • Kelas {getStudentClass(log.nis)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">QS. {getSurahName(log.surat)}</p>
                      <p className="text-[10px] text-gray-450 mt-0.5">Ayat {log.ayat_awal} s/d {log.ayat_akhir}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 font-bold rounded-lg ${
                        log.status === 'Lulus' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : log.status === 'Mengulang'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
                      }`}>
                        {log.status} (N: {log.nilai})
                      </span>
                      <div className="flex items-center space-x-2 mt-1 text-[9px] text-gray-400">
                        <span>K:{log.kelancaran}</span>
                        <span>T:{log.tajwid}</span>
                        <span>M:{log.makhraj}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-gray-750 dark:text-gray-300 truncate font-medium" title={log.catatan}>{log.catatan || "-"}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Penerima: {log.guru}</p>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        id={`delete-setoran-btn-${log.id}`}
                        onClick={() => handleDeleteSetoran(log.id)}
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Belum ada riwayat setoran. Daftarkan setoran hafalan pertama di atas!
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
