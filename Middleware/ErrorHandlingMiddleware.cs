using System.Net;
using System.Text.Json;

namespace ASTREE_PFE.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;

        public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "An error occurred while processing your request.";

            switch (exception)
            {
                case MongoDB.Driver.MongoConnectionException mongoEx:
                    message = "Database connection error occurred.";
                    _logger.LogError(mongoEx, "MongoDB connection error: {Message}", mongoEx.Message);
                    break;
                case MongoDB.Driver.MongoCommandException cmdEx:
                    message = "Database operation error occurred.";
                    _logger.LogError(cmdEx, "MongoDB command error: {Message}", cmdEx.Message);
                    break;
                default:
                    _logger.LogError(exception, "Unhandled error: {Message}", exception.Message);
                    break;
            }

            context.Response.StatusCode = (int)statusCode;
            var response = new
            {
                StatusCode = context.Response.StatusCode,
                Message = message,
                DetailedMessage = exception.Message
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}