import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class TheraphyController {
    // Get all therapists
    async getAllTheraphist(req: Request, res: Response): Promise<Response> {
        try {
            const therapists = await prisma.user.findMany({
                where: {
                    type: 'THERAPIST'
                }
            });

            return res.status(200).json({ data: therapists });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Error in backend", error });
        }
    }

    // Get therapist by ID
    async getTheraphyById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const therapistId = Number(id);

            if (isNaN(therapistId)) {
                return res.status(400).json({ message: "Invalid therapist ID" });
            }

            const therapist = await prisma.user.findFirst({
                where: {
                    id: therapistId,
                    type: 'THERAPIST'
                }
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

    // Book a therapy session
    async bookATheraphy(req: Request, res: Response): Promise<Response> {
        try {
            const { therapistId, userId, date, title } = req.body;

            if (!therapistId || !userId || !date || !title) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: "Invalid date format" });
            }

            const therapist = await prisma.user.findUnique({
                where: { id: therapistId },
            });

            if (!therapist || therapist.type !== 'THERAPIST') {
                return res.status(404).json({ message: "Therapist not found" });
            }

            // Reconciliation: Check if there's already a booking at this time
            const existingBooking = await prisma.therapy.findFirst({
                where: {
                    therapistId,
                    date: parsedDate,
                },
            });

            if (existingBooking) {
                return res.status(409).json({ message: "Therapist already booked at this time" });
            }

            const booking = await prisma.therapy.create({
                data: {
                    therapistId,
                    clientId: userId,
                    date: parsedDate,
                    title,
                }
            });

            return res.status(201).json({ message: "Therapy session booked", data: booking });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to book therapy session", error });
        }
    }

    // List all therapy sessions for a user
    async getUserTherapies(req: Request, res: Response): Promise<Response> {
        try {
            const { userId } = req.params;

            const sessions = await prisma.therapy.findMany({
                where: { clientId: Number(userId) },
                include: { therapist: true }
            });

            return res.status(200).json({ data: sessions });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Unable to fetch user sessions", error });
        }
    }

    // Cancel a session
    async cancelTherapy(req: Request, res: Response): Promise<Response> {
        try {
            const { sessionId } = req.params;

            const session = await prisma.therapy.delete({
                where: { id: Number(sessionId) }
            });

            return res.status(200).json({ message: "Session cancelled", data: session });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to cancel session", error });
        }
    }
}



export default new TheraphyController();
