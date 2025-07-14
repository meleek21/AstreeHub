using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;

namespace ASTREE_PFE.Configurations
{
    public static class EnvLoader
    {
        private static readonly Regex EnvVarPattern = new Regex(
            "#\\{([^}]+)\\}#",
            RegexOptions.Compiled
        );

        public static void Load(string filePath = ".env")
        {
            if (!File.Exists(filePath))
            {
                Console.WriteLine($"Warning: Environment file {filePath} not found.");
                return;
            }

            foreach (var line in File.ReadAllLines(filePath))
            {
                var trimmedLine = line.Trim();

                // Skip comments and empty lines
                if (string.IsNullOrWhiteSpace(trimmedLine) || trimmedLine.StartsWith("#"))
                    continue;

                // Parse key-value pair
                var parts = trimmedLine.Split('=', 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length != 2)
                    continue;

                var key = parts[0].Trim();
                var value = parts[1].Trim();

                // Remove quotes if present
                if (value.StartsWith('"') && value.EndsWith('"'))
                    value = value.Substring(1, value.Length - 2);

                // Set environment variable
                Environment.SetEnvironmentVariable(key, value);
            }
        }

        public static IConfigurationBuilder AddEnvPlaceholders(this IConfigurationBuilder builder)
        {
            // Add a configuration provider that replaces placeholders with environment variables
            builder.Add(new EnvPlaceholderConfigurationSource());
            return builder;
        }

        private class EnvPlaceholderConfigurationSource : IConfigurationSource
        {
            public IConfigurationProvider Build(IConfigurationBuilder builder)
            {
                return new EnvPlaceholderConfigurationProvider(builder);
            }
        }

        private class EnvPlaceholderConfigurationProvider : ConfigurationProvider
        {
            private readonly IConfigurationBuilder _builder;
            private IConfigurationRoot _baseConfiguration;

            public EnvPlaceholderConfigurationProvider(IConfigurationBuilder builder)
            {
                _builder = builder;
            }

            public override void Load()
            {
                // Build the configuration from all other sources
                var tempBuilder = new ConfigurationBuilder();

                // Add all sources except this one
                foreach (
                    var source in _builder.Sources.Where(s =>
                        s.GetType() != typeof(EnvPlaceholderConfigurationSource)
                    )
                )
                {
                    tempBuilder.Add(source);
                }

                _baseConfiguration = tempBuilder.Build();

                // Process all configuration values and replace placeholders
                Data = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

                foreach (var kvp in _baseConfiguration.AsEnumerable())
                {
                    if (kvp.Value != null)
                    {
                        Data[kvp.Key] = ReplaceEnvironmentVariables(kvp.Value);
                    }
                    else
                    {
                        Data[kvp.Key] = null;
                    }
                }
            }

            private string ReplaceEnvironmentVariables(string value)
            {
                if (string.IsNullOrEmpty(value))
                    return value;

                return EnvVarPattern.Replace(
                    value,
                    match =>
                    {
                        var envVarName = match.Groups[1].Value;
                        var envVarValue = Environment.GetEnvironmentVariable(envVarName);

                        if (envVarValue == null)
                        {
                            Console.WriteLine(
                                $"Warning: Environment variable '{envVarName}' not found. Keeping placeholder."
                            );
                            return match.Value; // Keep the placeholder if env var not found
                        }

                        return envVarValue;
                    }
                );
            }
        }
    }
}
