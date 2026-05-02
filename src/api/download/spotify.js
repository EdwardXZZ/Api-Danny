const axios = require('axios');
const crypto = require('crypto');

const UA = 'Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0';

class SpotifyDownloader {
    constructor() {
        this.ky = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
        this.is = axios.create({
            headers: {
                'content-type': 'application/json',
                'origin': 'https://yt.savetube.me',
                'user-agent': UA
            }
        });
    }

    async decrypt(enc) {
        const sr = Buffer.from(enc, 'base64');
        const ky = Buffer.from(this.ky, 'hex');
        const iv = sr.slice(0, 16);
        const dt = sr.slice(16);
        const dc = crypto.createDecipheriv('aes-128-cbc', ky, iv);
        return JSON.parse(Buffer.concat([dc.update(dt), dc.final()]).toString());
    }

    async getCdn() {
        const response = await this.is.get("https://media.savetube.vip/api/random-cdn");
        if (!response.status) return response;
        return { status: true, data: response.data.cdn };
    }

    async searchOnYoutube(query) {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': UA }
        });
        const match = response.data.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (!match) throw new Error('No se encontró el video en YouTube');
        return match[1];
    }

    async downloadFromSavetube(videoId) {
        const u = await this.getCdn();
        if (!u.status) throw new Error('Error obteniendo CDN');
        
        const res = await this.is.post(`https://${u.data}/v2/info`, { url: `https://www.youtube.com/watch?v=${videoId}` });
        const dec = await this.decrypt(res.data.data);
        
        const dl = await this.is.post(`https://${u.data}/download`, {
            id: videoId,
            downloadType: 'audio',
            quality: '128',
            key: dec.key
        });
        
        return {
            title: dec.title,
            thumbnail: dec.thumbnail,
            duration: dec.duration,
            download_url: dl.data.data.downloadUrl
        };
    }

    async download(url) {
        // Extraer ID de Spotify
        const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
        if (!trackMatch) throw new Error('URL de Spotify no válida');
        
        // Obtener título usando OEmbed de Spotify (sin API key)
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const oembedRes = await axios.get(oembedUrl, {
            headers: { 'User-Agent': UA }
        });
        
        let title = oembedRes.data.title || '';
        let artist = '';
        if (title.includes(' - ')) {
            const parts = title.split(' - ');
            artist = parts[0];
            title = parts[1];
        }
        
        const searchQuery = `${title} ${artist} audio`;
        const videoId = await this.searchOnYoutube(searchQuery);
        const result = await this.downloadFromSavetube(videoId);
        
        return {
            title: title,
            artist: artist,
            thumbnail: result.thumbnail,
            duration: result.duration,
            download_url: result.download_url
        };
    }
}

module.exports = function(app) {
    app.get('/download/spotify', async (req, res) => {
        const url = String(req.query.url || "").trim();
        
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Se requiere el parámetro 'url'",
                usage: "/download/spotify?url=https://open.spotify.com/track/xxxxx"
            });
        }
        
        if (!url.includes('open.spotify.com/track/')) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "URL de Spotify no válida. Usa una URL de canción (track)"
            });
        }
        
        try {
            const downloader = new SpotifyDownloader();
            const result = await downloader.download(url);
            
            if (req.query.download === 'true' && result.download_url) {
                return res.redirect(result.download_url);
            }
            
            return res.status(200).json({
                status: true,
                creator: "DVLYONN",
                result: {
                    title: result.title,
                    artist: result.artist,
                    thumbnail: result.thumbnail,
                    duration: result.duration,
                    download_url: result.download_url
                }
            });
            
        } catch (error) {
            console.error('Spotify error:', error.message);
            return res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};