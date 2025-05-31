using System;
using System.Threading.Tasks;
using ASTREE_PFE.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

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
            string subject = "Réinitialisez votre mot de passe";
            string htmlContent =
                $@"<html>
                <body>
                    <h2>Réinitialisez votre mot de passe</h2>
                    <p>Vous avez demandé à réinitialiser votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                    <p><a href=""{resetLink}"" target=""_blank"">Réinitialiser le mot de passe</a></p>
                    <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet e-mail ou contacter le support si vous avez des préoccupations.</p>
                    <p>Ce lien expirera dans 15 minutes.</p>
                    <p>Merci,<br>L'équipe ASTREE</p>
                </body>
            </html>";

            string plainTextContent =
                $"Réinitialisez votre mot de passe\n\nVous avez demandé à réinitialiser votre mot de passe. Veuillez utiliser le lien suivant pour définir un nouveau mot de passe : {resetLink}\n\nSi vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet e-mail ou contacter le support si vous avez des préoccupations.\n\nCe lien expirera dans 15 minutes.\n\nMerci,\nL'équipe ASTREE";

            await SendEmailAsync(email, subject, htmlContent, plainTextContent);
        }

        public async Task<bool> SendEmailAsync(
            string toEmail,
            string subject,
            string htmlContent,
            string plainTextContent = null
        )
        {
            try
            {
                if (string.IsNullOrEmpty(_apiKey))
                {
                    _logger.LogWarning(
                        "SendGrid API Key is not configured. Email would be sent to: {Email}",
                        toEmail
                    );
                    _logger.LogInformation("Subject: {Subject}", subject);
                    _logger.LogInformation("Content: {Content}", htmlContent);
                    return true; // Return true in development to not block the flow
                }

                var client = new SendGridClient(_apiKey);
                var from = new EmailAddress(_fromEmail, _fromName);
                var to = new EmailAddress(toEmail);
                var msg = MailHelper.CreateSingleEmail(
                    from,
                    to,
                    subject,
                    plainTextContent ?? htmlContent,
                    htmlContent
                );
                var response = await client.SendEmailAsync(msg);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                    return true;
                }
                else
                {
                    _logger.LogError(
                        "Failed to send email to {Email}. Status code: {StatusCode}",
                        toEmail,
                        response.StatusCode
                    );
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
