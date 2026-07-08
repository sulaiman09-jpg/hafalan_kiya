/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "Admin",
  GURU = "Guru",
  WALI_KELAS = "Wali Kelas",
  ORANG_TUA = "Orang Tua",
  SISWA = "Siswa"
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  nama: string;
  status: "Aktif" | "Nonaktif";
}

export interface Siswa {
  nis: string;
  nama: string;
  kelas: string;
  jk: "L" | "P";
  alamat: string;
  orang_tua: string;
  hp: string;
  foto?: string;
  guru_tahfidz?: string;
  wali_kelas?: string;
}

export interface Guru {
  id: string;
  nama: string;
  mapel: string;
  hp: string;
}

export interface Surat {
  nomor: number;
  arab: string;
  latin: string;
  arti: string;
  ayat: number;
  tingkatKesulitan: "Mudah" | "Sedang" | "Sulit";
  audio?: string;
  video?: string;
  tafsirRingkas?: string;
  semester: number;
}

export interface Setoran {
  id: string;
  tanggal: string;
  nis: string;
  guru: string;
  surat: number; // Nomor surat
  ayat_awal: number;
  ayat_akhir: number;
  kelancaran: number; // 0-100
  tajwid: number; // 0-100
  makhraj: number; // 0-100
  irama: number; // 0-100
  adab: number; // 0-100
  nilai: number; // Rata-rata terhitung
  status: "Lulus" | "Mengulang" | "Perlu Bimbingan";
  catatan: string;
}

export interface Murojaah {
  id: string;
  tanggal: string;
  nis: string;
  surat: number;
  nilai: number; // 0-100
  catatan: string;
  status?: "Lancar" | "Sedang" | "Perlu Diulang";
}

export interface TargetHafalan {
  kelas: string;
  semester: number;
  surat: number[]; // Array of surah numbers
}

export interface Jadwal {
  id?: string;
  hari: string;
  jam: string;
  kelas: string;
  guru: string;
  jenis: "Hafalan" | "Murojaah" | "Ujian";
}

export interface Sertifikat {
  id: string;
  nis: string;
  tanggal: string;
  jenis: "Wisuda Juz 30" | "Kenaikan Juz" | "Setengah Juz 30";
  link_pdf?: string;
  qrCode?: string;
}

export interface AppConfig {
  gasUrl: string;
  mode: "local" | "gas";
}
