import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import dotenv from "dotenv";
import { DateTime } from 'luxon';
dotenv.config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class TherapyController {

    async getAllTherapist(req: Request, res: Response): Promise<Response> {
        try {
            const therapists = await prisma.user.findMany({
                where: { type: 'THERAPIST' }
            });
            return res.status(200).json({ data: therapists });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Error in backend", error });
        }
    }

    async getTherapyById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const therapistId = Number(id);

            if (isNaN(therapistId)) {
                return res.status(400).json({ message: "Invalid therapist ID" });
            }

            const therapist = await prisma.user.findFirst({
                where: { id: therapistId, type: 'THERAPIST' }
            });

            if (!therapist) {
                return res.status(404).json({ message: "Therapist not found" });
            }

            return res.status(200).json({ data: therapist });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error", error });
        }
    }

    async bookATherapy(req: Request, res: Response): Promise<Response> {
        try {
            const { therapistId, date, title, therapyType }: { therapistId: number, date: string, title: string, therapyType: 'MESSAGE' | 'VIDEO_CALL' } = req.body;
            const authHeader = req.headers.authorization;

            if (!authHeader?.startsWith("Bearer ")) {
                return res.status(401).json({ message: "Missing or invalid Authorization header" });
            }

            const token = authHeader.split(" ")[1];
            let decoded: any;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return res.status(401).json({ message: "Invalid or expired token" });
            }

            const clientId = decoded.userId;
            if (!therapistId || !date) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const parsedDate = DateTime.fromISO(date, { zone: 'Asia/Kolkata' }).toUTC();
            if (!parsedDate.isValid) {
                return res.status(400).json({ message: "Invalid date format" });
            }

            const prismaDate = parsedDate.toJSDate();

            const therapist = await prisma.user.findUnique({ where: { id: therapistId } });
            if (!therapist || therapist.type !== 'THERAPIST') {
                return res.status(404).json({ message: "Therapist not found" });
            }

            const existingBooking = await prisma.therapy.findFirst({
                where: { therapistId, date: prismaDate },
            });

            if (existingBooking) {
                return res.status(409).json({ message: "Therapist already booked at this time" });
            }

            const booking = await prisma.therapy.create({
                data: {
                    therapistId,
                    clientId,
                    therapyType,
                    date: prismaDate,
                    title,
                }
            });

            return res.status(201).json({ message: "Therapy session booked", data: booking });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to book therapy session", error });
        }
    }

    async getUserTherapies(req: Request, res: Response): Promise<Response> {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            let decoded: any;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }

            const userId = decoded.userId;
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            const sessions = await prisma.therapy.findMany({
                where: {
                    clientId: userId,
                    date: { gte: twoHoursAgo },
                },
                include: { therapist: true },
            });

            const localizedSessions = sessions.map(session => ({
                ...session,
                date: DateTime.fromJSDate(session.date).setZone('Asia/Kolkata').toISO(),
            }));

            return res.status(200).json({ data: localizedSessions });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Unable to fetch user sessions", error });
        }
    }

    async cancelTherapy(req: Request, res: Response): Promise<Response> {
        try {
            const { sessionId } = req.params;
            const authHeader = req.headers.authorization;

            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            let decoded: any;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }

            const session = await prisma.therapy.findUnique({
                where: { id: Number(sessionId) }
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            const deleted = await prisma.therapy.delete({
                where: { id: Number(sessionId) }
            });

            return res.status(200).json({ message: "Session cancelled", data: deleted });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to cancel session", error });
        }
    }

    async createMockTherapists(req: Request, res: Response): Promise<Response> {
        try {
            const mockTherapists = [
                { name: "Dr. Lara Mind", email: "lara@calm.com" },
                { name: "Dr. Neil Thoughtson", email: "neil@focus.io" },
                { name: "Dr. Mira Chillwell", email: "mira@zenpath.org" },
                { name: "Dr. Zen Moon", email: "zen@mindspace.ai" },
                { name: "Dr. Felix Talkmore", email: "felix@healtalk.com" },
            ];

            const password = "secureTherapy123";
            const hashedPassword = await bcrypt.hash(password, 10);

            const createdTherapists = await Promise.all(
                mockTherapists.map(t =>
                    prisma.user.create({
                        data: {
                            name: t.name,
                            email: t.email,
                            password: hashedPassword,
                            type: "THERAPIST",
                        }
                    })
                )
            );

            return res.status(201).json({ message: "Mock therapists created", data: createdTherapists });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Error creating mock therapists", error });
        }
    }
}

export default new TherapyController();
