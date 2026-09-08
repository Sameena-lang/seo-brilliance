import dotenv from 'dotenv';
dotenv.config();

import './workers'; // This initializes the BullMQ workers
import prisma from './config/db';
import { crawlerWorker } from './workers/crawler.worker';
// Import other workers if necessary, e.g., seoWorker or reportWorker
// Assuming they export their worker instance like crawlerWorker does

console.log(`Worker process started in ${process.env.NODE_ENV} mode.`);

// Graceful shutdown handling
const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down BullMQ workers gracefully...`);
    
    try {
        // Assuming crawlerWorker is exported from crawler.worker.ts
        if (crawlerWorker) {
            await crawlerWorker.close();
            console.log('Crawler worker closed.');
        }
        
        await prisma.$disconnect();
        console.log('Database connections closed.');
        
        process.exit(0);
    } catch (err) {
        console.error('Error during worker shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
