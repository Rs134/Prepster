import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import '../config/dotenv.js';
import pool from '../config/database.js';

const router = express.Router();

const MAX_FIELD_LENGTH = 100;
const MAX_ANSWER_LENGTH = 3000;

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.userId = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      req.userId = null;
    } else {
      req.userId = decoded.userId;
    }
    next();
  });
}

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.userId ? 30 : 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a bit and try again.' },
});

function validateField(value, name, res) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    res.status(400).json({ error: `${name} is required` });
    return false;
  }
  if (value.length > MAX_FIELD_LENGTH) {
    res.status(400).json({ error: `${name} is too long (max ${MAX_FIELD_LENGTH} characters)` });
    return false;
  }
  return true;
}

router.post('/generate-question', optionalAuth, aiLimiter, async (req, res) => {
  const { jobRole, industry, experienceLevel, questionType } = req.body;

  if (!validateField(jobRole, 'jobRole', res)) return;
  if (!validateField(industry, 'industry', res)) return;
  if (!validateField(experienceLevel, 'experienceLevel', res)) return;
  if (!validateField(questionType, 'questionType', res)) return;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 150,
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Generate one realistic interview question based on the criteria provided. Return only the question.'
          },
          {
            role: 'user',
            content: `Generate a ${questionType} interview question for a ${experienceLevel} level ${jobRole} position in ${industry}.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.error('OpenAI error:', data);
      return res.status(502).json({ error: 'Failed to generate question. Please try again.' });
    }

    const question = data.choices[0].message.content;

    if (req.userId) {
      const result = await pool.query(
        `INSERT INTO questions (user_id, question_text, question_type, job_role, industry, experience_level)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [req.userId, question, questionType, jobRole, industry, experienceLevel]
      );

      res.json({
        question,
        questionId: result.rows[0].id
      });
    } else {
      res.json({
        question,
        questionId: null
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

router.post('/evaluate-answer', optionalAuth, aiLimiter, async (req, res) => {
  const { questionId, question, answer } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'question is required' });
  }
  if (!answer || typeof answer !== 'string' || !answer.trim()) {
    return res.status(400).json({ error: 'answer is required' });
  }
  if (answer.length > MAX_ANSWER_LENGTH) {
    return res.status(400).json({ error: `answer is too long (max ${MAX_ANSWER_LENGTH} characters)` });
  }

  try {
    if (req.userId && questionId) {
      const owned = await pool.query(
        'SELECT 1 FROM questions WHERE id = $1 AND user_id = $2',
        [questionId, req.userId]
      );
      if (owned.rows.length === 0) {
        return res.status(403).json({ error: 'That question does not belong to your account' });
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an interview coach. Evaluate the answer and return JSON with: score (0-10), strengths (array), improvements (array). Return only valid JSON.'
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nAnswer: ${answer}\n\nProvide feedback.`
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices?.[0]?.message?.content) {
      console.error('OpenAI error:', data);
      return res.status(502).json({ error: 'Failed to evaluate answer. Please try again.' });
    }

    let feedback;
    try {
      feedback = JSON.parse(data.choices[0].message.content);
    } catch (parseErr) {
      console.error('Failed to parse model output:', data.choices[0].message.content);
      return res.status(502).json({ error: 'Received an unexpected response. Please try again.' });
    }

    if (req.userId && questionId) {
      await pool.query(
        `INSERT INTO answers (question_id, user_id, answer_text, score, strengths, improvements)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [questionId, req.userId, answer, feedback.score, JSON.stringify(feedback.strengths), JSON.stringify(feedback.improvements)]
      );
    }

    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

export default router;