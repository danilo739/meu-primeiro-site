let categoriaAtual = "Tudo";
let timeoutBusca;

document.addEventListener('DOMContentLoaded', () => {

    carregarNoticias();
    carregarConfig();
    ativarMonetizacao();

    const buscaInput = document.getElementById('input-busca');

    if (buscaInput) {

        buscaInput.addEventListener('input', (e) => {

            clearTimeout(timeoutBusca);

            timeoutBusca = setTimeout(() => {
                carregarNoticias(e.target.value.trim());
            }, 400);

        });

    }

});

function filtrarCategoria(cat, btn) {

    categoriaAtual = cat;

    document
        .querySelectorAll('.nav-btn')
        .forEach(b => b.classList.remove('active'));

    btn.classList.add('active');

    carregarNoticias();
}

async function carregarNoticias(busca = "") {

    const container = document.getElementById('destaque-principal');

    mostrarLoading(container);

    try {

        const res = await fetch(
            `/api/noticias?q=${encodeURIComponent(busca)}`
        );

        if (!res.ok) {
            throw new Error('Erro na API');
        }

        let noticias = await res.json();

        if (categoriaAtual !== "Tudo") {

            noticias = noticias.filter(n =>
                n.categoria?.trim().toLowerCase() ===
                categoriaAtual.trim().toLowerCase()
            );

        }

        if (noticias.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    Nenhuma notícia encontrada em ${escapeHTML(categoriaAtual)}.
                </div>
            `;

            return;
        }

        container.innerHTML = noticias.map((n, i) => {

            const imgPath = n.capa || '';

            // HERO
            if (i === 0 && busca === "") {

                return `
                    <article 
                        class="hero-card"
                        onclick="abrirNoticia(${n.id})"
                    >

                        ${imgPath ? `
                            <img 
                                src="${imgPath}"
                                class="hero-img"
                                alt="${escapeHTML(n.titulo)}"
                                loading="lazy"
                                onerror="this.style.display='none'"
                            >
                        ` : ''}

                        <div class="hero-content">

                            <span class="tag">
                                ${escapeHTML(n.categoria.toUpperCase())}
                            </span>

                            <h2>
                                ${escapeHTML(n.titulo)}
                            </h2>

                        </div>

                    </article>
                `;
            }

            // CARDS
            return `
                <article 
                    class="news-card-small"
                    onclick="abrirNoticia(${n.id})"
                >

                    <div class="news-info">

                        <span class="tag">
                            ${escapeHTML(n.categoria)}
                        </span>

                        <h3>
                            ${escapeHTML(n.titulo)}
                        </h3>

                    </div>

                    ${imgPath ? `
                        <img 
                            src="${imgPath}"
                            class="thumb"
                            alt="${escapeHTML(n.titulo)}"
                            loading="lazy"
                            onerror="this.style.display='none'"
                        >
                    ` : ''}

                </article>
            `;

        }).join('');

    } catch (e) {

        console.error(e);

        container.innerHTML = `
            <div class="error-state">
                Erro ao carregar notícias.
            </div>
        `;
    }
}

function abrirNoticia(id) {
    window.location.href = `noticia.html?id=${id}`;
}

function mostrarLoading(container) {

    container.innerHTML = `
        <div class="loading-state">
            Carregando notícias...
        </div>
    `;
}

async function carregarConfig() {

    try {

        const res = await fetch('/api/config/instagram');

        if (!res.ok) return;

        const config = await res.json();

        const link = document.getElementById('link-instagram');

        if (link && config.valor) {
            link.href = config.valor;
        }

    } catch (e) {

        console.log('Erro ao carregar configurações.');

    }
}

async function ativarMonetizacao() {

    try {

        // Evita duplicar AdSense
        if (window.adsenseCarregado) return;

        const res = await fetch('/api/adsense');

        if (!res.ok) return;

        const data = await res.json();

        if (!data.valor || data.valor.trim() === "") return;

        window.adsenseCarregado = true;

        const container = document.createElement('div');

        container.innerHTML = data.valor;

        document.body.appendChild(container);

        const scripts = container.querySelectorAll('script');

        scripts.forEach(oldScript => {

            const novoScript = document.createElement('script');

            if (oldScript.src) {
                novoScript.src = oldScript.src;
                novoScript.async = true;
            }

            novoScript.textContent = oldScript.textContent;

            document.head.appendChild(novoScript);

        });

    } catch (e) {

        console.log('Sem anúncios disponíveis.');

    }
}

function escapeHTML(str = '') {

    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}