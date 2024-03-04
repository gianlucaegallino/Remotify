window.onSpotifyWebPlaybackSDKReady = () => {
  const token = 'BQCBhgONYE4b9loWhJ6rDJbmJzG6jF6ZtCuZfnlcfIgm26c6ku8vi7LcqsfpTqzwfpnEyTMOlk1E9VQTdiSuWIjFhjpzhopiroq2Gfswsj3szq5vdWuupHsDQ3S31atXB-krmARKiGJQnzYe3xsz7H8VqOSgQXcMPse9uDemD6ncc-ZQGzDhZViyzT0WQ2O1qff_v0KCRrU  ';
  const player = new Spotify.Player({
      name: 'Web Playback SDK Quick Start Player',
      getOAuthToken: cb => { cb(token); },
      volume: 0.5
  });

  // Ready
  player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
  });

  player.addListener('initialization_error', ({ message }) => {
      console.error(message);
  });

  player.addListener('authentication_error', ({ message }) => {
      console.error(message);
  });

  player.addListener('account_error', ({ message }) => {
      console.error(message);
  });

  document.getElementById('togglePlay').onclick = function() {
    player.togglePlay();
  };

  player.connect();
}