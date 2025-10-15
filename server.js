// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const dataFile = path.join(__dirname, 'data', 'applications.json');

// Utility: read/write functions
function readData() {
    if (!fs.existsSync(dataFile)) return [];
    const jsonData = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(jsonData || '[]');
}
function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// ========== ROUTES ==========

// ✅ 1. Root page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ 2. Admin Login (Simple example)
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid username or password' });
    }
});

// ✅ 3. Get all or search by visa/application number
app.get('/admin/applications', (req, res) => {
    const apps = readData();
    const visa = req.query.visa;
    if (visa) {
        const filtered = apps.filter(a => a.applicationNumber === visa);
        return res.json(filtered);
    }
    res.json(apps);
});

// ✅ 4. Add new application
app.post('/admin/applications', (req, res) => {
    const apps = readData();
    const newApp = { ...req.body, _id: Date.now().toString() };
    apps.push(newApp);
    writeData(apps);
    res.json({ success: true });
});

// ✅ 5. Edit (Update)
app.put('/admin/applications/:id', (req, res) => {
    let apps = readData();
    const id = req.params.id;
    const index = apps.findIndex(a => a._id === id);
    if (index !== -1) {
        apps[index] = { ...apps[index], ...req.body };
        writeData(apps);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// ✅ 6. Delete
app.delete('/admin/applications/:id', (req, res) => {
    let apps = readData();
    apps = apps.filter(a => a._id !== req.params.id);
    writeData(apps);
    res.json({ success: true });
});

// ✅ 7. Admin Dashboard Page
app.get('/admin-dashboard-control-panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// ✅ 8. Admin Login Page
app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
// ✅ Public Visa Check Page
app.get('/check', (req, res) => {
  const visa = req.query.visa;
  const apps = readData();
  const match = apps.find(a => a.applicationNumber === visa);
  
  if (!visa) return res.send('Please provide a visa number like /check?visa=12345');
  if (!match) return res.send('No application found for this number.');
  
  res.send(`
    <h2>Visa Application Result</h2>
    <p><b>Name:</b> ${match.fullName}</p>
    <p><b>Passport:</b> ${match.passportNumber}</p>
    <p><b>Nationality:</b> ${match.nationality}</p>
    <p><b>Visa Type:</b> ${match.visaType}</p>
    <p><b>Status:</b> ${match.status}</p>
  `);
});