using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Services
{
    public class BirthdayEventBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BirthdayEventBackgroundService> _logger;

        public BirthdayEventBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<BirthdayEventBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Birthday Event Background Service started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    var nextRun = now.Date.AddDays(1);
                    var delay = nextRun - now;

                    _logger.LogInformation("Next birthday event generation at {nextRun}", nextRun);
                    await Task.Delay(delay, stoppingToken);

                    _logger.LogInformation("Generating birthday events...");
                    using var scope = _scopeFactory.CreateScope();
                    var eventService = scope.ServiceProvider.GetRequiredService<IEventService>();
                    await eventService.GenerateBirthdayEventsAsync();
                    _logger.LogInformation("Birthday events generated successfully.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while generating birthday events");
                }
            }
        }
    }
}