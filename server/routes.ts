import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get server time (used for synchronization)
  app.get('/api/server-time', (req, res) => {
    res.json({ time: Date.now() });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for real-time updates (if needed)
  // This could be implemented to push updates to clients
  
  return httpServer;
}
