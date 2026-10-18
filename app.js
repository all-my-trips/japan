/* Japonia 2026: przewodnik. Cała treść pochodzi z data/trip.json;
   ten plik tylko ją renderuje (format opisany w data/README.md). */
(function () {
  "use strict";

  const DATA_URLS = ["data/trip.json", "../data/trip.json"];
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
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0zM8 21h8M9 7c0-1.5 1-2 1-3.5M13 7c0-1.5 1-2 1-3.5"/>',
    ticket: '<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>'
  };

  const S = { trip: null, byId: {}, filters: { want: true, bonus: true }, variant: {}, sim: null, done: {} };
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
  const hash = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem("jp26." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("jp26." + k, JSON.stringify(v)); } catch (e) { /* bez pamięci */ } }
  };
  const legend = (group, id) => (S.trip.legend[group] || []).find((x) => x.id === id) || { id, label: id, meaning: "" };

  function nowTokyo() {
    if (S.sim) return S.sim;
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: S.trip.meta.timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
      return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
    } catch (e) {
      const d = new Date(); return { date: d.toISOString().slice(0, 10), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  const todayDay = () => S.byId[nowTokyo().date] || null;

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

  // Zdjęcie: place.photo → legend.itemTypes[type].defaultPhoto → plakietka z nazwą po japońsku
  function photoFor(item, place) {
    if (place && place.photo) return place.photo;
    const t = legend("itemTypes", item && item.type);
    return t.defaultPhoto || null;
  }
  function media(photo, seed, kanji, type) {
    if (photo && photo.src) return `<img src="${esc(photo.src)}" alt="${esc(photo.alt || "")}" loading="lazy">`;
    const h = hash(seed) % 360;
    const inner = kanji ? `<span class="k">${vert(kanji, 4)}</span>` : icon(type);
    return `<div class="ph" style="--h:${h}" role="img" aria-label="Zdjęcie pojawi się później">${inner}</div>`;
  }
  function mapsUrl(place) {
    if (place.links && place.links.maps) return place.links.maps;
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.mapsQuery || place.name);
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

    const fl = t.meta.flights.map((f) => {
      const d = S.byId[f.dayId];
      return `<div class="fact"><span class="k eyebrow">${icon("flight")} ${f.direction === "outbound" ? "Lot tam" : "Lot powrotny"}</span>
        <span class="v">${esc(f.number)} · ${f.direction === "outbound" ? "→ " + esc(t.meta.airport.name) : esc(t.meta.airport.name) + " →"}</span>
        <span class="d">${d ? fmtDate(d.date) : ""}, wylot ${esc(f.departure)}${f.arrival ? ", przylot " + esc(f.arrival) : ""}</span></div>`;
    }).join("");
    const ht = t.meta.hotels.map((h) => `
      <div class="fact ${h.status === "todo" ? "todo" : ""}"><span class="k eyebrow">${icon("hotel")} ${esc(h.city)}${h.area ? " · " + esc(h.area) : ""}</span>
        <span class="v">${h.name ? esc(h.name) : '<span class="pill-todo">Hotel do zarezerwowania</span>'}</span>
        <span class="d">${shortDate(h.checkIn)} – ${shortDate(h.checkOut)} · ${daysBetween(h.checkIn, h.checkOut)} noce</span></div>`).join("");

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
      <div class="facts">${fl}${ht}</div>

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
        ${(d.todos || []).length ? `<span class="ptodo"><b>${icon("check")} Ważne TODO</b><span>${d.todos.map((x) => esc(x.text)).join(" · ")}</span></span>` : ""}
        <span class="meta"><span class="chip" title="Tempo">${paceBars(d.pace)}${esc(d.paceLabel)}</span>${bookingChip(d.booking)}</span>
      </a></li>`;
  }

  // ---------- day ----------
  function renderDay(day, opts) {
    const t = S.trip, now = nowTokyo(), isToday = now.date === day.id;
    const idx = t.days.indexOf(day), prev = t.days[idx - 1], next = t.days[idx + 1];
    const p = dateParts(day.date);
    const firstMust = day.items.find((i) => i.priority === "must" && i.placeId && S.trip.places[i.placeId]);
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
          <div><span class="eyebrow">Nocleg</span><span class="v">${day.stay ? esc(day.stay.hotelName || "do zarezerwowania") : "w samolocie / w domu"}</span></div>
        </div>
        <div class="pri3">
          ${["must", "want", "bonus"].map((k) => `<div>${prioBadge(k)}<span>${esc(day.priorities[k])}</span></div>`).join("")}
        </div>
        ${day.booking.level !== "none" ? `<div class="callout bk-${day.booking.level}"><span class="ic"></span><span class="eyebrow">Rezerwacje · ${esc(legend("booking", day.booking.level).meaning)}</span><span>${esc(day.booking.text)}</span></div>` : ""}
        ${day.notes ? `<div class="callout" style="--c:var(--ai)"><span class="ic"></span><span class="eyebrow">Uwagi</span><span>${esc(day.notes)}</span></div>` : ""}
      </header>

      <div class="tl-h"><h2>Plan dnia</h2>
        <div class="filters" role="group" aria-label="Pokaż priorytety">
          <button type="button" class="f-must" aria-pressed="true" disabled title="MUST jest zawsze widoczne"><span class="bx"></span>MUST</button>
          <button type="button" class="f-want" data-filter="want" aria-pressed="${S.filters.want}"><span class="bx"></span>WANT</button>
          <button type="button" class="f-bonus" data-filter="bonus" aria-pressed="${S.filters.bonus}"><span class="bx"></span>BONUS</button>
        </div>
      </div>
      <ol class="tl">${timeline(day, isToday ? now.min : null)}</ol>

      <div class="dhead"><div class="nav">
        ${prev ? `<a class="btn" href="#d-${prev.id}">${icon("left")} ${shortDate(prev.date)} ${esc(prev.title)}</a>` : "<span></span>"}
        ${next ? `<a class="btn" href="#d-${next.id}">${shortDate(next.date)} ${esc(next.title)} ${icon("right")}</a>` : ""}
      </div></div>`;

    const cur = view.querySelector('.dayjump a[aria-current="page"]');
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "center" });
  }

  // Ważne TODO dnia: lista do odhaczenia, stan tylko w tej przeglądarce
  function todoList(day) {
    const list = day.todos || [];
    if (!list.length) return "";
    return `<section class="todo" aria-labelledby="todo-${esc(day.id)}">
      <h2 class="eyebrow" id="todo-${esc(day.id)}">${icon("check")} Ważne TODO</h2>
      <ul>${list.map((x) => `<li><label><input type="checkbox" data-todo="${esc(x.id)}" ${S.done[x.id] ? "checked" : ""}>
        <span><b>${esc(x.text)}</b>${x.where ? `<span class="where">${icon("pin")}${esc(x.where)}</span>` : ""}${x.note ? `<span class="n">${esc(x.note)}</span>` : ""}</span></label></li>`).join("")}</ul>
    </section>`;
  }

  function timeline(day, nowMin) {
    const chosen = S.variant[day.id] || null;
    const items = day.items.filter((i) => {
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

    let out = "";
    items.forEach((i, k) => {
      if (k === lineAt) out += nowLine(nowMin);
      out += `<li class="p-${i.priority || "none"} t-${i.type} ${state[k]}">${timeCell(i)}<div class="rail"><span class="dot"></span></div><div class="content">${itemBody(i, day, chosen)}</div></li>`;
    });
    if (lineAt === items.length) out += nowLine(nowMin);
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
        <div class="seg">${(i.options || []).map((o) => `<button type="button" data-variant="${esc(o.id)}" data-day="${esc(day.id)}" aria-pressed="${chosen === o.id}"><b>WARIANT ${esc(o.id)}</b>${esc(o.label)}</button>`).join("")}</div></div>`;
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
        </span>
        <span class="thumb">${media(photoFor(i, place), i.placeId || i.id, place ? place.nameJa : null, i.type)}</span>
      </${tag}>`;
    }
    return `<div class="lline">${icon(i.type)}<div><div class="t">${esc(i.title)} ${vtag}</div>${i.note ? `<div class="n">${esc(i.note)}</div>` : ""}</div></div>`;
  }

  // ---------- place sheet ----------
  function openPlace(placeId, itemId) {
    const place = S.trip.places[placeId]; if (!place) return;
    let item = null;
    const days = S.trip.days.filter((d) => d.items.some((i) => { if (i.id === itemId) item = i; return i.placeId === placeId; }));
    const bookings = S.trip.bookings.filter((b) => (b.placeIds || []).includes(placeId));
    const photo = photoFor(item, place);
    sheet.innerHTML = `
      <div class="scroll">
        <div class="media">${media(photo, placeId, place.nameJa, item ? item.type : "attraction")}
          ${photo && photo.credit ? `<span class="credit">${esc(photo.credit)}${photo.license ? " · " + esc(photo.license) : ""}</span>` : ""}
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
          <div class="links">
            <a class="btn primary" href="${esc(mapsUrl(place))}" target="_blank" rel="noopener">${icon("pin")} Mapa</a>
            ${place.links && place.links.official ? `<a class="btn" href="${esc(place.links.official)}" target="_blank" rel="noopener">${icon("link")} Strona oficjalna</a>` : ""}
          </div>
          ${bookings.length ? `<div class="kv">${bookings.map((b) => `<div><span class="eyebrow">Rezerwacja · <span class="status status-${b.status}">${statusLabel(b.status)}</span></span><span>${esc(b.conclusion)}</span><span class="muted">${esc(b.when)}</span><a href="${esc(b.url)}" target="_blank" rel="noopener">Strona rezerwacji</a></div>`).join("")}</div>` : ""}
          ${days.length ? `<div class="kv"><div><span class="eyebrow">W planie</span><div class="also">${days.map((d) => `<a class="chip" href="#d-${d.id}" data-close>Dzień ${d.dayNumber} · ${shortDate(d.date)}</a>`).join("")}</div></div></div>` : ""}
        </div>
      </div>`;
    if (!sheet.open) { try { sheet.showModal(); } catch (e) { sheet.setAttribute("open", ""); } }
  }
  const statusLabel = (s) => ({ todo: "do zrobienia", booked: "zarezerwowane", "not-needed": "niepotrzebne" }[s] || s);

  // ---------- bookings ----------
  function renderBookings() {
    const t = S.trip, now = nowTokyo();
    const urgent = t.days.filter((d) => d.booking.level === "required");
    const rec = t.days.filter((d) => d.booking.level === "recommended");
    const firstDay = (b) => (b.dayIds || []).slice().sort()[0] || "9999";
    const list = t.bookings.slice().sort((a, b) => firstDay(a).localeCompare(firstDay(b)));
    const todo = list.filter((b) => b.status === "todo").length;
    const dayLink = (d, lvl) => { const p = dateParts(d.date); return `<a href="#d-${d.id}" class="bk-${lvl}"><span class="dd">${p.d}.${pad(p.mo)}<small>${KANJI_WD[p.wd]}</small></span><span><b>${esc(d.title)}</b><br><span class="muted">${esc(d.booking.text)}</span></span></a>`; };
    view.innerHTML = `
      <header class="pagehead"><span class="eyebrow">${todo} z ${list.length} do zrobienia</span><h1>Rezerwacje</h1></header>
      <div class="section-h"><h2 style="font-size:var(--step-2)"><span class="chip bk-required" style="vertical-align:middle"><span class="bdot"></span>${esc(legend("booking", "required").meaning)}</span></h2></div>
      <div class="urgent">${urgent.map((d) => dayLink(d, "required")).join("")}</div>
      <div class="section-h"><h2 style="font-size:var(--step-2)"><span class="chip bk-recommended" style="vertical-align:middle"><span class="bdot"></span>${esc(legend("booking", "recommended").meaning)}</span></h2></div>
      <div class="urgent">${rec.map((d) => dayLink(d, "recommended")).join("")}</div>
      <div class="section-h"><h2>Źródła i bilety</h2></div>
      <div class="bk-list">${list.map((b) => `
        <article class="bk">
          <div class="h"><b>${esc(b.name)}</b><span class="status status-${b.status}">${statusLabel(b.status)}</span></div>
          <div class="when">${icon("clock")}<span><b>${esc(b.when)}</b></span></div>
          <div>${esc(b.conclusion)} <span class="muted">(${esc(b.checked)})</span></div>
          <div class="foot">${(b.dayIds || []).map((id) => S.byId[id] ? `<a class="chip" href="#d-${id}">Dzień ${S.byId[id].dayNumber} · ${shortDate(id)}</a>` : "").join("")}
            <a class="btn" href="${esc(b.url)}" target="_blank" rel="noopener" style="margin-left:auto">${icon("link")} Strona</a></div>
        </article>`).join("")}</div>
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

  // ---------- router ----------
  function route() {
    if (sheet.open) sheet.close();
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    let tab = "plan", active = null;
    if (h.startsWith("d-") && S.byId[h.slice(2)]) {
      const d = S.byId[h.slice(2)]; active = d.id;
      tab = todayDay() && todayDay().id === d.id ? "today" : "plan";
      renderDay(d);
    } else if (h === "today") {
      tab = "today";
      const d = todayDay(), now = nowTokyo();
      const fallback = now.date < S.trip.meta.dateFrom ? S.trip.days[0] : S.trip.days[S.trip.days.length - 1];
      active = (d || fallback).id;
      renderDay(d || fallback, { fromToday: !d });
    } else if (h === "bookings") {
      tab = "bookings"; renderBookings();
    } else if (h.startsWith("food") && S.trip.food) {
      tab = "food"; renderFood();
      const sec = h.startsWith("food-") && document.getElementById(h);
      renderSide(active, tab); setTab(tab);
      if (sec) sec.scrollIntoView(); else window.scrollTo(0, 0);
      return;
    } else {
      renderOverview();
    }
    renderSide(active, tab);
    setTab(tab);
    window.scrollTo(0, 0);
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-place],[data-variant],[data-filter],[data-close],[data-sim]");
    if (!t) return;
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
    if (e.target.checked) S.done[id] = true; else delete S.done[id];
    store.set("todo", S.done);
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
  function start(trip) {
    S.trip = trip;
    trip.days.forEach((d) => { S.byId[d.id] = d; });
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
  load().then(start).catch(showLoadError);
})();
