const { useEffect, useMemo, useRef, useState } = React;

const DEFAULT_VERSES = [
  {"id":1,"reference":"John 3:16","verse":"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."},
  {"id":2,"reference":"Jeremiah 29:11","verse":"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
  {"id":3,"reference":"Philippians 4:13","verse":"I can do all things through Christ who strengthens me."},
  {"id":4,"reference":"Romans 8:37","verse":"No in all these things we are more than conquerors through Him who loved us."},
  {"id":5,"reference":"Romans 12:2","verse":"Do not be conformed by the pattern of this world, but be transformed by the renewing of your mind so that you may be able to test God's will, His good, pleasing, and perfect will."},
  {"id":6,"reference":"Romans 10:9","verse":"If we confess with our mouth that Jesus is Lord and believe in your heart that God raised Him from the dead, you will be saved."}
];

const STORAGE = {
  known: "bible-memorized-ids",
  idx: "bible-current-index",
  settings: "bible-settings"
};
const read  = (k,f)=>{ try{const v=localStorage.getItem(k); return v?JSON.parse(v):f;}catch{return f;} };
const write = (k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} };

/* ---------- Minimal inline SVG icons (no external deps) ---------- */
const Svg = ({ children, className = "", viewBox = "0 0 24 24" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
const IconShuffle = (p) => (
  <Svg {...p}>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="15" y2="9" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Svg>
);
const IconChevronLeft  = (p) => <Svg {...p}><polyline points="15 18 9 12 15 6"/></Svg>;
const IconChevronRight = (p) => <Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>;
const IconEye = (p) => (
  <Svg {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </Svg>
);
const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M3 3l18 18"/>
    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"/>
    <path d="M16.24 16.24A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.74 21.74 0 0 1 5.06-5.94"/>
    <path d="M9.88 4.12A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.88 21.88 0 0 1-3.12 4.19"/>
  </Svg>
);
const IconCopy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </Svg>
);
const IconList = (p) => (
  <Svg {...p}>
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3" y2="6"></line>
    <line x1="3" y1="12" x2="3" y2="12"></line>
    <line x1="3" y1="18" x2="3" y2="18"></line>
  </Svg>
);
const IconBookOpenCheck = (p) => (
  <Svg {...p}>
    <path d="M12 20c-3.5-2-8-2-10-2V6c2-.14 6.5 0 10 2 3.5-2 8-2 10-2v12c-2 0-6.5 0-10 2Z"/>
    <path d="m9 13 2 2 4-4"/>
  </Svg>
);
const IconCheck = (p) => <Svg {...p}><polyline points="20 6 9 17 4 12" /></Svg>;
const IconRefresh = (p) => (
  <Svg {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </Svg>
);
/* Filter + Layers icons */
const IconFilter = (p) => (
  <Svg {...p}>
    <path d="M3 5h18" />
    <path d="M6 12h12" />
    <path d="M10 19h4" />
  </Svg>
);
const IconLayers = (p) => (
  <Svg {...p}>
    <polygon points="12 2 22 8 12 14 2 8 12 2" />
    <polyline points="2 12 12 18 22 12" />
    <polyline points="2 16 12 22 22 16" />
  </Svg>
);
/* Palette icon */
const IconPalette = (p) => (
  <Svg {...p}>
    <path d="M12 22a10 10 0 1 1 10-10c0 1.1-.9 2-2 2h-1a2 2 0 0 0-2 2 4 4 0 0 1-4 4Z" />
    <circle cx="7.5" cy="10.5" r="1.5" />
    <circle cx="12"  cy="7.5"  r="1.5" />
    <circle cx="16.5" cy="10.5" r="1.5" />
  </Svg>
);

/* ---------- Theme class presets (Tailwind) ---------- */
const THEMES = {
  default: "from-amber-50 via-rose-50 to-sky-50",
  sunset:  "from-pink-200 via-red-300 to-yellow-200",
  ocean:   "from-sky-200 via-blue-300 to-indigo-400",
  forest:  "from-emerald-100 via-green-200 to-lime-200",
  galaxy:  "from-fuchsia-200 via-purple-300 to-indigo-300",
  gray:    "from-gray-100 via-slate-200 to-gray-300",
  sunrise:   "from-orange-100 via-amber-200 to-yellow-200",
  dusk:      "from-indigo-300 via-violet-300 to-pink-200",
  aurora:    "from-emerald-200 via-cyan-200 to-indigo-200",
  citrus:    "from-yellow-200 via-lime-200 to-green-200",
  lavender:  "from-purple-200 via-violet-200 to-fuchsia-200",
  coral:     "from-rose-200 via-orange-200 to-amber-200",
  mint:      "from-teal-100 via-emerald-200 to-green-200",
  sand:      "from-amber-100 via-orange-100 to-stone-200",
  firewatch: "from-rose-300 via-orange-300 to-amber-200",
  midnight:  "from-slate-800 via-slate-900 to-black",

};
// Pure CSS fallbacks (works even without Tailwind)
const THEME_BG = {
  default: "linear-gradient(135deg,#fff7ed,#fff1f2 40%,#f0f9ff)",
  sunset:  "linear-gradient(135deg,#fbcfe8,#fca5a5 40%,#fde68a)",
  ocean:   "linear-gradient(135deg,#bae6fd,#93c5fd 40%,#818cf8)",
  forest:  "linear-gradient(135deg,#d1fae5,#bbf7d0 40%,#d9f99d)",
  galaxy:  "linear-gradient(135deg,#f5d0fe,#d8b4fe 40%,#a5b4fc)",
  gray:    "linear-gradient(135deg,#f3f4f6,#e2e8f0 40%,#d1d5db)",
  sunrise:   "linear-gradient(135deg,#ffedd5,#fde68a 40%,#fef08a)",
  dusk:      "linear-gradient(135deg,#a5b4fc,#c4b5fd 40%,#fecdd3)",
  aurora:    "linear-gradient(135deg,#a7f3d0,#a5f3fc 40%,#c7d2fe)",
  citrus:    "linear-gradient(135deg,#fef08a,#d9f99d 40%,#bbf7d0)",
  lavender:  "linear-gradient(135deg,#e9d5ff,#ddd6fe 40%,#f5d0fe)",
  coral:     "linear-gradient(135deg,#fecdd3,#fed7aa 40%,#fde68a)",
  mint:      "linear-gradient(135deg,#ccfbf1,#a7f3d0 40%,#bbf7d0)",
  sand:      "linear-gradient(135deg,#fde68a,#fed7aa 40%,#e7e5e4)",
  firewatch: "linear-gradient(135deg,#fca5a5,#fdba74 40%,#fcd34d)",
  midnight:  "linear-gradient(135deg,#1f2937,#0f172a 40%,#000000)",
};

const THEME_TITLE_COLOR = {
  default: "text-slate-900",
  sunset: "text-rose-900",
  ocean: "text-blue-900",
  forest: "text-green-900",
  galaxy: "text-purple-900",
  gray: "text-slate-800",
  sunrise: "text-amber-900",
  dusk: "text-indigo-900",
  aurora: "text-emerald-900",
  citrus: "text-lime-900",
  lavender: "text-fuchsia-900",
  coral: "text-orange-900",
  mint: "text-teal-900",
  sand: "text-yellow-900",
  firewatch: "text-red-900",
  midnight: "text-slate-100", // light text for dark background
};


function App(){
  const [verses, setVerses]  = useState(DEFAULT_VERSES);
  const [source, setSource]  = useState("fallback");
  const [error, setError]    = useState(null);

  const [query, setQuery]    = useState("");
  const [showList, setShowList] = useState(false);
  const [reveal, setReveal]  = useState(false);
  const [shuffle, setShuffle]= useState(false);

  // ✅ load settings (including theme) correctly
  const savedSettings = read(STORAGE.settings, { onlyWithText:true, dedupe:true, theme:"default" });
  const [onlyWithText, setOnlyWithText] = useState(!!savedSettings.onlyWithText);
  const [dedupe, setDedupe]             = useState(!!savedSettings.dedupe);
  const [theme, setTheme]               = useState(savedSettings.theme || "default");

  const [known, setKnown]  = useState(read(STORAGE.known, []));
  const [index, setIndex]  = useState(read(STORAGE.idx, 0));

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch("./data/verses.json",{cache:"no-store"});
        if(!res.ok) throw new Error("HTTP "+res.status);
        const json = await res.json();
        if(Array.isArray(json)){ setVerses(json); setSource("json"); }
      }catch(e){ setError(e.message||String(e)); }
    })();
  },[]);

  useEffect(()=>write(STORAGE.settings,{onlyWithText, dedupe, theme}),[onlyWithText,dedupe,theme]);
  useEffect(()=>write(STORAGE.known, known),[known]);
  useEffect(()=>write(STORAGE.idx, index),[index]);

  const base = useMemo(()=>{
    let list = [...verses];
    if(onlyWithText) list = list.filter(v => (v.verse||"").trim().length>0);
    if(dedupe){
      const seen = new Set();
      list = list.filter(v=>{
        const key = `${v.reference}|${(v.verse||"").trim()}`;
        if(seen.has(key)) return false;
        seen.add(key); return true;
      });
    }
    return list;
  },[verses, onlyWithText, dedupe]);

  const filtered = useMemo(()=>{
    if(!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(v => v.reference.toLowerCase().includes(q) || (v.verse||"").toLowerCase().includes(q));
  },[base, query]);

  const ordered = useMemo(()=>{
    if(!shuffle) return filtered;
    const a = filtered.slice();
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  },[filtered, shuffle]);

  const clamp = (i)=> ordered.length? ((i%ordered.length)+ordered.length)%ordered.length : 0;
  useEffect(()=>setIndex(i=>clamp(i)),[ordered.length]);

  const current = ordered[clamp(index)] || null;
  const isKnown = (id)=> known.includes(id);
  const toggleKnown = (id)=> setKnown(prev => isKnown(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  // keyboard shortcuts
  useEffect(()=>{
    const h = (e)=>{
      const t=e.target; if(t && (t.tagName==="INPUT"||t.tagName==="TEXTAREA")) return;
      if(e.key==="ArrowRight"){ setIndex(i=>i+1); setReveal(false); }
      if(e.key==="ArrowLeft"){ setIndex(i=>i-1); setReveal(false); }
      if(e.key===" "){ e.preventDefault(); setReveal(r=>!r); }
      if(e.key.toLowerCase()==="s") setShuffle(s=>!s);
      if(e.key.toLowerCase()==="k"){ if(current) toggleKnown(current.id); }
    };
    window.addEventListener("keydown", h);
    return ()=>window.removeEventListener("keydown", h);
  },[current]);

  const copyCurrent = async ()=>{
    if(!current) return;
    const text = `${current.reference} — ${current.verse}`;
    try{ await navigator.clipboard.writeText(text); }catch{}
  };

  const progress = useMemo(()=>{
    const total = base.length;
    const count = base.reduce((a,v)=>a+(isKnown(v.id)?1:0),0);
    return { count, total, pct: total?Math.round(count*100/total):0 };
  },[base, known]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br`}
      style={{ background: THEME_BG[theme] || THEME_BG.default }}
    >
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2 ${THEME_TITLE_COLOR[theme] || 'text-slate-900'}`}>
              <IconBookOpenCheck className="w-8 h-8" />
              Bible Memory Verse App
            </h1>
            <p className="text-sm text-slate-600">Simple way to memorize bible verses</p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button onClick={()=>setShowList(false)} className={`px-3 py-1 rounded-full text-sm border ${!showList?"bg-black text-white border-black":"bg-white border-slate-300"}`}>Flashcards</button>
            <button onClick={()=>setShowList(true)} className={`px-3 py-1 rounded-full text-sm border ${showList?"bg-black text-white border-black":"bg-white border-slate-300"}`}>List</button>
          </div>

          {/* Theme picker */}
          <label className="flex items-center gap-2 text-xs md:text-sm">
            <IconPalette className="w-4 h-4" />
            <span className={`hidden sm:inline ${THEME_TITLE_COLOR[theme] || 'text-slate-900'}`}>Theme</span>
            <select
              value={theme}
              onChange={(e)=>setTheme(e.target.value)}
              className="border border-slate-300 rounded-lg bg-white px-2 py-1"
              aria-label="Background theme"
            >
              <option value="default">Default</option>
              <option value="sunset">Sunset</option>
              <option value="ocean">Ocean</option>
              <option value="forest">Forest</option>
              <option value="galaxy">Galaxy</option>
              <option value="gray">Gray</option>
              <option value="sunrise">Sunrise</option>
              <option value="dusk">Dusk</option>
              <option value="aurora">Aurora</option>
              <option value="citrus">Citrus</option>
              <option value="lavender">Lavender</option>
              <option value="coral">Coral</option>
              <option value="mint">Mint</option>
              <option value="sand">Sand</option>
              <option value="firewatch">Firewatch</option>
              <option value="midnight">Midnight</option>
            </select>
          </label>
        </header>

        {/* Banner if using fallback or fetch failed */}
        {(source==="fallback" || error) && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900 text-sm">
            <strong>Heads up:</strong> couldn’t load <code>verses.json</code>. Using embedded fallback so the app still works.
          </div>
        )}

        {/* Controls */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="col-span-1 md:col-span-2 flex items-center gap-2">
            <input
              value={query}
              onChange={(e)=>{ setQuery(e.target.value); setIndex(0); }}
              placeholder="Search reference or text…"
              className="flex-1 pl-3 pr-3 py-2 rounded-xl border border-slate-300 bg-white/80 outline-none focus:ring-2 focus:ring-sky-300"
            />
            <button onClick={()=>setShuffle(s=>!s)} className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${shuffle?"bg-black text-white border-black":"bg-white border-slate-300"}`}><IconShuffle className="w-4 h-4"/>{shuffle?"Shuffling":"Shuffle"}</button>
            <button onClick={()=>{ setIndex(0); setReveal(false); }} className="px-3 py-2 rounded-xl border flex items-center gap-2 bg-white border-slate-300"><IconRefresh className="w-4 h-4"/> Reset</button>
          </div>

          <div className="col-span-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={()=>setOnlyWithText(v=>!v)} className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${onlyWithText?"bg-black text-white border-black":"bg-white border-slate-300"}`}><IconFilter className="w-4 h-4" /> Text only</button>
              <button onClick={()=>setDedupe(v=>!v)} className={`px-3 py-2 rounded-xl border flex items-center gap-2 ${dedupe?"bg-black text-white border-black":"bg-white border-slate-300"}`}><IconLayers className="w-4 h-4" /> Deduplicate</button>
            </div>
          </div>

          <div className="text-left text-xs text-slate-600">
            Memorized: <span className="font-semibold">{progress.count}</span> / {progress.total} ({progress.pct}%)
          </div>
        </section>

        {/* Mobile toggle */}
        <div className="mt-3 md:hidden flex items-center gap-2">
          <button onClick={()=>setShowList(false)} className={`px-3 py-1 rounded-full text-sm border ${!showList?"bg-black text-white border-black":"bg-white border-slate-300"}`}>Flashcards</button>
          <button onClick={()=>setShowList(true)} className={`px-3 py-1 rounded-full text-sm border ${showList?"bg-black text-white border-black":"bg-white border-slate-300"}`}>List</button>
        </div>

        {/* Content */}
        {!showList ? (
          <section className="mt-6">
            {ordered.length===0 ? (
              <div className="p-8 rounded-2xl border bg-white/70 text-center">No verses match your filters.</div>
            ) : (
              <div className="rounded-2xl border bg-white/80 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">Card {clamp(index)+1} of {ordered.length}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={copyCurrent} className="px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-2 bg-white text-sm"><IconCopy className="w-4 h-4"/> Copy</button>
                    <button onClick={()=>current && toggleKnown(current.id)} className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-sm ${current && isKnown(current.id)?"bg-emerald-600 text-white border-emerald-700":"bg-white border-slate-300"}`}><IconCheck className="w-4 h-4"/>{current && isKnown(current.id)?"Memorized":"Mark Memorized"}</button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Reference</div>
                  <div className="text-xl md:text-2xl font-semibold">{current?.reference}</div>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Verse</div>
                  <button onClick={()=>setReveal(r=>!r)} className="w-full text-left">
                    <div className={`rounded-xl border p-4 md:p-6 ${reveal?"bg-white border-slate-300":"bg-slate-50 border-slate-200"}`}>
                      {reveal ? (
                        <p className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap">{current?.verse || <span className="italic text-slate-500">(No text provided for this reference.)</span>}</p>
                      ) : (
                        <div className="text-slate-500">Hidden — tap or press Space to reveal</div>
                      )}
                    </div>
                  </button>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>{ setIndex(i=>i-1); setReveal(false); }} className="px-4 py-2 rounded-xl border bg-white border-slate-300 flex items-center gap-2"><IconChevronLeft className="w-5 h-5"/>Prev</button>
                    <button onClick={()=>{ setIndex(i=>i+1); setReveal(false); }} className="px-4 py-2 rounded-xl border bg-white border-slate-300 flex items-center gap-2">Next<IconChevronRight className="w-5 h-5"/></button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="mt-6">
            <div className="rounded-2xl border bg-white/80 p-4 overflow-hidden">
              <table className="w-full text-left text-sm md:text-base">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="py-2 px-3">Ref</th>
                    <th className="py-2 px-3">Verse</th>
                    <th className="py-2 px-3 w-24">Memorized</th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map(v=>(
                    <tr key={v.id} className="border-b hover:bg-slate-50/80 cursor-pointer" onClick={()=>{ setShowList(false); setIndex(ordered.findIndex(x=>x.id===v.id)); setReveal(true); }}>
                      <td className="py-2 px-3 whitespace-nowrap font-medium">{v.reference}</td>
                      <td className="py-2 px-3 text-slate-700">{v.verse || <span className="italic text-slate-400">(empty)</span>}</td>
                      <td className="py-2 px-3">
                        <button onClick={(e)=>{ e.stopPropagation(); toggleKnown(v.id); }} className={`px-2 py-1 rounded-lg border text-sm ${isKnown(v.id)?"bg-emerald-600 text-white border-emerald-700":"bg-white border-slate-300"}`}>{isKnown(v.id)?"Yes":"No"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
