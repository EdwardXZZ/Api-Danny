const axios = require('axios');

const APTOIDE_API = 'https://ws75.aptoide.com/api/7/apps/search';

module.exports = function(app) {
    app.get('/apk', async (req, res) => {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/apk?q=whatsapp"
            });
        }

        try {
            const response = await axios.get(APTOIDE_API, {
                params: { query, limit: 1 },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const data = response.data;
            if (data.info?.status !== 'OK' || !data.datalist?.list?.length) {
                throw new Error('No se encontró la aplicación');
            }

            const app = data.datalist.list[0];
            const downloadUrl = app.file?.path;
            if (!downloadUrl) throw new Error('No se pudo obtener enlace de descarga');

            if (req.query.download === 'false') {
                return res.json({
                    status: true,
                    creator: "DVLYONN",
                    result: {
                        name: app.name,
                        package: app.package,
                        version: app.file?.vername || 'N/A',
                        size: app.size ? `${Math.round(app.size / (1024 * 1024))} MB` : 'N/A',
                        icon: app.icon,
                        download_url: downloadUrl
                    }
                });
            }

            const apkRes = await axios.get(downloadUrl, { responseType: 'stream' });
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', `attachment; filename="${app.name.replace(/[^\w]/g, '_')}.apk"`);
            apkRes.data.pipe(res);

        } catch (error) {
            console.error('Error en /apk:', error.message);
            res.status(500).json({ status: false, creator: "DVLYONN", error: error.message });
        }
    });
};