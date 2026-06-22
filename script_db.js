export async function consultarRanking() {
    const query = 'SELECT nome, pontuacao FROM ranking ORDER BY pontuacao DESC LIMIT 5';
    const linhas = await executarQueryNeon(query);
    return linhas || [];
}

export async function registrarPontuacao(nome, pontuacao) {
    const query = 'INSERT INTO ranking (nome, pontuacao) VALUES ($1, $2) RETURNING *';
    return await executarQueryNeon(query, [nome, pontuacao]);
}
export async function criarTabelaRanking() {
    const query = `
        CREATE TABLE IF NOT EXISTS ranking (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(50),
            pontuacao INTEGER
        );
    `;
    
    const resultado = await executarQueryNeon(query);
    console.log("Tabela verificada/criada com sucesso:", resultado);
    return resultado;
}