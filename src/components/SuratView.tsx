/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  Search, 
  BookOpen, 
  Video, 
  Layers, 
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Award,
  Loader2
} from "lucide-react";
import { apiService } from "../services/api";
import { Surat } from "../types";

export default function SuratView() {
  const [suratList, setSuratList] = useState<Surat[]>([]);
  const [filteredSurat, setFilteredSurat] = useState<Surat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSurat, setSelectedSurat] = useState<Surat | null>(null);

  // Audio Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playingSuratNo, setPlayingSuratNo] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackUrlRef = useRef<string | null>(null);

  // Sync state to ref to avoid stale closures in event listeners
  const stateRef = useRef({ isPlaying, isBuffering, usingFallback, playingSuratNo });
  useEffect(() => {
    stateRef.current = { isPlaying, isBuffering, usingFallback, playingSuratNo };
  }, [isPlaying, isBuffering, usingFallback, playingSuratNo]);

  useEffect(() => {
    fetchSurat();

    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setPlayingSuratNo(null);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
    };

    const handleError = (e: Event) => {
      console.warn("Audio element loading error triggered:", e);
      setIsBuffering(false);
      setIsPlaying(false);
      
      // If we have a fallback URL and haven't loaded fallback yet, try it!
      if (fallbackUrlRef.current && !stateRef.current.usingFallback) {
        const url = fallbackUrlRef.current;
        fallbackUrlRef.current = null; // Clear to prevent loops
        tryFallback(url);
      } else {
        setAudioError("Audio tidak dapat diputar. Silakan coba lagi.");
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    let result = suratList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.latin.toLowerCase().includes(q) || s.arab.includes(q) || s.nomor.toString() === q
      );
    }
    setFilteredSurat(result);
  }, [suratList, searchQuery]);

  const fetchSurat = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSurat();
      setSuratList(data);
      if (data.length > 0) {
        setSelectedSurat(data[0]); // Default selection
      }
    } catch (err) {
      console.error("Gagal mengambil data surat:", err);
    } finally {
      setLoading(false);
    }
  };

  const tryFallback = (url: string) => {
    if (!audioRef.current) return;
    setUsingFallback(true);
    setIsBuffering(true);
    setAudioError(null);
    console.log("Memutar dengan URL cadangan (Yasser Al-Dosari):", url);
    audioRef.current.src = url;
    audioRef.current.load();
    audioRef.current.play().catch((err) => {
      console.error("Sebab error di url cadangan:", err);
      setIsBuffering(false);
      setIsPlaying(false);
      setAudioError("Audio tidak dapat diputar. Silakan coba lagi.");
    });
  };

  const handlePlayAudio = (surat: Surat) => {
    setAudioError(null);
    if (!audioRef.current) return;

    // Use a high-performance public Quran audio Cloudflare CDN as primary source (Misyari Rasyid Al-Afasi)
    const primaryUrl = `https://cdn.equran.id/audio-full/Misyari-Rasyid-Al-Afasi/${String(surat.nomor).padStart(3, "0")}.mp3`;
    
    // Fallback to another beautiful and extremely fast Cloudflare CDN source (Yasser Al-Dosari)
    const fallbackUrl = `https://cdn.equran.id/audio-full/Yasser-Al-Dosari/${String(surat.nomor).padStart(3, "0")}.mp3`;

    if (playingSuratNo === surat.nomor) {
      // Toggle play/pause
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        audioRef.current.play().catch((err) => {
          console.error("Play error:", err);
          fallbackUrlRef.current = null;
          tryFallback(fallbackUrl);
        });
      }
    } else {
      // Load and play new audio
      audioRef.current.pause();
      setPlayingSuratNo(surat.nomor);
      setIsPlaying(true);
      setIsBuffering(true);
      setUsingFallback(false);
      
      fallbackUrlRef.current = fallbackUrl; // Save for handle_error
      
      audioRef.current.src = primaryUrl;
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        console.warn("Primary audio source play call failed, trying fallback...", err);
        fallbackUrlRef.current = null;
        tryFallback(fallbackUrl);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-850 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
          <div className="h-96 bg-gray-200 dark:bg-gray-850 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Katalog Surat Juz Amma</h2>
        <p className="text-sm text-gray-500">Daftar lengkap 37 surat pendek Juz 30 dilengkapi Murattal Audio, tafsir ringkas, dan target semester.</p>
      </div>

      {/* Global Mini Audio Player bar (Stick to top/bottom if active) */}
      {playingSuratNo && (
        <div id="global-audio-player" className="bg-emerald-600 dark:bg-emerald-800 text-white rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3">
            <div className={`bg-white/20 p-2.5 rounded-xl ${isPlaying && !isBuffering ? "animate-pulse" : ""}`}>
              {isBuffering ? (
                <Loader2 className="w-5 h-5 text-emerald-100 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-100" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">
                {isBuffering ? "Memuat Murattal..." : "Memutar Murattal:"} QS. {suratList.find(s => s.nomor === playingSuratNo)?.latin}
              </p>
              <p className="text-xs text-emerald-200">
                Mishaari Raashid al-Afasy {usingFallback && "(Server Cadangan)"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-96">
            <span className="text-xs font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-white h-1.5 bg-emerald-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center space-x-3">
            {audioError && (
              <span className="text-xs bg-red-500 text-white px-2.5 py-1.5 rounded-xl font-bold max-w-xs truncate animate-bounce" title={audioError}>
                ⚠️ {audioError}
              </span>
            )}
            <button
              id="player-toggle-btn"
              onClick={() => playingSuratNo && handlePlayAudio(suratList.find(s => s.nomor === playingSuratNo)!)}
              className="p-2.5 bg-white text-emerald-700 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md flex items-center justify-center disabled:opacity-50"
              title={isPlaying ? "Jeda" : "Putar"}
              disabled={isBuffering}
            >
              {isBuffering ? (
                <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Catalog Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List of Surahs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="surah-search-input"
              type="text"
              placeholder="Cari nama surat (latin/arab) atau nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-gray-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm shadow-sm"
            />
          </div>

          {/* Grid list cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {filteredSurat.map((surat) => {
              const isSelected = selectedSurat?.nomor === surat.nomor;
              const isCurrentPlaying = playingSuratNo === surat.nomor;
              return (
                <div
                  id={`surah-card-${surat.nomor}`}
                  key={surat.nomor}
                  onClick={() => setSelectedSurat(surat)}
                  className={`
                    p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md hover:translate-y-[-2px]
                    ${isSelected 
                      ? "bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800" 
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {surat.nomor}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-gray-950 dark:text-white truncate">{surat.latin}</h4>
                      <p className="text-xs text-gray-450 truncate">{surat.arti}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      surat.tingkatKesulitan === 'Mudah' ? 'bg-green-100 text-green-700' :
                      surat.tingkatKesulitan === 'Sedang' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {surat.tingkatKesulitan}
                    </span>
                    <button
                      id={`play-btn-${surat.nomor}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio(surat);
                      }}
                      className={`p-2 rounded-full border transition-all ${
                        isCurrentPlaying
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-gray-50 hover:bg-emerald-100 dark:bg-gray-850 dark:hover:bg-emerald-950 text-emerald-600 border-gray-250 dark:border-gray-700"
                      }`}
                      title={isCurrentPlaying && isPlaying ? "Jeda Audio" : "Putar Audio"}
                    >
                      {isCurrentPlaying ? (
                        isBuffering ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Surah Details Panel */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-5">
          {selectedSurat ? (
            <>
              {/* Header spelling */}
              <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-800 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">QS. JUZ 30 — NOMOR {selectedSurat.nomor}</p>
                <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{selectedSurat.latin}</h3>
                <h4 className="text-4xl font-semibold font-serif text-gray-900 dark:text-white mt-1">{selectedSurat.arab}</h4>
                <p className="text-sm text-gray-500 italic mt-1">"{selectedSurat.arti}"</p>
              </div>

              {/* Interactive Audio Player Button for Selected Surah */}
              <div className="pt-1">
                <button
                  id={`detail-play-btn-${selectedSurat.nomor}`}
                  onClick={() => handlePlayAudio(selectedSurat)}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center space-x-2.5 transition-all duration-200 transform active:scale-95 cursor-pointer ${
                    playingSuratNo === selectedSurat.nomor && isPlaying
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100 dark:shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 dark:shadow-none"
                  }`}
                >
                  {playingSuratNo === selectedSurat.nomor ? (
                    isBuffering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memuat Murattal...</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 fill-current" />
                        <span>Jeda Murattal QS. {selectedSurat.latin}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        <span>Putar Murattal QS. {selectedSurat.latin}</span>
                      </>
                    )
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>Putar Murattal QS. {selectedSurat.latin}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Surah details parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-850/40 p-3 rounded-2xl border border-gray-100/55 dark:border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jumlah Ayat</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center mt-0.5">
                    <Layers className="w-4 h-4 mr-1.5 text-emerald-500" /> {selectedSurat.ayat} Ayat
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-850/40 p-3 rounded-2xl border border-gray-100/55 dark:border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kesulitan</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center mt-0.5">
                    <Award className="w-4 h-4 mr-1.5 text-amber-500" /> {selectedSurat.tingkatKesulitan}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-850/40 p-3 rounded-2xl border border-gray-100/55 dark:border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Semester</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center mt-0.5">
                    <Clock className="w-4 h-4 mr-1.5 text-blue-500" /> Sem {selectedSurat.semester}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-850/40 p-3 rounded-2xl border border-gray-100/55 dark:border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tempat Turun</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center mt-0.5">
                    <BookOpen className="w-4 h-4 mr-1.5 text-purple-500" /> Makkiyah
                  </p>
                </div>
              </div>

              {/* Tafsir Ringkas block */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-emerald-600" /> Tafsir Ringkas
                </h5>
                <div className="p-4 bg-gray-50 dark:bg-gray-850/30 rounded-2xl border border-gray-105/30 text-xs text-gray-750 dark:text-gray-300 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedSurat.tafsirRingkas || (
                    `Surat ${selectedSurat.latin} merupakan bagian dari Juz Amma yang diturunkan di Mekkah (Makkiyah). Surat ini banyak mengulas tentang tanda-tanda kekuasaan Allah SWT, hari kiamat, pembalasan amal baik dan buruk manusia, serta anjuran untuk senantiasa bertauhid dan berbuat baik harian.`
                  )}
                </div>
              </div>

              {/* Video tutorial embed simulation link */}
              <div className="pt-2">
                <a
                  id="surat-video-tutorial-link"
                  href={`https://www.youtube.com/results?search_query=belajar+tajwid+surat+${selectedSurat.latin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 dark:text-emerald-400 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition-colors border border-emerald-500/20"
                >
                  <Video className="w-4 h-4" />
                  <span>Video Pembelajaran & Tajwid</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-xs">Pilih surat untuk melihat detail lengkap</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
