import app from "./app.js";
import { syncDB } from "./models/index.js";

const PORT = 3000;

const startServer = async () => {
  try {
    await syncDB();  
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
