# DotNet Builders and Container Builders

## Understanding the Builder Pattern in .NET Core

The builder pattern is a creational design pattern that separates the construction of a complex object from its representation. In .NET Core, builders are fundamental to configuring applications.

### Types of DotNet Builders

#### 1. **WebApplicationBuilder** (Modern .NET 6+)

The `WebApplicationBuilder` is the modern approach for building web applications in .NET 6+.

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddSingleton<ILogger, Logger>();

// Add middleware
var app = builder.Build();

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
```

**Key Features:**
- Unified configuration model
- Simplified dependency injection setup
- Implicit service provider creation
- Built-in hosting configuration

#### 2. **WebHostBuilder** (Legacy .NET Core 2.x - 3.x)

```csharp
public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
    WebHost.CreateDefaultBuilder(args)
        .UseStartup<Startup>();
```

**Characteristics:**
- Two-step initialization (CreateDefaultBuilder + UseStartup)
- Separate Startup class
- More verbose configuration
- Still supported for backward compatibility

#### 3. **HostBuilder** (Generic Host Builder)

For non-HTTP applications (console apps, workers):

```csharp
var host = new HostBuilder()
    .ConfigureServices((context, services) =>
    {
        services.AddSingleton<IGreeter, ConsoleGreeter>();
    })
    .ConfigureLogging(logging =>
    {
        logging.AddConsole();
    })
    .UseConsoleLifetime()
    .Build();

await host.RunAsync();
```

### Container Builders in .NET Core

A **Container Builder** (IoC Container) manages dependency injection and object lifecycle management. The default container in .NET Core is `IServiceCollection`.

#### Understanding the Service Container

```csharp
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        // Container builder pattern - Building the service container
        
        // Service registration happens here
        services.AddScoped<IUserService, UserService>();
        services.AddTransient<IEmailService, EmailService>();
        services.AddSingleton<ICacheService, CacheService>();
    }
}
```

#### Container Lifecycle Management

```csharp
public class DIContainerExample
{
    public static void Main()
    {
        var services = new ServiceCollection();
        
        // Transient - New instance every time
        services.AddTransient<IMessageWriter, ConsoleMessageWriter>();
        
        // Scoped - New instance per request/scope
        services.AddScoped<IRepository, Repository>();
        
        // Singleton - Single instance for application lifetime
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        
        // Build the service provider (container)
        IServiceProvider provider = services.BuildServiceProvider();
        
        // Resolve services
        var writer = provider.GetRequiredService<IMessageWriter>();
        writer.WriteMessage("Hello from DI Container!");
    }
}
```

### Factory Pattern with Container Builders

Sometimes you need custom object creation logic:

```csharp
services.AddScoped(provider => 
{
    var config = provider.GetRequiredService<IConfiguration>();
    var connectionString = config.GetConnectionString("DefaultConnection");
    return new DatabaseConnection(connectionString);
});

// Or using service factory pattern
services.AddScoped<IProductService>(provider =>
{
    var repository = provider.GetRequiredService<IProductRepository>();
    var logger = provider.GetRequiredService<ILogger<ProductService>>();
    return new ProductService(repository, logger);
});
```

### Advanced Container Builder Patterns

#### Named/Keyed Services (. NET 8.0+)

```csharp
var services = new ServiceCollection();

// Register multiple implementations with keys
services.AddKeyedScoped<IDataService, SqlDataService>("sql");
services.AddKeyedScoped<IDataService, NoSqlDataService>("nosql");

// Resolution
var provider = services.BuildServiceProvider();
var sqlService = provider.GetRequiredKeyedService<IDataService>("sql");
var nosqlService = provider.GetRequiredKeyedService<IDataService>("nosql");
```

#### Decorators Pattern

```csharp
public interface IDataService
{
    Task<Data> GetDataAsync(int id);
}

public class BaseDataService : IDataService
{
    public async Task<Data> GetDataAsync(int id)
    {
        return await Database.GetAsync(id);
    }
}

public class CachedDataService : IDataService
{
    private readonly IDataService _inner;
    private readonly IMemoryCache _cache;
    
    public CachedDataService(IDataService inner, IMemoryCache cache)
    {
        _inner = inner;
        _cache = cache;
    }
    
    public async Task<Data> GetDataAsync(int id)
    {
        var cacheKey = $"data_{id}";
        if (_cache.TryGetValue(cacheKey, out Data data))
            return data;
            
        data = await _inner.GetDataAsync(id);
        _cache.Set(cacheKey, data, TimeSpan.FromMinutes(5));
        return data;
    }
}

// Registration
services.AddScoped<IDataService, BaseDataService>();
services.Decorate<IDataService, CachedDataService>();
```

### Container Builder Best Practices

#### 1. **Organization by Feature/Module**

```csharp
public static class ServicesExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddUserServices();
        services.AddProductServices();
        services.AddPaymentServices();
        return services;
    }
    
    private static IServiceCollection AddUserServices(
        this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();
        return services;
    }
}

// In Program.cs
builder.Services.AddApplicationServices(builder.Configuration);
```

#### 2. **Environment-Specific Configuration**

```csharp
public static IServiceCollection AddDataServices(
    this IServiceCollection services,
    IConfiguration configuration,
    IWebHostEnvironment environment)
{
    if (environment.IsDevelopment())
    {
        services.AddScoped<IDataService, MockDataService>();
    }
    else
    {
        services.AddScoped<IDataService, RealDataService>();
    }
    
    return services;
}
```

#### 3. **Validation at Build Time**

```csharp
var provider = services.BuildServiceProvider(
    validateScopes: true // Validates DI scopes
);

// Try/Catch to handle missing dependencies
try
{
    var service = provider.GetRequiredService<IMyService>();
}
catch (InvalidOperationException ex)
{
    // Service not registered
    Console.WriteLine($"Service registration error: {ex.Message}");
}
```

### Service Lifetime Implications for Container

```csharp
public class ServiceLifetimeDemo
{
    public interface IService { Guid Id { get; } }
    
    public class Service : IService 
    { 
        public Guid Id { get; } = Guid.NewGuid();
    }
    
    public static void Main()
    {
        var services = new ServiceCollection();
        services.AddTransient<IService, Service>();
        
        var provider = services.BuildServiceProvider();
        
        var service1 = provider.GetRequiredService<IService>();
        var service2 = provider.GetRequiredService<IService>();
        
        Console.WriteLine(service1.Id == service2.Id); // False - Different instances
        
        // Scoped example
        using (var scope = provider.CreateScope())
        {
            var scopedService1 = scope.ServiceProvider.GetRequiredService<IService>();
            var scopedService2 = scope.ServiceProvider.GetRequiredService<IService>();
            Console.WriteLine(scopedService1.Id == scopedService2.Id); // True - Same instance
        }
    }
}
```

## Summary

- **WebApplicationBuilder**: Modern, simplified configuration (recommended for new projects)
- **WebHostBuilder**: Legacy but still supported
- **HostBuilder**: For non-HTTP applications
- **Container Management**: Use extension methods for organization
- **Service Lifetime**: Understand Transient, Scoped, and Singleton implications
- **Factory Pattern**: Use factories for complex object creation
- **Validation**: Always validate your DI configuration, especially in production

## Best Practices for Enterprise Applications

### 1. **Service Registration Organization**

```csharp
// ✅ Good: Organized by feature with extension methods
public static class UserServicesExtensions
{
    public static IServiceCollection AddUserServices(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();
        services.AddTransient<IEmailSender, EmailSender>();
        return services;
    }
}

// ❌ Bad: All registrations in one place
services.AddScoped<IUserRepository, UserRepository>();
services.AddScoped<IUserService, UserService>();
services.AddTransient<IEmailSender, EmailSender>();
// ... 50 more registrations
```

### 2. **Lifetime Selection Guidelines**

```csharp
// ✅ Correct lifetime usage
public void ConfigureServices(IServiceCollection services)
{
    // Singleton: Stateless, thread-safe services
    services.AddSingleton<ICacheService, RedisCacheService>();
    services.AddSingleton<IConfiguration>(Configuration);
    
    // Scoped: Per-request services (default for web apps)
    services.AddScoped<IUnitOfWork, UnitOfWork>();
    services.AddScoped<IUserRepository, UserRepository>();
    
    // Transient: Lightweight, stateless services
    services.AddTransient<IEmailSender, EmailSender>();
    services.AddTransient<IPasswordHasher, PasswordHasher>();
}
```

### 3. **Avoid Service Locator Anti-Pattern**

```csharp
// ❌ Bad: Service Locator
public class OrderService
{
    private readonly IServiceProvider _serviceProvider;
    
    public OrderService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    
    public async Task ProcessOrderAsync(Order order)
    {
        var repository = _serviceProvider.GetService<IOrderRepository>();
        // ...
    }
}

// ✅ Good: Constructor Injection
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IPaymentService _paymentService;
    
    public OrderService(IOrderRepository repository, IPaymentService paymentService)
    {
        _repository = repository;
        _paymentService = paymentService;
    }
}
```

### 4. **Factory Pattern for Complex Dependencies**

```csharp
// ✅ Good: Use factories for complex object creation
services.AddScoped<IOrderProcessor>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<OrderProcessor>>();
    var paymentService = provider.GetRequiredService<IPaymentService>();
    
    var processor = new OrderProcessor(logger, paymentService);
    processor.MaxRetries = config.GetValue<int>("OrderProcessing:MaxRetries");
    processor.Timeout = config.GetValue<TimeSpan>("OrderProcessing:Timeout");
    
    return processor;
});
```

### 5. **Validation and Error Handling**

```csharp
// ✅ Good: Validate DI configuration
public static void Main(string[] args)
{
    var builder = WebApplication.CreateBuilder(args);
    
    // Register services
    builder.Services.AddApplicationServices();
    
    // Validate configuration
    var app = builder.Build();
    
    // Validate service registrations
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        
        // This will throw if services are not registered
        var userService = services.GetRequiredService<IUserService>();
        var orderService = services.GetRequiredService<IOrderService>();
    }
    
    app.Run();
}
```

### 6. **Environment-Specific Registrations**

```csharp
// ✅ Good: Different implementations per environment
public static IServiceCollection AddDataAccessServices(
    this IServiceCollection services, 
    IConfiguration configuration, 
    IHostEnvironment environment)
{
    if (environment.IsDevelopment())
    {
        // Use in-memory database for development
        services.AddScoped<ICustomerRepository, InMemoryCustomerRepository>();
    }
    else if (environment.IsStaging())
    {
        // Use test database for staging
        services.AddScoped<ICustomerRepository, SqlCustomerRepository>();
        services.AddScoped<IDatabaseConnection>(provider =>
            new DatabaseConnection(configuration.GetConnectionString("TestDb")));
    }
    else
    {
        // Use production database
        services.AddScoped<ICustomerRepository, SqlCustomerRepository>();
        services.AddScoped<IDatabaseConnection>(provider =>
            new DatabaseConnection(configuration.GetConnectionString("ProdDb")));
    }
    
    return services;
}
```

### 7. **Avoid Captive Dependencies**

```csharp
// ❌ Bad: Singleton depending on Scoped service
services.AddSingleton<ICacheService, CacheService>(); // Singleton
services.AddScoped<IUserRepository, UserRepository>(); // Scoped

public class CacheService : ICacheService
{
    public CacheService(IUserRepository repository) // ❌ Wrong!
    {
        // This scoped service will be captured by singleton
    }
}

// ✅ Good: Both same lifetime or use factory
services.AddScoped<ICacheService, CacheService>();
services.AddScoped<IUserRepository, UserRepository>();

// Or use factory for different lifetimes
services.AddSingleton<ICacheService>(provider => 
    new CacheService(provider.GetRequiredService<IUserRepository>()));
```

### 8. **Named Options Pattern**

```csharp
// ✅ Good: Use named options for multiple configurations
services.Configure<EmailSettings>("Smtp", Configuration.GetSection("Email:Smtp"));
services.Configure<EmailSettings>("SendGrid", Configuration.GetSection("Email:SendGrid"));

services.AddTransient<IEmailSender>(provider =>
{
    var smtpOptions = provider.GetRequiredService<IOptionsMonitor<EmailSettings>>()
        .Get("Smtp");
    var sendGridOptions = provider.GetRequiredService<IOptionsMonitor<EmailSettings>>()
        .Get("SendGrid");
    
    // Choose implementation based on configuration
    return Configuration.GetValue<bool>("UseSendGrid") 
        ? new SendGridEmailSender(sendGridOptions) 
        : new SmtpEmailSender(smtpOptions);
});
```

### 9. **Health Checks for Dependencies**

```csharp
// ✅ Good: Add health checks for your services
services.AddHealthChecks()
    .AddCheck<DatabaseHealthCheck>("database")
    .AddCheck<ExternalApiHealthCheck>("external-api")
    .AddCheck<CacheHealthCheck>("cache");

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly IDatabaseConnection _connection;
    
    public DatabaseHealthCheck(IDatabaseConnection connection)
    {
        _connection = connection;
    }
    
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, 
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _connection.TestConnectionAsync();
            return HealthCheckResult.Healthy("Database is healthy");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database is unhealthy", ex);
        }
    }
}
```

### 10. **Logging and Monitoring**

```csharp
// ✅ Good: Add logging to service registrations
public static IServiceCollection AddLoggingServices(this IServiceCollection services)
{
    services.AddScoped(typeof(ILogger<>), typeof(Logger<>));
    
    // Decorate services with logging
    services.Decorate<IUserService>((inner, provider) => 
        new LoggingUserService(inner, provider.GetRequiredService<ILogger<UserService>>()));
    
    return services;
}

public class LoggingUserService : IUserService
{
    private readonly IUserService _inner;
    private readonly ILogger<UserService> _logger;
    
    public LoggingUserService(IUserService inner, ILogger<UserService> logger)
    {
        _inner = inner;
        _logger = logger;
    }
    
    public async Task<User> GetUserByIdAsync(int id)
    {
        _logger.LogInformation("Getting user with ID {UserId}", id);
        
        try
        {
            var user = await _inner.GetUserByIdAsync(id);
            _logger.LogInformation("Successfully retrieved user {UserId}", id);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user with ID {UserId}", id);
            throw;
        }
    }
}
```

### 11. **Testing Considerations**

```csharp
// ✅ Good: Design for testability
public class UserServiceTests
{
    [Fact]
    public async Task CreateUserAsync_ValidUser_CreatesUser()
    {
        // Arrange
        var mockRepository = new Mock<IUserRepository>();
        var mockLogger = new Mock<ILogger<UserService>>();
        var mockEmailSender = new Mock<IEmailSender>();
        
        var service = new UserService(
            mockRepository.Object, 
            mockLogger.Object, 
            mockEmailSender.Object);
        
        var user = new User { Name = "Test User", Email = "test@example.com" };
        
        // Act
        await service.CreateUserAsync(user);
        
        // Assert
        mockRepository.Verify(r => r.AddAsync(user), Times.Once);
        mockEmailSender.Verify(e => e.SendWelcomeEmailAsync(user.Email), Times.Once);
    }
}
```

### 12. **Performance Optimization**

```csharp
// ✅ Good: Use async and optimize registrations
public static IServiceCollection AddOptimizedServices(this IServiceCollection services)
{
    // Register services with minimal overhead
    services.AddScoped<IUserService, UserService>();
    
    // Use singleton for expensive resources
    services.AddSingleton<IExpensiveResource>(provider =>
    {
        // Initialize expensive resource once
        return new ExpensiveResource();
    });
    
    // Use transient for lightweight services
    services.AddTransient<ILightweightService, LightweightService>();
    
    return services;
}
```

### 13. **Security Considerations**

```csharp
// ✅ Good: Secure service configurations
public static IServiceCollection AddSecureServices(
    this IServiceCollection services, 
    IConfiguration configuration)
{
    // Use Key Vault for secrets
    var keyVaultUrl = configuration["KeyVaultUrl"];
    var credential = new DefaultAzureCredential();
    
    services.AddSingleton(provider => 
        new SecretClient(new Uri(keyVaultUrl), credential));
    
    // Register services that use secure secrets
    services.AddScoped<IAuthenticationService>(provider =>
    {
        var secretClient = provider.GetRequiredService<SecretClient>();
        var jwtSecret = secretClient.GetSecret("jwt-secret").Value.Value;
        
        return new JwtAuthenticationService(jwtSecret);
    });
    
    return services;
}
```

### 14. **Documentation and Maintenance**

```csharp
// ✅ Good: Document service registrations
/// <summary>
/// Registers all application services.
/// Call this method in Program.cs or Startup.cs
/// </summary>
public static IServiceCollection AddApplicationServices(
    this IServiceCollection services, 
    IConfiguration configuration)
{
    // Core services
    services.AddUserServices(); // User management
    services.AddOrderServices(); // Order processing
    services.AddPaymentServices(); // Payment handling
    
    // Infrastructure
    services.AddDataAccessServices(configuration); // Database access
    services.AddExternalApiServices(configuration); // External APIs
    
    // Cross-cutting concerns
    services.AddLoggingServices(); // Logging
    services.AddValidationServices(); // Validation
    services.AddCachingServices(); // Caching
    
    return services;
}
```

Following these best practices will result in maintainable, testable, and scalable applications. Always validate your DI configuration and monitor for issues in production.
