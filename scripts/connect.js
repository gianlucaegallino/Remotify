//Creates a new spotify sdk player object

window.onSpotifyWebPlaybackSDKReady = () => {
  const token =
    "BQAGl8Ie_edAWcpp1St42Eg1ocxifCdTJC54WPkRximoLur1gxOQpuXsXL-8022zEBzygNIRD-XI_eMGn3iGqo-XREjcfl_FYFv8pxG1fNcYD9ciMQGXv0Vupw2mJ2OWM_lw-j2V6GqzSpCdwpVVRIz8ch67G7gsafAhdhIY0wb0TBQ8zzBhATVTxnXV4N6rtZ_hpAIXSbA";
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
