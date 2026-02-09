const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.post('/api/generate-question', async (req, res) => {
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

    res.json({ question });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/evaluate-answer', async (req, res) => {
  const { question, answer } = req.body;

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

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});