using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using MongoDB.Driver;
using Xunit;

namespace ASTREE_PFE.Tests
{
    public class ChannelTests
    {
        private readonly IMongoDatabase _database;
        private readonly ChannelRepository _channelRepository;

        public ChannelTests()
        {
            var client = new MongoClient("REMOVED");
            _database = client.GetDatabase("ASTREE_PFE_MongoDB_Test");
            _channelRepository = new ChannelRepository(_database);
        }

        [Fact]
        public async Task TestGeneralChannelCreationAndRetrieval()
        {
            // Create a test general channel
            var testChannel = new Channel
            {
                Name = "Test General Channel",
                IsGeneral = true,
                CreatedAt = DateTime.UtcNow
            };

            // Save the channel
            await _channelRepository.CreateAsync(testChannel);

            // Retrieve general channels
            var generalChannels = await _channelRepository.GetGeneralChannelsAsync();

            // Assert
            Assert.NotEmpty(generalChannels);
            Assert.Contains(generalChannels, c => c.Name == "Test General Channel" && c.IsGeneral);

            // Cleanup
            await _channelRepository.DeleteAsync(testChannel.Id);
        }
    }
}