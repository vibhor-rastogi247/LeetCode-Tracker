# Enterprise .NET Core Architecture and Best Practices

## Complete Example: Building a Scalable .NET Core Application

This document demonstrates how to integrate all the concepts covered in this guide into a production-ready enterprise application.

### Project Structure

```
MyEnterpriseApp/
├── src/
│   ├── MyApp.Domain/
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Specifications/
│   │   └── Interfaces/
│   ├── MyApp.Application/
│   │   ├── Commands/
│   │   ├── Queries/
│   │   ├── Services/
│   │   ├── Validators/
│   │   ├── Mappings/
│   │   ├── Behaviors/
│   │   └── Exceptions/
│   ├── MyApp.Infrastructure/
│   │   ├── Data/
│   │   │   ├── Contexts/
│   │   │   └── Repositories/
│   │   ├── Services/
│   │   ├── Logging/
│   │   ├── Caching/
│   │   ├── Email/
│   │   └── ExternalApis/
│   ├── MyApp.Presentation/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Filters/
│   │   └── Attributes/
│   └── MyApp.Shared/
│       ├── Dtos/
│       ├── Constants/
│       ├── Extensions/
│       └── Utilities/
└── tests/
    ├── MyApp.UnitTests/
    ├── MyApp.IntegrationTests/
    └── MyApp.FunctionalTests/
```

## Domain Layer

### Entity Definition

```csharp
// Entities should be persistence-ignorant
public class Order : AggregateRoot
{
    public int Id { get; private set; }
    public string OrderNumber { get; private set; }
    public DateTime OrderDate { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money Total { get; private set; }
    
    private readonly List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();
    
    public int CustomerId { get; private set; }
    
    // Factory method
    public static Order Create(
        string orderNumber,
        int customerId,
        IEnumerable<(ProductId Id, Quantity Quantity, Price Price)> items)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            throw new ArgumentException("Order number is required", nameof(orderNumber));
        
        if (!items.Any())
            throw new ArgumentException("Order must contain items", nameof(items));
        
        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = customerId,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending
        };
        
        foreach (var (productId, quantity, price) in items)
        {
            order.AddItem(productId, quantity, price);
        }
        
        order.RaiseDomainEvent(new OrderCreatedEvent(order.Id, customerId));
        
        return order;
    }
    
    public void AddItem(ProductId productId, Quantity quantity, Price price)
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Cannot add items to non-pending order");
        
        var existingItem = _items.FirstOrDefault(i => i.ProductId == productId);
        
        if (existingItem != null)
        {
            existingItem.IncrementQuantity(quantity);
        }
        else
        {
            _items.Add(OrderItem.Create(productId, quantity, price));
        }
    }
    
    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new InvalidOperationException("Only pending orders can be confirmed");
        
        Status = OrderStatus.Confirmed;
        RaiseDomainEvent(new OrderConfirmedEvent(Id, Total));
    }
}

public enum OrderStatus
{
    Pending,
    Confirmed,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}

// Value Object
public sealed class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }
    
    public Money(decimal amount, string currency = "USD")
    {
        if (amount < 0)
            throw new ArgumentException("Amount cannot be negative", nameof(amount));
        
        if (string.IsNullOrWhiteSpace(currency))
            throw new ArgumentException("Currency is required", nameof(currency));
        
        Amount = amount;
        Currency = currency;
    }
    
    public static Money operator +(Money left, Money right)
    {
        if (left.Currency != right.Currency)
            throw new InvalidOperationException("Cannot add money in different currencies");
        
        return new Money(left.Amount + right.Amount, left.Currency);
    }
    
    protected override IEnumerable<object> GetAtomicValues()
    {
        yield return Amount;
        yield return Currency;
    }
}
```

### Domain Events

```csharp
public abstract class DomainEvent
{
    public Guid AggregateId { get; protected set; }
    public DateTime OccurredAt { get; private set; } = DateTime.UtcNow;
}

public class OrderCreatedEvent : DomainEvent
{
    public int CustomerId { get; }
    
    public OrderCreatedEvent(int aggregateId, int customerId)
    {
        AggregateId = Guid.NewGuid();
        CustomerId = customerId;
    }
}

public class OrderConfirmedEvent : DomainEvent
{
    public Money Total { get; }
    
    public OrderConfirmedEvent(int aggregateId, Money total)
    {
        AggregateId = Guid.NewGuid();
        Total = total;
    }
}

// Domain event handler
public class OrderCreatedEventHandler : IDomainEventHandler<OrderCreatedEvent>
{
    private readonly IEmailService _emailService;
    private readonly ILogger<OrderCreatedEventHandler> _logger;
    
    public OrderCreatedEventHandler(
        IEmailService emailService,
        ILogger<OrderCreatedEventHandler> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }
    
    public async Task HandleAsync(OrderCreatedEvent @event)
    {
        _logger.LogInformation(
            "Order created event received for customer {@CustomerId}",
            @event.CustomerId);
        
        await _emailService.SendOrderConfirmationAsync(@event.CustomerId);
    }
}
```

## Application Layer

### MediatR Commands and Queries

```csharp
// Create order command
public record CreateOrderCommand(
    int CustomerId,
    string OrderNumber,
    List<CreateOrderItemDto> Items) : IRequest<OrderDto>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IOrderRepository _repository;
    private readonly IValidator<CreateOrderCommand> _validator;
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateOrderCommandHandler> _logger;
    
    public CreateOrderCommandHandler(
        IOrderRepository repository,
        IValidator<CreateOrderCommand> validator,
        IMapper mapper,
        IUnitOfWork unitOfWork,
        ILogger<CreateOrderCommandHandler> logger)
    {
        _repository = repository;
        _validator = validator;
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }
    
    public async Task<OrderDto> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Validate
        var validationResult = await _validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }
        
        try
        {
            // 2. Create aggregate
            var order = Order.Create(
                request.OrderNumber,
                request.CustomerId,
                request.Items.Select(item => (
                    new ProductId(item.ProductId),
                    new Quantity(item.Quantity),
                    new Price(item.Price)
                ))
            );
            
            // 3. Add to repository
            await _repository.AddAsync(order, cancellationToken);
            
            // 4. Commit transaction
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            
            _logger.LogInformation(
                "Order {@OrderNumber} created successfully for customer {@CustomerId}",
                request.OrderNumber,
                request.CustomerId);
            
            // 5. Map to DTO
            return _mapper.Map<OrderDto>(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error creating order {@OrderNumber}",
                request.OrderNumber);
            throw;
        }
    }
}

// Query example
public record GetOrderQuery(int OrderId) : IRequest<OrderDto>;

public class GetOrderQueryHandler : IRequestHandler<GetOrderQuery, OrderDto>
{
    private readonly IOrderRepository _repository;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache;
    
    public GetOrderQueryHandler(
        IOrderRepository repository,
        IMapper mapper,
        ICacheService cache)
    {
        _repository = repository;
        _mapper = mapper;
        _cache = cache;
    }
    
    public async Task<OrderDto> Handle(
        GetOrderQuery request,
        CancellationToken cancellationToken)
    {
        var cacheKey = $"order_{request.OrderId}";
        
        // Try cache first
        if (await _cache.TryGetAsync<OrderDto>(cacheKey, out var cached))
        {
            return cached;
        }
        
        var order = await _repository.GetByIdAsync(
            request.OrderId,
            cancellationToken);
        
        if (order == null)
        {
            throw new ResourceNotFoundException(nameof(Order), request.OrderId.ToString());
        }
        
        var dto = _mapper.Map<OrderDto>(order);
        
        // Cache for 5 minutes
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(5));
        
        return dto;
    }
}
```

### Validation

```csharp
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IProductRepository _productRepository;
    
    public CreateOrderCommandValidator(
        ICustomerRepository customerRepository,
        IProductRepository productRepository)
    {
        _customerRepository = customerRepository;
        _productRepository = productRepository;
        
        RuleFor(x => x.CustomerId)
            .GreaterThan(0).WithMessage("Customer ID must be positive")
            .MustAsync(async (id, ct) =>
            {
                var customer = await _customerRepository.GetByIdAsync(id, ct);
                return customer != null;
            })
            .WithMessage("Customer not found");
        
        RuleFor(x => x.OrderNumber)
            .NotEmpty().WithMessage("Order number is required")
            .Length(5, 50).WithMessage("Order number must be between 5 and 50 characters");
        
        RuleForEach(x => x.Items)
            .SetValidator(new CreateOrderItemValidator(_productRepository));
        
        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must contain at least one item");
    }
}

public class CreateOrderItemValidator : AbstractValidator<CreateOrderItemDto>
{
    public CreateOrderItemValidator(IProductRepository productRepository)
    {
        RuleFor(x => x.ProductId)
            .GreaterThan(0)
            .MustAsync(async (id, ct) =>
            {
                var product = await productRepository.GetByIdAsync(id, ct);
                return product != null;
            })
            .WithMessage("Product not found");
        
        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");
        
        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Price cannot be negative");
    }
}
```

## Infrastructure Layer

### Repository Pattern with EF Core

```csharp
public interface IRepository<TEntity> where TEntity : AggregateRoot
{
    Task<TEntity> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<TEntity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(TEntity entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(TEntity entity, CancellationToken cancellationToken = default);
}

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;
    private readonly ILogger<OrderRepository> _logger;
    
    public OrderRepository(
        AppDbContext context,
        ILogger<OrderRepository> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    public async Task<Order> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order with ID {OrderId}", id);
            throw;
        }
    }
    
    public async Task AddAsync(
        Order entity,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.Orders.AddAsync(entity, cancellationToken);
            _logger.LogInformation("Order added to context: {@Order}", entity.OrderNumber);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding order: {@Order}", entity);
            throw;
        }
    }
}

// Unit of Work pattern
public interface IUnitOfWork : IDisposable
{
    IOrderRepository Orders { get; }
    ICustomerRepository Customers { get; }
    IProductRepository Products { get; }
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ILogger<UnitOfWork> _logger;
    
    private IOrderRepository _orderRepository;
    private ICustomerRepository _customerRepository;
    private IProductRepository _productRepository;
    
    public UnitOfWork(AppDbContext context, ILogger<UnitOfWork> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    public IOrderRepository Orders =>
        _orderRepository ??= new OrderRepository(_context, _logger);
    
    public ICustomerRepository Customers =>
        _customerRepository ??= new CustomerRepository(_context, _logger);
    
    public IProductRepository Products =>
        _productRepository ??= new ProductRepository(_context, _logger);
    
    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Changes saved successfully");
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database update error");
            throw new ApplicationException("Failed to save changes", ex);
        }
    }
    
    public void Dispose()
    {
        _context?.Dispose();
    }
}
```

### DbContext Configuration

```csharp
public class AppDbContext : DbContext
{
    public DbSet<Order> Orders { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Product> Products { get; set; }
    
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure Order entity
        modelBuilder.Entity<Order>(b =>
        {
            b.HasKey(o => o.Id);
            
            b.Property(o => o.OrderNumber)
                .HasMaxLength(50)
                .IsRequired();
            
            b.Property(o => o.Status)
                .HasConversion(
                    v => v.ToString(),
                    v => Enum.Parse<OrderStatus>(v));
            
            b.Property(o => o.Total)
                .HasConversion(
                    v => v.Amount,
                    v => new Money(v))
                .HasPrecision(18, 2);
            
            b.HasMany(o => o.Items)
                .WithOne()
                .HasForeignKey("OrderId");
            
            b.HasIndex(o => o.OrderNumber)
                .IsUnique();
        });
        
        // Apply configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
```

## Presentation Layer

### Controller with Error Handling and Validation

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrdersController> _logger;
    
    public OrdersController(IMediator mediator, ILogger<OrdersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }
    
    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateOrder(
        [FromBody] CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var command = new CreateOrderCommand(
                request.CustomerId,
                request.OrderNumber,
                request.Items);
            
            var result = await _mediator.Send(command, cancellationToken);
            
            return CreatedAtAction(
                nameof(GetOrder),
                new { id = result.Id },
                result);
        }
        catch (ValidationException ex)
        {
            _logger.LogWarning(ex, "Validation failed for create order");
            return BadRequest(new ProblemDetails
            {
                Title = "Validation Error",
                Detail = "One or more validation errors occurred",
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new ProblemDetails
                {
                    Title = "Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
        }
    }
    
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [Cached(Duration = 300)] // Custom caching attribute
    public async Task<IActionResult> GetOrder(
        int id,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetOrderQuery(id);
            var result = await _mediator.Send(query, cancellationToken);
            
            return Ok(result);
        }
        catch (ResourceNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = ex.Message,
                Status = StatusCodes.Status404NotFound
            });
        }
    }
}
```

### Custom Attributes for Caching

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class CachedAttribute : Attribute
{
    public int Duration { get; set; } = 300;
}

// Custom filter to handle caching
public class CachingFilter : IAsyncResultFilter
{
    private readonly ICacheService _cacheService;
    
    public CachingFilter(ICacheService cacheService)
    {
        _cacheService = cacheService;
    }
    
    public async Task OnResultExecutionAsync(
        ResultExecutingContext context,
        ResultExecutionDelegate next)
    {
        var cachedAttr = context.ActionDescriptor
            .EndpointMetadata
            .OfType<CachedAttribute>()
            .FirstOrDefault();
        
        if (cachedAttr == null)
        {
            await next();
            return;
        }
        
        var cacheKey = GenerateCacheKey(context.HttpContext.Request);
        
        if (await _cacheService.TryGetAsync<IActionResult>(cacheKey, out var cached))
        {
            context.Result = cached;
            return;
        }
        
        await next();
        
        if (context.Result is OkObjectResult okResult)
        {
            await _cacheService.SetAsync(
                cacheKey,
                okResult,
                TimeSpan.FromSeconds(cachedAttr.Duration));
        }
    }
    
    private string GenerateCacheKey(HttpRequest request)
    {
        return $"{request.Path}_{request.QueryString}";
    }
}
```

## Service Configuration (Program.cs)

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
            .ConfigureContainer<ContainerBuilder>((context, builder) =>
            {
                // Register modules
                builder.RegisterModule(new DataAccessModule(context.Configuration));
                builder.RegisterModule(new ApplicationModule());
                builder.RegisterModule(new InfrastructureModule());
                builder.RegisterModule(new CrossCuttingModule());
            })
            .ConfigureLogging((context, logging) =>
            {
                logging.ClearProviders();
                logging.AddSerilog(new LoggerConfiguration()
                    .MinimumLevel.Information()
                    .WriteTo.Console()
                    .WriteTo.File("logs/app-.txt", rollingInterval: RollingInterval.Day)
                    .CreateLogger());
            })
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
            });
}

public class Startup
{
    private readonly IConfiguration _configuration;
    
    public Startup(IConfiguration configuration)
    {
        _configuration = configuration;
    }
    
    public void ConfigureServices(IServiceCollection services)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(_configuration.GetConnectionString("DefaultConnection")));
        
        // MediatR
        services.AddMediatR(typeof(CreateOrderCommandHandler));
        
        // Validation
        services.AddValidatorsFromAssembly(typeof(CreateOrderCommandValidator).Assembly);
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        
        // AutoMapper
        services.AddAutoMapper(typeof(UserMappingProfile).Assembly);
        
        // Cache
        services.AddMemoryCache();
        services.AddScoped<ICacheService, MemoryCacheService>();
        
        // HTTP Client with Polly
        services.AddHttpClient()
            .ConfigureHttpClientDefaults(http =>
            {
                http.AddStandardResilienceHandler();
            });
        
        // API
        services.AddControllers();
        services.AddScoped<CachingFilter>();
        
        // CORS
        services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", builder =>
            {
                builder.AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });
        
        // Authentication
        services.AddAuthentication("Bearer")
            .AddJwtBearer(options =>
            {
                options.Authority = _configuration["Auth:Authority"];
                options.Audience = _configuration["Auth:Audience"];
            });
        
        // Health checks
        services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>();
        
        // Swagger
        services.AddSwaggerGen();
    }
    
    public void Configure(IApplicationBuilder app, IHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseDeveloperExceptionPage();
            app.UseSwagger();
            app.UseSwaggerUI();
        }
        
        app.UseHttpsRedirection();
        app.UseRouting();
        app.UseCors("AllowAll");
        
        app.UseAuthentication();
        app.UseAuthorization();
        
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseMiddleware<RequestLoggingMiddleware>();
        
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
            endpoints.MapHealthChecks("/health");
        });
    }
}
```

## Testing Strategy

### Unit Tests

```csharp
public class OrderTests
{
    [Fact]
    public void Create_WithValidData_ReturnsOrder()
    {
        // Arrange
        var orderNumber = "ORD-001";
        var customerId = 1;
        var items = new[] {
            (new ProductId(1), new Quantity(2), new Price(100))
        };
        
        // Act
        var order = Order.Create(orderNumber, customerId, items);
        
        // Assert
        Assert.NotNull(order);
        Assert.Equal(orderNumber, order.OrderNumber);
        Assert.Equal(customerId, order.CustomerId);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Single(order.Items);
    }
    
    [Fact]
    public void Confirm_WhenPending_ChangesStatusToConfirmed()
    {
        // Arrange
        var order = CreateOrder();
        
        // Act
        order.Confirm();
        
        // Assert
        Assert.Equal(OrderStatus.Confirmed, order.Status);
    }
    
    [Fact]
    public void Confirm_WhenNotPending_ThrowsException()
    {
        // Arrange
        var order = CreateOrder();
        order.Confirm();
        
        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => order.Confirm());
    }
    
    private Order CreateOrder() =>
        Order.Create("ORD-001", 1, new[] {
            (new ProductId(1), new Quantity(1), new Price(100))
        });
}
```

### Integration Tests

```csharp
public class CreateOrderCommandHandlerTests
{
    private readonly IMediator _mediator;
    private readonly AppDbContext _context;
    
    public CreateOrderCommandHandlerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("TestDb")
            .Options;
        
        _context = new AppDbContext(options);
        
        var services = new ServiceCollection();
        services.AddMediatR(typeof(CreateOrderCommandHandler));
        services.AddAutoMapper(typeof(UserMappingProfile));
        services.AddScoped(_ => _context);
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddValidatorsFromAssembly(typeof(CreateOrderCommandValidator).Assembly);
        
        var provider = services.BuildServiceProvider();
        _mediator = provider.GetRequiredService<IMediator>();
    }
    
    [Fact]
    public async Task Handle_WithValidCommand_CreatesOrder()
    {
        // Arrange
        var command = new CreateOrderCommand(
            1,
            "ORD-001",
            new() { new CreateOrderItemDto(1, 2, 100) }
        );
        
        // Act
        var result = await _mediator.Send(command);
        
        // Assert
        Assert.NotNull(result);
        Assert.Equal("ORD-001", result.OrderNumber);
    }
}
```

## Deployment

### Azure Container Registry and AKS

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 80
ENTRYPOINT ["dotnet", "MyApp.dll"]
```

```bash
# Build and push to ACR
az acr build --registry myregistry --image myapp:1.0.0 .
```

### Kubernetes Deployment with Helm

```yaml
# values.yaml
replicaCount: 3

image:
  repository: myregistry.azurecr.io/myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  hosts:
    - myapp.example.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

env:
  - name: ASPNETCORE_ENVIRONMENT
    value: Production
  - name: ConnectionStrings__DefaultConnection
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: db-connection

healthCheck:
  enabled: true
  path: /health
```

## Monitoring and Observability

```csharp
// Application Insights integration
services.AddApplicationInsightsTelemetry(options =>
{
    options.EnableAdaptiveSampling = true;
    options.EnablePerformanceCounterCollectionModule = true;
});

// Custom telemetry
public class UserServiceTelemetry
{
    private readonly TelemetryClient _client;
    
    public UserServiceTelemetry(TelemetryClient client)
    {
        _client = client;
    }
    
    public void TrackUserCreation(User user)
    {
        var properties = new Dictionary<string, string>
        {
            { "UserId", user.Id.ToString() },
            { "Email", user.Email }
        };
        
        _client.TrackEvent("UserCreated", properties);
    }
}
```

## Summary of Key Principles

1. **Clean Architecture**: Separate concerns into layers
2. **SOLID Principles**: Design flexible, maintainable code
3. **Domain-Driven Design**: Model the business domain
4. **Dependency Injection**: Loose coupling, testability
5. **Error Handling**: Comprehensive exception management
6. **Validation**: Always validate input
7. **Logging**: Structured logging for diagnostics
8. **Caching**: Optimize performance
9. **Security**: Protect sensitive data
10. **Testing**: Unit, integration, functional tests
11. **Monitoring**: Application insights and health checks
12. **Documentation**: Clear, comprehensive documentation

This architecture provides a solid foundation for building enterprise-grade .NET Core applications.
