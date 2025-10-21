import csv
from datetime import datetime, timedelta

def generate_cashflow_data():
    start_date = datetime.now() - timedelta(days=180)
    current_balance = 150000.00  # Starting balance
    records = []
    
    current_date = start_date
    salary_day = 1  Salary on 1st of each month
    
    for day in range(180):
        date_str = current_date.strftime('%Y-%m-%d')
        
        # Salary credit on 1st of each month
        if current_date.day == salary_day:
            current_balance += 75000.00  # Monthly salary
        
        # Regular expenses (weekday vs weekend pattern)
        if current_date.weekday() < 5:  # Weekdays
            daily_expense = random.uniform(800, 2000)
        else:  # Weekend
            daily_expense = random.uniform(1500, 4000)
        
        # Monthly rent on 5th
        if current_date.day == 5:
            daily_expense += 25000.00
        
        # Some random larger expenses
        if random.random() < 0.05:  # 5% chance of larger expense
            daily_expense += random.uniform(3000, 10000)
        
        current_balance -= daily_expense
        
        # Ensure balance doesn't go negative (overdraft scenario)
        if current_balance < -10000:
            current_balance += 50000  # Account top-up
            
        records.append({
            "date": date_str,
            "balance": round(current_balance, 2)
        })
        
        current_date += timedelta(days=1)
    
    # Save to CSV
    with open('account_balance_history.csv', 'w', newline='') as csvfile:
        fieldnames = ['date', 'balance']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for record in records:
            writer.writerow(record)
    
    print(f"Generated {len(records)} cash flow records")
    print("File saved: account_balance_history.csv")

if __name__ == "__main__":
    generate_cashflow_data()