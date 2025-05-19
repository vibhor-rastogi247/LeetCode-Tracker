
// class Solution {
// public:
//     bool exist(vector<vector<char>>& board, string word) {
//         int n = board.size(), m = board[0].size();
//         vector<vector<bool>> visited(n, vector<bool>(m, false));

//         for (int i = 0; i < n; ++i) {
//             for (int j = 0; j < m; ++j) {
//                 if (board[i][j] == word[0]) {
//                     if (dfs(board, word, 0, i, j, visited))
//                         return true;
//                 }
//             }
//         }
//         return false;
//     }

//     bool dfs(vector<vector<char>>& board, string& word, int idx, int i, int j, vector<vector<bool>>& visited) {
//         if (idx == word.size()) return true;
//         int n = board.size(), m = board[0].size();
//         if (i < 0 || i >= n || j < 0 || j >= m || visited[i][j] || board[i][j] != word[idx])
//             return false;

//         visited[i][j] = true;

//         int dirs[4][2] = {{1,0}, {-1,0}, {0,1}, {0,-1}};
//         for (auto& d : dirs) {
//             int ni = i + d[0], nj = j + d[1];
//             if (dfs(board, word, idx + 1, ni, nj, visited))
//                 return true;
//         }

//         visited[i][j] = false; // backtrack
//         return false;
//     }
// };

class Solution {
public:
    unordered_set<string> visited;
    bool exist(vector<vector<char>>& board, string word) {
        
        //senquencially start from row by row finding Start character.
        //when start character is found
        //call checkNeigh(vector<vector<char>>& board , string word,int k, int i , int j)
        int i = 0;
        int j = 0;
        int k = 0;
        int n = board.size();
        int m = board[0].size();
        char sc = word[0];
        unordered_map<char,int> found;


         for(int i = 0 ; i < n ; i++)
        {
            for(int j =0 ; j < m; j++)
            {
                found[board[i][j]] +=1;
                
            }
        }
            for(auto c : word)
            {
                 
                if( found[c] <= 0 )
                {
                    return false;
                } 
                found[c] -=1;
            }


        for(int i = 0 ; i < n ; i++)
        {
            for(int j =0 ; j < m; j++)
            {
                if(sc == board[i][j])
                {
                  visited.insert(to_string(i)+" - "+to_string(j));
                bool val = checkNeigh(board ,word, 1,i, j);
               if(val)
               return val;
                visited.erase(to_string(i)+" - "+to_string(j));
                }
              
            }
        }
        return false;

    }
        bool checkNeigh(vector<vector<char>>& board , string& word,int k, int i , int j)
        {
            if(k >= word.size())
            {
                return true;
            }
            //check neigh in bound to find the match if character is match call recursively
           
           //ititialize
           int n = board.size();
           int m = board[0].size();
           if((i+1)<n)
           {
            string key = to_string(i+1)+" - "+to_string(j);
            if(board[i+1][j] == word[k] && visited.count(key) == 0 )
            { 
                visited.insert(key);
               bool val = checkNeigh(board ,word, k+1,i+1, j);
               if(val)
               return val;
                visited.erase(key);
            }
           }
            if((i-1)>=0)
           {
            string key = to_string(i-1)+" - "+to_string(j);
            if(board[i-1][j] == word[k]&& visited.count(key) == 0 )
            {
                 visited.insert(key);
                bool val = checkNeigh(board ,word, k+1,i-1, j);
                 if(val)
               return val;
               visited.erase(key);
            }
           }
           if((j+1)<m)
           {
            string key = to_string(i)+" - "+to_string(j+1);
              if(board[i][j+1] == word[k]&& visited.count(key) == 0 )
            {
                 visited.insert(key);
                bool val = checkNeigh(board ,word, k+1,i, j+1);
                 if(val)
               return val;
               visited.erase(key);
            }
           }
            if((j-1)>=0)
           {
            string key = to_string(i)+" - "+to_string(j-1);
             if(board[i][j-1] == word[k]&& visited.count(key) == 0 )
            {
                 visited.insert(key);
                bool val = checkNeigh(board ,word, k+1,i, j-1);
                 if(val)
               return val;
               visited.erase(key);
            }
           }

            return false;

        }
};