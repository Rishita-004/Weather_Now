/**
 * Weather App – Core Script
 * ─────────────────────────────────────────────────────────────────
 * Handles: light/dark theme toggle, canvas elements (stars, bubbles),
 * API calls, Demo mode, SVG weather icons, forecast, geolocation,
 * date/time formatting, and modal interactions.
 */

// ==========================================================================
// 1. API CONFIGURATION & STATE
// ==========================================================================
let currentMode = 'demo'; // 'demo' or 'live'
let hasServerApiKey = false;
let userApiKey = localStorage.getItem('owm_user_api_key') || '082555b2676a99d93c5d2600f6a73d41';

// ==========================================================================
// 2. DOM SELECTORS
// ==========================================================================
const el = {
  // Header
  locationBtn: document.getElementById('locationBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),

  // API Key & Mode Toggles
  apiKeyWrapper: document.getElementById('apiKeyWrapper'),
  apiKeyBar: document.getElementById('apiKeyBar'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  apiKeySaveBtn: document.getElementById('apiKeySaveBtn'),
  apiKeyToggleBtn: document.getElementById('apiKeyToggleBtn'),
  apiStatusDot: document.getElementById('apiStatusDot'),
  demoModeBtn: document.getElementById('demoModeBtn'),
  liveModeBtn: document.getElementById('liveModeBtn'),

  // Search
  cityInput: document.getElementById('cityInput'),
  searchBtn: document.getElementById('searchBtn'),

  // Weather card
  weatherCard: document.getElementById('weatherCard'),
  loaderOverlay: document.getElementById('loaderOverlay'),
  weatherContent: document.getElementById('weatherContent'),
  errorContainer: document.getElementById('errorContainer'),
  errorTitle: document.getElementById('errorTitle'),
  errorMessage: document.getElementById('errorMessage'),
  errorResetBtn: document.getElementById('errorResetBtn'),

  // Weather details
  cityName: document.getElementById('cityName'),
  currentDate: document.getElementById('currentDate'),
  currentTime: document.getElementById('currentTime'),
  weatherIconContainer: document.getElementById('weatherIconContainer'),
  currentTemp: document.getElementById('currentTemp'),
  weatherCondition: document.getElementById('weatherCondition'),

  // Stats panels
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('windSpeed'),
  feelsLike: document.getElementById('feelsLike'),
  pressure: document.getElementById('pressure'),

  // Forecast
  forecastSection: document.getElementById('forecastSection'),
  forecastGrid: document.getElementById('forecastGrid'),

  // Canvas
  bubblesLayer: document.getElementById('bubblesLayer'),
  starsLayer: document.getElementById('starsLayer'),

  // Modal
  helpModal: document.getElementById('helpModal'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalOkBtn: document.getElementById('modalOkBtn'),
};

// ==========================================================================
// 3. ANIMATED SVG WEATHER ICONS
// ==========================================================================

/**
 * Returns SVG markup for the given weather category.
 * Includes a "night" icon for clear-sky nights (crescent moon with stars).
 */
function getWeatherSVG(type, size = 100) {
  const S = size;
  const H = S / 2;

  switch (type) {
    case 'sunny':
      return `<svg class="weather-svg sunny-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <circle class="sun-glow"  cx="${H}" cy="${H}" r="${H * 0.56}" fill="rgba(253,185,19,0.18)"/>
        <circle class="sun-body"  cx="${H}" cy="${H}" r="${H * 0.36}" fill="#FDB913"/>
        <g class="sun-beams" stroke="#FDB913" stroke-width="${S * 0.045}" stroke-linecap="round">
          <line x1="${H}" y1="${S * 0.07}" x2="${H}" y2="${S * 0.22}"/>
          <line x1="${H}" y1="${S * 0.78}" x2="${H}" y2="${S * 0.93}"/>
          <line x1="${S * 0.07}" y1="${H}" x2="${S * 0.22}" y2="${H}"/>
          <line x1="${S * 0.78}" y1="${H}" x2="${S * 0.93}" y2="${H}"/>
          <line x1="${S * 0.175}" y1="${S * 0.175}" x2="${S * 0.27}" y2="${S * 0.27}"/>
          <line x1="${S * 0.73}" y1="${S * 0.73}" x2="${S * 0.825}" y2="${S * 0.825}"/>
          <line x1="${S * 0.825}" y1="${S * 0.175}" x2="${S * 0.73}" y2="${S * 0.27}"/>
          <line x1="${S * 0.27}" y1="${S * 0.73}" x2="${S * 0.175}" y2="${S * 0.825}"/>
        </g>
      </svg>`;

    case 'night':
      return `<svg class="weather-svg night-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${H * 0.8}" cy="${H}" r="${H * 0.38}" fill="#E8E0D0" class="moon-body"/>
        <circle cx="${H * 0.65}" cy="${H * 0.88}" r="${H * 0.30}" fill="transparent" stroke="none"/>
        <!-- Crescent shadow -->
        <circle cx="${H * 0.95}" cy="${H * 0.92}" r="${H * 0.30}" fill="rgba(11,17,32,0.8)"/>
        <!-- Moon glow -->
        <circle cx="${H * 0.8}" cy="${H}" r="${H * 0.52}" fill="rgba(200,210,240,0.08)"/>
        <!-- Stars -->
        <circle class="star-twink" cx="${S * 0.70}" cy="${S * 0.20}" r="${S * 0.018}" fill="#F5E6B8" style="--dur:2s;--delay:0s"/>
        <circle class="star-twink" cx="${S * 0.82}" cy="${S * 0.35}" r="${S * 0.012}" fill="#F5E6B8" style="--dur:2.5s;--delay:0.4s"/>
        <circle class="star-twink" cx="${S * 0.75}" cy="${S * 0.55}" r="${S * 0.015}" fill="#F5E6B8" style="--dur:1.8s;--delay:0.8s"/>
        <circle class="star-twink" cx="${S * 0.60}" cy="${S * 0.15}" r="${S * 0.010}" fill="#F5E6B8" style="--dur:3s;--delay:1.2s"/>
        <circle class="star-twink" cx="${S * 0.88}" cy="${S * 0.60}" r="${S * 0.013}" fill="#F5E6B8" style="--dur:2.2s;--delay:0.6s"/>
      </svg>`;

    case 'partlycloudy':
      return `<svg class="weather-svg partlycloudy-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${S * 0.12},${S * -0.1})">
          <circle class="sun-glow" cx="${H}" cy="${H}" r="${H * 0.46}" fill="rgba(253,185,19,0.18)"/>
          <circle class="sun-body" cx="${H}" cy="${H}" r="${H * 0.30}" fill="#FDB913"/>
          <g class="sun-beams" stroke="#FDB913" stroke-width="${S * 0.038}" stroke-linecap="round">
            <line x1="${H}" y1="${S * 0.1}" x2="${H}" y2="${S * 0.24}"/>
            <line x1="${H}" y1="${S * 0.76}" x2="${H}" y2="${S * 0.90}"/>
            <line x1="${S * 0.1}" y1="${H}" x2="${S * 0.24}" y2="${H}"/>
            <line x1="${S * 0.76}" y1="${H}" x2="${S * 0.90}" y2="${H}"/>
            <line x1="${S * 0.20}" y1="${S * 0.20}" x2="${S * 0.30}" y2="${S * 0.30}"/>
            <line x1="${S * 0.70}" y1="${S * 0.70}" x2="${S * 0.80}" y2="${S * 0.80}"/>
            <line x1="${S * 0.80}" y1="${S * 0.20}" x2="${S * 0.70}" y2="${S * 0.30}"/>
            <line x1="${S * 0.30}" y1="${S * 0.70}" x2="${S * 0.20}" y2="${S * 0.80}"/>
          </g>
        </g>
        <path class="cloud-front" d="M30 ${S * 0.68}h${S * 0.36}a${S * 0.18} ${S * 0.18} 0 1 0-${S * 0.055}-${S * 0.35}A${S * 0.20} ${S * 0.20} 0 1 0 26 ${S * 0.52}c0 1.4.15 2.78.43 4.1A${S * 0.17} ${S * 0.17} 0 0 0 30 ${S * 0.68}z" fill="#E2E8F0"/>
      </svg>`;

    case 'partlycloudynight':
      return `<svg class="weather-svg partlycloudy-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(${S * 0.14},${S * -0.08})">
          <circle cx="${H}" cy="${H}" r="${H * 0.28}" fill="#E8E0D0" class="moon-body"/>
          <circle cx="${H * 1.12}" cy="${H * 0.92}" r="${H * 0.22}" fill="rgba(11,17,32,0.8)"/>
          <circle cx="${H}" cy="${H}" r="${H * 0.40}" fill="rgba(200,210,240,0.06)"/>
        </g>
        <path class="cloud-front" d="M30 ${S * 0.68}h${S * 0.36}a${S * 0.18} ${S * 0.18} 0 1 0-${S * 0.055}-${S * 0.35}A${S * 0.20} ${S * 0.20} 0 1 0 26 ${S * 0.52}c0 1.4.15 2.78.43 4.1A${S * 0.17} ${S * 0.17} 0 0 0 30 ${S * 0.68}z" fill="#C8D3E0"/>
      </svg>`;

    case 'cloudy':
      return `<svg class="weather-svg cloudy-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <path class="back-cloud" d="M${S * 0.36} ${S * 0.60}h${S * 0.28}a${S * 0.16} ${S * 0.16} 0 1 0-${S * 0.048}-${S * 0.31}A${S * 0.18} ${S * 0.18} 0 1 0 ${S * 0.32} ${S * 0.46}c0 1.25.13 2.47.38 3.65A${S * 0.15} ${S * 0.15} 0 0 0 ${S * 0.36} ${S * 0.60}z" fill="rgba(203,213,225,0.65)"/>
        <path class="main-cloud" d="M${S * 0.30} ${S * 0.70}h${S * 0.38}a${S * 0.19} ${S * 0.19} 0 1 0-${S * 0.058}-${S * 0.37}A${S * 0.21} ${S * 0.21} 0 1 0 ${S * 0.27} ${S * 0.54}c0 1.4.15 2.78.43 4.1A${S * 0.17} ${S * 0.17} 0 0 0 ${S * 0.30} ${S * 0.70}z" fill="#E2E8F0"/>
      </svg>`;

    case 'rainy':
      return `<svg class="weather-svg rainy-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <path class="cloud-body" d="M${S * 0.30} ${S * 0.64}h${S * 0.38}a${S * 0.19} ${S * 0.19} 0 1 0-${S * 0.058}-${S * 0.37}A${S * 0.21} ${S * 0.21} 0 1 0 ${S * 0.27} ${S * 0.48}c0 1.4.15 2.78.43 4.1A${S * 0.17} ${S * 0.17} 0 0 0 ${S * 0.30} ${S * 0.64}z" fill="#94A3B8"/>
        <g stroke="#0ea5e9" stroke-width="${S * 0.038}" stroke-linecap="round">
          <line class="drop-1" x1="${S * 0.38}" y1="${S * 0.70}" x2="${S * 0.35}" y2="${S * 0.82}"/>
          <line class="drop-2" x1="${S * 0.50}" y1="${S * 0.70}" x2="${S * 0.47}" y2="${S * 0.82}"/>
          <line class="drop-3" x1="${S * 0.62}" y1="${S * 0.70}" x2="${S * 0.59}" y2="${S * 0.82}"/>
        </g>
      </svg>`;

    case 'thunderstorm':
      return `<svg class="weather-svg thunderstorm-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <path class="cloud-body" d="M${S * 0.30} ${S * 0.64}h${S * 0.38}a${S * 0.19} ${S * 0.19} 0 1 0-${S * 0.058}-${S * 0.37}A${S * 0.21} ${S * 0.21} 0 1 0 ${S * 0.27} ${S * 0.48}c0 1.4.15 2.78.43 4.1A${S * 0.17} ${S * 0.17} 0 0 0 ${S * 0.30} ${S * 0.64}z" fill="#64748B"/>
        <g stroke="#38bdf8" stroke-width="${S * 0.030}" stroke-linecap="round">
          <line class="drop-1" x1="${S * 0.38}" y1="${S * 0.70}" x2="${S * 0.35}" y2="${S * 0.79}"/>
          <line class="drop-2" x1="${S * 0.60}" y1="${S * 0.70}" x2="${S * 0.57}" y2="${S * 0.79}"/>
        </g>
        <polygon class="lightning-bolt" points="${H},${S * 0.67} ${S * 0.56},${S * 0.75} ${S * 0.48},${S * 0.75} ${S * 0.52},${S * 0.87} ${S * 0.44},${S * 0.77} ${S * 0.50},${S * 0.77}" fill="#FBBF24" stroke="#FBBF24" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`;

    case 'snow':
      return `<svg class="weather-svg snowy-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <path class="cloud-body" d="M${S * 0.30} ${S * 0.64}h${S * 0.38}a${S * 0.19} ${S * 0.19} 0 1 0-${S * 0.058}-${S * 0.37}A${S * 0.21} ${S * 0.21} 0 1 0 ${S * 0.27} ${S * 0.48}c0 1.4.15 2.78.43 4.1A${S * 0.17} ${S * 0.17} 0 0 0 ${S * 0.30} ${S * 0.64}z" fill="#CBD5E1"/>
        <g fill="none" stroke="#38bdf8" stroke-width="${S * 0.030}" stroke-linecap="round">
          <g class="flake-1" transform="translate(${S * 0.36},${S * 0.75})"><line x1="0" y1="${-S * 0.05}" x2="0" y2="${S * 0.05}"/><line x1="${-S * 0.05}" y1="0" x2="${S * 0.05}" y2="0"/></g>
          <g class="flake-2" transform="translate(${H},${S * 0.78})"><line x1="0" y1="${-S * 0.05}" x2="0" y2="${S * 0.05}"/><line x1="${-S * 0.05}" y1="0" x2="${S * 0.05}" y2="0"/></g>
          <g class="flake-3" transform="translate(${S * 0.64},${S * 0.75})"><line x1="0" y1="${-S * 0.05}" x2="0" y2="${S * 0.05}"/><line x1="${-S * 0.05}" y1="0" x2="${S * 0.05}" y2="0"/></g>
        </g>
      </svg>`;

    default: // mist
      return `<svg class="weather-svg mist-icon" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#94A3B8" stroke-width="${S * 0.048}" stroke-linecap="round">
          <line class="mist-line-1" x1="${S * 0.20}" y1="${S * 0.35}" x2="${S * 0.80}" y2="${S * 0.35}"/>
          <line class="mist-line-2" x1="${S * 0.25}" y1="${S * 0.48}" x2="${S * 0.75}" y2="${S * 0.48}"/>
          <line class="mist-line-3" x1="${S * 0.18}" y1="${S * 0.61}" x2="${S * 0.82}" y2="${S * 0.61}"/>
          <line class="mist-line-1" x1="${S * 0.28}" y1="${S * 0.74}" x2="${S * 0.72}" y2="${S * 0.74}"/>
        </g>
      </svg>`;
  }
}

/** Maps OWM weather IDs to our SVG categories */
function mapConditionCode(id) {
  if (id === 800) return 'sunny';
  if (id === 801 || id === 802) return 'partlycloudy';
  if (id >= 803 && id <= 804) return 'cloudy';
  if (id >= 500 && id <= 599) return 'rainy';
  if (id >= 300 && id <= 399) return 'rainy';
  if (id >= 200 && id <= 299) return 'thunderstorm';
  if (id >= 600 && id <= 699) return 'snow';
  if (id >= 700 && id <= 799) return 'mist';
  return 'cloudy';
}

// ==========================================================================
// 4. DEMO / MOCK DATA
// ==========================================================================
function fetchMockWeatherData(query) {
  let seedText = typeof query === 'string'
    ? query.trim()
    : `coords_${Math.round(query.lat * 100)}_${Math.round(query.lon * 100)}`;

  if (!seedText) return null;
  const lower = seedText.toLowerCase();
  if (['error', 'xyz', 'notfound'].includes(lower)) return { cod: "404", message: "city not found" };

  let hash = 0;
  for (let i = 0; i < seedText.length; i++) hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  hash = Math.abs(hash);

  const categories = [
    { id: 800, main: "Clear", description: "clear sky" },
    { id: 801, main: "Clouds", description: "few clouds" },
    { id: 804, main: "Clouds", description: "overcast clouds" },
    { id: 500, main: "Rain", description: "light rain" },
    { id: 201, main: "Thunderstorm", description: "thunderstorm with rain" },
    { id: 600, main: "Snow", description: "light snow" },
    { id: 701, main: "Mist", description: "misty haze" },
  ];

  const cat = categories[hash % categories.length];
  const temp = Math.round((hash % 38) - 5);
  const humidity = Math.round(30 + (hash % 66));
  const wind = Math.round((2 + (hash % 25)) * 10) / 10;
  const feelsLike = Math.round(temp + (humidity > 70 ? 2 : -2));
  const pressure = 1000 + (hash % 40);
  const countries = ["IN", "US", "GB", "DE", "FR", "JP", "AU", "CA", "BR", "ZA"];
  const countryCode = countries[hash % countries.length];
  const displayName = typeof query === 'string'
    ? query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : "Current Location";

  return {
    cod: 200,
    name: displayName,
    sys: { country: countryCode },
    main: { temp, feels_like: feelsLike, humidity, pressure },
    weather: [{ id: cat.id, main: cat.main, description: cat.description }],
    wind: { speed: wind },
    timezone: ((hash % 24) - 12) * 3600,
  };
}

function generateMockForecast(query) {
  let seedText = typeof query === 'string'
    ? query.trim()
    : `coords_${Math.round(query.lat * 100)}_${Math.round(query.lon * 100)}`;

  if (!seedText) return [];

  let hash = 0;
  for (let i = 0; i < seedText.length; i++) hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  hash = Math.abs(hash);

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const wIds = [800, 801, 804, 500, 201, 600, 701];
  const today = new Date().getDay();
  const result = [];

  for (let d = 1; d <= 5; d++) {
    const dh = hash + d * 137;
    const base = Math.round((hash % 38) - 5);
    const high = base + Math.abs(dh % 4);
    const low = base - 2 - Math.abs(dh % 5);
    result.push({ day: days[(today + d) % 7], high, low, id: wIds[dh % wIds.length] });
  }
  return result;
}

// ==========================================================================
// 5. DATE & TIME
// ==========================================================================
function formatTimeAndDate(offsetSeconds) {
  const utc = new Date();
  const utcMs = utc.getTime() + utc.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + offsetSeconds * 1000);

  const dateStr = local.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let h = local.getHours();
  const m = String(local.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeStr = `${h}:${m} ${ampm}`;

  return { date: dateStr, time: timeStr };
}

// ==========================================================================
// 6. CANVAS ELEMENTS: BUBBLES & STARS
// ==========================================================================
function createBubbles() {
  const container = el.bubblesLayer;
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 22; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = Math.random() * 55 + 12;
    b.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: ${Math.random() * -20}%;
      animation-duration: ${Math.random() * 12 + 10}s;
      animation-delay: ${Math.random() * 12}s;
    `;
    container.appendChild(b);
  }
}

function createStars() {
  const container = el.starsLayer;
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 85; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 3 + 1;
    const dur = (Math.random() * 3 + 1.5).toFixed(1);
    const delay = (Math.random() * 5).toFixed(1);
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 70}%;
      left: ${Math.random() * 100}%;
      --dur: ${dur}s;
      --delay: ${delay}s;
    `;
    container.appendChild(star);
  }
}

// ==========================================================================
// 7. THEME TOGGLE
// ==========================================================================
function initTheme() {
  const stored = localStorage.getItem('theme_preference');
  if (stored === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
}

function isDarkMode() {
  return document.body.classList.contains('dark-mode');
}

// ==========================================================================
// 8. WEATHER FETCH & RENDER
// ==========================================================================
function updateModeUI() {
  if (!el.liveModeBtn || !el.demoModeBtn || !el.apiStatusDot) return;
  if (currentMode === 'live') {
    el.liveModeBtn.classList.add('active');
    el.demoModeBtn.classList.remove('active');
    el.apiStatusDot.classList.add('live');
    el.apiStatusDot.setAttribute('title', 'Live Mode Active');
  } else {
    el.liveModeBtn.classList.remove('active');
    el.demoModeBtn.classList.add('active');
    el.apiStatusDot.classList.remove('live');
    el.apiStatusDot.setAttribute('title', 'Demo Mode Active');
  }
}

// ==========================================================================
// 8. WEATHER FETCH & RENDER
// ==========================================================================
async function fetchWeather(query) {
  if (!query) return;

  showLoader(true);
  hideError();

  // If in demo mode, generate and render offline mock data directly
  if (currentMode === 'demo') {
    await new Promise(r => setTimeout(r, 450)); // subtle simulated network lag for premium feel
    const mockData = fetchMockWeatherData(query);
    const mockForecast = generateMockForecast(query);

    if (mockData && mockData.cod !== "404" && mockData.cod !== 404) {
      renderWeatherCard(mockData);
      renderForecastGrid(mockForecast);
    } else {
      showError("City Not Found", "The city could not be found in offline demo mode. Try a different name.");
    }
    showLoader(false);
    return;
  }

  // Live mode - call backend
  let backendUrl;
  if (typeof query === 'string') {
    backendUrl = `/weather?q=${encodeURIComponent(query.trim())}`;
  } else {
    backendUrl = `/weather?lat=${query.lat}&lon=${query.lon}`;
  }

  try {
    const headers = {};
    if (userApiKey) {
      headers['x-api-key'] = userApiKey;
    }

    const resp = await fetch(backendUrl, { headers });
    const data = await resp.json();

    // 401 status indicates the API key is missing, unauthorized, or not configured
    if (resp.status === 401 || data.cod === 401) {
      console.warn("Backend reported API key not set or invalid. Falling back to local demo mode.");
      
      // Auto toggle to demo mode
      currentMode = 'demo';
      updateModeUI();
      
      alert(data.message || "API key not set or invalid. Reverting to Demo Mode.");

      // Fetch as demo instead
      const mockData = fetchMockWeatherData(query);
      const mockForecast = generateMockForecast(query);

      if (mockData && mockData.cod !== "404" && mockData.cod !== 404) {
        renderWeatherCard(mockData);
        renderForecastGrid(mockForecast);
      } else {
        showError("City Not Found", "The city could not be found in offline demo mode. Try a different name.");
      }
      return;
    }

    if (resp.status === 404 || data.cod === "404" || data.cod === 404) {
      showError("City Not Found", "We couldn't locate this city. Check the spelling and try again.");
      return;
    }

    if (!resp.ok) {
      throw new Error(data.message || "Failed to fetch weather data");
    }

    // Render weather using combined backend data
    renderWeatherCard(data.weather);
    renderForecastGrid(parseForecastList(data.forecast.list));

  } catch (err) {
    console.error(err);
    if (!navigator.onLine) {
      showError("No Connection", "Check your internet connection and try again.");
    } else {
      showError("Service Unavailable", "Could not retrieve weather. Please try again later.");
    }
  } finally {
    showLoader(false);
  }
}

/** Parses OWM 5-day/3-hour list → 1 entry per day with high/low */
function parseForecastList(list) {
  if (!list || !list.length) return [];
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Group all entries by date to compute high/low
  const dayMap = {};
  list.forEach(item => {
    const d = new Date(item.dt * 1000);
    const dk = d.toDateString();
    if (!dayMap[dk]) dayMap[dk] = { temps: [], id: item.weather[0].id, day: days[d.getDay()] };
    dayMap[dk].temps.push(item.main.temp);
  });

  return Object.values(dayMap).slice(1, 6).map(d => ({
    day: d.day,
    high: Math.round(Math.max(...d.temps)),
    low: Math.round(Math.min(...d.temps)),
    id: d.id,
  }));
}

// ==========================================================================
// 9. RENDER HELPERS
// ==========================================================================
function renderWeatherCard(data) {
  if (!data) return;

  el.weatherContent.classList.add('updating');

  setTimeout(() => {
    const city = data.name || "Unknown City";
    const country = data.sys?.country || "";
    const temp = data.main?.temp !== undefined ? Math.round(data.main.temp) : "--";
    const feelsLike = data.main?.feels_like !== undefined ? Math.round(data.main.feels_like) : "--";
    const humidity = data.main?.humidity !== undefined ? data.main.humidity : "--";
    const wind = data.wind?.speed !== undefined ? data.wind.speed : "--";
    const pressure = data.main?.pressure !== undefined ? data.main.pressure : "--";
    const description = data.weather?.[0]?.description || data.weather?.[0]?.main || "N/A";
    const weatherId = data.weather?.[0]?.id ?? 800;
    const offset = data.timezone ?? 0;

    el.cityName.textContent = country ? `${city}, ${country}` : city;
    el.currentTemp.textContent = temp;
    el.weatherCondition.textContent = description.charAt(0).toUpperCase() + description.slice(1);

    // Stats
    el.humidity.textContent = humidity !== "--" ? `${humidity}%` : "--";
    el.windSpeed.textContent = wind !== "--" ? `${wind} km/h` : "--";
    el.feelsLike.textContent = feelsLike !== "--" ? `${feelsLike}°C` : "--";
    el.pressure.textContent = pressure !== "--" ? `${pressure} hPa` : "--";

    // Date & Time
    const dt = formatTimeAndDate(offset);
    el.currentDate.textContent = dt.date;
    el.currentTime.textContent = dt.time;

    // Weather icon – use "night" variant for clear sky in dark mode
    let category = mapConditionCode(weatherId);
    if (isDarkMode()) {
      if (category === 'sunny') category = 'night';
      if (category === 'partlycloudy') category = 'partlycloudynight';
    }
    el.weatherIconContainer.innerHTML = getWeatherSVG(category, 200);

    el.weatherContent.classList.remove('updating');
  }, 300);
}

function renderForecastGrid(forecasts) {
  if (!el.forecastGrid) return;
  el.forecastGrid.innerHTML = '';

  if (!forecasts || !forecasts.length) {
    el.forecastSection.style.display = 'none';
    return;
  }
  el.forecastSection.style.display = '';

  forecasts.forEach(day => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    let category = mapConditionCode(day.id);
    // Night variants for forecast in dark mode
    if (isDarkMode()) {
      if (category === 'sunny') category = 'night';
      if (category === 'partlycloudy') category = 'partlycloudynight';
    }
    const iconSVG = getWeatherSVG(category, 100);

    card.innerHTML = `
      <span class="fc-day">${day.day}</span>
      <div class="fc-icon">${iconSVG}</div>
      <span class="fc-high">${day.high}°C</span>
      <span class="fc-low">${day.low}°C</span>
    `;
    el.forecastGrid.appendChild(card);
  });
}

// ==========================================================================
// 10. UI STATE HELPERS
// ==========================================================================
function showLoader(visible) {
  el.loaderOverlay.classList.toggle('active', visible);
}

function showError(title, msg) {
  el.weatherContent.style.display = 'none';
  el.errorContainer.style.display = 'flex';
  el.errorTitle.textContent = title;
  el.errorMessage.textContent = msg;
}

function hideError() {
  el.errorContainer.style.display = 'none';
  el.weatherContent.style.display = '';
}


// ==========================================================================
// 12. GEOLOCATION
// ==========================================================================
function handleGeolocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }
  showLoader(true);
  hideError();

  navigator.geolocation.getCurrentPosition(
    pos => fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
    err => {
      showLoader(false);
      alert(err.code === err.PERMISSION_DENIED
        ? "Location access denied. Enable it in browser settings."
        : "Could not retrieve your location. Try again.");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ==========================================================================
// 13. EVENT LISTENERS
// ==========================================================================
function handleSearch() {
  const city = el.cityInput.value.trim();
  if (city) fetchWeather(city);
}

el.searchBtn.addEventListener('click', handleSearch);
el.cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

if (el.locationBtn) el.locationBtn.addEventListener('click', handleGeolocation);
if (el.themeToggleBtn) {
  el.themeToggleBtn.addEventListener('click', () => {
    toggleTheme();
    // Re-render weather icon to swap day/night variant
    const currentCity = el.cityName.textContent;
    if (currentCity) {
      // Quick re-render without re-fetching
      const tempText = el.currentTemp.textContent;
      if (tempText && tempText !== '--') {
        // Re-render current icon based on new theme
        const condText = el.weatherCondition.textContent;
        // Just refresh the last displayed data
        if (lastWeatherData) {
          renderWeatherCard(lastWeatherData);
          if (lastForecastData) renderForecastGrid(lastForecastData);
        }
      }
    }
  });
}

el.errorResetBtn.addEventListener('click', () => {
  hideError();
  el.cityInput.value = '';
  el.cityInput.focus();
  fetchWeather("New Delhi");
});

// Modal
if (el.modalCloseBtn) el.modalCloseBtn.addEventListener('click', () => el.helpModal.classList.remove('active'));
if (el.modalOkBtn) el.modalOkBtn.addEventListener('click', () => el.helpModal.classList.remove('active'));
el.helpModal?.addEventListener('click', e => { if (e.target === el.helpModal) el.helpModal.classList.remove('active'); });

// API Key toggle drawer click
if (el.apiKeyToggleBtn) {
  el.apiKeyToggleBtn.addEventListener('click', () => {
    if (el.apiKeyWrapper) {
      el.apiKeyWrapper.classList.toggle('open');
      if (el.apiKeyWrapper.classList.contains('open') && el.apiKeyInput) {
        el.apiKeyInput.focus();
      }
    }
  });
}

// API Key save/clear click
if (el.apiKeySaveBtn) {
  el.apiKeySaveBtn.addEventListener('click', () => {
    if (!el.apiKeyInput) return;
    const newKey = el.apiKeyInput.value.trim();
    if (newKey) {
      userApiKey = newKey;
      localStorage.setItem('owm_user_api_key', newKey);
      if (el.apiKeyWrapper) el.apiKeyWrapper.classList.remove('open');
      
      // Auto switch to Live mode when saving a key
      currentMode = 'live';
      updateModeUI();
      
      const currentCity = el.cityName ? el.cityName.textContent : 'New Delhi';
      const cityOnly = currentCity.split(',')[0].trim();
      fetchWeather(cityOnly);
    } else {
      userApiKey = '';
      localStorage.removeItem('owm_user_api_key');
      alert("API Key cleared. Switching back to Demo Mode.");
      
      currentMode = 'demo';
      updateModeUI();
      
      const currentCity = el.cityName ? el.cityName.textContent : 'New Delhi';
      const cityOnly = currentCity.split(',')[0].trim();
      fetchWeather(cityOnly);
    }
  });
}

// Save/trigger key when user presses Enter inside API input
if (el.apiKeyInput) {
  el.apiKeyInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (el.apiKeySaveBtn) el.apiKeySaveBtn.click();
    }
  });
}

// Demo Mode button click
if (el.demoModeBtn) {
  el.demoModeBtn.addEventListener('click', () => {
    if (currentMode !== 'demo') {
      currentMode = 'demo';
      updateModeUI();
      const currentCity = el.cityName ? el.cityName.textContent : 'New Delhi';
      const cityOnly = currentCity.split(',')[0].trim();
      fetchWeather(cityOnly);
    }
  });
}

// Live Mode button click
if (el.liveModeBtn) {
  el.liveModeBtn.addEventListener('click', () => {
    if (currentMode !== 'live') {
      // Check if live weather is possible (server-side key or client-side key)
      if (hasServerApiKey || userApiKey) {
        currentMode = 'live';
        updateModeUI();
        const currentCity = el.cityName ? el.cityName.textContent : 'New Delhi';
        const cityOnly = currentCity.split(',')[0].trim();
        fetchWeather(cityOnly);
      } else {
        // Prompt user to enter their key and slide open the key bar
        if (el.apiKeyWrapper) el.apiKeyWrapper.classList.add('open');
        if (el.apiKeyInput) el.apiKeyInput.focus();
        alert("Please enter your OpenWeatherMap API Key in the highlighted field to enable Live Weather Data, or configure the server's .env file.");
      }
    }
  });
}

// ==========================================================================
// 14. CACHED DATA FOR THEME SWITCH RE-RENDER
// ==========================================================================
let lastWeatherData = null;
let lastForecastData = null;

// Patch render functions to cache last data
const _origRenderWeather = renderWeatherCard;
renderWeatherCard = function (data) {
  lastWeatherData = data;
  _origRenderWeather(data);
};

const _origRenderForecast = renderForecastGrid;
renderForecastGrid = function (data) {
  lastForecastData = data;
  _origRenderForecast(data);
};

// ==========================================================================
// 15. INIT
// ==========================================================================
async function init() {
  initTheme();
  createBubbles();
  createStars();

  // Pre-fill user saved API key if available
  if (userApiKey && el.apiKeyInput) {
    el.apiKeyInput.value = userApiKey;
  }

  // Fetch API status to check if server-side key exists
  try {
    const configResp = await fetch('/api-status');
    const configData = await configResp.json();
    hasServerApiKey = !!configData.hasServerKey;
  } catch (e) {
    console.error("Could not fetch API configuration status from backend server:", e);
    hasServerApiKey = false;
  }

  // Auto-activate Live mode if a backend key or client key exists, otherwise fall back to Demo mode
  if (hasServerApiKey || userApiKey) {
    currentMode = 'live';
  } else {
    currentMode = 'demo';
  }
  updateModeUI();

  // Run initial weather lookup
  fetchWeather("New Delhi");
}

init();
