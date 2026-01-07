from flask import Flask, request, jsonify
from functools import wraps
import psycopg
import os
from pathlib import Path
from datetime import datetime, timedelta
from google.auth.transport import requests
from google.oauth2 import id_token
import jwt
import json

app = Flask(__name__)

# Load OAuth credentials
try:
    with open('client_secret.json', 'r') as f:
        oauth_info = json.load(f)
    GOOGLE_CLIENT_ID = oauth_info['web']['client_id']
    GOOGLE_CLIENT_SECRET = oauth_info['web']['client_secret']
except FileNotFoundError:
    GOOGLE_CLIENT_ID = "991938441618-ck1f1nchclqaiq2m2hmd3p82ee9769g8.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET = "fallback-secret-key"

# JWT token verification middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return {'error': 'Missing token'}, 401
        
        try:
            token = token.split(' ')[1]  # Remove "Bearer " prefix
            data = jwt.decode(token, GOOGLE_CLIENT_SECRET, algorithms=['HS256'])
            request.user = data
        except Exception as e:
            return {'error': 'Invalid token'}, 401
        
        return f(*args, **kwargs)
    return decorated

@app.route('/api/auth/verify', methods=['POST'])
def verify_google_token():
    token = request.json.get('token')
    try:
        info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        # Create JWT for session management
        payload = {
            'sub': info['sub'],
            'email': info.get('email'),
            'name': info.get('name'),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        session_token = jwt.encode(payload, GOOGLE_CLIENT_SECRET, algorithm='HS256')
        
        return {'token': session_token, 'user': info}
    except Exception as e:
        return {'error': str(e)}, 401

def get_db_connection():
    """Get a database connection."""
    # Use DATABASE_URL if available (Heroku), otherwise use individual env vars
    database_url = os.environ.get("DATABASE_URL")
    
    if database_url:
        # Heroku uses postgres://, but psycopg3 requires postgresql://
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return psycopg.connect(database_url, row_factory=psycopg.rows.dict_row)
    else:
        # Local development
        return psycopg.connect(
            dbname=os.environ["PG_DBNAME"],
            user=os.environ["PG_USER"],
            host=os.environ["PG_HOST"],
            password=os.environ["PG_PASSWORD"],
            port=5432,
            row_factory=psycopg.rows.dict_row
        )

def init_db():
    """Initialize database with schema from schema.sql."""
    sql_file = Path("schema.sql")
    
    if sql_file.exists():
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                sql = sql_file.read_text()
                cur.execute(sql)
            conn.commit()
    else:
        print(f"Warning: {sql_file} not found")

# Initialize database on startup
with app.app_context():
    try:
        init_db()
    except Exception as e:
        print(f"Error initializing database: {e}")

def get_todos(user_id):
    """Fetch todos for a specific user."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, description, completed, created_at, updated_at FROM todos WHERE user_id = %s ORDER BY updated_at DESC;", (user_id,))
            todos = cur.fetchall()
    return todos

@app.route("/api/todos", methods=["POST"])
@token_required
def create_todo_route():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    user_id = request.user['sub']  # Get user ID from JWT token
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO todos (user_id, title, description, completed, created_at, updated_at) VALUES (%s, %s, %s, %s, NOW(), NOW()) RETURNING id, title, description, completed, created_at, updated_at;",
                (user_id, title, description, False)
            )
            new_todo = cur.fetchone()
        conn.commit()
    
    return jsonify(new_todo), 201

@app.route("/api/todos", methods=["GET"])
@token_required
def get_todos_route():
    user_id = request.user['sub']
    todos = get_todos(user_id)
    return {"todos": todos}

@app.route("/api/todos/<int:todo_id>", methods=["PUT"])
@token_required
def update_todo_route(todo_id):
    data = request.get_json()
    completed = data.get("completed")
    user_id = request.user['sub']
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE todos SET completed = %s, updated_at = NOW() WHERE id = %s AND user_id = %s RETURNING id, title, description, completed, created_at, updated_at;",
                (completed, todo_id, user_id)
            )
            updated_todo = cur.fetchone()
        conn.commit()
    
    if updated_todo:
        return jsonify(updated_todo)
    else:
        return jsonify({"error": "Todo not found or access denied"}), 404

@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
@token_required
def delete_todo_route(todo_id):
    user_id = request.user['sub']
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM todos WHERE id = %s AND user_id = %s RETURNING id;", (todo_id, user_id))
            deleted_todo = cur.fetchone()
        conn.commit()
    
    if deleted_todo:
        return jsonify({"message": "Todo deleted"})
    else:
        return jsonify({"error": "Todo not found or access denied"}), 404
