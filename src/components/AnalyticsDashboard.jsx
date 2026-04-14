import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import './AnalyticsDashboard.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: '24h', hours: 24, mode: 'today' },
  { label: '7 dias', hours: 24 * 7, mode: 'rolling' },
  { label: '30 dias', hours: 24 * 30, mode: 'rolling' },
  { label: '90 dias', hours: 24 * 90, mode: 'rolling' },
];

const CHART_MODES = ['Linha', 'Barras'];

// Retorna a data atual no fuso de São Paulo (America/Sao_Paulo) como YYYY-MM-DD
function todayInSP() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function getStartDate(period, customDate, rangeEndDate) {
  if (period.mode === 'today') {
    const base = customDate ? new Date(customDate + 'T00:00:00') : new Date();
    base.setHours(0, 0, 0, 0);
    return base;
  }
  // rolling: começa N dias antes da data de fim escolhida
  const end = rangeEndDate ? new Date(rangeEndDate + 'T23:59:59') : new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (period.hours / 24) + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndDate(period, customDate, rangeEndDate) {
  if (period.mode === 'today') {
    if (customDate) return new Date(customDate + 'T23:59:59');
    return new Date();
  }
  // rolling: termina no fim do dia da data escolhida (ou agora se for hoje)
  if (rangeEndDate) {
    const end = new Date(rangeEndDate + 'T23:59:59');
    // Se a data escolhida é hoje, usa o momento atual para não pegar dados futuros
    const todayEnd = new Date(todayInSP() + 'T23:59:59');
    return end >= todayEnd ? new Date() : end;
  }
  return new Date();
}

function groupBy(arr, keyFn) {
  return arr.reduce((acc, item) => {
    const k = keyFn(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function topN(obj, n = 8) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function maxXLabels(period) {
  if (period.mode === 'today') return 8;
  if (period.hours <= 24 * 7) return 7;
  return 10;
}

function shortLabel(dateStr, period) {
  if (period.mode === 'today') {
    const parts = dateStr.split(' ');
    return parts[1] ? parts[1].replace(':00', 'h') : dateStr;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

function fullLabel(dateStr, period) {
  if (period.mode === 'today') {
    const parts = dateStr.split(' ');
    return parts[1] ? parts[1] : dateStr;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ x, y, label, count, containerW }) {
  const TW = 130;
  // Evita sair pela direita
  const left = Math.min(x - TW / 2, containerW - TW - 8);
  return (
    <div className="dash-tooltip" style={{ left: Math.max(8, left), top: y }}>
      <span className="dash-tooltip-label">{label}</span>
      <span className="dash-tooltip-value">{count} pageview{count !== 1 ? 's' : ''}</span>
    </div>
  );
}

// ─── Bar Row ─────────────────────────────────────────────────────────────────

function BarRow({ label, value, max, color, flag }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="dash-bar-row">
      <span className="dash-bar-label">
        {flag && <span className="dash-flag">{flag}</span>}
        {label}
      </span>
      <div className="dash-bar-track">
        <div className="dash-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="dash-bar-value">{value}</span>
    </div>
  );
}

// ─── Mini Bar Group ──────────────────────────────────────────────────────────

function BreakdownCard({ title, data, color }) {
  const max = data[0]?.[1] || 1;
  return (
    <div className="dash-breakdown-card">
      <div className="dash-breakdown-title">{title}</div>
      {data.map(([label, value]) => (
        <BarRow key={label} label={label} value={value} max={max} color={color} />
      ))}
    </div>
  );
}

// ─── Time Chart ──────────────────────────────────────────────────────────────

function TimeChart({ data, mode, period }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [tooltip, setTooltip] = useState(null); // { x, y, label, count }

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w > 0) setWidth(w);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.getBoundingClientRect().width || 800);
    return () => ro.disconnect();
  }, []);

  if (!data.length) return <div className="dash-chart-empty">Sem dados</div>;

  const hasData = data.some(d => d.count > 0);
  const maxVal = hasData ? Math.max(...data.map(d => d.count)) : 4;

  const W = width;
  const H = 180;
  const pad = { top: 20, right: 16, bottom: 36, left: 40 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  const maxLabels = maxXLabels(period);
  const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));
  const xLabelIndices = new Set();
  for (let i = 0; i < data.length; i += labelStep) xLabelIndices.add(i);
  xLabelIndices.add(data.length - 1);

  const hideTooltip = () => setTooltip(null);

  // ── Barras ──
  if (mode === 'Barras') {
    const slotW = innerW / data.length;
    const barW = Math.max(2, slotW * 0.6);

    return (
      <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
        {tooltip && (
          <Tooltip x={tooltip.x} y={tooltip.y} label={tooltip.label} count={tooltip.count} containerW={W} />
        )}
        <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }} onMouseLeave={hideTooltip}>
          {/* Y grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
            const yVal = Math.round(maxVal * frac);
            const yPos = pad.top + innerH - frac * innerH;
            return (
              <g key={i}>
                <line x1={pad.left} y1={yPos} x2={W - pad.right} y2={yPos} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={pad.left - 6} y={yPos + 4} fill="#444" fontSize="11" textAnchor="end" fontFamily="Inter, sans-serif">{yVal}</text>
              </g>
            );
          })}

          {/* Bars + hit areas + X labels */}
          {data.map((d, i) => {
            const slotX = pad.left + i * slotW;
            const x = slotX + (slotW - barW) / 2;
            const barH = hasData && d.count > 0 ? Math.max(2, (d.count / maxVal) * innerH) : 0;
            const y = pad.top + innerH - barH;
            return (
              <g key={i}>
                {/* Barra visível */}
                {barH > 0 && (
                  <rect x={x} y={y} width={barW} height={barH} fill="#c8a84b" rx="2" />
                )}
                {/* Hit area invisível em toda a coluna */}
                <rect
                  x={slotX} y={pad.top} width={slotW} height={innerH}
                  fill="transparent"
                  style={{ cursor: 'crosshair' }}
                  onMouseEnter={() => setTooltip({
                    x: slotX + slotW / 2,
                    y: Math.max(0, y - 48),
                    label: fullLabel(d.key, period),
                    count: d.count,
                  })}
                  onMouseLeave={hideTooltip}
                />
                {/* X label */}
                {xLabelIndices.has(i) && (
                  <text x={slotX + slotW / 2} y={H - 4} fill="#555" fontSize="11" textAnchor="middle" fontFamily="Inter, sans-serif">
                    {shortLabel(d.key, period)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // ── Linha ──
  const pts = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * innerW,
    y: hasData ? pad.top + innerH - (d.count / maxVal) * innerH : pad.top + innerH,
    count: d.count,
    key: d.key,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;

  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => ({
    val: Math.round((maxVal / ySteps) * i),
    y: pad.top + innerH - (i / ySteps) * innerH,
  }));

  const showDots = data.length <= 31;

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      {tooltip && (
        <Tooltip x={tooltip.x} y={tooltip.y} label={tooltip.label} count={tooltip.count} containerW={W} />
      )}
      <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }} onMouseLeave={hideTooltip}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8a84b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#c8a84b" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={pad.left} y1={l.y} x2={W - pad.right} y2={l.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={pad.left - 6} y={l.y + 4} fill="#444" fontSize="11" textAnchor="end" fontFamily="Inter, sans-serif">{l.val}</text>
          </g>
        ))}

        {/* Area */}
        {hasData && <path d={areaD} fill="url(#areaGrad)" />}

        {/* Linha vertical pontilhada no hover */}
        {tooltip && (
          <line
            x1={tooltip.x} y1={pad.top}
            x2={tooltip.x} y2={pad.top + innerH}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {/* Line */}
        <path d={pathD} fill="none" stroke="#c8a84b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots + hit areas verticais */}
        {pts.map((p, i) => {
          // Largura da faixa: metade da distância para o vizinho de cada lado
          const prevX = i > 0 ? pts[i - 1].x : p.x;
          const nextX = i < pts.length - 1 ? pts[i + 1].x : p.x;
          const halfLeft = (p.x - prevX) / 2;
          const halfRight = (nextX - p.x) / 2;
          const slotX = p.x - halfLeft;
          const slotW = halfLeft + halfRight;
          return (
            <g key={i}>
              {showDots && (
                <circle cx={p.x} cy={p.y} r="3.5" fill="#c8a84b" stroke="#141414" strokeWidth="1.5" />
              )}
              {/* Faixa vertical invisível — ativa o tooltip em toda a altura */}
              <rect
                x={slotX} y={pad.top} width={Math.max(slotW, 8)} height={innerH}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setTooltip({
                  x: p.x,
                  y: Math.max(0, p.y - 48),
                  label: fullLabel(p.key, period),
                  count: p.count,
                })}
                onMouseLeave={hideTooltip}
              />
            </g>
          );
        })}

        {/* X labels */}
        {pts.map((p, i) =>
          xLabelIndices.has(i) ? (
            <text key={i} x={p.x} y={H - 4} fill="#555" fontSize="11" textAnchor="middle" fontFamily="Inter, sans-serif">
              {shortLabel(p.key, period)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ value, label }) {
  return (
    <div className="dash-stat-card">
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-label">{label}</span>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [periodIdx, setPeriodIdx] = useState(1);
  const [chartMode, setChartMode] = useState('Linha');
  const [clickView, setClickView] = useState('saida');
  const [hits, setHits] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customDate, setCustomDate] = useState(() => todayInSP());   // para modo 'today'
  const [rangeEndDate, setRangeEndDate] = useState(() => todayInSP()); // para modo 'rolling'

  const period = PERIODS[periodIdx];
  const todayStr = todayInSP();

  useEffect(() => {
    setLoading(true);
    const start = getStartDate(period, customDate, rangeEndDate);
    const end = getEndDate(period, customDate, rangeEndDate);
    const since = Timestamp.fromDate(start);
    const until = Timestamp.fromDate(end);

    const qPageviews = query(collection(db, 'analytics'), where('ts', '>=', since), where('ts', '<=', until));
    const qClicks = query(collection(db, 'analytics_clicks'), where('ts', '>=', since), where('ts', '<=', until));

    Promise.all([getDocs(qPageviews), getDocs(qClicks)])
      .then(([pvSnap, clSnap]) => {
        setHits(pvSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(h => h.referrer !== 'localhost' && h.referrer !== '127.0.0.1'));
        setClicks(clSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      })
      .catch(err => {
        console.error('Analytics query error:', err);
        setHits([]);
        setClicks([]);
      })
      .finally(() => setLoading(false));
  }, [periodIdx, customDate, rangeEndDate]);

  const stats = useMemo(() => {
    const pageviews = hits.length;
    const sessions = new Set(hits.map(h => h.sessionId)).size;
    const pages = new Set(hits.map(h => h.page)).size;
    const countries = new Set(hits.map(h => h.country)).size;

    const buckets = {};
    hits.forEach(h => {
      const ts = h.ts?.toDate?.() || new Date();
      let key;
      if (period.mode === 'today') {
        key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')} ${String(ts.getHours()).padStart(2, '0')}:00`;
      } else {
        key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
      }
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const timeData = [];
    const start = getStartDate(period, customDate, rangeEndDate);
    const end = getEndDate(period, customDate, rangeEndDate);

    if (period.mode === 'today') {
      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      for (let h = 0; h <= 23; h++) {
        const key = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`;
        timeData.push({ key, count: buckets[key] || 0 });
      }
    } else {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        timeData.push({ key, count: buckets[key] || 0 });
      }
    }

    const byPage = topN(groupBy(hits, h => h.page));
    const byDevice = topN(groupBy(hits, h => h.device));
    const byBrowser = topN(groupBy(hits, h => h.browser));
    const byOS = topN(groupBy(hits, h => h.os));
    const byCountry = topN(groupBy(hits, h => h.country), 10);
    const byReferrer = topN(groupBy(hits.filter(h => h.referrer !== 'localhost' && h.referrer !== '127.0.0.1'), h => h.referrer), 10);

    const byClick = topN(groupBy(clicks, c => c.label), 15);
    const byClickSource = topN(groupBy(clicks, c => c.source));

    return { pageviews, sessions, pages, countries, timeData, byPage, byDevice, byBrowser, byOS, byCountry, byReferrer, byClick, byClickSource, totalClicks: clicks.length };
  }, [hits, clicks, period, customDate, rangeEndDate]);

  // Label do gráfico
  const fmtDate = (str) => str
    ? new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  let chartLabel;
  if (period.mode === 'today') {
    const label = customDate ? fmtDate(customDate) : 'HOJE';
    chartLabel = `PAGEVIEWS — ${label} (POR HORA)`;
  } else {
    const startDate = getStartDate(period, customDate, rangeEndDate);
    const startStr = startDate.toLocaleDateString('en-CA');
    chartLabel = `PAGEVIEWS — ${fmtDate(startStr)} até ${fmtDate(rangeEndDate || todayStr)}`;
  }

  return (
    <div className="dash-wrap">
      <div className="dash-period-bar">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            className={`dash-period-btn${periodIdx === i ? ' active' : ''}`}
            onClick={() => {
              setPeriodIdx(i);
              // Ao trocar de período, reseta para hoje
              if (i === 0) setCustomDate(todayStr);
              else setRangeEndDate(todayStr);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p className="admin-empty">Carregando dados...</p>}

      {!loading && (
        <>
          <div className="dash-stats-grid">
            <StatCard value={stats.pageviews} label="PAGEVIEWS" />
            <StatCard value={stats.sessions} label="SESSÕES ÚNICAS" />
            <StatCard value={stats.pages} label="PÁGINAS DISTINTAS" />
            <StatCard value={stats.countries} label="PAÍSES" />
          </div>

          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <span className="dash-chart-title">{chartLabel}</span>
              <div className="dash-chart-controls">
                {period.mode === 'today' && (
                  <input
                    type="date"
                    className="dash-date-input"
                    value={customDate}
                    max={todayStr}
                    onChange={e => setCustomDate(e.target.value)}
                    title="Selecionar data"
                  />
                )}
                {period.mode === 'rolling' && (
                  <input
                    type="date"
                    className="dash-date-input"
                    value={rangeEndDate}
                    max={todayStr}
                    onChange={e => setRangeEndDate(e.target.value)}
                    title="Data de fim do período"
                  />
                )}
                <div className="dash-chart-modes">
                  {CHART_MODES.map(m => (
                    <button
                      key={m}
                      className={`dash-mode-btn${chartMode === m ? ' active' : ''}`}
                      onClick={() => setChartMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <TimeChart data={stats.timeData} mode={chartMode} period={period} />
          </div>

          <div className="dash-breakdown-grid">
            <BreakdownCard title="PÁGINAS" data={stats.byPage} color="#c8a84b" />
            <BreakdownCard title="DISPOSITIVO" data={stats.byDevice} color="#4bc8c8" />
            <BreakdownCard title="BROWSER" data={stats.byBrowser} color="#a84bc8" />
            <BreakdownCard title="SISTEMA OPERACIONAL" data={stats.byOS} color="#4bc87a" />
          </div>

          {/* Última linha: Cliques | Países | Origem do Tráfego */}
          <div className="dash-three-col">

            {/* Card Cliques com toggle */}
            <div className="dash-wide-card">
              <div className="dash-card-header-row">
                <div className="dash-breakdown-title">
                  CLIQUES
                  <span className="dash-breakdown-count">{stats.totalClicks} total</span>
                </div>
                <div className="dash-toggle">
                  <button
                    className={`dash-toggle-btn${clickView === 'saida' ? ' active' : ''}`}
                    onClick={() => setClickView('saida')}
                  >Saída</button>
                  <button
                    className={`dash-toggle-btn${clickView === 'pagina' ? ' active' : ''}`}
                    onClick={() => setClickView('pagina')}
                  >Por Página</button>
                </div>
              </div>
              {clickView === 'saida' && (
                <>
                  {stats.byClick.length === 0 && <p className="dash-empty-row">Sem cliques registrados ainda</p>}
                  {stats.byClick.map(([label, value]) => (
                    <BarRow key={label} label={label} value={value} max={stats.byClick[0]?.[1] || 1} color="#4bc8c8" />
                  ))}
                </>
              )}
              {clickView === 'pagina' && (
                <>
                  {stats.byClickSource.length === 0 && <p className="dash-empty-row">Sem dados</p>}
                  {stats.byClickSource.map(([label, value]) => (
                    <BarRow key={label} label={label} value={value} max={stats.byClickSource[0]?.[1] || 1} color="#4bc8c8" />
                  ))}
                </>
              )}
            </div>

            {/* Países */}
            <div className="dash-wide-card">
              <div className="dash-breakdown-title">PAÍSES</div>
              {stats.byCountry.length === 0 && <p className="dash-empty-row">Sem dados</p>}
              {stats.byCountry.map(([label, value]) => (
                <BarRow key={label} label={label} value={value} max={stats.byCountry[0]?.[1] || 1} color="#e07c2a" />
              ))}
            </div>

            {/* Origem do tráfego */}
            <div className="dash-wide-card">
              <div className="dash-breakdown-title">ORIGEM DO TRÁFEGO</div>
              {stats.byReferrer.length === 0 && <p className="dash-empty-row">Sem dados</p>}
              {stats.byReferrer.map(([label, value]) => (
                <BarRow key={label} label={label} value={value} max={stats.byReferrer[0]?.[1] || 1} color="#e07c2a" />
              ))}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
