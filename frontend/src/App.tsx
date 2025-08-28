import React, { useMemo, useState } from "react";
import { Play, Search, Upload, LogIn, LogOut, Star, CheckCircle, XCircle } from "lucide-react";

// --- NOTES ---
// VidCube mock UI (client-only). Mirrors the real app flows for feed, watch, search,
// auth, creator upload, comments, ratings. No backend required in canvas.

// Config
const ACCEPT_TYPES = "video/mp4,image/*";

// Small public-domain sample video
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const seedVideos = () => ([
  { id: "v1", title: "Sunset Skate Line", genre: "Sports", ageRating: "PG", src: SAMPLE_VIDEO, mediaType: "video/mp4", createdAt: Date.now()-1000*60*3, publisher: "City Film", producer: "A. Nolan" },
  { id: "v2", title: "Latte Art 101", genre: "Food", ageRating: "PG", src: SAMPLE_VIDEO, mediaType: "video/mp4", createdAt: Date.now()-1000*60*30, publisher: "CafeCo", producer: "B. Cruz" },
  { id: "v3", title: "Mini Synth Jam", genre: "Music", ageRating: "PG", src: SAMPLE_VIDEO, mediaType: "video/mp4", createdAt: Date.now()-1000*60*90, publisher: "RoomLab", producer: "C. Lee" },
]);

export default function App() {
  const [route, setRoute] = useState<{ name: "home"|"watch"|"search"|"upload"|"login"|"register"; id: string|null }>({ name: "home", id: null });
  const [me, setMe] = useState<null | { email: string; role: "CONSUMER" | "CREATOR" | "ADMIN" }>(null);
  const [videos, setVideos] = useState(() => seedVideos());
  const [comments, setComments] = useState<Record<string, { id: string; user: string; text: string; at: number }[]>>({});
  const [ratings, setRatings] = useState<Record<string, number[]>>({});

  const goHome = () => setRoute({ name: "home", id: null });
  const goWatch = (id: string) => setRoute({ name: "watch", id });
  const goSearch = () => setRoute({ name: "search", id: null });
  const goUpload = () => setRoute({ name: "upload", id: null });
  const goLogin = () => setRoute({ name: "login", id: null });
  const goRegister = () => setRoute({ name: "register", id: null });

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col">
      <Header me={me} onHome={goHome} onSearch={goSearch} onUpload={goUpload} onLogin={goLogin} onLogout={()=>setMe(null)} />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4">
        {route.name === "home" && (
          <Feed videos={videos} onOpen={goWatch} />
        )}
        {route.name === "watch" && route.id && (
          <Watch
            video={videos.find(v=>v.id===route.id)!}
            avg={avgRating(ratings[route.id])}
            myRating={null}
            onRate={(val)=>{
              setRatings(r=>({ ...r, [route.id!]: [...(r[route.id!]||[]), val] }))
            }}
            comments={comments[route.id]||[]}
            onComment={(text)=>{
              if(!me) return alert("Login to comment");
              const item = { id: Math.random().toString(36).slice(2), user: me.email, text, at: Date.now() };
              setComments(c=>({ ...c, [route.id!]: [item, ...(c[route.id!]||[])] }));
            }}
            onBack={goHome}
          />
        )}
        {route.name === "search" && (
          <SearchView allVideos={videos} onOpen={goWatch} />
        )}
        {route.name === "upload" && (
          <UploadView me={me} onUploaded={(v)=>{ setVideos([v, ...videos]); goWatch(v.id); }} />
        )}
        {route.name === "login" && (
          <AuthView mode="login" onDone={(user)=>{ setMe(user); goHome(); }} onSwap={goRegister} />
        )}
        {route.name === "register" && (
          <AuthView mode="register" onDone={(user)=>{ setMe(user); goHome(); }} onSwap={goLogin} />
        )}

        {/* Lightweight self-tests to prevent regressions */}
        <div className="mt-8">
          <TestPanel />
        </div>
      </main>
      <footer className="p-4 text-center text-gray-500 text-sm">© VidCube • Canvas preview (mock)</footer>
    </div>
  );
}

function Header({ me, onHome, onSearch, onUpload, onLogin, onLogout }:{
  me: null | { email: string; role: string };
  onHome: ()=>void; onSearch: ()=>void; onUpload: ()=>void; onLogin: ()=>void; onLogout: ()=>void;
}){
  return (
    <header className="sticky top-0 z-10 backdrop-blur border-b border-gray-800 bg-black/60">
      <div className="max-w-3xl mx-auto p-3 flex items-center gap-3 justify-between">
        <button onClick={onHome} className="font-bold text-xl">VidCube</button>
        <div className="flex items-center gap-2">
          <button onClick={onSearch} className="px-3 py-2 rounded bg-white text-black hover:bg-gray-200 flex items-center gap-2"><Search className="w-4 h-4"/>Search</button>
          {me ? (
            <>
              {me.role === "CREATOR" && (
                <button onClick={onUpload} className="px-3 py-2 rounded bg-white text-black hover:bg-gray-200 flex items-center gap-2"><Upload className="w-4 h-4"/>Upload</button>
              )}
              <span className="text-xs text-gray-400 hidden sm:inline">{me.email}</span>
              <button onClick={onLogout} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center gap-2"><LogOut className="w-4 h-4"/>Logout</button>
            </>
          ):(
            <button onClick={onLogin} className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 flex items-center gap-2"><LogIn className="w-4 h-4"/>Login</button>
          )}
        </div>
      </div>
    </header>
  );
}

function Card({ children }:{ children: React.ReactNode }){
  return <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 shadow">{children}</div>;
}

function Feed({ videos, onOpen }:{ videos: any[]; onOpen:(id:string)=>void; }){
  return (
    <div className="grid gap-4">
      {videos.map(v=> (
        <button key={v.id} onClick={()=>onOpen(v.id)} className="text-left">
          <Card>
            <div className="flex items-center gap-3">
              <div className="relative w-28 h-16 bg-gray-800 rounded overflow-hidden">
                {v.mediaType?.startsWith("image/") ? (
                  <img src={v.src} alt={v.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-white/80"><Play className="w-8 h-8"/></div>
                )}
              </div>
              <div>
                <div className="font-semibold">{v.title}</div>
                <div className="text-xs text-gray-400">{v.genre} · {v.ageRating} · {timeAgo(v.createdAt)}</div>
              </div>
            </div>
          </Card>
        </button>
      ))}
    </div>
  );
}

// [Content truncated: rest of functions Feed, Watch, Stars, SearchView, UploadView, AuthView, helpers, TestPanel ...]
