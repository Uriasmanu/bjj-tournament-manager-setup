import { app as O, ipcMain as m, dialog as T, BrowserWindow as ft } from "electron";
import { fileURLToPath as Lt } from "node:url";
import g from "node:path";
import I from "node:fs";
import D from "node:crypto";
import { execSync as st } from "node:child_process";
const Tt = [
  { peso: "galo", nome: "Galo", masculino: 57.5, feminino: 48.5 },
  { peso: "pluma", nome: "Pluma", masculino: 64, feminino: 53.5 },
  { peso: "pena", nome: "Pena", masculino: 70, feminino: 58.5 },
  { peso: "leve", nome: "Leve", masculino: 76, feminino: 64 },
  { peso: "medio", nome: "Médio", masculino: 82.3, feminino: 69 },
  { peso: "meio-pesado", nome: "Meio-Pesado", masculino: 88.3, feminino: 74 },
  { peso: "pesado", nome: "Pesado", masculino: 94.3, feminino: 79.3 },
  { peso: "super-pesado", nome: "Super Pesado", masculino: 97.5, feminino: null },
  { peso: "pesadissimo", nome: "Pesadíssimo", masculino: null, feminino: null }
], Pt = {
  "pre-mirim": "Pré-Mirim",
  mirim: "Mirim",
  "infantil-a": "Infantil A",
  "infantil-b": "Infantil B",
  "infanto-juvenil-a": "Infanto-Juvenil A",
  "infanto-juvenil-b": "Infanto-Juvenil B"
}, Ft = {
  "pre-mirim": { galo: 14.7, pluma: 17.9, pena: 20, leve: 24, medio: 26, "meio-pesado": 29, pesado: 31.2, "super-pesado": 33.2, pesadissimo: null },
  mirim: { galo: 21, pluma: 24, pena: 27, leve: 30.2, medio: 33.2, "meio-pesado": 36.2, pesado: 39.3, "super-pesado": 42.3, pesadissimo: null },
  "infantil-a": { galo: 27, pluma: 30.2, pena: 33.2, leve: 36.2, medio: 39.3, "meio-pesado": 42.3, pesado: 45.3, "super-pesado": 48.3, pesadissimo: null },
  "infantil-b": { galo: 36.2, pluma: 40.3, pena: 44.3, leve: 48.3, medio: 52.5, "meio-pesado": 56.5, pesado: 60.5, "super-pesado": 65, pesadissimo: null },
  "infanto-juvenil-a": { galo: 40.3, pluma: 44.3, pena: 48.3, leve: 52.5, medio: 56.5, "meio-pesado": 60.5, pesado: 65, "super-pesado": 69.5, pesadissimo: null },
  "infanto-juvenil-b": { galo: 48.3, pluma: 52.5, pena: 56.5, leve: 60.5, medio: 65, "meio-pesado": 69.5, pesado: 74, "super-pesado": 78.5, pesadissimo: null }
};
function jt(t, n, e) {
  const o = Ft[t];
  if (o)
    return o[e.peso] ?? null;
  const r = n === "masculino" ? e.masculino : e.feminino;
  return e.peso === "pesadissimo" && n === "feminino" ? null : r;
}
function Rt() {
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
    const r = Pt[o] || o.charAt(0).toUpperCase() + o.slice(1);
    for (const a of n) {
      const i = a === "masculino" ? "Masculino" : "Feminino";
      for (const l of Tt) {
        const s = jt(o, a, l);
        s !== void 0 && e.push({
          id: `${o}-${a}-${l.peso}`,
          nome: `${r} ${i} ${l.nome}`,
          faixaEtaria: o,
          genero: a,
          peso: l.peso,
          pesoMaximoKg: s
        });
      }
    }
  }
  return e;
}
const K = Rt(), $t = {};
for (const t of K)
  $t[t.id] = t.nome;
const Y = g.join(O.getPath("userData"), "data"), W = g.join(Y, "torneios"), R = g.join(Y, "torneio-ativo.json");
function _() {
  I.existsSync(Y) || I.mkdirSync(Y, { recursive: !0 }), I.existsSync(W) || I.mkdirSync(W, { recursive: !0 });
}
function q(t) {
  return g.join(W, `${t}.json`);
}
function A() {
  if (!I.existsSync(R)) return null;
  try {
    const { id: t } = JSON.parse(I.readFileSync(R, "utf-8"));
    return t;
  } catch {
    return null;
  }
}
function k(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (const d of t) e.set(d.id, d);
  const o = /* @__PURE__ */ new Map();
  for (const d of n) o.set(d.id, d);
  const r = [];
  let a = 0, i = 0, l = 0;
  for (const d of o.values()) {
    const c = e.get(d.id);
    c ? d.updatedAt > c.updatedAt ? (r.push(d), i += 1, c.deletedAt == null && d.deletedAt != null && (l += 1)) : r.push(c) : (r.push(d), a += 1);
  }
  let s = 0;
  for (const [d, c] of e)
    o.has(d) || (r.push(c), s += 1);
  return { merged: r, counters: { created: a, updated: i, kept: s, removed: l } };
}
function H(t) {
  const n = /* @__PURE__ */ new Set(), e = [];
  for (const o of t)
    n.has(o.id) || (n.add(o.id), e.push(o));
  return e;
}
function dt(t) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...t,
    id: t.id || D.randomUUID(),
    createdAt: t.createdAt || n,
    updatedAt: t.updatedAt || n,
    nome: (t.nome || "").trim().toLowerCase(),
    equipe: (t.equipe || "").trim().toLowerCase(),
    deletedAt: t.deletedAt ?? null
  };
}
function lt(t) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...t,
    id: t.id || D.randomUUID(),
    createdAt: t.createdAt || n,
    updatedAt: t.updatedAt || n,
    nome: (t.nome || "").trim().toLowerCase(),
    equipe: (t.equipe || "").trim().toLowerCase(),
    chaveIds: t.chaveIds ?? [],
    deletedAt: t.deletedAt ?? null
  };
}
function ct(t) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...t,
    id: t.id || D.randomUUID(),
    createdAt: t.createdAt || n,
    updatedAt: t.updatedAt || n,
    nome: (t.nome || "").trim(),
    arbitroIds: Array.isArray(t.arbitroIds) ? t.arbitroIds.filter(Boolean) : [],
    deletedAt: t.deletedAt ?? null
  };
}
function zt() {
  m.handle("create-tournament", (t, n) => {
    _();
    const e = K.filter((r) => r.faixaEtaria !== "adulto").map((r) => r.id), o = {
      id: D.randomUUID(),
      nome: n.nome,
      data: n.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      atletas: [],
      categoriasDesabilitadas: e
    };
    return I.writeFileSync(q(o.id), JSON.stringify(o, null, 2), "utf-8"), o;
  }), m.handle("list-tournaments", () => (_(), I.readdirSync(W).filter((n) => n.endsWith(".json")).map((n) => {
    const e = I.readFileSync(g.join(W, n), "utf-8");
    return JSON.parse(e);
  }))), m.handle("start-tournament", (t, n) => {
    _(), I.writeFileSync(R, JSON.stringify({ id: n.id, mode: n.mode }), "utf-8");
    const e = q(n.id);
    if (I.existsSync(e)) {
      const o = JSON.parse(I.readFileSync(e, "utf-8"));
      return o.startedAt = (/* @__PURE__ */ new Date()).toISOString(), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), I.writeFileSync(e, JSON.stringify(o, null, 2), "utf-8"), o;
    }
    throw new Error("Torneio não encontrado");
  }), m.handle("get-tournament-mode", () => {
    if (_(), !I.existsSync(R)) return null;
    try {
      return JSON.parse(I.readFileSync(R, "utf-8")).mode ?? "admin";
    } catch {
      return null;
    }
  }), m.handle("get-active-tournament", () => {
    _();
    const t = A();
    if (!t) return null;
    const n = q(t);
    return I.existsSync(n) ? JSON.parse(I.readFileSync(n, "utf-8")) : null;
  }), m.handle("export-tournament", async (t, n) => {
    _();
    const e = q(n);
    if (!I.existsSync(e)) throw new Error("Torneio não encontrado");
    const o = JSON.parse(I.readFileSync(e, "utf-8")), r = o.nome || `Torneio ${o.data}`, a = await T.showSaveDialog({
      title: "Exportar Torneio",
      defaultPath: `${r.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    !a.canceled && a.filePath && I.copyFileSync(e, a.filePath);
  }), m.handle(
    "import-tournament",
    (t, n) => {
      if (_(), !n.id || !n.data)
        throw new Error("Estrutura inválida");
      const e = q(n.id), o = (/* @__PURE__ */ new Date()).toISOString(), r = I.existsSync(e) ? JSON.parse(I.readFileSync(e, "utf-8")) : null;
      if (!r) {
        const J = K.filter((C) => C.faixaEtaria !== "adulto").map((C) => C.id), _t = {
          ...n,
          createdAt: n.createdAt || o,
          updatedAt: n.updatedAt || o,
          atletas: H((n.atletas ?? []).map((C) => dt(C))),
          arbitros: H((n.arbitros ?? []).map((C) => lt(C))),
          areas: H((n.areas ?? []).map((C) => ct(C))),
          chaves: H(n.chaves ?? []),
          lutasCasadas: H(n.lutasCasadas ?? []),
          categoriasDesabilitadas: n.categoriasDesabilitadas ?? J,
          categoriasCustomizadas: n.categoriasCustomizadas ?? []
        };
        return I.writeFileSync(e, JSON.stringify(_t, null, 2), "utf-8"), { success: !0, merged: !1, created: 0, updated: 0, kept: 0, removed: 0 };
      }
      const a = (n.atletas ?? []).map((J) => dt(J)), i = (n.arbitros ?? []).map((J) => lt(J)), l = (n.areas ?? []).map((J) => ct(J)), s = n.chaves ?? [], d = n.lutasCasadas ?? [], c = n.updatedAt > r.updatedAt, w = k(r.atletas ?? [], a), h = k(r.arbitros ?? [], i), p = k(r.areas ?? [], l), v = k(r.chaves ?? [], s), S = k(r.lutasCasadas ?? [], d), b = {
        created: w.counters.created + h.counters.created + p.counters.created + v.counters.created + S.counters.created,
        updated: w.counters.updated + h.counters.updated + p.counters.updated + v.counters.updated + S.counters.updated,
        kept: w.counters.kept + h.counters.kept + p.counters.kept + v.counters.kept + S.counters.kept,
        removed: w.counters.removed + h.counters.removed + p.counters.removed + v.counters.removed + S.counters.removed
      }, x = {
        id: r.id,
        nome: c ? n.nome : r.nome,
        data: c ? n.data : r.data,
        createdAt: r.createdAt,
        updatedAt: n.updatedAt > r.updatedAt ? n.updatedAt : r.updatedAt,
        startedAt: r.startedAt ?? n.startedAt,
        atletas: w.merged,
        arbitros: h.merged,
        areas: p.merged,
        chaves: v.merged,
        lutasCasadas: S.merged,
        categoriasDesabilitadas: c ? n.categoriasDesabilitadas ?? r.categoriasDesabilitadas ?? [] : r.categoriasDesabilitadas ?? n.categoriasDesabilitadas ?? [],
        categoriasCustomizadas: c ? n.categoriasCustomizadas ?? r.categoriasCustomizadas ?? [] : r.categoriasCustomizadas ?? n.categoriasCustomizadas ?? []
      };
      return I.writeFileSync(e, JSON.stringify(x, null, 2), "utf-8"), { success: !0, merged: !0, ...b };
    }
  ), m.handle("update-tournament", (t, n) => {
    _();
    const e = q(n.id);
    if (!I.existsSync(e)) throw new Error("Torneio não encontrado");
    const o = {
      ...n,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return I.writeFileSync(e, JSON.stringify(o, null, 2), "utf-8"), o;
  }), m.handle("delete-tournament", (t, n) => {
    _();
    const e = q(n);
    if (!I.existsSync(e)) throw new Error("Torneio não encontrado");
    if (I.unlinkSync(e), I.existsSync(R))
      try {
        const { id: o } = JSON.parse(I.readFileSync(R, "utf-8"));
        o === n && I.unlinkSync(R);
      } catch {
      }
  }), m.handle("read-file", async (t, n) => I.readFileSync(n, "utf-8"));
}
const Mt = g.join(O.getPath("userData"), "data"), Jt = g.join(Mt, "torneios");
function mt(t) {
  return g.join(Jt, `${t}.json`);
}
function N(t) {
  const n = mt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function P(t) {
  I.writeFileSync(mt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function ht(t) {
  const n = N(t), e = n.atletas ?? [];
  let o = !1;
  for (const r of e)
    r.id || (r.id = D.randomUUID(), o = !0), r.createdAt || (r.createdAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.updatedAt || (r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.deletedAt === void 0 && (r.deletedAt = null, o = !0);
  return o && (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(n)), e.filter((r) => r.deletedAt == null);
}
function qt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n.id);
  if (a !== -1) {
    const i = o[a];
    o[a] = {
      ...n,
      createdAt: i.createdAt,
      deletedAt: i.deletedAt ?? null,
      updatedAt: r
    };
  } else {
    const i = {
      ...n,
      id: n.id || D.randomUUID(),
      createdAt: n.createdAt || r,
      updatedAt: r,
      deletedAt: null
    };
    o.push(i);
  }
  return e.atletas = o, e.updatedAt = r, P(e), o.filter((i) => i.deletedAt == null);
}
function Ut(t, n) {
  const e = N(t), o = e.atletas ?? [], r = o.findIndex((i) => i.id === n.id);
  if (r === -1) throw new Error("Atleta não encontrado");
  const a = o[r];
  return o[r] = {
    ...n,
    createdAt: a.createdAt,
    deletedAt: a.deletedAt ?? null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, e.atletas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(e), o.filter((i) => i.deletedAt == null);
}
function Q(t, n) {
  const e = t.chaves ?? [], o = (/* @__PURE__ */ new Date()).toISOString();
  for (const r of e) {
    const a = r.posicoesAtletas.indexOf(n);
    a !== -1 && (r.posicoesAtletas.splice(a, 1), r.totalAtletas = r.posicoesAtletas.length, r.updatedAt = o);
    for (const i of r.lutas)
      i.atletaAId === n && (i.atletaAId = "tbd"), i.atletaBId === n && (i.atletaBId = "tbd"), i.updatedAt = o;
  }
}
function kt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Atleta não encontrado");
  return o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  }, Q(e, n), e.atletas = o, e.updatedAt = r, P(e), o.filter((i) => i.deletedAt == null);
}
function Ht(t, n) {
  const e = N(t), o = new Set(n), r = e.atletas ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < r.length; i += 1)
    o.has(r[i].id) && (r[i] = {
      ...r[i],
      deletedAt: a,
      updatedAt: a
    });
  for (const i of n)
    Q(e, i);
  return e.atletas = r, e.updatedAt = a, P(e), r.filter((i) => i.deletedAt == null);
}
function Wt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Atleta não encontrado");
  return o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, e.atletas = o, e.updatedAt = r, P(e), o.filter((i) => i.deletedAt == null);
}
function Vt(t) {
  return (N(t).atletas ?? []).filter((o) => o.deletedAt != null);
}
function Gt(t, n) {
  const e = N(t), o = e.atletas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Atleta não encontrado");
  return o.splice(r, 1), Q(e, n), e.atletas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(e), o.filter((a) => a.deletedAt == null);
}
function Kt(t, n) {
  const e = N(t), o = new Set(n), r = e.atletas ?? [];
  e.atletas = r.filter((a) => !o.has(a.id));
  for (const a of n)
    Q(e, a);
  return e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(e), e.atletas.filter((a) => a.deletedAt == null);
}
function Yt(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de atletas.");
  const r = N(t), a = new Set(K.map((d) => d.id));
  for (const d of r.categoriasCustomizadas ?? [])
    a.add(d.id);
  for (const d of o) {
    if (!d.nome || !d.equipe || !d.faixa || !d.anoNascimento || !d.pesoKg || !d.genero || !d.categoria)
      throw new Error(`Atleta inválido no arquivo: "${d.nome || "sem nome"}" — campos obrigatórios ausentes (categoria, genero).`);
    if (!a.has(d.categoria))
      throw new Error(`Atleta inválido no arquivo: "${d.nome}" — categoria "${d.categoria}" não reconhecida.`);
  }
  const i = r.atletas ?? [];
  let l = 0, s = 0;
  for (const d of o) {
    const c = d.nome.trim().toLowerCase(), w = d.equipe.trim().toLowerCase();
    i.some(
      (p) => d.id && p.id === d.id || p.nome.trim().toLowerCase() === c && p.anoNascimento === d.anoNascimento
    ) ? s++ : (d.nome = c, d.equipe = w, i.push({
      ...d,
      id: d.id || D.randomUUID(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      deletedAt: null
    }), l++);
  }
  return r.atletas = i, r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(r), { imported: l, skipped: s };
}
async function Qt() {
  const t = await T.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
async function Zt(t) {
  const n = ht(t), e = await T.showSaveDialog({
    title: "Exportar Atletas",
    defaultPath: "atletas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !e.canceled && e.filePath && I.writeFileSync(e.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const Xt = g.join(O.getPath("userData"), "data"), te = g.join(Xt, "torneios");
function It(t) {
  return g.join(te, `${t}.json`);
}
function B(t) {
  const n = It(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function F(t) {
  I.writeFileSync(It(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function At(t) {
  const n = B(t), e = n.arbitros ?? [];
  let o = !1;
  for (const r of e)
    r.deletedAt === void 0 && (r.deletedAt = null, o = !0);
  return o && (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(n)), e.filter((r) => r.deletedAt == null);
}
function ee(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    id: D.randomUUID(),
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
function ne(t, n) {
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
function oe(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((s) => s.id === n);
  if (a === -1) throw new Error("Árbitro não encontrado");
  o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  };
  const l = e.chaves;
  if (l)
    for (const s of l)
      s.arbitroId === n && (s.arbitroId = null);
  e.arbitros = o, e.updatedAt = r, F(e);
}
function re(t, n) {
  const e = B(t), o = new Set(n), r = e.arbitros ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let s = 0; s < r.length; s += 1)
    o.has(r[s].id) && (r[s] = {
      ...r[s],
      deletedAt: a,
      updatedAt: a
    });
  const l = e.chaves;
  if (l)
    for (const s of l)
      s.arbitroId && o.has(s.arbitroId) && (s.arbitroId = null);
  e.arbitros = r, e.updatedAt = a, F(e);
}
function ae(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Árbitro não encontrado");
  o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, e.arbitros = o, e.updatedAt = r, F(e);
}
function ie(t) {
  return (B(t).arbitros ?? []).filter((o) => o.deletedAt != null);
}
function se(t, n) {
  const e = B(t), o = e.arbitros ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Árbitro não encontrado");
  o.splice(r, 1), e.arbitros = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(e);
}
function de(t, n) {
  const e = B(t), o = new Set(n), r = e.arbitros ?? [];
  e.arbitros = r.filter((a) => !o.has(a.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(e);
}
async function le() {
  const t = await T.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
function ce(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de árbitros.");
  const r = /* @__PURE__ */ new Set(["roxa", "marrom", "preta"]);
  for (const d of o) {
    const c = d;
    if (!c.nome || typeof c.nome != "string" || c.nome.trim().length < 2)
      throw new Error(`Árbitro inválido no arquivo: "${c.nome || "sem nome"}" — nome deve ter ao menos 2 caracteres.`);
    if (!c.faixa || typeof c.faixa != "string" || !r.has(c.faixa))
      throw new Error(`Árbitro inválido no arquivo: "${c.nome}" — faixa inválida.`);
    if (c.equipe !== void 0 && (typeof c.equipe != "string" || c.equipe.trim().length < 2))
      throw new Error(`Árbitro inválido no arquivo: "${c.nome}" — equipe deve ter ao menos 2 caracteres se informada.`);
  }
  const a = B(t), i = a.arbitros ?? [];
  let l = 0, s = 0;
  for (const d of o) {
    const c = d, w = c.nome.trim().toLowerCase();
    i.some((p) => p.nome.trim().toLowerCase() === w) ? s++ : (i.push({
      ...c,
      id: c.id || D.randomUUID(),
      nome: w,
      equipe: c.equipe && typeof c.equipe == "string" ? c.equipe.trim().toLowerCase() : "",
      faixa: c.faixa,
      chaveIds: c.chaveIds ?? [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      deletedAt: null
    }), l++);
  }
  return a.arbitros = i, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), F(a), { imported: l, skipped: s };
}
async function ue(t) {
  const n = At(t), e = await T.showSaveDialog({
    title: "Exportar Árbitros",
    defaultPath: "arbitros.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !e.canceled && e.filePath && I.writeFileSync(e.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const fe = g.join(O.getPath("userData"), "data"), me = g.join(fe, "torneios");
function wt(t) {
  return g.join(me, `${t}.json`);
}
function y(t) {
  const n = wt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function $(t) {
  I.writeFileSync(wt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function nt(t) {
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
function ot(t) {
  return (y(t).areas ?? []).map((o) => V(o)).filter((o) => o.deletedAt == null);
}
function rt(t, n) {
  const e = n ?? [];
  if (e.length === 0) return;
  const r = (y(t).arbitros ?? []).filter((l) => l.deletedAt == null), a = new Set(r.map((l) => l.id));
  if (e.filter((l) => l && !a.has(l)).length > 0)
    throw new Error("Um ou mais árbitros não existem ou estão deletados.");
}
function he(t, n) {
  const e = n.arbitroIds ?? [];
  rt(t, e);
  const o = y(t), r = (o.areas ?? []).map((d) => V(d)), a = r.filter((d) => d.deletedAt == null), i = (/* @__PURE__ */ new Date()).toISOString(), l = n.nome.trim() === "" ? nt(a) : n.nome.trim(), s = {
    id: D.randomUUID(),
    nome: l,
    arbitroIds: e.filter(Boolean),
    createdAt: i,
    updatedAt: i,
    deletedAt: null
  };
  return r.push(s), o.areas = r, o.updatedAt = i, $(o), s;
}
function Ie(t, n) {
  const e = n.arbitroIds ?? [];
  rt(t, e);
  const o = y(t), r = (o.areas ?? []).map((c) => V(c)), a = r.findIndex((c) => c.id === n.id);
  if (a === -1) throw new Error("Área de luta não encontrada");
  const i = r[a], l = (/* @__PURE__ */ new Date()).toISOString(), s = r.filter((c) => c.deletedAt == null && c.id !== n.id), d = n.nome.trim() === "" ? nt(s) : n.nome.trim();
  return r[a] = {
    ...n,
    nome: d,
    arbitroIds: e.filter(Boolean),
    createdAt: i.createdAt,
    deletedAt: i.deletedAt ?? null,
    updatedAt: l
  }, o.areas = r, o.updatedAt = l, $(o), r[a];
}
function Ae(t, n) {
  const e = y(t), o = e.areas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Área de luta não encontrada");
  o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  }, e.areas = o, e.updatedAt = r, $(e);
}
function we(t, n) {
  const e = y(t), o = new Set(n), r = e.areas ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < r.length; i += 1)
    o.has(r[i].id) && (r[i] = {
      ...r[i],
      deletedAt: a,
      updatedAt: a
    });
  e.areas = r, e.updatedAt = a, $(e);
}
function pe(t, n) {
  const e = y(t), o = e.areas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Área de luta não encontrada");
  o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, e.areas = o, e.updatedAt = r, $(e);
}
function ge(t) {
  return (y(t).areas ?? []).map((o) => V(o)).filter((o) => o.deletedAt != null);
}
function ve(t, n) {
  const e = y(t), o = e.areas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Área de luta não encontrada");
  o.splice(r, 1), e.areas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), $(e);
}
function Se(t, n) {
  const e = y(t), o = new Set(n), r = e.areas ?? [];
  e.areas = r.filter((a) => !o.has(a.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), $(e);
}
function be(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de áreas de luta.");
  const r = y(t), a = (r.areas ?? []).map((c) => V(c)), i = a.filter((c) => c.deletedAt == null), l = (/* @__PURE__ */ new Date()).toISOString();
  let s = 0, d = 0;
  for (const c of o) {
    if (!c || typeof c != "object")
      throw new Error("Área inválida no arquivo: formato incorreto.");
    const w = c;
    if (w.arbitroIds !== void 0 && !Array.isArray(w.arbitroIds))
      throw new Error(`Área inválida no arquivo: "${String(w.nome ?? "sem nome")}" — arbitroIds deve ser um array.`);
    const h = typeof w.nome == "string" ? w.nome.trim() : "", p = Array.isArray(w.arbitroIds) ? w.arbitroIds.filter((x) => typeof x == "string" && x.length > 0) : [];
    if (i.some(
      (x) => x.nome.trim().toLowerCase() === h.toLowerCase() && h !== ""
    )) {
      d += 1;
      continue;
    }
    rt(t, p);
    const S = h === "" ? nt(i) : h, b = {
      id: D.randomUUID(),
      nome: S,
      arbitroIds: p,
      createdAt: l,
      updatedAt: l,
      deletedAt: null
    };
    a.push(b), i.push(b), s += 1;
  }
  return r.areas = a, r.updatedAt = l, $(r), { imported: s, skipped: d };
}
async function De() {
  const t = await T.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
async function xe(t) {
  const n = ot(t), e = await T.showSaveDialog({
    title: "Exportar Áreas de Luta",
    defaultPath: "areas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !e.canceled && e.filePath && I.writeFileSync(e.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const Oe = g.join(O.getPath("userData"), "data"), Ee = g.join(Oe, "torneios");
function pt(t) {
  return g.join(Ee, `${t}.json`);
}
function E(t) {
  const n = pt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function U(t) {
  I.writeFileSync(pt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function gt(t) {
  return [...t].sort((n, e) => {
    if (n.pesoKg !== e.pesoKg) return e.pesoKg - n.pesoKg;
    const o = (/* @__PURE__ */ new Date()).getFullYear() - n.anoNascimento, r = (/* @__PURE__ */ new Date()).getFullYear() - e.anoNascimento;
    return o !== r ? r - o : n.nome.localeCompare(e.nome);
  });
}
function ye(t) {
  const n = gt(t), e = n.length;
  if (e <= 2) return n;
  const o = Math.ceil(e / 2), r = Array.from({ length: o }, (i, l) => l), a = Array.from({ length: e - o }, (i, l) => l + o);
  for (const i of [r, a]) {
    const l = /* @__PURE__ */ new Set();
    for (const s of i) {
      const d = n[s].equipe;
      if (d) {
        if (l.has(d)) {
          const c = i === r ? a : r;
          for (const w of c) {
            const h = n[w].equipe;
            if (h !== d && !l.has(h)) {
              [n[s], n[w]] = [n[w], n[s]];
              break;
            }
          }
        }
        l.add(n[s].equipe);
      }
    }
  }
  return n;
}
function vt(t) {
  const n = gt(t), e = n.slice(0, 8), o = n.slice(8, 16);
  for (const r of [e, o]) {
    const a = /* @__PURE__ */ new Map();
    r.forEach((i, l) => {
      if (i.equipe) {
        const s = a.get(i.equipe) ?? [];
        s.push(l), a.set(i.equipe, s);
      }
    });
    for (const [i, l] of a) {
      if (l.length < 2) continue;
      const s = r === e ? o : e;
      for (let d = 1; d < l.length; d++) {
        const c = s.findIndex((w) => w.equipe !== i);
        c >= 0 && ([r[l[d]], s[c]] = [s[c], r[l[d]]]);
      }
    }
  }
  return [...e, ...o];
}
const f = "tbd";
function u(t, n, e, o) {
  return { id: D.randomUUID(), ordem: t, rodada: n, atletaAId: e, atletaBId: o, status: "pending", vencedorId: null, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function Ne(t) {
  return [u(1, 1, t[0].id, t[1].id)];
}
function Be(t) {
  return [
    u(1, 1, t[0].id, t[1].id),
    u(2, 2, f, t[2].id),
    u(3, 3, f, f)
  ];
}
function Ce(t) {
  return [
    u(1, 1, t[0].id, t[3].id),
    u(2, 1, t[1].id, t[2].id),
    u(3, 2, f, f)
  ];
}
function _e(t) {
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
function Le(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, f);
  r.vencedorId = t[2].id, r.status = "wo";
  const a = u(e++, 1, t[3].id, t[4].id), i = u(e++, 1, t[5].id, f);
  i.vencedorId = t[5].id, i.status = "wo";
  const l = u(e++, 1, t[6].id, t[7].id), s = u(e++, 1, t[8].id, f);
  s.vencedorId = t[8].id, s.status = "wo", n.push(o, r, a, i, l, s);
  const d = u(e++, 2, f, t[2].id), c = u(e++, 2, f, t[5].id), w = u(e++, 2, f, t[8].id);
  n.push(d, c, w);
  const h = u(e++, 3, f, f), p = u(e++, 3, f, f);
  n.push(h, p);
  const v = u(e++, 4, f, f);
  return n.push(v), n;
}
function Te(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, f);
  i.vencedorId = t[6].id, i.status = "wo";
  const l = u(e++, 1, t[7].id, f);
  l.vencedorId = t[7].id, l.status = "wo";
  const s = u(e++, 1, t[8].id, f);
  s.vencedorId = t[8].id, s.status = "wo";
  const d = u(e++, 1, t[9].id, f);
  d.vencedorId = t[9].id, d.status = "wo";
  const c = u(e++, 1, t[10].id, f);
  c.vencedorId = t[10].id, c.status = "wo", n.push(o, r, a, i, l, s, d, c);
  const w = u(e++, 2, f, f), h = u(e++, 2, f, t[6].id), p = u(e++, 2, t[7].id, t[8].id), v = u(e++, 2, t[9].id, t[10].id);
  n.push(w, h, p, v);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const x = u(e++, 4, f, f);
  return n.push(x), n;
}
function Pe(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, f);
  l.vencedorId = t[8].id, l.status = "wo";
  const s = u(e++, 1, t[9].id, f);
  s.vencedorId = t[9].id, s.status = "wo";
  const d = u(e++, 1, t[10].id, f);
  d.vencedorId = t[10].id, d.status = "wo";
  const c = u(e++, 1, t[11].id, f);
  c.vencedorId = t[11].id, c.status = "wo", n.push(o, r, a, i, l, s, d, c);
  const w = u(e++, 2, f, f), h = u(e++, 2, f, f), p = u(e++, 2, t[8].id, t[9].id), v = u(e++, 2, t[10].id, t[11].id);
  n.push(w, h, p, v);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const x = u(e++, 4, f, f);
  return n.push(x), n;
}
function Fe(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, t[9].id), s = u(e++, 1, t[10].id, f);
  s.vencedorId = t[10].id, s.status = "wo";
  const d = u(e++, 1, t[11].id, f);
  d.vencedorId = t[11].id, d.status = "wo";
  const c = u(e++, 1, t[12].id, f);
  c.vencedorId = t[12].id, c.status = "wo", n.push(o, r, a, i, l, s, d, c);
  const w = u(e++, 2, f, f), h = u(e++, 2, f, f), p = u(e++, 2, f, t[10].id), v = u(e++, 2, t[11].id, t[12].id);
  n.push(w, h, p, v);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const x = u(e++, 4, f, f);
  return n.push(x), n;
}
function je(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, t[9].id), s = u(e++, 1, t[10].id, t[11].id), d = u(e++, 1, t[12].id, f);
  d.vencedorId = t[12].id, d.status = "wo";
  const c = u(e++, 1, t[13].id, f);
  c.vencedorId = t[13].id, c.status = "wo", n.push(o, r, a, i, l, s, d, c);
  const w = u(e++, 2, f, f), h = u(e++, 2, f, f), p = u(e++, 2, f, f), v = u(e++, 2, t[12].id, t[13].id);
  n.push(w, h, p, v);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const x = u(e++, 4, f, f);
  return n.push(x), n;
}
function Re(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, t[9].id), s = u(e++, 1, t[10].id, t[11].id), d = u(e++, 1, t[12].id, t[13].id), c = u(e++, 1, t[14].id, f);
  c.vencedorId = t[14].id, c.status = "wo", n.push(o, r, a, i, l, s, d, c);
  const w = u(e++, 2, f, f), h = u(e++, 2, f, f), p = u(e++, 2, f, f), v = u(e++, 2, f, t[14].id);
  n.push(w, h, p, v);
  const S = u(e++, 3, f, f), b = u(e++, 3, f, f);
  n.push(S, b);
  const x = u(e++, 4, f, f);
  return n.push(x), n;
}
function $e(t) {
  const n = [];
  let e = 1;
  const o = u(e++, 1, t[0].id, t[1].id), r = u(e++, 1, t[2].id, t[3].id), a = u(e++, 1, t[4].id, t[5].id), i = u(e++, 1, t[6].id, t[7].id), l = u(e++, 1, t[8].id, f);
  l.vencedorId = t[8].id, l.status = "wo";
  const s = u(e++, 1, t[9].id, f);
  s.vencedorId = t[9].id, s.status = "wo", n.push(o, r, a, i, l, s);
  const d = u(e++, 2, f, f), c = u(e++, 2, f, f), w = u(e++, 2, f, f), h = u(e++, 2, t[8].id, t[9].id);
  n.push(d, c, w, h);
  const p = u(e++, 3, f, f), v = u(e++, 3, f, f);
  n.push(p, v);
  const S = u(e++, 4, f, f);
  return n.push(S), n;
}
function ze(t) {
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
function Me(t) {
  return t <= 2 ? 1 : t === 3 ? 3 : t <= 4 ? 2 : Math.ceil(Math.log2(t));
}
function Je(t) {
  const n = t.length, e = Math.ceil(Math.log2(n)), o = [];
  let r = 1;
  const a = [];
  for (let s = 0; s < n; s += 2)
    if (s + 1 < n) {
      const d = u(r++, 1, t[s].id, t[s + 1].id);
      o.push(d), a.push(d.id);
    } else {
      const d = u(r++, 1, t[s].id, f);
      d.vencedorId = t[s].id, d.status = "wo", o.push(d), a.push(t[s].id);
    }
  let i = a, l = 2;
  for (; l <= e; ) {
    const s = [];
    for (let d = 0; d < i.length; d += 2)
      if (d + 1 < i.length) {
        const c = u(r++, l, f, f);
        o.push(c), s.push(c.id);
      } else
        s.push(i[d]);
    i = s, l++;
  }
  for (let s = 1; s < e; s++) {
    const d = o.filter((h) => h.rodada === s), c = o.filter((h) => h.rodada === s + 1);
    if (c.length === 0) continue;
    const w = d.length / c.length;
    if (Number.isInteger(w))
      for (let h = 0; h < d.length; h++) {
        const p = d[h];
        if (p.status !== "wo" || !p.vencedorId) continue;
        const v = Math.floor(h / w), S = h % w;
        if (v >= c.length) continue;
        const b = c[v];
        S === 0 && (b.atletaAId === "tbd" || b.atletaAId === "") ? b.atletaAId = p.vencedorId : S === 1 && (b.atletaBId === "tbd" || b.atletaBId === "") && (b.atletaBId = p.vencedorId);
      }
  }
  return o;
}
function qe(t) {
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
function St(t) {
  switch (t.length) {
    case 2:
      return Ne(t);
    case 3:
      return Be(t);
    case 4:
      return Ce(t);
    case 5:
      return _e(t);
    case 6:
      return ze(t);
    case 9:
      return Le(t);
    case 10:
      return $e(t);
    case 11:
      return Te(t);
    case 12:
      return Pe(t);
    case 13:
      return Fe(t);
    case 14:
      return je(t);
    case 15:
      return Re(t);
    case 16:
      return qe(t);
    default:
      if (t.length >= 7 && t.length <= 15) return Je(t);
      throw new Error("Número inválido de atletas");
  }
}
const ut = {
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
function Ue(t) {
  const n = [...t];
  for (let e = n.length - 1; e > 0; e--) {
    const o = Math.floor(Math.random() * (e + 1));
    [n[e], n[o]] = [n[o], n[e]];
  }
  return n;
}
function bt(t, n, e) {
  if (n.length < 2 || n.length > 16)
    throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
  const o = Ue(n), r = o.length === 16 ? vt(o) : ye(o), a = St(r);
  return {
    id: D.randomUUID(),
    categoriaId: t,
    faixa: e,
    lutas: a,
    posicoesAtletas: r.map((i) => i.id),
    arbitroId: null,
    totalAtletas: r.length,
    totalLutas: a.length,
    totalRodadas: Me(r.length),
    status: "gerada",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function ke(t) {
  const n = t.chaves ?? [], e = (t.arbitros ?? []).filter((a) => a.deletedAt == null);
  if (n.length === 0 || e.length === 0) return;
  for (const a of e)
    a.chaveIds = [];
  const o = n.map((a) => {
    const i = a.posicoesAtletas.map((s) => (t.atletas ?? []).find((d) => d.id === s)).filter((s) => s !== void 0), l = Math.max(...i.map((s) => ut[s.faixa] ?? 0), 0);
    return { chave: a, maxLevel: l };
  });
  o.sort((a, i) => i.maxLevel - a.maxLevel);
  const r = /* @__PURE__ */ new Map();
  for (const a of e) r.set(a.id, 0);
  for (const { chave: a, maxLevel: i } of o) {
    const l = e.filter((s) => (ut[s.faixa] ?? 0) >= i).sort((s, d) => (r.get(s.id) ?? 0) - (r.get(d.id) ?? 0))[0];
    l && (a.arbitroId = l.id, r.set(l.id, (r.get(l.id) ?? 0) + 1), l.chaveIds.includes(a.id) || l.chaveIds.push(a.id));
  }
}
function He(t, n) {
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
function We(t, n = 16, e, o) {
  const r = E(t);
  let a = (r.atletas ?? []).filter((h) => h.deletedAt == null);
  e && e.length > 0 && (a = a.filter((h) => e.includes(h.faixa))), o && o.length > 0 && (a = a.filter((h) => o.includes(h.categoria))), r.chaves = [];
  const i = [], l = /* @__PURE__ */ new Map();
  for (const h of a) {
    if (!h.categoria) {
      i.push(h.nome);
      continue;
    }
    const p = h.categoria, v = l.get(p) ?? [];
    v.push(h), l.set(p, v);
  }
  const s = [], d = [], c = [];
  for (const [h, p] of l) {
    if (p.length === 0) continue;
    if (p.length === 1) {
      d.push(p[0]), c.push({
        categoriaId: h,
        totalAtletas: 1,
        chavesGeradas: 0,
        atletasIgnorados: [...i]
      });
      continue;
    }
    const v = He(p, n);
    let S = 0;
    for (const b of v) {
      if (b.length === 1) {
        d.push(b[0]);
        continue;
      }
      s.push(bt(h, b)), S++;
    }
    c.push({
      categoriaId: h,
      totalAtletas: p.length,
      chavesGeradas: S,
      atletasIgnorados: [...i]
    });
  }
  r.chaves = s, ke(r);
  const w = /* @__PURE__ */ new Set();
  for (const h of s)
    for (const p of h.posicoesAtletas)
      w.add(p);
  for (const h of r.atletas ?? [])
    h.emChave = w.has(h.id);
  return r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), U(r), { chaves: s, metadados: c, atletasSemChave: d };
}
function Ve(t) {
  var r, a, i;
  const n = t.length;
  if (n < 4) return;
  const e = n === 4 ? [0, 3] : n === 5 ? [0, 1, 2] : n === 6 ? [0, 1, 2] : n === 9 ? [0, 1, 2, 3, 4] : n === 10 ? [0, 1, 2, 3, 4] : n === 11 ? [0, 1, 2, 3, 4, 5] : n === 12 ? [0, 1, 2, 3, 4, 5] : n === 13 ? [0, 1, 2, 3, 4, 5] : n === 14 ? [0, 1, 2, 3, 4, 5] : n === 15 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1], o = n === 4 ? [1, 2] : n === 5 ? [3, 4] : n === 6 ? [3, 4, 5] : n === 9 ? [5, 6, 7, 8] : n === 10 ? [5, 6, 7, 8, 9] : n === 11 ? [6, 7, 8, 9, 10] : n === 12 ? [6, 7, 8, 9, 10, 11] : n === 13 ? [6, 7, 8, 9, 10, 11, 12] : n === 14 ? [6, 7, 8, 9, 10, 11, 12, 13] : n === 15 ? [7, 8, 9, 10, 11, 12, 13, 14] : [2, 3, 4];
  for (const l of [e, o]) {
    const s = /* @__PURE__ */ new Set();
    for (const d of l) {
      const c = (r = t[d]) == null ? void 0 : r.equipe;
      if (c) {
        if (s.has(c)) {
          const w = l === e ? o : e;
          for (const h of w)
            if (((a = t[h]) == null ? void 0 : a.equipe) !== c) {
              [t[d], t[h]] = [t[h], t[d]];
              break;
            }
        }
        (i = t[d]) != null && i.equipe && s.add(t[d].equipe);
      }
    }
  }
}
function Ge(t, n) {
  const e = E(t), o = e.chaves ?? [], r = o.findIndex((s) => s.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = o[r], i = [...a.posicoesAtletas];
  for (let s = i.length - 1; s > 0; s--) {
    const d = Math.floor(Math.random() * (s + 1));
    [i[s], i[d]] = [i[d], i[s]];
  }
  const l = i.map((s) => (e.atletas ?? []).find((d) => d.id === s)).filter((s) => s !== void 0);
  if (l.length === 16) {
    const s = vt(l);
    a.posicoesAtletas = s.map((d) => d.id);
  } else
    Ve(l), a.posicoesAtletas = l.map((s) => s.id);
  a.lutas = St(l), a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o[r] = a, e.chaves = o;
  for (const s of e.atletas ?? [])
    a.posicoesAtletas.includes(s.id) && (s.emChave = !0);
  return e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), U(e), a;
}
function Ke(t, n) {
  const e = E(t), o = e.chaves ?? [], r = o.findIndex((l) => l.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = o[r], i = a.arbitroId;
  if (i) {
    const l = (e.arbitros ?? []).find((s) => s.id === i);
    l && (l.chaveIds = l.chaveIds.filter((s) => s !== n.chaveId));
  }
  if (n.arbitroId) {
    const l = (e.arbitros ?? []).find((s) => s.id === n.arbitroId);
    if (!l) throw new Error("Árbitro não encontrado no torneio.");
    if (l.deletedAt != null) throw new Error("Árbitro deletado não pode ser atribuído a uma chave.");
    l.chaveIds.includes(n.chaveId) || l.chaveIds.push(n.chaveId);
  }
  return a.arbitroId = n.arbitroId, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o[r] = a, e.chaves = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), U(e), a;
}
async function Ye() {
  const t = await T.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return t.canceled || t.filePaths.length === 0 ? null : t.filePaths[0];
}
function Qe(t, n) {
  const e = I.readFileSync(n, "utf-8"), o = JSON.parse(e);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de chaves.");
  const r = E(t), a = (/* @__PURE__ */ new Date()).toISOString(), i = o.map((s) => {
    if (!s.categoriaId || !Array.isArray(s.lutas))
      throw new Error("Estrutura de chave inválida no arquivo.");
    const d = s.lutas.map((c) => ({
      ...c,
      updatedAt: c.updatedAt ?? a
    }));
    return {
      ...s,
      id: s.id || D.randomUUID(),
      lutas: d,
      updatedAt: s.updatedAt ?? a
    };
  });
  r.chaves = i;
  const l = /* @__PURE__ */ new Set();
  for (const s of i)
    for (const d of s.posicoesAtletas)
      l.add(d);
  for (const s of r.atletas ?? [])
    s.emChave = l.has(s.id);
  return r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), U(r), { imported: o.length };
}
async function Ze(t) {
  const n = E(t), e = n.chaves ?? [], o = await T.showSaveDialog({
    title: "Exportar Chaves",
    defaultPath: `${(n.nome || "torneio").replace(/[^a-zA-Z0-9]/g, "_")}_chaves.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !o.canceled && o.filePath && I.writeFileSync(o.filePath, JSON.stringify(e, null, 2), "utf-8");
}
function Xe(t) {
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
function X(t) {
  const n = (t.lutas ?? []).map(Xe);
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
function tn(t, n) {
  const e = E(t), r = ot(t).find((i) => i.id === n);
  if (!r) return [];
  const a = new Set(r.arbitroIds);
  return (e.chaves ?? []).map((i) => X(i)).filter((i) => i.arbitroId && a.has(i.arbitroId));
}
function tt(t, n, e) {
  for (const o of t.lutas)
    o.rodada <= n || (o.atletaAId === e && (o.atletaAId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), tt(t, o.rodada, e)), o.atletaBId === e && (o.atletaBId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), tt(t, o.rodada, e)));
}
function en(t, n) {
  const e = t.lutas.filter((a) => a.rodada === n.rodada), o = e.indexOf(n);
  if (o < 0) return;
  let r = n.rodada + 1;
  for (; r <= (t.totalRodadas || 3); ) {
    const a = t.lutas.filter((c) => c.rodada === r);
    if (a.length === 0) return;
    const i = e.length / a.length, l = Math.floor(o / i);
    if (l >= a.length) return;
    const s = a[l], d = Math.floor(o % i);
    if (d === 0 && (s.atletaAId === "tbd" || s.atletaAId === "")) {
      s.atletaAId = n.vencedorId;
      return;
    }
    if (d === 1 && (s.atletaBId === "tbd" || s.atletaBId === "")) {
      s.atletaBId = n.vencedorId;
      return;
    }
    r++;
  }
}
function nn(t, n) {
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
function on(t, n) {
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
function rn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((d) => d.ordem === 7), r = t.lutas.find((d) => d.ordem === 8), a = t.lutas.find((d) => d.ordem === 9), i = t.lutas.find((d) => d.ordem === 10), l = t.lutas.find((d) => d.ordem === 11), s = t.lutas.find((d) => d.ordem === 12);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem === 6 ? a && (a.atletaBId = e) : n.ordem === 7 ? i && (i.atletaAId = e) : n.ordem === 8 ? i && (i.atletaBId = e) : n.ordem === 9 ? (l && (l.atletaAId = e, l.vencedorId = e, l.status = "wo"), s && (s.atletaBId = e)) : n.ordem === 10 && s && (s.atletaAId = e);
}
function an(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((c) => c.ordem === 7), r = t.lutas.find((c) => c.ordem === 8), a = t.lutas.find((c) => c.ordem === 9), i = t.lutas.find((c) => c.ordem === 10), l = t.lutas.find((c) => c.ordem === 11), s = t.lutas.find((c) => c.ordem === 12), d = t.lutas.find((c) => c.ordem === 13);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? (r && (r.atletaAId = e, r.vencedorId = e, r.status = "wo"), l && (l.atletaBId = e)) : n.ordem === 4 ? (a && (a.atletaAId = e, a.vencedorId = e, a.status = "wo"), s && (s.atletaAId = e)) : n.ordem === 5 ? i && (i.atletaAId = e) : n.ordem === 6 ? i && (i.atletaBId = e) : n.ordem === 7 ? l && (l.atletaAId = e) : n.ordem === 10 ? s && (s.atletaBId = e) : n.ordem === 11 ? d && (d.atletaAId = e) : n.ordem === 12 && d && (d.atletaBId = e);
}
function sn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((s) => s.ordem === 9), r = t.lutas.find((s) => s.ordem === 10), a = t.lutas.find((s) => s.ordem === 13), i = t.lutas.find((s) => s.ordem === 14), l = t.lutas.find((s) => s.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem >= 4 && n.ordem <= 8 || (n.ordem === 9 ? a && (a.atletaAId = e) : n.ordem === 10 ? a && (a.atletaBId = e) : n.ordem === 11 ? i && (i.atletaAId = e) : n.ordem === 12 ? i && (i.atletaBId = e) : n.ordem === 13 ? l && (l.atletaAId = e) : n.ordem === 14 && l && (l.atletaBId = e));
}
function dn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((s) => s.ordem === 9), r = t.lutas.find((s) => s.ordem === 10), a = t.lutas.find((s) => s.ordem === 13), i = t.lutas.find((s) => s.ordem === 14), l = t.lutas.find((s) => s.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem >= 5 && n.ordem <= 8 || (n.ordem === 9 ? a && (a.atletaAId = e) : n.ordem === 10 ? a && (a.atletaBId = e) : n.ordem === 11 ? i && (i.atletaAId = e) : n.ordem === 12 ? i && (i.atletaBId = e) : n.ordem === 13 ? l && (l.atletaAId = e) : n.ordem === 14 && l && (l.atletaBId = e));
}
function ln(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((d) => d.ordem === 9), r = t.lutas.find((d) => d.ordem === 10), a = t.lutas.find((d) => d.ordem === 11), i = t.lutas.find((d) => d.ordem === 13), l = t.lutas.find((d) => d.ordem === 14), s = t.lutas.find((d) => d.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem >= 6 && n.ordem <= 8 || (n.ordem === 9 ? i && (i.atletaAId = e) : n.ordem === 10 ? i && (i.atletaBId = e) : n.ordem === 11 ? l && (l.atletaAId = e) : n.ordem === 12 ? l && (l.atletaBId = e) : n.ordem === 13 ? s && (s.atletaAId = e) : n.ordem === 14 && s && (s.atletaBId = e));
}
function cn(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((d) => d.ordem === 9), r = t.lutas.find((d) => d.ordem === 10), a = t.lutas.find((d) => d.ordem === 11), i = t.lutas.find((d) => d.ordem === 13), l = t.lutas.find((d) => d.ordem === 14), s = t.lutas.find((d) => d.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem === 6 ? a && (a.atletaBId = e) : n.ordem >= 7 && n.ordem <= 8 || (n.ordem === 9 ? i && (i.atletaAId = e) : n.ordem === 10 ? i && (i.atletaBId = e) : n.ordem === 11 ? l && (l.atletaAId = e) : n.ordem === 12 ? l && (l.atletaBId = e) : n.ordem === 13 ? s && (s.atletaAId = e) : n.ordem === 14 && s && (s.atletaBId = e));
}
function un(t, n) {
  const e = n.vencedorId;
  if (!e) return;
  const o = t.lutas.find((c) => c.ordem === 9), r = t.lutas.find((c) => c.ordem === 10), a = t.lutas.find((c) => c.ordem === 11), i = t.lutas.find((c) => c.ordem === 12), l = t.lutas.find((c) => c.ordem === 13), s = t.lutas.find((c) => c.ordem === 14), d = t.lutas.find((c) => c.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = e) : n.ordem === 2 ? o && (o.atletaBId = e) : n.ordem === 3 ? r && (r.atletaAId = e) : n.ordem === 4 ? r && (r.atletaBId = e) : n.ordem === 5 ? a && (a.atletaAId = e) : n.ordem === 6 ? a && (a.atletaBId = e) : n.ordem === 7 ? i && (i.atletaAId = e) : n.ordem === 8 || (n.ordem === 9 ? l && (l.atletaAId = e) : n.ordem === 10 ? l && (l.atletaBId = e) : n.ordem === 11 ? s && (s.atletaAId = e) : n.ordem === 12 ? s && (s.atletaBId = e) : n.ordem === 13 ? d && (d.atletaAId = e) : n.ordem === 14 && d && (d.atletaBId = e));
}
function fn(t, n) {
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
function mn(t, n) {
  const e = E(t), o = [...e.chaves ?? []], r = o.findIndex((d) => d.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = JSON.parse(JSON.stringify(o[r])), i = a.lutas.find((d) => d.id === n.lutaId);
  if (!i) throw new Error("Luta não encontrada");
  const l = i.vencedorId;
  if (l && l !== n.vencedorId && tt(a, i.rodada, l), i.vencedorId = n.vencedorId, i.status = n.status === "wo" ? "wo" : "completed", i.placarA = n.placarA, i.placarB = n.placarB, i.finalizacao = n.finalizacao ?? !1, i.desclassificacao = n.desclassificacao ?? !1, i.desempateArbitro = n.desempateArbitro ?? !1, i.horarioInicio = n.horarioInicio ?? i.horarioInicio, i.horarioTermino = n.horarioTermino ?? i.horarioTermino, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), n.desclassificacao && i.vencedorId ? i.desclassificadoId = i.atletaAId === i.vencedorId ? i.atletaBId : i.atletaAId : i.desclassificadoId = void 0, a.totalAtletas === 3) {
    const d = a.lutas.find((w) => w.rodada === 2), c = a.lutas.find((w) => w.rodada === 3);
    if (i.rodada === 1) {
      const w = i.vencedorId === i.atletaAId ? i.atletaBId : i.atletaAId;
      n.desclassificacao ? d && c && (d.atletaAId = d.atletaBId, d.vencedorId = d.atletaBId, d.status = "wo", c.atletaAId = i.vencedorId, c.atletaBId = d.atletaBId, c.vencedorId = null, c.status = "pending") : (d && (d.atletaAId = w, d.vencedorId = null, d.status = "pending"), c && (c.atletaAId = i.vencedorId, c.atletaBId = "tbd", c.vencedorId = null, c.status = "pending"));
    } else i.rodada === 2 && c && c.atletaBId === "tbd" && (c.atletaBId = i.vencedorId, c.status = "pending");
  } else a.totalAtletas === 5 ? nn(a, i) : a.totalAtletas === 6 ? on(a, i) : a.totalAtletas === 9 ? rn(a, i) : a.totalAtletas === 10 ? an(a, i) : a.totalAtletas === 11 ? sn(a, i) : a.totalAtletas === 12 ? dn(a, i) : a.totalAtletas === 13 ? ln(a, i) : a.totalAtletas === 14 ? cn(a, i) : a.totalAtletas === 15 ? un(a, i) : a.totalAtletas === 16 ? fn(a, i) : en(a, i);
  const s = (/* @__PURE__ */ new Date()).toISOString();
  for (const d of a.lutas)
    d.updatedAt = s;
  return a.updatedAt = s, o[r] = a, e.chaves = o, e.updatedAt = s, U(e), a;
}
function hn() {
  m.handle("gerar-todas-chaves", (t, n, e, o) => {
    const r = A();
    if (!r) throw new Error("Nenhum torneio ativo");
    const a = n && n >= 2 && n <= 16 ? n : 16;
    return We(r, a, e, o);
  }), m.handle("gerar-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const o = E(e);
    let r, a = !1;
    if (n.atletaIds && n.atletaIds.length > 0) {
      if (a = !0, r = (o.atletas ?? []).filter(
        (h) => h.deletedAt == null && n.atletaIds.includes(h.id)
      ), r.length !== n.atletaIds.length)
        throw new Error("Um ou mais atletas selecionados não foram encontrados.");
      const d = o.chaves ?? [], c = /* @__PURE__ */ new Set();
      for (const h of d)
        for (const p of h.posicoesAtletas)
          c.add(p);
      const w = r.filter((h) => c.has(h.id));
      if (w.length > 0)
        throw new Error(`Atleta(s) já em outra chave: ${w.map((h) => h.nome).join(", ")}`);
    } else
      r = (o.atletas ?? []).filter(
        (d) => d.deletedAt == null && d.categoria === n.categoriaId && (!n.faixa || d.faixa === n.faixa)
      );
    if (r.length < 2 || r.length > 16)
      throw new Error("A chave precisa ter entre 2 e 16 atletas.");
    const i = o.chaves ?? [];
    if (!a && i.some((d) => d.categoriaId === n.categoriaId && (!n.faixa || d.faixa === n.faixa)))
      throw new Error("Chave já existe para esta categoria/faixa.");
    const l = a ? "manual" : n.categoriaId, s = bt(l, r, n.faixa);
    a && n.nome && (s.nome = n.nome), o.chaves = [...i, s];
    for (const d of o.atletas ?? [])
      s.posicoesAtletas.includes(d.id) && (d.emChave = !0);
    return o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), U(o), s;
  }), m.handle("load-chaves", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return (E(t).chaves ?? []).map((e) => X(e));
  }), m.handle("load-chave-por-categoria", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return (E(e).chaves ?? []).map((r) => X(r)).find((r) => r.categoriaId === n) ?? null;
  }), m.handle("randomizar-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ge(e, n);
  }), m.handle("atribuir-arbitro-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ke(e, n);
  }), m.handle("import-chaves", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await Ye();
    return n ? Qe(t, n) : { imported: 0 };
  }), m.handle("export-chaves", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Ze(t);
  }), m.handle("load-chaves-por-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return tn(e, n);
  }), m.handle("registrar-resultado", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return mn(e, n);
  }), m.handle("delete-chave", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const o = E(e), r = o.chaves ?? [], a = r.findIndex((s) => s.id === n);
    if (a === -1) throw new Error("Chave não encontrada");
    const i = r[a], l = new Set(i.posicoesAtletas);
    for (const s of o.atletas ?? [])
      l.has(s.id) && (s.emChave = !1);
    r.splice(a, 1), o.chaves = r, o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), U(o);
  });
}
const In = g.join(O.getPath("userData"), "data"), An = g.join(In, "torneios");
function Dt(t) {
  return g.join(An, `${t}.json`);
}
function j(t) {
  const n = Dt(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function z(t) {
  I.writeFileSync(Dt(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function wn(t) {
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
function M(t) {
  return (j(t).lutasCasadas ?? []).map((e) => wn(e));
}
function xt(t) {
  return M(t).filter((n) => n.deletedAt == null);
}
function pn(t) {
  return M(t).filter((n) => n.deletedAt != null);
}
function gn(t, n) {
  return xt(t).filter((e) => e.areaId === n);
}
function vn(t, n) {
  if (n.atletaAId === n.atletaBId)
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  const e = j(t), o = M(t), r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    id: D.randomUUID(),
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
  return o.push(a), e.lutasCasadas = o, e.updatedAt = r, z(e), a;
}
function Sn(t, n) {
  if (n.atletaAId === n.atletaBId)
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  const e = j(t), o = M(t), r = o.findIndex((l) => l.id === n.id);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString(), i = {
    ...n,
    tag: "luta-casada",
    updatedAt: a
  };
  return o[r] = i, e.lutasCasadas = o, e.updatedAt = a, z(e), i;
}
function bn(t, n) {
  const e = j(t), o = M(t), r = o.findIndex((i) => i.id === n);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString();
  o[r].deletedAt = a, o[r].updatedAt = a, e.lutasCasadas = o, e.updatedAt = a, z(e);
}
function Dn(t, n) {
  const e = j(t), o = M(t), r = (/* @__PURE__ */ new Date()).toISOString();
  for (const a of o)
    n.includes(a.id) && (a.deletedAt = r, a.updatedAt = r);
  e.lutasCasadas = o, e.updatedAt = r, z(e);
}
function xn(t, n) {
  const e = j(t);
  e.lutasCasadas = (e.lutasCasadas ?? []).filter((o) => o.id !== n), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), z(e);
}
function On(t, n) {
  const e = j(t);
  e.lutasCasadas = (e.lutasCasadas ?? []).filter((o) => !n.includes(o.id)), e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), z(e);
}
function En(t, n) {
  const e = j(t), o = M(t), r = o.findIndex((i) => i.id === n);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString();
  o[r].deletedAt = null, o[r].updatedAt = a, e.lutasCasadas = o, e.updatedAt = a, z(e);
}
function yn(t, n) {
  const e = j(t), o = M(t), r = (/* @__PURE__ */ new Date()).toISOString();
  for (const a of o)
    n.includes(a.id) && (a.deletedAt = null, a.updatedAt = r);
  e.lutasCasadas = o, e.updatedAt = r, z(e);
}
const Nn = g.join(O.getPath("userData"), "data"), Bn = g.join(Nn, "torneios");
function Ot(t) {
  return g.join(Bn, `${t}.json`);
}
function G(t) {
  const n = Ot(t);
  if (!I.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(I.readFileSync(n, "utf-8"));
}
function Z(t) {
  I.writeFileSync(Ot(t.id), JSON.stringify(t, null, 2), "utf-8");
}
function Cn(t) {
  const n = G(t);
  return {
    desabilitadas: n.categoriasDesabilitadas ?? [],
    customizadas: n.categoriasCustomizadas ?? []
  };
}
function _n(t, n) {
  const e = G(t), o = e.categoriasDesabilitadas ?? [], r = o.indexOf(n);
  return r === -1 ? o.push(n) : o.splice(r, 1), e.categoriasDesabilitadas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), Z(e), o;
}
function Ln(t, n) {
  const e = G(t), o = e.categoriasCustomizadas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    ...n,
    id: `custom-${D.randomUUID()}`,
    createdAt: r,
    updatedAt: r
  };
  return o.push(a), e.categoriasCustomizadas = o, e.updatedAt = r, Z(e), a;
}
function Tn(t, n) {
  const e = G(t), o = e.categoriasCustomizadas ?? [], r = o.findIndex((i) => i.id === n.id);
  if (r === -1) throw new Error("Categoria customizada não encontrada");
  const a = o[r];
  return o[r] = {
    ...n,
    createdAt: a.createdAt,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, e.categoriasCustomizadas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), Z(e), o[r];
}
function Pn(t, n) {
  const e = G(t), o = e.categoriasCustomizadas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Categoria customizada não encontrada");
  o.splice(r, 1), e.categoriasCustomizadas = o, e.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), Z(e);
}
const at = process.env.MASTER_PASSWORD_HASH || "f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4", Fn = "activation.json", jn = 1;
function it() {
  return g.join(O.getPath("userData"), Fn);
}
function Et() {
  try {
    const n = st("wmic csproduct get uuid", {
      encoding: "utf-8",
      timeout: 3e3,
      windowsHide: !0
    }).split(`
`).map((e) => e.trim()).filter(Boolean);
    if (n[1]) return n[1];
  } catch {
  }
  try {
    const n = st(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { encoding: "utf-8", timeout: 3e3, windowsHide: !0 }
    ).match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
    if (n != null && n[1]) return n[1];
  } catch {
  }
  return D.randomUUID();
}
function yt(t) {
  return t ? /* @__PURE__ */ new Date() > new Date(t) : !0;
}
function Rn(t) {
  const n = new Date(t).getTime() - Date.now();
  return Math.max(0, Math.ceil(n / 864e5));
}
function $n() {
  try {
    const t = it();
    if (!I.existsSync(t)) return !1;
    const n = JSON.parse(I.readFileSync(t, "utf-8"));
    if (yt(n.expiresAt)) return !1;
    const e = Et(), o = D.createHmac("sha256", at).update(e).digest("hex");
    return n.token === o;
  } catch {
    return !1;
  }
}
function zn() {
  try {
    const t = it();
    if (!I.existsSync(t))
      return { activated: !1, activatedAt: null, expiresAt: null, daysRemaining: null };
    const n = JSON.parse(I.readFileSync(t, "utf-8"));
    return yt(n.expiresAt) ? {
      activated: !1,
      activatedAt: n.activatedAt ?? null,
      expiresAt: n.expiresAt ?? null,
      daysRemaining: 0
    } : {
      activated: !0,
      activatedAt: n.activatedAt ?? null,
      expiresAt: n.expiresAt,
      daysRemaining: Rn(n.expiresAt)
    };
  } catch {
    return { activated: !1, activatedAt: null, expiresAt: null, daysRemaining: null };
  }
}
function Mn(t) {
  return D.createHash("sha256").update(t).digest("hex") === at;
}
function Jn() {
  try {
    const t = Et(), n = D.createHmac("sha256", at).update(t).digest("hex"), e = /* @__PURE__ */ new Date(), o = new Date(e);
    o.setFullYear(o.getFullYear() + jn);
    const r = it();
    return I.writeFileSync(
      r,
      JSON.stringify({ token: n, activatedAt: e.toISOString(), expiresAt: o.toISOString() }, null, 2),
      "utf-8"
    ), !0;
  } catch {
    return !1;
  }
}
const Nt = g.dirname(Lt(import.meta.url));
process.env.APP_ROOT = g.join(Nt, "..");
const et = process.env.VITE_DEV_SERVER_URL, to = g.join(process.env.APP_ROOT, "dist-electron"), Bt = g.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = et ? g.join(process.env.APP_ROOT, "public") : Bt;
let L;
function Ct() {
  L = new ft({
    icon: g.join(process.env.VITE_PUBLIC, "favicon.svg"),
    webPreferences: {
      preload: g.join(Nt, "preload.mjs")
    }
  }), L.maximize(), L.webContents.on("did-finish-load", () => {
    L == null || L.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), et ? L.loadURL(et) : L.loadFile(g.join(Bt, "index.html"));
}
O.on("window-all-closed", () => {
  process.platform !== "darwin" && (O.quit(), L = null);
});
O.on("activate", () => {
  ft.getAllWindows().length === 0 && Ct();
});
function qn() {
  m.handle("load-athletes", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ht(t);
  }), m.handle("save-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return qt(e, n);
  }), m.handle("update-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ut(e, n);
  }), m.handle("delete-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return kt(e, n);
  }), m.handle("delete-athletes", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ht(e, n);
  }), m.handle("restore-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Wt(e, n);
  }), m.handle("load-deleted-athletes", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Vt(t);
  }), m.handle("permanently-delete-athlete", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Gt(e, n);
  }), m.handle("permanently-delete-athletes", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Kt(e, n);
  }), m.handle("import-athletes", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await Qt();
    return n ? Yt(t, n) : { imported: 0, skipped: 0 };
  }), m.handle("export-athletes", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Zt(t);
  });
}
function Un() {
  m.handle("save-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ee(e, n);
  }), m.handle("update-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ne(e, n);
  }), m.handle("delete-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return oe(e, n);
  }), m.handle("delete-arbitros", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return re(e, n);
  }), m.handle("restore-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ae(e, n);
  }), m.handle("load-deleted-arbitros", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ie(t);
  }), m.handle("permanently-delete-arbitro", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return se(e, n);
  }), m.handle("permanently-delete-arbitros", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return de(e, n);
  }), m.handle("load-arbitros", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return At(t);
  }), m.handle("import-arbitros", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await le();
    return n ? ce(t, n) : { imported: 0, skipped: 0 };
  }), m.handle("export-arbitros", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ue(t);
  });
}
function kn() {
  m.handle("load-areas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ot(t);
  }), m.handle("save-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return he(e, n);
  }), m.handle("update-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ie(e, n);
  }), m.handle("delete-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ae(e, n);
  }), m.handle("delete-areas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return we(e, n);
  }), m.handle("restore-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return pe(e, n);
  }), m.handle("load-deleted-areas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ge(t);
  }), m.handle("permanently-delete-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ve(e, n);
  }), m.handle("permanently-delete-areas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Se(e, n);
  }), m.handle("import-areas", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const n = await De();
    return n ? be(t, n) : { imported: 0, skipped: 0 };
  }), m.handle("export-areas", async () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return xe(t);
  });
}
function Hn() {
  m.handle("check-activation", () => $n()), m.handle("validate-password", (t, n) => Mn(n)), m.handle("activate-license", () => Jn()), m.handle("get-activation-info", () => zn());
}
function Wn() {
  m.handle("load-categorias", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Cn(t);
  }), m.handle("toggle-categoria", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return _n(e, n);
  }), m.handle("save-categoria-customizada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ln(e, n);
  }), m.handle("update-categoria-customizada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Tn(e, n);
  }), m.handle("delete-categoria-customizada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Pn(e, n);
  });
}
function Vn() {
  m.handle("load-lutas-casadas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return xt(t);
  }), m.handle("load-deleted-lutas-casadas", () => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return pn(t);
  }), m.handle("load-lutas-casadas-por-area", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return gn(e, n);
  }), m.handle("save-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return vn(e, n);
  }), m.handle("update-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Sn(e, n);
  }), m.handle("delete-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return bn(e, n);
  }), m.handle("delete-lutas-casadas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Dn(e, n);
  }), m.handle("permanently-delete-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return xn(e, n);
  }), m.handle("permanently-delete-lutas-casadas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return On(e, n);
  }), m.handle("restore-luta-casada", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return En(e, n);
  }), m.handle("restore-lutas-casadas", (t, n) => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return yn(e, n);
  });
}
O.whenReady().then(() => {
  zt(), qn(), Un(), hn(), kn(), Vn(), Wn(), Hn(), Ct();
});
export {
  to as MAIN_DIST,
  Bt as RENDERER_DIST,
  et as VITE_DEV_SERVER_URL
};
