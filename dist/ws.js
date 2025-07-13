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
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const server = http_1.default.createServer();
const wss = new ws_1.WebSocketServer({ server });
const prisma = new client_1.PrismaClient();
wss.on('connection', (ws) => {
    console.log('🔌 New WS client connected');
    ws.on('message', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { input, token, to_id } = JSON.parse(data.toString());
            if (!input || !token || !to_id) {
                ws.send(JSON.stringify({ error: 'Missing fields in message' }));
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const fromId = decoded.userId;
            const toId = parseInt(to_id, 10);
            ws.userId = fromId;
            //check if the appointment is within now to next 2 hrs.
            const savedMessage = yield prisma.message.create({
                data: { fromId, toId, content: input }
            });
            const outbound = JSON.stringify({
                input: savedMessage.content,
                fromId: savedMessage.fromId,
                toId: savedMessage.toId,
                id: savedMessage.id
            });
            // Send only to the sender and the intended recipient
            wss.clients.forEach((client) => {
                const extClient = client;
                if (extClient.readyState === ws_1.WebSocket.OPEN &&
                    (extClient.userId === toId || extClient.userId === fromId)) {
                    extClient.send(outbound);
                }
            });
        }
        catch (err) {
            console.error('❌ WebSocket message error:', err);
            ws.send(JSON.stringify({ error: 'Invalid message or token' }));
        }
    }));
    ws.on('close', () => console.log('❌ WS client disconnected'));
});
server.listen(PORT, () => {
    console.log(`📡 WebSocket server running at ws://localhost:${PORT}`);
});
