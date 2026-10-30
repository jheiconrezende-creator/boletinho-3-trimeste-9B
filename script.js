// Array de objetos com os dados brutos das disciplinas do 9º Ano
const dadosBoletim = [
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

/* 
  NOTA SOBRE A FREQUÊNCIA:
  Este percentual de 92% é apenas um valor demonstrativo/fictício nesta etapa.
  Ele não é calculado a partir das faltas e será atualizado em versões futuras.
*/

// Função que padroniza as notas na escala de 0 a 10
function normalizarNota(valor) {
  // Trata valores ausentes
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte vírgula para ponto se for texto
  let nota = Number(String(valor).replace(',', '.'));

  // Se não for número válido ou estiver fora do intervalo aceito
  if (isNaN(nota) || nota < 0 || nota > 100) {
    return null;
  }

  // Se a nota estiver acima de 10 e até 100, divide por 10 (ex: 82 vira 8.2, 100 vira 10)
  if (nota > 10 && nota <= 100) {
    nota = nota / 10;
  }

  return nota;
}

// Função para exibir a nota formatada na tela (ex: 8.5 vira "8,5")
function formatarExibicaoNota(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace('.', ',');
}

// Função principal para montar a tabela e os cards no DOM
function processarBoletim() {
  const tabelaBody = document.getElementById("tabela-boletim");
  tabelaBody.innerHTML = "";

  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let bomDesempenhoCount = 0;
  let atencaoCount = 0;

  // Percorre cada disciplina do array
  dadosBoletim.forEach(item => {
    // Normaliza as notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Soma as faltas dos 3 trimestres
    const totalFaltasDisc = item.faltas.reduce((soma, f) => soma + f, 0);
    totalFaltasGeral += totalFaltasDisc;

    // Filtra apenas notas válidas para calcular a média
    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let mediaDisc = null;
    let situacao = "Nota ainda não disponível";
    let classeStatus = "status-indisponivel";

    if (notasValidas.length > 0) {
      const somaNotas = notasValidas.reduce((soma, n) => soma + n, 0);
      mediaDisc = somaNotas / notasValidas.length;

      // Define situação com base na média mínima de 6,0
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

    // Cria a linha da tabela no HTML
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.disciplina}</td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td>${formatarExibicaoNota(mediaDisc)}</td>
      <td>${totalFaltasDisc}</td>
      <td class="${classeStatus}">${situacao}</td>
    `;
    tabelaBody.appendChild(tr);
  });

  // Atualiza os Cards de Resumo na página
  const mediaGeralGlobal = qtdDisciplinasComMedia > 0 
    ? (somaMediasGerais / qtdDisciplinasComMedia).toFixed(1).replace('.', ',') 
    : "—";

  document.getElementById("card-media").innerText = mediaGeralGlobal;
  document.getElementById("card-faltas").innerText = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").innerText = bomDesempenhoCount;
  document.getElementById("card-atencao").innerText = atencaoCount;
}

// Executa o processamento do boletim ao carregar a página
processarBoletim();
