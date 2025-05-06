const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const connection = require('./db.js');

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/api', require('./userRoutes'));

// CREATE: Signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    connection.query(sql, [email, hashed], (err) => {
      if (err) {
        return res.status(err.code === 'ER_DUP_ENTRY' ? 400 : 500).json({
          message: err.code === 'ER_DUP_ENTRY' ? 'Email already in use.' : 'Server error.'
        });
      }
      res.status(201).json({ message: 'User created!' });
    });
  } catch {
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';

  connection.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error.' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid email.' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Wrong password.' });

    res.json({ message: 'Login successful!' });
  });
});

// READ: All users
app.get('/users/all', (req, res) => {
  connection.query('SELECT id, email FROM users', (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    res.json(results);
  });
});

// READ: Search user by email
app.get('/users/search/:email', (req, res) => {
  connection.query('SELECT id, email FROM users WHERE email = ?', [req.params.email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error.' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(results[0]);
  });
});

// UPDATE: Email/password
app.put('/users/update', async (req, res) => {
  const { email, newEmail, newPassword } = req.body;
  if (!email) return res.status(400).json({ message: 'Original email is required.' });

  let updateQuery = 'UPDATE users SET ';
  const params = [];

  if (newEmail) {
    updateQuery += 'email = ?';
    params.push(newEmail);
  }

  if (newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    if (newEmail) updateQuery += ', ';
    updateQuery += 'password = ?';
    params.push(hashed);
  }

  updateQuery += ' WHERE email = ?';
  params.push(email);

  connection.query(updateQuery, params, (err, result) => {
    if (err) return res.status(500).json({ message: 'Update failed.' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User updated successfully.' });
  });
});

// DELETE: By email
app.delete('/users/delete/:email', (req, res) => {
  connection.query('DELETE FROM users WHERE email = ?', [req.params.email], (err, result) => {
    if (err) return res.status(500).json({ message: 'Delete failed.' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
