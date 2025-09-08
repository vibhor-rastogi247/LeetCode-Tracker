class Solution {
public:
    int findMaxLength(vector<int>& arr) {
        
        int n = arr.size();
        unordered_map<int,int> mp;
        mp[0] = -1; //solve edge case for if sum ever comes to zero

        int sum = 0;
        int res = 0;
        for (int i = 0 ; i < n ; i++)
        {
            sum +=  arr[i] == 0 ? -1 : 1;
            if(mp.count(sum) > 0 )
            {
               res =  max(res, (i - mp[sum]) );
            }else
            {
                mp[sum] = i;
            }

        }
        return res;
    }
};