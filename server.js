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
// Replace existing /check route with this:
app.get('/check', (req, res) => {
  const visa = req.query.visa && req.query.visa.trim();
  const passport = req.query.passport && req.query.passport.trim();
  const dob = req.query.dob && req.query.dob.trim(); // expect format like YYYY-MM-DD or DD-MM-YYYY depending on your stored value

  const apps = readData();

  let match = null;

  if (visa) {
    match = apps.find(a => a.applicationNumber === visa);
  } else if (passport && dob) {
    // try to match both passport and date of birth
    // ensure your stored records use the same dob format (e.g. '1990-05-20') in applications.json
    match = apps.find(a => {
      // allow some flexibility: check both exact and simple normalized forms
      const storedDob = (a.dateOfBirth || a.dob || '').toString().trim();
      const storedPassport = (a.passportNumber || '').toString().trim();
      return storedPassport === passport && storedDob === dob;
    });
  } else {
    return res.send('Please provide a visa number (e.g. /check?visa=12345) OR passport and dob (e.g. /check?passport=ABC123&dob=1990-05-20).');
  }

  if (!match) return res.send('No application found for the provided information.');

  // you can return JSON instead of HTML if you prefer; for simplicity we'll return a small HTML snippet
  res.send(`
    <h2>Visa Application Result</h2>
    <p><b>Name:</b> ${match.fullName || 'N/A'}</p>
    <p><b>Application No:</b> ${match.applicationNumber || 'N/A'}</p>
    <p><b>Passport:</b> ${match.passportNumber || 'N/A'}</p>
    <p><b>Date of Birth:</b> ${match.dateOfBirth || match.dob || 'N/A'}</p>
    <p><b>Nationality:</b> ${match.nationality || 'N/A'}</p>
    <p><b>Visa Type:</b> ${match.visaType || 'N/A'}</p>
    <p><b>Status:</b> ${match.status || 'N/A'}</p>
  `);
});