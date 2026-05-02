const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function instagramDownload(url) {
    const shortcodeMatch = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/);
    if (!shortcodeMatch) throw new Error('URL de Instagram no válida');
    const shortcode = shortcodeMatch[1];
    const apiUrl = `https://www.instagram.com/api/v1/media/${shortcode}/info/`;
    const response = await axios.get(apiUrl, {
        headers: {
            'User-Agent': UA,
            'X-IG-App-ID': '936619743392459',
            'Accept': 'application/json'
        }
    });
    const data = response.data;
    if (!data || !data.items || !data.items.length) {
        throw new Error('No se pudo obtener el contenido');
    }
    const item = data.items[0];
    let mediaUrl = null;
    let type = 'image';
    if (item.video_versions && item.video_versions.length) {
        type = 'video';
        mediaUrl = item.video_versions[0].url;
    } else if (item.image_versions2 && item.image_versions2.candidates.length) {
        type = 'image';
        mediaUrl = item.image_versions2.candidates[0].url;
    }
    if (!mediaUrl) throw new Error('No se encontró contenido multimedia');
    return {
        type,
        url: mediaUrl,
        caption: item.caption?.text || 'Instagram Post'
    };
}

module.exports = function(app) {
    app.get('/download/instagram', async (req, res) => {
        const url = req.query.url;
        if (!url) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'url'",
                usage: "/download/instagram?url=URL_DEL_POST"
            });
        }
        try {
            const result = await instagramDownload(url);
            if (req.query.download === 'true') {
                return res.redirect(result.url);
            }
            return res.json({
                status: true,
                creator: "DVLYONN",
                result: result
            });
        } catch (err) {
            console.error('[Instagram Error]', err.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: err.message
            });
        }
    });
};