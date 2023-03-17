import { Server as socketServer, Socket } from "socket.io";
import type { Server as httpServer } from "http"

export default function injectSocketIO(server: httpServer)
{
  const io = new socketServer(server);

  io.on("connection", (socket) => {

    // ロガーの作成
    function log(...args: Array<string>) {
      var array = ["[SERVER LOG] Message from server:"];
      array.push.apply(array, Array.prototype.slice.call(arguments));
      socket.emit("log", array);
      console.log(...array);
    }

    // チャットメッセージ受信
    socket.on("chatMessage", (message) => {
      log("Client said:", message);
      io.to(message.room).emit("chatMessage", message.message);
      console.log(message);
    });

    // システムメッセージ受信
    socket.on("message", (message) => {
      console.log(message);
      io.emit("message", message);
    });

    // room作成
    socket.on("create or join", (room) => {
      // log 
      log("Received request to create or join: " + room);
      // room処理
      const clientsInRoom = io.sockets.adapter.rooms.get(room);
      const numROoms = clientsInRoom ? clientsInRoom.size : 0;
      // room info
      log('Room ' + room + ' now has ' + numROoms + ' client(s)');

      // room数をチェックしない場合は作成、ある場合はjoinする
      if (numROoms === 0) {
        socket.join(room);
        log('Client ID ' + socket.id + ' created room ' + room);
        socket.emit('created', room, socket.id);
      } else if (numROoms == 1) {
        log('Client ID ' + socket.id + ' joined room ' + room);
        io.sockets.in(room).emit('join', room);
        socket.join(room);
        socket.emit('joined', room, socket.id);
        io.sockets.in(room).emit('ready');
      } else { // max two clients
        socket.emit('full', room);
      }
    });

  })

  console.log("socketIO injection");
}