import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './config/db';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`API Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Closing HTTP server and database connections...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database connections closed.');
        process.exit(0);
    });

    // Fallback force kill after 10 seconds
    setTimeout(() => {
        console.error('Forcing shutdown after timeout.');
        process.exit(1);
    }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
