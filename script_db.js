/* ==========================================================================
   PASSO 1: CONFIGURAÇÃO DE CONEXÃO
   Definimos onde está o banco e como chegar nele.
   ========================================================================== */
const DATABASE_URL = "postgresql://neondb_owner:npg_yYExhe9P5Gju@ep-steep-recipe-aczzlsmv-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Extraímos apenas o domínio da URL para montar o endereço HTTP correto do Neon
const host = new URL(DATABASE_URL).host;
const neonHttpEndpoint = `https://${host}/sql`;

// CORREÇÃO: o endpoint HTTP do Neon exige autenticação via Bearer token,
// não via Neon-Connection-String. O token é gerado no painel do projeto
// em: Settings → API Keys → Create new API key.
// const NEON_API_TOKEN = "https://ep-nameless-thunder-a4uhkv7y.apirest.us-east-1.aws.neon.tech/ETEC_A_2026/rest/v1"; // Substitua pelo token do painel do Neon


/* ==========================================================================
   PASSO 2: O "MOTOR" DO BANCO DE DADOS (Função Auxiliar)
   Criamos uma função central para não precisarmos repetir o comando "fetch"
   e o tratamento de erros em toda santa consulta!
   ========================================================================== */
async function executarQueryNeon(querySQL, parametros = []) {
    try {
        const resposta = await fetch(neonHttpEndpoint, {
            method: 'POST',
            headers: {
                // Passamos a URL de conexão completa neste cabeçalho específico do Neon
                'Neon-Connection-String': DATABASE_URL,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: querySQL,
                params: parametros // Passar parâmetros assim evita SQL Injection!
            })
        });

        // Se a requisição deu erro (ex: token errado, tabela não existe)
        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro HTTP ${resposta.status}: ${erroTexto}`);
        }

        // Se deu certo, transforma a resposta em JSON e pega as "linhas" (rows)
        const dados = await resposta.json();
        return dados.rows;

    } catch (erro) {
        console.error("Falha ao comunicar com o banco de dados:", erro);
        return null; // Retorna nulo para o arquivo script.js saber que deu erro
    }
}


/* ==========================================================================
   PASSO 3: FUNÇÕES CRUD (Create, Read, Update, Delete)
   Agora, graças ao nosso "Motor", só precisamos nos preocupar com o SQL!

   CORREÇÃO: todas as funções de escrita retornam true/false em vez do objeto,
   pois é isso que o script.js verifica com "if (sucesso)".
   ========================================================================== */

// --- R (READ / LER) ---
export async function buscarLeaderboard() {
    console.log("Buscando o top 10 usuários no banco...");
    const query = 'SELECT * FROM ranking ORDER BY pontuacao DESC LIMIT 10';

    const linhas = await executarQueryNeon(query);
    return linhas || []; // Se retornar null (erro), devolvemos array vazio para não quebrar a tela
}

// --- C (CREATE / CRIAR) ---
export async function salvarPontuacao(nome_jogador, pontuacao, status) {
    console.log("Salvando pontuação no banco:", { nome_jogador, pontuacao, status });
const query = 'INSERT INTO ranking (nome_jogador, pontuacao, tempo_segundos) VALUES ($1, $2, $3) RETURNING *';    
const params = [nome_jogador, pontuacao, tempo_segundos];

    const linhas = await executarQueryNeon(query, params);
    return linhas !== null; // CORREÇÃO: retorna true (sucesso) ou false (erro)
}