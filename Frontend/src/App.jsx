import { useState, useEffect } from 'react';
import Header from './components/Header';
import QuestionForm from './components/QuestionForm';
import QuestionDisplay from './components/QuestionDisplay';

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleQuestionGenerated = (question) => {
    setCurrentQuestion(question);
  };

  const handleNewQuestion = () => {
    setCurrentQuestion(null);
  };

  return (
    <div>
      <Header user={user} />
      {!currentQuestion ? (
        <QuestionForm onQuestionGenerated={handleQuestionGenerated} user={user} />
      ) : (
        <QuestionDisplay 
          question={currentQuestion}
          onNewQuestion={handleNewQuestion}
        />
      )}
    </div>
  );
}

export default App;