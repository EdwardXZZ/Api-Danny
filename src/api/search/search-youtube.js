// youtube-search.js - SIN API KEY, SIN LÍMITES
const yts = require('yt-search');

// Formatear duración de segundos a MM:SS
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Formatear número de vistas
function formatViews(views) {
    if (!views) return "N/A";
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
    if (views >= 1000) return (views / 1000).toFixed(1) + "K";
    return views.toString();
}

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        let limit = parseInt(req.query.limit) || 20;

        if (isNaN(limit)) limit = 20;
        if (limit > 50) limit = 50;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&limit=10"
            });
        }

        try {
            // Buscar videos con yt-search (sin API key)
            const searchResults = await yts(query);
            const videos = searchResults.videos || [];
            
            if (videos.length === 0) {
                return res.json({
                    status: true,
                    creator: "DVLYONN",
                    query: query,
                    total_results: 0,
                    result: []
                });
            }

            // Limitar resultados y formatear
            const results = videos.slice(0, limit).map(video => ({
                title: video.title || "Sin título",
                channel: video.author?.name || "Desconocido",
                channelId: video.author?.channelId || "",
                duration: formatDuration(video.duration),
                views: formatViews(video.views),
                thumbnail: video.thumbnail || "",
                url: video.url,
                publishedAt: video.uploadedAt || "N/A"
            }));

            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });

        } catch (error) {
            console.error('[YouTube Search Error]', error.message);
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message || "Ocurrió un error en la búsqueda"
            });
        }
    });
};