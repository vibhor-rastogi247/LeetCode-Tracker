# Software Development Guidelines in .NET Core

## Naming Conventions

Proper naming conventions make code more maintainable, readable, and professional.

### Class and Interface Naming

```csharp
// ✅ GOOD - PascalCase for classes
public class UserService { }
public class OrderProcessor { }
public class DatabaseConnection { }

// ✅ GOOD - Interfaces start with 'I'
public interface IUserRepository { }
public interface IEmailService { }
public interface IValidator<T> { }

// ❌ BAD - Not following convention
public class userService { }
public class User_Service { }
public class userserviceinterface { }

// ✅ GOOD - Descriptive names
public class UserAuthenticationService { }
public class OrderPaymentProcessor { }

// ❌ BAD - Too generic
public class Service { }
public class Processor { }
```

### Method Naming

```csharp
// ✅ GOOD - Verb + Noun, PascalCase
public class UserService
{
    public async Task<User> GetUserAsync(int id) { }
    public async Task CreateUserAsync(UserCreateRequest request) { }
    public async Task UpdateUserAsync(int id, UserUpdateRequest request) { }
    public async Task DeleteUserAsync(int id) { }
    public bool IsUserActive(User user) { }
    public async Task SendNotificationAsync(Notification notification) { }
}

// ❌ BAD - Not descriptive
public class UserService
{
    public async Task<User> Get(int id) { }
    public async Task Create(UserCreateRequest request) { }
    public async Task Handle(int id) { }
    public async Task Do() { }
}

// ✅ GOOD - Async methods end with Async
public async Task<string> FetchDataAsync() { }
public async Task ProcessOrderAsync() { }

// ❌ BAD - Async methods don't follow convention
public async Task<string> FetchData() { }
public async Task ProcessOrder() { }
```

### Property Naming

```csharp
// ✅ GOOD - PascalCase for public properties
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Private fields use camelCase with underscore
    private string _internalId;
    private readonly IRepository _repository;
}

// ❌ BAD - Inconsistent casing
public class User
{
    public int id { get; set; }
    public string first_name { get; set; }
    public string LASTNAME { get; set; }
    private string internalId;
    private readonly IRepository repository;
}
```

### Constants and Enums

```csharp
// ✅ GOOD - UPPER_CASE for constants
public class Constants
{
    public const int MAX_RETRY_ATTEMPTS = 3;
    public const string DEFAULT_CULTURE = "en-US";
    public const double TIMEOUT_SECONDS = 30.0;
}

// ✅ GOOD - PascalCase for enum values
public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled,
    Failed
}

// ❌ BAD - Inconsistent naming
public class constants
{
    public const int maxRetryAttempts = 3;
    public const string default_culture = "en-US";
}
```

### Boolean Property Naming

```csharp
// ✅ GOOD - Boolean properties start with Is/Has/Can
public class User
{
    public bool IsActive { get; set; }
    public bool IsAdmin { get; set; }
    public bool HasVerifiedEmail { get; set; }
    public bool CanModifyOrders { get; set; }
}

public class UserService
{
    public bool IsEmailValid(string email) { }
    public bool HasPermission(User user, string permission) { }
    public bool CanAccessResource(User user, string resource) { }
}

// ❌ BAD - Not clear if property is boolean
public class User
{
    public bool Active { get; set; }
    public bool Admin { get; set; }
    public bool Email { get; set; }
}
```

### Namespace Naming

```csharp
// ✅ GOOD - Feature-based organization
namespace MyApplication.Features.Users { }
namespace MyApplication.Features.Orders { }
namespace MyApplication.Features.Orders.Models { }
namespace MyApplication.Features.Orders.Services { }
namespace MyApplication.Features.Orders.Validators { }

namespace MyApplication.Infrastructure.Data { }
namespace MyApplication.Infrastructure.Services { }
namespace MyApplication.Infrastructure.Logging { }

namespace MyApplication.Common.Exceptions { }
namespace MyApplication.Common.Extensions { }
namespace MyApplication.Common.Utilities { }

// ✅ GOOD - Layer-based organization (Alternative)
namespace MyApplication.Presentation.Controllers { }
namespace MyApplication.Application.Services { }
namespace MyApplication.Domain.Models { }
namespace MyApplication.Infrastructure.Repositories { }

// ❌ BAD - Too broad
namespace MyApplication { }
namespace MyApplication.Services { } // Too generic
namespace MyApplication.Utils { } // Too vague
```

## Dynamic vs Objects

Understanding when to use `dynamic` vs strongly-typed objects is crucial for performance and maintainability.

### The Problem with Dynamic

```csharp
// ❌ BAD - Using dynamic
public class DynamicExample
{
    public void ProcessData(dynamic data)
    {
        // No compile-time checking
        // Runtime binding overhead
        // IDE can't provide autocomplete
        var name = data.Name;
        var age = data.Age;
        
        // Can lead to runtime errors
        var salary = data.Salary; // May not exist!
    }
}

// ❌ BAD - Dynamic JSON parsing
public string GetUserName(dynamic jsonResponse)
{
    return jsonResponse.user.profile.name; // Will fail at runtime if path doesn't exist
}
```

### Strongly-Typed Alternative

```csharp
// ✅ GOOD - Strongly-typed classes
public class User
{
    public string Name { get; set; }
    public int Age { get; set; }
}

public class UserService
{
    public void ProcessUser(User user)
    {
        // Compile-time checking
        // No runtime binding overhead
        // Full IDE support (autocomplete, refactoring)
        var name = user.Name;
        var age = user.Age;
    }
}

// ✅ GOOD - Strongly-typed JSON parsing
public class ApiResponse
{
    public UserProfile User { get; set; }
}

public class UserProfile
{
    public Profile Profile { get; set; }
}

public class Profile
{
    public string Name { get; set; }
}

public string GetUserName(ApiResponse response)
{
    return response.User?.Profile?.Name ?? "Unknown";
}
```

### When Dynamic is Acceptable

```csharp
// ✅ ACCEPTABLE - Reflection metadata lookup
public class DynamicReflectionExample
{
    public void SetPropertyValue(object obj, string propertyName, dynamic value)
    {
        var property = obj.GetType().GetProperty(propertyName);
        if (property != null && property.CanWrite)
        {
            property.SetValue(obj, value);
        }
    }
}

// ✅ ACCEPTABLE - Interop with COM or dynamic languages
public class ComInteropExample
{
    [DllImport("ole32.dll")]
    private static extern void OleInitialize(IntPtr reserved);
    
    // COM objects may require dynamic
    public void WorkWithComObject(dynamic comObject)
    {
        comObject.SomeMethod();
    }
}

// ⚠️ AVOID WHEN POSSIBLE - JSON parsing
public class JsonParsingExample
{
    // ❌ BAD
    public void BadJsonParsing(string json)
    {
        dynamic parsed = JsonConvert.DeserializeObject(json);
        var name = parsed.user.name; // Runtime error risk
    }
    
    // ✅ GOOD
    public void GoodJsonParsing(string json)
    {
        var user = JsonConvert.DeserializeObject<User>(json);
        var name = user.Name;
    }
}
```

### Performance Impact

```csharp
public class PerformanceComparison
{
    [Benchmark]
    public void DynamicCallBenchmark()
    {
        dynamic obj = new { Value = 42 };
        for (int i = 0; i < 1000000; i++)
        {
            var value = obj.Value; // ~100x slower
        }
    }
    
    [Benchmark]
    public void StronglyTypedBenchmark()
    {
        var obj = new { Value = 42 };
        for (int i = 0; i < 1000000; i++)
        {
            var value = obj.Value; // 1x baseline
        }
    }
}
```

## Database Entities Should Never Cross Layer Boundaries

### The Problem

```csharp
// ❌ BAD - Entity exposed to other layers
public class User // Entity
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PasswordHash { get; set; } // Security risk!
    public string Salt { get; set; } // Sensitive data!
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _repository;
    
    public UsersController(IUserRepository repository)
    {
        _repository = repository;
    }
    
    [HttpGet("{id}")]
    public IActionResult GetUser(int id)
    {
        // Returns entity directly - security vulnerability!
        var user = _repository.GetUser(id);
        return Ok(user);
    }
}
```

### Solution: Use DTOs (Data Transfer Objects)

```csharp
// Data Access Layer - Entity
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PasswordHash { get; set; }
    public string Salt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Application/API Layer - DTO
public class UserDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
}

public class UserDetailedDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Repository abstraction
public interface IUserRepository
{
    Task<User> GetUserAsync(int id);
    Task<IEnumerable<User>> GetAllUsersAsync();
}

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    
    public UserRepository(AppDbContext context)
    {
        _context = context;
    }
    
    public async Task<User> GetUserAsync(int id)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
    }
    
    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await _context.Users.ToListAsync();
    }
}

// Service layer - maps entity to DTO
public interface IUserService
{
    Task<UserDto> GetUserAsync(int id);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
}

public class UserService : IUserService
{
    private readonly IUserRepository _repository;
    private readonly IMapper _mapper;
    
    public UserService(IUserRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }
    
    public async Task<UserDto> GetUserAsync(int id)
    {
        var user = await _repository.GetUserAsync(id);
        return _mapper.Map<UserDto>(user);
    }
    
    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _repository.GetAllUsersAsync();
        return _mapper.Map<IEnumerable<UserDto>>(users);
    }
}

// Controller - uses DTO only
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    
    public UsersController(IUserService userService)
    {
        _userService = userService;
    }
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        // Returns DTO - no sensitive data exposed
        var user = await _userService.GetUserAsync(id);
        return Ok(user);
    }
}
```

### Mapping Profile for Entity to DTO

```csharp
public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Email,
                opt => opt.MapFrom(src => src.ContactInfo.Email))
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Salt, opt => opt.Ignore());
        
        CreateMap<User, UserDetailedDto>()
            .IncludeBase<User, UserDto>()
            .ForMember(dest => dest.CreatedAt,
                opt => opt.MapFrom(src => src.CreatedAt));
        
        CreateMap<UserCreateRequest, User>()
            .ForMember(dest => dest.PasswordHash,
                opt => opt.Ignore())
            .ForMember(dest => dest.Salt,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt,
                opt => opt.MapFrom(src => DateTime.UtcNow));
    }
}
```

## Binary Communication Between Services

Binary communication is more efficient than text-based protocols like JSON/XML.

### Benefits of Binary Communication

```
Text-Based (JSON):
{
  "userId": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "active": true,
  "balance": 1234.56
}

Size: ~90 bytes
Processing: Requires parsing, allocation

Binary-Based (Protocol Buffers):
Size: ~25-35 bytes (60-70% reduction)
Processing: Direct deserialization, no parsing
Performance: 10-100x faster
```

### Protocol Buffers (.proto)

```protobuf
syntax = "proto3";

package users;

service UserService {
  rpc GetUser(GetUserRequest) returns (UserResponse);
  rpc CreateUser(CreateUserRequest) returns (UserResponse);
}

message GetUserRequest {
  int32 user_id = 1;
}

message CreateUserRequest {
  string first_name = 1;
  string last_name = 2;
  string email = 3;
  bool active = 4;
}

message UserResponse {
  int32 id = 1;
  string first_name = 2;
  string last_name = 3;
  string email = 4;
  bool active = 5;
  double balance = 6;
  int64 created_at = 7;
}
```

### Using gRPC (Protocol Buffers over HTTP/2)

```bash
dotnet add package Grpc.AspNetCore
```

```csharp
// Generated from .proto file
public class UserServiceImpl : UserService.UserServiceBase
{
    private readonly IUserRepository _repository;
    private readonly IMapper _mapper;
    
    public UserServiceImpl(IUserRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }
    
    public override async Task<UserResponse> GetUser(
        GetUserRequest request,
        ServerCallContext context)
    {
        var user = await _repository.GetUserAsync(request.UserId);
        return _mapper.Map<UserResponse>(user);
    }
    
    public override async Task<UserResponse> CreateUser(
        CreateUserRequest request,
        ServerCallContext context)
    {
        var user = _mapper.Map<User>(request);
        await _repository.AddUserAsync(user);
        return _mapper.Map<UserResponse>(user);
    }
}

// Program.cs
builder.Services.AddGrpc();

var app = builder.Build();

app.MapGrpcService<UserServiceImpl>();
app.Run();
```

### Client Usage

```csharp
public class UserGrpcClient
{
    private readonly UserService.UserServiceClient _client;
    
    public UserGrpcClient(UserService.UserServiceClient client)
    {
        _client = client;
    }
    
    public async Task<UserResponse> GetUserAsync(int userId)
    {
        var request = new GetUserRequest { UserId = userId };
        var response = await _client.GetUserAsync(request);
        return response;
    }
    
    public async Task<UserResponse> CreateUserAsync(
        string firstName,
        string lastName,
        string email)
    {
        var request = new CreateUserRequest
        {
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Active = true
        };
        
        var response = await _client.CreateUserAsync(request);
        return response;
    }
}

// Program.cs - Client setup
builder.Services
    .AddGrpcClient<UserService.UserServiceClient>(options =>
    {
        options.Address = new Uri("https://localhost:5001");
    });

builder.Services.AddScoped<UserGrpcClient>();
```

## Global Using Directives

Global using statements reduce repetitive using declarations.

### Implementing Global Using

```csharp
// ✅ Create GlobalUsings.cs or use conditional compilation
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using System.Threading.Tasks;
global using Microsoft.AspNetCore.Mvc;
global using Microsoft.Extensions.Logging;
global using MyApplication.Features.Users.Models;
global using MyApplication.Features.Orders.Models;
global using MyApplication.Infrastructure.Services;
global using MyApplication.Common.Extensions;
global using MyApplication.Common.Exceptions;
global using Autofac;
global using AutoMapper;
global using FluentValidation;
global using MediatR;
global using Serilog;
```

### Or in .csproj

```xml
<ItemGroup>
    <Using Include="System" />
    <Using Include="System.Collections.Generic" />
    <Using Include="System.Linq" />
    <Using Include="System.Threading.Tasks" />
    <Using Include="Microsoft.AspNetCore.Mvc" />
    <Using Include="Microsoft.Extensions.Logging" />
</ItemGroup>
```

### Benefits

```csharp
// ❌ BEFORE - Repetitive
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyApplication.Features.Users.Models;
using MyApplication.Features.Orders.Models;

namespace MyApplication.Features.Users.Controllers
{
    [ApiController]
    public class UsersController : ControllerBase
    {
        // ...
    }
}

// ✅ AFTER - Clean
namespace MyApplication.Features.Users.Controllers;

[ApiController]
public class UsersController : ControllerBase
{
    // All using statements are global
}
```

## Organization Summary

**Directory Structure:**
```
MyApplication/
├── Features/
│   ├── Users/
│   │   ├── Models/
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   ├── Validators/
│   │   └── Mappings/
│   ├── Orders/
│   │   ├── Models/
│   │   └── ...
│   └── Products/
│       └── ...
├── Infrastructure/
│   ├── Data/
│   ├── Services/
│   ├── Logging/
│   └── Caching/
├── Common/
│   ├── Exceptions/
│   ├── Extensions/
│   ├── Utilities/
│   └── Constants/
└── Presentation/
    ├── Controllers/
    ├── Middleware/
    └── Filters/
```

**Key Principles:**
1. Use clear, descriptive naming
2. Avoid `dynamic` except when necessary
3. Never expose entities beyond their layer
4. Use DTOs for API communication
5. Consider binary protocols for performance-critical services
6. Use global using for common namespaces
7. Organize code by feature, not by layer
