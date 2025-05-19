// class Node{

//     public:
//     string val;
//     vector<Node*> neigh;

//     Node(string _val)
//     {
//         val = _val;
//         neigh = vector<Node*>();
//     }
// }//gpt told over kill


class Solution {
public:
unordered_map<string, vector<string>> graph;

    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {

      if (find(wordList.begin(), wordList.end(), endWord) == wordList.end())
            return 0;
        createGraph(  beginWord,  endWord,  wordList );

        unordered_set<string> visited;
        queue<pair<string,int>> que;
        que.push({beginWord,1});
            visited.insert(beginWord);
        while(!que.empty())
        {
           auto cur =  que.front();
           que.pop();
           int level = cur.second + 1;
        if(cur.first == endWord)
            return cur.second;

            for( auto neigh : graph[cur.first] )
            {
                if(visited.count(neigh)==0)
                {
                    que.push({neigh,level});
                    visited.insert(neigh);
                }
            }
        }


        return 0;
    }

    void createGraph( string beginWord, string endWord, vector<string>& wordList )
    {
        unordered_map<string,vector<string>> gwp;
        wordList.push_back(beginWord);
        //first we process each word and create its generic word pattern
        
        for(auto x : wordList)
        {
            for (int i = 0 ; i < x.size(); i++)
            {
                char temp = x[i];
                x[i] = '*';
                string newStr = x;
                x[i] = temp;
                gwp[newStr].push_back(x);
                
            }
        }

        //now we make graph
        for(auto x : wordList)
        {
            graph[x] = vector<string>();
            for (int i = 0 ; i < x.size(); i++)
            {
                char temp = x[i];
                x[i] = '*';
                string newStr = x;
                x[i] = temp;
                if(gwp.count(newStr)>0)
                {

                    for( auto y : gwp[newStr])
                    {
                        if( y != x)
                        {
                            graph[x].push_back(y);
                        }
                    }
                    
                }
            }
        }

    }
};