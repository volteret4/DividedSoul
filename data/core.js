// Registro de escenas, personas, lugares y etapas de la vida de Marvin Gaye según Divided Soul de David Ritz. Cada fichero de capítulo (data/NN-*.js,
// escritos a mano leyendo el libro) llama a GAYE.chapter({...}) y GAYE.add([...], n).
// Los datos se fusionan por id: los arrays se unen y cada capítulo puede añadir
// discos, citas (refs) y una nota propia sobre una escena ya definida en otro.
window.GAYE = (function () {
  const genres = new Map();
  const chapters = [];

  const FAMILIES = {
    familia:    { name: 'Familia y fe: el padre, la madre, la House of God', color: '#c084fc' },
    raices:     { name: 'Raíces musicales: gospel, crooners, jazz y blues', color: '#d97706' },
    doowop:     { name: 'Washington y el doo-wop: Rainbows, Marquees, Moonglows', color: '#facc15' },
    motown:     { name: 'Motown: los Gordy, Hitsville y su gente', color: '#ef4444' },
    duetos:     { name: 'Dúos: Mary Wells, Kim Weston, Tammi Terrell, Diana Ross', color: '#ec4899' },
    conciencia: { name: 'What’s Going On: soul con conciencia', color: '#38bdf8' },
    deseo:      { name: 'Let’s Get It On, I Want You: el soul del deseo', color: '#fb7185' },
    caida:      { name: 'Divorcios, deudas, drogas y exilio: Hawái, Londres, Ostende', color: '#2dd4bf' },
    regreso:    { name: 'El regreso: Columbia, Sexual Healing y el final', color: '#a3e635' },
    entorno:    { name: 'Contemporáneos, herederos e industria', color: '#e5e7eb' },
  };

  const key = (t) => (t.a + '|' + t.t).toLowerCase();

  function mergeArr(a = [], b = [], k = (x) => (typeof x === 'string' ? x.toLowerCase() : JSON.stringify(x))) {
    const seen = new Set(a.map(k));
    const out = a.slice();
    for (const x of b) if (!seen.has(k(x))) { seen.add(k(x)); out.push(x); }
    return out;
  }

  // Anota en cada disco los capítulos que lo citan.
  function cite(tracks, t, ch) {
    const m = tracks.find((x) => key(x) === key(t));
    if (m && ch != null) m.chs = mergeArr(m.chs, [ch]);
  }

  function add(list, chapter) {
    for (const g of list) {
      let cur = genres.get(g.id);
      if (!cur) {
        cur = { id: g.id, aka: [], influences: [], artists: [], tracks: [], labels: [], refs: [], notes: [], chapters: [] };
        genres.set(g.id, cur);
      }
      for (const f of ['aka', 'influences', 'artists', 'labels']) cur[f] = mergeArr(cur[f], g[f]);
      cur.tracks = mergeArr(cur.tracks, (g.tracks || []).map((t) => ({ ...t })), key);
      for (const t of g.tracks || []) {
        if (t.ess) { const m = cur.tracks.find((x) => key(x) === key(t)); if (m) m.ess = 1; }
        cite(cur.tracks, t, chapter);
      }
      cur.refs = mergeArr(cur.refs, (g.refs || []).map((r) => ({ ch: chapter, ...r })), (r) => r.q);
      for (const f of ['name', 'family', 'start', 'end', 'place', 'desc']) if (g[f] != null && cur[f] == null) cur[f] = g[f];
      if (g.desc != null) cur.descCh = cur.descCh ?? chapter;
      if (g.note) cur.notes.push({ ch: chapter, text: g.note });
      if (chapter != null && !cur.chapters.includes(chapter)) cur.chapters.push(chapter);
    }
  }

  return {
    FAMILIES,
    chapters,
    genres,
    chapter(meta) { chapters.push(meta); },
    add,
  };
})();
