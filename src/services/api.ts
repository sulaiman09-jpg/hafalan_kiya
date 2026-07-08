/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Siswa, Guru, Surat, Setoran, Murojaah, TargetHafalan, Jadwal, Sertifikat, AppConfig } from "../types";

const fetchJson = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const apiService = {
  // Auth
  login: async (username: string, password: string) => {
    return fetchJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Siswa
  getSiswa: async (): Promise<Siswa[]> => {
    return fetchJson("/api/siswa");
  },
  addSiswa: async (siswa: Siswa): Promise<Siswa> => {
    return fetchJson("/api/siswa", {
      method: "POST",
      body: JSON.stringify(siswa),
    });
  },
  updateSiswa: async (nis: string, siswa: Partial<Siswa>): Promise<Siswa> => {
    return fetchJson(`/api/siswa/${nis}`, {
      method: "PUT",
      body: JSON.stringify(siswa),
    });
  },
  deleteSiswa: async (nis: string): Promise<{ success: boolean }> => {
    return fetchJson(`/api/siswa/${nis}`, {
      method: "DELETE",
    });
  },

  // Guru
  getGuru: async (): Promise<Guru[]> => {
    return fetchJson("/api/guru");
  },
  addGuru: async (guru: Omit<Guru, "id">): Promise<Guru> => {
    return fetchJson("/api/guru", {
      method: "POST",
      body: JSON.stringify(guru),
    });
  },
  deleteGuru: async (id: string): Promise<{ success: boolean }> => {
    return fetchJson(`/api/guru/${id}`, {
      method: "DELETE",
    });
  },

  // Surat
  getSurat: async (): Promise<Surat[]> => {
    return fetchJson("/api/surat");
  },

  // Setoran
  getSetoran: async (): Promise<Setoran[]> => {
    return fetchJson("/api/setoran");
  },
  addSetoran: async (setoran: Omit<Setoran, "id" | "nilai" | "status">): Promise<Setoran> => {
    return fetchJson("/api/setoran", {
      method: "POST",
      body: JSON.stringify(setoran),
    });
  },
  deleteSetoran: async (id: string): Promise<{ success: boolean }> => {
    return fetchJson(`/api/setoran/${id}`, {
      method: "DELETE",
    });
  },

  // Murojaah
  getMurojaah: async (): Promise<Murojaah[]> => {
    return fetchJson("/api/murojaah");
  },
  addMurojaah: async (murojaah: Omit<Murojaah, "id" | "status">): Promise<Murojaah> => {
    return fetchJson("/api/murojaah", {
      method: "POST",
      body: JSON.stringify(murojaah),
    });
  },
  deleteMurojaah: async (id: string): Promise<{ success: boolean }> => {
    return fetchJson(`/api/murojaah/${id}`, {
      method: "DELETE",
    });
  },

  // Target
  getTargets: async (): Promise<TargetHafalan[]> => {
    return fetchJson("/api/target");
  },
  saveTarget: async (target: TargetHafalan): Promise<{ success: boolean }> => {
    return fetchJson("/api/target", {
      method: "POST",
      body: JSON.stringify(target),
    });
  },

  // Jadwal
  getJadwal: async (): Promise<Jadwal[]> => {
    return fetchJson("/api/jadwal");
  },
  addJadwal: async (jadwal: Omit<Jadwal, "id">): Promise<Jadwal> => {
    return fetchJson("/api/jadwal", {
      method: "POST",
      body: JSON.stringify(jadwal),
    });
  },
  deleteJadwal: async (id: string): Promise<{ success: boolean }> => {
    return fetchJson(`/api/jadwal/${id}`, {
      method: "DELETE",
    });
  },

  // Sertifikat
  getSertifikat: async (): Promise<Sertifikat[]> => {
    return fetchJson("/api/sertifikat");
  },
  generateSertifikat: async (nis: string, jenis: string): Promise<Sertifikat> => {
    return fetchJson("/api/sertifikat", {
      method: "POST",
      body: JSON.stringify({ nis, jenis }),
    });
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    return fetchJson("/api/dashboard/stats");
  },

  // Config Settings
  getConfig: async (): Promise<AppConfig> => {
    return fetchJson("/api/config");
  },
  saveConfig: async (config: AppConfig): Promise<AppConfig> => {
    return fetchJson("/api/config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  },
  testConfig: async (gasUrl: string): Promise<{ success: boolean; error?: string }> => {
    return fetchJson("/api/config/test", {
      method: "POST",
      body: JSON.stringify({ gasUrl }),
    });
  },

  // AI Assistant Analysis
  analyzeTajweed: async (payload: { transcript?: string; surat: number; notes?: string }) => {
    return fetchJson("/api/ai/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
};
