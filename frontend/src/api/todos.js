export async function createTodo(title, description) {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });
    const todo = await response.json();
    return todo;
  }

export async function getTodos() {
  const response = await fetch('/api/todos');
  const data = await response.json();
  return data.todos;
}

export async function updateTodo(id, completed) {
  await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ completed }),
  });
}

export async function deleteTodo(id) {
  await fetch(`/api/todos/${id}`, {
    method: 'DELETE',
  });
}
