import csv
import random
from datetime import datetime, timedelta

def generate_anomaly_data():
    # Category-specific spending patterns (mean, std_dev) in INR
    category_spending = {
        "Groceries": {"mean": 2500, "std_dev": 800, "anomaly_threshold": 8000},
        "Food & Dining": {"mean": 800, "std_dev": 400, "anomaly_threshold": 3000},
        "Shopping": {"mean": 2000, "std_dev": 1500, "anomaly_threshold": 10000},
        "Transportation": {"mean": 1500, "std_dev": 800, "anomaly_threshold": 6000},
        "Entertainment": {"mean": 1200, "std_dev": 600, "anomaly_threshold": 4000},
        "Healthcare": {"mean": 800, "std_dev": 500, "anomaly_threshold": 3500}
    }
    
    records = []
    
    # Generate normal transactions (1800 records)
    for category, params in category_spending.items():
        records_per_category = 1800 // len(category_spending)  # ~300 per category
        
        for _ in range(records_per_category):
            # Generate normal amount (within 2 standard deviations)
            amount = max(100, random.gauss(params["mean"], params["std_dev"]))
            amount = round(amount, 2)
            
            # Random date in the last 6 months
            date = datetime.now() - timedelta(days=random.randint(1, 180))
            day_of_week = date.weekday()  # Monday=0, Sunday=6
            month = date.month
            
            records.append({
                "category": category,
                "amount": amount,
                "day_of_week": day_of_week,
                "month": month
            })
    
    # Generate anomalous transactions (200 records)
    for _ in range(200):
        category = random.choice(list(category_spending.keys()))
        params = category_spending[category]
        
        # Generate anomalous amount (beyond threshold)
        anomaly_multiplier = random.uniform(2.0, 5.0)  # 2x to 5x the threshold
        amount = params["anomaly_threshold"] * anomaly_multiplier
        amount = round(amount, 2)
        
        date = datetime.now() - timedelta(days=random.randint(1, 180))
        day_of_week = date.weekday()
        month = date.month
        
        records.append({
            "category": category,
            "amount": amount,
            "day_of_week": day_of_week,
            "month": month
        })
    
    # Shuffle the records
    random.shuffle(records)
    
    # Save to CSV
    with open('spending_patterns.csv', 'w', newline='') as csvfile:
        fieldnames = ['category', 'amount', 'day_of_week', 'month']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for record in records:
            writer.writerow(record)
    
    print(f"Generated {len(records)} anomaly detection records")
    print("File saved: spending_patterns.csv")

if __name__ == "__main__":
    generate_anomaly_data()