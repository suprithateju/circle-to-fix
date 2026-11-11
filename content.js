let isDrawingModeActive = false;
let currentTool = "circle"; // 'circle' | 'box' | 'arrow'
let canvas, ctx, toolbar, modal;
let isDrawing = false;
let startX = 0, startY = 0;
let points = [];
let capturedElementInfo = null;

// Listen for toggle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TOGGLE_DRAWING_MODE") {
    toggleMode();
  }
});

// Also support Alt+C inside document
document.addEventListener("keydown", (e) => {
  if (e.altKey && (e.key === "c" || e.key === "C")) {
    toggleMode();
  }
});

function toggleMode() {
  isDrawingModeActive = !isDrawingModeActive;
  if (isDrawingModeActive) {
    initOverlay();
  } else {
    removeOverlay();
  }
}

function initOverlay() {
  if (document.getElementById("c2f-canvas-overlay")) return;

  // 1. Create Transparent Canvas
  canvas = document.createElement("canvas");
  canvas.id = "c2f-canvas-overlay";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);

  // 2. Create Floating Toolbar
  toolbar = document.createElement("div");
  toolbar.id = "c2f-toolbar";
  toolbar.innerHTML = `
    <span style="font-weight:700; font-size:12px; margin-right:4px;">⭕ Circle to Fix</span>
    <button class="c2f-tool-btn active" data-tool="circle">⭕ Circle</button>
    <button class="c2f-tool-btn" data-tool="box">⬜ Box</button>
    <button class="c2f-tool-btn" data-tool="arrow">➡️ Arrow</button>
    <div class="c2f-divider"></div>
    <button class="c2f-tool-btn" id="c2f-clear-btn">Clear</button>
    <button class="c2f-tool-btn" id="c2f-close-btn" style="color:#ef4444;">✕ Close (Esc)</button>
  `;
  document.body.appendChild(toolbar);

  // 3. Create Note Input Box
  modal = document.createElement("div");
  modal.id = "c2f-note-modal";
  modal.innerHTML = `
    <div class="c2f-modal-header">
      <span>Describe Issue</span>
      <span style="cursor:pointer;" id="c2f-modal-close">✕</span>
    </div>
    <div class="c2f-element-badge" id="c2f-el-badge">Inspecting element...</div>
    <textarea class="c2f-textarea" id="c2f-user-note" placeholder="What's wrong? (e.g. text overflows on mobile, misaligned button)"></textarea>
    <div class="c2f-actions">
      <button class="c2f-btn-primary" id="c2f-copy-prompt-btn">Copy Prompt ✓</button>
      <button class="c2f-btn-sec" id="c2f-download-snap-btn">📸 Save Image</button>
    </div>
  `;
  document.body.appendChild(modal);

  bindEvents();
}

function removeOverlay() {
  if (canvas) canvas.remove();
  if (toolbar) toolbar.remove();
  if (modal) modal.remove();
  isDrawingModeActive = false;
}

function bindEvents() {
  // Toolbar buttons
  toolbar.querySelectorAll(".c2f-tool-btn[data-tool]").forEach(btn => {
    btn.onclick = () => {
      toolbar.querySelectorAll(".c2f-tool-btn[data-tool]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTool = btn.getAttribute("data-tool");
    };
  });

  document.getElementById("c2f-clear-btn").onclick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    modal.style.display = "none";
  };

  document.getElementById("c2f-close-btn").onclick = removeOverlay;
  document.getElementById("c2f-modal-close").onclick = () => { modal.style.display = "none"; };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isDrawingModeActive) removeOverlay();
  });

  // Canvas drawing events
  canvas.onmousedown = (e) => {
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    points = [{ x: startX, y: startY }];
  };

  canvas.onmousemove = (e) => {
    if (!isDrawing) return;
    points.push({ x: e.clientX, y: e.clientY });

    if (currentTool === "circle") {
      drawSmoothStroke(points);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (currentTool === "box") drawBox(startX, startY, e.clientX, e.clientY);
      if (currentTool === "arrow") drawArrow(startX, startY, e.clientX, e.clientY);
    }
  };

  canvas.onmouseup = (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    // Detect underlying element underneath drawn annotation
    const centerX = (startX + e.clientX) / 2;
    const centerY = (startY + e.clientY) / 2;
    capturedElementInfo = getElementUnderCoordinate(centerX, centerY);

    // Position and display note modal near annotation
    modal.style.display = "block";
    modal.style.left = `${Math.min(window.innerWidth - 340, Math.max(20, e.clientX + 20))}px`;
    modal.style.top = `${Math.min(window.innerHeight - 200, Math.max(60, e.clientY - 20))}px`;
    
    document.getElementById("c2f-el-badge").innerText = capturedElementInfo ? capturedElementInfo.selector : "Body element";
    document.getElementById("c2f-user-note").focus();
  };

  // Generate Prompt Button
  document.getElementById("c2f-copy-prompt-btn").onclick = generateAndCopyPrompt;
  document.getElementById("c2f-download-snap-btn").onclick = downloadAnnotatedView;
}

// Drawing Primitives
function drawSmoothStroke(pts) {
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.stroke();
}

function drawBox(x1, y1, x2, y2) {
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 3.5;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

function drawArrow(fromx, fromy, tox, toy) {
  const headlen = 14;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

// Inspect DOM element directly below coordinate
function getElementUnderCoordinate(x, y) {
  canvas.style.pointerEvents = "none";
  const el = document.elementFromPoint(x, y);
  canvas.style.pointerEvents = "auto";

  if (!el || el === document.body || el === document.documentElement) {
    return { selector: "body", html: "<body>", tag: "BODY" };
  }

  // Construct precise selector
  let selector = el.tagName.toLowerCase();
  if (el.id) selector += `#${el.id}`;
  if (el.classList.length > 0) {
    selector += "." + Array.from(el.classList).slice(0, 2).join(".");
  }

  // Include parent context if element has parent card
  const parent = el.closest(".card, article, section, div[class*='container'], form");
  if (parent && parent !== el) {
    const parentTag = parent.tagName.toLowerCase();
    const parentClass = parent.classList.length ? `.${parent.classList[0]}` : "";
    selector = `${parentTag}${parentClass} > ${selector}`;
  }

  // Clean element HTML snippet (truncate if long)
  const outer = el.outerHTML.split(">")[0] + ">" + el.innerText.slice(0, 40) + `</${el.tagName.toLowerCase()}>`;

  return {
    selector: selector,
    html: outer.replace(/\s+/g, " "),
    tag: el.tagName
  };
}

// Generate Coding Agent Prompt
function generateAndCopyPrompt() {
  const note = document.getElementById("c2f-user-note").value.trim() || "Fix styling alignment and layout overflow.";
  const sel = capturedElementInfo ? capturedElementInfo.selector : "selected element";
  const htmlSnippet = capturedElementInfo ? capturedElementInfo.html : "";

  // Structure engineered for Claude, ChatGPT, Cursor, Copilot
  const fullPrompt = 
`Fix ${sel}: ${note}

Target Element Selector:
\`${sel}\`

Element HTML Reference:
\`\`\`html
${htmlSnippet}
\`\`\`

Page Context:
- URL: ${window.location.href}
- Viewport: ${window.innerWidth}x${window.innerHeight}

Screenshot attached.`;

  navigator.clipboard.writeText(fullPrompt).then(() => {
    showToastNotification(`Fix ${sel}: ${note}`);
    modal.style.display = "none";
  });
}

function showToastNotification(preview) {
  const existing = document.getElementById("c2f-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "c2f-toast";
  toast.innerHTML = `
    <div class="c2f-toast-title">Prompt copied ✓</div>
    <div class="c2f-toast-body">${escapeHtml(preview)}. Screenshot attached.</div>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (toast) toast.remove();
  }, 4500);
}

function downloadAnnotatedView() {
  chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE_TAB" }, (res) => {
    if (res && res.dataUrl) {
      // Merge page screenshot with drawn canvas
      const img = new Image();
      img.onload = () => {
        const mergeCanvas = document.createElement("canvas");
        mergeCanvas.width = window.innerWidth;
        mergeCanvas.height = window.innerHeight;
        const mctx = mergeCanvas.getContext("2d");
        mctx.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
        mctx.drawImage(canvas, 0, 0);

        const a = document.createElement("a");
        a.href = mergeCanvas.toDataURL("image/png");
        a.download = `circle-to-fix-bug-${Date.now()}.png`;
        a.click();
      };
      img.src = res.dataUrl;
    }
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.innerText = str;
  return d.innerHTML;
}