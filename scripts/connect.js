//Test current token for validity. Else, generates a new token. 

//Creates a new spotify sdk player object

window.onSpotifyWebPlaybackSDKReady = () => {
  //const token = localstorage.getItem("");
  const token = 'BQDNoyVOUdLN1sw_S8Pa_irNLxQaAb7OCDdP8o-J4XWEyL2C8jAyxPDxwuvoLNdmEs9g6JsQmymy9hHGog2kWNIpMy9FeoIBIrh4nfC_PL8QVP0Wr0r0ZxDsD4yoTqKa22gQ1XUgx3mkJFYCUzd8Wjnp288uJBpeBhhXgL2Mnw_A25VcNt9P5QHaRjl1tKi6BMx3Wazex1I';
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
      let returnedcover = current_track.album.images[0].url;
      document.getElementById("currentlyPlaying").innerHTML = returnedplaying;
      document.getElementById("artists").innerHTML = returnedartists;
      document.getElementById("albumCover").src = returnedcover;
      console.log(current_track);
    }
  );

  // connects the player
  player.connect();

  //makes an api call for the album image, not provided by the sdk. 
};
