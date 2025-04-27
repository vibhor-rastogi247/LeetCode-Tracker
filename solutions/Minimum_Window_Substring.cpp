class Solution {
public:
    string minWindow(string s, string t) {

        int n = s.size();
        int m = t.size();
        unordered_map<char, int> f;
        unordered_map<char, int> o;
        unordered_set<char> u;
        string sol = "";
        int l = -1, r = -1;
        int mini = INT_MAX;

        if (n < t.size())
            return sol;

        if (n == 1) {
            if (s[0] == t[0])
                return s;
            return sol;
        }
        for (auto x : t) {
            if (o.count(x) > 0) {
                o[x] += 1;
            } else {
                o[x] = 1;
                f[x] = 0;
                u.insert(x);
            }
        }

        int required = o.size();
        int formed = 0;

        int j = 0;
        for (int i = 0; i <= n - m; i++) {
            bool solFound = false;
            while ((! (solFound = (formed == required))) && j < n) {
                if (u.count(s[j]) > 0) {
                    f[s[j]] += 1;
                    if (f[s[j]] == o[s[j]]) {
                        formed += 1;
                    }
                }
                j++;
            }

            while (formed == required && i < j) {
                if (u.count(s[i]) > 0) {
                    break;
                }
                i++;
            }

            if (solFound) {
                if ((mini > (j - i + 1))) {
                    l = i;
                    r = j;
                    mini = j - i + 1;
                }

                if (u.count(s[i]) > 0) {
                    if (f[s[i]] == o[s[i]]) {
                        formed -= 1;
                    }
                    f[s[i]] -= 1;
                }
            } else {
                if (l != -1)
                    sol = getss(s, l, r);
                return sol;
            }
        }
        if (l != -1)
            sol = getss(s, l, r);
        return sol;
    }

    string getss(string s, int i, int j) {
        string r = "";
        for (; i < j; i++) {
            r += s[i];
        }
        return r;
    }
};