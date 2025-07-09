import express, { Request, Response } from 'express';
import UserRouter from './router/user.router';
import TherapyRouter from './router/theraphy.router';
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors())

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('🚀 Hello from Express + TypeScript!');
});


app.use("/api/auth", UserRouter);
app.use("/api/therapy", TherapyRouter);

app.listen(PORT, () => {
    console.log(`⚡️ Server running on http://localhost:${PORT}`);
});
