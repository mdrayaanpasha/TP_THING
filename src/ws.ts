import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const server = http.createServer();
const wss = new WebSocketServer({ server });
const prisma = new PrismaClient();

// Extend ws' WebSocket class (not DOM one!)
interface ExtendedWebSocket extends WebSocket {
    userId?: number;
}

wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('🔌 New WS client connected');

    ws.on('message', async (data: Buffer) => {
        try {
            const { input, token, to_id } = JSON.parse(data.toString());
            if (!input || !token || !to_id) {
                ws.send(JSON.stringify({ error: 'Missing fields in message' }));
                return;
            }

            const decoded: any = jwt.verify(token, JWT_SECRET);
            const fromId = decoded.userId;
            const toId = parseInt(to_id, 10);
            ws.userId = fromId;

            const savedMessage = await prisma.message.create({
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
                const extClient = client as ExtendedWebSocket;
                if (
                    extClient.readyState === WebSocket.OPEN &&
                    (extClient.userId === toId || extClient.userId === fromId)
                ) {
                    extClient.send(outbound);
                }
            });

        } catch (err) {
            console.error('❌ WebSocket message error:', err);
            ws.send(JSON.stringify({ error: 'Invalid message or token' }));
        }
    });

    ws.on('close', () => console.log('❌ WS client disconnected'));
});

server.listen(PORT, () => {
    console.log(`📡 WebSocket server running at ws://localhost:${PORT}`);
});
