const apiKey = '991adcbfd0cd45afb32224051250707';
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const loader = document.getElementById('loader');
const unitToggle = document.getElementById('unitToggle');

const locationEl = document.getElementById('location');
const datetimeEl = document.getElementById('datetime');
const iconEl = document.getElementById('icon');
const tempEl = document.getElementById('temp');
const descriptionEl = document.getElementById('description');
const feelsEl = document.getElementById('feels');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const forecastEl = document.getElementById('forecast');

let currentData = null;

function showLoader(show) {
  loader.style.display = show ? 'block' : 'none';
}

async function fetchWeather(query) {
  showLoader(true);
  const res = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&${query}&days=3&aqi=no&alerts=no`
  );
  showLoader(false);
  if (!res.ok) throw new Error('City not found');
  return res.json();
}

function updateBackground(text) {
  document.body.className = '';
  const t = text.toLowerCase();
  if (t.includes('clear')) document.body.classList.add('clear');
  else if (t.includes('cloud')) document.body.classList.add('clouds');
  else if (t.includes('rain')) document.body.classList.add('rain');
  else if (t.includes('snow')) document.body.classList.add('snow');
  else if (t.includes('thunder')) document.body.classList.add('thunderstorm');
  else if (t.includes('drizzle') || t.includes('mist') || t.includes('fog'))
    document.body.classList.add('drizzle');
}

function formatDate(dt) {
  return dt.toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
}

function render(data) {
  currentData = data;
  const loc = data.location;
  const cur = data.current;

  locationEl.textContent = `${loc.name}, ${loc.region}, ${loc.country}`;
  datetimeEl.textContent = loc.localtime;
  descriptionEl.textContent = cur.condition.text;
  iconEl.src = `https:${cur.condition.icon}`;
  iconEl.alt = cur.condition.text;
  humidityEl.textContent = cur.humidity;
  windEl.textContent = unitToggle.checked
    ? `${cur.wind_mph.toFixed(1)} mph`
    : `${cur.wind_kph.toFixed(1)} kph`;

  updateBackground(cur.condition.text);
  updateTemps();
  renderForecast(data.forecast.forecastday);
  weatherCard.classList.add('show');
}

function updateTemps() {
  if (!currentData) return;
  const cur = currentData.current;
  const isF = unitToggle.checked;
  tempEl.textContent = isF
    ? `${Math.round(cur.temp_f)}°F`
    : `${Math.round(cur.temp_c)}°C`;
  feelsEl.textContent = isF
    ? `${Math.round(cur.feelslike_f)}°F`
    : `${Math.round(cur.feelslike_c)}°C`;
}

function renderForecast(days) {
  forecastEl.innerHTML = '';
  days.forEach(fd => {
    const date = new Date(fd.date);
    const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const icon = fd.day.condition.icon;
    const txt = fd.day.condition.text;
    const maxC = Math.round(fd.day.maxtemp_c);
    const minC = Math.round(fd.day.mintemp_c);
    const maxF = Math.round(fd.day.maxtemp_f);
    const minF = Math.round(fd.day.mintemp_f);
    const isF = unitToggle.checked;
    const temps = isF
      ? `${minF}°/${maxF}°`
      : `${minC}°/${maxC}°`;
    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.innerHTML = `
      <div class="day">${dayName}</div>
      <img src="https:${icon}" alt="${txt}" />
      <div class="temps">${temps}</div>`;
    forecastEl.appendChild(div);
  });
}

searchBtn.addEventListener('click', async () => {
  const city = cityInput.value.trim();
  if (!city) return;
  try {
    const data = await fetchWeather(`q=${encodeURIComponent(city)}`);
    render(data);
  } catch (err) {
    alert(err.message);
  }
});

unitToggle.addEventListener('change', () => {
  if (currentData) render(currentData);
});

setInterval(() => {
  if (weatherCard.classList.contains('show') && currentData) {
    datetimeEl.textContent = new Date().toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }
}, 30000);

window.addEventListener('load', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const data = await fetchWeather(
          q=`${latitude},${longitude}`
        );
        render(data);
      } catch {}
    },
    () => {}
  );
});