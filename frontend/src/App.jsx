import { useState } from 'react'
import './App.css'
import { Button } from 'react-bootstrap';

async function getHello() {
  const response = await fetch('/api/todos');
  const data = await response.json();
  return data;
}

function App() {
  const [msg, setMsg] = useState('');

  return (
    <>
      <Button onClick={async () => {
        const message = await getHello();
        setMsg(JSON.stringify(message.todos[0], null, 2));
      }}>Click me</Button>
      <p>{msg}</p>
    </>
  )
}

export default App
