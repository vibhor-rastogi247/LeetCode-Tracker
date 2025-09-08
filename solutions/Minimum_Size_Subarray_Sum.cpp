class Solution {
public:
    int minSubArrayLen(int k, vector<int>& arr) {
        
        int n = arr.size();
        int i = 0 , j = 0;
        int sum = 0;
        int res = INT_MAX;

        for(int i = 0 ; i < n; i++)
        {
            sum += arr[i];
            int target = sum - k;
            if(sum >= k)
            {
                res = min(res, i-j + 1 );
                while(sum >= k && j <= i)
                {
                    sum -= arr[j];
                    j++;
                    if(sum >= k)
                    res = min(res, i-j + 1 );
                }
               
            }
        
        }
        return res == INT_MAX ? 0 : res;
    }
};