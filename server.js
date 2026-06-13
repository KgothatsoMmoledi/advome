// Advome Backend — Node.js/Express with Kimi AI Integration
// Save as server.js or app.js in your backend project

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'af-south-1'
});

// Kimi API configuration
const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['https://advome.co.za', 'https://www.advome.co.za', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } }
});
app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, PNG, JPG allowed.'));
    }
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Access token required' } });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Invalid or expired token' } });
    }
    req.user = user;
    next();
  });
};

// ==================== KIMI AI FUNCTIONS ====================

async function callKimiAPI(messages, temperature = 0.1, maxTokens = 4000, jsonMode = false) {
  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'kimi-latest',
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } })
      })
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Kimi API Error:', error);
    throw new Error('AI service temporarily unavailable');
  }
}

async function detectDocumentWithKimi(documentText) {
  const prompt = `You are a South African legal document analyzer. Analyze the following document and return ONLY a JSON object with these fields:
  - document_type: string (e.g., "CCMA Arbitration Award", "Divorce Summons", "Death Notice")
  - confidence: "High" | "Medium" | "Low"
  - detected_stage: string (e.g., "Award Received", "Pleadings", "Reporting")
  - matter_category: "labour" | "divorce" | "estates" | "civil" | "unknown"
  - next_steps: array of 3-5 actionable strings
  - extracted_data: object with key facts (dates, names, amounts, case numbers)
  - recommended_workflow: string (HTML filename like "award.html", "divorce.html")
  - legal_framework: array of relevant legislation sections

  Document text (first 8000 characters): ${documentText.substring(0, 8000)}`;

  const result = await callKimiAPI([{ role: 'user', content: prompt }], 0.1, 4000, true);
  return JSON.parse(result);
}

async function generateTemplateWithKimi(templateType, userInputs, matterContext = {}) {
  const templatePrompts = {
    notice_of_motion: `Generate a South African Labour Court Notice of Motion for a Section 145 review. Use proper legal formatting. Include: parties, relief sought, and basis. Use the following user inputs:`,
    founding_affidavit: `Generate a South African Founding Affidavit for a Labour Court review application. Include: deponent details, background facts, grounds of review, and relief sought. Use proper legal formatting.`,
    heads_of_argument: `Generate structural Heads of Argument for a Labour Court review. Include: introduction, issues, submissions, relief, and conclusion. Do not include actual legal arguments — provide the structure only.`,
    settlement_agreement: `Generate a South African divorce settlement agreement. Include: property division, maintenance, children arrangements, and general terms.`,
    parenting_plan: `Generate a South African parenting plan under the Children's Act 38 of 2005. Include: living arrangements, contact schedule, decision-making, communication, and dispute resolution.`,
    covering_letter: `Generate a covering letter for the Master's Office for estate administration. Include: deceased details, applicant details, and list of lodged documents.`,
    record_index: `Generate an index for a Labour Court review record. Include: sequential numbering and page references.`,
    divorce_summons: `Generate a South African divorce summons with particulars of claim. Include: marriage details, grounds for divorce, and relief sought.`
  };

  const basePrompt = templatePrompts[templateType] || `Generate a South African legal document of type: ${templateType}`;

  const prompt = `${basePrompt}

User inputs: ${JSON.stringify(userInputs)}

Matter context: ${JSON.stringify(matterContext)}

Generate the complete document with proper South African legal formatting, structure, and language. Add the following disclaimer at the end:

"---

⚠️ IMPORTANT: This document was generated by Advome, a procedural assistance platform. It is a template based on your inputs and must be reviewed, verified, and adapted before filing. Advome does not provide legal advice and does not guarantee compliance with current court rules. Users take full responsibility for all documents filed."

Return ONLY the document text. No additional commentary.`;

  return await callKimiAPI([{ role: 'user', content: prompt }], 0.3, 4000);
}

async function retrieveLegislationWithKimi(query, category) {
  const prompt = `You are a South African legal research assistant. The user is searching for legislation related to: "${query}" in the category: "${category}".

Return a JSON array of relevant legislation with these fields for each item:
- title: string (full Act name)
- section: string (relevant section number)
- text: string (brief summary of the section)
- citation: string (short citation format)
- relevance: string (why this is relevant to the query)

Limit to 5 most relevant results. Return ONLY the JSON array.`;

  const result = await callKimiAPI([{ role: 'user', content: prompt }], 0.1, 4000, true);
  return JSON.parse(result);
}

async function retrievePrecedentWithKimi(query, category) {
  const prompt = `You are a South African legal research assistant. The user is searching for case law precedent related to: "${query}" in the category: "${category}".

Return a JSON array of relevant South African cases with these fields for each item:
- case_name: string (full case name)
- citation: string (e.g., [2020] ZALC 123)
- court: string (e.g., Labour Court, CCMA, LAC)
- year: number
- summary: string (2-3 sentence summary of the holding)
- relevance: string (why this case is relevant)

Limit to 5 most relevant results. Focus on recent and authoritative cases. Return ONLY the JSON array.`;

  const result = await callKimiAPI([{ role: 'user', content: prompt }], 0.1, 4000, true);
  return JSON.parse(result);
}

// ==================== FILE EXTRACTION ====================

async function extractTextFromFile(file) {
  try {
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.text;
    } else if (file.mimetype.includes('word')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    } else if (file.mimetype.startsWith('image/')) {
      // For images, we would use OCR (Tesseract or cloud OCR)
      // For now, return placeholder — implement OCR in production
      return '[Image file uploaded — OCR extraction required]';
    }
    return '[Unsupported file type for text extraction]';
  } catch (error) {
    console.error('File extraction error:', error);
    return '[Error extracting text from file]';
  }
}

async function uploadToS3(file, userId, matterId) {
  const key = `documents/${userId}/${matterId}/${Date.now()}_${file.originalname}`;

  await s3.putObject({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      'user-id': userId,
      'matter-id': matterId,
      'original-name': file.originalname
    }
  }).promise();

  return key;
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, plan } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email already registered' } });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, phone, plan) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, plan, created_at',
      [email, passwordHash, full_name, phone, plan || 'self']
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email, plan: user.plan }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ success: true, token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Registration failed' } });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT id, email, password_hash, plan, full_name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Invalid credentials' } });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Invalid credentials' } });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, plan: user.plan }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token, user: { id: user.id, email: user.email, plan: user.plan, full_name: user.full_name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Login failed' } });
  }
});

// Document Detection
app.post('/api/documents/detect', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } });
    }

    // Extract text from file
    const documentText = await extractTextFromFile(req.file);

    // Call Kimi for detection
    const detection = await detectDocumentWithKimi(documentText);

    // Upload to S3
    const s3Key = await uploadToS3(req.file, req.user.userId, req.body.matter_id || 'unassigned');

    // Save to database
    const docResult = await pool.query(
      'INSERT INTO documents (user_id, matter_id, filename, original_name, file_size, mime_type, s3_key, document_type, detected_stage, ai_analysis) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
      [req.user.userId, req.body.matter_id || null, req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, s3Key, detection.document_type, detection.detected_stage, detection]
    );

    res.json({
      success: true,
      detection,
      document_id: docResult.rows[0].id,
      s3_key: s3Key
    });
  } catch (error) {
    console.error('Document detection error:', error);
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: error.message || 'Document analysis failed' } });
  }
});

// Template Generation
app.post('/api/templates/generate', authenticateToken, async (req, res) => {
  try {
    const { template_type, matter_id, user_inputs } = req.body;

    if (!template_type || !user_inputs) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Template type and user inputs required' } });
    }

    // Get matter context if matter_id provided
    let matterContext = {};
    if (matter_id) {
      const matterResult = await pool.query('SELECT * FROM matters WHERE id = $1 AND user_id = $2', [matter_id, req.user.userId]);
      if (matterResult.rows.length > 0) {
        matterContext = matterResult.rows[0];
      }
    }

    // Call Kimi for template generation
    const content = await generateTemplateWithKimi(template_type, user_inputs, matterContext);

    // Save to database
    const templateResult = await pool.query(
      'INSERT INTO templates (user_id, matter_id, template_type, content, user_inputs) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.user.userId, matter_id || null, template_type, content, user_inputs]
    );

    res.json({
      success: true,
      template: {
        id: templateResult.rows[0].id,
        type: template_type,
        content: content,
        generated_at: new Date().toISOString(),
        word_count: content.split(/\s+/).length
      }
    });
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: error.message || 'Template generation failed' } });
  }
});

// Legislation Search
app.get('/api/legislation/search', authenticateToken, async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Query parameter required' } });
    }

    const results = await retrieveLegislationWithKimi(q, category || 'general');

    res.json({ success: true, results });
  } catch (error) {
    console.error('Legislation search error:', error);
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Search failed' } });
  }
});

// Precedent Search
app.get('/api/precedent/search', authenticateToken, async (req, res) => {
  try {
    const { q, category } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Query parameter required' } });
    }

    const results = await retrievePrecedentWithKimi(q, category || 'general');

    res.json({ success: true, results });
  } catch (error) {
    console.error('Precedent search error:', error);
    res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'Search failed' } });
  }
});

// Matter Management
app.get('/api/matters', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM matters WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.userId]);
    res.json({ success: true, matters: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch matters' } });
  }
});

app.post('/api/matters', authenticateToken, async (req, res) => {
  try {
    const { title, type, description, parties } = req.body;

    const result = await pool.query(
      'INSERT INTO matters (user_id, title, type, description, parties) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, title, type, description, JSON.stringify(parties)]
    );

    res.status(201).json({ success: true, matter: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create matter' } });
  }
});

// Fee Tracking
app.get('/api/fees/:matter_id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fees WHERE matter_id = $1 ORDER BY created_at DESC', [req.params.matter_id]);
    const total = result.rows.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

    res.json({ success: true, fees: result.rows, total });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch fees' } });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message || 'Internal server error' } });
});

// Start server
app.listen(PORT, () => {
  console.log(`Advome API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
