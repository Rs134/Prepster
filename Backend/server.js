import express from 'express';
import cors from 'cors';
import './config/dotenv.js';
import schema from './config/schema.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

schema();

app.use('/api/auth', authRoutes);
app.use('/api', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});