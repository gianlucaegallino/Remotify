//Creates a new spotify sdk player object

window.onSpotifyWebPlaybackSDKReady = () => {
  const token =
    "BQA5jt4Sr1hoh_lsPp4klpHgrYKNjE--HHQjFwWKtJn0ZSt2xxhvGrDOvrq9JH9ElQosWXHZN1GfvbydcMem_m8ejoI-VmYdom91IOvbvnfCybX0cnofdzsSBVTJhSZB7tNYPBi06CxdUdA6xrrdV4ZbVJGLiiQ6wQYmyiOF4G_WdWIzdHYPDMa258dVXdQ3-wFe_PmVz0g";
  const player = new Spotify.Player({
    name: "Remotify Player",
    getOAuthToken: (cb) => {
      cb(token);
    },
    volume: 0.5,
  });

  //Status logging
  // Ready
  player.addListener("ready", ({ device_id }) => {
    console.log("Ready with Device ID", device_id);
  });

  // Not Ready
  player.addListener("not_ready", ({ device_id }) => {
    console.log("Device ID has gone offline", device_id);
  });

  // Error logging listeners

  player.addListener("initialization_error", ({ message }) => {
    console.error(message);
  });

  player.addListener("authentication_error", ({ message }) => {
    console.error(message);
  });

  player.addListener("account_error", ({ message }) => {
    console.error(message);
  });

  // Button listeners

  document.getElementById("togglePlay").onclick = function () {
    player.togglePlay();
  };

  document.getElementById("previousTrack").onclick = function () {
    player.previousTrack();
  };

  document.getElementById("nextTrack").onclick = function () {
    player.nextTrack();
  };

  // Connection state listeners

  

  player.addListener(
    "player_state_changed",
    ({ track_window: { current_track } }) => {
      let returnedplaying = `Currently Playing: ${current_track.name}`
      let returnedartists = `Artists: ${(() => {
        artists = []
        for (const artist of current_track.artists) {
          artists.push(artist.name)
        }
        return artists.join(", ");
      })()}`
      document.getElementById("currentlyPlaying").innerHTML = returnedplaying
      document.getElementById("artists").innerHTML = returnedartists
    }
  );

  // connects the player
  player.connect();
};
