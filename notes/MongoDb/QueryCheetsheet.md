
* * *

🧠 **MongoDB Aggregation Pipeline Cheat Sheet**
===============================================

> Aggregation in MongoDB is like advanced SQL queries — think `WHERE`, `GROUP BY`, `JOIN`, `ORDER BY`, `LIMIT`, and functions like `SUM`, `AVG`.

* * *

🧱 Basic Structure
------------------

```js
db.collection.aggregate([
  { /* stage 1 */ },
  { /* stage 2 */ },
  ...
])
```

Each stage processes the documents and passes the result to the next stage.

* * *

🔹 Stage Operators with Examples
--------------------------------

### `$match` → Filters documents (like SQL `WHERE`)

```js
{ $match: { status: "active", age: { $gte: 30 } } }
```

* * *

### `$project` → Selects and reshapes fields

```js
{ $project: { name: 1, age: 1, fullName: { $concat: ["$first", " ", "$last"] } } }
```

* * *

### `$group` → Aggregates by `_id` (like `GROUP BY`)

```js
{ $group: {
    _id: "$department",
    count: { $sum: 1 },
    avgSalary: { $avg: "$salary" }
  }
}
```

* * *

### `$sort` → Sorts result (1 = asc, -1 = desc)

```js
{ $sort: { age: -1 } }
```

* * *

### `$limit` / `$skip` → Limit or paginate

```js
{ $limit: 5 }, { $skip: 10 }
```

* * *

### `$addFields` → Adds new computed fields

```js
{ $addFields: { bonus: { $multiply: ["$salary", 0.1] } } }
```

* * *

### `$unset` or `$project: { field: 0 }` → Remove fields

```js
{ $unset: "password" }
// or
{ $project: { password: 0 } }
```

* * *

🔄 Array Operators
------------------

### `$unwind` → Breaks array into multiple docs

```js
{ $unwind: "$tags" }
```

* * *

### `$filter` → Filters array elements

```js
{ $project: {
    filtered: {
      $filter: {
        input: "$scores",
        as: "score",
        cond: { $gte: ["$$score", 90] }
      }
    }
  }
}
```

* * *

### `$arrayElemAt` → Get specific item from array

```js
{ $project: { firstTag: { $arrayElemAt: ["$tags", 0] } } }
```

* * *

🔗 Joining Collections
----------------------

### `$lookup` → Performs a left outer join

```js
{ $lookup: {
    from: "orders",
    localField: "_id",
    foreignField: "user_id",
    as: "user_orders"
  }
}
```

### `$unwind` with `$lookup` → Flatten join results

```js
{ $unwind: "$user_orders" }
```

* * *

🧠 Expression Operators (Used in `$project`, `$match`, etc.)
------------------------------------------------------------

| Operator | Description | Example |
| --- | --- | --- |
| `$sum` | Total sum | `{ $sum: "$amount" }` |
| `$avg` | Average | `{ $avg: "$score" }` |
| `$min`, `$max` | Minimum or maximum | `{ $max: "$score" }` |
| `$multiply` | Multiply values | `{ $multiply: [ "$price", "$qty" ] }` |
| `$concat` | String concatenate | `{ $concat: ["$first", " ", "$last"] }` |
| `$toUpper` | Uppercase string | `{ $toUpper: "$name" }` |
| `$cond` | If/else logic | `{ $cond: [ { $gt: ["$age", 18] }, "Adult", "Minor" ] }` |
| `$eq`, `$gt`, `$lt` | Comparison operators | `{ $gt: ["$score", 90] }` |

* * *

📊 Sample Use Case: Top 5 customers by total orders
---------------------------------------------------

```js
db.orders.aggregate([
  { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
  { $sort: { total: -1 } },
  { $limit: 5 }
])
```

* * *



### `$facet` (Multiple pipelines in parallel)
```js
{ $facet: {
  paginatedResults: [ { $skip: 10 }, { $limit: 5 } ],
  totalCount: [ { $count: "count" } ]
} }
```

### `$merge` (Writes output to another collection)
```js
{ $merge: "summary_collection" }
```

---

## 🔧 Expression Operators

### Arithmetic Operators
| Operator     | Description              |
|--------------|---------------------------|
| `$add`       | Adds numbers or dates     |
| `$subtract`  | Subtracts numbers/dates   |
| `$multiply`  | Multiplies numbers        |
| `$divide`    | Divides numbers           |
| `$mod`       | Remainder of division     |

### String Operators
| Operator     | Description               |
|--------------|----------------------------|
| `$concat`    | Concatenate strings        |
| `$substr`    | Extract substring (legacy) |
| `$substrBytes` / `$substrCP` | Better substrings |
| `$toUpper`   | Convert to uppercase       |
| `$toLower`   | Convert to lowercase       |
| `$trim`, `$ltrim`, `$rtrim` | Trim strings |

### Date Operators
| Operator       | Description               |
|----------------|----------------------------|
| `$dateFromString` | Parse string to date     |
| `$dateToString`   | Format date to string    |
| `$year`, `$month`, `$dayOfMonth` | Extract date parts |
| `$hour`, `$minute`, `$second` | Time parts |

### Array Operators
| Operator         | Description                         |
|------------------|--------------------------------------|
| `$size`          | Array length                        |
| `$arrayElemAt`   | Access by index                     |
| `$filter`        | Filter array elements               |
| `$in`            | Match element in array              |
| `$map`           | Transform array elements            |
| `$reduce`        | Accumulate values                   |

### Comparison Operators
| Operator  | Description                 |
|-----------|------------------------------|
| `$eq`     | Equals                      |
| `$ne`     | Not equals                  |
| `$gt`     | Greater than                |
| `$gte`    | Greater than or equal       |
| `$lt`     | Less than                   |
| `$lte`    | Less than or equal          |
| `$cmp`    | Compare (returns -1, 0, 1)  |
| `$in`     | Value in array              |
| `$nin`    | Value not in array          |

### Logical Operators
| Operator   | Description           |
|------------|------------------------|
| `$and`     | Logical AND            |
| `$or`      | Logical OR             |
| `$not`     | Logical NOT            |
| `$nor`     | Logical NOR            |

### Conditional Operators
| Operator   | Description                          |
|------------|---------------------------------------|
| `$cond`    | If-else logic                         |
| `$ifNull`  | Use default if field is null          |
| `$switch`  | Multiple if-then-else branches        |

---

## 🧪 Example: Top 5 Customers by Total Orders
```js
db.orders.aggregate([
  { $group: { _id: "$customerId", totalAmount: { $sum: "$amount" } } },
  { $sort: { totalAmount: -1 } },
  { $limit: 5 }
])
```

# 📘 MongoDB Airbnb Practice Log & Notes

This document summarizes all the query patterns, challenges solved, and key learnings from working with the `listingAndRatings` collection in the **Airbnb sample dataset**.

---

## ✅ Dataset Used

* **Database**: `imdb`
* **Collection**: `listingAndRatings`
* **Source**: Sample Airbnb data

---

## ✅ Concepts Covered & Questions Solved

### 🔹 1. Basic Find & Projection

* **Find all listings in Brazil**

```js
db.listingAndRatings.find({ "address.country": "Brazil" })
```

* **Limit fields and results**

```js
db.listingAndRatings.find({ "address.country": "Canada" }, { name: 1, price: 1, "address.country": 1, _id: 0 }).limit(5)
```

### 🔹 2. Filter by Numeric Conditions

* **Listings with accommodates > 4**

```js
db.listingAndRatings.find({ accommodates: { $gt: 4 } }).limit(5)
```

### 🔹 3. Counting Documents

* **Using countDocuments for accurate count**

```js
db.listingAndRatings.countDocuments({ "address.country": "Brazil" })
```

* **Using aggregation with \$count**

```js
db.listingAndRatings.aggregate([
  { $match: { "address.country": "Brazil" } },
  { $count: "BrazilCountryCount" }
])
```

### 🔹 4. Aggregation with \$group

* **Group by country and count**

```js
db.listingAndRatings.aggregate([
  { $group: { _id: "$address.country", count: { $sum: 1 } } },
  { $match: { _id: "Brazil" } }
])
```

* **Group without \_id (global aggregation)**

```js
db.listingAndRatings.aggregate([
  { $match: { "address.country": "Brazil" } },
  { $group: { _id: null, total: { $sum: 1 } } }
])
```

### 🔹 5. Unique Amenities with \$unwind

* **Initial attempt caused nested arrays using `$addToSet: "$amenities"`** ❌
* ✅ **Corrected version using \$unwind**

```js
db.listingAndRatings.aggregate([
  { $unwind: "$amenities" },
  { $group: { _id: null, uniqueAmenities: { $addToSet: "$amenities" } } }
])
```

### 🔹 6. Using `$filter` with `$project`

* **Filtered reviews by keyword using \$filter + \$regexMatch** ✅

```js
db.listingAndRatings.aggregate([
  { $match: { "address.country": "Brazil" } },
  {
    $project: {
      name: 1,
      amenities: 1,
      filteredReviews: {
        $filter: {
          input: "$reviews",
          as: "review",
          cond: {
            $regexMatch: {
              input: "$$review.comments",
              regex: /greet/i
            }
          }
        }
      }
    }
  },
  { $unwind: "$amenities" }
])
```

### 🔹 7. Partial Text Search in `$match`

* ✅ Used `$regex` inside `$match` for partial comment text match

```js
db.listingAndRatings.aggregate([
  {
    $match: {
      "address.country": "Brazil",
      "reviews.comments": { $regex: "greet", $options: "i" }
    }
  }
])
```

### 🔹 8. Add Total Field to Each Document

* ✅ Used `$addFields` to add constant value to each matched document

```js
db.listingAndRatings.aggregate([
  { $match: { "address.country": "Brazil" } },
  { $addFields: { bonus: 1 } }
])
```

* ✅ Alternative: Count reviews and add to document

```js
db.listingAndRatings.aggregate([
  { $match: { "address.country": "Brazil" } },
  { $addFields: { totalReviews: { $size: "$reviews" } } }
])
```

---

## ⚠️ Struggles & Fixes

### ❌ Using `$filter` at the top level (wrong)

* **Fixed by placing it inside `$project`**

### ❌ Using `$add` instead of `$sum` in `$group`

* Fixed by using `{ $sum: 1 }` for counting

### ❌ Nested arrays from `$addToSet` on array field

* Fixed with `$unwind` before grouping

### ❌ Confused by `$` vs `$$`

* `$fieldName`: refers to document fields
* `$$var`: refers to user-defined variables inside `$filter`, `$map`, `$let`, etc.

### ❌ Typo in `$regex` (written as `$regix`)

* Corrected and learned proper syntax

### ❌ Syntax error in Compass due to missing commas or using `$filter` at top level

* Resolved by breaking pipeline into valid stages

### ❌ Tried to use `$count` inside `$addFields` (invalid)

* Fixed by using `$addFields: { bonus: 1 }` for constant fields, or `$size` for counting embedded array elements like reviews

---

# 📘 MongoDB Advanced Aggregation Practice: \$map, \$let, \$switch, \$cond, \$lookup, Dashboards

This document covers practice examples using advanced aggregation operators and patterns on the Airbnb `listingAndRatings` dataset, including use of `$map`, `$let`, `$switch`, `$cond`, `$lookup`, and building analytic dashboards.

---

## 🔹 1. Practice with `$map`, `$let`, `$switch`, `$cond`

### ✅ \$map — Transform Amenities to Uppercase

```js
db.listingAndRatings.aggregate([
  {
    $project: {
      name: 1,
      upperAmenities: {
        $map: {
          input: "$amenities",
          as: "item",
          in: { $toUpper: "$$item" }
        }
      }
    }
  }
])
```

### ✅ \$let — Use Local Variables in a Pipeline Stage

The `$let` operator is used to **define temporary variables** inside expressions, making it easier to reuse calculated values or write cleaner logic.

* **Why use `$let`?**

  * Avoid repeating expensive expressions (like `$size`, `$arrayElemAt`, etc.)
  * Group intermediate values for cleaner logic
  * Combine with `$map`, `$cond`, or other expressions

#### 📌 Example: Compute total number of reviews and extract the first comment

```js
db.listingAndRatings.aggregate([
  {
    $project: {
      name: 1,
      reviewStats: {
        $let: {
          vars: {
            total: { $size: "$reviews" },
            firstReview: { $arrayElemAt: ["$reviews", 0] }
          },
          in: {
            totalReviews: "$$total",
            firstComment: "$$firstReview.comments"
          }
        }
      }
    }
  }
])
```

#### ✅ Output Format:

```json
{
  "name": "Modern Loft in Sao Paulo",
  "reviewStats": {
    "totalReviews": 15,
    "firstComment": "Great location and friendly host!"
  }
}
```

#### 🧠 Real-World Use Case:

You can use `$let` to store calculated tax, service fee, or user score once — and then reuse it across multiple nested expressions (instead of recalculating it every time).
```js
db.listingAndRatings.aggregate(\[
{
\$project: {
name: 1,
reviewStats: {
\$let: {
vars: {
total: { \$size: "\$reviews" },
firstReview: { \$arrayElemAt: \["\$reviews", 0] }
},
in: {
totalReviews: "$total",
            firstComment: "$firstReview\.comments"
}
}
}
}
}
])

````


### ✅ $switch — Label Review Volume

```js
db.listingAndRatings.aggregate([
  {
    $addFields: {
      reviewVolume: {
        $switch: {
          branches: [
            { case: { $gte: [{ $size: "$reviews" }, 50] }, then: "high" },
            { case: { $gte: [{ $size: "$reviews" }, 10] }, then: "medium" }
          ],
          default: "low"
        }
      }
    }
  }
])
````

### ✅ \$cond — Conditional Amenity Flag

```js
db.listingAndRatings.aggregate([
  {
    $addFields: {
      hasWifi: {
        $cond: {
          if: { $in: ["Wifi", "$amenities"] },
          then: true,
          else: false
        }
      }
    }
  }
])
```

---

## 🔹 2. Join with Mock Hosts Collection using `$lookup`

Assume another collection `hosts` with fields:

```json
{
  "_id": "host123",
  "name": "John Doe",
  "rating": 4.8
}
```

And documents in `listingAndRatings` contain:

```json
{
  "host_id": "host123"
}
```

### ✅ Join Listings with Host Details

```js
db.listingAndRatings.aggregate([
  {
    $lookup: {
      from: "hosts",
      localField: "host_id",
      foreignField: "_id",
      as: "hostInfo"
    }
  },
  { $unwind: "$hostInfo" },
  {
    $project: {
      name: 1,
      hostName: "$hostInfo.name",
      hostRating: "$hostInfo.rating"
    }
  }
])
```

---

## 🔹 3. Dashboard-Type Aggregation Examples

### ✅ Average Price per City

```js
db.listingAndRatings.aggregate([
  {
    $group: {
      _id: "$address.market",
      avgPrice: { $avg: "$price" }
    }
  },
  { $sort: { avgPrice: -1 } }
])
```

### ✅ Top 5 Amenities Globally

```js
db.listingAndRatings.aggregate([
  { $unwind: "$amenities" },
  { $group: { _id: "$amenities", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 }
])
```

### ✅ Listings Count and Avg Price per Country

```js
db.listingAndRatings.aggregate([
  {
    $group: {
      _id: "$address.country",
      totalListings: { $sum: 1 },
      avgPrice: { $avg: "$price" }
    }
  },
  { $sort: { totalListings: -1 } }
])
```


##  Deep Dive: \$facet and \$merge

### ✅ \$facet — Run multiple aggregations in parallel

Use `$facet` when you want to perform **multiple unrelated aggregations** at the same time on the same input.

```js
db.listingAndRatings.aggregate([
  {
    $facet: {
      highRated: [
        { $match: { "review_scores.review_scores_rating": { $gte: 95 } } },
        { $count: "count" }
      ],
      topAmenities: [
        { $unwind: "$amenities" },
        { $group: { _id: "$amenities", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]
    }
  }
])
```

### ✅ \$merge — Store pipeline output into a collection

`$merge` allows you to **write the result of an aggregation** into another collection.

```js
db.listingAndRatings.aggregate([
  {
    $match: { "address.country": "Brazil" }
  },
  {
    $group: {
      _id: "$address.market",
      total: { $sum: 1 },
      avgPrice: { $avg: "$price" }
    }
  },
  {
    $merge: {
      into: "brazil_city_stats",
      whenMatched: "merge",
      whenNotMatched: "insert"
    }
  }
])
```


### ✅ Deep Dive on `$merge` — Understanding `whenMatched` and `whenNotMatched`

```js
{
  $merge: {
    into: "brazil_city_stats",
    whenMatched: "merge",
    whenNotMatched: "insert"
  }
}
```

#### 🔍 Explanation:

*   **`whenMatched: "merge"`**  
    → If a document with the same `_id` exists in the target collection, MongoDB will **merge** fields from the new document into the existing one.
    
    *   It does **not overwrite the full document**.
        
    *   Only updates the specified fields in the pipeline output.
        
*   **`whenNotMatched: "insert"`**  
    → If no document exists in the target collection with that `_id`, a new document will be inserted.
    

> ⚠️ You can also use:

*   `"replace"` → Replace the full document
    
*   `"fail"` → Throw an error if match exists
    
*   `"discard"` → Do nothing if matched
    

📌 Use `$merge` when building **summary collections**, **dashboards**, or **exporting cleaned views** for reuse.

* * *

🔹 Summary: More Advanced Operators for Interviews
--------------------------------------------------

### ✅ `$bucket` – Group documents into defined ranges

```js
{
  $bucket: {
    groupBy: "$price",
    boundaries: [0, 50, 100, 200, 500],
    default: "Other",
    output: { count: { $sum: 1 } }
  }
}
```

*   Groups documents by price range.
    
*   You control bucket boundaries manually.
    

### ✅ `$bucketAuto` – MongoDB auto-generates ranges

```js
{
  $bucketAuto: {
    groupBy: "$price",
    buckets: 5,
    output: { count: { $sum: 1 } }
  }
}
```

*   MongoDB automatically divides documents into buckets with roughly equal counts.
    

* * *

### ✅ `$graphLookup` – Recursive joins (like a tree traversal)

```js
{
  $graphLookup: {
    from: "employees",
    startWith: "$manager_id",
    connectFromField: "manager_id",
    connectToField: "_id",
    as: "management_chain"
  }
}
```

*   Useful for **hierarchies**, such as category trees or reporting structures.
    
*   Recursively joins a document to its related set (like parent → child).
    

* * *

### ✅ `$function` – Custom JavaScript in aggregation

```js
{
  $addFields: {
    normalizedScore: {
      $function: {
        body: function(score, max) { return score / max },
        args: ["$score", 100],
        lang: "js"
      }
    }
  }
}
```

```js
db.listingAndRatings.aggregate([
  {
    $addFields: {
      normalizedScore: {
        $function: {
          body: function(score, max) {
            return score / max;
          },
          args: ["$review_scores.review_scores_rating", 100],
          lang: "js"
        }
      }
    }
  }
])
````

*   Allows custom calculations you can't express using built-in operators.
    
*   Requires MongoDB 4.4+
    

* * *

### ✅ `$indexStats` – View index usage (read-only stage)

```js

db.listingAndRatings.aggregate([
  { $indexStats: {} }
])
````


*   Returns usage stats for each index.
    
*   Helps optimize query plans by identifying unused or overused indexes.
    

* * *





