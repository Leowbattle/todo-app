CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

-- Insert sample data
INSERT INTO todos (title, description, completed) VALUES
    ('Learn Docker', 'Set up Docker containers for the todo app', true),
    ('Build API', 'Create REST API endpoints for todos', false),
    ('Design Frontend', 'Create React components for todo list', false);
