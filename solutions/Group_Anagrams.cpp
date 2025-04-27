#include<bits/stdc++.h>
class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        
        unordered_map<string,vector<string>> hm;
        vector<vector<string>> res;
        for(auto x : strs)
        {
            
            string key = x;
            sort(key.begin(), key.end());
            if((hm.count(key)) != 0 ) 
            {
                hm[key].push_back(x);
            }else{
                 vector<string> temp;
                 temp.push_back(x);
                 hm[key] = temp;
            }
        }

        for(auto x : hm)
        {
            res.push_back(x.second);
        }
        return res;
    }
};