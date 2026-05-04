// src/api/audio.js
const axios = require('axios');
const fs = require('fs');

const AUDIO_URL = 'https://files.catbox.moe/i427hk.mp3';

module.exports = function(app) {
    app.get('/tools/lyonn', async (req, res) => {
        if (req.query.download === 'true') {
            // Redirigir directamente al archivo
            return res.redirect(AUDIO_URL);
        }

        try {
            // Opción 1: Devolver el archivo como audio
            const response = await axios.get(AUDIO_URL, { responseType: 'stream' });
            res.setHeader('Content-Type', 'audio/mpeg');
            response.data.pipe(res);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};