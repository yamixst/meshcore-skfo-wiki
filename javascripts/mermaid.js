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

  // Вспомогательная функция показа плавающей подсказки
  const showHint = (wrapper, message) => {
    let hint = wrapper.querySelector(".mermaid-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "mermaid-hint";
      wrapper.appendChild(hint);
    }
    hint.textContent = message;
    hint.classList.add("is-visible");
    clearTimeout(wrapper._hintTimer);
    wrapper._hintTimer = setTimeout(() => {
      hint.classList.remove("is-visible");
    }, 1500);
  };

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
        <button class="mermaid-btn" data-action="fullscreen" title="Развернуть на весь экран">⛶</button>
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

      // Инициализируем svg-pan-zoom БЕЗ автоматического перехвата колесика и с отключенными touch-слушателями
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
            dblClickZoomEnabled: false,
            mouseWheelZoomEnabled: false, // Отключаем автоматический захват колесика
            preventMouseEventsDefault: false, // Не блокируем нативный скролл страницы браузером
            customEventsHandler: {
              // Отключаем встроенные touch-события, чтобы 1 палец на телефоне свободно прокручивал страницу
              haltEventListeners: ["touchstart", "touchend", "touchmove", "touchleave", "touchcancel"],
              init: () => {},
              destroy: () => {},
            },
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

          // Кнопка полноэкранного режима
          const fsBtn = controls.querySelector('[data-action="fullscreen"]');
          fsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const isFs = wrapper.classList.toggle("is-fullscreen");
            if (isFs) {
              fsBtn.innerHTML = "✕";
              fsBtn.title = "Свернуть (Выйти из полноэкранного режима)";
              document.body.style.overflow = "hidden";
            } else {
              fsBtn.innerHTML = "⛶";
              fsBtn.title = "Развернуть на весь экран";
              document.body.style.overflow = "";
            }
            setTimeout(() => {
              pz.resize();
              pz.fit();
              pz.center();
            }, 60);
          });

          window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && wrapper.classList.contains("is-fullscreen")) {
              wrapper.classList.remove("is-fullscreen");
              fsBtn.innerHTML = "⛶";
              fsBtn.title = "Развернуть на весь экран";
              document.body.style.overflow = "";
              setTimeout(() => {
                pz.resize();
                pz.fit();
                pz.center();
              }, 60);
            }
          });

          window.addEventListener("resize", () => {
            pz.resize();
            pz.fit();
            pz.center();
          });

          // --- Умное поведение прокрутки колесом мыши (Desktop) ---
          // Обычный скролл прокручивает страницу вниз/вверх.
          // Зум схемы срабатывает ТОЛЬКО при зажатой клавише Ctrl / Cmd.
          viewport.addEventListener("wheel", (e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              if (e.deltaY < 0) {
                pz.zoomIn();
              } else {
                pz.zoomOut();
              }
            } else {
              // Страница скроллится свободно, показываем подсказку
              showHint(wrapper, "Удерживайте Ctrl для масштабирования колесиком");
            }
          }, { passive: false });

          // --- Умное поведение для сенсорных экранов (Mobile / Touch) ---
          // 1 палец — нативная прокрутка страницы сайта (не перехватывается).
          // 2 пальца — масштабирование (pinch) и панорамирование схемы.
          // В полноэкранном режиме (Fullscreen) 1 палец свободно перемещает схему.
          let initialDist = null;
          let initialCenter = null;
          let singleTouchStart = null;

          viewport.addEventListener("touchstart", (e) => {
            if (e.touches.length === 2) {
              e.preventDefault();
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              initialDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
              initialCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
              };
            } else if (e.touches.length === 1) {
              if (wrapper.classList.contains("is-fullscreen")) {
                e.preventDefault();
                singleTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              } else {
                singleTouchStart = null;
              }
            }
          }, { passive: false });

          viewport.addEventListener("touchmove", (e) => {
            if (e.touches.length === 2 && initialDist) {
              e.preventDefault();
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
              const currentCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
              };

              // Панорамирование двумя пальцами
              const dx = currentCenter.x - initialCenter.x;
              const dy = currentCenter.y - initialCenter.y;
              pz.panBy({ x: dx, y: dy });

              // Пинч-зум
              const factor = currentDist / initialDist;
              if (Math.abs(factor - 1) > 0.04) {
                if (factor > 1) {
                  pz.zoomIn();
                } else {
                  pz.zoomOut();
                }
                initialDist = currentDist;
              }

              initialCenter = currentCenter;
            } else if (e.touches.length === 1 && wrapper.classList.contains("is-fullscreen") && singleTouchStart) {
              e.preventDefault();
              const t = e.touches[0];
              const dx = t.clientX - singleTouchStart.x;
              const dy = t.clientY - singleTouchStart.y;
              pz.panBy({ x: dx, y: dy });
              singleTouchStart = { x: t.clientX, y: t.clientY };
            }
          }, { passive: false });

          viewport.addEventListener("touchend", (e) => {
            if (e.touches.length < 2) {
              initialDist = null;
              initialCenter = null;
            }
            if (e.touches.length === 0) {
              singleTouchStart = null;
            }
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
