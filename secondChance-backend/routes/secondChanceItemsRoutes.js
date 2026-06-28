const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });


// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('oops something went wrong', e)
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        let secondChanceItem = req.body;
        const lastItem = await collection.find().sort({ id: -1 }).limit(1).toArray();
        secondChanceItem.id = lastItem.length > 0 ? (parseInt(lastItem[0].id) + 1).toString() : '1';
        secondChanceItem.date_added = Math.floor(new Date().getTime() / 1000);
        const result = await collection.insertOne(secondChanceItem);
        res.status(201).json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const item = await collection.find({ id: req.params.id }).toArray();
        if (!item || item.length === 0) {
            return res.status(404).send('Item not found');
        }
        res.json(item);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/:id', async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
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

// Delete an existing item
router.delete('/:id', async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const item = await collection.findOneAndDelete({ id: req.params.id });
        if (!item) return res.status(404).send('Item not found');
        res.json({ message: 'Item deleted successfully' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
