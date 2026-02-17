const API_URL = "http://vm4430.kaj.pouta.csc.fi:8066";
// IP-inofrmation
async function fetchIPInfo() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    document.getElementById('ip-address').textContent = `IP: ${data.ip}`;
    document.getElementById('country').textContent = `Country: ${data.country_name || 'Unavailable'}`;
  } catch (err) {
    document.getElementById('ip-address').textContent = `IP: Error`;
    document.getElementById('country').textContent = `Country: Error`;
    console.error('Failed to load IP info:', err);
  }
}

// Väder
async function getWeatherByCoords(lat, lon) {
  const apiKey = localStorage.getItem("weatherApiKey");
  if (!apiKey) {
    alert("Add your API-key in the settings!");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    showWeather(data);
  } catch {
    document.getElementById("weatherBox").innerHTML = `<p>Error loading weather.</p>`;
  }
}

async function getWeatherByCityName(city) {
  const apiKey = localStorage.getItem("weatherApiKey");
  if (!apiKey) {
    alert("Add your API-key in the settings!");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=en`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.cod === 200) {
      showWeather(data);
    } else {
      document.getElementById("weatherBox").innerHTML = `<p>Error: ${data.message}</p>`;
    }
  } catch {
    document.getElementById("weatherBox").innerHTML = `<p>Error loading weather.</p>`;
  }
}

function showWeather(data) {
  const name = data.name;
  const temp = data.main.temp.toFixed(1);
  const desc = data.weather[0].description;
  const wind = data.wind.speed;
  const dir = data.wind.deg;
  const icon = data.weather[0].icon;
  const windDir = degToCompass(dir);

  document.getElementById("weatherBox").innerHTML = `
    <h2>Weather ${name}</h2>
    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Väderikon">
    <p>${temp}°C, ${windDir} ${wind} m/s</p>
    <p>${desc}</p>
  `;
}

function degToCompass(num) {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N", "NNE","NE",  "ENE", "E","ESE","SE",  "SSE","S","SSW","SW","WSW", "W","WNW","NW","NNW"]; 
  return arr[(val % 16)];
}

function fetchWeatherByCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (city !== "") {
    getWeatherByCityName(city);
  }
}

function fetchLocationAndWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        getWeatherByCoords(lat, lon);
      },
      function(error) {
        document.getElementById("weatherBox").innerHTML = "<p>Could not fetch location.</p>";
        document.getElementById("cityForm").style.display = "block";
      }
    );
  } else {
    document.getElementById("weatherBox").innerHTML = "<p>Geolocation is not supported by your browser.</p>";
    document.getElementById("cityForm").style.display = "block";
  }
}

// Livsråd
async function fetchAdvice() {
  try {
    const res = await fetch('https://api.adviceslip.com/advice');
    const data = await res.json();
    document.getElementById('advice').textContent = data.slip.advice;
  } catch (err) {
    document.getElementById('advice').textContent = 'Error loading advice';
  }
}

// "Skämt"
async function fetchJoke() {
  try {
    const res = await fetch('https://official-joke-api.appspot.com/random_joke');
    const data = await res.json();
    document.getElementById('joke').textContent = `${data.setup} - ${data.punchline}`;
  } catch (err) {
    document.getElementById('joke').textContent = 'Error loading joke';
  }
}

// OpenAi-widget
async function ask2WayChat(questionFromInput = null) {
  const OAIApiKey = localStorage.getItem("OAIApiKey");
  const question = questionFromInput || "What is AI?";
  const chatOutput = document.getElementById("2WayChat");
 
  if (!OAIApiKey) {
    alert("Add your API-key in the settings!");
    return;
  }

  chatOutput.innerHTML = "Thinking...";

  try {
    const res = await fetch(`https://openai-ama-api-fw-teaching.2.rahtiapp.fi/?api_key=${OAIApiKey}&simulation=1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(question),
    });

    const data = await res.json();
    console.log("data:", data);
    chatOutput.innerText = data.answer || "No answer.";

  } catch (err) {
    console.error("API error:", err);
    chatOutput.textContent = "Something went wrong.";
  }
}

function handleAsk() {
  const question = document.getElementById("user-question").value;
  ask2WayChat(question);
}

//Valuta kurser
async function getExchangeRate(from, to, elementId) {
  const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const rate = data.rates[to];
    document.getElementById(elementId).textContent =
      `1 ${from} = ${rate} ${to}`;
  } catch (err) {
    document.getElementById(elementId).textContent = "Error loading rate.";
    console.error(`Error fetching ${from} to ${to}:`, err);
  }
}

function loadAllRates() {
  getExchangeRate("USD", "EUR", "rate-usd-eur");
  getExchangeRate("GBP", "EUR", "rate-gbp-eur");
  getExchangeRate("SEK", "EUR", "rate-sek-eur");
}

//Todo
async function todos() {
  try {
    const resp = await fetch(`${API_URL}/todos`);
    const todos = await resp.json();

    // Get the container element
    const todosElement = document.getElementById("todos");

    // Format and insert todos
    if (Array.isArray(todos) && todos.length > 0) {
      todosElement.innerHTML = todos
        .map(todo => `✅ ${todo.title} (${todo.category_name})`)
        .join("<br>");
    } else {
      todosElement.textContent = "No todolist found.";
    }
  } catch (error) {
    console.error("Failed to load todolist:", error);
    document.getElementById("todos").textContent = "Error loading todolist.";
  }
}
todos();

// Inställnings-popup
document.getElementById("settingsBtn").addEventListener("click", openSettings);

// Inställnings-popup
document.getElementById("settingsBtn").addEventListener("click", openSettings);
function openSettings() {
document.getElementById("weatherKey").value = localStorage.getItem("weatherApiKey") || "";
document.getElementById("OAIKey").value = localStorage.getItem("OAIApiKey") || "";
document.getElementById("settingsPopup").style.display = "block";
}

function closeSettings() {
document.getElementById("settingsPopup").style.display = "none";
}

function saveSettings() {
const weatherKey = document.getElementById("weatherKey").value.trim();
const oaiKey = document.getElementById("OAIKey").value.trim();



if (weatherKey) localStorage.setItem("weatherApiKey", weatherKey);
if (oaiKey) localStorage.setItem("OAIApiKey", oaiKey);

closeSettings();
alert("Settings saved!");
}


window.onclick = function(event) {
const popup = document.getElementById("settingsPopup");
if (event.target == popup) {
  popup.style.display = "none";
}
}


// Initialisering
async function init() {
  await Promise.all([
    fetchIPInfo(),
    fetchLocationAndWeather(),
    fetchAdvice(),
    fetchJoke(),
    loadAllRates()
  ]);
}

document.addEventListener('DOMContentLoaded', init);