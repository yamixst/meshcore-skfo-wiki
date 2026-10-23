document$.subscribe(() => {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: document.body.getAttribute("data-md-color-scheme") === "slate" ? "dark" : "default",
  });

  const elements = document.querySelectorAll(".mermaid");
  if (!elements.length) return;

  mermaid.run({
    nodes: elements,
    postRenderCallback: (id) => {
      const svg = document.getElementById(id);
      if (!svg || svg.dataset.panZoomInitialized) return;
      svg.dataset.panZoomInitialized = "true";

      // Обертка вокруг диаграммы
      const parent = svg.closest(".mermaid");
      if (!parent || parent.closest(".mermaid-wrapper")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-wrapper";

      const controls = document.createElement("div");
      controls.className = "mermaid-controls";
      controls.innerHTML = `
        <button class="mermaid-btn" data-action="zoom-in" title="Увеличить">+</button>
        <button class="mermaid-btn" data-action="zoom-out" title="Уменьшить">−</button>
        <button class="mermaid-btn" data-action="reset" title="Сбросить масштаб">↺</button>
      `;

      const viewport = document.createElement("div");
      viewport.className = "mermaid-viewport";

      parent.parentNode.insertBefore(wrapper, parent);
      wrapper.appendChild(controls);
      wrapper.appendChild(viewport);
      viewport.appendChild(svg);
      parent.remove();

      // Инициализация интерактивного зума и панорамирования (svg-pan-zoom)
      if (window.svgPanZoom) {
        try {
          const panZoom = svgPanZoom(svg, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.5,
            maxZoom: 10,
            zoomScaleSensitivity: 0.25,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: true,
          });

          // Кнопки управления
          controls.querySelector('[data-action="zoom-in"]').addEventListener("click", (e) => {
            e.preventDefault();
            panZoom.zoomIn();
          });
          controls.querySelector('[data-action="zoom-out"]').addEventListener("click", (e) => {
            e.preventDefault();
            panZoom.zoomOut();
          });
          controls.querySelector('[data-action="reset"]').addEventListener("click", (e) => {
            e.preventDefault();
            panZoom.reset();
            panZoom.fit();
            panZoom.center();
          });

          window.addEventListener("resize", () => {
            panZoom.resize();
            panZoom.fit();
            panZoom.center();
          });
        } catch (err) {
          console.error("PanZoom error:", err);
        }
      }
    },
  });
});
