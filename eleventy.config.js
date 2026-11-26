// Eleventy konfiguracija za zoi84.ba
// Sadržaj koji uređuje klijent (Pages CMS): src/novosti, src/natjecaji, src/dokumenti, src/_data/ulaganja.json
import fs from "node:fs";
import path from "node:path";

const AR = '<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const DL = '<svg class="ar" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>';

const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pad = (n) => String(n).padStart(2, "0");
const toDate = (d) => (d instanceof Date ? d : new Date(String(d) + (String(d).length === 10 ? "T00:00:00Z" : "")));
const isoDay = (d) => { const x = toDate(d); return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`; };
const bsDate = (d) => { const x = toDate(d); return `${pad(x.getUTCDate())}.${pad(x.getUTCMonth() + 1)}.${x.getUTCFullYear()}.`; };
const newest = (arr) => [...(arr || [])].sort((a, b) => toDate(b.date) - toDate(a.date));
// tekst iz Markdowna (ili HTML-a) u paragrafe, za lightbox (razdvojeno s ||)
const paras = (item) => {
  // tekst je Markdown (ručno) ili HTML (Pages CMS rich-text): pretvori u čiste paragrafe
  const raw = String(item.rawInput ?? "").trim() || String(item.content || "");
  return raw.replace(/<\/(p|h[1-6]|li|div)>|<br\s*\/?>/gi, "\n\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").replace(/^[#>*-]+\s*/, "").replace(/\*\*|__/g, "").trim()).filter(Boolean);
};
const fileUrl = (f) => (f ? encodeURI(f.startsWith("/") || /^https?:/.test(f) ? f : "/" + f) : "#");
const extOf = (f, fallback) => (f ? path.extname(f).slice(1).toUpperCase() : "") || fallback || "PDF";
const sizeOf = (f, fallback) => {
  if (f && !/^https?:/.test(f)) {
    try { const b = fs.statSync(path.join("src", f.replace(/^\//, ""))).size; return b > 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; } catch (e) {}
  }
  return fallback || "";
};
const docAttr = (docs) => (docs || []).filter((d) => d && d.naziv).map((d) => `${d.naziv}::${fileUrl(d.fajl)}::${extOf(d.fajl, d.tip)}`).join("||");

export default function (cfg) {
  const vrste = JSON.parse(fs.readFileSync("src/_data/vrste.json", "utf8"));

  // --- novosti ---
  cfg.addFilter("newsJson", (items, n = 9) => JSON.stringify(newest(items).slice(0, n).map((i) => ({
    k: i.data.vrsta, t: (vrste.novosti[i.data.vrsta] || "").toUpperCase(), d: bsDate(i.date), h: i.data.title,
    p: paras(i).join("||"), docs: docAttr(i.data.dokumenti) }))).replace(/</g, "\\u003c"));
  cfg.addFilter("newsChips", (items) => {
    const list = items || [];
    const f = [["all", "Sve"], ["novost", "Novosti"], ["oglas", "Oglasi"], ["nabavka", "Javne nabavke"], ["akti", "Akti"]];
    return f.map(([k, l]) => {
      const c = k === "all" ? list.length : list.filter((i) => i.data.vrsta === k).length;
      return `<button class="chip${k === "all" ? " on" : ""}" type="button" data-f="${k}" aria-pressed="${k === "all"}">${l}<span>${c}</span></button>`;
    }).join("");
  });
  cfg.addFilter("newsCards", (items) => newest(items).map((i) =>
    `    <a class="nc" href="#" data-k="${esc(i.data.vrsta)}" data-p="${esc(paras(i).join("||"))}" data-docs="${esc(docAttr(i.data.dokumenti))}"><div><div class="meta"><span>${esc((vrste.novosti[i.data.vrsta] || "").toUpperCase())}</span>${bsDate(i.date)}</div><h3>${esc(i.data.title)}</h3></div><div class="bt"><span class="more">Pročitaj više ${AR}</span></div></a>\n`).join(""));

  // --- konkursi ---
  cfg.addFilter("natCards", (items) => newest(items).map((i) => {
    const d = i.data, rok = isoDay(d.rok);
    const dl = (d.dokumenti || []).filter((x) => x && x.naziv).map((x) => `<a href="${esc(fileUrl(x.fajl))}" data-dl${x.fajl ? ' target="_blank" rel="noopener"' : ""}><span>${esc(x.naziv)}</span><em>${esc(extOf(x.fajl, x.tip))}</em>${DL}</a>`).join("");
    return `    <article class="ntc" data-card data-t="${esc(d.vrsta)}" data-rok="${rok}" data-p="${esc(paras(i).join("||"))}">
      <div class="ntl">
        <div class="ntm"><span class="st"></span><span class="ty">${esc(vrste.natjecaji[d.vrsta] || "")}</span><span class="pub">Objavljeno ${bsDate(i.date)}</span></div>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.sazetak || "")}</p>
        <div class="ntdocs">${dl}</div>
      </div>
      <div class="ntr">
        <small>Rok za prijave</small>
        <b>${bsDate(rok)}</b>
        <span class="left"></span>
        <a class="btn" href="#" data-lb>Detaljnije ${AR}</a>
      </div>
    </article>\n`;
  }).join(""));

  // --- dokumenti ---
  const byCat = (items, id) => newest(items).filter((i) => i.data.kategorija === id);
  const nFiles = (list) => list.reduce((n, i) => n + Math.max(1, (i.data.fajlovi || []).filter((f) => f && f.fajl).length), 0);
  cfg.addFilter("docCount", (items) => nFiles(items || []));
  cfg.addFilter("docSide", (items, cats) => cats.map((c) => `<li><a href="#${c.id}" data-c="${c.id}">${esc(c.naziv)}<span>${nFiles(byCat(items, c.id))}</span></a></li>`).join(""));
  cfg.addFilter("docYears", (items) => [...new Set((items || []).map((i) => toDate(i.date).getUTCFullYear()))].sort((a, b) => b - a).map((y) => `<option value="${y}">${y}.</option>`).join(""));
  cfg.addFilter("docSections", (items, cats) => cats.map((c) => {
    const rows = byCat(items, c.id).flatMap((i) => {
      const d = i.data, y = toDate(i.date).getUTCFullYear();
      // jedan unos može imati jedan fajl (fajl) ili više njih (fajlovi) – svaki fajl je zaseban red
      const files = (d.fajlovi || []).filter((f) => f && f.fajl);
      const list = files.length ? files.map((f) => ({ naziv: f.naziv || (files.length > 1 ? path.basename(f.fajl).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") : d.title), fajl: f.fajl })) : [{ naziv: d.title, fajl: d.fajl, tip: d.tip, velicina: d.velicina }];
      return list.map((f) => {
        const typ = extOf(f.fajl, f.tip), size = sizeOf(f.fajl, f.velicina);
        return `<li class="doc" data-y="${y}"><a href="${esc(fileUrl(f.fajl))}" data-dl${f.fajl ? ' target="_blank" rel="noopener"' : ""}><span class="ico">${esc(typ)}</span><span class="dt"><b>${esc(f.naziv)}</b><small>${bsDate(i.date)} · ${esc(typ)}${size ? " · " + esc(size) : ""}</small></span><span class="dlb" aria-hidden="true">${DL}</span></a></li>`;
      });
    }).join("");
    return `
    <section class="dsec" id="${c.id}">
      <div class="dsh"><h2>${esc(c.naziv)}</h2><p>${esc(c.opis || "")}</p></div>
      <ul class="dlist">${rows}</ul>
    </section>`;
  }).join(""));

  // --- kapitalna ulaganja (O nama) ---
  cfg.addFilter("invItems", (items, lang = "bs") => (items || []).map((x, i) => {
    const h = (lang === "en" && x.naslov_en) || x.naslov;
    const p = (lang === "en" && x.opis_en) || x.opis || "";
    const ps = String(p).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).join("||");
    return `      <li${i >= 5 ? ' class="more-i" hidden' : ""}><a class="ki" href="#" data-p="${esc(ps)}"><div class="meta"><span>${lang === "en" ? "INVESTMENT" : "ULAGANJE"}</span>${esc(x.godina)}.</div><h3>${esc(h)}</h3>${AR}</a></li>\n`;
  }).join(""));

  // statični fajlovi
  for (const d of ["img", "js", "models", "uploads", "logo-src.svg", ".htaccess", "robots.txt"]) cfg.addPassthroughCopy("src/" + d);

  return { dir: { input: "src", output: "_site" }, templateFormats: ["njk", "md"], markdownTemplateEngine: false };
}
