// API Configuration
const API_KEY = "ecbfeb6a79825fdfe9839b9cf485df9f";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// DOM Elements
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    currentLocationBtn: document.getElementById('currentLocationBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    weatherDisplay: document.getElementById('weatherDisplay'),
    forecastSection: document.getElementById('forecastSection'),
    forecastContainer: document.getElementById('forecastContainer'),
    currentTime: document.getElementById('currentTime'),
    currentDate: document.getElementById('currentDate')
};

// Weather data elements
const weatherElements = {
    cityName: document.getElementById('cityName'),
    temperature: document.getElementById('temperature'),
    description: document.getElementById('description'),
    weatherIcon: document.getElementById('weatherIcon'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    cloudiness: document.getElementById('cloudiness'),
    uvIndex: document.getElementById('uvIndex'),
    windDirection: document.getElementById('windDirection')
};

// Weather icon mapping
const weatherIcons = {
    '01d': 'fas fa-sun',           // clear sky day
    '01n': 'fas fa-moon',          // clear sky night
    '02d': 'fas fa-cloud-sun',     // few clouds day
    '02n': 'fas fa-cloud-moon',    // few clouds night
    '03d': 'fas fa-cloud',         // scattered clouds
    '03n': 'fas fa-cloud',         // scattered clouds
    '04d': 'fas fa-cloud',         // broken clouds
    '04n': 'fas fa-cloud',         // broken clouds
    '09d': 'fas fa-cloud-rain',    // shower rain
    '09n': 'fas fa-cloud-rain',    // shower rain
    '10d': 'fas fa-cloud-sun-rain',// rain day
    '10n': 'fas fa-cloud-moon-rain',// rain night
    '11d': 'fas fa-bolt',          // thunderstorm
    '11n': 'fas fa-bolt',          // thunderstorm
    '13d': 'fas fa-snowflake',     // snow
    '13n': 'fas fa-snowflake',     // snow
    '50d': 'fas fa-smog',          // mist
    '50n': 'fas fa-smog'           // mist
};

// Initialize app
class WeatherApp {
    constructor() {
        this.currentUnit = 'metric';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.loadLastCity();

        // Update time every minute
        setInterval(() => this.updateDateTime(), 60000);
    }

    setupEventListeners() {
        elements.searchBtn.addEventListener('click', () => this.handleSearch());
        elements.currentLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
    }

    updateDateTime() {
        const now = new Date();
        elements.currentTime.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        elements.currentDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async handleSearch() {
        const city = elements.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }

        await this.getWeatherData(city);
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await this.getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                this.setLoading(false);
                this.showError('Unable to retrieve your location');
                console.error('Geolocation error:', error);
            }
        );
    }

    async getWeatherData(city) {
        this.setLoading(true);
        this.hideError();

        try {
            const [currentWeather, forecast] = await Promise.all([
                this.fetchCurrentWeather(city),
                this.fetchForecast(city)
            ]);

            this.displayWeatherData(currentWeather);
            this.displayForecastData(forecast);
            this.saveLastCity(city);

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async getWeatherByCoords(lat, lon) {
        this.setLoading(true);
        this.hideError();

        try {
            const [currentWeather, forecast] = await Promise.all([
                this.fetchWeatherByCoords(lat, lon),
                this.fetchForecastByCoords(lat, lon)
            ]);

            this.displayWeatherData(currentWeather);
            this.displayForecastData(forecast);
            elements.cityInput.value = currentWeather.name;
            this.saveLastCity(currentWeather.name);

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async fetchCurrentWeather(city) {
        const response = await fetch(
            `${BASE_URL}/weather?q=${city}&units=${this.currentUnit}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('City not found. Please check the spelling.');
        }

        return await response.json();
    }

    async fetchForecast(city) {
        const response = await fetch(
            `${BASE_URL}/forecast?q=${city}&units=${this.currentUnit}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Unable to fetch forecast data');
        }

        return await response.json();
    }

    async fetchWeatherByCoords(lat, lon) {
        const response = await fetch(
            `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${this.currentUnit}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Unable to fetch weather data for your location');
        }

        return await response.json();
    }

    async fetchForecastByCoords(lat, lon) {
        const response = await fetch(
            `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${this.currentUnit}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Unable to fetch forecast data for your location');
        }

        return await response.json();
    }

    displayWeatherData(data) {
        // Update main weather information
        weatherElements.cityName.textContent = `${data.name}, ${data.sys.country}`;
        weatherElements.temperature.textContent = `${Math.round(data.main.temp)}°C`;
        weatherElements.description.textContent = data.weather[0].description;

        // Update weather icon
        const iconClass = weatherIcons[data.weather[0].icon] || 'fas fa-cloud';
        weatherElements.weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;

        // Update weather stats
        weatherElements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        weatherElements.humidity.textContent = `${data.main.humidity}%`;
        weatherElements.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        weatherElements.pressure.textContent = `${data.main.pressure} hPa`;
        weatherElements.visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        weatherElements.cloudiness.textContent = `${data.clouds.all}%`;
        weatherElements.windDirection.textContent = `${data.wind.deg || 0}°`;

        // Show weather display with animation
        elements.weatherDisplay.style.display = 'block';
        elements.weatherDisplay.classList.add('fade-in');

        // Remove animation class after it completes
        setTimeout(() => {
            elements.weatherDisplay.classList.remove('fade-in');
        }, 500);
    }

    displayForecastData(data) {
        elements.forecastContainer.innerHTML = '';

        // Get daily forecasts (one per day at 12:00)
        const dailyForecasts = data.list.filter(item =>
            item.dt_txt.includes('12:00:00')
        ).slice(0, 5);

        dailyForecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const iconClass = weatherIcons[forecast.weather[0].icon] || 'fas fa-cloud';

            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item fade-in';
            forecastItem.innerHTML = `
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-date">${dateStr}</div>
                <div class="forecast-icon"><i class="${iconClass}"></i></div>
                <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
                <div class="forecast-desc">${forecast.weather[0].description}</div>
            `;

            elements.forecastContainer.appendChild(forecastItem);
        });

        // Show forecast section
        elements.forecastSection.style.display = 'block';
    }

    setLoading(isLoading) {
        if (isLoading) {
            elements.loadingSpinner.style.display = 'block';
            elements.weatherDisplay.style.display = 'none';
            elements.forecastSection.style.display = 'none';
        } else {
            elements.loadingSpinner.style.display = 'none';
        }
    }

    showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'flex';
        elements.weatherDisplay.style.display = 'none';
        elements.forecastSection.style.display = 'none';
    }

    hideError() {
        elements.errorMessage.style.display = 'none';
    }

    saveLastCity(city) {
        localStorage.setItem('lastCity', city);
    }

    loadLastCity() {
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            elements.cityInput.value = lastCity;
            this.getWeatherData(lastCity);
        } else {
            // Default city
            this.getWeatherData('London');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Utility function for wind direction
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}
