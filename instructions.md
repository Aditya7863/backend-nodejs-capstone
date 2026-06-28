# SecondChance Project — Local Setup Guide
> Everything up to the point where IBM Cloud is required (Modules 1, 2, 3)

---

## Prerequisites — Install These First

| Tool | Download | Purpose |
|------|----------|---------|
| Node.js (LTS) | https://nodejs.org | Run the backend |
| MongoDB Community | https://www.mongodb.com/try/download/community | Local database |
| Git | https://git-scm.com | Clone repo |
| VS Code | https://code.visualstudio.com | Code editor |

After installing, verify in your terminal:
```bash
node --version
npm --version
git --version
mongod --version
```

---

## Module 1 — Setup & User Stories

### Step 1: Create GitHub Repository

1. Go to: https://github.com/ibm-developer-skills-network/kjriu-backend-nodejs-capstone
2. Click **"Use this template"** → **"Create a new repository"**
3. Fill in:
   - **Repository name:** `backend-nodejs-capstone` (exact name required)
   - **Visibility:** Public
4. Click **"Create repository"**

---

### Step 2: Create User Story Issue Template

1. In your repo → **Settings** → scroll to **Features** → **Issues** → **Set up templates**
2. Click **"Add template"** → **"Custom template"**
3. Click **"Preview and edit"**
4. Set template name to: `User Story`
5. Paste this as the template content:

```
**As a** [role]
**I need** [function]
**So that** [benefit]
### Details and Assumptions
* [document what you know]
### Acceptance Criteria
gherkin
Given [some context]
When [certain action is taken]
Then [the outcome of action is observed]
```

6. Click **"Propose changes"** → **"Commit changes"**

---

### Step 3: Create Labels

Go to: `https://github.com/YOUR_USERNAME/backend-nodejs-capstone/issues/labels`

Create these 3 labels:

| Label | Description | Color |
|-------|-------------|-------|
| `new` | Stories to prioritize | Green |
| `backlog` | Stories in current sprint | Blue |
| `icebox` | Stories for later | Purple |
| `technical debt` | Developer tasks, no customer value | Yellow |

---

### Step 4: Create 13 User Stories

Go to **Issues** → **New Issue** → select **User Story** template.

Create one issue for each title below (add `new` label to all):

1. `Finish User Stories`
2. `Initialize and Populate MongoDB`
3. `Run Skeleton Application`
4. `Implement SecondChanceItems Service API`
5. `Implement Search Service API`
6. `Implement Sentiment Analysis Service API`
7. `Implement Registration Backend API`
8. `Implement Login Backend API`
9. `Implement User Profile Backend API`
10. `Integrate Frontend with Backend`
11. `Add CI/CD Pipelines`
12. `Containerize Services`
13. `Deploy Backend Services`

---

### Step 5: Triage Issues (Backlog Refinement)

**Change to `backlog` label** (work on immediately):
- Finish User Stories
- Initialize and Populate MongoDB
- Run Skeleton Application
- Implement SecondChanceItems Service API
- Implement Search Service API
- Implement Sentiment Analysis Service API

**Change to `icebox` label** (work on later):
- Implement Registration Backend API
- Implement Login Backend API
- Implement User Profile Backend API
- Integrate Frontend with Backend
- Add CI/CD Pipelines
- Containerize Services
- Deploy Backend Services

---

### Step 6: Refine Backlog

1. Add `enhancement` label to customer-facing backlog stories:
   - Implement SecondChanceItems Service API
   - Implement Search Service API
   - Implement Sentiment Analysis Service API

2. Add `technical debt` label to developer-only stories:
   - Finish User Stories
   - Initialize and Populate MongoDB
   - Run Skeleton Application

3. Create a new issue titled `research authentication in Express` with `technical debt` label

---

### Step 7: Clone Repository Locally

```bash
git clone https://github.com/YOUR_USERNAME/backend-nodejs-capstone.git
cd backend-nodejs-capstone
```

---

## Module 2 — APIs & Backend Services

### Step 1: Start Local MongoDB

**Windows:**
```bash
net start MongoDB
```

**Mac/Linux:**
```bash
brew services start mongodb-community
# OR
sudo systemctl start mongod
```

Verify it's running:
```bash
mongosh
```

---

### Step 2: Import secondChanceItems Data

```bash
cd secondChance-backend/util/import-mongo
cp .env.sample .env
```

Open `.env` and update it — for local MongoDB, no password needed:
```
MONGO_URL=mongodb://localhost:27017
DATASRC=gifts.json
```

Then run:
```bash
npm install
npm start
```

Expected output:
```
Connected successfully to server
Inserted documents: 16
```

> **Save this output** — needed for submission as `inserted_items`

---

### Step 3: Validate Data in MongoDB

Open mongosh and run:
```bash
mongosh
show databases          # should show secondChance
use secondChance
show collections        # should show secondChanceItems
db.secondChanceItems.countDocuments()   # should return 16
db.secondChanceItems.find().limit(2)    # first 2 items
db.secondChanceItems.find({"id": "429"})  # find item 429
```

---

### Step 4: Set Up Backend .env

```bash
cd secondChance-backend
cp .env.sample .env
```

Open `.env` and fill in:
```
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=secondChance
JWT_SECRET=your_secret_key_here
```

Install dependencies:
```bash
npm install
```

---

### Step 5: Implement MongoDB Connection (db.js)

Open `secondChance-backend/models/db.js` and complete the `connectToDatabase()` function:

```javascript
const { MongoClient } = require('mongodb');
require('dotenv').config();

let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) return dbInstance;

    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();

    dbInstance = client.db(process.env.MONGO_DB_NAME);
    return dbInstance;
}

module.exports = connectToDatabase;
```

---

### Step 6: Implement SecondChanceItems API

Open `secondChance-backend/routes/secondChanceItemsRoutes.js`

#### GET all items
```javascript
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const items = await collection.find({}).toArray();
        res.json(items);
    } catch (e) {
        next(e);
    }
});
```

#### GET item by ID
```javascript
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const item = await collection.find({ id: req.params.id }).toArray();
        if (!item || item.length === 0) {
            return res.status(404).send('Item not found');
        }
        res.json(item);
    } catch (e) {
        next(e);
    }
});
```

#### POST add new item
```javascript
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        let item = req.body;
        const lastItem = await collection.find().sort({ id: -1 }).limit(1).toArray();
        item.id = (parseInt(lastItem[0].id) + 1).toString();
        item.date_added = Math.floor(new Date().getTime() / 1000);
        await collection.insertOne(item);
        res.status(201).json(item);
    } catch (e) {
        next(e);
    }
});
```

#### PUT update item
```javascript
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const item = await collection.findOneAndUpdate(
            { id: req.params.id },
            { $set: req.body },
            { returnDocument: 'after' }
        );
        if (!item) return res.status(404).send('Item not found');
        res.json(item);
    } catch (e) {
        next(e);
    }
});
```

#### DELETE item
```javascript
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const item = await collection.findOneAndDelete({ id: req.params.id });
        if (!item) return res.status(404).send('Item not found');
        res.json({ message: 'Item deleted successfully' });
    } catch (e) {
        next(e);
    }
});
```

---

### Step 7: Implement Search API

Open `secondChance-backend/routes/searchRoutes.js`

```javascript
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');

        let query = {};

        if (req.query.name && req.query.name !== '') {
            query.name = { $regex: req.query.name, $options: 'i' };
        }
        if (req.query.category && req.query.category !== '') {
            query.category = req.query.category;
        }
        if (req.query.condition && req.query.condition !== '') {
            query.condition = req.query.condition;
        }
        if (req.query.age_years && req.query.age_years !== '') {
            query.age_years = { $lte: parseFloat(req.query.age_years) };
        }

        const items = await collection.find(query).toArray();
        res.json(items);
    } catch (e) {
        next(e);
    }
});
```

---

### Step 8: Implement Sentiment Analysis Service

Navigate to the sentiment folder:
```bash
cd sentiment
npm install natural@6.10.4
```

Open `sentiment/index.js` and implement:

```javascript
const express = require('express');
const natural = require('natural');

const app = express();
app.use(express.json());

const analyzer = new natural.SentimentAnalyzer('English',
    natural.PorterStemmer, 'afinn');

app.post('/sentiment', (req, res, next) => {
    try {
        const { sentence } = req.body;

        if (!sentence) {
            return res.status(400).json({ error: 'Sentence is required' });
        }

        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(sentence);
        const score = analyzer.getSentiment(tokens);

        let sentiment;
        if (score > 0) {
            sentiment = 'positive';
        } else if (score < 0) {
            sentiment = 'negative';
        } else {
            sentiment = 'neutral';
        }

        res.json({ score, sentiment });
    } catch (e) {
        next(e);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sentiment server running on port ${PORT}`);
});
```

---

## Module 3 — Authentication with JWT

### Step 1: Install Auth Packages

```bash
cd secondChance-backend
npm install bcryptjs jsonwebtoken express-validator
```

---

### Step 2: Implement Registration Endpoint

Create/open `secondChance-backend/routes/authRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const { body, validationResult } = require('express-validator');
const logger = require('../logger');

router.post('/register', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // Check if user already exists
        const existingUser = await collection.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);

        // Insert new user
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        // Create JWT
        const payload = { user: { id: newUser.insertedId.toString() } };
        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);

        logger.info('User registered successfully');
        res.json({ authtoken, email: req.body.email });

    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});

module.exports = router;
```

---

### Step 3: Implement Login Endpoint

Add to `authRoutes.js`:

```javascript
router.post('/login', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('users');

        // Find user
        const theUser = await collection.findOne({ email: req.body.email });

        if (theUser) {
            // Check password
            const passwordMatch = await bcryptjs.compare(
                req.body.password, theUser.password
            );

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const userName = theUser.firstName;
            const userEmail = theUser.email;

            const payload = { user: { id: theUser._id.toString() } };
            const authtoken = jwt.sign(payload, process.env.JWT_SECRET);

            logger.info('User logged in successfully');
            return res.status(200).json({ authtoken, userName, userEmail });

        } else {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'Internal server error', details: e.message });
    }
});
```

---

### Step 4: Implement User Profile Update Endpoint

Add to `authRoutes.js`:

```javascript
router.put('/update', async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const email = req.headers.email;
        if (!email) {
            return res.status(400).json({ error: 'Email not found in headers' });
        }

        const db = await connectToDatabase();
        const collection = db.collection('users');

        const existingUser = await collection.findOne({ email });
        existingUser.updatedAt = new Date();

        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: req.body },
            { returnDocument: 'after' }
        );

        const payload = { user: { id: updatedUser._id.toString() } };
        const authtoken = jwt.sign(payload, process.env.JWT_SECRET);

        res.json({ authtoken });
    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});
```

---

### Step 5: Register Auth Routes in app.js

Open `secondChance-backend/app.js` and add:

```javascript
const authRoutes = require('./routes/authRoutes');

// Add this line with your other route registrations
app.use('/api/auth', authRoutes);
```

---

### Step 6: Run the Backend Server

```bash
cd secondChance-backend
npm start
```

Server should start on port 3060 (or as configured).

---

### Step 7: Integrate Frontend with Backend

```bash
cd secondChance-frontend
cp .env.sample .env
```

Open `secondChance-frontend/.env` and set the backend URL:
```
REACT_APP_BACKEND_URL=http://localhost:3060
```

Install and start the frontend:
```bash
npm install
npm start
```

Frontend runs on http://localhost:3000

---

### Step 8: Test the Full Application

Verify all these work in the browser:
- [ ] Main page loads and shows all 16 items
- [ ] User can register a new account
- [ ] Registered user can log in
- [ ] Logged-in user sees option to add items
- [ ] User can log out and log back in
- [ ] Logged-in user can see item details
- [ ] Logged-in user can change their profile name

---

### Step 9: Push All Changes to GitHub

```bash
cd backend-nodejs-capstone
git add .
git commit -m "Complete Modules 1, 2, 3 - APIs and Authentication"
git push origin main
```

---

## Summary of What's Done (No IBM Cloud Needed)

| Module | Lab | Status |
|--------|-----|--------|
| 1 | Complete User Stories | ✅ Done locally |
| 1 | Finish Populating MongoDB | ✅ Done locally |
| 2 | Create API for SecondChanceItems | ✅ Done locally |
| 2 | Create API for Search Service | ✅ Done locally |
| 2 | Add Sentiment Analysis Service | ✅ Done locally |
| 3 | Develop Back End for Registration | ✅ Done locally |
| 3 | Develop Back-end Integration for Login | ✅ Done locally |
| 3 | Develop Back-end Integration for User Profile | ✅ Done locally |
| 3 | Integrate Backend to Frontend | ✅ Done locally |

---

## What Comes Next (Requires IBM Cloud / Cloud IDE)

| Module | Lab | Requires |
|--------|-----|---------|
| 4 | CI/CD with GitHub Actions | GitHub Actions (free) |
| 4 | Containerize and Deploy | Docker + IBM Code Engine |
| 4 | Deploy to Kubernetes | IBM Kubernetes Service |

> **Note:** GitHub Actions for CI/CD (linting) can be done for free. Only Kubernetes and IBM Code Engine deployment require the Skills Network Cloud IDE environment.