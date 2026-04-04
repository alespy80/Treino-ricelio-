let objSelecionado = "gordura_abdominal";
let semanasConc = new Set(JSON.parse(localStorage.getItem("proj_semanas") || "[]"));
let dadosAtual = null;

// ── INTRO ──
function iniciar() {
  const intro = document.getElementById("intro");
  intro.style.opacity = "0";
  setTimeout(() => { intro.style.display = "none"; document.getElementById("app").classList.remove("oculto"); }, 500);
}

// ── ALUNOS SALVOS ──
function getAlunos() {
  return JSON.parse(localStorage.getItem("proj_alunos") || "[]");
}

function salvarAluno() {
  if (!dadosAtual) { alert("Gere a projeção primeiro."); return; }
  const alunos = getAlunos();
  const id = dadosAtual.nome.toLowerCase().replace(/\s+/g,"_") + "_" + Date.now();
  const entrada = {
    id,
    nome:      dadosAtual.nome,
    data:      dadosAtual.dataAval || new Date().toISOString().split("T")[0],
    objetivo:  objSelecionado,
    peso:      dadosAtual.peso,
    gordura:   dadosAtual.gordura,
    semanas:   dadosAtual.semanas,
    dados:     dadosAtual,
    obj:       objSelecionado,
    semConc:   [...semanasConc]
  };
  // Substituir se mesmo nome
  const idx = alunos.findIndex(a => a.nome.toLowerCase() === dadosAtual.nome.toLowerCase());
  if (idx >= 0) alunos[idx] = entrada;
  else alunos.unshift(entrada);
  localStorage.setItem("proj_alunos", JSON.stringify(alunos));
  toast("Aluno salvo com sucesso!");
  renderAlunosSalvos();
}

function carregarAluno(id) {
  const alunos = getAlunos();
  const a = alunos.find(x => x.id === id);
  if (!a) return;
  dadosAtual = a.dados;
  objSelecionado = a.obj;
  semanasConc = new Set(a.semConc || []);
  localStorage.setItem("proj_semanas", JSON.stringify([...semanasConc]));
  // Fechar intro e ir para resultado
  const intro = document.getElementById("intro");
  intro.style.opacity = "0";
  setTimeout(() => {
    intro.style.display = "none";
    document.getElementById("app").classList.remove("oculto");
    renderResultado(dadosAtual);
    irPara(4);
  }, 400);
}

function excluirAluno(id, e) {
  e.stopPropagation();
  if (!confirm("Excluir este aluno?")) return;
  const alunos = getAlunos().filter(a => a.id !== id);
  localStorage.setItem("proj_alunos", JSON.stringify(alunos));
  renderAlunosSalvos();
}

function renderAlunosSalvos() {
  const wrap = document.getElementById("alunos-salvos-wrap");
  if (!wrap) return;
  const alunos = getAlunos();
  if (!alunos.length) { wrap.innerHTML = ""; return; }

  wrap.innerHTML = `
    <div class="alunos-lista-titulo">Alunos Salvos</div>
    <div class="alunos-lista">
      ${alunos.map(a => `
        <div class="aluno-item" onclick="carregarAluno('${a.id}')">
          <div class="ai-avatar">${a.nome.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase()}</div>
          <div class="ai-info">
            <div class="ai-nome">${a.nome}</div>
            <div class="ai-meta">${objLabels[a.objetivo]||a.objetivo} · ${a.semanas} semanas · ${a.peso||"—"} kg</div>
          </div>
          <button class="ai-del" onclick="excluirAluno('${a.id}', event)" title="Excluir">✕</button>
        </div>
      `).join("")}
    </div>
  `;
}

// ── PAINEL DE ALUNOS ──
function abrirPainelAlunos() {
  document.getElementById("painel-overlay").classList.add("aberto");
  document.getElementById("busca-aluno").value = "";
  filtrarAlunos();
}

function fecharPainelAlunos(forcar) {
  if (forcar === true || forcar?.target?.id === "painel-overlay") {
    document.getElementById("painel-overlay").classList.remove("aberto");
  }
}

function filtrarAlunos() {
  const busca = document.getElementById("busca-aluno").value.toLowerCase().trim();
  const alunos = getAlunos();
  const filtrados = busca ? alunos.filter(a => a.nome.toLowerCase().includes(busca)) : alunos;

  // Stats
  const stats = document.getElementById("painel-stats");
  stats.innerHTML = `
    <div class="ps-item"><span>${alunos.length}</span> aluno${alunos.length !== 1 ? "s" : ""} salvos</div>
    ${busca ? `<div class="ps-item ps-filtro">${filtrados.length} resultado${filtrados.length !== 1 ? "s" : ""}</div>` : ""}
  `;

  // Lista
  const lista = document.getElementById("painel-lista");
  if (!filtrados.length) {
    lista.innerHTML = `<div class="painel-vazio">${busca ? "Nenhum aluno encontrado." : "Nenhum aluno salvo ainda."}</div>`;
    return;
  }

  lista.innerHTML = filtrados.map(a => {
    const iniciais = a.nome.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();
    const dataFmt  = a.data ? new Date(a.data+"T12:00").toLocaleDateString("pt-BR") : "—";
    const semConc  = (a.semConc || []).length;
    const pct      = a.semanas > 0 ? Math.round(semConc / a.semanas * 100) : 0;
    return `
      <div class="painel-aluno-item">
        <div class="pai-avatar">${iniciais}</div>
        <div class="pai-info">
          <div class="pai-nome">${destacarBusca(a.nome, busca)}</div>
          <div class="pai-meta">${objLabels[a.objetivo]||a.objetivo} · ${a.peso||"—"} kg · ${dataFmt}</div>
          <div class="pai-prog">
            <div class="pai-prog-barra"><div class="pai-prog-fill" style="width:${pct}%"></div></div>
            <span class="pai-prog-txt">${pct}% concluído (${semConc}/${a.semanas} sem.)</span>
          </div>
        </div>
        <div class="pai-acoes">
          <button class="pai-btn pai-btn-ver" onclick="verAluno('${a.id}')">Ver</button>
          <button class="pai-btn pai-btn-del" onclick="excluirAlunoPainel('${a.id}')">✕</button>
        </div>
      </div>
    `;
  }).join("");
}

function destacarBusca(nome, busca) {
  if (!busca) return nome;
  const re = new RegExp(`(${busca.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi");
  return nome.replace(re, `<mark style="background:rgba(99,102,241,.3);color:#a5b4fc;border-radius:2px">$1</mark>`);
}

function verAluno(id) {
  fecharPainelAlunos(true);
  carregarAluno(id);
}

function excluirAlunoPainel(id) {
  if (!confirm("Excluir este aluno?")) return;
  const alunos = getAlunos().filter(a => a.id !== id);
  localStorage.setItem("proj_alunos", JSON.stringify(alunos));
  filtrarAlunos();
  renderAlunosSalvos();
  toast("Aluno excluído.");
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") fecharPainelAlunos(true);
});

// ── NAVEGAÇÃO ──
function irPara(n) {
  [1,2,3,4].forEach(i => {
    document.getElementById(`e${i}`).classList.toggle("oculto", i !== n);
    const s = document.getElementById(`s${i}`);
    s.classList.toggle("ativa",    i === n);
    s.classList.toggle("concluida",i <  n);
  });
  window.scrollTo({ top:0, behavior:"smooth" });
}

function selecionarObj(el) {
  document.querySelectorAll(".obj-card").forEach(c => c.classList.remove("ativa"));
  el.classList.add("ativa");
  objSelecionado = el.dataset.obj;
}

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("data_aval").value = new Date().toISOString().split("T")[0];
  [1,2,3,4].forEach(n => document.getElementById(`s${n}`).addEventListener("click", () => irPara(n)));
  renderAlunosSalvos();
});

// ── HELPERS ──
const $n = id => { const v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? null : v; };
const $s = id => document.getElementById(id)?.value || "";

// ── CÁLCULO DE % GORDURA (Jackson & Pollock 7 dobras) ──
function calcGordura(dobras, sexo, idade) {
  const { tri, sub, sup, pei, axi, abd, cox } = dobras;
  const soma = (tri||0)+(sub||0)+(sup||0)+(pei||0)+(axi||0)+(abd||0)+(cox||0);
  if (soma === 0) return null;
  let dc;
  if (sexo === "M") {
    dc = 1.112 - (0.00043499 * soma) + (0.00000055 * soma * soma) - (0.00028826 * idade);
  } else {
    dc = 1.097 - (0.00046971 * soma) + (0.00000056 * soma * soma) - (0.00012828 * idade);
  }
  return ((4.95 / dc) - 4.5) * 100;
}

// ── TAXAS DE PROGRESSO SEMANAIS ──
const taxas = {
  gordura_abdominal: { pesoSem:-0.35, gordSem:-0.4,  abdSem:-0.9,  massaSem:0.15 },
  recomp:            { pesoSem:-0.2,  gordSem:-0.3,  abdSem:-0.6,  massaSem:0.2  },
  hipertrofia:       { pesoSem:0.15,  gordSem:-0.1,  abdSem:-0.2,  massaSem:0.3  },
  emagrecimento:     { pesoSem:-0.4,  gordSem:-0.45, abdSem:-0.8,  massaSem:0.1  },
  forca:             { pesoSem:0.1,   gordSem:-0.1,  abdSem:-0.15, massaSem:0.25 },
  condicionamento:   { pesoSem:-0.25, gordSem:-0.3,  abdSem:-0.5,  massaSem:0.15 }
};

const objLabels = {
  gordura_abdominal:"Redução de Gordura Abdominal",
  recomp:"Recomposição Corporal",
  hipertrofia:"Hipertrofia Muscular",
  emagrecimento:"Emagrecimento Geral",
  forca:"Força e Performance",
  condicionamento:"Condicionamento Físico"
};

// ── CALCULAR ──
function calcular() {
  const nome   = document.getElementById("nome").value.trim() || "Aluno";
  const sexo   = $s("sexo") || "M";
  const idade  = $n("idade") || 30;
  const peso   = $n("peso");
  const altura = $n("altura");
  const freq   = parseInt($s("freq")) || 4;
  const nivel  = $s("nivel") || "intermediario";
  const dur    = parseInt($s("duracao")) || 90;
  const meta   = $n("peso_meta");
  const dataAval = $s("data_aval");

  // Perímetros
  const perim = {
    torax:   $n("torax"),   braco_e: $n("braco_e"), braco_d: $n("braco_d"),
    cintura: $n("cintura"), abdomen: $n("abdomen"), quadril: $n("quadril"),
    coxa_e:  $n("coxa_e"),  coxa_d:  $n("coxa_d"),
    perna_e: $n("perna_e"), perna_d: $n("perna_d")
  };

  // Dobras
  const dobras = {
    tri: $n("d_tri"), sub: $n("d_sub"), sup: $n("d_sup"),
    pei: $n("d_pei"), axi: $n("d_axi"), abd: $n("d_abd"), cox: $n("d_cox")
  };

  const gordura = calcGordura(dobras, sexo, idade);
  const imc     = peso && altura ? peso / Math.pow(altura/100, 2) : null;
  const massaMagra = peso && gordura ? peso * (1 - gordura/100) : null;
  const massaGorda = peso && gordura ? peso * (gordura/100) : null;

  // Fator de frequência
  const fatorFreq = Math.min(1.25, 0.7 + freq * 0.1);
  const fatorNivel = { iniciante:0.85, intermediario:1.0, avancado:1.15 }[nivel] || 1.0;

  const tx = taxas[objSelecionado] || taxas.gordura_abdominal;
  const semanas = Math.round(dur / 7);

  // Gerar projeção semanal
  const proj = [];
  let pAtual = peso || 80;
  let gAtual = gordura || 20;
  let aAtual = perim.abdomen || 100;
  let mAtual = massaMagra || (pAtual * 0.75);

  for (let s = 0; s <= semanas; s++) {
    const isDeload = s > 0 && s % 4 === 0;
    const fator = isDeload ? 0.3 : fatorFreq * fatorNivel;
    proj.push({
      semana: s,
      peso:   +pAtual.toFixed(1),
      gordura:+Math.max(5, gAtual).toFixed(1),
      abdomen:+Math.max(60, aAtual).toFixed(1),
      massa:  +mAtual.toFixed(1),
      deload: isDeload
    });
    if (s < semanas) {
      pAtual += tx.pesoSem * fator;
      gAtual += tx.gordSem * fator;
      aAtual += tx.abdSem  * fator;
      mAtual += tx.massaSem * fator;
    }
  }

  dadosAtual = { nome, sexo, idade, peso, altura, freq, nivel, dur, meta, dataAval, perim, dobras, gordura, imc, massaMagra, massaGorda, proj, semanas };
  renderResultado(dadosAtual);
  irPara(4);
}

// ── RENDER ──
function renderResultado(d) {
  const res = document.getElementById("resultado");
  const objLabel = objLabels[objSelecionado] || objSelecionado;
  const nivLabel = { iniciante:"Iniciante", intermediario:"Intermediário", avancado:"Avançado" }[d.nivel] || d.nivel;
  const dataFmt  = d.dataAval ? new Date(d.dataAval+"T12:00").toLocaleDateString("pt-BR") : "";
  const p0 = d.proj[0], pF = d.proj[d.proj.length-1];

  // ── CABEÇALHO ──
  res.innerHTML = `
    <div class="res-header">
      <div class="res-logo">⚡ Projeção <span>Aluno</span> — Alessandro Ferreira Personal</div>
      <div class="res-nome">${d.nome}</div>
      <div class="res-meta">
        ${[d.idade?d.idade+" anos":"", d.sexo==="M"?"Masculino":"Feminino", d.peso?d.peso+" kg":"", d.altura?d.altura+" cm":"", d.imc?"IMC "+d.imc.toFixed(1):"", dataFmt].filter(Boolean).join(" · ")}
      </div>
      <div class="res-tags">
        <span class="tag tag-obj">${objLabel}</span>
        <span class="tag tag-freq">${d.freq}x/semana</span>
        <span class="tag tag-nivel">${nivLabel}</span>
        <span class="tag" style="background:rgba(245,158,11,.18);color:#fbbf24">${d.dur} dias</span>
      </div>
    </div>
  `;

  // ── STATS INICIAIS ──
  res.innerHTML += `<div class="stats-grid">
    ${d.peso ? `<div class="stat-card"><div class="stat-label">Peso Atual</div><div class="stat-val">${d.peso}<span class="stat-unit"> kg</span></div></div>` : ""}
    ${d.gordura ? `<div class="stat-card"><div class="stat-label">% Gordura</div><div class="stat-val">${d.gordura.toFixed(1)}<span class="stat-unit">%</span></div><div class="stat-status" style="color:${d.gordura>25&&d.sexo==="M"||d.gordura>32&&d.sexo==="F"?"#f87171":"#34d399"}">${d.gordura>25&&d.sexo==="M"||d.gordura>32&&d.sexo==="F"?"Acima do ideal":"Aceitável"}</div></div>` : ""}
    ${d.massaMagra ? `<div class="stat-card"><div class="stat-label">Massa Magra</div><div class="stat-val">${d.massaMagra.toFixed(1)}<span class="stat-unit"> kg</span></div></div>` : ""}
    ${d.massaGorda ? `<div class="stat-card"><div class="stat-label">Massa Gorda</div><div class="stat-val">${d.massaGorda.toFixed(1)}<span class="stat-unit"> kg</span></div></div>` : ""}
    ${d.imc ? `<div class="stat-card"><div class="stat-label">IMC</div><div class="stat-val">${d.imc.toFixed(1)}</div><div class="stat-status" style="color:${d.imc<25?"#34d399":d.imc<30?"#fbbf24":"#f87171"}">${d.imc<18.5?"Abaixo":d.imc<25?"Normal":d.imc<30?"Sobrepeso":"Obesidade"}</div></div>` : ""}
    ${d.perim.abdomen ? `<div class="stat-card"><div class="stat-label">Abdômen</div><div class="stat-val">${d.perim.abdomen}<span class="stat-unit"> cm</span></div></div>` : ""}
  </div>`;

  // ── METAS DE EVOLUÇÃO ──
  res.innerHTML += `<div class="metas-grid">`;
  if (d.peso) {
    const diff = +(pF.peso - p0.peso).toFixed(1);
    const pct  = Math.min(100, Math.abs(diff) / Math.abs(p0.peso * 0.15) * 100);
    res.innerHTML += `<div class="meta-card meta-peso">
      <div class="meta-label">Peso Corporal</div>
      <div class="meta-de">${p0.peso} kg → </div>
      <div class="meta-para">${pF.peso} kg <span style="font-size:.75rem;color:${diff<0?"#34d399":"#f87171"}">(${diff>0?"+":""}${diff} kg)</span></div>
      <div class="meta-barra-wrap"><div class="meta-barra-fill" style="width:${pct.toFixed(0)}%;background:#6366f1"></div></div>
      <div class="meta-prazo">Projeção em ${d.dur} dias</div>
    </div>`;
  }
  if (d.gordura) {
    const diff = +(pF.gordura - p0.gordura).toFixed(1);
    const pct  = Math.min(100, Math.abs(diff) / Math.abs(p0.gordura * 0.4) * 100);
    res.innerHTML += `<div class="meta-card meta-gordura">
      <div class="meta-label">% Gordura Corporal</div>
      <div class="meta-de">${p0.gordura}% → </div>
      <div class="meta-para">${pF.gordura}% <span style="font-size:.75rem;color:#34d399">(${diff.toFixed(1)}%)</span></div>
      <div class="meta-barra-wrap"><div class="meta-barra-fill" style="width:${pct.toFixed(0)}%;background:#ef4444"></div></div>
      <div class="meta-prazo">Projeção em ${d.dur} dias</div>
    </div>`;
  }
  if (d.perim.abdomen) {
    const diff = +(pF.abdomen - p0.abdomen).toFixed(1);
    const pct  = Math.min(100, Math.abs(diff) / Math.abs(p0.abdomen * 0.15) * 100);
    res.innerHTML += `<div class="meta-card meta-abdomen">
      <div class="meta-label">Circunferência Abdominal</div>
      <div class="meta-de">${p0.abdomen} cm → </div>
      <div class="meta-para">${pF.abdomen} cm <span style="font-size:.75rem;color:#34d399">(${diff.toFixed(1)} cm)</span></div>
      <div class="meta-barra-wrap"><div class="meta-barra-fill" style="width:${pct.toFixed(0)}%;background:#f97316"></div></div>
      <div class="meta-prazo">Projeção em ${d.dur} dias</div>
    </div>`;
  }
  if (d.massaMagra) {
    const diff = +(pF.massa - p0.massa).toFixed(1);
    const pct  = Math.min(100, Math.abs(diff) / 5 * 100);
    res.innerHTML += `<div class="meta-card meta-massa">
      <div class="meta-label">Massa Magra</div>
      <div class="meta-de">${p0.massa.toFixed(1)} kg → </div>
      <div class="meta-para">${pF.massa.toFixed(1)} kg <span style="font-size:.75rem;color:#34d399">(+${diff.toFixed(1)} kg)</span></div>
      <div class="meta-barra-wrap"><div class="meta-barra-fill" style="width:${pct.toFixed(0)}%;background:#10b981"></div></div>
      <div class="meta-prazo">Projeção em ${d.dur} dias</div>
    </div>`;
  }
  res.innerHTML += `</div>`;

  // ── GRÁFICO SVG ──
  res.innerHTML += `
    <div class="grafico-wrap">
      <div class="grafico-titulo-wrap">
        <div class="grafico-titulo">📈 Projeção vs Progresso Real</div>
        <div class="grafico-tabs">
          <button class="gtab ativa" onclick="trocarGrafico('peso',this)">Peso</button>
          <button class="gtab" onclick="trocarGrafico('gordura',this)">Gordura %</button>
          <button class="gtab" onclick="trocarGrafico('abdomen',this)">Abdômen</button>
        </div>
      </div>
      <div id="grafico-svg-wrap"></div>
      <div class="grafico-legenda">
        <div class="leg-item"><svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#6366f1" stroke-width="2" stroke-dasharray="4,2"/></svg> Projeção</div>
        <div class="leg-item"><svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#10b981" stroke-width="2.5"/></svg> Progresso real</div>
        <div class="leg-item"><div class="leg-cor" style="background:#f59e0b"></div> Deload</div>
      </div>
    </div>
  `;
  // Renderizar gráfico inicial
  setTimeout(() => renderGraficoSVG("peso"), 50);

  // ── TABELA SEMANAL ──
  res.innerHTML += `
    <div class="proj-header">
      <h3>📅 Projeção Semana a Semana</h3>
      <div class="proj-desc">Valores estimados com treino consistente, nutrição adequada e recuperação. Semanas de deload (marcadas em amarelo) são essenciais para recuperação e supercompensação.</div>
    </div>
    <div class="prog-geral">
      <div class="prog-label" id="prog-txt">0 de ${d.semanas} semanas concluídas (0%)</div>
      <div class="prog-barra"><div class="prog-fill" id="prog-fill" style="width:0%"></div></div>
    </div>
    <div class="semanas-container">
      <div class="semana-item" style="background:var(--bg2);border-color:var(--muted)">
        <div class="sem-num" style="font-size:.65rem;color:#475569;font-family:'Inter',sans-serif;font-weight:700">SEM</div>
        <div class="sem-campo"><div class="sem-campo-label">Peso (kg)</div></div>
        <div class="sem-campo"><div class="sem-campo-label">Gordura %</div></div>
        <div class="sem-campo"><div class="sem-campo-label">Abdômen cm</div></div>
        <div class="sem-campo"><div class="sem-campo-label">Massa Magra</div></div>
        <div class="sem-check" style="font-size:.6rem;color:#475569;text-transform:uppercase;letter-spacing:.05em">Status</div>
      </div>
      ${d.proj.map((p, i) => {
        const prev = i > 0 ? d.proj[i-1] : p;
        const dPeso = i > 0 ? (p.peso - prev.peso).toFixed(1) : "—";
        const dGord = i > 0 ? (p.gordura - prev.gordura).toFixed(1) : "—";
        const dAbd  = i > 0 ? (p.abdomen - prev.abdomen).toFixed(1) : "—";
        const cls   = p.deload ? "semana-item deload" : i === d.proj.length-1 ? "semana-item marco" : "semana-item";
        const badge = p.deload ? `<span class="sem-badge badge-deload">Deload</span>` : i === d.proj.length-1 ? `<span class="sem-badge badge-marco">Meta</span>` : "";
        const concluida = semanasConc.has(p.semana);
        return `<div class="${cls}${concluida?" sem-concluida":""}" id="sem-row-${p.semana}">
          <div class="sem-num">S${p.semana}${badge}</div>
          <div class="sem-campo">
            <div class="sem-campo-val">${p.peso}</div>
            ${i>0?`<div class="sem-campo-delta ${parseFloat(dPeso)<0?"delta-neg":"delta-pos"}">${parseFloat(dPeso)>0?"+":""}${dPeso}</div>`:""}
          </div>
          <div class="sem-campo">
            <div class="sem-campo-val">${p.gordura}%</div>
            ${i>0?`<div class="sem-campo-delta ${parseFloat(dGord)<0?"delta-neg":"delta-pos"}">${parseFloat(dGord)>0?"+":""}${dGord}</div>`:""}
          </div>
          <div class="sem-campo">
            <div class="sem-campo-val">${p.abdomen}</div>
            ${i>0?`<div class="sem-campo-delta ${parseFloat(dAbd)<0?"delta-neg":"delta-pos"}">${parseFloat(dAbd)>0?"+":""}${dAbd}</div>`:""}
          </div>
          <div class="sem-campo">
            <div class="sem-campo-val">${p.massa.toFixed(1)} kg</div>
          </div>
          ${i > 0 ? `<div class="sem-check">
            <button class="btn-check${concluida?" check-ok":""}" onclick="toggleSemana(${p.semana})" title="${concluida?"Desmarcar":"Marcar como concluída"}">
              ${concluida?"✓":"○"}
            </button>
          </div>` : `<div class="sem-check"><span class="sem-inicio">Início</span></div>`}
        </div>`;
      }).join("")}
    </div>
  `;

  // ── ORIENTAÇÕES ──
  const ors = getOrientacoes(objSelecionado, d);
  res.innerHTML += `
    <div class="orientacoes">
      <div class="ori-titulo">Orientações Estratégicas</div>
      <ul class="ori-lista">${ors.map(o=>`<li>${o}</li>`).join("")}</ul>
    </div>
  `;

  // Atualizar progresso após render
  setTimeout(atualizarProgresso, 50);
}

function getOrientacoes(obj, d) {
  const base = [
    `<strong>Deload a cada 4 semanas:</strong> Reduzir volume em 40% para recuperação e supercompensação.`,
    `<strong>Progressão de carga:</strong> Aumentar carga ou volume a cada semana dentro do mesociclo.`,
    `<strong>Sono:</strong> 7–9 horas por noite são essenciais para recuperação e composição corporal.`,
    `<strong>Hidratação:</strong> Mínimo 35ml/kg de peso corporal por dia.`
  ];
  const especificos = {
    gordura_abdominal: [
      `<strong>Déficit calórico moderado:</strong> 300–500 kcal abaixo do gasto diário. Déficit agressivo causa perda de massa magra.`,
      `<strong>Proteína elevada:</strong> 2,0–2,4g/kg de peso para preservar massa magra durante o déficit.`,
      `<strong>Treino de força como prioridade:</strong> Cardio complementar, não substituto. Foco em manter força.`,
      `<strong>Circunferência abdominal:</strong> Medir sempre em jejum, mesma hora, mesma posição.`
    ],
    recomp: [
      `<strong>Calorias de manutenção:</strong> Recomposição exige paciência — processo mais lento mas sustentável.`,
      `<strong>Proteína alta:</strong> 2,2–2,6g/kg para maximizar síntese proteica e perda de gordura simultânea.`,
      `<strong>Ciclagem calórica:</strong> Mais calorias nos dias de treino, menos nos dias de descanso.`
    ],
    hipertrofia: [
      `<strong>Superávit calórico controlado:</strong> 200–300 kcal acima do gasto. Superávit excessivo aumenta gordura.`,
      `<strong>Proteína:</strong> 1,8–2,2g/kg. Distribuir em 4–5 refeições ao longo do dia.`,
      `<strong>Progressão de carga obrigatória:</strong> Sem progressão, não há estímulo para crescimento.`
    ],
    emagrecimento: [
      `<strong>Déficit calórico:</strong> 400–600 kcal abaixo do gasto. Monitorar semanalmente.`,
      `<strong>Cardio estratégico:</strong> 150–200 min/semana de cardio moderado além do treino de força.`,
      `<strong>Proteína:</strong> 2,0–2,4g/kg para preservar massa magra.`
    ],
    forca: [
      `<strong>Periodização de carga:</strong> Alternar semanas de volume e intensidade.`,
      `<strong>Descanso entre séries:</strong> 2–4 minutos para exercícios compostos pesados.`,
      `<strong>Nutrição peri-treino:</strong> Carboidratos antes e proteína após o treino.`
    ],
    condicionamento: [
      `<strong>Progressão gradual:</strong> Aumentar volume e intensidade 5–10% por semana.`,
      `<strong>Variedade de estímulos:</strong> Combinar força, resistência e mobilidade.`,
      `<strong>Recuperação ativa:</strong> Caminhada e mobilidade nos dias de descanso.`
    ]
  };
  return [...(especificos[obj] || []), ...base];
}

function novaAvaliacao() {
  document.querySelectorAll("input").forEach(el => { el.value = el.type==="date" ? new Date().toISOString().split("T")[0] : ""; });
  document.querySelectorAll("select").forEach(el => el.value = "");
  document.getElementById("resultado").innerHTML = "";
  objSelecionado = "gordura_abdominal";
  document.querySelectorAll(".obj-card").forEach(c => c.classList.remove("ativa"));
  document.querySelector('[data-obj="gordura_abdominal"]').classList.add("ativa");
  irPara(1);
}

function imprimirPDF() { window.print(); }

// ── GRÁFICO SVG ──
let graficoAtivo = "peso";

function trocarGrafico(tipo, btn) {
  graficoAtivo = tipo;
  document.querySelectorAll(".gtab").forEach(b => b.classList.remove("ativa"));
  btn.classList.add("ativa");
  renderGraficoSVG(tipo);
}

function renderGraficoSVG(tipo) {
  if (!dadosAtual) return;
  const wrap = document.getElementById("grafico-svg-wrap");
  if (!wrap) return;

  const proj = dadosAtual.proj;
  const W = wrap.clientWidth || 600;
  const H = 200;
  const PAD = { top:20, right:20, bottom:30, left:45 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  // Dados de projeção
  const vals = proj.map(p => tipo === "peso" ? p.peso : tipo === "gordura" ? p.gordura : p.abdomen);
  const minV = Math.min(...vals) * 0.97;
  const maxV = Math.max(...vals) * 1.02;
  const range = maxV - minV || 1;

  const xScale = i => PAD.left + (i / (proj.length - 1)) * iW;
  const yScale = v => PAD.top + iH - ((v - minV) / range * iH);

  // Linha de projeção (tracejada)
  const projPath = proj.map((p, i) => {
    const v = tipo === "peso" ? p.peso : tipo === "gordura" ? p.gordura : p.abdomen;
    return `${i===0?"M":"L"}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`;
  }).join(" ");

  // Linha de progresso real (semanas concluídas)
  const concluidas = [...semanasConc].sort((a,b)=>a-b);
  let realPath = "";
  let realPoints = "";
  if (concluidas.length > 0) {
    const pts = [0, ...concluidas].filter(s => s < proj.length);
    realPath = pts.map((s, i) => {
      const p = proj[s];
      const v = tipo === "peso" ? p.peso : tipo === "gordura" ? p.gordura : p.abdomen;
      return `${i===0?"M":"L"}${xScale(s).toFixed(1)},${yScale(v).toFixed(1)}`;
    }).join(" ");
    realPoints = pts.map(s => {
      const p = proj[s];
      const v = tipo === "peso" ? p.peso : tipo === "gordura" ? p.gordura : p.abdomen;
      return `<circle cx="${xScale(s).toFixed(1)}" cy="${yScale(v).toFixed(1)}" r="4" fill="#10b981" stroke="#05050d" stroke-width="2"/>`;
    }).join("");
  }

  // Eixo Y — 5 marcas
  const yTicks = Array.from({length:5}, (_,i) => minV + (range/4)*i);
  const yTicksHTML = yTicks.map(v => `
    <line x1="${PAD.left}" y1="${yScale(v).toFixed(1)}" x2="${W-PAD.right}" y2="${yScale(v).toFixed(1)}" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
    <text x="${PAD.left-6}" y="${(yScale(v)+4).toFixed(1)}" text-anchor="end" font-size="9" fill="#475569">${v.toFixed(1)}</text>
  `).join("");

  // Eixo X — a cada 4 semanas
  const xTicksHTML = proj.filter((_,i) => i%4===0).map(p => `
    <text x="${xScale(p.semana).toFixed(1)}" y="${H-6}" text-anchor="middle" font-size="9" fill="#475569">S${p.semana}</text>
  `).join("");

  // Marcadores de deload
  const deloadHTML = proj.filter(p => p.deload).map(p => `
    <rect x="${(xScale(p.semana)-6).toFixed(1)}" y="${PAD.top}" width="12" height="${iH}" fill="rgba(245,158,11,.08)" rx="2"/>
  `).join("");

  // Área sob a linha de projeção
  const areaPath = projPath + ` L${xScale(proj.length-1).toFixed(1)},${(PAD.top+iH).toFixed(1)} L${PAD.left},${(PAD.top+iH).toFixed(1)} Z`;

  // Tooltip interativo
  const tooltipCircles = proj.map((p, i) => {
    const v = tipo === "peso" ? p.peso : tipo === "gordura" ? p.gordura : p.abdomen;
    const unidade = tipo === "gordura" ? "%" : " kg";
    const conc = semanasConc.has(p.semana) ? " ✓" : "";
    return `<circle cx="${xScale(i).toFixed(1)}" cy="${yScale(v).toFixed(1)}" r="8" fill="transparent" class="tooltip-hit">
      <title>Sem ${p.semana}: ${v.toFixed(1)}${unidade}${conc}${p.deload?" (Deload)":""}</title>
    </circle>`;
  }).join("");

  const unidade = tipo === "gordura" ? "%" : " kg";
  const label = { peso:"Peso (kg)", gordura:"Gordura (%)", abdomen:"Abdômen (cm)" }[tipo];

  wrap.innerHTML = `
    <svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="chartClip">
          <rect x="${PAD.left}" y="${PAD.top}" width="${iW}" height="${iH}"/>
        </clipPath>
      </defs>

      <!-- Grid -->
      ${yTicksHTML}
      ${xTicksHTML}

      <!-- Deload zones -->
      <g clip-path="url(#chartClip)">${deloadHTML}</g>

      <!-- Área projeção -->
      <path d="${areaPath}" fill="url(#areaGrad)" clip-path="url(#chartClip)"/>

      <!-- Linha projeção -->
      <path d="${projPath}" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="5,3" clip-path="url(#chartClip)"/>

      <!-- Linha progresso real -->
      ${realPath ? `<path d="${realPath}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" clip-path="url(#chartClip)"/>` : ""}
      ${realPoints}

      <!-- Tooltips -->
      ${tooltipCircles}

      <!-- Label eixo Y -->
      <text x="10" y="${(PAD.top + iH/2).toFixed(1)}" text-anchor="middle" font-size="9" fill="#475569" transform="rotate(-90,10,${(PAD.top+iH/2).toFixed(1)})">${label}</text>
    </svg>
    <div class="grafico-semana-atual">
      ${concluidas.length > 0
        ? `Última semana concluída: <strong>S${concluidas[concluidas.length-1]}</strong> — ${tipo==="peso"?proj[concluidas[concluidas.length-1]]?.peso+" kg":tipo==="gordura"?proj[concluidas[concluidas.length-1]]?.gordura+"%":proj[concluidas[concluidas.length-1]]?.abdomen+" cm"}`
        : "Marque semanas concluídas para ver o progresso real no gráfico."}
    </div>
  `;
}

// ── ATUALIZAR GRÁFICO AO MARCAR SEMANA ──
function toggleSemana(n) {
  if (semanasConc.has(n)) {
    semanasConc.delete(n);
  } else {
    semanasConc.add(n);
  }
  localStorage.setItem("proj_semanas", JSON.stringify([...semanasConc]));

  // Atualizar visual da linha
  const row = document.getElementById(`sem-row-${n}`);
  const btn = row?.querySelector(".btn-check");
  if (!row || !btn) return;

  const ok = semanasConc.has(n);
  row.classList.toggle("sem-concluida", ok);
  btn.classList.toggle("check-ok", ok);
  btn.textContent = ok ? "✓" : "○";
  btn.title = ok ? "Desmarcar" : "Marcar como concluída";

  // Atualizar barra de progresso geral e gráfico
  atualizarProgresso();
  renderGraficoSVG(graficoAtivo);
}

function atualizarProgresso() {
  const total = document.querySelectorAll(".btn-check").length;
  const conc  = semanasConc.size;
  const pct   = total > 0 ? Math.round((conc / total) * 100) : 0;

  const bar = document.getElementById("prog-fill");
  const txt = document.getElementById("prog-txt");
  if (bar) bar.style.width = pct + "%";
  if (txt) txt.textContent = `${conc} de ${total} semanas concluídas (${pct}%)`;
}

// ── TOAST ──
function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style, {
    position:"fixed", bottom:"1.5rem", left:"50%", transform:"translateX(-50%)",
    background:"#10b981", color:"#fff", padding:".65rem 1.25rem",
    borderRadius:"8px", fontSize:".82rem", fontWeight:"700",
    boxShadow:"0 0 20px rgba(16,185,129,.5)", zIndex:"9999",
    whiteSpace:"nowrap", transition:"opacity .3s", pointerEvents:"none"
  });
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity="0"; setTimeout(()=>t.remove(),300); }, 2500);
}
