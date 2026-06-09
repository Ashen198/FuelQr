const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Quota = require('./models/Quota');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Station = require('./models/Station');

const app = express();

// Middleware
app.use(express.json());

// MongoDB connection URI (Atlas connection with default database 'fuelQR')
const MONGO_URI = 'mongodb+srv://fuelQR:abcd@cluster0.bpqinrj.mongodb.net/fuelQR?retryWrites=true&w=majority';


// vehicle Model page process

// 2. Define Mongoose Schema and Model
const VehicleModelSchema = new mongoose.Schema({
  modelName: { type: String, required: true },
  quota: { type: Number, required: true }
}, {
  timestamps: true,
  // Automatically transforms MongoDB's default _id to id in JSON outputs to match your frontend code
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const VehicleModel = mongoose.model('VehicleModel', VehicleModelSchema);


// 3. POST Endpoint - Create a new vehicle model
app.post('/api/vehicle-models', async (req, res) => {
  try {
    const { modelName, quota } = req.body;

    if (!modelName || !quota) {
      return res.status(400).json({ status: 'error', message: 'Model name and quota are required' });
    }

    const newModel = new VehicleModel({ modelName, quota });
    await newModel.save();

    res.json({ status: 'success', message: 'Vehicle model added successfully', data: newModel });
  } catch (err) {
    console.error('Error saving model:', err);
    res.status(500).json({ status: 'error', message: 'Failed to save model to database' });
  }
});


// 4. GET Endpoint - Fetch all vehicle models
app.get('/api/vehicle-models', async (req, res) => {
  try {
    const models = await VehicleModel.find().sort({ createdAt: -1 });
    res.json(models);
  } catch (err) {
    console.error('Error fetching models:', err);
    res.status(500).json({ status: 'error', message: 'Failed to retrieve models' });
  }
});


// 5. PUT Endpoint - Update an existing vehicle model by ID
app.put('/api/vehicle-models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { modelName, quota } = req.body;

    const updatedModel = await VehicleModel.findByIdAndUpdate(
      id,
      { modelName, quota },
      { new: true, runValidators: true }
    );

    if (!updatedModel) {
      return res.status(404).json({ status: 'error', message: 'Model not found' });
    }

    res.json({ status: 'success', message: 'Vehicle model updated successfully', data: updatedModel });
  } catch (err) {
    console.error('Error updating model:', err);
    res.status(500).json({ status: 'error', message: 'Failed to update model' });
  }
});


// 6. DELETE Endpoint - Delete a vehicle model by ID
app.delete('/api/vehicle-models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedModel = await VehicleModel.findByIdAndDelete(id);

    if (!deletedModel) {
      return res.status(404).json({ status: 'error', message: 'Model not found' });
    }

    res.json({ status: 'success', message: 'Vehicle model removed successfully' });
  } catch (err) {
    console.error('Error deleting model:', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete model' });
  }
});






//fuelType page process



// 1. Define the Fuel Type Schema and Model
const FuelTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

const FuelType = mongoose.model('FuelType', FuelTypeSchema);


// 2. GET Endpoint - Fetch all fuel types from MongoDB
app.get('/api/fueltypes', async (req, res) => {
  try {
    const fuelTypes = await FuelType.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json(fuelTypes);
  } catch (error) {
    console.error("Error fetching fuel types:", error);
    res.status(500).json({ error: "Failed to retrieve fuel types" });
  }
});


// 3. POST Endpoint - Create a brand new fuel type record
app.post('/api/fueltypes', async (req, res) => {
  try {
    const { name, description, price, status } = req.body;

    const newFuelType = new FuelType({
      name,
      description,
      price,
      status
    });

    await newFuelType.save();
    res.status(201).json(newFuelType);
  } catch (error) {
    console.error("Error creating fuel type:", error);
    res.status(500).json({ error: "Failed to create fuel type entry" });
  }
});


// 4. PUT Endpoint - Update an existing fuel type details by ID
app.put('/api/fueltypes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, status } = req.body;

    const updatedFuelType = await FuelType.findByIdAndUpdate(
      id,
      { name, description, price, status },
      { new: true, runValidators: true } // Returns the modified document instead of the original
    );

    if (!updatedFuelType) {
      return res.status(404).json({ error: "Fuel type document not found" });
    }

    res.status(200).json(updatedFuelType);
  } catch (error) {
    console.error("Error updating fuel type:", error);
    res.status(500).json({ error: "Failed to modify fuel type details" });
  }
});


// 5. DELETE Endpoint - Permanently drop a fuel type record by ID
app.delete('/api/fueltypes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFuelType = await FuelType.findByIdAndDelete(id);

    if (!deletedFuelType) {
      return res.status(404).json({ error: "Fuel type document not found" });
    }

    res.status(200).json({ message: "Fuel type completely removed successfully" });
  } catch (error) {
    console.error("Error deleting fuel type:", error);
    res.status(500).json({ error: "Failed to delete fuel type data entry" });
  }
});


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

app.post('/api/quotas', async (req, res) => {
  try {
    const { vehicleType, allowedLiters } = req.body;
    const newQuota = new Quota({ vehicleType, allowedLiters });
    await newQuota.save();
    res.status(201).json(newQuota);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save quota', details: error.message });
  }
});

// --- STATION ENDPOINTS ---

app.get('/api/stations', async (req, res) => {
  try {
    const stations = await Station.find().sort({ name: 1 });
    // Map _id to id for frontend compatibility
    const formattedStations = stations.map(s => ({
      ...s._doc,
      id: s._id
    }));
    res.status(200).json(formattedStations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stations' });
  }
});

app.post('/api/stations', async (req, res) => {
  try {
    const stationData = req.body;
    const newStation = new Station(stationData);
    await newStation.save();
    res.status(201).json({ ...newStation._doc, id: newStation._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add station', details: error.message });
  }
});

app.put('/api/stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const stationData = req.body;
    const updatedStation = await Station.findByIdAndUpdate(id, stationData, { new: true });
    if (!updatedStation) return res.status(404).json({ error: 'Station not found' });
    res.status(200).json({ ...updatedStation._doc, id: updatedStation._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update station' });
  }
});

app.delete('/api/stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStation = await Station.findByIdAndDelete(id);
    if (!deletedStation) return res.status(404).json({ error: 'Station not found' });
    res.status(200).json({ message: 'Station deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete station' });
  }
});

// Serve static files from specified directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'Nilakshi', 'Dimanthi')));
app.use(express.static(path.join(__dirname, 'Ranudi')));
app.use(express.static(path.join(__dirname, 'Layanga')));

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
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 8000 // Timeout if unable to reach Atlas
})
  .then(() => {
    console.log('>>> Connected securely to MongoDB Atlas.');
    migrateUsers();
    migrateStations();
  })
  .catch(err => {
    console.error('>>> DATABASE CONNECTION ERROR:', err.message);
    console.error('>>> Please ensure your database connection URI is correct and your IP address is whitelisted in MongoDB Atlas.');
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

const STATION_JSON_PATH = path.join(__dirname, 'Ranudi', 'stations.json');

async function migrateStations() {
  try {
    if (fs.existsSync(STATION_JSON_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATION_JSON_PATH, 'utf8'));
      if (Array.isArray(data)) {
        console.log(`>>> Found ${data.length} stations in stations.json for migration...`);
        for (const station of data) {
          const exists = await Station.findOne({ name: station.name });
          if (!exists) {
            const newStation = new Station({
              name: station.name,
              operatingHours: station.operatingHours,
              contact: station.contact,
              facilities: station.facilities
            });
            await newStation.save();
            console.log(`>>> Migrated station: ${station.name}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('>>> Station migration error:', err.message);
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



// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`>>> Server is running!`);
  console.log(`>>> Local Access: http://localhost:${PORT}`);
});

