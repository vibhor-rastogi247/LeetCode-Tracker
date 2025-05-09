class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        
        unordered_map<string,bool> visisted;
        stack<pair<int,int>> ones;
        int res = 0;
        int rows = grid.size();
        int columns = grid[0].size();
        for(int i = 0 ; i<rows ; i++)
         for(int j = 0 ; j< columns ; j++)
         {
           string key = to_string(i) + "-" + to_string(j);
            visisted[key] = false;
            if(grid[i][j]=='1')
            {
                ones.push({i,j});
            }
         }

         while(!ones.empty())
         {
            
            stack<pair<int,int>> temp;
            auto s = ones.top();
            ones.pop();
            string key = to_string(s.first) + "-" + to_string(s.second);

            if(!visisted[key])
            {
                temp.push({s.first,s.second});
                while(!temp.empty())
                {
                    auto k = temp.top();
                    temp.pop();
                   string key = to_string(k.first) + "-" + to_string(k.second);
                   if(!visisted[key])
                   {
                    visisted[key] = true;
                    
                    //get all 4 valid negihbor
                    if(k.first < rows - 1)
                    {
                        int p = k.first+1;
                        int q = k.second;
                        if(grid[p][q]=='1')
                        {
                             string key = to_string(p) + "-" + to_string(q);
                             if(!visisted[key])
                             {
                                temp.push({p,q});
                             }
                        }
                       

                    }
                    if(k.first >= 1 )
                    {
                        int p = k.first-1;
                        int q = k.second;
                         if(grid[p][q]=='1')
                        {
                             string key = to_string(p) + "-" + to_string(q);
                             if(!visisted[key])
                             {
                                temp.push({p,q});
                             }
                        }
                    }
                     if(k.second < columns - 1)
                    {
                        int p = k.first;
                        int q = k.second+1;
                         if(grid[p][q]=='1')
                        {
                             string key = to_string(p) + "-" + to_string(q);
                             if(!visisted[key])
                             {
                                temp.push({p,q});
                             }
                        }
                    }
                    if(k.second >= 1 )
                    {
                        int p = k.first;
                        int q = k.second-1;
                         if(grid[p][q]=='1')
                        {
                             string key = to_string(p) + "-" + to_string(q);
                             if(!visisted[key])
                             {
                                temp.push({p,q});
                             }
                        }
                    }

                    //push them to temp stack only if not visited and "1"


                   }
                  

                }
                res++;
            }
            
         }
    return res;
    }
};