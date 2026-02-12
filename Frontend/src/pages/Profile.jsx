import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import "../profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      navigate('/signin');
      return;
    }

    setUser(JSON.parse(savedUser));
    fetchHistory(token);
  }, [navigate]);

  const fetchHistory = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
  
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Header user={user} />
      
      <div className="profile-container">
        <div className="profile-header">
          <h2>Profile</h2>
          <div className="profile-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Total Questions:</strong> {history.length}</p>
          </div>
        </div>

        <div className="history-section">
          <h3>Question History</h3>
          {loading ? (
            <p>Loading...</p>
          ) : history.length === 0 ? (
            <p>No questions answered yet. Start practicing!</p>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-question">
                    <h4>Question {index + 1}</h4>
                    <p>{item.question_text}</p>
                    <span className="question-type">{item.question_type}</span>
                  </div>
                  
                  {item.answer_text && (
                    <div className="history-answer">
                      <h5>Your Answer:</h5>
                      <p>{item.answer_text}</p>
                      {item.score && (
                        <div className="score">Score: {item.score}/10</div>
                      )}
                    </div>
                  )}
                  
                  <div className="history-date">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;