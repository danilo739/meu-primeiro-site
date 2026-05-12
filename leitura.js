document.addEventListener('DOMContentLoaded', () => {
    carregarNoticiaCompleta();
    carregarComentarios();
    
    // Ouvinte para o formulário de comentário
    const formComentario = document.getElementById('form-comentario');
    formComentario.addEventListener('submit', enviarComentario);
});

// Pega o ID da notícia pela URL (ex: noticia.html?id=3)
const urlParams = new URLSearchParams(window.location.search);
const noticiaId = urlParams.get('id');

if (!noticiaId) {
    alert("Notícia não encontrada!");
    window.location.href = "index.html";
}

async function carregarNoticiaCompleta() {
    try {
        const response = await fetch(`http://localhost:3000/api/noticias/${noticiaId}`);
        const noticia = await response.json();

        // Preenche os campos do HTML
        document.getElementById('noticia-titulo').innerText = noticia.titulo;
        document.title = `${noticia.titulo} - Viralium Media`;
        document.getElementById('noticia-categoria').innerText = noticia.categoria;
        document.getElementById('noticia-texto').innerText = noticia.conteudo;
        document.getElementById('noticia-capa').src = `http://localhost:3000${noticia.capa}`;
        
        // Formata a data
        const dataPub = new Date(noticia.data).toLocaleDateString('pt-BR');
        document.getElementById('noticia-data').innerText = dataPub;
        
    } catch (error) {
        console.error("Erro ao carregar notícia:", error);
        document.getElementById('noticia-titulo').innerText = "Erro ao carregar notícia.";
    }
}

// GERENCIAMENTO DE COMENTÁRIOS DA NOTÍCIA

async function enviarComentario(e) {
    e.preventDefault();
    const status = document.getElementById('coment-status');
    const nome = document.getElementById('coment-nome').value;
    const email = document.getElementById('coment-email').value;
    const texto = document.getElementById('coment-texto').value;

    status.innerText = "⏳ Verificando políticas...";
    status.style.color = "orange";

    try {
        const response = await fetch('http://localhost:3000/api/comentarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ noticia_id: noticiaId, nome, email, texto })
        });
        const result = await response.json();

        if (response.ok) {
            status.innerText = "✅ Comentário postado!";
            status.style.color = "green";
            e.target.reset(); // Limpa form
            carregarComentarios(); // Recarrega mural
        } else {
            status.innerText = `❌ ${result.error || "Erro ao postar."}`;
            status.style.color = "red";
        }
    } catch (error) {
        status.innerText = "❌ Erro de conexão.";
    }
}

async function carregarComentarios() {
    try {
        // Busca comentários específicos desta notícia
        const response = await fetch(`http://localhost:3000/api/comentarios?noticia_id=${noticiaId}`);
        const comentarios = await response.json();
        const mural = document.getElementById('lista-comentarios');
        
        mural.innerHTML = comentarios.map(c => `
            <div class="comentario-card">
                <div class="comentario-header">
                    <span class="comentario-autor">${c.nome}</span>
                    <span class="comentario-data">${new Date(c.data).toLocaleDateString()}</span>
                </div>
                <p class="comentario-texto">${c.texto}</p>
            </div>
        `).join('');
    } catch (error) {
        console.log("Erro ao carregar comentários.");
    }
}