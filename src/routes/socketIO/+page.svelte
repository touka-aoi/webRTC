<script lang="ts">
  import { socket } from "$lib/socketClient";
  import { onMount } from "svelte";

  // global
  let pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302',
      "credential": undefined,
    }]
  };
  let turnReady: boolean;
  let isChannelReady = false;
  let isStarted = false;
  let isInitiator = false;

  // svelte binder
  let chatValue: string;
  let roomValue: string;
  let messageList: any;

  let PeerConnection: RTCPeerConnection | null;
  

  // htmlContent
  let callButton: HTMLButtonElement;
  let startButton: HTMLButtonElement;
  let stopButton: HTMLButtonElement;
  let hangupButton: HTMLButtonElement;
  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let localVideo:  HTMLVideoElement;
  let remoteVideo:  HTMLVideoElement;
  let videoTrack: MediaStreamTrack;
  let remotevideoTrack: MediaStreamTrack;

  const mediaStreamConstraints = { 
    video: true,
  };

  $: videoWidth = 0;
  $: videoHeight = 0;
  $: remoteVideoWidth = 0;
  $: remoteVideoHeight = 0;
  $: room = "";

  onMount(() => {
    // HTML Setting

    // get DOM element
    callButton = document.getElementById('callButton') as HTMLButtonElement;
    startButton = document.getElementById('startButton') as HTMLButtonElement;
    stopButton = document.getElementById('stopButton') as HTMLButtonElement;
    hangupButton = document.getElementById('hangupButton') as HTMLButtonElement;

    // 初期状態の設定
    stopButton.disabled = true;
    callButton.disabled = true;
    hangupButton.disabled = true;

    localVideo =  document.getElementById("localVideo") as HTMLVideoElement;
    remoteVideo =  document.getElementById("remoteVideo") as HTMLVideoElement;
    messageList = document.getElementById('messages');

    // webSocket Setting

    // メッセージを受信した場合
    socket.on("chatMessage", (message) => {
      console.log(message);
      messageAddul(message);
    });

    // システムメッセ―ジを受信する
    socket.on("message", (message) => {
      console.log('["CLIENT LOG] Client received message:', message);
      if (message === "got user media")
      {
        maybeStart();
      } else if (message.type === "offer") {
        console.log('["CLIENT LOG] Get Offer');
        // ホストでない かつ 通信を行っていない
        if (!isInitiator && !isStarted)
        {
          console.log("[ANOTHER PEER LOG] Create peer connection");
          // Trackの準備を行う
          maybeStart();
        }
        PeerConnection!.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'answer' && isStarted) {
        console.log('["CLIENT LOG] Get Answer');
        PeerConnection!.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === "candidate" && isStarted) {
        let candidate = new RTCIceCandidate(
          {
            sdpMLineIndex: message.label,
            candidate: message.candidate
          });
        PeerConnection!.addIceCandidate(candidate);
      } else if (message == "bye" && isStarted) {
        handleRemoteHangup();
      }
    });
    
    socket.on('full', function(room) {
      console.log('Room ' + room + ' is full');
    });

    socket.on('created', function(room) {
      console.log('Created room ' + room);
      isInitiator = true;
    });

    socket.on('joined', function(room) {
      console.log('joined: ' + room);
      isChannelReady = true;
    });

    socket.on('join', function (room){
      console.log('Another peer made a request to join room ' + room);
      console.log('This peer is the initiator of room ' + room + '!');
      isChannelReady = true;
    });

    socket.on('log', function(array) {
      console.log.apply(console, array);
    });
  });

  function handleRemoteHangup()
  {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
  }

  function doAnswer()
  {
    console.log('Sending answer to peer.');
    PeerConnection!.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
    );
  }

  function onCreateSessionDescriptionError(error: Error) {
   trace('Failed to create session description: ' + error.toString());
  }

  function joinRoom()
  {
    socket.emit("create or join", roomValue);
    console.log("created or join room: " + roomValue);
    room = roomValue;
  }

  function maybeStart()
  {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    // roomに入っている + Mediaを確保している + 開始されていない場合 RTCPeerConnectionを作成する
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
      console.log('>>>>>> creating peer connection');
      createPeerConnection();
      PeerConnection!.addTrack(videoTrack);
      console.log(remoteStream);
      isStarted = true;
      console.log('isInitiator', isInitiator);
    // 自分がホスト(かける側)の場合
    if (isInitiator) {
      doCall();
    }
    }
  }

  function createPeerConnection()
  {
    try {
      PeerConnection = new RTCPeerConnection(undefined);
      PeerConnection.onicecandidate = handleIceCandidate;
      PeerConnection.ontrack = handleTrackEnvet;
    } catch (e: any) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
    return;
    }
  }

  function handleIceCandidate(event: RTCPeerConnectionIceEvent)
  {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      // よくわからない
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
  } else {
    console.log('End of candidates.');
  }
  }

  function stop() {
    isStarted = false;
    PeerConnection!.close();
    PeerConnection = null;
  }

  function doCall()
  {
    console.log("[CLIENT LOG] Sending offer to peer");
    PeerConnection!.createOffer()
      .then(setLocalAndSendMessage)
      .catch(handleCreateOfferError);
  }

  function setLocalAndSendMessage(sessionDescription: RTCSessionDescriptionInit)
  {
    PeerConnection!.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
  }

  function handleCreateOfferError(event: Error)
  {
    console.log('createOffer() error: ', event);
  }

  function handleTrackEnvet(event: RTCTrackEvent)
  {
    remotevideoTrack = event.track as MediaStreamTrack;
    if (event.streams && event.streams[0])
    {
      remoteStream = event.streams[0];
    } else {
      if (!remoteStream)
      {
        remoteStream = new MediaStream();
      }
    }
    remoteVideo.srcObject = remoteStream;
    remoteStream.addTrack(remotevideoTrack);
    console.log("add Track event");
  }
  

  function messageAddul(message: string)
  {
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
  }

  function gotLocalMediaStream(mediaStream: MediaStream)
  {
    localStream = mediaStream;
    if (localVideo) {
      localVideo.srcObject = localStream;  
      videoTrack = localStream.getVideoTracks()[0];
      getMediaTracksSetting(videoTrack);
      callButton.disabled = false;
      sendMessage("got user media");
    }
  }

  function sendMessage(message: any)
  {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
  }

  // mediaStreamの設定を取得する
  function getMediaTracksSetting(mediaTrack: MediaStreamTrack)
  {
    const currentSetting = mediaTrack.getSettings();
    console.log(currentSetting);
    videoHeight = currentSetting.height as number;
    videoWidth = currentSetting.width as number;
  }

  // クライアントにメッセージを送信
  function sendChatMessage() {
    console.log("button Click");
    const chatMessage = {
      "message" : chatValue,
      "room": room,
    }
    if(!chatMessage) return
    socket.emit("chatMessage", chatMessage) // Send the message
  }

  function startAction()
  {
    startButton.disabled = true;
    stopButton.disabled = false;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream).catch((e:Error) => {"getUserMedia() error" + e.name});
    trace('Requesting local stream.');
  }

  
  function callAction()
  {
    // 外部ネットワークからアクセスしたとき
    if (location.hostname !== 'localhost') {
      requestTurn(
      'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
      );
    }
  }

  function requestTurn(turnURI: string)
  {
    let turnExists = false;
    // STUNからネットワーク情報を取得する
    for (let i in pcConfig.iceServers) 
    {
      // turnサーバーが存在している場合break
      if(pcConfig.iceServers[i].urls.substring(0, 5) == "turn:")
      {
        turnExists = true;
        turnReady = true;
        break;
      }

      if(!turnExists)
      {
        console.log("Getting TURN server from.", turnURI);
        // リクエストのためのインスタンス作成
        let xhr = new XMLHttpRequest();
        // readyStateが変化するたびに発行するイベント設定
        xhr.onreadystatechange = () => {
          // 
          if (xhr.readyState == 4 && xhr.status == 200)
          {
            // レスポンスをパース
            let turnServer = JSON.parse(xhr.responseText);
            console.log("Got TURN Server :", turnServer);
            // Turn情報をpush
            pcConfig.iceServers.push({
              "urls" : "turn:" + turnServer.username + "@" + turnServer.server,
              "credential": turnServer.password
            });
            turnReady = true;
          }
        };
        // リクエストを作る (methos, URL, 非同期スイッチ)
        xhr.open("GET", turnURI, true);
        // リクエストを送る
        xhr.send();
      }
    }
  }

  function stopAction()
  {
    startButton.disabled = false;
    stopButton.disabled = true;
    callButton.disabled = true;
    videoTrack.stop(); // ビデオの停止
    localStream.removeTrack(videoTrack); // リソースの解放
    if (localVideo)
      localVideo.srcObject = null;
  }

  function hangupAction()
  {
    doCall();
  }

  function trace(text: String) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
  }

</script>


<style>
 /* * { margin: 0; padding-bottom: 3rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; } */

  /* #form { background: rgba(0, 0, 0, 0.15); padding: 0.25rem; position: fixed; bottom: 0; left: 0; right: 0; display: flex; height: 3rem; box-sizing: border-box; backdrop-filter: blur(10px); } */
  /* #input { border: none; padding: 0 1rem; flex-grow: 1; border-radius: 2rem; margin: 0.25rem; }
  #input:focus { outline: none; }
  #form > button { background: #333; border: none; padding: 0 1rem; margin: 0.25rem; border-radius: 3px; outline: none; color: #fff; }

  #messages { list-style-type: none; margin: 0; padding: 0; }
  #messages > li { padding: 0.5rem 1rem; } 
  #messages > li:nth-child(odd) { background: #efefef; } */
</style>

<div class = "flex ">
  <div class ="flex flex-col">
    <div>
      <!-- <p>Video size {videoWidth} x {videoHeight}</p> -->
      <video id="localVideo" autoplay playsinline class="bg-slate-300" style="width: 640px; height: 360px"></video>
    </div>  
    <div>
      <!-- <p>Remote Video size {remoteVideoWidth} x {remoteVideoHeight}</p> -->
      <video id="remoteVideo" autoplay playsinline class="bg-slate-300" style="width: 640px; height: 360px"></video>
    </div>
  </div>
  <div class="flex flex-col justify-between">
    <ul id="messages"></ul>
      <div>
        <div class = "flex justify-center gap-2 my-1">
          <button id="startButton" class="btn-s" on:click={startAction}>Start</button>  
          <button id="stopButton" class="btn-s" on:click={stopAction}>Stop</button>  
          <button id="callButton" class="btn-s" on:click={callAction}>Call</button>  
          <button id="hangupButton" class="btn-s" on:click={hangupAction}>Hang Up</button>  
        </div>
        <form id="form" action="" class="bg-slate-400 p-2 rounded flex gap-2">
          <input id="input" autocomplete="off" bind:value={chatValue} class ="rounded-full px-3"/><button on:click={sendChatMessage} class = "text-white">Send</button>
        </form>
      </div>
    </div>
  </div>  
<form id="form" action="" class="bg-slate-400 p-2 rounded flex gap-2">
  <input id="input" autocomplete="off" bind:value={roomValue} class ="rounded-full px-3"/><button on:click={joinRoom} class = "text-white">Join Room</button>
</form>
