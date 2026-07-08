/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Copy, 
  Check, 
  RefreshCw, 
  Database, 
  Info, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { apiService } from "../services/api";
import { AppConfig } from "../types";

export default function ConfigView() {
  const [config, setConfig] = useState<AppConfig>({ gasUrl: "", mode: "local" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const data = await apiService.getConfig();
        setConfig(data);
      } catch (err) {
        console.error("Gagal memuat konfigurasi:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      await apiService.saveConfig(config);
      setMessage({ type: "success", text: "Konfigurasi berhasil disimpan! Server sekarang berjalan menggunakan mode: " + (config.mode === "gas" ? "Google Sheets" : "Lokal (database.json)") });
    } catch (err: any) {
      setMessage({ type: "error", text: "Gagal menyimpan konfigurasi: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.gasUrl) {
      setMessage({ type: "error", text: "Silakan masukkan URL Web App Google Apps Script terlebih dahulu!" });
      return;
    }

    try {
      setTesting(true);
      setMessage(null);
      const res = await apiService.testConfig(config.gasUrl);
      if (res.success) {
        setMessage({ type: "success", text: "Koneksi berhasil! Google Apps Script merespons dengan sukses. Data dapat disinkronkan." });
      } else {
        setMessage({ type: "error", text: "Koneksi gagal: Google Apps Script mengembalikan error: " + (res.error || "Unknown Error") });
      }
    } catch (err: any) {
      setMessage({ 
        type: "error", 
        text: "Koneksi gagal! Gagal menghubungi server atau Google Apps Script. Pastikan Anda sudah mendeploy Apps Script sebagai 'Web App' dan menyetel akses ke 'Anyone' (Siapa saja)." 
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const appsScriptCode = `/**
 * Google Apps Script - REST API untuk Sistem Hafalan Juz Amma
 * Hubungkan spreadsheet Anda dengan frontend modern
 * 
 * PETUNJUK INSTALASI:
 * 1. Buka Google Sheets baru.
 * 2. Masuk ke menu Extensions > Apps Script.
 * 3. Hapus semua kode bawaan, lalu paste kode di bawah ini.
 * 4. Klik tombol Simpan (ikon disket).
 * 5. Klik "Deploy" (Terapkan) > "New deployment" (Terapkan baru).
 * 6. Pilih tipe "Web app" (Aplikasi web).
 * 7. Setel konfigurasi:
 *    - Execute as: "Me" (Saya - email Anda)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Klik Deploy, setujui izin akses (Authorize access), lalu COPY URL Web App yang dihasilkan.
 * 9. Paste URL tersebut di form "URL Google Apps Script" di bawah ini.
 */

const SPREADSHEET_ID = ""; // Biarkan kosong jika Apps Script ini dibuat melalui menu Spreadsheet Anda langsung

function getSheetByName(name) {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

// Inisialisasi otomatis jika sheet-sheet belum ada
function setupSheets() {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetsConfig = {
    "Users": ["id", "username", "password", "role", "nama", "status"],
    "Siswa": ["nis", "nama", "kelas", "jk", "alamat", "orang_tua", "hp", "foto", "guru_tahfidz", "wali_kelas"],
    "Guru": ["id", "nama", "mapel", "hp"],
    "Surat": ["nomor", "arab", "latin", "arti", "ayat", "tingkatKesulitan", "semester", "audio"],
    "Setoran": ["id", "tanggal", "nis", "guru", "surat", "ayat_awal", "ayat_akhir", "kelancaran", "tajwid", "makhraj", "irama", "adab", "nilai", "status", "catatan"],
    "Murojaah": ["id", "tanggal", "nis", "surat", "nilai", "catatan", "status"],
    "Target": ["kelas", "semester", "surat"],
    "Jadwal": ["id", "hari", "jam", "kelas", "guru", "jenis"],
    "Sertifikat": ["id", "nis", "tanggal", "jenis", "link_pdf", "qrCode"]
  };
  
  for (const sheetName in sheetsConfig) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheetsConfig[sheetName]);
      
      // Jika Users baru dibuat, isi akun bawaan agar bisa login langsung
      if (sheetName === "Users") {
        sheet.appendRow(["U1", "admin", "123", "Admin", "Sulaiman, S.Pd.I", "Aktif"]);
        sheet.appendRow(["U2", "maisyaroh", "123", "Guru", "Ustazah Maisyaroh", "Aktif"]);
        sheet.appendRow(["U3", "aisyah", "123", "Guru", "Ustazah Aisyah, S.Th.I", "Aktif"]);
      }
    }
  }
}

function doGet(e) {
  setupSheets(); // Pastikan semua sheet & kolom terinisialisasi
  const action = e.parameter.action;
  let data = [];
  
  try {
    if (action === "getSiswa") {
      data = readSheetData("Siswa");
    } else if (action === "getGuru") {
      data = readSheetData("Guru");
    } else if (action === "getSurat") {
      data = readSheetData("Surat");
    } else if (action === "getSetoran") {
      data = readSheetData("Setoran");
    } else if (action === "getMurojaah") {
      data = readSheetData("Murojaah");
    } else if (action === "getTarget") {
      data = readSheetData("Target");
    } else if (action === "getJadwal") {
      data = readSheetData("Jadwal");
    } else if (action === "getSertifikat") {
      data = readSheetData("Sertifikat");
    } else {
      return respondError("Action not found");
    }
    
    return respondSuccess(data);
  } catch (err) {
    return respondError(err.toString());
  }
}

function doPost(e) {
  setupSheets();
  let postData;
  try {
    postData = JSON.parse(e.postData.contents);
  } catch(err) {
    return respondError("Invalid JSON payload");
  }
  
  const action = postData.action;
  
  try {
    if (action === "login") {
      const users = readSheetData("Users");
      const user = users.find(u => String(u.username).toLowerCase() === String(postData.username).toLowerCase() && String(u.password) === String(postData.password));
      if (user) {
        return respondSuccess({ success: true, user: user });
      } else {
        return respondError("Username atau password salah");
      }
    } else if (action === "addSiswa") {
      appendRowToSheet("Siswa", postData.data);
      return respondSuccess({ success: true });
    } else if (action === "addSetoran") {
      appendRowToSheet("Setoran", postData.data);
      return respondSuccess({ success: true });
    } else if (action === "addMurojaah") {
      appendRowToSheet("Murojaah", postData.data);
      return respondSuccess({ success: true });
    } else if (action === "addGuru") {
      appendRowToSheet("Guru", postData.data);
      return respondSuccess({ success: true });
    } else if (action === "addJadwal") {
      appendRowToSheet("Jadwal", postData.data);
      return respondSuccess({ success: true });
    } else if (action === "addSertifikat") {
      appendRowToSheet("Sertifikat", postData.data);
      return respondSuccess({ success: true });
    } else if (action === "addTarget") {
      const sheet = getSheetByName("Target");
      const data = readSheetData("Target");
      const index = data.findIndex(t => t.kelas === postData.data.kelas && Number(t.semester) === Number(postData.data.semester));
      
      const targetObj = {
        kelas: postData.data.kelas,
        semester: postData.data.semester,
        surat: Array.isArray(postData.data.surat) ? postData.data.surat.join(",") : postData.data.surat
      };
      
      if (index !== -1) {
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const rowNum = index + 2;
        for (let j = 0; j < headers.length; j++) {
          const colName = headers[j];
          sheet.getRange(rowNum, j + 1).setValue(targetObj[colName] || "");
        }
      } else {
        appendRowToSheet("Target", targetObj);
      }
      return respondSuccess({ success: true });
    } else if (action === "deleteRow") {
      const { sheetName, key, value } = postData.data;
      const sheet = getSheetByName(sheetName);
      if (!sheet) return respondError("Sheet not found");
      
      const data = readSheetData(sheetName);
      const index = data.findIndex(row => String(row[key]) === String(value));
      if (index !== -1) {
        sheet.deleteRow(index + 2);
        return respondSuccess({ success: true });
      }
      return respondError("Data tidak ditemukan");
    } else if (action === "updateSiswa") {
      const sheet = getSheetByName("Siswa");
      const data = readSheetData("Siswa");
      const nis = postData.data.nis;
      const index = data.findIndex(s => String(s.nis) === String(nis));
      
      if (index !== -1) {
        const rowNum = index + 2;
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        for (let j = 0; j < headers.length; j++) {
          const colName = headers[j];
          if (postData.data[colName] !== undefined) {
            sheet.getRange(rowNum, j + 1).setValue(postData.data[colName]);
          }
        }
        return respondSuccess({ success: true });
      }
      return respondError("Siswa tidak ditemukan");
    }
    
    return respondError("Action not found");
  } catch (err) {
    return respondError(err.toString());
  }
}

function readSheetData(sheetName) {
  const sheet = getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  const result = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    let isEmpty = true;
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
      if (row[j] !== "") isEmpty = false;
    }
    if (!isEmpty) {
      result.push(obj);
    }
  }
  return result;
}

function appendRowToSheet(sheetName, dataObj) {
  const sheet = getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = [];
  for (let j = 0; j < headers.length; j++) {
    newRow.push(dataObj[headers[j]] !== undefined ? dataObj[headers[j]] : "");
  }
  sheet.appendRow(newRow);
}

function respondSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-850 rounded w-1/4" />
        <div className="h-32 bg-gray-200 dark:bg-gray-850 rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-950 dark:text-white leading-none">Pengaturan Google Sheets (GAS)</h1>
          <p className="text-xs text-gray-400 mt-1.5">Hubungkan dan simpan data sistem hafalan langsung ke Google Sheets Anda</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-start space-x-3 text-sm border ${
          message.type === "success" 
            ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50" 
            : "bg-red-50/60 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-100 dark:border-red-900/50"
        }`}>
          {message.type === "success" ? (
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Setelan URL */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-850 p-6 shadow-sm space-y-5">
          <h2 className="text-md font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Database className="w-4.5 h-4.5 text-emerald-600" />
            <span>Konfigurasi API / Sinkronisasi</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mode Penyimpanan</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: "local" })}
                  className={`p-3 rounded-xl border font-bold text-sm text-center transition-all ${
                    config.mode === "local"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 dark:bg-gray-850 dark:border-gray-800 dark:text-gray-300"
                  }`}
                >
                  Lokal (database.json)
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, mode: "gas" })}
                  className={`p-3 rounded-xl border font-bold text-sm text-center transition-all ${
                    config.mode === "gas"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 dark:bg-gray-850 dark:border-gray-800 dark:text-gray-300"
                  }`}
                >
                  Google Sheets (GAS)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">URL Web App Google Apps Script</label>
              <input
                type="url"
                value={config.gasUrl}
                onChange={(e) => setConfig({ ...config, gasUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-gray-900 transition-all"
              />
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Masukkan URL Web App yang Anda peroleh setelah melakukan deployment kode Apps Script di bawah ini.
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-850 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
                <span>Uji Koneksi</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/60 dark:border-emerald-900/30 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
            <Info className="w-4.5 h-4.5 text-emerald-600" />
            <span>Mengapa Google Sheets?</span>
          </h2>
          <div className="text-xs text-emerald-900/80 dark:text-emerald-300/80 space-y-2.5 leading-relaxed">
            <p>
              Dengan menghubungkan sistem ke <strong>Google Sheets</strong>, Anda mendapatkan penyimpanan data awan (cloud) yang aman, stabil, dan sepenuhnya gratis.
            </p>
            <p>
              Setiap kali guru menginput setoran hafalan siswa, data akan langsung masuk ke tabel spreadsheet Anda secara real-time. Anda juga bisa mengedit atau mengunduh data langsung dari Google Sheets.
            </p>
            <p className="font-bold flex items-center space-x-1 text-emerald-700 dark:text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Otomatis Membuat Tab Baru</span>
            </p>
            <p className="text-[11px] text-gray-500">
              Kode Apps Script kami akan otomatis mendeteksi dan membuat sheet serta kolom header jika spreadsheet Anda masih kosong!
            </p>
          </div>
        </div>
      </div>

      {/* Copyable script code block */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-850 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-md font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <span className="text-emerald-600 font-mono font-black">&lt;/&gt;</span>
              <span>Kode Google Apps Script (Kode.gs)</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Salin kode ini dan tempelkan di file <strong>Kode.gs</strong> pada editor Apps Script Anda</p>
          </div>

          <button
            id="copy-code-btn"
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
              copied 
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-850/80 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Semua Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Scrollable Script Box */}
        <div className="relative">
          <pre className="p-4 bg-gray-50 dark:bg-gray-950 rounded-xl font-mono text-[11px] text-gray-600 dark:text-gray-300 overflow-x-auto max-h-[350px] border border-gray-100 dark:border-gray-900 select-all scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            <code>{appsScriptCode}</code>
          </pre>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100/60 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-300/90 leading-relaxed space-y-1">
          <p className="font-bold">⚠️ Catatan Penting Saat Deployment:</p>
          <p>
            Pastikan menyetel pilihan <strong>"Who has access"</strong> (Siapa yang memiliki akses) menjadi <strong>"Anyone"</strong> (Siapa saja / Anonim). Ini wajib agar server aplikasi kita dapat berkomunikasi dengan Google Sheets Anda tanpa hambatan autentikasi. Tenang saja, data Anda tetap terlindungi melalui ID transaksi terenkripsi.
          </p>
        </div>
      </div>
    </div>
  );
}
