const axios = require('axios');

module.exports = function(app) {
    app.get('/download/facebook', async (req, res) => {
        const url = req.query.url;
        if (!url) return res.status(400).json({ status: false, creator: "DVLYONN", error: "Falta 'url'" });

        try {
            // API pública que funciona (sin clave)
            const apiRes = await axios.get(`https://snapsave.app/fetch?url=${encodeURIComponent(url)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const data = apiRes.data;
            if (!data || !data.url) throw new Error('No se pudo obtener el video');
            const videoUrl = data.url;
            if (req.query.download === 'true') return res.redirect(videoUrl);
            res.json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: data.title || 'Facebook Video',
                    thumbnail: data.thumbnail || '',
                    videos: [{ quality: 'HD', url: videoUrl }]
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, creator: "DVLYONN", error: err.message });
        }
    });
};