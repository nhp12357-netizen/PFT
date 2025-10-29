from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import joblib
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)

app = Flask(__name__)

# Adjust origins as n
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# === CONFIG ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "finance.db")

# Replace with environment variable in production
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key")
jwt = JWTManager(app)

# === Helpers ===
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enforce foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

# Load ML models (if present)
try:
    with open(os.path.join(BASE_DIR, "models/tfidf_vectorizer.pkl"), "rb") as f:
        vectorizer = joblib.load(f)
    with open(os.path.join(BASE_DIR, "models/logistic_regression_model.pkl"), "rb") as f:
        classifier = joblib.load(f)
except Exception:
    vectorizer = None
    classifier = None

# === AUTH ROUTES ===
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "username and password required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    # check duplicates by username or email (if email provided)
    q = "SELECT id FROM users WHERE username = ?"
    params = (username,)
    if email:
        q = "SELECT id FROM users WHERE username = ? OR email = ?"
        params = (username, email)

    existing = cur.execute(q, params).fetchone()
    if existing:
        conn.close()
        return jsonify({"message": "User already exists"}), 409

    password_hash = generate_password_hash(password)
    cur.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (username, email, password_hash),
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()

    return jsonify({"message": "User created", "user_id": user_id}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    # allow login by username or email (prefer username if provided)
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not password or (not username and not email):
        return jsonify({"message": "username/email and password required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    if username:
        user = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    else:
        user = cur.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    conn.close()

    if user and check_password_hash(user["password_hash"], password):
        token = create_access_token(identity=str(user["id"]))
        return (
            jsonify(
                {
                    "token": token,
                    "user_id": user["id"],
                    "username": user["username"],
                    "email": user["email"],
                }
            ),
            200,
        )

    return jsonify({"message": "Invalid credentials"}), 401


# === PROTECTED ROUTES ===
# Note: all routes below are decorated with @jwt_required() and scope DB ops by user_id

# === DASHBOARD ===
@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    conn = get_db_connection()

    # Get selected month/year from query params or default to current
    month_param = request.args.get("month")
    if month_param and "-" in month_param:
        year, month = month_param.split("-")
    else:
        now = datetime.now()
        month = now.strftime("%m")
        year = now.strftime("%Y")

    # === Total balance (all accounts for user) ===
    total_balance_row = conn.execute(
        "SELECT SUM(initial_balance) AS total FROM accounts WHERE user_id = ?",
        (user_id,),
    ).fetchone()
    total_balance = total_balance_row["total"] or 0

    # === Monthly income and expense ===
    monthly_income_row = conn.execute(
        """
        SELECT SUM(amount) AS total FROM transactions
        WHERE user_id = ? AND transaction_type='INCOME'
          AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
        """,
        (user_id, month, year),
    ).fetchone()

    monthly_expense_row = conn.execute(
        """
        SELECT SUM(amount) AS total FROM transactions
        WHERE user_id = ? AND transaction_type='EXPENSE'
          AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
        """,
        (user_id, month, year),
    ).fetchone()

    monthly_income = monthly_income_row["total"] or 0
    monthly_expense = abs(monthly_expense_row["total"] or 0)

    savings_rate = (
        round((monthly_income - monthly_expense) / monthly_income * 100, 1)
        if monthly_income
        else 0
    )

    # === Recent transactions (limit 5) ===
    recent_transactions = conn.execute(
        """
        SELECT t.id, t.description AS name, t.amount, t.date, c.name AS category,
               a.name AS account_name, t.is_anomaly
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = ?
          AND strftime('%m', t.date) = ?
          AND strftime('%Y', t.date) = ?
        ORDER BY t.date DESC
        LIMIT 5
        """,
        (user_id, month, year),
    ).fetchall()
    recent_transactions_list = [dict(tx) for tx in recent_transactions]

    # === Budget alerts ===
    budget_alerts_rows = conn.execute(
        """
        SELECT b.id, c.name AS name, b.limit_amount,
               COALESCE(SUM(t.amount), 0) AS spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id
            AND t.user_id = b.user_id
            AND t.transaction_type = 'EXPENSE'
            AND strftime('%m', t.date) = ?
            AND strftime('%Y', t.date) = ?
        WHERE b.user_id = ? AND b.month = ?
        GROUP BY b.id
        """,
        (month, year, user_id, int(month) if month.isdigit() else int(month)),
    ).fetchall()

    budget_alerts_list = []
    for row in budget_alerts_rows:
        spent = row["spent"] or 0
        limit_amt = row["limit_amount"]
        if limit_amt is None:
            status = "none"
        elif spent < limit_amt * 0.75:
            status = "green"
        elif spent < limit_amt:
            status = "yellow"
        else:
            status = "red"
        budget_alerts_list.append(
            {"name": row["name"], "spent": spent, "limit": limit_amt, "status": status}
        )

    # === Accounts overview ===
    accounts_rows = conn.execute(
        """
        SELECT id, name, type, initial_balance AS current_balance
        FROM accounts
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchall()
    accounts_list = [dict(acc) for acc in accounts_rows]

    conn.close()

    # === Final JSON response ===
    return jsonify(
        {
            "month": month,
            "year": year,
            "total_balance": total_balance,
            "monthly_income": monthly_income,
            "monthly_expense": monthly_expense,
            "savings_rate": savings_rate,
            "recent_transactions": recent_transactions_list,
            "budget_alerts": budget_alerts_list,
            "accounts": accounts_list,  # ✅ added for frontend
        }
    )

# TRANSACTIONS: GET (list) - POST (create)
@app.route("/api/transactions", methods=["GET", "POST"])
@jwt_required()
def transactions_list_create():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "GET":
        account_id = request.args.get("accountId")
        category_id = request.args.get("categoryId")
        description = request.args.get("description")
        year = request.args.get("year")
        month = request.args.get("month")

        query = """
            SELECT t.id, t.date, t.description, t.amount, t.transaction_type,
                   a.name AS account_name, c.name AS category, t.is_anomaly
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        """
        params = [user_id]

        if account_id:
            query += " AND t.account_id = ?"
            params.append(account_id)
        if category_id:
            query += " AND t.category_id = ?"
            params.append(category_id)
        if description:
            query += " AND t.description LIKE ?"
            params.append(f"%{description}%")
        if year and month:
            query += " AND strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ?"
            params.extend([year, month.zfill(2)])
        elif year:
            query += " AND strftime('%Y', t.date) = ?"
            params.append(year)
        elif month:
            query += " AND strftime('%m', t.date) = ?"
            params.append(month.zfill(2))

        query += " ORDER BY t.date DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])

    # POST -> create transaction
    data = request.get_json() or {}
    date_str = data.get("date")
    description = data.get("description")
    amount = data.get("amount")
    account_id = data.get("account_id")
    category_id = data.get("category_id")
    transaction_type = data.get("transaction_type")
    target_account_id = data.get("target_account_id")

    if not date_str or not description or amount is None or not account_id or not category_id:
        conn.close()
        return jsonify({"error": "Missing required fields"}), 400

    try:
        transaction_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        conn.close()
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    if transaction_date > date.today():
        conn.close()
        return jsonify({"error": "Future transactions not allowed"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except (ValueError, TypeError):
        conn.close()
        return jsonify({"error": "Amount must be positive number"}), 400

    try:
        # Determine transaction_type from category if not provided
        if not transaction_type:
            cat = cursor.execute("SELECT type FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id)).fetchone()
            transaction_type = cat["type"] if cat else "EXPENSE"

        # Transfers: create two transactions (expense + income)
        if transaction_type == "TRANSFER":
            if not target_account_id:
                return jsonify({"error": "Target account id required for transfer"}), 400

            # ensure both accounts belong to user
            acct1 = cursor.execute("SELECT id FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id)).fetchone()
            acct2 = cursor.execute("SELECT id FROM accounts WHERE id = ? AND user_id = ?", (target_account_id, user_id)).fetchone()
            if not acct1 or not acct2:
                return jsonify({"error": "Accounts must belong to current user"}), 400

            cursor.execute(
                "INSERT INTO transactions (user_id, date, description, amount, account_id, category_id, transaction_type) VALUES (?, ?, ?, ?, ?, ?, 'EXPENSE')",
                (user_id, date_str, f"Transfer to {target_account_id}", amount, account_id, category_id),
            )
            expense_id = cursor.lastrowid
            cursor.execute(
                "INSERT INTO transactions (user_id, date, description, amount, account_id, category_id, transaction_type) VALUES (?, ?, ?, ?, ?, ?, 'INCOME')",
                (user_id, date_str, f"Transfer from {account_id}", amount, target_account_id, category_id),
            )
            income_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return jsonify({"message": "Transfer recorded", "expense_id": expense_id, "income_id": income_id}), 201

        # Non-transfer
        # Ensure account and category belong to user
        acct = cursor.execute("SELECT id FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id)).fetchone()
        cat = cursor.execute("SELECT id FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id)).fetchone()
        if not acct or not cat:
            conn.close()
            return jsonify({"error": "Account or category not found for current user"}), 400

        cursor.execute(
            "INSERT INTO transactions (user_id, date, description, amount, account_id, category_id, transaction_type, is_anomaly) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, date_str, description, amount, account_id, category_id, transaction_type, data.get("is_anomaly", 0)),
        )
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return jsonify({"message": "Transaction added", "id": new_id}), 201

    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500


# GET single transaction, UPDATE, DELETE
@app.route("/api/transactions/<int:tx_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def transaction_detail(tx_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch and ensure ownership
    tx = cur.execute("SELECT * FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id)).fetchone()
    if not tx:
        conn.close()
        return jsonify({"error": "Transaction not found"}), 404

    if request.method == "GET":
        conn.close()
        return jsonify(dict(tx)), 200

    if request.method == "PUT":
        data = request.get_json() or {}
        amount = data.get("amount")
        category_id = data.get("category_id")
        description = data.get("description")
        date_str = data.get("date")
        transaction_type = data.get("transaction_type")

        if not all([amount is not None, category_id, date_str, transaction_type]):
            conn.close()
            return jsonify({"error": "Missing required fields"}), 400

        # ensure category belongs to user
        cat = cur.execute("SELECT id FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id)).fetchone()
        if not cat:
            conn.close()
            return jsonify({"error": "Category not found for user"}), 400

        cur.execute(
            "UPDATE transactions SET amount = ?, category_id = ?, description = ?, date = ?, transaction_type = ? WHERE id = ? AND user_id = ?",
            (amount, category_id, description, date_str, transaction_type, tx_id, user_id),
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Transaction updated"}), 200

    # DELETE
    cur.execute("DELETE FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Transaction deleted"}), 200


# CATEGORIES
@app.route("/api/categories", methods=["GET", "POST"])
@jwt_required()
def categories_list_create():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == "GET":
        rows = cur.execute("SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY name", (user_id,)).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])

    data = request.get_json() or {}
    name = data.get("name")
    type_ = data.get("type")
    if not name or type_ not in ("INCOME", "EXPENSE"):
        conn.close()
        return jsonify({"error": "Invalid category"}), 400

    try:
        cur.execute("INSERT INTO categories (user_id, name, type, created_at) VALUES (?, ?, ?, datetime('now'))", (user_id, name, type_))
        conn.commit()
        category_id = cur.lastrowid
        conn.close()
        return jsonify({"id": category_id, "name": name, "type": type_}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Category already exists"}), 400


@app.route("/api/categories/<int:cat_id>", methods=["PUT", "DELETE"])
@jwt_required()
def category_update_delete(cat_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    # Ensure category belongs to user
    cat = cur.execute("SELECT * FROM categories WHERE id = ? AND user_id = ?", (cat_id, user_id)).fetchone()
    if not cat:
        conn.close()
        return jsonify({"error": "Category not found"}), 404

    if request.method == "PUT":
        data = request.get_json() or {}
        name = data.get("name")
        type_ = data.get("type")
        if not name or type_ not in ("INCOME", "EXPENSE"):
            conn.close()
            return jsonify({"error": "Invalid category"}), 400
        try:
            cur.execute("UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?", (name, type_, cat_id, user_id))
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({"error": "Category with same name exists"}), 400
        conn.close()
        return jsonify({"message": "Category updated"}), 200

    # DELETE only if no transactions for this user use this category
    tx_count = cur.execute("SELECT COUNT(*) AS cnt FROM transactions WHERE category_id = ? AND user_id = ?", (cat_id, user_id)).fetchone()["cnt"]
    if tx_count > 0:
        conn.close()
        return jsonify({"error": "Cannot delete category linked to transactions"}), 400

    cur.execute("DELETE FROM categories WHERE id = ? AND user_id = ?", (cat_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Category deleted"}), 200


# ACCOUNTS
@app.route("/api/accounts", methods=["GET", "POST"])
@jwt_required()
def accounts_list_create():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    if request.method == "GET":
        rows = cur.execute(
            """
            SELECT a.id, a.name, a.type, a.initial_balance,
                COALESCE((
                    SELECT SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount
                                    WHEN t.transaction_type = 'EXPENSE' THEN -t.amount ELSE 0 END)
                    FROM transactions t WHERE t.account_id = a.id AND t.user_id = ?
                ), 0) + a.initial_balance AS current_balance
            FROM accounts a
            WHERE a.user_id = ?
            """,
            (user_id, user_id),
        ).fetchall()
        conn.close()
        return jsonify([dict(r) for r in rows])

    data = request.get_json() or {}
    name = data.get("name")
    acc_type = data.get("type")
    initial_balance = data.get("initial_balance", 0.0)

    if not name or not acc_type:
        conn.close()
        return jsonify({"error": "Name and type required"}), 400

    ALLOWED = ("CHECKING", "SAVINGS", "CREDIT_CARD")
    if acc_type not in ALLOWED:
        conn.close()
        return jsonify({"error": f"Invalid type. Use one of {ALLOWED}"}), 400

    try:
        initial_balance = float(initial_balance)
    except (ValueError, TypeError):
        conn.close()
        return jsonify({"error": "Initial balance must be a number"}), 400

    try:
        cur.execute("INSERT INTO accounts (user_id, name, type, initial_balance, created_at) VALUES (?, ?, ?, ?, datetime('now'))", (user_id, name, acc_type, initial_balance))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return jsonify({"message": "Account added", "id": new_id}), 201
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": str(e)}), 400


@app.route("/api/accounts/<int:acc_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def account_detail(acc_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    acc = cur.execute("SELECT * FROM accounts WHERE id = ? AND user_id = ?", (acc_id, user_id)).fetchone()
    if not acc:
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    if request.method == "GET":
        row = cur.execute(
            """
            SELECT a.id, a.name, a.type, a.initial_balance,
            a.initial_balance + COALESCE((
                SELECT SUM(CASE WHEN t.transaction_type = 'INCOME' THEN t.amount
                                WHEN t.transaction_type = 'EXPENSE' THEN -t.amount ELSE 0 END)
                FROM transactions t WHERE t.account_id = a.id AND t.user_id = ?
            ), 0) AS current_balance
            FROM accounts a WHERE a.id = ? AND a.user_id = ?
            """,
            (user_id, acc_id, user_id),
        ).fetchone()
        conn.close()
        return jsonify(dict(row)), 200

    if request.method == "PUT":
        data = request.get_json() or {}
        new_name = data.get("name")
        if not new_name:
            conn.close()
            return jsonify({"error": "Name required"}), 400
        try:
            cur.execute("UPDATE accounts SET name = ? WHERE id = ? AND user_id = ?", (new_name, acc_id, user_id))
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({"error": "Account name conflict"}), 400
        conn.close()
        return jsonify({"message": "Account updated"}), 200

    # DELETE -> only if no transactions for this user
    tx_count = cur.execute("SELECT COUNT(*) AS cnt FROM transactions WHERE account_id = ? AND user_id = ?", (acc_id, user_id)).fetchone()["cnt"]
    if tx_count > 0:
        conn.close()
        return jsonify({"error": "Cannot delete account linked to transactions"}), 400
    cur.execute("DELETE FROM accounts WHERE id = ? AND user_id = ?", (acc_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Account deleted"}), 200


# optional default-account endpoints (these require 'is_default' column to exist in accounts)
@app.route("/api/accounts/<int:account_id>/set_default", methods=["POST"])
@jwt_required()
def set_default_account(account_id):
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()

    # ensure account belongs to user
    acc = cur.execute("SELECT id FROM accounts WHERE id = ? AND user_id = ?", (account_id, user_id)).fetchone()
    if not acc:
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    # Reset and set default for this user only
    try:
        cur.execute("UPDATE accounts SET is_default = 0 WHERE user_id = ?", (user_id,))
        cur.execute("UPDATE accounts SET is_default = 1 WHERE id = ? AND user_id = ?", (account_id, user_id))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

    conn.close()
    return jsonify({"message": "Default account set"}), 200


@app.route("/api/accounts/default", methods=["GET"])
@jwt_required()
def get_default_account():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM accounts WHERE user_id = ? AND is_default = 1 LIMIT 1", (user_id,)).fetchone()
    conn.close()
    if row:
        return jsonify(dict(row)), 200
    return jsonify({"message": "No default account set"}), 404


# BUDGETS
@app.route("/api/budgets", methods=["GET"])
@jwt_required()
def get_budgets():
    user_id = get_jwt_identity()
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
        SELECT c.id AS category_id, c.name AS category_name,
               IFNULL(b.limit_amount, 0) AS limit_amount,
               COALESCE(SUM(t.amount), 0) AS spent
        FROM categories c
        LEFT JOIN budgets b ON c.id = b.category_id AND b.year = ? AND b.month = ? AND b.user_id = ?
        LEFT JOIN transactions t ON c.id = t.category_id
            AND t.user_id = ?
            AND strftime('%Y', t.date) = ?
            AND strftime('%m', t.date) = ?
            AND t.transaction_type = 'EXPENSE'
        WHERE c.user_id = ?
        GROUP BY c.id, c.name, b.limit_amount
        ORDER BY c.name;
    """
    rows = conn.execute(query, (str(year), month, user_id, user_id, str(year), f"{month:02d}", user_id)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/budgets/save", methods=["POST"])
@jwt_required()
def save_budgets():
    user_id = get_jwt_identity()
    data = request.get_json() or []
    conn = get_db_connection()
    cur = conn.cursor()

    for item in data:
        category_id = item["category_id"]
        limit_amount = item["limit_amount"]
        year = item["year"]
        month = item.get("month")
        apply_all = item.get("apply_all_months", False)

        # ensure category belongs to user
        cat = cur.execute("SELECT id FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id)).fetchone()
        if not cat:
            continue

        if apply_all:
            for m in range(1, 13):
                cur.execute(
                    "INSERT OR REPLACE INTO budgets (user_id, category_id, month, year, limit_amount, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
                    (user_id, category_id, m, year, limit_amount),
                )
        else:
            if not month:
                continue
            cur.execute(
                "INSERT OR REPLACE INTO budgets (user_id, category_id, month, year, limit_amount, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
                (user_id, category_id, month, year, limit_amount),
            )

    conn.commit()
    conn.close()
    return jsonify({"message": "Budgets saved"}), 200


@app.route("/api/budgets/recommendations", methods=["GET"])
@jwt_required()
def get_budget_recommendations():
    user_id = get_jwt_identity()
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        today = datetime.today()
        months = []
        for i in range(3):
            m = (today - timedelta(days=i * 30)).strftime("%Y-%m")
            months.append(m)
        months = list(dict.fromkeys(months))

        placeholders = ",".join("?" * len(months))
        query = f"""
            SELECT category_id, strftime('%Y-%m', date) AS month, SUM(amount) AS total
            FROM transactions
            WHERE user_id = ? AND transaction_type = 'EXPENSE' AND strftime('%Y-%m', date) IN ({placeholders})
            GROUP BY category_id, month
        """
        params = [user_id] + months
        cur.execute(query, params)
        rows = cur.fetchall()

        totals = {}
        for row in rows:
            cat = row["category_id"]
            totals.setdefault(cat, []).append(row["total"])

        recommendations = {cat: round(sum(vals) / len(vals), 2) for cat, vals in totals.items()}

        conn.close()
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# REPORT
@app.route("/api/report", methods=["GET"])
@jwt_required()
def get_report():
    user_id = get_jwt_identity()
    month = request.args.get("month")
    account_id = request.args.get("accountId")

    if not month:
        return jsonify({"error": "month parameter required (YYYY-MM)"}), 400

    year, month_num = month.split("-")
    if len(month_num) == 1:
        month_num = f"0{month_num}"

    query = """
        SELECT c.id AS category_id, c.name AS category_name,
               SUM(t.amount) AS total_spent, b.limit_amount AS budget,
               (b.limit_amount - SUM(t.amount)) AS difference
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN budgets b ON b.category_id = c.id AND b.year = ? AND b.month = ? AND b.user_id = ?
        WHERE t.user_id = ? AND strftime('%Y', t.date) = ? AND strftime('%m', t.date) = ? AND UPPER(t.transaction_type) = 'EXPENSE'
    """
    params = [year, month_num, user_id, user_id, year, month_num]

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
            "difference": row["difference"] if row["budget"] is not None else None,
        }
        for row in rows
    ]
    return jsonify(report)


# SUGGEST CATEGORY (ML) - uses user's categories (optional)
@app.route("/api/suggest-category", methods=["POST"])
@jwt_required()
def suggest_category():
    user_id = get_jwt_identity()
    try:
        data = request.get_json() or {}
        description = data.get("description", "").strip()
        if not description:
            return jsonify({"error": "Description required"}), 400

        if not vectorizer or not classifier:
            return jsonify({"error": "ML model not available"}), 500

        X = vectorizer.transform([description])
        category_id = classifier.predict(X)[0]
        if hasattr(category_id, "item"):
            category_id = int(category_id)

        # ensure category belongs to user
        conn = get_db_connection()
        cur = conn.cursor()
        row = cur.execute("SELECT id, name FROM categories WHERE id = ? AND user_id = ?", (category_id, user_id)).fetchone()
        conn.close()
        if not row:
            return jsonify({"error": "Predicted category not found for this user"}), 404

        return jsonify({"category_id": row["id"], "suggested_category": row["name"]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
