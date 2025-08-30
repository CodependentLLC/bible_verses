    const { useEffect, useMemo, useRef, useState } = React;

    const DEFAULT_VERSES = [
      {"id":1,"reference":"John 3:16","verse":"For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."},
      {"id":2,"reference":"Jeremiah 29:11","verse":"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future."},
      {"id":3,"reference":"Philippians 4:13","verse":"I can do all things through Christ who strengthens me."},
      {"id":4,"reference":"Romans 8:37","verse":"No in all these things we are more than conquerors through Him who loved us."},
      {"id":5,"reference":"Romans 12:2","verse":"Do not be conformed by the pattern of this world, but be transformed by the renewing of your mind so that you may be able to test God's will, His good, pleasing, and perfect will."},
      {"id":6,"reference":"Romans 10:9","verse":"If we confess with our mouth that Jesus is Lord and believe in your heart that God raised Him from the dead, you will be saved."}
      // …you can paste the rest of your items here too
    ];

    const STORAGE = {
      known: "bible-memorized-ids",
      idx: "bible-current-index",
      settings: "bible-settings"
    };
    const read = (k,f)=>{ try{const v=localStorage.getItem(k); return v?JSON.parse(v):f;}catch{return f;} };
    const write = (k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} };

    function App(){
      const [verses, setVerses] = useState(DEFAULT_VERSES);
      const [source, setSource]  = useState("fallback");
      const [error, setError]    = useState(null);

      const [query, setQuery] = useState("");
      const [showList, setShowList] = useState(false);
      const [reveal, setReveal] = useState(false);
      const [shuffle, setShuffle] = useState(false);

      const savedSettings = read(STORAGE.settings, { onlyWithText:true, dedupe:true });
      const [onlyWithText, setOnlyWithText] = useState(!!savedSettings.onlyWithText);
      const [dedupe, setDedupe] = useState(!!savedSettings.dedupe);

      const [known, setKnown] = useState(read(STORAGE.known, []));
      const [index, setIndex] = useState(read(STORAGE.idx, 0));

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

      useEffect(()=>write(STORAGE.settings,{onlyWithText, dedupe}),[onlyWithText,dedupe]);
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
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {/* Header */}
          <header className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Bible Memory Verse App</h1>
              <p className="text-sm text-slate-600">Arrows navigate • Space reveal • S shuffle • K mark known</p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={()=>setShowList(false)} className={`px-3 py-1 rounded-full text-sm border ${!showList?"bg-black text-white border-black":"bg-white border-slate-300"}`}>Flashcards</button>
              <button onClick={()=>setShowList(true)} className={`px-3 py-1 rounded-full text-sm border ${showList?"bg-black text-white border-black":"bg-white border-slate-300"}`}>List</button>
            </div>
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
              <button onClick={()=>setShuffle(s=>!s)} className={`px-3 py-2 rounded-xl border ${shuffle?"bg-black text-white border-black":"bg-white border-slate-300"}`}>{shuffle?"Shuffling":"Shuffle"}</button>
              <button onClick={()=>{ setIndex(0); setReveal(false); }} className="px-3 py-2 rounded-xl border bg-white border-slate-300">Reset View</button>
            </div>
            <div className="col-span-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button onClick={()=>setOnlyWithText(v=>!v)} className={`px-3 py-2 rounded-xl border ${onlyWithText?"bg-black text-white border-black":"bg-white border-slate-300"}`}>Text only</button>
                <button onClick={()=>setDedupe(v=>!v)} className={`px-3 py-2 rounded-xl border ${dedupe?"bg-black text-white border-black":"bg-white border-slate-300"}`}>Deduplicate</button>
              </div>
              <div className="text-right text-xs text-slate-600">
                Memorized: <span className="font-semibold">{progress.count}</span> / {progress.total} ({progress.pct}%)
              </div>
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
                      <button onClick={copyCurrent} className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm">Copy</button>
                      <button onClick={()=>current && toggleKnown(current.id)} className={`px-3 py-1.5 rounded-lg border text-sm ${current && isKnown(current.id)?"bg-emerald-600 text-white border-emerald-700":"bg-white border-slate-300"}`}>{current && isKnown(current.id)?"Memorized":"Mark memorized"}</button>
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
                      <button onClick={()=>{ setIndex(i=>i-1); setReveal(false); }} className="px-4 py-2 rounded-xl border bg-white border-slate-300">Prev</button>
                      <button onClick={()=>{ setIndex(i=>i+1); setReveal(false); }} className="px-4 py-2 rounded-xl border bg-white border-slate-300">Next</button>
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
      );
    }

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<App />);
