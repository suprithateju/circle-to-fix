# ⭕ Circle to Fix

> A privacy-first Chrome Extension (Manifest V3) that lets you visually annotate layout bugs or UI defects on any live website, automatically detects the exact DOM element code and selector, captures the annotated viewport, and generates a structured, copy-paste prompt for AI coding agents (Claude, ChatGPT, Cursor, Copilot).

---

## 📌 Executive Summary

* **Objective:** Eliminate the friction and ambiguity of manually describing UI bugs to AI coding agents by allowing developers to circle an issue on-screen and immediately generate a precise, context-rich debugging prompt.
* **Methodology:**
  * Uses a Manifest V3 background service worker and content script architecture to inject a full-screen, transparent HTML5 Canvas overlay.
  * Binds keyboard shortcuts (`Alt + C` / `Cmd + Shift + C`) via the Chrome Commands API for instantaneous toggle.
  * Resolves underlying DOM nodes using `document.elementFromPoint(x, y)` to dynamically extract CSS selectors, parent hierarchy, and outer HTML snippets.
  * Generates high-fidelity bug prompts and merges canvas strokes with screenshots via `chrome.tabs.captureVisibleTab`.
* **Expected Outcome:** A responsive, zero-latency in-browser QA utility that works across any website, accurately pinpoints misaligned elements, copies formatted prompt instructions to the clipboard, and runs 100% client-side without sending data to external servers.

---

## 🚀 Key Features

* **Instant Keyboard Shortcut Activation:** Toggle drawing mode on any webpage using `Alt + C` (or `Cmd + Shift + C` on macOS) or the extension toolbar action.
* **Multi-Tool Visual Annotations:** Smooth freehand drawing (circles), bounding boxes, and directional pointer arrows rendered via an HTML5 2D Canvas overlay.
* **Automatic DOM Element Inspection:** Automatically identifies the exact CSS selector, tag name, classes, and HTML code directly beneath your visual drawing.
* **One-Click AI Agent Prompt Generation:** Formats the issue description, target selector, HTML snippet, URL, and viewport dimensions into an optimized prompt ready for LLM coding assistants[cite: 6].
* **Merged Viewport Screenshot Export:** Captures and combines your visual markup with the underlying webpage into a single downloadable PNG[cite: 6].
* **100% Client-Side & Private:** Operates entirely inside the local browser sandbox with zero external API dependencies, tracking scripts, or remote servers[cite: 6].

---

## 🖥️ User Workflow Preview
<img width="1920" height="1080" alt="Screenshot (322)" src="https://github.com/user-attachments/assets/6b2f1436-f56e-40e7-9cda-1e687dbb91d3" />
<img width="573" height="330" alt="image" src="https://github.com/user-attachments/assets/057b2384-8173-4fe1-a28d-cd82cc142d6f" />
<img width="569" height="334" alt="image" src="https://github.com/user-attachments/assets/099c916d-14c5-4e6d-8f97-ad775d75dbda" />

