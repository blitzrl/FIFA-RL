/* =========================================================
   FIFA ROCKET LEAGUE - VIEWER PÚBLICO
   Lee datos.json exportado desde el Admin Gestor
   ========================================================= */

const PLACEHOLDER_LOGO = "https://via.placeholder.com/120/041e42/d4af37?text=RL";
const PLACEHOLDER_BANNER = "https://via.placeholder.com/800x400/041e42/d4af37?text=FIFA+ROCKET+LEAGUE";
const THEME_KEY = "fifa_rl_theme";

let datos = {
  ultimaActualizacion: "",
  afiliados: [],
  selecciones: [],
  jugadores: [],
  partidos: [],
  rankingLigas: [],
  noticias: [],
  competiciones: []
};

let filtroPartidos = "todos";
let filtroLigaSeleccion = "todas";

/* ================= UTILIDADES ================= */

function esc(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mostrarToast(texto) {
  const toast = document.getElementById("toast");
  toast.textContent = texto;
  toast.hidden = false;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function getRankClass(rango = "") {
  const r = rango.toLowerCase();
  if (r.includes("supersonic")) return "rank-ssl";
  if (r.includes("grand")) return "rank-gc";
  if (r.includes("champ")) return "rank-champ";
  if (r.includes("diamond")) return "rank-diamond";
  if (r.includes("plat")) return "rank-plat";
  if (r.includes("gold")) return "rank-gold";
  if (r.includes("silver")) return "rank-silver";
  return "rank-bronze";
}

function formatRango(j) {
  if (j.rango === "Supersonic Legend") return "Supersonic Legend";
  return `${j.rango} ${j.nivelRango} · ${j.division}`;
}

function getSeleccion(id) {
  return datos.selecciones.find((s) => s.id === id);
}

function getLiga(id) {
  return datos.afiliados.find((a) => a.id === id);
}

function getJugador(id) {
  return datos.jugadores.find((j) => j.id === id);
}

function getSeleccionesOrdenadas() {
  return [...datos.selecciones].sort((a, b) => b.puntosActuales - a.puntosActuales);
}

function getLigasOrdenadas() {
  return datos.afiliados
    .map((liga) => {
      const r = datos.rankingLigas.find((x) => x.ligaId === liga.id) || {
        organizacion: 5,
        staff: 5,
        actividad: 5,
        competencia: 5
      };
      const promedio = (r.organizacion + r.staff + r.actividad + r.competencia) / 4;
      return { liga, ...r, promedio };
    })
    .sort((a, b) => b.promedio - a.promedio);
}

/* ================= MODO OSCURO ================= */

function inicializarTema() {
  const toggle = document.getElementById("theme-toggle");
  const guardado = localStorage.getItem(THEME_KEY);
  const prefiereOscuro = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const temaInicial = guardado || (prefiereOscuro ? "dark" : "light");

  aplicarTema(temaInicial);
  toggle.checked = temaInicial === "dark";

  toggle.addEventListener("change", () => {
    const nuevo = toggle.checked ? "dark" : "light";
    aplicarTema(nuevo);
    localStorage.setItem(THEME_KEY, nuevo);
  });
}

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
}

/* ================= NAVEGACIÓN & MÓVIL ================= */

function cambiarVista(tab) {
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".view-section").forEach((s) => {
    s.classList.toggle("active", s.id === `view-${tab}`);
  });
  cerrarMenuMovil();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cerrarMenuMovil() {
  const nav = document.getElementById("nav-links");
  const btn = document.getElementById("btn-hamburger");
  nav.classList.remove("open");
  btn.classList.remove("open");
  btn.setAttribute("aria-expanded", "false");
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => cambiarVista(btn.dataset.tab));
});

document.querySelector(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  cambiarVista("home");
});

document.querySelectorAll("[data-jump]").forEach((btn) => {
  btn.addEventListener("click", () => cambiarVista(btn.dataset.jump));
});

document.getElementById("btn-hamburger").addEventListener("click", () => {
  const nav = document.getElementById("nav-links");
  const btn = document.getElementById("btn-hamburger");
  const abierto = nav.classList.toggle("open");
  btn.classList.toggle("open", abierto);
  btn.setAttribute("aria-expanded", String(abierto));
});

/* ================= CARGA DE DATOS.JSON ================= */

async function cargarDatos() {
  try {
    const res = await fetch(`./datos.json?v=${Date.now()}`);
    if (!res.ok) throw new Error("No se encontró datos.json");
    datos = await res.json();
    document.getElementById("cors-banner").hidden = true;
    renderTodo();
  } catch (err) {
    console.warn("Error cargando datos.json:", err);
    document.getElementById("cors-banner").hidden = false;
    renderTodo();
  }
}

document.getElementById("btn-manual-json").addEventListener("click", () => {
  document.getElementById("manual-json-input").click();
});

document.getElementById("manual-json-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      datos = JSON.parse(ev.target.result);
      document.getElementById("cors-banner").hidden = true;
      renderTodo();
      mostrarToast("datos.json cargado correctamente");
    } catch {
      alert("El archivo seleccionado no es un JSON válido.");
    }
  };
  reader.readAsText(file);
});

/* ================= 1. HOME (WIDGETS) ================= */

function renderHome() {
  const jugadoresActivos = datos.jugadores.filter((j) => j.activo).length;
  document.getElementById("home-kpis").innerHTML = `
    <div class="kpi-pill"><div class="kpi-num">${datos.afiliados.length}</div><div class="kpi-lbl">Ligas Afiliadas</div></div>
    <div class="kpi-pill"><div class="kpi-num">${datos.selecciones.length}</div><div class="kpi-lbl">Selecciones</div></div>
    <div class="kpi-pill"><div class="kpi-num">${jugadoresActivos}</div><div class="kpi-lbl">Convocados</div></div>
    <div class="kpi-pill"><div class="kpi-num">${datos.partidos.length}</div><div class="kpi-lbl">Partidos</div></div>
  `;

  // Widget Noticia Destacada
  const wNoticia = document.getElementById("widget-noticia");
  const ultima = datos.noticias[0];
  if (ultima) {
    wNoticia.innerHTML = `
      <div class="widget-head">
        <h3>📰 Última Noticia</h3>
        <button class="link-btn" onclick="cambiarVista('noticias')">Ver todas →</button>
      </div>
      <div class="featured-news-card" onclick="abrirModalNoticia(${ultima.id})">
        <img src="${esc(ultima.banner || PLACEHOLDER_BANNER)}" alt="" onerror="this.src='${PLACEHOLDER_BANNER}'" />
        <div>
          <span class="badge">${esc(ultima.categoria)}</span>
          <span class="muted" style="margin-left:8px;">${esc(ultima.fecha)}</span>
          <h3 style="font-size:1.25rem;margin:8px 0;">${esc(ultima.titulo)}</h3>
          <p class="news-excerpt">${esc(ultima.texto)}</p>
        </div>
      </div>
    `;
  } else {
    wNoticia.innerHTML = `<div class="widget-head"><h3>📰 Última Noticia</h3></div><div class="empty-state">Sin noticias publicadas.</div>`;
  }

  // Widget Partidos
  const wPartidos = document.getElementById("widget-partidos");
  const ultimosPartidos = datos.partidos.slice(0, 4);
  wPartidos.innerHTML = `
    <div class="widget-head">
      <h3>⚽ Cartelera de Partidos</h3>
      <button class="link-btn" onclick="cambiarVista('partidos')">Ver todos →</button>
    </div>
    ${
      ultimosPartidos.length
        ? `<div class="mini-list">
            ${ultimosPartidos
              .map((p) => {
                const l = getSeleccion(p.localId);
                const v = getSeleccion(p.visitanteId);
                const score = p.estado === "Finalizado" ? `${p.seriesLocal} - ${p.seriesVisitante}` : "VS";
                return `
                  <div class="mini-row" onclick="abrirModalPartido(${p.id})">
                    <div class="mini-left">
                      <span class="badge">${esc(p.formato)}</span>
                      <strong>${esc(l?.tag || "?")} ${score} ${esc(v?.tag || "?")}</strong>
                    </div>
                    <span class="badge ${p.estado === "Finalizado" ? "green" : "gold"}">${esc(p.estado)}</span>
                  </div>
                `;
              })
              .join("")}
          </div>`
        : `<div class="empty-state">No hay partidos programados.</div>`
    }
  `;

  // Widget Top 5 Selecciones
  const topSel = getSeleccionesOrdenadas().slice(0, 5);
  document.getElementById("widget-top-selecciones").innerHTML = `
    <div class="widget-head">
      <h3>🌍 Top 5 Ranking Selecciones</h3>
      <button class="link-btn" onclick="cambiarVista('ranking')">Ranking completo →</button>
    </div>
    ${
      topSel.length
        ? `<div class="mini-list">
            ${topSel
              .map(
                (s, i) => `
              <div class="mini-row" onclick="abrirModalSeleccion(${s.id})">
                <div class="mini-left">
                  <span class="rank-num">${i + 1}</span>
                  <img class="avatar-sm" src="${esc(s.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
                  <div>
                    <strong>${esc(s.nombre)}</strong>
                    <div class="muted" style="font-size:.74rem;">${esc(s.tag)}</div>
                  </div>
                </div>
                <strong>${s.puntosActuales.toFixed(1)} pts</strong>
              </div>
            `
              )
              .join("")}
          </div>`
        : `<div class="empty-state">Sin selecciones registradas.</div>`
    }
  `;

  // Widget Top 5 Ligas
  const topLigas = getLigasOrdenadas().slice(0, 5);
  document.getElementById("widget-top-ligas").innerHTML = `
    <div class="widget-head">
      <h3>🛡️ Top Ranking Ligas</h3>
      <button class="link-btn" onclick="irARankingLigas()">Ver evaluación →</button>
    </div>
    ${
      topLigas.length
        ? `<div class="mini-list">
            ${topLigas
              .map(
                (item, i) => `
              <div class="mini-row" onclick="irARankingLigas()">
                <div class="mini-left">
                  <span class="rank-num">${i + 1}</span>
                  <img class="avatar-sm" src="${esc(item.liga.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
                  <div>
                    <strong>${esc(item.liga.nombre)}</strong>
                    <div class="muted" style="font-size:.74rem;">${esc(item.liga.region)}</div>
                  </div>
                </div>
                <span class="badge gold">${item.promedio.toFixed(2)} / 10</span>
              </div>
            `
              )
              .join("")}
          </div>`
        : `<div class="empty-state">Sin ligas evaluadas.</div>`
    }
  `;

  // Widget Competición
  const wComp = document.getElementById("widget-competicion");
  const comp = datos.competiciones[0];
  wComp.innerHTML = `
    <div class="widget-head">
      <h3>🥇 Competición Destacada</h3>
      <button class="link-btn" onclick="cambiarVista('competiciones')">Ver todas →</button>
    </div>
    ${
      comp
        ? `
        <div class="card-top-media" style="margin-bottom:4px;">
          <img class="card-logo" src="${esc(comp.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
          <div>
            <span class="badge gold">${esc(comp.estado)}</span>
            <h3 style="margin-top:4px;">${esc(comp.nombre)}</h3>
            <p class="muted">${esc(comp.formato)}</p>
          </div>
        </div>
        <div class="comp-meta-grid">
          <div class="meta-box"><small>Campeón actual</small><strong>${esc(comp.campeonActual)}</strong></div>
          <div class="meta-box"><small>Edición</small><strong>${esc(comp.proximaEdicion)}</strong></div>
        </div>
      `
        : `<div class="empty-state">Sin competiciones activas.</div>`
    }
  `;
}

window.irARankingLigas = function () {
  cambiarVista("ranking");
  activarPanelRanking("ligas");
};

/* ================= 2. AFILIADOS ================= */

function renderAfiliados() {
  document.getElementById("count-afiliados").textContent = `${datos.afiliados.length} ligas afiliadas`;
  const cont = document.getElementById("grid-afiliados");
  if (!datos.afiliados.length) {
    cont.innerHTML = `<div class="empty-state">Aún no hay ligas afiliadas registradas.</div>`;
    return;
  }

  cont.innerHTML = datos.afiliados
    .map((a) => {
      const seleccionesVinculadas = datos.selecciones.filter((s) => s.ligaAfiliadaId === a.id);
      return `
        <article class="card">
          <div class="card-top-media">
            <img class="card-logo" src="${esc(a.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
            <div>
              <h3>${esc(a.nombre)}</h3>
              <div class="muted">${esc(a.region)} · ${a.equipos} equipos</div>
              <span class="badge green" style="margin-top:6px;">${esc(a.estado)}</span>
            </div>
          </div>
          ${a.descripcion ? `<p class="muted">${esc(a.descripcion)}</p>` : ""}
          <div class="chips-row">
            ${
              seleccionesVinculadas.length
                ? seleccionesVinculadas
                    .map(
                      (s) =>
                        `<button class="copy-chip" onclick="abrirModalSeleccion(${s.id})">🌍 ${esc(s.nombre)} (${esc(s.tag)})</button>`
                    )
                    .join("")
                : `<span class="badge gray">Sin selecciones vinculadas</span>`
            }
          </div>
        </article>
      `;
    })
    .join("");
}

/* ================= 3. SELECCIONES ================= */

function renderSelecciones() {
  const select = document.getElementById("filtro-liga-seleccion");
  select.innerHTML =
    `<option value="todas">Todas las ligas</option>` +
    datos.afiliados.map((a) => `<option value="${a.id}">${esc(a.nombre)}</option>`).join("");
  select.value = filtroLigaSeleccion;

  const lista = datos.selecciones.filter(
    (s) => filtroLigaSeleccion === "todas" || String(s.ligaAfiliadaId) === String(filtroLigaSeleccion)
  );

  const cont = document.getElementById("grid-selecciones");
  if (!lista.length) {
    cont.innerHTML = `<div class="empty-state">No hay selecciones para mostrar.</div>`;
    return;
  }

  cont.innerHTML = lista
    .map((s) => {
      const liga = getLiga(s.ligaAfiliadaId);
      const convocados = datos.jugadores.filter((j) => j.seleccionId === s.id && j.activo);
      return `
        <article class="card clickable" onclick="abrirModalSeleccion(${s.id})">
          <div class="card-top-media">
            <img class="card-logo" src="${esc(s.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
            <div>
              <h3>${esc(s.nombre)} <span class="badge gold">${esc(s.tag)}</span></h3>
              <div class="muted">${esc(liga ? liga.nombre : "Independiente")}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border);">
            <span class="muted">👥 <strong>${convocados.length}</strong> convocado(s)</span>
            <span class="badge">${s.puntosActuales.toFixed(1)} pts Elo</span>
          </div>
        </article>
      `;
    })
    .join("");
}

document.getElementById("filtro-liga-seleccion").addEventListener("change", (e) => {
  filtroLigaSeleccion = e.target.value;
  renderSelecciones();
});

window.abrirModalSeleccion = function (seleccionId) {
  const sel = getSeleccion(seleccionId);
  if (!sel) return;
  const liga = getLiga(sel.ligaAfiliadaId);
  const convocados = datos.jugadores.filter((j) => j.seleccionId === sel.id && j.activo);

  document.getElementById("modal-sel-header").innerHTML = `
    <img class="avatar-sm" src="${esc(sel.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
    <div>
      <h3 style="margin:0;">${esc(sel.nombre)} (${esc(sel.tag)})</h3>
      <small style="color:#cbd5e1;">${esc(liga ? liga.nombre : "Sin liga")} · ${sel.puntosActuales.toFixed(1)} pts Elo</small>
    </div>
  `;

  const body = document.getElementById("modal-sel-body");
  if (!convocados.length) {
    body.innerHTML = `<div class="empty-state">Esta selección no tiene jugadores activos convocados actualmente.</div>`;
  } else {
    body.innerHTML = `
      <p class="muted">Convocatoria activa (${convocados.length} jugadores). Haz clic en el Discord para copiar el usuario.</p>
      <div class="players-grid">
        ${convocados
          .map(
            (j) => `
          <div class="player-card">
            <div class="player-head">
              <img class="player-avatar" src="${esc(j.foto || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
              <div>
                <h4 style="font-size:1rem;">${esc(j.gamertag)}</h4>
                <div class="muted">🌍 ${esc(j.nacionalidad)}</div>
              </div>
            </div>
            <div>
              <span class="rank-pill ${getRankClass(j.rango)}">${esc(formatRango(j))}</span>
            </div>
            <div class="player-socials">
              ${
                j.discord
                  ? `<button class="copy-chip" onclick="copiarTexto('${esc(j.discord)}', 'Discord copiado')">💬 ${esc(j.discord)}</button>`
                  : ""
              }
              ${
                j.redes
                  ? `<span class="badge gray">🔗 ${esc(j.redes)}</span>`
                  : ""
              }
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  document.getElementById("modal-seleccion").hidden = false;
};

window.copiarTexto = function (texto, msg) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => mostrarToast(msg));
  } else {
    mostrarToast(texto);
  }
};

/* ================= 4. PARTIDOS Y MATCH CENTER ================= */

function renderPartidos() {
  const lista = datos.partidos.filter((p) => filtroPartidos === "todos" || p.estado === filtroPartidos);
  const cont = document.getElementById("grid-partidos");

  if (!lista.length) {
    cont.innerHTML = `<div class="empty-state">No hay partidos registrados en esta vista.</div>`;
    return;
  }

  cont.innerHTML = lista
    .map((p) => {
      const local = getSeleccion(p.localId);
      const vis = getSeleccion(p.visitanteId);
      const finalizado = p.estado === "Finalizado";

      return `
        <article class="match-card clickable" onclick="abrirModalPartido(${p.id})">
          <div class="match-team">
            <img src="${esc(local?.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
            <div>
              <div class="match-team-name">${esc(local?.nombre || "Por definir")}</div>
              <span class="badge gold">${esc(local?.tag || "LOC")}</span>
            </div>
          </div>

          <div class="match-center">
            ${
              finalizado
                ? `<div class="match-score">${p.seriesLocal} - ${p.seriesVisitante}</div>`
                : `<div class="match-vs">VS</div>`
            }
            <div class="match-meta-row">
              <span class="badge">${esc(p.formato)}</span>
              <span class="badge ${finalizado ? "green" : "gold"}">${esc(p.estado)}</span>
            </div>
            <div class="muted" style="font-size:.74rem;margin-top:4px;">
              ${esc(p.tipo)} · ${esc(p.fecha)} ${esc(p.hora || "")}
            </div>
          </div>

          <div class="match-team away">
            <div>
              <div class="match-team-name">${esc(vis?.nombre || "Por definir")}</div>
              <span class="badge gold">${esc(vis?.tag || "VIS")}</span>
            </div>
            <img src="${esc(vis?.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
          </div>
        </article>
      `;
    })
    .join("");
}

document.querySelectorAll("#partidos-tabs .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#partidos-tabs .seg-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filtroPartidos = btn.dataset.filter;
    renderPartidos();
  });
});

window.abrirModalPartido = function (partidoId) {
  const p = datos.partidos.find((x) => x.id === partidoId);
  if (!p) return;
  const local = getSeleccion(p.localId);
  const vis = getSeleccion(p.visitanteId);
  const body = document.getElementById("modal-partido-body");

  const scoreboardHtml = `
    <div class="mc-scoreboard">
      <div class="match-team">
        <img src="${esc(local?.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
        <div>
          <div class="match-team-name">${esc(local?.nombre || "Local")}</div>
          <small style="color:#cbd5e1;">${esc(local?.tag || "")}</small>
        </div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:2.1rem;font-weight:900;color:var(--fifa-gold);letter-spacing:3px;">
          ${p.estado === "Finalizado" ? `${p.seriesLocal} - ${p.seriesVisitante}` : "VS"}
        </div>
        <div style="font-size:.78rem;color:#cbd5e1;">${esc(p.formato)} · ${esc(p.tipo)} · ${esc(p.fecha)}</div>
      </div>
      <div class="match-team away">
        <div>
          <div class="match-team-name">${esc(vis?.nombre || "Visitante")}</div>
          <small style="color:#cbd5e1;">${esc(vis?.tag || "")}</small>
        </div>
        <img src="${esc(vis?.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
      </div>
    </div>
  `;

  if (!p.games || !p.games.length) {
    body.innerHTML =
      scoreboardHtml +
      `<div class="empty-state">Este partido aún no tiene resultados ni estadísticas reportadas.</div>`;
    document.getElementById("modal-partido").hidden = false;
    return;
  }

  // Pestañas: Totales de la Serie + Partida 1..N
  const tabsHtml = `
    <div class="mc-tabs" id="mc-game-tabs">
      <button class="mc-tab-btn active" data-game="total">📊 Total Serie</button>
      ${p.games
        .map(
          (g, idx) =>
            `<button class="mc-tab-btn" data-game="${idx}">🎮 Partida ${g.numeroJuego} (${g.golesLocal}-${g.golesVisitante})</button>`
        )
        .join("")}
    </div>
    <div id="mc-game-detail"></div>
  `;

  body.innerHTML = scoreboardHtml + tabsHtml;

  const renderDetalleJuego = (clave) => {
    const cont = document.getElementById("mc-game-detail");
    let statsLista = [];
    let cabecera = "";

    if (clave === "total") {
      const mapa = new Map();
      let totalGolesL = 0;
      let totalGolesV = 0;
      p.games.forEach((g) => {
        totalGolesL += g.golesLocal;
        totalGolesV += g.golesVisitante;
        g.statsJugadores.forEach((st) => {
          if (!mapa.has(st.jugadorId)) {
            mapa.set(st.jugadorId, { ...st });
          } else {
            const acc = mapa.get(st.jugadorId);
            acc.goles += st.goles;
            acc.asistencias += st.asistencias;
            acc.salvadas += st.salvadas;
            acc.tiros += st.tiros;
          }
        });
      });
      statsLista = [...mapa.values()];
      cabecera = `
        <div class="game-summary-bar">
          <span>Acumulado total de la serie (${p.games.length} partidas)</span>
          <span class="badge gold">Goles totales: ${local?.tag || "LOC"} ${totalGolesL} - ${totalGolesV} ${vis?.tag || "VIS"}</span>
        </div>
      `;
    } else {
      const g = p.games[Number(clave)];
      statsLista = g.statsJugadores;
      cabecera = `
        <div class="game-summary-bar">
          <span>🎮 Partida ${g.numeroJuego}</span>
          <span>${esc(local?.nombre || "Local")} <strong>${g.golesLocal} - ${g.golesVisitante}</strong> ${esc(vis?.nombre || "Visitante")}</span>
        </div>
      `;
    }

    const renderTabla = (seleccionId, nombre) => {
      const filas = statsLista
        .filter((st) => st.seleccionId === seleccionId)
        .sort((a, b) => b.goles - a.goles || b.asistencias - a.asistencias);

      return `
        <div class="stats-team-box">
          <div class="stats-team-title">${esc(nombre)}</div>
          <div class="table-responsive">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>⚽ G</th>
                  <th>🎯 A</th>
                  <th>🧤 S</th>
                  <th>🚀 T</th>
                </tr>
              </thead>
              <tbody>
                ${
                  filas.length
                    ? filas
                        .map((st) => {
                          const j = getJugador(st.jugadorId);
                          return `
                            <tr>
                              <td>${esc(j ? j.gamertag : "Jugador #" + st.jugadorId)}</td>
                              <td><strong>${st.goles}</strong></td>
                              <td>${st.asistencias}</td>
                              <td>${st.salvadas}</td>
                              <td>${st.tiros}</td>
                            </tr>
                          `;
                        })
                        .join("")
                    : `<tr><td colspan="5" class="muted">Sin estadísticas registradas</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      `;
    };

    cont.innerHTML =
      cabecera +
      `<div class="stats-two-col">
        ${renderTabla(p.localId, local?.nombre || "Local")}
        ${renderTabla(p.visitanteId, vis?.nombre || "Visitante")}
      </div>`;
  };

  renderDetalleJuego("total");

  body.querySelectorAll("#mc-game-tabs .mc-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      body.querySelectorAll("#mc-game-tabs .mc-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderDetalleJuego(btn.dataset.game);
    });
  });

  document.getElementById("modal-partido").hidden = false;
};

/* ================= 5. RANKING MUNDIAL ================= */

function activarPanelRanking(tipo) {
  document.querySelectorAll("#ranking-switcher .seg-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.rank === tipo);
  });
  document.getElementById("rank-panel-selecciones").classList.toggle("active", tipo === "selecciones");
  document.getElementById("rank-panel-ligas").classList.toggle("active", tipo === "ligas");
}

document.querySelectorAll("#ranking-switcher .seg-btn").forEach((btn) => {
  btn.addEventListener("click", () => activarPanelRanking(btn.dataset.rank));
});

function renderRanking() {
  // Selecciones
  const ordenadas = getSeleccionesOrdenadas();
  const tbody = document.getElementById("tbody-ranking-selecciones");
  if (!ordenadas.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;" class="muted">No hay selecciones en el ranking.</td></tr>`;
  } else {
    tbody.innerHTML = ordenadas
      .map((s, idx) => {
        const liga = getLiga(s.ligaAfiliadaId);
        const diff = Number((s.puntosActuales - s.puntosAnteriores).toFixed(1));
        const diffHtml =
          diff > 0
            ? `<span class="delta-up">▲ +${diff}</span>`
            : diff < 0
              ? `<span class="delta-down">▼ ${diff}</span>`
              : `<span class="muted">— 0.0</span>`;

        return `
          <tr>
            <td><span class="rank-num">${idx + 1}</span></td>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <img class="avatar-sm" src="${esc(s.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
                <strong>${esc(s.nombre)}</strong>
                <span class="badge gold">${esc(s.tag)}</span>
              </div>
            </td>
            <td>${esc(liga ? liga.nombre : "-")}</td>
            <td class="num muted">${s.puntosAnteriores.toFixed(1)}</td>
            <td class="num">${diffHtml}</td>
            <td class="num"><strong>${s.puntosActuales.toFixed(1)}</strong></td>
            <td class="num"><button class="btn btn-outline btn-sm" onclick="abrirModalSeleccion(${s.id})">Plantilla</button></td>
          </tr>
        `;
      })
      .join("");
  }

  // Ligas (1 - 10)
  const ligasOrdenadas = getLigasOrdenadas();
  const contLigas = document.getElementById("grid-ranking-ligas");
  if (!ligasOrdenadas.length) {
    contLigas.innerHTML = `<div class="empty-state">No hay ligas evaluadas todavía.</div>`;
    return;
  }

  const renderBarra = (label, valor) => `
    <div class="bar-row">
      <div class="bar-labels">
        <span>${label}</span>
        <span>${valor}/10</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.min(100, valor * 10)}%"></div>
      </div>
    </div>
  `;

  contLigas.innerHTML = ligasOrdenadas
    .map(
      (item, idx) => `
      <article class="card">
        <div class="league-rank-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="rank-num">${idx + 1}</span>
            <img class="avatar-sm" src="${esc(item.liga.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
            <div>
              <h3>${esc(item.liga.nombre)}</h3>
              <div class="muted">${esc(item.liga.region)}</div>
            </div>
          </div>
          <div class="score-circle">${item.promedio.toFixed(2)}</div>
        </div>
        <div class="criteria-bars">
          ${renderBarra("Organización", item.organizacion)}
          ${renderBarra("Staff", item.staff)}
          ${renderBarra("Actividad", item.actividad)}
          ${renderBarra("Competencia", item.competencia)}
        </div>
      </article>
    `
    )
    .join("");
}

/* ================= 6. NOTICIAS ================= */

function renderNoticias() {
  const cont = document.getElementById("grid-noticias");
  if (!datos.noticias.length) {
    cont.innerHTML = `<div class="empty-state">No hay noticias publicadas aún.</div>`;
    return;
  }

  cont.innerHTML = datos.noticias
    .map(
      (n) => `
      <article class="card news-card clickable" onclick="abrirModalNoticia(${n.id})">
        <img class="news-banner" src="${esc(n.banner || PLACEHOLDER_BANNER)}" alt="" onerror="this.src='${PLACEHOLDER_BANNER}'" />
        <div class="news-body">
          <div>
            <span class="badge">${esc(n.categoria)}</span>
            <span class="muted" style="margin-left:8px;font-size:.76rem;">${esc(n.fecha)}</span>
          </div>
          <h3>${esc(n.titulo)}</h3>
          <p class="news-excerpt">${esc(n.texto)}</p>
        </div>
      </article>
    `
    )
    .join("");
}

window.abrirModalNoticia = function (id) {
  const n = datos.noticias.find((x) => x.id === id);
  if (!n) return;
  document.getElementById("modal-noticia-cat").textContent = `${n.categoria} · ${n.fecha}`;
  document.getElementById("modal-noticia-body").innerHTML = `
    <img src="${esc(n.banner || PLACEHOLDER_BANNER)}" alt="" style="width:100%;max-height:280px;object-fit:cover;border-radius:12px;margin-bottom:16px;" onerror="this.src='${PLACEHOLDER_BANNER}'" />
    <h2 style="font-size:1.4rem;margin-bottom:12px;">${esc(n.titulo)}</h2>
    <p style="white-space:pre-line;font-size:.94rem;">${esc(n.texto)}</p>
  `;
  document.getElementById("modal-noticia").hidden = false;
};

/* ================= 7. COMPETICIONES ================= */

function renderCompeticiones() {
  const cont = document.getElementById("grid-competiciones");
  if (!datos.competiciones.length) {
    cont.innerHTML = `<div class="empty-state">No hay competiciones registradas todavía.</div>`;
    return;
  }

  cont.innerHTML = datos.competiciones
    .map(
      (c) => `
      <article class="card comp-card">
        <div class="card-top-media">
          <img class="card-logo" src="${esc(c.logo || PLACEHOLDER_LOGO)}" alt="" onerror="this.src='${PLACEHOLDER_LOGO}'" />
          <div>
            <span class="badge gold">${esc(c.estado)}</span>
            <h3 style="margin-top:6px;">${esc(c.nombre)}</h3>
            <p class="muted">${esc(c.formato)}</p>
          </div>
        </div>
        <div class="comp-meta-grid">
          <div class="meta-box">
            <small>Campeón Actual</small>
            <strong>🏆 ${esc(c.campeonActual)}</strong>
          </div>
          <div class="meta-box">
            <small>Próxima Edición</small>
            <strong>📅 ${esc(c.proximaEdicion)}</strong>
          </div>
        </div>
      </article>
    `
    )
    .join("");
}

/* ================= CIERRE DE MODALES & ARRANQUE ================= */

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById(btn.dataset.close).hidden = true;
  });
});

document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay").forEach((m) => (m.hidden = true));
  }
});

function renderTodo() {
  document.getElementById("footer-updated").textContent =
    `Última actualización: ${datos.ultimaActualizacion || "—"}`;
  renderHome();
  renderAfiliados();
  renderSelecciones();
  renderPartidos();
  renderRanking();
  renderNoticias();
  renderCompeticiones();
}

inicializarTema();
cargarDatos();