class Solution {
public:
    int trap(vector<int>& height) {
        
        int l = height[0];
        int r = height[height.size()-1];
        int lp =0;
        int rp = height.size()-1;
        int tappedWater = 0;
        while(rp>lp)
        {
            int hl = height[lp];
            int hr = height[rp];
            if(hl<hr)
            {
                tappedWater += l-hl;
                lp++;
                l = max(l,height[lp]);
            }
            else
            {
                 tappedWater += r-hr;
                 rp--;
                 r =  max(r,height[rp]);
            }

        }
        return tappedWater;
    }
};