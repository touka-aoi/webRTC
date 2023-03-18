import { io, Socket } from "socket.io-client"

interface ServerToClientEvents {
  chatMessage: (message: string) => void;
  message: (message: any) => void;
  full: (room: string) => void;
  created: (room: string) => void;
  joined: (room: string) => void;
  join: (room: string) => void;
  log: (array: Array<string>) => void;
}

interface ClientToServerEvents {
  message: (message: any) => void;
  chatMessage: (message: string, room: string) => void;
  "create or join": (room: string) => void;
}

const tmpSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
export const socket = tmpSocket;