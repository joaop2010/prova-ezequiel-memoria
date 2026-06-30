import { salvarPontuacao, buscarLeaderboard } from './script_db.js';

const btnPortal = document.getElementById('btn-portal');
const loader = document.getElementById('loader');
const resultados = document.getElementById('resultados');
const errosSpan = document.getElementById('erros');
const tempoSpan = document.getElementById('hud-timer');
const telaInicial = document.getElementById('tela-inicial');
const inputNome = document.getElementById('input-nome');
const btnIniciar = document.getElementById('btn-iniciar');
const btnReiniciar = document.getElementById('btn-reiniciar');
const paresSpan = document.getElementById('hud-pares');

let primeiraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let movimentos = 0;
let paresEncontrados = 0;
let erros = 0;
let tempo = 0;
let intervalo;
let nomeJogador = "";

function mostrarToast(mensagem, tipo) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

btnIniciar.addEventListener('click', () => {
    if (inputNome.value.trim() === "") {
        mostrarToast("Por favor, digite seu nome!", "error"); 
        return;
    }
    nomeJogador = inputNome.value;
    telaInicial.classList.add('hidden'); 
    document.getElementById('hud').classList.remove('hidden');
});

btnPortal.addEventListener('click', async () => {
    resultados.innerHTML = "";
    tempo = 0;
    tempoSpan.textContent = 0;
    paresEncontrados = 0;
    paresSpan.textContent = "0/10";
    erros = 0;
    errosSpan.textContent = 0;
    movimentos = 0;

    clearInterval(intervalo);
    intervalo = setInterval(() => {
        tempo++;
        tempoSpan.textContent = tempo;
    }, 1000);

    loader.classList.remove('hidden');

    try {
        let personagens = await carregarPersonagem();
        resultados.innerHTML = "";

        personagens.forEach((pokemon) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('data-key', pokemon.id);
            card.innerHTML = `
                 <div class="card-inner">
                    <div class="card-verso">?</div>
                    <div class="card-frente">
                        <img src="${pokemon.image}" alt="${pokemon.name}" loading="lazy">
                        <div class="char-info">
                            <h3>${pokemon.name}</h3>
                            <p>Tipo: <span class="badge-tipo">${pokemon.tipo}</span></p>
                        </div>
                    </div>    
                </div>    
            `;
            resultados.appendChild(card);
        });

        loader.classList.add('hidden');

        resultados.addEventListener('click', tratarCliqueGrade);

    } catch (erro) {
        loader.classList.add('hidden');
        resultados.innerHTML = '<p class="text-red-500">Erro no portal. Tente novamente!</p>';
        console.error(erro);
    }
});

function tratarCliqueGrade(e) {
    const carta = e.target.closest('.card');
    if (!carta || bloqueado) return;
    if (carta.classList.contains('card-acertada') || carta.classList.contains('card-virada')) return;

    carta.classList.add('card-virada');
    
    if (primeiraCarta === null) {
        primeiraCarta = carta;
    } else {
        if (carta === primeiraCarta) return;
        segundaCarta = carta;
        movimentos++;
        bloqueado = true;

        if (primeiraCarta.dataset.key === segundaCarta.dataset.key) {
            primeiraCarta.classList.add('card-acertada');
            segundaCarta.classList.add('card-acertada');
            paresEncontrados++;
            paresSpan.textContent = `${paresEncontrados}/10`;
            
            primeiraCarta = null;
            segundaCarta = null;
            bloqueado = false;

            if (paresEncontrados === 10) {
                verificarVitoria();
            }
        } else {
            erros++;
            errosSpan.textContent = erros;
            setTimeout(() => {
                primeiraCarta.classList.remove('card-virada');
                segundaCarta.classList.remove('card-virada');
                primeiraCarta = null;
                segundaCarta = null;
                bloqueado = false;
            }, 1000);
        }
    }
}

async function carregarPersonagem() {
    const data = [];
    const ids = new Set();
    while (ids.size < 10) {
        ids.add(Math.floor(Math.random() * 151) + 1);
    }
    for (const idAleatorio of ids) {
        const resposta = await fetch(`https://pokeapi.co/api/v2/pokemon/${idAleatorio}`);
        const dados = await resposta.json();
        const pokemon = {
            id: dados.id,
            name: dados.name,
            image: dados.sprites.other['official-artwork'].front_default,
            tipo: dados.types[0].type.name
        };   
        data.push(pokemon);
        data.push(pokemon); 
    }
    data.sort(() => Math.random() - 0.5);
    return data;
}

async function verificarVitoria() {
    clearInterval(intervalo);
    const pontuacao = Math.max(0, Math.floor(5000 - tempo * 10));
    
    mostrarToast(`Você venceu em ${tempo} segundos!`, "success");
    document.getElementById('pontuacao-final').textContent = pontuacao;
    document.getElementById('tempo-final').textContent = tempo;
    
    document.getElementById('tela-final').classList.remove('hidden');
    
    const salvoComSucesso = await salvarPontuacao(nomeJogador, pontuacao, tempo);
    if (salvoComSucesso) {
        mostrarToast("Pontuação sincronizada no Neon!", "success");
    } else {
        mostrarToast("Erro ao salvar no banco.", "error");
    }

    const ranking = await buscarLeaderboard();
    renderizarLeaderboard(ranking);

    
}

function renderizarLeaderboard(ranking) {
    const tbody = document.getElementById('corpo-ranking');
    tbody.innerHTML = "";
    const medalhas = ['🥇', '🥈', '🥉'];
    
    if (!ranking || ranking.length === 0) return;
    
    ranking.forEach((r, i) => {
        const destaque = r.nome_jogador === nomeJogador ? 'class="linha-destaque"' : '';
        
        const tempoDoBanco = r.tempo_segundos || r.tempo || 0;
        
        tbody.innerHTML += `
            <tr ${destaque}>
                <td>${medalhas[i] ?? (i + 1)}</td>
                <td>${r.nome_jogador || r.nome}</td>
                <td>${Number(r.pontuacao).toLocaleString('pt-BR')} pts</td>
                <td>${tempoDoBanco}s</td>
            </tr>
        `;
    });
}

btnReiniciar.addEventListener('click', () => {
    document.getElementById('tela-final').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    telaInicial.classList.remove('hidden');
    resultados.innerHTML = '<p>O portal está fechado.</p>';
    inputNome.value = "";
});