const axios = require('axios');
const cheerio = require('cheerio');

const APTOIDE_API = 'https://ws75.aptoide.com/api/7/apps/search';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function searchAptoide(query) {
    const res = await axios.get(APTOIDE_API, { params: { query, limit: 1 }, headers: { 'User-Agent': UA } });
    if (res.data.info?.status !== 'OK' || !res.data.datalist?.list?.length) throw new Error('No encontrado en Aptoide');
    const app = res.data.datalist.list[0];
    return {
        name: app.name,
        download_url: app.file?.path,
        version: app.file?.vername,
        size: app.size ? `${Math.round(app.size / (1024 * 1024))} MB` : 'N/A'
    };
}

async function searchAPKCombo(query) {
    const url = `https://apkcombo.com/es/search?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': UA } });
    const $ = cheerio.load(data);
    const first = $('.card a').first();
    const link = first.attr('href');
    if (!link) throw new Error('No encontrado en APKCombo');
    const fullLink = link.startsWith('/') ? 'https://apkcombo.com' + link : link;
    const name = first.find('.title').text().trim();
    return { name, download_url: fullLink, version: 'N/A', size: 'N/A' };
}

module.exports = function(app) {
    app.get('/apk/download', async (req, res) => {
        const query = req.query.q;
        if (!query) return res.status(400).json({ status: false, creator: "DVLYONN", error: "Falta 'q'" });

        try {
            let app;
            try {
                app = await searchAptoide(query);
            } catch (e) {
                app = await searchAPKCombo(query);
            }
            if (!app.download_url) throw new Error('No se obtuvo enlace');

            if (req.query.download === 'false') {
                return res.json({ status: true, creator: "DVLYONN", result: app });
            }

            const apkRes = await axios.get(app.download_url, { responseType: 'stream' });
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', `attachment; filename="${app.name.replace(/[^\w]/g, '_')}.apk"`);
            apkRes.data.pipe(res);

        } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, creator: "DVLYONN", error: error.message });
        }
    });
};