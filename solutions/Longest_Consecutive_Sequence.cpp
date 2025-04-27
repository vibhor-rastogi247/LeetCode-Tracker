class Solution {
public:
    int longestConsecutive(vector<int>& nums) {
        
        int maxi = 1;
        int curr = 1;
        int n = nums.size();
        if(n ==0 )
        return 0;
        sort(nums.begin(),nums.end());
        for(int i = 0 ; i < n ; i++ )
        {
            curr = 1;
           
            while((i + 1 < n) && ((nums[i] == nums[i+1]) || (nums[i]+1 == nums[i+1])))
            {
               if(nums[i]+1 == nums[i+1])
                curr += 1;
                i++;
            }
          
            maxi = max(maxi,curr);
        }
        return maxi;
    }
};