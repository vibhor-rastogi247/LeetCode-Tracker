/*
// Definition for a Node.
class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() {
        val = 0;
        neighbors = vector<Node*>();
    }
    Node(int _val) {
        val = _val;
        neighbors = vector<Node*>();
    }
    Node(int _val, vector<Node*> _neighbors) {
        val = _val;
        neighbors = _neighbors;
    }
};
*/

//no need to check cycle
class Solution {
public:
     //initialize a unordered map <int,Node *>
     unordered_map<int,Node*> cache;
     Node* cloneGraph(Node* node) {
        if(node == nullptr|| node == NULL )
        {
            return nullptr;
        }
        
        //create a new node
        Node* newNode  = new Node(node->val);
        int n = node->neighbors.size();
        cache[node->val] = newNode;
        //traverse the graph recursively in loop for its neigh while checing map
        for(int i = 0 ; i < n ; i++)
        {
            if(cache.count(node->neighbors[i]->val) >0)
            {
                newNode->neighbors.push_back( cache[node->neighbors[i]->val]  );
            }else
            {
                newNode->neighbors.push_back( cloneGraph(node->neighbors[i])  );
            }
        }

        return newNode;
        //return new node
    }
};