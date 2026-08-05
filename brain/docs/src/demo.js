/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */
// ---------------------------------------------------------------------------
// demo.js -- page interactions: scroll-reveal and the architecture ablation
// walkthrough.
//
// The interactive true/typed/decoded sentence explorer that used to live here
// is archived in archive/explorer.js (markup in archive/explorer.html). The
// diff helpers below (alignFlags, renderColored) stayed because the ablation
// walkthrough still needs them.
// ---------------------------------------------------------------------------
import { ABLATION } from './sentences.js';

const CLAWD_TOKEN_ADDRESS = '8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump';
const PUBLIC_META_MESH_API = 'https://brain.x402.wtf';

// --- Scroll reveal ---------------------------------------------------------
const reveals = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// --- Animated figures: load (and thus play) their one-shot SVG only on view --
// The SVG auto-plays its reveal on load, so deferring the src until the figure
// is onscreen makes the animation start exactly then (and only once).
const animFigs = document.querySelectorAll('img.anim-on-view[data-anim-src]');
if (animFigs.length) {
  const load = (img) => { img.src = img.dataset.animSrc; };
  if ('IntersectionObserver' in window) {
    const aio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { load(e.target); aio.unobserve(e.target); }
      }
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0.25 });
    animFigs.forEach((img) => aio.observe(img));
  } else {
    animFigs.forEach(load);
  }
}

// ---------------------------------------------------------------------------
// Diff helper: align a hypothesis string to a reference via edit-distance
// backtrace, returning per-hypothesis-character match flags. Used both to color
// the decoded output against the truth and to underline the participant's typos.
// ---------------------------------------------------------------------------
function alignFlags(hyp, ref) {
  const n = hyp.length, m = ref.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = hyp[i - 1] === ref[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  // Backtrace -> for each hyp char, did it survive as a match?
  const flags = new Array(n).fill(false);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    const cost = hyp[i - 1] === ref[j - 1] ? 0 : 1;
    if (dp[i][j] === dp[i - 1][j - 1] + cost) {
      flags[i - 1] = cost === 0;
      i--; j--;
    } else if (dp[i][j] === dp[i - 1][j] + 1) {
      flags[i - 1] = false; i--;     // insertion in hyp
    } else {
      j--;                            // deletion from ref
    }
  }
  while (i > 0) { flags[i - 1] = false; i--; }
  return flags;
}

function renderColored(text, ref, cls) {
  const flags = alignFlags(text, ref);
  const frag = document.createDocumentFragment();
  for (let k = 0; k < text.length; k++) {
    const span = document.createElement('span');
    span.className = 'c ' + (flags[k] ? 'good' : cls);
    span.textContent = text[k] === ' ' ? '\u00a0' : text[k];
    frag.appendChild(span);
  }
  return frag;
}

// ---------------------------------------------------------------------------
// Architecture ablation walkthrough
// ---------------------------------------------------------------------------
function renderAblation() {
  const host = document.getElementById('ablation-rows');
  if (!host) return;
  // Truth row first (reference).
  const truthRow = document.createElement('div');
  truthRow.className = 'ab-row';
  truthRow.innerHTML = '<div class="ab-stage">Read</div>';
  const truthText = document.createElement('div');
  truthText.className = 'ab-text';
  truthText.textContent = ABLATION.truth;
  truthRow.appendChild(truthText);
  host.appendChild(truthRow);

  for (const stage of ABLATION.stages) {
    const row = document.createElement('div');
    row.className = 'ab-row' + (stage.final ? ' final' : '');
    const label = document.createElement('div');
    label.className = 'ab-stage';
    label.textContent = stage.label;
    const text = document.createElement('div');
    text.className = 'ab-text';
    text.appendChild(renderColored(stage.text, ABLATION.truth, 'bad'));
    row.appendChild(label);
    row.appendChild(text);
    host.appendChild(row);
  }
}
renderAblation();

// ---------------------------------------------------------------------------
// Meta Mesh backend console with a deterministic local fallback.
// ---------------------------------------------------------------------------
function mountMetaClawdDemo() {
  const root = document.getElementById('metaclawd-demo');
  if (!root) return;
  const apiEl = document.getElementById('demo-api');
  const tokenEl = document.getElementById('demo-token');
  const brainEl = document.getElementById('demo-brain');
  const voiceEl = document.getElementById('demo-voice');
  const guiEl = document.getElementById('demo-gui');
  const mediaEl = document.getElementById('demo-media');
  const audioUrlEl = document.getElementById('demo-audio-url');
  const imageUrlEl = document.getElementById('demo-image-url');
  const videoUrlEl = document.getElementById('demo-video-url');
  const guiUrlEl = document.getElementById('demo-gui-url');
  const xaiEl = document.getElementById('demo-xai');
  const opengatewayEl = document.getElementById('demo-opengateway');
  const gobotEl = document.getElementById('demo-gobot');
  const recordEl = document.getElementById('demo-record');
  const iterationsEl = document.getElementById('demo-iterations');
  const visual = document.getElementById('agent-visual');
  const output = document.getElementById('agent-result');
  const status = document.getElementById('agent-status');
  const voiceButton = root.querySelector('[data-agent-voice]');
  const run = root.querySelector('[data-agent-run]');
  const preflight = root.querySelector('[data-agent-preflight]');
  const decisions = root.querySelector('[data-agent-decisions]');
  const handoffs = root.querySelector('[data-agent-handoffs]');
  const reset = root.querySelector('[data-agent-reset]');
  if (!apiEl || !tokenEl || !brainEl || !voiceEl || !output || !run) return;

  const defaults = {
    api: defaultApiBase(),
    token: 'So11111111111111111111111111111111111111112',
    brain: 'buy only if Solana health is ok and liquidity is real',
    voice: 'chart is moving fast, wait for confirmation',
    gui: 'wallet disconnected, proposal only',
    media: '',
    audioUrl: '',
    imageUrl: '',
    videoUrl: '',
    guiUrl: '',
    iterations: '1',
  };

  const setDefaults = () => {
    apiEl.value = defaults.api;
    tokenEl.value = defaults.token;
    brainEl.value = defaults.brain;
    voiceEl.value = defaults.voice;
    if (guiEl) guiEl.value = defaults.gui;
    if (mediaEl) mediaEl.value = defaults.media;
    if (audioUrlEl) audioUrlEl.value = defaults.audioUrl;
    if (imageUrlEl) imageUrlEl.value = defaults.imageUrl;
    if (videoUrlEl) videoUrlEl.value = defaults.videoUrl;
    if (guiUrlEl) guiUrlEl.value = defaults.guiUrl;
    if (iterationsEl) iterationsEl.value = defaults.iterations;
  };

  setDefaults();

  const setStatus = (text, cls) => {
    if (!status) return;
    status.textContent = text;
    status.classList.remove('is-live', 'is-local', 'is-error');
    if (cls) status.classList.add(cls);
  };

  const render = (payload) => {
    if (visual) renderAgentVisual(visual, payload);
    output.textContent = JSON.stringify(payload, null, 2);
  };

  const localAnalyze = (note = 'local fallback') => {
    const tokens = parseList(tokenEl.value).slice(0, 10);
    const token = tokens[0] || '';
    const brain = brainEl.value.trim();
    const voice = voiceEl.value.trim();
    const gui = guiEl ? guiEl.value.trim() : '';
    const mediaUrls = mediaEl ? parseList(mediaEl.value) : [];
    const audioUrls = audioUrlEl ? parseList(audioUrlEl.value) : [];
    const imageUrls = imageUrlEl ? parseList(imageUrlEl.value) : [];
    const videoUrls = videoUrlEl ? parseList(videoUrlEl.value) : [];
    const guiUrls = guiUrlEl ? parseList(guiUrlEl.value) : [];
    const allMediaUrls = [
      ...mediaUrls,
      ...audioUrls,
      ...imageUrls,
      ...videoUrls,
      ...guiUrls,
    ];
    const merged = `${brain} ${voice} ${gui}`.toLowerCase();
    const action = /\b(sell|exit|close)\b/.test(merged)
      ? 'sell'
      : /\b(buy|long|enter|bid|ape)\b/.test(merged)
        ? 'buy'
        : 'watch';
    const hasRiskLanguage = /\b(risk|liquidity|volatile|cooling|only if)\b/.test(merged);
    const confidence = Math.min(0.74, 0.42 + (token ? 0.12 : 0) + (hasRiskLanguage ? 0.2 : 0));

    setStatus(note, note === 'backend error' ? 'is-error' : 'is-local');
    return {
      agent: 'Meta Mesh for the Brain',
      harness: 'MetaClawd',
      network: 'solana',
      source: note,
      token_address: token || null,
      token_addresses: tokens,
      action,
      confidence: Number(confidence.toFixed(2)),
      tools_planned: [
        'helius_get_asset',
        'birdeye_get_price',
        'draft_phoenix_perps_strategy',
        'plasma_amm_profile',
        'gitlawb_opengateway_chat',
        'xai_web_search',
        'voice_image_video_context',
      ],
      perception: {
        brain2qwerty_sentence: brain,
        voice_transcript: voice,
        gui_observation: gui,
        media_urls: mediaUrls,
        audio_urls: audioUrls,
        image_urls: imageUrls,
        video_urls: videoUrls,
        gui_urls: guiUrls,
        chain_observation: 'RPC_URL slot, health, epoch, and TPS sampled server-side',
        research_context: 'TRIBE v2 + DECOMEG / SpanishBCBL metadata attached server-side',
      },
      xai: {
        enabled: Boolean(xaiEl && xaiEl.checked),
        public_media_urls: allMediaUrls,
      },
      opengateway: {
        enabled: Boolean(opengatewayEl && opengatewayEl.checked),
        model_response: false,
      },
      automation_context: {
        phoenix_perps_plan: {
          strategy: 'twap',
          symbol: 'SOL',
          mode: 'paper',
          submits_transaction: false,
        },
        plasma_amm: {
          venue_type: 'sandwich-resistant AMM',
          swap_execution: false,
        },
        gobot_runtime: {
          name: 'GOBotSolanaRuntimeBridge',
          mode: 'read_only_context',
          source: {
            repo: 'Solizardking/GOBot',
            available: Boolean(gobotEl && gobotEl.checked),
          },
          runtime_contract: {
            executes_go_commands: false,
            reads_private_keys: false,
            signs_transactions: false,
            submits_transactions: false,
            operator_approval_required: true,
          },
        },
      },
      optimal_response: {
        status: 'approval_required',
        recommended_action: action === 'buy' || action === 'sell' ? 'watch' : action,
        confidence_label: confidence >= 0.5 ? 'moderate' : 'low',
        brain_input_mode: 'decoded text, not telepathy',
      },
      watchlist_response: {
        response_type: 'solana_watchlist_ranking',
        status: 'approval_required',
        token_count: tokens.length,
        top_token: token || null,
        ranked_tokens: tokens.map((address, index) => ({
          rank: index + 1,
          token_address: address,
          recommended_action: action === 'buy' || action === 'sell' ? 'watch' : action,
          confidence_label: confidence >= 0.5 ? 'moderate' : 'low',
          submits_transactions: false,
        })),
      },
      evidence_matrix: {
        matrix_type: 'solana_token_evidence_matrix',
        status: 'approval_required',
        token_count: tokens.length,
        rows: tokens.map((address, index) => ({
          source_index: index,
          token_address: address,
          proposal_action: action,
          recommended_action: action === 'buy' || action === 'sell' ? 'watch' : action,
          confidence: Number(confidence.toFixed(2)),
          confidence_label: confidence >= 0.5 ? 'moderate' : 'low',
          evidence_status: 'missing_critical',
          critical_missing_evidence: [
            'rpc_chain_state',
            'helius_asset_metadata',
            'birdeye_price_liquidity',
          ],
          source_availability: {
            rpc_chain_state: false,
            helius_asset_metadata: false,
            birdeye_price_liquidity: false,
            xai_model_response: false,
            opengateway_model_response: false,
            public_media_urls: allMediaUrls.length > 0,
            phoenix_perps_plan: true,
            plasma_amm_context: true,
            gobot_ooda_context: Boolean(gobotEl && gobotEl.checked),
          },
          ranking_basis: 'local fallback explains intent only; backend evidence is required',
          requires_external_quote_or_simulation: action === 'buy' || action === 'sell',
          contains_quote: false,
          contains_transaction: false,
          signs_transactions: false,
          submits_transactions: false,
        })),
        source_summary: {
          chain_state_live: false,
          public_media_urls: allMediaUrls.length,
          phoenix_perps_plan_count: 1,
          plasma_amm_context: true,
          gobot_ooda_context: Boolean(gobotEl && gobotEl.checked),
          missing_critical_rows: tokens.length,
        },
        safety_boundary: {
          requires_human_approval: true,
          holds_private_keys: false,
          signs_transactions: false,
          submits_transactions: false,
          contains_transaction: false,
        },
      },
      operator_queues: {
        approval_queue: 'token buy/sell proposals that need manual review',
        decision_queue: 'mission optimal_response reviews with Phoenix and Plasma context',
      },
      operator_handoff: {
        packet_type: 'operator_trade_review_handoff',
        status: 'approval_required',
        token_addresses: tokens,
        contains_transaction: false,
        signs_transaction: false,
        submits_transaction: false,
      },
      execution_plan: {
        status: 'approval_required',
        phoenix_perps_default_mode: 'paper',
        signs_transaction: false,
        submits_transaction: false,
      },
      risk_notes: [
        'proposal only',
        'no browser-side API keys',
        'human approval required before any Solana transaction',
      ],
    };
  };

  const liveAnalyze = async () => {
    const apiBase = normalizeApiBase(apiEl.value);
    if (!apiBase) {
      render(localAnalyze('local fallback'));
      return;
    }

    window.localStorage.setItem('metaMeshApiBase', apiBase);
    setStatus('calling backend', 'is-live');
    run.disabled = true;

    const body = {
      token_address: parseList(tokenEl.value)[0] || null,
      token_addresses: parseList(tokenEl.value).slice(0, 10),
      intent: 'watch liquidity, chain health, and perps risk',
      brain_sentence: brainEl.value.trim(),
      voice_transcript: voiceEl.value.trim(),
      gui_notes: guiEl && guiEl.value.trim() ? [guiEl.value.trim()] : [],
      realtime_query: 'latest Solana market context',
      include_plasma: true,
      inspect_plasma_rpc: false,
      include_gobot: Boolean(gobotEl ? gobotEl.checked : true),
      gobot_notes: ['frontend operator requested GOBot OODA and risk context'],
      media_urls: mediaEl ? parseList(mediaEl.value) : [],
      audio_urls: audioUrlEl ? parseList(audioUrlEl.value) : [],
      image_urls: imageUrlEl ? parseList(imageUrlEl.value) : [],
      video_urls: videoUrlEl ? parseList(videoUrlEl.value) : [],
      gui_urls: guiUrlEl ? parseList(guiUrlEl.value) : [],
      use_xai: Boolean(xaiEl && xaiEl.checked),
      use_opengateway: Boolean(opengatewayEl && opengatewayEl.checked),
      record_to_ledger: Boolean(recordEl && recordEl.checked),
      perps: {
        strategy: 'twap',
        symbol: 'SOL',
        side: 'buy',
        notional_usdc: 50,
        mode: 'paper',
        slices: 5,
        interval_seconds: 60,
        max_step_notional_usdc: 10,
      },
    };
    const iterations = clampInt(iterationsEl ? iterationsEl.value : '1', 1, 5);
    const path = iterations > 1 ? '/api/mission/loop' : '/api/mesh/analyze';
    if (iterations > 1) {
      body.iterations = iterations;
      body.interval_seconds = 0;
    }

    try {
      const response = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || `HTTP ${response.status}`);
      }
      setStatus('live backend', 'is-live');
      render(payload);
    } catch (error) {
      const fallback = localAnalyze('backend error');
      fallback.backend_error = error instanceof Error ? error.message : String(error);
      fallback.backend_url = apiBase;
      render(fallback);
    } finally {
      run.disabled = false;
    }
  };

  const fetchJson = async (path, statusLabel) => {
    const apiBase = normalizeApiBase(apiEl.value);
    if (!apiBase) {
      render(localAnalyze('local fallback'));
      return;
    }

    window.localStorage.setItem('metaMeshApiBase', apiBase);
    setStatus(statusLabel, 'is-live');
    const response = await fetch(`${apiBase}${path}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.detail || `HTTP ${response.status}`);
    }
    setStatus('live backend', 'is-live');
    render(payload);
  };

  run.addEventListener('click', liveAnalyze);

  if (voiceButton) {
    voiceButton.addEventListener('click', () => {
      startSpeechCapture({
        target: voiceEl,
        setStatus,
        render,
        fallback: () => localAnalyze('voice unavailable'),
      });
    });
  }

  if (preflight) {
    preflight.addEventListener('click', async () => {
      try {
        const path = opengatewayEl && opengatewayEl.checked
          ? '/api/preflight?live_opengateway_check=true'
          : '/api/preflight';
        await fetchJson(path, 'checking backend');
      } catch (error) {
        const fallback = localAnalyze('backend error');
        fallback.backend_error = error instanceof Error ? error.message : String(error);
        render(fallback);
      }
    });
  }

  if (decisions) {
    decisions.addEventListener('click', async () => {
      try {
        await fetchJson('/api/ledger/decisions', 'loading decisions');
      } catch (error) {
        const fallback = localAnalyze('backend error');
        fallback.backend_error = error instanceof Error ? error.message : String(error);
        render(fallback);
      }
    });
  }

  if (handoffs) {
    handoffs.addEventListener('click', async () => {
      try {
        await fetchJson('/api/ledger/handoffs', 'loading handoffs');
      } catch (error) {
        const fallback = localAnalyze('backend error');
        fallback.backend_error = error instanceof Error ? error.message : String(error);
        render(fallback);
      }
    });
  }

  if (reset) {
    reset.addEventListener('click', () => {
      setDefaults();
      if (xaiEl) xaiEl.checked = false;
      if (opengatewayEl) opengatewayEl.checked = false;
      if (gobotEl) gobotEl.checked = true;
      if (recordEl) recordEl.checked = false;
      render(localAnalyze('local fallback'));
    });
  }

  render(localAnalyze('local fallback'));
}

mountMetaClawdDemo();

// ---------------------------------------------------------------------------
// Clawd brain burn terminal: Helius DAS stats + NL approval-gated burn plan.
// ---------------------------------------------------------------------------
function mountClawdBurnTerminal() {
  const root = document.querySelector('[data-burn-terminal]');
  if (!root) return;

  const apiEl = document.getElementById('burn-api');
  const walletEl = document.getElementById('burn-wallet');
  const promptEl = document.getElementById('burn-prompt');
  const targetUsdEl = document.getElementById('burn-target-usd');
  const maxPctEl = document.getElementById('burn-max-pct');
  const useModelEl = document.getElementById('burn-use-model');
  const autoEl = document.getElementById('burn-auto');
  const status = root.querySelector('[data-burn-status]');
  const refresh = root.querySelector('[data-burn-refresh]');
  const ask = root.querySelector('[data-burn-ask]');
  const scoreboard = root.querySelector('[data-burn-scoreboard]');
  const transcript = root.querySelector('[data-burn-transcript]');
  const json = root.querySelector('[data-burn-json]');

  if (!apiEl || !walletEl || !promptEl || !scoreboard || !transcript || !json) return;

  apiEl.value = defaultApiBase();
  walletEl.value = window.localStorage.getItem('metaMeshBurnWallet') || '';

  const setBurnStatus = (text, tone = 'standby') => {
    if (!status) return;
    status.textContent = text;
    status.className = `burn-live-pill is-${tone}`;
  };

  const renderBurnPayload = (payload) => {
    renderBurnScoreboard(scoreboard, payload);
    transcript.textContent = burnTranscript(payload);
    json.textContent = JSON.stringify(payload, null, 2);
  };

  const endpointBase = () => {
    const apiBase = normalizeApiBase(apiEl.value);
    if (apiBase) {
      window.localStorage.setItem('metaMeshApiBase', apiBase);
      return apiBase;
    }
    return '';
  };

  const refreshStats = async ({ silent = false } = {}) => {
    const apiBase = endpointBase();
    if (!apiBase) {
      setBurnStatus('local fallback', 'warn');
      renderBurnPayload(localBurnPayload('No backend URL configured.'));
      return;
    }

    if (!silent) setBurnStatus('syncing helius', 'live');
    if (refresh) refresh.disabled = true;
    try {
      const response = await fetch(`${apiBase}/api/clawd/stats`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      setBurnStatus('helius live', 'live');
      renderBurnPayload(payload);
    } catch (error) {
      setBurnStatus('backend error', 'bad');
      renderBurnPayload(localBurnPayload(error instanceof Error ? error.message : String(error)));
    } finally {
      if (refresh) refresh.disabled = false;
    }
  };

  const askAgent = async () => {
    const apiBase = endpointBase();
    const wallet = walletEl.value.trim();
    if (!wallet) {
      setBurnStatus('wallet required', 'warn');
      renderBurnPayload(localBurnPayload('Paste a wallet public address before asking for a burn plan.'));
      walletEl.focus();
      return;
    }
    if (!apiBase) {
      setBurnStatus('local fallback', 'warn');
      renderBurnPayload(localBurnPayload('No backend URL configured.'));
      return;
    }

    window.localStorage.setItem('metaMeshBurnWallet', wallet);
    setBurnStatus('routing model', 'live');
    if (ask) ask.disabled = true;
    try {
      const body = {
        wallet_address: wallet,
        prompt: promptEl.value.trim() || 'Talk about this wallet and ask before burning $CLAWD.',
        token_address: CLAWD_TOKEN_ADDRESS,
        target_usd: clampFloat(targetUsdEl ? targetUsdEl.value : 5, 0, 1000000, 5),
        max_balance_pct: clampFloat(maxPctEl ? maxPctEl.value : 1, 0, 100, 1),
        use_model: Boolean(useModelEl && useModelEl.checked),
        max_tokens: 512,
      };
      const response = await fetch(`${apiBase}/api/terminal/clawd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      setBurnStatus('approval gated', 'live');
      renderBurnPayload(payload);
    } catch (error) {
      setBurnStatus('backend error', 'bad');
      renderBurnPayload(localBurnPayload(error instanceof Error ? error.message : String(error), wallet));
    } finally {
      if (ask) ask.disabled = false;
    }
  };

  if (refresh) refresh.addEventListener('click', () => refreshStats());
  if (ask) ask.addEventListener('click', askAgent);

  window.setInterval(() => {
    if (document.hidden || !autoEl || !autoEl.checked) return;
    refreshStats({ silent: true });
  }, 30000);

  renderBurnPayload(localBurnPayload('Ready for live Helius DAS stats.'));
  refreshStats({ silent: true });
}

mountClawdBurnTerminal();

function renderAgentVisual(host, payload) {
  host.replaceChildren();
  const mission = extractMissionOutput(payload);
  if (mission) {
    renderMissionVisual(host, mission);
    return;
  }
  renderGenericVisual(host, payload);
}

function extractMissionOutput(payload) {
  if (!isObject(payload)) return null;
  if (isObject(payload.result)) return payload.result;
  if (Array.isArray(payload.outputs) && payload.outputs.length) {
    const latest = payload.outputs[payload.outputs.length - 1];
    return isObject(latest) ? latest : null;
  }
  if (payload.optimal_response || payload.evidence_matrix || payload.watchlist_response) {
    return payload;
  }
  return null;
}

function renderMissionVisual(host, mission) {
  const optimal = isObject(mission.optimal_response) ? mission.optimal_response : {};
  const matrix = isObject(mission.evidence_matrix) ? mission.evidence_matrix : {};
  const watchlist = isObject(mission.watchlist_response) ? mission.watchlist_response : {};
  const handoff = isObject(mission.operator_handoff) ? mission.operator_handoff : {};
  const boundary = firstObject(
    matrix.safety_boundary,
    optimal.approval_gate,
    handoff.safety_boundary,
    mission.execution_boundary,
  );
  const tokenCount = matrix.token_count
    ?? watchlist.token_count
    ?? (Array.isArray(mission.proposals) ? mission.proposals.length : 0);

  const summary = document.createElement('div');
  summary.className = 'agent-summary';
  summary.append(
    metric('Action', cleanAction(
      optimal.recommended_action || watchlist.top_recommended_action || mission.action || 'watch',
    ), 'primary'),
    metric('Confidence', confidenceText(optimal, matrix), confidenceTone(optimal, matrix)),
    metric('Tokens', String(tokenCount || 0), ''),
    metric('Boundary', boundaryText(boundary), boundaryTone(boundary)),
  );
  host.append(summary);
  appendSafetyStrip(host, boundary);
  appendEvidenceMatrix(host, matrix, watchlist);
  appendWatchlist(host, watchlist);
  appendHandoffSummary(host, handoff);
}

function renderGenericVisual(host, payload) {
  const source = isObject(payload) ? payload : {};
  const ready = firstObject(source.ready, source.safety, source.safety_boundary);
  const summary = document.createElement('div');
  summary.className = 'agent-summary';
  summary.append(
    metric('Payload', source.mode || source.name || 'Meta Mesh', 'primary'),
    metric('Missing', String(Array.isArray(source.missing) ? source.missing.length : 0), ''),
    metric('OpenGateway', opengatewayStatusText(source), opengatewayStatusTone(source)),
    metric('Approvals', countText(source.approval_requests), ''),
    metric('Handoffs', countText(source.handoff_requests), ''),
  );
  host.append(summary);
  appendSafetyStrip(host, ready);
  if (Array.isArray(source.missing) && source.missing.length) {
    appendListSection(host, 'Missing Evidence', source.missing);
  }
  if (Array.isArray(source.recommendations) && source.recommendations.length) {
    appendListSection(host, 'Recommendations', source.recommendations);
  }
  if (Array.isArray(source.decision_requests) && source.decision_requests.length) {
    appendListSection(
      host,
      'Decision Queue',
      source.decision_requests.slice(0, 5).map((item) => {
        const action = item.recommended_action || item.status || 'review';
        return `${action} ${shortToken(item.token_address || item.decision_id || '')}`;
      }),
    );
  }
  if (Array.isArray(source.handoff_requests) && source.handoff_requests.length) {
    appendListSection(
      host,
      'Handoff Queue',
      source.handoff_requests.slice(0, 5).map((item) => {
        const status = item.status || 'review';
        return `${status} ${shortToken(item.token_address || item.handoff_id || '')}`;
      }),
    );
  }
}

function appendSafetyStrip(host, boundary) {
  if (!isObject(boundary) || !Object.keys(boundary).length) return;
  const strip = document.createElement('div');
  strip.className = 'agent-safety-strip';
  const keys = [
    'holds_private_keys',
    'signs_transactions',
    'submits_transactions',
    'contains_transaction',
    'contains_signed_transaction',
    'autonomous_execution',
    'requires_human_approval',
    'human_approval_required',
  ];
  for (const key of keys) {
    if (!(key in boundary)) continue;
    strip.append(statusBadge(`${labelize(key)}: ${String(boundary[key])}`, safetyTone(key, boundary[key])));
  }
  if (strip.children.length) host.append(strip);
}

function appendEvidenceMatrix(host, matrix, watchlist) {
  const rows = Array.isArray(matrix.rows) ? matrix.rows : [];
  if (!rows.length) return;
  const section = sectionShell('Evidence Matrix');
  const rankByToken = new Map(
    (Array.isArray(watchlist.ranked_tokens) ? watchlist.ranked_tokens : [])
      .map((item) => [item.token_address, item.rank]),
  );
  const table = document.createElement('table');
  table.className = 'agent-evidence-table';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const label of ['Token', 'Action', 'Evidence', 'Confidence', 'Sources', 'Missing', 'Safety']) {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.append(th);
  }
  head.append(headRow);
  table.append(head);
  const body = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.append(
      cell(`#${rankByToken.get(row.token_address) || row.source_index + 1} ${shortToken(row.token_address || '')}`),
      cell(cleanAction(row.recommended_action || row.proposal_action || 'watch')),
      badgeCell(statusBadge(row.evidence_status || 'partial', evidenceTone(row.evidence_status))),
      cell(confidenceText(row, matrix)),
      sourceCell(row.source_availability),
      cell(listText(row.critical_missing_evidence || row.missing_evidence)),
      badgeCell(statusBadge(row.contains_transaction ? 'tx present' : 'no transaction', row.contains_transaction ? 'bad' : 'good')),
    );
    body.append(tr);
  }
  table.append(body);
  section.append(table);
  host.append(section);
}

function appendWatchlist(host, watchlist) {
  const ranked = Array.isArray(watchlist.ranked_tokens) ? watchlist.ranked_tokens : [];
  if (!ranked.length) return;
  const section = sectionShell('Watchlist Rank');
  const grid = document.createElement('div');
  grid.className = 'agent-rank-grid';
  for (const item of ranked.slice(0, 6)) {
    const card = document.createElement('div');
    card.className = 'agent-rank-card';
    const title = document.createElement('strong');
    title.textContent = `#${item.rank || '?'} ${shortToken(item.token_address || '')}`;
    const action = document.createElement('span');
    action.textContent = cleanAction(item.recommended_action || item.proposal_action || 'watch');
    const confidence = document.createElement('small');
    confidence.textContent = confidenceText(item, watchlist);
    card.append(title, action, confidence);
    grid.append(card);
  }
  section.append(grid);
  host.append(section);
}

function appendHandoffSummary(host, handoff) {
  if (!isObject(handoff) || !Array.isArray(handoff.packets)) return;
  const quoteRequired = handoff.packets.some((packet) => {
    const quote = isObject(packet.quote_or_simulation_required)
      ? packet.quote_or_simulation_required
      : {};
    return quote.required_before_wallet_action === true;
  });
  const section = sectionShell('Operator Handoff');
  const strip = document.createElement('div');
  strip.className = 'agent-safety-strip';
  strip.append(
    statusBadge(`${handoff.packets.length} packets`, 'neutral'),
    statusBadge(quoteRequired ? 'fresh quote required' : 'review only', quoteRequired ? 'warn' : 'good'),
    statusBadge(handoff.safety_boundary?.contains_transaction ? 'tx present' : 'no transaction', handoff.safety_boundary?.contains_transaction ? 'bad' : 'good'),
  );
  section.append(strip);
  host.append(section);
}

function appendListSection(host, title, items) {
  const section = sectionShell(title);
  const list = document.createElement('ul');
  list.className = 'agent-list';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = String(item);
    list.append(li);
  }
  section.append(list);
  host.append(section);
}

function sectionShell(title) {
  const section = document.createElement('section');
  section.className = 'agent-visual-section';
  const heading = document.createElement('h3');
  heading.textContent = title;
  section.append(heading);
  return section;
}

function renderBurnScoreboard(host, payload) {
  host.replaceChildren();
  const result = firstObject(payload.result);
  const stats = firstObject(result.token_stats, payload.stats, payload.token_stats);
  const wallet = firstObject(result.wallet_stats, payload.wallet);
  const burn = firstObject(result.burn_plan, payload.burn_plan);
  const holding = firstObject(wallet.holding);
  const suggested = firstObject(burn.suggested_burn);
  const route = firstObject(result.model_route);
  const price = clawdPrice(stats, wallet);
  const supply = clawdSupply(stats);
  const safety = firstObject(result.safety_boundary, payload.safety);

  const summary = document.createElement('div');
  summary.className = 'agent-summary burn-summary';
  summary.append(
    metric('Price', price === null ? 'not live' : formatUsd(price), price === null ? 'warn' : 'good'),
    metric('Supply', supply || 'not live', supply ? 'primary' : 'warn'),
    metric('Wallet CLAWD', formatTokenAmount(holding.ui_amount ?? 0), holding.found ? 'good' : 'warn'),
    metric('Suggested Burn', formatTokenAmount(suggested.ui_amount ?? 0), burn.status === 'pending_human_approval' ? 'warn' : 'primary'),
  );
  host.append(summary);

  const strip = document.createElement('div');
  strip.className = 'agent-safety-strip burn-state-strip';
  strip.append(
    statusBadge(`burn: ${labelize(burn.status || 'stats only')}`, burn.status === 'pending_human_approval' ? 'warn' : 'good'),
    statusBadge(route.provider ? `route: ${route.provider}` : 'route: none', route.provider ? 'primary' : 'neutral'),
    statusBadge('no server signing', 'good'),
    statusBadge('human approval required', 'good'),
  );
  host.append(strip);

  const statsSection = sectionShell('Live CLAWD Stats');
  statsSection.append(burnStatsTable(stats, wallet, burn));
  host.append(statsSection);

  const largest = largestAccounts(stats).slice(0, 4);
  if (largest.length) {
    const holders = sectionShell('Largest Accounts');
    const grid = document.createElement('div');
    grid.className = 'agent-rank-grid';
    largest.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'agent-rank-card';
      const title = document.createElement('strong');
      title.textContent = `#${index + 1} ${shortToken(item.address || '')}`;
      const amount = document.createElement('span');
      amount.textContent = formatTokenAmount(item.uiAmountString ?? item.uiAmount ?? item.amount);
      const note = document.createElement('small');
      note.textContent = 'Helius RPC largest token account';
      card.append(title, amount, note);
      grid.append(card);
    });
    holders.append(grid);
    host.append(holders);
  }

  appendSafetyStrip(host, safety);
}

function burnStatsTable(stats, wallet, burn) {
  const table = document.createElement('table');
  table.className = 'agent-evidence-table';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Field', 'Value', 'Source'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.append(th);
  });
  head.append(headRow);
  table.append(head);

  const token = firstObject(wallet.token);
  const holding = firstObject(wallet.holding);
  const suggested = firstObject(burn.suggested_burn);
  const rows = [
    ['Mint', stats.token_address || wallet.token_address || CLAWD_TOKEN_ADDRESS, 'CLAWD constant'],
    ['Symbol', stats.symbol || token.symbol || 'CLAWD', 'Helius getAsset'],
    ['Decimals', stats.decimals ?? token.decimals ?? 'unknown', 'Helius token_info'],
    ['Wallet token account', holding.token_account || 'none found', holding.source || 'wallet scan'],
    ['Wallet balance', formatTokenAmount(holding.ui_amount ?? 0), 'Helius searchAssets/getTokenAccounts'],
    ['Burn amount', formatTokenAmount(suggested.ui_amount ?? 0), 'rate policy'],
    ['Burn value', suggested.estimated_usd === null || suggested.estimated_usd === undefined ? 'not priced' : formatUsd(suggested.estimated_usd), 'price x amount'],
  ];
  const body = document.createElement('tbody');
  rows.forEach(([field, value, source]) => {
    const tr = document.createElement('tr');
    tr.append(cell(field), cell(value), cell(source));
    body.append(tr);
  });
  table.append(body);
  return table;
}

function burnTranscript(payload) {
  const result = firstObject(payload.result);
  if (result.terminal_response) return result.terminal_response;
  if (payload.error) return `meta-mesh: ${payload.error}`;
  const stats = firstObject(payload.stats, result.token_stats);
  const price = clawdPrice(stats, {});
  if (price !== null) {
    return `meta-mesh: CLAWD is live through Helius DAS at ${formatUsd(price)}. Paste a wallet and ask before burning.`;
  }
  return `meta-mesh: ${payload.note || 'waiting for live backend stats'}`;
}

function localBurnPayload(note, walletAddress = '') {
  return {
    name: 'Meta Mesh for the Brain',
    source: 'local fallback',
    note,
    error: note,
    stats: {
      token_address: CLAWD_TOKEN_ADDRESS,
      symbol: 'CLAWD',
      data_freshness: {
        source: 'local fallback',
        requires_backend_refresh: true,
      },
    },
    wallet: {
      wallet_address: walletAddress || null,
      token_address: CLAWD_TOKEN_ADDRESS,
      holding: {
        found: false,
        ui_amount: 0,
      },
    },
    burn_plan: {
      status: 'discussion_only',
      suggested_burn: {
        ui_amount: 0,
        estimated_usd: null,
      },
      approval_request: {
        required: false,
        contains_transaction: false,
        signs_transactions: false,
        submits_transactions: false,
      },
    },
    safety: {
      holds_private_keys: false,
      reads_private_keys: false,
      signs_transactions: false,
      submits_transactions: false,
      human_approval_required: true,
    },
  };
}

function metric(label, value, tone) {
  const item = document.createElement('div');
  item.className = ['agent-metric', tone ? `is-${tone}` : ''].filter(Boolean).join(' ');
  const key = document.createElement('span');
  key.textContent = label;
  const val = document.createElement('strong');
  val.textContent = value === undefined || value === null || value === ''
    ? 'none'
    : String(value);
  item.append(key, val);
  return item;
}

function statusBadge(label, tone) {
  const badge = document.createElement('span');
  badge.className = ['agent-badge', tone ? `is-${tone}` : ''].filter(Boolean).join(' ');
  badge.textContent = label;
  return badge;
}

function cell(value) {
  const td = document.createElement('td');
  td.textContent = String(value || 'none');
  return td;
}

function badgeCell(node) {
  const td = document.createElement('td');
  td.append(node);
  return td;
}

function sourceCell(source) {
  const td = document.createElement('td');
  const wrap = document.createElement('div');
  wrap.className = 'agent-source-badges';
  const labels = [
    ['rpc_chain_state', 'RPC'],
    ['helius_asset_metadata', 'Helius'],
    ['birdeye_price_liquidity', 'Birdeye'],
    ['xai_model_response', 'xAI'],
    ['opengateway_model_response', 'GitLawb'],
    ['public_media_urls', 'Media'],
    ['phoenix_perps_plan', 'Phoenix'],
    ['plasma_amm_context', 'Plasma'],
    ['gobot_ooda_context', 'GOBot'],
  ];
  const sourceMap = isObject(source) ? source : {};
  for (const [key, label] of labels) {
    if (!(key in sourceMap)) continue;
    wrap.append(statusBadge(label, sourceMap[key] ? 'good' : 'bad'));
  }
  if (!wrap.children.length) wrap.append(statusBadge('none', 'bad'));
  td.append(wrap);
  return td;
}

function firstObject(...items) {
  for (const item of items) {
    if (isObject(item)) return item;
  }
  return {};
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function countText(value) {
  return String(Array.isArray(value) ? value.length : 0);
}

function opengatewayStatusText(payload) {
  const gateway = isObject(payload.capabilities)
    ? payload.capabilities.gitlawb_opengateway
    : null;
  if (!isObject(gateway)) return 'not checked';
  const live = isObject(gateway.live_observation) ? gateway.live_observation : {};
  if (live.state === 'insufficient_credits') return 'needs credits';
  if (live.state) return labelize(String(live.state));
  if (gateway.configured === true) {
    return gateway.live_check_requested ? 'configured' : 'key set';
  }
  if (gateway.configured === false) return 'missing key';
  return 'not checked';
}

function opengatewayStatusTone(payload) {
  const gateway = isObject(payload.capabilities)
    ? payload.capabilities.gitlawb_opengateway
    : null;
  if (!isObject(gateway)) return '';
  const live = isObject(gateway.live_observation) ? gateway.live_observation : {};
  if (live.ok === true) return 'good';
  if (live.state === 'insufficient_credits') return 'warn';
  if (live.state) return 'bad';
  return gateway.configured ? 'warn' : 'bad';
}

function confidenceText(primary, fallback) {
  const source = isObject(primary) ? primary : {};
  const backup = isObject(fallback) ? fallback : {};
  const label = source.confidence_label || backup.confidence_label || 'unrated';
  const value = source.confidence ?? backup.confidence;
  return value === undefined || value === null
    ? label
    : `${label} ${Number(value).toFixed(2)}`;
}

function confidenceTone(primary, fallback) {
  const source = isObject(primary) ? primary : {};
  const backup = isObject(fallback) ? fallback : {};
  const value = Number(source.confidence ?? backup.confidence ?? 0);
  if (value >= 0.75) return 'good';
  if (value >= 0.5) return 'warn';
  return 'bad';
}

function boundaryText(boundary) {
  if (!isObject(boundary)) return 'approval gate';
  if (boundary.signs_transactions === false && boundary.submits_transactions === false) {
    return 'no signing';
  }
  return boundary.status || 'approval gate';
}

function boundaryTone(boundary) {
  if (!isObject(boundary)) return 'warn';
  if (
    boundary.holds_private_keys === true
    || boundary.signs_transactions === true
    || boundary.submits_transactions === true
    || boundary.autonomous_execution === true
  ) {
    return 'bad';
  }
  return 'good';
}

function safetyTone(key, value) {
  const dangerous = [
    'holds_private_keys',
    'signs_transactions',
    'submits_transactions',
    'contains_transaction',
    'contains_signed_transaction',
    'autonomous_execution',
  ];
  if (dangerous.includes(key)) return value ? 'bad' : 'good';
  if (key.includes('approval')) return value ? 'good' : 'warn';
  return value ? 'warn' : 'good';
}

function evidenceTone(status) {
  if (status === 'complete') return 'good';
  if (status === 'partial') return 'warn';
  return 'bad';
}

function cleanAction(value) {
  return String(value || 'watch').replaceAll('_', ' ');
}

function labelize(value) {
  return String(value || '').replaceAll('_', ' ');
}

function listText(value) {
  if (!Array.isArray(value) || !value.length) return 'none';
  return value.join(', ');
}

function shortToken(value) {
  const text = String(value || '');
  if (!text) return 'none';
  if (text.length <= 12) return text;
  return `${text.slice(0, 5)}...${text.slice(-5)}`;
}

function defaultApiBase() {
  const configured = window.META_MESH_API_URL || window.localStorage.getItem('metaMeshApiBase');
  if (configured) return normalizeApiBase(configured);
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return window.location.origin;
  }
  if (window.location.hostname.endsWith('.onrender.com')) {
    return window.location.origin;
  }
  if (window.location.hostname.endsWith('.x402.wtf')) {
    return window.location.origin;
  }
  return PUBLIC_META_MESH_API;
}

function normalizeApiBase(value) {
  const clean = String(value || '').trim().replace(/\/+$/, '');
  if (!clean) return '';
  try {
    return new URL(clean).origin;
  } catch {
    return '';
  }
}

function parseList(value) {
  return String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampInt(value, min, max) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}

function clampFloat(value, min, max, fallback) {
  const parsed = Number.parseFloat(String(value || ''));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function clawdPrice(stats, wallet) {
  const priceInfo = firstObject(
    stats.price_info,
    firstObject(wallet.token).price_info,
    firstObject(wallet.holding).price_info,
  );
  const price = Number(priceInfo.price_per_token ?? priceInfo.price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function clawdSupply(stats) {
  const value = firstObject(stats.supply).value;
  const supply = firstObject(value).uiAmountString ?? firstObject(value).uiAmount;
  return supply === undefined || supply === null ? '' : formatTokenAmount(supply);
}

function largestAccounts(stats) {
  const value = firstObject(stats.largest_accounts).value;
  return Array.isArray(value) ? value : [];
}

function formatTokenAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value || '0');
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: numeric >= 1000 ? 0 : 4,
    notation: numeric >= 1000000 ? 'compact' : 'standard',
  }).format(numeric);
}

function formatUsd(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 'not priced';
  const digits = numeric < 0.01 ? 8 : 4;
  return `$${numeric.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, digits),
    maximumFractionDigits: digits,
  })}`;
}

function startSpeechCapture({ target, setStatus, render, fallback }) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus('voice unavailable', 'is-error');
    render(fallback());
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;
  let finalText = '';

  recognition.onstart = () => setStatus('listening', 'is-live');
  recognition.onerror = (event) => {
    setStatus(event.error || 'voice error', 'is-error');
  };
  recognition.onresult = (event) => {
    let interim = '';
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0].transcript.trim();
      if (event.results[index].isFinal) {
        finalText = [finalText, transcript].filter(Boolean).join(' ');
      } else {
        interim = transcript;
      }
    }
    target.value = [finalText, interim].filter(Boolean).join(' ');
  };
  recognition.onend = () => {
    if (target.value.trim()) {
      setStatus('voice captured', 'is-local');
    } else {
      setStatus('voice empty', 'is-error');
      render(fallback());
    }
  };
  recognition.start();
}
