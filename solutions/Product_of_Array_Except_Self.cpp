
class Solution {
public:
    vector<int> productExceptSelf(vector<int>& nums) {
        
          int res = 1;
            int zeroCount = 0;
           int n = nums.size();
           
        for ( int x : nums)
        {
            if(x == 0)
            {
                zeroCount++;
            }
             res *= (x == 0 ? 1 : x);
             cout<<res<<" ";
        }
           
   
        for (  int i = 0; i < n ; i++)
        {
            if(zeroCount != n  )
            {
            if(zeroCount > 0 )
            {
                if(zeroCount == 1)
                {
                    
                    nums[i] = nums[i] == 0 ? res : 0;
                }else
                {
                    nums[i] = 0;
                }
            }else
            {
                 nums[i] = res/nums[i];
            }
        }else{
            nums[i] = 0;
        }
        }
               
            
        return nums;
    }
};