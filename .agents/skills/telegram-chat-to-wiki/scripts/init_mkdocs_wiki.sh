#!/usr/bin/env bash
# Initialize a modern MkDocs Material Wiki project
set -euo pipefail

WIKI_DIR="${1:-wiki}"
SITE_NAME="${2:-Community Wiki}"

echo "==> Initializing Wiki directory structure..."
mkdir -p "${WIKI_DIR}/stylesheets"
mkdir -p "${WIKI_DIR}/javascripts"

# Create minimal index.md if not exists
if [ ! -f "${WIKI_DIR}/index.md" ]; then
  cat << 'EOF' > "${WIKI_DIR}/index.md"
# База знаний сообщества

> 📅 **Дата актуальности информации:** $(date +'%d %B %Y г.')

Добро пожаловать в структурированную базу знаний сообщества!

## Навигация по разделам
- Разделы наполняются на основе инженерного анализа логов чата.
EOF
fi

# Create modern typography CSS
cat << 'EOF' > "${WIKI_DIR}/stylesheets/extra.css"
:root {
  --md-text-font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --md-code-font: "JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

body, .md-typeset {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
}

.md-typeset code {
  font-size: 0.85em;
  border-radius: 4px;
}

.mermaid-zoom-container {
  position: relative;
  width: 100%;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 6px;
  overflow: hidden;
  background: var(--md-code-bg-color);
  margin: 1.5em 0;
}

.mermaid-zoom-container svg {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 250px;
}
EOF

# Create Mermaid zoom/pan integration script
cat << 'EOF' > "${WIKI_DIR}/javascripts/mermaid.js"
document.addEventListener("DOMContentLoaded", function () {
  if (typeof mermaid === "undefined") return;

  mermaid.initialize({
    startOnLoad: false,
    theme: document.body.getAttribute("data-md-color-scheme") === "slate" ? "dark" : "default",
    securityLevel: "loose"
  });

  const elements = document.querySelectorAll(".mermaid");
  elements.forEach((el, index) => {
    const id = "mermaid-diagram-" + index;
    const code = el.textContent.trim();
    el.innerHTML = "";

    mermaid.render(id, code).then(({ svg }) => {
      const container = document.createElement("div");
      container.className = "mermaid-zoom-container";
      container.innerHTML = svg;
      el.parentNode.replaceChild(container, el);

      const svgElement = container.querySelector("svg");
      if (svgElement && typeof svgPanZoom !== "undefined") {
        svgPanZoom(svgElement, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.5,
          maxZoom: 10
        });
      }
    }).catch(err => {
      console.error("Mermaid render error:", err);
      el.textContent = code;
    });
  });
});
EOF

echo "==> Wiki initialized in '${WIKI_DIR}'!"
