import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router" 
import './index.css'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import Profile from './pages/Profile.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter> 
    <Routes> 
      <Route path="/" element={<App />} /> 
      <Route path="/signin" element={<SignIn/>}/>
      <Route path="/signup" element={<SignUp/>}/>
      <Route path="/profile" element={<Profile />} />
    </Routes> 
  </BrowserRouter> 
)
