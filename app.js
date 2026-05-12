let categoriaAtual = "Tudo";

document.addEventListener('DOMContentLoaded', () => {
    carregarNoticias();
    carregarConfig();

    const buscaInput = document.getElementById('input-busca');
    if(buscaInput) {
        buscaInput.addEventListener('input', (e) => carregarNoticias(e.target.value));
    }
});

async function filtrarCategoria(cat, btn) {
    categoriaAtual = cat;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    carregarNoticias();
}

async function carregarNoticias(busca = "") {
    const container = document.getElementById('destaque-principal');
    try {
        const res = await fetch(`http://localhost:3000/api/noticias?q=${busca}`);
        let noticias = await res.json();

        if (categoriaAtual !== "Tudo") {
            noticias = noticias.filter(n => 
                n.categoria.trim().toLowerCase() === categoriaAtual.trim().toLowerCase()
            );
        }

        if (noticias.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#94A3B8; margin-top:50px;">Nenhuma notícia em ${categoriaAtual}.</p>`;
            return;
        }

        container.innerHTML = noticias.map((n, i) => {
            // DESTAQUE PRINCIPAL (A primeira notícia)
            if (i === 0 && busca === "") {
                return `
                <div class="hero-card" onclick="window.location.href='noticia.html?id=${n.id}'" style="cursor:pointer; display: block !important;">
                    ${n.capa ? `<img src="http://localhost:3000${n.capa}" class="hero-img" style="width:100%; display:block;">` : ''}
                    <div class="hero-content" style="padding: 20px; background: white;">
                        <span class="tag" style="color: #C2A378; font-weight: 800; font-size: 11px;">${n.categoria.toUpperCase()}</span>
                        <h2 style="margin: 10px 0 0 0; color: #0F172A; font-size: 1.8rem; display: block !important; visibility: visible !important;">
                            ${n.titulo}
                        </h2>
                    </div>
                </div>`;
            }
            
            // NOTÍCIAS MENORES
            return `
            <article class="news-card-small" onclick="window.location.href='noticia.html?id=${n.id}'" style="cursor:pointer">
                <div style="flex:1">
                    <span class="tag">${n.categoria}</span>
                    <h3 style="color: #0F172A;">${n.titulo}</h3>
                </div>
                ${n.capa ? `<img src="http://localhost:3000${n.capa}" style="width:70px;height:70px;object-fit:cover;border-radius:12px;margin-left:15px;">` : ''}
            </article>`;
        }).join('');
    } catch (e) {
        container.innerHTML = "Erro ao carregar notícias.";
    }
}

async function carregarConfig() {
    try {
        const res = await fetch('http://localhost:3000/api/config');
        const config = await res.json();
        const link = document.getElementById('link-instagram');
        if(link && config.valor) link.href = config.valor;
    } catch (e) {}
}
async function ativarMonetizacao() {
    try {
        const res = await fetch('http://localhost:3000/api/config/adsense');
        const data = await res.json();
        
        if (data.valor && data.valor.trim() !== "") {
            // Cria um elemento de script e injeta o código do AdSense
            const scriptCont = document.createElement('div');
            scriptCont.innerHTML = data.valor;
            
            // Injeta no final do body para não travar o carregamento do site
            document.body.appendChild(scriptCont);
            
            // Se o script contiver tags <script>, precisamos executá-las manualmente
            const scripts = scriptCont.getElementsByTagName('script');
            for (let s of scripts) {
                const novoScript = document.createElement('script');
                if (s.src) novoScript.src = s.src;
                if (s.innerHTML) novoScript.innerHTML = s.innerHTML;
                document.head.appendChild(novoScript);
            }
        }
    } catch (e) { console.log("Sem anúncios hoje."); }
}
ativarMonetizacao(); // Chama a função ao carregar a página