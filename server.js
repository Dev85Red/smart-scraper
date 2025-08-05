// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getProfiles, updateStatus } = require('./helpers/google-sheets');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all profiles
app.get('/api/profiles', async (req, res) => {
    const data = await getProfiles();
    res.json(data);
});

// Update status of a profile
app.post('/api/update-status', async (req, res) => {
    const { rowIndex, newStatus } = req.body;
    const result = await updateStatus(rowIndex, newStatus);
    res.json({ success: result });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
