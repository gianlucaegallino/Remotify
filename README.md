# Remotify

A lightweight Spotify session, inside the comfort of a Chrome extension.

### ⚠️ IMPORTANT: Spotify Premium is required for this extension to work correctly.

### Video Demo: insertUrlHere

## About the project:

This extension was developed as my final project in Harvard University's CS50x 2024.
It consists of a Google Chrome extension, which utilizes both the Spotify Web Player SDK and the Spotify API to manage Spotify Playback in a simple, effective and resource-light way.
It utilizes the auth code PKCE verification method, which was chosen over normal authentication code methods, in order to follow good cybersecurity practices by keeping the application private key out from the source code.
I also utilized an array of different Chrome APIs, like localStorage, to manage and remember user data once the login works successfully.
Once logged in, this extension allows you to connect to the Remotify player through Spotify Connect, as you would with any other remote device, hence the name.
After this, you will get the ability to skip or go back tracks, play/pause, and you will get other features like a live-updating progress bar that dynamically detects song length and progress, a player-native volume control, and dynamic player status logging of album covers, song names and artist names.
All user data is stored locally, and is easily cleared when logging out.

## Features:

- Spotify Music Playback
- Authentication code with PKCE safe login method
- Play/Pause buttons
- Skip / Return track buttons
- Dynamic song progress tracker-selector
- Template rendering for a clean user interface
- Native volume control
- Album cover display
- Song + Artist display
- Animated buttons

## Usage:

1. Go to your extensions tab in Google Chrome and activate Developer mode.
2. Download the extension files from this GitHub repository, and put it somewhere safe.
3. Add the extension folder to your add-on list.
4. Pin the extension to your add-on bar for ease of use.
5. Click on the Remotify logo in the add-on bar, and press the "Log in with Spotify" button.
6. Accept the permissions the extension needs in the Spotify Permission that will appear.
7. Open the Remotify extension.
8. Open Spotify on your phone.
9. Press on the "Devices" icon.
10. Select "Remotify" in the device list, and your music should appear and start sounding through the extension.
11. Enjoy your music!

If, eventually, the music stops playing, a token refresh is needed. Press on "Refresh Token", then reopen the extension to keep playing your music.

## JS File breakdown:

### connectionHandler.js

The main JavaScript file. tThis script manages login/logout functions, template rendering, and player handling for a Spotify application.

#### Features

- **User Authentication:** Implements authentication flow using OAuth 2.0 for Spotify API access.
- **Template Rendering:** Renders HTML templates based on the user's authentication state and data.
- **Player Handling:** Controls Spotify playback and updates UI based on the current playback state.

#### Dependencies

- **Spotify Web Playback SDK:** Utilized for controlling the Spotify player.
- **Crypto API:** Used for generating random values required for PKCE (Proof Key for Code Exchange).

#### Implementation Details

##### Spotify API Authentication Constants

- **clientId:** Client ID for the Spotify application.
- **redirectUrl:** Redirect URL for the application post-authorization.
- **authorizationEndpoint:** URL for Spotify authorization.
- **tokenEndpoint:** URL for obtaining access tokens.
- **scope:** List of required permissions for accessing user data and controlling playback.

##### Spotify Player Initialization

- Initializes the Spotify Web Playback SDK and connects it to the user's Spotify account.
- Handles player events such as ready, not_ready, initialization_error, authentication_error, and account_error.

##### Token Management

- Manages the current access token, refresh token, and their expiration details using localStorage.
- Provides functions for saving tokens, fetching user data, and refreshing access tokens.

##### Authentication Flow

- On page load, checks for authorization code in the URL.
- If a code is present, exchanges it for an access token and saves the token.
- If a valid access token exists, fetches user data and renders the logged-in template.
- Otherwise, renders the login template.

##### User Interface Event Handlers

- **loginWithSpotifyClick():** Initiates Spotify authorization flow when login button is clicked.
- **logoutClick():** Logs out the user by clearing stored tokens and redirecting to the redirect URL.
- **refreshTokenClick():** Refreshes the access token and updates the UI accordingly.

##### Template Rendering

- Renders HTML templates based on the provided data and binds event handlers.
- Uses data-binding attributes to dynamically update template elements.
- Adds event listeners to the rendered elements for user interaction.

##### Utility Functions

- **hasEventListener(element, eventType):** Checks if an element has event listeners attached.

#### Usage

- Include this script in your application.
- Customize constants such as `clientId`, `redirectUrl`, and `scope` according to your application's requirements.
- Ensure the required HTML templates are defined and referenced correctly.

### spotify-player.js

    Spotify-Owned player code, part of the Web Player SDK, and a necessary inclusion in the project.

## Future To-Do's:

I plan on adding the following features in future versions:

- Add a Spotify Premium check on login.
- Automate token dispensing when nearing expiry.
- Add Playlist Selection support.
- Add Shuffle toggle
- Make it all work in the background, when the popup is closed.
