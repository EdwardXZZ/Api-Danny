const axios = require('axios');

const INVICIOUS_INSTANCES = [
    'https://invidious.snopyta.org',
    'https://yewtu.be',
    'https://inv.riverside.rocks',
    'https://invidious.flokinet.to',
    'https://inv.zzls.xyz'
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome)';

async function searchYouTube(query, limit = 20) {
    for (const instance of INVICIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': UA },
                timeout: 10000
            });
            const results = response.data.slice(0, limit);
            if (results.length === 0) continue;
            return results.map(video => ({
                title: video.title || "Sin título",
                channel: video.author || "Desconocido",
                channelId: video.authorId || "",
                duration: video.lengthSeconds ? `${Math.floor(video.lengthSeconds / 60)}:${(video.lengthSeconds % 60).toString().padStart(2, '0')}` : "?",
                views: video.viewCount ? video.viewCount.toLocaleString() : "N/A",
                thumbnail: video.videoThumbnails?.[3]?.url || video.videoThumbnails?.[0]?.url || "",
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                publishedAt: video.publishedText || "N/A"
            }));
        } catch (error) {
            console.log(`Instancia ${instance} falló: ${error.message}`);
        }
    }
    return [];
}

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
            const results = await searchYouTube(query, Math.min(limit, 30));
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[YouTube Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};