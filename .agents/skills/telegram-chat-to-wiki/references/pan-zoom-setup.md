# Интерактивное масштабирование диаграмм Mermaid (Pan & Zoom)

При визуализации разветвленных сетей, топологий и региональных переходов стандартный рендеринг Mermaid сжимает диаграмму по ширине контейнера (`max-width: 100%`), из-за чего текст и узлы становятся слишком мелкими и нечитаемыми на экранах мобильных устройств и ноутбуков.

---

## 1. Архитектура решения и критический нюанс Material for MkDocs

Решение базируется на связке двух легковесных библиотек, сохраненных локально в репозитории (для автономности и независимости от внешних CDN):

1. **`mermaid.min.js`** — движок рендеринга диаграмм из текстовой разметки в векторные элементы `<svg>`.
2. **`svg-pan-zoom.min.js`** — библиотека для управления SVG (зум колесиком мыши/жестом, панорамирование перетаскиванием, встроенные кнопки управления `+`, `−`, `↺ Reset`).
3. **`mermaid.js` (кастомный инициализатор)** — компилирует диаграммы, монтирует кнопки зума и подключает pan-zoom.

> [!IMPORTANT]
> **Критический нюанс `pymdownx.superfences` и Material for MkDocs**:
> Если в `mkdocs.yml` указать `format: !!python/name:pymdownx.superfences.fence_code_format`, MkDocs сгенерирует `<pre class="mermaid"><code>...</code></pre>`.
> Тема Material for MkDocs перехватывает все `pre.mermaid` и **инкапсулирует их в закрытый Shadow DOM (`mode: 'closed'`)**, делая невозможным доступ к `<svg>` для сторонних скриптов панорамирования!
> **Решение:** использовать `fence_div_format`:
> ```yaml
>   - pymdownx.superfences:
>       custom_fences:
>         - name: mermaid
>           class: mermaid
>           format: !!python/name:pymdownx.superfences.fence_div_format
> ```
> Это создает `<div class="mermaid">...</div>`, не трогается Shadow DOM темы и полностью доступно для интерактивного Pan & Zoom.

---

## 2. Размещение файлов в проекте

```text
wiki/
├── javascripts/
│   ├── mermaid.min.js
│   ├── svg-pan-zoom.min.js
│   └── mermaid.js
└── stylesheets/
    └── extra.css
```

### Локальные библиотеки:
Скачать вендорные скрипты:
```bash
curl -sSL -o wiki/javascripts/mermaid.min.js https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js
curl -sSL -o wiki/javascripts/svg-pan-zoom.min.js https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js
```

---

## 3. Стилизация контейнера (`extra.css`)

```css
.mermaid-wrapper {
  position: relative;
  width: 100%;
  margin: 1.2em 0;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 8px;
  background-color: var(--md-default-bg-color);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.mermaid-wrapper .mermaid-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
  background: var(--md-default-bg-color);
  padding: 2px 4px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--md-default-fg-color--lightest);
}

.mermaid-wrapper .mermaid-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 13px;
  font-weight: bold;
  color: var(--md-default-fg-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  transition: background 0.15s ease;
}

.mermaid-wrapper .mermaid-btn:hover {
  background-color: var(--md-accent-fg-color--transparent);
  color: var(--md-accent-fg-color);
}

.mermaid-viewport {
  width: 100%;
  height: 480px;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  /* Изоляция типографики диаграмм от наследования стилей .md-typeset */
  line-height: normal !important;
  letter-spacing: normal !important;
}

.mermaid-viewport:active {
  cursor: grabbing;
}

.mermaid-viewport svg {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  font-family: var(--md-text-font, "Inter", sans-serif) !important;
}

/* Фиксация шрифта и высоты строки внутри блоков Mermaid */
.mermaid-viewport .label,
.mermaid-viewport .nodeLabel,
.mermaid-viewport .edgeLabel {
  font-family: var(--md-text-font, "Inter", sans-serif) !important;
  letter-spacing: normal !important;
}

.mermaid-viewport .label foreignObject {
  line-height: 1.25 !important;
  overflow: visible !important;
}

.mermaid-viewport .label foreignObject div {
  line-height: 1.25 !important;
  letter-spacing: normal !important;
  font-family: var(--md-text-font, "Inter", sans-serif) !important;
  text-align: center;
}

.mermaid-viewport .label foreignObject span.nodeLabel {
  line-height: 1.25 !important;
  letter-spacing: normal !important;
  font-family: var(--md-text-font, "Inter", sans-serif) !important;
  display: inline-block;
  white-space: normal;
}

.mermaid-viewport .edgeLabel {
  line-height: 1.2 !important;
  font-size: 11px !important;
}
```

---

## 4. Скрипт инициализации (`mermaid.js`)

Скрипт рендерит `.mermaid`, монтирует элементы управления зумом и связывает с `svg-pan-zoom`:

```javascript
const initMermaidWithPanZoom = async () => {
  if (typeof mermaid === "undefined") return;

  const isDark = document.body.getAttribute("data-md-color-scheme") === "slate";
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: isDark ? "dark" : "default",
  });

  const containers = document.querySelectorAll("div.mermaid, pre.mermaid");
  if (!containers.length) return;

  for (let i = 0; i < containers.length; i++) {
    const el = containers[i];
    if (el.dataset.rendered === "true") continue;
    if (!el.isConnected) continue;
    el.dataset.rendered = "true";

    const code = el.textContent.trim();
    if (!code) continue;

    const graphId = `mermaid-graph-${Date.now()}-${i}`;

    try {
      const { svg, bindFunctions } = await mermaid.render(graphId, code);
      if (!el.isConnected) continue;

      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-wrapper";

      const controls = document.createElement("div");
      controls.className = "mermaid-controls";
      controls.innerHTML = `
        <button class="mermaid-btn" data-action="zoom-in" title="Увеличить">+</button>
        <button class="mermaid-btn" data-action="zoom-out" title="Уменьшить">−</button>
        <button class="mermaid-btn" data-action="reset" title="Сбросить">↺</button>
      `;

      const viewport = document.createElement("div");
      viewport.className = "mermaid-viewport";
      viewport.innerHTML = svg;

      wrapper.appendChild(controls);
      wrapper.appendChild(viewport);

      if (el.parentNode) {
        el.parentNode.replaceChild(wrapper, el);
      } else {
        el.replaceWith(wrapper);
      }

      if (typeof bindFunctions === "function") bindFunctions(viewport);

      const svgElement = viewport.querySelector("svg");
      if (!svgElement) continue;

      svgElement.removeAttribute("height");
      svgElement.style.width = "100%";
      svgElement.style.height = "100%";
      svgElement.style.maxWidth = "100%";

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

          controls.querySelector('[data-action="zoom-in"]').addEventListener("click", (e) => { e.preventDefault(); pz.zoomIn(); });
          controls.querySelector('[data-action="zoom-out"]').addEventListener("click", (e) => { e.preventDefault(); pz.zoomOut(); });
          controls.querySelector('[data-action="reset"]').addEventListener("click", (e) => { e.preventDefault(); pz.reset(); pz.fit(); pz.center(); });
          window.addEventListener("resize", () => { pz.resize(); pz.fit(); pz.center(); });
        } catch (pzErr) {
          console.warn(pzErr);
        }
      }
    } catch (err) {
      console.error("Mermaid error:", err);
    }
  }
};

if (typeof document$ !== "undefined") {
  document$.subscribe(() => { initMermaidWithPanZoom(); });
}
if (document.readyState === "complete" || document.readyState === "interactive") {
  initMermaidWithPanZoom();
} else {
  document.addEventListener("DOMContentLoaded", initMermaidWithPanZoom);
}
```
