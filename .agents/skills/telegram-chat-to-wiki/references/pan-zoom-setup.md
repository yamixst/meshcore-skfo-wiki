# Интерактивное масштабирование диаграмм Mermaid (Pan & Zoom)

При визуализации разветвленных сетей, топологий и региональных переходов стандартный рендеринг Mermaid сжимает диаграмму по ширине контейнера (`max-width: 100%`), из-за чего текст и узлы становятся слишком мелкими и нечитаемыми на экранах мобильных устройств и ноутбуков.

---

## 1. Архитектура решения

Решение базируется на связке двух легковесных библиотек, сохраненных локально в репозитории (для автономности и независимости от внешних CDN):

1. **`mermaid.min.js`** — движок рендеринга диаграмм из текстовой разметки в векторные элементы `<svg>`.
2. **`svg-pan-zoom.min.js`** — библиотека для управления SVG (зум колесиком мыши/жестом, панорамирование перетаскиванием, встроенные кнопки управления `+`, `−`, `↺ Reset`).
3. **`mermaid.js` (скрипт инициализации)** — перехватывает сгенерированный SVG и оборачивает его в масштабируемый контейнер с управляющими кнопками.

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
- Скачать вендорные минифицированные скрипты:
  ```bash
  curl -sSL -o wiki/javascripts/mermaid.min.js https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js
  curl -sSL -o wiki/javascripts/svg-pan-zoom.min.js https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js
  ```

---

## 3. Стилизация контейнера (`extra.css`)

```css
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
  min-height: 320px;
}

.svg-pan-zoom-control {
  cursor: pointer;
}
```

---

## 4. Скрипт инициализации (`mermaid.js`)

Скрипт ожидает событие `DOMContentLoaded`, инициализирует тему (с поддержкой переключения «светлая / темная» тема Material for MkDocs) и для каждого блока `.mermaid` монтирует зум-контроллер:

```javascript
document.addEventListener("DOMContentLoaded", function () {
  if (typeof mermaid === "undefined") return;

  mermaid.initialize({
    startOnLoad: false,
    theme: document.body.getAttribute("data-md-color-scheme") === "slate" ? "dark" : "default",
    securityLevel: "loose"
  });

  document.querySelectorAll(".mermaid").forEach((el, index) => {
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
```
