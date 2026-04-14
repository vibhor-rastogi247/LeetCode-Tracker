# Modules and Dependency Injection in .NET Core with AutoFac

## Understanding .NET Core Modules

A module is a reusable, self-contained package of configuration that encapsulates related functionality. Modules enable better code organization, reusability, and testability in applications.

### Module Architecture

```
Application
├── Core Module (Business Logic)
├── Data Access Module (Repositories)
├── Infrastructure Module (Services)
├── Cross-Cutting Module (Logging, Caching)
└── Presentation Module (Controllers)
```

### Creating and Organizing Modules

#### Basic Module Structure

```csharp
// Module interface for clarity
public interface IApplicationModule
{
    void Register(ContainerBuilder builder);
}

// Data access layer module
public class DataAccessModule : IApplicationModule
{
    private readonly IConfiguration _configuration;
    
    public DataAccessModule(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public void Register(ContainerBuilder builder)
    {
        var connectionString = _configuration
            .GetConnectionString("DefaultConnection");
        
        // Register database context
        builder.Register(c => 
            new ApplicationDbContext(connectionString))
            .InstancePerLifetimeScope();
        
        // Register repositories
        builder.RegisterType<UserRepository>()
            .As<IUserRepository>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<OrderRepository>()
            .As<IOrderRepository>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<ProductRepository>()
            .As<IProductRepository>()
            .InstancePerLifetimeScope();
    }
}

// Business logic module
public class ApplicationModule : IApplicationModule
{
    public void Register(ContainerBuilder builder)
    {
        // Register domain services
        builder.RegisterType<UserService>()
            .As<IUserService>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<OrderService>()
            .As<IOrderService>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<ProductService>()
            .As<IProductService>()
            .InstancePerLifetimeScope();
        
        // Register validators
        builder.RegisterType<UserValidator>()
            .As<IValidator<UserCreateRequest>>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<OrderValidator>()
            .As<IValidator<OrderCreateRequest>>()
            .InstancePerLifetimeScope();
    }
}

// Infrastructure and cross-cutting concerns
public class InfrastructureModule : IApplicationModule
{
    public void Register(ContainerBuilder builder)
    {
        // Register logging
        builder.RegisterType<FileLogger>()
            .As<ILogger>()
            .SingleInstance();
        
        // Register caching
        builder.RegisterType<MemoryCacheService>()
            .As<ICacheService>()
            .SingleInstance();
        
        // Register email service
        builder.RegisterType<EmailService>()
            .As<IEmailService>()
            .InstancePerDependency();
        
        // Register PDF generator
        builder.RegisterType<PdfGenerator>()
            .As<IPdfGenerator>()
            .InstancePerDependency();
    }
}

// Cross-cutting concerns module (Logging, Validation, etc.)
public class CrossCuttingModule : IApplicationModule
{
    public void Register(ContainerBuilder builder)
    {
        // Register decorators for caching
        builder.RegisterDecorator<CacheDecorator, IUserService>(
            fromKey: "base");
        
        // Register decorators for logging
        builder.RegisterDecorator<LoggingDecorator, IOrderService>(
            fromKey: "base");
        
        // Register interceptors for AOP
        builder.RegisterType<TimingInterceptor>();
        builder.RegisterType<ExceptionHandlingInterceptor>();
    }
}

// Presentation module
public class PresentationModule : IApplicationModule
{
    public void Register(ContainerBuilder builder)
    {
        // Register controllers
        builder.RegisterAssemblyTypes(
            typeof(Program).Assembly)
            .Where(t => t.Name.EndsWith("Controller"))
            .InstancePerLifetimeScope();
        
        // Register AutoMapper
        builder.Register(context =>
            new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<UserMappingProfile>();
                cfg.AddProfile<OrderMappingProfile>();
            }).CreateMapper())
            .As<IMapper>()
            .SingleInstance();
    }
}
```

### Composing Modules in Program.cs

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }
    
    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .UseServiceProviderFactory(new AutofacServiceProviderFactory())
            .ConfigureContainer<ContainerBuilder>((hostContext, builder) =>
            {
                // Register all modules
                var modules = new List<IApplicationModule>
                {
                    new DataAccessModule(hostContext.Configuration),
                    new ApplicationModule(),
                    new InfrastructureModule(),
                    new CrossCuttingModule(),
                    new PresentationModule()
                };
                
                foreach (var module in modules)
                {
                    module.Register(builder);
                }
                
                // OR use AutoFac's Module class
                builder.RegisterModule(new DataAccessModule(hostContext.Configuration));
                builder.RegisterModule(new ApplicationModule());
                builder.RegisterModule(new InfrastructureModule());
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}
```

### Advanced Module Patterns

#### Conditional Module Registration

```csharp
public class ConditionalModuleExample
{
    public static void ConfigureWithConditionalModules(
        ContainerBuilder builder,
        IHostEnvironment environment)
    {
        // Always register core modules
        builder.RegisterModule(new DataAccessModule());
        builder.RegisterModule(new ApplicationModule());
        
        // Environment-specific modules
        if (environment.IsDevelopment())
        {
            builder.RegisterModule(new DevelopmentModule());
        }
        else if (environment.IsProduction())
        {
            builder.RegisterModule(new ProductionModule());
        }
    }
}

public class DevelopmentModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        // Register in-memory caching
        builder.RegisterType<InMemoryCacheService>()
            .As<ICacheService>()
            .SingleInstance();
        
        // Register mock email service
        builder.RegisterType<MockEmailService>()
            .As<IEmailService>()
            .InstancePerDependency();
        
        // Detailed logging
        builder.RegisterType<ConsoleLogger>()
            .As<ILogger>()
            .SingleInstance();
    }
}

public class ProductionModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        // Register Redis caching
        builder.RegisterType<RedisCacheService>()
            .As<ICacheService>()
            .SingleInstance();
        
        // Register real email service
        builder.RegisterType<SmtpEmailService>()
            .As<IEmailService>()
            .InstancePerDependency();
        
        // Production logging
        builder.RegisterType<FileLogger>()
            .As<ILogger>()
            .SingleInstance();
    }
}
```

#### Module Dependencies

```csharp
public class ModuleWithDependencies : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        // This module depends on IConfiguration and IHostEnvironment
        // They must be registered before this module
    }
    
    protected override void AttachToComponentRegistration(
        IComponentRegistryBuilder componentRegistryBuilder,
        IComponentRegistration registration)
    {
        // Hook into component registration lifecycle
        base.AttachToComponentRegistration(componentRegistryBuilder, registration);
    }
}
```

#### Plugin Architecture with Modules

```csharp
public class PluginModuleLoader
{
    private readonly IConfiguration _configuration;
    
    public PluginModuleLoader(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public void LoadModules(ContainerBuilder builder)
    {
        var pluginPaths = _configuration
            .GetSection("Plugins:Paths")
            .Get<string[]>();
        
        foreach (var path in pluginPaths)
        {
            try
            {
                var assembly = Assembly.LoadFrom(path);
                
                // Find all IApplicationModule implementations
                var moduleTypes = assembly.GetTypes()
                    .Where(t => typeof(IApplicationModule).IsAssignableFrom(t)
                        && !t.IsInterface)
                    .ToList();
                
                foreach (var moduleType in moduleTypes)
                {
                    var instance = Activator.CreateInstance(moduleType);
                    if (instance is IApplicationModule module)
                    {
                        module.Register(builder);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to load plugin from {path}: {ex.Message}");
            }
        }
    }
}

// In Program.cs
public static IHostBuilder CreateHostBuilder(string[] args) =>
    Host.CreateDefaultBuilder(args)
        .UseServiceProviderFactory(new AutofacServiceProviderFactory())
        .ConfigureContainer<ContainerBuilder>((hostContext, builder) =>
        {
            var pluginLoader = new PluginModuleLoader(hostContext.Configuration);
            pluginLoader.LoadModules(builder);
        });
```

## AutoFac Module System Deep Dive

### Module Class Inheritance

```csharp
public class AdvancedModule : Module
{
    // Called when registering the module
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterType<MyService>()
            .As<IMyService>();
    }
    
    // Called when creating the component context
    protected override void AttachToComponentRegistration(
        IComponentRegistryBuilder componentRegistryBuilder,
        IComponentRegistration registration)
    {
        base.AttachToComponentRegistration(componentRegistryBuilder, registration);
        
        // Can add handlers for component activation
    }
    
    // Called when attaching to the container
    protected override void AttachToModuleRegistration(
        IComponentRegistryBuilder componentRegistryBuilder,
        IComponentRegistration registration)
    {
        base.AttachToModuleRegistration(componentRegistryBuilder, registration);
    }
}
```

### Real-World Module Example: Authentication Module

```csharp
public class AuthenticationModule : Module
{
    private readonly AuthSettings _authSettings;
    
    public AuthenticationModule(AuthSettings authSettings)
    {
        _authSettings = authSettings;
    }
    
    protected override void Load(ContainerBuilder builder)
    {
        // Register JWT token service
        builder.Register(c =>
            new JwtTokenService(
                _authSettings.Secret,
                _authSettings.Issuer,
                _authSettings.Audience,
                _authSettings.ExpirationMinutes))
            .As<ITokenService>()
            .SingleInstance();
        
        // Register authentication service
        builder.RegisterType<AuthenticationService>()
            .As<IAuthenticationService>()
            .InstancePerLifetimeScope();
        
        // Register password hasher
        builder.RegisterType<BcryptPasswordHasher>()
            .As<IPasswordHasher>()
            .SingleInstance();
        
        // Register claims principal factory
        builder.RegisterType<ClaimsPrincipalFactory>()
            .AsSelf()
            .InstancePerLifetimeScope();
        
        // Register role service
        builder.RegisterType<RoleService>()
            .As<IRoleService>()
            .InstancePerLifetimeScope();
    }
}

// Configuration class
public class AuthSettings
{
    public string Secret { get; set; }
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public int ExpirationMinutes { get; set; }
}

// Usage
var authSettings = new AuthSettings
{
    Secret = configuration["Jwt:Secret"],
    Issuer = configuration["Jwt:Issuer"],
    Audience = configuration["Jwt:Audience"],
    ExpirationMinutes = int.Parse(configuration["Jwt:ExpirationMinutes"])
};

builder.RegisterModule(new AuthenticationModule(authSettings));
```

### Real-World Module Example: Data Persistence Module

```csharp
public class DataPersistenceModule : Module
{
    private readonly string _connectionString;
    private readonly bool _useInMemory;
    
    public DataPersistenceModule(string connectionString, bool useInMemory = false)
    {
        _connectionString = connectionString;
        _useInMemory = useInMemory;
    }
    
    protected override void Load(ContainerBuilder builder)
    {
        // Register DbContext
        if (_useInMemory)
        {
            builder.Register(c =>
            {
                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                    .UseInMemoryDatabase("TestDb")
                    .Options;
                return new ApplicationDbContext(options);
            })
            .InstancePerLifetimeScope();
        }
        else
        {
            builder.Register(c =>
            {
                var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                    .UseSqlServer(_connectionString)
                    .Options;
                return new ApplicationDbContext(options);
            })
            .InstancePerLifetimeScope();
        }
        
        // Register Unit of Work
        builder.RegisterType<UnitOfWork>()
            .As<IUnitOfWork>()
            .InstancePerLifetimeScope();
        
        // Register repositories
        RegisterRepositories(builder);
        
        // Register query handlers
        RegisterQueryHandlers(builder);
    }
    
    private void RegisterRepositories(ContainerBuilder builder)
    {
        builder.RegisterType<UserRepository>()
            .As<IUserRepository>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<OrderRepository>()
            .As<IOrderRepository>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<ProductRepository>()
            .As<IProductRepository>()
            .InstancePerLifetimeScope();
    }
    
    private void RegisterQueryHandlers(ContainerBuilder builder)
    {
        builder.RegisterAssemblyTypes(
            typeof(Program).Assembly)
            .Where(t => t.Name.EndsWith("QueryHandler"))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();
    }
}
```

## Module Registration Strategies

### Strategy 1: Central Module Registry

```csharp
public class ModuleRegistry
{
    public static void RegisterAllModules(
        ContainerBuilder builder,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // Core modules
        builder.RegisterModule(new DataAccessModule(configuration));
        builder.RegisterModule(new ApplicationModule());
        
        // Infrastructure modules
        builder.RegisterModule(new CachingModule(environment));
        builder.RegisterModule(new LoggingModule(environment));
        
        // Authentication
        var authSettings = configuration.GetSection("Authentication")
            .Get<AuthSettings>();
        builder.RegisterModule(new AuthenticationModule(authSettings));
        
        // Event handling
        builder.RegisterModule(new EventHandlerModule());
        
        // Mapping
        builder.RegisterModule(new MappingModule());
    }
}

// Usage in Program.cs
ModuleRegistry.RegisterAllModules(
    builder,
    hostContext.Configuration,
    hostContext.HostingEnvironment);
```

### Strategy 2: Environment-Based Module Loading

```csharp
public class EnvironmentModuleLoader
{
    public static void LoadEnvironmentModules(
        ContainerBuilder builder,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        // Always load common modules
        builder.RegisterModule(new CoreModule());
        
        // Load environment-specific modules
        var modulePath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "Modules",
            environment.EnvironmentName);
        
        if (Directory.Exists(modulePath))
        {
            var assemblyFiles = Directory.GetFiles(modulePath, "*.dll");
            
            foreach (var assemblyFile in assemblyFiles)
            {
                try
                {
                    var assembly = Assembly.LoadFrom(assemblyFile);
                    var moduleTypes = assembly.GetTypes()
                        .Where(t => typeof(Module).IsAssignableFrom(t)
                            && !t.IsAbstract);
                    
                    foreach (var moduleType in moduleTypes)
                    {
                        var instance = Activator.CreateInstance(moduleType);
                        if (instance is Module module)
                        {
                            builder.RegisterModule(module);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to load module from {assemblyFile}: {ex.Message}");
                }
            }
        }
    }
}
```

## Module Communication and Dependencies

### Inter-Module Communication Pattern

```csharp
// Event-based communication between modules
public interface IDomainEventBus
{
    Task PublishAsync<T>(T @event) where T : IDomainEvent;
}

public interface IDomainEvent
{
    Guid AggregateId { get; }
    DateTime OccurredAt { get; }
}

public class UserCreatedEvent : IDomainEvent
{
    public Guid AggregateId { get; set; }
    public DateTime OccurredAt { get; set; }
    public string Email { get; set; }
}

// Handler in different module
public class UserCreatedEventHandler
    : IDomainEventHandler<UserCreatedEvent>
{
    public async Task HandleAsync(UserCreatedEvent @event)
    {
        // Send welcome email
        // Create user profile
        // etc.
    }
}

// Module registration
public class EventHandlingModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterType<DomainEventBus>()
            .As<IDomainEventBus>()
            .SingleInstance();
        
        builder.RegisterAssemblyTypes(typeof(Program).Assembly)
            .Where(t => t.IsClosedTypeOf(typeof(IDomainEventHandler<>)))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();
    }
}
```

## Module Best Practices

1. **Single Responsibility**: Each module should have one reason to change
2. **Clear Dependencies**: Document what a module depends on
3. **Testability**: Modules should be independently testable
4. **Reusability**: Design modules to be reusable across projects
5. **Configuration**: Use configuration for module behavior
6. **Documentation**: Document module purpose and dependencies

```csharp
/// <summary>
/// Email Module
/// Registers all email-related services and configurations.
/// 
/// Dependencies:
/// - IConfiguration (from host configuration)
/// 
/// Services Provided:
/// - IEmailService: Sends emails via configured SMTP provider
/// - IEmailTemplateEngine: Renders email templates
/// 
/// Configuration Required (appsettings.json):
/// {
///   "Email": {
///     "SmtpServer": "smtp.example.com",
///     "SmtpPort": 587,
///     "FromAddress": "noreply@example.com"
///   }
/// }
/// </summary>
public class EmailModule : Module
{
    private readonly IConfiguration _configuration;
    
    public EmailModule(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    protected override void Load(ContainerBuilder builder)
    {
        var emailSettings = _configuration
            .GetSection("Email")
            .Get<EmailSettings>()
            ?? throw new InvalidOperationException(
                "Email configuration is required");
        
        builder.RegisterInstance(emailSettings).SingleInstance();
        
        builder.RegisterType<SmtpEmailService>()
            .As<IEmailService>()
            .InstancePerDependency();
        
        builder.RegisterType<EmailTemplateEngine>()
            .As<IEmailTemplateEngine>()
            .InstancePerLifetimeScope();
    }
}
```
