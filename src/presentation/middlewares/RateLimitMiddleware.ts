import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit jendela waktu
  max: 15, // Maksimal 15 percobaan login per 15 menit per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Terlalu banyak percobaan masuk. Demi keamanan, silakan coba lagi setelah 15 menit.',
  },
});
