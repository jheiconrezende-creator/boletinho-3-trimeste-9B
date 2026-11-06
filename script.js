const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 17,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Dados fictícios padrões do 9º Ano
const dadosBoletimPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

let pinSessao = "";
let dadosAtuais = [];
let modoEdicao = false;

// Função para normalizar dados antigos/locais
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  let nota = Number(String(valor).replace(',', '.'));
  if (isNaN(nota) || nota < 0 || nota > 100) {
    return null;
  }
  if (nota > 10 && nota <= 100) {
    nota = nota / 10;
  }
  return nota;
}

// Formatação para exibição no boletim
function formatarExibicaoNota(nota) {
  if (nota === null || nota === undefined) return "—";
  const num = typeof nota === "number" ? nota : normalizarNota(nota);
  if (num === null) return "—";
  return num.toFixed(1).replace('.', ',');
}

// Converte valores editados para string do input
function valorParaInputNota(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const num = typeof valor === "number" ? valor : normalizarNota(valor);
  if (num === null) return "";
  return String(num).replace('.', ',');
}

// Validação estrita para o que o estudante digita ao editar
function validarNotaDigitada(str) {
  const texto = String(str).trim();
  if (texto === "") return { ok: true, valor: null };
  const numStr = texto.replace(',', '.');
  const num = Number(numStr);
  if (isNaN(num) || num < 0 || num > 10 || !/^\d+([.,]\d+)?$/.test(texto)) {
    return { ok: false, valor: null };
  }
  return { ok: true, valor: num };
}

// Validação de falta digitada
function validarFaltaDigitada(str) {
  const texto = String(str).trim();
  if (texto === "" || !/^\d+$/.test(texto)) {
    return { ok: false, valor: null };
  }
  const num = parseInt(texto, 10);
  if (isNaN(num) || num < 0) {
    return { ok: false, valor: null };
  }
  return { ok: true, valor: num };
}

// Inicialização dos eventos do DOM
document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("form-login");
  const btnAlterar = document.getElementById("btn-alterar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");

  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      realizarLogin();
    });
  }

  if (btnAlterar) {
    btnAlterar.addEventListener("click", () => {
      modoEdicao = true;
      atualizarBotoesAcao();
      renderizarTabela();
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      modoEdicao = false;
      exibirMensagemBoletim("", "");
      atualizarBotoesAcao();
      renderizarTabela();
    });
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", salvarDadosAPI);
  }
});

// Login via API
async function realizarLogin() {
  const pinInput = document.getElementById("pin-input");
  const pinDigitado = pinInput ? pinInput.value.trim() : "";

  if (!pinDigitado) {
    exibirMensagemLogin("Por favor, digite o PIN.", "erro");
    return;
  }

  exibirMensagemLogin("Conectando...", "info");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      exibirMensagemLogin("Turma, chamada ou PIN inválidos.", "erro");
      return;
    }
    if (resposta.status === 429) {
      exibirMensagemLogin("Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      return;
    }
    if (!resposta.ok) {
      exibirMensagemLogin("Não foi possível conectar ao servidor. Tente novamente.", "erro");
      return;
    }

    const resultado = await resposta.json();

    // Guarda PIN em memória na sessão e limpa o campo do formulário
    pinSessao = pinDigitado;
    if (pinInput) pinInput.value = "";

    // Processa dados recebidos
    let dadosRecebidos = null;
    if (resultado && resultado.dados) {
      if (Array.isArray(resultado.dados.disciplinas)) {
        dadosRecebidos = resultado.dados.disciplinas;
      } else if (Array.isArray(resultado.dados)) {
        dadosRecebidos = resultado.dados;
      }
    }

    if (dadosRecebidos && dadosRecebidos.length > 0) {
      dadosAtuais = JSON.parse(JSON.stringify(dadosRecebidos));
    } else {
      dadosAtuais = JSON.parse(JSON.stringify(dadosBoletimPadrao));
    }

    // Exibe a tela do Boletim e oculta a tela de Login
    document.getElementById("login-container").classList.add("boletim-oculto");
    document.getElementById("boletim-conteudo").classList.remove("boletim-oculto");

    modoEdicao = false;
    atualizarBotoesAcao();
    processarEExibirBoletim();
  } catch (erro) {
    exibirMensagemLogin("Não foi possível conectar ao servidor. Tente novamente.", "erro");
  }
}

// Salva dados na API
async function salvarDadosAPI() {
  exibirMensagemBoletim("Validando dados...", "info");

  const novasDisciplinas = [];
  let existeErro = false;

  dadosAtuais.forEach((item, index) => {
    const inTri1 = document.getElementById(`edit-tri1-${index}`);
    const inTri2 = document.getElementById(`edit-tri2-${index}`);
    const inTri3 = document.getElementById(`edit-tri3-${index}`);
    const inFalta1 = document.getElementById(`edit-f1-${index}`);
    const inFalta2 = document.getElementById(`edit-f2-${index}`);
    const inFalta3 = document.getElementById(`edit-f3-${index}`);

    const resTri1 = validarNotaDigitada(inTri1 ? inTri1.value : "");
    const resTri2 = validarNotaDigitada(inTri2 ? inTri2.value : "");
    const resTri3 = validarNotaDigitada(inTri3 ? inTri3.value : "");

    const resF1 = validarFaltaDigitada(inFalta1 ? inFalta1.value : "");
    const resF2 = validarFaltaDigitada(inFalta2 ? inFalta2.value : "");
    const resF3 = validarFaltaDigitada(inFalta3 ? inFalta3.value : "");

    [ {el: inTri1, res: resTri1}, {el: inTri2, res: resTri2}, {el: inTri3, res: resTri3},
      {el: inFalta1, res: resF1}, {el: inFalta2, res: resF2}, {el: inFalta3, res: resF3}
    ].forEach(campo => {
      if (campo.el) {
        if (!campo.res.ok) {
          campo.el.classList.add("input-erro");
          existeErro = true;
        } else {
          campo.el.classList.remove("input-erro");
        }
      }
    });

    if (!existeErro) {
      novasDisciplinas.push({
        disciplina: item.disciplina,
        tri1: resTri1.valor,
        tri2: resTri2.valor,
        tri3: resTri3.valor,
        faltas: [resF1.valor, resF2.valor, resF3.valor]
      });
    }
  });

  if (existeErro) {
    exibirMensagemBoletim("Verifique os campos destacados em vermelho. Use notas de 0 a 10 e faltas inteiras.", "erro");
    return;
  }

  exibirMensagemBoletim("Salvando...", "info");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (resposta.status === 401) {
      exibirMensagemBoletim("Sessão expirada ou PIN inválido.", "erro");
      return;
    }
    if (!resposta.ok) {
      exibirMensagemBoletim("Erro ao salvar dados no servidor. Tente novamente.", "erro");
      return;
    }

    dadosAtuais = novasDisciplinas;
    modoEdicao = false;
    atualizarBotoesAcao();
    processarEExibirBoletim();
    exibirMensagemBoletim("Dados salvos com sucesso.", "sucesso");
  } catch (e) {
    exibirMensagemBoletim("Não foi possível conectar ao servidor. Tente novamente.", "erro");
  }
}

// Atualiza a exibição dos botões no topo da tabela
function atualizarBotoesAcao() {
  const btnAlterar = document.getElementById("btn-alterar");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");

  if (modoEdicao) {
    if (btnAlterar) btnAlterar.classList.add("boletim-oculto");
    if (btnSalvar) btnSalvar.classList.remove("boletim-oculto");
    if (btnCancelar) btnCancelar.classList.remove("boletim-oculto");
  } else {
    if (btnAlterar) btnAlterar.classList.remove("boletim-oculto");
    if (btnSalvar) btnSalvar.classList.add("boletim-oculto");
    if (btnCancelar) btnCancelar.classList.add("boletim-oculto");
  }
}

// Processa médias e atualiza a interface
function processarEExibirBoletim() {
  renderizarTabela();
}

function renderizarTabela() {
  const tabelaBody = document.getElementById("tabela-boletim");
  if (!tabelaBody) return;
  tabelaBody.innerHTML = "";

  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let bomDesempenhoCount = 0;
  let atencaoCount = 0;

  dadosAtuais.forEach((item, index) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const arrFaltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const f1 = typeof arrFaltas[0] === "number" ? arrFaltas[0] : 0;
    const f2 = typeof arrFaltas[1] === "number" ? arrFaltas[1] : 0;
    const f3 = typeof arrFaltas[2] === "number" ? arrFaltas[2] : 0;
    const totalFaltasDisc = f1 + f2 + f3;
    totalFaltasGeral += totalFaltasDisc;

    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let mediaDisc = null;
    let situacao = "Nota ainda não disponível";
    let classeStatus = "status-indisponivel";

    if (notasValidas.length > 0) {
      const somaNotas = notasValidas.reduce((acc, n) => acc + n, 0);
      mediaDisc = somaNotas / notasValidas.length;

      if (mediaDisc >= 6.0) {
        situacao = "Bom desempenho";
        classeStatus = "status-bom";
        bomDesempenhoCount++;
      } else {
        situacao = "Atenção";
        classeStatus = "status-atencao";
        atencaoCount++;
      }

      somaMediasGerais += mediaDisc;
      qtdDisciplinasComMedia++;
    }

    const tr = document.createElement("tr");

    if (modoEdicao) {
      const tdNome = document.createElement("td");
      tdNome.textContent = item.disciplina;

      const tdTri1 = document.createElement("td");
      tdTri1.innerHTML = `<input type="text" id="edit-tri1-${index}" value="${valorParaInputNota(item.tri1)}" placeholder="0-10">`;

      const tdTri2 = document.createElement("td");
      tdTri2.innerHTML = `<input type="text" id="edit-tri2-${index}" value="${valorParaInputNota(item.tri2)}" placeholder="0-10">`;

      const tdTri3 = document.createElement("td");
      tdTri3.innerHTML = `<input type="text" id="edit-tri3-${index}" value="${valorParaInputNota(item.tri3)}" placeholder="0-10">`;

      const tdMedia = document.createElement("td");
      tdMedia.textContent = formatarExibicaoNota(mediaDisc);

      const tdFaltas = document.createElement("td");
      tdFaltas.innerHTML = `
        <div style="display:flex; gap:4px; justify-content:center;">
          <input type="text" id="edit-f1-${index}" value="${f1}" style="width:35px;" title="1º Tri">
          <input type="text" id="edit-f2-${index}" value="${f2}" style="width:35px;" title="2º Tri">
          <input type="text" id="edit-f3-${index}" value="${f3}" style="width:35px;" title="3º Tri">
        </div>
      `;

      const tdSit = document.createElement("td");
      tdSit.className = classeStatus;
      tdSit.textContent = situacao;

      tr.appendChild(tdNome);
      tr.appendChild(tdTri1);
      tr.appendChild(tdTri2);
      tr.appendChild(tdTri3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSit);
    } else {
      const tdNome = document.createElement("td");
      tdNome.textContent = item.disciplina;

      tr.appendChild(tdNome);
      tr.innerHTML += `
        <td>${formatarExibicaoNota(n1)}</td>
        <td>${formatarExibicaoNota(n2)}</td>
        <td>${formatarExibicaoNota(n3)}</td>
        <td>${formatarExibicaoNota(mediaDisc)}</td>
        <td>${totalFaltasDisc}</td>
        <td class="${classeStatus}">${situacao}</td>
      `;
    }

    tabelaBody.appendChild(tr);
  });

  const mediaGeralGlobal = qtdDisciplinasComMedia > 0 
    ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace('.', ',') 
    : "—";

  const cardMedia = document.getElementById("card-media");
  const cardFaltas = document.getElementById("card-faltas");
  const cardBom = document.getElementById("card-bom-desempenho");
  const cardAtencao = document.getElementById("card-atencao");

  if (cardMedia) cardMedia.textContent = mediaGeralGlobal;
  if (cardFaltas) cardFaltas.textContent = totalFaltasGeral;
  if (cardBom) cardBom.textContent = bomDesempenhoCount;
  if (cardAtencao) cardAtencao.textContent = atencaoCount;
}

function exibirMensagemLogin(texto, tipo) {
  const loginMsg = document.getElementById("login-mensagem");
  if (!loginMsg) return;
  loginMsg.textContent = texto;
  loginMsg.className = `mensagem-status ${tipo}`;
}

function exibirMensagemBoletim(texto, tipo) {
  const boletimMsg = document.getElementById("boletim-mensagem");
  if (!boletimMsg) return;
  boletimMsg.textContent = texto;
  boletimMsg.className = `mensagem-status ${tipo}`;
}