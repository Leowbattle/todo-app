export async function verifyToken(googleToken) {
  const res = await fetch(`/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: googleToken }),
  });
  return res.json();
}

export function getAuthHeader() {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}
