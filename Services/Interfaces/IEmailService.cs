namespace ASTREE_PFE.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetLink);
        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent, string plainTextContent = null);
    }
}