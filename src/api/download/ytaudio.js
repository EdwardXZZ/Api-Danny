const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function getVideoTitle(videoId) {
    try {
        const res = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 'User-Agent': UA }
        });
        const match = res.data.match(/<title>(.*?)<\/title>/);
        return match ? match[1].replace(' - YouTube', '').trim() : 'Unknown';
    } catch {
        return 'Unknown';
    }
}

async function ytmp3(url) {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const apiUrl = 'https://api.greenconvert.net/convert';
    const params = new URLSearchParams({
        url: url,
        format: 'mp3',
        quality: '128'
    });

    const response = await axios.post(apiUrl, params, {
        headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        timeout: 30000
    });

    const data = response.data;
    if (!data || !data.download_url) {
        throw new Error('No se pudo obtener el enlace de descarga');
    }

    const title = await getVideoTitle(videoId);
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
        title: title,
        thumbnail: thumbnail,
        download_url: data.download_url
    };
}

module.exports = function(app) {
    app.get('/download/ytaudio', async (req, res) => {
        const url = String(req.query.url || "").trim();

        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "URL parameter is required"
            });
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Invalid YouTube URL"
            });
        }

        try {
            const result = await ytmp3(url);

            if (req.query.download === 'true' && result.download_url) {
                return res.redirect(result.download_url);
            }

            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: result.title,
                    thumbnail: result.thumbnail,
                    download_url: result.download_url
                }
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};