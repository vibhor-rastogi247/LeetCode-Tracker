# Attributes, Middleware, Reflection, and Custom Implementations

## Attributes in .NET Core

Attributes are declarative tags that provide information about code. They don't directly affect code execution but are used by the runtime or tools.

### Built-in Attributes

```csharp
// ✅ Attribute examples

// Obsolete attribute - marks code as outdated
[Obsolete("Use GetUserAsync instead", false)]
public User GetUser(int id)
{
    return new User();
}

// Serialization attributes
[Serializable]
public class User
{
    [JsonPropertyName("userId")]
    public int Id { get; set; }
    
    [JsonIgnore]
    public string PasswordHash { get; set; }
}

// Validation attributes
public class UserCreateRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }
    
    [Range(18, 120, ErrorMessage = "Age must be between 18 and 120")]
    public int Age { get; set; }
    
    [StringLength(100, MinimumLength = 2)]
    public string FirstName { get; set; }
}

// Web API attributes
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(int id)
    {
        return Ok();
    }
}

// Method attributes
public class Service
{
    [Conditional("DEBUG")]
    public void LogDebugInfo(string message)
    {
        Console.WriteLine(message); // Only in DEBUG builds
    }
}

// Property attributes
public class Entity
{
    [Key]
    public int Id { get; set; }
    
    [Column(TypeName = "nvarchar(100)")]
    public string Name { get; set; }
    
    [Index(nameof(Email), IsUnique = true)]
    public string Email { get; set; }
    
    [NotMapped]
    public string TransientProperty { get; set; }
}
```

### Creating Custom Attributes

```csharp
// ✅ Simple custom attribute
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class LogExecutionTimeAttribute : Attribute
{
    public int WarningThresholdMs { get; set; } = 1000;
}

// Usage
[LogExecutionTime(WarningThresholdMs = 500)]
public class UserService
{
    [LogExecutionTime]
    public async Task<User> GetUserAsync(int id)
    {
        return new User();
    }
}

// ✅ Attribute with properties and constructors
[AttributeUsage(AttributeTargets.Class)]
public class ApiVersionAttribute : Attribute
{
    public string Version { get; }
    public string DeprecatedIn { get; set; }
    public bool IsDeprecated { get; set; }
    
    public ApiVersionAttribute(string version)
    {
        Version = version;
    }
}

[ApiVersion("1.0", DeprecatedIn = "2.0", IsDeprecated = false)]
public class UsersApiV1 { }

// ✅ Attribute for configuration
[AttributeUsage(AttributeTargets.Property)]
public class ConfigurationKeyAttribute : Attribute
{
    public string Key { get; }
    public string DefaultValue { get; set; }
    public bool Required { get; set; }
    
    public ConfigurationKeyAttribute(string key)
    {
        Key = key;
        Required = true;
    }
}

public class AppSettings
{
    [ConfigurationKey("database:connection", DefaultValue = "")]
    public string DatabaseConnection { get; set; }
    
    [ConfigurationKey("app:name")]
    public string AppName { get; set; }
}

// ✅ Validation attribute
[AttributeUsage(AttributeTargets.Property)]
public class UniqueEmailAttribute : ValidationAttribute
{
    private readonly IEmailService _emailService;
    
    public UniqueEmailAttribute(Type emailServiceType)
    {
        // Get service from DI container via reflection
    }
    
    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        if (value is not string email)
            return ValidationResult.Success;
        
        // In real implementation, check if email exists
        var exists = false; // await _emailService.EmailExistsAsync(email);
        
        if (exists)
        {
            return new ValidationResult(
                $"Email '{email}' is already in use.");
        }
        
        return ValidationResult.Success;
    }
}

// ✅ Authorization attribute
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequirePermissionAttribute : Attribute
{
    public string[] Permissions { get; }
    
    public RequirePermissionAttribute(params string[] permissions)
    {
        Permissions = permissions;
    }
}

[RequirePermission("user.read", "user.write")]
public void ModifyUser(User user) { }
```

### Reading Attributes Using Reflection

```csharp
public class AttributeReader
{
    public static void ReadClassAttributes()
    {
        var type = typeof(UsersController);
        
        // Get all attributes
        var attributes = type.GetCustomAttributes();
        
        foreach (var attr in attributes)
        {
            Console.WriteLine($"Attribute: {attr.GetType().Name}");
        }
        
        // Get specific attribute
        var routeAttr = type.GetCustomAttribute<RouteAttribute>();
        if (routeAttr != null)
        {
            Console.WriteLine($"Route: {routeAttr.Template}");
        }
    }
    
    public static void ReadMethodAttributes()
    {
        var method = typeof(UsersController)
            .GetMethod("GetUser");
        
        var attributes = method.GetCustomAttributes<LogExecutionTimeAttribute>();
        
        foreach (var attr in attributes)
        {
            Console.WriteLine(
                $"Warning Threshold: {attr.WarningThresholdMs}ms");
        }
    }
    
    public static void ReadPropertyAttributes()
    {
        var properties = typeof(AppSettings)
            .GetProperties();
        
        foreach (var prop in properties)
        {
            var configAttr = prop
                .GetCustomAttribute<ConfigurationKeyAttribute>();
            
            if (configAttr != null)
            {
                Console.WriteLine($"Property: {prop.Name}");
                Console.WriteLine($"Config Key: {configAttr.Key}");
                Console.WriteLine($"Required: {configAttr.Required}");
                Console.WriteLine($"Default: {configAttr.DefaultValue}");
            }
        }
    }
}
```

## Middleware in .NET Core

Middleware is software assembled into an application pipeline to handle requests and responses.

### Middleware Pipeline

```
Request → Middleware 1 → Middleware 2 → Middleware 3 → Endpoint → Response
```

### Built-in Middleware

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
    }
    
    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.Configure(app =>
                {
                    // Middleware order matters!
                    
                    // Development exception page
                    if (app.Environment.IsDevelopment())
                    {
                        app.UseDeveloperExceptionPage();
                    }
                    
                    // HTTPS redirection
                    app.UseHttpsRedirection();
                    
                    // Routing
                    app.UseRouting();
                    
                    // CORS
                    app.UseCors("AllowAll");
                    
                    // Authentication
                    app.UseAuthentication();
                    
                    // Authorization
                    app.UseAuthorization();
                    
                    // Endpoints
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapControllers();
                    });
                });
            });
}
```

### Creating Custom Middleware

#### Convention-Based Middleware

```csharp
// ✅ Simple middleware using convention
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
        _logger.LogInformation(
            $"Request: {context.Request.Method} {context.Request.Path}");
        
        await _next(context);
        
        _logger.LogInformation(
            $"Response: {context.Response.StatusCode}");
    }
}

// ✅ Middleware with dependencies
public class PerformanceLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PerformanceLoggingMiddleware> _logger;
    private readonly IPerformanceMonitor _monitor;
    
    public PerformanceLoggingMiddleware(
        RequestDelegate next,
        ILogger<PerformanceLoggingMiddleware> logger,
        IPerformanceMonitor monitor)
    {
        _next = next;
        _logger = logger;
        _monitor = monitor;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var timer = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            timer.Stop();
            
            if (timer.ElapsedMilliseconds > 1000)
            {
                _logger.LogWarning(
                    $"Slow request: {context.Request.Path} took {timer.ElapsedMilliseconds}ms");
            }
            
            await _monitor.RecordAsync(
                context.Request.Path,
                timer.ElapsedMilliseconds);
        }
    }
}

// Registration
public void Configure(IApplicationBuilder app)
{
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseMiddleware<PerformanceLoggingMiddleware>();
}
```

#### Factory-Based Middleware

```csharp
// ✅ Factory-based middleware
public class HeaderMiddleware
{
    public static IApplicationBuilder UseHeaderMiddleware(
        this IApplicationBuilder builder,
        string headerKey,
        string headerValue)
    {
        return builder.Use(async (context, next) =>
        {
            context.Response.Headers.Add(headerKey, headerValue);
            await next();
        });
    }
}

// Usage
app.UseHeaderMiddleware("X-Custom-Header", "MyValue");
```

#### Conditional Middleware

```csharp
// ✅ Conditional middleware execution
public class ConditionalMiddlewareExample
{
    public static IApplicationBuilder UseConditionalMiddleware(
        this IApplicationBuilder builder)
    {
        return builder.UseWhen(
            context => context.Request.Path.StartsWithSegments("/api"),
            appBuilder =>
            {
                appBuilder.UseMiddleware<ApiValidationMiddleware>();
                appBuilder.UseMiddleware<RateLimitingMiddleware>();
            });
    }
}
```

### Advanced Middleware Patterns

#### Exception Handling Middleware

```csharp
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    
    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
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
    
    private static Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = new ErrorResponse
        {
            Message = "An error occurred",
            StatusCode = context.Response.StatusCode
        };
        
        switch (exception)
        {
            case ValidationException ve:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response.Message = ve.Message;
                break;
            case UnauthorizedException ue:
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                response.Message = ue.Message;
                break;
            default:
                context.Response.StatusCode = 
                    StatusCodes.Status500InternalServerError;
                break;
        }
        
        return context.Response.WriteAsJsonAsync(response);
    }
}
```

#### Request/Response Logging Middleware

```csharp
public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestResponseLoggingMiddleware> _logger;
    
    public RequestResponseLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestResponseLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // Log request
        await LogRequestAsync(context);
        
        // Capture original response body stream
        var originalBodyStream = context.Response.Body;
        
        using (var responseBody = new MemoryStream())
        {
            context.Response.Body = responseBody;
            
            await _next(context);
            
            // Log response
            await LogResponseAsync(context);
            
            // Copy response to original stream
            await responseBody.CopyToAsync(originalBodyStream);
        }
    }
    
    private async Task LogRequestAsync(HttpContext context)
    {
        context.Request.EnableBuffering();
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
        context.Request.Body.Position = 0;
        
        _logger.LogInformation(
            $"Request: {context.Request.Method} {context.Request.Path}\n" +
            $"Body: {body}");
    }
    
    private async Task LogResponseAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        
        _logger.LogInformation(
            $"Response: {context.Response.StatusCode}\n" +
            $"Body: {body}");
    }
}
```

#### Rate Limiting Middleware

```csharp
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimitStore _store;
    
    public RateLimitingMiddleware(RequestDelegate next, IRateLimitStore store)
    {
        _next = next;
        _store = store;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var clientId = GetClientId(context);
        var isAllowed = await _store.IsRequestAllowedAsync(clientId);
        
        if (!isAllowed)
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.Headers.Add("Retry-After", "60");
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
        }
        
        await _next(context);
    }
    
    private string GetClientId(HttpContext context)
    {
        return context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? context.Connection.RemoteIpAddress.ToString();
    }
}

public interface IRateLimitStore
{
    Task<bool> IsRequestAllowedAsync(string clientId);
}
```

## Reflection in .NET Core

Reflection allows you to inspect and interact with types, methods, properties, and other metadata at runtime.

### When to Use Reflection

```csharp
// ✅ GOOD - Acceptable uses of reflection

// 1. Dependency Injection container
public class SimpleContainer
{
    private readonly Dictionary<Type, Type> _registrations = new();
    
    public void Register<TInterface, TImplementation>()
        where TImplementation : TInterface
    {
        _registrations[typeof(TInterface)] = typeof(TImplementation);
    }
    
    public object Resolve(Type type)
    {
        if (_registrations.TryGetValue(type, out var implementationType))
        {
            var constructor = implementationType.GetConstructors().First();
            var parameters = constructor.GetParameters();
            var parameterInstances = parameters
                .Select(p => Resolve(p.ParameterType))
                .ToArray();
            
            return Activator.CreateInstance(implementationType, parameterInstances);
        }
        
        return Activator.CreateInstance(type);
    }
}

// 2. Auto-mapping implementation
public class SimpleMapper
{
    public static TDestination Map<TSource, TDestination>(TSource source)
        where TDestination : new()
    {
        var destination = new TDestination();
        var sourceProperties = typeof(TSource).GetProperties();
        var destProperties = typeof(TDestination).GetProperties();
        
        foreach (var sourceProp in sourceProperties)
        {
            var destProp = destProperties
                .FirstOrDefault(p => p.Name == sourceProp.Name);
            
            if (destProp != null && destProp.CanWrite)
            {
                var value = sourceProp.GetValue(source);
                destProp.SetValue(destination, value);
            }
        }
        
        return destination;
    }
}

// 3. Validation framework
public class ReflectionValidator
{
    public IEnumerable<ValidationError> Validate<T>(T obj)
    {
        var errors = new List<ValidationError>();
        var properties = typeof(T).GetProperties();
        
        foreach (var property in properties)
        {
            var attributes = property
                .GetCustomAttributes<ValidationAttribute>();
            
            foreach (var attr in attributes)
            {
                var value = property.GetValue(obj);
                var context = new ValidationContext(obj) 
                { 
                    MemberName = property.Name 
                };
                
                if (!attr.IsValid(value))
                {
                    errors.Add(new ValidationError
                    {
                        Property = property.Name,
                        Message = attr.FormatErrorMessage(property.Name)
                    });
                }
            }
        }
        
        return errors;
    }
}

// 4. ORM/EF Core configuration
public class EntityConfiguration
{
    public void ConfigureModelBuilder(ModelBuilder modelBuilder, Assembly assembly)
    {
        var entityTypes = assembly.GetTypes()
            .Where(t => typeof(IEntity).IsAssignableFrom(t) && !t.IsAbstract);
        
        foreach (var entityType in entityTypes)
        {
            modelBuilder.Model.AddEntityType(entityType);
        }
    }
}
```

### When NOT to Use Reflection

```csharp
// ❌ AVOID - Performance-critical code
public class BadReflectionUsage
{
    // Slow - reflection overhead in tight loop
    public void SlowPropertyAccess<T>(T obj, string propertyName)
    {
        var prop = typeof(T).GetProperty(propertyName);
        for (int i = 0; i < 1000000; i++)
        {
            var value = prop.GetValue(obj); // Very slow!
        }
    }
    
    // Better - cache the property info
    public void BetterPropertyAccess<T>(T obj, string propertyName)
    {
        var prop = typeof(T).GetProperty(propertyName);
        var getter = prop.GetGetMethod().CreateDelegate(
            typeof(Func<T, object>)) as Func<T, object>;
        
        for (int i = 0; i < 1000000; i++)
        {
            var value = getter(obj); // Faster
        }
    }
}

// ❌ AVOID - When compile-time alternatives exist
public class BadDynamicReflection
{
    // Don't do this
    public object CallMethod(object obj, string methodName)
    {
        return obj.GetType()
            .GetMethod(methodName)
            .Invoke(obj, null);
    }
    
    // Do this instead
    public T CallMethod<T>(object obj) where T : class
    {
        if (obj is T result)
            return result;
        
        throw new InvalidOperationException();
    }
}

// ❌ AVOID - When you can use interfaces
public class BadTypeChecking
{
    // Don't do this
    public void ProcessObject(object obj)
    {
        var type = obj.GetType();
        
        if (type.Name == "User")
        {
            // Process user
        }
        else if (type.Name == "Order")
        {
            // Process order
        }
    }
    
    // Do this instead
    public interface IProcessable { }
    
    public class User : IProcessable { }
    public class Order : IProcessable { }
    
    public void ProcessObject(IProcessable obj)
    {
        switch (obj)
        {
            case User user:
                // Process user
                break;
            case Order order:
                // Process order
                break;
        }
    }
}
```

### Reflection Performance Optimization

```csharp
public class ReflectionPerformance
{
    // ❌ SLOW - Direct reflection every time
    public class SlowApproach
    {
        public object GetPropertyValue(object obj, string propertyName)
        {
            return obj.GetType()
                .GetProperty(propertyName)
                .GetValue(obj); // Reflection on every call
        }
    }
    
    // ✅ FAST - Cache delegates
    public class FastApproach
    {
        private readonly Dictionary<(Type, string), Delegate> _propertyAccessors = new();
        
        public object GetPropertyValue(object obj, string propertyName)
        {
            var type = obj.GetType();
            var key = (type, propertyName);
            
            if (!_propertyAccessors.TryGetValue(key, out var accessor))
            {
                var prop = type.GetProperty(propertyName);
                accessor = CreateGetter(type, prop);
                _propertyAccessors[key] = accessor;
            }
            
            var getter = (Func<object, object>)accessor;
            return getter(obj);
        }
        
        private Delegate CreateGetter(Type type, PropertyInfo property)
        {
            var parameter = Expression.Parameter(typeof(object), "obj");
            var cast = Expression.Convert(parameter, type);
            var access = Expression.MakeMemberAccess(cast, property);
            var convert = Expression.Convert(access, typeof(object));
            
            return Expression.Lambda<Func<object, object>>(
                convert,
                parameter).Compile();
        }
    }
}
```

### Reflection Use Cases with Examples

#### 1. Service Location and Activation

```csharp
public class ActivatorUtilities
{
    public static T CreateInstance<T>(IServiceProvider provider)
    {
        var type = typeof(T);
        var constructors = type.GetConstructors();
        
        if (constructors.Length == 0)
            throw new InvalidOperationException($"No constructors found for {type.Name}");
        
        var constructor = constructors[0];
        var parameters = constructor.GetParameters();
        var parameterInstances = parameters
            .Select(p => provider.GetService(p.ParameterType) 
                ?? Activator.CreateInstance(p.ParameterType))
            .ToArray();
        
        return (T)Activator.CreateInstance(type, parameterInstances);
    }
}
```

#### 2. Metadata Discovery

```csharp
public class AttributeDiscovery
{
    public static IEnumerable<(Type Type, T Attribute)> FindTypesWithAttribute<T>(
        Assembly assembly) where T : Attribute
    {
        return assembly.GetTypes()
            .Select(type => (
                Type: type,
                Attribute: type.GetCustomAttribute<T>()
            ))
            .Where(x => x.Attribute != null);
    }
    
    public static IEnumerable<MethodInfo> FindMethodsWithAttribute<T>(
        Type type) where T : Attribute
    {
        return type.GetMethods()
            .Where(m => m.GetCustomAttribute<T>() != null);
    }
}
```

#### 3. Property Binding

```csharp
public class PropertyBinder
{
    public static void BindProperties<T>(T instance, Dictionary<string, object> values)
    {
        var type = typeof(T);
        var properties = type.GetProperties();
        
        foreach (var property in properties)
        {
            if (values.TryGetValue(property.Name, out var value))
            {
                if (property.CanWrite && value != null)
                {
                    var convertedValue = Convert.ChangeType(
                        value,
                        property.PropertyType);
                    
                    property.SetValue(instance, convertedValue);
                }
            }
        }
    }
}
```

## Summary: When to Use What

| Technique | Use Case | Avoid |
|-----------|----------|-------|
| **Attributes** | Metadata, configuration, validation | Don't overuse; keep logic simple |
| **Middleware** | Cross-cutting concerns, logging, auth | Don't use for business logic |
| **Reflection** | DI, discovery, serialization | Performance-critical code |
| **Custom Middleware** | Request/response handling | Don't block thread indefinitely |

