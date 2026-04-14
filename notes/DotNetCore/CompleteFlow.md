# Complete .NET Core Flow

## Overview

This document is the single reference for understanding .NET Core from the moment `dotnet run` starts your application through request execution. It explains the startup flow, objects created, dependency injection, logging, configuration, context, and the exact moments classes are instantiated.

This is intended for junior developers and architect-level teams who need to know .NET Core from the inside out.

---

## 1. What Happens When You Run `dotnet run` / `dotnet start`

When you execute a .NET Core application, the runtime performs these stages:

1. `dotnet` host loads the runtime
2. The application assembly is loaded
3. Program entry point is located (`static void Main` or `static Task Main`)
4. The host builder is created (`WebApplicationBuilder` or `HostBuilder`)
5. Configuration sources are composed
6. Logging is configured
7. Services are registered with `IServiceCollection`
8. The service provider is built
9. Middleware pipeline is created
10. The server starts listening for HTTP requests

### Typical entry point in .NET 8+ minimal API

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

### What is created first?

- `WebApplicationBuilder`: first object created by `CreateBuilder(args)`
- `HostBuilder` internally: the generic host for both web and non-web apps
- `IConfigurationBuilder`: collects config providers
- `ILoggingBuilder`: collects logger providers
- `IServiceCollection`: collects service registrations
- `IServiceProvider`: built after all service registrations
- `WebApplication`: built from `builder.Build()`

---

## 2. Startup Flow in Detail

### 2.1 `WebApplicationBuilder` construction

`WebApplication.CreateBuilder(args)` does these main things:

- Creates a default `HostBuilder`
- Builds `IConfiguration` from `appsettings.json`, `appsettings.{Environment}.json`, environment variables, user secrets, and command-line args
- Adds default logging providers
- Creates `IServiceCollection`
- Adds default web host services
- Reads environment variables and sets `ASPNETCORE_ENVIRONMENT`

### 2.2 Configuration pipeline

The default source order is important. Later providers override earlier values.

- `appsettings.json`
- `appsettings.{Environment}.json`
- User secrets (`dotnet user-secrets`)
- Environment variables
- Command-line arguments

```csharp
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables()
    .AddCommandLine(args);
```

### 2.3 Logging pipeline

The default `CreateBuilder` registers these providers by default:

- Console
- Debug
- EventSource
- EventLog (Windows)

You can replace or extend with third-party logging components:

- Serilog
- NLog
- Log4Net
- Microsoft.Extensions.Logging.Abstractions (built-in)

```csharp
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console();
});
```

### 2.4 Service registration

During startup, every `AddXxx` call registers one or more services into the `IServiceCollection`.

- `AddSingleton<TService, TImplementation>()`
- `AddScoped<TService, TImplementation>()`
- `AddTransient<TService, TImplementation>()`
- `AddSingleton(provider => ...)` for factories

The actual `IServiceProvider` is created when `builder.Build()` is called.

---

## 3. Important Objects and When They Are Created

### 3.1 `WebApplicationBuilder`

Created by `WebApplication.CreateBuilder(args)`.

Properties:

- `Configuration`: `IConfiguration` with all config sources
- `Services`: `IServiceCollection` for DI registrations
- `Logging`: `ILoggingBuilder`
- `Environment`: `IHostEnvironment`
- `WebHost`: `IWebHostBuilder`
- `Host`: `IHostBuilder`

### 3.2 `IServiceCollection` and service registrations

Created as an empty collection during builder creation.

Example:

```csharp
builder.Services.AddSingleton<IConfiguration>(builder.Configuration);
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddTransient<IEmailSender, EmailSender>();
```

### 3.3 `IServiceProvider`

Built when `builder.Build()` runs.

It is the container.

- `BuildServiceProvider()` resolves dependencies
- It creates instances when services are requested
- It enforces lifetimes

### 3.4 `WebApplication`

Created after `builder.Build()`.

- Holds middleware pipeline
- Provides `Run()` method
- Hosts the `HttpContext` factory

### 3.5 `HttpContext`

Created per request by the server.

Includes:

- `HttpRequest`
- `HttpResponse`
- `Connection`
- `User`
- `RequestServices` (scoped `IServiceProvider`)
- `Items`

Example in middleware:

```csharp
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Request path: {Path}", context.Request.Path);
    await next();
});
```

### 3.6 `IHostEnvironment` / `IWebHostEnvironment`

Provides environment values:

- `EnvironmentName`
- `ApplicationName`
- `ContentRootPath`
- `WebRootPath`

Injected everywhere via DI:

```csharp
public HomeController(IWebHostEnvironment environment)
{
    _environment = environment;
}
```

---

## 4. Dependency Injection: When and Why Things Are Created

### 4.1 Constructor injection

Most services are created when the framework resolves the top-level object.

Example:

```csharp
public class ProductController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly ILogger<ProductController> _logger;

    public ProductController(
        IProductService productService,
        ILogger<ProductController> logger)
    {
        _productService = productService;
        _logger = logger;
    }
}
```

This means:

- `ProductController` is created when a request matches route
- `IProductService` and `ILogger<ProductController>` are resolved first
- If `IProductService` is scoped, it is created once per request

### 4.2 Singleton, Scoped, Transient lifetimes

| Lifetime | Number of Instances | When to use | Creation timing |
|---|---|---|---|
| Singleton | 1 per container | Shared, thread-safe services | Created first time resolved or during build if `AddSingleton(instance)` |
| Scoped | 1 per scope / request | Request-specific data, DbContext | Created when request begins |
| Transient | New each resolution | Lightweight stateless services | Created every time requested |

### 4.3 When is a class instantiated?

- `Singleton`: first resolution or container build if explicit instance provided
- `Scoped`: first resolution inside a request scope
- `Transient`: each resolution request

### 4.4 `IServiceProvider`: when should you use it?

Use `IServiceProvider` sparingly.

Good scenarios:

- Factory registration
- Generic service activation in middleware
- Background worker that needs a scope

Bad scenarios:

- Business layer classes using `IServiceProvider` directly
- Service locator anti-pattern

Example of acceptable provider use in factory:

```csharp
services.AddScoped<IEmailSender>(provider =>
{
    var config = provider.GetRequiredService<IOptions<EmailOptions>>();
    return config.Value.UseSendGrid
        ? new SendGridEmailSender(config.Value)
        : new SmtpEmailSender(config.Value);
});
```

### 4.5 `IServiceScopeFactory` and scope creation

In background services or hosted services you manually create a scope:

```csharp
public class Worker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public Worker(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.SaveChangesAsync(stoppingToken);
    }
}
```

---

## 5. Configuration: What Can Be Changed and When

### 5.1 Configuration sources

Common providers:

- `appsettings.json`
- `appsettings.{Environment}.json`
- `secrets.json` / user secrets
- Environment variables
- Command-line args
- Azure App Configuration
- Key Vault
- Custom providers (database, HTTP, etc.)

### 5.2 Options pattern

```csharp
public class DatabaseOptions
{
    public string ConnectionString { get; set; }
    public int MaxRetryCount { get; set; }
}

builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
```

Inject options anywhere:

```csharp
public class DatabaseService
{
    private readonly DatabaseOptions _options;

    public DatabaseService(IOptions<DatabaseOptions> options)
    {
        _options = options.Value;
    }
}
```

### 5.3 When config is evaluated

- `builder.Configuration` is built during host creation
- Values are read when injected or explicitly requested
- `IOptionsMonitor<T>` can refresh on change when reload is enabled

### 5.4 Replaceable components

You can replace or extend these components with 3rd party libraries:

- Logging: Serilog, NLog, Log4Net
- DI container: Autofac, SimpleInjector, Castle Windsor
- Configuration: Azure App Configuration, HashiCorp Vault providers, Consul
- Validation: FluentValidation, DataAnnotations, Ardalis.Specification
- HTTP: Polly, Resilience.Net, RestEase

Example using Autofac:

```csharp
builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());
builder.Host.ConfigureContainer<ContainerBuilder>(containerBuilder =>
{
    containerBuilder.RegisterType<ProductService>().As<IProductService>().InstancePerLifetimeScope();
});
```

---

## 6. Logging: What Is Created and When

### 6.1 Built-in logging flow

At host build time:

- `ILoggerFactory` is created
- providers are configured (`Console`, `Debug`, etc.)
- `ILogger<T>` is injected as needed

Example:

```csharp
public class PaymentService
{
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(ILogger<PaymentService> logger)
    {
        _logger = logger;
    }
}
```

### 6.2 Third-party logging providers

- `Serilog` - structured logging and sinks
- `NLog` - file, database, cloud sinks
- `Log4Net` - legacy enterprise support

```csharp
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .WriteTo.File("logs/app.log")
    .CreateLogger();

builder.Host.UseSerilog();
```

### 6.3 What can be configured

- Log levels by category
- Output format
- Enrichment (`MachineName`, `Environment`, `RequestId`)
- Sinks and destinations
- Filtering and scope

---

## 7. Web App Context and Injection Points

### 7.1 `HttpContext`

`HttpContext` is created per HTTP request.

Injected automatically into:

- Middleware
- Controllers
- Razor pages
- Razor views

Inside middleware:

```csharp
app.Use(async (context, next) =>
{
    var userAgent = context.Request.Headers["User-Agent"].ToString();
    context.Items["RequestStart"] = DateTime.UtcNow;
    await next();
});
```

### 7.2 `HttpContextAccessor`

Add if you need access to `HttpContext` outside controllers or middleware:

```csharp
builder.Services.AddHttpContextAccessor();

public class AuditService
{
    private readonly IHttpContextAccessor _accessor;

    public AuditService(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public string GetCurrentUser()
    {
        return _accessor.HttpContext?.User?.Identity?.Name;
    }
}
```

### 7.3 What can be injected anywhere

- `ILogger<T>`
- `IConfiguration`
- `IOptions<T>` / `IOptionsMonitor<T>`
- `IHostEnvironment` / `IWebHostEnvironment`
- `DbContext`
- `IHttpClientFactory`
- `IServiceProvider` / `IServiceScopeFactory` (use cautiously)

### 7.4 What can be injected in controllers

- services
- loggers
- options
- database contexts
- factories

Example:

```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        IOrderService orderService,
        ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }
}
```

### 7.5 Request services

Every request has a scoped `RequestServices` provider.

Use it only when needed, not as a default pattern.

```csharp
var service = context.RequestServices.GetRequiredService<IUserService>();
```

---

## 8. Middleware Pipeline: What Gets Created and When

### 8.1 Pipeline creation

`app.Use(...)` and `app.Map(...)` configure the pipeline before the server starts.

Each middleware is instantiated when the app builds, not per request.

### 8.2 Execution order

The pipeline is executed in registration order.

Example:

```csharp
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});
```

### 8.3 How middleware is created

- Middleware classes are instantiated once by DI
- If the middleware constructor takes services, they are resolved from the root provider
- The middleware `Invoke` method is executed per request

Example:

```csharp
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        _logger.LogInformation("Request: {Method} {Path}", context.Request.Method, context.Request.Path);
        await _next(context);
    }
}
```

Register:

```csharp
app.UseMiddleware<RequestLoggingMiddleware>();
```

### 8.4 Common middleware and their timing

- `UseHttpsRedirection()` - early
- `UseSerilogRequestLogging()` - early
- `UseRouting()` - before auth/authorization
- `UseAuthentication()` - before authorization
- `UseAuthorization()` - before endpoints
- `UseEndpoints()` / `MapControllers()` - last

---

## 9. Third-Party Components and When to Use Them

### 9.1 Dependency Injection containers

Built-in DI is powerful, but third-party containers add features:

- `Autofac` - modules, decorators, assembly scanning, property injection
- `SimpleInjector` - fast, strict lifestyle validation
- `Castle Windsor` - mature container with AOP
- `StructureMap` - older but still used in enterprise

Example using Autofac:

```csharp
builder.Host.UseServiceProviderFactory(new AutofacServiceProviderFactory());
builder.Host.ConfigureContainer<ContainerBuilder>(containerBuilder =>
{
    containerBuilder.RegisterType<OrderValidator>().As<IOrderValidator>().InstancePerLifetimeScope();
});
```

### 9.2 Logging providers

- `Serilog` - best when you need structured logs, sinks, and enrichment
- `NLog` - good for file and database logging
- `Log4Net` - used in legacy projects
- `Seq`, `ElasticSearch`, `Splunk` sinks for observability

### 9.3 Configuration extensions

- `Azure App Configuration` - central config store with feature flags
- `Azure Key Vault` - secure secrets provider
- `Consul` - distributed config and service discovery
- `Vault` - secrets and config management for multi-cloud

### 9.4 HTTP resiliency and policy

- `Polly` - retry, circuit breaker, timeout, bulkhead
- `Refit` / `RestEase` - typed REST clients
- `HttpClientFactory` - good default pattern for outgoing HTTP

### 9.5 Validation and mapping

- `FluentValidation` - expressive rules, fail-fast capability
- `AutoMapper` - object-object mapping
- `Mapster` - alternative mapper with compile-time config

### 9.6 Observability and metrics

- `Prometheus` / `OpenTelemetry` for metrics
- `Serilog`, `Application Insights`, `Seq`, `ElasticSearch` for logging
- `HealthChecks` UI for endpoint visibility

---

## 10. Exact Flow When a Request Arrives

1. Server receives request (Kestrel / IIS / HTTP.sys)
2. `HttpContext` is created
3. Request is matched to pipeline
4. Middleware executes sequentially
5. `UseRouting()` selects an endpoint
6. `UseAuthorization()` checks policies
7. Controller or endpoint delegate is invoked
8. Controller constructor dependencies resolved
9. Action executes
10. Response is written and returned

### When does a controller class get created?

A controller is created when a request needs it.

- constructor injection resolves dependencies
- a new controller instance is created per request
- services injected into the controller are resolved from the request scope

### When does a service get created?

- Singleton: once for the application lifetime
- Scoped: once per HTTP request or explicit scope
- Transient: each time requested

### Example request lifecycle in code

```csharp
app.MapGet("/orders/{id}", async (int id, IOrderService orders, ILogger<Program> logger) =>
{
    logger.LogInformation("Getting order {OrderId}", id);
    var order = await orders.GetByIdAsync(id);
    return order is not null ? Results.Ok(order) : Results.NotFound();
});
```

Here:

- `IOrderService` is resolved from DI
- `ILogger<Program>` is resolved from DI
- request data is bound to `id`

---

## 11. What Is Context in a Web App?

### 11.1 `HttpContext`

Contains request and response data for the current HTTP request.

Members:

- `Request`
- `Response`
- `User`
- `Items`
- `RequestServices`
- `TraceIdentifier`
- `Connection`

### 11.2 `RouteData`

Holds route values extracted from the request.

Example:

```csharp
var orderId = context.GetRouteValue("id");
```

### 11.3 `ActionContext` / `ControllerContext`

Specific to MVC controllers.

- includes `ModelState`
- includes `RouteData`
- includes `HttpContext`

### 11.4 `DbContext` and request scope

`DbContext` is usually registered as scoped.

This means:

- one `DbContext` instance per request
- all services in that request share the same context
- avoid using `DbContext` from singleton services

---

## 12. Best Practices

### 12.1 General architecture

- Keep `Program.cs` minimal
- Move registration logic to extension methods
- Separate configuration, services, middleware, and endpoint mapping
- Use feature folders or modules for organization
- Keep controllers thin

### 12.2 DI patterns

- Prefer constructor injection
- Avoid `IServiceProvider` in business logic
- Register interfaces, not concrete implementations
- Keep lifetimes consistent
- Validate DI configuration in startup

### 12.3 Logging and monitoring

- Use structured logging
- Log at appropriate levels
- Enrich logs with request and environment data
- Avoid logging secrets
- Use centralized log sinks in production

### 12.4 Configuration

- Keep configuration externalized
- Use `IOptions<T>` for typed settings
- Avoid `Configuration["..."]` littered throughout code
- Prefer `IOptions<T>`, `IOptionsMonitor<T>`, and `IOptionsSnapshot<T>`
- Use environment-specific files for deployment differences
- Keep secrets out of source control

### 12.5 Middleware and request flow

- Register middleware in the correct order
- Keep middleware small and focused
- Do not perform heavy business logic in middleware
- Use `UseEndpoints` / `MapControllers` as the terminal step

### 12.6 Security

- Validate all input at the edge
- Enforce HTTPS
- Use authentication and authorization middleware
- Protect secrets with Key Vault or environment variables
- Use managed identities for Azure resources

### 12.7 Performance

- Use async/await for I/O bound work
- Cache expensive data when safe
- Avoid expensive reflection on hot paths
- Use `IHttpClientFactory` for HTTP clients
- Use `DbContext` as scoped and avoid long-lived contexts

### 12.8 Practical advice for developers

- Read the generated startup flow when debugging startup issues
- Use logging and health checks to verify application readiness
- Keep controllers thin and delegate business logic to services
- Use feature-based registration to keep startup code readable
- Review lifetimes frequently; mismatches cause subtle bugs

---

## 13. Sentiment and Why This Matters

Your request is clearly about building confidence through deep understanding. Junior developers need more than copy-paste snippets; they need to know the exact object lifecycle, the points where runtime decisions are made, and when to trust the framework versus when to intervene.

This note is designed to be the one-stop documentation that answers "what happens first" and "why this registration matters".

## Summary

### The complete .NET Core flow covers:

- Host and builder creation
- Configuration and logging setup
- Dependency injection container construction
- Service lifetimes and instantiation timing
- Middleware pipeline assembly and execution
- Web application context and injection points
- Third-party DI, logging, config, resiliency, mapping extensions
- Best practices for maintainable enterprise applications

### Core lessons:

- `WebApplicationBuilder` builds the environment and collects registrations
- `builder.Build()` creates the service provider and final app object
- `HttpContext` is request-scoped and should not be cached globally
- Use DI everywhere, but use `IServiceProvider` only when needed
- Prefer typed options and structured logging
- Keep startup and middleware clean, not overloaded

This document now provides the complete internal flow for .NET Core, from startup to request completion, and is written to support both beginners and experienced team members looking for a definitive reference.
