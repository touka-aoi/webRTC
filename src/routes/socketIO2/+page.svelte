<script lang="ts">
  import { socket } from "$lib/socketClient";
  import { onMount } from "svelte";

  // htmlContent
  let callButton: HTMLButtonElement;
  let startButton: HTMLButtonElement;
  let stopButton: HTMLButtonElement;
  let hangupButton: HTMLButtonElement;
  let localVideo:  HTMLVideoElement;
  let remoteVideo:  HTMLVideoElement;
  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let videoTrack: MediaStreamTrack;
  let remotevideoTrack: MediaStreamTrack;  

  // media info
  const mediaStreamConstraints = { 
   video: true,
  };

  // svelte binder
  let chatValue: string;
  let roomValue: string;
  let messageList: any;
  $: videoWidth = 0;
  $: videoHeight = 0;

  // query value
  let room: string;

  // webRTC flag
  let PeerConnection: RTCPeerConnection | null;
  let isChannelReady = false;
  let isStarted = false;
  let isInitiator = false;
  let sender: RTCRtpSender;

  onMount(() => {
    // setEvent
    
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


    socket.on("chatMessage", (message: string) => {
      let li = document.createElement("li");
      li.appendChild(document.createTextNode(message));
      messageList.appendChild(li);
    });

    socket.on('created', function(room, socketID) {
      console.log("[LOG]: Created room: ", room,  " from ", socketID );
    });

    // 自分がroomに入った子を知らせる
    socket.on('joined', function(room) {
      console.log("[LOG-o]: joined room ", room);
      isChannelReady = true;
    });
    
    // ルームに人が入れば isReadyになる
    socket.on('join', function (room, socketID){
      console.log("[LOG] : Joined room: ", room, " from ", socketID);
      isChannelReady = true;
    });

    // System Message 
    socket.on("message", (message, room) => {
      if(room) {
        // WebRTC Offerを受けた時
        console.log(message, room);
        if (message.type === "offer") {
          // 受信側時
          if (!isInitiator && !isStarted)
          {
            // PeerConnection作成
            maybeStart();
          }
          PeerConnection!.setRemoteDescription(message);
          doAnswer();
        } 
        // WebRTC-Answerを受け取った時
        else if (message.type === 'answer' && isStarted) {
          // console.log(message, room);
          PeerConnection!.setRemoteDescription(new RTCSessionDescription(message));
          // DebugLog("Set remote description");
        } 
        // IceCandidateを受け取った時
        else if (message.type === "candidate" && isStarted) {
          // DebugLog("Get IceCandidate");
          let candidate = new RTCIceCandidate(
            {
              sdpMLineIndex: message.label,
              candidate: message.candidate
            });
          PeerConnection!.addIceCandidate(candidate);
        } 
      }
      // terminated
      else if (message == "bye" && isStarted) {
        // handleRemoteHangup();
      }
    });
  });

  function doAnswer()
  {
    // console.log('Sending answer to peer.');
    PeerConnection!.createAnswer()
      .then(setLocalAndSendMessage)
      .catch((error: Error) => {console.log('Failed to create session description: ' + error.toString());});
  }

  function maybeStart()
  {
    // フラグチェック
    console.log('>>>>>>> maybeStart() ', "isStarted: ", isStarted, "localStream :", localStream, "isChannelReady: ",  isChannelReady);
    // roomに入っている + Mediaを確保している + 開始されていない場合 RTCPeerConnectionを作成する
    if (true) {
      console.log('>>>>>> creating peer connection');
      createPeerConnection();
      sender = PeerConnection!.addTrack(videoTrack);
      isStarted = true;
      // 自分がホスト(かける側)の場合
      if (false) {
        doCall();
      }
    }
    isInitiator = false;
  }

  function doCall()
  {
    PeerConnection!.createOffer()
      .then(setLocalAndSendMessage)
      .catch((event) => {console.log('createOffer() error: ', event);});
  }

  function setLocalAndSendMessage(sessionDescription: RTCSessionDescriptionInit)
  {
    PeerConnection!.setLocalDescription(sessionDescription);
    sendMessage(sessionDescription);
  }

  function createPeerConnection()
  {
    try {
      PeerConnection = new RTCPeerConnection(undefined);
      PeerConnection.onicecandidate = handleIceCandidate;
      PeerConnection.ontrack = handleTrackEnvet;
      PeerConnection.onnegotiationneeded = handleNegotiation;
    } catch (e: any) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
    return;
    }
  }

  function handleIceCandidate(event: RTCPeerConnectionIceEvent)
  {
    // console.log('Get icecandidate event: ', event);
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

  function handleNegotiation()
  {
    console.log("Re egotiation start");
    PeerConnection!.createOffer()
      .then(setLocalAndSendMessage)
      .catch((event) => {console.log('createOffer() error: ', event);});
  }

  function sendMessage(message: any)
  {
    socket.emit('message', message, room);
  }

  function handleTrackEnvet(event: RTCTrackEvent)
  {
    console.log("handle Track Event");
    remotevideoTrack = event.track as MediaStreamTrack;
    remotevideoTrack.onmute = () => {
      remotevideoTrack.stop();
      remoteStream.removeTrack(remotevideoTrack);
      remoteVideo.srcObject = null;

    };
    // // リモートの受け取り準備
    remoteStream = new MediaStream();
    remoteStream.addTrack(remotevideoTrack);
    remoteVideo.srcObject = remoteStream;
    // リモートの受け取り準備完了
  }

  function startAction() {
    startButton.disabled = true;
    stopButton.disabled = false;
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
      .then(gotLocalMediaStream).catch((e:Error) => {"getUserMedia() error" + e.name});
   
  }

  function gotLocalMediaStream(mediaStream: MediaStream)
  {
    localStream = mediaStream;
    localVideo.srcObject = localStream;  
    // TODO: カメラを選択式に
    videoTrack = localStream.getVideoTracks()[0];
    getMediaTracksSetting(videoTrack);
    callButton.disabled = false;
    if (PeerConnection)
    {
      console.log(videoTrack);
      sender = PeerConnection.addTrack(videoTrack);
    }
  }

  // mediaStreamの設定を取得する
  function getMediaTracksSetting(mediaTrack: MediaStreamTrack)
  {
    const currentSetting = mediaTrack.getSettings();
    videoHeight = currentSetting.height as number;
    videoWidth = currentSetting.width as number;
  }

  function stopAction() {
    // ローカル接続の解除
    if (videoTrack)
    {
      videoTrack.stop(); // ビデオの停止
      localStream.removeTrack(videoTrack); // リソースの解放
      PeerConnection?.removeTrack(sender);
    }
    localVideo.srcObject = null;
    // ボタンの初期化
    startButton.disabled = false;
    stopButton.disabled = true;
    callButton.disabled = true; 
    videoWidth = 0;
    videoHeight = 0;

  }
  function callAction() {
    isInitiator = true;
    maybeStart();
    hangupButton.disabled = false;
    callButton.disabled = true;
  }
  
  function hangupAction() {
    PeerConnection!.close();
    hangupButton.disabled = true;
    callButton.disabled = false;
    if (stopButton.disabled == true && startButton.disabled == true)  
    {
      startButton.disabled = false;
      callButton.disabled = true;
    }

  }

  function sendChatMessage() {
    // socket.emit("message", "test1", "");
    // isInitiator = true;
    // maybeStart()
    socket.emit("chatMessage", chatValue, room);
  }

  function joinRoom() {
    if (roomValue == undefined) {
      messageAddul("room名を入力してください");
      return
    }
    socket.emit("create or join", roomValue);
    room = roomValue;
  }
  
  function messageAddul(message: string)
  {
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(message));
    messageList.appendChild(li);
  }

</script>



<div class = "flex ">
  <div class ="flex flex-col">
    <div>
      <p>Video size {videoWidth} x {videoHeight}</p>
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
  <p>{room ? room : ""}</p>
</form>
