//This scripts takes care of the login/logout functions + template rendering.
//This code is heavily modeled after the code in https://github.com/spotify/web-api-examples/tree/master/authorization/authorization_code_pkce

// Constants for Spotify API authentication
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
//TODO: FIX
const args = new URLSearchParams(window.location.search);
let code = args.get("code");

// If we find a code, we're in a callback, do a token exchange
if (code) {
  getToken(code)
    .then((token) => {
      currentToken.save(token);

      // Remove code from URL so we can refresh correctly.
      //TODO: FIX
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
      renderTemplate("oauth", "oauth-template", currentToken);
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
  console.log("deleting stuff");
  localStorage.clear();
  window.location.href = redirectUrl;
}

// Refreshes access token and updates UI
async function refreshTokenClick() {
  console.log("refreshing token");
  const token = await refreshToken();
  currentToken.save(token);
  renderTemplate("oauth", "oauth-template", currentToken);
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
    console.log("binded to 3");
  }
}
