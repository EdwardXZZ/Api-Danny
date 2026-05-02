const axios = require('axios');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function tiktokDownload(url, quality = 'low') {
    try {
        // Usamos tikwm.com porque es rápido y da opciones de calidad
        const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, {
            headers: { 'User-Agent': UA },
            timeout: 30000
        });

        const data = response.data.data;
        if (!data) throw new Error('No se pudo obtener el video');

        // Priorizar calidad baja (wmplay) -> menor peso y 360p aprox
        let videoUrl = data.wmplay || data.hdplay || data.play;
        let qualityText = '360p (ligero)';
        
        if (data.wmplay) qualityText = '360p (con marca)';
        else if (data.hdplay) qualityText = '720p (HD)';
        else qualityText = 'Normal';

        return {
            title: data.title || 'Sin título',
            author: {
                name: data.author?.unique_id || 'Desconocido',
                nickname: data.author?.nickname || 'Desconocido'
            },
            likes: data.digg_count || 0,
            comments: data.comment_count || 0,
            views: data.play_count || 0,
            video: videoUrl,
            quality: qualityText
        };
    } catch (error) {
        throw new Error(`Error en TikTok: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/download/tiktok', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'"
            });
        }

        try {
            const result = await tiktokDownload(url);
            
            if (req.query.download === 'true' || req.query.redirect === 'true') {
                return res.redirect(result.video);
            }

            return res.json({
                status: true,
                creator: "DVLYONN",
                result: result
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};