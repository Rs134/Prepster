import express from 'express';
import jwt from 'jsonwebtoken';
import '../config/dotenv.js';
import pool from '../config/database.js';

const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

router.post('/generate-question', authenticateToken, async (req, res) => {
  const { jobRole, industry, experienceLevel, questionType } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
    const question = data.choices[0].message.content;

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

router.post('/evaluate-answer', authenticateToken, async (req, res) => {
  const { questionId, question, answer } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
    const feedback = JSON.parse(data.choices[0].message.content);

    await pool.query(
      `INSERT INTO answers (question_id, user_id, answer_text, score, strengths, improvements)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [questionId, req.userId, answer, feedback.score, JSON.stringify(feedback.strengths), JSON.stringify(feedback.improvements)]
    );

    res.json(feedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

export default router;