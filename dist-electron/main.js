import { app as D, ipcMain as m, dialog as _, BrowserWindow as se } from "electron";
import { fileURLToPath as Ee } from "node:url";
import v from "node:path";
import h from "node:fs";
import y from "node:crypto";
import { execSync as Oe } from "node:child_process";
const k = v.join(D.getPath("userData"), "data"), U = v.join(k, "torneios"), M = v.join(k, "torneio-ativo.json");
function F() {
  h.existsSync(k) || h.mkdirSync(k, { recursive: !0 }), h.existsSync(U) || h.mkdirSync(U, { recursive: !0 });
}
function C(e) {
  return v.join(U, `${e}.json`);
}
function A() {
  if (!h.existsSync(M)) return null;
  try {
    const { id: e } = JSON.parse(h.readFileSync(M, "utf-8"));
    return e;
  } catch {
    return null;
  }
}
function V(e, n) {
  const t = /* @__PURE__ */ new Map();
  for (const s of e) t.set(s.id, s);
  const o = /* @__PURE__ */ new Map();
  for (const s of n) o.set(s.id, s);
  const r = [];
  let a = 0, i = 0, l = 0;
  for (const s of o.values()) {
    const c = t.get(s.id);
    c ? s.updatedAt > c.updatedAt ? (r.push(s), i += 1, c.deletedAt == null && s.deletedAt != null && (l += 1)) : r.push(c) : (r.push(s), a += 1);
  }
  let d = 0;
  for (const [s, c] of t)
    o.has(s) || (r.push(c), d += 1);
  return { merged: r, counters: { created: a, updated: i, kept: d, removed: l } };
}
function oe(e, n, t) {
  const o = /* @__PURE__ */ new Map();
  for (const s of e) o.set(s.id, s);
  const r = /* @__PURE__ */ new Map();
  for (const s of n) r.set(s.id, s);
  const a = [];
  let i = 0, l = 0;
  for (const s of r.values()) {
    const c = o.get(s.id);
    c ? t ? (a.push(s), l += 1) : a.push(c) : (a.push(s), i += 1);
  }
  let d = 0;
  for (const [s, c] of o)
    r.has(s) || (a.push(c), d += 1);
  return { merged: a, counters: { created: i, updated: l, kept: d, removed: 0 } };
}
function q(e) {
  const n = /* @__PURE__ */ new Set(), t = [];
  for (const o of e)
    n.has(o.id) || (n.add(o.id), t.push(o));
  return t;
}
function re(e) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...e,
    id: e.id || y.randomUUID(),
    createdAt: e.createdAt || n,
    updatedAt: e.updatedAt || n,
    nome: (e.nome || "").trim().toLowerCase(),
    equipe: (e.equipe || "").trim().toLowerCase(),
    deletedAt: e.deletedAt ?? null
  };
}
function ae(e) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...e,
    id: e.id || y.randomUUID(),
    createdAt: e.createdAt || n,
    updatedAt: e.updatedAt || n,
    nome: (e.nome || "").trim().toLowerCase(),
    equipe: (e.equipe || "").trim().toLowerCase(),
    chaveIds: e.chaveIds ?? [],
    deletedAt: e.deletedAt ?? null
  };
}
function ie(e) {
  const n = (/* @__PURE__ */ new Date()).toISOString();
  return {
    ...e,
    id: e.id || y.randomUUID(),
    createdAt: e.createdAt || n,
    updatedAt: e.updatedAt || n,
    nome: (e.nome || "").trim(),
    arbitroIds: Array.isArray(e.arbitroIds) ? e.arbitroIds.filter(Boolean) : [],
    deletedAt: e.deletedAt ?? null
  };
}
function Ne() {
  m.handle("create-tournament", (e, n) => {
    F();
    const t = {
      id: y.randomUUID(),
      nome: n.nome,
      data: n.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      atletas: []
    };
    return h.writeFileSync(C(t.id), JSON.stringify(t, null, 2), "utf-8"), t;
  }), m.handle("list-tournaments", () => (F(), h.readdirSync(U).filter((n) => n.endsWith(".json")).map((n) => {
    const t = h.readFileSync(v.join(U, n), "utf-8");
    return JSON.parse(t);
  }))), m.handle("start-tournament", (e, n) => {
    F(), h.writeFileSync(M, JSON.stringify({ id: n }), "utf-8");
    const t = C(n);
    if (h.existsSync(t)) {
      const o = JSON.parse(h.readFileSync(t, "utf-8"));
      return o.startedAt = (/* @__PURE__ */ new Date()).toISOString(), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), h.writeFileSync(t, JSON.stringify(o, null, 2), "utf-8"), o;
    }
    throw new Error("Torneio não encontrado");
  }), m.handle("get-active-tournament", () => {
    F();
    const e = A();
    if (!e) return null;
    const n = C(e);
    return h.existsSync(n) ? JSON.parse(h.readFileSync(n, "utf-8")) : null;
  }), m.handle("export-tournament", async (e, n) => {
    F();
    const t = C(n);
    if (!h.existsSync(t)) throw new Error("Torneio não encontrado");
    const o = JSON.parse(h.readFileSync(t, "utf-8")), r = o.nome || `Torneio ${o.data}`, a = await _.showSaveDialog({
      title: "Exportar Torneio",
      defaultPath: `${r.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    !a.canceled && a.filePath && h.copyFileSync(t, a.filePath);
  }), m.handle(
    "import-tournament",
    (e, n) => {
      if (F(), !n.id || !n.data)
        throw new Error("Estrutura inválida");
      const t = C(n.id), o = (/* @__PURE__ */ new Date()).toISOString(), r = h.existsSync(t) ? JSON.parse(h.readFileSync(t, "utf-8")) : null;
      if (!r) {
        const R = {
          ...n,
          createdAt: n.createdAt || o,
          updatedAt: n.updatedAt || o,
          atletas: q((n.atletas ?? []).map(($) => re($))),
          arbitros: q((n.arbitros ?? []).map(($) => ae($))),
          areas: q((n.areas ?? []).map(($) => ie($))),
          chaves: q(n.chaves ?? []),
          lutasCasadas: q(n.lutasCasadas ?? [])
        };
        return h.writeFileSync(t, JSON.stringify(R, null, 2), "utf-8"), { success: !0, merged: !1, created: 0, updated: 0, kept: 0, removed: 0 };
      }
      const a = (n.atletas ?? []).map((R) => re(R)), i = (n.arbitros ?? []).map((R) => ae(R)), l = (n.areas ?? []).map((R) => ie(R)), d = n.chaves ?? [], s = n.lutasCasadas ?? [], c = n.updatedAt > r.updatedAt, I = V(r.atletas ?? [], a), p = V(r.arbitros ?? [], i), w = V(r.areas ?? [], l), g = oe(r.chaves ?? [], d, c), S = oe(r.lutasCasadas ?? [], s, c), b = {
        created: I.counters.created + p.counters.created + w.counters.created + g.counters.created + S.counters.created,
        updated: I.counters.updated + p.counters.updated + w.counters.updated + g.counters.updated + S.counters.updated,
        kept: I.counters.kept + p.counters.kept + w.counters.kept + g.counters.kept + S.counters.kept,
        removed: I.counters.removed + p.counters.removed + w.counters.removed + g.counters.removed + S.counters.removed
      }, x = {
        id: r.id,
        nome: c ? n.nome : r.nome,
        data: c ? n.data : r.data,
        createdAt: r.createdAt,
        updatedAt: n.updatedAt > r.updatedAt ? n.updatedAt : r.updatedAt,
        startedAt: r.startedAt ?? n.startedAt,
        atletas: I.merged,
        arbitros: p.merged,
        areas: w.merged,
        chaves: g.merged,
        lutasCasadas: S.merged
      };
      return h.writeFileSync(t, JSON.stringify(x, null, 2), "utf-8"), { success: !0, merged: !0, ...b };
    }
  ), m.handle("update-tournament", (e, n) => {
    F();
    const t = C(n.id);
    if (!h.existsSync(t)) throw new Error("Torneio não encontrado");
    const o = {
      ...n,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return h.writeFileSync(t, JSON.stringify(o, null, 2), "utf-8"), o;
  }), m.handle("delete-tournament", (e, n) => {
    F();
    const t = C(n);
    if (!h.existsSync(t)) throw new Error("Torneio não encontrado");
    if (h.unlinkSync(t), h.existsSync(M))
      try {
        const { id: o } = JSON.parse(h.readFileSync(M, "utf-8"));
        o === n && h.unlinkSync(M);
      } catch {
      }
  }), m.handle("read-file", async (e, n) => h.readFileSync(n, "utf-8"));
}
const Be = [
  { peso: "galo", nome: "Galo", masculino: 57.5, feminino: 48.5 },
  { peso: "pluma", nome: "Pluma", masculino: 64, feminino: 53.5 },
  { peso: "pena", nome: "Pena", masculino: 70, feminino: 58.5 },
  { peso: "leve", nome: "Leve", masculino: 76, feminino: 64 },
  { peso: "medio", nome: "Médio", masculino: 82.3, feminino: 69 },
  { peso: "meio-pesado", nome: "Meio-Pesado", masculino: 88.3, feminino: 74 },
  { peso: "pesado", nome: "Pesado", masculino: 94.3, feminino: 79.3 },
  { peso: "super-pesado", nome: "Super Pesado", masculino: 97.5, feminino: null },
  { peso: "pesadissimo", nome: "Pesadíssimo", masculino: null, feminino: null }
], Le = {
  "pre-mirim": "Pré-Mirim",
  mirim: "Mirim",
  "infantil-a": "Infantil A",
  "infantil-b": "Infantil B",
  "infanto-juvenil-a": "Infanto-Juvenil A",
  "infanto-juvenil-b": "Infanto-Juvenil B"
}, _e = {
  "pre-mirim": { galo: 14.7, pluma: 17.9, pena: 20, leve: 24, medio: 26, "meio-pesado": 29, pesado: 31.2, "super-pesado": 33.2, pesadissimo: null },
  mirim: { galo: 21, pluma: 24, pena: 27, leve: 30.2, medio: 33.2, "meio-pesado": 36.2, pesado: 39.3, "super-pesado": 42.3, pesadissimo: null },
  "infantil-a": { galo: 27, pluma: 30.2, pena: 33.2, leve: 36.2, medio: 39.3, "meio-pesado": 42.3, pesado: 45.3, "super-pesado": 48.3, pesadissimo: null },
  "infantil-b": { galo: 36.2, pluma: 40.3, pena: 44.3, leve: 48.3, medio: 52.5, "meio-pesado": 56.5, pesado: 60.5, "super-pesado": 65, pesadissimo: null },
  "infanto-juvenil-a": { galo: 40.3, pluma: 44.3, pena: 48.3, leve: 52.5, medio: 56.5, "meio-pesado": 60.5, pesado: 65, "super-pesado": 69.5, pesadissimo: null },
  "infanto-juvenil-b": { galo: 48.3, pluma: 52.5, pena: 56.5, leve: 60.5, medio: 65, "meio-pesado": 69.5, pesado: 74, "super-pesado": 78.5, pesadissimo: null }
};
function Pe(e, n, t) {
  const o = _e[e];
  if (o)
    return o[t.peso] ?? null;
  const r = n === "masculino" ? t.masculino : t.feminino;
  return t.peso === "pesadissimo" && n === "feminino" ? null : r;
}
function Te() {
  const e = [
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
  ], n = ["masculino", "feminino"], t = [];
  for (const o of e) {
    const r = Le[o] || o.charAt(0).toUpperCase() + o.slice(1);
    for (const a of n) {
      const i = a === "masculino" ? "Masculino" : "Feminino";
      for (const l of Be) {
        const d = Pe(o, a, l);
        d !== void 0 && t.push({
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
  return t;
}
const le = Te(), Fe = {};
for (const e of le)
  Fe[e.id] = e.nome;
const je = v.join(D.getPath("userData"), "data"), Re = v.join(je, "torneios");
function ce(e) {
  return v.join(Re, `${e}.json`);
}
function O(e) {
  const n = ce(e);
  if (!h.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(h.readFileSync(n, "utf-8"));
}
function P(e) {
  h.writeFileSync(ce(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function ue(e) {
  const n = O(e), t = n.atletas ?? [];
  let o = !1;
  for (const r of t)
    r.id || (r.id = y.randomUUID(), o = !0), r.createdAt || (r.createdAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.updatedAt || (r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.deletedAt === void 0 && (r.deletedAt = null, o = !0);
  return o && (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(n)), t.filter((r) => r.deletedAt == null);
}
function Ce(e, n) {
  const t = O(e), o = t.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    ...n,
    id: n.id || y.randomUUID(),
    createdAt: n.createdAt || r,
    updatedAt: r,
    deletedAt: null
  };
  return o.push(a), t.atletas = o, t.updatedAt = r, P(t), o.filter((i) => i.deletedAt == null);
}
function Me(e, n) {
  const t = O(e), o = t.atletas ?? [], r = o.findIndex((i) => i.id === n.id);
  if (r === -1) throw new Error("Atleta não encontrado");
  const a = o[r];
  return o[r] = {
    ...n,
    createdAt: a.createdAt,
    deletedAt: a.deletedAt ?? null,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, t.atletas = o, t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(t), o.filter((i) => i.deletedAt == null);
}
function Je(e, n) {
  const t = O(e), o = t.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Atleta não encontrado");
  return o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  }, t.atletas = o, t.updatedAt = r, P(t), o.filter((i) => i.deletedAt == null);
}
function $e(e, n) {
  const t = O(e), o = new Set(n), r = t.atletas ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < r.length; i += 1)
    o.has(r[i].id) && (r[i] = {
      ...r[i],
      deletedAt: a,
      updatedAt: a
    });
  return t.atletas = r, t.updatedAt = a, P(t), r.filter((i) => i.deletedAt == null);
}
function qe(e, n) {
  const t = O(e), o = t.atletas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Atleta não encontrado");
  return o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, t.atletas = o, t.updatedAt = r, P(t), o.filter((i) => i.deletedAt == null);
}
function Ue(e) {
  return (O(e).atletas ?? []).filter((o) => o.deletedAt != null);
}
function ze(e, n) {
  const t = O(e), o = t.atletas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Atleta não encontrado");
  return o.splice(r, 1), t.atletas = o, t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(t), o.filter((a) => a.deletedAt == null);
}
function ke(e, n) {
  const t = O(e), o = new Set(n), r = t.atletas ?? [];
  return t.atletas = r.filter((a) => !o.has(a.id)), t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(t), t.atletas.filter((a) => a.deletedAt == null);
}
function We(e, n) {
  const t = h.readFileSync(n, "utf-8"), o = JSON.parse(t);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de atletas.");
  const r = new Set(le.map((s) => s.id));
  for (const s of o) {
    if (!s.nome || !s.equipe || !s.faixa || !s.anoNascimento || !s.pesoKg || !s.genero || !s.categoria)
      throw new Error(`Atleta inválido no arquivo: "${s.nome || "sem nome"}" — campos obrigatórios ausentes (categoria, genero).`);
    if (!r.has(s.categoria))
      throw new Error(`Atleta inválido no arquivo: "${s.nome}" — categoria "${s.categoria}" não reconhecida.`);
  }
  const a = O(e), i = a.atletas ?? [];
  let l = 0, d = 0;
  for (const s of o) {
    const c = s.nome.trim().toLowerCase(), I = s.equipe.trim().toLowerCase();
    i.some(
      (w) => s.id && w.id === s.id || w.nome.trim().toLowerCase() === c && w.anoNascimento === s.anoNascimento
    ) ? d++ : (s.nome = c, s.equipe = I, i.push({
      ...s,
      id: s.id || y.randomUUID(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      deletedAt: null
    }), l++);
  }
  return a.atletas = i, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(a), { imported: l, skipped: d };
}
async function He() {
  const e = await _.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
async function Ve(e) {
  const n = ue(e), t = await _.showSaveDialog({
    title: "Exportar Atletas",
    defaultPath: "atletas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !t.canceled && t.filePath && h.writeFileSync(t.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const Ge = v.join(D.getPath("userData"), "data"), Ke = v.join(Ge, "torneios");
function fe(e) {
  return v.join(Ke, `${e}.json`);
}
function N(e) {
  const n = fe(e);
  if (!h.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(h.readFileSync(n, "utf-8"));
}
function T(e) {
  h.writeFileSync(fe(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function me(e) {
  const n = N(e), t = n.arbitros ?? [];
  let o = !1;
  for (const r of t)
    r.deletedAt === void 0 && (r.deletedAt = null, o = !0);
  return o && (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n)), t.filter((r) => r.deletedAt == null);
}
function Ye(e, n) {
  const t = N(e), o = t.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = {
    id: y.randomUUID(),
    nome: n.nome.trim().toLowerCase(),
    equipe: (n.equipe ?? "").trim().toLowerCase(),
    faixa: n.faixa,
    chaveIds: n.chaveIds ?? [],
    createdAt: r,
    updatedAt: r,
    deletedAt: null
  };
  return o.push(a), t.arbitros = o, t.updatedAt = r, T(t), a;
}
function Qe(e, n) {
  const t = N(e), o = t.arbitros ?? [], r = o.findIndex((l) => l.id === n.id);
  if (r === -1) throw new Error("Árbitro não encontrado");
  const a = o[r], i = (/* @__PURE__ */ new Date()).toISOString();
  return o[r] = {
    ...n,
    nome: n.nome.trim().toLowerCase(),
    createdAt: a.createdAt,
    deletedAt: a.deletedAt ?? null,
    updatedAt: i
  }, t.arbitros = o, t.updatedAt = i, T(t), o[r];
}
function Xe(e, n) {
  const t = N(e), o = t.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((d) => d.id === n);
  if (a === -1) throw new Error("Árbitro não encontrado");
  o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  };
  const l = t.chaves;
  if (l)
    for (const d of l)
      d.arbitroId === n && (d.arbitroId = null);
  t.arbitros = o, t.updatedAt = r, T(t);
}
function Ze(e, n) {
  const t = N(e), o = new Set(n), r = t.arbitros ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let d = 0; d < r.length; d += 1)
    o.has(r[d].id) && (r[d] = {
      ...r[d],
      deletedAt: a,
      updatedAt: a
    });
  const l = t.chaves;
  if (l)
    for (const d of l)
      d.arbitroId && o.has(d.arbitroId) && (d.arbitroId = null);
  t.arbitros = r, t.updatedAt = a, T(t);
}
function et(e, n) {
  const t = N(e), o = t.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Árbitro não encontrado");
  o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, t.arbitros = o, t.updatedAt = r, T(t);
}
function tt(e) {
  return (N(e).arbitros ?? []).filter((o) => o.deletedAt != null);
}
function nt(e, n) {
  const t = N(e), o = t.arbitros ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Árbitro não encontrado");
  o.splice(r, 1), t.arbitros = o, t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(t);
}
function ot(e, n) {
  const t = N(e), o = new Set(n), r = t.arbitros ?? [];
  t.arbitros = r.filter((a) => !o.has(a.id)), t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(t);
}
async function rt() {
  const e = await _.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
function at(e, n) {
  const t = h.readFileSync(n, "utf-8"), o = JSON.parse(t);
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
  const a = N(e), i = a.arbitros ?? [];
  let l = 0, d = 0;
  for (const s of o) {
    const c = s, I = c.nome.trim().toLowerCase();
    i.some((w) => w.nome.trim().toLowerCase() === I) ? d++ : (i.push({
      ...c,
      id: c.id || y.randomUUID(),
      nome: I,
      equipe: c.equipe && typeof c.equipe == "string" ? c.equipe.trim().toLowerCase() : "",
      faixa: c.faixa,
      chaveIds: c.chaveIds ?? [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      deletedAt: null
    }), l++);
  }
  return a.arbitros = i, a.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(a), { imported: l, skipped: d };
}
async function it(e) {
  const n = me(e), t = await _.showSaveDialog({
    title: "Exportar Árbitros",
    defaultPath: "arbitros.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !t.canceled && t.filePath && h.writeFileSync(t.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const dt = v.join(D.getPath("userData"), "data"), st = v.join(dt, "torneios");
function he(e) {
  return v.join(st, `${e}.json`);
}
function B(e) {
  const n = he(e);
  if (!h.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(h.readFileSync(n, "utf-8"));
}
function j(e) {
  h.writeFileSync(he(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function Q(e) {
  const n = /* @__PURE__ */ new Set();
  for (const o of e) {
    const r = o.nome.match(/^Área (\d+)$/i);
    r && n.add(Number(r[1]));
  }
  let t = 1;
  for (; n.has(t); ) t += 1;
  return `Área ${t}`;
}
function z(e) {
  return {
    id: e.id,
    nome: e.nome ?? "",
    arbitroIds: Array.isArray(e.arbitroIds) ? e.arbitroIds.filter(Boolean) : e.arbitroId ? [e.arbitroId] : [],
    createdAt: e.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: e.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    deletedAt: e.deletedAt ?? null
  };
}
function W(e) {
  return (B(e).areas ?? []).map((o) => z(o)).filter((o) => o.deletedAt == null);
}
function X(e, n, t) {
  const o = n ?? [];
  if (o.length === 0) return;
  const r = W(e), a = /* @__PURE__ */ new Set();
  for (const l of r)
    if (l.id !== t)
      for (const d of l.arbitroIds)
        a.add(d);
  if (o.filter((l) => l && a.has(l)).length > 0)
    throw new Error("Um ou mais árbitros já estão atribuídos a outra área de luta.");
}
function lt(e, n) {
  const t = n.arbitroIds ?? [];
  X(e, t);
  const o = B(e), r = (o.areas ?? []).map((s) => z(s)), a = r.filter((s) => s.deletedAt == null), i = (/* @__PURE__ */ new Date()).toISOString(), l = n.nome.trim() === "" ? Q(a) : n.nome.trim(), d = {
    id: y.randomUUID(),
    nome: l,
    arbitroIds: t.filter(Boolean),
    createdAt: i,
    updatedAt: i,
    deletedAt: null
  };
  return r.push(d), o.areas = r, o.updatedAt = i, j(o), d;
}
function ct(e, n) {
  const t = n.arbitroIds ?? [];
  X(e, t, n.id);
  const o = B(e), r = (o.areas ?? []).map((c) => z(c)), a = r.findIndex((c) => c.id === n.id);
  if (a === -1) throw new Error("Área de luta não encontrada");
  const i = r[a], l = (/* @__PURE__ */ new Date()).toISOString(), d = r.filter((c) => c.deletedAt == null && c.id !== n.id), s = n.nome.trim() === "" ? Q(d) : n.nome.trim();
  return r[a] = {
    ...n,
    nome: s,
    arbitroIds: t.filter(Boolean),
    createdAt: i.createdAt,
    deletedAt: i.deletedAt ?? null,
    updatedAt: l
  }, o.areas = r, o.updatedAt = l, j(o), r[a];
}
function ut(e, n) {
  const t = B(e), o = t.areas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Área de luta não encontrada");
  o[a] = {
    ...o[a],
    deletedAt: r,
    updatedAt: r
  }, t.areas = o, t.updatedAt = r, j(t);
}
function ft(e, n) {
  const t = B(e), o = new Set(n), r = t.areas ?? [], a = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < r.length; i += 1)
    o.has(r[i].id) && (r[i] = {
      ...r[i],
      deletedAt: a,
      updatedAt: a
    });
  t.areas = r, t.updatedAt = a, j(t);
}
function mt(e, n) {
  const t = B(e), o = t.areas ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), a = o.findIndex((i) => i.id === n);
  if (a === -1) throw new Error("Área de luta não encontrada");
  o[a] = {
    ...o[a],
    deletedAt: null,
    updatedAt: r
  }, t.areas = o, t.updatedAt = r, j(t);
}
function ht(e) {
  return (B(e).areas ?? []).map((o) => z(o)).filter((o) => o.deletedAt != null);
}
function It(e, n) {
  const t = B(e), o = t.areas ?? [], r = o.findIndex((a) => a.id === n);
  if (r === -1) throw new Error("Área de luta não encontrada");
  o.splice(r, 1), t.areas = o, t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), j(t);
}
function At(e, n) {
  const t = B(e), o = new Set(n), r = t.areas ?? [];
  t.areas = r.filter((a) => !o.has(a.id)), t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), j(t);
}
function pt(e, n) {
  const t = h.readFileSync(n, "utf-8"), o = JSON.parse(t);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de áreas de luta.");
  const r = B(e), a = (r.areas ?? []).map((c) => z(c)), i = a.filter((c) => c.deletedAt == null), l = (/* @__PURE__ */ new Date()).toISOString();
  let d = 0, s = 0;
  for (const c of o) {
    if (!c || typeof c != "object")
      throw new Error("Área inválida no arquivo: formato incorreto.");
    const I = c;
    if (I.arbitroIds !== void 0 && !Array.isArray(I.arbitroIds))
      throw new Error(`Área inválida no arquivo: "${String(I.nome ?? "sem nome")}" — arbitroIds deve ser um array.`);
    const p = typeof I.nome == "string" ? I.nome.trim() : "", w = Array.isArray(I.arbitroIds) ? I.arbitroIds.filter((x) => typeof x == "string" && x.length > 0) : [];
    if (i.some(
      (x) => x.nome.trim().toLowerCase() === p.toLowerCase() && p !== ""
    )) {
      s += 1;
      continue;
    }
    X(e, w);
    const S = p === "" ? Q(i) : p, b = {
      id: y.randomUUID(),
      nome: S,
      arbitroIds: w,
      createdAt: l,
      updatedAt: l,
      deletedAt: null
    };
    a.push(b), i.push(b), d += 1;
  }
  return r.areas = a, r.updatedAt = l, j(r), { imported: d, skipped: s };
}
async function wt() {
  const e = await _.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
async function vt(e) {
  const n = W(e), t = await _.showSaveDialog({
    title: "Exportar Áreas de Luta",
    defaultPath: "areas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !t.canceled && t.filePath && h.writeFileSync(t.filePath, JSON.stringify(n, null, 2), "utf-8");
}
const gt = v.join(D.getPath("userData"), "data"), St = v.join(gt, "torneios");
function Ie(e) {
  return v.join(St, `${e}.json`);
}
function E(e) {
  const n = Ie(e);
  if (!h.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(h.readFileSync(n, "utf-8"));
}
function J(e) {
  h.writeFileSync(Ie(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function Ae(e) {
  return [...e].sort((n, t) => {
    if (n.pesoKg !== t.pesoKg) return t.pesoKg - n.pesoKg;
    const o = (/* @__PURE__ */ new Date()).getFullYear() - n.anoNascimento, r = (/* @__PURE__ */ new Date()).getFullYear() - t.anoNascimento;
    return o !== r ? r - o : n.nome.localeCompare(t.nome);
  });
}
function bt(e) {
  const n = Ae(e), t = n.length;
  if (t <= 2) return n;
  const o = Math.ceil(t / 2), r = Array.from({ length: o }, (i, l) => l), a = Array.from({ length: t - o }, (i, l) => l + o);
  for (const i of [r, a]) {
    const l = /* @__PURE__ */ new Set();
    for (const d of i) {
      const s = n[d].equipe;
      if (s) {
        if (l.has(s)) {
          const c = i === r ? a : r;
          for (const I of c) {
            const p = n[I].equipe;
            if (p !== s && !l.has(p)) {
              [n[d], n[I]] = [n[I], n[d]];
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
function pe(e) {
  const n = Ae(e), t = n.slice(0, 8), o = n.slice(8, 16);
  for (const r of [t, o]) {
    const a = /* @__PURE__ */ new Map();
    r.forEach((i, l) => {
      if (i.equipe) {
        const d = a.get(i.equipe) ?? [];
        d.push(l), a.set(i.equipe, d);
      }
    });
    for (const [i, l] of a) {
      if (l.length < 2) continue;
      const d = r === t ? o : t;
      for (let s = 1; s < l.length; s++) {
        const c = d.findIndex((I) => I.equipe !== i);
        c >= 0 && ([r[l[s]], d[c]] = [d[c], r[l[s]]]);
      }
    }
  }
  return [...t, ...o];
}
const f = "tbd";
function u(e, n, t, o) {
  return { id: y.randomUUID(), ordem: e, rodada: n, atletaAId: t, atletaBId: o, status: "pending", vencedorId: null };
}
function yt(e) {
  return [u(1, 1, e[0].id, e[1].id)];
}
function xt(e) {
  return [
    u(1, 1, e[0].id, e[1].id),
    u(2, 2, f, e[2].id),
    u(3, 3, f, f)
  ];
}
function Dt(e) {
  return [
    u(1, 1, e[0].id, e[3].id),
    u(2, 1, e[1].id, e[2].id),
    u(3, 2, f, f)
  ];
}
function Et(e) {
  const n = u(3, 1, e[4].id, f);
  return n.vencedorId = e[4].id, n.status = "wo", [
    u(1, 1, e[0].id, e[1].id),
    u(2, 1, e[2].id, e[3].id),
    n,
    u(4, 2, f, e[4].id),
    u(5, 2, f, f),
    u(6, 3, f, f)
  ];
}
function Ot(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, f);
  r.vencedorId = e[2].id, r.status = "wo";
  const a = u(t++, 1, e[3].id, e[4].id), i = u(t++, 1, e[5].id, f);
  i.vencedorId = e[5].id, i.status = "wo";
  const l = u(t++, 1, e[6].id, e[7].id), d = u(t++, 1, e[8].id, f);
  d.vencedorId = e[8].id, d.status = "wo", n.push(o, r, a, i, l, d);
  const s = u(t++, 2, f, e[2].id), c = u(t++, 2, f, e[5].id), I = u(t++, 2, f, e[8].id);
  n.push(s, c, I);
  const p = u(t++, 3, f, f), w = u(t++, 3, f, f);
  n.push(p, w);
  const g = u(t++, 4, f, f);
  return n.push(g), n;
}
function Nt(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, e[3].id), a = u(t++, 1, e[4].id, e[5].id), i = u(t++, 1, e[6].id, f);
  i.vencedorId = e[6].id, i.status = "wo";
  const l = u(t++, 1, e[7].id, f);
  l.vencedorId = e[7].id, l.status = "wo";
  const d = u(t++, 1, e[8].id, f);
  d.vencedorId = e[8].id, d.status = "wo";
  const s = u(t++, 1, e[9].id, f);
  s.vencedorId = e[9].id, s.status = "wo";
  const c = u(t++, 1, e[10].id, f);
  c.vencedorId = e[10].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const I = u(t++, 2, f, f), p = u(t++, 2, f, e[6].id), w = u(t++, 2, e[7].id, e[8].id), g = u(t++, 2, e[9].id, e[10].id);
  n.push(I, p, w, g);
  const S = u(t++, 3, f, f), b = u(t++, 3, f, f);
  n.push(S, b);
  const x = u(t++, 4, f, f);
  return n.push(x), n;
}
function Bt(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, e[3].id), a = u(t++, 1, e[4].id, e[5].id), i = u(t++, 1, e[6].id, e[7].id), l = u(t++, 1, e[8].id, f);
  l.vencedorId = e[8].id, l.status = "wo";
  const d = u(t++, 1, e[9].id, f);
  d.vencedorId = e[9].id, d.status = "wo";
  const s = u(t++, 1, e[10].id, f);
  s.vencedorId = e[10].id, s.status = "wo";
  const c = u(t++, 1, e[11].id, f);
  c.vencedorId = e[11].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const I = u(t++, 2, f, f), p = u(t++, 2, f, f), w = u(t++, 2, e[8].id, e[9].id), g = u(t++, 2, e[10].id, e[11].id);
  n.push(I, p, w, g);
  const S = u(t++, 3, f, f), b = u(t++, 3, f, f);
  n.push(S, b);
  const x = u(t++, 4, f, f);
  return n.push(x), n;
}
function Lt(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, e[3].id), a = u(t++, 1, e[4].id, e[5].id), i = u(t++, 1, e[6].id, e[7].id), l = u(t++, 1, e[8].id, e[9].id), d = u(t++, 1, e[10].id, f);
  d.vencedorId = e[10].id, d.status = "wo";
  const s = u(t++, 1, e[11].id, f);
  s.vencedorId = e[11].id, s.status = "wo";
  const c = u(t++, 1, e[12].id, f);
  c.vencedorId = e[12].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const I = u(t++, 2, f, f), p = u(t++, 2, f, f), w = u(t++, 2, f, e[10].id), g = u(t++, 2, e[11].id, e[12].id);
  n.push(I, p, w, g);
  const S = u(t++, 3, f, f), b = u(t++, 3, f, f);
  n.push(S, b);
  const x = u(t++, 4, f, f);
  return n.push(x), n;
}
function _t(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, e[3].id), a = u(t++, 1, e[4].id, e[5].id), i = u(t++, 1, e[6].id, e[7].id), l = u(t++, 1, e[8].id, e[9].id), d = u(t++, 1, e[10].id, e[11].id), s = u(t++, 1, e[12].id, f);
  s.vencedorId = e[12].id, s.status = "wo";
  const c = u(t++, 1, e[13].id, f);
  c.vencedorId = e[13].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const I = u(t++, 2, f, f), p = u(t++, 2, f, f), w = u(t++, 2, f, f), g = u(t++, 2, e[12].id, e[13].id);
  n.push(I, p, w, g);
  const S = u(t++, 3, f, f), b = u(t++, 3, f, f);
  n.push(S, b);
  const x = u(t++, 4, f, f);
  return n.push(x), n;
}
function Pt(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, e[3].id), a = u(t++, 1, e[4].id, e[5].id), i = u(t++, 1, e[6].id, e[7].id), l = u(t++, 1, e[8].id, e[9].id), d = u(t++, 1, e[10].id, e[11].id), s = u(t++, 1, e[12].id, e[13].id), c = u(t++, 1, e[14].id, f);
  c.vencedorId = e[14].id, c.status = "wo", n.push(o, r, a, i, l, d, s, c);
  const I = u(t++, 2, f, f), p = u(t++, 2, f, f), w = u(t++, 2, f, f), g = u(t++, 2, f, e[14].id);
  n.push(I, p, w, g);
  const S = u(t++, 3, f, f), b = u(t++, 3, f, f);
  n.push(S, b);
  const x = u(t++, 4, f, f);
  return n.push(x), n;
}
function Tt(e) {
  const n = [];
  let t = 1;
  const o = u(t++, 1, e[0].id, e[1].id), r = u(t++, 1, e[2].id, e[3].id), a = u(t++, 1, e[4].id, e[5].id), i = u(t++, 1, e[6].id, e[7].id), l = u(t++, 1, e[8].id, f);
  l.vencedorId = e[8].id, l.status = "wo";
  const d = u(t++, 1, e[9].id, f);
  d.vencedorId = e[9].id, d.status = "wo", n.push(o, r, a, i, l, d);
  const s = u(t++, 2, f, f), c = u(t++, 2, f, f), I = u(t++, 2, f, f), p = u(t++, 2, e[8].id, e[9].id);
  n.push(s, c, I, p);
  const w = u(t++, 3, f, f), g = u(t++, 3, f, f);
  n.push(w, g);
  const S = u(t++, 4, f, f);
  return n.push(S), n;
}
function Ft(e) {
  const n = u(2, 1, e[2].id, f);
  n.vencedorId = e[2].id, n.status = "wo";
  const t = u(4, 1, e[5].id, f);
  t.vencedorId = e[5].id, t.status = "wo";
  const o = u(5, 2, e[2].id, f), r = u(6, 2, e[5].id, f);
  return [
    u(1, 1, e[0].id, e[1].id),
    n,
    u(3, 1, e[3].id, e[4].id),
    t,
    o,
    r,
    u(7, 3, f, f)
  ];
}
function jt(e) {
  return e <= 2 ? 1 : e === 3 ? 3 : e <= 4 ? 2 : Math.ceil(Math.log2(e));
}
function Rt(e) {
  const n = e.length, t = Math.ceil(Math.log2(n)), o = [];
  let r = 1;
  const a = [];
  for (let d = 0; d < n; d += 2)
    if (d + 1 < n) {
      const s = u(r++, 1, e[d].id, e[d + 1].id);
      o.push(s), a.push(s.id);
    } else {
      const s = u(r++, 1, e[d].id, f);
      s.vencedorId = e[d].id, s.status = "wo", o.push(s), a.push(e[d].id);
    }
  let i = a, l = 2;
  for (; l <= t; ) {
    const d = [];
    for (let s = 0; s < i.length; s += 2)
      if (s + 1 < i.length) {
        const c = u(r++, l, f, f);
        o.push(c), d.push(c.id);
      } else
        d.push(i[s]);
    i = d, l++;
  }
  for (let d = 1; d < t; d++) {
    const s = o.filter((p) => p.rodada === d), c = o.filter((p) => p.rodada === d + 1);
    if (c.length === 0) continue;
    const I = s.length / c.length;
    if (Number.isInteger(I))
      for (let p = 0; p < s.length; p++) {
        const w = s[p];
        if (w.status !== "wo" || !w.vencedorId) continue;
        const g = Math.floor(p / I), S = p % I;
        if (g >= c.length) continue;
        const b = c[g];
        S === 0 && (b.atletaAId === "tbd" || b.atletaAId === "") ? b.atletaAId = w.vencedorId : S === 1 && (b.atletaBId === "tbd" || b.atletaBId === "") && (b.atletaBId = w.vencedorId);
      }
  }
  return o;
}
function Ct(e) {
  const n = [];
  let t = 1;
  for (let o = 0; o < 8; o++)
    n.push(u(t++, 1, e[o * 2].id, e[o * 2 + 1].id));
  for (let o = 0; o < 4; o++)
    n.push(u(t++, 2, f, f));
  for (let o = 0; o < 2; o++)
    n.push(u(t++, 3, f, f));
  return n.push(u(t++, 4, f, f)), n;
}
function we(e) {
  switch (e.length) {
    case 2:
      return yt(e);
    case 3:
      return xt(e);
    case 4:
      return Dt(e);
    case 5:
      return Et(e);
    case 6:
      return Ft(e);
    case 9:
      return Ot(e);
    case 10:
      return Tt(e);
    case 11:
      return Nt(e);
    case 12:
      return Bt(e);
    case 13:
      return Lt(e);
    case 14:
      return _t(e);
    case 15:
      return Pt(e);
    case 16:
      return Ct(e);
    default:
      if (e.length >= 7 && e.length <= 15) return Rt(e);
      throw new Error("Número inválido de atletas");
  }
}
const de = {
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
function Mt(e) {
  const n = [...e];
  for (let t = n.length - 1; t > 0; t--) {
    const o = Math.floor(Math.random() * (t + 1));
    [n[t], n[o]] = [n[o], n[t]];
  }
  return n;
}
function ve(e, n) {
  if (n.length < 2 || n.length > 16)
    throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
  const t = Mt(n), o = t.length === 16 ? pe(t) : bt(t), r = we(o);
  return {
    id: y.randomUUID(),
    categoriaId: e,
    lutas: r,
    posicoesAtletas: o.map((a) => a.id),
    arbitroId: null,
    totalAtletas: o.length,
    totalLutas: r.length,
    totalRodadas: jt(o.length),
    status: "gerada"
  };
}
function Jt(e) {
  const n = e.chaves ?? [], t = e.arbitros ?? [];
  if (n.length === 0 || t.length === 0) return;
  for (const a of t)
    a.chaveIds = [];
  const o = n.map((a) => {
    const i = a.posicoesAtletas.map((d) => (e.atletas ?? []).find((s) => s.id === d)).filter((d) => d !== void 0), l = Math.max(...i.map((d) => de[d.faixa] ?? 0), 0);
    return { chave: a, maxLevel: l };
  });
  o.sort((a, i) => i.maxLevel - a.maxLevel);
  const r = /* @__PURE__ */ new Map();
  for (const a of t) r.set(a.id, 0);
  for (const { chave: a, maxLevel: i } of o) {
    const l = t.filter((d) => (de[d.faixa] ?? 0) >= i).sort((d, s) => (r.get(d.id) ?? 0) - (r.get(s.id) ?? 0))[0];
    l && (a.arbitroId = l.id, r.set(l.id, (r.get(l.id) ?? 0) + 1), l.chaveIds.includes(a.id) || l.chaveIds.push(a.id));
  }
}
function $t(e, n) {
  const t = e.length;
  if (t <= n && t >= 2) return [e];
  const o = [];
  let r = 0;
  for (; r < t; )
    t - r <= n ? (o.push(e.slice(r)), r = t) : (o.push(e.slice(r, r + n)), r += n);
  const a = o[o.length - 1];
  if (a && a.length === 1 && o.length > 1) {
    const l = o[o.length - 2].pop();
    a.unshift(l);
  }
  return o;
}
function qt(e, n = 16) {
  const t = E(e), o = t.atletas ?? [];
  t.chaves = [];
  const r = [], a = /* @__PURE__ */ new Map();
  for (const c of o) {
    if (!c.categoria) {
      r.push(c.nome);
      continue;
    }
    const I = a.get(c.categoria) ?? [];
    I.push(c), a.set(c.categoria, I);
  }
  const i = [], l = [], d = [];
  for (const [c, I] of a) {
    if (I.length === 0) continue;
    if (I.length === 1) {
      l.push(I[0]), d.push({
        categoriaId: c,
        totalAtletas: 1,
        chavesGeradas: 0,
        atletasIgnorados: [...r]
      });
      continue;
    }
    const p = $t(I, n);
    let w = 0;
    for (const g of p) {
      if (g.length === 1) {
        l.push(g[0]);
        continue;
      }
      i.push(ve(c, g)), w++;
    }
    d.push({
      categoriaId: c,
      totalAtletas: I.length,
      chavesGeradas: w,
      atletasIgnorados: [...r]
    });
  }
  t.chaves = i, Jt(t);
  const s = /* @__PURE__ */ new Set();
  for (const c of i)
    for (const I of c.posicoesAtletas)
      s.add(I);
  for (const c of t.atletas ?? [])
    c.emChave = s.has(c.id);
  return t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(t), { chaves: i, metadados: d, atletasSemChave: l };
}
function Ut(e) {
  var r, a, i;
  const n = e.length;
  if (n < 4) return;
  const t = n === 4 ? [0, 3] : n === 5 ? [0, 1, 2] : n === 6 ? [0, 1, 2] : n === 9 ? [0, 1, 2, 3, 4] : n === 10 ? [0, 1, 2, 3, 4] : n === 11 ? [0, 1, 2, 3, 4, 5] : n === 12 ? [0, 1, 2, 3, 4, 5] : n === 13 ? [0, 1, 2, 3, 4, 5] : n === 14 ? [0, 1, 2, 3, 4, 5] : n === 15 ? [0, 1, 2, 3, 4, 5, 6] : [0, 1], o = n === 4 ? [1, 2] : n === 5 ? [3, 4] : n === 6 ? [3, 4, 5] : n === 9 ? [5, 6, 7, 8] : n === 10 ? [5, 6, 7, 8, 9] : n === 11 ? [6, 7, 8, 9, 10] : n === 12 ? [6, 7, 8, 9, 10, 11] : n === 13 ? [6, 7, 8, 9, 10, 11, 12] : n === 14 ? [6, 7, 8, 9, 10, 11, 12, 13] : n === 15 ? [7, 8, 9, 10, 11, 12, 13, 14] : [2, 3, 4];
  for (const l of [t, o]) {
    const d = /* @__PURE__ */ new Set();
    for (const s of l) {
      const c = (r = e[s]) == null ? void 0 : r.equipe;
      if (c) {
        if (d.has(c)) {
          const I = l === t ? o : t;
          for (const p of I)
            if (((a = e[p]) == null ? void 0 : a.equipe) !== c) {
              [e[s], e[p]] = [e[p], e[s]];
              break;
            }
        }
        (i = e[s]) != null && i.equipe && d.add(e[s].equipe);
      }
    }
  }
}
function zt(e, n) {
  const t = E(e), o = t.chaves ?? [], r = o.findIndex((d) => d.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = o[r], i = [...a.posicoesAtletas];
  for (let d = i.length - 1; d > 0; d--) {
    const s = Math.floor(Math.random() * (d + 1));
    [i[d], i[s]] = [i[s], i[d]];
  }
  const l = i.map((d) => (t.atletas ?? []).find((s) => s.id === d)).filter((d) => d !== void 0);
  if (l.length === 16) {
    const d = pe(l);
    a.posicoesAtletas = d.map((s) => s.id);
  } else
    Ut(l), a.posicoesAtletas = l.map((d) => d.id);
  a.lutas = we(l), o[r] = a, t.chaves = o;
  for (const d of t.atletas ?? [])
    a.posicoesAtletas.includes(d.id) && (d.emChave = !0);
  return t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(t), a;
}
function kt(e, n) {
  const t = E(e), o = t.chaves ?? [], r = o.findIndex((l) => l.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = o[r], i = a.arbitroId;
  if (i) {
    const l = (t.arbitros ?? []).find((d) => d.id === i);
    l && (l.chaveIds = l.chaveIds.filter((d) => d !== n.chaveId));
  }
  if (n.arbitroId) {
    const l = (t.arbitros ?? []).find((d) => d.id === n.arbitroId);
    if (!l) throw new Error("Árbitro não encontrado no torneio.");
    l.chaveIds.includes(n.chaveId) || l.chaveIds.push(n.chaveId);
  }
  return a.arbitroId = n.arbitroId, o[r] = a, t.chaves = o, t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(t), a;
}
async function Wt() {
  const e = await _.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
function Ht(e, n) {
  const t = h.readFileSync(n, "utf-8"), o = JSON.parse(t);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de chaves.");
  const r = E(e), a = o.map((l) => {
    if (!l.categoriaId || !Array.isArray(l.lutas))
      throw new Error("Estrutura de chave inválida no arquivo.");
    return {
      ...l,
      id: l.id || y.randomUUID()
    };
  });
  r.chaves = a;
  const i = /* @__PURE__ */ new Set();
  for (const l of a)
    for (const d of l.posicoesAtletas)
      i.add(d);
  for (const l of r.atletas ?? [])
    l.emChave = i.has(l.id);
  return r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(r), { imported: o.length };
}
async function Vt(e) {
  const n = E(e), t = n.chaves ?? [], o = await _.showSaveDialog({
    title: "Exportar Chaves",
    defaultPath: `${(n.nome || "torneio").replace(/[^a-zA-Z0-9]/g, "_")}_chaves.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !o.canceled && o.filePath && h.writeFileSync(o.filePath, JSON.stringify(t, null, 2), "utf-8");
}
function Gt(e) {
  return {
    id: e.id,
    ordem: e.ordem ?? 0,
    rodada: e.rodada ?? 1,
    atletaAId: e.atletaAId ?? "",
    atletaBId: e.atletaBId ?? "",
    status: e.status ?? "pending",
    vencedorId: e.vencedorId ?? null,
    placarA: e.placarA ?? void 0,
    placarB: e.placarB ?? void 0,
    finalizacao: e.finalizacao ?? void 0,
    desclassificacao: e.desclassificacao ?? void 0,
    desclassificadoId: e.desclassificadoId ?? void 0,
    desempateArbitro: e.desempateArbitro ?? void 0,
    horarioInicio: e.horarioInicio ?? void 0,
    horarioTermino: e.horarioTermino ?? void 0
  };
}
function G(e) {
  const n = (e.lutas ?? []).map(Gt);
  return {
    id: e.id,
    categoriaId: e.categoriaId ?? "",
    lutas: n,
    posicoesAtletas: e.posicoesAtletas ?? [],
    arbitroId: e.arbitroId ?? null,
    totalAtletas: e.totalAtletas ?? 0,
    totalLutas: e.totalLutas ?? 0,
    totalRodadas: e.totalRodadas ?? (n.length > 0 ? Math.max(...n.map((t) => t.rodada)) : 1),
    status: e.status ?? "gerada"
  };
}
function Kt(e, n) {
  const t = E(e), r = W(e).find((i) => i.id === n);
  if (!r) return [];
  const a = new Set(r.arbitroIds);
  return (t.chaves ?? []).map((i) => G(i)).filter((i) => i.arbitroId && a.has(i.arbitroId));
}
function K(e, n, t) {
  for (const o of e.lutas)
    o.rodada <= n || (o.atletaAId === t && (o.atletaAId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), K(e, o.rodada, t)), o.atletaBId === t && (o.atletaBId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), K(e, o.rodada, t)));
}
function Yt(e, n) {
  const t = e.lutas.filter((a) => a.rodada === n.rodada), o = t.indexOf(n);
  if (o < 0) return;
  let r = n.rodada + 1;
  for (; r <= (e.totalRodadas || 3); ) {
    const a = e.lutas.filter((c) => c.rodada === r);
    if (a.length === 0) return;
    const i = t.length / a.length, l = Math.floor(o / i);
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
function Qt(e, n) {
  const t = n.vencedorId;
  if (t) {
    if (n.ordem === 1) {
      const o = e.lutas.find((a) => a.ordem === 5);
      o && (o.atletaAId = t, o.vencedorId = t, o.status = "wo");
      const r = e.lutas.find((a) => a.ordem === 6);
      r && (r.atletaBId = t);
    } else if (n.ordem === 2) {
      const o = e.lutas.find((r) => r.ordem === 4);
      o && (o.atletaAId = t);
    } else if (n.ordem === 3) {
      const o = e.lutas.find((r) => r.ordem === 4);
      o && (o.atletaBId = t);
    } else if (n.ordem === 4) {
      const o = e.lutas.find((r) => r.ordem === 6);
      o && (o.atletaAId = t);
    }
  }
}
function Xt(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  if (!e.lutas.some((r) => r.ordem === 4 && r.rodada === 1)) {
    if (n.ordem === 1) {
      const r = e.lutas.filter((a) => a.rodada === 2);
      r[0] && (r[0].atletaAId = t);
    } else if (n.ordem === 2) {
      const r = e.lutas.filter((a) => a.rodada === 2);
      r[0] && (r[0].atletaBId = t);
    } else if (n.ordem === 3) {
      const r = e.lutas.filter((a) => a.rodada === 2);
      r[1] && (r[1].atletaAId = t);
    } else if (n.rodada === 2) {
      const r = e.lutas.find((l) => l.rodada === 3), i = e.lutas.filter((l) => l.rodada === 2).indexOf(n);
      r && i === 0 && (r.atletaAId = t), r && i === 1 && (r.atletaBId = t);
    }
    return;
  }
  if (n.ordem === 1) {
    const r = e.lutas.find((a) => a.ordem === 5);
    r && (r.atletaBId = t);
  } else if (n.ordem !== 2) {
    if (n.ordem === 3) {
      const r = e.lutas.find((a) => a.ordem === 6);
      r && (r.atletaBId = t);
    } else if (n.ordem !== 4) {
      if (n.ordem === 5) {
        const r = e.lutas.find((a) => a.ordem === 7);
        r && (r.atletaAId = t);
      } else if (n.ordem === 6) {
        const r = e.lutas.find((a) => a.ordem === 7);
        r && (r.atletaBId = t);
      }
    }
  }
}
function Zt(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((s) => s.ordem === 7), r = e.lutas.find((s) => s.ordem === 8), a = e.lutas.find((s) => s.ordem === 9), i = e.lutas.find((s) => s.ordem === 10), l = e.lutas.find((s) => s.ordem === 11), d = e.lutas.find((s) => s.ordem === 12);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? r && (r.atletaAId = t) : n.ordem === 4 ? r && (r.atletaBId = t) : n.ordem === 5 ? a && (a.atletaAId = t) : n.ordem === 6 ? a && (a.atletaBId = t) : n.ordem === 7 ? i && (i.atletaAId = t) : n.ordem === 8 ? i && (i.atletaBId = t) : n.ordem === 9 ? (l && (l.atletaAId = t, l.vencedorId = t, l.status = "wo"), d && (d.atletaBId = t)) : n.ordem === 10 && d && (d.atletaAId = t);
}
function en(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((c) => c.ordem === 7), r = e.lutas.find((c) => c.ordem === 8), a = e.lutas.find((c) => c.ordem === 9), i = e.lutas.find((c) => c.ordem === 10), l = e.lutas.find((c) => c.ordem === 11), d = e.lutas.find((c) => c.ordem === 12), s = e.lutas.find((c) => c.ordem === 13);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? (r && (r.atletaAId = t, r.vencedorId = t, r.status = "wo"), l && (l.atletaBId = t)) : n.ordem === 4 ? (a && (a.atletaAId = t, a.vencedorId = t, a.status = "wo"), d && (d.atletaAId = t)) : n.ordem === 5 ? i && (i.atletaAId = t) : n.ordem === 6 ? i && (i.atletaBId = t) : n.ordem === 7 ? l && (l.atletaAId = t) : n.ordem === 10 ? d && (d.atletaBId = t) : n.ordem === 11 ? s && (s.atletaAId = t) : n.ordem === 12 && s && (s.atletaBId = t);
}
function tn(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((d) => d.ordem === 9), r = e.lutas.find((d) => d.ordem === 10), a = e.lutas.find((d) => d.ordem === 13), i = e.lutas.find((d) => d.ordem === 14), l = e.lutas.find((d) => d.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? r && (r.atletaAId = t) : n.ordem >= 4 && n.ordem <= 8 || (n.ordem === 9 ? a && (a.atletaAId = t) : n.ordem === 10 ? a && (a.atletaBId = t) : n.ordem === 11 ? i && (i.atletaAId = t) : n.ordem === 12 ? i && (i.atletaBId = t) : n.ordem === 13 ? l && (l.atletaAId = t) : n.ordem === 14 && l && (l.atletaBId = t));
}
function nn(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((d) => d.ordem === 9), r = e.lutas.find((d) => d.ordem === 10), a = e.lutas.find((d) => d.ordem === 13), i = e.lutas.find((d) => d.ordem === 14), l = e.lutas.find((d) => d.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? r && (r.atletaAId = t) : n.ordem === 4 ? r && (r.atletaBId = t) : n.ordem >= 5 && n.ordem <= 8 || (n.ordem === 9 ? a && (a.atletaAId = t) : n.ordem === 10 ? a && (a.atletaBId = t) : n.ordem === 11 ? i && (i.atletaAId = t) : n.ordem === 12 ? i && (i.atletaBId = t) : n.ordem === 13 ? l && (l.atletaAId = t) : n.ordem === 14 && l && (l.atletaBId = t));
}
function on(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((s) => s.ordem === 9), r = e.lutas.find((s) => s.ordem === 10), a = e.lutas.find((s) => s.ordem === 11), i = e.lutas.find((s) => s.ordem === 13), l = e.lutas.find((s) => s.ordem === 14), d = e.lutas.find((s) => s.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? r && (r.atletaAId = t) : n.ordem === 4 ? r && (r.atletaBId = t) : n.ordem === 5 ? a && (a.atletaAId = t) : n.ordem >= 6 && n.ordem <= 8 || (n.ordem === 9 ? i && (i.atletaAId = t) : n.ordem === 10 ? i && (i.atletaBId = t) : n.ordem === 11 ? l && (l.atletaAId = t) : n.ordem === 12 ? l && (l.atletaBId = t) : n.ordem === 13 ? d && (d.atletaAId = t) : n.ordem === 14 && d && (d.atletaBId = t));
}
function rn(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((s) => s.ordem === 9), r = e.lutas.find((s) => s.ordem === 10), a = e.lutas.find((s) => s.ordem === 11), i = e.lutas.find((s) => s.ordem === 13), l = e.lutas.find((s) => s.ordem === 14), d = e.lutas.find((s) => s.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? r && (r.atletaAId = t) : n.ordem === 4 ? r && (r.atletaBId = t) : n.ordem === 5 ? a && (a.atletaAId = t) : n.ordem === 6 ? a && (a.atletaBId = t) : n.ordem >= 7 && n.ordem <= 8 || (n.ordem === 9 ? i && (i.atletaAId = t) : n.ordem === 10 ? i && (i.atletaBId = t) : n.ordem === 11 ? l && (l.atletaAId = t) : n.ordem === 12 ? l && (l.atletaBId = t) : n.ordem === 13 ? d && (d.atletaAId = t) : n.ordem === 14 && d && (d.atletaBId = t));
}
function an(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.find((c) => c.ordem === 9), r = e.lutas.find((c) => c.ordem === 10), a = e.lutas.find((c) => c.ordem === 11), i = e.lutas.find((c) => c.ordem === 12), l = e.lutas.find((c) => c.ordem === 13), d = e.lutas.find((c) => c.ordem === 14), s = e.lutas.find((c) => c.ordem === 15);
  n.ordem === 1 ? o && (o.atletaAId = t) : n.ordem === 2 ? o && (o.atletaBId = t) : n.ordem === 3 ? r && (r.atletaAId = t) : n.ordem === 4 ? r && (r.atletaBId = t) : n.ordem === 5 ? a && (a.atletaAId = t) : n.ordem === 6 ? a && (a.atletaBId = t) : n.ordem === 7 ? i && (i.atletaAId = t) : n.ordem === 8 || (n.ordem === 9 ? l && (l.atletaAId = t) : n.ordem === 10 ? l && (l.atletaBId = t) : n.ordem === 11 ? d && (d.atletaAId = t) : n.ordem === 12 ? d && (d.atletaBId = t) : n.ordem === 13 ? s && (s.atletaAId = t) : n.ordem === 14 && s && (s.atletaBId = t));
}
function dn(e, n) {
  const t = n.vencedorId;
  if (!t) return;
  const o = e.lutas.indexOf(n);
  if (!(o < 0)) {
    if (n.rodada === 1) {
      const r = 8 + Math.floor(o / 2), a = o % 2 === 0, i = e.lutas[r];
      i && (a ? i.atletaAId = t : i.atletaBId = t);
    } else if (n.rodada === 2) {
      const r = o - 8, a = 12 + Math.floor(r / 2), i = r % 2 === 0, l = e.lutas[a];
      l && (i ? l.atletaAId = t : l.atletaBId = t);
    } else if (n.rodada === 3) {
      const r = e.lutas[14];
      r && (o - 12 === 0 ? r.atletaAId = t : r.atletaBId = t);
    }
  }
}
function sn(e, n) {
  const t = E(e), o = [...t.chaves ?? []], r = o.findIndex((d) => d.id === n.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const a = JSON.parse(JSON.stringify(o[r])), i = a.lutas.find((d) => d.id === n.lutaId);
  if (!i) throw new Error("Luta não encontrada");
  const l = i.vencedorId;
  if (l && l !== n.vencedorId && K(a, i.rodada, l), i.vencedorId = n.vencedorId, i.status = n.status === "wo" ? "wo" : "completed", i.placarA = n.placarA, i.placarB = n.placarB, i.finalizacao = n.finalizacao ?? !1, i.desclassificacao = n.desclassificacao ?? !1, i.desempateArbitro = n.desempateArbitro ?? !1, i.horarioInicio = n.horarioInicio ?? i.horarioInicio, i.horarioTermino = n.horarioTermino ?? i.horarioTermino, n.desclassificacao && i.vencedorId ? i.desclassificadoId = i.atletaAId === i.vencedorId ? i.atletaBId : i.atletaAId : i.desclassificadoId = void 0, a.totalAtletas === 3) {
    const d = a.lutas.find((c) => c.rodada === 2), s = a.lutas.find((c) => c.rodada === 3);
    if (i.rodada === 1) {
      const c = i.vencedorId === i.atletaAId ? i.atletaBId : i.atletaAId;
      n.desclassificacao ? d && s && (d.atletaAId = d.atletaBId, d.vencedorId = d.atletaBId, d.status = "wo", s.atletaAId = i.vencedorId, s.atletaBId = d.atletaBId, s.vencedorId = null, s.status = "pending") : (d && (d.atletaAId = c, d.vencedorId = null, d.status = "pending"), s && (s.atletaAId = i.vencedorId, s.atletaBId = "tbd", s.vencedorId = null, s.status = "pending"));
    } else i.rodada === 2 && s && s.atletaBId === "tbd" && (s.atletaBId = i.vencedorId, s.status = "pending");
  } else a.totalAtletas === 5 ? Qt(a, i) : a.totalAtletas === 6 ? Xt(a, i) : a.totalAtletas === 9 ? Zt(a, i) : a.totalAtletas === 10 ? en(a, i) : a.totalAtletas === 11 ? tn(a, i) : a.totalAtletas === 12 ? nn(a, i) : a.totalAtletas === 13 ? on(a, i) : a.totalAtletas === 14 ? rn(a, i) : a.totalAtletas === 15 ? an(a, i) : a.totalAtletas === 16 ? dn(a, i) : Yt(a, i);
  return o[r] = a, t.chaves = o, t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(t), a;
}
function ln() {
  m.handle("gerar-todas-chaves", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const o = n && n >= 2 && n <= 16 ? n : 16;
    return qt(t, o);
  }), m.handle("gerar-chave", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    const o = E(t), r = (o.atletas ?? []).filter((l) => l.categoria === n.categoriaId);
    if (r.length < 2 || r.length > 16)
      throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
    const a = o.chaves ?? [];
    if (a.some((l) => l.categoriaId === n.categoriaId))
      throw new Error("Chave já existe para esta categoria.");
    const i = ve(n.categoriaId, r);
    o.chaves = [...a, i];
    for (const l of o.atletas ?? [])
      i.posicoesAtletas.includes(l.id) && (l.emChave = !0);
    return o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(o), i;
  }), m.handle("load-chaves", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return (E(e).chaves ?? []).map((t) => G(t));
  }), m.handle("load-chave-por-categoria", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return (E(t).chaves ?? []).map((r) => G(r)).find((r) => r.categoriaId === n) ?? null;
  }), m.handle("randomizar-chave", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return zt(t, n);
  }), m.handle("atribuir-arbitro-chave", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return kt(t, n);
  }), m.handle("import-chaves", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const n = await Wt();
    return n ? Ht(e, n) : { imported: 0 };
  }), m.handle("export-chaves", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Vt(e);
  }), m.handle("load-chaves-por-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Kt(t, n);
  }), m.handle("registrar-resultado", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return sn(t, n);
  });
}
const cn = v.join(D.getPath("userData"), "data"), un = v.join(cn, "torneios");
function ge(e) {
  return v.join(un, `${e}.json`);
}
function H(e) {
  const n = ge(e);
  if (!h.existsSync(n)) throw new Error("Torneio não encontrado");
  return JSON.parse(h.readFileSync(n, "utf-8"));
}
function Z(e) {
  h.writeFileSync(ge(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function fn(e) {
  const n = e.status ?? "pending";
  return {
    id: e.id,
    areaId: e.areaId,
    arbitroId: e.arbitroId ?? null,
    atletaAId: e.atletaAId,
    atletaBId: e.atletaBId,
    atletaASnapshot: e.atletaASnapshot,
    atletaBSnapshot: e.atletaBSnapshot,
    tag: "luta-casada",
    status: n,
    placarA: e.placarA,
    placarB: e.placarB,
    vencedorId: e.vencedorId ?? null,
    finalizacao: e.finalizacao ?? !1,
    desclassificacao: e.desclassificacao ?? !1,
    desempateArbitro: e.desempateArbitro ?? !1,
    dataFinalizacao: e.dataFinalizacao ?? null,
    horarioInicio: e.horarioInicio ?? void 0,
    createdAt: e.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: e.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function ee(e) {
  return (H(e).lutasCasadas ?? []).map((t) => fn(t));
}
function mn(e, n) {
  return ee(e).filter((t) => t.areaId === n);
}
function hn(e, n) {
  if (n.atletaAId === n.atletaBId)
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  const t = H(e), o = ee(e), r = (/* @__PURE__ */ new Date()).toISOString(), a = {
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
    createdAt: r,
    updatedAt: r
  };
  return o.push(a), t.lutasCasadas = o, t.updatedAt = r, Z(t), a;
}
function In(e, n) {
  if (n.atletaAId === n.atletaBId)
    throw new Error("Atleta A e Atleta B não podem ser o mesmo atleta.");
  const t = H(e), o = ee(e), r = o.findIndex((l) => l.id === n.id);
  if (r === -1) throw new Error("Luta casada não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString(), i = {
    ...n,
    tag: "luta-casada",
    updatedAt: a
  };
  return o[r] = i, t.lutasCasadas = o, t.updatedAt = a, Z(t), i;
}
function An(e, n) {
  const t = H(e);
  t.lutasCasadas = (t.lutasCasadas ?? []).filter((o) => o.id !== n), t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), Z(t);
}
const te = process.env.MASTER_PASSWORD_HASH || "f83244662ee78bf661577ecd28343bc4ff6538b6f249d6d7b1bf34817ec0ced4", pn = "activation.json", wn = 1;
function ne() {
  return v.join(D.getPath("userData"), pn);
}
function Se() {
  try {
    return Oe("wmic csproduct get uuid", { encoding: "utf-8" }).split(`
`).map((t) => t.trim()).filter(Boolean)[1] || y.randomUUID();
  } catch {
    return y.randomUUID();
  }
}
function be(e) {
  return e ? /* @__PURE__ */ new Date() > new Date(e) : !0;
}
function vn(e) {
  const n = new Date(e).getTime() - Date.now();
  return Math.max(0, Math.ceil(n / 864e5));
}
function gn() {
  try {
    const e = ne();
    if (!h.existsSync(e)) return !1;
    const n = JSON.parse(h.readFileSync(e, "utf-8"));
    if (be(n.expiresAt)) return !1;
    const t = Se(), o = y.createHmac("sha256", te).update(t).digest("hex");
    return n.token === o;
  } catch {
    return !1;
  }
}
function Sn() {
  try {
    const e = ne();
    if (!h.existsSync(e))
      return { activated: !1, activatedAt: null, expiresAt: null, daysRemaining: null };
    const n = JSON.parse(h.readFileSync(e, "utf-8"));
    return be(n.expiresAt) ? {
      activated: !1,
      activatedAt: n.activatedAt ?? null,
      expiresAt: n.expiresAt ?? null,
      daysRemaining: 0
    } : {
      activated: !0,
      activatedAt: n.activatedAt ?? null,
      expiresAt: n.expiresAt,
      daysRemaining: vn(n.expiresAt)
    };
  } catch {
    return { activated: !1, activatedAt: null, expiresAt: null, daysRemaining: null };
  }
}
function bn(e) {
  return y.createHash("sha256").update(e).digest("hex") === te;
}
function yn() {
  try {
    const e = Se(), n = y.createHmac("sha256", te).update(e).digest("hex"), t = /* @__PURE__ */ new Date(), o = new Date(t);
    o.setFullYear(o.getFullYear() + wn);
    const r = ne();
    return h.writeFileSync(
      r,
      JSON.stringify({ token: n, activatedAt: t.toISOString(), expiresAt: o.toISOString() }, null, 2),
      "utf-8"
    ), !0;
  } catch {
    return !1;
  }
}
const ye = v.dirname(Ee(import.meta.url));
process.env.APP_ROOT = v.join(ye, "..");
const Y = process.env.VITE_DEV_SERVER_URL, jn = v.join(process.env.APP_ROOT, "dist-electron"), xe = v.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = Y ? v.join(process.env.APP_ROOT, "public") : xe;
let L;
function De() {
  L = new se({
    icon: v.join(process.env.VITE_PUBLIC, "favicon.svg"),
    webPreferences: {
      preload: v.join(ye, "preload.mjs")
    }
  }), L.maximize(), L.webContents.on("did-finish-load", () => {
    L == null || L.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), Y ? L.loadURL(Y) : L.loadFile(v.join(xe, "index.html"));
}
D.on("window-all-closed", () => {
  process.platform !== "darwin" && (D.quit(), L = null);
});
D.on("activate", () => {
  se.getAllWindows().length === 0 && De();
});
function xn() {
  m.handle("load-athletes", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ue(e);
  }), m.handle("save-athlete", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Ce(t, n);
  }), m.handle("update-athlete", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Me(t, n);
  }), m.handle("delete-athlete", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Je(t, n);
  }), m.handle("delete-athletes", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return $e(t, n);
  }), m.handle("restore-athlete", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return qe(t, n);
  }), m.handle("load-deleted-athletes", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ue(e);
  }), m.handle("permanently-delete-athlete", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ze(t, n);
  }), m.handle("permanently-delete-athletes", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ke(t, n);
  }), m.handle("import-athletes", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const n = await He();
    return n ? We(e, n) : { imported: 0, skipped: 0 };
  }), m.handle("export-athletes", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Ve(e);
  });
}
function Dn() {
  m.handle("save-arbitro", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Ye(t, n);
  }), m.handle("update-arbitro", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Qe(t, n);
  }), m.handle("delete-arbitro", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Xe(t, n);
  }), m.handle("delete-arbitros", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return Ze(t, n);
  }), m.handle("restore-arbitro", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return et(t, n);
  }), m.handle("load-deleted-arbitros", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return tt(e);
  }), m.handle("permanently-delete-arbitro", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return nt(t, n);
  }), m.handle("permanently-delete-arbitros", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ot(t, n);
  }), m.handle("load-arbitros", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return me(e);
  }), m.handle("import-arbitros", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const n = await rt();
    return n ? at(e, n) : { imported: 0, skipped: 0 };
  }), m.handle("export-arbitros", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return it(e);
  });
}
function En() {
  m.handle("load-areas", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return W(e);
  }), m.handle("save-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return lt(t, n);
  }), m.handle("update-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ct(t, n);
  }), m.handle("delete-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ut(t, n);
  }), m.handle("delete-areas", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return ft(t, n);
  }), m.handle("restore-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return mt(t, n);
  }), m.handle("load-deleted-areas", () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ht(e);
  }), m.handle("permanently-delete-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return It(t, n);
  }), m.handle("permanently-delete-areas", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return At(t, n);
  }), m.handle("import-areas", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    const n = await wt();
    return n ? pt(e, n) : { imported: 0, skipped: 0 };
  }), m.handle("export-areas", async () => {
    const e = A();
    if (!e) throw new Error("Nenhum torneio ativo");
    return vt(e);
  });
}
function On() {
  m.handle("check-activation", () => gn()), m.handle("validate-password", (e, n) => bn(n)), m.handle("activate-license", () => yn()), m.handle("get-activation-info", () => Sn());
}
function Nn() {
  m.handle("load-lutas-casadas-por-area", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return mn(t, n);
  }), m.handle("save-luta-casada", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return hn(t, n);
  }), m.handle("update-luta-casada", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return In(t, n);
  }), m.handle("delete-luta-casada", (e, n) => {
    const t = A();
    if (!t) throw new Error("Nenhum torneio ativo");
    return An(t, n);
  });
}
D.whenReady().then(() => {
  Ne(), xn(), Dn(), ln(), En(), Nn(), On(), De();
});
export {
  jn as MAIN_DIST,
  xe as RENDERER_DIST,
  Y as VITE_DEV_SERVER_URL
};
