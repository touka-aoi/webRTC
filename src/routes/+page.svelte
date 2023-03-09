<script lang="ts">
  import { onMount } from 'svelte';
	import { loop } from 'svelte/internal';

  // global 
  const mediaStreamConstraints = { video: true,};
  // WebRTC
  let localPeerConnection: RTCPeerConnection;
  let remotePeerConnection: RTCPeerConnection;
  
  // browser 
  let callButton: HTMLButtonElement;
  let localStream: MediaStream;
  let remoteStream: MediaStream;
  let localVideo: null | HTMLVideoElement;
  let remoteVideo: null | HTMLVideoElement;

  $: videoWidth = 0;
  $: videoHeight = 0;
  
  onMount(() => {
    trace("trece on: ");
    // DOMの取得
    callButton = document.getElementById('callButton') as HTMLButtonElement;
    localVideo =  document.getElementById("localVideo") as HTMLVideoElement;
    remoteVideo =  document.getElementById("remoteVideo") as HTMLVideoElement;

    // videoドライバーの取得
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);

    // webRTC
    localPeerConnection = new RTCPeerConnection();
    localPeerConnection.addEventListener("icecandidate", handleConnection);
    //localPeerConnection.addEventListener("connectionstatechange", handleConnectionChange);

    remotePeerConnection = new RTCPeerConnection();
  });

  // videoにメディアストリームを設定する
  function gotLocalMediaStream(mediaStream: MediaStream)
  {
    localStream = mediaStream;
    if (localVideo) {
      localVideo.srcObject = localStream;  
      let videoTrack = localStream.getVideoTracks()[0];
      getMediaTracksSetting(videoTrack);
      callButton.disabled = false;
    }
  }

  // mediaStreamの設定を取得する
  function getMediaTracksSetting(mediaTrack: MediaStreamTrack)
  {
    const currentSetting = mediaTrack.getSettings();
    videoHeight = currentSetting.height as number;
    videoWidth = currentSetting.width as number;
  }

  // エラーハンドリング
  function handleLocalMediaStreamError(error: Error) 
  {
    console.log("navigator.getUserMedia error: ", error);
  }

  // webRTC

  function handleConnection(event: RTCPeerConnectionIceEvent) 
  {
    const peerConnection = event.target as RTCPeerConnection;
    const iceCandidate = event.candidate;

    if (iceCandidate)
    {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      const otherPeer = getOtherPeer(peerConnection);

      otherPeer.addIceCandidate(newIceCandidate)
        .then(() => {
          handleConnectionSuccess(peerConnection);
        }).catch((error) => {
          handleConnectionFailure(peerConnection, error);
        });
    }

    trace(`${getPeerName(peerConnection)} ICE candidate:\n` + `${event.candidate}.`);
  }

  // error traces
  function handleConnectionFailure(peerConnection: RTCPeerConnection, error: Error) {
    trace(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n`+ `${error.toString()}.`);
  }

  // 逆のpeerConnectionを返す
  function getPeerName(peerConnection: RTCPeerConnection)
  {
    return (peerConnection === localPeerConnection) ? "localPeerConnection" : "remotePeerConnection";
  }

  function getOtherPeer(peerConnection: RTCPeerConnection): RTCPeerConnection
  {
    return (peerConnection === localPeerConnection) ? remotePeerConnection : localPeerConnection;
  }

  // tools
  function trace(text: String) {
    text = text.trim();
    const now = (window.performance.now() / 1000).toFixed(3);

    console.log(now, text);
}

</script>

<style>
  video {
    filter: hue-rotate(180deg) saturate(200%);
    width: 100%;
  }

</style>

<h1>Realtime communication with WebRTC</h1>

<p>Video size {videoWidth} x {videoHeight}</p>
<video id="localVideo" autoplay playsinline></video>
<video id="remoteVideo" autoplay playsinline></video>

<div>
  <button id="startButton">Strat</button>  
  <button id="callButton">Call</button>  
  <button id="hangupButton">Hang Up</button>  
</div>


