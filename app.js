/* Japonia 2026: przewodnik. Cała treść pochodzi z data/trip.json;
   ten plik tylko ją renderuje (format opisany w data/README.md). */
(function () {
  "use strict";

  const DATA_URLS = ["data/trip.json", "../data/trip.json"];
  // Zakładka „Historia Japonii”: tekst (Markdown, renderowany bez zmian) + osobna mapa powiązań z planem
  const HIST_MD_URLS = ["content/historia-japonii.md", "../content/historia-japonii.md"];
  const HIST_LINKS_URLS = ["content/historia-powiazania.json", "../content/historia-powiazania.json"];
  const KANJI_WD = ["日", "月", "火", "水", "木", "金", "土"];
  const MONTHS = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  const PACE_LEVEL = { "very-light": 1, "light": 2, "light-medium": 3, "medium": 3, "medium-long": 4, "long": 5, "travel": 0 };
  const CITY_KANJI = [["Nikk", "日光"], ["Nara", "奈良"], ["Osaka", "大阪"], ["Kamakura", "鎌倉"], ["Fuji", "富士"], ["Kioto", "京都"], ["Tokio", "東京"]];
  const ICONS = {
    attraction: '<path d="M3 5.5c3 1.2 15 1.2 18 0M5 9.5h14M7 6v14M17 6v14"/>',
    walk: '<path d="M13 4.5a1.5 1.5 0 1 0 0-.01M10 21l2-6 3 3v3M9 11l3-3 3 3 3 1M12 8l-1 5"/>',
    meal: '<path d="M3 12h18a9 9 0 0 1-18 0zM9 21h6M13 3 10 12M19 4l-6 8"/>',
    transport: '<rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9 20l-2 1.5M15 20l2 1.5M9 13h.01M15 13h.01"/>',
    flight: '<path d="M10.5 20 12 21l1.5-1v-5.5l7 2.5v-2l-7-4.5V4.5a1.5 1.5 0 0 0-3 0V10.5l-7 4.5v2l7-2.5z"/>',
    hotel: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 12.5h.01"/>',
    departure: '<path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9"/>',
    rest: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    free: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    decision: '<path d="M12 21v-8M12 13 6 7M12 13l6-6M4 9V5h4M20 9V5h-4"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    link: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0zM8 21h8M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5"/>',
    ticket: '<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>',
    book: '<path d="M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20"/>',
    up: '<path d="M6 14l6-6 6 6"/>'
  };

  const S = { trip: null, byId: {}, filters: { want: true, bonus: true }, variant: {}, sim: null, done: {}, hist: null, histMd: null, histDoc: null, histY: 0, tab: null, lastDay: null };
  const $ = (sel, el) => (el || document).querySelector(sel);
  const view = $("#view"), side = $("#side"), sheet = $("#sheet");

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.free}</svg>`;
  const toMin = (t) => { if (!t) return null; const m = /^(\d{1,2}):(\d{2})/.exec(t); return m ? +m[1] * 60 + +m[2] : null; };
  const pad = (n) => String(n).padStart(2, "0");
  const fmtMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const dateParts = (iso) => { const [y, mo, d] = iso.split("-").map(Number); return { y, mo, d, wd: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() }; };
  const fmtDate = (iso) => { const p = dateParts(iso); return `${p.d} ${MONTHS[p.mo - 1]}`; };
  const shortDate = (iso) => { const p = dateParts(iso); return `${p.d}.${pad(p.mo)}`; };
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  const nights = (n) => n + (n >= 2 && n <= 4 ? " noce" : n === 1 ? " noc" : " nocy");
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem("jp26." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("jp26." + k, JSON.stringify(v)); } catch (e) { /* bez pamięci */ } }
  };
  // Wskazówki przy punktach i dniach: [{kind, text, link?, links?}] (format w data/README.md)
  const TIP_LABEL = { tip: "Tip", important: "Ważne", booking: "Rezerwacja", experience: "Doświadczenie", highlight: "Wysoki priorytet", general: "Na cały wyjazd" };
  const tipList = (tips, links) => (tips || []).length
    ? `<span class="tips">${tips.map((x) => `<span class="tip k-${esc(x.kind || "tip")}"><b>${esc(TIP_LABEL[x.kind] || TIP_LABEL.tip)}</b> ${esc(x.text)}${links ? (x.links || (x.link ? [x.link] : [])).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ").replace(/^/, " ") : ""}</span>`).join("")}</span>`
    : "";
  // TODO bez wykonanych: done:true w danych albo odhaczone w tej przeglądarce
  // Aktualizacja zadania po ID zachowuje jego jedyny wpis i zapisane odhaczenie.
  // Pozwala przenieść zadanie bez przepisywania danych wcześniejszych dni.
  const openTodos = (d) => S.trip.days.flatMap((owner) => (owner.todos || [])
    .filter((x) => ((S.trip.todoUpdates || {})[x.id]?.dayId || owner.id) === d.id)
    .map((x) => Object.assign({}, x, (S.trip.todoUpdates || {})[x.id])))
    .filter((x) => !x.done && !S.done[x.id]);
  const legend = (group, id) => (S.trip.legend[group] || []).find((x) => x.id === id) || { id, label: id, meaning: "" };

  function nowTokyo(tz) {
    if (S.sim) return S.sim;
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz || S.trip.meta.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
      return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
    } catch (e) {
      const d = new Date(); return { date: d.toISOString().slice(0, 10), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  // dzień z własną strefą (np. wyjazd z Polski, days[].timezone) ma pierwszeństwo, dopóki u niego trwa ta data
  const nowFor = (day) => nowTokyo(day && day.timezone);
  const todayDay = () => S.trip.days.find((d) => d.timezone && nowFor(d).date === d.id) || S.byId[nowTokyo().date] || null;

  function segment(day) {
    const id = day.stay && day.stay.hotelId;
    if (id === "mimaru-kyoto") return "kyoto";
    if (id) return "tokyo";
    return "travel";
  }
  function cityKanji(day) {
    if (day.dayNumber === 1) return "出発";
    if (day.dayNumber === S.trip.days.length) return "帰国";
    const target = day.base.includes("→") ? day.base.split("→").pop() : day.base;
    for (const [k, v] of CITY_KANJI) if (target.includes(k)) return v;
    return day.stay && day.stay.city === "Kioto" ? "京都" : "東京";
  }
  // pionowy zapis budujemy ze znaków (writing-mode bywa zawodne bez japońskiej czcionki)
  const vert = (s, max) => {
    const str = String(s);
    if (!/[\u3040-\u9fff]/.test(str)) return `<span class="hz">${esc(str)}</span>`;
    const cols = [];
    for (const part of str.split(/[\s・]+/).filter(Boolean)) {
      const ch = Array.from(part);
      for (let k = 0; k < ch.length; k += max || 99) cols.push(ch.slice(k, k + (max || 99)));
    }
    return `<span class="vcols">${cols.map((c) => `<span class="vt">${c.map((x) => `<i>${esc(x)}</i>`).join("")}</span>`).join("")}</span>`;
  };
  const stamp = (day, cls) => `<span class="stamp seg-${segment(day)} ${cls || ""}" aria-hidden="true">${vert(cityKanji(day))}</span>`;
  const paceBars = (pace) => { const n = PACE_LEVEL[pace] || 0; return `<span class="pace" aria-hidden="true">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`; };
  const bookingChip = (b) => { const l = legend("booking", b.level); return `<span class="chip bk-${b.level}" title="${esc(l.usage)}"><span class="bdot"></span>${esc(l.meaning)}</span>`; };
  const prioBadge = (p) => p ? `<span class="prio prio-${p}">${esc(legend("priorities", p).label)}</span>` : "";

  // Zdjęcie: item.photo → place.photo → legend.itemTypes[type].defaultPhoto → plakietka z nazwą po japońsku
  function photoFor(item, place) {
    if (item && item.photo) return item.photo;
    if (place && place.photo) return place.photo;
    const t = legend("itemTypes", item && item.type);
    return t.defaultPhoto || null;
  }
  function media(photo, seed, kanji, type) {
    if (photo && photo.src) return `<img src="${esc(photo.src)}" alt="${esc(photo.alt || "")}"${photo.credit ? ` title="${esc(photo.credit + (photo.license ? " · " + photo.license : ""))}"` : ""} loading="lazy">`;
    const h = hash(seed) % 360;
    const inner = kanji ? `<span class="k">${vert(kanji, 4)}</span>` : icon(type);
    return `<div class="ph" style="--h:${h}" role="img" aria-label="Zdjęcie pojawi się później">${inner}</div>`;
  }
  // Galeria w karcie miejsca: zdjęcie główne (photoFor) + place.gallery[], bez duplikatów
  function placePhotos(item, place) {
    const out = [], main = photoFor(item, place);
    if (main && main.src) out.push(main);
    ((place && place.gallery) || []).forEach((p) => { if (p && p.src && !out.some((x) => x.src === p.src)) out.push(p); });
    return out;
  }
  const creditTag = (p) => p && p.credit ? `<span class="credit">${p.sourceUrl ? `<a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${esc(p.credit)}</a>` : esc(p.credit)}${p.license ? " · " + esc(p.license) : ""}</span>` : "";
  function gallery(photos, seed, kanji, type) {
    if (photos.length < 2) return `${media(photos[0], seed, kanji, type)}${creditTag(photos[0])}`;
    const n = photos.length;
    return `<div class="gal" data-gal>
        <div class="gal-track" tabindex="0" aria-label="Zdjęcia: przewijaj w bok">${photos.map((p, i) => `<figure class="gal-slide" aria-label="Zdjęcie ${i + 1} z ${n}"><img src="${esc(p.src)}" alt="${esc(p.alt || "")}" draggable="false">${creditTag(p)}</figure>`).join("")}</div>
        <button class="gal-nav prev" type="button" data-gal-step="-1" aria-label="Poprzednie zdjęcie" disabled>${icon("prev")}</button>
        <button class="gal-nav next" type="button" data-gal-step="1" aria-label="Następne zdjęcie">${icon("next")}</button>
        <span class="gal-count" aria-hidden="true"><b>1</b>/${n}</span>
        <div class="gal-dots">${photos.map((_, i) => `<button type="button" data-gal-go="${i}" class="${i ? "" : "on"}" aria-label="Pokaż zdjęcie ${i + 1}"></button>`).join("")}</div>
      </div>`;
  }
  function wireGallery(root) {
    const g = root.querySelector("[data-gal]"); if (!g) return;
    const track = g.querySelector(".gal-track"), slides = track.children, n = slides.length;
    const dots = g.querySelectorAll("[data-gal-go]"), prev = g.querySelector(".prev"), next = g.querySelector(".next"), cnt = g.querySelector(".gal-count b");
    const cur = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    const go = (i) => { i = Math.max(0, Math.min(n - 1, i)); track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" }); };
    const sync = () => { const i = cur(); dots.forEach((d, k) => d.classList.toggle("on", k === i)); prev.disabled = i === 0; next.disabled = i === n - 1; cnt.textContent = i + 1; };
    track.addEventListener("scroll", () => { cancelAnimationFrame(g._raf); g._raf = requestAnimationFrame(sync); }, { passive: true });
    g.addEventListener("click", (e) => {
      const b = e.target.closest("[data-gal-step],[data-gal-go]"); if (!b) return;
      go(b.dataset.galGo != null ? +b.dataset.galGo : cur() + +b.dataset.galStep);
    });
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(cur() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(cur() - 1); }
    });
  }
  function mapsUrl(place) {
    if (place.links && place.links.maps) return place.links.maps;
    return gmSearch(geoLoc(place.id) || { q: place.mapsQuery || place.name });
  }

  // ---------- Google Maps: lokalizacje i trasy (oficjalne Maps URLs, bez klucza API) ----------
  // Punkt planu: points{} (stacje, hotele, przystanki) albo places{}; "@start" = hotel, w którym zaczynamy dzień,
  // "@stay" = hotel na noc tego dnia. Zapytanie: q (nazwa + miasto/adres) albo współrzędne.
  const GM = "https://www.google.com/maps/";
  const MODE = {
    walking: { em: "🚶", label: "pieszo" },
    transit: { em: "🚆", label: "komunikacją" },
    driving: { em: "🚗", label: "samochodem" },
    ride: { em: "🎫", label: "przejazd z biletem" }
  };
  const gmQ = (l) => l.q || (l.lat != null ? `${l.lat},${l.lng}` : l.name);
  const gmSearch = (l) => `${GM}search/?api=1&query=${encodeURIComponent(gmQ(l))}`;
  const gmDir = (from, to, mode, via) => `${GM}dir/?api=1${from ? `&origin=${encodeURIComponent(gmQ(from))}` : ""}&destination=${encodeURIComponent(gmQ(to))}&travelmode=${mode === "ride" ? "transit" : mode}${via && via.length ? `&waypoints=${encodeURIComponent(via.map(gmQ).join("|"))}` : ""}`;
  function hotelOf(d) { return d && d.stay && d.stay.hotelId ? geoLoc(d.stay.hotelId) : null; }
  function geoLoc(id, day) {
    if (!id) return null;
    const t = S.trip;
    if (id === "@stay") return hotelOf(day);
    if (id === "@start") { const prev = t.days[t.days.indexOf(day) - 1]; return hotelOf(prev); }
    const pt = (t.points || {})[id];
    if (pt) return Object.assign({ key: id }, pt);
    const pl = t.places[id];
    if (pl) return { key: id, name: pl.name, q: pl.mapsQuery || null, lat: pl.coords && pl.coords.lat, lng: pl.coords && pl.coords.lng };
    return null;
  }
  const distKm = (a, b) => {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    const r = Math.PI / 180, x = (b.lng - a.lng) * r * Math.cos((a.lat + b.lat) * r / 2), y = (b.lat - a.lat) * r;
    return 6371 * Math.hypot(x, y);
  };
  const autoMode = (a, b) => { const k = distKm(a, b); return k != null && k < 1.3 ? "walking" : "transit"; };
  // Odcinki dnia dla widocznych punktów: każdy punkt dostaje swoje miejsce (at) i etapy dojścia (legs)
  function dayRoutes(day, items) {
    let pos = geoLoc("@start", day);
    const res = new Map();
    for (const i of items) {
      const at = i.at === null ? null : geoLoc(i.at || i.placeId, day);
      let legs = [];
      if (i.legs) {
        legs = i.legs.map((l) => {
          const from = l.from ? geoLoc(l.from, day) : pos, to = l.to ? geoLoc(l.to, day) : at;
          const leg = Object.assign({}, l, { from, to, mode: l.mode || autoMode(from, to) });
          if (to) pos = to;
          return leg;
        }).filter((l) => l.to);
      } else if (at && pos && at.key !== pos.key && i.type !== "decision") {
        legs = [{ from: pos, to: at, mode: autoMode(pos, at) }];
      }
      if (at && !legs.length) pos = at;
      if (at || legs.length) res.set(i.id, { at, legs });
    }
    const home = hotelOf(day);
    const back = day.back === false || !home || !pos || pos.key === home.key ? null
      : Object.assign({}, day.back || {}, { from: pos, to: home, mode: (day.back && day.back.mode) || autoMode(pos, home) });
    return { res, back };
  }
  function legLine(l, many, k) {
    const m = MODE[l.mode] || MODE.transit;
    const min = l.min && typeof l.min === "object" ? l.from && l.min[l.from.key] : l.min;
    l = Object.assign({}, l, { min });
    const time = l.min ? ` · ok. ${esc(l.min)} min` : "";
    const route = `${esc(l.from ? l.from.name : "Twoja lokalizacja")} → ${esc(l.to.name)}`;
    const head = many ? "" : l.mode === "walking" ? "Z poprzedniego punktu: " : "";
    const btn = l.mode === "ride"
      ? ""
      : `<a class="gm-btn" href="${esc(gmDir(l.from, l.to, l.mode))}" target="_blank" rel="noopener">🧭 ${many ? "Etap " + (k + 1) : "Nawiguj"}</a>`;
    return { btn, text: `<span class="gm-leg">${m.em} ${head}${l.mode === "walking" ? `${l.min ? "ok. " + esc(l.min) + " min " : ""}pieszo · ${route}` : `${route} · ${m.label}${time}`}${l.text ? `<span class="gm-tx">${esc(l.text)}</span>` : ""}</span>` };
  }
  function geoBlock(r) {
    if (!r) return "";
    const { at, legs } = r, many = legs.length > 1;
    const last = legs[legs.length - 1], dest = at || (last && last.to);
    const here = last ? last.to : at;
    const hereMode = !last || many || last.mode === "ride" ? "transit" : last.mode;
    const lines = legs.map((l, k) => legLine(l, many, k));
    const row = [
      dest ? `<a class="gm-btn" href="${esc(gmSearch(dest))}" target="_blank" rel="noopener" aria-label="Mapa: ${esc(dest.name)}">📍 Mapa</a>` : "",
      !many && lines[0] ? lines[0].btn : "",
      here ? `<a class="gm-btn ghost" href="${esc(gmDir(null, here, hereMode))}" target="_blank" rel="noopener">Z mojej lokalizacji</a>` : ""
    ].join("");
    const legRows = many
      ? lines.map((x) => `<div class="gm-row">${x.btn}${x.text}</div>`).join("")
      : lines.length ? `<div class="gm-row">${lines[0].text}</div>` : "";
    return `<div class="gm"><div class="gm-btns">${row}</div>${legRows}</div>`;
  }
  // Trasa całego dnia: tylko ciągi odcinków pieszych (Google nie obsługuje punktów pośrednich w trybie transit),
  // po maks. 3 punkty pośrednie (limit przeglądarek mobilnych)
  function dayWalks(routes, items) {
    const chunks = []; let cur = null;
    for (const i of items) {
      const r = routes.res.get(i.id); if (!r) continue;
      for (const l of r.legs) {
        if (l.mode === "walking" && l.from) {
          if (cur && cur[cur.length - 1].key === l.from.key) cur.push(l.to);
          else chunks.push(cur = [l.from, l.to]);
        } else cur = null;
      }
    }
    const out = [];
    chunks.filter((c) => c.length >= 3).forEach((c) => { for (let s = 0; s < c.length - 1; s += 4) { const part = c.slice(s, s + 5); if (part.length >= 3) out.push(part); } });
    return out;
  }

  // ---------- shell ----------
  function renderSide(activeId, tab) {
    const t = S.trip, today = todayDay();
    const groups = [];
    for (const d of t.days) {
      const seg = segment(d), key = seg + (d.stay ? d.stay.hotelId : "travel");
      let g = groups[groups.length - 1];
      if (!g || g.key !== key) groups.push(g = { key, seg, days: [], label: groupLabel(d) });
      g.days.push(d);
    }
    side.innerHTML = `
      <div class="side-brand"><a href="#plan"><span class="t">${esc(t.meta.title.split(" ")[0])}</span></a>
        <span class="s">${esc(rangeLabel())}</span></div>
      <nav class="side-nav">
        <a href="#plan" ${tab === "plan" ? 'aria-current="page"' : ""}>Plan</a>
        <a href="#today" ${tab === "today" ? 'aria-current="page"' : ""}>Dziś</a>
        <a href="#bookings" ${tab === "bookings" ? 'aria-current="page"' : ""}>Rezerwacje</a>
        ${t.food ? `<a href="#food" ${tab === "food" ? 'aria-current="page"' : ""}>Jedzenie</a>` : ""}
        <a class="wide" href="#historia" ${tab === "historia" ? 'aria-current="page"' : ""}>Historia Japonii</a>
      </nav>
      ${groups.map((g) => `
        <div class="side-group">
          <h4 class="eyebrow">${esc(g.label)}</h4>
          ${g.days.map((d) => `
            <a class="side-day ${today && today.id === d.id ? "is-today" : ""} ${d.dayTrip ? "is-trip" : ""}" href="#d-${d.id}" ${d.id === activeId ? 'aria-current="page"' : ""}>
              <span class="dn">${d.dayNumber}</span>${d.dayTrip ? `<span class="b trip"><span class="tx">${esc(d.title)}</span><i class="tb">wycieczka</i></span>` : `<span class="b">${esc(d.title)}</span>`}<span class="dt">${shortDate(d.date)}</span>
            </a>`).join("")}
        </div>`).join("")}`;
  }
  function groupLabel(d) {
    if (!d.stay) return "Podróż";
    const h = S.trip.meta.hotels.find((x) => x.id === d.stay.hotelId);
    return `${d.stay.city}${h && h.area ? " · " + h.area : ""}`;
  }
  function rangeLabel() {
    const a = dateParts(S.trip.meta.dateFrom), b = dateParts(S.trip.meta.dateTo);
    return `${a.d}–${b.d} ${MONTHS[b.mo - 1]} ${b.y} · ${S.trip.days.length} dni`;
  }
  function setTab(tab) {
    document.querySelectorAll("#tabbar a").forEach((a) => { if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  }

  // ---------- overview ----------
  function renderOverview() {
    const t = S.trip, now = nowTokyo(), today = todayDay();
    const toStart = daysBetween(now.date, t.meta.dateFrom);
    let count;
    if (today) count = `Dzień ${today.dayNumber} z ${t.days.length}`;
    else if (toStart > 0) count = toStart === 1 ? "Wylot jutro" : `Do wylotu ${toStart} dni`;
    else count = "Podróż zakończona";

    const segs = [["tokyo", "Tokio"], ["kyoto", "Kioto i okolice"], ["travel", "Podróż"]];
    const strip = t.days.map((d) => {
      const cls = [today && today.id === d.id ? "is-today" : "", d.date < now.date ? "is-past" : ""].join(" ");
      return `<a href="#d-${d.id}" class="seg-${segment(d)} ${d.dayTrip ? "is-trip" : ""} ${cls}" style="background:var(--c)" title="${d.dayNumber}. ${shortDate(d.date)} ${esc(d.title)}" aria-label="Dzień ${d.dayNumber}: ${esc(d.title)}"></a>`;
    }).join("");

    const dur = (x) => { const [h, m] = x.split(":").map(Number); return `${h} h${m ? " " + m + " min" : ""}`; };
    const flight = (f) => `<div class="fact"><span class="k eyebrow">${icon("flight")} ${f.direction === "outbound" ? "Lot tam" : "Lot powrotny"}</span>
        <span class="v">${esc(f.number)} · ${esc(f.fromName)} → ${esc(f.toName)}</span>
        <span class="d">Wylot ${shortDate(f.departureDate)}, ${esc(f.departure)}${f.direction === "return" ? " (" + esc(f.terminal) + ")" : ""}</span>
        <span class="d">Przylot ${shortDate(f.arrivalDate)}, ${esc(f.arrival)}${f.direction === "outbound" ? " (" + esc(f.terminal) + ")" : ""}</span>
        <span class="d">Lot ${dur(f.duration)} · ${esc(f.baggage)}</span></div>`;
    const flightBy = (dir) => t.meta.flights.filter((f) => f.direction === dir).map(flight).join("");
    const ht = t.meta.hotels.map((h) => `
      <div class="fact ${h.status === "todo" ? "todo" : ""}"><span class="k eyebrow">${icon("hotel")} ${esc(h.city)}${h.area ? " · " + esc(h.area) : ""}</span>
        <span class="v">${h.name ? esc(h.name) : '<span class="pill-todo">Hotel do zarezerwowania</span>'}</span>
        <span class="d">${shortDate(h.checkIn)} – ${shortDate(h.checkOut)} · ${nights(daysBetween(h.checkIn, h.checkOut))}${h.rooms ? " · " + h.rooms + " pokoje" : ""}${h.freeCancellation ? " · darmowe anulowanie" : ""}</span>
        ${h.address ? `<span class="d">${esc(h.address)}</span>` : ""}</div>`).join("");

    const groups = [];
    for (const d of t.days) {
      const key = d.stay ? d.stay.hotelId : "travel-" + d.dayNumber;
      let g = groups[groups.length - 1];
      if (!g || (g.key !== key && !(g.key.startsWith("travel") && key.startsWith("travel")))) groups.push(g = { key, days: [], first: d });
      g.days.push(d);
    }

    view.innerHTML = `
      <header class="ov-hero">
        <span class="eyebrow">Przewodnik · ${t.days.length} dni · ${t.meta.hotels.length} hotele</span>
        <h1>${esc(t.meta.title.replace(/\s*\d.*$/, ""))}<span class="ja">日本</span><br>${esc(t.meta.title.replace(/^\D+/, ""))}</h1>
        <span class="countdown"><span class="dot"></span>${esc(count)}</span>
      </header>
      <div class="strip" role="list">${strip}</div>
      <div class="strip-legend">${segs.map(([s, l]) => `<span class="seg-${s}"><i></i>${l}</span>`).join("")}<span class="seg-trip"><i></i>Wycieczka jednodniowa</span></div>
      <div class="facts">${flightBy("outbound")}${ht}${flightBy("return")}</div>

      <div class="section-h"><h2>Dzień po dniu</h2></div>
      <ol class="ptl">${groups.map((g) => `
        <li class="pgroup">${stamp(g.first, "sm")}<span><b>${esc(groupLabel(g.first))}</b>
          <span class="muted num">${shortDate(g.days[0].date)}${g.days.length > 1 ? " – " + shortDate(g.days[g.days.length - 1].date) : ""}</span></span></li>
        ${g.days.map((d) => planDay(d, now, today)).join("")}`).join("")}</ol>

      <div class="section-h"><h2>Legenda</h2></div>
      <div class="legend">
        ${t.legend.priorities.map((p) => `<div>${prioBadge(p.id)}<span>${esc(p.meaning)}</span><span class="muted">${esc(p.usage)}</span></div>`).join("")}
      </div>
      <div class="legend" style="margin-top:10px">
        ${t.legend.booking.map((b) => `<div><span class="chip bk-${b.id}" style="justify-self:start"><span class="bdot"></span>${esc(b.meaning)}</span><span class="muted">${esc(b.usage)}</span></div>`).join("")}
      </div>
      <p class="footer">Źródło: ${esc(t.meta.source)}. Wszystkie godziny to czas lokalny w Japonii.</p>`;
  }
  // Zdjęcia dnia: miejsca z planu w kolejności MUST → WANT → BONUS, bez powtórzeń
  function dayPhotos(d, max) {
    const rank = { must: 0, want: 1, bonus: 2 };
    const seen = new Set(), out = [];
    d.items.map((i, k) => ({ i, k }))
      .filter(({ i }) => i.placeId && S.trip.places[i.placeId])
      .sort((a, b) => (rank[a.i.priority] ?? 3) - (rank[b.i.priority] ?? 3) || a.k - b.k)
      .forEach(({ i }) => { if (!seen.has(i.placeId)) { seen.add(i.placeId); out.push(S.trip.places[i.placeId]); } });
    if (!out.length && d.coverPhoto) out.push({ id: d.id, name: d.coverPhoto.alt || d.title, nameJa: null, photo: d.coverPhoto });
    return out.slice(0, max);
  }
  const tripFlag = (d) => d.dayTrip
    ? `<span class="trip-flag">${icon("transport")}<b>Wycieczka jednodniowa</b><span class="route">${esc(d.dayTrip.from)} → ${esc(d.dayTrip.to)} → ${esc(d.dayTrip.from)}</span></span>`
    : "";
  function planDay(d, now, today) {
    const p = dateParts(d.date);
    const cls = [d.dayTrip ? "is-trip" : "", today && today.id === d.id ? "is-today" : "", d.date < now.date ? "is-past" : ""].join(" ");
    const photos = dayPhotos(d, d.dayTrip ? 4 : 3);
    const pics = photos.length
      ? `<span class="pphotos n${photos.length}">${photos.map((pl) => `<span class="pph">${media(pl.photo, pl.id, pl.nameJa, "attraction")}<span class="cap">${esc(pl.name)}</span></span>`).join("")}</span>`
      : "";
    return `<li class="pday seg-${segment(d)} ${cls}">
      <a class="pdate" href="#d-${d.id}" tabindex="-1" aria-hidden="true"><span class="d">${p.d}</span><span class="w ${p.wd === 0 ? "sun" : ""}">${KANJI_WD[p.wd]}</span></a>
      <span class="prail" aria-hidden="true"><span class="dot"></span></span>
      <a class="pcard" href="#d-${d.id}">
        ${tripFlag(d)}
        <span class="top"><span>Dzień ${d.dayNumber}</span><span>·</span><span>${esc(d.weekday)}</span><span>·</span><span class="num">${shortDate(d.date)}</span></span>
        <span class="ttl">${esc(d.title)}</span>
        ${pics}
        ${d.summary ? `<span class="sum">${esc(d.summary)}</span>` : ""}
        <span class="must"><b>MUST</b><span>${esc(d.priorities.must)}</span></span>
        ${openTodos(d).length ? `<span class="ptodo"><b>${icon("check")} Ważne TODO</b><span>${openTodos(d).map((x) => esc(x.text)).join(" · ")}</span></span>` : ""}
        <span class="meta"><span class="chip" title="Tempo">${paceBars(d.pace)}${esc(d.paceLabel)}</span>${bookingChip(d.booking)}</span>
      </a></li>`;
  }

  // ---------- day ----------
  function renderDay(day, opts) {
    const t = S.trip, now = nowFor(day), isToday = todayDay() === day;
    const idx = t.days.indexOf(day), prev = t.days[idx - 1], next = t.days[idx + 1];
    const p = dateParts(day.date);
    const withPhoto = (i) => i.placeId && S.trip.places[i.placeId] && S.trip.places[i.placeId].photo;
    const firstMust = day.items.find((i) => i.priority === "must" && withPhoto(i)) || day.items.find(withPhoto);
    const coverPlace = firstMust && t.places[firstMust.placeId];
    const cover = day.coverPhoto || (coverPlace && coverPlace.photo) || null;
    const coverKanji = coverPlace ? coverPlace.nameJa : cityKanji(day);

    let banner = "";
    if (opts && opts.fromToday && !isToday) {
      const toStart = daysBetween(now.date, t.meta.dateFrom);
      banner = toStart > 0
        ? `<div class="banner"><span class="x">Do wylotu ${toStart} dni. W trakcie podróży ta zakładka otworzy bieżący dzień z zaznaczoną godziną. Poniżej podgląd: dzień 1.</span>
             <button class="btn" type="button" data-sim="2026-11-13T11:40">Symuluj: 13.11, 11:40</button></div>`
        : `<div class="banner"><span class="x">Podróż zakończona. Poniżej ostatni dzień.</span></div>`;
    }
    if (S.sim && isToday) banner = `<div class="banner"><span class="x">Symulacja: ${fmtDate(S.sim.date)}, ${fmtMin(S.sim.min)} czasu w Japonii.</span><button class="btn" type="button" data-sim="off">Wyłącz symulację</button></div>`;

    const summary = day.summary
      ? `<p class="summary">${esc(day.summary)}</p>`
      : `<p class="summary empty">Zarys dnia pojawi się w etapie z treścią. Najważniejsze dziś: <b>${esc(day.priorities.must)}</b>.</p>`;

    view.innerHTML = `
      <nav class="dayjump" aria-label="Wybierz dzień"><div class="row">${t.days.map((d) => {
        const q = dateParts(d.date);
        return `<a href="#d-${d.id}" class="seg-${segment(d)} ${now.date === d.id ? "is-today" : ""}" ${d.id === day.id ? 'aria-current="page"' : ""}><span class="d">${q.d}</span><span class="w">${KANJI_WD[q.wd]}</span><span class="bar" style="background:var(--c)"></span></a>`;
      }).join("")}</div></nav>
      ${banner}
      <header class="dhead">
        <div class="cover">${media(cover, day.id, coverKanji, "attraction")}
          <div class="over"><div><div class="n">Dzień ${day.dayNumber} z ${t.days.length}${isToday ? " · dziś" : ""}</div><div class="date">${fmtDate(day.date)}, ${esc(day.weekday)}</div></div>${stamp(day)}</div>
        </div>
        ${tripFlag(day)}
        <h1>${esc(day.title)}</h1>
        ${summary}
        ${todoList(day)}
        <div class="dfacts">
          <div><span class="eyebrow">Wyjście</span><span class="v num">${esc(day.earliestDeparture)}</span></div>
          <div><span class="eyebrow">Tempo</span><span class="v">${paceBars(day.pace)} ${esc(day.paceLabel)}</span></div>
          <div><span class="eyebrow">Nocleg</span><span class="v">${day.stay ? esc(day.stay.hotelName || "do zarezerwowania") : "w samolocie / w domu"}</span>${day.stay && day.stay.address ? `<span class="addr">${esc(day.stay.address)}</span>` : ""}</div>
        </div>
        <div class="pri3">
          ${["must", "want", "bonus"].filter((k) => day.priorities[k]).map((k) => `<div>${prioBadge(k)}<span>${esc(day.priorities[k])}</span></div>`).join("")}
        </div>
        ${day.booking.level !== "none" ? `<div class="callout bk-${day.booking.level}"><span class="ic"></span><span class="eyebrow">Rezerwacje · ${esc(legend("booking", day.booking.level).meaning)}</span><span>${esc(day.booking.text)}</span></div>` : ""}
        ${day.notes ? `<div class="callout" style="--c:var(--ai)"><span class="ic"></span><span class="eyebrow">Uwagi</span><span>${esc(day.notes)}</span></div>` : ""}
        ${(day.tips || []).length ? `<div class="callout" style="--c:var(--ai)"><span class="ic"></span><span class="eyebrow">Wskazówki</span>${tipList(day.tips, true)}</div>` : ""}
        ${day.videos && day.videos.length ? `<div class="callout" style="--c:var(--ai)"><span class="ic"></span><span class="eyebrow">Filmy</span><span class="vids">${day.videos.map((v) => `<a href="${esc(v.url)}" target="_blank" rel="noopener">${icon("link")} ${esc(v.title)}</a>`).join("")}</span></div>` : ""}
      </header>

      <div class="tl-h"><h2>Plan dnia</h2>
        <div class="filters" role="group" aria-label="Pokaż priorytety">
          <button type="button" class="f-must" aria-pressed="true" disabled title="MUST jest zawsze widoczne"><span class="bx"></span>MUST</button>
          <button type="button" class="f-want" data-filter="want" aria-pressed="${S.filters.want}"><span class="bx"></span>WANT</button>
          <button type="button" class="f-bonus" data-filter="bonus" aria-pressed="${S.filters.bonus}"><span class="bx"></span>BONUS</button>
        </div>
      </div>
      <ol class="tl">${timeline(day, isToday ? now.min : null, opts && opts.focus)}</ol>
      ${guides(day)}

      <div class="dhead"><div class="nav">
        ${prev ? `<a class="btn" href="#d-${prev.id}">${icon("left")} ${shortDate(prev.date)} ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#d-${next.id}">${shortDate(next.date)} ${esc(next.title)} ${icon("right")}</a>` : ""}
      </div></div>`;

    const cur = view.querySelector('.dayjump a[aria-current="page"]');
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
  }

  // Ważne TODO dnia: odhaczone znika od razu, stan tylko w tej przeglądarce
  function todoList(day) {
    const list = openTodos(day);
    if (!list.length) return "";
    return `<section class="todo" aria-labelledby="todo-${esc(day.id)}">
      <h2 class="eyebrow" id="todo-${esc(day.id)}">${icon("check")} Ważne TODO</h2>
      <ul>${list.map((x) => `<li><label><input type="checkbox" data-todo="${esc(x.id)}">
        <span><b>${prioBadge(x.priority)}${esc(x.text)}</b>${x.where ? `<span class="where">${icon("pin")}${esc(x.where)}</span>` : ""}${x.note ? `<span class="n">${esc(x.note)}</span>` : ""}${(x.links || []).length ? `<span class="n">${x.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ")}</span>` : ""}</span></label></li>`).join("")}</ul>
    </section>`;
  }

  // Instrukcje pod planem dnia: days[].guides = [id] z trip.guides (format w data/README.md)
  const EVID = { research: "Badania", estimate: "Szacunek", practice: "Praktyka", official: "Oficjalnie" };
  const evTag = (e) => e && EVID[e] ? `<span class="ev ev-${esc(e)}">${EVID[e]}</span>` : "";
  const gLink = (l) => l ? ` <a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>` : "";
  const gText = (x) => typeof x === "string" ? esc(x) : `${x.label ? `<b>${esc(x.label)}</b> ` : ""}${esc(x.text || "")}${gLink(x.link)}${evTag(x.evidence)}`;
  function guideBlock(b) {
    if (b.type === "rules") return `<ol class="g-rules">${b.items.map((x) => `<li><b>${esc(x.title)}</b>${x.text ? `<span>${esc(x.text)}${evTag(x.evidence)}</span>` : ""}</li>`).join("")}</ol>`;
    if (b.type === "list" || b.type === "check") return `${b.title ? `<h3 class="eyebrow">${esc(b.title)}</h3>` : ""}<ul class="g-list ${b.type === "check" ? "is-check" : ""}">${b.items.map((x) => `<li>${gText(x)}</li>`).join("")}</ul>`;
    if (b.type === "facts") return `${b.title ? `<h3 class="eyebrow">${esc(b.title)}</h3>` : ""}<dl class="g-facts">${b.items.map((x) => `<div><dt>${esc(x.label)}</dt><dd>${esc(x.text)}${gLink(x.link)}${evTag(x.evidence)}</dd></div>`).join("")}</dl>`;
    if (b.type === "table") return `${b.title ? `<h3 class="eyebrow">${esc(b.title)}</h3>` : ""}<table class="g-table"><thead><tr>${b.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${b.rows.map((r) => `<tr class="${r.hl ? "hl" : ""}">${r.cells.map((c, k) => `<td data-l="${esc(b.columns[k])}">${esc(c)}${k === r.cells.length - 1 ? evTag(r.evidence) : ""}</td>`).join("")}</tr>`).join("")}</tbody></table>${b.note ? `<p class="g-note">${esc(b.note)}</p>` : ""}`;
    if (b.type === "text") return `<p class="g-text">${esc(b.text)}</p>`;
    if (b.type === "alert") return `<div class="g-alert"><b>${esc(b.title)}</b> ${esc(b.text)}</div>`;
    if (b.type === "links") return `<ul class="g-links">${b.items.map((x) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${icon("link")} ${esc(x.label)}</a>${x.note ? `<span>${esc(x.note)}</span>` : ""}</li>`).join("")}</ul>`;
    if (b.type === "details") return `<details class="g-more"><summary>${esc(b.title)}</summary>${(b.blocks || []).map(guideBlock).join("")}</details>`;
    return "";
  }
  function guides(day) {
    const list = (day.guides || []).map((id) => (S.trip.guides || {})[id]).filter(Boolean);
    if (!list.length) return "";
    return `<div class="tl-h"><h2>Instrukcje</h2></div>
      <div class="guides">${list.map((g) => `<details class="guide" id="g-${esc(g.id)}" style="--c:var(--${esc(g.color || "ai")})" ${g.open ? "open" : ""}>
        <summary><span class="eyebrow">${esc(g.eyebrow || "")}</span><span class="gt">${esc(g.title)}</span></summary>
        <div class="gbody">${g.lead ? `<p class="g-lead">${esc(g.lead)}</p>` : ""}${(g.blocks || []).map(guideBlock).join("")}</div>
      </details>`).join("")}</div>`;
  }

  function timeline(day, nowMin, focus) {
    const chosen = S.variant[day.id] || null;
    const items = day.items.filter((i) => {
      if (focus && i.id === focus) return true; // punkt otwarty z historii jest widoczny mimo filtrów
      if (i.priority === "want" && !S.filters.want) return false;
      if (i.priority === "bonus" && !S.filters.bonus) return false;
      if (i.variant && chosen && i.variant !== chosen) return false;
      return true;
    });

    // stan względem "teraz" liczony osobno dla każdego punktu (bloki mogą się nakładać)
    const starts = items.map((i) => toMin(i.start));
    const state = items.map((i, k) => {
      if (nowMin == null) return "";
      const laterStarted = starts.some((s, j) => j > k && s != null && s <= nowMin);
      const s = starts[k], e = toMin(i.end);
      if (s == null) return laterStarted ? "is-past" : "";
      if (s > nowMin) return "";
      if (e != null) return e <= nowMin ? "is-past" : "is-now";
      return laterStarted ? "is-past" : "is-now";
    });
    const hasNow = state.includes("is-now");
    let lineAt = -1;
    if (nowMin != null && !hasNow) { lineAt = state.findIndex((x) => x !== "is-past"); if (lineAt === -1) lineAt = items.length; }

    const routes = dayRoutes(day, items);
    let out = "";
    items.forEach((i, k) => {
      if (k === lineAt) out += nowLine(nowMin);
      out += `<li id="it-${esc(i.id)}" class="p-${i.priority || "none"} t-${i.type} ${state[k]}">${timeCell(i)}<div class="rail"><span class="dot"></span></div><div class="content">${itemBody(i, day, chosen)}${geoBlock(routes.res.get(i.id))}${histLink(i.placeId)}</div></li>`;
    });
    if (lineAt === items.length) out += nowLine(nowMin);
    if (routes.back) {
      out += `<li class="p-none t-hotel tl-back"><div class="time"></div><div class="rail"><span class="dot"></span></div><div class="content">
        <div class="lline">${icon("hotel")}<div><div class="t">Powrót do hotelu</div><div class="n">${esc(routes.back.to.name)}</div></div></div>${geoBlock({ at: routes.back.to, legs: [routes.back] })}</div></li>`;
    }
    const walks = dayWalks(routes, items);
    if (walks.length) {
      out += `<li class="p-none tl-walks"><div class="time"></div><div class="rail"></div><div class="content"><div class="gm gm-day">
        <span class="eyebrow">🗺️ Trasa dnia pieszo</span>
        ${walks.map((w) => `<a class="gm-btn" href="${esc(gmDir(w[0], w[w.length - 1], "walking", w.slice(1, -1)))}" target="_blank" rel="noopener">🗺️ ${w.map((x) => esc(x.name)).join(" → ")}</a>`).join("")}
        <span class="gm-tx">Przejazdy komunikacją są osobno przy punktach planu.</span></div></div></li>`;
    }
    return out;
  }
  const nowLine = (m) => `<li class="nowline" aria-label="Teraz ${fmtMin(m)}"><span class="t">${fmtMin(m)}</span><span class="ln"></span></li>`;
  function timeCell(i) {
    if (!i.start) return `<div class="time"></div>`;
    const ap = i.approx ? '<span class="ap">~</span>' : "";
    return `<div class="time"><div class="s">${ap}${esc(i.start)}</div>${i.end ? `<div class="e">${esc(i.end)}</div>` : ""}</div>`;
  }
  function duration(i) {
    const s = toMin(i.start), e = toMin(i.end);
    if (s == null || e == null || e <= s) return "";
    const m = e - s, h = Math.floor(m / 60), r = m % 60;
    return (h ? h + " h" : "") + (h && r ? " " : "") + (r ? r + " min" : "");
  }
  function itemBody(i, day, chosen) {
    const place = i.placeId ? S.trip.places[i.placeId] : null;
    const vtag = i.variant ? `<span class="var-tag">Wariant ${esc(i.variant)}</span>` : "";
    if (i.type === "decision") {
      return `<div class="decision"><div class="q">${icon("decision")} ${esc(i.title)}</div>
        ${i.note ? `<div class="n">${esc(i.note)}</div>` : ""}
        ${tipList(i.tips, true)}
        <div class="seg">${(i.options || []).map((o) => `<button type="button" data-variant="${esc(o.id)}" data-day="${esc(day.id)}" aria-pressed="${chosen === o.id}"><b>WARIANT ${esc(o.id)}</b>${esc(o.label)}</button>`).join("")}</div></div>`;
    }
    // Informacyjne restauracje A/B bez zaznaczania i zapisywania wyboru.
    if (i.type === "meal" && Array.isArray(i.options) && i.options.length) {
      return `<div class="meal-proposals">
        <div class="meal-proposals-head">${icon("meal")}<div><div class="meal-proposals-title">${esc(i.title)}</div>
          ${i.note ? `<p class="meal-proposals-note">${esc(i.note)}</p>` : ""}</div></div>
        <div class="meal-proposals-list">${i.options.map((o) => `<div class="meal-proposal">
          <span class="meal-proposal-tag">PROPOZYCJA ${esc(o.id)}</span>
          <strong>${esc(o.name)}</strong>
          ${o.kind ? `<span class="meal-proposal-kind">${esc(o.kind)}</span>` : ""}
          ${o.address ? `<span>${esc(o.address)}</span>` : ""}
          ${o.text ? `<p>${esc(o.text)}</p>` : ""}
          ${o.url ? `<a href="${esc(o.url)}" target="_blank" rel="noopener">Google Maps</a>` : ""}
        </div>`).join("")}</div>
      </div>`;
    }
    if (place || i.priority) {
      const short = place && place.short ? `<span class="short">${esc(place.short)}</span>` : place ? `<span class="short empty">Opis miejsca pojawi się wkrótce.</span>` : "";
      const dur = duration(i);
      const tag = place ? "button" : "div";
      return `<${tag} class="icard" ${place ? `type="button" data-place="${esc(place.id)}" data-item="${esc(i.id)}" aria-label="${esc(place.name)}: szczegóły"` : ""}>
        <span class="txt">
          <span class="row1">${prioBadge(i.priority)}${vtag}${dur ? `<span class="dur">${dur}</span>` : ""}</span>
          <span class="name">${esc(i.title)}</span>
          ${place && place.nameJa ? `<span class="jn">${esc(place.nameJa)}</span>` : ""}
          ${short}
          ${i.note ? `<span class="note">${esc(i.note)}</span>` : ""}
          ${tipList(i.tips, !place)}
        </span>
        <span class="thumb">${media(photoFor(i, place), i.placeId || i.id, place ? place.nameJa : null, i.type)}</span>
      </${tag}>`;
    }
    const links = (i.links || []).length ? `<div class="n">${i.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(" · ")}</div>` : "";
    return `<div class="lline">${icon(i.type)}<div><div class="t">${esc(i.title)} ${vtag}</div>${i.note ? `<div class="n">${esc(i.note)}</div>` : ""}${links}${tipList(i.tips, true)}</div></div>`;
  }

  // ---------- place sheet ----------
  function openPlace(placeId, itemId) {
    const place = S.trip.places[placeId]; if (!place) return;
    let item = null;
    const days = S.trip.days.filter((d) => d.items.some((i) => { if (i.id === itemId) item = i; return i.placeId === placeId; }));
    const bookings = S.trip.bookings.filter((b) => (b.placeIds || []).includes(placeId));
    const photos = placePhotos(item, place);
    sheet.innerHTML = `
      <div class="scroll">
        <div class="media">${gallery(photos, placeId, place.nameJa, item ? item.type : "attraction")}
          <button class="close" type="button" data-close aria-label="Zamknij">${icon("close")}</button>
        </div>
        <div class="inner">
          <div style="display:grid;gap:6px">
            <span class="eyebrow">${esc(place.city)}${place.area ? " · " + esc(place.area) : ""}</span>
            <h2 id="sheet-title">${esc(place.name)}</h2>
            ${place.nameJa ? `<span class="jn">${esc(place.nameJa)}</span>` : ""}
          </div>
          ${item && item.priority ? `<div class="row1" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${prioBadge(item.priority)}<span class="muted" style="font-size:.88rem">${esc(legend("priorities", item.priority).usage)}</span></div>` : ""}
          ${place.description ? `<p class="desc">${esc(place.description)}</p>` : `<p class="desc empty">Opis „co to jest” pojawi się w etapie z treścią.</p>`}
          ${item && item.note ? `<div class="callout" style="--c:var(--ai)"><span class="ic"></span><span class="eyebrow">W planie</span><span>${esc(item.note)}</span></div>` : ""}
          ${item && (item.tips || []).length ? `<div class="callout" style="--c:var(--ai)"><span class="ic"></span><span class="eyebrow">Wskazówki</span>${tipList(item.tips, true)}</div>` : ""}
          <div class="links">
            <a class="btn primary" href="${esc(mapsUrl(place))}" target="_blank" rel="noopener">${icon("pin")} Mapa</a>
            ${place.links && place.links.official ? `<a class="btn" href="${esc(place.links.official)}" target="_blank" rel="noopener">${icon("link")} Strona oficjalna</a>` : ""}
          </div>
          ${histLink(placeId, true)}
          ${bookings.length ? `<div class="kv">${bookings.map((b) => `<div><span class="eyebrow">Rezerwacja · <span class="status status-${b.status}">${statusLabel(b.status)}</span></span><span>${esc(b.conclusion)}</span><span class="muted">${esc(b.when)}</span><a href="${esc(b.url)}" target="_blank" rel="noopener">Strona rezerwacji</a></div>`).join("")}</div>` : ""}
          ${days.length ? `<div class="kv"><div><span class="eyebrow">W planie</span><div class="also">${days.map((d) => `<a class="chip" href="#d-${d.id}" data-close>Dzień ${d.dayNumber} · ${shortDate(d.date)}</a>`).join("")}</div></div></div>` : ""}
        </div>
      </div>`;
    wireGallery(sheet);
    if (!sheet.open) { try { sheet.showModal(); } catch (e) { sheet.setAttribute("open", ""); } }
  }
  const statusLabel = (s) => ({ todo: "do zrobienia", booked: "zarezerwowane", "not-needed": "niepotrzebne" }[s] || s);

  // ---------- bookings ----------
  function renderBookings() {
    const t = S.trip, now = nowTokyo();
    const urgent = t.days.filter((d) => d.booking.level === "required");
    const rec = t.days.filter((d) => d.booking.level === "recommended");
    const firstDay = (b) => (b.dayIds || []).slice().sort()[0] || "9999";
    const all = t.bookings.slice().sort((a, b) => firstDay(a).localeCompare(firstDay(b)));
    const list = all.filter((b) => b.kind !== "experience");
    const exps = all.filter((b) => b.kind === "experience");
    const todo = all.filter((b) => b.status === "todo").length;
    const bkCard = (b) => `
        <article class="bk">
          <div class="h"><b>${esc(b.name)}</b><span class="status status-${b.status}">${b.statusLabel ? esc(b.statusLabel) : statusLabel(b.status)}</span></div>
          <div class="when">${icon("clock")}<span><b>${esc(b.when)}</b></span></div>
          <div>${esc(b.conclusion)} <span class="muted">(${esc(b.checked)})</span></div>
          ${(b.facts || []).length ? `<dl class="bk-facts">${b.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.text)}</dd></div>`).join("")}</dl>` : ""}
          ${(b.points || []).length ? `<div class="gm-btns">${b.points.map((id) => geoLoc(id)).filter(Boolean).map((l) => `<a class="gm-btn" href="${esc(gmSearch(l))}" target="_blank" rel="noopener">📍 ${esc(l.name)}</a>`).join("")}</div>` : ""}
          <div class="foot">${(b.dayIds || []).map((id) => S.byId[id] ? `<a class="chip" href="#d-${id}">Dzień ${S.byId[id].dayNumber} · ${shortDate(id)}</a>` : "").join("")}
            <a class="btn" href="${esc(b.url)}" target="_blank" rel="noopener" style="margin-left:auto">${icon("link")} Strona</a></div>
        </article>`;
    const dayLink = (d, lvl) => { const p = dateParts(d.date); return `<a href="#d-${d.id}" class="bk-${lvl}"><span class="dd">${p.d}.${pad(p.mo)}<small>${KANJI_WD[p.wd]}</small></span><span><b>${esc(d.title)}</b><br><span class="muted">${esc(d.booking.text)}</span></span></a>`; };
    view.innerHTML = `
      <header class="pagehead"><span class="eyebrow">${todo} z ${all.length} do zrobienia</span><h1>Rezerwacje</h1></header>
      <div class="section-h"><h2 style="font-size:var(--step-2)"><span class="chip bk-required" style="vertical-align:middle"><span class="bdot"></span>${esc(legend("booking", "required").meaning)}</span></h2></div>
      <div class="urgent">${urgent.map((d) => dayLink(d, "required")).join("")}</div>
      <div class="section-h"><h2 style="font-size:var(--step-2)"><span class="chip bk-recommended" style="vertical-align:middle"><span class="bdot"></span>${esc(legend("booking", "recommended").meaning)}</span></h2></div>
      <div class="urgent">${rec.map((d) => dayLink(d, "recommended")).join("")}</div>
      <div class="section-h"><h2>Źródła i bilety</h2></div>
      <div class="bk-list">${list.map(bkCard).join("")}</div>
      ${exps.length ? `<div class="section-h"><h2>Doświadczenia</h2></div>
      <div class="bk-list">${exps.map(bkCard).join("")}</div>` : ""}
      <p class="footer">Dzisiaj w Japonii: ${fmtDate(now.date)}.</p>`;
  }

  // ---------- food ----------
  function foodCard(c) {
    const ph = c.photo;
    return `<article class="fcard">
      <div class="fmedia">${media(ph, c.id, c.nameJa, "meal")}${ph && ph.credit ? `<span class="credit"><a href="${esc(ph.sourceUrl)}" target="_blank" rel="noopener">${esc(ph.credit)}</a> · ${esc(ph.license)}</span>` : ""}</div>
      <div class="fbody"><h3>${esc(c.name)}${c.nameJa ? ` <span class="jn">${esc(c.nameJa)}</span>` : ""}</h3>
        ${c.tag ? `<span class="ftag">${esc(c.tag)}</span>` : ""}
        <p>${esc(c.text)}</p></div>
    </article>`;
  }
  function renderFood() {
    const f = S.trip.food;
    view.innerHTML = `
      <header class="pagehead"><span class="eyebrow">Przewodnik · ${f.sections.length} części</span><h1>${esc(f.title)}<span class="ja">${esc(f.titleJa || "")}</span></h1>
        ${f.intro ? `<p class="summary">${esc(f.intro)}</p>` : ""}</header>
      <nav class="fjump" aria-label="Części">${f.sections.map((s) => `<a class="chip" href="#food-${esc(s.id)}">${esc(s.title)}</a>`).join("")}</nav>
      ${f.sections.map((s) => `
        <section class="fsec" id="food-${esc(s.id)}">
          <div class="section-h"><h2>${esc(s.title)}${s.titleJa ? ` <span class="jn">${esc(s.titleJa)}</span>` : ""}</h2></div>
          ${(s.paragraphs || []).map((p) => `<p class="fp">${esc(p)}</p>`).join("")}
          ${(s.tips || []).length ? `<ul class="ftips">${s.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          ${(s.cards || []).length ? `<div class="fgrid">${s.cards.map(foodCard).join("")}</div>` : ""}
          ${(s.lists || []).map((l) => `
            <div class="flist"><h3 class="eyebrow">${esc(l.title)}</h3>
              <dl>${l.items.map((x) => `<div><dt><b>${esc(x.romaji)}</b> <span class="jn">${esc(x.ja)}</span></dt><dd>${esc(x.pl)}</dd></div>`).join("")}</dl></div>`).join("")}
        </section>`).join("")}
      ${f.source ? `<p class="footer">${esc(f.source)}</p>` : ""}`;
  }

  // ---------- historia ----------
  // Tekst artykułu pochodzi wyłącznie z content/historia-japonii.md (renderer md.js, bez zmian treści).
  // Zdjęcia, ramki „Zobaczymy podczas podróży”, oś epok i spis treści to osobne elementy interfejsu
  // (data-ui), opisane w content/historia-powiazania.json; miejsca, daty i priorytety bierzemy z trip.json.
  const PRIO_RANK = { must: 0, want: 1, bonus: 2 };
  const histKey = (k) => "historia-" + k;
  // Link „Poznaj historię tego miejsca” przy atrakcjach planu (tylko te z mapy backlinks)
  function histLink(placeId, inSheet) {
    const a = placeId && S.hist && S.hist.backlinks && S.hist.backlinks[placeId];
    if (!a) return "";
    return `<a class="hist-link${inSheet ? " in-sheet" : ""}" href="#${esc(histKey(a))}" ${inSheet ? "data-close" : ""}>${icon("book")}<span>Poznaj historię tego miejsca</span></a>`;
  }
  // Zdjęcie z mapy: {place, n} → places[place].photo / gallery[n-1]; {src, …} → metadane z trip.json po src
  function histPhoto(ref) {
    if (!ref) return null;
    if (ref.place) {
      const pl = S.trip.places[ref.place]; if (!pl) return null;
      const all = [pl.photo].concat(pl.gallery || []).filter((p) => p && p.src);
      const p = all[ref.n || 0] || all[0];
      return p ? Object.assign({ kind: "photo" }, p, { kind: ref.kind || "photo" }) : null;
    }
    if (ref.src) return Object.assign({ kind: "photo" }, S.photoBySrc[ref.src] || {}, ref);
    return null;
  }
  const KIND_LABEL = { photo: "Fotografia współczesna", artwork: "Dawne przedstawienie", artefact: "Zabytek w muzeum" };
  function histCredits(photos) {
    return photos.filter((p) => p.credit).map((p) => `<span class="credit">${p.sourceUrl ? `<a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${esc(p.credit)}</a>` : esc(p.credit)}${p.license ? " · " + esc(p.license) : ""}</span>`).join("");
  }
  function histFigure(refs, caption, cls) {
    const photos = refs.map(histPhoto).filter(Boolean);
    if (!photos.length) return "";
    const kinds = [...new Set(photos.map((p) => p.kind))];
    return `<figure class="h-fig n${photos.length} ${cls || ""}" data-ui>
      <div class="h-fig-row">${photos.map((p) => `<button type="button" class="h-zoom" data-zoom="${esc(p.src)}" aria-label="Powiększ zdjęcie: ${esc(p.alt || caption || "")}">
        <img src="${esc(p.src)}" alt="${esc(p.alt || "")}" loading="lazy" decoding="async"${p.kind === "photo" ? "" : ' class="contain"'}></button>`).join("")}</div>
      <figcaption>${kinds.map((k) => `<span class="h-kind k-${esc(k)}">${esc(KIND_LABEL[k] || KIND_LABEL.photo)}</span>`).join("")}${caption ? `<span class="cap">${esc(caption)}</span>` : ""}${histCredits(photos)}</figcaption>
    </figure>`;
  }
  // „Zobaczymy podczas podróży”: punkty planu pogrupowane po dniach, z aktualnymi datami i priorytetami
  function histTrip(link) {
    const t = S.trip, rows = [];
    t.days.forEach((d) => {
      const best = {};
      d.items.forEach((i, k) => {
        const key = (link.places || []).includes(i.placeId) ? "p:" + i.placeId : (link.items || []).includes(i.id) ? "i:" + i.id : null;
        if (!key) return;
        const cur = best[key];
        if (!cur || (PRIO_RANK[i.priority] ?? 3) < (PRIO_RANK[cur.i.priority] ?? 3)) best[key] = { i, k };
      });
      const list = Object.values(best).sort((a, b) => a.k - b.k);
      if (list.length) rows.push({ d, list });
    });
    if (!rows.length) return "";
    return `<aside class="h-trip" data-ui aria-label="Zobaczymy podczas podróży">
      <span class="eyebrow">${icon("pin")} Zobaczymy podczas podróży</span>
      ${rows.map(({ d, list }) => `<div class="h-trip-day">
        <div class="h-trip-h"><b>${esc(d.title)}</b><span class="num"> — ${fmtDate(d.date)} ${dateParts(d.date).y}</span></div>
        <ul>${list.map(({ i }) => { const pl = i.placeId && t.places[i.placeId]; return `<li><a href="#d-${esc(d.id)}/${esc(i.id)}">
          ${prioBadge(i.priority)}<span class="nm">${esc(pl ? pl.name : i.title)}</span><span class="go">Zobacz w planie →</span></a></li>`; }).join("")}</ul>
      </div>`).join("")}
    </aside>`;
  }
  function histParse() {
    if (S.histDoc) return S.histDoc;
    const doc = MD.parse(S.histMd), links = S.hist || {};
    const anchors = links.anchors || {};
    // kotwica → indeks akapitu (po początku tekstu)
    const at = {};
    Object.entries(anchors).forEach(([key, start]) => {
      const k = doc.blocks.findIndex((b) => b.type === "para" && (b.raw.startsWith(start) || b.text.startsWith(MD.plain(start))));
      if (k >= 0) at[k] = key; else console.warn("Historia: nie znaleziono kotwicy", key);
    });
    doc.anchorAt = at;
    doc.anchorIds = new Set(Object.values(at));
    return (S.histDoc = doc);
  }
  // h2 „1. Zanim pojawili się samurajowie. Początki…”: numer i podtytuł tylko inaczej złożone, ten sam tekst
  function h2Html(b) {
    let html = b.html, num = "";
    const m = /^(\d+\.)\s/.exec(html);
    if (m) { num = `<span class="h-num">${m[1]}</span> `; html = html.slice(m[0].length); }
    const dot = html.indexOf(". ");
    if (dot > 0 && dot < html.length - 2) html = `<span class="h-main">${html.slice(0, dot + 2)}</span><span class="h-subt">${html.slice(dot + 2)}</span>`;
    return `<h2 id="${esc(histKey(b.id))}">${num}${html}</h2>`;
  }
  function renderHistory() {
    const doc = histParse(), L = S.hist || {}, blocks = doc.blocks;
    const h1 = blocks.find((b) => b.type === "heading" && b.level === 1);
    const firstH2 = blocks.findIndex((b) => b.type === "heading" && b.level === 2);
    const pre = blocks.slice(0, firstH2 < 0 ? blocks.length : firstH2).filter((b) => b !== h1);
    const heads = blocks.filter((b) => b.type === "heading" && b.level >= 2 && b.level <= 3);
    const words = blocks.reduce((n, b) => n + (b.text || (b.rowsText || []).flat().join(" ") || (b.items || []).map((x) => x.text).join(" ")).split(/\s+/).length, 0);
    const minutes = Math.max(1, Math.round(words / 200));
    const after = (list, key) => (list || []).filter((x) => x.after === key);

    let body = "", open = false;
    blocks.slice(firstH2).forEach((b, off) => {
      const k = firstH2 + off;
      if (b.type === "heading" && b.level === 2) {
        if (open) body += "</section>";
        const ch = (L.chapters || {})[b.id] || {};
        body += `<section class="h-sec" aria-labelledby="${esc(histKey(b.id))}">
          ${ch.kanji ? `<span class="h-kanji ja" aria-hidden="true" data-ui>${esc(ch.kanji)}</span>` : ""}
          ${h2Html(b)}
          ${ch.photo ? histFigure([ch.photo], ch.caption, "opener") : ""}`;
        open = true; return;
      }
      if (b.type === "heading") { body += `<h${b.level} id="${esc(histKey(b.id))}">${b.html}</h${b.level}>`; return; }
      if (b.type === "para") {
        const key = doc.anchorAt[k];
        const cls = /^\*\*Podczas zwiedzania:\*\*/.test(b.raw) ? "h-visit" : /^\*[^*].*\*$/.test(b.raw) ? "h-note" : "";
        body += `<p${key ? ` id="${esc(histKey(key))}"` : ""}${cls ? ` class="${cls}"` : ""}>${b.html}</p>`;
        if (key) {
          after(L.figures, key).forEach((f) => { body += histFigure(f.photos, f.caption); });
          after(L.tripLinks, key).forEach((x) => { body += histTrip(x); });
        }
        return;
      }
      body += MD.blockHtml(b);
    });
    if (open) body += "</section>";
    if (doc.footnotes.length) body += `<section class="h-fn" aria-label="Przypisy"><ol>${doc.footnotes.map((f) => `<li id="fn-${esc(f.id)}" value="${f.n}">${f.html} <a href="#fnref-${esc(f.id)}" aria-label="Wróć do tekstu">↩</a></li>`).join("")}</ol></section>`;

    const hero = histPhoto(L.hero && L.hero.photo);
    const last = S.lastDay && S.byId[S.lastDay];
    const tocList = (cls) => `<ol class="${cls}">${heads.map((h) => `<li class="lv${h.level}"><a href="#${esc(histKey(h.id))}" data-toc="${esc(histKey(h.id))}">${esc(h.text)}</a></li>`).join("")}</ol>`;
    const eraTarget = (x) => histKey(x.target);
    view.innerHTML = `
      <div class="hist" data-hist>
        <div class="h-progress" data-ui aria-hidden="true"><i></i></div>
        <header class="h-hero">
          ${hero ? `<figure class="h-hero-media" data-ui><img src="${esc(hero.src)}" alt="${esc(hero.alt || "")}" fetchpriority="high" decoding="async">
            <figcaption><span class="h-kind">${esc(KIND_LABEL[hero.kind] || KIND_LABEL.photo)}</span>${L.hero.caption ? `<span class="cap">${esc(L.hero.caption)}</span>` : ""}${histCredits([hero])}</figcaption></figure>` : ""}
          <div class="h-hero-text">
            <span class="eyebrow" data-ui>Przewodnik historyczny · przygotowany do podróży ${esc(L.trip || rangeLabel())}</span>
            ${h1 ? `<h1 id="${esc(histKey(h1.id))}">${h1.html}</h1>` : ""}
            ${pre.map((b) => b.type === "para" ? `<p class="h-lead">${b.html}</p>` : MD.blockHtml(b)).join("")}
            <div class="h-actions" data-ui>
              <a class="btn primary" href="#historia-spis">${icon("book")} Spis treści</a>
              <a class="btn" href="#historia-epoki">Oś epok</a>
              ${last ? `<a class="btn" href="#d-${esc(last.id)}">${icon("left")} Wróć do planu: ${shortDate(last.date)} ${esc(last.title)}</a>` : ""}
              <span class="muted h-meta">${heads.filter((h) => h.level === 2).length} części · ok. ${minutes} min czytania</span>
            </div>
          </div>
        </header>

        ${(L.eras || []).length ? `<nav class="h-eras" id="historia-epoki" data-ui aria-label="Oś czasu epok">
          <span class="eyebrow">Epoki w przewodniku</span>
          <ol>${L.eras.map((x) => `<li><a href="#${esc(eraTarget(x))}"><span class="k ja" aria-hidden="true">${esc(x.kanji || "")}</span><span class="d num">${esc(x.dates)}</span><span class="n">${esc(x.name)}</span></a></li>`).join("")}</ol>
        </nav>` : ""}

        <details class="h-toc" id="historia-spis" data-ui>
          <summary><span class="eyebrow">Spis treści</span><span class="muted">${heads.length} pozycji</span></summary>
          ${tocList("h-toc-list")}
        </details>

        <div class="h-layout">
          <article class="h-article" lang="pl">${body}</article>
          <aside class="h-side" data-ui aria-label="Spis treści"><span class="eyebrow">Spis treści</span>${tocList("h-side-list")}</aside>
        </div>
        <p class="footer" data-ui>Tekst: ${esc(L.source || "content/historia-japonii.md")}, wyświetlany bez zmian. Daty wizyt i priorytety w ramkach „Zobaczymy podczas podróży” pochodzą z aktualnego planu.</p>
        <a class="h-totop" href="#historia-spis" data-ui aria-label="Powrót do spisu treści">${icon("up")}<span>Spis treści</span></a>
      </div>`;
    histScroll();
  }
  // pasek postępu, aktywny rozdział w bocznym spisie treści, przycisk powrotu do spisu
  function histScroll() {
    const root = view.querySelector("[data-hist]"); if (!root) return;
    const art = root.querySelector(".h-article"), bar = root.querySelector(".h-progress i"), top = root.querySelector(".h-totop");
    const r = art.getBoundingClientRect(), vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * 0.3 - r.top) / Math.max(1, r.height - vh * 0.5)));
    bar.style.transform = `scaleX(${p})`;
    top.classList.toggle("on", r.top < 0 && r.bottom > vh * 0.6);
    let cur = null;
    root.querySelectorAll(".h-article h2, .h-article h3").forEach((h) => { if (h.getBoundingClientRect().top < vh * 0.25) cur = h.id; });
    root.querySelectorAll(".h-side-list a").forEach((a) => { if (a.dataset.toc === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
  }
  window.addEventListener("scroll", () => { if (S.tab === "historia") { cancelAnimationFrame(S.hRaf); S.hRaf = requestAnimationFrame(histScroll); } }, { passive: true });
  window.addEventListener("resize", () => { if (S.tab === "historia") histScroll(); }, { passive: true });

  async function fetchFirst(urls, kind) {
    for (const url of urls) {
      try { const r = await fetch(url, { cache: "no-cache" }); if (r.ok) return kind === "json" ? await r.json() : await r.text(); } catch (e) { /* następny adres */ }
    }
    throw new Error("Nie udało się wczytać " + urls[0]);
  }
  // #historia, #historia-<rozdział lub kotwica>, #historia-spis, #historia-epoki
  function routeHistory(h, fromTab) {
    const target = h === "historia" ? null : h;
    const already = S.tab === "historia" && view.querySelector("[data-hist]");
    S.tab = "historia";
    renderSide(null, "historia"); setTab("historia");
    const go = (smooth) => {
      const el = target && document.getElementById(target);
      if (el && el.tagName === "DETAILS") el.open = true;
      if (el) el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      else window.scrollTo(0, fromTab === "historia" ? window.scrollY : S.histY || 0);
      histScroll();
    };
    if (already) { go(true); return; }
    if (S.histMd == null) {
      view.innerHTML = `<div class="loading">Wczytuję historię Japonii…</div>`;
      fetchFirst(HIST_MD_URLS, "text").then((md) => {
        S.histMd = md;
        if (S.tab === "historia" && decodeURIComponent(location.hash.replace(/^#/, "")) === h) { renderHistory(); go(false); }
      }).catch(() => {
        view.innerHTML = `<div class="err"><h1>Nie mogę wczytać historii</h1><p>Strona czyta tekst z <code>content/historia-japonii.md</code>. Sprawdź połączenie z internetem i odśwież stronę.</p></div>`;
      });
      return;
    }
    renderHistory(); go(false);
  }

  // powiększenie zdjęcia z artykułu
  let lightbox = null;
  function openZoom(btn) {
    const fig = btn.closest("figure"), img = btn.querySelector("img");
    if (!lightbox) {
      lightbox = document.createElement("dialog"); lightbox.className = "lightbox";
      lightbox.addEventListener("click", (e) => { if (!e.target.closest("a")) lightbox.close(); });
      document.body.appendChild(lightbox);
    }
    const cap = fig && fig.querySelector("figcaption");
    lightbox.innerHTML = `<button class="close" type="button" aria-label="Zamknij">${icon("close")}</button><img src="${esc(img.getAttribute("src"))}" alt="${esc(img.alt)}">${cap ? `<div class="lb-cap">${cap.innerHTML}</div>` : ""}`;
    try { lightbox.showModal(); } catch (e) { lightbox.setAttribute("open", ""); }
  }

  // ---------- router ----------
  function route() {
    if (sheet.open) sheet.close();
    if (lightbox && lightbox.open) lightbox.close();
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    const prevTab = S.tab;
    if (prevTab === "historia" && view.querySelector("[data-hist]")) S.histY = window.scrollY;
    if (h === "historia" || h.startsWith("historia-")) { routeHistory(h, prevTab); return; }
    let tab = "plan", active = null, focus = null;
    // #d-2026-11-14 albo #d-2026-11-14/<itemId> (punkt planu, np. z historii)
    const dm = /^d-(\d{4}-\d{2}-\d{2})(?:\/(.+))?$/.exec(h);
    if (dm && S.byId[dm[1]]) {
      const d = S.byId[dm[1]]; active = d.id; S.lastDay = d.id;
      focus = dm[2] && d.items.some((i) => i.id === dm[2]) ? dm[2] : null;
      tab = todayDay() && todayDay().id === d.id ? "today" : "plan";
      renderDay(d, { focus });
    } else if (h === "today") {
      tab = "today";
      const d = todayDay(), now = nowTokyo();
      const fallback = now.date < S.trip.meta.dateFrom ? S.trip.days[0] : S.trip.days[S.trip.days.length - 1];
      active = (d || fallback).id; S.lastDay = active;
      renderDay(d || fallback, { fromToday: !d });
    } else if (h === "bookings") {
      tab = "bookings"; renderBookings();
    } else if (h.startsWith("food") && S.trip.food) {
      tab = "food"; renderFood(); S.tab = tab;
      const sec = h.startsWith("food-") && document.getElementById(h);
      renderSide(active, tab); setTab(tab);
      if (sec) sec.scrollIntoView(); else window.scrollTo(0, 0);
      return;
    } else {
      renderOverview();
    }
    S.tab = tab;
    renderSide(active, tab);
    setTab(tab);
    window.scrollTo(0, 0);
    const el = focus && document.getElementById("it-" + focus);
    if (el) {
      el.scrollIntoView({ block: "start" });
      el.classList.add("is-focus");
      setTimeout(() => el.classList.remove("is-focus"), 2600);
      // adres bez punktu: odświeżenie co 5 min i przeładowanie strony nie przewijają ponownie
      try { history.replaceState(history.state, "", "#d-" + active); } catch (e) { /* bez historii */ }
    }
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-place],[data-variant],[data-filter],[data-close],[data-sim],[data-zoom]");
    if (!t) return;
    if (t.dataset.zoom) { openZoom(t); return; }
    if (t.dataset.place) { openPlace(t.dataset.place, t.dataset.item); return; }
    if (t.dataset.variant) {
      const d = t.dataset.day; S.variant[d] = S.variant[d] === t.dataset.variant ? null : t.dataset.variant;
      const y = window.scrollY; renderDay(S.byId[d]); window.scrollTo(0, y); return;
    }
    if (t.dataset.filter) {
      const k = t.dataset.filter; S.filters[k] = !S.filters[k]; store.set("filters", S.filters);
      const y = window.scrollY; route(); window.scrollTo(0, y); return;
    }
    if (t.hasAttribute("data-close")) { if (sheet.open) sheet.close(); return; }
    if (t.dataset.sim) {
      if (t.dataset.sim === "off") { S.sim = null; location.hash = "today"; route(); return; }
      const [d, tm] = t.dataset.sim.split("T"); S.sim = { date: d, min: toMin(tm) };
      if (location.hash !== "#today") location.hash = "today"; else route();
    }
  });
  document.addEventListener("change", (e) => {
    const id = e.target.dataset && e.target.dataset.todo;
    if (!id) return;
    if (!e.target.checked) return;
    S.done[id] = true;
    store.set("todo", S.done);
    const li = e.target.closest("li"), box = e.target.closest("section.todo");
    li.remove();
    if (box && !box.querySelector("li")) box.remove();
  });
  sheet.addEventListener("click", (e) => { if (e.target === sheet) sheet.close(); });
  window.addEventListener("hashchange", route);
  setInterval(() => { if (!S.sim && /^#(today|d-)/.test(location.hash) && !sheet.open) { const y = window.scrollY; route(); window.scrollTo(0, y); } }, 5 * 60 * 1000);

  // ---------- data ----------
  async function load() {
    for (const url of DATA_URLS) {
      try { const r = await fetch(url, { cache: "no-cache" }); if (r.ok) return await r.json(); } catch (e) { /* następny adres */ }
    }
    throw new Error("Nie udało się wczytać trip.json");
  }
  function start(trip, hist) {
    S.trip = trip;
    S.hist = hist || null;
    trip.days.forEach((d) => { S.byId[d.id] = d; });
    // metadane zdjęć (autor, licencja) po ścieżce pliku, do ponownego użycia w historii
    S.photoBySrc = {};
    const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") { if (typeof o.src === "string" && o.credit && !S.photoBySrc[o.src]) S.photoBySrc[o.src] = o; Object.values(o).forEach(walk); } };
    walk(trip);
    S.filters = Object.assign(S.filters, store.get("filters", {}));
    S.done = store.get("todo", {}) || {};
    route();
  }
  function showLoadError() {
    view.innerHTML = `<div class="err"><h1>Nie mogę wczytać planu</h1>
      <p>Strona czyta dane z <code>data/trip.json</code>. Przeglądarka blokuje to przy otwieraniu pliku z dysku, dlatego stronę trzeba otworzyć z serwera (np. <code>python3 -m http.server</code> w folderze <code>japan-guide</code>).</p>
      <p>Możesz też wskazać plik ręcznie:</p>
      <label class="btn" for="pick">Wybierz trip.json<input id="pick" type="file" accept="application/json,.json" hidden></label></div>`;
    $("#pick").addEventListener("change", (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((s) => start(JSON.parse(s))).catch(() => { view.querySelector(".err p").textContent = "To nie jest poprawny plik trip.json."; });
    });
  }
  // mapa powiązań historii jest opcjonalna: bez niej plan działa jak dotąd
  Promise.all([load(), fetchFirst(HIST_LINKS_URLS, "json").catch(() => null)])
    .then(([trip, hist]) => start(trip, hist)).catch(showLoadError);
})();
