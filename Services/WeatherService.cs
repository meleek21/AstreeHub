using System.Text.Json;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Threading.Tasks;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Services
{
    public class WeatherService : IWeatherService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public WeatherService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["OpenWeatherMap:ApiKey"];
        }

        public async Task<object> GetWeatherDataAsync(double lat, double lon)
        {
            var response = await _httpClient.GetAsync($"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={_apiKey}&units=metric&lang=fr");
            response.EnsureSuccessStatusCode();
            return JsonSerializer.Deserialize<object>(await response.Content.ReadAsStringAsync());
        }
    }
}