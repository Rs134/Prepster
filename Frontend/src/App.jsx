import { useState } from 'react';
import './index.css';
import Header from './components/Header';
import QuestionForm from './components/QuestionForm';
import QuestionDisplay from './components/QuestionDisplay';

function App() {
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const handleQuestionGenerated = (question) => {
    setCurrentQuestion(question);
  };

  const handleNewQuestion = () => {
    setCurrentQuestion(null);
  };

  return (
    <div>
      <Header />

      {!currentQuestion ? (
        <QuestionForm onQuestionGenerated={handleQuestionGenerated} />
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