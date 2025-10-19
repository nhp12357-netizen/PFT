import subprocess
import sys

def generate_all_datasets():
    scripts = [
        'generate_categorization_data.py',
        'generate_anomaly_data.py', 
        'generate_cashflow_data.py'
    ]
    
    for script in scripts:
        print(f"\n=== Running {script} ===")
        try:
            result = subprocess.run([sys.executable, script], check=True)
            print(f"✓ {script} completed successfully")
        except subprocess.CalledProcessError as e:
            print(f"✗ {script} failed with error: {e}")
    
    print("\n=== Dataset Generation Complete ===")
    print("Generated files:")
    print("- transaction_categorization.csv (1,500 records)")
    print("- spending_patterns.csv (2,000 records)") 
    print("- account_balance_history.csv (180 records)")

if __name__ == "__main__":
    generate_all_datasets()