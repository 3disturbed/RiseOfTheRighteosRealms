const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Load users and realms from JSON files
let users = JSON.parse(fs.readFileSync('data/users.json', 'utf8') || '[]');
let realms = JSON.parse(fs.readFileSync('data/realms.json', 'utf8') || '[]');

// Utility function to find a user by username
const findUser = (username) => users.find(user => user.username === username);

// Utility function to find a realm by user ID
const findRealm = (userId) => realms.find(realm => realm.userId === userId);

// Save users and realms to JSON files
const saveData = () => {
    fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2));
    fs.writeFileSync('data/realms.json', JSON.stringify(realms, null, 2));
};

// Register route
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (findUser(username)) {
        return res.status(400).send('User already exists');
    }
    const userId = users.length + 1;
    users.push({ userId, username, password });
    realms.push({ userId, resources: {}, buildings: [] });
    saveData();
    res.send('User registered');
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUser(username);
    if (!user || user.password !== password) {
        return res.status(401).send('Invalid credentials');
    }
    res.send('Login successful');
});

// GetRealm route
app.get('/getRealm', (req, res) => {
    const { username } = req.query;
    const user = findUser(username);
    if (!user) {
        return res.status(404).send('User not found');
    }
    const realm = findRealm(user.userId);
    res.json(realm);
});

// Build route
app.post('/build', (req, res) => {
    const { username, building } = req.body;
    const user = findUser(username);
    if (!user) {
        return res.status(404).send('User not found');
    }
    const realm = findRealm(user.userId);
    realm.buildings.push(building);
    saveData();
    res.send('Building added');
});

// Demolish route
app.post('/demolish', (req, res) => {
    const { username, building } = req.body;
    const user = findUser(username);
    if (!user) {
        return res.status(404).send('User not found');
    }
    const realm = findRealm(user.userId);
    realm.buildings = realm.buildings.filter(b => b !== building);
    saveData();
    res.send('Building removed');
});

// GetResources route
app.get('/getResources', (req, res) => {
    const { username } = req.query;
    const user = findUser(username);
    if (!user) {
        return res.status(404).send('User not found');
    }
    const realm = findRealm(user.userId);
    res.json(realm.resources);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Game loop to update resources
setInterval(() => {
    realms.forEach(realm => {
        realm.buildings.forEach(building => {
            if (building.production) {
                building.production.forEach(item => {
                    if (!realm.resources[item]) {
                        realm.resources[item] = 0;
                    }
                    realm.resources[item] += 1; // Adjust the production rate as needed
                });
            }
            if (building.consumed) {
                building.consumed.forEach(item => {
                    if (realm.resources[item]) {
                        realm.resources[item] -= 1; // Adjust the consumption rate as needed
                    }
                });
            }
        });
    });
    saveData(); // Save data after each update
}, 1000); // Adjust the interval as needed
