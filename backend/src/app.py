from flask import Flask
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
            cur.execute("SELECT id, title, description, completed, created_at, updated_at FROM todos;")
            todos = cur.fetchall()
    return todos

@app.route("/api/todos", methods=["GET"])
def get_todos_route():
    todos = get_todos()
    return {"todos": todos}
