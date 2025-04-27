class Solution {
public:
    int fourSumCount(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3, vector<int>& nums4) {
        vector<int> s1;
        unordered_map<int,int> s2;
        int n =  nums2.size();
        

        for(int i = 0 ; i < n; i++ )
        {
            for(int j = 0; j < n ; j++ )
            {
                s1.push_back(nums1[i] + nums2[j]);

                if(s2.count(nums3[i] + nums4[j]) == 0)
                {
                    s2[nums3[i] + nums4[j]] = 1;
                }else
                {
                    s2[nums3[i] + nums4[j]] += 1;
                }
            }
        }
        int m = s1.size();
        int z = 0;
        for(int i = 0 ; i < m; i++ )
        {
            int key = -s1[i];
            if(s2.count(key)>0)
            {
                z  +=  s2[key];
            }
        }
        return z;
    }
};