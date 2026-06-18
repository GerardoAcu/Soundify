
import { useState, useEffect, useCallback, useRef } from "react";

const CLIENT_ID = "b245a9fb94e749ea96eb95496667b263";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-read-recently-played",
  "user-top-read",
  "user-library-read",
  "playlist-read-private",
].join(" ");

// ─── PKCE helpers ───────────────────────────────────────────────
function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join("");
}
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}
function base64urlencode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function generateCodeChallenge(verifier) {
  return base64urlencode(await sha256(verifier));
}

// ─── Spotify API ────────────────────────────────────────────────
async function fetchSpotify(endpoint, token) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify error ${res.status}`);
  return res.json();
}

// ─── Date / duration formatting ──────────────────────────────────
function formatReleaseDate(dateStr, precision) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  if (precision === "year" || !m) return y;
  if (precision === "month" || !d) return `${months[parseInt(m,10)-1]} ${y}`;
  return `${parseInt(d,10)} ${months[parseInt(m,10)-1]} ${y}`;
}
function formatDuration(ms) {
  if (!ms) return "";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// ─── Icons ──────────────────────────────────────────────────────
const icons = {
  explore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  artists: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  favorites: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  albums: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  spotify: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.622.622 0 0 1 .207.857zm1.223-2.722a.779.779 0 0 1-1.071.257c-2.687-1.652-6.785-2.131-9.965-1.166a.779.779 0 0 1-.457-1.489c3.633-1.118 8.147-.576 11.236 1.328a.779.779 0 0 1 .257 1.07zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.543-1.79c3.533-1.072 9.404-.865 13.115 1.337a.935.935 0 0 1-.955 1.61z"/>
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <polygon points="6 4 20 12 6 20 6 4"/>
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/>
    </svg>
  ),
  external: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

// ─── Styles ─────────────────────────────────────────────────────
const S = {
  app: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a3a 50%, #0d0d2b 100%)",
    color: "#fff",
    fontFamily: "'Segoe UI', sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    position: "relative",
    paddingBottom: 80,
  },
  // LOGIN
  loginWrap: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    padding: "40px 24px",
    background: "linear-gradient(160deg, #0a0a1a 0%, #1a0060 60%, #0d0d2b 100%)",
  },
  loginLogo: { fontSize: 52, fontWeight: 900, letterSpacing: -2, textAlign: "center", lineHeight: 1.1 },
  loginSub: { color: "#a78bfa", fontSize: 13, letterSpacing: 3, textTransform: "uppercase" },
  loginBtn: {
    display: "flex", alignItems: "center", gap: 12,
    background: "#1DB954", color: "#000", fontWeight: 700,
    fontSize: 16, padding: "16px 32px", borderRadius: 50,
    border: "none", cursor: "pointer", boxShadow: "0 4px 24px #1DB95455",
  },
  // HEADER
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px 8px", position: "sticky", top: 0, zIndex: 10,
    background: "linear-gradient(to bottom, #0a0a1acc, transparent)",
    backdropFilter: "blur(8px)",
  },
  logoText: { fontSize: 22, fontWeight: 900, letterSpacing: -1 },
  logoSpan: { color: "#818cf8" },
  headerIcons: { display: "flex", gap: 16, alignItems: "center", color: "#c4b5fd" },
  backHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "16px 20px 8px", position: "sticky", top: 0, zIndex: 10,
    background: "linear-gradient(to bottom, #0a0a1acc, transparent)",
    backdropFilter: "blur(8px)",
  },
  backBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex" },
  // WELCOME BAND
  welcomeBand: {
    margin: "8px 16px",
    background: "linear-gradient(90deg, #312e81cc, #4c1d95cc)",
    borderRadius: 16, padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
  },
  avatar: {
    width: 40, height: 40, borderRadius: "50%",
    background: "#4c1d95", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 18, overflow: "hidden",
  },
  welcomeName: { fontWeight: 700, fontSize: 15 },
  welcomeSub: { color: "#a78bfa", fontSize: 12 },
  arrow: { marginLeft: "auto", color: "#a78bfa", fontSize: 20 },
  // SECTION
  sectionTitle: { fontSize: 18, fontWeight: 700, padding: "16px 20px 8px" },
  // GRID
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 12px" },
  gridCard: { borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer", aspectRatio: "1" },
  gridImg: { width: "100%", height: "100%", objectFit: "cover" },
  gridLabel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    background: "linear-gradient(transparent, #000b)",
    padding: "20px 8px 8px", fontSize: 11, fontWeight: 700,
  },
  gridSubLabel: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: "0 8px 6px", fontSize: 9, color: "#c4b5fd", fontWeight: 500,
  },
  gridControls: {
    position: "absolute", top: 6, right: 6,
    display: "flex", flexDirection: "column", gap: 6,
  },
  // LIST
  list: { display: "flex", flexDirection: "column", gap: 4, padding: "0 12px" },
  listItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 12px", borderRadius: 12,
    background: "#ffffff08", cursor: "pointer",
  },
  listImg: { width: 48, height: 48, borderRadius: 8, objectFit: "cover", background: "#312e81" },
  listInfo: { flex: 1, minWidth: 0 },
  listTitle: { fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  listSub: { color: "#a78bfa", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  listDate: { color: "#6b6b8f", fontSize: 11, marginTop: 1 },
  // SEARCH
  searchWrap: { padding: "12px 16px" },
  searchBox: {
    display: "flex", alignItems: "center", gap: 10,
    background: "#fff", borderRadius: 50, padding: "10px 18px",
  },
  searchInput: {
    flex: 1, border: "none", outline: "none",
    fontSize: 15, background: "transparent", color: "#111",
  },
  // NAVBAR
  navbar: {
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 480,
    background: "#0d0d2bee", backdropFilter: "blur(12px)",
    borderTop: "1px solid #312e8155",
    display: "flex", justifyContent: "space-around", padding: "10px 0 16px",
    zIndex: 20,
  },
  navBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", color: "#6b7280", border: "none", background: "none", fontSize: 10 },
  navBtnActive: { color: "#818cf8" },
  // LOADING
  loading: { textAlign: "center", padding: 40, color: "#a78bfa" },
  // PLACEHOLDER
  placeholder: { width: "100%", height: "100%", background: "linear-gradient(135deg,#312e81,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 },
  // PROFILE
  profileHero: { display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px", gap: 12 },
  profileAvatarBig: {
    width: 96, height: 96, borderRadius: "50%", background: "#4c1d95",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 36, overflow: "hidden", border: "3px solid #818cf855",
  },
  profileName: { fontSize: 22, fontWeight: 800 },
  profileEmail: { color: "#a78bfa", fontSize: 13 },
  profileSection: { padding: "0 16px", display: "flex", flexDirection: "column", gap: 8, marginTop: 16 },
  profileRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#ffffff08", borderRadius: 12, padding: "14px 16px", fontSize: 14,
  },
  logoutBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    background: "#ef444422", color: "#f87171", border: "1px solid #ef444444",
    borderRadius: 12, padding: "14px 16px", fontSize: 15, fontWeight: 600,
    cursor: "pointer", margin: "8px 16px 0",
  },
  // ALBUM DETAIL
  albumHero: { display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 20px 20px", gap: 10, textAlign: "center" },
  albumCover: { width: 180, height: 180, borderRadius: 12, objectFit: "cover", boxShadow: "0 8px 32px #00000066" },
  albumTitle: { fontSize: 20, fontWeight: 800, marginTop: 8 },
  albumArtist: { color: "#a78bfa", fontSize: 14 },
  albumMeta: { color: "#6b6b8f", fontSize: 12, display: "flex", gap: 6, alignItems: "center" },
  trackRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 16px", cursor: "pointer",
  },
  trackNum: { width: 20, textAlign: "center", color: "#6b6b8f", fontSize: 13, flexShrink: 0 },
  // MINI PLAYER
  miniPlayer: {
    position: "fixed", bottom: 72, left: "50%", transform: "translateX(-50%)",
    width: "calc(100% - 24px)", maxWidth: 456,
    background: "linear-gradient(90deg, #1a1040ee, #2a1060ee)",
    backdropFilter: "blur(16px)",
    borderRadius: 14, padding: "10px 12px",
    display: "flex", flexDirection: "column", gap: 8,
    boxShadow: "0 8px 24px #00000088", zIndex: 25,
    border: "1px solid #ffffff14",
  },
  miniPlayerTop: { display: "flex", alignItems: "center", gap: 10 },
  miniImg: { width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  miniInfo: { flex: 1, minWidth: 0 },
  miniTitle: { fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  miniSub: { color: "#a78bfa", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  miniControls: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  miniProgressTrack: { height: 3, background: "#ffffff22", borderRadius: 2, overflow: "hidden", cursor: "pointer" },
  miniProgressFill: { height: "100%", background: "#1DB954", borderRadius: 2 },
};

// ─── Placeholder image ──────────────────────────────────────────
function Thumb({ src, alt, style, emoji = "🎵" }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div style={{ ...style, ...S.placeholder }}>{emoji}</div>;
  return <img src={src} alt={alt} style={style} onError={() => setErr(true)} />;
}

// ─── Mini play button (30s preview) ──────────────────────────────
function PlayButton({ previewUrl, playingUrl, isPlaying, onToggle, size = 32 }) {
  const isThis = playingUrl === previewUrl && previewUrl;
  if (!previewUrl) {
    return (
      <div
        title="Sin preview disponible"
        style={{
          width: size, height: size, borderRadius: "50%",
          background: "#ffffff14", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#555", fontSize: size * 0.45, flexShrink: 0,
        }}
      >
        {icons.play}
      </div>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(previewUrl); }}
      style={{
        width: size, height: size, borderRadius: "50%", border: "none", cursor: "pointer",
        background: isThis ? "#1DB954" : "#ffffff1f",
        color: isThis ? "#000" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      {isThis && isPlaying ? icons.pause : icons.play}
    </button>
  );
}

// ─── Open in Spotify link ────────────────────────────────────────
function OpenInSpotify({ url, size = 28 }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Abrir en Spotify"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "#ffffff14", color: "#1DB954",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, textDecoration: "none",
      }}
    >
      {icons.external}
    </a>
  );
}

// ─── Mini player (bottom, "now playing") ─────────────────────────
function MiniPlayer({ track, isPlaying, progress, duration, onToggle, onSeek, onClose }) {
  if (!track) return null;
  const img = track.album?.images?.[0]?.url;
  const pct = duration ? (progress / duration) * 100 : 0;

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * duration);
  };

  return (
    <div style={S.miniPlayer}>
      <div style={S.miniPlayerTop}>
        <Thumb src={img} alt={track.name} style={S.miniImg} />
        <div style={S.miniInfo}>
          <div style={S.miniTitle}>{track.name}</div>
          <div style={S.miniSub}>{track.artists?.map(a => a.name).join(", ")}</div>
        </div>
        <div style={S.miniControls}>
          <button onClick={onToggle} style={{ background: "#1DB954", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#000" }}>
            {isPlaying ? icons.pause : icons.play}
          </button>
          <OpenInSpotify url={track.external_urls?.spotify} size={28} />
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", display: "flex" }}>
            {icons.close}
          </button>
        </div>
      </div>
      <div style={S.miniProgressTrack} onClick={handleSeek}>
        <div style={{ ...S.miniProgressFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────
export default function SoUNdiFay() {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");
  const [view, setView] = useState(null); // { type: 'album'|'profile', data }
  const [recent, setRecent] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [savedTracks, setSavedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [albumDetail, setAlbumDetail] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(false);

  // ── Now-playing audio state ──
  const [nowPlaying, setNowPlaying] = useState(null); // track object
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(30);
  const audioRef = useRef(null);

  // ── Auth: handle callback ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const storedToken = sessionStorage.getItem("spotify_token");
    if (storedToken) { setToken(storedToken); return; }
    if (code) exchangeCode(code);
  }, []);

  async function exchangeCode(code) {
    const verifier = sessionStorage.getItem("pkce_verifier");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    });
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json();
    if (data.access_token) {
      sessionStorage.setItem("spotify_token", data.access_token);
      setToken(data.access_token);
      window.history.replaceState({}, "", "/");
    }
  }

  async function login() {
    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem("pkce_verifier", verifier);
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", challenge);
    window.location.href = url.toString();
  }

  function logout() {
    if (audioRef.current) audioRef.current.pause();
    sessionStorage.removeItem("spotify_token");
    sessionStorage.removeItem("pkce_verifier");
    setToken(null);
    setProfile(null);
    setView(null);
    setNowPlaying(null);
  }

  // ── Load data once token is ready ──
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetchSpotify("/me", token).then(setProfile),
      fetchSpotify("/me/player/recently-played?limit=9", token).then(d => setRecent(d.items || [])),
      fetchSpotify("/me/top/tracks?limit=9&time_range=short_term", token).then(d => setTopTracks(d.items || [])),
      fetchSpotify("/me/top/artists?limit=9&time_range=short_term", token).then(d => setTopArtists(d.items || [])),
      fetchSpotify("/me/albums?limit=9", token).then(d => setSavedAlbums(d.items || [])),
      fetchSpotify("/me/tracks?limit=20", token).then(d => setSavedTracks(d.items || [])),
    ]).finally(() => setLoading(false));
  }, [token]);

  // ── Search ──
  const doSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const data = await fetchSpotify(`/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`, token);
    setSearchResults(data.tracks?.items || []);
  }, [searchQuery, token]);

  useEffect(() => {
    const t = setTimeout(doSearch, 500);
    return () => clearTimeout(t);
  }, [doSearch]);

  // ── Open album detail ──
  async function openAlbum(albumId) {
    setView({ type: "album" });
    setAlbumLoading(true);
    try {
      const data = await fetchSpotify(`/albums/${albumId}`, token);
      setAlbumDetail(data);
    } catch (e) {
      setAlbumDetail(null);
    } finally {
      setAlbumLoading(false);
    }
  }

  // ── Playback control ──
  function playTrack(track) {
    if (!track?.preview_url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (nowPlaying?.id === track.id && isPlaying) {
      setIsPlaying(false);
      return;
    }
    const a = new Audio(track.preview_url);
    a.volume = 0.9;
    a.ontimeupdate = () => setProgress(a.currentTime);
    a.onloadedmetadata = () => setDuration(a.duration || 30);
    a.onended = () => setIsPlaying(false);
    a.play().catch(() => {});
    audioRef.current = a;
    setNowPlaying(track);
    setIsPlaying(true);
    setProgress(0);
  }

  function togglePlayPause() {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  }

  function seekTo(time) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setProgress(time);
  }

  function closePlayer() {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = null;
    setNowPlaying(null);
    setIsPlaying(false);
  }

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const playingUrl = nowPlaying?.preview_url || null;

  // ─────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  if (!token) return (
    <div style={S.loginWrap}>
      <div>
        <div style={S.loginLogo}>
          <span>SoUNd</span><br />
          <span style={{ color: "#818cf8" }}>iFay</span>
        </div>
        <div style={{ ...S.loginSub, textAlign: "center", marginTop: 8 }}>Tu música, tu mundo</div>
      </div>
      <button style={S.loginBtn} onClick={login}>
        {icons.spotify} Conectar con Spotify
      </button>
    </div>
  );

  if (loading) return <div style={{ ...S.app, ...S.loading }}>Cargando tu música…</div>;

  const userName = profile?.display_name || "Gerardo";
  const userAvatar = profile?.images?.[0]?.url;

  // ─────────────────────────────────────────────────────────────
  // GRID ITEM with preview + spotify link + (optional) open album
  const renderGridItem = (img, label, previewUrl, externalUrl, emoji, key, onOpen, dateLabel) => (
    <div key={key} style={S.gridCard} onClick={onOpen}>
      <Thumb src={img} alt={label} style={S.gridImg} emoji={emoji} />
      <div style={S.gridLabel}>{label}</div>
      {dateLabel && <div style={{ ...S.gridSubLabel, bottom: -2, paddingBottom: 4 }}>{dateLabel}</div>}
      <div style={S.gridControls}>
        <PlayButton previewUrl={previewUrl} playingUrl={playingUrl} isPlaying={isPlaying}
          onToggle={() => playTrack({ id: previewUrl, preview_url: previewUrl, name: label, external_urls: { spotify: externalUrl } })}
          size={28} />
        <OpenInSpotify url={externalUrl} size={24} />
      </div>
    </div>
  );

  const renderHome = () => (
    <>
      {/* Welcome band */}
      <div style={S.welcomeBand} onClick={() => setView({ type: "profile" })}>
        <div style={S.avatar}>
          {userAvatar ? <img src={userAvatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : icons.user}
        </div>
        <div>
          <div style={S.welcomeName}>{userName}</div>
          <div style={S.welcomeSub}>Ver perfil</div>
        </div>
        <div style={S.arrow}>›</div>
      </div>

      {/* Recent tracks grid */}
      <div style={S.sectionTitle}>Reproducidas recientemente</div>
      <div style={S.grid}>
        {recent.map((item, i) => {
          const t = item.track;
          const img = t?.album?.images?.[0]?.url;
          return renderGridItem(img, t?.name, t?.preview_url, t?.external_urls?.spotify, "🎵", i, () => playTrack(t));
        })}
      </div>
    </>
  );

  const renderExplore = () => (
    <>
      <div style={S.sectionTitle}>Tus más escuchadas</div>
      <div style={S.grid}>
        {topTracks.map((t, i) => {
          const img = t?.album?.images?.[0]?.url;
          return renderGridItem(img, t?.name, t?.preview_url, t?.external_urls?.spotify, "🎵", i, () => playTrack(t));
        })}
      </div>
    </>
  );

  const renderArtists = () => (
    <>
      <div style={S.sectionTitle}>Tus artistas top</div>
      <div style={S.list}>
        {topArtists.map((a, i) => {
          const img = a?.images?.[0]?.url;
          return (
            <div key={i} style={S.listItem}>
              <Thumb src={img} alt={a?.name} style={{ ...S.listImg, borderRadius: "50%" }} emoji="🎤" />
              <div style={S.listInfo}>
                <div style={S.listTitle}>{a?.name}</div>
                <div style={S.listSub}>{a?.genres?.[0] || "Artista"}</div>
              </div>
              <OpenInSpotify url={a?.external_urls?.spotify} size={28} />
            </div>
          );
        })}
      </div>
    </>
  );

  const renderFavorites = () => (
    <>
      <div style={S.sectionTitle}>Canciones favoritas</div>
      <div style={S.list}>
        {savedTracks.map((item, i) => {
          const t = item.track;
          const img = t?.album?.images?.[0]?.url;
          const date = t?.album?.release_date;
          return (
            <div key={i} style={S.listItem} onClick={() => playTrack(t)}>
              <Thumb src={img} alt={t?.name} style={S.listImg} />
              <div style={S.listInfo}>
                <div style={S.listTitle}>{t?.name}</div>
                <div style={S.listSub}>{t?.artists?.map(a => a.name).join(", ")}</div>
                {date && <div style={S.listDate}>{formatReleaseDate(date, t?.album?.release_date_precision)}</div>}
              </div>
              <PlayButton previewUrl={t?.preview_url} playingUrl={playingUrl} isPlaying={isPlaying} onToggle={() => playTrack(t)} size={32} />
              <OpenInSpotify url={t?.external_urls?.spotify} size={28} />
            </div>
          );
        })}
      </div>
    </>
  );

  const renderAlbums = () => (
    <>
      <div style={S.sectionTitle}>Tus álbumes</div>
      <div style={S.grid}>
        {savedAlbums.map((item, i) => {
          const a = item.album;
          const img = a?.images?.[0]?.url;
          return (
            <div key={i} style={S.gridCard} onClick={() => openAlbum(a?.id)}>
              <Thumb src={img} alt={a?.name} style={S.gridImg} emoji="💿" />
              <div style={S.gridLabel}>{a?.name}</div>
              <div style={{ ...S.gridSubLabel, bottom: -2, paddingBottom: 4 }}>
                {formatReleaseDate(a?.release_date, a?.release_date_precision)}
              </div>
              <div style={S.gridControls}>
                <OpenInSpotify url={a?.external_urls?.spotify} size={24} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderSearch = () => (
    <>
      <div style={S.searchWrap}>
        <div style={S.searchBox}>
          <span style={{ color: "#666" }}>{icons.search}</span>
          <input
            style={S.searchInput}
            placeholder="Buscar canciones…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#666", fontSize: 18 }}>✕</button>
          )}
        </div>
      </div>
      <div style={S.list}>
        {searchResults.map((t, i) => {
          const img = t?.album?.images?.[0]?.url;
          const date = t?.album?.release_date;
          return (
            <div key={i} style={S.listItem} onClick={() => playTrack(t)}>
              <Thumb src={img} alt={t?.name} style={S.listImg} />
              <div style={S.listInfo}>
                <div style={S.listTitle}>{t?.name}</div>
                <div style={S.listSub}>{t?.artists?.map(a => a.name).join(", ")}</div>
                {date && <div style={S.listDate}>{formatReleaseDate(date, t?.album?.release_date_precision)}</div>}
              </div>
              <PlayButton previewUrl={t?.preview_url} playingUrl={playingUrl} isPlaying={isPlaying} onToggle={() => playTrack(t)} size={32} />
              <OpenInSpotify url={t?.external_urls?.spotify} size={28} />
            </div>
          );
        })}
      </div>
    </>
  );

  // ── Profile view ──
  const renderProfile = () => (
    <>
      <div style={S.backHeader}>
        <button style={S.backBtn} onClick={() => setView(null)}>{icons.back}</button>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Perfil</div>
      </div>
      <div style={S.profileHero}>
        <div style={S.profileAvatarBig}>
          {userAvatar ? <img src={userAvatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : icons.user}
        </div>
        <div style={S.profileName}>{userName}</div>
        {profile?.email && <div style={S.profileEmail}>{profile.email}</div>}
      </div>
      <div style={S.profileSection}>
        <div style={S.profileRow}>
          <span>País</span>
          <span style={{ color: "#a78bfa" }}>{profile?.country || "—"}</span>
        </div>
        <div style={S.profileRow}>
          <span>Tipo de cuenta</span>
          <span style={{ color: "#a78bfa", textTransform: "capitalize" }}>{profile?.product || "—"}</span>
        </div>
        <div style={S.profileRow}>
          <span>Seguidores</span>
          <span style={{ color: "#a78bfa" }}>{profile?.followers?.total ?? "—"}</span>
        </div>
      </div>
      <button style={S.logoutBtn} onClick={logout}>
        {icons.logout} Cerrar sesión
      </button>
    </>
  );

  // ── Album detail view ──
  const renderAlbumDetail = () => {
    if (albumLoading) return <div style={S.loading}>Cargando álbum…</div>;
    if (!albumDetail) return <div style={S.loading}>No se pudo cargar el álbum.</div>;
    const img = albumDetail.images?.[0]?.url;
    const tracks = albumDetail.tracks?.items || [];
    return (
      <>
        <div style={S.backHeader}>
          <button style={S.backBtn} onClick={() => { setView(null); setAlbumDetail(null); }}>{icons.back}</button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Álbum</div>
        </div>
        <div style={S.albumHero}>
          <Thumb src={img} alt={albumDetail.name} style={S.albumCover} emoji="💿" />
          <div style={S.albumTitle}>{albumDetail.name}</div>
          <div style={S.albumArtist}>{albumDetail.artists?.map(a => a.name).join(", ")}</div>
          <div style={S.albumMeta}>
            <span>{formatReleaseDate(albumDetail.release_date, albumDetail.release_date_precision)}</span>
            <span>·</span>
            <span>{albumDetail.total_tracks} canciones</span>
            <OpenInSpotify url={albumDetail.external_urls?.spotify} size={22} />
          </div>
        </div>
        <div style={S.list}>
          {tracks.map((t, i) => {
            const fullTrack = { ...t, album: albumDetail };
            return (
              <div key={t.id || i} style={S.trackRow} onClick={() => playTrack(fullTrack)}>
                <div style={S.trackNum}>{i + 1}</div>
                <div style={S.listInfo}>
                  <div style={S.listTitle}>{t.name}</div>
                  <div style={S.listSub}>{t.artists?.map(a => a.name).join(", ")} · {formatDuration(t.duration_ms)}</div>
                </div>
                <PlayButton previewUrl={t.preview_url} playingUrl={playingUrl} isPlaying={isPlaying} onToggle={() => playTrack(fullTrack)} size={30} />
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const tabs = [
    { id: "explore", label: "Explorar", icon: icons.explore },
    { id: "artists", label: "Artistas", icon: icons.artists },
    { id: "home",    label: "Principal", icon: icons.home },
    { id: "favorites", label: "Favoritos", icon: icons.favorites },
    { id: "albums",  label: "Álbumes", icon: icons.albums },
  ];

  return (
    <div style={S.app}>
      {view?.type === "profile" || view?.type === "album" ? (
        view.type === "profile" ? renderProfile() : renderAlbumDetail()
      ) : (
        <>
          {/* HEADER */}
          <div style={S.header}>
            <div style={S.logoText}>
              SoUNd<span style={S.logoSpan}>iFay</span>
            </div>
            <div style={S.headerIcons}>
              <span style={{ cursor: "pointer" }} onClick={() => setTab("search")}>{icons.search}</span>
              <span>{icons.bell}</span>
              <span style={{ cursor: "pointer" }} onClick={() => setView({ type: "profile" })}>{icons.user}</span>
            </div>
          </div>

          {/* CONTENT */}
          {tab === "home"      && renderHome()}
          {tab === "explore"   && renderExplore()}
          {tab === "artists"   && renderArtists()}
          {tab === "favorites" && renderFavorites()}
          {tab === "albums"    && renderAlbums()}
          {tab === "search"    && renderSearch()}

          {/* NAVBAR */}
          <nav style={S.navbar}>
            {tabs.map(t => (
              <button
                key={t.id}
                style={{ ...S.navBtn, ...(tab === t.id ? S.navBtnActive : {}) }}
                onClick={() => setTab(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </>
      )}

      {/* MINI PLAYER (now playing) */}
      <MiniPlayer
        track={nowPlaying}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        onToggle={togglePlayPause}
        onSeek={seekTo}
        onClose={closePlayer}
      />
    </div>
  );
}