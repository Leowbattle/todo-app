import { useState } from 'react'
import './App.css'
import { Button, ListGroup, Form } from 'react-bootstrap';
import { useEffect } from 'react';

async function createTodo(title, description) {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, description }),
  });
  const data = await response.json();
  return data.todo;
}

// Get a list of all todos from the backend API
async function getTodos() {
  const response = await fetch('/api/todos');
  const data = await response.json();
  return data.todos;
}

// Update a todo's completed status
async function updateTodo(id, completed) {
  await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });
}

// Delete a todo by ID
async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  });
}

function TODOItem({ todo, setChecked }) {
  return (
    <ListGroup.Item>
      <h2>{todo.title}</h2>
      <p>{todo.description}</p>
      <Button onClick={async () => {
        await setChecked(todo.id, !todo.completed);
      }}>{todo.completed ? "✅" : "❌"}</Button>
      <Button variant="danger" onClick={async () => {
        await deleteTodo(todo.id);
        window.location.reload();
      }}>Delete</Button>
    </ListGroup.Item>
  )
}

function App() {
  const [todos, setTodos] = useState(null);

  useEffect(() => {
    getTodos().then(data => setTodos(data));
  }, []);

  async function setChecked(id, completed) {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const updatedTodo = { ...todo, completed: completed };
        updateTodo(id, completed);
        return updatedTodo;
      }
      return todo;
    }));
  }

  async function deleteTodo(id) {
    await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    });
    setTodos(todos.filter(todo => todo.id !== id));
  }

  return (
    <>
      <h1>Todo List</h1>
      <Form>
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" placeholder="Enter title" id="titleInput" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control type="text" placeholder="Enter description" id="descriptionInput" />
        </Form.Group>

        <Button variant="primary" onClick={async () => {
          const title = document.getElementById('titleInput').value;
          const description = document.getElementById('descriptionInput').value;
          const newTodo = await createTodo(title, description);
          window.location.reload();
        }}>
          Add Todo
        </Button>
      </Form>
      <ListGroup>
        {todos && todos.map(todo => (
          <TODOItem key={todo.id} todo={todo} setChecked={setChecked} deleteTodo={deleteTodo} />
        ))}
      </ListGroup>
    </>
  )
}

export default App
