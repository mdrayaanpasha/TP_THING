"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const user_router_1 = __importDefault(require("./router/user.router"));
const theraphy_router_1 = __importDefault(require("./router/theraphy.router"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const therepist_router_1 = __importDefault(require("./router/therepist.router"));
const messages_router_1 = __importDefault(require("./router/messages.router"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/', (_, res) => {
    res.send('🌐 API Server up!');
});
app.use('/api/auth', user_router_1.default);
app.use('/api/therapy', theraphy_router_1.default);
// Chat history route
app.use("/api/messages", messages_router_1.default);
app.use("/api/theraphist", therepist_router_1.default);
app.get('/api/therapy/video-call-room', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    let userId;
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
        const rawUserId = decoded.userId;
        userId = typeof rawUserId === 'string' ? parseInt(rawUserId, 10) : rawUserId;
        if (typeof userId !== 'number' || isNaN(userId)) {
            return res.status(401).json({ error: 'Invalid userId in token payload' });
        }
    }
    else {
        return res.status(401).json({ error: 'Invalid token payload' });
    }
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const session = yield prisma.therapy.findFirst({
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
}));
app.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
});
exports.default = app;
