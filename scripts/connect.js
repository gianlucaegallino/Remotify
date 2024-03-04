window.onSpotifyWebPlaybackSDKReady = () => {
    const token =
      "[BQAboeLC-TKs0RSa9aqshecN0Pc4iwBubYwi3G1Dt3wczND2SvyTYz4m2EPLzVyGWbAAO0haWsJaYuNvGbrdc8LhJm3RCoQh6WG1KuWvfJtgFq0KSzIW6AFGQBHlc5RqZCeHbDHHeqBmCetY4flv8uqbDx8ta1oC7pu3d8bCckOIc3lHeGHXD82OymeBb_Ghy8IigwxiswM]";
    const player = new Spotify.Player({
      name: "Web Playback SDK Quick Start Player",
      getOAuthToken: (cb) => {
        cb(token);
      },
      volume: 0.5,
    });
    // Ready
    player.addListener("ready", ({ device_id }) => {
      console.log("Ready with Device ID", device_id);
    });

    // Not Ready
    player.addListener("not_ready", ({ device_id }) => {
      console.log("Device ID has gone offline", device_id);
    });
    player.addListener("initialization_error", ({ message }) => {
      console.error(message);
    });

    player.addListener("authentication_error", ({ message }) => {
      console.error(message);
    });

    player.addListener("account_error", ({ message }) => {
      console.error(message);
    });
    player.connect();
  };