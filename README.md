# Meshcore СКФО Wiki (Meshtastic & LoRa)

База знаний регионального радиолюбительского сообщества цифровой ячеистой радиосвязи (LoRa Mesh) на Северном Кавказе: Ставропольский край, КМВ (Кавказские Минеральные Воды), КБР, КЧР, РСО-Алания и соседние регионы.

🌐 **Онлайн-версия на GitHub Pages**: [https://yamixst.github.io/meshcore-skfo-wiki/](https://yamixst.github.io/meshcore-skfo-wiki/)

---

## Структура базы знаний

- **[Аппаратное обеспечение (Hardware)](wiki/hardware/)**
  - [Сравнение плат и чипов](wiki/hardware/boards-comparison.md) (Heltec v3/v4, nRF52840, SX1262/SX1268, DarkTec, FakeTec)
  - [Антенны, фидеры и ВЧ-часть](wiki/hardware/antennas-and-rf.md) (NanoVNA, J-антенны, Moxon, влияние защитных труб)
  - [Питание и автономность](wiki/hardware/power-and-solar.md) (LiFePO4, LTO для морозов, контроллеры TP5000/MPPT, расчет солнечных панелей)
  - [Корпуса и уличный монтаж](wiki/hardware/enclosures-and-weatherproofing.md) (IP65-IP67, мембраны Gore-Tex, мачты из полипропилена)
- **[Настройки сети и протоколы (Network & Config)](wiki/network/)**
  - [Частотный план и радиопрофиль](wiki/network/frequencies-and-presets.md) (868.900 МГц СКФО, 869.075 МГц КРД, BW 62.5 / SF 8 / CR 8)
  - [Конфигурация репитеров и подавление штормов](wiki/network/repeater-configuration.md) (CLI команды, cad on, txdelay, роли нод)
  - [Маршрутизация, Scopes и мосты](wiki/network/routing-and-scopes.md) (ISO 3166-2 scopes, denyf, кросс-частотные шлюзы)
  - [MQTT, наблюдатели и сервисы](wiki/network/mqtt-and-observers.md) (onemesh.ru, топики msh/RU/STV, SkMesh.ru)
- **[Прошивки и программное обеспечение (Firmware & Software)](wiki/firmware-and-software/)**
  - [Meshtastic vs MeshCore](wiki/firmware-and-software/meshtastic-vs-meshcore.md) (причины перехода сообщества)
  - [Инструкция по прошивке](wiki/firmware-and-software/flashing-guide.md) (веб-флешеры, OTAFIX Bootloader для nRF52)
  - [Клиентские приложения](wiki/firmware-and-software/client-apps.md) (MeshCore Open Advanced, мобильные клиенты, Reticulum)
- **[Топография и география сети СКФО (Topology & Geography)](wiki/topology-and-geography/)**
  - [Магистральный хребет и высоты](wiki/topology-and-geography/regional-backbone.md) (гора Стрижамент 831м, Бештау, Машук, высоты КБР и РСО)
  - [Городские кластеры](wiki/topology-and-geography/city-clusters.md) (Ставрополь, Невинномысск, КМВ)
  - [Рекорды дальности и радиопрохождение](wiki/topology-and-geography/records-and-propagation.md) (рекорд прямой видимости 336 км Ставрополь — Владикавказ)
- **[Инструкции и FAQ (Guides & FAQ)](wiki/guides-and-faq/)**
  - [Быстрый старт новичка](wiki/guides-and-faq/quick-start.md) (выбор первой платы, прошивка, радиопрофиль)
  - [Решение проблем (Troubleshooting)](wiki/guides-and-faq/troubleshooting.md) (сгорание PA без антенны, КСВ, помехи от БП)
  - [Юридические аспекты и установка на крышах](wiki/guides-and-faq/legal-aspects.md) (ПП РФ №1800 п.24, СанПиН, шаблон для УК/ТСЖ)

---

## Локальный запуск документации

```bash
pip install mkdocs mkdocs-material
mkdocs serve
```
Откройте в браузере `http://127.0.0.1:8000`.
