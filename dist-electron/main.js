import { app as O, ipcMain as h, dialog as P, BrowserWindow as dt } from "electron";
import { fileURLToPath as Et } from "node:url";
import v from "node:path";
import I from "node:fs";
import y from "node:crypto";
import { execSync as xt } from "node:child_process";
const G = v.join(O.getPath("userData"), "data"), W = v.join(G, "torneios"), j = v.join(G, "torneio-ativo.json");
function L() {
  I.existsSync(G) || I.mkdirSync(G, { recursive: !0 }), I.existsSync(W) || I.mkdirSync(W, { recursive: !0 });
}
function U(t) {
  return v.join(W, `${t}.json`);
}
function A() {
  if (!I.existsSync(j)) return null;
  try {
    const { id: t } = JSON.parse(I.readFileSync(j, "utf-8"));
    return t;
  } catch {
    return null;
  }
}
function k(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (const s of t) e.set(s.id, s);
  const o = /* @__PURE__ */ new Map();
  for (const s of n) o.set(s.id, s);
  const r = [];
  let a = 0, i = 0, l = 0;
  for (const s of o.values()) {
    const c = e.get(s.id);
    c ? s.updatedAt > c.updatedAt ? (r.push(s), i += 1, c.deletedAt == null && s.deletedAt != null && (l += 1)) : r.push(c) : (r.push(s), a += 1);
  }
  let d = 0;
  for (const [s, c] of e)
    o.has(s) || (r.push(c), d += 1);
  return { merged: r, counters: { created: a, updated: i, kept: d, removed: l } };
}
function H(t) {
  const n = /* @__PURE__ */ new Set(), e = [];
  for (const o of t)
    n.has(o.id) || (n.add(o.id), e.push(o));
  return e;
}
function ot(t) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...t,
    id: t.id || y.randomUUID(),
    createdAt: t.createdAt || n,
    updatedAt: t.updatedAt || n,
    nome: (t.nome || "").trim().toLowerCase(),
    equipe: (t.equipe || "").trim().toLowerCase(),
    deletedAt: t.deletedAt ?? null
  };
}
function rt(t) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...t,
    id: t.id || y.randomUUID(),
    createdAt: t.createdAt || n,
    updatedAt: t.updatedAt || n,
    nome: (t.nome || "").trim().toLowerCase(),
    equipe: (t.equipe || "").trim().toLowerCase(),
    chaveIds: t.chaveIds ?? [],
    deletedAt: t.deletedAt ?? null
  };
}
function at(t) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...t,
    id: t.id || y.randomUUID(),
    createdAt: t.createdAt || n,
    updatedAt: t.updatedAt || n,
    nome: (t.nome || "").trim(),
    arbitroIds: Array.isArray(t.arbitroIds) ? t.arbitroIds.filter(Boolean) : [],
    deletedAt: t.deletedAt ?? null
  };
}
function Nt() {
  h.handle("create-tournament", (t, n) => {
    L();
    const e = {
      id: y.randomUUID(),
      nome: n.nome,
      data: n.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      atletas: []
    };
    return I.writeFileSync(U(e.id), JSON.stringify(e, null, 2), "utf-8"), e;
  }), h.handle("list-tournaments", () => (L(), I.readdirSync(W).filter((n) => n.endsWith(".json")).map((n) => {
    const e = I.readFileSync(v.join(W, n), "utf-8");
    return JSON.parse(e);
  }))), h.handle("start-tournament", (t, n) => {
    L(), I.writeFileSync(j, JSON.stringify({ id: n.id, mode: n.mode }), "utf-8");
    const e = U(n.id);
    if (I.existsSync(e)) {
      const o = JSON.parse(I.readFileSync(e, "utf-8"));
      return o.startedAt = (/* @__PURE__ */ new Date()).toISOString(), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), I.writeFileSync(e, JSON.stringify(o, null, 2), "utf-8"), o;
    }
    throw new Error("Torneio não encontrado");
  }), h.handle("get-tournament-mode", () => {
    if (L(), !I.existsSync(j)) return null;
    try {
      return JSON.parse(I.readFileSync(j, "utf-8")).mode ?? "admin";
    } catch {
      return null;
    }
  }), h.handle("get-active-tournament", () => {
    L();
    const t = A();
    if (!t) return null;
    const n = U(t);
    return I.existsSync(n) ? JSON.parse(I.readFileSync(n, "utf-8")) : null;
  }), h.handle("export-tournament", async (t, n) => {
    L();
    const e = U(n);
    if (!I.existsSync(e)) throw new Error("Torneio não encontrado");
    const o = JSON.parse(I.readFileSync(e, "utf-8")), r = o.nome || `Torneio ${o.data}`, a = await P.showSaveDialog({
      title: "Exportar Torneio",
      defaultPath: `${r.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    !a.canceled && a.filePath && I.copyFileSync(e, a.filePath);
  }), h.handle(
    "import-tournament",
    (t, n) => {
      if (L(), !n.id || !n.data)
        throw new Error("Estrutura inválida");
      const e = U(n.id), o = (/* @__PURE__ */ new Date()).toISOString(), r = I.existsSync(e) ? JSON.parse(I.readFileSync(e, "utf-8")) : null;
      if (!r) {
        const $ = {
          ...n,
          createdAt: n.createdAt || o,
          updatedAt: n.updatedAt || o,
          atletas: H((n.atletas ?? []).map((z) => ot(z))),
          arbitros: H((n.arbitros ?? []).map((z) => rt(z))),
          areas: H((n.areas ?? []).map((z) => at(z))),
          chaves: H(n.chaves ?? []),
          lutasCasadas: H(n.lutasCasadas ?? [])
        };
        return I.writeFileSync(e, JSON.stringify($, null, 2), "utf-8"), { success: !0, merged: !1, created: 0, updated: 0, kept: 0, removed: 0 };
      }
      const a = (n.atletas ?? []).map(($) => ot($)), i = (n.arbitros ?? []).map(($) => rt($)), l = (n.areas ?? []).map(($) => at($)), d = n.chaves ?? [], s = n.lutasCasadas ?? [], c = n.updatedAt > r.updatedAt, m = k(r.atletas ?? [], a), w = k(r.arbitros ?? [], i), p = k(r.areas ?? [], l), g = k(r.chaves ?? [], d), S = k(r.lutasCasadas ?? [], s), b = {
        created: m.counters.created + w.counters.created + p.counters.created + g.counters.created + S.counters.created,
        updated: m.counters.updated + w.counters.updated + p.counters.updated + g.counters.updated + S.counters.updated,
        kept: m.counters.kept + w.counters.kept + p.counters.kept + g.counters.kept + S.counters.kept,
        removed: m.counters.removed + w.counters.removed + p.counters.removed + g.counters.removed + S.counters.removed
      }, D = {
        id: r.id,
        nome: c ? n.nome : r.nome,
        data: c ? n.data : r.data,
        createdAt: r.createdAt,
        updatedAt: n.updatedAt > r.updatedAt ? n.updatedAt : r.updatedAt,
        startedAt: r.startedAt ?? n.startedAt,
        atletas: m.merged,
        arbitros: w.merged,
        areas: p.merged,
        chaves: g.merged,
        lutasCasadas: S.merged
      };
      return I.writeFileSync(e, JSON.stringify(D, null, 2), "utf-8"), { success: !0, merged: !0, ...b };
    }
  ), h.handle("update-tournament", (t, n) => {
    L();
    const e = U(n.id);
    if (!I.existsSync(e)) throw new Error("Torneio não encontrado");
    const o = {
      ...n,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return I.writeFileSync(e, JSON.stringify(o, null, 2), "utf-8"), o;
  }), h.handle("delete-tournament", (t, n) => {
    L();
    const e = U(n);
    if (!I.existsSync(e)) throw new Error("Torneio não encontrado");
    if (I.unlinkSync(e), I.existsSync(j))
      try {
        const { id: o } = JSON.parse(I.readFileSync(j, "utf-8"));
        o === n && I.unlinkSync(j);
      } catch {
      }
  }), h.handle("read-file", async (t, n) => I.readFileSync(n, "utf-8"));
}
const Bt = [
  { peso: "galo", nome: "Galo", masculino: 57.5, feminino: 48.5 },
  { peso: "pluma", nome: "Pluma", masculino: 64, feminino: 53.5 },
  { peso: "pena", nome: "Pena", masculino: 70, feminino: 58.5 },
  { peso: "leve", nome: "Leve", masculino: 76, feminino: 64 },
  { peso: "medio", nome: "Médio", masculino: 82.3, feminino: 69 },
  { peso: "meio-pesado", nome: "Meio-Pesado", masculino: 88.3, feminino: 74 },
  { peso: "pesado", nome: "Pesado", masculino: 94.3, feminino: 79.3 },
  { peso: "super-pesado", nome: "Super Pesado", masculino: 97.5, feminino: null },
  { peso: "pesadissimo", nome: "Pesadíssimo", masculino: null, feminino: null }
], Lt = {
  "pre-mirim": "Pré-Mirim",
  mirim: "Mirim",
  "infantil-a": "Infantil A",
  "infantil-b": "Infantil B",
  "infanto-juvenil-a": "Infanto-Juvenil A",
  "infanto-juvenil-b": "Infanto-Juvenil B"
}, _t = {
  "pre-mirim": { galo: 14.7, pluma: 17.9, pena: 20, leve: 24, medio: 26, "meio-pesado": 29, pesado: 31.2, "super-pesado": 33.2, pesadissimo: null },
  mirim: { galo: 21, pluma: 24, pena: 27, leve: 30.2, medio: 33.2, "meio-pesado": 36.2, pesado: 39.3, "super-pesado": 42.3, pesadissimo: null },
  "infantil-a": { galo: 27, pluma: 30.2, pena: 33.2, leve: 36.2, medio: 39.3, "meio-pesado": 42.3, pesado: 45.3, "super-pesado": 48.3, pesadissimo: null },
  "infantil-b": { galo: 36.2, pluma: 40.3, pena: 44.3, leve: 48.3, medio: 52.5, "meio-pesado": 56.5, pesado: 60.5, "super-pesado": 65, pesadissimo: null },
  "infanto-juvenil-a": { galo: 40.3, pluma: 44.3, pena: 48.3, leve: 52.5, medio: 56.5, "meio-pesado": 60.5, pesado: 65, "super-pesado": 69.5, pesadissimo: null },
  "infanto-juvenil-b": { galo: 48.3, pluma: 52.5, pena: 56.5, leve: 60.5, medio: 65, "meio-pesado": 69.5, pesado: 74, "super-pesado": 78.5, pesadissimo: null }
};
function Pt(t, n, e) {
  const o = _t[t];
  if (o)
    return o[e.peso] ?? null;
  const r = n === "masculino" ? e.masculino : e.feminino;
  return e.peso === "pesadissimo" && n === "feminino" ? null : r;
}
function Tt() {
  const t = [
    "pre-mirim",
    "mirim",
    "infantil-a",
    "infantil-b",
    "infanto-juvenil-a",
    "infanto-juvenil-b",
    "juvenil",
    "adulto",
    "master1",
    "master2",
    "master3",
    "master4",
    "master5",
    "master6",
    "master7"
  ], n = ["masculino", "feminino"], e = [];
  for (const o of t) {
    const r = Lt[o] || o.charAt(0).toUpperCase() + o.slice(1);
    for (const a of n) {
      const i = a === "masculino" ? "Masculino" : "Feminino";
      for (const l of Bt) {
        const d = Pt(o, a, l);
        d !== void 0 && e.push({
          id: `${o}-${a}-${l.peso}`,
          nome: `${r} ${i} ${l.nome}`,
          faixaEtaria: o,
          genero: a,
          peso: l.peso,
          pesoMaximoKg: d
        });
      }
    }
  }
  return e;
}
const st = Tt(), Ft = {};
for (const t of st)
  Ft[t.id] = t.nome;
const Ct = v.join(O.getPath("userData"), "data"), jt = v.join(Ct, "torneios");
function lt(t) {
  return v.join(jt, `${t}.json`);
}
function N(t) {
  const n = lt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function T(t) {
  I.writeFileSync(lt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function ct(t) {
  const n = N(t), e = n.atletas ?? [];
  let o = !1;
  for (const r of e)
    r.id || (r.id = y.randomUUID(), o = !0), r.createdAt || (r.createdAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.updatedAt || (r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.deletedAt === void 0 && (r.deletedAt = null, o = !0);
  return o && (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n)), e.filter((r) => r.deletedAt == null);
}
function Rt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    ...n,
    id: n.id || y.randomUUID(),
    createdAt: n.createdAt || r,
    updatedAt: r,
    deletedAt: null
  };
  return o.push(a), e.atletas = o, e.updatedAt = r, T(e), o.filter((i) => i.deletedAt == null);
}
function Mt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = o.findIndex((i) => i.id === n.id);
  if (r === -1) throw new Error("Atleta não encontrado");
  const a = o[r];
  return o[r] = {
    ...n,
    createdAt: a.createdAt,
    deletedAt: a.deletedAt ?? null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, e.atletas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(e), o.filter((i) => i.deletedAt == null);
}
function Jt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Atleta não encontrado");
  return o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  }, e.atletas = o, e.updatedAt = r, T(e), o.filter((i) => i.deletedAt == null);
}
function $t(t, n) {
  const e = N(t), o = new Set(n), r = e.atletas ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < r.length; i += 1)
    o.has(r[i].id) && (r[i] = {
      ...r[i],
      deletedAt: a,
      updatedAt: a
    });
  return e.atletas = r, e.updatedAt = a, T(e), r.filter((i) => i.deletedAt == null);
}
function Ut(t, n) {
  const e = N(t), o = e.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Atleta não encontrado");
  return o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, e.atletas = o, e.updatedAt = r, T(e), o.filter((i) => i.deletedAt == null);
}
function qt(t) {
  return (N(t).atletas ?? []).filter((o) => o.deletedAt != null);
}
function zt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Atleta não encontrado");
  return o.splice(r, 1), e.atletas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(e), o.filter((a) => a.deletedAt == null);
}
function kt(t, n) {
  const e = N(t), o = new Set(n), r = e.atletas ?? [];
  return e.atletas = r.filter((a) => !o.has(a.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(e), e.atletas.filter((a) => a.deletedAt == null);
}
function Ht(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de atletas.");
  const r = new Set(st.map((s) => s.id));
  for (const s of o) {
    if (!s.nome || !s.equipe || !s.faixa || !s.anoNascimento || !s.pesoKg || !s.genero || !s.categoria)
      throw new Error(`Atleta inválido no arquivo: "${s.nome || "sem nome"}" — campos obrigatórios ausentes (categoria, genero).`);
    if (!r.has(s.categoria))
      throw new Error(`Atleta inválido no arquivo: "${s.nome}" — categoria "${s.categoria}" não reconhecida.`);
  }
  const a = N(t), i = a.atletas ?? [];
  let l = 0, d = 0;
  for (const s of o) {
    const c = s.nome.trim().toLowerCase(), m = s.equipe.trim().toLowerCase();
    i.some(
      (p) => s.id && p.id === s.id || p.nome.trim().toLowerCase() === c && p.anoNascimento === s.anoNascimento
    ) ? d++ : (s.nome = c, s.equipe = m, i.push({
      ...s,
      id: s.id || y.randomUUID(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      deletedAt: null
    }), l++);
  }
  return a.atletas = i, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(a), { imported: l, skipped: d };
}
async function Wt() {
  const t = await P.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
async function Vt(t) {
  const n = ct(t), e = await P.showSaveDialog({
    title: "Exportar Atletas",
    defaultPath: "atletas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !e.canceled && e.filePath && I.writeFileSync(e.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const Gt = v.join(O.getPath("userData"), "data"), Kt = v.join(Gt, "torneios");
function ut(t) {
  return v.join(Kt, `${t}.json`);
}
function B(t) {
  const n = ut(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function F(t) {
  I.writeFileSync(ut(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function ft(t) {
  const n = B(t), e = n.arbitros ?? [];
  let o = !1;
  for (const r of e)
    r.deletedAt === void 0 && (r.deletedAt = null, o = !0);
  return o && (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(n)), e.filter((r) => r.deletedAt == null);
}
function Yt(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    id: y.randomUUID(),
    nome: n.nome.trim().toLowerCase(),
    equipe: (n.equipe ?? "").trim().toLowerCase(),
    faixa: n.faixa,
    chaveIds: n.chaveIds ?? [],
    createdAt: r,
    updatedAt: r,
    deletedAt: null
  };
  return o.push(a), e.arbitros = o, e.updatedAt = r, F(e), a;
}
function Qt(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = o.findIndex((l) => l.id === n.id);
  if (r === -1) throw new Error("Árbitro não encontrado");
  const a = o[r], i = (/* @__PURE__ */ new Date()).toISOString();
  return o[r] = {
    ...n,
    nome: n.nome.trim().toLowerCase(),
    createdAt: a.createdAt,
    deletedAt: a.deletedAt ?? null,
    updatedAt: i
  }, e.arbitros = o, e.updatedAt = i, F(e), o[r];
}
function Xt(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((d) => d.id === n);
  if (a === -1) throw new Error("Árbitro não encontrado");
  o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  };
  const l = e.chaves;
  if (l)
    for (const d of l)
      d.arbitroId === n && (d.arbitroId = null);
  e.arbitros = o, e.updatedAt = r, F(e);
}
function Zt(t, n) {
  const e = B(t), o = new Set(n), r = e.arbitros ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let d = 0; d < r.length; d += 1)
    o.has(r[d].id) && (r[d] = {
      ...r[d],
      deletedAt: a,
      updatedAt: a
    });
  const l = e.chaves;
  if (l)
    for (const d of l)
      d.arbitroId && o.has(d.arbitroId) && (d.arbitroId = null);
  e.arbitros = r, e.updatedAt = a, F(e);
}
function te(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Árbitro não encontrado");
  o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, e.arbitros = o, e.updatedAt = r, F(e);
}
function ee(t) {
  return (B(t).arbitros ?? []).filter((o) => o.deletedAt != null);
}
function ne(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Árbitro não encontrado");
  o.splice(r, 1), e.arbitros = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(e);
}
function oe(t, n) {
  const e = B(t), o = new Set(n), r = e.arbitros ?? [];
  e.arbitros = r.filter((a) => !o.has(a.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(e);
}
async function re() {
  const t = await P.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
function ae(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de árbitros.");
  const r = /* @__PURE__ */ new Set(["roxa", "marrom", "preta"]);
  for (const s of o) {
    const c = s;
    if (!c.nome || typeof c.nome != "string" || c.nome.trim().length < 2)
      throw new Error(`Árbitro inválido no arquivo: "${c.nome || "sem nome"}" — nome deve ter ao menos 2 caracteres.`);
    if (!c.faixa || typeof c.faixa != "string" || !r.has(c.faixa))
      throw new Error(`Árbitro inválido no arquivo: "${c.nome}" — faixa inválida.`);
    if (c.equipe !== void 0 && (typeof c.equipe != "string" || c.equipe.trim().length < 2))
      throw new Error(`Árbitro inválido no arquivo: "${c.nome}" — equipe deve ter ao menos 2 caracteres se informada.`);
  }
  const a = B(t), i = a.arbitros ?? [];
  let l = 0, d = 0;
  for (const s of o) {
    const c = s, m = c.nome.trim().toLowerCase();
    i.some((p) => p.nome.trim().toLowerCase() === m) ? d++ : (i.push({
      ...c,
      id: c.id || y.randomUUID(),
      nome: m,
      equipe: c.equipe && typeof c.equipe == "string" ? c.equipe.trim().toLowerCase() : "",
      faixa: c.faixa,
      chaveIds: c.chaveIds ?? [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      deletedAt: null
    }), l++);
  }
  return a.arbitros = i, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(a), { imported: l, skipped: d };
}
async function ie(t) {
  const n = ft(t), e = await P.showSaveDialog({
    title: "Exportar Árbitros",
    defaultPath: "arbitros.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !e.canceled && e.filePath && I.writeFileSync(e.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const de = v.join(O.getPath("userData"), "data"), se = v.join(de, "torneios");
function mt(t) {
  return v.join(se, `${t}.json`);
}
function E(t) {
  const n = mt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function R(t) {
  I.writeFileSync(mt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function Z(t) {
  const n = /* @__PURE__ */ new Set();
  for (const o of t) {
    const r = o.nome.match(/^Área (\d+)$/i);
    r && n.add(Number(r[1]));
  }
  let e = 1;
  for (; n.has(e); ) e += 1;
  return `Área ${e}`;
}
function V(t) {
  return {
    id: t.id,
    nome: t.nome ?? "",
    arbitroIds: Array.isArray(t.arbitroIds) ? t.arbitroIds.filter(Boolean) : t.arbitroId ? [t.arbitroId] : [],
    createdAt: t.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: t.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    deletedAt: t.deletedAt ?? null
  };
}
function K(t) {
  return (E(t).areas ?? []).map((o) => V(o)).filter((o) => o.deletedAt == null);
}
function tt(t, n, e) {
  const o = n ?? [];
  if (o.length === 0) return;
  const a = (E(t).arbitros ?? []).filter((m) => m.deletedAt == null), i = new Set(a.map((m) => m.id));
  if (o.filter((m) => m && !i.has(m)).length > 0)
    throw new Error("Um ou mais árbitros não existem ou estão deletados.");
  const d = K(t), s = /* @__PURE__ */ new Set();
  for (const m of d)
    if (m.id !== e)
      for (const w of m.arbitroIds)
        s.add(w);
  if (o.filter((m) => m && s.has(m)).length > 0)
    throw new Error("Um ou mais árbitros já estão atribuídos a outra área de luta.");
}
function le(t, n) {
  const e = n.arbitroIds ?? [];
  tt(t, e);
  const o = E(t), r = (o.areas ?? []).map((s) => V(s)), a = r.filter((s) => s.deletedAt == null), i = (/* @__PURE__ */ new Date()).toISOString(), l = n.nome.trim() === "" ? Z(a) : n.nome.trim(), d = {
    id: y.randomUUID(),
    nome: l,
    arbitroIds: e.filter(Boolean),
    createdAt: i,
    updatedAt: i,
    deletedAt: null
  };
  return r.push(d), o.areas = r, o.updatedAt = i, R(o), d;
}
function ce(t, n) {
  const e = n.arbitroIds ?? [];
  tt(t, e, n.id);
  const o = E(t), r = (o.areas ?? []).map((c) => V(c)), a = r.findIndex((c) => c.id === n.id);
  if (a === -1) throw new Error("Área de luta não encontrada");
  const i = r[a], l = (/* @__PURE__ */ new Date()).toISOString(), d = r.filter((c) => c.deletedAt == null && c.id !== n.id), s = n.nome.trim() === "" ? Z(d) : n.nome.trim();
  return r[a] = {
    ...n,
    nome: s,
    arbitroIds: e.filter(Boolean),
    createdAt: i.createdAt,
    deletedAt: i.deletedAt ?? null,
    updatedAt: l
  }, o.areas = r, o.updatedAt = l, R(o), r[a];
}
function ue(t, n) {
  const e = E(t), o = e.areas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Área de luta não encontrada");
  o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  }, e.areas = o, e.updatedAt = r, R(e);
}
function fe(t, n) {
  const e = E(t), o = new Set(n), r = e.areas ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < r.length; i += 1)
    o.has(r[i].id) && (r[i] = {
      ...r[i],
      deletedAt: a,
      updatedAt: a
    });
  e.areas = r, e.updatedAt = a, R(e);
}
function me(t, n) {
  const e = E(t), o = e.areas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Área de luta não encontrada");
  o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, e.areas = o, e.updatedAt = r, R(e);
}
function he(t) {
  return (E(t).areas ?? []).map((o) => V(o)).filter((o) => o.deletedAt != null);
}
function Ie(t, n) {
  const e = E(t), o = e.areas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Área de luta não encontrada");
  o.splice(r, 1), e.areas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), R(e);
}
function Ae(t, n) {
  const e = E(t), o = new Set(n), r = e.areas ?? [];
  e.areas = r.filter((a) => !o.has(a.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), R(e);
}
function we(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de áreas de luta.");
  const r = E(t), a = (r.areas ?? []).map((c) => V(c)), i = a.filter((c) => c.deletedAt == null), l = (/* @__PURE__ */ new Date()).toISOString();
  let d = 0, s = 0;
  for (const c of o) {
    if (!c || typeof c != "object")
      throw new Error("Área inválida no arquivo: formato incorreto.");
    const m = c;
    if (m.arbitroIds !== void 0 && !Array.isArray(m.arbitroIds))
      throw new Error(`Área inválida no arquivo: "${String(m.nome ?? "sem nome")}" — arbitroIds deve ser um array.`);
    const w = typeof m.nome == "string" ? m.nome.trim() : "", p = Array.isArray(m.arbitroIds) ? m.arbitroIds.filter((D) => typeof D == "string" && D.length > 0) : [];
    if (i.some(
      (D) => D.nome.trim().toLowerCase() === w.toLowerCase() && w !== ""
    )) {
      s += 1;
      continue;
    }
    tt(t, p);
    const S = w === "" ? Z(i) : w, b = {
      id: y.randomUUID(),
      nome: S,
      arbitroIds: p,
      createdAt: l,
      updatedAt: l,
      deletedAt: null
    };
    a.push(b), i.push(b), d += 1;
  }
  return r.areas = a, r.updatedAt = l, R(r), { imported: d, skipped: s };
}
async function pe() {
  const t = await P.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
async function ve(t) {
  const n = K(t), e = await P.showSaveDialog({
    title: "Exportar Áreas de Luta",
    defaultPath: "areas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !e.canceled && e.filePath && I.writeFileSync(e.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const ge = v.join(O.getPath("userData"), "data"), Se = v.join(ge, "torneios");
function ht(t) {
  return v.join(Se, `${t}.json`);
}
function x(t) {
  const n = ht(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function q(t) {
  I.writeFileSync(ht(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function It(t) {
  return [...t].sort((n, e) => {
    if (n.pesoKg !== e.pesoKg) return e.pesoKg - n.pesoKg;
    const o = (/* @__PURE__ */ new Date()).getFullYear() - n.anoNascimento, r = (/* @__PURE__ */ new Date()).getFullYear() - e.anoNascimento;
    return o !== r ? r - o : n.nome.localeCompare(e.nome);
  });
}
function be(t) {
  const n = It(t), e = n.length;
  if (e <= 2) return n;
  const o = Math.ceil(e / 2), r = Array.from({ length: o }, (i, l) => l), a = Array.from({ length: e - o }, (i, l) => l + o);
  for (const i of [r, a]) {
    const l = /* @__PURE__ */ new Set();
    for (const d of i) {
      const s = n[d].equipe;
      if (s) {
        if (l.has(s)) {
          const c = i === r ? a : r;
          for (const m of c) {
            const w = n[m].equipe;
            if (w !== s && !l.has(w)) {
              [n[d], n[m]] = [n[m], n[d]];
              break;
            }
          }
        }
        l.add(n[d].equipe);
      }
    }
  }
  return n;
}
function At(t) {
  const n = It(t), e = n.slice(0, 8), o = n.slice(8, 16);
  for (const r of [e, o]) {
    const a = /* @__PURE__ */ new Map();
    r.forEach((i, l) => {
      if (i.equipe) {
        const d = a.get(i.equipe) ?? [];
        d.push(l), a.set(i.equipe, d);
      }
    });
    for (const [i, l] of a) {
      if (l.length < 2) continue;
      const d = r === e ? o : e;
      for (let s = 1; s < l.length; s++) {
        const c = d.findIndex((m) => m.equipe !== i);
        c >= 0 && ([r[l[s]], d[c]] = [d[c], r[l[s]]]);
      }
    }
  }
  return [...e, ...o];
}
const f = "tbd";
function u(t, n, e, o) {
  return { id: y.randomUUID(), ordem: t, rodada: n, atletaAId: e, atletaBId: o, status: "pending", vencedorId: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function ye(t) {
  return [u(1, 1, t[0].id, t[1].id)];
}
function De(t) {
  return [
    u(1, 1, t[0].id, t[1].id),
    u(2, 2, f, t[2].id),
    u(3, 3, f, f)
  ];
}
function Oe(t) {
  return [
    u(1, 1, t[0].id, t[3].id),
    u(2, 1, t[1].id, t[2].id),
    u(3, 2, f, f)
  ];
}
function Ee(t) {
  const n = u(3, 1, t[4].id, f);
  return n.vencedorId = t[4].id, n.status = "wo", [
    u(1, 1, t[0].id, t[1].id),
    u(2, 1, t[2].id, t[3].id),
    n,
    u(4, 2, f, t[4].id),
    u(5, 2, f, f),
    u(6, 3, f, f)
  ];
}
function xe(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, f);
  r.vencedorId = t[2].id, r.status = "wo";
  const a = u(e++, 1, t[3].id, t[4].id), i = u(e++, 1, t[5].id, f);
  i.vencedorId = t[5].id, i.status = "wo";
  const l = u(e++, 1, t[6].id, t[7].id), d = u(e++, 1, t[8].id, f);
  d.vencedorId = t[8].id, d.status = "wo", n.push(o, r, a, i, l, d);
  const s = u(e++, 2, f, t[2].id), c = u(e++, 2, f, t[5].id), m = u(e++, 2, f, t[8].id);
  n.push(s, c, m);
  const w = u(e++, 3, f, f), p = u(e++, 3, f, f);
  n.push(w, p);
  const g = u(e++, 4, f, f);
  return n.push(g), n;
}
function Ne(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, f);
  i.vencedorId = t[6].id, i.status = "wo";
  const l = u(e++, 1, t[7].id, f);
  l.vencedorId = t[7].id, l.status = "wo";
  const d = u(e++, 1, t[8].id, f);
  d.vencedorId = t[8].id, d.status = "wo";
  const s = u(e++, 1, t[9].id, f);
  s.vencedorId = t[9].id, s.status = "wo";
  const c = u(e++, 1, t[10].id, f);
  c.vencedorId = t[10].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const m = u(e++, 2, f, f), w = u(e++, 2, f, t[6].id), p = u(e++, 2, t[7].id, t[8].id), g = u(e++, 2, t[9].id, t[10].id);
  n.push(m, w, p, g);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const D = u(e++, 4, f, f);
  return n.push(D), n;
}
function Be(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, f);
  l.vencedorId = t[8].id, l.status = "wo";
  const d = u(e++, 1, t[9].id, f);
  d.vencedorId = t[9].id, d.status = "wo";
  const s = u(e++, 1, t[10].id, f);
  s.vencedorId = t[10].id, s.status = "wo";
  const c = u(e++, 1, t[11].id, f);
  c.vencedorId = t[11].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const m = u(e++, 2, f, f), w = u(e++, 2, f, f), p = u(e++, 2, t[8].id, t[9].id), g = u(e++, 2, t[10].id, t[11].id);
  n.push(m, w, p, g);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const D = u(e++, 4, f, f);
  return n.push(D), n;
}
function Le(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, t[9].id), d = u(e++, 1, t[10].id, f);
  d.vencedorId = t[10].id, d.status = "wo";
  const s = u(e++, 1, t[11].id, f);
  s.vencedorId = t[11].id, s.status = "wo";
  const c = u(e++, 1, t[12].id, f);
  c.vencedorId = t[12].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const m = u(e++, 2, f, f), w = u(e++, 2, f, f), p = u(e++, 2, f, t[10].id), g = u(e++, 2, t[11].id, t[12].id);
  n.push(m, w, p, g);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const D = u(e++, 4, f, f);
  return n.push(D), n;
}
function _e(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, t[9].id), d = u(e++, 1, t[10].id, t[11].id), s = u(e++, 1, t[12].id, f);
  s.vencedorId = t[12].id, s.status = "wo";
  const c = u(e++, 1, t[13].id, f);
  c.vencedorId = t[13].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const m = u(e++, 2, f, f), w = u(e++, 2, f, f), p = u(e++, 2, f, f), g = u(e++, 2, t[12].id, t[13].id);
  n.push(m, w, p, g);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const D = u(e++, 4, f, f);
  return n.push(D), n;
}
function Pe(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, t[9].id), d = u(e++, 1, t[10].id, t[11].id), s = u(e++, 1, t[12].id, t[13].id), c = u(e++, 1, t[14].id, f);
  c.vencedorId = t[14].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const m = u(e++, 2, f, f), w = u(e++, 2, f, f), p = u(e++, 2, f, f), g = u(e++, 2, f, t[14].id);
  n.push(m, w, p, g);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const D = u(e++, 4, f, f);
  return n.push(D), n;
}
function Te(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, f);
  l.vencedorId = t[8].id, l.status = "wo";
  const d = u(e++, 1, t[9].id, f);
  d.vencedorId = t[9].id, d.status = "wo", n.push(o, r, a, i, l, d);
  const s = u(e++, 2, f, f), c = u(e++, 2, f, f), m = u(e++, 2, f, f), w = u(e++, 2, t[8].id, t[9].id);
  n.push(s, c, m, w);
  const p = u(e++, 3, f, f), g = u(e++, 3, f, f);
  n.push(p, g);
  const S = u(e++, 4, f, f);
  return n.push(S), n;
}
function Fe(t) {
  const n = u(2, 1, t[2].id, f);
  n.vencedorId = t[2].id, n.status = "wo";
  const e = u(4, 1, t[5].id, f);
  e.vencedorId = t[5].id, e.status = "wo";
  const o = u(5, 2, t[2].id, f), r = u(6, 2, t[5].id, f);
  return [
    u(1, 1, t[0].id, t[1].id),
    n,
    u(3, 1, t[3].id, t[4].id),
    e,
    o,
    r,
    u(7, 3, f, f)
  ];
}
function Ce(t) {
  return t <= 2 ? 1 : t === 3 ? 3 : t <= 4 ? 2 : Math.ceil(Math.log2(t));
}
function je(t) {
  const n = t.length, e = Math.ceil(Math.log2(n)), o = [];
  let r = 1;
  const a = [];
  for (let d = 0; d < n; d += 2)
    if (d + 1 < n) {
      const s = u(r++, 1, t[d].id, t[d + 1].id);
      o.push(s), a.push(s.id);
    } else {
      const s = u(r++, 1, t[d].id, f);
      s.vencedorId = t[d].id, s.status = "wo", o.push(s), a.push(t[d].id);
    }
  let i = a, l = 2;
  for (; l <= e; ) {
    const d = [];
    for (let s = 0; s < i.length; s += 2)
      if (s + 1 < i.length) {
        const c = u(r++, l, f, f);
        o.push(c), d.push(c.id);
      } else
        d.push(i[s]);
    i = d, l++;
  }
  for (let d = 1; d < e; d++) {
    const s = o.filter((w) => w.rodada === d), c = o.filter((w) => w.rodada === d + 1);
    if (c.length === 0) continue;
    const m = s.length / c.length;
    if (Number.isInteger(m))
      for (let w = 0; w < s.length; w++) {
        const p = s[w];
        if (p.status !== "wo" || !p.vencedorId) continue;
        const g = Math.floor(w / m), S = w % m;
        if (g >= c.length) continue;
        const b = c[g];
        S === 0 && (b.atletaAId === "tbd" || b.atletaAId === "") ? b.atletaAId = p.vencedorId : S === 1 && (b.atletaBId === "tbd" || b.atletaBId === "") && (b.atletaBId = p.vencedorId);
      }
  }
  return o;
}
function Re(t) {
  const n = [];
  let e = 1;
  for (let o = 0; o < 8; o++)
    n.push(u(e++, 1, t[o * 2].id, t[o * 2 + 1].id));
  for (let o = 0; o < 4; o++)
    n.push(u(e++, 2, f, f));
  for (let o = 0; o < 2; o++)
    n.push(u(e++, 3, f, f));
  return n.push(u(e++, 4, f, f)), n;
}
function wt(t) {
  switch (t.length) {
    case 2:
      return ye(t);
    case 3:
      return De(t);
    case 4:
      return Oe(t);
    case 5:
      return Ee(t);
    case 6:
      return Fe(t);
    case 9:
      return xe(t);
    case 10:
      return Te(t);
    case 11:
      return Ne(t);
    case 12:
      return Be(t);
    case 13:
      return Le(t);
    case 14:
      return _e(t);
    case 15:
      return Pe(t);
    case 16:
      return Re(t);
    default:
      if (t.length >= 7 && t.length <= 15) return je(t);
      throw new Error("Número inválido de atletas");
  }
}
const it = {
  branca: 0,
  cinza: 1,
  amarela: 2,
  laranja: 3,
  verde: 4,
  azul: 5,
  roxa: 6,
  marrom: 7,
  preta: 8
};
function Me(t) {
  const n = [...t];
  for (let e = n.length - 1; e > 0; e--) {
    const o = Math.floor(Math.random() * (e + 1));
    [n[e], n[o]] = [n[o], n[e]];
  }
  return n;
}
function pt(t, n) {
  if (n.length < 2 || n.length > 16)
    throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
  const e = Me(n), o = e.length === 16 ? At(e) : be(e), r = wt(o);
  return {
    id: y.randomUUID(),
    categoriaId: t,
    lutas: r,
    posicoesAtletas: o.map((a) => a.id),
    arbitroId: null,
    totalAtletas: o.length,
    totalLutas: r.length,
    totalRodadas: Ce(o.length),
    status: "gerada",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Je(t) {
  const n = t.chaves ?? [], e = (t.arbitros ?? []).filter((a) => a.deletedAt == null);
  if (n.length === 0 || e.length === 0) return;
  for (const a of e)
    a.chaveIds = [];
  const o = n.map((a) => {
    const i = a.posicoesAtletas.map((d) => (t.atletas ?? []).find((s) => s.id === d)).filter((d) => d !== void 0), l = Math.max(...i.map((d) => it[d.faixa] ?? 0), 0);
    return { chave: a, maxLevel: l };
  });
  o.sort((a, i) => i.maxLevel - a.maxLevel);
  const r = /* @__PURE__ */ new Map();
  for (const a of e) r.set(a.id, 0);
  for (const { chave: a, maxLevel: i } of o) {
    const l = e.filter((d) => (it[d.faixa] ?? 0) >= i).sort((d, s) => (r.get(d.id) ?? 0) - (r.get(s.id) ?? 0))[0];
    l && (a.arbitroId = l.id, r.set(l.id, (r.get(l.id) ?? 0) + 1), l.chaveIds.includes(a.id) || l.chaveIds.push(a.id));
  }
}
function $e(t, n) {
  const e = t.length;
  if (e <= n && e >= 2) return [t];
  const o = [];
  let r = 0;
  for (; r < e; )
    e - r <= n ? (o.push(t.slice(r)), r = e) : (o.push(t.slice(r, r + n)), r += n);
  const a = o[o.length - 1];
  if (a && a.length === 1 && o.length > 1) {
    const l = o[o.length - 2].pop();
    a.unshift(l);
  }
  return o;
}
function Ue(t, n = 16) {
  const e = x(t), o = (e.atletas ?? []).filter((c) => c.deletedAt == null);
  e.chaves = [];
  const r = [], a = /* @__PURE__ */ new Map();
  for (const c of o) {
    if (!c.categoria) {
      r.push(c.nome);
      continue;
    }
    const m = a.get(c.categoria) ?? [];
    m.push(c), a.set(c.categoria, m);
  }
  const i = [], l = [], d = [];
  for (const [c, m] of a) {
    if (m.length === 0) continue;
    if (m.length === 1) {
      l.push(m[0]), d.push({
        categoriaId: c,
        totalAtletas: 1,
        chavesGeradas: 0,
        atletasIgnorados: [...r]
      });
      continue;
    }
    const w = $e(m, n);
    let p = 0;
    for (const g of w) {
      if (g.length === 1) {
        l.push(g[0]);
        continue;
      }
      i.push(pt(c, g)), p++;
    }
    d.push({
      categoriaId: c,
      totalAtletas: m.length,
      chavesGeradas: p,
      atletasIgnorados: [...r]
    });
  }
  e.chaves = i, Je(e);
  const s = /* @__PURE__ */ new Set();
  for (const c of i)
    for (const m of c.posicoesAtletas)
      s.add(m);
  for (const c of e.atletas ?? [])
    c.emChave = s.has(c.id);
  return e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), q(e), { chaves: i, metadados: d, atletasSemChave: l };
}
function qe(t) {
  var r, a, i;
  const n = t.length;
  if (n < 4) return;
  const e = n === 4 ? [0, 3] : n === 5 ? [0, 1, 2] : n === 6 ? [0, 1, 2] : n === 9 ? [0, 1, 2, 3, 4] : n === 10 ? [0, 1, 2, 3, 4] : n === 11 ? [0, 1, 2, 3, 4, 5] : n === 12 ? [0, 1, 2, 3, 4, 5] : n === 13 ? [0, 1, 2, 3, 4, 5] : n === 14 ? [0, 1, 2, 3, 4, 5] : n === 15 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1], o = n === 4 ? [1, 2] : n === 5 ? [3, 4] : n === 6 ? [3, 4, 5] : n === 9 ? [5, 6, 7, 8] : n === 10 ? [5, 6, 7, 8, 9] : n === 11 ? [6, 7, 8, 9, 10] : n === 12 ? [6, 7, 8, 9, 10, 11] : n === 13 ? [6, 7, 8, 9, 10, 11, 12] : n === 14 ? [6, 7, 8, 9, 10, 11, 12, 13] : n === 15 ? [7, 8, 9, 10, 11, 12, 13, 14] : [2, 3, 4];
  for (const l of [e, o]) {
    const d = /* @__PURE__ */ new Set();
    for (const s of l) {
      const c = (r = t[s]) == null ? void 0 : r.equipe;
      if (c) {
        if (d.has(c)) {
          const m = l === e ? o : e;
          for (const w of m)
            if (((a = t[w]) == null ? void 0 : a.equipe) !== c) {
              [t[s], t[w]] = [t[w], t[s]];
              break;
            }
        }
        (i = t[s]) != null && i.equipe && d.add(t[s].equipe);
      }
    }
  }
}
function ze(t, n) {
  const e = x(t), o = e.chaves ?? [], r = o.findIndex((d) => d.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = o[r], i = [...a.posicoesAtletas];
  for (let d = i.length - 1; d > 0; d--) {
    const s = Math.floor(Math.random() * (d + 1));
    [i[d], i[s]] = [i[s], i[d]];
  }
  const l = i.map((d) => (e.atletas ?? []).find((s) => s.id === d)).filter((d) => d !== void 0);
  if (l.length === 16) {
    const d = At(l);
    a.posicoesAtletas = d.map((s) => s.id);
  } else
    qe(l), a.posicoesAtletas = l.map((d) => d.id);
  a.lutas = wt(l), a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o[r] = a, e.chaves = o;
  for (const d of e.atletas ?? [])
    a.posicoesAtletas.includes(d.id) && (d.emChave = !0);
  return e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), q(e), a;
}
function ke(t, n) {
  const e = x(t), o = e.chaves ?? [], r = o.findIndex((l) => l.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = o[r], i = a.arbitroId;
  if (i) {
    const l = (e.arbitros ?? []).find((d) => d.id === i);
    l && (l.chaveIds = l.chaveIds.filter((d) => d !== n.chaveId));
  }
  if (n.arbitroId) {
    const l = (e.arbitros ?? []).find((d) => d.id === n.arbitroId);
    if (!l) throw new Error("Árbitro não encontrado no torneio.");
    if (l.deletedAt != null) throw new Error("Árbitro deletado não pode ser atribuído a uma chave.");
    l.chaveIds.includes(n.chaveId) || l.chaveIds.push(n.chaveId);
  }
  return a.arbitroId = n.arbitroId, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o[r] = a, e.chaves = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), q(e), a;
}
async function He() {
  const t = await P.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
function We(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de chaves.");
  const r = x(t), a = (/* @__PURE__ */ new Date()).toISOString(), i = o.map((d) => {
    if (!d.categoriaId || !Array.isArray(d.lutas))
      throw new Error("Estrutura de chave inválida no arquivo.");
    const s = d.lutas.map((c) => ({
      ...c,
      updatedAt: c.updatedAt ?? a
    }));
    return {
      ...d,
      id: d.id || y.randomUUID(),
      lutas: s,
      updatedAt: d.updatedAt ?? a
    };
  });
  r.chaves = i;
  const l = /* @__PURE__ */ new Set();
  for (const d of i)
    for (const s of d.posicoesAtletas)
      l.add(s);
  for (const d of r.atletas ?? [])
    d.emChave = l.has(d.id);
  return r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), q(r), { imported: o.length };
}
async function Ve(t) {
  const n = x(t), e = n.chaves ?? [], o = await P.showSaveDialog({
    title: "Exportar Chaves",
    defaultPath: `${(n.nome || "torneio").replace(/[^a-zA-Z0-9]/g, "_")}_chaves.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !o.canceled && o.filePath && I.writeFileSync(o.filePath, JSON.stringify(e, null, 2), "utf-8");
}
function Ge(t) {
  return {
    id: t.id,
    ordem: t.ordem ?? 0,
    rodada: t.rodada ?? 1,
    atletaAId: t.atletaAId ?? "",
    atletaBId: t.atletaBId ?? "",
    status: t.status ?? "pending",
    vencedorId: t.vencedorId ?? null,
    placarA: t.placarA ?? void 0,
    placarB: t.placarB ?? void 0,
    finalizacao: t.finalizacao ?? void 0,
    desclassificacao: t.desclassificacao ?? void 0,
    desclassificadoId: t.desclassificadoId ?? void 0,
    desempateArbitro: t.desempateArbitro ?? void 0,
    horarioInicio: t.horarioInicio ?? void 0,
    horarioTermino: t.horarioTermino ?? void 0,
    updatedAt: t.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Y(t) {
  const n = (t.lutas ?? []).map(Ge);
  return {
    id: t.id,
    categoriaId: t.categoriaId ?? "",
    lutas: n,
    posicoesAtletas: t.posicoesAtletas ?? [],
    arbitroId: t.arbitroId ?? null,
    totalAtletas: t.totalAtletas ?? 0,
    totalLutas: t.totalLutas ?? 0,
    totalRodadas: t.totalRodadas ?? (n.length > 0 ? Math.max(...n.map((e) => e.rodada)) : 1),
    status: t.status ?? "gerada",
    updatedAt: t.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Ke(t, n) {
  const e = x(t), r = K(t).find((i) => i.id === n);
  if (!r) return [];
  const a = new Set(r.arbitroIds);
  return (e.chaves ?? []).map((i) => Y(i)).filter((i) => i.arbitroId && a.has(i.arbitroId));
}
function Q(t, n, e) {
  for (const o of t.lutas)
    o.rodada <= n || (o.atletaAId === e && (o.atletaAId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), Q(t, o.rodada, e)), o.atletaBId === e && (o.atletaBId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), Q(t, o.rodada, e)));
}
function Ye(t, n) {
  const e = t.lutas.filter((a) => a.rodada === n.rodada), o = e.indexOf(n);
  if (o < 0) return;
  let r = n.rodada + 1;
  for (; r <= (t.totalRodadas || 3); ) {
    const a = t.lutas.filter((c) => c.rodada === r);
    if (a.length === 0) return;
    const i = e.length / a.length, l = Math.floor(o / i);
    if (l >= a.length) return;
    const d = a[l], s = Math.floor(o % i);
    if (s === 0 && (d.atletaAId === "tbd" || d.atletaAId === "")) {
      d.atletaAId = n.vencedorId;
      return;
    }
    if (s === 1 && (d.atletaBId === "tbd" || d.atletaBId === "")) {
      d.atletaBId = n.vencedorId;
      return;
    }
    r++;
  }
}
function Qe(t, n) {
  const e = n.vencedorId;
  if (e) {
    if (n.ordem === 1) {
      const o = t.lutas.find((a) => a.ordem === 5);
      o && (o.atletaAId = e, o.vencedorId = e, o.status = "wo");
      const r = t.lutas.find((a) => a.ordem === 6);
      r && (r.atletaBId = e);
    } else if (n.ordem === 2) {
      const o = t.lutas.find((r) => r.ordem === 4);
      o && (o.atletaAId = e);
    } else if (n.ordem === 3) {
      const o = t.lutas.find((r) => r.ordem === 4);
      o && (o.atletaBId = e);
    } else if (n.ordem === 4) {
      const o = t.lutas.find((r) => r.ordem === 6);
      o && (o.atletaAId = e);
    }
  }
}
function Xe(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  if (!t.lutas.some((r) => r.ordem === 4 && r.rodada === 1)) {
    if (n.ordem === 1) {
      const r = t.lutas.filter((a) => a.rodada === 2);
      r[0] && (r[0].atletaAId = e);
    } else if (n.ordem === 2) {
      const r = t.lutas.filter((a) => a.rodada === 2);
      r[0] && (r[0].atletaBId = e);
    } else if (n.ordem === 3) {
      const r = t.lutas.filter((a) => a.rodada === 2);
      r[1] && (r[1].atletaAId = e);
    } else if (n.rodada === 2) {
      const r = t.lutas.find((l) => l.rodada === 3), i = t.lutas.filter((l) => l.rodada === 2).indexOf(n);
      r && i === 0 && (r.atletaAId = e), r && i === 1 && (r.atletaBId = e);
    }
    return;
  }
  if (n.ordem === 1) {
    const r = t.lutas.find((a) => a.ordem === 5);
    r && (r.atletaBId = e);
  } else if (n.ordem !== 2) {
    if (n.ordem === 3) {
      const r = t.lutas.find((a) => a.ordem === 6);
      r && (r.atletaBId = e);
    } else if (n.ordem !== 4) {
      if (n.ordem === 5) {
        const r = t.lutas.find((a) => a.ordem === 7);
        r && (r.atletaAId = e);
      } else if (n.ordem === 6) {
        const r = t.lutas.find((a) => a.ordem === 7);
        r && (r.atletaBId = e);
      }
    }
  }
}
function Ze(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((s) => s.ordem === 7), r = t.lutas.find((s) => s.ordem === 8), a = t.lutas.find((s) => s.ordem === 9), i = t.lutas.find((s) => s.ordem === 10), l = t.lutas.find((s) => s.ordem === 11), d = t.lutas.find((s) => s.ordem === 12);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem === 6 ? a && (a.atletaBId = e) : n.ordem === 7 ? i && (i.atletaAId = e) : n.ordem === 8 ? i && (i.atletaBId = e) : n.ordem === 9 ? (l && (l.atletaAId = e, l.vencedorId = e, l.status = "wo"), d && (d.atletaBId = e)) : n.ordem === 10 && d && (d.atletaAId = e);
}
function tn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((c) => c.ordem === 7), r = t.lutas.find((c) => c.ordem === 8), a = t.lutas.find((c) => c.ordem === 9), i = t.lutas.find((c) => c.ordem === 10), l = t.lutas.find((c) => c.ordem === 11), d = t.lutas.find((c) => c.ordem === 12), s = t.lutas.find((c) => c.ordem === 13);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? (r && (r.atletaAId = e, r.vencedorId = e, r.status = "wo"), l && (l.atletaBId = e)) : n.ordem === 4 ? (a && (a.atletaAId = e, a.vencedorId = e, a.status = "wo"), d && (d.atletaAId = e)) : n.ordem === 5 ? i && (i.atletaAId = e) : n.ordem === 6 ? i && (i.atletaBId = e) : n.ordem === 7 ? l && (l.atletaAId = e) : n.ordem === 10 ? d && (d.atletaBId = e) : n.ordem === 11 ? s && (s.atletaAId = e) : n.ordem === 12 && s && (s.atletaBId = e);
}
function en(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((d) => d.ordem === 9), r = t.lutas.find((d) => d.ordem === 10), a = t.lutas.find((d) => d.ordem === 13), i = t.lutas.find((d) => d.ordem === 14), l = t.lutas.find((d) => d.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem >= 4 && n.ordem <= 8 || (n.ordem === 9 ? a && (a.atletaAId = e) : n.ordem === 10 ? a && (a.atletaBId = e) : n.ordem === 11 ? i && (i.atletaAId = e) : n.ordem === 12 ? i && (i.atletaBId = e) : n.ordem === 13 ? l && (l.atletaAId = e) : n.ordem === 14 && l && (l.atletaBId = e));
}
function nn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((d) => d.ordem === 9), r = t.lutas.find((d) => d.ordem === 10), a = t.lutas.find((d) => d.ordem === 13), i = t.lutas.find((d) => d.ordem === 14), l = t.lutas.find((d) => d.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem >= 5 && n.ordem <= 8 || (n.ordem === 9 ? a && (a.atletaAId = e) : n.ordem === 10 ? a && (a.atletaBId = e) : n.ordem === 11 ? i && (i.atletaAId = e) : n.ordem === 12 ? i && (i.atletaBId = e) : n.ordem === 13 ? l && (l.atletaAId = e) : n.ordem === 14 && l && (l.atletaBId = e));
}
function on(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((s) => s.ordem === 9), r = t.lutas.find((s) => s.ordem === 10), a = t.lutas.find((s) => s.ordem === 11), i = t.lutas.find((s) => s.ordem === 13), l = t.lutas.find((s) => s.ordem === 14), d = t.lutas.find((s) => s.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem >= 6 && n.ordem <= 8 || (n.ordem === 9 ? i && (i.atletaAId = e) : n.ordem === 10 ? i && (i.atletaBId = e) : n.ordem === 11 ? l && (l.atletaAId = e) : n.ordem === 12 ? l && (l.atletaBId = e) : n.ordem === 13 ? d && (d.atletaAId = e) : n.ordem === 14 && d && (d.atletaBId = e));
}
function rn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((s) => s.ordem === 9), r = t.lutas.find((s) => s.ordem === 10), a = t.lutas.find((s) => s.ordem === 11), i = t.lutas.find((s) => s.ordem === 13), l = t.lutas.find((s) => s.ordem === 14), d = t.lutas.find((s) => s.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem === 6 ? a && (a.atletaBId = e) : n.ordem >= 7 && n.ordem <= 8 || (n.ordem === 9 ? i && (i.atletaAId = e) : n.ordem === 10 ? i && (i.atletaBId = e) : n.ordem === 11 ? l && (l.atletaAId = e) : n.ordem === 12 ? l && (l.atletaBId = e) : n.ordem === 13 ? d && (d.atletaAId = e) : n.ordem === 14 && d && (d.atletaBId = e));
}
function an(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((c) => c.ordem === 9), r = t.lutas.find((c) => c.ordem === 10), a = t.lutas.find((c) => c.ordem === 11), i = t.lutas.find((c) => c.ordem === 12), l = t.lutas.find((c) => c.ordem === 13), d = t.lutas.find((c) => c.ordem === 14), s = t.lutas.find((c) => c.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem === 6 ? a && (a.atletaBId = e) : n.ordem === 7 ? i && (i.atletaAId = e) : n.ordem === 8 || (n.ordem === 9 ? l && (l.atletaAId = e) : n.ordem === 10 ? l && (l.atletaBId = e) : n.ordem === 11 ? d && (d.atletaAId = e) : n.ordem === 12 ? d && (d.atletaBId = e) : n.ordem === 13 ? s && (s.atletaAId = e) : n.ordem === 14 && s && (s.atletaBId = e));
}
function dn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.indexOf(n);
  if (!(o < 0)) {
    if (n.rodada === 1) {
      const r = 8 + Math.floor(o / 2), a = o % 2 === 0, i = t.lutas[r];
      i && (a ? i.atletaAId = e : i.atletaBId = e);
    } else if (n.rodada === 2) {
      const r = o - 8, a = 12 + Math.floor(r / 2), i = r % 2 === 0, l = t.lutas[a];
      l && (i ? l.atletaAId = e : l.atletaBId = e);
    } else if (n.rodada === 3) {
      const r = t.lutas[14];
      r && (o - 12 === 0 ? r.atletaAId = e : r.atletaBId = e);
    }
  }
}
function sn(t, n) {
  const e = x(t), o = [...e.chaves ?? []], r = o.findIndex((s) => s.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = JSON.parse(JSON.stringify(o[r])), i = a.lutas.find((s) => s.id === n.lutaId);
  if (!i) throw new Error("Luta não encontrada");
  const l = i.vencedorId;
  if (l && l !== n.vencedorId && Q(a, i.rodada, l), i.vencedorId = n.vencedorId, i.status = n.status === "wo" ? "wo" : "completed", i.placarA = n.placarA, i.placarB = n.placarB, i.finalizacao = n.finalizacao ?? !1, i.desclassificacao = n.desclassificacao ?? !1, i.desempateArbitro = n.desempateArbitro ?? !1, i.horarioInicio = n.horarioInicio ?? i.horarioInicio, i.horarioTermino = n.horarioTermino ?? i.horarioTermino, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), n.desclassificacao && i.vencedorId ? i.desclassificadoId = i.atletaAId === i.vencedorId ? i.atletaBId : i.atletaAId : i.desclassificadoId = void 0, a.totalAtletas === 3) {
    const s = a.lutas.find((m) => m.rodada === 2), c = a.lutas.find((m) => m.rodada === 3);
    if (i.rodada === 1) {
      const m = i.vencedorId === i.atletaAId ? i.atletaBId : i.atletaAId;
      n.desclassificacao ? s && c && (s.atletaAId = s.atletaBId, s.vencedorId = s.atletaBId, s.status = "wo", c.atletaAId = i.vencedorId, c.atletaBId = s.atletaBId, c.vencedorId = null, c.status = "pending") : (s && (s.atletaAId = m, s.vencedorId = null, s.status = "pending"), c && (c.atletaAId = i.vencedorId, c.atletaBId = "tbd", c.vencedorId = null, c.status = "pending"));
    } else i.rodada === 2 && c && c.atletaBId === "tbd" && (c.atletaBId = i.vencedorId, c.status = "pending");
  } else a.totalAtletas === 5 ? Qe(a, i) : a.totalAtletas === 6 ? Xe(a, i) : a.totalAtletas === 9 ? Ze(a, i) : a.totalAtletas === 10 ? tn(a, i) : a.totalAtletas === 11 ? en(a, i) : a.totalAtletas === 12 ? nn(a, i) : a.totalAtletas === 13 ? on(a, i) : a.totalAtletas === 14 ? rn(a, i) : a.totalAtletas === 15 ? an(a, i) : a.totalAtletas === 16 ? dn(a, i) : Ye(a, i);
  const d = (/* @__PURE__ */ new Date()).toISOString();
  for (const s of a.lutas)
    s.updatedAt = d;
  return a.updatedAt = d, o[r] = a, e.chaves = o, e.updatedAt = d, q(e), a;
}
function ln() {
  h.handle("gerar-todas-chaves", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const o = n && n >= 2 && n <= 16 ? n : 16;
    return Ue(e, o);
  }), h.handle("gerar-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const o = x(e), r = (o.atletas ?? []).filter((l) => l.deletedAt == null && l.categoria === n.categoriaId);
    if (r.length < 2 || r.length > 16)
      throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
    const a = o.chaves ?? [];
    if (a.some((l) => l.categoriaId === n.categoriaId))
      throw new Error("Chave já existe para esta categoria.");
    const i = pt(n.categoriaId, r);
    o.chaves = [...a, i];
    for (const l of o.atletas ?? [])
      i.posicoesAtletas.includes(l.id) && (l.emChave = !0);
    return o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), q(o), i;
  }), h.handle("load-chaves", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return (x(t).chaves ?? []).map((e) => Y(e));
  }), h.handle("load-chave-por-categoria", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return (x(e).chaves ?? []).map((r) => Y(r)).find((r) => r.categoriaId === n) ?? null;
  }), h.handle("randomizar-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ze(e, n);
  }), h.handle("atribuir-arbitro-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ke(e, n);
  }), h.handle("import-chaves", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await He();
    return n ? We(t, n) : { imported: 0 };
  }), h.handle("export-chaves", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Ve(t);
  }), h.handle("load-chaves-por-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ke(e, n);
  }), h.handle("registrar-resultado", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return sn(e, n);
  });
}
const cn = v.join(O.getPath("userData"), "data"), un = v.join(cn, "torneios");
function vt(t) {
  return v.join(un, `${t}.json`);
}
function C(t) {
  const n = vt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function M(t) {
  I.writeFileSync(vt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function fn(t) {
  const n = t.status ?? "pending";
  return {
    id: t.id,
    areaId: t.areaId,
    arbitroId: t.arbitroId ?? null,
    atletaAId: t.atletaAId,
    atletaBId: t.atletaBId,
    atletaASnapshot: t.atletaASnapshot,
    atletaBSnapshot: t.atletaBSnapshot,
    tag: "luta-casada",
    status: n,
    placarA: t.placarA,
    placarB: t.placarB,
    vencedorId: t.vencedorId ?? null,
    finalizacao: t.finalizacao ?? !1,
    desclassificacao: t.desclassificacao ?? !1,
    desempateArbitro: t.desempateArbitro ?? !1,
    dataFinalizacao: t.dataFinalizacao ?? null,
    horarioInicio: t.horarioInicio ?? void 0,
    deletedAt: t.deletedAt ?? null,
    createdAt: t.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: t.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function J(t) {
  return (C(t).lutasCasadas ?? []).map((e) => fn(e));
}
function gt(t) {
  return J(t).filter((n) => n.deletedAt == null);
}
function mn(t) {
  return J(t).filter((n) => n.deletedAt != null);
}
function hn(t, n) {
  return gt(t).filter((e) => e.areaId === n);
}
function In(t, n) {
  if (n.atletaAId === n.atletaBId)
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  const e = C(t), o = J(t), r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    id: y.randomUUID(),
    areaId: n.areaId,
    arbitroId: n.arbitroId,
    atletaAId: n.atletaAId,
    atletaBId: n.atletaBId,
    atletaASnapshot: n.atletaASnapshot,
    atletaBSnapshot: n.atletaBSnapshot,
    tag: "luta-casada",
    status: n.status ?? "pending",
    placarA: n.placarA,
    placarB: n.placarB,
    vencedorId: n.vencedorId ?? null,
    finalizacao: n.finalizacao ?? !1,
    desclassificacao: n.desclassificacao ?? !1,
    desempateArbitro: n.desempateArbitro ?? !1,
    dataFinalizacao: n.dataFinalizacao ?? null,
    deletedAt: null,
    createdAt: r,
    updatedAt: r
  };
  return o.push(a), e.lutasCasadas = o, e.updatedAt = r, M(e), a;
}
function An(t, n) {
  if (n.atletaAId === n.atletaBId)
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  const e = C(t), o = J(t), r = o.findIndex((l) => l.id === n.id);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString(), i = {
    ...n,
    tag: "luta-casada",
    updatedAt: a
  };
  return o[r] = i, e.lutasCasadas = o, e.updatedAt = a, M(e), i;
}
function wn(t, n) {
  const e = C(t), o = J(t), r = o.findIndex((i) => i.id === n);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString();
  o[r].deletedAt = a, o[r].updatedAt = a, e.lutasCasadas = o, e.updatedAt = a, M(e);
}
function pn(t, n) {
  const e = C(t), o = J(t), r = (/* @__PURE__ */ new Date()).toISOString();
  for (const a of o)
    n.includes(a.id) && (a.deletedAt = r, a.updatedAt = r);
  e.lutasCasadas = o, e.updatedAt = r, M(e);
}
function vn(t, n) {
  const e = C(t);
  e.lutasCasadas = (e.lutasCasadas ?? []).filter((o) => o.id !== n), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), M(e);
}
function gn(t, n) {
  const e = C(t);
  e.lutasCasadas = (e.lutasCasadas ?? []).filter((o) => !n.includes(o.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), M(e);
}
function Sn(t, n) {
  const e = C(t), o = J(t), r = o.findIndex((i) => i.id === n);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString();
  o[r].deletedAt = null, o[r].updatedAt = a, e.lutasCasadas = o, e.updatedAt = a, M(e);
}
function bn(t, n) {
  const e = C(t), o = J(t), r = (/* @__PURE__ */ new Date()).toISOString();
  for (const a of o)
    n.includes(a.id) && (a.deletedAt = null, a.updatedAt = r);
  e.lutasCasadas = o, e.updatedAt = r, M(e);
}
const et = process.env.MASTER_PASSWORD_HASH || "f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4", yn = "activation.json", Dn = 1;
function nt() {
  return v.join(O.getPath("userData"), yn);
}
function St() {
  try {
    return xt("wmic csproduct get uuid", { encoding: "utf-8" }).split(`
`).map((e) => e.trim()).filter(Boolean)[1] || y.randomUUID();
  } catch {
    return y.randomUUID();
  }
}
function bt(t) {
  return t ? /* @__PURE__ */ new Date() > new Date(t) : !0;
}
function On(t) {
  const n = new Date(t).getTime() - Date.now();
  return Math.max(0, Math.ceil(n / 864e5));
}
function En() {
  try {
    const t = nt();
    if (!I.existsSync(t)) return !1;
    const n = JSON.parse(I.readFileSync(t, "utf-8"));
    if (bt(n.expiresAt)) return !1;
    const e = St(), o = y.createHmac("sha256", et).update(e).digest("hex");
    return n.token === o;
  } catch {
    return !1;
  }
}
function xn() {
  try {
    const t = nt();
    if (!I.existsSync(t))
      return { activated: !1, activatedAt: null, expiresAt: null, daysRemaining: null };
    const n = JSON.parse(I.readFileSync(t, "utf-8"));
    return bt(n.expiresAt) ? {
      activated: !1,
      activatedAt: n.activatedAt ?? null,
      expiresAt: n.expiresAt ?? null,
      daysRemaining: 0
    } : {
      activated: !0,
      activatedAt: n.activatedAt ?? null,
      expiresAt: n.expiresAt,
      daysRemaining: On(n.expiresAt)
    };
  } catch {
    return { activated: !1, activatedAt: null, expiresAt: null, daysRemaining: null };
  }
}
function Nn(t) {
  return y.createHash("sha256").update(t).digest("hex") === et;
}
function Bn() {
  try {
    const t = St(), n = y.createHmac("sha256", et).update(t).digest("hex"), e = /* @__PURE__ */ new Date(), o = new Date(e);
    o.setFullYear(o.getFullYear() + Dn);
    const r = nt();
    return I.writeFileSync(
      r,
      JSON.stringify({ token: n, activatedAt: e.toISOString(), expiresAt: o.toISOString() }, null, 2),
      "utf-8"
    ), !0;
  } catch {
    return !1;
  }
}
const yt = v.dirname(Et(import.meta.url));
process.env.APP_ROOT = v.join(yt, "..");
const X = process.env.VITE_DEV_SERVER_URL, Un = v.join(process.env.APP_ROOT, "dist-electron"), Dt = v.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = X ? v.join(process.env.APP_ROOT, "public") : Dt;
let _;
function Ot() {
  _ = new dt({
    icon: v.join(process.env.VITE_PUBLIC, "favicon.svg"),
    webPreferences: {
      preload: v.join(yt, "preload.mjs")
    }
  }), _.maximize(), _.webContents.on("did-finish-load", () => {
    _ == null || _.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), X ? _.loadURL(X) : _.loadFile(v.join(Dt, "index.html"));
}
O.on("window-all-closed", () => {
  process.platform !== "darwin" && (O.quit(), _ = null);
});
O.on("activate", () => {
  dt.getAllWindows().length === 0 && Ot();
});
function Ln() {
  h.handle("load-athletes", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ct(t);
  }), h.handle("save-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Rt(e, n);
  }), h.handle("update-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Mt(e, n);
  }), h.handle("delete-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Jt(e, n);
  }), h.handle("delete-athletes", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return $t(e, n);
  }), h.handle("restore-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ut(e, n);
  }), h.handle("load-deleted-athletes", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return qt(t);
  }), h.handle("permanently-delete-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return zt(e, n);
  }), h.handle("permanently-delete-athletes", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return kt(e, n);
  }), h.handle("import-athletes", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await Wt();
    return n ? Ht(t, n) : { imported: 0, skipped: 0 };
  }), h.handle("export-athletes", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Vt(t);
  });
}
function _n() {
  h.handle("save-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Yt(e, n);
  }), h.handle("update-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Qt(e, n);
  }), h.handle("delete-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Xt(e, n);
  }), h.handle("delete-arbitros", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Zt(e, n);
  }), h.handle("restore-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return te(e, n);
  }), h.handle("load-deleted-arbitros", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ee(t);
  }), h.handle("permanently-delete-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ne(e, n);
  }), h.handle("permanently-delete-arbitros", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return oe(e, n);
  }), h.handle("load-arbitros", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ft(t);
  }), h.handle("import-arbitros", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await re();
    return n ? ae(t, n) : { imported: 0, skipped: 0 };
  }), h.handle("export-arbitros", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ie(t);
  });
}
function Pn() {
  h.handle("load-areas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return K(t);
  }), h.handle("save-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return le(e, n);
  }), h.handle("update-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ce(e, n);
  }), h.handle("delete-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ue(e, n);
  }), h.handle("delete-areas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return fe(e, n);
  }), h.handle("restore-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return me(e, n);
  }), h.handle("load-deleted-areas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return he(t);
  }), h.handle("permanently-delete-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ie(e, n);
  }), h.handle("permanently-delete-areas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ae(e, n);
  }), h.handle("import-areas", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await pe();
    return n ? we(t, n) : { imported: 0, skipped: 0 };
  }), h.handle("export-areas", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ve(t);
  });
}
function Tn() {
  h.handle("check-activation", () => En()), h.handle("validate-password", (t, n) => Nn(n)), h.handle("activate-license", () => Bn()), h.handle("get-activation-info", () => xn());
}
function Fn() {
  h.handle("load-lutas-casadas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return gt(t);
  }), h.handle("load-deleted-lutas-casadas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return mn(t);
  }), h.handle("load-lutas-casadas-por-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return hn(e, n);
  }), h.handle("save-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return In(e, n);
  }), h.handle("update-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return An(e, n);
  }), h.handle("delete-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return wn(e, n);
  }), h.handle("delete-lutas-casadas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return pn(e, n);
  }), h.handle("permanently-delete-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return vn(e, n);
  }), h.handle("permanently-delete-lutas-casadas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return gn(e, n);
  }), h.handle("restore-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Sn(e, n);
  }), h.handle("restore-lutas-casadas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return bn(e, n);
  });
}
O.whenReady().then(() => {
  Nt(), Ln(), _n(), ln(), Pn(), Fn(), Tn(), Ot();
});
export {
  Un as MAIN_DIST,
  Dt as RENDERER_DIST,
  X as VITE_DEV_SERVER_URL
};
