using System;
using System.Threading.Tasks;
using ASTREE_PFE.Models;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using Xunit;

namespace ASTREE_PFE.Tests
{
    public class UserOnlineStatusTests
    {
        private readonly IUserOnlineStatusService _userOnlineStatusService;
        private readonly IMongoDatabase _database;

        public UserOnlineStatusTests()
        {
            // Setup MongoDB connection for testing
            var client = new MongoClient("mongodb://localhost:27017");
            _database = client.GetDatabase("AstreePFETest");
            _userOnlineStatusService = new UserOnlineStatusService(_database);
        }

        [Fact]
        public async Task UpdateUserStatus_ShouldSetUserOnlineStatus()
        {
            // Arrange
            var userId = "test-user-1";
            
            // Act
            await _userOnlineStatusService.UpdateUserStatusAsync(userId, true);
            var status = await _userOnlineStatusService.GetUserStatusAsync(userId);

            // Assert
            Assert.NotNull(status);
            Assert.True(status.IsOnline);
            Assert.True((DateTime.UtcNow - status.LastActivityTime).TotalMinutes < 1);
        }

        [Fact]
        public async Task GetAllOnlineUsers_ShouldReturnOnlyOnlineUsers()
        {
            // Arrange
            var onlineUserId = "test-user-online";
            var offlineUserId = "test-user-offline";
            
            await _userOnlineStatusService.UpdateUserStatusAsync(onlineUserId, true);
            await _userOnlineStatusService.UpdateUserStatusAsync(offlineUserId, false);

            // Act
            var onlineUsers = await _userOnlineStatusService.GetAllOnlineUsersAsync();

            // Assert
            Assert.Contains(onlineUsers, u => u.UserId == onlineUserId);
            Assert.DoesNotContain(onlineUsers, u => u.UserId == offlineUserId);
        }

        [Fact]
        public async Task UpdateLastActivity_ShouldUpdateLastActivityTime()
        {
            // Arrange
            var userId = "test-user-activity";
            await _userOnlineStatusService.UpdateUserStatusAsync(userId, true);
            
            // Get initial last activity time
            var initialStatus = await _userOnlineStatusService.GetUserStatusAsync(userId);
            await Task.Delay(1000); // Wait 1 second

            // Act
            await _userOnlineStatusService.UpdateLastActivityAsync(userId);
            var updatedStatus = await _userOnlineStatusService.GetUserStatusAsync(userId);

            // Assert
            Assert.True(updatedStatus.LastActivityTime > initialStatus.LastActivityTime);
        }

        public void Dispose()
        {
            // Cleanup test data after each test
            _database.DropCollection("UserOnlineStatus");
        }
    }
}