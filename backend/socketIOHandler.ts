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
      // 自分自身にだけ送り返したい
      //socket.emit("log", array);
      console.log(...array);
    }

    // チャットメッセージ受信
    socket.on("chatMessage", (message, room) => {
      log("Client said:", message, "in", room);
      io.to(room).emit("chatMessage", message);
      console.log(message);
    });

    // システムメッセージ受信
    socket.on("message", (message, room) => {
      if (room) {
        console.log(message, room);
        socket.to(room).emit("message", message, room);
      } else 
      {
        io.emit("message", message);
      }
    });

    // room作成
    socket.on("create or join", (room) => {
      // log 
      log("Received request to create or join: " + room);
      // roomの確認
      const clientsInRoom = io.sockets.adapter.rooms.get(room);
      // roomの人数を確認
      const inRoomNums = clientsInRoom ? clientsInRoom.size : 0;
      // room info
      log('Room ' + room + ' now has ' + inRoomNums + ' client(s)');

      // roomに人がいない or roomがない場合
      if (inRoomNums === 0) {
        socket.join(room);
        log('Client ID ' + socket.id + ' created room ' + room);
        // 全体通知
        io.emit('created', room, socket.id);
      } else if (inRoomNums == 1) {
        log('Client ID ' + socket.id + ' joined room ' + room);
        socket.join(room);
        // 全体通知
        io.sockets.in(room).emit('join', room, socket.id);
        // 個別通知
        socket.emit('joined', room, socket.id);
        io.sockets.in(room).emit('ready');
      } else { // max two clients
        socket.emit('full', room);
      }
    });

  })

  console.log("socketIO injection");
}