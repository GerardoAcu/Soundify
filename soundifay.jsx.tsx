import { useState } from "react";

const SONGS = [
  { id: 1, title: "Pantysito", artist: "Bizarrap & Milo J", cover: "https://picsum.photos/seed/pant/300/300", color: "#1a1a2e" },
  { id: 2, title: "Despeinada", artist: "Ozuna", cover: "https://picsum.photos/seed/desp/300/300", color: "#2d1b69" },
  { id: 3, title: "blackout", artist: "Emilia, Tini, Nicki Nicole", cover: "https://picsum.photos/seed/blk/300/300", color: "#0a3d62" },
  { id: 4, title: "Dai Dai", artist: "Shakira x Burna Boy", cover: "https://picsum.photos/seed/dai/300/300", color: "#1e3a5f" },
  { id: 5, title: "CAPRICHOSO", artist: "Quevedo", cover: "https://picsum.photos/seed/cap/300/300", color: "#16213e" },
  { id: 6, title: "AL GOLPITO", artist: "Bizarrap", cover: "https://picsum.photos/seed/gol/300/300", color: "#0f3460" },
  { id: 7, title: "23", artist: "Emilio Navajas", cover: "https://picsum.photos/seed/23s/300/300", color: "#1a0533" },
  { id: 8, title: "LUX", artist: "Rosalía", cover: "https://picsum.photos/seed/lux/300/300", color: "#2c2c54" },
  { id: 9, title: "No Digas Na", artist: "Yandel x Feid", cover: "https://picsum.photos/seed/nodg/300/300", color: "#1b5e20" },
];

const ARTISTS = [
  { id: 1, name: "Bizarrap", genre: "Trap / Rap", cover: "https://picsum.photos/seed/biza/300/300" },
  { id: 2, name: "Shakira", genre: "Pop / Latino", cover: "https://picsum.photos/seed/shak/300/300" },
  { id: 3, name: "Quevedo", genre: "Trap / Urbano", cover: "https://picsum.photos/seed/quev/300/300" },
  { id: 4, name: "Feid", genre: "Reggaeton", cover: "https://picsum.photos/seed/feid/300/300" },
  { id: 5, name: "Milo J", genre: "Rap / Trap", cover: "https://picsum.photos/seed/milo/300/300" },
  { id: 6, name: "Rosalía", genre: "Pop / Flamenco", cover: "https://picsum.photos/seed/rosa/300/300" },
];

const HISTORY = [
  "follow the leader dance",
  "dai dai shakira",
  "quevedo",
  "bizarrap milo j",
  "bizarrap y milo j",
  "bizarrap",
  "buzarra",
  "90s",
  "belle y bad bunny",
];

const ALBUMS = [
  { id: 1, title: "BZRP Music Sessions", artist: "Bizarrap", year: 2024, cover: "https://picsum.photos/seed/alb1/300/300", tracks: 12 },
  { id: 2, title: "Las Mujeres Ya No Lloran", artist: "Shakira", year: 2024, cover: "https://picsum.photos/seed/alb2/300/300", tracks: 16 },
  { id: 3, title: "Buenas Noches", artist: "Quevedo", year: 2023, cover: "https://picsum.photos/seed/alb3/300/300", tracks: 14 },
  { id: 4, title: "Manifesting 20-05", artist: "Yandel x Feid", year: 2024, cover: "https://picsum.photos/seed/alb4/300/300", tracks: 10 },
  { id: 5, title: "LUX", artist: "Rosalía", year: 2024, cover: "https://picsum.photos/seed/alb5/300/300", tracks: 8 },
  { id: 6, title: "LALA", artist: "Myke Towers", year: 2023, cover: "https://picsum.photos/seed/alb6/300/300", tracks: 13 },
];

const FAVORITES = [SONGS[0], SONGS[1], SONGS[3], SONGS[7]];

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCompass = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconPalette = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/>
  </svg>
);
const IconBookmark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconDisc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
    <path d="M12 9v0M12 15v0M9 12H9M15 12h0"/>
  </svg>
);
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M7 17L17 7M17 7H7M17 7v10"/>
  </svg>
);
const IconMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
  </svg>
);

// ─── Waveform animation ───────────────────────────────────────────────────────
const Waveform = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: 20 }}>
    {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.3, 0.7, 0.5].map((h, i) => (
      <div key={i} style={{
        width: 3, background: "#4fc3f7",
        borderRadius: 2,
        height: `${h * 100}%`,
        animation: `wave ${0.8 + i * 0.07}s ease-in-out infinite alternate`,
        animationDelay: `${i * 0.05}s`,
      }} />
    ))}
  </div>
);

// ─── Now Playing Bar ──────────────────────────────────────────────────────────
const NowPlayingBar = ({ song }) => {
  const [playing, setPlaying] = useState(true);
  if (!song) return null;
  return (
    <div style={{
      position: "fixed", bottom: 72, left: 0, right: 0,
      background: "linear-gradient(135deg, #1a1a3e 0%, #0d1b4b 100%)",
      borderTop: "1px solid rgba(79,195,247,0.2)",
      padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 12,
      zIndex: 100,
      backdropFilter: "blur(20px)",
    }}>
      <img src={song.cover} alt={song.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.title}</div>
        <div style={{ color: "#4fc3f7", fontSize: 11 }}>{song.artist}</div>
      </div>
      {playing && <Waveform />}
      <button onClick={() => setPlaying(p => !p)} style={{
        background: "rgba(79,195,247,0.15)", border: "1px solid rgba(79,195,247,0.3)",
        borderRadius: "50%", width: 36, height: 36,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#4fc3f7", cursor: "pointer",
      }}>
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : <IconPlay />}
      </button>
    </div>
  );
};

// ─── Principal Screen ─────────────────────────────────────────────────────────
const PrincipalScreen = ({ onPlay }) => (
  <div style={{ padding: "0 0 16px" }}>
    {/* Header */}
    <div style={{
      padding: "20px 16px 12px",
      background: "linear-gradient(180deg, rgba(20,20,80,0.9) 0%, transparent 100%)",
      display: "flex", alignItems: "center", gap: 10
    }}>
      <div style={{
        background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "8px 14px",
        display: "flex", alignItems: "center", gap: 8
      }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(79,195,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconUser />
        </div>
        <div>
          <div style={{ color: "#aaa", fontSize: 10, letterSpacing: 1 }}>EMILIO LONZALLES</div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Accesos directos</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="2" width="16" height="16">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    {/* Featured */}
    <div style={{ padding: "0 16px 16px" }}>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>
        🔥 Tendencias
      </div>
      <div style={{
        background: "linear-gradient(135deg, #1565c0, #283593)",
        borderRadius: 16, padding: 16,
        display: "flex", alignItems: "center", gap: 12,
        border: "1px solid rgba(79,195,247,0.2)",
        cursor: "pointer",
      }} onClick={() => onPlay(SONGS[0])}>
        <img src={SONGS[0].cover} style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover" }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#4fc3f7", fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>TOP AHORA</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>{SONGS[0].title}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{SONGS[0].artist}</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "#4fc3f7", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#000", flexShrink: 0,
        }}>
          <IconPlay />
        </div>
      </div>
    </div>

    {/* Grid */}
    <div style={{ padding: "0 16px" }}>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Recientes</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {SONGS.map(song => (
          <div key={song.id} style={{ cursor: "pointer", position: "relative" }} onClick={() => onPlay(song)}>
            <img src={song.cover} alt={song.title} style={{ width: "100%", aspectRatio: "1", borderRadius: 10, objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
              borderRadius: "0 0 10px 10px", padding: "20px 6px 6px",
            }}>
              <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{song.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Explorar Screen ──────────────────────────────────────────────────────────
const ExplorarScreen = ({ onPlay }) => {
  const categories = [
    { label: "Reggaeton", color: "#1565c0", icon: "🎵" },
    { label: "Trap", color: "#4a148c", icon: "🎤" },
    { label: "Pop Latino", color: "#880e4f", icon: "💃" },
    { label: "90s", color: "#1b5e20", icon: "📼" },
    { label: "Electrónica", color: "#0d47a1", icon: "🎧" },
    { label: "Cumbia", color: "#e65100", icon: "🥁" },
  ];
  return (
    <div style={{ padding: 16 }}>
      <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 16, letterSpacing: -1 }}>Explorar</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {categories.map(c => (
          <div key={c.label} style={{
            background: `linear-gradient(135deg, ${c.color}, rgba(0,0,0,0.5))`,
            borderRadius: 12, padding: "20px 14px",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}>
            <div style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Populares ahora</div>
      {SONGS.slice(0, 5).map(song => (
        <div key={song.id} onClick={() => onPlay(song)} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
          cursor: "pointer",
        }}>
          <img src={song.cover} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{song.title}</div>
            <div style={{ color: "#4fc3f7", fontSize: 12 }}>{song.artist}</div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>3:42</div>
        </div>
      ))}
    </div>
  );
};

// ─── Artistas Screen ──────────────────────────────────────────────────────────
const ArtistasScreen = ({ onPlay }) => (
  <div style={{ padding: 16 }}>
    <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 16, letterSpacing: -1 }}>Artistas</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {ARTISTS.map(artist => (
        <div key={artist.id} style={{ cursor: "pointer", textAlign: "center" }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={artist.cover} alt={artist.name} style={{
              width: "100%", aspectRatio: "1", borderRadius: "50%", objectFit: "cover",
              border: "2px solid rgba(79,195,247,0.3)",
            }} />
            <div style={{
              position: "absolute", bottom: 4, right: 4,
              width: 28, height: 28, borderRadius: "50%",
              background: "#4fc3f7", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#000",
            }} onClick={() => onPlay(SONGS[Math.floor(Math.random() * SONGS.length)])}>
              <IconPlay />
            </div>
          </div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{artist.name}</div>
          <div style={{ color: "#4fc3f7", fontSize: 11 }}>{artist.genre}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Faboritos Screen ─────────────────────────────────────────────────────────
const FaboritosScreen = ({ onPlay }) => (
  <div style={{ padding: 16 }}>
    <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 4, letterSpacing: -1 }}>Favoritos ♡</div>
    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 16 }}>{FAVORITES.length} canciones guardadas</div>
    {FAVORITES.map((song, i) => (
      <div key={song.id} onClick={() => onPlay(song)} style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
        cursor: "pointer",
      }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, width: 16, textAlign: "center" }}>{i + 1}</div>
        <img src={song.cover} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover" }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{song.title}</div>
          <div style={{ color: "#4fc3f7", fontSize: 12 }}>{song.artist}</div>
        </div>
        <div style={{ color: "#e91e63", fontSize: 18 }}>♥</div>
      </div>
    ))}
  </div>
);

// ─── Allbumes Screen ──────────────────────────────────────────────────────────
const AllbumesScreen = ({ onPlay }) => (
  <div style={{ padding: 16 }}>
    <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 16, letterSpacing: -1 }}>Álbumes</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {ALBUMS.map(album => (
        <div key={album.id} style={{ cursor: "pointer" }} onClick={() => onPlay(SONGS[album.id - 1])}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={album.cover} alt={album.title} style={{ width: "100%", aspectRatio: "1", borderRadius: 12, objectFit: "cover", display: "block" }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: 12,
              background: "linear-gradient(transparent 50%, rgba(0,0,0,0.7))",
            }} />
          </div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{album.title}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{album.artist} · {album.year}</div>
          <div style={{ color: "#4fc3f7", fontSize: 10, marginTop: 2 }}>{album.tracks} canciones</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Search Screen ────────────────────────────────────────────────────────────
const SearchScreen = ({ onPlay }) => {
  const [query, setQuery] = useState("");
  const results = query.length > 0
    ? SONGS.filter(s => s.title.toLowerCase().includes(query.toLowerCase()) || s.artist.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div style={{ padding: 16 }}>
      {/* Search bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "#fff", borderRadius: 12, padding: "10px 14px",
        marginBottom: 16,
      }}>
        <IconSearch />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Artistas, canciones o álbumes"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#000" }}
        />
        {query ? (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: 16 }}>✕</button>
        ) : (
          <span style={{ color: "#666" }}><IconMic /></span>
        )}
      </div>

      {query.length === 0 ? (
        <>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>BÚSQUEDAS RECIENTES</div>
          {HISTORY.map((h, i) => (
            <div key={i} onClick={() => setQuery(h)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
            }}>
              <span style={{ color: "rgba(255,255,255,0.3)" }}><IconClock /></span>
              <span style={{ color: "#fff", fontSize: 14, flex: 1 }}>{h}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", transform: "rotate(225deg)", display: "block" }}><IconArrow /></span>
            </div>
          ))}
        </>
      ) : results.length > 0 ? (
        <>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 10, letterSpacing: 1 }}>RESULTADOS</div>
          {results.map(song => (
            <div key={song.id} onClick={() => onPlay(song)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
            }}>
              <img src={song.cover} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{song.title}</div>
                <div style={{ color: "#4fc3f7", fontSize: 12 }}>{song.artist}</div>
              </div>
              <div style={{ color: "#fff", opacity: 0.4 }}><IconPlay /></div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40, fontSize: 14 }}>
          No se encontraron resultados para "{query}"
        </div>
      )}
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function SoUNdiFay() {
  const [tab, setTab] = useState("principal");
  const [currentSong, setCurrentSong] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const NAV = [
    { id: "explorar", label: "Explorar", Icon: IconCompass },
    { id: "artistas", label: "Artistas", Icon: IconPalette },
    { id: "principal", label: "Principal", Icon: IconHome },
    { id: "faboritos", label: "Favoritos", Icon: IconBookmark },
    { id: "allbumes", label: "Álbumes", Icon: IconDisc },
  ];

  const handlePlay = (song) => setCurrentSong(song);

  const screenProps = { onPlay: handlePlay };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #000010 0%, #050530 40%, #0a0080 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#fff",
      position: "relative",
    }}>
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Top Bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "linear-gradient(180deg, rgba(0,0,40,0.95) 0%, transparent 100%)",
        padding: "16px 16px 8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        backdropFilter: "blur(10px)",
      }}>
        {showSearch ? (
          <button onClick={() => setShowSearch(false)} style={{ background: "none", border: "none", color: "#4fc3f7", cursor: "pointer", fontSize: 14 }}>← Volver</button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -1 }}>
              <span style={{ color: "#fff" }}>SoUNd</span>
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#4fc3f7" }}>iFay</span>
            <div style={{ display: "flex", gap: 1, alignItems: "center", height: 16 }}>
              {[0.5, 1, 0.7, 1, 0.6].map((h, i) => (
                <div key={i} style={{ width: 2, background: "#4fc3f7", borderRadius: 1, height: `${h * 100}%` }} />
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => { setShowSearch(true); setTab("search"); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8 }}>
            <IconSearch />
          </button>
          <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8 }}>
            <IconBell />
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IconUser />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingBottom: currentSong ? 140 : 80, overflowY: "auto", minHeight: "calc(100vh - 60px)" }}>
        {showSearch ? (
          <SearchScreen {...screenProps} />
        ) : tab === "principal" ? (
          <PrincipalScreen {...screenProps} />
        ) : tab === "explorar" ? (
          <ExplorarScreen {...screenProps} />
        ) : tab === "artistas" ? (
          <ArtistasScreen {...screenProps} />
        ) : tab === "faboritos" ? (
          <FaboritosScreen {...screenProps} />
        ) : (
          <AllbumesScreen {...screenProps} />
        )}
      </div>

      {/* Now Playing */}
      <NowPlayingBar song={currentSong} />

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(0,0,20,0.97)",
        borderTop: "1px solid rgba(79,195,247,0.15)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "10px 0 16px",
        zIndex: 200,
        backdropFilter: "blur(20px)",
      }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = !showSearch && tab === id;
          return (
            <button key={id} onClick={() => { setTab(id); setShowSearch(false); }} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: active ? "#4fc3f7" : "rgba(255,255,255,0.45)",
              transition: "color 0.2s",
              padding: "4px 10px",
            }}>
              <Icon />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: 0.3 }}>{label}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4fc3f7", marginTop: -2 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}