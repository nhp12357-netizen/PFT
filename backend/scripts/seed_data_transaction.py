import sqlite3
import os

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
DB_PATH = os.path.join(BASE_DIR, "finance.db")

# Transactions (all 60+ records, corrected to 8 fields)
transactions = [
    ("Starbucks Coffee", 8.50, "2025-07-28", "EXPENSE", 1, 1, None, 0),
    ("KFC Lunch Combo", 12.00, "2025-07-30", "EXPENSE", 1, 1, None, 0),
    ("Walmart Groceries", 65.30, "2025-08-02", "EXPENSE", 2, 2, None, 0),
    ("Trader Joe's Grocery", 54.90, "2025-08-05", "EXPENSE", 1, 2, None, 0),
    ("Amazon Electronics", 120.00, "2025-08-06", "EXPENSE", 1, 3, None, 0),
    ("Zara Clothing", 89.99, "2025-08-08", "EXPENSE", 2, 3, None, 0),
    ("Uber Ride Downtown", 15.20, "2025-08-09", "EXPENSE", 1, 4, None, 0),
    ("Gas Station Fuel", 52.60, "2025-08-10", "EXPENSE", 2, 4, None, 0),
    ("Netflix Subscription", 15.99, "2025-08-11", "EXPENSE", 1, 5, None, 0),
    ("Movie Night Tickets", 24.00, "2025-08-12", "EXPENSE", 1, 5, None, 0),
    ("Monthly Rent Payment", 750.00, "2025-08-01", "EXPENSE", 1, 6, None, 0),
    ("Pharmacy Medicine", 32.40, "2025-08-03", "EXPENSE", 1, 7, None, 0),
    ("Doctor Consultation", 120.00, "2025-08-04", "EXPENSE", 2, 7, None, 0),
    ("Coffee Shop Breakfast", 6.80, "2025-08-05", "EXPENSE", 1, 1, None, 0),
    ("Subway Lunch", 10.50, "2025-08-06", "EXPENSE", 1, 1, None, 0),
    ("Grocery Store Run", 44.20, "2025-08-07", "EXPENSE", 1, 2, None, 0),
    ("Costco Grocery Stock", 95.10, "2025-08-09", "EXPENSE", 2, 2, None, 0),
    ("H&M Clothing", 78.50, "2025-08-10", "EXPENSE", 1, 3, None, 0),
    ("Foot Locker Shoes", 150.00, "2025-08-12", "EXPENSE", 2, 3, None, 1),
    ("Taxi Ride Home", 18.30, "2025-08-13", "EXPENSE", 1, 4, None, 0),
    ("Train Ticket", 9.50, "2025-08-14", "EXPENSE", 2, 4, None, 0),
    ("Spotify Premium", 9.99, "2025-08-15", "EXPENSE", 1, 5, None, 0),
    ("Movie Theatre Popcorn", 14.00, "2025-08-16", "EXPENSE", 1, 5, None, 0),
    ("August Rent", 750.00, "2025-09-01", "EXPENSE", 1, 6, None, 0),
    ("Vaccine Appointment", 50.00, "2025-09-02", "EXPENSE", 1, 7, None, 0),
    ("Dental Checkup", 200.00, "2025-09-03", "EXPENSE", 2, 7, None, 0),
    ("McDonald's Dinner", 11.25, "2025-09-04", "EXPENSE", 1, 1, None, 0),
    ("Sushi Restaurant", 26.40, "2025-09-05", "EXPENSE", 2, 1, None, 0),
    ("Whole Foods Grocery", 67.30, "2025-09-06", "EXPENSE", 1, 2, None, 0),
    ("Local Grocery Shop", 39.90, "2025-09-07", "EXPENSE", 3, 2, None, 0),
    ("Online Fashion Store", 55.00, "2025-09-08", "EXPENSE", 1, 3, None, 0),
    ("Apple Store Accessories", 99.00, "2025-09-09", "EXPENSE", 2, 3, None, 0),
    ("Bus Pass Top-up",25.00,"2025-09-10","EXPENSE",1,4,None,0),
    ("Gas Station",49.20,"2025-09-11","EXPENSE",2,4,None,0),
    ("YouTube Premium",11.99,"2025-09-12","EXPENSE",1,5,None,0),
    ("Concert Ticket",85.00,"2025-09-13","EXPENSE",2,5,None,0),
    ("September Rent",750.00,"2025-10-01","EXPENSE",1,6,None,0),
    ("Eye Clinic Visit",90.00,"2025-10-02","EXPENSE",1,7,None,0),
    ("Pharmacy Vitamins",22.50,"2025-10-03","EXPENSE",2,7,None,0),
    ("Burger King Lunch",8.90,"2025-10-04","EXPENSE",1,1,None,0),
    ("Cafe Latte",5.75,"2025-10-05","EXPENSE",2,1,None,0),
    ("Target Grocery Run",35.40,"2025-10-06","EXPENSE",1,2,None,0),
    ("Farmer's Market",48.10,"2025-10-07","EXPENSE",3,2,None,0),
    ("Clothing Sale Purchase",45.99,"2025-10-08","EXPENSE",1,3,None,0),
    ("Designer Shoes",230.00,"2025-10-09","EXPENSE",2,3,None,1),
    ("Taxi Airport Drop",36.50,"2025-10-10","EXPENSE",1,4,None,0),
    ("Fuel for Car",53.75,"2025-10-11","EXPENSE",2,4,None,0),
    ("Netflix Subscription",15.99,"2025-10-12","EXPENSE",1,5,None,0),
    ("Gaming Subscription",29.99,"2025-10-13","EXPENSE",1,5,None,0),
    ("Designer Bag Purchase",600.00,"2025-10-10","EXPENSE",1,3,None,1),
    ("Walmart Grocery",55.0,"2025-07-05","EXPENSE",1,2,None,0),
    ("Trader Joe's Grocery",40.0,"2025-07-07","EXPENSE",2,2,None,0),
    ("Uniqlo T-shirt",35.0,"2025-07-06","EXPENSE",1,3,None,0),
    ("Zara Dress",85.0,"2025-07-08","EXPENSE",2,3,None,0),
    ("Uber Ride",12.5,"2025-07-05","EXPENSE",1,4,None,0),
    ("Taxi Downtown",18.0,"2025-07-07","EXPENSE",2,4,None,0),
    ("Monthly Rent Payment",750.0,"2025-07-01","EXPENSE",1,6,None,0),
    ("Healthcare Clinic Visit",100.0,"2025-07-03","EXPENSE",1,7,None,0),
    ("Pharmacy Medicine",30.0,"2025-07-05","EXPENSE",2,7,None,0),
    ("Dental Checkup",150.0,"2025-07-07","EXPENSE",3,7,None,0)
]

# Insert into database
with sqlite3.connect(DB_PATH) as conn:
    cursor = conn.cursor()
    for t in transactions:
        cursor.execute("""
            INSERT INTO transactions
            (description, amount, date, transaction_type, account_id, category_id, transfer_id, is_anomaly)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, t)

print(f"✅ Inserted {len(transactions)} transactions into {DB_PATH}")

