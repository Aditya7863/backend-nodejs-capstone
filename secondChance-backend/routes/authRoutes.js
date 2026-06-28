const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const { body, validationResult } = require('express-validator');
const logger = require('../logger');

// Registration endpoint
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

// Login endpoint
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

// User Profile Update endpoint
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

module.exports = router;
