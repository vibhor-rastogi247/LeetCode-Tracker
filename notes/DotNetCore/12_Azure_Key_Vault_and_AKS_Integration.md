# Azure Key Vault and AKS Integration

## Overview

Azure Key Vault is Microsoft's cloud-based service for securely storing and accessing secrets, keys, and certificates. When integrated with Azure Kubernetes Service (AKS), it provides a robust solution for managing sensitive data in containerized applications. This guide covers comprehensive Key Vault operations and AKS integration patterns.

## Key Vault Fundamentals

### Key Vault Types

#### 1. Standard Key Vault
- Stores secrets, keys, and certificates
- Regional service
- Supports RBAC and access policies

#### 2. Managed HSM
- Hardware Security Module backed
- FIPS 140-2 Level 3 compliant
- For high-security requirements

### Key Vault Objects

#### Secrets
- Sensitive information like passwords, API keys
- Versioned for rotation management
- Can be strings, binary data, or JSON

#### Keys
- Cryptographic keys for encryption/decryption
- Support for RSA, ECDSA, AES
- Key operations: encrypt, decrypt, sign, verify

#### Certificates
- X.509 certificates
- Automatic renewal capabilities
- Integration with certificate authorities

## Key Vault Management

### Creating and Configuring Key Vault

```csharp
using Azure.Security.KeyVault.Secrets;
using Azure.Security.KeyVault.Keys;
using Azure.Security.KeyVault.Certificates;

public class KeyVaultManager
{
    private readonly SecretClient _secretClient;
    private readonly KeyClient _keyClient;
    private readonly CertificateClient _certificateClient;

    public KeyVaultManager(string keyVaultUrl)
    {
        var credential = new DefaultAzureCredential();
        _secretClient = new SecretClient(new Uri(keyVaultUrl), credential);
        _keyClient = new KeyClient(new Uri(keyVaultUrl), credential);
        _certificateClient = new CertificateClient(new Uri(keyVaultUrl), credential);
    }
}
```

### Secret Management

```csharp
public class SecretOperations
{
    private readonly SecretClient _client;

    public async Task<string> SetSecretAsync(string name, string value, DateTime? expires = null)
    {
        var secret = new KeyVaultSecret(name, value);
        if (expires.HasValue)
        {
            secret.Properties.ExpiresOn = expires.Value;
        }

        var response = await _client.SetSecretAsync(secret);
        return response.Value.Value;
    }

    public async Task<string> GetSecretAsync(string name, string version = null)
    {
        var response = await _client.GetSecretAsync(name, version);
        return response.Value.Value;
    }

    public async Task UpdateSecretAsync(string name, string newValue)
    {
        var secret = await _client.GetSecretAsync(name);
        secret.Value.Value = newValue;
        await _client.UpdateSecretAsync(secret.Value.Properties);
    }

    public async Task DeleteSecretAsync(string name)
    {
        var operation = await _client.StartDeleteSecretAsync(name);
        await operation.WaitForCompletionAsync();
    }
}
```

### Key Management

```csharp
public class KeyOperations
{
    private readonly KeyClient _client;

    public async Task<KeyVaultKey> CreateRsaKeyAsync(string name, int keySize = 2048)
    {
        var createKeyOptions = new CreateRsaKeyOptions(name)
        {
            KeySize = keySize,
            KeyOperations = KeyOperation.AllOperations,
            ExpiresOn = DateTimeOffset.Now.AddYears(1)
        };

        return await _client.CreateRsaKeyAsync(createKeyOptions);
    }

    public async Task<byte[]> EncryptAsync(string keyName, byte[] plainText)
    {
        var key = await _client.GetKeyAsync(keyName);
        var encryptResult = await _client.EncryptAsync(
            key.Value.KeyOperations.First(),
            EncryptionAlgorithm.RsaOaep,
            plainText);

        return encryptResult.Ciphertext;
    }

    public async Task<byte[]> DecryptAsync(string keyName, byte[] cipherText)
    {
        var key = await _client.GetKeyAsync(keyName);
        var decryptResult = await _client.DecryptAsync(
            key.Value.KeyOperations.First(),
            EncryptionAlgorithm.RsaOaep,
            cipherText);

        return decryptResult.Plaintext;
    }
}
```

### Certificate Management

```csharp
public class CertificateOperations
{
    private readonly CertificateClient _client;

    public async Task<CertificateOperation> CreateCertificateAsync(
        string certificateName,
        CertificatePolicy policy)
    {
        var createCertificateOptions = new CreateCertificateOptions(
            certificateName,
            policy);

        return await _client.StartCreateCertificateAsync(createCertificateOptions);
    }

    public async Task<KeyVaultCertificateWithPolicy> GetCertificateAsync(string name)
    {
        return await _client.GetCertificateAsync(name);
    }

    public async Task ImportCertificateAsync(string name, X509Certificate2 certificate)
    {
        var importOptions = new ImportCertificateOptions(name, certificate.RawData)
        {
            Password = certificate.HasPrivateKey ? "certificate-password" : null
        };

        await _client.ImportCertificateAsync(importOptions);
    }
}
```

## AKS Integration Patterns

### Managed Identity Integration

#### 1. System-Assigned Managed Identity

```yaml
# AKS cluster with system-assigned MI
apiVersion: containerservice.azure.com/v1
kind: ManagedCluster
metadata:
  name: myAKSCluster
  location: eastus
spec:
  identity:
    type: SystemAssigned
  # ... other cluster config
```

#### 2. User-Assigned Managed Identity

```yaml
# User-assigned MI for AKS
apiVersion: aadpodidentity.k8s.io/v1
kind: AzureIdentity
metadata:
  name: keyvault-identity
  namespace: default
spec:
  type: 0  # User-assigned MI
  resourceID: /subscriptions/<sub>/resourcegroups/<rg>/providers/Microsoft.ManagedIdentity/userAssignedIdentities/<identity>
  clientID: <client-id>

---
apiVersion: aadpodidentity.k8s.io/v1
kind: AzureIdentityBinding
metadata:
  name: keyvault-identity-binding
  namespace: default
spec:
  azureIdentity: keyvault-identity
  selector: keyvault-access
```

### Key Vault CSI Driver

#### Installing CSI Driver

```bash
# Install Key Vault CSI driver
helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm install csi-secrets-store-provider-azure csi-secrets-store-provider-azure/csi-secrets-store-provider-azure

# Install CSI driver
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install secrets-store-csi-driver secrets-store-csi-driver/secrets-store-csi-driver
```

#### SecretProviderClass Configuration

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-kv-secret-provider
spec:
  provider: azure
  parameters:
    usePodIdentity: "true"  # or useVMManagedIdentity: "true"
    keyvaultName: "my-keyvault"
    objects: |
      array:
        - |
          objectName: my-secret
          objectType: secret
        - |
          objectName: my-key
          objectType: key
        - |
          objectName: my-cert
          objectType: cert
    tenantId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### Pod Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    aadpodidbinding: keyvault-identity-binding  # For AAD Pod Identity
spec:
  containers:
  - name: my-container
    image: my-image
    volumeMounts:
    - name: secrets-store
      mountPath: "/mnt/secrets"
      readOnly: true
  volumes:
  - name: secrets-store
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: azure-kv-secret-provider
```

### Application Code Integration

```csharp
public class KeyVaultService
{
    private readonly SecretClient _secretClient;
    private readonly KeyClient _keyClient;

    public KeyVaultService(IConfiguration configuration)
    {
        var keyVaultUrl = configuration["KeyVaultUrl"];
        
        // Use DefaultAzureCredential for AKS managed identity
        var credential = new DefaultAzureCredential();
        
        _secretClient = new SecretClient(new Uri(keyVaultUrl), credential);
        _keyClient = new KeyClient(new Uri(keyVaultUrl), credential);
    }

    public async Task<string> GetDatabaseConnectionStringAsync()
    {
        // Retrieve from mounted volume or API call
        var secret = await _secretClient.GetSecretAsync("database-connection-string");
        return secret.Value.Value;
    }

    public async Task<string> EncryptDataAsync(string data)
    {
        var key = await _keyClient.GetKeyAsync("encryption-key");
        var encryptResult = await _keyClient.EncryptAsync(
            KeyOperation.Encrypt,
            EncryptionAlgorithm.RsaOaep256,
            Encoding.UTF8.GetBytes(data));

        return Convert.ToBase64String(encryptResult.Ciphertext);
    }
}
```

## Advanced Integration Patterns

### Certificate Auto-Rotation

```csharp
public class CertificateRotationService
{
    private readonly CertificateClient _certificateClient;
    private readonly ILogger<CertificateRotationService> _logger;

    public CertificateRotationService(
        CertificateClient certificateClient,
        ILogger<CertificateRotationService> logger)
    {
        _certificateClient = certificateClient;
        _logger = logger;
    }

    public async Task MonitorCertificateExpirationAsync()
    {
        var certificates = _certificateClient.GetPropertiesOfCertificatesAsync();
        
        await foreach (var cert in certificates)
        {
            var certificate = await _certificateClient.GetCertificateAsync(cert.Name);
            var daysUntilExpiration = (certificate.Value.Properties.ExpiresOn - DateTimeOffset.Now).Value.TotalDays;
            
            if (daysUntilExpiration < 30)
            {
                _logger.LogWarning($"Certificate {cert.Name} expires in {daysUntilExpiration} days");
                await RotateCertificateAsync(cert.Name);
            }
        }
    }

    private async Task RotateCertificateAsync(string certificateName)
    {
        // Trigger certificate renewal
        var operation = await _certificateClient.StartRenewCertificateAsync(certificateName);
        await operation.WaitForCompletionAsync();
        
        _logger.LogInformation($"Certificate {certificateName} renewed successfully");
    }
}
```

### Key Rotation Strategy

```csharp
public class KeyRotationService
{
    private readonly KeyClient _keyClient;
    private readonly ILogger<KeyRotationService> _logger;

    public async Task RotateEncryptionKeyAsync(string keyName)
    {
        // Create new key version
        var newKey = await _keyClient.CreateRsaKeyAsync(
            keyName,
            new CreateRsaKeyOptions(keyName)
            {
                KeySize = 2048,
                KeyOperations = KeyOperation.AllOperations
            });

        _logger.LogInformation($"New key version created: {newKey.Value.Id}");

        // Update applications to use new key version
        await UpdateApplicationConfigurationAsync(keyName, newKey.Value.Id);

        // Archive old key versions after grace period
        await ArchiveOldKeyVersionsAsync(keyName);
    }

    private async Task UpdateApplicationConfigurationAsync(string keyName, Uri keyId)
    {
        // Update configuration store or send notification
        // This could involve updating ConfigMaps, sending events, etc.
    }

    private async Task ArchiveOldKeyVersionsAsync(string keyName)
    {
        var versions = _keyClient.GetPropertiesOfKeyVersionsAsync(keyName);
        var oldVersions = new List<KeyProperties>();
        
        await foreach (var version in versions)
        {
            if (version.CreatedOn < DateTimeOffset.Now.AddDays(-90))
            {
                oldVersions.Add(version);
            }
        }

        foreach (var oldVersion in oldVersions)
        {
            await _keyClient.UpdateKeyPropertiesAsync(
                oldVersion,
                new KeyProperties() { Enabled = false });
        }
    }
}
```

## Security Best Practices

### 1. Access Control

```csharp
// Configure Key Vault access policies
public async Task ConfigureAccessPoliciesAsync(string keyVaultName, string servicePrincipalId)
{
    var accessPolicies = new List<AccessPolicy>
    {
        new AccessPolicy(
            servicePrincipalId,
            new KeyPermissions
            {
                Get = true,
                List = true,
                Encrypt = true,
                Decrypt = true
            },
            new SecretPermissions
            {
                Get = true,
                List = true,
                Set = false  // No set permission for read-only access
            },
            new CertificatePermissions
            {
                Get = true,
                List = true
            })
    };

    var parameters = new VaultCreateOrUpdateParameters
    {
        Location = "eastus",
        Properties = new VaultProperties
        {
            AccessPolicies = accessPolicies,
            Sku = new Sku { Name = SkuName.Standard },
            TenantId = Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx")
        }
    };

    // Apply via ARM template or Azure SDK
}
```

### 2. Network Security

```json
// Key Vault with private endpoint
{
    "type": "Microsoft.KeyVault/vaults",
    "apiVersion": "2021-10-01",
    "name": "[variables('keyVaultName')]",
    "location": "[resourceGroup().location]",
    "properties": {
        "sku": {
            "family": "A",
            "name": "standard"
        },
        "tenantId": "[subscription().tenantId]",
        "accessPolicies": [],
        "networkAcls": {
            "defaultAction": "Deny",
            "bypass": "AzureServices",
            "ipRules": [],
            "virtualNetworkRules": [
                {
                    "id": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('vnetName'), variables('subnetName'))]"
                }
            ]
        }
    }
}
```

### 3. Monitoring and Auditing

```csharp
public class KeyVaultMonitoringService
{
    private readonly ILogger<KeyVaultMonitoringService> _logger;

    public KeyVaultMonitoringService(ILogger<KeyVaultMonitoringService> logger)
    {
        _logger = logger;
    }

    public async Task LogKeyVaultOperationAsync(KeyVaultOperation operation)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = operation.OperationName,
            ["Resource"] = operation.Resource,
            ["Result"] = operation.IsSuccessful ? "Success" : "Failure",
            ["Duration"] = operation.Duration.TotalMilliseconds
        });

        if (operation.IsSuccessful)
        {
            _logger.LogInformation("Key Vault operation completed successfully");
        }
        else
        {
            _logger.LogError(operation.Exception, "Key Vault operation failed");
        }
    }
}
```

## Disaster Recovery

### Key Vault Backup and Restore

```csharp
public class KeyVaultBackupService
{
    private readonly KeyVaultBackupClient _backupClient;

    public KeyVaultBackupService(string keyVaultUrl)
    {
        var credential = new DefaultAzureCredential();
        _backupClient = new KeyVaultBackupClient(new Uri(keyVaultUrl), credential);
    }

    public async Task<string> BackupKeyVaultAsync(string storageAccountUrl, string containerName)
    {
        var backupOperation = await _backupClient.StartBackupAsync(
            new Uri($"{storageAccountUrl}/{containerName}"));

        await backupOperation.WaitForCompletionAsync();
        return backupOperation.Value.FolderUri.ToString();
    }

    public async Task RestoreKeyVaultAsync(string backupFolderUrl)
    {
        var restoreOperation = await _backupClient.StartRestoreAsync(
            new Uri(backupFolderUrl));

        await restoreOperation.WaitForCompletionAsync();
    }
}
```

## Performance Optimization

### Connection Pooling

```csharp
// Configure Key Vault client with connection pooling
public static IServiceCollection AddKeyVaultServices(
    this IServiceCollection services,
    IConfiguration configuration)
{
    var keyVaultUrl = configuration["KeyVaultUrl"];
    
    services.AddSingleton<SecretClient>(sp =>
    {
        var credential = sp.GetRequiredService<DefaultAzureCredential>();
        var options = new SecretClientOptions
        {
            Retry =
            {
                Delay = TimeSpan.FromSeconds(2),
                MaxRetries = 3,
                Mode = RetryMode.Exponential
            }
        };
        
        return new SecretClient(new Uri(keyVaultUrl), credential, options);
    });

    return services;
}
```

### Caching Strategies

```csharp
public class CachedKeyVaultService
{
    private readonly IMemoryCache _cache;
    private readonly SecretClient _secretClient;
    private readonly ILogger<CachedKeyVaultService> _logger;

    public CachedKeyVaultService(
        IMemoryCache cache,
        SecretClient secretClient,
        ILogger<CachedKeyVaultService> logger)
    {
        _cache = cache;
        _secretClient = secretClient;
        _logger = logger;
    }

    public async Task<string> GetSecretCachedAsync(string secretName, TimeSpan? cacheDuration = null)
    {
        var cacheKey = $"kv_secret_{secretName}";
        
        if (_cache.TryGetValue(cacheKey, out string cachedValue))
        {
            _logger.LogDebug($"Retrieved {secretName} from cache");
            return cachedValue;
        }

        var secret = await _secretClient.GetSecretAsync(secretName);
        var value = secret.Value.Value;
        
        var duration = cacheDuration ?? TimeSpan.FromMinutes(5);
        _cache.Set(cacheKey, value, duration);
        
        _logger.LogDebug($"Retrieved {secretName} from Key Vault and cached");
        return value;
    }
}
```

## Summary

Azure Key Vault integration with AKS provides enterprise-grade security for sensitive data in containerized applications. The CSI driver and managed identities make it seamless to access secrets without compromising security.

**Key Takeaways:**
- Use managed identities for authentication
- Implement proper access controls and network restrictions
- Enable monitoring and auditing
- Plan for certificate and key rotation
- Use caching to optimize performance
- Implement backup and disaster recovery strategies