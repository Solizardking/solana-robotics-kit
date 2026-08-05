/**
 * Perps Trading Demo — interactive Phoenix perpetuals strategy planner
 * with Vulcan execution modes, live market ticker simulation, orderbook,
 * and a natural-language terminal prompt.
 *
 * Follows the same pattern as demo.js: local fallback + live backend calls,
 * approval-gated output, and the Meta Mesh safety contract.
 */

const CLAWD_TOKEN_ADDRESS = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump';
const PUBLIC_META_MESH_API = 'https://brain.x402.wtf';

/* ------------------------------------------------------------------ */
/* Strategy definitions                                                */
/* ------------------------------------------------------------------ */

const STRATEGIES = {
  twap: {
    label: 'TWAP',
    description: 'Time-Weighted Average Price: splits a large order into smaller slices executed at regular intervals over a set duration, reducing market impact and price slippage.',
    defaults: { symbol: 'SOL', side: 'buy', notionalUsdc: 50, slices: 5, intervalSeconds: 60 },
  },
  grid: {
    label: 'Grid',
    description: 'Grid trading: places layered limit orders above and below a center price. Profits from mean reversion by buying low and selling high within a defined range.',
    defaults: { symbol: 'SOL', centerOnMark: true, widthPct: 1.5, levelsPerSide: 3, tokensPerLevel: 0.1 },
  },
  ta: {
    label: 'TA Strategy',
    description: 'Technical analysis strategy: evaluates RSI, MACD, EMA crossovers, and Bollinger Band touch levels against live candle data to generate entry/exit signals.',
    defaults: { symbol: 'SOL', indicators: 'rsi,macd,ema', timeframeMinutes: 15, triggerThreshold: 0.02 },
  },
};

const STRAT_DESCS = {
  twap: 'Time-Weighted Average Price: splits a large order into smaller slices executed at regular intervals over a set duration, reducing market impact and price slippage.',
  grid: 'Grid trading: places layered limit orders above and below a center price. Profits from mean reversion by buying low and selling high within a defined range.',
  ta: 'Technical analysis strategy: evaluates RSI, MACD, EMA crossovers, and Bollinger Band touch levels against live candle data to generate entry/exit signals.',
};

const EXECUTION_MODES = [
  { id: 'observe', label: 'Observe', desc: 'Read market data only — no orders, no paper trades.' },
  { id: 'paper', label: 'Paper', desc: 'Simulate orders against live prices — no wallet or chain activity.' },
  { id: 'dry-run', label: 'Dry Run', desc: 'Build transactions but do not send them. Review before submission.' },
  { id: 'confirm-each', label: 'Confirm Each', desc: 'Requires explicit operator approval before every order.' },
  { id: 'auto-execute', label: 'Auto Execute', desc: 'Autonomous execution with notional guardrails.' },
];

/* ------------------------------------------------------------------ */
/* Mock orderbook data (generated from a base price)                   */
/* ------------------------------------------------------------------ */

function generateOrderbook(markPrice) {
  const asks = [];
  const bids = [];
  const spread = markPrice * 0.0008;
  for (let i = 0; i < 8; i++) {
    const askDelta = spread + (i + 1) * markPrice * 0.0006;
    const bidDelta = spread + (i + 1) * markPrice * 0.0006;
    asks.push({ price: markPrice + askDelta, size: (0.5 + Math.random() * 8).toFixed(2) });
    bids.push({ price: markPrice - bidDelta, size: (0.5 + Math.random() * 8).toFixed(2) });
  }
  return { asks, bids };
}

function renderOrderbook(symbol, markPrice) {
  const ob = generateOrderbook(markPrice);
  const container = document.getElementById('perps-orderbook');
  if (!container) return;
  container.innerHTML =
    `<div class="perps-ob-col">` +
    `<div class="perps-ob-head">Asks (${symbol})</div>` +
    ob.asks.map(r => `<div class="perps-ob-row asks"><span>$${r.price.toFixed(2)}</span><span>${r.size}</span></div>`).join('') +
    `</div>` +
    `<div class="perps-ob-col">` +
    `<div class="perps-ob-head">Bids (${symbol})</div>` +
    ob.bids.map(r => `<div class="perps-ob-row bids"><span>$${r.price.toFixed(2)}</span><span>${r.size}</span></div>`).join('') +
    `</div>`;
}

/* ------------------------------------------------------------------ */
/* Market ticker simulation                                            */
/* ------------------------------------------------------------------ */

let tickerInterval = null;
const TICKER_SYMBOLS = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP', 'JUP-PERP'];
const TICKER_BASE_PRICES = { 'SOL-PERP': 142.50, 'BTC-PERP': 68740, 'ETH-PERP': 3450, 'JUP-PERP': 0.82 };
const tickerValues = {};

function initTicker() {
  TICKER_SYMBOLS.forEach(sym => {
    tickerValues[sym] = TICKER_BASE_PRICES[sym] || 100;
  });
  updateTickerDisplay();
  if (tickerInterval) clearInterval(tickerInterval);
  tickerInterval = setInterval(() => {
    TICKER_SYMBOLS.forEach(sym => {
      const drift = (Math.random() - 0.5) * tickerValues[sym] * 0.002;
      tickerValues[sym] += drift;
    });
    updateTickerDisplay();
  }, 2500);
}

function updateTickerDisplay() {
  TICKER_SYMBOLS.forEach(sym => {
    const el = document.getElementById(`ticker-${sym.toLowerCase().replace('-', '-')}`);
    if (!el) return;
    const prev = Number(el.dataset.prev || tickerValues[sym]);
    const val = tickerValues[sym];
    const cls = val > prev ? 'up' : val < prev ? 'down' : '';
    el.textContent = sym.includes('BTC') ? `$${(val).toLocaleString(undefined, {maximumFractionDigits: 0})}` : `$${val.toFixed(2)}`;
    el.className = `perps-ticker-value ${cls}`;
    el.dataset.prev = val;
  });
}

function stopTicker() {
  if (tickerInterval) { clearInterval(tickerInterval); tickerInterval = null; }
}

/* ------------------------------------------------------------------ */
/* Local strategy plan generator                                       */
/* ------------------------------------------------------------------ */

function localStrategyPlan(strategy, mode) {
  const stratDef = STRATEGIES[strategy] || STRATEGIES.twap;
  const symbol = (document.getElementById('perps-symbol')?.value || 'SOL').toUpperCase();
  const markPrice = tickerValues[`${symbol}-PERP`] || tickerValues['SOL-PERP'] || 142.50;
  const side = document.getElementById('perps-side')?.value || 'buy';
  const notional = Number(document.getElementById('perps-notional')?.value || stratDef.defaults.notionalUsdc || 50);
  const slices = Number(document.getElementById('perps-slices')?.value || stratDef.defaults.slices || 5);
  const interval = Number(document.getElementById('perps-interval')?.value || stratDef.defaults.intervalSeconds || 60);
  const widthPct = Number(document.getElementById('perps-width-pct')?.value || stratDef.defaults.widthPct || 1.5);
  const levels = Number(document.getElementById('perps-levels')?.value || stratDef.defaults.levelsPerSide || 3);
  const tokensPer = Number(document.getElementById('perps-tokens')?.value || stratDef.defaults.tokensPerLevel || 0.1);
  const modeDef = EXECUTION_MODES.find(m => m.id === mode) || EXECUTION_MODES[0];

  const plan = {
    strategy,
    symbol,
    side,
    mode: modeDef.id,
    mode_label: modeDef.label,
    mark_price: markPrice,
    timestamp: new Date().toISOString(),
    notional_usdc: notional,
    signs_transaction: modeDef.id === 'auto-execute' || modeDef.id === 'confirm-each',
    submits_transaction: modeDef.id === 'auto-execute',
    requires_human_approval: modeDef.id !== 'auto-execute',
    autonomous_execution: modeDef.id === 'auto-execute',
    approval_gate: modeDef.id === 'observe' ? 'read-only' : modeDef.id === 'paper' ? 'paper simulation' : modeDef.id === 'dry-run' ? 'transaction preview' : modeDef.id === 'confirm-each' ? 'per-order approval' : 'notional guardrails active',
  };

  if (strategy === 'twap') {
    const sliceSize = notional / slices;
    plan.twap = {
      slices,
      interval_seconds: interval,
      slice_notional_usdc: Number(sliceSize.toFixed(2)),
      total_duration_seconds: slices * interval,
      estimated_slippage_bps: modeDef.id === 'paper' ? 0 : (1.2 + Math.random() * 2.5).toFixed(1),
    };
  } else if (strategy === 'grid') {
    const priceRange = markPrice * (widthPct / 100);
    const gridStep = priceRange / levels;
    const levelsData = [];
    for (let i = 1; i <= levels; i++) {
      levelsData.push({ level: i, buy_price: Number((markPrice - gridStep * i).toFixed(2)), sell_price: Number((markPrice + gridStep * i).toFixed(2)), size: tokensPer });
    }
    plan.grid = {
      center_price: markPrice,
      width_pct: widthPct,
      levels_per_side: levels,
      tokens_per_level: tokensPer,
      total_notional: Number((tokensPer * levels * 2 * markPrice).toFixed(2)),
      levels: levelsData,
    };
  } else if (strategy === 'ta') {
    const timeframe = Number(document.getElementById('perps-timeframe')?.value || 15);
    plan.technical_analysis = {
      indicators: ['rsi', 'macd', 'ema_cross', 'bollinger'],
      timeframe_minutes: timeframe,
      candles_required: 100,
      rsi_period: 14,
      ema_fast: 12,
      ema_slow: 26,
      macd_signal: 9,
      bollinger_period: 20,
      trigger_threshold: 0.02,
      current_signal: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.4 ? 'bearish' : 'neutral',
    };
  }

  plan.safety_boundary = {
    holds_private_keys: false,
    signs_transactions: plan.signs_transaction,
    submits_transactions: plan.submits_transaction,
    requires_human_approval: plan.requires_human_approval,
    autonomous_execution: plan.autonomous_execution,
    notional_guardrail_usdc: plan.autonomous_execution ? 100 : null,
  };

  return plan;
}

/* ------------------------------------------------------------------ */
/* Live backend call                                                   */
/* ------------------------------------------------------------------ */

function defaultApiBase() {
  const configured = window.META_MESH_API_URL || window.localStorage.getItem('metaMeshApiBase');
  if (configured) return normalizeApiBase(configured);
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return window.location.origin;
  if (window.location.hostname.endsWith('.onrender.com') || window.location.hostname.endsWith('.x402.wtf')) {
    return window.location.origin;
  }
  return PUBLIC_META_MESH_API;
}

function normalizeApiBase(value) {
  const clean = String(value || '').trim().replace(/\/+$/, '');
  if (!clean) return '';
  try { return new URL(clean).origin; } catch { return ''; }
}

/* ------------------------------------------------------------------ */
/* Visual renderers                                                    */
/* ------------------------------------------------------------------ */

function renderPlanVisual(plan) {
  const container = document.getElementById('perps-visual');
  if (!container) return;
  container.replaceChildren();

  // Summary strip
  const summary = document.createElement('div');
  summary.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px;';
  summary.append(
    metricBadge('Strategy', plan.strategy.toUpperCase(), 'accent'),
    metricBadge('Symbol', plan.symbol, ''),
    metricBadge('Side', plan.side.toUpperCase(), plan.side === 'buy' ? 'good' : 'bad'),
    metricBadge('Mode', plan.mode_label, plan.mode === 'auto-execute' ? 'bad' : plan.mode === 'confirm-each' ? 'warn' : 'good'),
    metricBadge('Mark', `$${plan.mark_price.toFixed(2)}`, ''),
  );
  container.append(summary);

  // Strategy-specific details
  if (plan.twap) {
    const twapBox = document.createElement('div');
    twapBox.style.cssText = 'background:var(--paper-2);border-radius:8px;padding:12px;margin-bottom:10px;';
    twapBox.innerHTML =
      `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:13px;">` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Slices</span><strong>${plan.twap.slices}</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Interval</span><strong>${plan.twap.interval_seconds}s</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Per Slice</span><strong>$${plan.twap.slice_notional_usdc}</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Duration</span><strong>${plan.twap.total_duration_seconds}s</strong></div>` +
      `</div>` +
      (plan.twap.estimated_slippage_bps ? `<div style="margin-top:8px;font-size:12px;color:var(--ink-faint);">Estimated slippage: ${plan.twap.estimated_slippage_bps} bps</div>` : '');
    container.append(twapBox);
  }

  if (plan.grid) {
    const gridBox = document.createElement('div');
    gridBox.style.cssText = 'background:var(--paper-2);border-radius:8px;padding:12px;margin-bottom:10px;';
    let levelsHtml = plan.grid.levels.slice(0, 3).map(l =>
      `<div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px;padding:3px 0;border-bottom:1px solid var(--line);">` +
      `<span>Lv ${l.level}</span><span style="color:var(--good);">B $${l.buy_price}</span><span style="color:var(--bad);">S $${l.sell_price}</span><span>${l.size} SOL</span></div>`
    ).join('');
    gridBox.innerHTML =
      `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:13px;margin-bottom:10px;">` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Center</span><strong>$${plan.grid.center_price}</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Width</span><strong>${plan.grid.width_pct}%</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Levels</span><strong>${plan.grid.levels_per_side}</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Total Size</span><strong>$${plan.grid.total_notional}</strong></div>` +
      `</div>` +
      `<div style="font-size:11px;color:var(--ink-faint);margin-bottom:4px;">Grid Levels (top 3):</div>` +
      levelsHtml;
    if (plan.grid.levels.length > 3) {
      gridBox.innerHTML += `<div style="font-size:11px;color:var(--ink-faint);margin-top:4px;">... and ${plan.grid.levels.length - 3} more levels</div>`;
    }
    container.append(gridBox);
  }

  if (plan.technical_analysis) {
    const ta = plan.technical_analysis;
    const taBox = document.createElement('div');
    taBox.style.cssText = 'background:var(--paper-2);border-radius:8px;padding:12px;margin-bottom:10px;';
    const signalColor = ta.current_signal === 'bullish' ? 'var(--good)' : ta.current_signal === 'bearish' ? 'var(--bad)' : 'var(--ink-faint)';
    taBox.innerHTML =
      `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:13px;margin-bottom:10px;">` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Signal</span><strong style="color:${signalColor}">${ta.current_signal.toUpperCase()}</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Timeframe</span><strong>${ta.timeframe_minutes}m</strong></div>` +
      `<div><span style="color:var(--ink-faint);font-size:11px;display:block;">Indicators</span><strong>${ta.indicators.join(', ')}</strong></div>` +
      `</div>` +
      `<div style="font-size:12px;color:var(--ink-soft);">RSI(14) · EMA(${ta.ema_fast}/${ta.ema_slow}) · MACD(${ta.macd_signal}) · Bollinger(${ta.bollinger_period})</div>`;
    container.append(taBox);
  }

  // Approval gate
  const gate = document.createElement('div');
  gate.style.cssText = 'padding:10px 14px;background:rgba(20,241,149,0.04);border-radius:8px;margin-top:6px;font-size:12px;';
  gate.innerHTML =
    `<span class="agent-badge is-${plan.mode === 'auto-execute' ? 'bad' : plan.mode === 'confirm-each' ? 'warn' : 'good'}" style="margin-right:8px;">${plan.approval_gate}</span>` +
    `<span style="color:var(--ink-faint);">${EXECUTION_MODES.find(m => m.id === plan.mode)?.desc || ''}</span>`;
  container.append(gate);
}

function renderSafetyBoundary(plan) {
  const container = document.getElementById('perps-safety');
  if (!container) return;
  const b = plan.safety_boundary || {};
  container.replaceChildren();
  const badges = [
    ['Holds Keys', b.holds_private_keys, b.holds_private_keys ? 'bad' : 'good'],
    ['Signs Tx', b.signs_transactions, b.signs_transactions ? 'bad' : 'good'],
    ['Submits Tx', b.submits_transactions, b.submits_transactions ? 'bad' : 'good'],
    ['Human Approval', b.requires_human_approval, b.requires_human_approval ? 'good' : 'warn'],
    ['Autonomous', b.autonomous_execution, b.autonomous_execution ? 'bad' : 'good'],
  ];
  badges.forEach(([label, val, tone]) => {
    const badge = document.createElement('span');
    badge.className = `agent-badge is-${tone}`;
    badge.textContent = `${label}: ${val ? 'true' : 'false'}`;
    container.append(badge);
  });
}

function metricBadge(label, value, tone) {
  const div = document.createElement('div');
  div.style.cssText = 'text-align:center;';
  const lbl = document.createElement('span');
  lbl.style.cssText = 'display:block;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-faint);font-weight:600;';
  lbl.textContent = label;
  const val = document.createElement('strong');
  val.style.cssText = `display:block;font-size:16px;font-family:var(--mono);font-variant-numeric:tabular-nums;margin-top:2px;color:${tone === 'good' ? 'var(--good)' : tone === 'bad' ? 'var(--bad)' : tone === 'accent' ? 'var(--accent)' : 'var(--ink)'};`;
  val.textContent = value;
  div.append(lbl, val);
  return div;
}

/* ------------------------------------------------------------------ */
/* Natural language terminal parser                                     */
/* ------------------------------------------------------------------ */

function parseTerminalPrompt(prompt) {
  const lower = prompt.toLowerCase();
  const modeMatch = lower.match(/\b(observe|paper|dry.run|confirm.each|auto.execute|confirm)\b/);
  const modeMap = { observe: 'observe', paper: 'paper', 'dry.run': 'dry-run', 'dry run': 'dry-run', 'confirm.each': 'confirm-each', 'confirm each': 'confirm-each', confirm: 'confirm-each', 'auto.execute': 'auto-execute', 'auto execute': 'auto-execute' };
  const mode = modeMatch ? (modeMap[modeMatch[1]] || 'paper') : 'paper';

  const strategyMatch = lower.match(/\b(twap|grid|ta)\b/);
  const strategy = strategyMatch ? strategyMatch[1] : 'twap';

  const side = lower.match(/\b(buy|sell|long|short)\b/)?.[0] === 'sell' || lower.match(/\b(sell|short|exit)\b/) ? 'sell' : 'buy';

  const symMatch = lower.match(/\b(sol|btc|eth|jup|bonk|wif)\b/);
  const symMap = { sol: 'SOL', btc: 'BTC', eth: 'ETH', jup: 'JUP', bonk: 'BONK', wif: 'WIF' };
  const symbol = symMatch ? (symMap[symMatch[1]] || 'SOL') : 'SOL';

  const notionalMatch = lower.match(/(\d+)\s*(?:usdc|dollars?|sol|notional)/);
  const notional = notionalMatch ? Number(notionalMatch[1]) : 50;

  return { strategy, mode, side, symbol, notional };
}

/* ------------------------------------------------------------------ */
/* Main mount function                                                 */
/* ------------------------------------------------------------------ */

export function mountPerpsTrading(root) {
  if (!root) return;

  // Set default API URL
  const apiEl = document.getElementById('perps-api');
  if (apiEl) apiEl.value = defaultApiBase();

  const statusEl = document.getElementById('perps-status');
  const outputEl = document.getElementById('perps-json');
  const runBtn = document.getElementById('perps-run');
  const terminalBtn = document.getElementById('perps-terminal-go');
  const terminalInput = document.getElementById('perps-terminal-input');
  const refreshBtn = document.getElementById('perps-refresh');

  let currentStrategy = 'twap';
  let currentMode = 'observe';
  const visualContainer = document.getElementById('perps-visual');
  const safetyContainer = document.getElementById('perps-safety');

  // --- Strategy selector ---
  document.querySelectorAll('[data-perps-strategy]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-perps-strategy]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStrategy = btn.dataset.perpsStrategy;
      updateStrategyUI(currentStrategy);
      updateStrategyDescription(currentStrategy);
    });
  });

  // --- Execution mode selector ---
  document.querySelectorAll('[data-perps-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-perps-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.perpsMode;
    });
  });

  function updateStrategyUI(strategy) {
    const stratDef = STRATEGIES[strategy] || STRATEGIES.twap;
    const defs = stratDef.defaults;

    // Show/hide param groups
    document.getElementById('perps-params-twap')?.classList.toggle('hidden', strategy !== 'twap');
    document.getElementById('perps-params-grid')?.classList.toggle('hidden', strategy !== 'grid');
    document.getElementById('perps-params-ta')?.classList.toggle('hidden', strategy !== 'ta');

    // Populate defaults
    const symbolInput = document.getElementById('perps-symbol');
    if (symbolInput && defs.symbol) symbolInput.value = defs.symbol;
    const sideInput = document.getElementById('perps-side');
    if (sideInput && defs.side) sideInput.value = defs.side;
    const notionalInput = document.getElementById('perps-notional');
    if (notionalInput && defs.notionalUsdc) notionalInput.value = defs.notionalUsdc;
    const slicesInput = document.getElementById('perps-slices');
    if (slicesInput && defs.slices) slicesInput.value = defs.slices;
    const intervalInput = document.getElementById('perps-interval');
    if (intervalInput && defs.intervalSeconds) intervalInput.value = defs.intervalSeconds;
  }

  function updateStrategyDescription(strategy) {
    const el = document.getElementById('perps-strat-desc');
    if (el) el.textContent = STRAT_DESCS[strategy] || '';
  }

  // --- Output renderer ---
  function setStatus(text, cls) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = 'agent-status';
    if (cls) statusEl.classList.add(cls);
  }

  function renderOutput(payload) {
    if (outputEl) outputEl.textContent = JSON.stringify(payload, null, 2);
    renderPlanVisual(payload);
    renderSafetyBoundary(payload);
    renderOrderbook(payload.symbol, payload.mark_price);
  }

  // --- Analyze (live or local) ---
  async function analyze() {
    const apiBase = normalizeApiBase(apiEl?.value || '');
    if (apiBase) window.localStorage.setItem('metaMeshApiBase', apiBase);

    setStatus('generating plan', '');
    if (runBtn) runBtn.disabled = true;

    try {
      if (apiBase) {
        // Live backend call
        setStatus('calling perps backend', 'is-live');
        const symbol = (document.getElementById('perps-symbol')?.value || 'SOL').toUpperCase();
        const side = document.getElementById('perps-side')?.value || 'buy';
        const notional = Number(document.getElementById('perps-notional')?.value || 50);
        const slices = Number(document.getElementById('perps-slices')?.value || 5);
        const interval = Number(document.getElementById('perps-interval')?.value || 60);

        const body = {
          strategy: currentStrategy,
          symbol,
          side,
          notional_usdc: notional,
          mode: currentMode,
          slices,
          interval_seconds: interval,
        };

        const response = await fetch(`${apiBase}/api/perps/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
        setStatus('live perps plan', 'is-live');
        renderOutput(payload);
      } else {
        // Local fallback
        setStatus('local strategy plan', 'is-local');
        renderOutput(localStrategyPlan(currentStrategy, currentMode));
      }
    } catch (error) {
      setStatus('backend error — using local fallback', 'is-error');
      const fallback = localStrategyPlan(currentStrategy, currentMode);
      fallback.backend_error = error instanceof Error ? error.message : String(error);
      renderOutput(fallback);
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
  }

  // --- Terminal NL prompt ---
  function handleTerminalPrompt() {
    const text = terminalInput?.value?.trim();
    if (!text || !terminalBtn) return;
    terminalBtn.disabled = true;
    setStatus('parsing terminal input', 'is-live');

    try {
      const parsed = parseTerminalPrompt(text);

      // Set the UI controls to match
      const symInput = document.getElementById('perps-symbol');
      if (symInput) symInput.value = parsed.symbol;

      const sideInput = document.getElementById('perps-side');
      if (sideInput) sideInput.value = parsed.side;

      const notionalInput = document.getElementById('perps-notional');
      if (notionalInput) notionalInput.value = parsed.notional;

      // Select strategy
      document.querySelectorAll('[data-perps-strategy]').forEach(b => {
        b.classList.toggle('active', b.dataset.perpsStrategy === parsed.strategy);
      });
      currentStrategy = parsed.strategy;
      updateStrategyUI(parsed.strategy);
      updateStrategyDescription(parsed.strategy);

      // Select mode
      document.querySelectorAll('[data-perps-mode]').forEach(b => {
        b.classList.toggle('active', b.dataset.perpsMode === parsed.mode);
      });
      currentMode = parsed.mode;

      setStatus(`parsed: ${parsed.strategy} ${parsed.mode} ${parsed.side} ${parsed.symbol} $${parsed.notional}`, 'is-live');

      // Auto-generate plan
      renderOutput(localStrategyPlan(parsed.strategy, parsed.mode));
    } catch (error) {
      setStatus('parse error', 'is-error');
    } finally {
      terminalBtn.disabled = false;
    }
  }

  // --- Wire up event listeners ---
  if (runBtn) runBtn.addEventListener('click', analyze);
  if (terminalBtn && terminalInput) {
    terminalBtn.addEventListener('click', handleTerminalPrompt);
    terminalInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleTerminalPrompt();
    });
  }
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const symbol = (document.getElementById('perps-symbol')?.value || 'SOL').toUpperCase();
      const price = tickerValues[`${symbol}-PERP`] || tickerValues['SOL-PERP'] || 142.50;
      renderOrderbook(symbol, price);
      setStatus('orderbook refreshed', 'is-local');
    });
  }

  // --- Init ---
  initTicker();
  updateStrategyDescription('twap');
  setStatus('ready — strategy planner', 'is-local');

  // Initial render
  renderOutput(localStrategyPlan('twap', 'observe'));
}

/* ------------------------------------------------------------------ */
/* Auto-mount                                                          */
/* ------------------------------------------------------------------ */

const autoRoot = document.getElementById('perps-root');
if (autoRoot) mountPerpsTrading(autoRoot);

// Export for manual mount
export default mountPerpsTrading;

// Cleanup on page unload
window.addEventListener('beforeunload', stopTicker);