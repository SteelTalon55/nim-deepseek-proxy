const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/v1/chat/completions', async (req, res) => {
  try {
    // Log request size for debugging
    console.log('Request body size:', JSON.stringify(req.body).length);
    
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NIM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    // Handle non-JSON responses from NIM
    const text = await response.text();
    if (text.trim().startsWith('{')) {
      const data = JSON.parse(text);
      
      // Forward NIM response headers
      Object.keys(response.headers).forEach(key => {
        if (key.startsWith('x-') || key === 'content-type') {
          res.set(key, response.headers.get(key));
        }
      });
      
      res.status(response.status).json(data);
    } else {
      console.error('Non-JSON response:', text.slice(0, 200));
      return res.status(502).json({ error: 'NIM returned invalid response format' });
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on port ${port}`));
