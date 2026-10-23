// Инициализация Mermaid и Pan-Zoom для интерактивных схем
const initMermaidWithPanZoom = async () => {
  if (typeof mermaid === "undefined") {
    console.warn("Mermaid library is not loaded yet");
    return;
  }

  // Ожидаем загрузки веб-шрифтов, чтобы расчет размеров блоков (bounding box) был точным
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  const isDark = document.body.getAttribute("data-md-color-scheme") === "slate";
  const font = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: isDark ? "dark" : "default",
    fontFamily: font,
    fontSize: 13,
    flowchart: {
      htmlLabels: true,
      useMaxWidth: false,
      padding: 24,
      nodeSpacing: 50,
      rankSpacing: 50,
      curve: "basis",
    },
    themeVariables: {
      fontFamily: font,
      fontSize: "13px",
    },
    themeCSS: `
      .label {
        font-family: ${font} !important;
        font-size: 13px !important;
        line-height: 1.25 !important;
        letter-spacing: normal !important;
      }
      .label foreignObject {
        line-height: 1.25 !important;
        overflow: visible !important;
      }
      .label foreignObject div {
        line-height: 1.25 !important;
        letter-spacing: normal !important;
        text-align: center;
        font-family: ${font} !important;
      }
      .label foreignObject span.nodeLabel {
        line-height: 1.25 !important;
        letter-spacing: normal !important;
        font-family: ${font} !important;
        display: inline-block;
      }
      .edgeLabel {
        font-family: ${font} !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
      }
    `,
  });

  // Находим все контейнеры диаграмм (с поддержкой fence_div_format и стандартных pre)
  const containers = document.querySelectorAll("div.mermaid, pre.mermaid");
  if (!containers.length) return;

  for (let i = 0; i < containers.length; i++) {
    const el = containers[i];
    if (el.dataset.rendered === "true") continue;
    if (!el.isConnected) continue; // Элемент уже удален или заменен
    el.dataset.rendered = "true";

    // Получаем исходный текст графа
    const code = el.textContent.trim();
    if (!code) continue;

    const graphId = `mermaid-graph-${Date.now()}-${i}`;

    try {
      // Рендерим SVG через Mermaid
      const { svg, bindFunctions } = await mermaid.render(graphId, code);

      // Проверяем, что элемент все еще в DOM
      if (!el.isConnected) continue;

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

      // Заменяем исходный блок на интерактивный wrapper
      if (el.parentNode) {
        el.parentNode.replaceChild(wrapper, el);
      } else {
        el.replaceWith(wrapper);
      }

      if (typeof bindFunctions === "function") {
        bindFunctions(viewport);
      }

      const svgElement = viewport.querySelector("svg");
      if (!svgElement) continue;

      // Убираем жесткие ограничения размеров в атрибутах SVG
      svgElement.removeAttribute("height");
      svgElement.style.width = "100%";
      svgElement.style.height = "100%";
      svgElement.style.maxWidth = "100%";

      // Инициализируем svg-pan-zoom
      if (typeof svgPanZoom !== "undefined") {
        try {
          const pz = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.2,
            maxZoom: 15,
            zoomScaleSensitivity: 0.25,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: true,
          });

          // Назначаем обработчики кнопок
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
        } catch (pzErr) {
          console.warn("svgPanZoom init notice:", pzErr);
        }
      }
    } catch (err) {
      console.error("Failed to render mermaid diagram:", err);
      if (el.isConnected) {
        const errBox = document.createElement("div");
        errBox.className = "admonition warning";
        errBox.style.margin = "1.2em 0";
        errBox.innerHTML = `
          <p class="admonition-title">Ошибка синтаксиса схемы Mermaid</p>
          <p><code>${(err.message || String(err)).replace(/</g, "&lt;")}</code></p>
        `;
        el.replaceWith(errBox);
      }
    }
  }
};

// Поддержка стандартной загрузки и instant loading в Material for MkDocs
if (typeof document$ !== "undefined") {
  document$.subscribe(() => {
    initMermaidWithPanZoom();
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  initMermaidWithPanZoom();
} else {
  document.addEventListener("DOMContentLoaded", initMermaidWithPanZoom);
}
