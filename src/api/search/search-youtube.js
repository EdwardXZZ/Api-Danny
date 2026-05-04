const axios = require('axios');

module.exports = function(app) {
    app.get('/search/youtube', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/youtube?q=badbunny&limit=10"
            });
        }

        try {
            const apiUrl = `https://yt-api.levanter.workers.dev/search?q=${encodeURIComponent(query)}&max=${Math.min(limit, 30)}`;
            const response = await axios.get(apiUrl, { timeout: 15000 });
            
            const videos = response.data.results || [];
            
            const results = videos.filter(v => v.type === 'video').map(video => ({
                title: video.title || 'Sin título',
                channel: video.uploaderName || 'Desconocido',
                duration: video.length || '?',
                views: video.views ? video.views.toLocaleString() : 'N/A',
                thumbnail: video.thumbnail || '',
                url: `https://www.youtube.com/watch?v=${video.id}`,
                publishedAt: video.uploadedAt || 'N/A'
            }));
            
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[YouTube Error]', error.message);
            
            // Fallback: otra API pública gratuita
            try {
                const fallbackUrl = `https://vid.portal.com.ng/api/search?query=${encodeURIComponent(query)}&type=video`;
                const fallbackRes = await axios.get(fallbackUrl, { timeout: 15000 });
                const fallbackVideos = fallbackRes.data.data || [];
                
                const results = fallbackVideos.slice(0, limit).map(video => ({
                    title: video.title,
                    channel: video.channel?.name || 'Desconocido',
                    duration: video.duration || '?',
                    views: video.views ? video.views.toLocaleString() : 'N/A',
                    thumbnail: video.thumbnail?.[0]?.url || '',
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    publishedAt: video.publishedAt?.split('T')[0] || 'N/A'
                }));
                
                return res.json({
                    status: true,
                    creator: "DVLYONN",
                    query: query,
                    total_results: results.length,
                    result: results
                });
            } catch (fallbackError) {
                return res.status(500).json({
                    status: false,
                    creator: "DVLYONN",
                    error: error.message
                });
            }
        }
    });
};