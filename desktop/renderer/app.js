const BACKEND_URL = "http://localhost:8000";

let feishuActive = false;
let binding = { type: "", id: "", label: "" };
let searchTimeout = null;

const $ = (sel) => document.querySelector(sel);

const petBar = $("#pet-bar");
const expandedPanel = $("#expanded-panel");
const feishuDot = $("#feishu-dot");
const feishuWarning = $("#feishu-warning");
const draftInput = $("#draft-input");
const resultArea = $("#result-area");
const polishedText = $("#polished-text");
const sendStatus = $("#send-status");
const loading = $("#loading");
const bindingLabel = $("#binding-label");
const btnBind = $("#btn-bind");
const bindPanel = $("#bind-panel");
const btnCollapse = $("#btn-collapse");

// Bind panel elements
const tabSearch = $("#tab-search");
const tabManual = $("#tab-manual");
const bindSearch = $("#bind-search");
const bindManual = $("#bind-manual");
const searchInput = $("#search-input");
const searchResults = $("#search-results");
const bindInput = $("#bind-input");
const bindType = $("#bind-type");
const btnBindConfirm = $("#btn-bind-confirm");

function updateFeishuStatus(active) {
  feishuActive = active;
  feishuDot.className = "status-dot " + (active ? "online" : "offline");
  feishuWarning.classList.toggle("hidden", active);
}

function updateBindingUI() {
  if (binding.id) {
    bindingLabel.textContent = `${binding.type === "chat_id" ? "群聊" : "用户"}: ${binding.id.slice(0, 12)}...`;
    bindingLabel.style.color = "#a5b4fc";
  } else {
    bindingLabel.textContent = "未绑定目标";
    bindingLabel.style.color = "";
  }
}

window.desktopAPI.onToggleExpand((expanded) => {
  if (expanded) {
    expandedPanel.classList.remove("hidden");
    petBar.querySelector(".pet-label").textContent = "已展开";
    setTimeout(() => draftInput.focus(), 100);
  } else {
    expandedPanel.classList.add("hidden");
    petBar.querySelector(".pet-label").textContent = "Ctrl+Alt+Space 展开";
  }
});

window.desktopAPI.onFeishuStatus((active) => {
  updateFeishuStatus(active);
});

window.desktopAPI.getFeishuStatus().then(updateFeishuStatus);

btnCollapse.addEventListener("click", () => {
  window.desktopAPI.collapse();
});

btnBind.addEventListener("click", () => {
  bindPanel.classList.toggle("hidden");
});

// Tab switching
tabSearch.addEventListener("click", () => {
  tabSearch.classList.add("active");
  tabManual.classList.remove("active");
  bindSearch.classList.remove("hidden");
  bindManual.classList.add("hidden");
});

tabManual.addEventListener("click", () => {
  tabManual.classList.add("active");
  tabSearch.classList.remove("active");
  bindManual.classList.remove("hidden");
  bindSearch.classList.add("hidden");
});

// Search chats
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchChats(searchInput.value.trim()), 400);
});

async function searchChats(query) {
  searchResults.innerHTML = "";
  try {
    const resp = await fetch(`${BACKEND_URL}/desktop/lark/chats?query=${encodeURIComponent(query)}`);
    const data = await resp.json();
    if (!data.ok || !data.chats.length) {
      searchResults.innerHTML = '<div class="search-item" style="color:rgba(255,255,255,0.3)">无结果</div>';
      return;
    }
    data.chats.forEach((chat) => {
      const el = document.createElement("div");
      el.className = "search-item";
      el.textContent = chat.name || chat.chatId;
      el.addEventListener("click", () => {
        binding = { type: "chat_id", id: chat.chatId, label: chat.name };
        updateBindingUI();
        bindPanel.classList.add("hidden");
      });
      searchResults.appendChild(el);
    });
  } catch {
    searchResults.innerHTML = '<div class="search-item" style="color:#f87171">搜索失败</div>';
  }
}

btnBindConfirm.addEventListener("click", () => {
  const id = bindInput.value.trim();
  const type = bindType.value;
  if (!id) return;
  binding = { type, id, label: id };
  updateBindingUI();
  bindPanel.classList.add("hidden");
  bindInput.value = "";
});

draftInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    await polishAndSend();
  }
  if (e.key === "Escape") {
    window.desktopAPI.collapse();
  }
});

async function polishAndSend() {
  const draft = draftInput.value.trim();
  if (!draft) return;

  loading.classList.remove("hidden");
  resultArea.classList.add("hidden");
  sendStatus.textContent = "";
  sendStatus.className = "send-status";

  try {
    const body = {
      draft,
      target_type: binding.type || "",
      target_id: binding.id || "",
      context: "",
    };

    const resp = await fetch(`${BACKEND_URL}/desktop/polish-send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    polishedText.textContent = data.polishedText || draft;
    resultArea.classList.remove("hidden");

    if (data.sent) {
      if (data.messageId && data.messageId.startsWith("dry-")) {
        sendStatus.textContent = "✓ dry-run 模式，未实际发送";
        sendStatus.className = "send-status dry";
      } else {
        sendStatus.textContent = "✓ 已发送到飞书";
        sendStatus.className = "send-status success";
      }
      draftInput.value = "";
    } else {
      sendStatus.textContent = data.sendError || "未发送";
      sendStatus.className = "send-status error";
    }
  } catch (err) {
    resultArea.classList.remove("hidden");
    polishedText.textContent = draft;
    sendStatus.textContent = "后端不可用: " + err.message;
    sendStatus.className = "send-status error";
  } finally {
    loading.classList.add("hidden");
  }
}
