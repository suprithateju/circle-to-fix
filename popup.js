document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnStartDrawing").onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "TOGGLE_DRAWING_MODE" });
        window.close(); // Close popup so user can immediately draw
      }
    });
  };
});