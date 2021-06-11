// Client
const socket = io('/');
const peer = new Peer(); // Create a new peer for this user

// User MediaStream
var userStream;
var roomID;

// HTML stuff
var videoGrid = document.getElementById('videoDiv');
var localVideo = document.getElementById('localVideo');
// Note: this app used to only support two person meetings, which uses 'remoteVideo'
// var remoteVideo = document.getElementById('remoteVideo');
localVideo.muted = true; // mute own audio so no feedback

var connections = {};
const callList = [];


// NOTE: go to settings and add treat site as secure in chrome for video!!!!

// PEER.JS and WebRTC -----------------------------------
const constraints = {
  'video': true,
  'audio': true
}

// Get user's peer id when created
peer.on('open', (id)=>{
  roomID = window.location.pathname.substring(1);
  console.log("new connection: " + id);
  console.log("new room: " + roomID);

  document.getElementById('roomid').innerHTML = "roomId: " + roomID;
  document.getElementById('userid').innerHTML = "userId: " + id;

  // Get Audio and Video using WebRTC 
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        userStream = stream;
        localVideo.srcObject = stream;
        socket.emit("joinRoom" , id , roomID);
    })
    .catch(error => {
        console.log('Error accessing media devices.', error);
        alert(error.message)
    });

})

// Answer Video/audio calls
peer.on('call', (call)=>{
  // timing issue where recieving call before mediastream is set up
  call.answer(userStream); 
  callFunctions(call);
});

// Listen on the error event in case the connection fails.
peer.on('error', (err)=>{
  console.log("uh oh this shouldn't happen...");
  alert(err);
});

// SOCKET.IO -----------------------------------

// Get userJoined from server side
socket.on('userJoined', (id, room)=>{
  console.log("client detected new user: " + id);
  // Call Video/audio calls
  let call = peer.call(id, userStream);
  console.log("socket userJoined: callfunctions");
  callFunctions(call);
  connections[id] = call;
});

socket.on('userDisconnect' , (id)=>{
  console.log("user disconnected: " + id);
  // id not defined
  disconnect(connections[id]);
});

socket.on('endRoom' , ()=>{
  endMeeting();
});

function callFunctions(call) {
  console.log(call.peer);
  let tempid = call.peer;
  call.on('stream', (stream)=>{
    // `stream` is the MediaStream of the remote peer.
    // Here you'd add it to an HTML video/canvas element.

    // issue: stream is being returned twice, see https://github.com/peers/peerjs/issues/609
    if(!callList[call.peer]){
      //remoteVideo.srcObject = stream;
      appendVideoToGrid(tempid, stream); 
      callList[call.peer] = call;
    }

  });

  call.on('error' , (err)=>{
    alert(err);
    // remoteVideo.srcObject = null;
    removeVideoFromGrid(tempid);
    disconnect(connections[tempid]);
  });

  call.on('close' , ()=>{
    //remoteVideo.srcObject = null;
    removeVideoFromGrid(tempid);
    disconnect(connections[tempid]);
  });
}

function disconnect(call) {
  if(call){
    call.close();
  }
}

function appendVideoToGrid(id, stream) {

  console.log("appending video to grid: " + id);

  // surrounding div
  let parentDiv = document.createElement('div');
  parentDiv.id = id;

  // add remote information
  var para = document.createElement("p");              
  para.innerText = "remoteId: " + id;          
  parentDiv.append(para);            

  // video 
  let video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  parentDiv.append(video);

  // div for mute audio
  // let muteDiv = document.createElement('div');
  // let inputCheck = document.createElement("input");
  // inputCheck.type = "checkbox";
  // inputCheck.type = "muteRemoteAudio";
  // inputCheck.onclick = muteRemoteAudio; // 
  // let labelCheck = document.createElement("label");
  // labelCheck.for = "muteRemoteAudio";
  // labelCheck.innerHTML = "muteRemoteAudio";
  // muteDiv.append(inputCheck);
  // muteDiv.append(labelCheck);
  // parentDiv.append(muteDiv);

  // div for volume changer
  let volumeDiv = document.createElement('div');
  let inputSlide = document.createElement("input");
  inputSlide.type = "range";
  inputSlide.id = "volume";
  inputSlide.min = "0";
  inputSlide.max = "1";
  inputSlide.step = "0.1";
  inputSlide.value = "0.5";

  inputSlide.oninput = remoteVolume; // 
  inputSlide.onchange = remoteVolume; // 
  let labelSlide = document.createElement("label");
  labelSlide.for = "volume";
  labelSlide.innerHTML = "remoteVolume";
  volumeDiv.append(inputSlide);
  volumeDiv.append(labelSlide);
  parentDiv.append(volumeDiv);

  // append to videoGrid
  videoGrid.append(parentDiv);
}

function removeVideoFromGrid(id) {
  // delete everything inside toRemove div
  let toRemove = document.getElementById(id);
  toRemove.remove();
}
/*
<!-- Example of one remote video -->

<div id="4f1d2465-355c-4bc1-9053-38676c0bdd30">
  <video id="remoteVideo" autoplay></video>
  <div>
    <input type="checkbox" id="muteRemoteAudio" onclick="muteRemoteAudio(this)">
    <label for="muteRemoteAudio">muteRemoteAudio</label>
  </div>

  <div>
    <input type="range" id="volume" name="volume"
           min="0" max="1" value="0.5" step="0.1" 
           oninput="remoteVolume(this)" onchange="remoteVolume(this)">
    <label for="volume">remoteVolume</label>
  </div>
</div>
*/

