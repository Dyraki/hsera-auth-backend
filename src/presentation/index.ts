import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { setupSwagger } from './swagger';
import { ErrorHandlerMiddleware } from './middlewares/ErrorHandlerMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Setup Swagger API Documentation
setupSwagger(app);

// Mount Modular API Routes
app.use('/api', apiRouter);

// Centralized Error Handling Middleware (harus dipasang setelah routing)
app.use(ErrorHandlerMiddleware);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
  });
}

export default app;
