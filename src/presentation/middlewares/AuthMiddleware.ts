import { Response, NextFunction } from 'express';
import { JwtService } from '../../infrastructure/security/JwtService';

const jwtService = new JwtService();

export const AuthMiddleware = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Autentikasi diperlukan. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwtService.verify(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Sesi habis atau token tidak valid.' });
  }

  // Menyuntikkan user info ke objek request
  req.user = decoded;
  next();
};
