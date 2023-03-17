import injectSocketIO  from "./socketIOHandler";

export const webSocketServer = {
  name: "socketIOServer",
  configureServer(server) {
    injectSocketIO(server.httpServer);
}
}