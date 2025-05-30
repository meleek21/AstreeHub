using System.Threading.Tasks;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ASTREE_PFE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeatherController : ControllerBase
    {
        private readonly IWeatherService _weatherService;

        public WeatherController(IWeatherService weatherService)
        {
            _weatherService = weatherService;
        }

        [HttpGet]
        public async Task<IActionResult> GetWeather(double lat, double lon)
        {
            try
            {
                var weatherData = await _weatherService.GetWeatherDataAsync(lat, lon);
                return Ok(weatherData);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}