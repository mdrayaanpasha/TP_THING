import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class UserAuth {
    // Register a new user
    static async register(req: Request, res: Response): Promise<Response> {
        const { name, email, password, type, price } = req.body;

        if (!name || !email || !password || !type) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            let user;
            if (type === "THERAPIST") {
                let p = parseInt(price)
                user = await prisma.user.create({
                    data: { name, email, password: hashedPassword, type, price: p }
                });
            } else {
                user = await prisma.user.create({
                    data: { name, email, password: hashedPassword, type }
                });
            }

            const token = jwt.sign({ userId: user.id, type: user.type }, JWT_SECRET, { expiresIn: '7d' });

            return res.status(201).json({ message: "User registered successfully", token });
        } catch (e: any) {
            if (e.code === 'P2002') { // Prisma unique constraint error
                return res.status(409).json({ message: "Email already in use" });
            }
            console.log(e)

            return res.status(500).json({ message: "Server error", error: e.message });
        }
    }

    // Login user and return JWT token
    static async login(req: Request, res: Response): Promise<Response> {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.status(401).json({ message: "Invalid password" });
            }

            const token = jwt.sign({ userId: user.id, type: user.type }, JWT_SECRET, { expiresIn: '7d' });

            return res.status(200).json({ message: "Logged in successfully", token });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ message: "Server error", error: error.message });
        }
    }

    // Verify JWT token
    static verifyToken(token: string): { userId: number, type: string } | null {
        try {
            return jwt.verify(token, JWT_SECRET) as { userId: number, type: string };
        } catch {
            return null;
        }
    }
}


export default new UserAuth();