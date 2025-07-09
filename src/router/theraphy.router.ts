import { Router } from "express";
import therapyController from "../controller/therapy.controller";

const TherapyRouter = Router();

// GET all therapists
TherapyRouter.get("/therapists", therapyController.getAllTheraphist);

// GET single therapist by ID
TherapyRouter.get("/therapists/:id", therapyController.getTheraphyById);

// POST book a therapy session
TherapyRouter.post("/book", therapyController.bookATheraphy);

// GET all sessions for a user
TherapyRouter.get("/sessions", therapyController.getUserTherapies);

// GET create fictional theraphist.
TherapyRouter.get("/create-fictional-therapist", therapyController.createMockTherapists)
// DELETE a therapy session
TherapyRouter.delete("/sessions/:sessionId", therapyController.cancelTherapy);

export default TherapyRouter;
