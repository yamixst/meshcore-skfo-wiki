# Шаблон эталонной конфигурации mkdocs.yml

Данный файл служит базовым шаблоном для развертывания Wiki на базе **Material for MkDocs**:

```yaml
site_name: Название Сообщества Wiki
docs_dir: wiki
site_description: База знаний регионального радиолюбительского сообщества
site_author: Сообщество
repo_name: username/repo-wiki
repo_url: https://github.com/username/repo-wiki
copyright: "© 2026 Сообщество · Актуальность данных: 23 октября 2026 г."

theme:
  name: material
  language: ru
  palette:
    - scheme: default
      primary: teal
      accent: deep orange
      toggle:
        icon: material/weather-night
        name: Переключить на тёмную тему
    - scheme: slate
      primary: teal
      accent: deep orange
      toggle:
        icon: material/weather-sunny
        name: Переключить на светлую тему
  font:
    text: Inter
    code: JetBrains Mono
  features:
    - navigation.instant
    - navigation.tracking
    - navigation.tabs
    - navigation.sections
    - navigation.top
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.annotation

extra_css:
  - stylesheets/extra.css

extra_javascript:
  - javascripts/mermaid.min.js
  - javascripts/svg-pan-zoom.min.js
  - javascripts/mermaid.js

markdown_extensions:
  - admonition
  - pymdownx.details
  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format
  - pymdownx.highlight:
      anchor_linenums: true
      line_spans: __span
      pygments_lang_class: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.tabbed:
      alternate_style: true
  - tables
  - attr_list
  - md_in_html
  - toc:
      permalink: true

nav:
  - Главная: index.md
  - Раздел 1:
      - Тема А: section1/topic-a.md
      - Тема Б: section1/topic-b.md
  - Раздел 2:
      - Тема В: section2/topic-c.md
```
