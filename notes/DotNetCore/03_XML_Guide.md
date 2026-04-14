# XML in .NET Core: Complete Guide

## What is XML?

XML (Extensible Markup Language) is a text-based format for representing structured data. It uses a system of tags to describe data structure and content, making it human-readable and machine-processable.

### XML Fundamentals

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
    <users>
        <user id="1">
            <name>John Doe</name>
            <email>john@example.com</email>
            <roles>
                <role>Admin</role>
                <role>Manager</role>
            </roles>
        </user>
        <user id="2">
            <name>Jane Smith</name>
            <email>jane@example.com</email>
        </user>
    </users>
</root>
```

**Key Concepts:**
- **Elements**: Tags that enclose data (`<name>John Doe</name>`)
- **Attributes**: Properties of elements (`id="1"`)
- **Nodes**: Hierarchical structure
- **Declaration**: XML version and encoding
- **Well-Formed**: Properly nested and closed tags
- **Namespaces**: Organize XML elements to avoid conflicts

### XML Namespaces

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root xmlns="http://schemas.example.com/core"
      xmlns:addr="http://schemas.example.com/address"
      xmlns:contact="http://schemas.example.com/contact">
    
    <user id="1">
        <name>John Doe</name>
        <addr:address>
            <addr:street>123 Main St</addr:street>
            <addr:city>Springfield</addr:city>
        </addr:address>
        <contact:email>john@example.com</contact:email>
    </user>
</root>
```

## .NET Core XML Processing Methods

### 1. **XmlDocument** (DOM - Document Object Model)

Loads entire XML into memory as a tree structure. Good for small to medium documents and when you need random access.

```csharp
public class XmlDocumentExample
{
    public static void ParseWithXmlDocument()
    {
        var doc = new XmlDocument();
        doc.Load("users.xml");
        
        // Navigate to root
        var root = doc.DocumentElement;
        Console.WriteLine($"Root element: {root.Name}");
        
        // Get all user nodes
        var userNodes = doc.GetElementsByTagName("user");
        
        foreach (XmlNode userNode in userNodes)
        {
            var id = userNode.Attributes["id"].Value;
            var name = userNode.SelectSingleNode("name").InnerText;
            var email = userNode.SelectSingleNode("email").InnerText;
            
            Console.WriteLine($"ID: {id}, Name: {name}, Email: {email}");
        }
    }
    
    public static void CreateXmlDocument()
    {
        var doc = new XmlDocument();
        
        // Create declaration
        var declaration = doc.CreateXmlDeclaration("1.0", "UTF-8", null);
        doc.AppendChild(declaration);
        
        // Create root element
        var root = doc.CreateElement("users");
        doc.AppendChild(root);
        
        // Create user element
        var user = doc.CreateElement("user");
        user.SetAttribute("id", "1");
        
        var name = doc.CreateElement("name");
        name.InnerText = "John Doe";
        user.AppendChild(name);
        
        var email = doc.CreateElement("email");
        email.InnerText = "john@example.com";
        user.AppendChild(email);
        
        root.AppendChild(user);
        
        // Save to file
        doc.Save("output.xml");
        
        // Convert to string
        var xmlString = doc.OuterXml;
    }
}
```

**Pros:**
- Easy random access to any element
- Complete control over structure
- Good for small to medium documents

**Cons:**
- Loads entire document into memory
- Slower for large files
- More memory consumption

### 2. **XElement and XDocument** (LINQ to XML)

Modern approach, more flexible and efficient than XmlDocument.

```csharp
public class LinqToXmlExample
{
    public static void ParseWithXDocument()
    {
        // Load XML document
        var doc = XDocument.Load("users.xml");
        
        // Query using LINQ
        var users = doc.Root
            .Elements("user")
            .Select(u => new
            {
                Id = u.Attribute("id").Value,
                Name = u.Element("name").Value,
                Email = u.Element("email").Value,
                Roles = u.Element("roles")
                    ?.Elements("role")
                    .Select(r => r.Value)
                    .ToList() ?? new List<string>()
            })
            .ToList();
        
        foreach (var user in users)
        {
            Console.WriteLine($"ID: {user.Id}, Name: {user.Name}");
            Console.WriteLine($"Roles: {string.Join(", ", user.Roles)}");
        }
    }
    
    public static void CreateWithXDocument()
    {
        var doc = new XDocument(
            new XDeclaration("1.0", "UTF-8", null),
            new XElement("users",
                new XElement("user",
                    new XAttribute("id", "1"),
                    new XElement("name", "John Doe"),
                    new XElement("email", "john@example.com"),
                    new XElement("roles",
                        new XElement("role", "Admin"),
                        new XElement("role", "Manager")
                    )
                ),
                new XElement("user",
                    new XAttribute("id", "2"),
                    new XElement("name", "Jane Smith"),
                    new XElement("email", "jane@example.com")
                )
            )
        );
        
        doc.Save("output.xml");
        Console.WriteLine(doc.ToString()); // Pretty print
    }
    
    public static void ModifyXDocument()
    {
        var doc = XDocument.Load("users.xml");
        
        // Add new user
        var newUser = new XElement("user",
            new XAttribute("id", "3"),
            new XElement("name", "Bob Wilson"),
            new XElement("email", "bob@example.com")
        );
        
        doc.Root.Add(newUser);
        
        // Update existing user
        var userToUpdate = doc.Root
            .Elements("user")
            .FirstOrDefault(u => u.Attribute("id").Value == "1");
        
        if (userToUpdate != null)
        {
            userToUpdate.Element("email").Value = "newemail@example.com";
        }
        
        // Delete user
        userToUpdate?.Remove();
        
        doc.Save("output.xml");
    }
}
```

**Pros:**
- LINQ integration for querying
- Functional-style API
- More efficient memory management
- Better for complex transformations

**Cons:**
- Still loads entire document into memory
- Less efficient than streaming for very large files

### 3. **XmlReader** (Streaming/Forward-Only)

Best for large XML files. Processes one element at a time without loading entire document.

```csharp
public class XmlReaderExample
{
    public static void StreamLargeXmlFile()
    {
        var settings = new XmlReaderSettings
        {
            ConformanceLevel = ConformanceLevel.Document,
            IgnoreWhitespace = true,
            IgnoreComments = true
        };
        
        using (var reader = XmlReader.Create("largefile.xml", settings))
        {
            while (reader.Read())
            {
                if (reader.NodeType == XmlNodeType.Element && 
                    reader.Name == "user")
                {
                    var id = reader.GetAttribute("id");
                    
                    reader.ReadToFollowing("name");
                    var name = reader.ReadElementString();
                    
                    reader.ReadToFollowing("email");
                    var email = reader.ReadElementString();
                    
                    Console.WriteLine($"ID: {id}, Name: {name}, Email: {email}");
                }
            }
        }
    }
    
    public static void ReadXmlWithNamespaces()
    {
        var settings = new XmlReaderSettings
        {
            ConformanceLevel = ConformanceLevel.Document,
            NameTable = new NameTable()
        };
        
        var namespaceManager = new XmlNamespaceManager(settings.NameTable);
        namespaceManager.AddNamespace("core", "http://schemas.example.com/core");
        namespaceManager.AddNamespace("addr", "http://schemas.example.com/address");
        
        using (var reader = XmlReader.Create("namespaced.xml", settings))
        {
            while (reader.Read())
            {
                if (reader.NodeType == XmlNodeType.Element)
                {
                    var localName = reader.LocalName;
                    var ns = reader.NamespaceURI;
                    Console.WriteLine($"Element: {ns}:{localName}");
                }
            }
        }
    }
}
```

**Pros:**
- Memory efficient
- Processes one element at a time
- Best for very large files
- High performance

**Cons:**
- Forward-only navigation
- More complex code
- Requires careful state management

### 4. **XmlWriter** (Streaming Output)

Efficient way to write large XML documents.

```csharp
public class XmlWriterExample
{
    public static void WriteXmlWithXmlWriter()
    {
        var settings = new XmlWriterSettings
        {
            Indent = true,
            IndentChars = "  ",
            NewLineChars = Environment.NewLine,
            Encoding = Encoding.UTF8
        };
        
        using (var writer = XmlWriter.Create("output.xml", settings))
        {
            writer.WriteStartDocument();
            writer.WriteStartElement("users");
            
            // Write user data
            for (int i = 1; i <= 100000; i++)
            {
                writer.WriteStartElement("user");
                writer.WriteAttributeString("id", i.ToString());
                
                writer.WriteElementString("name", $"User {i}");
                writer.WriteElementString("email", $"user{i}@example.com");
                
                writer.WriteStartElement("roles");
                writer.WriteElementString("role", "User");
                writer.WriteEndElement(); // roles
                
                writer.WriteEndElement(); // user
            }
            
            writer.WriteEndElement(); // users
            writer.WriteEndDocument();
        }
    }
    
    public static void WriteWithNamespaces()
    {
        var settings = new XmlWriterSettings
        {
            Indent = true,
            Encoding = Encoding.UTF8
        };
        
        using (var writer = XmlWriter.Create("namespaced.xml", settings))
        {
            writer.WriteStartDocument();
            
            writer.WriteStartElement("root");
            writer.WriteAttributeString("xmlns", "http://schemas.example.com/core");
            writer.WriteAttributeString("xmlns", "addr", null, "http://schemas.example.com/address");
            
            writer.WriteStartElement("user");
            writer.WriteAttributeString("id", "1");
            
            writer.WriteElementString("name", "John Doe");
            
            writer.WriteStartElement("addr", "address", "http://schemas.example.com/address");
            writer.WriteElementString("addr", "street", "http://schemas.example.com/address", "123 Main St");
            writer.WriteElementString("addr", "city", "http://schemas.example.com/address", "Springfield");
            writer.WriteEndElement(); // address
            
            writer.WriteEndElement(); // user
            writer.WriteEndElement(); // root
            writer.WriteEndDocument();
        }
    }
}
```

## XSD (XML Schema Definition)

XSD validates XML structure and content.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="users">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="user" type="UserType" maxOccurs="unbounded"/>
            </xs:sequence>
        </xs:complexType>
    </xs:element>
    
    <xs:complexType name="UserType">
        <xs:sequence>
            <xs:element name="name" type="xs:string"/>
            <xs:element name="email" type="xs:string"/>
            <xs:element name="roles" type="RolesType" minOccurs="0"/>
        </xs:sequence>
        <xs:attribute name="id" type="xs:int" use="required"/>
    </xs:complexType>
    
    <xs:complexType name="RolesType">
        <xs:sequence>
            <xs:element name="role" type="xs:string" maxOccurs="unbounded"/>
        </xs:sequence>
    </xs:complexType>
</xs:schema>
```

### XSD Validation in .NET

```csharp
public class XsdValidationExample
{
    public static void ValidateXmlAgainstXsd()
    {
        var settings = new XmlReaderSettings();
        settings.Schemas.Add(null, "schema.xsd");
        settings.ValidationType = ValidationType.Schema;
        
        // Handle validation errors
        var validationErrors = new List<string>();
        settings.ValidationEventHandler += (sender, e) =>
        {
            validationErrors.Add($"{e.Severity}: {e.Message}");
        };
        
        using (var reader = XmlReader.Create("data.xml", settings))
        {
            try
            {
                while (reader.Read())
                {
                    // Process valid XML
                }
                
                if (validationErrors.Count == 0)
                {
                    Console.WriteLine("XML is valid according to schema");
                }
                else
                {
                    Console.WriteLine("Validation errors found:");
                    foreach (var error in validationErrors)
                    {
                        Console.WriteLine($"  - {error}");
                    }
                }
            }
            catch (XmlSchemaValidationException ex)
            {
                Console.WriteLine($"Schema validation failed: {ex.Message}");
            }
        }
    }
}
```

## XML Serialization in .NET

### XmlSerializer

```csharp
[XmlRoot("user")]
public class User
{
    [XmlAttribute("id")]
    public int Id { get; set; }
    
    [XmlElement("name")]
    public string Name { get; set; }
    
    [XmlElement("email")]
    public string Email { get; set; }
    
    [XmlArray("roles")]
    [XmlArrayItem("role")]
    public List<string> Roles { get; set; } = new();
}

public class XmlSerializationExample
{
    public static void SerializeToXml()
    {
        var user = new User
        {
            Id = 1,
            Name = "John Doe",
            Email = "john@example.com",
            Roles = new List<string> { "Admin", "Manager" }
        };
        
        var serializer = new XmlSerializer(typeof(User));
        
        // Serialize to file
        using (var stream = File.Create("user.xml"))
        {
            serializer.Serialize(stream, user);
        }
        
        // Serialize to string
        var stringWriter = new StringWriter();
        using (var xmlWriter = XmlWriter.Create(stringWriter, new XmlWriterSettings 
        { 
            Indent = true 
        }))
        {
            serializer.Serialize(xmlWriter, user);
            Console.WriteLine(stringWriter.ToString());
        }
    }
    
    public static void DeserializeFromXml()
    {
        var serializer = new XmlSerializer(typeof(User));
        
        // Deserialize from file
        using (var stream = File.OpenRead("user.xml"))
        {
            var user = (User)serializer.Deserialize(stream);
            Console.WriteLine($"Name: {user.Name}, Email: {user.Email}");
        }
        
        // Deserialize from string
        var xml = @"<?xml version=""1.0"" encoding=""utf-8""?>
                   <user id=""1"">
                       <name>John Doe</name>
                       <email>john@example.com</email>
                   </user>";
        
        using (var reader = new StringReader(xml))
        {
            var user = (User)serializer.Deserialize(reader);
        }
    }
}
```

## XSLT (XML Stylesheet Language Transformations)

Transform XML from one format to another.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" indent="yes"/>
    
    <xsl:template match="/">
        <html>
            <body>
                <table border="1">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                    </tr>
                    <xsl:for-each select="users/user">
                        <tr>
                            <td><xsl:value-of select="@id"/></td>
                            <td><xsl:value-of select="name"/></td>
                            <td><xsl:value-of select="email"/></td>
                        </tr>
                    </xsl:for-each>
                </table>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
```

```csharp
public class XsltExample
{
    public static void TransformXmlWithXslt()
    {
        var transform = new XslCompiledTransform();
        transform.Load("transform.xslt");
        
        // Transform to file
        transform.Transform("users.xml", "output.html");
        
        // Transform to string
        var stringWriter = new StringWriter();
        using (var xmlWriter = XmlWriter.Create(stringWriter))
        {
            transform.Transform("users.xml", null, xmlWriter);
            Console.WriteLine(stringWriter.ToString());
        }
    }
}
```

## .NET XML Packages and NuGet Libraries

| Package | Purpose | Use Case |
|---------|---------|----------|
| System.Xml | Built-in XML processing | Basic XML parsing |
| System.Xml.Linq | LINQ to XML | Modern XML querying |
| System.Xml.XPath | XPath queries | Navigating XML documents |
| System.Xml.XmlDocument | DOM model | Full control over XML tree |
| System.Xml.Serialization | XML serialization | Mapping objects to XML |
| AngleSharp | HTML/XML parsing | Web scraping |
| HtmlAgilityPack | HTML/XML manipulation | Complex HTML parsing |
| XDocument | LINQ integration | Functional XML processing |

```csharp
// Example with additional packages
public class AdvancedXmlExample
{
    // Using XPath
    public static void QueryWithXPath()
    {
        var doc = new XmlDocument();
        doc.Load("users.xml");
        
        var navigator = doc.CreateNavigator();
        var nodeIterator = navigator.Select("//user[@id='1']/email");
        
        while (nodeIterator.MoveNext())
        {
            Console.WriteLine(nodeIterator.Current.Value);
        }
    }
}
```

## XML Best Practices in .NET Core

1. **Use LINQ to XML** for new code (more modern and efficient)
2. **Use XmlReader** for processing large files
3. **Always validate** against XSD schema
4. **Handle namespaces** explicitly
5. **Use specific exceptions** when parsing XML
6. **Cache XslCompiledTransform** objects
7. **Validate input** to prevent XXE (XML External Entity) attacks
8. **Use DTD processing** with caution

```csharp
// Safe XML parsing example
public class SafeXmlProcessing
{
    public static XDocument LoadXmlSafely(string filePath)
    {
        var settings = new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Prohibit,
            XmlResolver = null,
            MaxCharactersFromExternalSource = 0,
            ConformanceLevel = ConformanceLevel.Document
        };
        
        using (var reader = XmlReader.Create(filePath, settings))
        {
            return XDocument.Load(reader);
        }
    }
}
```
