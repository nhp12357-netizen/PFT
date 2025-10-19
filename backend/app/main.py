from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from your frontend (localhost:3000)

# Dashboard route
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    return jsonify({
        "total_balance": 1250.75,
        "monthly_income": 3000,
        "monthly_expense": 1750,
        "savings_rate": 41.6,
        "recent_transactions": [
            {"name": "Swiggy Food Delivery", "amount": -25, "category": "Food & Dining", "is_anomaly": False},
            {"name": "Salary Credit", "amount": 3000, "category": "Salary", "is_anomaly": False},
            {"name": "Large Purchase", "amount": -350, "category": "Shopping - ANOMALY DETECTED", "is_anomaly": True}
        ],
        "budget_alerts": [
            {"name": "Food & Dining", "spent": 450, "limit": 500, "status": "yellow"},
            {"name": "Rent", "spent": 1200, "limit": 1200, "status": "green"},
            {"name": "Entertainment", "spent": 200, "limit": 150, "status": "red"}
        ]
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
