using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Driver;

namespace ASTREE_PFE.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            // Register enum string converter convention
            var pack = new ConventionPack
            {
                new EnumRepresentationConvention(MongoDB.Bson.BsonType.String),
            };
            ConventionRegistry.Register("EnumStringConvention", pack, t => true);

            var client = new MongoClient(configuration.GetConnectionString("MongoConnection"));
            _database = client.GetDatabase(configuration.GetConnectionString("MongoDatabase"));
        }

        public IMongoCollection<T> GetCollection<T>(string name)
        {
            return _database.GetCollection<T>(name);
        }
    }
}
