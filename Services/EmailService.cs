using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;
using ASTREE_PFE.Services.Interfaces;

namespace ASTREE_PFE.Services
{
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;
        private readonly string _apiKey;
        private readonly string _fromEmail;
        private readonly string _fromName;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
            _apiKey = _configuration["SendGrid:ApiKey"];
            _fromEmail = _configuration["SendGrid:FromEmail"];
            _fromName = _configuration["SendGrid:FromName"];
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetLink)
        {
            string subject = "Reset Your Password";
            string htmlContent = $@"<html>
                <body>
                    <h2>Reset Your Password</h2>
                    <p>You have requested to reset your password. Please click the link below to set a new password:</p>
                    <p><a href=""{resetLink}"" target=""_blank"">Reset Password</a></p>
                    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                    <p>This link will expire in 15 minutes.</p>
                    <p>Thank you,<br>The ASTREE Team</p>
                </body>
            </html>";

            string plainTextContent = $"Reset Your Password\n\nYou have requested to reset your password. Please use the following link to set a new password: {resetLink}\n\nIf you did not request a password reset, please ignore this email or contact support if you have concerns.\n\nThis link will expire in 15 minutes.\n\nThank you,\nThe ASTREE Team";

            await SendEmailAsync(email, subject, htmlContent, plainTextContent);
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent, string plainTextContent = null)
        {
            try
            {
                if (string.IsNullOrEmpty(_apiKey))
                {
                    _logger.LogWarning("SendGrid API Key is not configured. Email would be sent to: {Email}", toEmail);
                    _logger.LogInformation("Subject: {Subject}", subject);
                    _logger.LogInformation("Content: {Content}", htmlContent);
                    return true; // Return true in development to not block the flow
                }

                var client = new SendGridClient(_apiKey);
                var from = new EmailAddress(_fromEmail, _fromName);
                var to = new EmailAddress(toEmail);
                var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent ?? htmlContent, htmlContent);
                var response = await client.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send email to {Email}. Status code: {StatusCode}", toEmail, response.StatusCode);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Email}", toEmail);
                return false;
            }
        }
    }
}