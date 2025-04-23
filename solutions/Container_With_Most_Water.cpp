class Solution {
public:
    int maxArea(vector<int>& h) {

        int current = 0;
        int max = 0;
        int n = h.size();
        for (int i = 0, j = n - 1; i < j;) {
            current = h[i] > h[j] ? h[j] * (j - i) : h[i] * (j - i);
            max = max < current ? current : max;
            if (h[i] > h[j])
                j--;
            else
                i++;
        }
        return max;
    }
};