const jwt = require('jsonwebtoken');
const secret = 'V3K+6p6Y7pY6H8m9N0vB1X2Z3A4S5D6F7G8H9J0K1L2='; // from .env
const token = jwt.sign({ id: 'test-id', role: 'STUDENT' }, secret, { expiresIn: '1d' });
console.log('Test Token:', token);

// Now try to fetch with this token
fetch('http://localhost:4000/api/courses', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(res => {
  console.log('Status:', res.status);
  return res.json();
}).then(console.log).catch(console.error);
