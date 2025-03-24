using ASTREE_PFE.Data;
using ASTREE_PFE.Models;
using ASTREE_PFE.Repositories;
using ASTREE_PFE.Repositories.Interfaces;
using ASTREE_PFE.Services;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using CloudinaryDotNet;
using System.Text.Json.Serialization;
using System.Text;
using ASTREE_PFE.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Configure Cloudinary
var cloudinarySettings = builder.Configuration.GetSection("Cloudinary").Get<CloudinarySettings>();
// Register CloudinarySettings for dependency injection
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
var cloudinary = new Cloudinary(new Account(
    cloudinarySettings?.CloudName,
    cloudinarySettings?.ApiKey,
    cloudinarySettings?.ApiSecret
));
builder.Services.AddSingleton(cloudinary);

// Configure MongoDB
var mongoConnectionString = builder.Configuration.GetConnectionString("MongoConnection");
var mongoDatabase = builder.Configuration.GetConnectionString("MongoDatabase");
var mongoClient = new MongoClient(mongoConnectionString);
var database = mongoClient.GetDatabase(mongoDatabase);
builder.Services.AddSingleton<IMongoDatabase>(database);

// Register MongoDB repositories with collection names
builder.Services.AddScoped<IMongoRepository<Comment>>(sp => 
    new MongoRepository<Comment>(sp.GetRequiredService<IMongoDatabase>(), "Comments"));
builder.Services.AddScoped<IMongoRepository<Post>>(sp => 
    new MongoRepository<Post>(sp.GetRequiredService<IMongoDatabase>(), "Posts"));
builder.Services.AddScoped<IMongoRepository<Notification>>(sp => 
    new MongoRepository<Notification>(sp.GetRequiredService<IMongoDatabase>(), "Notifications"));
builder.Services.AddScoped<IMongoRepository<Reaction>>(sp => 
    new MongoRepository<Reaction>(sp.GetRequiredService<IMongoDatabase>(), "Reactions"));
builder.Services.AddScoped<IMongoRepository<Channel>>(sp => 
    new MongoRepository<Channel>(sp.GetRequiredService<IMongoDatabase>(), "Channels"));
builder.Services.AddScoped<IMongoRepository<Message>>(sp => 
    new MongoRepository<Message>(sp.GetRequiredService<IMongoDatabase>(), "Messages"));
builder.Services.AddScoped<IMongoRepository<Conversation>>(sp => 
    new MongoRepository<Conversation>(sp.GetRequiredService<IMongoDatabase>(), "Conversations"));

// Register Repositories
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IReactionRepository, ReactionRepository>();
builder.Services.AddScoped<IChannelRepository, ChannelRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();

// Add DbContext with SQL Server
var sqlConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(sqlConnectionString));

// Add JWT Configuration
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    var jwtSecret = builder.Configuration["JWT:Secret"] ?? 
        throw new InvalidOperationException("JWT:Secret configuration is missing");
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };

    // Disable redirects for API endpoints
    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            // Prevent default behavior (redirect)
            context.HandleResponse();
            
            // Return 401 Unauthorized with JSON response
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new { error = "Unauthorized" });
            return context.Response.WriteAsync(result);
        },
        OnForbidden = context =>
        {
            // Handle forbidden requests (403)
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new { error = "Forbidden" });
            return context.Response.WriteAsync(result);
        }
    };
});

// Add Identity Configuration
builder.Services.AddIdentity<Employee, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure cookie settings for API endpoints
builder.Services.ConfigureApplicationCookie(cookieOptions =>
{
    cookieOptions.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new { error = "Unauthorized" });
        return context.Response.WriteAsync(result);
    };
    cookieOptions.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new { error = "Forbidden" });
        return context.Response.WriteAsync(result);
    };
});

// Register AuthService
builder.Services.AddScoped<IAuthService, AuthService>();

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "ASTREE_PFE API", Version = "v1" });
    
    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Register Services
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IReactionService, ReactionService>();
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IUserOnlineStatusService, UserOnlineStatusService>();
builder.Services.AddScoped<IMessageService, MessageService>();

// Add SignalR
builder.Services.AddSignalR();

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ASTREE_PFE API v1"));
}

app.UseHttpsRedirection();

// Add CORS middleware before authentication and authorization
app.UseCors();

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hubs
app.MapHub<FeedHub>("/hubs/feed");
app.MapHub<MessageHub>("/hubs/message");
//app.MapHub<NotificationHub>("/notificationHub");

app.Run();