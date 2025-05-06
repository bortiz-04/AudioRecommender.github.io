const express = require('express');
const router = express.Router();
const connection = require('./db');
const bcrypt = require('bcrypt');

// AUTHENTICATION 

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    connection.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        res.status(200).json({ message: 'Login successful' });
    });
});

// CHANGE PASSWORD
router.post('/change-password', (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const getUserQuery = 'SELECT * FROM users WHERE email = ?';
    connection.query(getUserQuery, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect current password' });

        const hashed = await bcrypt.hash(newPassword, 10);
        const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
        connection.query(updateQuery, [hashed, email], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update password' });
            res.json({ message: '✅ Password updated successfully!' });
        });
    });
});

// DELETE ACCOUNT
router.post('/delete-account', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing required fields' });

    const getUserQuery = 'SELECT * FROM users WHERE email = ?';
    connection.query(getUserQuery, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

        const deleteQuery = 'DELETE FROM users WHERE email = ?';
        connection.query(deleteQuery, [email], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to delete account' });
            res.json({ message: '✅ Account deleted successfully.' });
        });
    });
});

// SEARCH HISTORY

router.post('/save-search', (req, res) => {
    const { userEmail, query } = req.body;
    if (!userEmail || !query) return res.status(400).json({ error: 'Missing email or query' });

    const sql = 'INSERT INTO search_history (user_email, query) VALUES (?, ?)';
    connection.query(sql, [userEmail, query], (err) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.status(200).json({ message: 'Search saved' });
    });
});

router.get('/search-history/:email', (req, res) => {
    const { email } = req.params;
    const sql = 'SELECT * FROM search_history WHERE user_email = ? ORDER BY search_time DESC';
    connection.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.status(200).json(results);
    });
});

// PLAYLISTS

// Create Playlist
router.post('/create-playlist', (req, res) => {
    const { email, name } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Missing email or playlist name' });

    const sql = 'INSERT INTO playlists (user_email, name) VALUES (?, ?)';
    connection.query(sql, [email, name], (err) => {
        if (err) return res.status(500).json({ error: 'Database error creating playlist' });
        res.status(201).json({ message: '✅ Playlist created!' });
    });
});

// Get All Playlists for a User
router.get('/playlists/:email', (req, res) => {
    const { email } = req.params;
    const sql = 'SELECT * FROM playlists WHERE user_email = ? ORDER BY created_at DESC';
    connection.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to load playlists' });
        res.json(results);
    });
});

// Add Song to Playlist
router.post('/add-to-playlist', (req, res) => {
    const { playlistId, song_name, artist_name, album_cover_url, spotify_url } = req.body;
    if (!playlistId || !song_name || !artist_name) {
        return res.status(400).json({ error: 'Missing required song or playlist data' });
    }

    const sql = `
        INSERT INTO playlist_songs 
        (playlist_id, song_name, artist_name, album_cover_url, spotify_url) 
        VALUES (?, ?, ?, ?, ?)
    `;
    connection.query(sql, [playlistId, song_name, artist_name, album_cover_url, spotify_url], (err) => {
        if (err) return res.status(500).json({ error: 'Database error adding song to playlist' });
        res.status(200).json({ message: '🎵 Song added to playlist!' });
    });
});

// Get Songs from a Specific Playlist (includes song ID)
router.get('/playlists/songs/:playlistId', (req, res) => {
    const playlistId = req.params.playlistId;
    const sql = 'SELECT id AS song_id, song_name, artist_name, spotify_url FROM playlist_songs WHERE playlist_id = ?';
    connection.query(sql, [playlistId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error retrieving songs' });
        res.json(results);
    });
});

// Delete Playlist and Its Songs
router.delete('/playlists/:playlistId', (req, res) => {
    const playlistId = req.params.playlistId;

    const deleteSongsQuery = 'DELETE FROM playlist_songs WHERE playlist_id = ?';
    const deletePlaylistQuery = 'DELETE FROM playlists WHERE id = ?';

    connection.query(deleteSongsQuery, [playlistId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete playlist songs.' });

        connection.query(deletePlaylistQuery, [playlistId], (err) => {
            if (err) return res.status(500).json({ error: 'Failed to delete playlist.' });

            res.json({ message: '✅ Playlist deleted successfully.' });
        });
    });
});

module.exports = router;
