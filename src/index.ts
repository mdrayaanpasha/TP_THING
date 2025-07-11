import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import UserRouter from './router/user.router';
import TherapyRouter from './router/theraphy.router';
import jwt from 'jsonwebtoken';
import TherapistRouter from './router/therepist.router';
import messageRouter from './router/messages.router';
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
    res.send('🌐 API Server up!');
});

app.use('/api/auth', UserRouter);
app.use('/api/therapy', TherapyRouter);



// Chat history route
app.use("/api/messages", messageRouter);
app.use("/api/theraphist", TherapistRouter)
app.get('/api/therapy/video-call-room', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    let userId: number | undefined;
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
        const rawUserId = (decoded as any).userId;
        userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
        if (typeof userId !== 'number' || isNaN(userId)) {
            return res.status(401).json({ error: 'Invalid userId in token payload' });
        }
    } else {
        return res.status(401).json({ error: 'Invalid token payload' });
    }

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const session = await prisma.therapy.findFirst({
        where: {
            therapyType: 'VIDEO_CALL',
            date: {
                gte: twoHoursAgo,
                lte: now,
            },
            OR: [
                { clientId: userId },
                { therapistId: userId },
            ]
        },
        include: {
            client: true,
            therapist: true
        }
    });

    if (!session) {
        return res.status(403).json({ error: 'No valid session found' });
    }

    const otherUser = session.clientId === userId ? session.therapist : session.client;
    const roomName = `${session.date.toISOString().split('T')[0]}-${session.clientId}-${session.therapistId}`;

    return res.json({
        roomName,
        username: decoded.name || otherUser.name || 'Anonymous'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
});
