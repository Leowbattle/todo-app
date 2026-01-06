import { useState } from 'react'
import './App.css'
import { Button, ListGroup, Form } from 'react-bootstrap';
import { useEffect } from 'react';
import { createTodo, getTodos, updateTodo, deleteTodo } from './api/todos';

function TODOItem({ todo, setChecked, deleteTodo }) {
  return (
    <ListGroup.Item>
      <h2>{todo.title}</h2>
      <p>{todo.description}</p>
      <Button onClick={async () => {
        await setChecked(todo.id, !todo.completed);
      }}>{todo.completed ? "✅" : "❌"}</Button>
      <Button variant="danger" onClick={async () => {
        await deleteTodo(todo.id);
      }}>Delete</Button>
    </ListGroup.Item>
  )
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    getTodos().then(data => setTodos(data));
  }, []);

  async function handleCreateTodo() {
    if (title == '' || description == '') {
      return;
    }

    const todo = await createTodo(title, description);
    setTodos([todo, ...todos]);
    
    setTitle('');
    setDescription('');

    return todo;
  }

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

  async function handleDeleteTodo(id) {
    await deleteTodo(id);
    setTodos(todos.filter(todo => todo.id !== id));
  }

  return (
    <>
      <h1>Todo List</h1>
      <Form>
        <Form.Group className="mb-3" controlId="formTitle">
          <Form.Label>Title</Form.Label>
          <Form.Control type="text" placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formDescription">
          <Form.Label>Description</Form.Label>
          <Form.Control type="text" placeholder="Enter description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Form.Group>

        <Button variant="primary" onClick={handleCreateTodo}>
          Add Todo
        </Button>
      </Form>
      <ListGroup>
        {todos.map(todo => (
          <TODOItem key={todo.id} todo={todo} setChecked={setChecked} deleteTodo={handleDeleteTodo} />
        ))}
      </ListGroup>
    </>
  )
}

export default App;
