# Dependency Injection (DI) in .NET Core

## Fundamentals of Dependency Injection

Dependency Injection is a design pattern that deals with how components get hold of their dependencies. The pattern describes how to construct the components so that they are loosely coupled.

### The Problem Without DI

```csharp
// Tight coupling - difficult to test and maintain
public class OrderService
{
    private readonly DatabaseContext _context;
    private readonly EmailService _emailService;
    private readonly LoggingService _loggingService;
    
    public OrderService()
    {
        // Hard dependencies - difficult to mock in tests
        _context = new DatabaseContext();
        _emailService = new EmailService();
        _loggingService = new LoggingService();
    }
    
    public void CreateOrder(Order order)
    {
        _context.Orders.Add(order);
        _emailService.SendConfirmation(order);
        _loggingService.Log("Order created");
    }
}

// Testing this is difficult:
// - Can't mock EmailService
// - Can't mock DatabaseContext
// - Can't control LoggingService behavior
```

### The Solution With DI

```csharp
// Loose coupling - easy to test and maintain
public interface IOrderRepository
{
    Task AddOrderAsync(Order order);
}

public interface IEmailService
{
    Task SendConfirmationAsync(Order order);
}

public interface ILogger
{
    void Log(string message);
}

public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly IEmailService _emailService;
    private readonly ILogger _logger;
    
    // Dependencies are injected through constructor
    public OrderService(
        IOrderRepository repository,
        IEmailService emailService,
        ILogger logger)
    {
        _repository = repository;
        _emailService = emailService;
        _logger = logger;
    }
    
    public async Task CreateOrderAsync(Order order)
    {
        await _repository.AddOrderAsync(order);
        await _emailService.SendConfirmationAsync(order);
        _logger.Log("Order created");
    }
}

// Testing this is easy:
[TestFixture]
public class OrderServiceTests
{
    [Test]
    public async Task CreateOrder_SendsEmail()
    {
        // Arrange
        var mockRepository = new Mock<IOrderRepository>();
        var mockEmailService = new Mock<IEmailService>();
        var mockLogger = new Mock<ILogger>();
        
        var service = new OrderService(
            mockRepository.Object,
            mockEmailService.Object,
            mockLogger.Object);
        
        var order = new Order { Id = 1 };
        
        // Act
        await service.CreateOrderAsync(order);
        
        // Assert
        mockEmailService.Verify(
            x => x.SendConfirmationAsync(order),
            Times.Once);
    }
}
```

## .NET Core Built-in DI Container

The `IServiceCollection` and `IServiceProvider` form the default DI container.

### Service Registration

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        
        // Register services using extension methods
        builder.Services.AddScoped<IUserRepository, UserRepository>();
        builder.Services.AddScoped<IUserService, UserService>();
        builder.Services.AddSingleton<ICache, MemoryCache>();
        builder.Services.AddTransient<IEmailService, EmailService>();
        
        var app = builder.Build();
        app.Run();
    }
}
```

### Service Lifetimes

```csharp
public class ServiceLifetimeExamples
{
    // Transient - New instance every time
    // Use: Stateless services, utilities
    // Example: LoggingService, ValidationService
    public void RegisterTransient(IServiceCollection services)
    {
        services.AddTransient<IEmailService, EmailService>();
        
        // Each request gets new instance
        // Memory usage: Can be high in high-traffic apps
        // Thread safety: Not required
    }
    
    // Scoped - New instance per request/scope
    // Use: Per-request state, EF Core DbContext
    // Example: IUnitOfWork, Database contexts
    public void RegisterScoped(IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<AppDbContext>();
        
        // Same instance within single request
        // Memory usage: Moderate
        // Thread safety: Important across requests
    }
    
    // Singleton - Single instance for entire app lifetime
    // Use: Expensive to create, thread-safe, stateless
    // Example: Configuration, Cache, Logger factory
    public void RegisterSingleton(IServiceCollection services)
    {
        services.AddSingleton<IConfiguration>(
            new ConfigurationBuilder().Build());
        services.AddSingleton<ICache, MemoryCache>();
        
        // Instance created once
        // Memory usage: Low
        // Thread safety: CRITICAL - must be thread-safe
    }
}
```

### Lifetime Visualization

```csharp
public class LifetimeDemo
{
    public interface IService { Guid Id { get; } }
    
    public class Service : IService 
    { 
        public Guid Id { get; } = Guid.NewGuid();
    }
    
    [Test]
    public void DemonstrateLifetimes()
    {
        var services = new ServiceCollection();
        
        services.AddTransient<IService>(provider => new Service());
        services.AddScoped<IService>(provider => new Service());
        services.AddSingleton<IService>(provider => new Service());
        
        var provider = services.BuildServiceProvider();
        
        // Transient - Different every time
        var transient1 = provider.GetRequiredService<IService>();
        var transient2 = provider.GetRequiredService<IService>();
        Assert.AreNotEqual(transient1.Id, transient2.Id); // True
        
        // Scoped - Same within scope
        using (var scope1 = provider.CreateScope())
        {
            var scoped1 = scope1.ServiceProvider.GetRequiredService<IService>();
            var scoped2 = scope1.ServiceProvider.GetRequiredService<IService>();
            Assert.AreEqual(scoped1.Id, scoped2.Id); // True
        }
        
        using (var scope2 = provider.CreateScope())
        {
            var scoped3 = scope2.ServiceProvider.GetRequiredService<IService>();
            // Different from scope1 instances
        }
        
        // Singleton - Same always
        var singleton1 = provider.GetRequiredService<IService>();
        var singleton2 = provider.GetRequiredService<IService>();
        Assert.AreEqual(singleton1.Id, singleton2.Id); // True
    }
}
```

### Constructor Injection

```csharp
public class ConstructorInjectionExample
{
    // Standard constructor injection
    public class UserService
    {
        private readonly IUserRepository _repository;
        private readonly ILogger _logger;
        
        public UserService(
            IUserRepository repository,
            ILogger logger)
        {
            _repository = repository;
            _logger = logger;
        }
        
        public async Task<User> GetUserAsync(int id)
        {
            _logger.Log($"Getting user {id}");
            return await _repository.GetAsync(id);
        }
    }
    
    // In controller
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        
        // Dependencies automatically injected by DI container
        public UsersController(IUserService userService)
        {
            _userService = userService;
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userService.GetUserAsync(id);
            return Ok(user);
        }
    }
}
```

### Factory Pattern with DI

```csharp
public class FactoryPatternWithDI
{
    public interface IServiceFactory
    {
        IDataService CreateService(string type);
    }
    
    // Factory implementation
    public class ServiceFactory : IServiceFactory
    {
        private readonly IServiceProvider _serviceProvider;
        
        public ServiceFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        
        public IDataService CreateService(string type)
        {
            return type switch
            {
                "sql" => _serviceProvider.GetRequiredService<SqlDataService>(),
                "nosql" => _serviceProvider.GetRequiredService<NoSqlDataService>(),
                _ => throw new ArgumentException($"Unknown service type: {type}")
            };
        }
    }
    
    // Register in DI container
    public static void ConfigureDI(IServiceCollection services)
    {
        services.AddScoped<SqlDataService>();
        services.AddScoped<NoSqlDataService>();
        services.AddScoped<IServiceFactory, ServiceFactory>();
    }
}
```

### Service Registration Patterns

```csharp
public class ServiceRegistrationPatterns
{
    public static void RegisterServices(IServiceCollection services)
    {
        // 1. Direct registration
        services.AddScoped<IUserService, UserService>();
        
        // 2. Factory registration
        services.AddScoped<IUserService>(provider =>
        {
            var repository = provider.GetRequiredService<IUserRepository>();
            var logger = provider.GetRequiredService<ILogger>();
            return new UserService(repository, logger);
        });
        
        // 3. Implementation factory
        services.AddScoped<IUserService>(
            provider => ActivatorUtilities.CreateInstance<UserService>(provider));
        
        // 4. Multiple implementations (named services - .NET 8.0+)
        services.AddKeyedScoped<IDataService, SqlDataService>("sql");
        services.AddKeyedScoped<IDataService, MongoDataService>("mongo");
    }
}
```

### Resolving Services

```csharp
public class ServiceResolution
{
    public static void ResolveServices(IServiceProvider provider)
    {
        // 1. GetRequiredService - throws if not found
        var userService = provider.GetRequiredService<IUserService>();
        
        // 2. GetService - returns null if not found
        var emailService = provider.GetService<IEmailService>();
        
        // 3. Keyed services (.NET 8.0+)
        var sqlService = provider.GetRequiredKeyedService<IDataService>("sql");
        var mongoService = provider.GetRequiredKeyedService<IDataService>("mongo");
        
        // 4. Enumerate services
        var allDataServices = provider.GetServices<IDataService>();
        foreach (var service in allDataServices)
        {
            Console.WriteLine(service.GetType().Name);
        }
    }
}
```

## AutoFac - Advanced Dependency Injection Container

Autofac is a highly powerful, feature-rich dependency injection (DI) and Inversion of Control (IoC) container for .NET Core.

### Why AutoFac Over Built-in DI?

| Feature | Built-in | AutoFac |
|---------|----------|---------|
| **Module System** | Basic | ✅ Advanced |
| **Property Injection** | ❌ | ✅ |
| **Circular Dependency** | ❌ | ✅ Handles |
| **Lazy<T>** | ❌ | ✅ |
| **Func<T>** | ❌ | ✅ Factory delegates |
| **Interceptors** | ❌ | ✅ AOP |
| **Decorators** | Limited | ✅ Full support |
| **Owned<T>** | ❌ | ✅ |
| **Named Services** | .NET 8.0+ | ✅ Any version |
| **Assembly Scanning** | ❌ | ✅ |

### AutoFac Installation

```bash
dotnet add package Autofac
dotnet add package Autofac.Extensions.DependencyInjection
```

### Basic AutoFac Configuration

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
                // Register services with AutoFac
                builder.RegisterType<UserRepository>()
                    .As<IUserRepository>()
                    .InstancePerDependency();
                
                builder.RegisterType<UserService>()
                    .As<IUserService>()
                    .InstancePerLifetimeScope();
                
                builder.RegisterInstance(new AppSettings())
                    .SingleInstance();
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}
```

### AutoFac Service Lifetimes

```csharp
public class AutoFacLifetimes
{
    public static void RegisterWithDifferentLifetimes(ContainerBuilder builder)
    {
        // InstancePerDependency - Equivalent to Transient
        // New instance every time
        builder.RegisterType<EmailService>()
            .As<IEmailService>()
            .InstancePerDependency();
        
        // InstancePerLifetimeScope - Equivalent to Scoped
        // One instance per scope (request)
        builder.RegisterType<UnitOfWork>()
            .As<IUnitOfWork>()
            .InstancePerLifetimeScope();
        
        // SingleInstance - Equivalent to Singleton
        // Single instance for entire application
        builder.RegisterType<AppConfiguration>()
            .As<IConfiguration>()
            .SingleInstance();
        
        // InstancePerOwned<T> - One instance per owned scope
        builder.RegisterType<Repository>()
            .As<IRepository>()
            .InstancePerOwned<RepositoryOwner>();
    }
}
```

### AutoFac Modules

Modules organize related registrations and improve code structure.

```csharp
// Module for data access layer
public class DataAccessModule : Module
{
    private readonly string _connectionString;
    
    public DataAccessModule(string connectionString)
    {
        _connectionString = connectionString;
    }
    
    protected override void Load(ContainerBuilder builder)
    {
        builder.Register(c => new DatabaseConnection(_connectionString))
            .As<IDatabaseConnection>()
            .SingleInstance();
        
        builder.RegisterType<UserRepository>()
            .As<IUserRepository>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<OrderRepository>()
            .As<IOrderRepository>()
            .InstancePerLifetimeScope();
    }
}

// Module for business logic
public class BusinessLogicModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterType<UserService>()
            .As<IUserService>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<OrderService>()
            .As<IOrderService>()
            .InstancePerLifetimeScope();
        
        builder.RegisterType<EmailService>()
            .As<IEmailService>()
            .InstancePerDependency();
    }
}

// Module for cross-cutting concerns
public class CrossCuttingModule : Module
{
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterGeneric(typeof(ValidationBehavior<,>))
            .As(typeof(IPipelineBehavior<,>));
        
        builder.RegisterGeneric(typeof(LoggingBehavior<,>))
            .As(typeof(IPipelineBehavior<,>));
        
        builder.RegisterType<CacheDecorator>()
            .InstancePerLifetimeScope();
    }
}

// Usage in Program.cs
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
                var connectionString = hostContext.Configuration
                    .GetConnectionString("DefaultConnection");
                
                // Register modules
                builder.RegisterModule(new DataAccessModule(connectionString));
                builder.RegisterModule(new BusinessLogicModule());
                builder.RegisterModule(new CrossCuttingModule());
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}
```

### Advanced AutoFac Features

#### Property Injection

```csharp
public class PropertyInjectionExample
{
    public interface ILogger { }
    public class ConsoleLogger : ILogger { }
    
    public class Service
    {
        public ILogger Logger { get; set; } // Will be auto-wired
    }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<ConsoleLogger>().As<ILogger>();
        
        builder.RegisterType<Service>()
            .PropertiesAutowired(); // Enable property injection
    }
}
```

#### Factory Delegates with Func<T>

```csharp
public class FactoryDelegateExample
{
    public interface IService { }
    public class Service : IService { }
    
    public class ServiceConsumer
    {
        private readonly Func<IService> _serviceFactory;
        
        // AutoFac automatically injects factory function
        public ServiceConsumer(Func<IService> serviceFactory)
        {
            _serviceFactory = serviceFactory;
        }
        
        public void DoWork()
        {
            // Create new instance when needed
            var service = _serviceFactory();
        }
    }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<Service>()
            .As<IService>()
            .InstancePerDependency();
        
        // Func<T> automatically available
        // builder.Register<Func<IService>>(c =>
        // {
        //     var cc = c.Resolve<IComponentContext>();
        //     return () => cc.Resolve<IService>();
        // });
    }
}
```

#### Lazy<T> for Deferred Instantiation

```csharp
public class LazyExample
{
    public interface IExpensiveService { }
    public class ExpensiveService : IExpensiveService { }
    
    public class ServiceConsumer
    {
        private readonly Lazy<IExpensiveService> _lazyService;
        
        public ServiceConsumer(Lazy<IExpensiveService> lazyService)
        {
            _lazyService = lazyService;
        }
        
        public void DoWork()
        {
            // Service created only when accessed
            var service = _lazyService.Value;
        }
    }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<ExpensiveService>()
            .As<IExpensiveService>();
        
        // Lazy<T> automatically available
    }
}
```

#### Named and Keyed Services

```csharp
public class NamedServicesExample
{
    public interface IDataService { }
    public class SqlDataService : IDataService { }
    public class MongoDataService : IDataService { }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<SqlDataService>()
            .Named<IDataService>("sql");
        
        builder.RegisterType<MongoDataService>()
            .Named<IDataService>("mongo");
    }
    
    public static void Resolve(IComponentContext context)
    {
        var sqlService = context.ResolveNamed<IDataService>("sql");
        var mongoService = context.ResolveNamed<IDataService>("mongo");
    }
}
```

#### Decorators

```csharp
public class DecoratorExample
{
    public interface IDataService
    {
        Task<Data> GetAsync(int id);
    }
    
    public class BaseDataService : IDataService
    {
        public async Task<Data> GetAsync(int id)
        {
            await Task.Delay(100);
            return new Data { Id = id };
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
        
        public async Task<Data> GetAsync(int id)
        {
            var key = $"data_{id}";
            if (_cache.TryGetValue(key, out Data data))
                return data;
            
            data = await _inner.GetAsync(id);
            _cache.Set(key, data, TimeSpan.FromMinutes(5));
            return data;
        }
    }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<BaseDataService>()
            .Named<IDataService>("base");
        
        builder.RegisterDecorator<CachedDataService, IDataService>(
            fromKey: "base");
    }
}
```

#### Assembly Scanning

```csharp
public class AssemblyScanning
{
    public static void RegisterByConvention(ContainerBuilder builder)
    {
        // Register all implementations of IRepository
        builder.RegisterAssemblyTypes(
            typeof(Program).Assembly)
            .Where(t => t.Name.EndsWith("Repository"))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();
        
        // Register all services
        builder.RegisterAssemblyTypes(
            typeof(Program).Assembly)
            .Where(t => t.Name.EndsWith("Service"))
            .AsImplementedInterfaces()
            .InstancePerLifetimeScope();
    }
}
```

#### Interceptors and AOP

```csharp
public class InterceptorExample
{
    public interface IUserService
    {
        Task<User> GetUserAsync(int id);
    }
    
    public class UserService : IUserService
    {
        public async Task<User> GetUserAsync(int id)
        {
            return new User { Id = id, Name = "John" };
        }
    }
    
    public class LoggingInterceptor : IInterceptor
    {
        private readonly ILogger<LoggingInterceptor> _logger;
        
        public LoggingInterceptor(ILogger<LoggingInterceptor> logger)
        {
            _logger = logger;
        }
        
        public void Intercept(IInvocation invocation)
        {
            _logger.LogInformation(
                $"Calling {invocation.Method.Name} with args: " +
                $"{string.Join(", ", invocation.Arguments)}");
            
            invocation.Proceed();
            
            _logger.LogInformation(
                $"Method {invocation.Method.Name} returned: " +
                $"{invocation.ReturnValue}");
        }
    }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<LoggingInterceptor>();
        
        builder.RegisterType<UserService>()
            .As<IUserService>()
            .EnableInterfaceInterceptors()
            .InterceptedBy(typeof(LoggingInterceptor));
    }
}
```

#### Owned<T> for Lifetime Management

```csharp
public class OwnedExample
{
    public interface IRepository { }
    public class Repository : IRepository, IDisposable
    {
        public void Dispose() => Console.WriteLine("Repository disposed");
    }
    
    public class ServiceUsingRepository
    {
        public void DoWork(ILifetimeScope scope)
        {
            // Create owned instance
            var owned = scope.ResolveComponent(
                new TypedParameter(typeof(IRepository), typeof(Repository)));
            
            // Use repository
            // Cleanup when owned goes out of scope
        }
    }
    
    public static void Configure(ContainerBuilder builder)
    {
        builder.RegisterType<Repository>()
            .As<IRepository>()
            .InstancePerOwned<Repository>();
    }
}
```

## AutoFac vs Built-in DI - Decision Matrix

**Use Built-in DI when:**
- Simple application with straightforward dependencies
- Project is small or startup phase
- Team unfamiliar with advanced DI concepts
- Performance is critical

**Use AutoFac when:**
- Complex dependency graphs
- Need advanced features (interceptors, decorators, modules)
- Want stronger AOP capabilities
- Building reusable component libraries
- Need more sophisticated lifetime management

## Best Practices for DI

1. **Program to interfaces**, not implementations
2. **Inject dependencies through constructor**
3. **Avoid Service Locator pattern** - don't use ServiceProvider everywhere
4. **Validate DI configuration** at startup
5. **Use modules** to organize registrations
6. **Be explicit** about lifetimes
7. **Test with mock implementations**
8. **Document dependency requirements**

```csharp
// ✅ GOOD
public class UserService
{
    private readonly IUserRepository _repository;
    
    public UserService(IUserRepository repository)
    {
        _repository = repository;
    }
}

// ❌ BAD - Service Locator
public class UserService
{
    private readonly IServiceProvider _provider;
    
    public UserService(IServiceProvider provider)
    {
        _provider = provider;
    }
    
    public void GetUser()
    {
        var repository = _provider.GetService<IUserRepository>(); // Avoid this
    }
}
```
