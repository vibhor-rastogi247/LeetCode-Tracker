class Solution {
public:
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {

        int n = nums.size();
        int currMax = 0;
        vector<int> res;
        map<int,int> m;
         if(1 == n)
         {
            res.push_back(nums[0]);
         return res;
         }

        for(int i = 0 ; i< k ; i++)
        {
            if(!m.count(nums[i]))
            {
                m[nums[i]] = 1;
            }else
            {
                m[nums[i]] += 1;
            }

        }

        for(int i = 0,j = k  ; i < n - k + 1 ; i++,j++)
        {
            
           res.push_back(m.rbegin()->first);
        
            if(m[nums[i]] == 1)
            {
                m.erase(nums[i]);
            }else
            {
                m[nums[i]] -= 1;
            }

            if(j < n)
            if(!m.count(nums[j]))
            {
                m[nums[j]] = 1;
            }else
            {
                m[nums[j]] += 1;
            }



        }
        return res;

    }
};