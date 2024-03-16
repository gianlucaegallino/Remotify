//This scripts takes care of the login/logout functions + template rendering.
//This code is heavily modeled after the code in https://github.com/spotify/web-api-examples/tree/master/authorization/authorization_code_pkce
// Constants for Spotify API authentication
const clientId = "60f8dab9ab5f46ab993a5378bea82f26"; // your clientId
const redirectUrl =
  "chrome-extension://hndbihmidcdkhcpbjodeagbolmbbmolj/popup/remotify.html"; // your redirect URL - must be localhost URL and/or HTTPS
const authorizationEndpoint = "https://accounts.spotify.com/authorize";
const tokenEndpoint = "https://accounts.spotify.com/api/token";
const scope =
  "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming";

window.onSpotifyWebPlaybackSDKReady = () => {
  if (localStorage.getItem("access_token") != null) {
    const token = localStorage.getItem("access_token");
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

    // variables for keeping track of updates in listeners/elements

    let progressUpdating = false;
    let listenersOn = false;

    // Connection state listeners

    player.addListener(
      "player_state_changed",
      ({ track_window: { current_track } }) => {
        let returnedplaying = `${current_track.name}`;
        let returnedartists = `${(() => {
          let artistsarray = [];
          for (const artist of current_track.artists) {
            artistsarray.push(artist.name);
          }
          return artistsarray.join(", ");
        })()}`;
        let returnedcover = current_track.album.images[0].url;
        document.getElementById("currentlyPlaying").innerHTML = returnedplaying;
        document.getElementById("artists").innerHTML = returnedartists;
        document.getElementById("albumCover").src = returnedcover;

        //checks if the tutorial screen is still present. if it is, switches visibility from the tutorial to the player
        let playerElement = document.getElementById("player")
        let tutorialElement = document.getElementById("tutorial")
        if (tutorialElement.classList.contains('visible')){
          tutorialElement.classList.toggle('visible');
          playerElement.classList.toggle('visible');
        }
        //sets the corresponding length in the progress slider.

        document.getElementById("progressslider").max =
          current_track.duration_ms;

        //checks if the buttons already have listeners, else applies listeners to them.

        if (listenersOn == false) {
          const togglePlay = document.getElementById("togglePlay");
          if (togglePlay) {
            togglePlay.onclick = function () {
              player.togglePlay();
            };
            listenersOn = true;
          }
          const previousTrack = document.getElementById("previousTrack");
          if (previousTrack) {
            previousTrack.onclick = function () {
              player.previousTrack();
            };
            listenersOn = true;
          }
          const nextTrack = document.getElementById("nextTrack");
          if (nextTrack) {
            nextTrack.onclick = function () {
              player.nextTrack();
            };
            listenersOn = true;
          }
          //slider listeners

          let volume = document.getElementById("volumeslider");
          let progress = document.getElementById("progressslider");
          volume.oninput = function () {
            player.setVolume(volume.value / 100);
          };
          progress.oninput = function () {
            player.seek(progress.value);
          };

          //starts updating the bar progress.

          if (progressUpdating == false) {
            progressUpdating = true;
            setInterval(function () {
              player.getCurrentState().then((state) => {
                if (!state) {
                  console.error("Something broke.");
                  return;
                }
                progress.value = state.position;
                return;
              });
            }, 500);
          }
        }
      }
    );

    // connects the player

    player.connect();
    console.log("connected");
  }
};

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

  // Saves the token to localStorage along with expiration details
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
const args = new URLSearchParams(window.location.search);
let code = args.get("code");

// If we find a code, we're in a callback, do a token exchange
if (code) {
  getToken(code)
    .then((token) => {
      currentToken.save(token);

      // Remove code from URL so we can refresh correctly.
      const url = new URL(window.location.href);
      url.searchParams.delete("code");

      const updatedUrl = url.search ? url.href : url.href.replace("?", "");
      window.history.replaceState({}, document.title, updatedUrl);
      //Reloads window to update stuck templates
      window.close();
    })
    .catch((error) => console.error("Error getting token:", error));
}

// If we have a token, we're logged in, so fetch user data and render logged-in template
if (currentToken.access_token) {
  getUserData()
    .then((userData) => {
      renderTemplate("main", "logged-in-template", userData);
    })
    .catch((error) => console.error("Error fetching user data:", error));
}

// Otherwise, we're not logged in, so render the login template
if (!currentToken.access_token) {
  renderTemplate("main", "login");
}

// Function to initiate Spotify authorization flow
async function redirectToSpotifyAuthorize() {
  // Generate a random code_verifier for PKCE
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const randomString = randomValues.reduce(
    (acc, x) => acc + possible[x % possible.length],
    ""
  );

  // Create code_challenge and store code_verifier in localStorage
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

  // Build authorization URL with PKCE parameters
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
  // Redirect the user to the authorization server for login
  chrome.tabs.create({
    url: authUrl.toString(),
  });
}

// Function to exchange authorization code for access token
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

// Function to refresh access token
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

// Function to fetch user data from Spotify API
async function getUserData() {
  const response = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: "Bearer " + currentToken.access_token },
  });

  return await response.json();
}

// Click event handlers

// Initiates Spotify authorization flow
async function loginWithSpotifyClick() {
  await redirectToSpotifyAuthorize();
}

// Logs out the user by clearing localStorage and redirecting to the redirect URL
async function logoutClick() {
  localStorage.clear();
  window.location.href = redirectUrl;
}

// Refreshes access token and updates UI
async function refreshTokenClick() {
  const token = await refreshToken();
  currentToken.save(token);
}

// Render HTML templates
function renderTemplate(targetId, templateId, data = null) {
  const template = document.getElementById(templateId);
  const clone = template.content.cloneNode(true);

  // Bind data to template elements
  const elements = clone.querySelectorAll("*");
  elements.forEach((ele) => {
    const bindingAttrs = [...ele.attributes].filter((a) =>
      a.name.startsWith("data-bind")
    );

    bindingAttrs.forEach((attr) => {
      const target = attr.name
        .replace(/data-bind-/, "")
        .replace(/data-bind/, "");
      const targetType = target.startsWith("onclick") ? "HANDLER" : "PROPERTY";
      const targetProp = target === "" ? "innerHTML" : target;

      const prefix = targetType === "PROPERTY" ? "data." : "";
      const expression = prefix + attr.value.replace(/;\n\r\n/g, "");

      // Bind data /.event handlers to template elements
      try {
        if (targetType === "PROPERTY") {
          ele[targetProp] = data ? data[attr.value] : "";
        } else {
          // Event handler binding
          ele.addEventListener(targetProp.replace("on", ""), () => {
            const handlerName = attr.value;
            if (typeof window[handlerName] === "function") {
              window[handlerName]();
            }
          });
        }
        ele.removeAttribute(attr.name);
      } catch (ex) {
        console.error(`Error binding ${expression} to ${targetProp}`, ex);
      }
    });
  });

  // Render the template in the target element
  const target = document.getElementById(targetId);
  target.innerHTML = "";
  target.appendChild(clone);
  // Add event listeners to the newly rendered elements
  addPageListeners();
}

// Add listeners to the page p
function addPageListeners() {
  console.log("addlisteners executed");
  const loginButton = document.getElementById("login-button");
  if (loginButton) {
    loginButton.addEventListener("click", loginWithSpotifyClick);
  }
  const refreshButton = document.getElementById("refresh-token-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", refreshTokenClick);
  }
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", logoutClick);
  }
  console.log("normal buttons executed");
}

//Checks for the existance of listeners.
function hasEventListener(element, eventType) {
  if (!element || !eventType) {
    console.log("evaluates to false");
    return false;
  }

  // Check if the element has any event listeners attached
  if (typeof element[eventType] === "function") {
    console.log("evaluates to true]");
    return true; // There is a listener directly attached to the event type
  }

  // Check if there are any event listeners added through addEventListener
  const eventListeners = element.__events || {};
  console.log("evaluates to:");
  console.log(!!eventListeners[eventType]);
  return !!eventListeners[eventType];
}
