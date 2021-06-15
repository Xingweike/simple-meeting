// var localVideo = document.getElementById('localVideo');
// var remoteVideo = document.getElementById('remoteVideo');

function muteLocalAudio(checkbox) {
  // mutes local audio so stream no longer picks up local audio
  console.log("toggle mute local audio");
  userStream.getAudioTracks()[0].enabled = !(userStream.getAudioTracks()[0].enabled);
}

function muteLocalVideo(checkbox) {
  console.log("toggle mute local audio");
  userStream.getVideoTracks()[0].enabled = !(userStream.getVideoTracks()[0].enabled);
}

function muteRemoteAudio(checkbox) {
  // mutes remote audio using video's muted tag

  var parent_id = checkbox.parentNode.parentNode.id;
  let children = document.getElementById(parent_id).children;
  children[0].muted = ! (children[0].muted);

  //document.getElementById('remoteVideo').muted = ! (document.getElementById('remoteVideo').muted);
}

function remoteVolume() {
  // new volume between 0 (softest) and 1 (loudest)
  var parent_id = this.parentNode.parentNode.id;
  let children = document.getElementById(parent_id).children;
  console.log(children);
  children[1].volume = this.value;
  console.log(this.value);

  // document.getElementById('remoteVideo').volume = slider.value;
}


function endMeeting() {
  // send message to server
  socket.emit("endRoom" , roomID);

  // end the meeting, disconnect everyone\
  console.log("ending room, disconnecting everyone:");
  for (var k in connections) {
    console.log("disconnecting " + k);
    disconnect(connections[k]);
  }

  localVideo.srcObject = null;
  socket.disconnect();
  peer.disconnect();

  // redirect to index.html
  console.log("redirecting to home...");
  window.location.href = '/';

  alert("meeting has ended");
}




