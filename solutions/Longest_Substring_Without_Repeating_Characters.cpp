class Solution {
public:
    int lengthOfLongestSubstring(string arr) {
        unordered_set<char> s;
        int n = arr.size();
        int curr = 0;
        int maxi = 0;

        for(int i = 0, j =0; j < n ; j++)
        {
            if(s.count(arr[j]) > 0)
            {
                while(arr[i] != arr[j])
                {
                    s.erase(arr[i]);
                    i++;
                    curr--;
                }
                 s.insert(arr[j]);
                i++;
            }else
            {
                s.insert(arr[j]);
               
                curr++;
            }
           
            maxi = max(maxi,curr);

        }
        return maxi;
    }
};