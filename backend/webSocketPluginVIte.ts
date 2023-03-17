import injectSocketIO  from "./socketIOHandler";
import type { ViteDevServer } from "vite";

export const webSocketServer = {
  name: "socketIOServer",
  configureServer(server: ViteDevServer) {
    if (server.httpServer)
      injectSocketIO(server.httpServer);
  }
}