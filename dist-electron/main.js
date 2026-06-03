import { app as A, ipcMain as f, dialog as E, BrowserWindow as k } from "electron";
import { fileURLToPath as de } from "node:url";
import m from "node:path";
import u from "node:fs";
import p from "node:crypto";
import { execSync as ce } from "node:child_process";
const C = m.join(A.getPath("userData"), "data"), L = m.join(C, "torneios"), x = m.join(C, "torneio-ativo.json");
function O() {
  u.existsSync(C) || u.mkdirSync(C, { recursive: !0 }), u.existsSync(L) || u.mkdirSync(L, { recursive: !0 });
}
function y(e) {
  return m.join(L, `${e}.json`);
}
function h() {
  if (!u.existsSync(x)) return null;
  try {
    const { id: e } = JSON.parse(u.readFileSync(x, "utf-8"));
    return e;
  } catch {
    return null;
  }
}
function le() {
  f.handle("create-tournament", (e, t) => {
    O();
    const n = {
      id: p.randomUUID(),
      nome: t.nome,
      data: t.data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      atletas: []
    };
    return u.writeFileSync(y(n.id), JSON.stringify(n, null, 2), "utf-8"), n;
  }), f.handle("list-tournaments", () => (O(), u.readdirSync(L).filter((t) => t.endsWith(".json")).map((t) => {
    const n = u.readFileSync(m.join(L, t), "utf-8");
    return JSON.parse(n);
  }))), f.handle("start-tournament", (e, t) => {
    O(), u.writeFileSync(x, JSON.stringify({ id: t }), "utf-8");
    const n = y(t);
    if (u.existsSync(n)) {
      const o = JSON.parse(u.readFileSync(n, "utf-8"));
      return o.startedAt = (/* @__PURE__ */ new Date()).toISOString(), o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), u.writeFileSync(n, JSON.stringify(o, null, 2), "utf-8"), o;
    }
    throw new Error("Torneio não encontrado");
  }), f.handle("get-active-tournament", () => {
    O();
    const e = h();
    if (!e) return null;
    const t = y(e);
    return u.existsSync(t) ? JSON.parse(u.readFileSync(t, "utf-8")) : null;
  }), f.handle("export-tournament", async (e, t) => {
    O();
    const n = y(t);
    if (!u.existsSync(n)) throw new Error("Torneio não encontrado");
    const o = JSON.parse(u.readFileSync(n, "utf-8")), r = o.nome || `Torneio ${o.data}`, i = await E.showSaveDialog({
      title: "Exportar Torneio",
      defaultPath: `${r.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    !i.canceled && i.filePath && u.copyFileSync(n, i.filePath);
  }), f.handle("import-tournament", (e, t) => {
    if (O(), !t.data)
      throw new Error("Estrutura inválida");
    const n = t.atletas ?? [], o = [];
    for (const a of n) {
      const s = a.nome.trim().toLowerCase();
      o.some(
        (d) => a.id && d.id === a.id || d.nome.trim().toLowerCase() === s && d.anoNascimento === a.anoNascimento
      ) || o.push({
        ...a,
        id: a.id || p.randomUUID(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        nome: s,
        equipe: (a.equipe || "").trim().toLowerCase()
      });
    }
    const r = {
      ...t,
      id: t.id || p.randomUUID(),
      atletas: o,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, i = y(r.id);
    return u.existsSync(i) ? { success: !1, exists: !0 } : (u.writeFileSync(i, JSON.stringify(r, null, 2), "utf-8"), { success: !0 });
  }), f.handle("import-tournament-overwrite", (e, t) => {
    if (O(), !t.id || !t.data)
      throw new Error("Estrutura inválida");
    const n = t.atletas ?? [], o = [];
    for (const a of n) {
      const s = a.nome.trim().toLowerCase();
      o.some(
        (d) => a.id && d.id === a.id || d.nome.trim().toLowerCase() === s && d.anoNascimento === a.anoNascimento
      ) || o.push({
        ...a,
        id: a.id || p.randomUUID(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        nome: s,
        equipe: (a.equipe || "").trim().toLowerCase()
      });
    }
    const r = {
      ...t,
      atletas: o,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, i = y(r.id);
    u.writeFileSync(i, JSON.stringify(r, null, 2), "utf-8");
  }), f.handle("update-tournament", (e, t) => {
    O();
    const n = y(t.id);
    if (!u.existsSync(n)) throw new Error("Torneio não encontrado");
    const o = {
      ...t,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return u.writeFileSync(n, JSON.stringify(o, null, 2), "utf-8"), o;
  }), f.handle("delete-tournament", (e, t) => {
    O();
    const n = y(t);
    if (!u.existsSync(n)) throw new Error("Torneio não encontrado");
    if (u.unlinkSync(n), u.existsSync(x))
      try {
        const { id: o } = JSON.parse(u.readFileSync(x, "utf-8"));
        o === t && u.unlinkSync(x);
      } catch {
      }
  }), f.handle("read-file", async (e, t) => u.readFileSync(t, "utf-8"));
}
const ue = [
  { peso: "galo", nome: "Galo", masculino: 57.5, feminino: 48.5 },
  { peso: "pluma", nome: "Pluma", masculino: 64, feminino: 53.5 },
  { peso: "pena", nome: "Pena", masculino: 70, feminino: 58.5 },
  { peso: "leve", nome: "Leve", masculino: 76, feminino: 64 },
  { peso: "medio", nome: "Médio", masculino: 82.3, feminino: 69 },
  { peso: "meio-pesado", nome: "Meio-Pesado", masculino: 88.3, feminino: 74 },
  { peso: "pesado", nome: "Pesado", masculino: 94.3, feminino: 79.3 },
  { peso: "super-pesado", nome: "Super Pesado", masculino: 97.5, feminino: null },
  { peso: "pesadissimo", nome: "Pesadíssimo", masculino: null, feminino: null }
], fe = {
  "pre-mirim": "Pré-Mirim",
  mirim: "Mirim",
  "infantil-a": "Infantil A",
  "infantil-b": "Infantil B",
  "infanto-juvenil-a": "Infanto-Juvenil A",
  "infanto-juvenil-b": "Infanto-Juvenil B"
}, he = {
  "pre-mirim": { galo: 14.7, pluma: 17.9, pena: 20, leve: 24, medio: 26, "meio-pesado": 29, pesado: 31.2, "super-pesado": 33.2, pesadissimo: null },
  mirim: { galo: 21, pluma: 24, pena: 27, leve: 30.2, medio: 33.2, "meio-pesado": 36.2, pesado: 39.3, "super-pesado": 42.3, pesadissimo: null },
  "infantil-a": { galo: 27, pluma: 30.2, pena: 33.2, leve: 36.2, medio: 39.3, "meio-pesado": 42.3, pesado: 45.3, "super-pesado": 48.3, pesadissimo: null },
  "infantil-b": { galo: 36.2, pluma: 40.3, pena: 44.3, leve: 48.3, medio: 52.5, "meio-pesado": 56.5, pesado: 60.5, "super-pesado": 65, pesadissimo: null },
  "infanto-juvenil-a": { galo: 40.3, pluma: 44.3, pena: 48.3, leve: 52.5, medio: 56.5, "meio-pesado": 60.5, pesado: 65, "super-pesado": 69.5, pesadissimo: null },
  "infanto-juvenil-b": { galo: 48.3, pluma: 52.5, pena: 56.5, leve: 60.5, medio: 65, "meio-pesado": 69.5, pesado: 74, "super-pesado": 78.5, pesadissimo: null }
};
function me(e, t, n) {
  const o = he[e];
  if (o)
    return o[n.peso] ?? null;
  const r = t === "masculino" ? n.masculino : n.feminino;
  return n.peso === "pesadissimo" && t === "feminino" ? null : r;
}
function pe() {
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
  ], t = ["masculino", "feminino"], n = [];
  for (const o of e) {
    const r = fe[o] || o.charAt(0).toUpperCase() + o.slice(1);
    for (const i of t) {
      const a = i === "masculino" ? "Masculino" : "Feminino";
      for (const s of ue) {
        const c = me(o, i, s);
        c !== void 0 && n.push({
          id: `${o}-${i}-${s.peso}`,
          nome: `${r} ${a} ${s.nome}`,
          faixaEtaria: o,
          genero: i,
          peso: s.peso,
          pesoMaximoKg: c
        });
      }
    }
  }
  return n;
}
const H = pe(), we = {};
for (const e of H)
  we[e.id] = e.nome;
const ve = m.join(A.getPath("userData"), "data"), Ie = m.join(ve, "torneios");
function z(e) {
  return m.join(Ie, `${e}.json`);
}
function N(e) {
  const t = z(e);
  if (!u.existsSync(t)) throw new Error("Torneio não encontrado");
  return JSON.parse(u.readFileSync(t, "utf-8"));
}
function P(e) {
  u.writeFileSync(z(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function V(e) {
  const t = N(e), n = t.atletas ?? [];
  let o = !1;
  for (const r of n)
    r.id || (r.id = p.randomUUID(), o = !0), r.createdAt || (r.createdAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0), r.updatedAt || (r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), o = !0);
  return o && (t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(t)), n;
}
function ge(e, t) {
  const n = N(e), o = n.atletas ?? [], r = {
    ...t,
    id: t.id || p.randomUUID(),
    createdAt: t.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return o.push(r), n.atletas = o, n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(n), o;
}
function Se(e, t) {
  const n = N(e), o = n.atletas ?? [], r = o.findIndex((i) => i.id === t.id);
  if (r === -1) throw new Error("Atleta não encontrado");
  return o[r] = t, n.atletas = o, n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(n), o;
}
function Ae(e, t) {
  const n = N(e);
  let o = n.atletas ?? [];
  return o = o.filter((r) => r.id !== t), n.atletas = o, n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(n), o;
}
function Oe(e, t) {
  const n = N(e), o = new Set(t);
  let r = n.atletas ?? [];
  return r = r.filter((i) => !o.has(i.id)), n.atletas = r, n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(n), r;
}
function be(e, t) {
  const n = u.readFileSync(t, "utf-8"), o = JSON.parse(n);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de atletas.");
  const r = new Set(H.map((d) => d.id));
  for (const d of o) {
    if (!d.nome || !d.equipe || !d.faixa || !d.anoNascimento || !d.pesoKg || !d.genero || !d.categoria)
      throw new Error(`Atleta inválido no arquivo: "${d.nome || "sem nome"}" — campos obrigatórios ausentes (categoria, genero).`);
    if (!r.has(d.categoria))
      throw new Error(`Atleta inválido no arquivo: "${d.nome}" — categoria "${d.categoria}" não reconhecida.`);
  }
  const i = N(e), a = i.atletas ?? [];
  let s = 0, c = 0;
  for (const d of o) {
    const l = d.nome.trim().toLowerCase(), w = d.equipe.trim().toLowerCase();
    a.some(
      (g) => d.id && g.id === d.id || g.nome.trim().toLowerCase() === l && g.anoNascimento === d.anoNascimento
    ) ? c++ : (d.nome = l, d.equipe = w, a.push({
      ...d,
      id: d.id || p.randomUUID(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), s++);
  }
  return i.atletas = a, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), P(i), { imported: s, skipped: c };
}
async function De() {
  const e = await E.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
async function ye(e) {
  const t = V(e), n = await E.showSaveDialog({
    title: "Exportar Atletas",
    defaultPath: "atletas.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !n.canceled && n.filePath && u.writeFileSync(n.filePath, JSON.stringify(t, null, 2), "utf-8");
}
const Ee = m.join(A.getPath("userData"), "data"), xe = m.join(Ee, "torneios");
function W(e) {
  return m.join(xe, `${e}.json`);
}
function _(e) {
  const t = W(e);
  if (!u.existsSync(t)) throw new Error("Torneio não encontrado");
  return JSON.parse(u.readFileSync(t, "utf-8"));
}
function j(e) {
  u.writeFileSync(W(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function K(e) {
  return _(e).arbitros ?? [];
}
function Ne(e, t) {
  const n = _(e), o = n.arbitros ?? [], r = (/* @__PURE__ */ new Date()).toISOString(), i = {
    id: p.randomUUID(),
    nome: t.nome.trim().toLowerCase(),
    equipe: (t.equipe ?? "").trim().toLowerCase(),
    faixa: t.faixa,
    chaveIds: t.chaveIds ?? [],
    createdAt: r,
    updatedAt: r
  };
  return o.push(i), n.arbitros = o, n.updatedAt = r, j(n), i;
}
function Pe(e, t) {
  const n = _(e), o = n.arbitros ?? [], r = o.findIndex((a) => a.id === t.id);
  if (r === -1) throw new Error("Árbitro não encontrado");
  const i = (/* @__PURE__ */ new Date()).toISOString();
  return o[r] = {
    ...t,
    nome: t.nome.trim().toLowerCase(),
    updatedAt: i
  }, n.arbitros = o, n.updatedAt = i, j(n), o[r];
}
function _e(e, t) {
  const n = _(e);
  n.arbitros = (n.arbitros ?? []).filter((i) => i.id !== t);
  const r = n.chaves;
  if (r)
    for (const i of r)
      i.arbitroId === t && (i.arbitroId = null);
  n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), j(n);
}
function Te(e, t) {
  const n = _(e), o = new Set(t);
  n.arbitros = (n.arbitros ?? []).filter((a) => !o.has(a.id));
  const i = n.chaves;
  if (i)
    for (const a of i)
      a.arbitroId && o.has(a.arbitroId) && (a.arbitroId = null);
  n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), j(n);
}
async function Le() {
  const e = await E.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
function je(e, t) {
  const n = u.readFileSync(t, "utf-8"), o = JSON.parse(n);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de árbitros.");
  const r = /* @__PURE__ */ new Set(["roxa", "marrom", "preta"]);
  for (const d of o) {
    const l = d;
    if (!l.nome || typeof l.nome != "string" || l.nome.trim().length < 2)
      throw new Error(`Árbitro inválido no arquivo: "${l.nome || "sem nome"}" — nome deve ter ao menos 2 caracteres.`);
    if (!l.faixa || typeof l.faixa != "string" || !r.has(l.faixa))
      throw new Error(`Árbitro inválido no arquivo: "${l.nome}" — faixa inválida.`);
    if (l.equipe !== void 0 && (typeof l.equipe != "string" || l.equipe.trim().length < 2))
      throw new Error(`Árbitro inválido no arquivo: "${l.nome}" — equipe deve ter ao menos 2 caracteres se informada.`);
  }
  const i = _(e), a = i.arbitros ?? [];
  let s = 0, c = 0;
  for (const d of o) {
    const l = d, w = l.nome.trim().toLowerCase();
    a.some((g) => g.nome.trim().toLowerCase() === w) ? c++ : (a.push({
      ...l,
      id: l.id || p.randomUUID(),
      nome: w,
      equipe: l.equipe && typeof l.equipe == "string" ? l.equipe.trim().toLowerCase() : "",
      faixa: l.faixa,
      chaveIds: l.chaveIds ?? [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }), s++);
  }
  return i.arbitros = a, i.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), j(i), { imported: s, skipped: c };
}
async function Fe(e) {
  const t = K(e), n = await E.showSaveDialog({
    title: "Exportar Árbitros",
    defaultPath: "arbitros.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !n.canceled && n.filePath && u.writeFileSync(n.filePath, JSON.stringify(t, null, 2), "utf-8");
}
const Re = m.join(A.getPath("userData"), "data"), Ce = m.join(Re, "torneios");
function G(e) {
  return m.join(Ce, `${e}.json`);
}
function F(e) {
  const t = G(e);
  if (!u.existsSync(t)) throw new Error("Torneio não encontrado");
  return JSON.parse(u.readFileSync(t, "utf-8"));
}
function J(e) {
  u.writeFileSync(G(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function Je(e) {
  return {
    id: e.id,
    nome: e.nome ?? "",
    arbitroIds: Array.isArray(e.arbitroIds) ? e.arbitroIds.filter(Boolean) : e.arbitroId ? [e.arbitroId] : [],
    createdAt: e.createdAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: e.updatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
  };
}
function R(e) {
  return (F(e).areas ?? []).map((n) => Je(n));
}
function X(e, t, n) {
  const o = t ?? [];
  if (o.length === 0) return;
  const r = R(e), i = /* @__PURE__ */ new Set();
  for (const s of r)
    if (s.id !== n)
      for (const c of s.arbitroIds)
        i.add(c);
  if (o.filter((s) => s && i.has(s)).length > 0)
    throw new Error("Um ou mais árbitros já estão atribuídos a outra área de luta.");
}
function qe(e, t) {
  const n = t.arbitroIds ?? [];
  X(e, n);
  const o = F(e), r = R(e), i = (/* @__PURE__ */ new Date()).toISOString(), a = {
    id: p.randomUUID(),
    nome: t.nome.trim(),
    arbitroIds: n.filter(Boolean),
    createdAt: i,
    updatedAt: i
  };
  return r.push(a), o.areas = r, o.updatedAt = i, J(o), a;
}
function Ue(e, t) {
  const n = t.arbitroIds ?? [];
  X(e, n, t.id);
  const o = F(e), r = R(e), i = r.findIndex((s) => s.id === t.id);
  if (i === -1) throw new Error("Área de luta não encontrada");
  const a = (/* @__PURE__ */ new Date()).toISOString();
  return r[i] = {
    ...t,
    nome: t.nome.trim(),
    arbitroIds: n.filter(Boolean),
    updatedAt: a
  }, o.areas = r, o.updatedAt = a, J(o), r[i];
}
function $e(e, t) {
  const n = F(e);
  n.areas = (n.areas ?? []).filter((o) => o.id !== t), n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(n);
}
function Be(e, t) {
  const n = F(e), o = new Set(t);
  n.areas = (n.areas ?? []).filter((r) => !o.has(r.id)), n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), J(n);
}
const Me = m.join(A.getPath("userData"), "data"), ke = m.join(Me, "torneios");
function Y(e) {
  return m.join(ke, `${e}.json`);
}
function S(e) {
  const t = Y(e);
  if (!u.existsSync(t)) throw new Error("Torneio não encontrado");
  return JSON.parse(u.readFileSync(t, "utf-8"));
}
function T(e) {
  u.writeFileSync(Y(e.id), JSON.stringify(e, null, 2), "utf-8");
}
function Z(e) {
  return [...e].sort((t, n) => {
    if (t.pesoKg !== n.pesoKg) return n.pesoKg - t.pesoKg;
    const o = (/* @__PURE__ */ new Date()).getFullYear() - t.anoNascimento, r = (/* @__PURE__ */ new Date()).getFullYear() - n.anoNascimento;
    return o !== r ? r - o : t.nome.localeCompare(n.nome);
  });
}
function He(e) {
  const t = Z(e), n = t.length;
  if (n <= 2) return t;
  let o, r;
  n === 3 ? (o = [0], r = [1, 2]) : n === 4 ? (o = [0, 3], r = [1, 2]) : (o = [0, 3, 4], r = [1, 2]);
  for (const i of [o, r]) {
    const a = /* @__PURE__ */ new Set();
    for (const s of i) {
      const c = t[s].equipe;
      if (c) {
        if (a.has(c)) {
          const d = i === o ? r : o;
          for (const l of d) {
            const w = t[l].equipe;
            if (w !== c && !a.has(w)) {
              [t[s], t[l]] = [t[l], t[s]];
              break;
            }
          }
        }
        a.add(t[s].equipe);
      }
    }
  }
  return t;
}
function Q(e) {
  const t = Z(e), n = t.slice(0, 8), o = t.slice(8, 16);
  for (const r of [n, o]) {
    const i = /* @__PURE__ */ new Map();
    r.forEach((a, s) => {
      if (a.equipe) {
        const c = i.get(a.equipe) ?? [];
        c.push(s), i.set(a.equipe, c);
      }
    });
    for (const [a, s] of i) {
      if (s.length < 2) continue;
      const c = r === n ? o : n;
      for (let d = 1; d < s.length; d++) {
        const l = c.findIndex((w) => w.equipe !== a);
        l >= 0 && ([r[s[d]], c[l]] = [c[l], r[s[d]]]);
      }
    }
  }
  return [...n, ...o];
}
const I = "tbd";
function v(e, t, n, o) {
  return { id: p.randomUUID(), ordem: e, rodada: t, atletaAId: n, atletaBId: o, status: "pending", vencedorId: null };
}
function ze(e) {
  return [v(1, 1, e[0].id, e[1].id)];
}
function Ve(e) {
  return [
    v(1, 1, e[0].id, e[1].id),
    v(2, 2, I, e[2].id),
    v(3, 3, I, I)
  ];
}
function We(e) {
  return [
    v(1, 1, e[0].id, e[3].id),
    v(2, 1, e[1].id, e[2].id),
    v(3, 2, I, I)
  ];
}
function Ke(e) {
  return [
    v(1, 1, e[0].id, e[1].id),
    v(2, 1, e[2].id, e[3].id),
    v(3, 2, I, e[4].id),
    v(4, 3, I, I)
  ];
}
function Ge(e) {
  return e <= 2 ? 1 : e === 3 ? 3 : e <= 4 ? 2 : e <= 8 ? 3 : 4;
}
function Xe(e) {
  const t = [];
  let n = 1;
  for (let o = 0; o < 8; o++)
    t.push(v(n++, 1, e[o * 2].id, e[o * 2 + 1].id));
  for (let o = 0; o < 4; o++)
    t.push(v(n++, 2, I, I));
  for (let o = 0; o < 2; o++)
    t.push(v(n++, 3, I, I));
  return t.push(v(n++, 4, I, I)), t;
}
function ee(e) {
  switch (e.length) {
    case 2:
      return ze(e);
    case 3:
      return Ve(e);
    case 4:
      return We(e);
    case 5:
      return Ke(e);
    case 16:
      return Xe(e);
    default:
      throw new Error("Número inválido de atletas");
  }
}
const M = {
  branca: 0,
  cinza: 1,
  amarela: 2,
  laranja: 3,
  verde: 4,
  azul: 5,
  roxa: 6,
  marrom: 7,
  preta: 8
}, te = 16;
function ne(e, t) {
  if (t.length < 2 || t.length > te)
    throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
  const n = t.length === 16 ? Q(t) : He(t), o = ee(n);
  return {
    id: p.randomUUID(),
    categoriaId: e,
    lutas: o,
    posicoesAtletas: n.map((r) => r.id),
    arbitroId: null,
    totalAtletas: n.length,
    totalLutas: o.length,
    totalRodadas: Ge(n.length),
    status: "gerada"
  };
}
function Ye(e) {
  const t = e.chaves ?? [], n = e.arbitros ?? [];
  if (t.length === 0 || n.length === 0) return;
  for (const i of n)
    i.chaveIds = [];
  const o = t.map((i) => {
    const a = i.posicoesAtletas.map((c) => (e.atletas ?? []).find((d) => d.id === c)).filter((c) => c !== void 0), s = Math.max(...a.map((c) => M[c.faixa] ?? 0), 0);
    return { chave: i, maxLevel: s };
  });
  o.sort((i, a) => a.maxLevel - i.maxLevel);
  const r = /* @__PURE__ */ new Map();
  for (const i of n) r.set(i.id, 0);
  for (const { chave: i, maxLevel: a } of o) {
    const s = n.filter((c) => (M[c.faixa] ?? 0) >= a).sort((c, d) => (r.get(c.id) ?? 0) - (r.get(d.id) ?? 0))[0];
    s && (i.arbitroId = s.id, r.set(s.id, (r.get(s.id) ?? 0) + 1), s.chaveIds.includes(i.id) || s.chaveIds.push(i.id));
  }
}
function Ze(e) {
  const t = e.length;
  if (t <= 5 || t === 16) return [e];
  const n = [];
  for (let o = 0; o < t; o += 5)
    n.push(e.slice(o, o + 5));
  return n;
}
function Qe(e) {
  const t = S(e), n = t.atletas ?? [], o = [], r = /* @__PURE__ */ new Map();
  for (const d of n) {
    if (!d.categoria) {
      o.push(d.nome);
      continue;
    }
    const l = r.get(d.categoria) ?? [];
    l.push(d), r.set(d.categoria, l);
  }
  const i = [], a = [], s = [];
  for (const [d, l] of r) {
    if (l.length === 0) continue;
    if (l.length === 1) {
      a.push(l[0]), s.push({
        categoriaId: d,
        totalAtletas: 1,
        chavesGeradas: 0,
        atletasIgnorados: [...o]
      });
      continue;
    }
    const w = Ze(l);
    let D = 0;
    for (const g of w) {
      if (g.length === 1) {
        a.push(g[0]);
        continue;
      }
      i.push(ne(d, g)), D++;
    }
    s.push({
      categoriaId: d,
      totalAtletas: l.length,
      chavesGeradas: D,
      atletasIgnorados: [...o]
    });
  }
  t.chaves = i, Ye(t);
  const c = /* @__PURE__ */ new Set();
  for (const d of i)
    for (const l of d.posicoesAtletas)
      c.add(l);
  for (const d of t.atletas ?? [])
    d.emChave = c.has(d.id);
  return t.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(t), { chaves: i, metadados: s, atletasSemChave: a };
}
function et(e) {
  var r, i, a;
  const t = e.length;
  if (t < 4) return;
  const n = t === 4 ? [0, 3] : [0, 1], o = t === 4 ? [1, 2] : [2, 3, 4];
  for (const s of [n, o]) {
    const c = /* @__PURE__ */ new Set();
    for (const d of s) {
      const l = (r = e[d]) == null ? void 0 : r.equipe;
      if (l) {
        if (c.has(l)) {
          const w = s === n ? o : n;
          for (const D of w)
            if (((i = e[D]) == null ? void 0 : i.equipe) !== l) {
              [e[d], e[D]] = [e[D], e[d]];
              break;
            }
        }
        (a = e[d]) != null && a.equipe && c.add(e[d].equipe);
      }
    }
  }
}
function tt(e, t) {
  const n = S(e), o = n.chaves ?? [], r = o.findIndex((c) => c.id === t.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const i = o[r], a = [...i.posicoesAtletas];
  for (let c = a.length - 1; c > 0; c--) {
    const d = Math.floor(Math.random() * (c + 1));
    [a[c], a[d]] = [a[d], a[c]];
  }
  const s = a.map((c) => (n.atletas ?? []).find((d) => d.id === c)).filter((c) => c !== void 0);
  if (s.length === 16) {
    const c = Q(s);
    i.posicoesAtletas = c.map((d) => d.id);
  } else
    et(s), i.posicoesAtletas = s.map((c) => c.id);
  i.lutas = ee(s), o[r] = i, n.chaves = o;
  for (const c of n.atletas ?? [])
    i.posicoesAtletas.includes(c.id) && (c.emChave = !0);
  return n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n), i;
}
function nt(e, t) {
  const n = S(e), o = n.chaves ?? [], r = o.findIndex((s) => s.id === t.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const i = o[r], a = i.arbitroId;
  if (a) {
    const s = (n.arbitros ?? []).find((c) => c.id === a);
    s && (s.chaveIds = s.chaveIds.filter((c) => c !== t.chaveId));
  }
  if (t.arbitroId) {
    const s = (n.arbitros ?? []).find((c) => c.id === t.arbitroId);
    if (!s) throw new Error("Árbitro não encontrado no torneio.");
    s.chaveIds.includes(t.chaveId) || s.chaveIds.push(t.chaveId);
  }
  return i.arbitroId = t.arbitroId, o[r] = i, n.chaves = o, n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n), i;
}
async function ot() {
  const e = await E.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  return e.canceled || e.filePaths.length === 0 ? null : e.filePaths[0];
}
function rt(e, t) {
  const n = u.readFileSync(t, "utf-8"), o = JSON.parse(n);
  if (!Array.isArray(o))
    throw new Error("Arquivo inválido: o conteúdo deve ser um array de chaves.");
  const r = S(e), i = o.map((s) => {
    if (!s.categoriaId || !Array.isArray(s.lutas))
      throw new Error("Estrutura de chave inválida no arquivo.");
    return {
      ...s,
      id: s.id || p.randomUUID()
    };
  });
  r.chaves = i;
  const a = /* @__PURE__ */ new Set();
  for (const s of i)
    for (const c of s.posicoesAtletas)
      a.add(c);
  for (const s of r.atletas ?? [])
    s.emChave = a.has(s.id);
  return r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(r), { imported: o.length };
}
async function it(e) {
  const t = S(e), n = t.chaves ?? [], o = await E.showSaveDialog({
    title: "Exportar Chaves",
    defaultPath: `${(t.nome || "torneio").replace(/[^a-zA-Z0-9]/g, "_")}_chaves.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  !o.canceled && o.filePath && u.writeFileSync(o.filePath, JSON.stringify(n, null, 2), "utf-8");
}
function at(e) {
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
    desempateArbitro: e.desempateArbitro ?? void 0
  };
}
function q(e) {
  const t = (e.lutas ?? []).map(at);
  return {
    id: e.id,
    categoriaId: e.categoriaId ?? "",
    lutas: t,
    posicoesAtletas: e.posicoesAtletas ?? [],
    arbitroId: e.arbitroId ?? null,
    totalAtletas: e.totalAtletas ?? 0,
    totalLutas: e.totalLutas ?? 0,
    totalRodadas: e.totalRodadas ?? (t.length > 0 ? Math.max(...t.map((n) => n.rodada)) : 1),
    status: e.status ?? "gerada"
  };
}
function st(e, t) {
  const n = S(e), r = R(e).find((a) => a.id === t);
  if (!r) return [];
  const i = new Set(r.arbitroIds);
  return (n.chaves ?? []).map((a) => q(a)).filter((a) => a.arbitroId && i.has(a.arbitroId));
}
function U(e, t, n) {
  for (const o of e.lutas)
    o.rodada <= t || (o.atletaAId === n && (o.atletaAId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), U(e, o.rodada, n)), o.atletaBId === n && (o.atletaBId = "tbd", o.vencedorId = null, (o.status === "completed" || o.status === "wo") && (o.status = "pending"), U(e, o.rodada, n)));
}
function dt(e, t) {
  const o = e.lutas.filter((i) => i.rodada === t.rodada).indexOf(t);
  if (o < 0) return;
  let r = t.rodada + 1;
  for (; r <= (e.totalRodadas || 3); ) {
    const i = e.lutas.filter((w) => w.rodada === r);
    if (i.length === 0) return;
    const a = Math.pow(2, r - t.rodada - 1), s = Math.floor(o / a);
    if (s >= i.length) return;
    const c = i[s], d = o % Math.pow(2, r - t.rodada), l = Math.floor(d / a);
    if (l === 0 && (c.atletaAId === "tbd" || c.atletaAId === "")) {
      c.atletaAId = t.vencedorId;
      return;
    }
    if (l === 1 && (c.atletaBId === "tbd" || c.atletaBId === "")) {
      c.atletaBId = t.vencedorId;
      return;
    }
    r++;
  }
}
function ct(e, t) {
  const n = t.vencedorId;
  if (!n) return;
  const o = e.lutas.indexOf(t);
  if (!(o < 0)) {
    if (t.rodada === 1) {
      const r = 8 + Math.floor(o / 2), i = o % 2 === 0, a = e.lutas[r];
      a && (i ? a.atletaAId = n : a.atletaBId = n);
    } else if (t.rodada === 2) {
      const r = o - 8, i = 12 + Math.floor(r / 2), a = r % 2 === 0, s = e.lutas[i];
      s && (a ? s.atletaAId = n : s.atletaBId = n);
    } else if (t.rodada === 3) {
      const r = e.lutas[14];
      r && (o - 12 === 0 ? r.atletaAId = n : r.atletaBId = n);
    }
  }
}
function lt(e, t) {
  const n = S(e), o = [...n.chaves ?? []], r = o.findIndex((c) => c.id === t.chaveId);
  if (r < 0) throw new Error("Chave não encontrada");
  const i = JSON.parse(JSON.stringify(o[r])), a = i.lutas.find((c) => c.id === t.lutaId);
  if (!a) throw new Error("Luta não encontrada");
  const s = a.vencedorId;
  if (s && s !== t.vencedorId && U(i, a.rodada, s), a.vencedorId = t.vencedorId, a.status = t.status === "wo" ? "wo" : "completed", a.placarA = t.placarA, a.placarB = t.placarB, a.finalizacao = t.finalizacao ?? !1, a.desclassificacao = t.desclassificacao ?? !1, a.desempateArbitro = t.desempateArbitro ?? !1, i.totalAtletas === 3) {
    const c = i.lutas.find((l) => l.rodada === 2), d = i.lutas.find((l) => l.rodada === 3);
    if (a.rodada === 1) {
      const l = a.vencedorId === a.atletaAId ? a.atletaBId : a.atletaAId;
      c && (c.atletaAId = l, c.vencedorId = null, c.status = "pending"), d && (d.atletaAId = a.vencedorId, d.atletaBId = "tbd", d.vencedorId = null, d.status = "pending");
    } else a.rodada === 2 && d && d.atletaBId === "tbd" && (d.atletaBId = a.vencedorId, d.status = "pending");
  } else i.totalAtletas === 16 ? ct(i, a) : dt(i, a);
  return o[r] = i, n.chaves = o, n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n), i;
}
function ut() {
  f.handle("gerar-todas-chaves", () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Qe(e);
  }), f.handle("gerar-chave", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    const o = S(n), r = (o.atletas ?? []).filter((s) => s.categoria === t.categoriaId);
    if (r.length < 2 || r.length > te)
      throw new Error("A categoria precisa ter entre 2 e 16 atletas para gerar uma chave.");
    const i = o.chaves ?? [];
    if (i.some((s) => s.categoriaId === t.categoriaId))
      throw new Error("Chave já existe para esta categoria.");
    const a = ne(t.categoriaId, r);
    o.chaves = [...i, a];
    for (const s of o.atletas ?? [])
      a.posicoesAtletas.includes(s.id) && (s.emChave = !0);
    return o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(o), a;
  }), f.handle("load-chaves", () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return (S(e).chaves ?? []).map((t) => q(t));
  }), f.handle("load-chave-por-categoria", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return (S(n).chaves ?? []).map((r) => q(r)).find((r) => r.categoriaId === t) ?? null;
  }), f.handle("randomizar-chave", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return tt(n, t);
  }), f.handle("atribuir-arbitro-chave", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return nt(n, t);
  }), f.handle("import-chaves", async () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    const t = await ot();
    return t ? rt(e, t) : { imported: 0 };
  }), f.handle("export-chaves", async () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return it(e);
  }), f.handle("load-chaves-por-area", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return st(n, t);
  }), f.handle("registrar-resultado", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return lt(n, t);
  });
}
const B = process.env.MASTER_PASSWORD_HASH || "57a8d2d84be94e9bdae407ad8352065346269c6997b0be31ff32101fc51e7c3e", ft = "activation.json";
function oe() {
  return m.join(A.getPath("userData"), ft);
}
function re() {
  try {
    return ce("wmic csproduct get uuid", { encoding: "utf-8" }).split(`
`).map((n) => n.trim()).filter(Boolean)[1] || p.randomUUID();
  } catch {
    return p.randomUUID();
  }
}
function ht() {
  try {
    const e = oe();
    if (!u.existsSync(e)) return !1;
    const t = JSON.parse(u.readFileSync(e, "utf-8")), n = re(), o = p.createHmac("sha256", B).update(n).digest("hex");
    return t.token === o;
  } catch {
    return !1;
  }
}
function mt(e) {
  return p.createHash("sha256").update(e).digest("hex") === B;
}
function pt() {
  try {
    const e = re(), t = p.createHmac("sha256", B).update(e).digest("hex"), n = oe();
    return u.writeFileSync(n, JSON.stringify({ token: t, activatedAt: (/* @__PURE__ */ new Date()).toISOString() }), "utf-8"), !0;
  } catch {
    return !1;
  }
}
const ie = m.dirname(de(import.meta.url));
process.env.APP_ROOT = m.join(ie, "..");
const $ = process.env.VITE_DEV_SERVER_URL, Et = m.join(process.env.APP_ROOT, "dist-electron"), ae = m.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = $ ? m.join(process.env.APP_ROOT, "public") : ae;
let b;
function se() {
  b = new k({
    icon: m.join(process.env.VITE_PUBLIC, "favicon.svg"),
    webPreferences: {
      preload: m.join(ie, "preload.mjs")
    }
  }), b.maximize(), b.webContents.on("did-finish-load", () => {
    b == null || b.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), $ ? b.loadURL($) : b.loadFile(m.join(ae, "index.html"));
}
A.on("window-all-closed", () => {
  process.platform !== "darwin" && (A.quit(), b = null);
});
A.on("activate", () => {
  k.getAllWindows().length === 0 && se();
});
function wt() {
  f.handle("load-athletes", () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return V(e);
  }), f.handle("save-athlete", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return ge(n, t);
  }), f.handle("update-athlete", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Se(n, t);
  }), f.handle("delete-athlete", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Ae(n, t);
  }), f.handle("delete-athletes", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Oe(n, t);
  }), f.handle("import-athletes", async () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    const t = await De();
    return t ? be(e, t) : { imported: 0, skipped: 0 };
  }), f.handle("export-athletes", async () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return ye(e);
  });
}
function vt() {
  f.handle("save-arbitro", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Ne(n, t);
  }), f.handle("update-arbitro", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Pe(n, t);
  }), f.handle("delete-arbitro", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return _e(n, t);
  }), f.handle("delete-arbitros", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Te(n, t);
  }), f.handle("load-arbitros", () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return K(e);
  }), f.handle("import-arbitros", async () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    const t = await Le();
    return t ? je(e, t) : { imported: 0, skipped: 0 };
  }), f.handle("export-arbitros", async () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return Fe(e);
  });
}
function It() {
  f.handle("load-areas", () => {
    const e = h();
    if (!e) throw new Error("Nenhum torneio ativo");
    return R(e);
  }), f.handle("save-area", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return qe(n, t);
  }), f.handle("update-area", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Ue(n, t);
  }), f.handle("delete-area", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return $e(n, t);
  }), f.handle("delete-areas", (e, t) => {
    const n = h();
    if (!n) throw new Error("Nenhum torneio ativo");
    return Be(n, t);
  });
}
function gt() {
  f.handle("check-activation", () => ht()), f.handle("validate-password", (e, t) => mt(t)), f.handle("activate-license", () => pt());
}
A.whenReady().then(() => {
  le(), wt(), vt(), ut(), It(), gt(), se();
});
export {
  Et as MAIN_DIST,
  ae as RENDERER_DIST,
  $ as VITE_DEV_SERVER_URL
};
