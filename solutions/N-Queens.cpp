class Solution {
public:
        vector<int>  column;
        vector<int> d1;
        vector<int> d2;
        int n;
        vector<vector<string>> ans;
    vector<vector<string>> solveNQueens(int k) {
            n = k;
        for(int i = 0 ; i <2*n+1; i++) // actually column should be n but to save time 
        {
            column.push_back(0);
            d1.push_back(0);
            d2.push_back(0);
        }
     vector<string> a;
     nq(0,a);
     return ans;
        
    }
    string pq(int ix)
    {
        string ret = "";
        for(int i = 0 ; i < n; i++)
        {
            if(i == ix)
            {
                ret = ret+ "Q";
            }else
            {
            ret = ret + ".";
            }
        }
        return ret;
    }
    void nq(int y, vector<string> a)
    {
        if(y == n )
        {
            ans.push_back(a);
        }
        for(int i = 0; i < n ; i++)
        {
            if(column[i] || d1 [i+y] || d2[(n-1)-(y-i )] )
            {
            continue;
            }  
            column[i] = d1 [i+y] = d2[(n-1)-(y-i )] = 1;
            //place a queen at y,i
            a.push_back(pq(i));
            nq(y+1,a);
            //remove placed queen at y,i so that a new queen can be placed at y
             a.pop_back(); // missed this last time
            column[i] = d1 [i+y] = d2[(n-1)-(y-i )] = 0;
        }
    }
    
};