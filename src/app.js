import express, { json } from 'express';
import routes from "./routes/index.js"
import { counterMiddleware } from "./middleware/requestCounter.js";

const app = express();

// this middleware makes it possible to retrieve the json from the request
app.use(json());

// request counting middleware (used by admin dashboard)
app.use(counterMiddleware);

app.use('/',routes);

export default app;