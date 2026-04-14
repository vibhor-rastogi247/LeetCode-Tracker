# Error Handling and Crash Management in .NET Core

## Comprehensive Error Handling Strategy

Effective error handling prevents application crashes, provides meaningful diagnostics, and improves user experience. This document covers enterprise-level error handling patterns.

### Exception Hierarchy and Custom Exceptions

#### Understanding Built-in Exceptions

```csharp
// Framework exceptions - understand the type
try
{
    var result = int.Parse("invalid");
}
catch (FormatException ex) // Specific exception type
{
    // Handle specific error condition
    Log.Error($"Invalid format: {ex.Message}");
}
catch (OverflowException ex)
{
    // Handle different error condition
    Log.Error($"Number too large: {ex.Message}");
}
catch (Exception ex) // Generic fallback
{
    // Last resort - should be rare
    Log.Fatal($"Unexpected error: {ex}");
}
```

#### Creating Custom Exception Hierarchy

```csharp
public abstract class ApplicationException : Exception
{
    public string ErrorCode { get; protected set; }
    public DateTime OccurredAt { get; protected set; }
    public string UserId { get; protected set; }
    
    protected ApplicationException(string message, string errorCode)
        : base(message)
    {
        ErrorCode = errorCode;
        OccurredAt = DateTime.UtcNow;
    }
    
    protected ApplicationException(
        string message,
        string errorCode,
        Exception innerException)
        : base(message, innerException)
    {
        ErrorCode = errorCode;
        OccurredAt = DateTime.UtcNow;
    }
}

// Domain-specific exceptions
public class ValidationException : ApplicationException
{
    public Dictionary<string, string[]> Errors { get; set; }
    
    public ValidationException(
        string message,
        Dictionary<string, string[]> errors)
        : base(message, "VALIDATION_ERROR")
    {
        Errors = errors;
    }
}

public class ResourceNotFoundException : ApplicationException
{
    public string ResourceId { get; set; }
    public string ResourceType { get; set; }
    
    public ResourceNotFoundException(
        string resourceType,
        string resourceId)
        : base(
            $"Resource '{resourceType}' with ID '{resourceId}' not found",
            "RESOURCE_NOT_FOUND")
    {
        ResourceType = resourceType;
        ResourceId = resourceId;
    }
}

public class ConflictException : ApplicationException
{
    public ConflictException(string message)
        : base(message, "CONFLICT_ERROR") { }
}

public class UnauthorizedException : ApplicationException
{
    public UnauthorizedException(string message = "Unauthorized access")
        : base(message, "UNAUTHORIZED") { }
}
```

### Global Exception Handling Middleware

#### Middleware Implementation

```csharp
public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;
    
    public GlobalExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlingMiddleware> logger)
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
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }
    
    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ApiResponse();
        
        switch (exception)
        {
            case ValidationException ve:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response.Success = false;
                response.Message = ve.Message;
                response.ErrorCode = ve.ErrorCode;
                response.Data = ve.Errors;
                break;
                
            case ResourceNotFoundException nfe:
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                response.Success = false;
                response.Message = nfe.Message;
                response.ErrorCode = nfe.ErrorCode;
                break;
                
            case ConflictException ce:
                context.Response.StatusCode = StatusCodes.Status409Conflict;
                response.Success = false;
                response.Message = ce.Message;
                response.ErrorCode = ce.ErrorCode;
                break;
                
            case UnauthorizedException ue:
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                response.Success = false;
                response.Message = ue.Message;
                response.ErrorCode = ue.ErrorCode;
                break;
                
            default:
                context.Response.StatusCode = 
                    StatusCodes.Status500InternalServerError;
                response.Success = false;
                response.Message = "An unexpected error occurred";
                response.ErrorCode = "INTERNAL_SERVER_ERROR";
                break;
        }
        
        return context.Response.WriteAsJsonAsync(response);
    }
}

// Response model
public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public string ErrorCode { get; set; }
    public object Data { get; set; }
}

// Register in Program.cs
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
```

### Logging and Crash Management

#### Structured Logging Configuration

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }
    
    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureLogging((context, logging) =>
            {
                // Clear default providers
                logging.ClearProviders();
                
                // Add Serilog - structured logging
                logging.AddSerilog(new LoggerConfiguration()
                    .MinimumLevel.Debug()
                    .Enrich.FromLogContext()
                    .Enrich.WithProperty("Application", "MyApp")
                    .Enrich.WithMachineName()
                    .Enrich.WithThreadId()
                    .WriteTo.Console()
                    .WriteTo.File(
                        "logs/app-.txt",
                        rollingInterval: RollingInterval.Day,
                        fileSizeLimitBytes: 1_000_000,
                        retainedFileCountLimit: 30)
                    .WriteTo.Seq("http://localhost:5341") // Log aggregation
                    .CreateLogger());
                    
                // Add Application Insights for cloud monitoring
                logging.AddApplicationInsights(
                    "your-instrumentation-key",
                    options => options.TrackExceptions = true);
            })
            .ConfigureServices((context, services) =>
            {
                services.AddControllers();
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}
```

#### Logging Best Practices

```csharp
public class UserService
{
    private readonly ILogger<UserService> _logger;
    private readonly IUserRepository _repository;
    
    public UserService(
        ILogger<UserService> logger,
        IUserRepository repository)
    {
        _logger = logger;
        _repository = repository;
    }
    
    public async Task<User> GetUserAsync(string userId)
    {
        try
        {
            _logger.LogInformation(
                "Attempting to retrieve user {UserId}",
                userId);
            
            var user = await _repository.GetAsync(userId);
            
            if (user == null)
            {
                _logger.LogWarning(
                    "User {UserId} not found",
                    userId);
                
                throw new ResourceNotFoundException(nameof(User), userId);
            }
            
            _logger.LogInformation(
                "Successfully retrieved user {UserId}",
                userId);
            
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error retrieving user {UserId}. Message: {ErrorMessage}",
                userId,
                ex.Message);
            
            throw;
        }
    }
}
```

### Health Checks for Crash Prevention

#### Health Check Implementation

```csharp
// Custom health check
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly IDbConnection _dbConnection;
    
    public DatabaseHealthCheck(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }
    
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbConnection.OpenAsync();
            
            using (var command = _dbConnection.CreateCommand())
            {
                command.CommandText = "SELECT 1";
                await command.ExecuteScalarAsync(cancellationToken);
            }
            
            return HealthCheckResult.Healthy("Database connection successful");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "Database connection failed",
                exception: ex);
        }
        finally
        {
            _dbConnection.Close();
        }
    }
}

// Register health checks
public void ConfigureServices(IServiceCollection services)
{
    services.AddHealthChecks()
        .AddCheck<DatabaseHealthCheck>("database")
        .AddUrlGroup(
            new Uri("https://api.example.com"),
            name: "external-api",
            timeout: TimeSpan.FromSeconds(5))
        .AddMemoryHealthCheck("memory");
}

// Expose health check endpoint
public void Configure(IApplicationBuilder app)
{
    app.UseRouting();
    
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapHealthChecks("/health");
        
        // Detailed health check response
        endpoints.MapHealthChecks("/health/detailed",
            new HealthCheckOptions
            {
                ResponseWriter = WriteResponse
            });
    });
}

private static Task WriteResponse(
    HttpContext context,
    HealthReport report)
{
    context.Response.ContentType = "application/json";
    
    var response = new
    {
        status = report.Status.ToString(),
        checks = report.Entries.Select(entry => new
        {
            name = entry.Key,
            status = entry.Value.Status.ToString(),
            description = entry.Value.Description,
            duration = entry.Value.Duration
        })
    };
    
    return context.Response.WriteAsJsonAsync(response);
}
```

### Resilience and Circuit Breaker Patterns

#### Using Polly for Resilience

```csharp
public class ResilientHttpClientFactory
{
    public static HttpClient CreateClient(IAsyncPolicy<HttpResponseMessage> policy)
    {
        var handler = new PolicyHttpMessageHandler(policy)
        {
            InnerHandler = new HttpClientHandler()
        };
        
        return new HttpClient(handler);
    }
}

// Policy configuration
public class PoliciesConfiguration
{
    public static IAsyncPolicy<HttpResponseMessage> GetHttpPolicy()
    {
        // Retry policy - Exponential backoff
        var retryPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    Console.WriteLine(
                        $"Retry {retryCount} after {timespan.TotalSeconds}s");
                });
        
        // Circuit breaker - Fail fast after threshold
        var circuitBreakerPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, timespan) =>
                {
                    Console.WriteLine($"Circuit breaker opened for {timespan.TotalSeconds}s");
                });
        
        // Timeout policy
        var timeoutPolicy = Policy.TimeoutAsync<HttpResponseMessage>(
            TimeSpan.FromSeconds(10));
        
        // Combine policies
        return Policy.WrapAsync(retryPolicy, circuitBreakerPolicy, timeoutPolicy);
    }
}

// Usage
public class ExternalApiService
{
    private readonly HttpClient _httpClient;
    
    public ExternalApiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
    
    public async Task<ApiResponse> GetDataAsync(string endpoint)
    {
        try
        {
            var response = await _httpClient.GetAsync(endpoint);
            response.EnsureSuccessStatusCode();
            
            return await response.Content.ReadAsAsync<ApiResponse>();
        }
        catch (HttpRequestException ex)
        {
            // Handle timeout, connection errors
            throw new ServiceUnavailableException("External API unavailable", ex);
        }
    }
}
```

### Crash Dump and Diagnostics

#### Crash Reporting

```csharp
public static class CrashReportingExtensions
{
    public static IHostBuilder ConfigureCrashReporting(
        this IHostBuilder builder,
        string dumpPath = "crashdumps")
    {
        return builder.ConfigureServices((context, services) =>
        {
            // Enable crash dumps in production
            AppDomain.CurrentDomain.FirstChanceException += (sender, eventArgs) =>
            {
                if (eventArgs.Exception is OutOfMemoryException or 
                    StackOverflowException)
                {
                    GenerateCrashDump(dumpPath, eventArgs.Exception);
                }
            };
        });
    }
    
    private static void GenerateCrashDump(
        string dumpPath,
        Exception exception)
    {
        try
        {
            Directory.CreateDirectory(dumpPath);
            
            var fileName = Path.Combine(
                dumpPath,
                $"crash_{DateTime.UtcNow:yyyyMMdd_HHmmss}.txt");
            
            var report = new StringBuilder();
            report.AppendLine($"Crash Report - {DateTime.UtcNow:O}");
            report.AppendLine($"Exception Type: {exception.GetType().FullName}");
            report.AppendLine($"Message: {exception.Message}");
            report.AppendLine($"Stack Trace: {exception.StackTrace}");
            
            File.WriteAllText(fileName, report.ToString());
            
            // Optional: Send to crash reporting service
            // SendToCrashReporter(report.ToString());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to generate crash dump: {ex.Message}");
        }
    }
}
```

### Transaction and Rollback Handling

```csharp
public class TransactionManagementExample
{
    private readonly IDbContextFactory<AppDbContext> _contextFactory;
    
    public async Task ProcessOrderAsync(Order order)
    {
        await using (var context = await _contextFactory.CreateDbContextAsync())
        {
            using (var transaction = await context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Create order
                    context.Orders.Add(order);
                    await context.SaveChangesAsync();
                    
                    // Deduct inventory
                    foreach (var item in order.Items)
                    {
                        var product = await context.Products
                            .FirstOrDefaultAsync(p => p.Id == item.ProductId);
                        
                        if (product.Stock < item.Quantity)
                        {
                            throw new InsufficientStockException(
                                product.Name, item.Quantity);
                        }
                        
                        product.Stock -= item.Quantity;
                    }
                    
                    await context.SaveChangesAsync();
                    
                    // Commit transaction
                    await transaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    // Rollback on any error
                    await transaction.RollbackAsync();
                    
                    throw new OrderProcessingException(
                        "Failed to process order",
                        ex);
                }
            }
        }
    }
}
```

## Error Handling Best Practices Summary

1. **Custom Exceptions**: Create domain-specific exceptions
2. **Global Middleware**: Handle unhandled exceptions at application level
3. **Structured Logging**: Use tools like Serilog for detailed diagnostics
4. **Health Checks**: Monitor application and dependencies
5. **Resilience Patterns**: Implement retry, circuit breaker, timeout
6. **Transaction Management**: Use explicit transactions for data operations
7. **Crash Reporting**: Implement crash dump generation for critical failures
8. **Log Aggregation**: Use services like Seq or Application Insights
9. **Environment-specific Handling**: Different strategies for dev/prod
10. **Never Swallow Exceptions**: Log before throwing, understand the cause
