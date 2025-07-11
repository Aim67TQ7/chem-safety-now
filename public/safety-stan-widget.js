/*  Sara Safety Widget – demo bubble version
    Put this file in /public so the browser can load /sara-safety-widget.js
*/
(function () {
  window.SaraSafety = {
    init(cfg) {
      console.log("Sara Safety Widget initialized with config:", cfg);

      const bubble = document.createElement("div");
      bubble.className = "sara-safety-bubble";
      bubble.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        max-width: 320px;
        background: #6366f1;
        color: #ffffff;
        padding: 16px 20px;
        border-radius: 14px;
        z-index: 99999;
        font: 14px/1.35 Arial, sans-serif;
        box-shadow: 0 6px 18px rgba(0,0,0,.3);
        cursor: pointer;
      `;
      bubble.innerHTML = `
        <strong>Sara Safety Assistant</strong><br>
        Click to start a chat&hellip;
      `;
      bubble.onclick = () =>
        alert("Here’s where the production chat UI would open.");
      document.body.appendChild(bubble);
    },

    updateConfig(cfg) {
      console.log("Sara Safety config updated:", cfg);
    },

    destroy() {
      document
        .querySelectorAll(".sara-safety-bubble")
        .forEach((n) => n.remove());
      console.log("Sara Safety widget destroyed");
    },
  };

  // Auto-init if config exists
  if (window.SaraSafetyConfig) window.SaraSafety.init(window.SaraSafetyConfig);
})();
