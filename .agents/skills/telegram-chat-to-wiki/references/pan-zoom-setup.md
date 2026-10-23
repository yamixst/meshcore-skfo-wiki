# Интерактивное масштабирование диаграмм Mermaid (Pan & Zoom)

При визуализации разветвленных сетей, топологий и региональных переходов стандартный рендеринг Mermaid сжимает диаграмму по ширине контейнера (`max-width: 100%`), из-за чего текст и узлы становятся слишком мелкими и нечитаемыми на экранах мобильных устройств и ноутбуков.

---

## 1. Архитектура решения и критические нюансы

Решение базируется на связке двух легковесных библиотек, сохраненных локально в репозитории:

1. **`mermaid.min.js`** — движок рендеринга диаграмм из текстовой разметки в векторные элементы `<svg>`.
2. **`svg-pan-zoom.min.js`** — библиотека для управления SVG.
3. **`mermaid.js` (кастомный инициализатор)** — компилирует диаграммы, монтирует кнопки зума, исключает перехват скролла и обеспечивает поддержку сенсорных экранов.

> [!IMPORTANT]
> **1. Защита от Shadow DOM в Material for MkDocs**:
> Использовать `format: !!python/name:pymdownx.superfences.fence_div_format` в `mkdocs.yml`, чтобы тема не инкапсулировала диаграммы в закрытый Shadow DOM.
>
> **2. Защита от ловушки скролла (Scroll Hijacking)**:
> - На Desktop колесико мыши по умолчанию **прокручивает страницу сайта**, не застревая на схеме. Зум колесом активируется только при зажатой клавише `Ctrl` / `Cmd` (с показом плавающей подсказки).
> - На Mobile один палец **свободно скроллит страницу**. Масштабирование и панорамирование на тач-экранах выполняется жестом двумя пальцами (pinch/pan), либо через кнопки `+`, `−`, `↺`, либо через кнопку полноэкранного режима `⛶`.

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

/* Полноэкранный режим */
.mermaid-wrapper.is-fullscreen {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 99999 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  border: none !important;
  background-color: var(--md-default-bg-color) !important;
}

.mermaid-wrapper.is-fullscreen .mermaid-controls {
  top: 16px;
  right: 16px;
  padding: 4px 8px;
  gap: 6px;
}

.mermaid-wrapper.is-fullscreen .mermaid-btn {
  font-size: 16px;
  padding: 6px 12px;
}

.mermaid-wrapper.is-fullscreen .mermaid-viewport {
  width: 100vw !important;
  height: 100vh !important;
}

/* Подсказка прокрутки */
.mermaid-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(20, 25, 35, 0.88);
  color: #fff;
  padding: 10px 18px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
  z-index: 25;
  white-space: nowrap;
}

.mermaid-hint.is-visible {
  opacity: 1;
}
```
