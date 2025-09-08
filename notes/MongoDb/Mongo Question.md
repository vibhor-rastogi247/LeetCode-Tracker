
* * *

```
db.listingsAndReviews
```

* * *

🧠 MongoDB Query Mastery: Airbnb Dataset Challenge Set
======================================================

* * *

🟢 **Beginner Level (Basic Filtering & Projection)**
----------------------------------------------------

1.  **Find all listings in Canada.**
    
    ```js
    db.listingsAndReviews.find({ "address.country": "Canada" })
    ```
    
2.  **List the first 5 listings with only `name`, `address.country`, and `price`.**
    
3.  **Find listings that can accommodate more than 4 guests.**
    
4.  **Find listings that have a room type of “Entire home/apt”.**
    
5.  **Count how many listings are in Brazil.**
    

* * *

🟡 **Intermediate Level (Logical, Array, Sorting, Regex)**
----------------------------------------------------------

6.  **Find listings with amenities that include “Wifi”.**
    
7.  **Find listings with at least 2 bedrooms and 2 bathrooms.**
    
8.  **Find listings that support pets (amenities include 'Pets allowed').**
    
9.  **List all listings in New York with names starting with “Beautiful”.**
    
10.  **Sort listings in Spain by price descending.**
    
11.  **Find listings that have more than 5 reviews and a review score rating above 90.**
    
12.  **Count listings per country.**
    

* * *

🟠 **Advanced Level (Aggregation, Grouping, Unwinding)**
--------------------------------------------------------

13.  **Group listings by country and return the average number of reviews per listing.**
    
14.  **Find the top 3 countries by total number of listings.**
    
15.  **Unwind the `amenities` field and return the top 5 most common amenities globally.**
    
16.  **Calculate average price per room type in Canada.**
    
17.  **List cities in the US where the average review score is greater than 95.**
    
18.  **Find the listing with the highest number of reviews and show its name, location, and total reviews.**
    

* * *

🔴 **Expert Level (Joins, Complex Pipelines, Conditionals)**
------------------------------------------------------------

19.  **Find listings where the host has a response rate below 90% and accepts long-term stays.**
    
20.  **For each country, calculate:**
    

*   total listings,
    
*   average price,
    
*   percentage of listings with “Kitchen” amenity.
    

21.  **Find listings that have both ‘Wifi’ and ‘Washer’ but not ‘TV’ in amenities.**
    
22.  **Using `$lookup`, simulate a join with host-related data (if you add a mock `hosts` collection).**
    
23.  **Detect price anomalies — listings that are 2x the average price for their city and room type.**
    

* * *

🧩 Bonus Challenge:
-------------------

24.  **Design a leaderboard of cities by average rating, but only include cities with at least 100 listings.**
    
25.  **Build a pipeline to extract the top 5 most common phrases in listing names (hint: `$split`, `$unwind`, `$group`).**
    


