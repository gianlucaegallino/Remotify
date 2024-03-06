//Auth script, that locally stores token and refresh tokens.
//built with code specified in (https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
clientId = "60f8dab9ab5f46ab993a5378bea82f26";

//Implementation of auth code PKCE

//Rand string generation of certain length with character allowlist
const makeRandStr = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  //Array generation
  const values = crypto.getRandomValues(new Uint8Array(length));
  //Return array, using reduce to iterate. for each value x, gets an index in the pos string. appends to acc.
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};
//SHA256 function. async, because hashing takes time to complete
const sha256 = async (plain) => {
  //creates a textencoder object, to work with hashing algorithms
  const encoder = new TextEncoder();
  //turns the string into a byte sequence
  const data = encoder.encode(plain);
  //calculates the sha256 hash of the byte sequence.
  return window.crypto.subtle.digest("SHA-256", data);
};

// returns the base64 version of the digest
const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

//generates a random 64 char str.
const codeVerifier = makeRandStr(64);

//hashes the verifier accordingly
const hashed = await sha256(codeVerifier);
const codeChallenge = base64encode(hashed);

// make a get request to the /authorize endpoint, including some parameters specified in the api documentation, much like the majority of code here.

const redirectUri = "http://localhost:8080";

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

const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get("code");
if (code == "error" || code == "state") {
  console.log("something went wrong when accepting permissions.");
} else {
  const getToken = async (code) => {
    // stored in the previous step
    let codeVerifier = localStorage.getItem("code_verifier");

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

    //sets access and refresh tokens in localstorage for easy access.
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("refresh_token", response.refresh_token);
  };
}
