import { useState } from 'react'
import './App.css'
import { Button, ListGroup, Form } from 'react-bootstrap';
import { useEffect } from 'react';
import { createTodo, getTodos, updateTodo, deleteTodo } from './api/todos';
import { GoogleLogin } from '@react-oauth/google';
import { verifyToken, logout } from './api/auth';

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user was previously logged in
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      getTodos().then(data => setTodos(data)).catch(() => {
        // Token expired, clear storage
        logout();
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  async function handleGoogleLogin(credentialResponse) {
    try {
      const response = await verifyToken(credentialResponse.credential);
      if (response.error) {
        console.error('Login failed:', response.error);
        return;
      }
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      // Load todos after login
      const todosData = await getTodos();
      setTodos(todosData);
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setTodos([]);
  }

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
        <h1>Please sign in to access your todos</h1>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => console.log('Login failed')}
        />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Todo List</h1>
        <div>
          <Button variant="outline-secondary" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      
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
