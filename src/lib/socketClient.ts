import { io } from "socket.io-client"

const tmpSocket = io();
export const socket = tmpSocket;