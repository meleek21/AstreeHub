using MongoDB.Driver;

namespace ASTREE_PFE.Data{
    public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDbSettings:ConnectionString"]);
        _database = client.GetDatabase(configuration["MongoDbSettings:DatabaseName"]);
    }

    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }
}
}