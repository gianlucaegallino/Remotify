document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("login-button");
    if (loginButton) {
      loginButton.addEventListener("click", loginWithSpotifyClick);
      console.log("binded to 1");
    } else {
      console.log("no login here");
    }

    const refreshButton = document.getElementById("refresh-token-button");
    if (refreshButton) {
      refreshButton.addEventListener("click", refreshTokenClick);
      console.log("binded to 2");
    } else {
      console.log("no refresh here");
    }

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", logoutClick);
      console.log("binded to 3");
    } else {
      console.log("no logout here");
    }
  });