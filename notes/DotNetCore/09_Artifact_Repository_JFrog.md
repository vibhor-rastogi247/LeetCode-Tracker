# Artifact Repository and JFrog

## What is an Artifact Repository?

An artifact repository is a centralized storage system for software artifacts (compiled binaries, libraries, packages, configuration files) produced during the software development lifecycle. It acts as a single source of truth for all project dependencies and outputs.

### Benefits of Artifact Repository

```
Benefits:
✓ Version Control - Track all versions of artifacts
✓ Dependency Management - Central location for dependencies
✓ Build Acceleration - Cache dependencies locally
✓ Security - Control access to artifacts
✓ Audit Trail - Track who downloads what and when
✓ CI/CD Integration - Automate artifact retrieval/storage
✓ Network Efficiency - Reduce external downloads
✓ Compliance - License management and reporting
✓ Artifact Promotion - Move artifacts between environments
✓ Storage Optimization - Cleanup unused artifacts
```

## JFrog Artifactory

JFrog Artifactory is the leading universal repository manager supporting all software package types.

### Supported Package Types

```
NuGet (.NET packages)
Maven (Java)
Gradle (Java build system)
npm (JavaScript)
PyPI (Python)
RubyGems (Ruby)
Conan (C/C++)
Docker (Container images)
Helm (Kubernetes)
Debian/RPM (Linux)
Puppet/Chef (IaC)
Bower (JavaScript)
CocoaPods (iOS)
And many more...
```

### JFrog Artifactory Architecture

```
Developer/CI/CD
    ↓
Artifactory
├── Local Repositories (Organization artifacts)
├── Remote Repositories (Proxies external sources)
├── Virtual Repositories (Unified access)
├── Distribution Repositories (Binary distribution)
└── Edge Repositories (Distributed deployment)
```

## Setting Up JFrog Artifactory for .NET Core

### Installation

```bash
# Docker setup (recommended for quick start)
docker run -d -p 8081:8081 -p 8082:8082 \
  --name artifactory \
  releases-docker.jfrog.io/jfrog/artifactory-oss:latest

# Access at http://localhost:8081/artifactory
# Default credentials: admin/password
```

### Creating NuGet Repositories

```
1. Local Repository
   - Type: NuGet
   - Key: nuget-local
   - Description: Internal .NET packages
   
2. Remote Repository
   - Type: NuGet
   - Key: nuget-remote
   - URL: https://api.nuget.org/v3/index.json
   - Description: Proxy to NuGet.org
   
3. Virtual Repository
   - Key: nuget
   - Includes: nuget-local, nuget-remote
   - Default deployment: nuget-local
```

## .NET Core Configuration for JFrog Artifactory

### Configure NuGet Package Source

#### Using NuGet.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <!-- Internal JFrog Repository -->
    <add key="jfrog-artifactory" 
         value="https://artifactory.mycompany.com/artifactory/api/nuget/v3/nuget" />
    
    <!-- NuGet.org as fallback -->
    <add key="nuget.org" 
         value="https://api.nuget.org/v3/index.json" />
  </packageSources>
  
  <packageSourceCredentials>
    <jfrog-artifactory>
      <add key="Username" value="your-username" />
      <add key="ClearTextPassword" value="your-api-key" />
    </jfrog-artifactory>
  </packageSourceCredentials>
  
  <!-- Disable NuGet.org if desired -->
  <disabledPackageSources>
    <add key="Microsoft Visual Studio Offline Packages" value="true" />
  </disabledPackageSources>
</configuration>
```

#### Using Command Line

```bash
# Add NuGet source
dotnet nuget add source \
  https://artifactory.mycompany.com/artifactory/api/nuget/v3/nuget \
  --name jfrog-artifactory \
  --username your-username \
  --password your-api-key

# List sources
dotnet nuget list source

# Remove source
dotnet nuget remove source jfrog-artifactory

# Update source
dotnet nuget update source jfrog-artifactory \
  --username new-username \
  --password new-api-key
```

#### Using Visual Studio

```
1. Tools → NuGet Package Manager → Package Manager Settings
2. Package Sources → Add
3. Name: JFrog Artifactory
4. Source: https://artifactory.mycompany.com/artifactory/api/nuget/v3/nuget
5. Click OK
```

### Project File Configuration

```xml
<!-- .csproj or Directory.Build.props -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    
    <!-- Restore nuget packages from Artifactory -->
    <RestoreSources>
      https://artifactory.mycompany.com/artifactory/api/nuget/v3/nuget;
      https://api.nuget.org/v3/index.json
    </RestoreSources>
  </PropertyGroup>
  
  <!-- Package references with version -->
  <ItemGroup>
    <PackageReference Include="Autofac" Version="7.1.0" />
    <PackageReference Include="Serilog" Version="3.0.0" />
  </ItemGroup>
</Project>
```

## Publishing Custom Packages to Artifactory

### Create a NuGet Package

```csharp
// MyCustomLibrary.csproj
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    
    <!-- Package Metadata -->
    <PackageId>MyCompany.CustomLibrary</PackageId>
    <Version>1.0.0</Version>
    <Authors>Your Name</Authors>
    <Company>MyCompany</Company>
    <Description>Custom utilities library for .NET Core</Description>
    <PackageTags>utilities;helpers;extensions</PackageTags>
    <RepositoryUrl>https://github.com/mycompany/custom-library</RepositoryUrl>
    <RepositoryType>git</RepositoryType>
    <RepositoryBranch>main</RepositoryBranch>
    <LicenseExpression>MIT</LicenseExpression>
    <PackageRequireLicenseAcceptance>false</PackageRequireLicenseAcceptance>
    <PublishRepositoryUrl>true</PublishRepositoryUrl>
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="Autofac" Version="7.1.0" />
  </ItemGroup>
</Project>
```

### Publish Package to Artifactory

```bash
# Build the package
dotnet build -c Release

# Pack the project
dotnet pack --configuration Release --output ./nupkg

# Push to Artifactory
dotnet nuget push ./nupkg/MyCompany.CustomLibrary.1.0.0.nupkg \
  --source https://artifactory.mycompany.com/artifactory/api/nuget/nuget-local \
  --api-key your-api-key
```

### Automated Publishing in CI/CD

```yaml
# GitHub Actions example
name: Publish NuGet Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore dependencies
        run: dotnet restore
      
      - name: Build
        run: dotnet build -c Release
      
      - name: Pack
        run: dotnet pack -c Release --output ./nupkg
      
      - name: Publish to Artifactory
        run: |
          dotnet nuget push ./nupkg/*.nupkg \
            --source ${{ secrets.ARTIFACTORY_URL }} \
            --api-key ${{ secrets.ARTIFACTORY_API_KEY }}
```

## Advanced JFrog Features

### Artifact Promotion

Move artifacts between repositories as they progress through the pipeline.

```bash
# Promote package from staging to release
curl -X POST \
  "https://artifactory.mycompany.com/artifactory/api/plugins/execute/promote" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "promotion",
    "targetRepo": "nuget-release",
    "comment": "Promoted from staging after QA approval",
    "artifacts": [{
      "repo": "nuget-staging",
      "path": "/MyCompany.CustomLibrary/1.0.0"
    }]
  }'
```

### Repository Quotas and Policies

```xml
<!-- Set quota policies -->
<Repository>
  <Key>nuget-local</Key>
  <Quota>
    <MaxStorageSize>100 GB</MaxStorageSize>
    <ExcludedRepositories>
      <ExcludedRepository>nuget-remote</ExcludedRepository>
    </ExcludedRepositories>
  </Quota>
  
  <CleanupPolicy>
    <IncludePatterns>*.nupkg</IncludePatterns>
    <ExcludePatterns>*.symbols.nupkg</ExcludePatterns>
    <LastModifiedDaysAgo>365</LastModifiedDaysAgo>
  </CleanupPolicy>
</Repository>
```

### Access Control and Permissions

```bash
# Create user for CI/CD
curl -X PUT \
  "https://artifactory.mycompany.com/artifactory/api/security/users/ci-deploy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ci-deploy",
    "email": "ci@mycompany.com",
    "password": "secure-password",
    "admin": false,
    "realm": "artifactory",
    "realms": ["artifactory"],
    "groups": ["deployment"]
  }'

# Assign permissions
curl -X PUT \
  "https://artifactory.mycompany.com/artifactory/api/security/permissions/deploy-permission" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "deploy-permission",
    "targets": ["nuget-local"],
    "principals": {
      "users": {
        "ci-deploy": ["manage", "deploy"]
      }
    }
  }'
```

### Metadata and Properties

```bash
# Set custom properties on artifact
curl -X PATCH \
  "https://artifactory.mycompany.com/artifactory/api/metadata/nuget-local/MyCompany.CustomLibrary/1.0.0" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "props": {
      "build.name": ["my-build"],
      "build.number": ["123"],
      "release.type": ["stable"],
      "team": ["platform"]
    }
  }'

# Query by properties
curl -X GET \
  "https://artifactory.mycompany.com/artifactory/api/search/aql?items.find({\$and:[{\"@release.type\":{\"$eq\":\"stable\"}},{\"@team\":{\"$eq\":\"platform\"}}]})" \
  -H "Authorization: Bearer $TOKEN"
```

## CI/CD Integration Examples

### Azure DevOps Pipeline

```yaml
trigger:
  - main

variables:
  buildConfiguration: 'Release'
  artifactoryUrl: 'https://artifactory.mycompany.com/artifactory'
  
jobs:
  - job: Build
    pool:
      vmImage: 'ubuntu-latest'
    steps:
      - task: UseDotNet@2
        inputs:
          version: '8.0.x'
      
      - task: NuGetCommand@2
        inputs:
          command: 'restore'
          feedsToUse: 'config'
          nugetConfigPath: 'NuGet.config'
      
      - task: DotNetCoreCLI@2
        inputs:
          command: 'build'
          arguments: '--configuration $(buildConfiguration)'
      
      - task: DotNetCoreCLI@2
        inputs:
          command: 'pack'
          packagesToPack: '**/MyProject.csproj'
          configuration: '$(buildConfiguration)'
          outputDir: '$(Build.ArtifactStagingDirectory)'
      
      - task: NuGetCommand@2
        inputs:
          command: 'push'
          packagesToPush: '$(Build.ArtifactStagingDirectory)/**/*.nupkg'
          nuGetFeedType: 'external'
          publishFeedUrl: '$(artifactoryUrl)/api/nuget/nuget-local'
          publishVstsFeed: false
          allowPackageConflicts: false
        env:
          NUGET_EXT_API_KEY: $(ARTIFACTORY_API_KEY)
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    options {
        timestamps()
        timeout(time: 1, unit: 'HOURS')
    }
    
    environment {
        ARTIFACTORY_URL = credentials('artifactory-url')
        ARTIFACTORY_CREDENTIALS = credentials('artifactory-credentials')
        BUILD_INFO_FILE = 'build-info.json'
    }
    
    stages {
        stage('Restore') {
            steps {
                sh 'dotnet restore'
            }
        }
        
        stage('Build') {
            steps {
                sh 'dotnet build -c Release'
            }
        }
        
        stage('Pack') {
            steps {
                sh 'dotnet pack -c Release -o ./nupkg'
            }
        }
        
        stage('Upload to Artifactory') {
            steps {
                script {
                    sh '''
                        jfrog config add artifactory \
                            --url="${ARTIFACTORY_URL}" \
                            --user="${ARTIFACTORY_CREDENTIALS_USR}" \
                            --password="${ARTIFACTORY_CREDENTIALS_PSW}"
                        
                        jfrog rt nuget-push ./nupkg/ \
                            --repo=nuget-local \
                            --build-name="${JOB_NAME}" \
                            --build-number="${BUILD_NUMBER}"
                        
                        jfrog rt build-publish "${JOB_NAME}" "${BUILD_NUMBER}"
                    '''
                }
            }
        }
    }
    
    post {
        success {
            archiveArtifacts artifacts: 'nupkg/**/*.nupkg', 
                             allowEmptyArchive: true
        }
        failure {
            emailext(
                subject: "Build Failed: ${env.JOB_NAME}",
                body: "Build ${env.BUILD_NUMBER} failed. Check logs.",
                to: 'devops@mycompany.com'
            )
        }
    }
}
```

## Best Practices for Artifact Management

### Versioning Strategy

```
Semantic Versioning: MAJOR.MINOR.PATCH
Example: 1.0.0

MAJOR: Breaking changes
MINOR: New functionality, backward compatible
PATCH: Bug fixes, backward compatible

Pre-release versions: 1.0.0-alpha, 1.0.0-beta, 1.0.0-rc1
```

### Naming Conventions

```csharp
// Package naming
MyCompany.FeatureName.Version.nupkg
MyCompany.Utils.1.0.0.nupkg
MyCompany.Authentication.2.1.3.nupkg

// Avoid
MyPackage.nupkg
Utils.1.nupkg
whatever-1.0.nupkg
```

### Cleanup and Retention Policies

```
Keep all releases forever
Keep last 5 release candidates
Delete pre-releases older than 30 days
Delete SNAPSHOT builds older than 7 days
Archive old major versions to separate repository
```

### Security Best Practices

```
1. Use API Keys instead of passwords
2. Rotate API keys regularly
3. Implement role-based access control
4. Enable HTTPS/TLS for all communications
5. Audit all artifact uploads/downloads
6. Sign packages with GPG
7. Implement package quarantine for untrusted sources
8. Regular security scanning of packages
```

### Artifact Documentation

```bash
# Include metadata in package
<Project>
  <PropertyGroup>
    <PackageReleaseNotes>
      ## Version 1.0.0
      - Initial release
      - Support for .NET 8.0
      - Breaking changes: Namespace restructured
    </PackageReleaseNotes>
    
    <PackageProjectUrl>
      https://github.com/mycompany/library
    </PackageProjectUrl>
    
    <RepositoryUrl>
      https://github.com/mycompany/library
    </RepositoryUrl>
  </PropertyGroup>
</Project>
```

## Monitoring and Reporting

### Track Artifact Usage

```bash
# Get statistics about a package
curl -X GET \
  "https://artifactory.mycompany.com/artifactory/api/storage/nuget-local/MyCompany.CustomLibrary/1.0.0/MyCompany.CustomLibrary.1.0.0.nupkg/stats" \
  -H "Authorization: Bearer $TOKEN"

# Response includes:
# - Downloads count
# - Last download date
# - Last download by user
# - Unique download IPs
```

### Health Check and Validation

```bash
# Verify artifact integrity
curl -X GET \
  "https://artifactory.mycompany.com/artifactory/api/system/ping" \
  -H "Authorization: Bearer $TOKEN"

# Check repository health
curl -X GET \
  "https://artifactory.mycompany.com/artifactory/api/repositories" \
  -H "Authorization: Bearer $TOKEN"
```

## Disaster Recovery

```bash
# Backup Artifactory database
curl -X POST \
  "https://artifactory.mycompany.com/artifactory/api/system/backup" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "backup_type": "full",
    "incremental": false
  }'

# Export repository
curl -X GET \
  "https://artifactory.mycompany.com/artifactory/api/repositories/nuget-local" \
  -H "Authorization: Bearer $TOKEN" \
  > nuget-local-export.json
```

## Summary

JFrog Artifactory provides:
- **Centralized Package Management**: Single source of truth
- **Multi-Format Support**: All package types in one place
- **High Availability**: Redundancy and disaster recovery
- **Security**: Access control and encryption
- **Performance**: Caching and CDN distribution
- **Integration**: CI/CD, DevOps tools
- **Compliance**: License management, audit trails
- **Scalability**: Handles millions of artifacts

For .NET Core specifically:
- Native NuGet package support
- Seamless Visual Studio integration
- CLI tool integration
- Automated CI/CD pipelines
- Private package hosting
- Build reproducibility
