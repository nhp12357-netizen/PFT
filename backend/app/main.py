from flask import Flask, jsonify, request
from flask_cors import CORS
import pickle
import sqlite3
import os

app = Flask(__name__)
CORS(app)

# === DATABASE CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "finance.db")
print("Using database file:", DB_PATH)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# === INITIALIZE DATABASE ===
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('CHECKING','SAVINGS','CREDIT_CARD')),
        initial_balance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        description TEXT,
        amount REAL,
        account_id INTEGER,
        category_id INTEGER,
        transaction_type TEXT CHECK(transaction_type IN ('INCOME','EXPENSE','TRANSFER')),
        is_anomaly INTEGER DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        limit_amount REAL,
        month TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    """)
    conn.commit()
    conn.close()
    print("Database initialized successfully")


def add_default_categories():
    categories = [
        ('Entertainment', 'Expense'),
        ('Food & Dining', 'Expense'),
        ('Groceries', 'Expense'),
        ('Healthcare', 'Expense'),
        ('Investment', 'Income'),
        ('Other Income', 'Income'),
        ('Rent', 'Expense'),
        ('Salary', 'Income'),
        ('Shopping', 'Expense'),
        ('Transportation', 'Expense'),
    ]
    conn = get_db_connection()
    cursor = conn.cursor()
    existing = cursor.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    if existing == 0:
        cursor.executemany("INSERT INTO categories (name, type) VALUES (?, ?)", categories)
        conn.commit()
        print(" Default categories added")
    else:
        print(" Categories already exist")
    conn.close()



    # ===== Existing imports, app setup, DB setup =====
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)





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
        return jsonify({
            "error": "Cannot delete account with linked transactions"
        }), 400

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
            "current_balance": row[3]
        }
        for row in rows
    ]
    return jsonify(accounts)


# === GET CATEGORIES ===
@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    rows = conn.execute("SELECT id, name FROM categories").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


# === GET ALL TRANSACTIONS WITH FILTERS ===
@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    account_id = request.args.get("accountId")
    category_id = request.args.get("categoryId")
    description = request.args.get("description")  # search by description
    
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
    
    query += " ORDER BY t.date DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    transactions = [dict(row) for row in rows]
    return jsonify(transactions)



# === ADD TRANSACTION ===
@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json()
    date = data.get("date")
    description = data.get("description")
    amount = data.get("amount")
    account_id = data.get("account_id")
    category_id = data.get("category_id")
    transaction_type = data.get("transaction_type")
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
        if transaction_type == "TRANSFER":
            if not target_account_id:
                return jsonify({"error": "Target account required for transfer"}), 400

            cursor.execute("""
                INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
                VALUES (?, ?, ?, ?, ?, 'EXPENSE')
            """, (date, f"Transfer to account {target_account_id}", amount, account_id, category_id))
            expense_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
                VALUES (?, ?, ?, ?, ?, 'INCOME')
            """, (date, f"Transfer from account {account_id}", amount, target_account_id, category_id))
            income_id = cursor.lastrowid

            conn.commit()
            return jsonify({"message": "Transfer recorded successfully", "expense_id": expense_id, "income_id": income_id}), 201

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



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

# Initialize default models if they don't exist
def init_default_models():
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    import numpy as np
    
    # Sample training data
    descriptions = [
        "Grocery shopping",
        "Monthly rent payment",
        "Salary deposit",
        "Restaurant dinner",
        "Bus ticket",
        "Movie tickets",
        "Doctor visit"
    ]
    
    categories = [
        "Groceries",
        "Rent",
        "Salary",
        "Food & Dining",
        "Transportation",
        "Entertainment",
        "Healthcare"
    ]
    
    # Create and train vectorizer
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(descriptions)
    
    # Create and train model
    model = LogisticRegression()
    model.fit(X, categories)
    
    # Save models
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)
    with open(os.path.join(MODEL_DIR, "category_model.pkl"), "wb") as f:
        pickle.dump(model, f)
    
    return vectorizer, model

# Try to load models, create default ones if they don't exist
try:
    with open(os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl"), "rb") as f:
        vectorizer = pickle.load(f)
    with open(os.path.join(MODEL_DIR, "category_model.pkl"), "rb") as f:
        model = pickle.load(f)
except (FileNotFoundError, pickle.UnpicklingError):
    print("Creating default ML models...")
    vectorizer, model = init_default_models()


@app.route("/api/suggest-category", methods=["POST"])
def suggest_category():
    """
    Suggest a transaction category based on the description text
    using pre-trained TF-IDF + Logistic Regression model.
    """
    try:
        data = request.get_json()
        description = data.get("description", "")

        if not description.strip():
            return jsonify({"error": "Description is required"}), 400

        # Transform the input description
        X = vectorizer.transform([description])
        predicted_category = model.predict(X)[0]

        return jsonify({"suggested_category": predicted_category})
    except Exception as e:
        print(f"Error in category suggestion: {str(e)}")
        return jsonify({
            "error": "Unable to suggest category",
            "suggested_category": "Other"
        }), 500


# === DASHBOARD API ===
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    conn = get_db_connection()
    total_balance_row = conn.execute("SELECT SUM(initial_balance) AS total FROM accounts").fetchone()
    total_balance = total_balance_row["total"] or 0

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
    savings_rate = round((monthly_income - monthly_expense) / monthly_income * 100, 1) if monthly_income else 0

    recent_transactions = conn.execute("""
        SELECT t.description AS name, t.amount, c.name AS category, t.is_anomaly
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT 5
    """).fetchall()

    recent_transactions_list = [dict(tx) for tx in recent_transactions]

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
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "savings_rate": savings_rate,
        "recent_transactions": recent_transactions_list,
        "budget_alerts": budget_alerts_list
    })


# ===== BUDGET MANAGEMENT ROUTES ===== 

from flask import request, jsonify

@app.route('/api/budgets/save', methods=['POST'])
def save_budget():
    try:
        budgets = request.get_json()
        print("📥 Received JSON:", budgets)

        if not budgets or not isinstance(budgets, list):
            return jsonify({"error": "Expected a list of budgets"}), 400

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        for b in budgets:
            category_id = b.get('category_id')
            limit_amount = b.get('limit_amount')
            month = b.get('month')

            if not category_id or not limit_amount or not month:
                continue  # skip invalid entries

            cursor.execute(
                "INSERT INTO budgets (category_id, limit_amount, month) VALUES (?, ?, ?)",
                (category_id, limit_amount, month)
            )

        conn.commit()
        conn.close()

        return jsonify({"message": "Budgets saved successfully"}), 201

    except Exception as e:
        print(" Error in /api/budgets/save:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/api/budgets", methods=["GET"])
def get_budgets():
    """
    Returns all budgets with spent amounts for the current month.
    """
    conn = get_db_connection()
    query = """
        SELECT 
            b.id,
            c.name AS category,
            b.limit_amount AS budget,
            COALESCE(SUM(t.amount), 0) AS spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t 
            ON t.category_id = c.id 
            AND t.transaction_type='EXPENSE' 
            AND strftime('%Y-%m', t.date) = strftime('%Y-%m', 'now')
        WHERE b.month = strftime('%m', 'now')
        GROUP BY b.id
        ORDER BY c.name
    """
    rows = conn.execute(query).fetchall()
    conn.close()

    budgets = []
    for row in rows:
        spent = row["spent"]
        limit_amt = row["budget"]
        remaining = limit_amt - spent
        percentage = round((spent / limit_amt) * 100, 1) if limit_amt else 0
        budgets.append({
            "id": row["id"],
            "category": row["category"],
            "budget": limit_amt,
            "spent": spent,
            "remaining": remaining,
            "percentage": percentage,
            "status": "over" if spent > limit_amt else "at_limit" if spent == limit_amt else "under"
        })

    return jsonify(budgets)


# === MAIN ENTRY ===
if __name__ == "__main__":
    #init_db()
    #add_default_categories()
    app.run(debug=True, port=5000)
