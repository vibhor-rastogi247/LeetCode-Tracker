

* * *

📄 **C++ `std::map` Complete Notes**
------------------------------------

* * *

### 🔥 **What is `std::map`?**

*   A **sorted associative container** (Balanced Binary Search Tree: Red-Black Tree).
    
*   Stores **key-value pairs (`<key, value>`)**.
    
*   **Unique keys only** — no duplicate keys.
    
*   Always sorted **by key (ascending order by default)**.
    

* * *

### 🟢 **Key Properties:**

| Property | Behavior |
| --- | --- |
| Sorted by key | Ascending (`std::less`) by default |
| Unique keys | No duplicate keys allowed |
| Self-balancing BST | Red-Black Tree under the hood |
| Insertion time | O(log n) |
| Lookup time | O(log n) |
| Access largest element | O(1) using `rbegin()` |
| Access smallest element | O(1) using `begin()` |

* * *

🏆 **Advantage of Being Sorted:**
---------------------------------

### 1️⃣ **Get Largest / Smallest Element Quickly:**

```cpp
m.begin()    // Smallest key
m.rbegin()   // Largest key
```

### 2️⃣ **Range Queries (Lower Bound, Upper Bound):**

*   **`lower_bound(k)`**: First element ≥ k.
    
*   **`upper_bound(k)`**: First element > k.
    
*   Example:
    

```cpp
auto it = m.lower_bound(5);  // Smallest key >= 5
```

### 3️⃣ **Use as Frequency Counter + Sorted Order:**

```cpp
map<int, int> freq;
for (int x : arr)
    freq[x]++;
```

This keeps frequencies sorted by key automatically.

* * *

🟢 **Commonly Used Functions:**
-------------------------------

### ✅ **`insert({key, value})`**

*   Inserts a new pair if key doesn't exist.
    
*   Does **not overwrite** existing value.
    

### ✅ **`m[key]`**

*   Inserts default value (`0` for int) if key does not exist.
    
*   Accesses or modifies the value.
    

* * *

❓ **`count(key)` → What does it return?**
-----------------------------------------

*   Returns **`0` if key not found**, **`1` if key exists** (since keys are unique).
    

```cpp
if (m.count(5)) {
    cout << "Key 5 exists!";
}
```

* * *

🟥 **How to `erase`:**
----------------------

### 1\. **Erase by Key:**

```cpp
m.erase(5);  // Removes key 5 if it exists
```

### 2\. **Erase by Iterator:**

```cpp
auto it = m.find(5);
if (it != m.end())
    m.erase(it);
```

### 3\. **Erase by Range:**

```cpp
m.erase(m.begin(), m.upper_bound(5));  // Erase keys < 5
```

* * *

🔥 **Iterator-based Methods:**
------------------------------

| Method | Returns | Accepts Value / Iterator? |
| --- | --- | --- |
| `begin()` | Iterator to smallest key | Iterator |
| `end()` | Past-the-end iterator | Iterator |
| `rbegin()` | Reverse iterator to largest key | Iterator |
| `rend()` | Reverse past-the-end | Iterator |
| `find(key)` | Iterator to key if found | Value |
| `lower_bound(key)` | Iterator to first ≥ key | Value |
| `upper_bound(key)` | Iterator to first > key | Value |
| `erase(key)` | Remove by value | Value |
| `erase(iterator)` | Remove by iterator | Iterator |
| `erase(range)` | Remove range | Iterator range |

* * *

🟢 **Traversal Example:**
-------------------------

```cpp
for (auto it = m.begin(); it != m.end(); ++it) {
    cout << it->first << " " << it->second << endl;
}
```

### **Reverse Traversal:**

```cpp
for (auto it = m.rbegin(); it != m.rend(); ++it) {
    cout << it->first << " " << it->second << endl;
}
```

* * *

🟠 **Comparator to Reverse Sorting:**
-------------------------------------

```cpp
map<int, int, greater<int>> m;  // Sorted in descending order
```

* * *

📌 **Example Use Cases:**
-------------------------

*   Frequency counting with sorted keys.
    
*   Range queries for scheduling, interval problems.
    
*   Greedy problems where largest/smallest needs to be accessed repeatedly.
    
*   Map-based binary search using `lower_bound` / `upper_bound`.
    

* * *

🏁 **Important Notes:**
-----------------------

| Operation | Complexity |
| --- | --- |
| Insert | O(log n) |
| Erase | O(log n) |
| Find | O(log n) |
| Access smallest/largest | O(1) |
| Iterate sorted order | O(n) |

* * *

Let me know if you'd like this saved as a **PDF document** — I can generate it for you! 😊



---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)