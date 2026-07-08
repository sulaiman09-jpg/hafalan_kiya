/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Award, 
  Plus, 
  Printer, 
  Download, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  School, 
  Calendar,
  Layers,
  GraduationCap
} from "lucide-react";
import { apiService } from "../services/api";
import { Sertifikat, Siswa } from "../types";

export default function SertifikatView() {
  const [sertifikatList, setSertifikatList] = useState<Sertifikat[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  // Form states for new certification / exam
  const [nis, setNis] = useState("");
  const [jenisCert, setJenisCert] = useState<"Wisuda Juz 30" | "Kenaikan Juz" | "Setengah Juz 30">("Wisuda Juz 30");

  // Selected certificate for viewing / printing
  const [viewingCert, setViewingCert] = useState<Sertifikat | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [certs, siswa] = await Promise.all([
        apiService.getSertifikat(),
        apiService.getSiswa()
      ]);
      setSertifikatList(certs);
      setSiswaList(siswa);
      if (siswa.length > 0) {
        setNis(siswa[0].nis);
      }
    } catch (err) {
      console.error("Gagal mengambil data sertifikat:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis) return;

    try {
      setLoading(true);
      const newCert = await apiService.generateSertifikat(nis, jenisCert);
      setIsExamModalOpen(false);
      setViewingCert(newCert); // Auto open preview
      await fetchData();
    } catch (err: any) {
      alert("Gagal memproses sertifikat: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStudentName = (nis: string) => {
    return siswaList.find(s => s.nis === nis)?.nama || `Santri ${nis}`;
  };

  const getStudentClass = (nis: string) => {
    return siswaList.find(s => s.nis === nis)?.kelas || "-";
  };

  const getStudentOrangTua = (nis: string) => {
    return siswaList.find(s => s.nis === nis)?.orang_tua || "-";
  };

  if (loading && sertifikatList.length === 0) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-850 rounded-xl w-1/4" />
        <div className="h-96 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Print View Styling Overlay (Hidden on screen, shown on print!) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate-container, #printable-certificate-container * {
            visibility: visible;
          }
          #printable-certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 297mm;
            height: 210mm;
            background: white !important;
            color: black !important;
            border: 15px double #065f46 !important;
            padding: 20px !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Kelulusan & Sertifikat</h2>
          <p className="text-sm text-gray-500">Ujian kenaikan tingkat juz dan cetak sertifikat kelulusan syahadah Juz Amma santri secara otomatis.</p>
        </div>
        <button
          id="uji-kenaikan-btn"
          onClick={() => setIsExamModalOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-5 h-5" />
          <span>Daftarkan Kelulusan Ujian</span>
        </button>
      </div>

      {/* Grid: Certificate list on left, Beautiful Preview Certificate on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate list table */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-gray-800 dark:text-white flex items-center">
            <Layers className="w-4.5 h-4.5 mr-2 text-emerald-600" /> Daftar Sertifikat Diterbitkan
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {sertifikatList.map((cert) => (
              <div
                id={`cert-item-${cert.id}`}
                key={cert.id}
                onClick={() => setViewingCert(cert)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between hover:scale-[1.01] ${
                  viewingCert?.id === cert.id
                    ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800"
                    : "bg-gray-50 dark:bg-gray-850/40 border-gray-100 dark:border-gray-800"
                }`}
              >
                <div className="space-y-1 truncate">
                  <p className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{getStudentName(cert.nis)}</p>
                  <p className="text-[10px] text-gray-450">{cert.jenis} • Kelas {getStudentClass(cert.nis)}</p>
                  <p className="text-[9px] text-gray-400 font-mono">{cert.id}</p>
                </div>
                <Award className={`w-6 h-6 shrink-0 ${viewingCert?.id === cert.id ? 'text-emerald-600' : 'text-gray-300'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Certificate interactive previewer */}
        <div className="lg:col-span-2 space-y-4">
          {viewingCert ? (
            <div className="space-y-4">
              {/* Header preview controls */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-gray-500">Pratinjau Sertifikat Resmi</span>
                <div className="flex items-center space-x-2">
                  <button
                    id="print-certificate-btn"
                    onClick={handlePrint}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-emerald-600/10"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Fisik / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Certificate Actual canvas design */}
              <div 
                id="printable-certificate-container"
                className="bg-white text-gray-900 rounded-3xl p-8 shadow-xl border-8 border-emerald-800 dark:border-emerald-950/50 aspect-[1.414/1] flex flex-col justify-between relative overflow-hidden"
                style={{ backgroundImage: "radial-gradient(#F0FDF4 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              >
                {/* Decorative classical Islamic corner borders */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-emerald-800 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-emerald-800 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-emerald-800 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-emerald-800 rounded-br-lg" />

                {/* Header emblem & School info */}
                <div className="text-center space-y-1.5 pt-4">
                  <div className="inline-flex bg-emerald-50 p-2.5 rounded-full text-emerald-800 mb-1 border border-emerald-200">
                    <School className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-extrabold tracking-widest text-emerald-800 uppercase leading-none">SMP Islam Terpadu Qur'an Mulia</h4>
                  <p className="text-[9px] text-gray-500 leading-none">Jl. Kebahagiaan No. 12B, Jakarta Selatan — Akreditasi A</p>
                  <div className="w-32 h-0.5 bg-emerald-800 mx-auto mt-2" />
                </div>

                {/* Certificate main heading declaration */}
                <div className="text-center space-y-4 my-4">
                  <h3 className="text-2xl md:text-3xl font-black text-emerald-900 uppercase tracking-widest font-serif leading-none">Syahadah Juz Amma</h3>
                  <p className="text-xs font-semibold text-gray-500 leading-none">Diberikan secara terhormat kepada:</p>
                  
                  <div className="space-y-1.5">
                    <h2 className="text-2xl font-black text-emerald-800 underline tracking-tight">{getStudentName(viewingCert.nis)}</h2>
                    <p className="text-xs text-gray-500 font-bold">Siswa Kelas {getStudentClass(viewingCert.nis)} • NIS: {viewingCert.nis}</p>
                  </div>

                  <p className="text-xs text-gray-650 max-w-xl mx-auto leading-relaxed">
                    Telah diuji secara ketat, mutqin, dan dinyatakan lulus dengan hasil yang sangat memuaskan pada ujian kualifikasi hafalan surat-surat pendek Juz 30 (Juz Amma) mencakup **37 Surat** dari QS. An-Naba s/d QS. An-Nas harian.
                  </p>
                </div>

                {/* Footer Signatures, date & QR Code */}
                <div className="grid grid-cols-3 items-end text-center pt-4 pb-2 text-[10px]">
                  {/* Date and QR */}
                  <div className="text-left space-y-2 pl-4">
                    <p className="text-gray-500">Verifikasi Sertifikat:</p>
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                        <QrCode className="w-8 h-8 text-emerald-800" />
                      </div>
                      <span className="font-mono text-[8px] text-gray-400 break-all">{viewingCert.qrCode}</span>
                    </div>
                  </div>

                  {/* Certification status */}
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-800 font-bold tracking-wide uppercase text-[8px]">
                      {viewingCert.jenis}
                    </div>
                    <p className="text-gray-400 font-medium">Tanggal: {viewingCert.tanggal}</p>
                  </div>

                  {/* Principal Sign */}
                  <div className="space-y-6 pr-4">
                    <p className="text-gray-500 leading-none">Kepala Sekolah SMP IT,</p>
                    <div className="h-6 flex items-center justify-center font-serif text-emerald-700 italic font-extrabold text-xs">
                      Ust. Sulaiman, S.Pd.I
                    </div>
                    <p className="font-extrabold text-gray-900 border-t border-gray-300 pt-1 leading-none">Sulaiman, S.Pd.I</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-12 text-center text-gray-500 flex flex-col items-center justify-center h-96">
              <GraduationCap className="w-16 h-16 text-gray-300 mb-2 animate-bounce" />
              <p className="text-xs font-semibold">Belum Ada Sertifikat yang Dipilih</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm">Pilih sertifikat santri pada daftar di sebelah kiri, atau daftarkan kelulusan ujian santri baru untuk mencetak.</p>
            </div>
          )}
        </div>
      </div>

      {/* Exam Kenaikan Juz logging modal */}
      {isExamModalOpen && (
        <div id="exam-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="px-1 py-1 border-b pb-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                <Award className="w-5 h-5 mr-2 text-emerald-600" /> Daftarkan Wisuda / Syahadah
              </h3>
              <button 
                id="close-exam-modal"
                onClick={() => setIsExamModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleGenerateCertificate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pilih Siswa yang Lulus Ujian</label>
                <select
                  id="exam-form-siswa"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                >
                  {siswaList.map(s => (
                    <option key={s.nis} value={s.nis}>{s.nama} ({s.kelas})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori Kelulusan</label>
                <select
                  id="exam-form-jenis"
                  value={jenisCert}
                  onChange={(e) => setJenisCert(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-850/40 border border-gray-200 dark:border-gray-850 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                >
                  <option value="Wisuda Juz 30">Wisuda Juz 30 (Lengkap 37 Surat)</option>
                  <option value="Setengah Juz 30">Setengah Juz 30 (Surah An-Nas s/d Ad-Duha)</option>
                  <option value="Kenaikan Juz">Kenaikan Juz (Kualifikasi Syahadah)</option>
                </select>
              </div>

              <div className="pt-3 border-t flex items-center justify-end space-x-2">
                <button
                  id="cancel-exam-save"
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
                <button
                  id="save-exam-submit"
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/10 flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Terbitkan Syahadah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
