// Peptide Cortex — 90-second product walkthrough.
// Scene components + wrapper. Mounted via <x-import> alongside animations-v2.jsx.
// All motion is derived from the scene clock (localTime/progress) so export is exact.

const W = 1280, H = 720;
const CX = {
  bg: '#050505', cy: '#00E5FF', pu: '#7C3AED', go: '#F7B731',
  dim: '#B8C5D6', faint: '#4a5568', hair: 'rgba(255,255,255,0.1)',
};
const MONO = "'JetBrains Mono', monospace";
const JOST = "'Jost', sans-serif";
const CORM = "'Cormorant Garamond', serif";

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// eased 0..1 ramp beginning at `at` seconds, lasting `dur`
function appear(lt, at, dur, e) {
  e = e || Easing.easeOutCubic;
  return e(clamp01((lt - at) / (dur || 0.5)));
}
const rand = (n) => { const x = Math.sin(n * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };
const reduce = () => !!window.WT_REDUCE;

// ── shared bits ─────────────────────────────────────────────────────────────
function Mesh({ color, count = 32, lt = 0, opacity = 1, linkDist = 155, drift = 1 }) {
  count = reduce() ? Math.round(count * 0.5) : count;
  const dr = reduce() ? 0 : drift;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const bx = rand(i + 1) * W, by = rand(i * 3 + 7) * H;
    pts.push([bx + Math.sin(lt * 0.25 + i) * 22 * dr, by + Math.cos(lt * 0.22 + i * 1.7) * 22 * dr]);
  }
  const lines = [];
  for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
    const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    if (d < linkDist) lines.push([pts[i], pts[j], 1 - d / linkDist]);
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity }}>
      {lines.map((l, k) => <line key={'l' + k} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke={color} strokeWidth="0.6" opacity={l[2] * 0.32} />)}
      {pts.map((p, k) => <circle key={'c' + k} cx={p[0]} cy={p[1]} r="1.4" fill={color} opacity="0.7" />)}
    </svg>
  );
}

function Frame({ children, mesh, brand, lt = 0 }) {
  const ba = appear(lt, 0.2, 0.8);
  return (
    <div style={{ position: 'absolute', inset: 0, background: CX.bg, overflow: 'hidden' }}>
      {mesh}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 40%, transparent 52%, rgba(5,5,5,0.72))' }} />
      {brand && (
        <div style={{ position: 'absolute', top: 34, left: 44, display: 'flex', alignItems: 'center', gap: 11, opacity: ba * 0.62 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CX.cy, boxShadow: `0 0 10px ${CX.cy}` }} />
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 500, letterSpacing: '0.3em', color: '#fff' }}>PEPTIDE CORTEX</span>
        </div>
      )}
      {children}
    </div>
  );
}

function Eyebrow({ text, color, lt, at = 0.15 }) {
  const a = appear(lt, at, 0.5);
  return <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.34em', textTransform: 'uppercase', color, opacity: a, transform: `translateY(${(1 - a) * 10}px)` }}>{text}</div>;
}

const TITLES = [
  'Angiogenic modulation via BPC-157 in tendon repair',
  'GLP-1 receptor agonism & central satiety pathways',
  'TB-500 / thymosin-β4 actin sequestration kinetics',
  'GHK-Cu copper-peptide effects on collagen synthesis',
  'CJC-1295 pulsatile GH secretion & IGF-1 dynamics',
  'mTOR signaling crosstalk with growth-factor cascades',
  'VEGF expression & capillary density in ischemic tissue',
  'Ipamorelin selectivity at the ghrelin receptor',
];

// ── S1 · OPEN ────────────────────────────────────────────────────────────────
function Open({ localTime: lt }) {
  const wm = appear(lt, 0.3, 0.7);
  const h1 = appear(lt, 0.9, 0.9);
  const tag = appear(lt, 1.8, 0.7);
  const zoom = 0.985 + appear(lt, 0, 6, Easing.linear) * 0.02;
  return (
    <Frame lt={lt} mesh={<Mesh color={CX.cy} lt={lt} count={34} />}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${zoom})`, textAlign: 'center', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, opacity: wm, transform: `translateY(${(1 - wm) * 12}px)` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CX.cy, boxShadow: `0 0 12px ${CX.cy}` }} />
          <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, letterSpacing: `${0.3 + (1 - wm) * 0.15}em`, color: '#fff' }}>PEPTIDE CORTEX</span>
        </div>
        <h1 style={{ fontFamily: JOST, fontWeight: 200, fontSize: 108, lineHeight: 0.96, letterSpacing: '0.02em', margin: '26px 0 0', opacity: h1, transform: `translateY(${(1 - h1) * 24}px)`, color: '#fff' }}>
          PROTOCOL<br />
          <span style={{ background: `linear-gradient(100deg, ${CX.cy}, ${CX.pu})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 300 }}>INTELLIGENCE</span>
        </h1>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase', color: CX.cy, marginTop: 30, opacity: tag }}>The Intelligence Layer for Peptide Research</div>
      </div>
    </Frame>
  );
}

// ── S2 · PROBLEM ───────────────────────────────────────────────────────────
function Problem({ localTime: lt }) {
  const head = appear(lt, 0.5, 0.9);
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.faint} lt={lt} count={22} opacity={0.5} />}>
      {TITLES.concat(TITLES.slice(0, 4)).map((t, i) => {
        const a = appear(lt, 0.3 + i * 0.12, 0.6);
        const x = 90 + rand(i * 5 + 2) * 780;
        const y = 150 + rand(i * 9 + 4) * 420;
        const rot = (rand(i * 3 + 1) - 0.5) * 14;
        const jx = Math.sin(lt * 0.6 + i) * 6;
        return (
          <div key={i} style={{ position: 'absolute', left: x + jx, top: y, transform: `rotate(${rot}deg)`, opacity: a * 0.5, fontFamily: MONO, fontSize: 12, color: '#6b7688', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '7px 12px', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
        );
      })}
      <div style={{ position: 'absolute', right: 70, bottom: 90, textAlign: 'right', maxWidth: 620, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <Eyebrow text="The problem" color={CX.faint} lt={lt} at={0.4} />
        <h2 style={{ fontFamily: JOST, fontWeight: 200, fontSize: 62, lineHeight: 1.04, margin: '16px 0 0', color: '#fff' }}>The literature is vast.<br /><span style={{ color: CX.dim, fontWeight: 300 }}>And unstructured.</span></h2>
      </div>
    </Frame>
  );
}

// ── S3 · CORPUS ──────────────────────────────────────────────────────────────
function Corpus({ localTime: lt }) {
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.cy} lt={lt} count={20} opacity={0.4} />}>
      <div style={{ position: 'absolute', top: 150, left: 90, maxWidth: 430 }}>
        <Eyebrow text="01 · The corpus" color={CX.cy} lt={lt} />
        <h2 style={{ fontFamily: JOST, fontWeight: 200, fontSize: 66, lineHeight: 1, margin: '18px 0 0', color: '#fff' }}>Structured<br /><span style={{ color: CX.cy }}>literature.</span></h2>
        <p style={{ fontFamily: JOST, fontSize: 17, lineHeight: 1.8, color: CX.dim, marginTop: 26, opacity: appear(lt, 1, 0.8) }}>Every claim traceable back to a primary reference — sourced, queryable, never a hallucination.</p>
      </div>
      <div style={{ position: 'absolute', top: 150, right: 90, width: 540 }}>
        {TITLES.map((t, i) => {
          const a = appear(lt, 0.4 + i * 0.16, 0.7);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 16px', borderLeft: `1px solid ${CX.cy}`, background: 'rgba(0,229,255,0.03)', marginBottom: 8, opacity: a, transform: `translateX(${(1 - a) * 34}px)` }}>
              <span style={{ color: CX.cy, fontSize: 11 }}>◇</span>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: '#c9d3e0', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: '#2f3a4c' }}>PEER-REVIEWED</span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

// ── graph helper (ring of labeled nodes + connectors) ────────────────────────
function Graph({ cx, cy, r, labels, color, lt, at, vials }) {
  const nodes = labels.map((l, i) => {
    const ang = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r * 0.86, l };
  });
  const drawn = appear(lt, at, 1.4, Easing.easeInOutCubic);
  const edges = [];
  for (let i = 0; i < nodes.length; i++) { edges.push([nodes[i], nodes[(i + 1) % nodes.length]]); edges.push([nodes[i], { x: cx, y: cy }]); }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      {edges.map((e, k) => {
        const p = clamp01(drawn * edges.length - k) ;
        return <line key={k} x1={e[0].x} y1={e[0].y} x2={e[0].x + (e[1].x - e[0].x) * p} y2={e[0].y + (e[1].y - e[0].y) * p} stroke={color} strokeWidth="1" opacity="0.3" />;
      })}
      <circle cx={cx} cy={cy} r="5" fill={color} opacity={drawn} />
      {nodes.map((n, i) => {
        const a = appear(lt, at + 0.2 + i * 0.12, 0.5);
        const pulse = 1 + Math.sin(lt * 2 + i) * 0.12;
        return (
          <g key={i} opacity={a}>
            {vials
              ? <rect x={n.x - 6} y={n.y - 9} width="12" height="18" rx="2" fill={`${color}22`} stroke={color} strokeWidth="1" />
              : <circle cx={n.x} cy={n.y} r={4.5 * pulse} fill={color} />}
            <text x={n.x} y={n.y - 16} fill="#fff" fontSize="13" fontWeight="600" fontFamily={MONO} textAnchor="middle">{n.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── S4 · MECHANISMS ──────────────────────────────────────────────────────────
function Mechanisms({ localTime: lt }) {
  const head = appear(lt, 0.4, 0.9);
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.pu} lt={lt} count={16} opacity={0.3} />}>
      <Graph cx={905} cy={370} r={175} color={CX.pu} lt={lt} at={0.6} labels={['VEGF', 'mTOR', 'IGF-1', 'TGF-β', 'FGF-2', 'GH']} />
      <div style={{ position: 'absolute', top: 250, left: 90, maxWidth: 470, opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <Eyebrow text="02 · Mechanisms" color={CX.pu} lt={lt} />
        <h2 style={{ fontFamily: CORM, fontWeight: 300, fontSize: 64, lineHeight: 1.03, margin: '18px 0 0', color: '#fff' }}>Understanding <span style={{ fontStyle: 'italic', color: CX.pu }}>mechanisms</span>, not just molecules.</h2>
        <p style={{ fontFamily: JOST, fontSize: 16, lineHeight: 1.85, color: CX.dim, marginTop: 22, opacity: appear(lt, 1.4, 0.8) }}>Cortex maps the pathways compounds are studied to act on — surfacing relationships buried across thousands of papers.</p>
      </div>
    </Frame>
  );
}

// ── S5 · PEPTIDE NODES ─────────────────────────────────────────────────────
function Nodes({ localTime: lt }) {
  const head = appear(lt, 0.4, 0.9);
  const Stat = ({ n, l, c, at }) => {
    const a = appear(lt, at, 0.6);
    return <div style={{ opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}><div style={{ fontFamily: JOST, fontWeight: 200, fontSize: 52, lineHeight: 1, color: c }}>{n}</div><div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b7688', marginTop: 8 }}>{l}</div></div>;
  };
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.cy} lt={lt} count={16} opacity={0.3} />}>
      <Graph cx={385} cy={370} r={175} color={CX.cy} lt={lt} at={0.6} vials labels={['BPC-157', 'TB-500', 'GHK-Cu', 'CJC-1295', 'Ipamorelin', 'AOD-9604']} />
      <div style={{ position: 'absolute', top: 240, right: 90, maxWidth: 470, textAlign: 'right', opacity: head, transform: `translateY(${(1 - head) * 20}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><Eyebrow text="03 · Peptides as nodes" color={CX.cy} lt={lt} /></div>
        <h2 style={{ fontFamily: CORM, fontWeight: 300, fontSize: 64, lineHeight: 1.03, margin: '18px 0 0', color: '#fff' }}>Every vial, <span style={{ fontStyle: 'italic', color: CX.cy }}>mapped</span> into the graph.</h2>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'flex-end', marginTop: 34 }}>
          <Stat n="66" l="Compounds mapped" c="#fff" at={1.4} />
          <Stat n="12" l="Goal categories" c="#fff" at={1.55} />
          <Stat n="10" l="Curated stacks" c={CX.cy} at={1.7} />
        </div>
      </div>
    </Frame>
  );
}

// ── S6 · SYNTHESIS ─────────────────────────────────────────────────────────
function Synthesis({ localTime: lt }) {
  const head = appear(lt, 0.4, 0.8);
  const stages = [
    ['LITERATURE', 'peer-reviewed', CX.cy],
    ['MECHANISMS', 'pathways mapped', '#3ba7f0'],
    ['PATHWAYS', 'cross-referenced', CX.pu],
    ['SYNERGIES', 'flagged', '#b06be0'],
    ['REFERENCE', 'assembled', CX.go],
  ];
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.go} lt={lt} count={14} opacity={0.22} />}>
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: head, transform: `translateY(${(1 - head) * 16}px)` }}>
        <div style={{ display: 'inline-block' }}><Eyebrow text="04 · Synthesis" color={CX.go} lt={lt} /></div>
        <h2 style={{ fontFamily: JOST, fontWeight: 200, fontSize: 64, margin: '14px 0 0', color: '#fff' }}>Watch Cortex <span style={{ fontFamily: CORM, fontStyle: 'italic', fontWeight: 300, color: CX.go }}>reason.</span></h2>
      </div>
      <div style={{ position: 'absolute', top: 300, left: '50%', transform: 'translateX(-50%)', width: 380 }}>
        {stages.map((s, i) => {
          const a = appear(lt, 1.2 + i * 0.9, 0.6);
          const lit = clamp01((lt - (1.2 + i * 0.9)) / 0.6);
          return (
            <React.Fragment key={i}>
              <div style={{ border: `1px solid ${s[2]}${lit > 0.4 ? '' : '44'}`, background: `${s[2]}${lit > 0.4 ? '1c' : '0c'}`, padding: '15px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.28 + a * 0.72, boxShadow: lit > 0.5 ? `0 0 26px ${s[2]}55` : 'none', transform: `translateX(${(1 - a) * 20}px)` }}>
                <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em', color: s[2] }}>{s[0]}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#8a97ac' }}>{s[1]}</span>
              </div>
              {i < stages.length - 1 && <div style={{ width: 1, height: 20, margin: '0 auto', background: `linear-gradient(${s[2]}, ${stages[i + 1][2]})`, opacity: 0.5 * a }} />}
            </React.Fragment>
          );
        })}
      </div>
    </Frame>
  );
}

// ── UI card scaffold for product scenes ──────────────────────────────────────
function ProductHead({ eyebrow, ec, title, titleAccent, lt }) {
  const a = appear(lt, 0.3, 0.8);
  return (
    <div style={{ position: 'absolute', top: 92, left: 0, right: 0, textAlign: 'center', opacity: a, transform: `translateY(${(1 - a) * 16}px)` }}>
      <div style={{ display: 'inline-block' }}><Eyebrow text={eyebrow} color={ec} lt={lt} /></div>
      <h2 style={{ fontFamily: CORM, fontWeight: 300, fontSize: 46, margin: '12px 0 0', color: '#fff' }}>{title} <span style={{ fontStyle: 'italic', color: CX.cy }}>{titleAccent}</span></h2>
    </div>
  );
}
const scanStyle = { position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${CX.cy}, transparent)` };

// ── S7 · CHECKER ─────────────────────────────────────────────────────────────
function Checker({ localTime: lt }) {
  const card = appear(lt, 0.7, 0.7);
  const zoom = 0.97 + appear(lt, 0, 11, Easing.linear) * 0.03;
  const phase = lt < 3 ? 'idle' : lt < 4.2 ? 'scan' : 'result';
  const scanY = clamp01((lt - 3) / 1.2) * 130;
  const vtext = 'Frequently referenced as a combined tissue-repair pair. Complementary mechanisms — angiogenesis/GI and actin/cell migration — with no established pharmacokinetic conflict in the literature.';
  const nChar = phase === 'result' ? Math.floor(clamp01((lt - 4.4) / 3.2) * vtext.length) : 0;
  const field = (label, val) => (
    <div style={{ flex: 1, padding: '24px 26px' }}>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: CX.faint, marginBottom: 12 }}>{label}</div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontFamily: MONO, fontSize: 15, padding: '13px 15px' }}>{val}</div>
    </div>
  );
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.pu} lt={lt} count={14} opacity={0.22} />}>
      <ProductHead eyebrow="Try it · interaction checker" ec={CX.pu} title="Check two compounds" titleAccent="before they meet." lt={lt} />
      <div style={{ position: 'absolute', top: 250, left: '50%', transform: `translateX(-50%) scale(${zoom})`, width: 880, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(9,17,31,0.55)', opacity: card, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex' }}>
          {field('Compound A', 'BPC-157')}
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          {field('Compound B', 'TB-500')}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '18px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: CX.dim, whiteSpace: 'nowrap' }}>BPC-157 <span style={{ color: CX.cy }}>×</span> TB-500</div>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', color: '#050505', background: CX.cy, padding: '12px 28px', boxShadow: phase === 'idle' ? `0 0 22px ${CX.cy}66` : 'none' }}>ANALYZE →</div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', minHeight: 130, padding: '28px 26px', position: 'relative', overflow: 'hidden' }}>
          {phase === 'scan' && <div style={{ ...scanStyle, top: scanY }} />}
          {phase === 'scan'
            ? <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.2em', color: CX.cy }}>ANALYZING BPC-157 × TB-500 …</div>
            : phase === 'result'
              ? <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${CX.cy}`, padding: '8px 15px', flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: CX.cy, boxShadow: `0 0 10px ${CX.cy}` }} />
                    <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: CX.cy, whiteSpace: 'nowrap' }}>STUDIED TOGETHER</span>
                  </div>
                  <p style={{ flex: 1, fontFamily: JOST, fontSize: 15, lineHeight: 1.8, color: '#c9d3e0' }}>{vtext.slice(0, nChar)}<span style={{ opacity: nChar < vtext.length ? 0.6 : 0 }}>▋</span></p>
                </div>
              : <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CX.faint }}>Awaiting analysis…</div>}
        </div>
      </div>
    </Frame>
  );
}

// ── S8 · BLOODWORK ───────────────────────────────────────────────────────────
function Bloodwork({ localTime: lt }) {
  const card = appear(lt, 0.7, 0.7);
  const markers = [
    ['Total Testosterone', '312 ng/dL', 'LOW', 0.32, CX.go],
    ['IGF-1', '145 ng/mL', 'LOW-NORMAL', 0.44, CX.pu],
    ['hs-CRP', '3.8 mg/L', 'ELEVATED', 0.72, CX.go],
    ['HbA1c', '5.9 %', 'BORDERLINE', 0.6, CX.go],
    ['Vitamin D', '22 ng/mL', 'LOW', 0.3, CX.go],
    ['ApoB', '105 mg/dL', 'BORDERLINE', 0.58, CX.cy],
  ];
  const recs = [
    ['GH / IGF-1 axis · low-normal', 'CJC-1295 + Ipamorelin'],
    ['Inflammation · hs-CRP elevated', 'BPC-157'],
    ['Metabolic · HbA1c / ApoB', 'Tesamorelin · Semaglutide'],
  ];
  const phase = lt < 3.2 ? 'scan' : 'result';
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.go} lt={lt} count={14} opacity={0.2} />}>
      <ProductHead eyebrow="06 · Bloodwork analyzer" ec={CX.go} title="Hand Cortex your labs." titleAccent="Get the whole picture." lt={lt} />
      <div style={{ position: 'absolute', top: 250, left: '50%', transform: 'translateX(-50%)', width: 900, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', opacity: card, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
        <div style={{ background: 'rgba(9,17,31,0.6)', padding: '26px 28px' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: CX.faint, marginBottom: 18 }}>bloodpanel_2026.pdf · 14 markers</div>
          {markers.map((m, i) => {
            const fill = clamp01((lt - (1 + i * 0.12)) / 1) * m[3];
            return (
              <div key={i} style={{ marginBottom: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 11, marginBottom: 5 }}><span style={{ color: '#cdd6e2' }}>{m[0]}</span><span style={{ color: '#fff' }}>{m[1]}</span></div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}><div style={{ height: '100%', width: `${fill * 100}%`, background: m[4] }} /></div>
                <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.18em', color: m[4], marginTop: 4 }}>{m[2]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ background: '#070a10', padding: '26px 28px', position: 'relative', overflow: 'hidden', minHeight: 360 }}>
          {phase === 'scan'
            ? <><div style={{ ...scanStyle, top: clamp01((lt - 1) / 2.2) * 360 }} /><div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: CX.cy }}>READING PANEL · CROSS-REFERENCING …</div></>
            : <>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: CX.cy, marginBottom: 16 }}>Cortex reference · educational</div>
                <p style={{ fontFamily: JOST, fontSize: 14, lineHeight: 1.8, color: '#c9d3e0', marginBottom: 22, opacity: appear(lt, 3.4, 0.6) }}>Four markers fall outside optimal range — inflammatory, metabolic and GH-axis. Peptides most studied in relation to each are grouped below.</p>
                {recs.map((r, i) => {
                  const a = appear(lt, 3.8 + i * 0.4, 0.6);
                  return (
                    <div key={i} style={{ borderLeft: `2px solid ${CX.cy}`, padding: '8px 0 8px 16px', marginBottom: 15, opacity: a, transform: `translateX(${(1 - a) * 20}px)` }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6b7688', marginBottom: 6 }}>{r[0]}</div>
                      <div style={{ fontFamily: CORM, fontSize: 22, color: CX.cy }}>{r[1]}</div>
                    </div>
                  );
                })}
              </>}
        </div>
      </div>
    </Frame>
  );
}

// ── S9 · CORTEX AI ────────────────────────────────────────────────────────────
function Chat({ localTime: lt }) {
  const card = appear(lt, 0.7, 0.7);
  const q = 'Can I stack TB-500 with BPC-157?';
  const ans = "They're among the most commonly co-referenced peptides for tissue repair — complementary mechanisms with no established pharmacokinetic conflict in the literature. Always verify with primary sources and a clinician.";
  const showUser = lt > 1.6;
  const nChar = lt > 2.6 ? Math.floor(clamp01((lt - 2.6) / 4) * ans.length) : 0;
  const Bubble = ({ who, children, on }) => (
    <div style={{ display: 'flex', gap: 12, maxWidth: '82%', alignSelf: who === 'user' ? 'flex-end' : 'flex-start', flexDirection: who === 'user' ? 'row-reverse' : 'row', opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(10px)' }}>
      <div style={{ width: 26, height: 26, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 9, background: who === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,229,255,0.16)', color: who === 'user' ? '#cdd6e2' : CX.cy, border: who === 'user' ? 'none' : `1px solid ${CX.cy}66` }}>{who === 'user' ? 'YOU' : 'CX'}</div>
      <div style={{ fontFamily: JOST, fontSize: 14.5, lineHeight: 1.7, padding: '12px 16px', background: who === 'user' ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)', color: who === 'user' ? '#eaf6f8' : '#c9d3e0', border: who === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>{children}</div>
    </div>
  );
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.pu} lt={lt} count={14} opacity={0.22} />}>
      <ProductHead eyebrow="07 · Cortex AI" ec={CX.pu} title="Your peptide intelligence," titleAccent="on call." lt={lt} />
      <div style={{ position: 'absolute', top: 250, left: '50%', transform: 'translateX(-50%)', width: 760, border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg, rgba(9,17,31,0.72), rgba(5,5,5,0.9))', opacity: card, boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: CX.cy, boxShadow: `0 0 12px ${CX.cy}` }} />
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: '#fff' }}>CORTEX AI</span>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: CX.faint, marginLeft: 'auto' }}>context: your stack · 6 compounds</span>
        </div>
        <div style={{ height: 300, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Bubble who="cx" on={appear(lt, 0.6, 0.5) > 0.3}>I'm Cortex — ask me about any compound's mechanism, half-life, or how it's studied alongside others.</Bubble>
          <Bubble who="user" on={showUser}>{q}</Bubble>
          {nChar > 0 && <Bubble who="cx" on>{ans.slice(0, nChar)}<span style={{ opacity: nChar < ans.length ? 0.6 : 0 }}>▋</span></Bubble>}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: CX.faint, fontFamily: MONO, fontSize: 13, padding: '13px 16px' }}>Ask Cortex about a peptide…</div>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', color: '#050505', background: CX.cy, padding: '13px 26px', display: 'flex', alignItems: 'center' }}>ASK →</div>
        </div>
      </div>
    </Frame>
  );
}

// ── S10 · CLOSE ────────────────────────────────────────────────────────────
function Close({ localTime: lt }) {
  const eb = appear(lt, 0.4, 0.6);
  const h1 = appear(lt, 0.8, 0.9);
  const form = appear(lt, 1.7, 0.7);
  const wm = appear(lt, 2.6, 0.7);
  return (
    <Frame lt={lt} mesh={<Mesh color={CX.cy} lt={lt} count={30} />}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '100%' }}>
        <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.4em', textTransform: 'uppercase', color: CX.cy, opacity: eb }}>Access is limited</div>
        <h2 style={{ fontFamily: JOST, fontWeight: 200, fontSize: 82, lineHeight: 1, margin: '24px 0 0', opacity: h1, transform: `translateY(${(1 - h1) * 22}px)`, color: '#fff' }}>Enter the <span style={{ background: `linear-gradient(100deg, ${CX.cy}, ${CX.pu})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>intelligence layer.</span></h2>
        <div style={{ margin: '40px auto 0', width: 440, display: 'flex', gap: 8, border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.04)', padding: '7px 7px 7px 18px', opacity: form, transform: `translateY(${(1 - form) * 16}px)` }}>
          <div style={{ flex: 1, textAlign: 'left', color: CX.faint, fontFamily: MONO, fontSize: 13, display: 'flex', alignItems: 'center' }}>you@lab.com</div>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', color: '#050505', background: CX.cy, padding: '13px 24px' }}>REQUEST ACCESS</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, marginTop: 44, opacity: wm }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CX.cy, boxShadow: `0 0 10px ${CX.cy}` }} />
          <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, letterSpacing: '0.32em', color: '#fff' }}>PEPTIDE CORTEX</span>
        </div>
      </div>
    </Frame>
  );
}

// ── S · PROTOCOL PLANNER (credits) ───────────────────────────────────────────
function Planner({ localTime: lt }) {
  const card = appear(lt, 0.7, 0.7);
  const goals = ['Healing & Recovery', 'GH Optimization', 'Fat Loss', 'Longevity'];
  const sel = 0;
  const gen = lt > 2.6;
  const plan = [
    ['BPC-157', '250 mcg · 2× daily', 'AM / PM subq'],
    ['TB-500', '2 mg · 2× weekly', 'Mon / Thu'],
  ];
  const credit = appear(lt, 3.2, 0.6);
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.cy} lt={lt} count={14} opacity={0.22} />}>
      <ProductHead eyebrow="08 · Protocol planner" ec={CX.cy} title="Plan a protocol" titleAccent="in one tap." lt={lt} />
      <div style={{ position: 'absolute', top: 250, left: '50%', transform: 'translateX(-50%)', width: 900, display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', opacity: card, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
        <div style={{ background: 'rgba(9,17,31,0.6)', padding: '26px 28px' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: CX.faint, marginBottom: 16 }}>Your goal</div>
          {goals.map((g, i) => (
            <div key={i} style={{ fontFamily: MONO, fontSize: 12.5, padding: '13px 15px', marginBottom: 8, border: `1px solid ${i === sel ? CX.cy : 'rgba(255,255,255,0.12)'}`, background: i === sel ? 'rgba(0,229,255,0.08)' : 'transparent', color: i === sel ? '#fff' : '#8a97ac', display: 'flex', justifyContent: 'space-between' }}>{g}{i === sel && <span style={{ color: CX.cy }}>✓</span>}</div>
          ))}
          <div style={{ marginTop: 20, fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', color: '#050505', background: CX.cy, padding: '13px', textAlign: 'center', boxShadow: gen ? 'none' : `0 0 22px ${CX.cy}66` }}>GENERATE PROTOCOL →</div>
        </div>
        <div style={{ background: '#070a10', padding: '26px 28px', position: 'relative', minHeight: 320, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: CX.go }}>Cortex-assembled plan</div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', color: CX.go, border: `1px solid ${CX.go}66`, padding: '5px 10px', opacity: credit }}>◈ 1 credit · 11 left</div>
          </div>
          {gen ? plan.map((p, i) => {
            const a = appear(lt, 2.9 + i * 0.35, 0.6);
            return (
              <div key={i} style={{ border: '1px solid rgba(0,229,255,0.25)', background: 'rgba(0,229,255,0.03)', padding: '16px 18px', marginBottom: 12, opacity: a, transform: `translateY(${(1 - a) * 18}px)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontFamily: CORM, fontSize: 24, color: '#fff' }}>{p[0]}</span><span style={{ fontFamily: MONO, fontSize: 11, color: CX.cy }}>{p[1]}</span></div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7688', marginTop: 6 }}>{p[2]}</div>
              </div>
            );
          }) : <div style={{ fontFamily: MONO, fontSize: 11, color: CX.faint, letterSpacing: '0.1em' }}>Select a goal to generate…</div>}
        </div>
      </div>
    </Frame>
  );
}

// ── S · ACTIVE STACK + REMINDERS ─────────────────────────────────────────────
function StackAlerts({ localTime: lt }) {
  const card = appear(lt, 0.7, 0.7);
  const rows = [
    ['BPC-157', '250 mcg', 'Due now', CX.go, true],
    ['TB-500', '2 mg', 'Thu 8:00 AM', CX.faint, false],
    ['CJC-1295', '100 mcg', 'Tomorrow', CX.faint, false],
    ['Ipamorelin', '200 mcg', 'Logged 8:04 AM', CX.cy, false],
  ];
  const toast = appear(lt, 2.2, 0.6);
  const logged = lt > 4.4;
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.cy} lt={lt} count={14} opacity={0.22} />}>
      <ProductHead eyebrow="09 · Active stack & reminders" ec={CX.cy} title="Never miss a dose." titleAccent="We'll remind you." lt={lt} />
      <div style={{ position: 'absolute', top: 252, left: '50%', transform: 'translateX(-50%)', width: 760, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(9,17,31,0.55)', opacity: card, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '18px 26px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: '#fff' }}>ACTIVE STACK · 4 COMPOUNDS</span>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: CX.faint }}>WEEK 3 OF 8</span>
        </div>
        {rows.map((r, i) => {
          const isLog = i === 3;
          const done = isLog && logged;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '17px 26px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: done ? CX.cy : r[3], boxShadow: r[4] ? `0 0 10px ${r[3]}` : 'none' }} />
              <span style={{ fontFamily: CORM, fontSize: 22, color: '#fff', flex: 1 }}>{r[0]}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: '#8a97ac', width: 90 }}>{r[1]}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: done ? CX.cy : r[3], width: 130, textAlign: 'right' }}>{done ? '✓ Logged' : r[2]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 285, right: 130, width: 300, border: `1px solid ${CX.go}`, background: 'rgba(20,15,5,0.94)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13, opacity: logged ? 0 : toast, transform: `translateX(${(1 - toast) * 40}px)`, boxShadow: `0 0 40px ${CX.go}44`, transition: 'opacity .4s' }}>
        <span style={{ fontSize: 18 }}>⏰</span>
        <div><div style={{ fontFamily: MONO, fontSize: 11, color: CX.go, letterSpacing: '0.08em' }}>DOSE DUE · BPC-157</div><div style={{ fontFamily: MONO, fontSize: 10, color: '#8a97ac', marginTop: 4 }}>250 mcg · tap to log</div></div>
      </div>
    </Frame>
  );
}

// ── S · VIAL SCAN + RECONSTITUTION + SITES ───────────────────────────────────
function Vial({ localTime: lt }) {
  const card = appear(lt, 0.6, 0.7);
  const detected = lt > 2.2;
  const recon = appear(lt, 3, 0.7);
  const site = appear(lt, 4, 0.7);
  const scanY = clamp01((lt - 0.8) / 1.4);
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.cy} lt={lt} count={14} opacity={0.2} />}>
      <ProductHead eyebrow="10 · Vial scan · reconstitution · sites" ec={CX.cy} title="Snap the vial." titleAccent="Cortex does the rest." lt={lt} />
      <div style={{ position: 'absolute', top: 252, left: '50%', transform: 'translateX(-50%)', width: 960, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', opacity: card, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
        {/* scan */}
        <div style={{ background: '#070a10', padding: '24px 24px', minHeight: 320, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: CX.faint, marginBottom: 18 }}>1 · Scan</div>
          <div style={{ position: 'relative', border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.03)', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <svg width="54" height="110" viewBox="0 0 54 110"><rect x="18" y="2" width="18" height="8" fill={CX.cy} /><rect x="14" y="10" width="26" height="10" rx="2" fill={`${CX.cy}55`} /><rect x="12" y="20" width="30" height="82" rx="4" fill={`${CX.cy}18`} stroke={CX.cy} /><rect x="12" y="66" width="30" height="36" rx="4" fill={`${CX.cy}33`} /></svg>
            {!detected && <div style={{ position: 'absolute', left: 0, right: 0, top: `${scanY * 100}%`, height: 2, background: `linear-gradient(90deg,transparent,${CX.cy},transparent)` }} />}
          </div>
          <div style={{ marginTop: 16, opacity: detected ? 1 : 0, transition: 'opacity .3s' }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: CX.cy, letterSpacing: '0.14em' }}>◇ DETECTED</div>
            <div style={{ fontFamily: CORM, fontSize: 26, color: '#fff', marginTop: 4 }}>BPC-157 · 5 mg</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7688', marginTop: 4 }}>Added to inventory by name</div>
          </div>
        </div>
        {/* reconstitution */}
        <div style={{ background: 'rgba(9,17,31,0.6)', padding: '24px 24px', minHeight: 320 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: CX.faint, marginBottom: 18 }}>2 · Reconstitute</div>
          <div style={{ opacity: recon }}>
            {[['Vial', '5 mg'], ['BAC water', '2.0 mL'], ['Concentration', '2.5 mg/mL'], ['Per 250 mcg dose', '0.10 mL'], ['On a U-100 pin', '10 units']].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: MONO, fontSize: 12 }}><span style={{ color: '#8a97ac' }}>{r[0]}</span><span style={{ color: i >= 3 ? CX.cy : '#fff' }}>{r[1]}</span></div>
            ))}
          </div>
        </div>
        {/* site */}
        <div style={{ background: '#070a10', padding: '24px 24px', minHeight: 320, position: 'relative' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: CX.faint, marginBottom: 8 }}>3 · Inject where</div>
          <div style={{ opacity: site, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg width="120" height="210" viewBox="0 0 120 210">
              <circle cx="60" cy="22" r="15" fill="none" stroke="#3a4658" strokeWidth="1.4" />
              <path d="M60 37 v6 M38 52 q22 -12 44 0 l4 58 q-24 10 -52 0 z" fill="rgba(255,255,255,0.03)" stroke="#3a4658" strokeWidth="1.4" />
              <path d="M38 54 l-16 46 M82 54 l16 46" stroke="#3a4658" strokeWidth="1.4" fill="none" />
              <path d="M46 110 l-6 84 M74 110 l6 84" stroke="#3a4658" strokeWidth="1.4" fill="none" />
              <circle cx="60" cy="92" r={7 + Math.sin(lt * 3) * 2} fill={`${CX.cy}55`} />
              <circle cx="60" cy="92" r="4" fill={CX.cy} />
            </svg>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: CX.cy, marginTop: 10 }}>SUBCUTANEOUS · ABDOMEN</div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: '#6b7688', marginTop: 6, textAlign: 'center', lineHeight: 1.7 }}>Rotate 2" from navel ·<br />best-studied site for this compound</div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ── S · REFERENCE LAYER (Bible + approval news) ──────────────────────────────
function Reference({ localTime: lt }) {
  const card = appear(lt, 0.7, 0.7);
  const news = [
    ['Retatrutide', 'PHASE 3', CX.go],
    ['Tirzepatide', 'FDA APPROVED', CX.cy],
    ['Semaglutide', 'FDA APPROVED', CX.cy],
    ['BPC-157', 'RESEARCH ONLY', CX.pu],
    ['Melanotan II', 'NOT APPROVED', '#e0556b'],
  ];
  return (
    <Frame lt={lt} brand mesh={<Mesh color={CX.pu} lt={lt} count={14} opacity={0.2} />}>
      <ProductHead eyebrow="11 · The reference layer" ec={CX.pu} title="A living reference." titleAccent="Always current." lt={lt} />
      <div style={{ position: 'absolute', top: 250, left: '50%', transform: 'translateX(-50%)', width: 900, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', opacity: card, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
        <div style={{ background: 'rgba(9,17,31,0.6)', padding: '26px 28px', minHeight: 340 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: CX.cy, marginBottom: 16 }}>The Peptide Bible</div>
          <div style={{ opacity: appear(lt, 1, 0.7) }}>
            <div style={{ fontFamily: CORM, fontSize: 32, color: '#fff', lineHeight: 1.1 }}>BPC-157</div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CX.faint, margin: '6px 0 16px' }}>BODY PROTECTION COMPOUND · 15 AMINO ACIDS</div>
            {['Mechanism', 'Half-life', 'Studied for', 'Interactions', 'Sourcing'].map((s, i) => {
              const a = appear(lt, 1.4 + i * 0.22, 0.5);
              return <div key={i} style={{ fontFamily: MONO, fontSize: 12, color: '#8a97ac', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', opacity: a, transform: `translateX(${(1 - a) * 16}px)` }}><span>{s}</span><span style={{ color: CX.cy }}>›</span></div>;
            })}
          </div>
        </div>
        <div style={{ background: '#070a10', padding: '26px 28px', minHeight: 340 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: CX.go, marginBottom: 16 }}>Approval news · updated weekly</div>
          {news.map((n, i) => {
            const a = appear(lt, 1.2 + i * 0.28, 0.55);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>
                <span style={{ fontFamily: CORM, fontSize: 21, color: '#fff' }}>{n[0]}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: n[2], border: `1px solid ${n[2]}66`, padding: '4px 10px', whiteSpace: 'nowrap' }}>{n[1]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}

const SCENE_MAP = { Open, Problem, Corpus, Mechanisms, Nodes, Synthesis, Checker, Bloodwork, Chat, Planner, StackAlerts, Vial, Reference, Close };

function Walkthrough() {
  return (
    <SceneStage width={W} height={H} bg={CX.bg} transition="cut"
      scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
      {SCENE_MAP}
    </SceneStage>
  );
}

function WalkthroughTweaks() {
  const [t, setTweak] = window.useTweaks(window.WT_TWEAK_DEFAULTS);
  React.useEffect(() => { window.WT_REDUCE = !!t.reduceMotion; }, [t.reduceMotion]);
  return (
    <window.TweaksPanel>
      <window.TweakSection label="Playback" />
      <window.TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
      <window.TweakToggle label="Reduce motion" value={t.reduceMotion} onChange={(v) => setTweak('reduceMotion', v)} />
    </window.TweaksPanel>
  );
}

Object.assign(window, { Walkthrough, WalkthroughTweaks });
