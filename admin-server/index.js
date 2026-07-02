import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;

app.use(cors({ origin: 'http://localhost:4321' }));
app.use(express.json({ limit: '10mb' }));

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

app.listen(PORT, () => {
    console.log(`Admin Dashboard Server running at http://localhost:${PORT}`);
});
