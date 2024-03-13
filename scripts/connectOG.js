//Auth script, that locally stores token and refresh tokens.
//built with code specified in (https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
document.getElementById("getAuth").onclick = async function () {
  const generateRandomString = (length) => {
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  };

  const codeVerifier = generateRandomString(64);

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
  };

  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // make a get request to the /authorize endpoint, including some parameters specified in the api documentation, much like the majority of code here.
  const clientId = "60f8dab9ab5f46ab993a5378bea82f26";
  const redirectUri =
    "chrome-extension://hndbihmidcdkhcpbjodeagbolmbbmolj/redirect/auth.html";

  const scope = "user-read-private user-read-email";
  const authUrl = new URL("https://accounts.spotify.com/authorize");

  window.localStorage.setItem("code_verifier", codeVerifier);

  const params = {
    response_type: "code",
    client_id: clientId,
    scope,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
};

// Function to handle redirection after user authorizes the application
const handleRedirect = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  console.log(urlParams.toString()); // Log URL parameters for debugging
  const code = urlParams.get("code");

  if (code) {
    // Code is present, proceed to get the token
    await getToken(code);
  } else {
    // Code is not present, handle error or redirect back to authorization
    console.error("Authorization code not found in URL parameters");
  }
};

// Call the function to handle redirection when the page loads
handleRedirect();

const getToken = async (code) => {
  // stored in the previous step
  let codeVerifier = localStorage.getItem("code_verifier");
  const url = "https://accounts.spotify.com/api/token";

  const clientId = "60f8dab9ab5f46ab993a5378bea82f26";
  const redirectUri =
    "chrome-extension://hndbihmidcdkhcpbjodeagbolmbbmolj/redirect/auth.html";

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  };

  const body = await fetch(url, payload);
  const response = await body.json();

  localStorage.setItem("access_token", response.access_token);
};

document.getElementById("printAuth").onclick = function () {
  // Retrieve the access token from local storage
  const accessToken = localStorage.getItem("access_token");
  console.log(accessToken);
};

document.getElementById("enablePlayer").onclick = function () {
  //Creates a new spotify sdk player object

  window.onSpotifyWebPlaybackSDKReady = () => {
    const token = "accessToken";
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

    //slider listeners
    volume = document.getElementById("volumeslider");
    progress = document.getElementById("progressslider");
    volume.oninput = function () {
      player.setVolume(volume.value / 100);
    };
    progress.oninput = function () {
      player.seek(progress.value);
    };

    //declares the progress bar update function as false
    progressUpdating = false;

    // Connection state listeners
    player.addListener(
      "player_state_changed",
      ({ track_window: { current_track } }) => {
        //gets name, title, and cover
        let returnedplaying = `${current_track.name}`;
        let returnedartists = `${(() => {
          artists = [];
          for (const artist of current_track.artists) {
            artists.push(artist.name);
          }
          return artists.join(", ");
        })()}`;
        let returnedcover = current_track.album.images[0].url;
        document.getElementById("currentlyPlaying").innerHTML = returnedplaying;
        document.getElementById("artists").innerHTML = returnedartists;
        document.getElementById("albumCover").src = returnedcover;
        //sets the corresponding length in the progress slider.
        document.getElementById("progressslider").max =
          current_track.duration_ms;
        //starts updating the bar progress.
        if (progressUpdating == false) {
          progressUpdating = true;
          setInterval(function () {
            player.getCurrentState().then((state) => {
              if (!state) {
                console.error("Something broke.");
                return;
              }
              console.log(state);
              console.log(state.position);
              progress.value = state.position;
              return;
            });
          }, 500);
        }
      }
    );

    // connects the player
    player.connect();
  };
};
