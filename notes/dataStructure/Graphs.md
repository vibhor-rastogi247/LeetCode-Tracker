
🧭 What are you trying to represent?
====================================

Suppose you have **5 nodes** labeled `0 to 4`, and some edges between them.

Let’s say the edges are:

```
0 — 1
0 — 2
1 — 3
2 — 4
```

This is an **undirected, unweighted** graph. You can represent this in two main ways in C++:

* * *

✅ **1\. Adjacency List (using `vector<vector<int>>`)**
------------------------------------------------------

### ✅ What it is:

Each node stores a **list of neighbors** it is directly connected to.

### ✅ How to declare:

```cpp
int n = 5;
vector<vector<int>> adj(n);  // adj[i] is a list of neighbors of node i
```

### ✅ How to add edges (undirected):

```cpp
adj[0].push_back(1);
adj[1].push_back(0);

adj[0].push_back(2);
adj[2].push_back(0);

adj[1].push_back(3);
adj[3].push_back(1);

adj[2].push_back(4);
adj[4].push_back(2);
```

### ✅ Final structure (`adj` becomes):

```cpp
adj[0] = [1, 2]
adj[1] = [0, 3]
adj[2] = [0, 4]
adj[3] = [1]
adj[4] = [2]
```

This means:

*   Node `0` is connected to `1` and `2`
    
*   Node `1` is connected to `0` and `3`
    
*   ...and so on.
    

🧠 **Efficient for sparse graphs** (few edges)  
🧠 **Fast neighbor lookup**



✅ **1.2\. Adjacency List For Weighted Grapgh **
------------------------------------------------------------
```cpp
int n = 5;
vector<vector<pair<int, int>>> adj(n);  // node ➝ (neighbor, weight)

adj[0].push_back({1, 3});  // edge 0 ➝ 1 with weight 3
```



* * *

✅ **2\. Adjacency Matrix (using `vector<vector<int>> mat`)**
------------------------------------------------------------

### ✅ What it is:

A 2D matrix `mat[i][j]` where:

*   `mat[i][j] = 1` means there's an edge from node `i` to node `j`
    
*   `mat[i][j] = 0` means no edge
    

### ✅ How to declare:

```cpp
int n = 5;
vector<vector<int>> mat(n, vector<int>(n, 0));
```

Now `mat` is a 5×5 grid initialized to 0.

### ✅ Add edges:

```cpp
mat[0][1] = 1;
mat[1][0] = 1;

mat[0][2] = 1;
mat[2][0] = 1;

mat[1][3] = 1;
mat[3][1] = 1;

mat[2][4] = 1;
mat[4][2] = 1;
```

### ✅ Final structure (`mat`) becomes:

```
     0  1  2  3  4
0 |  0  1  1  0  0
1 |  1  0  0  1  0
2 |  1  0  0  0  1
3 |  0  1  0  0  0
4 |  0  0  1  0  0
```

You can now ask:

*   Is `0` connected to `2`? → `mat[0][2] == 1`
    
*   Is `3` connected to `4`? → `mat[3][4] == 0`
    

🧠 Best for **dense graphs**  
🧠 **O(1)** time to check if there's an edge between two nodes

* * *

🔍 Comparison Table
-------------------

| Feature | Adjacency List | Adjacency Matrix |
| --- | --- | --- |
| Declaration | `vector<vector<int>> adj(n)` | `vector<vector<int>> mat(n, vector<int>(n, 0))` |
| Memory for `n` nodes | O(n + e) (e = edges) | O(n²) |
| Add edge | `adj[u].push_back(v)` | `mat[u][v] = 1` |
| Check if edge exists | O(degree of u) (need to loop) | O(1) |
| Good for | Sparse graphs (few edges) | Dense graphs |

* * *

🧪 Which one should _you_ use?
------------------------------

| If... | Use... |
| --- | --- |
| You’re doing BFS/DFS | Adjacency List ✅ |
| You’re solving Topological Sort | Adjacency List ✅ |
| You care about fast edge existence | Matrix |
| You expect ≤ 100 nodes and dense edges | Matrix |
| You want memory efficiency | Adjacency List ✅ |

* * *
