<script lang="ts">
  import "$src/app.css"
  import { onMount } from 'svelte';

  // WebRTC
  let localPeerConnection: RTCPeerConnection;
  let remotePeerConnection: RTCPeerConnection;
  const offerOptions: RTCOfferOptions = {
    offerToReceiveVideo: true,
  }
  
  // browser 

  // button
  let startButton: HTMLButtonElement;
  let sendButton: HTMLButtonElement;
  let closeButton: HTMLButtonElement;

  // textArel
  let dataChannelReceive: HTMLTextAreaElement ;
  let dataChannelSend: HTMLTextAreaElement ;

  onMount(() => {
    trace("trece on: ");

    // DOMの取得
    startButton = document.getElementById('startButton') as HTMLButtonElement;
    sendButton = document.getElementById('sendButton') as HTMLButtonElement;
    closeButton = document.getElementById('closeButton') as HTMLButtonElement;

    // 初期状態の設定
    buttonStatusInit();

    dataChannelReceive =  document.getElementById("dataChannelReceive") as HTMLTextAreaElement ;
    dataChannelSend =  document.getElementById("dataChannelSend") as HTMLTextAreaElement ;
    
  });

  function buttonStatusInit()
  {
    startButton.disabled = false;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }

  function createConnection()
  {
    dataChannelSend.placeholder = "";
    let servers = undefined;
    trace("using SCTP based data channel");
    // Local Peer Setting
    localPeerConnection = new RTCPeerConnection(servers);
    let sendChannel = localPeerConnection.createDataChannel("sendDataChannel");
    // イベント追加
    localPeerConnection.onicecandidate = localIceCallback;
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
   
    // Remote Peer Setting
    remotePeerConnection = new RTCPeerConnection(servers);
    // イベント追加
    remotePeerConnection.onicecandidate = remoteIceCallback;

    localPeerConnection.createOffer().then(
      gotLocalDescription, onCreateSessionDescriptionError
    );

    startButton.disabled = true;
    closeButton.disabled = false;
    
  }

  function localIceCallback(event: RTCPeerConnectionIceEvent)
  {
    if (event.candidate)
    {
      remotePeerConnection.addIceCandidate(
        event.candidate
      ).then(
        onAddIceCandidateSucess,
        onAddIceCandidateError
      )
    }
  }

  function onSendChannelStateChange()
  {

  }

  function remoteIceCallback()
  {

  }

  function gotLocalDescription()
  {

  }

  function onCreateSessionDescriptionError(error: Error)
  {
    trace('Failed to create session description: ' + error.toString());
  }

  function onAddIceCandidateSucess()
  {
    
  }

  function onAddIceCandidateError()
  {

  }



  // // Logs changes to the connection state.
  // function handleConnectionChange(event: Event) {
  //   const peerConnection: RTCPeerConnection = event.target as RTCPeerConnection;
  //   console.log('ICE state change event: ', event);
  //   trace(`${getPeerName(peerConnection)} ICE state: ` + `${peerConnection.iceConnectionState}.`);
  // }

  // // media streaming setting // 

  // // videoにメディアストリームを設定する
  // function gotLocalMediaStream(mediaStream: MediaStream)
  // {
  //   localStream = mediaStream;
  //   if (localVideo) {
  //     localVideo.srcObject = localStream;  
  //     videoTrack = localStream.getVideoTracks()[0];
  //     getMediaTracksSetting(videoTrack);
  //     callButton.disabled = false;
  //   }
  // }

  // // mediaStreamの設定を取得する
  // function getMediaTracksSetting(mediaTrack: MediaStreamTrack)
  // {
  //   const currentSetting = mediaTrack.getSettings();
  //   console.log(currentSetting);
  //   videoHeight = currentSetting.height as number;
  //   videoWidth = currentSetting.width as number;
  // }

  // // エラーハンドリング
  // function handleLocalMediaStreamError(error: Error) 
  // {
  //   console.log("navigator.getUserMedia error: ", error);
  // }

  // // webRTC setting //

  // function handleConnection(event: RTCPeerConnectionIceEvent) 
  // {
  //   const peerConnection = event.target as RTCPeerConnection;
  //   const iceCandidate = event.candidate;

  //   if (iceCandidate)
  //   {
  //     const newIceCandidate = new RTCIceCandidate(iceCandidate);
  //     const otherPeer = getOtherPeer(peerConnection);

  //     // リモートピアの設定を行う
  //     otherPeer.addIceCandidate(newIceCandidate)
  //       .then(() => {
  //         handleConnectionSuccess(peerConnection);
  //       }).catch((error) => {
  //         handleConnectionFailure(peerConnection, error);
  //       });
  //   }

  //   trace(`${getPeerName(peerConnection)} ICE candidate:\n` + `${event.candidate}.`);
  // }

  // function createdOffer(description: RTCSessionDescriptionInit)
  // {
  //   trace(`Offer from localPeerConnection:\n${description.sdp}`);

  //   trace('localPeerConnection setLocalDescription start.');
  //   // ローカルの送信設定
  //   localPeerConnection.setLocalDescription(description)
  //     .then(() => {
  //       setLocalDescriptionSuccess(localPeerConnection);
  //     }).catch(setSessionDescriptionError)

  //   // リモートの受信設定
  //   remotePeerConnection.setRemoteDescription(description)
  //     .then(() => {
  //       setRemoteDescriptionSuccess(remotePeerConnection);
  //     }).catch(setSessionDescriptionError);

  //   // Anserの作成
  //   trace('remotePeerConnection createAnswer start.');
  //   remotePeerConnection.createAnswer()
  //     .then(createdAnswer)
  //     .catch(setSessionDescriptionError);

  // }

  // function createdAnswer(description: RTCSessionDescriptionInit)
  // {
  //   trace(`Answer from remotePeerConnection:\n${description.sdp}.`);

  //   trace('remotePeerConnection setLocalDescription start.');
  //   remotePeerConnection.setLocalDescription(description)
  //     .then(() => {
  //       setLocalDescriptionSuccess(remotePeerConnection);
  //     }).catch(setSessionDescriptionError);

  //   trace('localPeerConnection setRemoteDescription start.');
  //   localPeerConnection.setRemoteDescription(description)
  //     .then(() => {
  //       setRemoteDescriptionSuccess(localPeerConnection);
  //     }).catch(setSessionDescriptionError);
  // }

  // // error traces
  // function handleConnectionFailure(peerConnection: RTCPeerConnection, error: Error) {
  //   trace(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+ `${error.toString()}.`);
  // }

  // // iceCandidate handler
  // function handleConnectionSuccess(peerConnection: RTCPeerConnection)
  // {
  //   trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
  // }

  // // create offer handler
  // function setSessionDescriptionError(error: Error)
  // {
  //   trace(`Failed to create session description: ${error.toString()}.`);
  // }

  // // Logs success when setting session description.
  // function setDescriptionSuccess(peerConnection: RTCPeerConnection, functionName: string) {
  //   const peerName = getPeerName(peerConnection);
  //   trace(`${peerName} ${functionName} complete.`);
  // }

  // // Logs success when localDescription is set.
  // function setLocalDescriptionSuccess(peerConnection: RTCPeerConnection) {
  //   setDescriptionSuccess(peerConnection, 'setLocalDescription');
  // }

  // // Logs success when remoteDescription is set.
  // function setRemoteDescriptionSuccess(peerConnection: RTCPeerConnection) {
  //   setDescriptionSuccess(peerConnection, 'setRemoteDescription');
  // }

  // function gotRemoteMediaStream(event: RTCTrackEvent) {
  //   remotemediaTrack = event.track as MediaStreamTrack;
  //   remoteStream = new MediaStream();
  //   remoteVideo.srcObject = remoteStream;
  //   remoteStream.addTrack(remotemediaTrack)
  //   trace('Remote peer connection received remote stream.');
  // }

  // function getRemoteVideoSetting()
  // {
  //   if (remotemediaTrack == undefined) return
  //   const remoteVideoSetting = remotemediaTrack.getSettings();
  //   remoteVideoHeight = remoteVideoSetting.height as number;
  //   remoteVideoWidth = remoteVideoSetting.width as number;
  // }

  // setInterval(getRemoteVideoSetting, 1000);


  // // 逆のpeerConnectionを返す
  // function getPeerName(peerConnection: RTCPeerConnection)
  // {
  //   return (peerConnection === localPeerConnection) ? "localPeerConnection" : "remotePeerConnection";
  // }

  // function getOtherPeer(peerConnection: RTCPeerConnection): RTCPeerConnection
  // {
  //   return (peerConnection === localPeerConnection) ? remotePeerConnection : localPeerConnection;
  // }

  // tools
  function trace(text: String) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
  }

  // function startAction()
  // {
  //   startButton.disabled = true;
  //   stopButton.disabled = false;
  //   navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
  //     .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
  //   trace('Requesting local stream.');
  // }

  // // メディアの停止処理
  // function stopAction()
  // {
  //   startButton.disabled = false;
  //   stopButton.disabled = true;
  //   callButton.disabled = true;
  //   videoTrack.stop(); // ビデオの停止
  //   localStream.removeTrack(videoTrack); // リソースの解放
  //   if (localVideo)
  //     localVideo.srcObject = null;
  // }

  // function callAction()
  // {
  //   startButton.disabled = true;
  //   hangupButton.disabled = false;

  //   trace("starting call");
  //   // メディアの取得
  //   const videoTracks = localStream.getVideoTracks();
  //   const audioTracks = localStream.getAudioTracks();

  //   // ひとつのビデオ・音声のみ
  //   if (videoTracks.length > 0) {
  //    trace(`Using video device: ${videoTracks[0].label}.`);
  //   }
  //   if (audioTracks.length > 0) {
  //     trace(`Using audio device: ${audioTracks[0].label}.`);
  //   }
  //   const servers = undefined;  // Allows for RTC server configuration.

  //   // Create peer connections and add behavior.
  //   localPeerConnection = new RTCPeerConnection(servers);
  //   trace('Created local peer connection object localPeerConnection.');

  //   localPeerConnection.addEventListener('icecandidate', handleConnection);
  //   localPeerConnection.addEventListener(
  //     'iceconnectionstatechange', handleConnectionChange);

  //   remotePeerConnection = new RTCPeerConnection(servers);
  //   trace('Created remote peer connection object remotePeerConnection.');

  //   remotePeerConnection.addEventListener('icecandidate', handleConnection);
  //   remotePeerConnection.addEventListener(
  //     'iceconnectionstatechange', handleConnectionChange);
  //   remotePeerConnection.addEventListener('track', gotRemoteMediaStream);

  //   // Add local stream to connection and create offer to connect.
  //   localPeerConnection.addTrack(videoTrack);
  //   trace('Added local stream to localPeerConnection.');

  //   trace('localPeerConnection createOffer start.');
  //   localPeerConnection.createOffer(offerOptions)
  //     .then(createdOffer).catch(setSessionDescriptionError);
  // }

  function terminated() {
    localPeerConnection.close();
    remotePeerConnection.close();
    buttonStatusInit();
  }

</script>

<style>
  video {
    width: 100%;
  }

</style>

<h1>Realtime communication with WebRTC</h1>

<textarea id="dataChannelSend" disabled
    placeholder="Press Start, enter some text, then press Send."></textarea>
<textarea id="dataChannelReceive" disabled></textarea>

<div id="buttons">
  <button id="startButton" class="btn">Start</button>
  <button id="sendButton" class="btn">Send</button>
  <button id="closeButton" class="btn">Stop</button>
</div>

