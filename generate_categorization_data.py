import csv
import random
from datetime import datetime, timedelta

def generate_categorization_data():
    # Indian merchant templates by category
    merchant_templates = {
        "Food & Dining": [
            "SWIGGY", "ZOMATO", "MCDONALDS", "DOMINOS", "CAFE COFFEE DAY", 
            "BARISTA", "PIZZA HUT", "KFC", "BARBEQUE NATION", "LOCAL RESTAURANT",
            "FOOD COURT", "BAKERY", "ICE CREAM PARLOR", "STREET FOOD"
        ],
        "Groceries": [
            "BIGBASKET", "DMART", "MORE SUPERMARKET", "RELIANCE FRESH", 
            "NATURE'S BASKET", "SPAR HYPERMARKET", "LOCAL KIRANA", "VEGETABLE VENDOR",
            "FRUIT MARKET", "GROCERY STORE"
        ],
        "Shopping": [
            "AMAZON INDIA", "FLIPKART", "MYNTRA", "AJIO", "NYKAA", 
            "CROMA", "RELIANCE DIGITAL", "SHOPPERS STOP", "LIFESTYLE", "WEST SIDE"
        ],
        "Transportation": [
            "UBER", "OLA", "RAPIDO", "METRO", "BUS TICKET", "AUTO RICKSHAW", 
            "FUEL STATION", "TOLL PLAZA", "PARKING FEE", "TAXI SERVICE"
        ],
        "Entertainment": [
            "NETFLIX", "AMAZON PRIME", "HOTSTAR", "THEATER", "CINEPOLIS", 
            "PVR CINEMAS", "BOWLING ALLEY", "AMUSEMENT PARK", "CONCERT TICKET"
        ],
        "Rent": [
            "RENT PAYMENT", "HOUSE RENT", "APARTMENT RENT", "MONTHLY RENT"
        ],
        "Healthcare": [
            "APOLLO HOSPITAL", "FORTIS HEALTHCARE", "MAX HOSPITAL", "LOCAL CLINIC",
            "PHARMACY", "MEDICAL STORE", "DOCTOR FEE", "DIAGNOSTIC CENTER"
        ],
        "Salary": [
            "SALARY CREDIT", "MONTHLY SALARY", "PAYROLL", "COMPANY SALARY"
        ],
        "Investment": [
            "MUTUAL FUND", "STOCK INVESTMENT", "FD INTEREST", "RD INTEREST",
            "DIVIDEND INCOME", "CAPITAL GAINS"
        ],
        "Other Income": [
            "FREELANCE INCOME", "BONUS", "REFUND", "GIFT", "REIMBURSEMENT"
        ]
    }
    
    transaction_patterns = [
        "PAYMENT TO {merchant}",
        "{merchant} PURCHASE",
        "{merchant} TRANSACTION",
        "{merchant} BILL PAYMENT", 
        "{merchant} ORDER",
        "{merchant} SERVICE",
        "{merchant} SUBSCRIPTION"
    ]
    
    records = []
    
    # Generate records for each category
    category_counts = {
        "Food & Dining": 250,
        "Groceries": 200,
        "Shopping": 200, 
        "Transportation": 200,
        "Entertainment": 150,
        "Rent": 100,
        "Healthcare": 100,
        "Salary": 150,
        "Investment": 100,
        "Other Income": 50
    }
    
    for category, count in category_counts.items():
        for _ in range(count):
            merchant = random.choice(merchant_templates[category])
            pattern = random.choice(transaction_patterns)
            description = pattern.format(merchant=merchant)
            
            # Add some variations
            if random.random() > 0.7:
                description += f" #{random.randint(1000, 9999)}"
            if random.random() > 0.8:
                description += f" - {random.choice(['MONTHLY', 'WEEKLY', 'QUARTERLY'])}"
                
            records.append({
                "description": description,
                "category": category
            })
    
    # Save to CSV
    with open('transaction_categorization.csv', 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['description', 'category']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for record in records:
            writer.writerow(record)
    
    print(f"Generated {len(records)} categorization records")
    print("File saved: transaction_categorization.csv")

if __name__ == "__main__":
    generate_categorization_data()