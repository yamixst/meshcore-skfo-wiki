// Инициализация Mermaid и Pan-Zoom
const initMermaidWithPanZoom = async () => {
  if (typeof mermaid === "undefined") {
    console.warn("Mermaid is not loaded yet");
    return;
  }

  const isDark = document.body.getAttribute("data-md-color-scheme") === "slate";
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: isDark ? "dark" : "default",
  });

  const containers = document.querySelectorAll("pre.mermaid, div.mermaid");
  if (!containers.length) return;

  for (let i = 0; i < containers.length; i++) {
    const el = containers[i];
    if (el.dataset.rendered === "true") continue;
    el.dataset.rendered = "true";

    // Получаем исходный текст графа
    const code = el.textContent.trim();
    if (!code) continue;

    const graphId = `mermaid-graph-${Date.now()}-${i}`;

    try {
      // Рендерим SVG
      const { svg } = await mermaid.render(graphId, code);

      // Создаем интерактивный контейнер
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-wrapper";

      const controls = document.createElement("div");
      controls.className = "mermaid-controls";
      controls.innerHTML = `
        <button class="mermaid-btn" data-action="zoom-in" title="Увеличить (Приблизить)">+</button>
        <button class="mermaid-btn" data-action="zoom-out" title="Уменьшить (Отдалить)">−</button>
        <button class="mermaid-btn" data-action="reset" title="Сбросить масштаб и положение">↺</button>
      `;

      const viewport = document.createElement("div");
      viewport.className = "mermaid-viewport";
      viewport.innerHTML = svg;

      wrapper.appendChild(controls);
      wrapper.appendChild(viewport);

      // Заменяем исходный pre на wrapper
      el.parentNode.replaceChild(wrapper, el);

      const svgElement = viewport.querySelector("svg");
      if (!svgElement) continue;

      // Убираем жесткие ограничения размеров в атрибутах SVG
      svgElement.removeAttribute("height");
      svgElement.style.width = "100%";
      svgElement.style.height = "100%";
      svgElement.style.maxWidth = "100%";

      // Инициализируем svg-pan-zoom
      if (typeof svgPanZoom !== "undefined") {
        const pz = svgPanZoom(svgElement, {
          zoomEnabled: true,
          controlIconsEnabled: false,
          fit: true,
          center: true,
          minZoom: 0.2,
          maxZoom: 15,
          zoomScaleSensitivity: 0.2,
          dblClickZoomEnabled: true,
          mouseWheelZoomEnabled: true,
          preventMouseEventsDefault: true,
        });

        // Назначаем события на кнопки
        controls.querySelector('[data-action="zoom-in"]').addEventListener("click", (e) => {
          e.preventDefault();
          pz.zoomIn();
        });

        controls.querySelector('[data-action="zoom-out"]').addEventListener("click", (e) => {
          e.preventDefault();
          pz.zoomOut();
        });

        controls.querySelector('[data-action="reset"]').addEventListener("click", (e) => {
          e.preventDefault();
          pz.reset();
          pz.fit();
          pz.center();
        });

        window.addEventListener("resize", () => {
          pz.resize();
          pz.fit();
          pz.center();
        });
      }
    } catch (err) {
      console.error("Failed to render mermaid diagram:", err);
    }
  }
};

// Поддержка стандартной загрузки и instant loading в Material for MkDocs
if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    initMermaidWithPanZoom();
  });
} else {
  document.addEventListener("DOMContentLoaded", initMermaidWithPanZoom);
}
