// routes/therapistSessions.ts

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import therapyController from './therapy.controller';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class TherapistController {
    async UpcomingEvents(req: Request, res: Response) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;

        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decoded.userId;
        if (!userId) {
            return res.status(400).json({ error: 'Invalid user ID in token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { type: true }
        });

        if (!user || user.type !== 'THERAPIST') {
            return res.status(403).json({ error: 'Access denied: not a therapist' });
        }

        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

        const sessions = await prisma.therapy.findMany({
            where: {
                therapistId: userId,
                date: {
                    gte: twoHoursAgo
                }
            },
            orderBy: {
                date: 'asc'
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return res.json({ sessions });
    }
}

export default new TherapistController();