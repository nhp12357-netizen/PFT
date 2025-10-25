from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import numpy as np
from datetime import datetime, timedelta
import joblib
app = Flask(__name__)

CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# === DATABASE CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "example.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

with open(os.path.join(BASE_DIR, "models/tfidf_vectorizer.pkl"), "rb") as f:
    vectorizer = joblib.load(f)

with open(os.path.join(BASE_DIR, "models/logistic_regression_model.pkl"), "rb") as f:
    classifier = joblib.load(f)


@app.route("/api/suggest-category", methods=["POST"])
def suggest_category():
    try:
        data = request.json
        description = data.get("description", "").strip()

        if not description:
            return jsonify({"error": "Description is required"}), 400

        # Transform text
        X = vectorizer.transform([description])

        # Predict category
        category_id = classifier.predict(X)[0]
        if hasattr(category_id, "item"):  # convert numpy type to int
            category_id = int(category_id)

        # Fetch category name from database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM categories WHERE id = ?", (category_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "Category not found in database"}), 404

        category_name = row[0]

        return jsonify({
            "category_id": category_id,
            "suggested_category": category_name
        })

    except Exception as e:
        print("Error in suggest-category:", e)
        return jsonify({"error": "Prediction failed"}), 500

# ===== ADD CATEGORY MANAGEMENT ROUTES HERE =====

# Get all categories
@app.route("/api/categories", methods=["GET"])
def fetch_categories():   # renamed from get_categories
    conn = get_db_connection()
    rows = conn.execute("SELECT id, name, type FROM categories").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

# Add new category
@app.route("/api/categories", methods=["POST"])
def create_category():
    data = request.get_json()
    name = data.get("name")
    type_ = data.get("type")  # "INCOME" or "EXPENSE"

    if not name or type_ not in ["INCOME", "EXPENSE"]:
        return jsonify({"error": "Invalid category"}), 400

    conn = get_db_connection()
    try:
        cursor = conn.execute(
            "INSERT INTO categories (name, type) VALUES (?, ?)", (name, type_)
        )
        conn.commit()
        category_id = cursor.lastrowid  # get the inserted row ID
    except sqlite3.IntegrityError:
        return jsonify({"error": "Category already exists"}), 400
    finally:
        conn.close()

    # Return full category object, not just message
    return jsonify({"id": category_id, "name": name, "type": type_}), 201


# Edit category
@app.route("/api/categories/<int:id>", methods=["PUT"])
def update_category(id):   # renamed
    data = request.get_json()
    name = data.get("name")
    type_ = data.get("type")

    if not name or type_ not in ["INCOME", "EXPENSE"]:
        return jsonify({"error": "Invalid category"}), 400

    conn = get_db_connection()
    conn.execute("UPDATE categories SET name=?, type=? WHERE id=?", (name, type_, id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Category updated"})

# Delete category (only if no transactions)
@app.route("/api/categories/<int:id>", methods=["DELETE"])
def remove_category(id):   # renamed
    conn = get_db_connection()
    tx_count = conn.execute(
        "SELECT COUNT(*) AS count FROM transactions WHERE category_id=?", (id,)
    ).fetchone()["count"]
    if tx_count > 0:
        conn.close()
        return jsonify({"error": "Cannot delete category linked to transactions"}), 400
    conn.execute("DELETE FROM categories WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Category deleted"})






# === ADD NEW ACCOUNT ===
@app.route("/api/accounts", methods=["POST"])
def add_account():
    data = request.get_json()
    name = data.get("name")
    acc_type = data.get("type")
    initial_balance = data.get("initial_balance", 0.0)

    if not name or not acc_type:
        return jsonify({"error": "Name and type are required"}), 400

    ALLOWED_TYPES = ('CHECKING', 'SAVINGS', 'CREDIT_CARD')
    if acc_type not in ALLOWED_TYPES:
        return jsonify({"error": f"Invalid account type. Must be one of {ALLOWED_TYPES}"}), 400

    try:
        initial_balance = float(initial_balance)
    except ValueError:
        return jsonify({"error": "Initial balance must be a number"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO accounts (name, type, initial_balance)
            VALUES (?, ?, ?)
        """, (name, acc_type, initial_balance))
        conn.commit()
        new_id = cursor.lastrowid
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Account added successfully", "id": new_id}), 201


# === GET ALL ACCOUNTS ===
@app.route("/api/accounts", methods=["GET"])
def get_accounts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        a.id, 
        a.name, 
        a.type, 
        a.initial_balance,
        COALESCE((SELECT SUM(t.amount)
                  FROM transactions t
                  WHERE t.account_id = a.id), 0) AS current_balance
    FROM accounts a
    """)
    rows = cursor.fetchall()
    conn.close()
    accounts = [dict(row) for row in rows]
    return jsonify(accounts)


@app.route("/api/accounts/<int:id>", methods=["PUT"])
def update_account_name(id):
    data = request.get_json()
    new_name = data.get("name")

    if not new_name:
        return jsonify({"error": "Account name is required"}), 400

    conn = get_db_connection()
    try:
        conn.execute("UPDATE accounts SET name = ? WHERE id = ?", (new_name, id))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this name already exists"}), 400
    finally:
        conn.close()

    return jsonify({"message": "Account name updated successfully"})


# === GET SINGLE ACCOUNT BY ID ===
@app.route("/api/accounts/<int:id>", methods=["GET"])
def get_account_by_id(id):
    """Fetch a single account by its ID, including current balance."""
    conn = get_db_connection()
    cursor = conn.cursor()

    row = cursor.execute("""
        SELECT 
            a.id,
            a.name,
            a.type,
            a.initial_balance,
            COALESCE(
                (SELECT SUM(t.amount)
                 FROM transactions t
                 WHERE t.account_id = a.id), 
                 0
            ) AS current_balance
        FROM accounts a
        WHERE a.id = ?
    """, (id,)).fetchone()

    conn.close()

    if row is None:
        return jsonify({"error": "Account not found"}), 404

    return jsonify(dict(row)), 200

# === DELETE ACCOUNT (ONLY IF NO TRANSACTIONS) ===
@app.route("/api/accounts/<int:id>", methods=["DELETE"])
def delete_account(id):
    """Delete an account only if no transactions are linked to it."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if account exists
    account = cursor.execute("SELECT * FROM accounts WHERE id = ?", (id,)).fetchone()
    if account is None:
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    # Check if any transactions are linked to this account
    tx_count = cursor.execute(
        "SELECT COUNT(*) AS count FROM transactions WHERE account_id = ?", (id,)
    ).fetchone()["count"]

    if tx_count > 0:
        conn.close()
        return jsonify({"error": "Cannot delete account with linked transactions"}), 400

    # Delete the account
    cursor.execute("DELETE FROM accounts WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Account deleted successfully"}), 200



@app.route("/api/accounts-with-balance", methods=["GET"])
def get_accounts_with_balance():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT 
            a.id,
            a.name,
            a.type,
            a.initial_balance,   -- ✅ Include this
            a.initial_balance + 
            IFNULL(SUM(CASE 
                WHEN t.transaction_type = 'INCOME' THEN t.amount
                WHEN t.transaction_type = 'EXPENSE' THEN -t.amount
                ELSE 0 
            END), 0) AS current_balance
        FROM accounts a
        LEFT JOIN transactions t ON a.id = t.account_id
        GROUP BY a.id, a.name, a.type, a.initial_balance
        ORDER BY a.name;
    """
    rows = cursor.execute(query).fetchall()
    conn.close()

    accounts = [
        {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "initial_balance": row[3],   # ✅ Add to output
            "current_balance": row[4]    # ✅ Current balance shifted to index 4
        }
        for row in rows
    ]
    return jsonify(accounts)


# === GET ALL TRANSACTIONS WITH FILTERS ===
@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    account_id = request.args.get("accountId")
    category_id = request.args.get("categoryId")
    description = request.args.get("description")  
    year = request.args.get("year")                
    month = request.args.get("month")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Base query
    query = """
        SELECT 
            t.id,
            t.date,
            t.description,
            t.amount,
            t.transaction_type,
            a.name AS account_name,
            c.name AS category,
            t.is_anomaly
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN categories c ON t.category_id = c.id
        WHERE 1=1
    """
    params = []
    
    # Apply account filter if provided
    if account_id:
        query += " AND t.account_id = ?"
        params.append(account_id)
    
    # Apply category filter if provided
    if category_id:
        query += " AND t.category_id = ?"
        params.append(category_id)
    
    # Apply description filter
    if description:
        query += " AND t.description LIKE ?"
        params.append(f"%{description}%")
    
    #Apply description for yearif year:
    if year:
         query += " AND strftime('%Y', t.date) = ?"
         params.append(year)
    #Apply description for yearif month:
    if month:
       query += " AND strftime('%m', t.date) = ?"
       params.append(month.zfill(2))

    
    query += " ORDER BY t.date DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    transactions = [dict(row) for row in rows]
    return jsonify(transactions)

# === ADD NEW TRANSACTION ===

@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json()
    date = data.get("date")
    description = data.get("description")
    amount = data.get("amount")
    account_id = data.get("account_id")
    category_id = data.get("category_id")
    transaction_type = data.get("transaction_type")  # optional
    target_account_id = data.get("target_account_id")

    if not date or not description or not amount or not account_id or not category_id:
        return jsonify({"error": "All fields except target_account_id are required"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"error": "Amount must be a positive number"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Determine transaction type from category if not provided
        if not transaction_type:
            cursor.execute("SELECT type FROM categories WHERE id = ?", (category_id,))
            row = cursor.fetchone()
            if row:
                transaction_type = row["type"]
            else:
                transaction_type = "EXPENSE"  # default fallback

        if transaction_type == "TRANSFER":
            if not target_account_id:
                return jsonify({"error": "Target account required for transfer"}), 400

            # Record expense side
            cursor.execute("""
                INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
                VALUES (?, ?, ?, ?, ?, 'EXPENSE')
            """, (date, f"Transfer to account {target_account_id}", amount, account_id, category_id))
            expense_id = cursor.lastrowid

            # Record income side
            cursor.execute("""
                INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
                VALUES (?, ?, ?, ?, ?, 'INCOME')
            """, (date, f"Transfer from account {account_id}", amount, target_account_id, category_id))
            income_id = cursor.lastrowid

            conn.commit()
            return jsonify({
                "message": "Transfer recorded successfully",
                "expense_id": expense_id,
                "income_id": income_id
            }), 201

        # Regular transaction
        cursor.execute("""
            INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (date, description, amount, account_id, category_id, transaction_type))
        conn.commit()
        new_id = cursor.lastrowid

    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Transaction added successfully", "id": new_id}), 201



# === GET SINGLE TRANSACTION BY ID ===
@app.route("/api/transactions/<int:id>", methods=["GET"])
def get_transaction_by_id(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    txn = cursor.execute("""
        SELECT 
            t.id,
            t.date,
            t.description,
            t.amount,
            t.transaction_type,
            t.account_id,
            t.category_id,
            a.name AS account_name,
            c.name AS category_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
    """, (id,)).fetchone()
    conn.close()

    if txn is None:
        return jsonify({"error": "Transaction not found"}), 404

    return jsonify(dict(txn)), 200



# === UPDATE A TRANSACTION ===
@app.route("/api/transactions/<int:id>", methods=["PUT"])
def update_transaction(id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid input"}), 400

    amount = data.get("amount")
    category_id = data.get("category_id")
    description = data.get("description")
    date = data.get("date")
    transaction_type = data.get("transaction_type")

    if not all([amount, category_id, date, transaction_type]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if transaction exists
    existing = cursor.execute("SELECT * FROM transactions WHERE id = ?", (id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Transaction not found"}), 404

    # Update transaction
    cursor.execute("""
        UPDATE transactions
        SET amount = ?, category_id = ?, description = ?, date = ?, transaction_type = ?
        WHERE id = ?
    """, (amount, category_id, description, date, transaction_type, id))
    
    conn.commit()
    conn.close()

    return jsonify({"message": "Transaction updated successfully"}), 200




# delete transaction

@app.route("/api/transactions/<int:id>", methods=["DELETE", "OPTIONS"])
def delete_transaction(id):
    if request.method == "OPTIONS":
        return '', 200  # handle CORS preflight

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if transaction exists
    tx = cursor.execute("SELECT * FROM transactions WHERE id = ?", (id,)).fetchone()
    if tx is None:
        conn.close()
        return jsonify({"error": "Transaction not found"}), 404

    # Delete transaction
    cursor.execute("DELETE FROM transactions WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Transaction deleted successfully"}), 200

# === DASHBOARD API ===
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    conn = get_db_connection()

    # Total balance
    total_balance_row = conn.execute("SELECT SUM(initial_balance) AS total FROM accounts").fetchone()
    total_balance = total_balance_row["total"] or 0

    # Total income and total expense (ALL TIME)
    total_income_row = conn.execute("SELECT SUM(amount) AS total FROM transactions WHERE transaction_type='INCOME'").fetchone()
    total_expense_row = conn.execute("SELECT SUM(amount) AS total FROM transactions WHERE transaction_type='EXPENSE'").fetchone()
    total_income = total_income_row["total"] or 0
    total_expense = abs(total_expense_row["total"] or 0)

    # Monthly income and expense
    monthly_income_row = conn.execute("""
        SELECT SUM(amount) AS total FROM transactions
        WHERE transaction_type='INCOME' AND strftime('%m', date) = strftime('%m', 'now')
    """).fetchone()
    monthly_expense_row = conn.execute("""
        SELECT SUM(amount) AS total FROM transactions
        WHERE transaction_type='EXPENSE' AND strftime('%m', date) = strftime('%m', 'now')
    """).fetchone()
    monthly_income = monthly_income_row["total"] or 0
    monthly_expense = abs(monthly_expense_row["total"] or 0)

    # Savings rate (monthly)
    savings_rate = round((monthly_income - monthly_expense) / monthly_income * 100, 1) if monthly_income else 0

    # Recent transactions
    recent_transactions = conn.execute("""
        SELECT t.description AS name, t.amount, c.name AS category, t.is_anomaly
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT 5
    """).fetchall()
    recent_transactions_list = [dict(tx) for tx in recent_transactions]

    # Budget alerts
    budget_alerts_rows = conn.execute("""
        SELECT b.id, c.name AS name, b.limit_amount, 
               SUM(t.amount) AS spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t 
          ON t.category_id = c.id AND t.transaction_type='EXPENSE' 
             AND strftime('%m', t.date) = strftime('%m', 'now')
        WHERE b.month = strftime('%m', 'now')
        GROUP BY b.id
    """).fetchall()
    budget_alerts_list = []
    for row in budget_alerts_rows:
        spent = row["spent"] or 0
        limit_amt = row["limit_amount"]
        if spent < limit_amt * 0.75:
            status = "green"
        elif spent < limit_amt:
            status = "yellow"
        else:
            status = "red"
        budget_alerts_list.append({
            "name": row["name"],
            "spent": spent,
            "limit": limit_amt,
            "status": status
        })

    conn.close()

    return jsonify({
        "total_balance": total_balance,
        "total_income": total_income,
        "total_expense": total_expense,
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "savings_rate": savings_rate,
        "recent_transactions": recent_transactions_list,
        "budget_alerts": budget_alerts_list
    })

@app.route("/api/budgets", methods=["GET"])
def get_budgets():
    # Example: month=2024-10
    month_year = request.args.get("month")

    if not month_year:
        now = datetime.now()
        month_year = now.strftime("%Y-%m")

    try:
        year, month = map(int, month_year.split("-"))
    except ValueError:
        return jsonify({"error": "Invalid month format. Use YYYY-MM"}), 400

    conn = get_db_connection()
    query = """
        SELECT 
            b.id,
            b.category_id,
            c.name AS category_name,
            b.limit_amount,
            COALESCE(SUM(t.amount), 0) AS spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t
            ON b.category_id = t.category_id
            AND strftime('%Y', t.date) = ?
            AND strftime('%m', t.date) = ?
            AND t.transaction_type = 'EXPENSE'
        WHERE b.year = ?
          AND b.month = ?
        GROUP BY b.id, b.category_id, c.name, b.limit_amount
        ORDER BY c.name;
    """

    rows = conn.execute(query, (str(year), f"{month:02d}", year, month)).fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])



# --- Save or update budgets ---
@app.route("/api/budgets/save", methods=["POST"])
def save_budgets():
    data = request.get_json()
    if not data or not isinstance(data, list):
        return jsonify({"error": "Expected a list of budgets"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    for b in data:
        cat_id = b.get("category_id")
        limit = b.get("limit_amount")
        month = b.get("month")
        year = b.get("year")

        if not all([cat_id, limit, month, year]):
            continue

        # Upsert: if exists, update; else insert
        cursor.execute("""
            INSERT INTO budgets (category_id, month, year, limit_amount)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(category_id, month, year)
            DO UPDATE SET limit_amount=excluded.limit_amount
        """, (cat_id, month, year, limit))

    conn.commit()
    conn.close()
    return jsonify({"message": "Budgets saved successfully"})

@app.route("/api/budgets/recommendations", methods=["GET"])
def get_budget_recommendations():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get last 3 months
        today = datetime.today()
        months = []
        for i in range(3):
            month = (today - timedelta(days=i*30)).strftime("%Y-%m")  # approximate previous months
            months.append(month)
        months = list(set(months))  # ensure uniqueness

        # Query transactions for last 3 months grouped by category and month
        query = """
            SELECT
                category_id,
                strftime('%Y-%m', date) AS month,
                SUM(amount) AS total
            FROM transactions
            WHERE transaction_type = 'EXPENSE'
            AND strftime('%Y-%m', date) IN ({})
            GROUP BY category_id, month
        """.format(",".join(["?"]*len(months)))

        cursor.execute(query, months)
        rows = cursor.fetchall()

        # Aggregate totals per category
        totals = {}
        for row in rows:
            cat = row["category_id"]
            if cat not in totals:
                totals[cat] = []
            totals[cat].append(row["total"])

        # Compute average per category
        recommendations = {}
        for cat, vals in totals.items():
            recommendations[cat] = round(sum(vals) / len(vals), 2)

        conn.close()
        return jsonify(recommendations)

    except Exception as e:
        print("Error in budget recommendations:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/report", methods=["GET"])
def get_report():
    month = request.args.get("month")  # Format: 'YYYY-MM'
    account_id = request.args.get("accountId")  # Optional

    if not month:
        return jsonify({"error": "month parameter is required"}), 400

    year, month_num = month.split("-")

    query = """
    SELECT 
        c.id AS category_id,
        c.name AS category_name,
        SUM(t.amount) AS total_spent,
        b.limit_amount AS budget,
        (b.limit_amount - SUM(t.amount)) AS difference
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    LEFT JOIN budgets b 
        ON b.category_id = c.id 
       AND b.year = ?
       AND b.month = ?
    WHERE strftime('%Y', t.date) = ?
      AND strftime('%m', t.date) = ?
      AND t.transaction_type = 'EXPENSE'
    """

    params = [year, int(month_num), year, month_num]

    if account_id:
        query += " AND t.account_id = ?"
        params.append(account_id)

    query += " GROUP BY c.id, b.limit_amount ORDER BY total_spent DESC"

    conn = get_db_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()

    report = [
        {
            "category_id": row["category_id"],
            "category_name": row["category_name"],
            "total_spent": row["total_spent"] or 0,
            "budget": row["budget"],
            "difference": row["difference"] if row["budget"] is not None else None
        }
        for row in rows
    ]

    return jsonify(report)

# === MAIN ENTRY ===
if __name__ == "__main__":
   
    app.run(debug=True, port=5000)
