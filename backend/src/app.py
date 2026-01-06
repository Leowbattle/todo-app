from flask import Flask, request, jsonify
import psycopg
import os
from pathlib import Path

app = Flask(__name__)

def get_db_connection():
    """Get a database connection."""
    return psycopg.connect(
        dbname=os.environ["PG_DBNAME"],
        user=os.environ["PG_USER"],
        host=os.environ["PG_HOST"],
        password=os.environ["PG_PASSWORD"],
        port=5432,
        row_factory=psycopg.rows.dict_row
    )

def init_db():
    """Initialize database with schema from init.sql."""
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

def get_todos():
    """Fetch all todos from the database."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, title, description, completed, created_at, updated_at FROM todos ORDER BY updated_at DESC;")
            todos = cur.fetchall()
    return todos

@app.route("/api/todos", methods=["POST"])
def create_todo_route():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO todos (title, description, completed, created_at, updated_at) VALUES (%s, %s, %s, NOW(), NOW()) RETURNING id, title, description, completed, created_at, updated_at;",
                (title, description, False)
            )
            new_todo = cur.fetchone()
        conn.commit()
    
    return jsonify(new_todo), 201

@app.route("/api/todos", methods=["GET"])
def get_todos_route():
    todos = get_todos()
    return {"todos": todos}

@app.route("/api/todos/<int:todo_id>", methods=["PUT"])
def update_todo_route(todo_id):
    data = request.get_json()
    completed = data.get("completed")
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE todos SET completed = %s, updated_at = NOW() WHERE id = %s RETURNING id, title, description, completed, created_at, updated_at;",
                (completed, todo_id)
            )
            updated_todo = cur.fetchone()
        conn.commit()
    
    if updated_todo:
        return jsonify(updated_todo)
    else:
        return jsonify({"error": "Todo not found"}), 404
    
@app.route("/api/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo_route(todo_id):
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM todos WHERE id = %s RETURNING id;", (todo_id,))
            deleted_todo = cur.fetchone()
        conn.commit()
    
    if deleted_todo:
        return jsonify({"message": "Todo deleted"})
    else:
        return jsonify({"error": "Todo not found"}), 404