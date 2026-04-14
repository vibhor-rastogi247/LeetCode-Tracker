# DotNetCore Learning Path - Complete Guide Overview

## Welcome to the Enterprise .NET Core Developer's Handbook

This comprehensive guide is designed for junior developers joining a top-tier software company to quickly get up to speed with enterprise-grade .NET Core development practices.

## Document Structure and Learning Path

### **Phase 1: Foundational Concepts**

#### 1. [DotNet Builders and Container Builders](01_DotNet_Builders_and_Container_Builders.md)
**Purpose**: Understand how applications are configured and dependency injection containers work

**Key Topics**:
- WebApplicationBuilder (modern approach)
- WebHostBuilder (legacy but important)
- HostBuilder for non-HTTP apps
- Service container lifecycle management
- Service registration patterns
- Named/keyed services

**When You'll Use This**: Every single project you create starts here. Understanding builders is fundamental.

**Time to Master**: 2-3 hours

---

#### 2. [Error Handling and Crash Management](02_Error_Handling_and_Crash_Management.md)
**Purpose**: Build robust applications that don't crash unexpectedly

**Key Topics**:
- Custom exception hierarchies
- Global exception handling middleware
- Structured logging with Serilog
- Health checks
- Circuit breaker patterns with Polly
- Transaction and rollback handling
- Crash dump generation

**When You'll Use This**: Constantly. Every API endpoint needs proper error handling.

**Time to Master**: 3-4 hours

---

### **Phase 2: Data and Configuration**

#### 3. [XML in .NET Core: Complete Guide](03_XML_Guide.md)
**Purpose**: Master XML processing since your organization uses it heavily

**Key Topics**:
- XML fundamentals and syntax
- XmlDocument (DOM approach)
- XElement/XDocument (LINQ to XML) - modern approach
- XmlReader/XmlWriter (streaming)
- XSD validation
- XML Serialization
- XSLT transformations
- Security and XXE prevention

**When You'll Use This**: When parsing/generating configuration files, API responses, or data feeds.

**Time to Master**: 2-3 hours

---

### **Phase 3: Dependency Management and Architecture**

#### 4. [Dependency Injection (DI) in .NET Core](04_Dependency_Injection.md)
**Purpose**: Master the core pattern that enables testable, maintainable code

**Key Topics**:
- DI principles and benefits
- Built-in .NET Core DI container
- Service lifetimes (Transient, Scoped, Singleton)
- Constructor injection
- Factory patterns
- Service resolution patterns

**When You'll Use This**: Every class needs proper dependency injection.

**Time to Master**: 2-3 hours

---

#### 5. [Modules and Dependency Injection with AutoFac](05_Modules_and_AutoFac.md)
**Purpose**: Learn advanced DI patterns and module organization

**Key Topics**:
- Module system for organizing registrations
- AutoFac vs built-in DI
- Property injection
- Factory delegates with Func<T>
- Lazy<T> for deferred instantiation
- Named/keyed services with AutoFac
- Decorators for cross-cutting concerns
- Assembly scanning and conventions
- Interceptors and AOP

**When You'll Use This**: When projects grow and need advanced DI patterns.

**Time to Master**: 3-4 hours

---

### **Phase 4: Cross-Cutting Concerns**

#### 6. [Polly, AutoMapper, and Validation](06_Polly_AutoMapper_Validation.md)
**Purpose**: Handle resilience, object mapping, and input validation

**Key Topics**:

**Polly**:
- Retry policies (exponential backoff, jitter)
- Circuit breaker for fault tolerance
- Timeout policies
- Bulkhead isolation
- Fallback policies
- Policy wrapping and composition
- HttpClientFactory integration

**AutoMapper**:
- Convention-based object mapping
- Mapping profiles and configurations
- Custom value resolvers
- Nested object mapping
- Collection mapping
- Member mapping options

**Validation**:
- FluentValidation library
- Custom validation rules
- Async validation
- Nested and conditional validation
- Validation middleware/behaviors

**When You'll Use This**: AutoMapper daily, Polly for external APIs, FluentValidation at API boundary.

**Time to Master**: 4-5 hours

---

### **Phase 5: Development Standards and Patterns**

#### 7. [Software Development Guidelines in .NET Core](07_Software_Development_Guidelines.md)
**Purpose**: Write code that follows organizational standards

**Key Topics**:
- Naming conventions (classes, methods, properties, constants)
- PascalCase, camelCase, UPPER_CASE usage
- Boolean naming patterns
- Namespace organization
- Dynamic vs strongly-typed code
- Database entities and DTO separation
- Binary communication (gRPC/Protocol Buffers)
- Global using directives
- Code organization patterns

**When You'll Use This**: Every single line of code you write.

**Time to Master**: 1-2 hours

---

#### 8. [Attributes, Middleware, Reflection](08_Attributes_Middleware_Reflection.md)
**Purpose**: Leverage advanced .NET features for extensibility

**Key Topics**:

**Attributes**:
- Built-in attributes (Obsolete, Serializable, Required, etc.)
- Creating custom attributes
- Reading attributes with reflection
- Validation and authorization attributes

**Middleware**:
- Request/response pipeline
- Built-in middleware
- Convention-based middleware
- Factory-based middleware
- Custom exception handling middleware
- Performance logging middleware
- Rate limiting middleware

**Reflection**:
- When to use (DI, discovery, serialization)
- When NOT to use (performance-critical code)
- Reflection optimization techniques
- Property binding, metadata discovery
- Service activation

**When You'll Use This**: Middleware frequently, reflection rarely (mostly in frameworks), attributes for configuration.

**Time to Master**: 3-4 hours

---

### **Phase 6: DevOps and Artifact Management**

#### 9. [Artifact Repository and JFrog](09_Artifact_Repository_JFrog.md)
**Purpose**: Manage versions, dependencies, and build artifacts

**Key Topics**:
- Artifact repository benefits
- JFrog Artifactory setup
- NuGet package configuration
- Publishing custom packages
- Artifact promotion
- Repository quotas and policies
- Access control
- CI/CD integration (GitHub Actions, Azure DevOps, Jenkins)
- Package versioning and naming conventions
- Security best practices

**When You'll Use This**: Every time you build and deploy code.

**Time to Master**: 2-3 hours

---

### **Phase 7: Enterprise Architecture**

#### 10. [Enterprise .NET Core Architecture and Best Practices](10_Enterprise_Architecture_and_Best_Practices.md)
**Purpose**: See how everything fits together in a real application

**Key Topics**:
- Complete project structure
- Domain-Driven Design principles
- Entity definitions and domain events
- Application layer with MediatR
- Infrastructure layer with repositories
- Presentation layer with controllers
- Service configuration (Program.cs)
- Testing strategies (unit, integration)
- Kubernetes deployment with Helm
- Monitoring with Application Insights

**When You'll Use This**: As reference for building new features and understanding the overall architecture.

**Time to Master**: 4-5 hours (reading + understanding examples)

---

### **Phase 8: Cloud and DevOps Essentials**

#### 11. [Azure Identity Fundamentals](11_Azure_Identity_Fundamentals.md)
**Purpose**: Master Azure identity management - critical for cloud deployments

**Key Topics**:
- Authentication vs Authorization concepts
- Azure AD tenant architecture
- User and group management
- Application registrations and service principals
- Managed identities (system-assigned vs user-assigned)
- Role-Based Access Control (RBAC)
- Conditional Access Policies
- Identity Protection and risk detection
- Multi-tenant scenarios and federation

**When You'll Use This**: Every Azure resource deployment and API authentication.

**Time to Master**: 4-5 hours

---

#### 12. [Azure Key Vault and AKS Integration](12_Azure_Key_Vault_and_AKS_Integration.md)
**Purpose**: Securely manage secrets, keys, and certificates in containerized environments

**Key Topics**:
- Key Vault objects (secrets, keys, certificates)
- Key Vault management and operations
- AKS integration patterns
- Managed identity authentication
- Key Vault CSI driver
- Certificate auto-rotation
- Security best practices
- Disaster recovery and backup

**When You'll Use This**: Any application requiring secure credential management.

**Time to Master**: 3-4 hours

---

#### 13. [Azure Messaging Services](13_Azure_Messaging_Services.md)
**Purpose**: Implement reliable messaging patterns for distributed systems

**Key Topics**:
- Azure Service Bus (queues, topics, subscriptions)
- Azure Storage Queues
- Azure Event Hubs
- Message routing and filtering
- Event Hub to Splunk integration via Azure Functions
- Monitoring and observability
- Performance optimization
- Error handling and dead lettering

**When You'll Use This**: Building event-driven and microservice architectures.

**Time to Master**: 4-5 hours

---

#### 14. [Git Workflows and CI/CD](14_Git_Workflows_and_CI_CD.md)
**Purpose**: Master version control and automated deployment pipelines

**Key Topics**:
- Git branching strategies (Git Flow, GitHub Flow, Trunk-based)
- GitHub Actions workflows and automation
- Self-hosted runners setup and management
- YAML pipeline configuration
- Security: cleaning sensitive data from runners
- CI/CD best practices
- Performance optimization and caching

**When You'll Use This**: Every code change and deployment.

**Time to Master**: 4-5 hours

---

## Recommended Learning Schedule

### Week 1: Foundation
- **Day 1**: DotNet Builders & Container Builders (04 hours)
- **Day 2**: Error Handling & Crash Management (04 hours)
- **Day 3**: XML Guide (03 hours)
- **Day 4-5**: Dependency Injection (04 hours)

### Week 2: Advanced Patterns
- **Day 1**: Modules & AutoFac (04 hours)
- **Day 2-3**: Polly, AutoMapper, Validation (05 hours)
- **Day 4-5**: Software Guidelines + Attributes/Middleware (05 hours)

### Week 3: DevOps & Architecture
- **Day 1-2**: Artifact Repository & JFrog (03 hours)
- **Day 3-5**: Enterprise Architecture (05 hours)

### Week 4: Cloud and DevOps Essentials
- **Day 1-2**: Azure Identity Fundamentals (05 hours)
- **Day 3**: Azure Key Vault & AKS Integration (04 hours)
- **Day 4**: Azure Messaging Services (05 hours)
- **Day 5**: Git Workflows & CI/CD (05 hours)

**Total Learning Time**: ~65 hours (approximately 1.5 weeks of intensive learning or 3 weeks part-time)

---

## Quick Reference by Scenario

### "I'm building a new API endpoint"
1. Define your domain entity in **DotNet Builders and Container Builders** (service registration)
2. Add validation using **Polly, AutoMapper, Validation** (FluentValidation)
3. Implement error handling from **Error Handling and Crash Management**
4. Follow naming conventions from **Software Development Guidelines**
5. Return DTOs, not entities (see **Software Development Guidelines**)
6. Add middleware and attributes from **Attributes, Middleware, Reflection**

### "I'm publishing a library package"
1. Read **Software Development Guidelines** (naming conventions)
2. Follow **Artifact Repository and JFrog** (publishing to Artifactory)
3. Implement CI/CD pipeline from the same document

### "I'm debugging a performance issue"
1. Check **Error Handling and Crash Management** (logging and health checks)
2. Review **Polly, AutoMapper, Validation** (especially Polly circuit breaker)
3. Optimize reflection usage from **Attributes, Middleware, Reflection**

### "I'm refactoring code for maintainability"
1. Review **Dependency Injection** and **Modules and AutoFac** for better organization
2. Follow **Software Development Guidelines** for naming and structure
3. Add proper error handling from **Error Handling and Crash Management**

### "I'm deploying to Azure"
1. Review **Azure Identity Fundamentals** (authentication and authorization)
2. Use **Azure Key Vault and AKS Integration** (secure credential management)
3. Implement messaging with **Azure Messaging Services** (Service Bus/Event Hubs)
4. Follow **Git Workflows and CI/CD** (deployment pipelines)

### "I'm setting up CI/CD pipelines"
1. Read **Git Workflows and CI/CD** (complete guide)
2. Configure artifact management from **Artifact Repository and JFrog**
3. Implement security scanning and cleanup procedures

### "I'm implementing secure authentication"
1. Study **Azure Identity Fundamentals** (comprehensive identity management)
2. Use managed identities from **Azure Key Vault and AKS Integration**
3. Implement proper RBAC and conditional access policies

---

## Technology Stack Summary

### Core Framework
- **.NET Core 8.0+**: Latest version with best features
- **ASP.NET Core**: Web framework

### Dependency Injection
- **Built-in IServiceCollection**: For simple cases
- **AutoFac**: For advanced DI patterns and modules

### Data Access
- **Entity Framework Core**: ORM (mentioned in examples)
- **SQL Server**: Primary database (mentioned in examples)

### Resilience
- **Polly**: Circuit breaker, retry, timeout policies
- **Health Checks**: Built-in health endpoint monitoring

### Validation
- **FluentValidation**: Fluent validation library
- **Data Annotations**: Built-in validation attributes

### Object Mapping
- **AutoMapper**: Convention-based object mapping

### XML Processing
- **System.Xml.Linq**: Modern LINQ to XML approach
- **System.Xml**: Traditional DOM and streaming APIs

### Logging
- **Serilog**: Structured logging (mentioned in examples)
- **Application Insights**: Cloud monitoring

### API Communication
- **gRPC**: Binary communication for microservices
- **HTTP Client Factory**: Resilient HTTP communication

### Cloud Deployment
- **Azure Kubernetes Service (AKS)**: Container orchestration
- **Azure Key Vault**: Secret management
- **Azure Service Bus**: Enterprise messaging
- **Azure Event Hubs**: High-throughput event streaming
- **Azure Active Directory**: Identity and access management
- **Helm**: Kubernetes package manager
- **Terraform**: Infrastructure as code

### Artifact Management
- **JFrog Artifactory**: Package and artifact repository
- **NuGet**: .NET package manager

### Version Control and CI/CD
- **Git**: Distributed version control
- **GitHub Actions**: CI/CD automation
- **Self-hosted Runners**: Custom build environments

---

## Key Principles to Remember

### 1. **SOLID Principles**
- **S**: Single Responsibility - Each class has one reason to change
- **O**: Open/Closed - Open for extension, closed for modification
- **L**: Liskov Substitution - Subtypes must be substitutable
- **I**: Interface Segregation - Many specific interfaces over one general
- **D**: Dependency Inversion - Depend on abstractions, not concrete types

### 2. **DRY (Don't Repeat Yourself)**
Write reusable modules and services to avoid code duplication.

### 3. **YAGNI (You Aren't Gonna Need It)**
Don't over-engineer; solve the problem at hand.

### 4. **Clean Code**
- Use meaningful names
- Keep methods small and focused
- Use proper indentation and formatting
- Add comments only for "why", not "what"

### 5. **Fail Fast, Fail Safe**
- Validate early
- Provide meaningful error messages
- Never suppress exceptions silently
- Use logging for diagnostics

### 6. **Security First**
- Never expose sensitive data in DTOs
- Always validate user input
- Use prepared statements
- Implement proper authentication/authorization
- Handle secrets securely

### 7. **Performance Matters**
- Cache aggressively (but invalidate properly)
- Use async/await for I/O
- Avoid reflection in hot paths
- Monitor and profile

### 8. **Testability**
- Inject dependencies
- Use interfaces
- Keep classes small
- Avoid static methods (except extensions)

---

## Resources and Further Learning

### Official Documentation
- [Microsoft .NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)

### Community Libraries
- [Polly Documentation](https://github.com/App-vNext/Polly)
- [AutoFac Documentation](https://autofac.readthedocs.io/)
- [AutoMapper Documentation](https://docs.automapper.org/)
- [FluentValidation](https://fluentvalidation.net/)
- [Serilog](https://serilog.net/)

### Best Practices
- Clean Code by Robert C. Martin
- The Pragmatic Programmer
- Domain-Driven Design by Eric Evans

---

## Getting Help and Collaboration

### When You're Stuck
1. **Check the docs** - Answer is usually in Microsoft docs
2. **Search your organization's code** - See how it's done elsewhere
3. **Ask your team** - We're here to help
4. **Review this guide** - Most answers are in these documents

### Reporting Issues
- Document the problem clearly
- Provide code examples
- Include error messages
- Describe expected vs actual behavior

---

## Continuous Learning Path

After completing these guides, consider:

### Advanced Topics
- Microservices architecture patterns
- Event sourcing and CQRS
- Message queues (RabbitMQ, Service Bus)
- Advanced cloud patterns (Azure)
- Performance optimization techniques
- Machine learning integration

### Contributing Back
- Share knowledge with junior developers
- Improve these guides with your findings
- Write technical blog posts
- Contribute to open-source projects

---

## Checklist: You're Ready When You Can...

- [ ] Explain service lifetimes and when to use each
- [ ] Write a custom error handling middleware
- [ ] Parse XML both with DOM and streaming approaches
- [ ] Register services with AutoFac modules
- [ ] Configure Polly retry and circuit breaker policies
- [ ] Use AutoMapper with complex nested mappings
- [ ] Write FluentValidation rules with async validation
- [ ] Follow naming conventions without thinking
- [ ] Create custom attributes and read them with reflection
- [ ] Publish a package to Artifactory
- [ ] Design a service using DDD principles
- [ ] Write unit and integration tests
- [ ] Deploy an application to Kubernetes with Helm
- [ ] Implement proper error handling and logging throughout
- [ ] Configure Azure AD authentication and authorization
- [ ] Use managed identities for Azure resource access
- [ ] Implement secure secret management with Key Vault
- [ ] Choose between Service Bus, Storage Queues, and Event Hubs
- [ ] Set up GitHub Actions CI/CD pipelines
- [ ] Configure self-hosted runners with proper security cleanup

---

## Final Thoughts

Enterprise development is about writing code that:
- **Works reliably**: No crashes, proper error handling
- **Performs well**: Optimized, uses caching, async where appropriate
- **Scales**: Can handle growth in users, data, traffic
- **Maintains**: Is readable, testable, documented
- **Lasts**: Built on solid architectural principles

This guide provides the foundation. The rest comes from practice, learning from colleagues, and continuous improvement.

**Welcome to the team! 🚀**

---

## Quick Links to All Documents

1. [DotNet Builders and Container Builders](01_DotNet_Builders_and_Container_Builders.md)
2. [Error Handling and Crash Management](02_Error_Handling_and_Crash_Management.md)
3. [XML in .NET Core: Complete Guide](03_XML_Guide.md)
4. [Dependency Injection (DI) in .NET Core](04_Dependency_Injection.md)
5. [Modules and Dependency Injection with AutoFac](05_Modules_and_AutoFac.md)
6. [Polly, AutoMapper, and Validation](06_Polly_AutoMapper_Validation.md)
7. [Software Development Guidelines in .NET Core](07_Software_Development_Guidelines.md)
8. [Attributes, Middleware, Reflection](08_Attributes_Middleware_Reflection.md)
9. [Artifact Repository and JFrog](09_Artifact_Repository_JFrog.md)
10. [Enterprise .NET Core Architecture and Best Practices](10_Enterprise_Architecture_and_Best_Practices.md)
11. [Azure Identity Fundamentals](11_Azure_Identity_Fundamentals.md)
12. [Azure Key Vault and AKS Integration](12_Azure_Key_Vault_and_AKS_Integration.md)
13. [Azure Messaging Services](13_Azure_Messaging_Services.md)
14. [Git Workflows and CI/CD](14_Git_Workflows_and_CI_CD.md)

---

**Last Updated**: 2026
**Version**: 1.0
**Maintenance**: Updated regularly based on industry best practices and team feedback
