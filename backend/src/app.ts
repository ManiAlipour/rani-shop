import express from "express";
import AuthRouter from "@/routes/auth/router";

const app = express();

app.use(AuthRouter);

export default app;
