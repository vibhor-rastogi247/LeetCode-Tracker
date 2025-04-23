class Solution {
public:
    void setZeroes(vector<vector<int>>& m) {
         int r = m.size();
        int c = m[0].size();
        vector<vector<int>> temp = m;
        for(int i = 0 ; i <r; i++)
        {
            for(int j =0 ; j < c; j++)
            {
                if(temp[i][j]==0)
                setToZero(m,i,j);
            }
        }
        
    }
    void setToZero(vector<vector<int>> &arr, int i, int j)
    { 
        
        int r = arr.size();
        int c = arr[0].size();
        for(int k = 0 ; k < r ; k++)
        {
            arr[k][j] =0;
        }
        for(int k = 0 ; k < c ; k++)
        {
            arr[i][k] =0;
        }
    }


};