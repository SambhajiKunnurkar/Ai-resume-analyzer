require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define a schema and model for candidates
const candidateSchema = new mongoose.Schema({
  name: String,
  score: Number,
  uploadDate: { type: Date, default: Date.now }
});
const Candidate = mongoose.model('Candidate', candidateSchema);


// Setup Multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API Endpoint for uploading resumes and job description
app.post('/api/upload', upload.array('resumes'), async (req, res) => {
  const { jobDescription } = req.body;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No resume files uploaded.' });
  }

  try {
    const analysisResults = [];

    // Process each uploaded file
    for (const file of req.files) {
      // Extract text from the PDF buffer
      const pdfData = await pdfParse(file.buffer);
      const resumeText = pdfData.text;

      // Call the Python AI service
      const response = await axios.post(process.env.AI_SERVICE_URL, {
        job_description: jobDescription,
        resume_text: resumeText,
      });
      
      const matchScore = response.data.match_score;
      
      // Save candidate info and score to MongoDB
      const newCandidate = new Candidate({
        name: file.originalname,
        score: matchScore,
      });
      const savedCandidate = await newCandidate.save();
      analysisResults.push(savedCandidate);
    }
    
    // Sort results by score in descending order
    analysisResults.sort((a, b) => b.score - a.score);

    res.status(200).json(analysisResults);

  } catch (error) {
    console.error('Error during analysis:', error.message);
    res.status(500).json({ error: 'Failed to analyze resumes.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});