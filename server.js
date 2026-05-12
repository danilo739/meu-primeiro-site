const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// CORREÇÃO 1: Porta dinâmica para o Render
const PORT = process.env.PORT || 3000;

// CORREÇÃO 2: Garantir que a pasta de uploads exista (essencial para o Linux)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) { 
    fs.mkdirSync(uploadDir, { recursive: true }); 
}

app.use(cors());
app.use(express.json()); // Substitui o body-parser que é antigo
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir));

// CORREÇÃO 3: Caminho do Banco de Dados usando path.resolve
const dbPath = path.resolve(__dirname, 'viralium.db');
const db = new sqlite3.Database(dbPath);

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadDir); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS noticias (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, categoria TEXT, conteudo TEXT, capa TEXT, data TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS configuracoes (chave TEXT PRIMARY KEY, valor TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS comentarios (id INTEGER PRIMARY KEY AUTOINCREMENT, noticia_id INTEGER, nome TEXT, email TEXT, texto TEXT, data TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
});

// --- ROTAS DE NOTÍCIAS ---
app.post('/api/noticias', upload.single('capa'), (req, res) => {
    const { titulo, categoria, conteudo } = req.body;
    const capa = req.file ? `/uploads/${req.file.filename}` : '';
    db.run(`INSERT INTO noticias (titulo, categoria, conteudo, capa) VALUES (?, ?, ?, ?)`, [titulo, categoria, conteudo, capa], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.get('/api/noticias', (req, res) => {
    const busca = req.query.q || '';
    db.all(`SELECT * FROM noticias WHERE titulo LIKE ? ORDER BY data DESC`, [`%${busca}%`], (err, rows) => res.json(rows));
});

app.get('/api/noticias/:id', (req, res) => {
    db.get(`SELECT * FROM noticias WHERE id = ?`, [req.params.id], (err, row) => res.json(row));
});

app.delete('/api/noticias/:id', (req, res) => {
    db.run(`DELETE FROM noticias WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

// --- ROTAS DE CONFIGURAÇÃO ---
app.post('/api/config', (req, res) => {
    const { chave, valor } = req.body;
    db.run(`INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES (?, ?)`, [chave, valor], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/config/:chave', (req, res) => {
    db.get(`SELECT valor FROM configuracoes WHERE chave = ?`, [req.params.chave], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { valor: '' });
    });
});

// --- ROTAS DE COMENTÁRIOS / COMUNIDADE ---
app.post('/api/comentarios', (req, res) => {
    const { noticia_id, nome, email, texto } = req.body;
    db.run(`INSERT INTO comentarios (noticia_id, nome, email, texto) VALUES (?, ?, ?, ?)`, [noticia_id || null, nome, email, texto], () => res.json({ success: true }));
});

app.get('/api/comentarios', (req, res) => {
    const nid = req.query.noticia_id;
    const sql = nid ? `SELECT * FROM comentarios WHERE noticia_id = ? ORDER BY data DESC` : `SELECT * FROM comentarios ORDER BY data DESC`;
    db.all(sql, nid ? [nid] : [], (err, rows) => res.json(rows));
});

app.delete('/api/comentarios/:id', (req, res) => {
    db.run(`DELETE FROM comentarios WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

// --- LOGIN SEGURO ---
app.post('/api/login', (req, res) => {
    const { senha } = req.body;
    const SENHA_MESTRA = "070828gab"; 
    if (senha === SENHA_MESTRA) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Senha incorreta!" });
    }
});

// --- ADSENSE ---
app.post('/api/adsense', (req, res) => {
    const { codigoAdsense } = req.body;
    db.run(`INSERT OR REPLACE INTO configuracoes (chave, valor) VALUES ('adsense', ?)`, [codigoAdsense], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/adsense', (req, res) => {
    db.get(`SELECT valor FROM configuracoes WHERE chave = 'adsense'`, (err, row) => {
        res.json(row || { valor: '' });
    });
});

// ESCUTAR NA PORTA DINÂMICA (Essencial para o Render)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Viralium rodando em http://localhost:${PORT}`);
});
