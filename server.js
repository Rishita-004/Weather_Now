import express from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from the current directory
app.use(express.static('.'));

// Secure Weather Proxy Endpoint
app.get('/weather', async (req, res) => {
  const { q, lat, lon } = req.query;
  // Use client-provided key if available, otherwise fall back to environment variable
  const apiKey = req.headers['x-api-key'] || process.env.WEATHER_API_KEY;

  // If the API key is not configured or is the default placeholder,
  // return a 401 Unauthorized to trigger the client-side demo mode fallback.
  if (!apiKey || apiKey.trim() === '' || apiKey === 'PASTE_YOUR_API_KEY_HERE') {
    return res.status(401).json({
      cod: 401,
      message: "API key is not configured. Falling back to frontend demo mode."
    });
  }

  let currentUrl, forecastUrl;

  if (q) {
    const city = encodeURIComponent(q.trim());
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
  } else if (lat && lon) {
    currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  } else {
    return res.status(400).json({
      cod: 400,
      message: "Bad Request: Please provide a city 'q' or 'lat' and 'lon' coordinates."
    });
  }

  try {
    const [wResp, fResp] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    const wData = await wResp.json();
    const fData = await fResp.json();

    // Handle standard city not found errors from OpenWeatherMap API
    if (wResp.status === 404 || wData.cod === '404' || wData.cod === 404) {
      return res.status(404).json({ cod: 404, message: "City not found" });
    }

    // Handle invalid/unauthorized keys from OpenWeatherMap API
    if (wResp.status === 401 || wData.cod === 401) {
      return res.status(401).json({ cod: 401, message: "Invalid API key provided." });
    }

    if (!wResp.ok) {
      throw new Error(wData.message || `Current weather API returned status ${wResp.status}`);
    }

    if (!fResp.ok) {
      throw new Error(fData.message || `Forecast API returned status ${fResp.status}`);
    }

    // Return combined data structure
    return res.json({
      weather: wData,
      forecast: fData
    });

  } catch (error) {
    console.error("Error communicating with OpenWeatherMap:", error.message);
    return res.status(500).json({
      cod: 500,
      message: "Failed to fetch weather data from service provider. Please try again later."
    });
  }
});

// Endpoint to check if the server has a pre-configured OpenWeatherMap API key
app.get('/api-status', (req, res) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const hasServerKey = !!(apiKey && apiKey.trim() !== '' && apiKey !== 'PASTE_YOUR_API_KEY_HERE');
  res.json({ hasServerKey });
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Weather Now server is running!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
