const apiKey = "YOUR_API_KEY"; // Replace with your OpenWeatherMap API key

document.getElementById("searchBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) getWeather(city);
});

async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("City not found");
        const data = await response.json();

        const cityName = document.getElementById("cityName");
        const temp = document.getElementById("temperature");
        const desc = document.getElementById("description");
        const icon = document.getElementById("weatherIcon");

        cityName.textContent = `${data.name}, ${data.sys.country}`;
        temp.textContent = `${Math.round(data.main.temp)}°C`;
        desc.textContent = data.weather[0].description
            .replace(/\b\w/g, (ch) => ch.toUpperCase());

        const iconCode = data.weather[0].icon;
        icon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        icon.style.display = "block";
    } catch (error) {
        document.getElementById("cityName").textContent = "City not found 😢";
        document.getElementById("temperature").textContent = "";
        document.getElementById("description").textContent = "";
        document.getElementById("weatherIcon").style.display = "none";
    }
}
