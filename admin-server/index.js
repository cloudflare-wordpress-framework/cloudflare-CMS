import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function getLocalD1DatabasePath() {
    const d1StateDir = path.join(ROOT_DIR, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    if (!fs.existsSync(d1StateDir)) return null;

    // Find the sqlite file in this directory
    const files = fs.readdirSync(d1StateDir);
    const sqliteFile = files.find(f => f.endsWith('.sqlite'));
    if (sqliteFile) {
        return path.join(d1StateDir, sqliteFile);
    }
    return null;
}

let db = null;
function getDb() {
    if (db) return db;
    const dbPath = getLocalD1DatabasePath();
    if (dbPath) {
        db = new Database(dbPath);
        return db;
    }
    return null;
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// File System APIs

// Read .env
app.get('/api/env', (req, res) => {
    try {
        const envPath = path.join(ROOT_DIR, '.env');
        const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Write .env
app.post('/api/env', (req, res) => {
    try {
        const { content } = req.body;
        const envPath = path.join(ROOT_DIR, '.env');
        fs.writeFileSync(envPath, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get file tree (for src/ directory and root files)
app.get('/api/files/tree', (req, res) => {
    try {
        function buildTree(dirPath) {
            const result = [];
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                if (item === 'node_modules' || item === '.git' || item === '.wrangler' || item === 'dist') continue;
                const fullPath = path.join(dirPath, item);
                const relativePath = path.relative(ROOT_DIR, fullPath);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    result.push({
                        name: item,
                        path: relativePath,
                        type: 'directory',
                        children: buildTree(fullPath)
                    });
                } else {
                    result.push({
                        name: item,
                        path: relativePath,
                        type: 'file'
                    });
                }
            }
            // Sort: directories first
            return result.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });
        }
        const tree = buildTree(ROOT_DIR);
        res.json({ tree });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Read file
app.get('/api/files', (req, res) => {
    try {
        const targetPath = req.query.path;
        if (!targetPath) return res.status(400).json({ error: 'Path is required' });

        const fullPath = path.join(ROOT_DIR, targetPath);
        // Basic security to prevent escaping root
        if (!fullPath.startsWith(ROOT_DIR)) return res.status(403).json({ error: 'Forbidden' });

        const content = fs.readFileSync(fullPath, 'utf8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Write file
app.post('/api/files', (req, res) => {
    try {
        const { path: targetPath, content } = req.body;
        if (!targetPath) return res.status(400).json({ error: 'Path is required' });

        const fullPath = path.join(ROOT_DIR, targetPath);
        if (!fullPath.startsWith(ROOT_DIR)) return res.status(403).json({ error: 'Forbidden' });

        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete file/folder
app.delete('/api/files', (req, res) => {
    try {
        const targetPath = req.query.path;
        if (!targetPath) return res.status(400).json({ error: 'Path is required' });

        const fullPath = path.join(ROOT_DIR, targetPath);
        if (!fullPath.startsWith(ROOT_DIR)) return res.status(403).json({ error: 'Forbidden' });

        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Database APIs

// Categories CRUD
app.get('/api/categories', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found. Make sure you run D1 locally at least once.' });
    try {
        const categories = database.prepare('SELECT * FROM categories').all();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categories', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        const { id, name, slug } = req.body;
        const newId = id || crypto.randomUUID();
        database.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(newId, name, slug);
        res.json({ success: true, id: newId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categories/:id', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        const { name, slug } = req.body;
        database.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name, slug, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categories/:id', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        database.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Posts CRUD
app.get('/api/posts', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        const posts = database.prepare('SELECT * FROM posts ORDER BY updated_at DESC').all();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/posts/:id', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        const post = database.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        const { slug, title, excerpt, content, status, author_id } = req.body;
        const id = crypto.randomUUID();
        const published_at = status === 'published' ? new Date().toISOString() : null;

        database.prepare(`
            INSERT INTO posts (id, slug, title, excerpt, content, status, author_id, published_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, slug, title, excerpt, content, status, author_id || 'admin', published_at);

        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/posts/:id', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        const { slug, title, excerpt, content, status, author_id } = req.body;
        const published_at = status === 'published' ? new Date().toISOString() : null;

        database.prepare(`
            UPDATE posts
            SET slug = ?, title = ?, excerpt = ?, content = ?, status = ?, author_id = ?, updated_at = CURRENT_TIMESTAMP, published_at = COALESCE(published_at, ?)
            WHERE id = ?
        `).run(slug, title, excerpt, content, status, author_id || 'admin', published_at, req.params.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/posts/:id', (req, res) => {
    const database = getDb();
    if (!database) return res.status(404).json({ error: 'Database not found.' });
    try {
        database.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Admin Dashboard Server running at http://localhost:${PORT}`);
});
