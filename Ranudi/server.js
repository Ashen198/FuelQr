const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'stations.json');


app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'station.html'));
});


const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};




app.get('/api/stations', (req, res) => {
    try {
        const stations = readData();
        res.json(stations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/stations', (req, res) => {
    try {
        const stations = readData();
        const newStation = {
            id: Date.now().toString(),
            ...req.body
        };
        stations.push(newStation);
        writeData(stations);
        res.status(201).json(newStation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.put('/api/stations/:id', (req, res) => {
    try {
        const stations = readData();
        const index = stations.findIndex(s => s.id === req.params.id);
        if (index === -1) return res.status(404).json({ error: 'Station not found' });

        stations[index] = { ...stations[index], ...req.body };
        writeData(stations);
        res.json(stations[index]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.delete('/api/stations/:id', (req, res) => {
    try {
        const stations = readData();
        const newStations = stations.filter(s => s.id !== req.params.id);
        if (stations.length === newStations.length) {
            return res.status(404).json({ error: 'Station not found' });
        }
        writeData(newStations);
        res.json({ message: 'Station deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Using JSON file for data: ${DATA_FILE}`);
});
