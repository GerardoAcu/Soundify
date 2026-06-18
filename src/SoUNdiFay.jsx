import { useState, useEffect, useCallback, useRef } from "react";

const CLIENT_ID = "b245a9fb94e749ea96eb95496667b263";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = [
  "user-read-private","user-read-email","user-read-recently-played",
  "user-top-read","user-library-read","playlist-read-private","playlist-read-collaborative",
].join(" ");

// ── PKCE ────────────────────────────────────────────────────────
function randStr(n) {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(n))).map(b=>c[b%c.length]).join("");
}
async function sha256(s) { return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); }
function b64url(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
async function pkceChallenge(v) { return b64url(await sha256(v)); }

// ── Spotify ──────────────────────────────────────────────────────
async function api(endpoint, token) {
  const r = await fetch(`https://api.spotify.com/v1${endpoint}`, { headers:{ Authorization:`Bearer ${token}` } });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

// ── Formatters ───────────────────────────────────────────────────
const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function fmtDate(d, p) {
  if (!d) return "";
  const [y,m,day] = d.split("-");
  if (p==="year"||!m) return y;
  if (p==="month"||!day) return `${MONTHS[+m-1]} ${y}`;
  return `${+day} ${MONTHS[+m-1]} ${y}`;
}
function fmtMs(ms) {
  if (!ms) return "";
  const s = Math.floor(ms/1000), m = Math.floor(s/60);
  return `${m}:${(s%60).toString().padStart(2,"0")}`;
}
function fmtNum(n) {
  if (!n) return "0";
  if (n>=1e6) return (n/1e6).toFixed(1)+"M";
  if (n>=1e3) return (n/1e3).toFixed(1)+"K";
  return n.toString();
}

// ── useBreakpoint ────────────────────────────────────────────────
function useBreakpoint() {
  const [wide, setWide] = useState(window.innerWidth >= 768);
  useEffect(()=>{
    const fn = ()=>setWide(window.innerWidth>=768);
    window.addEventListener("resize",fn);
    return ()=>window.removeEventListener("resize",fn);
  },[]);
  return wide;
}

// ── Icons ────────────────────────────────────────────────────────
const IC = {
  explore:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  artists:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/></svg>,
  home:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  favorites: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  albums:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
  search:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bell:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  user:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  spotify:   <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.622.622 0 0 1 .207.857zm1.223-2.722a.779.779 0 0 1-1.071.257c-2.687-1.652-6.785-2.131-9.965-1.166a.779.779 0 0 1-.457-1.489c3.633-1.118 8.147-.576 11.236 1.328a.779.779 0 0 1 .257 1.07zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.543-1.79c3.533-1.072 9.404-.865 13.115 1.337a.935.935 0 0 1-.955 1.61z"/></svg>,
  back:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22"><polyline points="15 18 9 12 15 6"/></svg>,
  logout:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  play:      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><polygon points="6 4 20 12 6 20 6 4"/></svg>,
  pause:     <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>,
  external:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  close:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  next:      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>,
  globe:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

const C = {
  bg:      "linear-gradient(135deg,#08081a 0%,#160840 60%,#0a0a20 100%)",
  surface: "#ffffff08",
  accent:  "#818cf8",
  muted:   "#a78bfa",
  subtle:  "#6b6b8f",
  green:   "#1DB954",
};

// ── Shared components ────────────────────────────────────────────
function Thumb({ src, alt, style, emoji="🎵" }) {
  const [err, setErr] = useState(false);
  if (!src||err) return <div style={{ ...style, background:"linear-gradient(135deg,#312e81,#4c1d95)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:Math.min(+(style?.width||40),+(style?.height||40))*0.38 }}>{emoji}</div>;
  return <img src={src} alt={alt} style={style} onError={()=>setErr(true)} />;
}

function PlayBtn({ previewUrl, playingUrl, playing, onToggle, size=30 }) {
  const active = playingUrl===previewUrl && previewUrl;
  return (
    <button onClick={e=>{ e.stopPropagation(); if(previewUrl) onToggle(); }}
      title={previewUrl?(active&&playing?"Pausar":"Preview"):"Sin preview"}
      style={{ width:size, height:size, borderRadius:"50%", border:"none",
        cursor:previewUrl?"pointer":"default",
        background:active?C.green:previewUrl?"#ffffff1f":"#ffffff0a",
        color:active?"#000":previewUrl?"#fff":"#555",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {active&&playing?IC.pause:IC.play}
    </button>
  );
}

function SpotifyLink({ url, size=26 }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
      style={{ width:size, height:size, borderRadius:"50%", background:"#ffffff12", color:C.green,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, textDecoration:"none" }}>
      {IC.external}
    </a>
  );
}

function HScroll({ children }) {
  return <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 20px 12px", scrollbarWidth:"none" }}>{children}</div>;
}

function SecTitle({ children, sub }) {
  return (
    <div style={{ padding:"18px 20px 6px" }}>
      <div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.3 }}>{children}</div>
      {sub && <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function TimeRangeSelector({ value, onChange }) {
  const opts = [{ v:"short_term",l:"Último mes"},{ v:"medium_term",l:"6 meses"},{ v:"long_term",l:"De siempre"}];
  return (
    <div style={{ display:"flex", gap:8, padding:"4px 20px 12px", flexWrap:"wrap" }}>
      {opts.map(o=>(
        <button key={o.v} onClick={()=>onChange(o.v)} style={{
          padding:"6px 14px", borderRadius:20, fontSize:12, cursor:"pointer",
          border:value===o.v?"none":"1px solid #ffffff22",
          background:value===o.v?C.accent:"transparent",
          color:value===o.v?"#000":C.muted, fontWeight:value===o.v?700:400,
        }}>{o.l}</button>
      ))}
    </div>
  );
}

// ── MiniPlayer ────────────────────────────────────────────────────
function MiniPlayer({ track, playing, progress, duration, onToggle, onSeek, onClose, hasNext, onNext, wide }) {
  if (!track) return null;
  const pct = duration?(progress/duration)*100:0;
  return (
    <div style={{
      position:"fixed",
      bottom: wide ? 20 : 72,
      left: wide ? 260 : "50%",
      right: wide ? 20 : "auto",
      transform: wide ? "none" : "translateX(-50%)",
      width: wide ? "auto" : "calc(100% - 20px)",
      maxWidth: wide ? "none" : 460,
      background:"linear-gradient(90deg,#1a1040ee,#2d1070ee)",
      backdropFilter:"blur(20px)", borderRadius:16, padding:"10px 14px",
      display:"flex", flexDirection:"column", gap:8,
      boxShadow:"0 8px 32px #00000099", zIndex:25,
      border:"1px solid #ffffff18",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Thumb src={track.album?.images?.[0]?.url} alt={track.name}
          style={{ width:40, height:40, borderRadius:8, objectFit:"cover", flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.name}</div>
          <div style={{ color:C.muted, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {track.artists?.map(a=>a.name).join(", ")}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <button onClick={onToggle} style={{ width:32, height:32, borderRadius:"50%", border:"none", cursor:"pointer", background:C.green, color:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {playing?IC.pause:IC.play}
          </button>
          {hasNext&&<button onClick={onNext} title="Siguiente" style={{ width:28, height:28, borderRadius:"50%", border:"none", cursor:"pointer", background:"#ffffff18", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>{IC.next}</button>}
          <SpotifyLink url={track.external_urls?.spotify} size={26} />
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#888", cursor:"pointer", display:"flex" }}>{IC.close}</button>
        </div>
      </div>
      <div style={{ height:3, background:"#ffffff22", borderRadius:2, overflow:"hidden", cursor:"pointer" }}
        onClick={e=>{ const r=e.currentTarget.getBoundingClientRect(); onSeek(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*duration); }}>
        <div style={{ height:"100%", background:C.green, borderRadius:2, width:`${pct}%` }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════
export default function SoUNdiFay() {
  const wide = useBreakpoint();

  const [token,   setToken]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab,     setTab]     = useState("home");
  const [stack,   setStack]   = useState([]);
  const push = v => setStack(s=>[...s,v]);
  const pop  = () => setStack(s=>s.slice(0,-1));
  const view = stack[stack.length-1]||null;

  const [recent,       setRecent]       = useState([]);
  const [topTracks,    setTopTracks]    = useState([]);
  const [topArtists,   setTopArtists]   = useState([]);
  const [savedAlbums,  setSavedAlbums]  = useState([]);
  const [savedTracks,  setSavedTracks]  = useState([]);
  const [playlists,    setPlaylists]    = useState([]);
  const [global50,     setGlobal50]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [globalLoading,setGlobalLoading]= useState(false);
  const [timeRange,    setTimeRange]    = useState("short_term");

  const [albumDetail,     setAlbumDetail]     = useState(null);
  const [artistDetail,    setArtistDetail]    = useState(null);
  const [artistAlbums,    setArtistAlbums]    = useState([]);
  const [artistTopTracks, setArtistTopTracks] = useState([]);
  const [relatedArtists,  setRelatedArtists]  = useState([]);
  const [playlistDetail,  setPlaylistDetail]  = useState(null);
  const [detailLoading,   setDetailLoading]   = useState(false);

  const [q,        setQ]        = useState("");
  const [srTracks, setSrTracks] = useState([]);
  const [srAlbums, setSrAlbums] = useState([]);
  const [srArtists,setSrArtists]= useState([]);

  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const [nowPlaying,setNowPlaying]= useState(null);
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [duration,  setDuration]  = useState(30);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(()=>{
    const stored = sessionStorage.getItem("spotify_token");
    if (stored){setToken(stored);return;}
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) exchangeCode(code);
  },[]);

  async function exchangeCode(code){
    const v=sessionStorage.getItem("pkce_verifier");
    const body=new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:REDIRECT_URI,client_id:CLIENT_ID,code_verifier:v});
    const r=await fetch("https://accounts.spotify.com/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});
    const d=await r.json();
    if(d.access_token){sessionStorage.setItem("spotify_token",d.access_token);setToken(d.access_token);window.history.replaceState({},"","/");}
  }
  async function login(){
    const v=randStr(64);const ch=await pkceChallenge(v);
    sessionStorage.setItem("pkce_verifier",v);
    const u=new URL("https://accounts.spotify.com/authorize");
    u.searchParams.set("client_id",CLIENT_ID);u.searchParams.set("response_type","code");
    u.searchParams.set("redirect_uri",REDIRECT_URI);u.searchParams.set("scope",SCOPES);
    u.searchParams.set("code_challenge_method","S256");u.searchParams.set("code_challenge",ch);
    window.location.href=u.toString();
  }
  function logout(){
    stopAudio();sessionStorage.removeItem("spotify_token");sessionStorage.removeItem("pkce_verifier");
    setToken(null);setProfile(null);setStack([]);
  }

  // ── Data ──────────────────────────────────────────────────────
  useEffect(()=>{
    if(!token)return;
    setLoading(true);
    Promise.all([
      api("/me",token).then(setProfile),
      api("/me/player/recently-played?limit=12",token).then(d=>setRecent(d.items||[])),
      api("/me/albums?limit=12",token).then(d=>setSavedAlbums(d.items||[])),
      api("/me/tracks?limit=30",token).then(d=>setSavedTracks(d.items||[])),
      api("/me/playlists?limit=30",token).then(d=>setPlaylists(d.items||[])),
    ]).finally(()=>setLoading(false));
  },[token]);

  useEffect(()=>{
    if(!token)return;
    api(`/me/top/tracks?limit=12&time_range=${timeRange}`,token).then(d=>setTopTracks(d.items||[]));
    api(`/me/top/artists?limit=12&time_range=${timeRange}`,token).then(d=>setTopArtists(d.items||[]));
  },[token,timeRange]);

  useEffect(()=>{
    if(tab!=="global"||!token||global50.length)return;
    setGlobalLoading(true);
    api("/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=50",token)
      .then(d=>setGlobal50((d.items||[]).map(i=>i.track).filter(Boolean)))
      .catch(()=>setGlobal50([]))
      .finally(()=>setGlobalLoading(false));
  },[tab,token]);

  // ── Search ────────────────────────────────────────────────────
  const doSearch=useCallback(async()=>{
    if(!q.trim()){setSrTracks([]);setSrAlbums([]);setSrArtists([]);return;}
    const d=await api(`/search?q=${encodeURIComponent(q)}&type=track,album,artist&limit=8`,token);
    setSrTracks(d.tracks?.items||[]);setSrAlbums(d.albums?.items||[]);setSrArtists(d.artists?.items||[]);
  },[q,token]);
  useEffect(()=>{const t=setTimeout(doSearch,450);return()=>clearTimeout(t);},[doSearch]);

  // ── Detail openers ────────────────────────────────────────────
  async function openAlbum(id){
    push({type:"album"});setDetailLoading(true);
    try{setAlbumDetail(await api(`/albums/${id}`,token));}finally{setDetailLoading(false);}
  }
  async function openArtist(id){
    push({type:"artist"});setDetailLoading(true);setArtistDetail(null);
    try{
      const[artist,albs,top,rel]=await Promise.all([
        api(`/artists/${id}`,token),
        api(`/artists/${id}/albums?limit=12&include_groups=album,single`,token),
        api(`/artists/${id}/top-tracks?market=from_token`,token),
        api(`/artists/${id}/related-artists`,token).catch(()=>({artists:[]})),
      ]);
      setArtistDetail(artist);setArtistAlbums(albs.items||[]);
      setArtistTopTracks((top.tracks||[]).slice(0,8));setRelatedArtists(rel.artists?.slice(0,8)||[]);
    }finally{setDetailLoading(false);}
  }
  async function openPlaylist(id){
    push({type:"playlist"});setDetailLoading(true);
    try{setPlaylistDetail(await api(`/playlists/${id}`,token));}finally{setDetailLoading(false);}
  }

  // ── Audio ─────────────────────────────────────────────────────
  function stopAudio(){if(audioRef.current){audioRef.current.pause();audioRef.current=null;}}
  function playNext(){
    const q=queueRef.current;const next=q.find(t=>t?.preview_url);
    if(!next){setPlaying(false);setNowPlaying(null);return;}
    queueRef.current=q.slice(q.indexOf(next)+1);mountAudio(next);
  }
  function mountAudio(track){
    stopAudio();
    const a=new Audio(track.preview_url);a.volume=0.9;
    a.ontimeupdate=()=>setProgress(a.currentTime);
    a.onloadedmetadata=()=>setDuration(a.duration||30);
    a.onended=()=>playNext();
    a.play().catch(()=>{});
    audioRef.current=a;setNowPlaying(track);setPlaying(true);setProgress(0);
  }
  function playTrack(track,list=[]){
    if(!track?.preview_url)return;
    if(nowPlaying?.id===track.id){togglePause();return;}
    const idx=list.findIndex(t=>t?.id===track.id);
    queueRef.current=idx>=0?list.slice(idx+1).filter(t=>t?.preview_url):[];
    mountAudio(track);
  }
  function togglePause(){
    if(!audioRef.current)return;
    if(playing){audioRef.current.pause();setPlaying(false);}
    else{audioRef.current.play().catch(()=>{});setPlaying(true);}
  }
  function seekTo(t){if(audioRef.current){audioRef.current.currentTime=t;setProgress(t);}}
  useEffect(()=>()=>stopAudio(),[]);

  const playingUrl=nowPlaying?.preview_url||null;
  const hasNext=queueRef.current.length>0;

  // ── Responsive grid columns ───────────────────────────────────
  const gridCols = wide ? "repeat(4,1fr)" : "repeat(3,1fr)";
  const gPad = wide ? "0 24px 12px" : "0 12px 8px";

  function Grid({ children }) {
    return <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:10, padding:gPad }}>{children}</div>;
  }
  function GridCard({ img, label, sub, emoji, onClick, children }) {
    return (
      <div onClick={onClick} style={{ borderRadius:12, overflow:"hidden", position:"relative", cursor:"pointer", aspectRatio:"1", background:"#312e81" }}>
        <Thumb src={img} alt={label} style={{ width:"100%", height:"100%", objectFit:"cover" }} emoji={emoji} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"linear-gradient(transparent,#000c)", padding:"28px 8px 8px" }}>
          <div style={{ fontSize:11, fontWeight:700, lineHeight:1.2 }}>{label}</div>
          {sub&&<div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{sub}</div>}
        </div>
        {children}
      </div>
    );
  }
  function ListItem({ img, imgRound, title, sub, sub2, emoji, onClick, children }) {
    return (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:12, padding:`8px ${wide?20:16}px`, cursor:onClick?"pointer":"default" }}>
        <Thumb src={img} alt={title} style={{ width:wide?52:48, height:wide?52:48, borderRadius:imgRound?"50%":8, objectFit:"cover", flexShrink:0 }} emoji={emoji} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:wide?15:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</div>
          {sub&&<div style={{ color:C.muted, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</div>}
          {sub2&&<div style={{ color:C.subtle, fontSize:11, marginTop:1 }}>{sub2}</div>}
        </div>
        {children}
      </div>
    );
  }

  // ── Back header (mobile detail views) ────────────────────────
  function BackHeader({ title }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px 8px",
        position:"sticky", top:0, zIndex:10, backdropFilter:"blur(12px)", background:"#08081acc" }}>
        <button onClick={pop} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", display:"flex", padding:0 }}>{IC.back}</button>
        <div style={{ fontWeight:700, fontSize:16, flex:1 }}>{title}</div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // DETAIL VIEWS
  // ═══════════════════════════════════════════════════

  function AlbumView() {
    if(detailLoading||!albumDetail)return<><BackHeader title="Álbum"/><div style={{textAlign:"center",padding:48,color:C.muted}}>Cargando…</div></>;
    const tracks=albumDetail.tracks?.items||[];
    const full=tracks.map(t=>({...t,album:albumDetail}));
    return(
      <>
        <BackHeader title="Álbum"/>
        <div style={{ display:"flex", flexDirection: wide?"row":"column", alignItems:wide?"flex-start":"center", gap:wide?32:10, padding:wide?"24px 32px":"8px 20px 16px", textAlign:wide?"left":"center" }}>
          <Thumb src={albumDetail.images?.[0]?.url} alt={albumDetail.name}
            style={{ width:wide?220:180, height:wide?220:180, borderRadius:14, objectFit:"cover", flexShrink:0, boxShadow:"0 10px 40px #00000077" }} emoji="💿"/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:wide?26:20, fontWeight:800, marginTop:wide?0:6 }}>{albumDetail.name}</div>
            <div style={{ color:C.muted, fontSize:15, cursor:"pointer", margin:"6px 0" }}
              onClick={()=>albumDetail.artists?.[0]&&openArtist(albumDetail.artists[0].id)}>
              {albumDetail.artists?.map(a=>a.name).join(", ")}
            </div>
            <div style={{ color:C.subtle, fontSize:12, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:wide?"flex-start":"center" }}>
              <span>{fmtDate(albumDetail.release_date,albumDetail.release_date_precision)}</span>
              <span>·</span><span>{albumDetail.total_tracks} canciones</span>
              <SpotifyLink url={albumDetail.external_urls?.spotify}/>
            </div>
          </div>
        </div>
        <div style={{ display: wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column", gap:wide?0:2 }}>
          {tracks.map((t,i)=>(
            <div key={t.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 20px", cursor:"pointer", borderRadius:8 }}
              onClick={()=>playTrack({...t,album:albumDetail},full)}>
              <div style={{ width:22, textAlign:"center", color:C.subtle, fontSize:13, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:nowPlaying?.id===t.id?C.green:"#fff" }}>{t.name}</div>
                <div style={{ color:C.muted, fontSize:11 }}>{t.artists?.map(a=>a.name).join(", ")} · {fmtMs(t.duration_ms)}</div>
              </div>
              <PlayBtn previewUrl={t.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack({...t,album:albumDetail},full)} size={28}/>
            </div>
          ))}
        </div>
      </>
    );
  }

  function ArtistView() {
    if(detailLoading||!artistDetail)return<><BackHeader title="Artista"/><div style={{textAlign:"center",padding:48,color:C.muted}}>Cargando…</div></>;
    const img=artistDetail.images?.[0]?.url;
    return(
      <>
        <BackHeader title="Artista"/>
        <div style={{ display:"flex", flexDirection:wide?"row":"column", alignItems:wide?"flex-start":"center", gap:wide?32:8, padding:wide?"24px 32px":"4px 20px 12px", textAlign:wide?"left":"center" }}>
          <Thumb src={img} alt={artistDetail.name}
            style={{ width:wide?160:130, height:wide?160:130, borderRadius:"50%", objectFit:"cover", flexShrink:0, boxShadow:"0 8px 32px #00000077" }} emoji="🎤"/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:wide?28:22, fontWeight:800, marginTop:wide?0:4 }}>{artistDetail.name}</div>
            <div style={{ display:"flex", gap:12, color:C.muted, fontSize:13, alignItems:"center", margin:"8px 0", flexWrap:"wrap", justifyContent:wide?"flex-start":"center" }}>
              <span>👥 {fmtNum(artistDetail.followers?.total)} seguidores</span>
              <span>·</span><span>⭐ {artistDetail.popularity}/100</span>
            </div>
            {artistDetail.genres?.length>0&&(
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:wide?"flex-start":"center" }}>
                {artistDetail.genres.slice(0,5).map(g=>(
                  <span key={g} style={{ background:"#ffffff14", color:C.muted, fontSize:10, padding:"3px 10px", borderRadius:20 }}>{g}</span>
                ))}
              </div>
            )}
            <div style={{ marginTop:10, display:"flex", justifyContent:wide?"flex-start":"center" }}>
              <SpotifyLink url={artistDetail.external_urls?.spotify} size={30}/>
            </div>
          </div>
        </div>

        <SecTitle>Canciones populares</SecTitle>
        <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column", gap:wide?0:2 }}>
          {artistTopTracks.map((t,i)=>(
            <div key={t.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 20px", cursor:"pointer" }}
              onClick={()=>playTrack(t,artistTopTracks)}>
              <div style={{ width:22, textAlign:"center", color:C.subtle, fontSize:13, flexShrink:0 }}>{i+1}</div>
              <Thumb src={t.album?.images?.[0]?.url} alt={t.name} style={{ width:40, height:40, borderRadius:6, objectFit:"cover", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:nowPlaying?.id===t.id?C.green:"#fff" }}>{t.name}</div>
                <div style={{ color:C.muted, fontSize:11 }}>{fmtMs(t.duration_ms)}</div>
              </div>
              <PlayBtn previewUrl={t.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t,artistTopTracks)} size={28}/>
            </div>
          ))}
        </div>

        {artistAlbums.length>0&&<>
          <SecTitle>Discografía</SecTitle>
          <HScroll>
            {artistAlbums.map(a=>(
              <div key={a.id} onClick={()=>openAlbum(a.id)} style={{ width:wide?130:110, flexShrink:0, cursor:"pointer" }}>
                <Thumb src={a.images?.[0]?.url} alt={a.name} style={{ width:wide?130:110, height:wide?130:110, borderRadius:10, objectFit:"cover" }} emoji="💿"/>
                <div style={{ fontSize:11, fontWeight:600, marginTop:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                <div style={{ fontSize:10, color:C.muted }}>{fmtDate(a.release_date,a.release_date_precision)}</div>
              </div>
            ))}
          </HScroll>
        </>}

        {relatedArtists.length>0&&<>
          <SecTitle>Artistas relacionados</SecTitle>
          <HScroll>
            {relatedArtists.map(a=>(
              <div key={a.id} onClick={()=>openArtist(a.id)} style={{ width:90, flexShrink:0, cursor:"pointer", textAlign:"center" }}>
                <Thumb src={a.images?.[0]?.url} alt={a.name} style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", margin:"0 auto" }} emoji="🎤"/>
                <div style={{ fontSize:10, fontWeight:600, marginTop:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
              </div>
            ))}
          </HScroll>
        </>}
      </>
    );
  }

  function PlaylistView() {
    if(detailLoading||!playlistDetail)return<><BackHeader title="Playlist"/><div style={{textAlign:"center",padding:48,color:C.muted}}>Cargando…</div></>;
    const tracks=(playlistDetail.tracks?.items||[]).map(i=>i.track).filter(Boolean);
    const img=playlistDetail.images?.[0]?.url;
    return(
      <>
        <BackHeader title="Playlist"/>
        <div style={{ display:"flex", flexDirection:wide?"row":"column", alignItems:wide?"flex-start":"center", gap:wide?32:8, padding:wide?"24px 32px":"8px 20px 16px", textAlign:wide?"left":"center" }}>
          <Thumb src={img} alt={playlistDetail.name} style={{ width:wide?200:170, height:wide?200:170, borderRadius:14, objectFit:"cover", flexShrink:0, boxShadow:"0 10px 40px #00000077" }} emoji="🎵"/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:wide?26:20, fontWeight:800, marginTop:wide?0:6 }}>{playlistDetail.name}</div>
            {playlistDetail.description&&<div style={{ color:C.muted, fontSize:12, margin:"6px 0", maxWidth:320 }} dangerouslySetInnerHTML={{__html:playlistDetail.description}}/>}
            <div style={{ color:C.subtle, fontSize:12, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", justifyContent:wide?"flex-start":"center", marginBottom:10 }}>
              <span>por {playlistDetail.owner?.display_name}</span><span>·</span>
              <span>{playlistDetail.tracks?.total} canciones</span>
              <SpotifyLink url={playlistDetail.external_urls?.spotify}/>
            </div>
            {tracks.some(t=>t?.preview_url)&&(
              <button onClick={()=>{ const f=tracks.find(t=>t?.preview_url); if(f){queueRef.current=tracks.filter(t=>t?.preview_url&&t.id!==f.id);mountAudio(f);} }}
                style={{ display:"flex", alignItems:"center", gap:8, background:C.green, color:"#000", border:"none", borderRadius:24, padding:"10px 24px", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                {IC.play} Reproducir todo
              </button>
            )}
          </div>
        </div>
        <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column" }}>
          {tracks.map((t,i)=>t?(
            <div key={t.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 20px", cursor:"pointer" }}
              onClick={()=>playTrack(t,tracks)}>
              <div style={{ width:22, textAlign:"center", color:C.subtle, fontSize:13, flexShrink:0 }}>{i+1}</div>
              <Thumb src={t.album?.images?.[0]?.url} alt={t.name} style={{ width:42, height:42, borderRadius:7, objectFit:"cover", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:nowPlaying?.id===t.id?C.green:"#fff" }}>{t.name}</div>
                <div style={{ color:C.muted, fontSize:11 }}>{t.artists?.map(a=>a.name).join(", ")} · {fmtMs(t.duration_ms)}</div>
              </div>
              <PlayBtn previewUrl={t.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t,tracks)} size={28}/>
            </div>
          ):null)}
        </div>
      </>
    );
  }

  function ProfileView() {
    const img=profile?.images?.[0]?.url;
    return(
      <>
        {!wide&&<BackHeader title="Perfil"/>}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"20px 20px 12px", gap:10 }}>
          <div style={{ width:wide?110:90, height:wide?110:90, borderRadius:"50%", overflow:"hidden", border:"3px solid #818cf833", background:"#4c1d95", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {img?<img src={img} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:IC.user}
          </div>
          <div style={{ fontSize:wide?22:20, fontWeight:800 }}>{profile?.display_name}</div>
          {profile?.email&&<div style={{ color:C.muted, fontSize:13 }}>{profile.email}</div>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"0 20px" }}>
          {[["País",profile?.country],["Cuenta",profile?.product],["Seguidores",profile?.followers?.total]].map(([l,v])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surface, borderRadius:12, padding:"13px 16px", fontSize:14 }}>
              <span>{l}</span><span style={{ color:C.muted, textTransform:"capitalize" }}>{v??"—"}</span>
            </div>
          ))}
        </div>
        <button onClick={logout} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#ef444418", color:"#f87171", border:"1px solid #ef444440", borderRadius:12, padding:"14px 16px", fontSize:15, fontWeight:600, cursor:"pointer", margin:"14px 20px 0", width:"calc(100% - 40px)" }}>
          {IC.logout} Cerrar sesión
        </button>
      </>
    );
  }

  // ═══════════════════════════════════════════════════
  // TAB CONTENTS
  // ═══════════════════════════════════════════════════

  function HomeTab() {
    return(
      <>
        <div onClick={()=>push({type:"profile"})} style={{ margin:`8px ${wide?24:14}px`, background:"linear-gradient(90deg,#312e81cc,#4c1d95cc)", borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
          <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden", background:"#4c1d95", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {profile?.images?.[0]?.url?<img src={profile.images[0].url} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:IC.user}
          </div>
          <div><div style={{ fontWeight:700, fontSize:15 }}>{profile?.display_name||"Usuario"}</div><div style={{ color:C.muted, fontSize:12 }}>Ver perfil</div></div>
          <div style={{ marginLeft:"auto", color:C.muted, fontSize:22 }}>›</div>
        </div>
        <SecTitle>Escuchadas recientemente</SecTitle>
        <Grid>
          {recent.map((item,i)=>{
            const t=item.track;
            return(
              <GridCard key={i} img={t?.album?.images?.[0]?.url} label={t?.name} emoji="🎵">
                <div style={{ position:"absolute", top:6, right:6, display:"flex", flexDirection:"column", gap:5 }}>
                  <PlayBtn previewUrl={t?.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t)} size={26}/>
                  <SpotifyLink url={t?.external_urls?.spotify} size={22}/>
                </div>
              </GridCard>
            );
          })}
        </Grid>
        <SecTitle>Tus playlists</SecTitle>
        <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column", gap:wide?0:2 }}>
          {playlists.slice(0,wide?12:8).map((p,i)=>(
            <ListItem key={p.id||i} img={p.images?.[0]?.url} title={p.name} sub={`${p.tracks?.total} canciones`} emoji="🎵" onClick={()=>openPlaylist(p.id)}>
              <div style={{ color:C.subtle, fontSize:18 }}>›</div>
            </ListItem>
          ))}
        </div>
      </>
    );
  }

  function ExploreTab() {
    return(
      <>
        <SecTitle>Más escuchadas</SecTitle>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange}/>
        <Grid>
          {topTracks.map((t,i)=>(
            <GridCard key={t.id||i} img={t?.album?.images?.[0]?.url} label={t?.name} sub={t?.artists?.[0]?.name} emoji="🎵">
              <div style={{ position:"absolute", top:6, right:6, display:"flex", flexDirection:"column", gap:5 }}>
                <PlayBtn previewUrl={t?.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t,topTracks)} size={26}/>
              </div>
            </GridCard>
          ))}
        </Grid>
      </>
    );
  }

  function ArtistsTab() {
    return(
      <>
        <SecTitle>Tus artistas top</SecTitle>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange}/>
        <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column", gap:wide?0:2 }}>
          {topArtists.map((a,i)=>(
            <ListItem key={a.id||i} img={a?.images?.[0]?.url} imgRound title={a?.name} sub={a?.genres?.[0]||"Artista"} emoji="🎤" onClick={()=>openArtist(a.id)}>
              <SpotifyLink url={a?.external_urls?.spotify} size={26}/>
            </ListItem>
          ))}
        </div>
      </>
    );
  }

  function GlobalTab() {
    if(globalLoading)return<div style={{ textAlign:"center", padding:48, color:C.muted }}>Cargando Top 50 Global…</div>;
    return(
      <>
        <SecTitle sub="Actualizado por Spotify diariamente">🌍 Top 50 Global</SecTitle>
        <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column" }}>
          {global50.map((t,i)=>(
            <div key={t.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:`8px ${wide?20:16}px` }}>
              <div style={{ width:26, textAlign:"center", flexShrink:0 }}>
                {i<3?<span style={{ fontSize:18 }}>{["🥇","🥈","🥉"][i]}</span>
                    :<span style={{ color:C.subtle, fontSize:13, fontWeight:600 }}>{i+1}</span>}
              </div>
              <Thumb src={t.album?.images?.[0]?.url} alt={t.name} style={{ width:46, height:46, borderRadius:7, objectFit:"cover", flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }} onClick={()=>t.artists?.[0]&&openArtist(t.artists[0].id)}>
                <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:nowPlaying?.id===t.id?C.green:"#fff" }}>{t.name}</div>
                <div style={{ color:C.muted, fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"pointer" }}>
                  {t.artists?.map(a=>a.name).join(", ")} · {fmtMs(t.duration_ms)}
                </div>
              </div>
              <PlayBtn previewUrl={t.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t,global50)} size={28}/>
              <SpotifyLink url={t.external_urls?.spotify} size={26}/>
            </div>
          ))}
        </div>
      </>
    );
  }

  function FavoritesTab() {
    return(
      <>
        <SecTitle>Canciones favoritas</SecTitle>
        <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column", gap:wide?0:2 }}>
          {savedTracks.map((item,i)=>{
            const t=item.track;
            return(
              <ListItem key={t?.id||i} img={t?.album?.images?.[0]?.url} title={t?.name} sub={t?.artists?.map(a=>a.name).join(", ")} sub2={fmtDate(t?.album?.release_date,t?.album?.release_date_precision)} emoji="🎵">
                <PlayBtn previewUrl={t?.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t,savedTracks.map(i=>i.track))} size={30}/>
                <SpotifyLink url={t?.external_urls?.spotify} size={26}/>
              </ListItem>
            );
          })}
        </div>
      </>
    );
  }

  function SearchTab() {
    return(
      <>
        <div style={{ padding:`12px ${wide?24:16}px 4px` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fff", borderRadius:50, padding:"10px 20px" }}>
            <span style={{ color:"#666" }}>{IC.search}</span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Canciones, artistas, álbumes…"
              style={{ flex:1, border:"none", outline:"none", fontSize:15, background:"transparent", color:"#111" }}/>
            {q&&<button onClick={()=>setQ("")} style={{ border:"none", background:"none", cursor:"pointer", color:"#666", fontSize:18 }}>✕</button>}
          </div>
        </div>
        {srArtists.length>0&&<>
          <SecTitle>Artistas</SecTitle>
          <HScroll>{srArtists.map(a=>(
            <div key={a.id} onClick={()=>openArtist(a.id)} style={{ width:90, flexShrink:0, cursor:"pointer", textAlign:"center" }}>
              <Thumb src={a.images?.[0]?.url} alt={a.name} style={{ width:74, height:74, borderRadius:"50%", objectFit:"cover", margin:"0 auto" }} emoji="🎤"/>
              <div style={{ fontSize:10, fontWeight:600, marginTop:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
            </div>
          ))}</HScroll>
        </>}
        {srAlbums.length>0&&<>
          <SecTitle>Álbumes</SecTitle>
          <Grid>{srAlbums.map((a,i)=>(
            <GridCard key={a.id||i} img={a.images?.[0]?.url} label={a.name} sub={fmtDate(a.release_date,a.release_date_precision)} emoji="💿" onClick={()=>openAlbum(a.id)}>
              <div style={{ position:"absolute", top:6, right:6 }}><SpotifyLink url={a.external_urls?.spotify} size={22}/></div>
            </GridCard>
          ))}</Grid>
        </>}
        {srTracks.length>0&&<>
          <SecTitle>Canciones</SecTitle>
          <div style={{ display:wide?"grid":"flex", gridTemplateColumns:wide?"1fr 1fr":"unset", flexDirection:wide?"unset":"column", gap:wide?0:2 }}>
            {srTracks.map((t,i)=>(
              <ListItem key={t.id||i} img={t.album?.images?.[0]?.url} title={t.name} sub={t.artists?.map(a=>a.name).join(", ")} sub2={fmtDate(t.album?.release_date,t.album?.release_date_precision)} emoji="🎵">
                <PlayBtn previewUrl={t.preview_url} playingUrl={playingUrl} playing={playing} onToggle={()=>playTrack(t,srTracks)} size={30}/>
                <SpotifyLink url={t.external_urls?.spotify} size={26}/>
              </ListItem>
            ))}
          </div>
        </>}
        {q&&!srTracks.length&&!srAlbums.length&&!srArtists.length&&(
          <div style={{ textAlign:"center", padding:48, color:C.muted }}>Sin resultados para "{q}"</div>
        )}
      </>
    );
  }

  // ═══════════════════════════════════════════════════
  // TABS CONFIG
  // ═══════════════════════════════════════════════════
  const TABS = [
    { id:"explore",   label:"Explorar",  icon:IC.explore },
    { id:"artists",   label:"Artistas",  icon:IC.artists },
    { id:"home",      label:"Inicio",    icon:IC.home },
    { id:"global",    label:"Global",    icon:IC.globe },
    { id:"favorites", label:"Favoritos", icon:IC.favorites },
  ];

  // ═══════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════
  if(!token) return(
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:32, padding:"40px 24px", background:"linear-gradient(160deg,#08081a 0%,#1a0060 60%,#0d0d2b 100%)" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:wide?64:52, fontWeight:900, letterSpacing:-2, lineHeight:1.1 }}>SoUNd<br/><span style={{ color:C.accent }}>iFay</span></div>
        <div style={{ color:C.muted, fontSize:13, letterSpacing:3, textTransform:"uppercase", marginTop:8 }}>Tu música, tu mundo</div>
      </div>
      <button onClick={login} style={{ display:"flex", alignItems:"center", gap:12, background:C.green, color:"#000", fontWeight:700, fontSize:16, padding:"16px 32px", borderRadius:50, border:"none", cursor:"pointer", boxShadow:`0 4px 24px ${C.green}44` }}>
        {IC.spotify} Conectar con Spotify
      </button>
    </div>
  );

  if(loading) return(
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:C.bg, color:C.muted, fontSize:16 }}>
      Cargando tu música…
    </div>
  );

  // ── Active detail content (used in both layouts) ──────────────
  function DetailContent() {
    if(!view) return null;
    if(view.type==="album")    return <AlbumView/>;
    if(view.type==="artist")   return <ArtistView/>;
    if(view.type==="playlist") return <PlaylistView/>;
    if(view.type==="profile")  return <ProfileView/>;
    return null;
  }

  // ── Tab content ───────────────────────────────────────────────
  function TabContent() {
    if(tab==="home")      return <HomeTab/>;
    if(tab==="explore")   return <ExploreTab/>;
    if(tab==="artists")   return <ArtistsTab/>;
    if(tab==="global")    return <GlobalTab/>;
    if(tab==="favorites") return <FavoritesTab/>;
    if(tab==="search")    return <SearchTab/>;
    return null;
  }

  // ═══════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ═══════════════════════════════════════════════════
  if(wide) return(
    <div style={{ minHeight:"100vh", background:C.bg, color:"#fff", fontFamily:"'Segoe UI',sans-serif", display:"flex" }}>

      {/* Sidebar */}
      <div style={{ width:240, flexShrink:0, background:"#0a0a1ecc", backdropFilter:"blur(20px)", borderRight:"1px solid #ffffff0f", display:"flex", flexDirection:"column", position:"fixed", top:0, bottom:0, left:0, zIndex:30, overflowY:"auto" }}>
        <div style={{ padding:"28px 24px 16px" }}>
          <div style={{ fontSize:24, fontWeight:900, letterSpacing:-1 }}>SoUNd<span style={{ color:C.accent }}>iFay</span></div>
        </div>

        <nav style={{ flex:1, padding:"8px 12px", display:"flex", flexDirection:"column", gap:2 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{ setTab(t.id); setStack([]); }}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, border:"none", cursor:"pointer", width:"100%", textAlign:"left", fontSize:14, fontWeight:tab===t.id&&!view?600:400,
                background:tab===t.id&&!view?"#ffffff14":"transparent",
                color:tab===t.id&&!view?"#fff":C.subtle }}>
              {t.icon}{t.label}
            </button>
          ))}
          <button onClick={()=>{ setTab("search"); setStack([]); }}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, border:"none", cursor:"pointer", width:"100%", textAlign:"left", fontSize:14, fontWeight:tab==="search"&&!view?600:400,
              background:tab==="search"&&!view?"#ffffff14":"transparent",
              color:tab==="search"&&!view?"#fff":C.subtle }}>
            {IC.search} Buscar
          </button>
        </nav>

        {/* Profile in sidebar */}
        <div style={{ padding:"16px 12px", borderTop:"1px solid #ffffff0f" }}>
          <div onClick={()=>push({type:"profile"})} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, cursor:"pointer", background:view?.type==="profile"?"#ffffff14":"transparent" }}>
            <div style={{ width:34, height:34, borderRadius:"50%", overflow:"hidden", background:"#4c1d95", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {profile?.images?.[0]?.url?<img src={profile.images[0].url} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:IC.user}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile?.display_name}</div>
              <div style={{ color:C.muted, fontSize:11 }}>Ver perfil</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ marginLeft:240, flex:1, overflowY:"auto", minHeight:"100vh", paddingBottom:120 }}>
        {view ? <DetailContent/> : <TabContent/>}
      </div>

      <MiniPlayer track={nowPlaying} playing={playing} progress={progress} duration={duration}
        onToggle={togglePause} onSeek={seekTo}
        onClose={()=>{ stopAudio(); setNowPlaying(null); setPlaying(false); }}
        hasNext={hasNext} onNext={playNext} wide={true}/>
    </div>
  );

  // ═══════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ═══════════════════════════════════════════════════
  return(
    <div style={{ minHeight:"100vh", background:C.bg, color:"#fff", fontFamily:"'Segoe UI',sans-serif", maxWidth:480, margin:"0 auto", position:"relative", paddingBottom:160 }}>

      {view ? (
        <div style={{ minHeight:"100vh" }}><DetailContent/></div>
      ) : (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 8px", position:"sticky", top:0, zIndex:10, backdropFilter:"blur(12px)", background:"#08081acc" }}>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:-1 }}>SoUNd<span style={{ color:C.accent }}>iFay</span></div>
            <div style={{ display:"flex", gap:16, color:C.muted }}>
              <span style={{ cursor:"pointer" }} onClick={()=>setTab("search")}>{IC.search}</span>
              <span>{IC.bell}</span>
              <span style={{ cursor:"pointer" }} onClick={()=>push({type:"profile"})}>{IC.user}</span>
            </div>
          </div>
          <TabContent/>
        </>
      )}

      <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#0d0d2bee", backdropFilter:"blur(14px)", borderTop:"1px solid #312e8140", display:"flex", justifyContent:"space-around", padding:"10px 0 16px", zIndex:20 }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{ setTab(t.id); setStack([]); }}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", background:"none", border:"none", fontSize:9, color:tab===t.id&&!view?C.accent:"#6b7280" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </nav>

      <MiniPlayer track={nowPlaying} playing={playing} progress={progress} duration={duration}
        onToggle={togglePause} onSeek={seekTo}
        onClose={()=>{ stopAudio(); setNowPlaying(null); setPlaying(false); }}
        hasNext={hasNext} onNext={playNext} wide={false}/>
    </div>
  );
}