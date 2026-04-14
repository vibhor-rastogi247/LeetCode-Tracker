# Polly, AutoMapper, and Validation in .NET Core

## Polly: Resilience and Chaos Engineering

Polly is a .NET resilience and transient-fault-handling library that allows you to express policies such as Retry, Circuit Breaker, Timeout, Bulkhead Isolation, and Fallback in a fluent and thread-safe manner.

### Polly Installation

```bash
dotnet add package Polly
dotnet add package Polly.CircuitBreaker
dotnet add package Polly.Retry
dotnet add package Polly.Timeout
dotnet add package Polly.RateLimit
```

### Core Polly Concepts

#### 1. Retry Policy

```csharp
public class RetryPolicyExample
{
    // Simple retry - fixed count
    public static IAsyncPolicy<HttpResponseMessage> GetSimpleRetryPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .RetryAsync(retryCount: 3);
    }
    
    // Exponential backoff retry
    public static IAsyncPolicy<HttpResponseMessage> GetExponentialBackoffPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .WaitAndRetryAsync(
                retryCount: 5,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    Console.WriteLine(
                        $"Retry {retryCount} after {timespan.TotalSeconds}s. " +
                        $"Reason: {outcome.Exception?.Message}");
                });
    }
    
    // Linear backoff retry
    public static IAsyncPolicy<HttpResponseMessage> GetLinearBackoffPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .WaitAndRetryAsync(
                retryCount: 4,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(retryAttempt * 2));
    }
    
    // Retry with jitter (randomization)
    public static IAsyncPolicy<HttpResponseMessage> GetRetryWithJitterPolicy()
    {
        var jitter = new Random();
        
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                {
                    var exponentialWait = Math.Pow(2, retryAttempt);
                    var jitterMs = jitter.Next(0, 1000);
                    return TimeSpan.FromSeconds(exponentialWait)
                        .Add(TimeSpan.FromMilliseconds(jitterMs));
                });
    }
}
```

#### 2. Circuit Breaker Policy

```csharp
public class CircuitBreakerPolicyExample
{
    // Break after failure threshold
    public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, timespan) =>
                {
                    Console.WriteLine(
                        $"Circuit breaker opened for {timespan.TotalSeconds}s");
                },
                onReset: () =>
                {
                    Console.WriteLine("Circuit breaker reset");
                });
    }
    
    // Advanced circuit breaker with failure threshold percentage
    public static IAsyncPolicy<HttpResponseMessage> GetAdvancedCircuitBreakerPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .AdvancedCircuitBreakerAsync(
                failureThreshold: 0.5, // Break at 50% failure rate
                samplingDuration: TimeSpan.FromSeconds(30),
                minimumThroughput: 10, // Minimum requests to measure
                durationOfBreak: TimeSpan.FromSeconds(60),
                onBreak: (outcome, timespan) =>
                {
                    Console.WriteLine(
                        $"Circuit breaker opened. Failure: {outcome.Result}");
                });
    }
}
```

#### 3. Timeout Policy

```csharp
public class TimeoutPolicyExample
{
    // Optimistic timeout
    public static IAsyncPolicy<HttpResponseMessage> GetOptimisticTimeoutPolicy()
    {
        return Policy.TimeoutAsync<HttpResponseMessage>(
            TimeSpan.FromSeconds(10),
            timeoutStrategy: TimeoutStrategy.Optimistic);
    }
    
    // Pessimistic timeout (cancels operation)
    public static IAsyncPolicy<HttpResponseMessage> GetPessimisticTimeoutPolicy()
    {
        return Policy.TimeoutAsync<HttpResponseMessage>(
            TimeSpan.FromSeconds(5),
            timeoutStrategy: TimeoutStrategy.Pessimistic);
    }
    
    // With callback on timeout
    public static IAsyncPolicy<HttpResponseMessage> GetTimeoutWithCallbackPolicy()
    {
        return Policy.TimeoutAsync<HttpResponseMessage>(
            TimeSpan.FromSeconds(10),
            onTimeoutAsync: (context, timespan, task, exception) =>
            {
                Console.WriteLine($"Request timed out after {timespan.TotalSeconds}s");
                return Task.CompletedTask;
            });
    }
}
```

#### 4. Bulkhead Isolation Policy

```csharp
public class BulkheadPolicyExample
{
    // Isolate resources to prevent cascade failures
    public static IAsyncPolicy<HttpResponseMessage> GetBulkheadPolicy()
    {
        return Policy.BulkheadAsync<HttpResponseMessage>(
            parallelizationLimit: 10,
            queueingStrategy: QueueingStrategy.Queue,
            maxQueueingActions: 50,
            onBulkheadRejectedAsyncAction: context =>
            {
                Console.WriteLine("Request rejected due to bulkhead isolation");
                return Task.CompletedTask;
            });
    }
}
```

#### 5. Fallback Policy

```csharp
public class FallbackPolicyExample
{
    // Return default value on failure
    public static IAsyncPolicy<HttpResponseMessage> GetFallbackPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .FallbackAsync(
                fallbackValue: new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                {
                    Content = new StringContent("Service temporarily unavailable")
                },
                onFallbackAsync: (outcome, context) =>
                {
                    Console.WriteLine("Using fallback response");
                    return Task.CompletedTask;
                });
    }
    
    // Fallback with dynamic value
    public static IAsyncPolicy<HttpResponseMessage> GetDynamicFallbackPolicy()
    {
        return Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .FallbackAsync(async context =>
            {
                // Attempt to get cached response
                var cached = await GetCachedResponseAsync(context);
                return cached ?? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);
            });
    }
}
```

### Policy Wrapping (Combining Policies)

```csharp
public class PolicyWrappingExample
{
    public static IAsyncPolicy<HttpResponseMessage> GetCombinedPolicy()
    {
        // Individual policies
        var retryPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));
        
        var circuitBreakerPolicy = Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30));
        
        var timeoutPolicy = Policy
            .TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10));
        
        // Combine policies - execution order matters!
        // 1. Timeout
        // 2. CircuitBreaker
        // 3. Retry
        return Policy.WrapAsync(
            timeoutPolicy,
            circuitBreakerPolicy,
            retryPolicy);
    }
}
```

### Using Polly with HttpClientFactory

```csharp
public class PollyHttpClientSetup
{
    public static IServiceCollection AddResilientHttpClient(
        this IServiceCollection services)
    {
        services.AddHttpClient<IExternalApiClient, ExternalApiClient>()
            .AddTransientHttpErrorPolicy(p =>
                p.WaitAndRetryAsync(
                    retryCount: 3,
                    sleepDurationProvider: attempt =>
                        TimeSpan.FromSeconds(Math.Pow(2, attempt))))
            .AddTransientHttpErrorPolicy(p =>
                p.CircuitBreakerAsync(
                    handledEventsAllowedBeforeBreaking: 5,
                    durationOfBreak: TimeSpan.FromSeconds(30)));
        
        return services;
    }
}

public interface IExternalApiClient
{
    Task<ApiResponse> GetDataAsync(string endpoint);
}

public class ExternalApiClient : IExternalApiClient
{
    private readonly HttpClient _httpClient;
    
    public ExternalApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
    
    public async Task<ApiResponse> GetDataAsync(string endpoint)
    {
        var response = await _httpClient.GetAsync(endpoint);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsAsync<ApiResponse>();
    }
}

// In Program.cs
builder.Services.AddResilientHttpClient();
```

### Context and Policy Execution

```csharp
public class PolicyContextExample
{
    public static async Task ExecuteWithContext()
    {
        var policy = Policy
            .HandleResult<string>(r => r == null)
            .RetryAsync(2);
        
        var context = new Context
        {
            { "userId", 123 },
            { "operationId", Guid.NewGuid() }
        };
        
        var result = await policy.ExecuteAsync(
            async ctx =>
            {
                var userId = (int)ctx["userId"];
                var operationId = (Guid)ctx["operationId"];
                
                return await GetUserDataAsync(userId);
            },
            context);
    }
}
```

## AutoMapper: Object Mapping

AutoMapper is a convention-based object mapping library for .NET that helps you map objects from one type to another.

### AutoMapper Installation

```bash
dotnet add package AutoMapper
dotnet add package AutoMapper.Extensions.Microsoft.DependencyInjection
```

### Basic Configuration

```csharp
// Define mapping profiles
public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        // Simple mapping
        CreateMap<User, UserDto>();
        
        // Reverse mapping
        CreateMap<UserDto, User>();
        
        // Custom mapping
        CreateMap<User, UserDetailedDto>()
            .ForMember(dest => dest.FullName,
                opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
            .ForMember(dest => dest.Email,
                opt => opt.MapFrom(src => src.ContactInfo.Email))
            .ReverseMap();
        
        // Conditional mapping
        CreateMap<Order, OrderDto>()
            .ForMember(dest => dest.CustomerName,
                opt => opt.Condition(src => src.Customer != null))
            .ForMember(dest => dest.CustomerName,
                opt => opt.MapFrom(src => src.Customer.Name));
    }
}

// Dependency injection setup
public static IServiceCollection AddAutoMapperProfiles(
    this IServiceCollection services)
{
    services.AddAutoMapper(typeof(Program));
    return services;
}

// Usage in Program.cs
builder.Services.AddAutoMapperProfiles();
```

### Advanced AutoMapper Patterns

#### Custom Value Resolvers

```csharp
public class CustomResolverExample
{
    // Define resolver
    public class FullNameResolver : IValueResolver<User, UserDto, string>
    {
        public string Resolve(
            User source,
            UserDto destination,
            string destMember,
            ResolutionContext context)
        {
            return $"{source.FirstName} {source.LastName}".Trim();
        }
    }
    
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.FullName,
                    opt => opt.MapFrom<FullNameResolver>());
        }
    }
}
```

#### Type Converters

```csharp
public class TypeConverterExample
{
    public class DateTimeToStringConverter : ITypeConverter<DateTime, string>
    {
        public string Convert(
            DateTime source,
            string destination,
            ResolutionContext context)
        {
            return source.ToString("yyyy-MM-dd");
        }
    }
    
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<DateTime, string>()
                .ConvertUsing<DateTimeToStringConverter>();
        }
    }
}
```

#### Member Mapping Options

```csharp
public class MemberMappingExample
{
    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public DateTime CreatedDate { get; set; }
    }
    
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, UserDto>()
                // Ignore property
                .ForMember(dest => dest.CreatedDate,
                    opt => opt.Ignore())
                
                // Allow null
                .ForMember(dest => dest.FullName,
                    opt => opt.AllowNull())
                
                // Use fallback value
                .ForMember(dest => dest.FullName,
                    opt => opt.MapFrom(src => src.FirstName ?? "Unknown"))
                
                // Map from different source
                .ForMember(dest => dest.FullName,
                    opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                
                // Pre/Post transformation
                .ForMember(dest => dest.FullName,
                    opt =>
                    {
                        opt.PreCondition(src => src.FirstName != null);
                        opt.MapFrom(src => src.FirstName.ToUpper());
                    });
        }
    }
}
```

#### Nested Object Mapping

```csharp
public class NestedMappingExample
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public Address Address { get; set; }
    }
    
    public class Address
    {
        public string Street { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
    }
    
    public class UserDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public AddressDto Address { get; set; }
    }
    
    public class AddressDto
    {
        public string Street { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
    }
    
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Nested mapping happens automatically
            CreateMap<Address, AddressDto>();
            CreateMap<User, UserDto>();
        }
    }
}
```

#### Collection Mapping

```csharp
public class CollectionMappingExample
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Automatic collection mapping
            CreateMap<List<User>, List<UserDto>>();
            
            // IEnumerable mapping
            CreateMap<IEnumerable<User>, IEnumerable<UserDto>>();
            
            // With custom items mapping
            CreateMap<User[], UserDto[]>();
            
            // Collection with custom item mapping
            CreateMap<Order, OrderDto>()
                .ForMember(dest => dest.Items,
                    opt => opt.MapFrom(src => src.Items
                        .Where(i => i.IsActive)
                        .ToList()));
        }
    }
}
```

## Validation in .NET Core

### FluentValidation Library

FluentValidation is a popular, fluent validation library for .NET.

```bash
dotnet add package FluentValidation
dotnet add package FluentValidation.DependencyInjectionExtensions
```

### FluentValidation Basics

```csharp
public class UserValidator : AbstractValidator<UserCreateRequest>
{
    public UserValidator()
    {
        // String validation
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .Length(2, 100).WithMessage("First name must be between 2 and 100 characters")
            .Matches(@"^[a-zA-Z\s]*$").WithMessage("First name can only contain letters");
        
        RuleFor(x => x.LastName)
            .NotEmpty()
            .Length(2, 100);
        
        // Email validation
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email must be valid")
            .Matches(@"^[^@\s]+@[^@\s]+\.[^@\s]+$").WithMessage("Invalid email format");
        
        // Numeric validation
        RuleFor(x => x.Age)
            .InclusiveBetween(18, 120).WithMessage("Age must be between 18 and 120");
        
        // Condition-based validation
        RuleFor(x => x.Phone)
            .NotEmpty().When(x => x.PhoneRequired)
            .WithMessage("Phone is required when marked as required");
        
        // Cross-field validation
        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords must match");
        
        // Custom validation
        RuleFor(x => x.Username)
            .MustAsync(async (username, cancellation) =>
            {
                var exists = await UsernameExistsAsync(username);
                return !exists;
            })
            .WithMessage("Username already taken");
    }
    
    private async Task<bool> UsernameExistsAsync(string username)
    {
        // Check database
        return false;
    }
}

public class UserCreateRequest
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public int Age { get; set; }
    public string Phone { get; set; }
    public bool PhoneRequired { get; set; }
    public string Password { get; set; }
    public string ConfirmPassword { get; set; }
    public string Username { get; set; }
}
```

### Dependency Injection and Validation

```csharp
// Register validators
public static IServiceCollection AddValidators(
    this IServiceCollection services)
{
    services.AddValidatorsFromAssembly(typeof(Program).Assembly);
    return services;
}

// In Program.cs
builder.Services.AddValidators();

// Using in controller
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IValidator<UserCreateRequest> _validator;
    
    public UsersController(IValidator<UserCreateRequest> validator)
    {
        _validator = validator;
    }
    
    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] UserCreateRequest request)
    {
        var validationResult = await _validator.ValidateAsync(request);
        
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors
                .GroupBy(x => x.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.ErrorMessage).ToArray());
            
            return BadRequest(new { errors });
        }
        
        // Create user
        return Ok();
    }
}
```

### Advanced Validation Scenarios

```csharp
public class AdvancedValidationExample
{
    public class OrderValidator : AbstractValidator<Order>
    {
        public OrderValidator(IOrderRepository orderRepository)
        {
            RuleFor(x => x.CustomerEmail)
                .EmailAddress()
                .MustAsync(async (email, ct) =>
                {
                    var customer = await orderRepository
                        .GetCustomerByEmailAsync(email);
                    return customer != null;
                })
                .WithMessage("Customer not found");
            
            // Nested validation
            RuleForEach(x => x.Items)
                .SetValidator(new OrderItemValidator());
            
            // Include validator
            RuleFor(x => x.BillingAddress)
                .SetValidator(new AddressValidator());
            
            RuleFor(x => x.ShippingAddress)
                .SetValidator(new AddressValidator())
                .When(x => x.UseShippingAddress);
            
            // Complex rule
            RuleFor(x => x)
                .Custom((order, context) =>
                {
                    if (order.Items.Count == 0)
                    {
                        context.AddFailure("Items", "Order must contain at least one item");
                    }
                    
                    var totalPrice = order.Items.Sum(i => i.Price * i.Quantity);
                    if (totalPrice > 10000)
                    {
                        context.AddFailure(
                            "Items",
                            "Total order value cannot exceed 10000");
                    }
                });
        }
    }
    
    public class AddressValidator : AbstractValidator<Address>
    {
        public AddressValidator()
        {
            RuleFor(x => x.Street).NotEmpty();
            RuleFor(x => x.City).NotEmpty();
            RuleFor(x => x.Country).NotEmpty();
            RuleFor(x => x.PostalCode)
                .NotEmpty()
                .Matches(@"^\d{5}$").WithMessage("Invalid postal code format");
        }
    }
}
```

### Validation Middleware

```csharp
public class ValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ValidationMiddleware> _logger;
    
    public ValidationMiddleware(RequestDelegate next, ILogger<ValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        // This would require request body reading logic
        // Generally, validation should happen in controllers
        await _next(context);
    }
}

// Alternative: Use a behavior in MediatR pipeline
public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;
    
    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }
    
    public async Task<TResponse> Handle(
        TRequest request,
        CancellationToken cancellationToken,
        RequestHandlerDelegate<TResponse> next)
    {
        var validationResults = await Task.WhenAll(
            _validators.Select(v => v.ValidateAsync(request, cancellationToken)));
        
        var failures = validationResults
            .Where(r => r.Errors.Count != 0)
            .SelectMany(r => r.Errors)
            .ToList();
        
        if (failures.Count != 0)
        {
            throw new ValidationException(failures);
        }
        
        return await next();
    }
}
```

## Polly + AutoMapper + Validation Integration

```csharp
public class IntegratedExample
{
    // Service using all three
    public class UserService : IUserService
    {
        private readonly IExternalApiClient _apiClient;
        private readonly IMapper _mapper;
        private readonly IValidator<UserCreateRequest> _validator;
        
        public UserService(
            IExternalApiClient apiClient,
            IMapper mapper,
            IValidator<UserCreateRequest> validator)
        {
            _apiClient = apiClient;
            _mapper = mapper;
            _validator = validator;
        }
        
        public async Task<UserDto> CreateUserAsync(UserCreateRequest request)
        {
            // 1. Validate
            var validationResult = await _validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }
            
            // 2. Call external API (with Polly resilience)
            var externalUser = await _apiClient.GetUserAsync(request.Email);
            
            // 3. Map
            var user = _mapper.Map<User>(request);
            
            return _mapper.Map<UserDto>(user);
        }
    }
}
```

## Best Practices Summary

### Polly
- Always use policies for external API calls
- Combine policies for comprehensive resilience
- Monitor circuit breaker state
- Use appropriate timeouts
- Test failure scenarios

### AutoMapper
- Keep mapping profiles organized by feature
- Use ReverseMap() for bidirectional mapping
- Validate mapping configuration at startup
- Avoid mapping domain entities directly to DTOs
- Use projection for complex queries

### Validation
- Always validate user input
- Use FluentValidation for complex business rules
- Implement async validation for database lookups
- Validate at API boundary
- Return meaningful error messages
