/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

let currentDirname = process.cwd();
try {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  } else if (typeof __dirname !== "undefined") {
    currentDirname = __dirname;
  }
} catch (e) {
  // safe fallback
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API:", error);
  }
} else {
  console.log("GEMINI_API_KEY not found. AI features will run in simulation mode.");
}

let DB_FILE = path.join(process.cwd(), "database.json");

// Default Seeding Data
const DEFAULT_SURAHS = [
  { nomor: 78, arab: "النبأ", latin: "An-Naba", arti: "Berita Besar", ayat: 40, tingkatKesulitan: "Sedang", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/078.mp3" },
  { nomor: 79, arab: "النازعات", latin: "An-Nazi'at", arti: "Malaikat yang Mencabut", ayat: 46, tingkatKesulitan: "Sedang", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/079.mp3" },
  { nomor: 80, arab: "عبس", latin: "‘Abasa", arti: "Ia Bermuka Masam", ayat: 42, tingkatKesulitan: "Sedang", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/080.mp3" },
  { nomor: 81, arab: "التكوير", latin: "At-Takwir", arti: "Menggulung", ayat: 29, tingkatKesulitan: "Sedang", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/081.mp3" },
  { nomor: 82, arab: "الانفطار", latin: "Al-Infitar", arti: "Terbelah", ayat: 19, tingkatKesulitan: "Mudah", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/082.mp3" },
  { nomor: 83, arab: "المطففين", latin: "Al-Mutaffifin", arti: "Orang-orang yang Curang", ayat: 36, tingkatKesulitan: "Sulit", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/083.mp3" },
  { nomor: 84, arab: "الانشقاق", latin: "Al-Inshiqaq", arti: "Terbelah", ayat: 25, tingkatKesulitan: "Sedang", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/084.mp3" },
  { nomor: 85, arab: "البروج", latin: "Al-Buruj", arti: "Gugusan Bintang", ayat: 22, tingkatKesulitan: "Sedang", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/085.mp3" },
  { nomor: 86, arab: "الطارق", latin: "At-Tariq", arti: "Yang Datang di Malam Hari", ayat: 17, tingkatKesulitan: "Mudah", semester: 1, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/086.mp3" },
  { nomor: 87, arab: "الأعلى", latin: "Al-A’la", arti: "Yang Maha Tinggi", ayat: 19, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/087.mp3" },
  { nomor: 88, arab: "الغاشية", latin: "Al-Ghashiyah", arti: "Hari Pembalasan", ayat: 26, tingkatKesulitan: "Sedang", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/088.mp3" },
  { nomor: 89, arab: "الفجر", latin: "Al-Fajr", arti: "Fajar", ayat: 30, tingkatKesulitan: "Sedang", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/089.mp3" },
  { nomor: 90, arab: "البلد", latin: "Al-Balad", arti: "Negeri", ayat: 20, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/090.mp3" },
  { nomor: 91, arab: "الشمس", latin: "Ash-Shams", arti: "Matahari", ayat: 15, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/091.mp3" },
  { nomor: 92, arab: "الليل", latin: "Al-Layl", arti: "Malam", ayat: 21, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/092.mp3" },
  { nomor: 93, arab: "الضحى", latin: "Ad-Duha", arti: "Waktu Duha", ayat: 11, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/093.mp3" },
  { nomor: 94, arab: "الشرح", latin: "Al-Inshirah", arti: "Kelapangan", ayat: 8, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/094.mp3" },
  { nomor: 95, arab: "التين", latin: "At-Tin", arti: "Buah Tin", ayat: 8, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/095.mp3" },
  { nomor: 96, arab: "العلق", latin: "Al-‘Alaq", arti: "Segumpal Darah", ayat: 19, tingkatKesulitan: "Sedang", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/096.mp3" },
  { nomor: 97, arab: "القدر", latin: "Al-Qadr", arti: "Kemuliaan", ayat: 5, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/097.mp3" },
  { nomor: 98, arab: "البينة", latin: "Al-Bayyinah", arti: "Bukti Nyata", ayat: 8, tingkatKesulitan: "Sedang", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/098.mp3" },
  { nomor: 99, arab: "الزلزلة", latin: "Az-Zalzalah", arti: "Kegoncangan", ayat: 8, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/099.mp3" },
  { nomor: 100, arab: "العاديات", latin: "Al-‘Adiyat", arti: "Kuda Perang yang Berlari Kencang", ayat: 11, tingkatKesulitan: "Sedang", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/100.mp3" },
  { nomor: 101, arab: "القارعة", latin: "Al-Qari'ah", arti: "Hari Kiamat", ayat: 11, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/101.mp3" },
  { nomor: 102, arab: "التكاثر", latin: "At-Takathur", arti: "Bermegah-megahan", ayat: 8, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/102.mp3" },
  { nomor: 103, arab: "العصر", latin: "Al-‘Asr", arti: "Demi Masa", ayat: 3, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/103.mp3" },
  { nomor: 104, arab: "الهمزة", latin: "Al-Humazah", arti: "Pengumpat", ayat: 9, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/104.mp3" },
  { nomor: 105, arab: "الفيل", latin: "Al-Fil", arti: "Gajah", ayat: 5, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/105.mp3" },
  { nomor: 106, arab: "قريش", latin: "Quraish", arti: "Suku Quraisy", ayat: 4, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/106.mp3" },
  { nomor: 107, arab: "الماعون", latin: "Al-Ma'un", arti: "Barang yang Berguna", ayat: 7, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/107.mp3" },
  { nomor: 108, arab: "الكوثر", latin: "Al-Kautsar", arti: "Nikmat yang Banyak", ayat: 3, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/108.mp3" },
  { nomor: 109, arab: "الكافرون", latin: "Al-Kafirun", arti: "Orang-orang Kafir", ayat: 6, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/109.mp3" },
  { nomor: 110, arab: "النصر", latin: "An-Nasr", arti: "Pertolongan", ayat: 3, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/110.mp3" },
  { nomor: 111, arab: "المسد", latin: "Al-Lahab", arti: "Gejolak Api / Sabut", ayat: 5, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/111.mp3" },
  { nomor: 112, arab: "الإخلاص", latin: "Al-Ikhlas", arti: "Kemurnian Keesaan Allah", ayat: 4, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/112.mp3" },
  { nomor: 113, arab: "الفلق", latin: "Al-Falaq", arti: "Waktu Subuh", ayat: 5, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/113.mp3" },
  { nomor: 114, arab: "الناس", latin: "An-Nas", arti: "Manusia", ayat: 6, tingkatKesulitan: "Mudah", semester: 2, audio: "https://download.quranicaudio.com/quran/mishaari_raashid_al_afasy/114.mp3" },
];

const DEFAULT_USERS = [
  { id: "U1", username: "admin", password: "123", role: "Admin", nama: "Sulaiman, S.Pd.I", status: "Aktif" },
  { id: "U2", username: "maisyaroh", password: "123", role: "Guru", nama: "Ustazah Maisyaroh", status: "Aktif" },
  { id: "U3", username: "aisyah", password: "123", role: "Guru", nama: "Ustazah Aisyah, S.Th.I", status: "Aktif" },
  { id: "U4", username: "budi", password: "123", role: "Wali Kelas", nama: "Budi Santoso, M.Pd", status: "Aktif" },
  { id: "U5", username: "kiya", password: "123", role: "Siswa", nama: "Kiya", status: "Aktif" },
  { id: "U6", username: "ortu_kiya", password: "123", role: "Orang Tua", nama: "Rahadini (Orang Tua Kiya)", status: "Aktif" },
];

const DEFAULT_SISWA = [
  { nis: "1001", nama: "Kiya", kelas: "7A", jk: "P", alamat: "Jl. Masjid Al-Barokah No. 12, Jakarta", orang_tua: "Rahadini", hp: "081234567890", foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", guru_tahfidz: "Ustazah Maisyaroh", wali_kelas: "Budi Santoso, M.Pd" },
  { nis: "1002", nama: "Siti Fatimah", kelas: "7A", jk: "P", alamat: "Jl. Pesantren No. 5, Bogor", orang_tua: "Ahmad Subarjo", hp: "081398765432", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", guru_tahfidz: "Ustazah Aisyah, S.Th.I", wali_kelas: "Budi Santoso, M.Pd" },
  { nis: "1003", nama: "Muhammad Fatih", kelas: "7B", jk: "L", alamat: "Perum Permata Indah B-9, Depok", orang_tua: "Imran Hakim", hp: "085612345678", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", guru_tahfidz: "Ustazah Maisyaroh", wali_kelas: "Sri Wahyuni, S.Pd" },
  { nis: "1004", nama: "Zahra Amira", kelas: "7B", jk: "P", alamat: "Komp. Gading Elok No. 4, Bekasi", orang_tua: "Irwan Setiawan", hp: "089988776655", foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80", guru_tahfidz: "Ustazah Aisyah, S.Th.I", wali_kelas: "Sri Wahyuni, S.Pd" },
  { nis: "1005", nama: "Ali Zainal Abidin", kelas: "7A", jk: "L", alamat: "Jl. Cendrawasih IV/12, Tangerang", orang_tua: "Muhammad Husein", hp: "081288772211", foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", guru_tahfidz: "Ustazah Maisyaroh", wali_kelas: "Budi Santoso, M.Pd" },
];

const DEFAULT_GURU = [
  { id: "G1", nama: "Ustazah Maisyaroh", mapel: "Tahfidz Al-Qur'an", hp: "081122334455" },
  { id: "G2", nama: "Ustazah Aisyah, S.Th.I", mapel: "Tahfidz & Tajwid", hp: "081155443322" },
  { id: "G3", nama: "Budi Santoso, M.Pd", mapel: "Matematika", hp: "081299887766" },
];

const DEFAULT_SETORAN = [
  { id: "S1", tanggal: "2026-07-01", nis: "1001", guru: "Ustazah Maisyaroh", surat: 114, ayat_awal: 1, ayat_akhir: 6, kelancaran: 95, tajwid: 90, makhraj: 92, irama: 85, adab: 95, nilai: 91, status: "Lulus", catatan: "Sangat baik, dengung pada ghunnah sudah stabil." },
  { id: "S2", tanggal: "2026-07-02", nis: "1001", guru: "Ustazah Maisyaroh", surat: 113, ayat_awal: 1, ayat_akhir: 5, kelancaran: 88, tajwid: 85, makhraj: 85, irama: 80, adab: 90, nilai: 86, status: "Lulus", catatan: "Perhatikan makhraj huruf qaf di akhir ayat (qalqalah kubra)." },
  { id: "S3", tanggal: "2026-07-03", nis: "1001", guru: "Ustazah Maisyaroh", surat: 112, ayat_awal: 1, ayat_akhir: 4, kelancaran: 92, tajwid: 90, makhraj: 90, irama: 82, adab: 95, nilai: 90, status: "Lulus", catatan: "Lancar sekali. Alhamdulillah." },
  { id: "S4", tanggal: "2026-07-04", nis: "1002", guru: "Ustazah Aisyah, S.Th.I", surat: 114, ayat_awal: 1, ayat_akhir: 6, kelancaran: 70, tajwid: 75, makhraj: 72, irama: 70, adab: 85, nilai: 74, status: "Mengulang", catatan: "Masih tertukar makhraj sin dan syin. Diulang lagi besok." },
  { id: "S5", tanggal: "2026-07-05", nis: "1002", guru: "Ustazah Aisyah, S.Th.I", surat: 114, ayat_awal: 1, ayat_akhir: 6, kelancaran: 85, tajwid: 80, makhraj: 82, irama: 75, adab: 90, nilai: 82, status: "Lulus", catatan: "Ada peningkatan, pelafalan syin sudah membaik." },
  { id: "S6", tanggal: "2026-07-06", nis: "1003", guru: "Ustazah Maisyaroh", surat: 109, ayat_awal: 1, ayat_akhir: 6, kelancaran: 60, tajwid: 65, makhraj: 62, irama: 70, adab: 80, nilai: 67, status: "Perlu Bimbingan", catatan: "Ayat 2-4 sering terbolak-balik ujung ayatnya. Perlu pendampingan khusus." },
];

const DEFAULT_MUROJAAH = [
  { id: "M1", tanggal: "2026-07-01", nis: "1001", surat: 114, nilai: 95, catatan: "Lancar dan merdu", status: "Lancar" },
  { id: "M2", tanggal: "2026-07-03", nis: "1001", surat: 113, nilai: 88, catatan: "Qalqalah kubra perlu ditekankan", status: "Lancar" },
  { id: "M3", tanggal: "2026-07-05", nis: "1002", surat: 114, nilai: 82, catatan: "Cukup baik, sudah lulus setoran", status: "Sedang" },
  { id: "M4", tanggal: "2026-06-25", nis: "1003", surat: 112, nilai: 75, catatan: "Perlu diulang bagian tajwidnya", status: "Perlu Diulang" }, // Lebih dari 7 hari lalu
];

const DEFAULT_TARGETS = [
  { kelas: "7A", semester: 1, surat: [114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100] },
  { kelas: "7A", semester: 2, surat: [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87] },
  { kelas: "7B", semester: 1, surat: [114, 113, 112, 111, 110, 109, 108, 107, 106, 105] },
];

const DEFAULT_JADWAL = [
  { id: "J1", hari: "Senin", jam: "07:30 - 09:00", kelas: "7A", guru: "Ustazah Maisyaroh", jenis: "Hafalan" },
  { id: "J2", hari: "Selasa", jam: "07:30 - 09:00", kelas: "7A", guru: "Ustazah Maisyaroh", jenis: "Murojaah" },
  { id: "J3", hari: "Rabu", jam: "07:30 - 09:00", kelas: "7B", guru: "Ustazah Aisyah, S.Th.I", jenis: "Hafalan" },
  { id: "J4", hari: "Kamis", jam: "07:30 - 09:00", kelas: "7B", guru: "Ustazah Aisyah, S.Th.I", jenis: "Murojaah" },
  { id: "J5", hari: "Jumat", jam: "07:30 - 09:00", kelas: "7A", guru: "Ustazah Maisyaroh", jenis: "Ujian" },
];

const DEFAULT_SERTIFIKAT = [
  { id: "CERT-001", nis: "1001", tanggal: "2026-07-05", jenis: "Wisuda Juz 30", link_pdf: "#", qrCode: "CERT-001-VERIFIED" }
];

let database = {
  users: DEFAULT_USERS,
  siswa: DEFAULT_SISWA,
  guru: DEFAULT_GURU,
  surat: DEFAULT_SURAHS,
  setoran: DEFAULT_SETORAN,
  murojaah: DEFAULT_MUROJAAH,
  target: DEFAULT_TARGETS,
  jadwal: DEFAULT_JADWAL,
  sertifikat: DEFAULT_SERTIFIKAT,
  config: {
    gasUrl: "",
    mode: "local"
  }
};

// Database Persistence helpers
async function loadDB() {
  const pathsToTry = [
    path.join(process.cwd(), "database.json"),
    path.join(currentDirname, "database.json"),
    path.join(currentDirname, "..", "database.json"),
    path.join(process.cwd(), "api", "database.json"),
  ];

  let loadedData = null;
  let foundPath = DB_FILE;

  for (const p of pathsToTry) {
    try {
      const data = await fs.readFile(p, "utf-8");
      loadedData = JSON.parse(data);
      foundPath = p;
      console.log(`Database loaded successfully from path: ${p}`);
      break;
    } catch (e) {
      // ignore and try next path
    }
  }

  if (loadedData) {
    database = loadedData;
    DB_FILE = foundPath;
    // Ensure surat matches default just in case
    if (!database.surat || database.surat.length === 0) {
      database.surat = DEFAULT_SURAHS;
    }
  } else {
    console.log("No database file found. Seeding default data and writing to default path database.json...");
    await saveDB();
  }

  // Override config from environment variables if present (useful for serverless environments like Vercel)
  if (process.env.GAS_URL) {
    if (!database.config) {
      database.config = { gasUrl: "", mode: "local" };
    }
    database.config.gasUrl = process.env.GAS_URL;
    database.config.mode = process.env.DATABASE_MODE === "local" ? "local" : "gas";
    console.log("Database config overridden by environment variables:", database.config);
  } else if (process.env.DATABASE_MODE) {
    if (!database.config) {
      database.config = { gasUrl: "", mode: "local" };
    }
    database.config.mode = process.env.DATABASE_MODE === "gas" ? "gas" : "local";
    console.log("Database mode set by environment variable:", database.config.mode);
  }
}

async function saveDB() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(database, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database to file:", error);
  }
}

// Google Apps Script Web App Integration Helpers
async function fetchFromGAS(action: string): Promise<any> {
  if (database.config?.mode !== "gas" || !database.config?.gasUrl) return null;
  try {
    const url = `${database.config.gasUrl}?action=${action}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json: any = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (error) {
    console.error(`Gagal mengambil data ${action} dari Google Sheets (GAS):`, error);
  }
  return null;
}

async function postToGAS(action: string, data: any): Promise<boolean> {
  if (database.config?.mode !== "gas" || !database.config?.gasUrl) return false;
  try {
    const response = await fetch(database.config.gasUrl, {
      method: "POST",
      body: JSON.stringify({ action, data }),
      headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json: any = await response.json();
    return !!json.success;
  } catch (error) {
    console.error(`Gagal mengirim data ${action} ke Google Sheets (GAS):`, error);
    return false;
  }
}

// Load database initially
loadDB();

// API Endpoints
// Auth Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan Password wajib diisi!" });
  }

  const user = database.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Username atau Password salah!" });
  }

  if (user.status !== "Aktif") {
    return res.status(403).json({ error: "Akun Anda dinonaktifkan!" });
  }

  // Find related profile if Student or Parent
  let relation = null;
  if (user.role === "Siswa") {
    relation = database.siswa.find(s => s.nama.toLowerCase() === user.nama.toLowerCase());
  } else if (user.role === "Orang Tua") {
    // Ortu match by child
    const childName = user.nama.match(/\(([^)]+)\)/)?.[1] || user.nama.replace("Orang Tua", "").trim();
    relation = database.siswa.find(s => s.nama.toLowerCase().includes(childName.toLowerCase()));
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      status: user.status
    },
    relation
  });
});

// Siswa CRUD
app.get("/api/siswa", async (req, res) => {
  const gasData = await fetchFromGAS("getSiswa");
  if (gasData) {
    database.siswa = gasData;
    await saveDB();
  }
  res.json(database.siswa);
});

app.post("/api/siswa", async (req, res) => {
  const newSiswa = req.body;
  if (!newSiswa.nis || !newSiswa.nama || !newSiswa.kelas) {
    return res.status(400).json({ error: "NIS, Nama, dan Kelas wajib diisi!" });
  }

  if (database.siswa.some(s => s.nis === newSiswa.nis)) {
    return res.status(400).json({ error: "Siswa dengan NIS tersebut sudah ada!" });
  }

  database.siswa.push(newSiswa);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addSiswa", newSiswa);
  }

  res.status(201).json(newSiswa);
});

app.put("/api/siswa/:nis", async (req, res) => {
  const { nis } = req.params;
  const index = database.siswa.findIndex(s => s.nis === nis);
  if (index === -1) {
    return res.status(404).json({ error: "Siswa tidak ditemukan!" });
  }

  database.siswa[index] = { ...database.siswa[index], ...req.body, nis };
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("updateSiswa", database.siswa[index]);
  }

  res.json(database.siswa[index]);
});

app.delete("/api/siswa/:nis", async (req, res) => {
  const { nis } = req.params;
  const filtered = database.siswa.filter(s => s.nis !== nis);
  if (filtered.length === database.siswa.length) {
    return res.status(404).json({ error: "Siswa tidak ditemukan!" });
  }

  database.siswa = filtered;
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("deleteRow", { sheetName: "Siswa", key: "nis", value: nis });
  }

  res.json({ success: true, message: "Siswa berhasil dihapus." });
});

// Guru CRUD/GET
app.get("/api/guru", async (req, res) => {
  const gasData = await fetchFromGAS("getGuru");
  if (gasData) {
    database.guru = gasData;
    await saveDB();
  }
  res.json(database.guru);
});

app.post("/api/guru", async (req, res) => {
  const newGuru = req.body;
  newGuru.id = "G" + (database.guru.length + 1);
  database.guru.push(newGuru);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addGuru", newGuru);
  }

  res.status(201).json(newGuru);
});

app.delete("/api/guru/:id", async (req, res) => {
  const { id } = req.params;
  database.guru = database.guru.filter(g => g.id !== id);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("deleteRow", { sheetName: "Guru", key: "id", value: id });
  }

  res.json({ success: true });
});

// Master Surat List
app.get("/api/surat", async (req, res) => {
  const gasData = await fetchFromGAS("getSurat");
  if (gasData) {
    database.surat = gasData.map((item: any) => ({
      ...item,
      nomor: Number(item.nomor),
      ayat: Number(item.ayat),
      semester: Number(item.semester)
    }));
    await saveDB();
  }
  res.json(database.surat);
});

// Setoran Hafalan CRUD
app.get("/api/setoran", async (req, res) => {
  const gasData = await fetchFromGAS("getSetoran");
  if (gasData) {
    database.setoran = gasData.map((item: any) => ({
      ...item,
      surat: Number(item.surat),
      ayat_awal: Number(item.ayat_awal),
      ayat_akhir: Number(item.ayat_akhir),
      kelancaran: Number(item.kelancaran),
      tajwid: Number(item.tajwid),
      makhraj: Number(item.makhraj),
      irama: Number(item.irama),
      adab: Number(item.adab),
      nilai: Number(item.nilai)
    }));
    await saveDB();
  }
  res.json(database.setoran);
});

app.post("/api/setoran", async (req, res) => {
  const { nis, guru, surat, ayat_awal, ayat_akhir, kelancaran, tajwid, makhraj, irama, adab, catatan, tanggal } = req.body;

  if (!nis || !guru || !surat || ayat_awal === undefined || ayat_akhir === undefined) {
    return res.status(400).json({ error: "Siswa, Guru, Surat, Ayat Awal, dan Ayat Akhir wajib diisi!" });
  }

  // Auto calculate average
  const k = Number(kelancaran) || 0;
  const t = Number(tajwid) || 0;
  const m = Number(makhraj) || 0;
  const i = Number(irama) || 0;
  const a = Number(adab) || 0;
  const rawAverage = (k + t + m + i + a) / 5;
  const nilai = Math.round(rawAverage);

  // Status mapping
  let status: "Lulus" | "Mengulang" | "Perlu Bimbingan" = "Lulus";
  if (nilai < 70) {
    status = "Perlu Bimbingan";
  } else if (nilai < 80) {
    status = "Mengulang";
  }

  const newSetoran = {
    id: "S" + Date.now().toString(36),
    tanggal: tanggal || new Date().toISOString().split("T")[0],
    nis,
    guru,
    surat: Number(surat),
    ayat_awal: Number(ayat_awal),
    ayat_akhir: Number(ayat_akhir),
    kelancaran: k,
    tajwid: t,
    makhraj: m,
    irama: i,
    adab: a,
    nilai,
    status,
    catatan: catatan || ""
  };

  database.setoran.push(newSetoran);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addSetoran", newSetoran);
  }

  res.status(201).json(newSetoran);
});

app.delete("/api/setoran/:id", async (req, res) => {
  const { id } = req.params;
  database.setoran = database.setoran.filter(s => s.id !== id);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("deleteRow", { sheetName: "Setoran", key: "id", value: id });
  }

  res.json({ success: true });
});

// Murojaah CRUD
app.get("/api/murojaah", async (req, res) => {
  const gasData = await fetchFromGAS("getMurojaah");
  if (gasData) {
    database.murojaah = gasData.map((item: any) => ({
      ...item,
      surat: Number(item.surat),
      nilai: Number(item.nilai)
    }));
    await saveDB();
  }
  res.json(database.murojaah);
});

app.post("/api/murojaah", async (req, res) => {
  const { nis, surat, nilai, catatan, tanggal } = req.body;
  if (!nis || !surat || nilai === undefined) {
    return res.status(400).json({ error: "NIS, Surat, dan Nilai wajib diisi!" });
  }

  const n = Number(nilai);
  let status: "Lancar" | "Sedang" | "Perlu Diulang" = "Lancar";
  if (n < 70) {
    status = "Perlu Diulang";
  } else if (n < 85) {
    status = "Sedang";
  }

  const newMurojaah = {
    id: "M" + Date.now().toString(36),
    tanggal: tanggal || new Date().toISOString().split("T")[0],
    nis,
    surat: Number(surat),
    nilai: n,
    catatan: catatan || "",
    status
  };

  database.murojaah.push(newMurojaah);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addMurojaah", newMurojaah);
  }

  res.status(201).json(newMurojaah);
});

app.delete("/api/murojaah/:id", async (req, res) => {
  const { id } = req.params;
  database.murojaah = database.murojaah.filter(m => m.id !== id);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("deleteRow", { sheetName: "Murojaah", key: "id", value: id });
  }

  res.json({ success: true });
});

// Targets API
app.get("/api/target", async (req, res) => {
  const gasData = await fetchFromGAS("getTarget");
  if (gasData) {
    database.target = gasData.map((item: any) => ({
      ...item,
      semester: Number(item.semester),
      surat: typeof item.surat === "string" 
        ? item.surat.split(",").map(Number).filter(Boolean) 
        : Array.isArray(item.surat) 
          ? item.surat.map(Number) 
          : []
    }));
    await saveDB();
  }
  res.json(database.target);
});

app.post("/api/target", async (req, res) => {
  const { kelas, semester, surat } = req.body;
  if (!kelas || !semester || !Array.isArray(surat)) {
    return res.status(400).json({ error: "Kelas, Semester, dan Daftar Surat wajib diisi!" });
  }

  const targetObj = { kelas, semester: Number(semester), surat: surat.map(Number) };
  const existingIndex = database.target.findIndex(t => t.kelas === kelas && t.semester === Number(semester));
  if (existingIndex !== -1) {
    database.target[existingIndex].surat = targetObj.surat;
  } else {
    database.target.push(targetObj);
  }

  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addTarget", targetObj);
  }

  res.json({ success: true });
});

// Jadwal API
app.get("/api/jadwal", async (req, res) => {
  const gasData = await fetchFromGAS("getJadwal");
  if (gasData) {
    database.jadwal = gasData;
    await saveDB();
  }
  res.json(database.jadwal);
});

app.post("/api/jadwal", async (req, res) => {
  const { hari, jam, kelas, guru, jenis } = req.body;
  const newJadwal = {
    id: "J" + Date.now().toString(36),
    hari,
    jam,
    kelas,
    guru,
    jenis
  };
  database.jadwal.push(newJadwal);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addJadwal", newJadwal);
  }

  res.status(201).json(newJadwal);
});

app.delete("/api/jadwal/:id", async (req, res) => {
  const { id } = req.params;
  database.jadwal = database.jadwal.filter(j => j.id !== id);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("deleteRow", { sheetName: "Jadwal", key: "id", value: id });
  }

  res.json({ success: true });
});

// Sertifikat API
app.get("/api/sertifikat", async (req, res) => {
  const gasData = await fetchFromGAS("getSertifikat");
  if (gasData) {
    database.sertifikat = gasData;
    await saveDB();
  }
  res.json(database.sertifikat);
});

app.post("/api/sertifikat", async (req, res) => {
  const { nis, jenis } = req.body;
  const student = database.siswa.find(s => s.nis === nis);
  if (!student) {
    return res.status(404).json({ error: "Siswa tidak ditemukan!" });
  }

  const id = "CERT-" + Date.now().toString(36).toUpperCase();
  const newCert = {
    id,
    nis,
    tanggal: new Date().toISOString().split("T")[0],
    jenis,
    link_pdf: "#",
    qrCode: `${id}-VERIFIED`
  };

  database.sertifikat.push(newCert);
  await saveDB();

  if (database.config?.mode === "gas") {
    await postToGAS("addSertifikat", newCert);
  }

  res.status(201).json(newCert);
});

// Dashboard Statistics endpoint
app.get("/api/dashboard/stats", (req, res) => {
  const totalSiswa = database.siswa.length;
  const totalSetoran = database.setoran.length;
  const setoranLulus = database.setoran.filter(s => s.status === "Lulus").length;

  // Nilai rata-rata seluruh setoran
  const sumNilai = database.setoran.reduce((acc, s) => acc + s.nilai, 0);
  const avgNilai = totalSetoran > 0 ? Math.round(sumNilai / totalSetoran) : 0;

  // Menghitung progress hafalan rata-rata (misal persentase surat Juz Amma selesai per siswa)
  // Juz Amma memiliki 37 surat (no 78 - 114)
  const totalSuratJuzAmma = 37;

  // Hitung jumlah surat lulus unik per siswa
  const progressSiswa = database.siswa.map(siswa => {
    const setoranSiswa = database.setoran.filter(s => s.nis === siswa.nis && s.status === "Lulus");
    const suratUnik = new Set(setoranSiswa.map(s => s.surat));
    const persen = Math.round((suratUnik.size / totalSuratJuzAmma) * 100);
    return {
      nis: siswa.nis,
      nama: siswa.nama,
      kelas: siswa.kelas,
      suratSelesai: suratUnik.size,
      persentase: Math.min(persen, 100)
    };
  });

  const rataRataPersentase = progressSiswa.length > 0
    ? Math.round(progressSiswa.reduce((acc, p) => acc + p.persentase, 0) / progressSiswa.length)
    : 0;

  // Ranking Kelas berdasarkan jumlah surat yang diselesaikan
  const ranking = [...progressSiswa].sort((a, b) => b.suratSelesai - a.suratSelesai);

  // Jadwal Setoran Hari ini (misal ambil jadwal acak/list)
  const jadwalHariIni = database.jadwal;

  res.json({
    totalSiswa,
    totalSetoran,
    setoranLulus,
    avgNilai,
    rataRataPersentase,
    ranking,
    progressSiswa,
    jadwalHariIni
  });
});

// Config API
app.get("/api/config", (req, res) => {
  res.json(database.config);
});

app.post("/api/config", async (req, res) => {
  const { gasUrl, mode } = req.body;
  database.config = {
    gasUrl: gasUrl || "",
    mode: mode === "gas" ? "gas" : "local"
  };
  await saveDB();
  res.json(database.config);
});

app.post("/api/config/test", async (req, res) => {
  const { gasUrl } = req.body;
  if (!gasUrl) {
    return res.status(400).json({ success: false, error: "URL Web App Google Apps Script wajib diisi!" });
  }

  try {
    const url = `${gasUrl}?action=getSiswa`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json: any = await response.json();
    return res.json(json);
  } catch (error: any) {
    console.error("Gagal menguji koneksi Google Sheets (GAS):", error);
    return res.status(500).json({ success: false, error: error.message || "Gagal menghubungi Google Apps Script" });
  }
});

// AI Analyze Tajweed & Recommendation powered by Gemini
app.post("/api/ai/analyze", async (req, res) => {
  const { transcript, surat, notes } = req.body;

  if (!surat) {
    return res.status(400).json({ error: "Surat harus ditentukan untuk analisis AI!" });
  }

  const selectedSurat = database.surat.find(s => s.nomor === Number(surat) || s.latin.toLowerCase() === String(surat).toLowerCase());
  const suratName = selectedSurat ? selectedSurat.latin : `Surat nomor ${surat}`;

  if (!ai) {
    // Simulated Gemini response if key is missing
    const k = Math.floor(Math.random() * 15) + 81; // 81-95
    const t = Math.floor(Math.random() * 15) + 81;
    const m = Math.floor(Math.random() * 15) + 81;
    const i = Math.floor(Math.random() * 15) + 80;
    const a = Math.floor(Math.random() * 10) + 90;
    const avg = Math.round((k + t + m + i + a) / 5);

    return res.json({
      analysis: `### **Hasil Analisis AI Tahfidz (Mode Simulasi)**\n\nAnalisis bacaan untuk **QS. ${suratName}** berdasarkan catatan guru/transkrip:\n\n1. **Tajwid & Mad**: Pelafalan hukum Mad Thabi'i dan ikhfa sudah sangat baik. Hanya saja, perhatikan ketukan ghunnah di ayat 3 agar disempurnakan selama 2 ketukan.\n2. **Makharijul Huruf**: Huruf Haa (ح) dan Kha (خ) sudah terdengar jelas bedanya. Pertahankan pengucapan huruf tebal (Tafkhim) seperti Qaf (ق).\n3. **Kelancaran**: Bacaan sangat mengalir tanpa keraguan besar. Bagus sekali!\n\n**Rekomendasi Murojaah**: Lakukan pengulangan surat ${suratName} sebanyak 3 kali sebelum beranjak ke target surat berikutnya.`,
      scores: { kelancaran: k, tajwid: t, makhraj: m, irama: i, adab: a, nilai: avg },
      status: avg >= 80 ? "Lulus" : "Mengulang"
    });
  }

  try {
    const prompt = `Anda adalah asisten AI Tahfidz profesional dan pakar Tajwid bersertifikat sanad untuk Juz Amma.
Analisislah bacaan siswa berikut ini untuk Surat ${suratName}.

Bahan Analisis:
- Transkrip bacaan siswa (jika ada): "${transcript || 'Tidak ada transkrip langsung'}"
- Catatan kesalahan dari guru (jika ada): "${notes || 'Lancar, mohon dianalisis secara umum'}"

Berikan penilaian objektif dalam Bahasa Indonesia. Format respons wajib berupa JSON terstruktur dengan kunci:
1. "analysis" (string markdown lengkap tentang ulasan tajwid, mad, kelancaran, makhraj, kesalahan, serta saran perbaikan pedagogis yang ramah).
2. "scores" (objek berisi kelancaran: number (0-100), tajwid: number (0-100), makhraj: number (0-100), irama: number (0-100), adab: number (0-100), nilai: number (rata-rata dari semuanya)).
3. "status" (string berupa "Lulus" jika nilai rata-rata >= 80, "Mengulang" jika 70-79, atau "Perlu Bimbingan" jika < 70).

Format keluaran harus JSON murni dan valid sesuai dengan instruksi.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("AI Analysis failed:", error);
    res.status(500).json({ error: "Gagal memproses analisis AI: " + error.message });
  }
});

// Serve Google Apps Script Source Code
app.get("/api/gas-source", (req, res) => {
  const sourceCode = `/**
 * Google Apps Script - REST API untuk Sistem Hafalan Juz Amma
 * Hubungkan spreadsheet Anda dengan frontend modern
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets baru.
 * 2. Buat sheet dengan nama berikut sesuai sheet:
 *    - "Users"
 *    - "Siswa"
 *    - "Guru"
 *    - "Surat"
 *    - "Setoran"
 *    - "Murojaah"
 *    - "Target"
 *    - "Jadwal"
 *    - "Sertifikat"
 * 3. Isi header masing-masing kolom sesuai dengan dokumentasi di README.
 * 4. Masuk ke Extensions > Apps Script.
 * 5. Paste kode di bawah ini, klik Save, lalu deploy sebagai Web App (Akses: "Anyone").
 * 6. Copy URL Web App yang dihasilkan ke menu Pengaturan di aplikasi frontend ini.
 */

const SPREADSHEET_ID = "ID_SPREADSHEET_ANDA"; // Biarkan kosong jika terikat langsung ke sheet

function getSheetByName(name) {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name);
}

function doGet(e) {
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
    } else {
      return respondError("Action not found");
    }
    
    return respondSuccess(data);
  } catch (err) {
    return respondError(err.toString());
  }
}

function doPost(e) {
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
      const user = users.find(u => u.username === postData.username && u.password === postData.password);
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
    }
    
    return respondError("Action not found");
  } catch (err) {
    return respondError(err.toString());
  }
}

// Helpers
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
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function appendRowToSheet(sheetName, dataObj) {
  const sheet = getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = [];
  for (let j = 0; j < headers.length; j++) {
    newRow.push(dataObj[headers[j]] || "");
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
}
`;
  res.setHeader("Content-Type", "text/plain");
  res.send(sourceCode);
});

// Error handling middleware to catch unhandled errors and return readable messages
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express Unhandled Error:", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
    stack: err.stack,
    path: req.path,
    method: req.method
  });
});

// Vite Integration inside server.ts (SPA fallback and asset serving)
if (process.env.NODE_ENV !== "production") {
  // ESM/Vite integration
  import("vite").then(async (viteModule) => {
    const vite = await viteModule.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development Server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Production Server running on port ${PORT}`);
    });
  }
}

export default app;

