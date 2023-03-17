import { Server, Socket } from "socket.io";

export default function injectSocketIO(server)
{
  const io = new Server(server);

  io.on("connection", (socket) => {
    
  })

  console.log("socketIO injection");
}