// Essential parts of this code were taken from the spotify github docs, at https://github.com/spotify/web-api-examples/blob/master/authorization/authorization_code_pkce/public/app.js
//It was modified to fit this extension's purpose, however.
const clientId = "60f8dab9ab5f46ab993a5378bea82f26"; // your clientId
const redirectUrl =
  "chrome-extension://hndbihmidcdkhcpbjodeagbolmbbmolj/popup/remotify.html"; // your redirect URL - must be localhost URL and/or HTTPS

const authorizationEndpoint = "https://accounts.spotify.com/authorize";
const tokenEndpoint = "https://accounts.spotify.com/api/token";
const scope = "user-read-private user-read-email";

// Data structure that manages the current active token, caching it in localStorage
const currentToken = {
  get access_token() {
    return localStorage.getItem("access_token") || null;
  },
  get refresh_token() {
    return localStorage.getItem("refresh_token") || null;
  },
  get expires_in() {
    return localStorage.getItem("refresh_in") || null;
  },
  get expires() {
    return localStorage.getItem("expires") || null;
  },

  save: function (response) {
    const { access_token, refresh_token, expires_in } = response;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("expires_in", expires_in);

    const now = new Date();
    const expiry = new Date(now.getTime() + expires_in * 1000);
    localStorage.setItem("expires", expiry);
  },
};

// On page load, try to fetch auth code from current browser search URL
(async () => {
  const args = new URLSearchParams(window.location.search);
  const code = args.get("code");

  if (code) {
    const token = await getToken(code);
    currentToken.save(token);

    // Remove code from URL so we can refresh correctly.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");

    const updatedUrl = url.search ? url.href : url.href.replace("?", "");
    window.history.replaceState({}, document.title, updatedUrl);
  }
})();

// If we have a token, we're logged in, so fetch user data and render logged in template
(async () => {
  if (currentToken.access_token) {
    const userData = await getUserData();
    // Now you can use userData here.
    // renderTemplate("main", "logged-in-template", userData);
    // renderTemplate("oauth", "oauth-template", currentToken);
    // TODO: Adapt this to normal HTML functioning.
  }
})();

// Otherwise we're not logged in, so render the login template
if (!currentToken.access_token) {
  //TODO: again, normal html. renderTemplate("main", "login");
}

async function redirectToSpotifyAuthorize() {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const randomString = randomValues.reduce(
    (acc, x) => acc + possible[x % possible.length],
    ""
  );

  const code_verifier = randomString;
  const data = new TextEncoder().encode(code_verifier);
  const hashed = await crypto.subtle.digest("SHA-256", data);

  const code_challenge_base64 = btoa(
    String.fromCharCode(...new Uint8Array(hashed))
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  window.localStorage.setItem("code_verifier", code_verifier);

  const authUrl = new URL(authorizationEndpoint);
  const params = {
    response_type: "code",
    client_id: clientId,
    scope: scope,
    code_challenge_method: "S256",
    code_challenge: code_challenge_base64,
    redirect_uri: redirectUrl,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
}

// Spotify API Calls
async function getToken(code) {
  const code_verifier = localStorage.getItem("code_verifier");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUrl,
      code_verifier: code_verifier,
    }),
  });

  return await response.json();
}

async function refreshToken() {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: currentToken.refresh_token,
    }),
  });

  return await response.json();
}

async function getUserData() {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + currentToken.access_token },
  });

  return await response.json();
}

// Click handlers
document.getElementById("getAuth").onclick = async function loginWithSpotifyClick() {
  await redirectToSpotifyAuthorize();
}
/*
async function logoutClick() {
  localStorage.clear();
  window.location.href = redirectUrl;
}

async function refreshTokenClick() {
  const token = await refreshToken();
  currentToken.save(token);
  renderTemplate("oauth", "oauth-template", currentToken);
}*/


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
  

