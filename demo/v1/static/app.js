'use strict';

let energy = 100;
let isRecording = false;
let recognition = null;
let demoRunning = false;

const WS_BASE = `ws://${location.host}`;
let customerWs = null;
let agentWs = null;

function setStatus(text) {
  document.getElementById('statusText').textContent = text;
}

function setConnStatus(connected) {
  const el = document.getElementById('connStatus');
  el.innerHTML = connected
    ? '&#x1F7E2; 已连接'
    : '&#x1F534; 未连接';
}

function addMsg(chatId, html, cls = '') {
  const chat = document.getElementById(chatId);
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  div.innerHTML = html;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function addTyping(chatId) {
  removeTyping(chatId);
  const chat = document.getElementById(chatId);
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = chatId + '_typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping(chatId) {
  const el = document.getElementById(chatId + '_typing');
  if (el) el.remove();
}

function updateEnergy(score) {
  energy = Math.max(0, energy - score * 6);
  const fill = document.getElementById('energyFill');
  const val = document.getElementById('energyValue');
  fill.style.width = energy + '%';
  val.textContent = Math.round(energy) + '%';
  fill.className = 'energy-bar-fill ' +
    (energy > 60 ? 'energy-high' : energy > 30 ? 'energy-mid' : 'energy-low');
  if (energy <= 20) showRestReminder();
}

function showRestReminder() {
  if (document.querySelector('.rest-reminder')) return;
  const div = document.createElement('div');
  div.className = 'rest-reminder';
  div.innerHTML = `
    <h3>&#x26A0; 情绪电量过低</h3>
    <p>您已连续处理多个高压对话，建议休息 5 分钟</p>
    <button class="btn btn-danger" onclick="this.parentElement.remove()">我知道了</button>`;
  document.body.appendChild(div);
}

// --- WebSocket ---
function connectCustomerWs() {
  customerWs = new WebSocket(WS_BASE + '/ws/customer');
  customerWs.onopen = () => setConnStatus(true);
  customerWs.onclose = () => {
    setConnStatus(false);
    setTimeout(connectCustomerWs, 2000);
  };
  customerWs.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'agent_reply') {
      addMsg('customerChat', data.text, 'msg-agent');
    }
  };
}

function connectAgentWs() {
  agentWs = new WebSocket(WS_BASE + '/ws/agent');
  agentWs.onclose = () => setTimeout(connectAgentWs, 2000);
  agentWs.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === 'analyzing') {
      addTyping('agentChat');
      setStatus('AI 正在分析情绪...');
    } else if (data.type === 'ai_card') {
      removeTyping('agentChat');
      renderAICard(data.result, data.original);
      updateEnergy(data.result.emotion_score || 2);
      setStatus('翻译完成');
    } else if (data.type === 'draft') {
      addMsg('agentChat',
        `<span style="color:var(--text-dim)">&#x270D; 我的草稿：</span> ${data.text}`,
        'msg-agent');
    } else if (data.type === 'polished') {
      renderPolishedCard(data.result, data.original);
      setStatus('优化完成，等待确认');
    } else if (data.type === 'sent') {
      setStatus('消息已发送给客户');
    } else if (data.type === 'error') {
      removeTyping('agentChat');
      addMsg('agentChat',
        `<span style="color:var(--danger)">错误: ${data.message}</span>`,
        'msg-system');
      setStatus('出错');
    }
  };
}

// --- Customer Actions ---
function customerSend() {
  const input = document.getElementById('customerInput');
  const text = input.value.trim();
  if (!text || !customerWs) return;
  input.value = '';
  addMsg('customerChat', text, 'msg-customer');
  customerWs.send(JSON.stringify({ text }));
}

// --- Agent Actions ---
function agentDraft() {
  const input = document.getElementById('agentInput');
  const text = input.value.trim();
  if (!text || !agentWs) return;
  input.value = '';
  agentWs.send(JSON.stringify({ action: 'draft', text }));
}

function agentSend(encodedText) {
  const text = decodeURIComponent(encodedText);
  if (!agentWs) return;
  agentWs.send(JSON.stringify({ action: 'send', text }));
}

// --- Render Cards ---
function renderAICard(result, originalText) {
  const emotionCls = result.emotion_level === 'extreme' ? 'emotion-extreme' :
    result.emotion_level === 'angry' ? 'emotion-angry' : 'emotion-mild';
  const emotionLabel = result.emotion_level === 'extreme' ? '极端' :
    result.emotion_level === 'angry' ? '愤怒' : '轻微不满';
  const riskHtml = (result.risk_flags || [])
    .map(f => `<span class="risk-tag">${f}</span>`).join('');
  const cardId = 'card_' + Date.now();

  const html = `
    <div class="ai-card-header">
      <span>&#x1F916;</span> AI 情绪翻译
      <span class="emotion-tag ${emotionCls}">${emotionLabel}</span>
    </div>
    <div class="ai-field">
      <div class="ai-field-label">过滤后消息</div>
      <div class="ai-field-value">${escapeHtml(result.filtered_text)}</div>
    </div>
    <div class="ai-field">
      <div class="ai-field-label">核心诉求</div>
      <div class="ai-field-value">${escapeHtml(result.core_request)}</div>
    </div>
    ${riskHtml ? `<div class="ai-field"><div class="ai-field-label">风险标签</div><div class="risk-tags">${riskHtml}</div></div>` : ''}
    <div class="suggested-reply" onclick="document.getElementById('agentInput').value=this.textContent.trim()">
      &#x1F4A1; ${escapeHtml(result.suggested_reply)}
    </div>
    <button class="view-original-btn" onclick="toggleOriginal('${cardId}')">&#x1F441; 查看原文</button>
    <div class="original-text" id="${cardId}">${escapeHtml(originalText)}</div>`;

  addMsg('agentChat', html, 'msg-ai-card');
}

function renderPolishedCard(result, originalDraft) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'msg msg-ai-card';
  cardDiv.style.maxWidth = '92%';
  const encodedPolished = encodeURIComponent(result.polished_text);
  const encodedOriginal = encodeURIComponent(originalDraft);
  cardDiv.innerHTML = `
    <div class="ai-card-header"><span>&#x2728;</span> AI 话术优化</div>
    <div class="polished-card">
      <div class="label">优化版本 (${escapeHtml(result.tone)})</div>
      <div class="text">${escapeHtml(result.polished_text)}</div>
    </div>
    <div style="font-size:0.72rem;color:var(--text-dim);margin-top:6px">修改：${escapeHtml(result.changes)}</div>
    <div class="polished-actions">
      <button class="btn btn-success" onclick="sendPolished(this, '${encodedPolished}')">&#x2713; 发送优化版</button>
      <button class="btn btn-ghost" onclick="sendPolished(this, '${encodedOriginal}')">发送原文</button>
    </div>`;
  document.getElementById('agentChat').appendChild(cardDiv);
  document.getElementById('agentChat').scrollTop =
    document.getElementById('agentChat').scrollHeight;
}

function sendPolished(btn, encodedText) {
  const actions = btn.closest('.polished-actions');
  actions.innerHTML = '<span style="font-size:0.75rem;color:var(--agent-accent)">&#x2713; 已发送</span>';
  agentSend(encodedText);
}

function toggleOriginal(id) {
  document.getElementById(id).classList.toggle('show');
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// --- Voice ---
function toggleVoice() {
  const btn = document.getElementById('voiceBtn');
  if (isRecording) {
    isRecording = false;
    btn.classList.remove('recording');
    if (recognition) recognition.stop();
    return;
  }
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('浏览器不支持语音识别，请使用 Chrome');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    document.getElementById('customerInput').value = e.results[0][0].transcript;
    btn.classList.remove('recording');
    isRecording = false;
  };
  recognition.onerror = () => { btn.classList.remove('recording'); isRecording = false; };
  recognition.onend = () => { btn.classList.remove('recording'); isRecording = false; };
  recognition.start();
  isRecording = true;
  btn.classList.add('recording');
}

// --- Auto Demo ---
const DEMO_SCRIPT = [
  { role: 'customer', text: '我的外卖呢？？？等了快一个小时了！！！你们是不是不想送了？' },
  { role: 'agent', text: '骑手堵路上了没办法', delay: 4000 },
  { role: 'customer', text: '加急个屁！退钱！你们就是骗子公司！垃圾！', delay: 5000 },
  { role: 'agent', text: '行，给你退', delay: 4000 },
  { role: 'customer', text: '你们都是废物吗？这点事都做不好？我要投诉你！', delay: 5000 },
  { role: 'agent', text: '好的您稍等我处理', delay: 4000 },
];

async function runDemo() {
  if (demoRunning) return;
  demoRunning = true;
  resetDemo();
  await sleep(500);
  setStatus('自动演示中...');

  for (const step of DEMO_SCRIPT) {
    if (!demoRunning) break;
    await sleep(step.delay || 2000);
    if (!demoRunning) break;

    if (step.role === 'customer') {
      document.getElementById('customerInput').value = step.text;
      await sleep(600);
      customerSend();
      await waitForTypingDone('agentChat', 15000);
    } else {
      await sleep(1500);
      document.getElementById('agentInput').value = step.text;
      await sleep(600);
      agentDraft();
      await sleep(3000);
      const lastBtn = document.querySelector('.polished-actions .btn-success:last-of-type');
      if (lastBtn) lastBtn.click();
      await sleep(1000);
    }
  }
  demoRunning = false;
  setStatus('演示完成');
}

function waitForTypingDone(chatId, timeout) {
  return new Promise(resolve => {
    const start = Date.now();
    const check = () => {
      if (!document.getElementById(chatId + '_typing') || Date.now() - start > timeout) {
        resolve();
      } else {
        setTimeout(check, 300);
      }
    };
    setTimeout(check, 500);
  });
}

function resetDemo() {
  demoRunning = false;
  document.getElementById('customerChat').innerHTML =
    '<div class="msg msg-system">对话开始 — 客户将在此发送消息</div>';
  document.getElementById('agentChat').innerHTML =
    '<div class="msg msg-system">等待客户消息 — AI 将自动翻译情绪</div>';
  energy = 100;
  const fill = document.getElementById('energyFill');
  const val = document.getElementById('energyValue');
  fill.style.width = '100%';
  val.textContent = '100%';
  fill.className = 'energy-bar-fill energy-high';
  setStatus('已重置');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Init ---
connectCustomerWs();
connectAgentWs();
