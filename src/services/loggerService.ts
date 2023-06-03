import winston from 'winston';

// Configuración del logger
const logger = winston.createLogger({
  level: 'info', // Nivel de registro mínimo (puede ser 'info', 'warn', 'error', etc.)
  format: winston.format.json(), // Formato de los registros de log (en este caso, JSON)
  transports: [
    // Transporte para almacenar los registros en la consola
    new winston.transports.Console(),
    // Transporte para almacenar los registros en un archivo
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
