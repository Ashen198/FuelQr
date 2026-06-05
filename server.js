const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Quota = require('./models/Quota');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');

const app = express();

// Middleware
app.use(express.json());

// Serve static files from specified directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'Nilakshi', 'Dimanthi')));

// Explicit routes for root files to avoid serving the entire directory
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Redirect root to login page
app.get('/', (req, res) => {
  console.log(">>> Root URL accessed - serving login.html");
  res.sendFile(path.join(__dirname, 'Nilakshi', 'Dimanthi', 'login.html'));
});

// MongoDB Connection with timeout handling
console.log(">>> Connecting to MongoDB...");
mongoose.connect('mongodb://localhost:27017/fuelQrDB', {
    serverSelectionTimeoutMS: 5000 // Fail fast if MongoDB is not running
})
  .then(() => {
    console.log('>>> Connected securely to MongoDB.');
    migrateUsers(); 
  })
  .catch(err => {
    console.error('>>> DATABASE CONNECTION ERROR:', err.message);
    console.error('>>> Please ensure MongoDB is running on your machine (localhost:27017)');
  });

// --- MIGRATION LOGIC ---
const JSON_PATH = path.join(__dirname, 'Nilakshi', 'Dimanthi', 'signup.json');

async function migrateUsers() {
  try {
     // 1. Always ensure the default admin exists
     const adminExists = await User.findOne({ email: 'admin@fuel.com' });
     if (!adminExists) {
         const admin = new User({
             fullname: 'System Admin',
             email: 'admin@fuel.com',
             password: '123',
             role: 'admin'
         });
         await admin.save();
         console.log(">>> Default admin user created (admin@fuel.com / 123)");
     } else if (adminExists.role !== 'admin') {
         adminExists.role = 'admin';
         await adminExists.save();
         console.log(">>> Admin role restored for admin@fuel.com");
     }

    // 2. Migrate from signup.json
    if (fs.existsSync(JSON_PATH)) {
      const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
      if (data.users && Array.isArray(data.users)) {
        console.log(`>>> Found ${data.users.length} users in signup.json for migration...`);
        for (const user of data.users) {
          const exists = await User.findOne({ email: user.email });
          if (!exists) {
            const role = user.email === 'admin@fuel.com' ? 'admin' : 'user';
            const newUser = new User({
              fullname: user.fullname,
              email: user.email,
              password: user.password,
              role: role
            });
            await newUser.save();
            console.log(`>>> Migrated user: ${user.email} (${role})`);
          }
        }
      }
    }
  } catch (err) {
    console.error('>>> Migration error:', err.message);
  }
}

function updateJson(newUser) {
    try {
        let data = { users: [] };
        if (fs.existsSync(JSON_PATH)) {
            data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        }
        data.users.push({
            fullname: newUser.fullname,
            email: newUser.email,
            password: newUser.password,
            createdAt: new Date().toISOString()
        });
        fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('>>> Error updating JSON:', err.message);
    }
}

// --- AUTH ENDPOINTS ---

app.post('/api/signup', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const role = email === 'admin@fuel.com' ? 'admin' : 'user';
    const newUser = new User({ fullname, email, password, role });
    await newUser.save();
    
    updateJson({ fullname, email, password });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`>>> Login attempt for: ${email}`);
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.status(200).json({ 
      message: 'Login successful', 
      user: { fullname: user.fullname, email: user.email, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// --- VEHICLE ENDPOINTS ---

app.get('/api/vehicles', async (req, res) => {
  try {
    const { email, role } = req.query;
    let query = {};
    if (role !== 'admin') {
      query = { ownerEmail: email };
    }
    const vehicles = await Vehicle.find(query).sort({ registeredAt: -1 });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicleData = req.body;
    const newVehicle = new Vehicle(vehicleData);
    await newVehicle.save();
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register vehicle', details: error.message });
  }
});

app.patch('/api/vehicles/:vehicleNo/qr', async (req, res) => {
    try {
        const { qrString } = req.body;
        const vehicle = await Vehicle.findOneAndUpdate(
            { vehicleNo: req.params.vehicleNo },
            { qrString },
            { new: true }
        );
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        res.status(200).json(vehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update QR' });
    }
});

// --- QUOTA ENDPOINTS ---
app.get('/api/quotas', async (req, res) => {
  try {
    const quotas = await Quota.find().sort({ createdAt: -1 });
    res.status(200).json(quotas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotas' });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`>>> Server is running!`);
    console.log(`>>> Local Access: http://localhost:${PORT}`);
});