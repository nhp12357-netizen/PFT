from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from frontend

# Dashboard route
@app.route("/api/dashboard")
def dashboard():
    return jsonify({
        "total_balance": 1250.75,
        "monthly_income": 3000,
        "monthly_expense": 1750,
        "savings_rate": 41.6
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
