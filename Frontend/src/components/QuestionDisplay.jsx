import { useState } from 'react';

function QuestionDisplay({ question, onNewQuestion }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    
    setLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/evaluate-answer`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          questionId: question.id,
          question: question.text,
          answer: answer
        })
      });
  
      const result = await response.json();
      setFeedback(result);
    } catch (error) {
      console.error('Error evaluating answer:', error);
      alert('Failed to evaluate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="question-container">
      <div className="question-card">
        <h3>{question.text}</h3>
      </div>

      <div className="answer-section">
        <label>Your Answer:</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={10}
          disabled={feedback !== null}
        />

        {!feedback && (
          <button 
            className="submit-btn" 
            onClick={handleSubmitAnswer} 
            disabled={!answer.trim() || loading}
          >
            {loading ? 'Analyzing...' : 'Submit Answer'}
          </button>
        )}
      </div>

      {feedback && (
        <div className="feedback-section">
          <h3>AI Feedback</h3>
          <div className="score">Score: {feedback.score}/10</div>

          <div className="feedback-strengths">
            <h4>Strengths:</h4>
            <ul>
              {feedback.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="feedback-improvements">
            <h4>Areas for Improvement:</h4>
            <ul>
              {feedback.improvements.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <button className="new-question-btn btn" onClick={onNewQuestion}>
            Generate New Question
          </button>
        </div>
      )}
    </div>
  );
}

export default QuestionDisplay;