const axios = require('axios');

module.exports = function(app) {
    app.get('/search/facebook', async (req, res) => {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10;

        if (!query) {
            return res.status(400).json({
                status: false,
                creator: "DVLYONN",
                error: "Falta el parámetro 'q'",
                usage: "/search/facebook?q=BadBunny&limit=10"
            });
        }

        try {
            const apiUrl = `https://api.akng.io.vn/graph/v19.0/search?q=${encodeURIComponent(query)}&type=post&limit=${Math.min(limit, 100)}&access_token=N8o3eySfREuw1pbt3fmcLg`;
            const response = await axios.get(apiUrl, { timeout: 15000 });
            
            const posts = response.data.data || [];
            
            const results = posts.map(post => ({
                id: post.id,
                message: post.message || 'Sin texto',
                created_time: post.created_time,
                permalink_url: `https://facebook.com/${post.id}`,
                from: {
                    id: post.from?.id,
                    name: post.from?.name
                },
                likes: post.likes?.summary?.total_count || 0,
                comments: post.comments?.summary?.total_count || 0,
                shares: post.shares?.count || 0
            }));
            
            return res.json({
                status: true,
                creator: "DVLYONN",
                query: query,
                total_results: results.length,
                result: results
            });
        } catch (error) {
            console.error('[Facebook Search Error]', error.message);
            res.status(500).json({
                status: false,
                creator: "DVLYONN",
                error: error.message
            });
        }
    });
};