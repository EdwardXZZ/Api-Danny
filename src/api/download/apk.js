const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const APKCOMBO_BASE = 'https://apkcombo.com';

function cleanString(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}

async function getDownloadUrl(apkUrl) {
    try {
        const { data } = await axios.get(apkUrl, { headers: { 'User-Agent': UA }, timeout: 15000 });
        const $ = cheerio.load(data);
        let downloadLink = null;
        const selectors = [
            'a[download]', 
            '.download-button', 
            'a:contains("Download APK")', 
            'a[href*="download"]',
            '.btn-download'
        ];
        for (const selector of selectors) {
            const el = $(selector).first();
            const href = el.attr('href');
            if (href && href.startsWith('http')) {
                downloadLink = href;
                break;
            }
        }
        if (!downloadLink) {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            for (const script of scripts) {
                const match = script.match(/https?:\/\/[^\s"']+\.apk/i);
                if (match) {
                    downloadLink = match[0];
                    break;
                }
            }
        }
        if (!downloadLink) throw new Error('No se encontró enlace de descarga');
        return { url: downloadLink };
    } catch (error) {
        throw new Error(`Error obteniendo descarga: ${error.message}`);
    }
}

async function searchApk(query, limit = 5) {
    try {
        const url = `${APKCOMBO_BASE}/es/search?q=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': UA },
            timeout: 15000
        });
        const $ = cheerio.load(data);
        const results = [];

        const selectores = [
            '.search-result',
            '.media',
            '.col-sm-4',
            '.card'
        ];

        for (const selector of selectores) {
            const elements = $(selector);
            if (elements.length > 0) {
                elements.each((i, el) => {
                    if (results.length >= limit) return false;
                    const titleElem = $(el).find('.title');
                    const name = cleanString(titleElem.text());
                    const link = $(el).find('a').first().attr('href');
                    let fullLink = null;
                    if (link && link.startsWith('/')) fullLink = APKCOMBO_BASE + link;
                    else if (link && link.startsWith('http')) fullLink = link;
                    const versionElem = $(el).find('.version');
                    const version = cleanString(versionElem.text());
                    const sizeElem = $(el).find('.size');
                    const size = cleanString(sizeElem.text());
                    if (name && fullLink) results.push({ name, link: fullLink, version, size, fuente: 'APKCombo' });
                });
                if (results.length > 0) break;
            }
        }

        if (results.length === 0) {
            throw new Error('No se encontraron resultados');
        }
        return results;
    } catch (error) {
        throw new Error(`Error en búsqueda: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/apk/search', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 5;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/apk/search?q=whatsapp&limit=5"
            });
        }
        try {
            const results = await searchApk(query, Math.min(limit, 10));
            res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total: results.length,
                result: results
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
    
    app.get('/apk/download', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'"
            });
        }
        try {
            const downloadInfo = await getDownloadUrl(url);
            if (req.query.download === 'true') {
                return res.redirect(downloadInfo.url);
            }
            res.json({
                status: true,
                creator: "DVLYONN",
                result: { url: downloadInfo.url }
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};