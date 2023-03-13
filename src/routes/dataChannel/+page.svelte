<script lang="ts">
  import "$src/app.css"
  import { onMount } from 'svelte';
	import { set_current_component } from "svelte/internal";

  // WebRTC
  let localPeerConnection: RTCPeerConnection;
  let remotePeerConnection: RTCPeerConnection;
  let sendChannel: RTCDataChannel;
  let receiveChannel: RTCDataChannel;
  

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

    startButton.onclick = createConnection;
    
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
    sendChannel = localPeerConnection.createDataChannel("sendDataChannel");
    // イベント追加
    localPeerConnection.onicecandidate = localIceCallback;
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onclose = onSendChannelStateChange;
   
    // Remote Peer Setting
    remotePeerConnection = new RTCPeerConnection(servers);
    // イベント追加
    remotePeerConnection.onicecandidate = remoteIceCallback;
    remotePeerConnection.ondatachannel = receiveChannelCallback;

    trace('localPeerConnection create Offer');
    localPeerConnection.createOffer().then(
      gotLocalDescription, onCreateSessionDescriptionError
    );

    startButton.disabled = true;
    closeButton.disabled = false;
    
  }

  function localIceCallback(event: RTCPeerConnectionIceEvent)
  {
    trace('local ice callback');
    if (event.candidate)
    {
      // ここなんでLocalやのにRemoteなん？
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
    let readyState = sendChannel.readyState;
    trace('Send channel state is: ' + readyState);
    // 双方向通信の準備が完了
    if (readyState == "open")
    { 
      // 書き込みを許可
      dataChannelSend.disabled = false;
      dataChannelSend.focus();
      // 送信ボタン・終了ボタンをオンに
      sendButton.disabled = false;
      closeButton.disabled = false;
    } else {
      dataChannelSend.disabled = true;
      sendButton.disabled = true;
      closeButton.disabled = true;
    }
  }

  function remoteIceCallback(event: RTCPeerConnectionIceEvent)
  {
    trace('remote ice callback');
    if (event.candidate)
    {
      localPeerConnection.addIceCandidate(
        event.candidate
      ).then(
        onAddIceCandidateSucess,
        onAddIceCandidateError
      )
    }
  }

  function gotLocalDescription(desc: RTCSessionDescriptionInit)
  {
    localPeerConnection.setLocalDescription(desc);
    trace('Offer from localConnection \n' + desc.sdp);
    remotePeerConnection.setRemoteDescription(desc);
    remotePeerConnection.createAnswer().then(
      getRemoteDescription, onCreateSessionDescriptionError
    );
  }

  function getRemoteDescription(desc: RTCSessionDescriptionInit)
  {
    remotePeerConnection.setLocalDescription(desc);
    trace('Answer from remoteConnection \n' + desc.sdp);
    localPeerConnection.setRemoteDescription(desc);
  }

  function receiveChannelCallback(event: RTCDataChannelEvent)
  {
    trace('Receive Channel Callback');
    // チャンネルの接続
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
  }

  function onReceiveMessageCallback(event: MessageEvent) {
    trace('Received Message');
    dataChannelReceive.value = event.data;
  }

  function onReceiveChannelStateChange()
  {
    var readyState = receiveChannel.readyState;
    trace('Receive channel state is: ' + readyState);
  }

  function onCreateSessionDescriptionError(error: Error)
  {
    trace('Failed to create session description: ' + error.toString());
  }

  function onAddIceCandidateSucess()
  {
    trace('AddIceCandidate success.');
  }

  function onAddIceCandidateError(error: Error)
  {
    trace('Failed to add Ice Candidate: ' + error.toString());
  }


  // tools
  function trace(text: String) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
  }

  function terminated() {
    localPeerConnection.close();
    remotePeerConnection.close();
    buttonStatusInit();
  }

</script>

<style>
  textarea {
    width: 200px;
    height: 50px;
  }
  h1 {
    font-size: 30px; font-weight: 300; line-height: 70px; text-transform: uppercase;
  }
</style>

<h1>Realtime communication with WebRTC</h1>

<textarea id="dataChannelSend" disabled placeholder="Press Start, enter some text, then press Send."></textarea>
<textarea id="dataChannelReceive" disabled></textarea>

<div id="buttons">
  <button id="startButton" class="btn">Start</button>
  <button id="sendButton" class="btn">Send</button>
  <button id="closeButton" class="btn">Stop</button>
</div>

