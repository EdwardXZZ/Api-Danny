const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function tiktokSearch(query, limit = 10) {
    try {
        const url = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(query)}&count=${Math.min(limit, 30)}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': UA },
            timeout: 15000
        });
        const data = response.data;
        if (!data || !data.data || !data.data.videos || data.data.videos.length === 0) {
            throw new Error('No se encontraron resultados');
        }
        const videos = data.data.videos;
        return videos.slice(0, limit).map(video => ({
            id: video.video_id,
            title: video.title || 'Sin título',
            url: `https://www.tiktok.com/@${video.author?.unique_id || 'user'}/video/${video.video_id}`,
            author: {
                name: video.author?.unique_id || 'Desconocido',
                nickname: video.author?.nickname || 'Desconocido'
            },
            stats: {
                plays: video.play_count || 0,
                likes: video.digg_count || 0,
                comments: video.comment_count || 0
            }
        }));
    } catch (error) {
        throw new Error(`Error en búsqueda: ${error.message}`);
    }
}

module.exports = function(app) {
    app.get('/search/tiktok', async (req, res) => {
        const query = req.query.query;
        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'query'"
            });
        }
        const limit = parseInt(req.query.limit) || 10;
        try {
            const results = await tiktokSearch(query, Math.min(limit, 30));
            res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
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