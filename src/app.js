import express, { json } from 'express';
import routes from "./routes/index.js"

const app = express();

// this middleware makes it possible to retrieve the json from the request
app.use(json());

app.use('/',routes);

export default app;