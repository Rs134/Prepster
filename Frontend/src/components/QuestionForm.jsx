import { useState } from 'react';

function QuestionForm({ onQuestionGenerated }) {
  const [formData, setFormData] = useState({
    jobRole: '',
    industry: '',
    experienceLevel: '',
    questionType: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-question`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formData)
      });
  
      const result = await response.json();
  
      onQuestionGenerated({
        id: result.questionId,
        text: result.question,
        type: formData.questionType,
        context: formData
      });
    } catch (error) {
      console.error('Error generating question:', error);
      alert('Failed to generate question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h2>Customize Your Interview Question</h2>
        <p className="subtitle">Tell us about the role you're preparing for</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label>Job Field *</label>
            <select name="jobRole" value={formData.jobRole} onChange={handleChange} required>
              <option value="">Select a field...</option>
              <option value="technology">Technology & IT</option>
              <option value="business">Business & Management</option>
              <option value="healthcare">Healthcare & Medical</option>
              <option value="education">Education & Training</option>
              <option value="creative">Creative & Design</option>
              <option value="sales-marketing">Sales & Marketing</option>
              <option value="finance">Finance & Accounting</option>
              <option value="engineering">Engineering</option>
              <option value="customer-service">Customer Service</option>
              <option value="operations">Operations & Logistics</option>
              <option value="human-resources">Human Resources</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Experience Level *</label>
            <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} required>
              <option value="">Select level...</option>
              <option value="entry">Entry Level / Internship</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior / Leadership</option>
            </select>
          </div>

          <div className="form-group">
            <label>Question Type *</label>
            <select name="questionType" value={formData.questionType} onChange={handleChange} required>
              <option value="">Select type...</option>
              <option value="behavioral">Behavioral (Tell me about a time...)</option>
              <option value="situational">Situational (What would you do if...)</option>
              <option value="technical">Technical / Skills-based</option>
              <option value="general">General Interview Questions</option>
            </select>
          </div>

          <div className="form-group">
            <label>Industry (Optional)</label>
            <select name="industry" value={formData.industry} onChange={handleChange}>
              <option value="">Any industry...</option>
              <option value="tech">Tech & Software</option>
              <option value="finance">Finance & Banking</option>
              <option value="healthcare">Healthcare</option>
              <option value="retail">Retail & E-commerce</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="consulting">Consulting</option>
              <option value="nonprofit">Non-profit</option>
              <option value="government">Government</option>
              <option value="startup">Startup</option>
            </select>
          </div>

          <button type="submit" className="generate-btn btn" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Question'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default QuestionForm;