const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./'));


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fuel_qr_db';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));


const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);





function readData() {
    try {
        const data = fs.readFileSync('./signup.json', 'utf8');
        let parsed = JSON.parse(data);
        if (Array.isArray(parsed) || !parsed) {
            parsed = { users: [] };
        }

        if (parsed.vehicles) {
            delete parsed.vehicles;
        }
        return parsed;
    } catch (err) {
        return { users: [] };
    }
}

function writeData(data) {
    fs.writeFileSync('./signup.json', JSON.stringify(data, null, 2));
}


const generateId = () => Math.random().toString(36).substr(2, 9);






app.post('/api/signup', async (req, res) => {
    try {
        const { fullname, email, password } = req.body;
        const data = readData();
        data.users = data.users || [];


        if (data.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = { _id: generateId(), fullname, email, password, createdAt: new Date() };
        data.users.push(newUser);
        writeData(data);

        res.status(201).json({ message: 'User created successfully', user: { fullname, email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = readData();

        const user = (data.users || []).find(u => u.email === email && u.password === password);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', user: { fullname: user.fullname, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.get('/api/user/:email', async (req, res) => {
    try {
        const data = readData();
        const user = (data.users || []).find(u => u.email === req.params.email);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
