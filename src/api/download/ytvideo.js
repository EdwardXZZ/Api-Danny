const axios = require('axios');

const INVICIOUS_INSTANCES = [
    'https://invidious.flokinet.to',
    'https://inv.riverside.rocks',
    'https://yewtu.be',
    'https://invidious.snopyta.org',
    'https://inv.zzls.xyz',
    'https://invidious.nerdvpn.de',
    'https://inv.odyssey346.dev',
    'https://invidious.osi.kr',
    'https://invidious.reallyaweso.me',
    'https://vid.puffyan.us'
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome)';

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

async function getVideoUrl(videoId, quality = 'medium') {
    for (const instance of INVICIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': UA },
                timeout: 15000
            });
            const data = response.data;
            const formatos = data.formatStreams || [];
            if (!formatos.length) continue;
            
            let formatoElegido = null;
            if (quality === 'high') {
                formatoElegido = formatos.find(f => f.qualityLabel === '720p' || f.qualityLabel === '1080p');
            } else if (quality === 'medium') {
                formatoElegido = formatos.find(f => f.qualityLabel === '480p' || f.qualityLabel === '360p');
            } else if (quality === 'low') {
                formatoElegido = formatos.find(f => f.qualityLabel === '144p');
            }
            if (!formatoElegido) formatoElegido = formatos[0];
            if (formatoElegido?.url) {
                return { url: formatoElegido.url, title: data.title };
            }
        } catch (error) {
            console.log(`Instancia ${instance} falló: ${error.message}`);
        }
    }
    throw new Error('No se pudo obtener el enlace del video');
}

async function getAudioUrl(videoId) {
    for (const instance of INVICIOUS_INSTANCES) {
        try {
            const url = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(url, {
                headers: { 'User-Agent': UA },
                timeout: 15000
            });
            const data = response.data;
            const audioFormat = data.formatStreams?.find(f => f.type?.startsWith('audio/') || f.encoding === 'mp4a');
            if (audioFormat?.url) {
                return { url: audioFormat.url, title: data.title };
            }
        } catch (error) {
            console.log(`Instancia ${instance} falló: ${error.message}`);
        }
    }
    throw new Error('No se pudo obtener el enlace del audio');
}

module.exports = function(app) {
    app.get('/download/ytvideo', async (req, res) => {
        const url = req.query.url;
        const quality = req.query.quality || 'medium';
        if (!url) return res.status(400).json({ error: "Falta url" });
        
        const videoId = extractVideoId(url);
        if (!videoId) return res.status(400).json({ error: "URL inválida" });
        
        try {
            const videoData = await getVideoUrl(videoId, quality);
            if (req.query.download === 'true') return res.redirect(videoData.url);
            res.json({ status: true, result: videoData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    
    app.get('/download/ytaudio', async (req, res) => {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: "Falta url" });
        
        const videoId = extractVideoId(url);
        if (!videoId) return res.status(400).json({ error: "URL inválida" });
        
        try {
            const audioData = await getAudioUrl(videoId);
            if (req.query.download === 'true') return res.redirect(audioData.url);
            res.json({ status: true, result: audioData });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};