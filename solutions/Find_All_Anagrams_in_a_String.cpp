class Solution {
public:
    vector<int> findAnagrams(string s, string p) {
        
         vector<int> ret;
        int n = s.size();
        int m = p.size();

        if(m>n)
        return ret;

        if(m==n)
        {
            sort(s.begin(),s.end()); 
             sort(p.begin(),p.end());
            if(s==p)
                {
                    ret.push_back(0);
                    return ret;
                }
                else
                {
                    return ret;
                }
        }
            
        int ss[256];
        fill(begin(ss), end(ss), 0); 
        int ps[256];
        fill(begin(ps), end(ps), 0); 
        unordered_set<char> pset;

         
       

        for(auto x : p)
        {
            pset.insert(x);
            ps[x] += 1;
          
        }
        
        for(int i = 0 ; i < m-1 ;i++)
        {
              ss[s[i]] +=1;
        }

        for(int i = 0, j= m-1 ; i < n-m +1; i++,j++ )
        {
            ss[s[j]] += 1;
            if(check(pset,ss,ps))
            {
                ret.push_back(i);
            }
            ss[s[i]] -= 1;

        }
         return ret;
    }

    bool check(unordered_set<char>& pset,int* ss, int* ps )
    {
        for( auto x : pset)
        {
            if(ss[x] != ps[x])
                return false; 
        }
        return true;

    }


};