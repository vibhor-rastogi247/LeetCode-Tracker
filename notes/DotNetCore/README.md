# DotNetCore Learning Materials - Complete Index

## 📚 Complete Learning Materials for Enterprise .NET Core Development

This folder contains comprehensive, production-ready learning materials covering all aspects of enterprise .NET Core development.

---

## 📖 Document Catalog

### **00. Overview and Learning Path** ⭐ START HERE
- **File**: `00_Overview_and_Learning_Path.md`
- **Purpose**: Overview of entire curriculum and recommended learning sequence
- **Key Content**:
  - Learning schedule (3 weeks)
  - Quick reference by scenario
  - Technology stack summary
  - Key principles
  - Readiness checklist

### **01. DotNet Builders and Container Builders**
- **File**: `01_DotNet_Builders_and_Container_Builders.md`
- **Purpose**: Application configuration and DI container fundamentals
- **Key Content**:
  - WebApplicationBuilder (modern .NET 6+)
  - WebHostBuilder (legacy)
  - HostBuilder (non-HTTP)
  - Service lifetime management
  - Service registration patterns
  - Named/keyed services

### **02. Error Handling and Crash Management**
- **File**: `02_Error_Handling_and_Crash_Management.md`
- **Purpose**: Robust error handling and application reliability
- **Key Content**:
  - Custom exception hierarchies
  - Global exception middleware
  - Structured logging (Serilog)
  - Health checks
  - Resilience patterns
  - Transaction management

### **03. XML in .NET Core: Complete Guide**
- **File**: `03_XML_Guide.md`
- **Purpose**: Comprehensive XML processing (critical for this organization)
- **Key Content**:
  - XML fundamentals
  - XmlDocument (DOM)
  - XElement/XDocument (LINQ)
  - XmlReader/XmlWriter (streaming)
  - XSD validation
  - XML Serialization
  - XSLT transformations

### **04. Dependency Injection (DI) in .NET Core**
- **File**: `04_Dependency_Injection.md`
- **Purpose**: Core DI pattern and built-in container
- **Key Content**:
  - DI principles
  - Service lifetimes (Transient, Scoped, Singleton)
  - Constructor injection
  - Factory patterns
  - Service resolution

### **05. Modules and Dependency Injection with AutoFac**
- **File**: `05_Modules_and_AutoFac.md`
- **Purpose**: Advanced DI patterns with AutoFac framework
- **Key Content**:
  - Module system
  - AutoFac vs built-in DI comparison
  - Property injection
  - Lazy<T> and Func<T> factories
  - Named/keyed services
  - Decorators and AOP
  - Interceptors
  - Assembly scanning

### **06. Polly, AutoMapper, and Validation**
- **File**: `06_Polly_AutoMapper_Validation.md`
- **Purpose**: Resilience, object mapping, and input validation
- **Key Content**:
  - **Polly**: Retry, circuit breaker, timeout, bulkhead, fallback
  - **AutoMapper**: Mapping profiles, nested mapping, custom resolvers
  - **FluentValidation**: Rules, async validation, nested validation

### **07. Software Development Guidelines in .NET Core**
- **File**: `07_Software_Development_Guidelines.md`
- **Purpose**: Coding standards and best practices
- **Key Content**:
  - Naming conventions (all types)
  - PascalCase, camelCase, UPPER_CASE rules
  - Dynamic vs strongly-typed code
  - Database entities vs DTOs
  - Binary communication (gRPC)
  - Global using directives
  - Code organization

### **08. Attributes, Middleware, Reflection**
- **File**: `08_Attributes_Middleware_Reflection.md`
- **Purpose**: Advanced .NET features for extensibility
- **Key Content**:
  - Custom attributes
  - Middleware pipeline
  - Custom middleware implementations
  - Exception handling middleware
  - Performance logging
  - Rate limiting
  - Reflection usage (when/when-not)

### **09. Artifact Repository and JFrog**
- **File**: `09_Artifact_Repository_JFrog.md`
- **Purpose**: Artifact management and deployment pipeline
- **Key Content**:
  - JFrog Artifactory setup
  - NuGet package configuration
  - Publishing packages
  - Artifact promotion
  - CI/CD integration (Azure DevOps, Jenkins, GitHub Actions)
  - Security best practices

### **10. Enterprise .NET Core Architecture and Best Practices**
- **File**: `10_Enterprise_Architecture_and_Best_Practices.md`
- **Purpose**: Complete example of enterprise application architecture
- **Key Content**:
  - Domain-Driven Design
  - Complete project structure
  - Entity design
  - Domain events
  - Repository pattern
  - MediatR implementation
  - Controller design
  - Service configuration
  - Testing strategies
  - Kubernetes deployment

### **11. Azure Identity Fundamentals**
- **File**: `11_Azure_Identity_Fundamentals.md`
- **Purpose**: Comprehensive Azure identity management (critical for cloud deployments)
- **Key Content**:
  - Authentication vs Authorization
  - Azure AD tenant architecture
  - User/group management
  - Application registrations
  - Service principals
  - Managed identities
  - Role-Based Access Control (RBAC)
  - Conditional Access Policies
  - Identity Protection
  - Multi-tenant scenarios

### **12. Azure Key Vault and AKS Integration**
- **File**: `12_Azure_Key_Vault_and_AKS_Integration.md`
- **Purpose**: Secure secret management in containerized environments
- **Key Content**:
  - Key Vault objects (secrets, keys, certificates)
  - AKS integration patterns
  - Managed identity authentication
  - Key Vault CSI driver
  - Certificate auto-rotation
  - Security best practices
  - Disaster recovery

### **13. Azure Messaging Services**
- **File**: `13_Azure_Messaging_Services.md`
- **Purpose**: Reliable messaging for distributed systems
- **Key Content**:
  - Azure Service Bus (queues, topics)
  - Azure Storage Queues
  - Azure Event Hubs
  - Message routing and filtering
  - Event Hub to Splunk integration
  - Monitoring and observability
  - Performance optimization

### **14. Git Workflows and CI/CD**
- **File**: `14_Git_Workflows_and_CI_CD.md`
- **Purpose**: Version control and automated deployment pipelines
- **Key Content**:
  - Git branching strategies
  - GitHub Actions workflows
  - Self-hosted runners
  - YAML pipeline configuration
  - Security: cleaning sensitive data
  - CI/CD best practices
  - Performance optimization

---

## 🎯 Quick Navigation by Topic

### DI and IoC
- [Dependency Injection](04_Dependency_Injection.md) - Fundamentals
- [Modules and AutoFac](05_Modules_and_AutoFac.md) - Advanced patterns

### Data and XML
- [XML Guide](03_XML_Guide.md) - Complete XML handling

### Cross-Cutting Concerns
- [Polly, AutoMapper, Validation](06_Polly_AutoMapper_Validation.md)
- [Error Handling and Crash Management](02_Error_Handling_and_Crash_Management.md)
- [Attributes, Middleware, Reflection](08_Attributes_Middleware_Reflection.md)

### Architecture and Design
- [DotNet Builders](01_DotNet_Builders_and_Container_Builders.md)
- [Enterprise Architecture](10_Enterprise_Architecture_and_Best_Practices.md)

### Standards and Guidelines
- [Software Development Guidelines](07_Software_Development_Guidelines.md)

### DevOps
- [Artifact Repository and JFrog](09_Artifact_Repository_JFrog.md)
- [Git Workflows and CI/CD](14_Git_Workflows_and_CI_CD.md)

### Cloud and Azure
- [Azure Identity Fundamentals](11_Azure_Identity_Fundamentals.md)
- [Azure Key Vault and AKS Integration](12_Azure_Key_Vault_and_AKS_Integration.md)
- [Azure Messaging Services](13_Azure_Messaging_Services.md)

---

## 📊 Topics Covered

### Builders (10 topics)
- ✅ WebApplicationBuilder
- ✅ WebHostBuilder
- ✅ HostBuilder
- ✅ Service container lifecycle
- ✅ Service registration
- ✅ Named/keyed services
- ✅ Service factory patterns
- ✅ Extension methods for organization
- ✅ Environment-specific configuration
- ✅ Validation at build time

### Error Handling (15 topics)
- ✅ Exception hierarchy
- ✅ Custom exceptions
- ✅ Global exception middleware
- ✅ Structured logging
- ✅ Health checks
- ✅ Resilience patterns (Polly)
- ✅ Circuit breaker
- ✅ Retry with exponential backoff
- ✅ Timeout policies
- ✅ Bulkhead isolation
- ✅ Fallback strategies
- ✅ Transaction management
- ✅ Crash dumps
- ✅ Log aggregation
- ✅ Application Insights

### XML (15 topics)
- ✅ XML fundamentals
- ✅ XmlDocument (DOM)
- ✅ XElement/XDocument (LINQ)
- ✅ XmlReader (streaming)
- ✅ XmlWriter (streaming output)
- ✅ Namespaces
- ✅ XSD validation
- ✅ XML serialization
- ✅ XSLT transformations
- ✅ XPath queries
- ✅ XML safety (XXE prevention)
- ✅ Performance optimization
- ✅ NuGet packages
- ✅ Parser libraries
- ✅ Real-world examples

### Dependency Injection (12 topics)
- ✅ DI principles
- ✅ Service lifetimes
- ✅ Constructor injection
- ✅ Factory patterns
- ✅ Service resolution
- ✅ Extension methods
- ✅ Testing with mocks
- ✅ Service locator (anti-pattern)
- ✅ Keyed services
- ✅ Decorators
- ✅ Best practices
- ✅ Comparison of approaches

### AutoFac (14 topics)
- ✅ Module system
- ✅ Service registration
- ✅ Service lifetimes in AutoFac
- ✅ Property injection
- ✅ Factory delegates (Func<T>)
- ✅ Lazy<T> instantiation
- ✅ Named services
- ✅ Decorators
- ✅ Assembly scanning
- ✅ Interceptors
- ✅ Owned<T> lifetime
- ✅ vs Built-in DI comparison
- ✅ Plugin architecture
- ✅ Module dependencies

### Polly (12 topics)
- ✅ Retry policies
- ✅ Exponential backoff
- ✅ Linear backoff
- ✅ Jitter implementation
- ✅ Circuit breaker
- ✅ Advanced circuit breaker
- ✅ Timeout policies
- ✅ Bulkhead isolation
- ✅ Fallback strategies
- ✅ Policy wrapping
- ✅ Context usage
- ✅ HttpClientFactory integration

### AutoMapper (12 topics)
- ✅ Basic mapping
- ✅ Profiles
- ✅ ReverseMap
- ✅ Custom value resolvers
- ✅ Type converters
- ✅ Member mapping options
- ✅ Nested objects
- ✅ Collections
- ✅ Conditional mapping
- ✅ Pre/post transformation
- ✅ Dependency injection
- ✅ Best practices

### Validation (10 topics)
- ✅ FluentValidation library
- ✅ String validation
- ✅ Numeric validation
- ✅ Email validation
- ✅ Custom rules
- ✅ Async validation
- ✅ Nested validation
- ✅ Conditional validation
- ✅ Validation middleware
- ✅ MediatR behaviors

### Naming and Guidelines (12 topics)
- ✅ Class naming (PascalCase)
- ✅ Interface naming (I prefix)
- ✅ Method naming (Verb + Noun)
- ✅ Property naming
- ✅ Async method suffix (Async)
- ✅ Constants (UPPER_CASE)
- ✅ Enums
- ✅ Boolean naming (Is/Has/Can)
- ✅ Namespace organization
- ✅ Dynamic vs objects
- ✅ Entity vs DTO separation
- ✅ Binary communication

### Attributes and Middleware (18 topics)
- ✅ Built-in attributes
- ✅ Custom attributes
- ✅ Attribute usage targets
- ✅ Reading attributes (reflection)
- ✅ WebAPI attributes
- ✅ Middleware pipeline
- ✅ Convention-based middleware
- ✅ Factory-based middleware
- ✅ Exception handling middleware
- ✅ Performance logging
- ✅ Request/response logging
- ✅ Rate limiting
- ✅ Conditional middleware
- ✅ Reflection fundamentals
- ✅ When to use reflection
- ✅ When NOT to use reflection
- ✅ Reflection optimization
- ✅ Real-world patterns

### JFrog and Artifacts (15 topics)
- ✅ Artifact repository benefits
- ✅ JFrog Artifactory setup
- ✅ Repository types
- ✅ NuGet package source
- ✅ NuGet.config
- ✅ Command-line setup
- ✅ Visual Studio integration
- ✅ Package publishing
- ✅ CI/CD integration
- ✅ Artifact promotion
- ✅ Access control
- ✅ Custom properties
- ✅ Health checks
- ✅ Backup and recovery
- ✅ Best practices

### Enterprise Architecture (20 topics)
- ✅ Project structure
- ✅ Clean architecture
- ✅ Domain-Driven Design
- ✅ Entities
- ✅ Value objects
- ✅ Domain events
- ✅ Aggregates
- ✅ Repository pattern
- ✅ Unit of Work
- ✅ MediatR commands
- ✅ MediatR queries
- ✅ Validators
- ✅ Mappings
- ✅ Controllers
- ✅ Error handling
- ✅ Service configuration
- ✅ Unit testing
- ✅ Integration testing
- ✅ Kubernetes deployment
- ✅ Monitoring

### Azure Identity (18 topics)
- ✅ Authentication vs Authorization
- ✅ Azure AD tenant architecture
- ✅ User and group management
- ✅ Application registrations
- ✅ Service principals
- ✅ Managed identities
- ✅ System-assigned vs user-assigned
- ✅ Role-Based Access Control
- ✅ Custom roles
- ✅ Conditional Access Policies
- ✅ Identity Protection
- ✅ Risk detection and remediation
- ✅ Multi-tenant scenarios
- ✅ Identity federation
- ✅ Security best practices
- ✅ Monitoring and auditing
- ✅ Cross-tenant access
- ✅ Advanced scenarios

### Azure Key Vault (15 topics)
- ✅ Key Vault objects (secrets, keys, certificates)
- ✅ Secret management operations
- ✅ Key management operations
- ✅ Certificate management
- ✅ AKS integration patterns
- ✅ Managed identity authentication
- ✅ Key Vault CSI driver
- ✅ Certificate auto-rotation
- ✅ Key rotation strategies
- ✅ Security best practices
- ✅ Network security
- ✅ Monitoring and auditing
- ✅ Disaster recovery
- ✅ Performance optimization
- ✅ Caching strategies

### Azure Messaging (16 topics)
- ✅ Service Bus queues
- ✅ Service Bus topics and subscriptions
- ✅ Storage Queues
- ✅ Event Hubs architecture
- ✅ Message routing and filtering
- ✅ Event producer patterns
- ✅ Event consumer patterns
- ✅ Partition management
- ✅ Event Hub to Splunk integration
- ✅ Monitoring and observability
- ✅ Performance optimization
- ✅ Error handling and dead lettering
- ✅ Security best practices
- ✅ Cost optimization
- ✅ High-throughput patterns
- ✅ Real-time processing

### Git and CI/CD (15 topics)
- ✅ Git Flow branching strategy
- ✅ GitHub Flow branching strategy
- ✅ Trunk-based development
- ✅ GitHub Actions workflows
- ✅ Self-hosted runners
- ✅ YAML pipeline configuration
- ✅ Matrix builds
- ✅ Conditional workflows
- ✅ Reusable workflows
- ✅ Runner cleanup and security
- ✅ Sensitive data protection
- ✅ CI/CD best practices
- ✅ Performance optimization
- ✅ Caching strategies
- ✅ Monitoring and troubleshooting

---

## 📋 Content Statistics

- **Total Documents**: 15 markdown files
- **Total Code Examples**: 280+
- **Total Topics Covered**: 280+
- **Average Code Example Lines**: 20-50 lines
- **Total Hours of Content**: ~65 hours
- **Complexity Level**: Enterprise-Grade

---

## 🎓 Learning Prerequisites

### Required Knowledge
- C# 10+ (basic to intermediate)
- Object-oriented programming
- SOLID principles
- SQL Server basics

### Helpful But Optional
- Git and version control
- Docker basics
- Kubernetes concepts
- Azure cloud services

---

## 🚀 How to Use This Guide

### For New Team Members
1. Start with [00_Overview_and_Learning_Path.md](00_Overview_and_Learning_Path.md)
2. Follow the 3-week learning schedule
3. Complete one document per day
4. Practice with provided code examples
5. Ask questions on unclear concepts

### For Quick Lookups
Use the Quick Navigation section above to find specific topics.

### For Project Implementation
Refer to [10_Enterprise_Architecture_and_Best_Practices.md](10_Enterprise_Architecture_and_Best_Practices.md) for complete examples.

### For Code Reviews
Use [07_Software_Development_Guidelines.md](07_Software_Development_Guidelines.md) as reference.

---

## 🔍 Finding Specific Topics

### By Frequency of Use
1. **Daily**: DI, naming conventions, error handling
2. **Weekly**: Validation, Polly, AutoMapper
3. **Per Project**: Architecture, modules, Artifactory
4. **As Needed**: XML, reflection, attributes

### By Problem Type
- **"How do I register this service?"** → See 01 or 05
- **"What exception should I throw?"** → See 02
- **"How do I validate input?"** → See 06
- **"Should I use dynamic?"** → See 07
- **"How do I create middleware?"** → See 08
- **"How do I publish a package?"** → See 09

---

## 🤝 Contributing and Feedback

### Found an Error?
- Document the issue clearly
- Provide line/section reference
- Suggest correction

### Want to Add Content?
- Ensure it aligns with enterprise standards
- Include production examples
- Add to appropriate section
- Update index if needed

### Have Better Examples?
- Submit with context
- Explain advantage over current example
- Include performance considerations

---

## 📞 Support and Questions

### Common Questions
See [00_Overview_and_Learning_Path.md](00_Overview_and_Learning_Path.md) - "Quick Reference by Scenario" section

### Need More Info?
- Check Microsoft official docs
- Search organization code repository
- Ask team members
- Create internal documentation

---

## 📅 Maintenance and Updates

**Last Updated**: 2026
**Update Frequency**: Quarterly
**Version**: 1.0.0

**Future Topics to Add**:
- [ ] Microservices architecture deep dive
- [ ] CQRS and Event Sourcing
- [ ] Performance optimization techniques
- [ ] Advanced security patterns
- [ ] Message queues (RabbitMQ comparison)
- [ ] Async patterns deep dive
- [ ] Testing best practices expansion
- [ ] Machine learning integration
- [ ] GraphQL APIs
- [ ] Real-time communication (SignalR)

---

## 🏆 Mastery Checklist

After completing all documents, you should be able to:

### Architecture & Design
- [ ] Design a scalable API using DDD
- [ ] Create proper separation of concerns
- [ ] Implement domain events
- [ ] Design repositories and aggregates

### Coding Standards
- [ ] Follow all naming conventions automatically
- [ ] Know when to use dynamic (almost never)
- [ ] Separate entities from DTOs properly
- [ ] Use appropriate communication protocols

### Resilience
- [ ] Implement Polly policies
- [ ] Use circuit breakers effectively
- [ ] Handle errors comprehensively
- [ ] Design health checks

### Data & Configuration
- [ ] Parse XML using appropriate method
- [ ] Choose between DOM, LINQ, and streaming
- [ ] Validate XML with XSD
- [ ] Use XML serialization correctly

### DI & Modules
- [ ] Register services with AutoFac modules
- [ ] Understand all service lifetimes
- [ ] Use decorators and interceptors
- [ ] Design plugin architectures

### DevOps
- [ ] Publish packages to Artifactory
- [ ] Set up GitHub Actions CI/CD pipelines
- [ ] Configure self-hosted runners securely
- [ ] Implement proper versioning and branching
- [ ] Clean sensitive data from runners

### Cloud and Azure
- [ ] Configure Azure AD authentication
- [ ] Use managed identities for resource access
- [ ] Implement Key Vault for secret management
- [ ] Choose appropriate messaging services
- [ ] Set up Event Hub to Splunk integration

---

## 📚 Reference Materials

**Official Documentation**:
- https://docs.microsoft.com/dotnet/
- https://docs.microsoft.com/aspnet/core/

**Key Libraries**:
- Autofac: https://autofac.readthedocs.io/
- Polly: https://github.com/App-vNext/Polly
- AutoMapper: https://docs.automapper.org/
- FluentValidation: https://fluentvalidation.net/

**Tools**:
- JFrog Artifactory: https://jfrog.com/artifactory/
- Azure Kubernetes Service: https://azure.microsoft.com/services/kubernetes-service/

---

## ✅ Checklist Before Production

Before deploying code to production:
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Validation complete
- [ ] DTOs used (not entities)
- [ ] DI configured properly
- [ ] Polly resilience added
- [ ] Health checks implemented
- [ ] Tests written (unit + integration)
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Azure identity configured
- [ ] Secrets in Key Vault (not code)
- [ ] Managed identities used
- [ ] Messaging services configured
- [ ] CI/CD pipeline secure
- [ ] Runner cleanup verified

---

**Happy Learning! 🎉**

Start with [00_Overview_and_Learning_Path.md](00_Overview_and_Learning_Path.md) and follow the recommended schedule.
