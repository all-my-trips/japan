/* Mały, bezpieczny renderer Markdown dla zakładki „Historia Japonii”.
   Cały tekst jest najpierw escapowany (żaden HTML ze źródła nie trafia do strony),
   a potem zamieniany na znaczniki z wąskiej listy: nagłówki, akapity, **pogrubienie**,
   *kursywa*, `kod`, [link](https://…), gołe adresy URL, listy, cytaty, tabele,
   linie poziome i przypisy [^1]. Wynik: { blocks: [{type, html, text, ...}], footnotes }. */
(function (root) {
  "use strict";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => /^(https?:\/\/|#|mailto:)/i.test(u) ? u : null;

  // Usuwa polskie i japońskie znaki diakrytyczne: „Wstęp. Dlaczego…” → „wstep”
  function slugify(s) {
    return String(s).toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  // Stabilny identyfikator nagłówka: bez numeru rozdziału, do pierwszej kropki, myślnika lub nawiasu
  function headingSlug(text) {
    const t = String(text).replace(/^\d+\.\s+/, "").split(/\.\s|\s[—–]\s|\s\(/)[0];
    return slugify(t) || "sekcja";
  }

  // Tekst bez znaczników Markdown (do porównań i do wyszukiwania kotwic)
  function plain(s) {
    return String(s)
      .replace(/\[\^([^\]]+)\]/g, "")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1");
  }

  function inline(src, notes) {
    const tokens = [];
    const keep = (html) => { tokens.push(html); return `\u0000${tokens.length - 1}\u0000`; };
    let s = String(src);
    // `kod`
    s = s.replace(/`([^`]+)`/g, (_, c) => keep(`<code>${esc(c)}</code>`));
    // [tekst](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
      const url = safeUrl(u); if (!url) return m;
      return keep(`<a href="${esc(url)}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : ""}>${inline(t, notes)}</a>`);
    });
    // przypisy [^id]
    s = s.replace(/\[\^([^\]]+)\]/g, (m, id) => {
      const n = notes.order.indexOf(id) + 1 || notes.order.push(id);
      return keep(`<sup class="fn-ref" id="fnref-${esc(slugify(id))}"><a href="#fn-${esc(slugify(id))}">${n}</a></sup>`);
    });
    // gołe adresy URL; kończąca kropka, przecinek itp. nie należą do adresu
    s = s.replace(/https?:\/\/[^\s<>"]+/g, (u) => {
      const m = /^(.*?)([.,;:!?)\]]*)$/.exec(u);
      return keep(`<a href="${esc(m[1])}" target="_blank" rel="noopener">${esc(m[1])}</a>`) + m[2];
    });
    s = esc(s);
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[+i]);
  }

  const splitRow = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isSep = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);

  function parse(md) {
    const lines = String(md).replace(/\r\n?/g, "\n").split("\n");
    const notes = { order: [], defs: {} };
    // definicje przypisów zbieramy osobno
    const body = [];
    for (const l of lines) {
      const m = /^\[\^([^\]]+)\]:\s?(.*)$/.exec(l);
      if (m) notes.defs[m[1]] = m[2]; else body.push(l);
    }
    const blocks = [], slugs = {};
    let i = 0;
    while (i < body.length) {
      const line = body[i];
      if (!line.trim()) { i++; continue; }
      let m;
      if ((m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line))) {
        const level = m[1].length, text = m[2];
        let id = headingSlug(plain(text));
        if (slugs[id]) id += "-" + (++slugs[id]); else slugs[id] = 1;
        blocks.push({ type: "heading", level, id, raw: text, text: plain(text), html: inline(text, notes) });
        i++; continue;
      }
      if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) { blocks.push({ type: "hr" }); i++; continue; }
      if (/^\s*\|/.test(line) && body[i + 1] != null && isSep(body[i + 1])) {
        const head = splitRow(line); i += 2;
        const rows = [];
        while (i < body.length && /^\s*\|/.test(body[i])) { rows.push(splitRow(body[i])); i++; }
        blocks.push({ type: "table", head: head.map((c) => inline(c, notes)), headText: head.map(plain),
          rows: rows.map((r) => r.map((c) => inline(c, notes))), rowsText: rows.map((r) => r.map(plain)) });
        continue;
      }
      if (/^\s*>/.test(line)) {
        const q = [];
        while (i < body.length && /^\s*>/.test(body[i])) { q.push(body[i].replace(/^\s*>\s?/, "")); i++; }
        const inner = parse(q.join("\n"));
        blocks.push({ type: "quote", blocks: inner.blocks });
        continue;
      }
      if ((m = /^\s*(\d+)[.)]\s+/.exec(line)) || /^\s*[-*+]\s+/.test(line)) {
        const ordered = !!m, start = m ? +m[1] : 1, items = [];
        const re = ordered ? /^\s*(\d+)[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
        while (i < body.length && re.test(body[i])) {
          const mm = re.exec(body[i]);
          let t = ordered ? mm[2] : mm[1]; i++;
          while (i < body.length && body[i].trim() && /^\s{2,}\S/.test(body[i]) && !re.test(body[i])) { t += " " + body[i].trim(); i++; }
          items.push({ n: ordered ? +mm[1] : null, raw: t, text: plain(t), html: inline(t, notes) });
        }
        blocks.push({ type: "list", ordered, start, items });
        continue;
      }
      const p = [];
      while (i < body.length && body[i].trim() && !/^(#{1,6})\s/.test(body[i]) && !/^\s*\|/.test(body[i]) && !/^\s*>/.test(body[i])) { p.push(body[i].trim()); i++; }
      const raw = p.join(" ");
      blocks.push({ type: "para", raw, text: plain(raw), html: inline(raw, notes) });
    }
    const footnotes = notes.order.map((id, k) => ({ id: slugify(id), n: k + 1, html: inline(notes.defs[id] || "", notes), text: plain(notes.defs[id] || "") }));
    // przypisy zdefiniowane, ale nieużyte w tekście też pokazujemy
    Object.keys(notes.defs).filter((id) => !notes.order.includes(id)).forEach((id) => footnotes.push({ id: slugify(id), n: footnotes.length + 1, html: inline(notes.defs[id], notes), text: plain(notes.defs[id]) }));
    return { blocks, footnotes };
  }

  function blockHtml(b) {
    if (b.type === "heading") return `<h${b.level} id="historia-${esc(b.id)}">${b.html}</h${b.level}>`;
    if (b.type === "para") return `<p>${b.html}</p>`;
    if (b.type === "hr") return "<hr>";
    if (b.type === "quote") return `<blockquote>${b.blocks.map(blockHtml).join("")}</blockquote>`;
    if (b.type === "list") {
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag}${b.ordered && b.start !== 1 ? ` start="${b.start}"` : ""}>${b.items.map((x) => `<li${x.n != null ? ` value="${x.n}"` : ""}>${x.html}</li>`).join("")}</${tag}>`;
    }
    if (b.type === "table") {
      return `<div class="h-table"><table><thead><tr>${b.head.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead>
        <tbody>${b.rows.map((r) => `<tr>${r.map((c, k) => `<td data-l="${esc(b.headText[k] || "")}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    return "";
  }

  root.MD = { parse, blockHtml, slugify, headingSlug, plain, esc };
})(typeof window !== "undefined" ? window : globalThis);
