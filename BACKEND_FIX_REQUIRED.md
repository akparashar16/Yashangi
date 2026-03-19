# Backend API Fix Required

## Issue: Circular Reference Error (500)

The API endpoint `https://localhost:7195/api/Collection/kurta` is returning a 500 error due to a circular reference in JSON serialization.

### Error Message:
```
System.Text.Json.JsonException: A possible object cycle was detected. 
This can either be due to a cycle or if the object depth is larger than the maximum allowed depth of 32. 
Consider using ReferenceHandler.Preserve on JsonSerializerOptions to support cycles.
```

### Root Cause:
The Product entity has a Category property, and the Category has a Products collection, creating a circular reference:
- Product → Category → Products → Category → Products → ...

### Solution (Backend Fix Required):

In your ASP.NET Core API project, update the JSON serialization configuration:

**Option 1: In Program.cs or Startup.cs**
```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });
```

**Option 2: Use DTOs (Recommended)**
Create Data Transfer Objects (DTOs) that don't include circular references:

```csharp
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public decimal MRP { get; set; }
    // ... other properties
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    // Don't include Category.Products to avoid circular reference
    public List<ProductImageDto> Images { get; set; }
    public List<ProductVariantDto> Variants { get; set; }
}
```

**Option 3: Use [JsonIgnore] attribute**
Add `[JsonIgnore]` to the navigation property that causes the cycle:

```csharp
public class Category
{
    // ... other properties
    [JsonIgnore]
    public virtual ICollection<Product> Products { get; set; }
}
```

### Temporary Workaround:
If you can't modify the backend immediately, you can configure the API to return only the necessary data by modifying the CollectionController to use DTOs or projection.

