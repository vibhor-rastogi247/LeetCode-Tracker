class Solution {
public:
    int subarraySum(vector<int>& arr, int k) {
        int n = arr.size();
        int i = 0 , j = 0;
        int sum = 0;
        unordered_map<int,int> mp ;
        int res = 0;

        for(int i = 0 ; i < n; i++)
        {
            sum += arr[i];
            if(sum == k)
            {
                res++;
            }
            int saj = sum - k; //sum array j 
        if(mp.count(saj)>0)
        {
            res += mp[saj];
        }
        mp[sum] +=1;
        }
        return res;

    }
};