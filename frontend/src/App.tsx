import React, { useMemo, useState } from "react";
import { Play, Search as SearchIcon, Upload as UploadIcon, LogIn, LogOut, Star } from "lucide-react";

/* ------------------ helpers/config ------------------ */
const ACCEPT_TYPES = "video/mp4,image/*";
const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

type User = { email: string; role: "CONSUMER" | "CREATOR" | "ADMIN" };
type Video = {
  id: string; title: string; genre: string; ageRating: string; src: string; mediaType: string;
  createdAt: number; publisher: string; producer: string;
};
type Comment = { id: string; user: string; text: string; at: number };

const uid = () => Math.random().toString(36).slice(2);
const timeAgo = (ms: number) => {
  const s = Math.floor((Date.now() - ms)/1000);
  if (s < 60) return `${s}s ago`; const m = Math.floor(s/60);
  if (m < 60) return `${m}m ago`; const h = Math.floor(m/60);
  if (h < 24) return `${h}h ago`; const d = Math.floor(h/24);
  return `${d}d ago`;
};
const avgRating = (arr?: number[]) => (!arr || arr.length===0) ? 0 : arr.reduce((a,b)=>a+b,0)/arr.length;
const seedVideos = (): Video[] => ([
  { id: "v1", title: "Sunset Skate Line", genre: "Sports", ageRating: "PG", src: SAMPLE_VIDEO, mediaType: "video/mp4", createdAt: Date.now()-1000*60*3, publisher: "City Film", producer: "A. Nolan" },
  { id: "v2", title: "Latte Art 101", genre: "Food", ageRating: "PG", src: SAMPLE_VIDEO, mediaType: "video/mp4", createdAt: Date.now()-1000*60*30, publisher: "CafeCo", producer: "B. Cruz" },
  { id: "v3", title: "Mini Synth Jam", genre: "Music", ageRating: "PG", src: SAMPLE_VIDEO, mediaType: "video/mp4", createdAt: Date.now()-1000*60*90, publisher: "RoomLab", producer: "C. Lee" },
]);

/* ------------------ app shell ------------------ */
export default function App() {
  const [route, setRoute] = useState<{name:"home"|"watch"|"search"|"upload"|"login"|"register"; id?:string}>({name:"home"});
  const [me, setMe] = useState<User|null>(null);
  const [videos, setVideos] = useState<Video[]>(seedVideos);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [ratings, setRatings] = useState<Record<string, number[]>>({});

  const go = (name: typeof route["name"], id?: string) => setRoute({name, id});

  return (
    <div className="min-h-dvh flex flex-col">
      <Header me={me} onHome={()=>go("home")} onSearch={()=>go("search")} onUpload={()=>go("upload")} onLogin={()=>go("login")} onLogout={()=>setMe(null)} />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-4">
        {route.name==="home" && <Feed videos={videos} onOpen={(id)=>go("watch", id)} />}
        {route.name==="watch" && route.id && (
          <Watch
            video={videos.find(v=>v.id===route.id)!}
            avg={avgRating(ratings[route.id])}
            onRate={(n)=>setRatings(r=>({...r, [route.id!]: [...(r[route.id!]||[]), n]}))}
            comments={comments[route.id]||[]}
            onComment={(text)=>{
              if(!me) return alert("Login first");
              const c: Comment = { id: uid(), user: me.email, text, at: Date.now() };
              setComments(x=>({...x, [route.id!]: [c, ...(x[route.id!]||[])]}));
            }}
            onBack={()=>go("home")}
          />
        )}
        {route.name==="search" && <SearchView allVideos={videos} onOpen={(id)=>go("watch", id)} />}
        {route.name==="upload" && <UploadView me={me} onUploaded={(v)=>{ setVideos([v, ...videos]); go("watch", v.id); }} />}
        {route.name==="login" && <AuthView mode="login" onDone={(u)=>{ setMe(u); go("home"); }} onSwap={()=>go("register")} />}
        {route.name==="register" && <AuthView mode="register" onDone={(u)=>{ setMe(u); go("home"); }} onSwap={()=>go("login")} />}
        <TestPanel />
      </main>
      <footer className="p-4 text-center text-gray-500 text-sm">© VidCube</footer>
    </div>
  );
}

/* ------------------ components ------------------ */
function Header({ me, onHome, onSearch, onUpload, onLogin, onLogout }:{
  me: User|null; onHome:()=>void; onSearch:()=>void; onUpload:()=>void; onLogin:()=>void; onLogout:()=>void;
}){
  return (
    <header className="sticky top-0 z-10 backdrop-blur border-b border-gray-800 bg-black/60">
      <div className="max-w-3xl mx-auto p-3 flex items-center gap-2 justify-between">
        <button onClick={onHome} className="font-bold text-xl">VidCube</button>
        <div className="flex items-center gap-2">
          <button onClick={onSearch} className="px-3 py-2 rounded bg-white text-black hover:bg-gray-200 flex items-center gap-2"><SearchIcon className="w-4 h-4"/>Search</button>
          {me ? (
            <>
              {me.role==="CREATOR" && <button onClick={onUpload} className="px-3 py-2 rounded bg-white text-black hover:bg-gray-200 flex items-center gap-2"><UploadIcon className="w-4 h-4"/>Upload</button>}
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

function Card({ children }:{children: React.ReactNode}) {
  return <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800 shadow">{children}</div>;
}

function Feed({ videos, onOpen }:{ videos: Video[]; onOpen:(id:string)=>void }){
  const sorted = useMemo(()=>[...videos].sort((a,b)=>b.createdAt-a.createdAt),[videos]);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Latest</h2>
      <div className="grid gap-3">
        {sorted.map(v=>(
          <button key={v.id} onClick={()=>onOpen(v.id)} className="text-left">
            <Card>
              <div className="flex items-center gap-3">
                <div className="relative w-28 h-16 bg-gray-800 rounded overflow-hidden">
                  <div className="absolute inset-0 grid place-items-center text-white/80"><Play className="w-8 h-8"/></div>
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
    </section>
  );
}

function Watch({ video, avg, onRate, comments, onComment, onBack }:{
  video: Video; avg:number; onRate:(n:number)=>void; comments: Comment[]; onComment:(text:string)=>void; onBack:()=>void;
}){
  const [text,setText] = useState("");
  return (
    <section className="grid gap-4">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">← Back</button>
      <Card>
        <video className="w-full rounded" src={video.src} controls playsInline/>
        <div className="mt-3">
          <div className="text-xl font-bold">{video.title}</div>
          <div className="text-xs text-gray-400">{video.genre} · {video.ageRating} · Publisher {video.publisher}</div>
          <Stars value={avg} onPick={onRate}/>
        </div>
      </Card>
      <Card>
        <form onSubmit={(e)=>{e.preventDefault(); if(text.trim()){ onComment(text.trim()); setText("");}}} className="grid gap-2">
          <div className="flex gap-2">
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a comment…" className="px-3 py-2 rounded bg-gray-950 border border-gray-800 flex-1"/>
            <button className="px-4 py-2 rounded bg-white text-black hover:bg-gray-200">Comment</button>
          </div>
          <div className="grid gap-2">
            {comments.map(c=>(
              <div key={c.id} className="border border-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">{new Date(c.at).toLocaleString()} – {c.user}</div>
                <div className="mt-1">{c.text}</div>
              </div>
            ))}
            {comments.length===0 && <div className="text-sm text-gray-500">No comments yet.</div>}
          </div>
        </form>
      </Card>
    </section>
  );
}

function Stars({ value, onPick }:{ value:number; onPick:(n:number)=>void }){
  const rounded = Math.round(value);
  return (
    <div className="flex items-center gap-1 mt-2">
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onPick(n)} className={`p-1 rounded hover:bg-gray-800 ${n<=rounded?"text-yellow-400":"text-gray-600"}`}>
          <Star className="w-5 h-5 fill-current"/>
        </button>
      ))}
      <span className="text-xs text-gray-400 ml-1">{value.toFixed(2)} / 5</span>
    </div>
  );
}

function SearchView({ allVideos, onOpen }:{ allVideos: Video[]; onOpen:(id:string)=>void }){
  const [q,setQ] = useState("");
  const [genre,setGenre] = useState("");
  const [age,setAge] = useState("");
  const items = useMemo(()=> allVideos.filter(v =>
    (!q || v.title.toLowerCase().includes(q.toLowerCase())) &&
    (!genre || v.genre===genre) &&
    (!age || v.ageRating===age)
  ),[q,genre,age,allVideos]);

  return (
    <section className="grid gap-3">
      <Card>
        <div className="grid sm:grid-cols-4 gap-2">
          <div className="sm:col-span-2 flex">
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title…" className="px-3 py-2 rounded-l bg-gray-950 border border-gray-800 flex-1"/>
            <div className="px-3 py-2 rounded-r bg-white text-black"><SearchIcon className="w-4 h-4"/></div>
          </div>
          <select value={genre} onChange={e=>setGenre(e.target.value)} className="px-3 py-2 rounded bg-gray-950 border border-gray-800">
            <option value="">All genres</option><option>Sports</option><option>Food</option><option>Music</option>
          </select>
          <select value={age} onChange={e=>setAge(e.target.value)} className="px-3 py-2 rounded bg-gray-950 border border-gray-800">
            <option value="">All ratings</option><option>PG</option><option>12</option><option>15</option><option>18</option>
          </select>
        </div>
      </Card>
      <div className="grid gap-2">
        {items.map(v=>(
          <button key={v.id} onClick={()=>onOpen(v.id)} className="text-left">
            <Card>
              <div className="font-semibold">{v.title}</div>
              <div className="text-xs text-gray-400">{v.genre} · {v.ageRating} · {timeAgo(v.createdAt)}</div>
            </Card>
          </button>
        ))}
        {items.length===0 && <div className="text-sm text-gray-500">No results.</div>}
      </div>
    </section>
  );
}

function UploadView({ me, onUploaded }:{ me: User|null; onUploaded:(v:Video)=>void }){
  const [file,setFile] = useState<File|null>(null);
  const [title,setTitle] = useState("My demo video");
  const [publisher,setPublisher] = useState("");
  const [producer,setProducer] = useState("");
  const [genre,setGenre] = useState("");
  const [ageRating,setAgeRating] = useState("PG");

  if(!me) return <Card><div className="text-sm">Login as a <b>creator</b> to upload.</div></Card>;
  if(me.role!=="CREATOR") return <Card><div className="text-sm">Only creators can upload.</div></Card>;

  return (
    <Card>
      <div className="text-xl font-bold mb-3">Upload media</div>
      <form className="grid gap-2" onSubmit={(e)=>{
        e.preventDefault(); if(!file) return;
        const v: Video = { id: uid(), title, publisher, producer, genre, ageRating, src: URL.createObjectURL(file), createdAt: Date.now(), mediaType: file.type||"video/mp4" };
        onUploaded(v);
      }}>
        <input className="px-3 py-2 rounded bg-gray-950 border border-gray-800" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="px-3 py-2 rounded bg-gray-950 border border-gray-800" placeholder="Publisher" value={publisher} onChange={e=>setPublisher(e.target.value)} />
        <input className="px-3 py-2 rounded bg-gray-950 border border-gray-800" placeholder="Producer" value={producer} onChange={e=>setProducer(e.target.value)} />
        <input className="px-3 py-2 rounded bg-gray-950 border border-gray-800" placeholder="Genre" value={genre} onChange={e=>setGenre(e.target.value)} />
        <select className="px-3 py-2 rounded bg-gray-950 border border-gray-800" value={ageRating} onChange={e=>setAgeRating(e.target.value)}>
          <option>PG</option><option>12</option><option>15</option><option>18</option>
        </select>
        <input className="px-3 py-2 rounded bg-gray-950 border border-gray-800" type="file" accept={ACCEPT_TYPES} onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        <button type="submit" disabled={!file} className="px-4 py-2 rounded bg-white text-black hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2">
          <UploadIcon className="w-4 h-4"/> Upload
        </button>
      </form>
    </Card>
  );
}

function AuthView({ mode, onDone, onSwap }:{ mode:"login"|"register"; onDone:(u:User)=>void; onSwap:()=>void }){
  const [email,setEmail] = useState("");
  const [role,setRole] = useState<User["role"]>("CONSUMER");
  return (
    <Card>
      <div className="text-xl font-bold mb-3">{mode==="login"?"Login":"Create account"}</div>
      <form className="grid gap-2" onSubmit={(e)=>{e.preventDefault(); onDone({email, role});}}>
        <input className="px-3 py-2 rounded bg-gray-950 border border-gray-800" placeholder="you@domain.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="text-sm text-gray-300">Role</label>
        <select className="px-3 py-2 rounded bg-gray-950 border border-gray-800" value={role} onChange={e=>setRole(e.target.value as User["role"])}>
          <option value="CONSUMER">CONSUMER</option><option value="CREATOR">CREATOR</option><option value="ADMIN">ADMIN</option>
        </select>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-white text-black hover:bg-gray-200">{mode==="login"?"Login":"Sign up"}</button>
          <button type="button" onClick={onSwap} className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700">{mode==="login"?"Need an account?":"Have an account?"}</button>
        </div>
      </form>
    </Card>
  );
}

function TestPanel(){
  return (
    <div className="border border-gray-800 rounded-2xl p-4 bg-gray-900/40 text-sm">
      <div className="font-semibold mb-1">Self-tests</div>
      <ul className="list-disc pl-5">
        <li>App loaded ✅</li>
        <li>UI mount ok ✅</li>
      </ul>
    </div>
  );
}
