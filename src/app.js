import express, { json } from 'express';
import cors from 'cors';
import routes from "./routes/index.js"
import { counterMiddleware } from "./middleware/requestCounter.js";

const app = express();

// CORS configuration
const allowedOrigins = [
	'http://localhost:5173',  // Vite dev server
	process.env.FRONTEND_URL || '' // Production frontend URL (set via environment variable)
].filter(origin => origin); // Remove empty strings

const corsOptions = {
	origin: allowedOrigins,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// this middleware makes it possible to retrieve the json from the request
app.use(json());

// parse urlencoded forms (used by admin login form)
app.use(express.urlencoded({ extended: true }));

// request counting middleware (used by admin dashboard)
app.use(counterMiddleware);

app.use('/',routes);

// Lightweight healthcheck used by keep-alive pings
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

export default app;