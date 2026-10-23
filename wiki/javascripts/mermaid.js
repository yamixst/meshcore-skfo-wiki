document$.subscribe(() => {
  mermaid.run({
    nodes: document.querySelectorAll(".mermaid"),
  });
});
