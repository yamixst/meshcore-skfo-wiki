# База знаний региональной сети MeshCore СКФО

> 📅 **Дата актуальности информации:** 23 октября 2026 г. &nbsp;|&nbsp; **Статус сети:** 100% MeshCore СКФО (активный регламент)

Добро пожаловать в официальную базу знаний регионального радиолюбительского сообщества цифровой ячеистой радиосвязи (LoRa Mesh) на Северном Кавказе: Ставропольский край, КМВ (Кавказские Минеральные Воды), КБР, КЧР, РСО-Алания и соседние регионы.

!!! important "Полный переход на MeshCore"
    Ставропольское и Северо-Кавказское сообщество полностью перешло с протокола Meshtastic на микроядро **MeshCore**. Вся основная база знаний посвящена исключительно архитектуре, радиоканалам, оборудованию и прошивкам MeshCore. Все материалы по протоколу Meshtastic, истории миграции и архивным настройкам вынесены в специальный раздел **[Meshtastic (Архив и история перехода)](meshtastic/index.md)**.

Wiki создана на основе реального практического опыта участников сообщества: инженерных тестов, замеров на NanoVNA, развертывания высотных ретрансляторов на господствующих вершинах Кавказа и перехода на узкополосный регламентный профиль MeshCore (868.900 МГц, BW 62.5 кГц, SF 8, CR 8).

---

## Навигация по разделам

### 1. [Аппаратное обеспечение (Hardware)](hardware/boards-comparison.md)
Практика выбора, сборки и модернизации железа:

- [Сравнение плат и чипов](hardware/boards-comparison.md) — Heltec v3/v4 (ESP32-S3), Heltec T114, Faketec, SlotRa, DarkTec (nRF52840), модули Ebyte E22.
- [Антенны, фидеры и ВЧ-часть](hardware/antennas-and-rf.md) — замеры NanoVNA, самодельные J-антенны («Psi Emitter»), диполи, Moxon, влияние защитных труб.
- [Питание и автономность](hardware/power-and-solar.md) — Li-Ion vs LiFePO4 vs LTO (титанат для морозов), солнечные панели, контроллеры TP4056/TP5000/MPPT.
- [Корпуса и уличный монтаж](hardware/enclosures-and-weatherproofing.md) — герметичные боксы IP65-IP67, дренаж конденсата, 3D-печать (PETG/ABS), мачты из полипропилена.

### 2. [Настройки сети и протоколы (Network & Config)](network/frequencies-and-presets.md)
Региональный радиопрофиль, частотный план и топология ячеек:

- [Частотный план и радиопрофиль](network/frequencies-and-presets.md) — частоты 868.900 МГц (СКФО), 869.075 МГц (КРД), магистраль 868.700–869.200 МГц, BW 62.5 / SF 8 / CR 8.
- [Конфигурация репитеров и подавление штормов](network/repeater-configuration.md) — эталонные параметры CLI (cad on, direct.txdelay, rxdelay), архитектура Клиент vs Репитер.
- [Маршрутизация, Scopes и мосты](network/routing-and-scopes.md) — разделение потоков по гео-зонам (ISO 3166-2), фильтрация флуда denyf, кросс-частотные шлюзы.
- [MQTT, наблюдатели и сервисы](network/mqtt-and-observers.md) — шлюз onemesh.ru, топики msh/RU/STV, сервис SkMesh.ru, прошивка VBart Observer.

### 3. [Прошивки и программное обеспечение MeshCore (Firmware & Software)](firmware-and-software/meshcore-architecture.md)
Архитектура микроядра, прошивка и клиентские приложения:

- [Архитектура и протокол MeshCore](firmware-and-software/meshcore-architecture.md) — направленный роутинг до 64 хопов, RoomServer (BBS), изоляция трафика Scopes.
- [Инструкция по прошивке MeshCore](firmware-and-software/flashing-guide.md) — веб-флешеры (skmesh.ru, flasher.meshcore.co.uk), CLI (esptool/nrfutil), OTAFIX Bootloader для nRF52, энергосберегающие сборки.
- [Клиентские приложения](firmware-and-software/client-apps.md) — MeshCore Open Advanced (MCOa), мобильные и веб-клиенты, интеграция CivTAK, стек Reticulum.

### 4. [Топография и география сети СКФО (Topology & Geography)](topology-and-geography/regional-backbone.md)
Радиопокрытие региона и господствующие высоты:

- [Магистральный хребет и высоты](topology-and-geography/regional-backbone.md) — гора Стрижамент (831 м, узел «Стриж 2.0»), Бештау, Машук, высоты КБР и РСО-Алания.
- [Городские кластеры](topology-and-geography/city-clusters.md) — Ставрополь (Юго-Запад, Российский, 200-летия, Apex), Невинномысск («Палка», RepN), КМВ.
- [Рекорды дальности и радиопрохождение](topology-and-geography/records-and-propagation.md) — рекорд прямой видимости LoRa 336 км (Ставрополь — Владикавказ), линки 230 км на Краснодар, тропосферные и горные отражения.

### 5. [Инструкции и FAQ (Guides & FAQ)](guides-and-faq/quick-start.md)
Руководства для начинающих и правовая база:

- [Быстрый старт новичка](guides-and-faq/quick-start.md) — пошаговый план: покупка первой платы, заливка прошивки MeshCore, базовая настройка параметров.
- [Решение проблем (Troubleshooting)](guides-and-faq/troubleshooting.md) — сгорание радиокаскада без антенны, замеры КСВ, помехи от БП, зависания nRF52.
- [Юридические аспекты и установка на крышах](guides-and-faq/legal-aspects.md) — законность 868 МГц (до 25 мВт без регистрации в РКН, ПП РФ № 1800), СанПиН 1.2.3685-21, шаблон письма для УК/ТСЖ.

### 6. [Раздел Meshtastic (Архив и история перехода)](meshtastic/index.md)
Историко-технический архив этапа эксплуатации протокола Meshtastic:

- [История и причины перехода на MeshCore](meshtastic/index.md) — эфирные штормы, лимит 7 хопов и предпосылки общерегиональной миграции.
- [Сравнение протоколов: Meshtastic vs MeshCore](meshtastic/meshtastic-vs-meshcore.md) — подробный архитектурный сравнительный анализ.
- [Архивные частоты и канал «Stavropol»](meshtastic/legacy-frequencies-and-channels.md) — Слот 2 (869.075 МГц), пресет LongFast, ключ AES-256.
- [Конфигурация узлов и портов Meshtastic](meshtastic/repeater-and-node-config.md) — фильтрация `CORE_PORTNUMS_ONLY` и роли устройств.
- [Прошивка и клиентский софт Meshtastic](meshtastic/firmware-and-apps.md) — flasher.meshtastic.org, клиенты Android/iOS, ATAK Forwarder и очистка памяти.

---
*База знаний актуализирована по состоянию на 23 октября 2026 года на основе инженерной практики и логов сообщества «Meshcore СКФО».*
