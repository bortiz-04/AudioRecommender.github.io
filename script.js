const SPOTIFY_CLIENT_ID = "162b56585b2d400a8b6f1fbe25401828";
const SPOTIFY_CLIENT_SECRET = "e9e082c08eeb41e4b379a8556015bdcf";
let SPOTIFY_ACCESS_TOKEN = "";
let SPOTIFY_TOKEN_EXPIRY = 0; // token expiration time in milliseconds

// fetch a new access token from Spotify when expired
async function getSpotifyAccessToken() {
    const currentTime = Date.now(); // Current time in milliseconds

    // if the token is still valid, don't fetch a new one
    if (SPOTIFY_ACCESS_TOKEN && currentTime < SPOTIFY_TOKEN_EXPIRY) {
        return;
    }

    // ensures Client ID and Secret exist before making a request
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        console.error("❌ Missing Spotify Client ID or Secret. Check your credentials.");
        if (document.getElementById("errorMessage")) 
        {
            showErrorMessage("⚠ Missing Spotify credentials. Please check your setup.");
        }
        return;
    }

    try 
    {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: 
            {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=${SPOTIFY_CLIENT_SECRET}`
        });

        if (!response.ok) 
        {
            throw new Error(`Failed to fetch Spotify token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        SPOTIFY_ACCESS_TOKEN = data.access_token;
        SPOTIFY_TOKEN_EXPIRY = Date.now() + data.expires_in * 1000; // convert expires_in to milliseconds

        console.log("✅ New Spotify Access Token Acquired!");
    } 
    catch (error) 
    {
        console.error("❌ Error fetching Spotify token:", error);
        SPOTIFY_ACCESS_TOKEN = ""; // reset token to avoid using an invalid one
        SPOTIFY_TOKEN_EXPIRY = 0; // reset the token expiry
        if (document.getElementById("errorMessage")) 
        {
            showErrorMessage("⚠ Error connecting to Spotify. Try again later.");
        }
    }
}

// shows a loading animation
function showLoading() 
{
    document.getElementById("loading").classList.remove("hidden");
}

// hides the loading animation
function hideLoading() 
{
    document.getElementById("loading").classList.add("hidden");
}

// fetches recommendations from Spotify API
async function getRecommendations() {
    const input = document.getElementById("musicInput").value.trim();
    const recommendationList = document.getElementById("recommendationList");
    const errorMessage = document.getElementById("errorMessage");

    recommendationList.innerHTML = "";
    if (errorMessage) errorMessage.innerHTML = ""; // Clear errors

    if (!input) {
        showErrorMessage("⚠ Please enter a song or genre!");
        return;
    }

    showLoading();

    try {
        // Ensure valid access token before making request
        await getSpotifyAccessToken();

        if (!SPOTIFY_ACCESS_TOKEN) {
            throw new Error("Access token is missing!");
        }

        // Search for songs
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(input)}&type=track&limit=5`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${SPOTIFY_ACCESS_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        hideLoading();

        if (data.tracks && data.tracks.items.length > 0) {
            // ✅ PASS FULL TRACK OBJECTS NOW
            displayRecommendations(data.tracks.items);
        } else {
            displayRecommendations([]); // No songs found
        }
    } catch (error) {
        console.error("❌ Error fetching recommendations:", error);
        hideLoading();
        showErrorMessage("⚠ Error fetching recommendations. Try again later.");
    }
}

function displayRecommendations(tracks) {
    const recommendationList = document.getElementById("recommendationList");
    recommendationList.innerHTML = "";

    if (tracks.length === 0) {
        recommendationList.innerHTML = "<p>No recommendations found. Try another song or genre.</p>";
        return;
    }

    tracks.forEach(track => {
        const songCard = document.createElement("div");
        songCard.classList.add("song-card");

        const albumCover = track.album.images.length > 0 ? track.album.images[0].url : "https://via.placeholder.com/150";
        const spotifyLink = track.external_urls.spotify; // direct link to Spotify

        songCard.innerHTML = `
            <img src="${albumCover}" alt="Album Cover" class="album-cover">
            <div class="song-info">
                <p><strong>${track.name}</strong></p>
                <p>${track.artists.map(a => a.name).join(", ")}</p>
            </div>
            <a href="${spotifyLink}" target="_blank" class="spotify-link">🎵 Listen on Spotify</a>
        `;

        recommendationList.appendChild(songCard);
    });
}

// function that shows an error message to the user
function showErrorMessage(message) 
{
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
        errorMessage.innerHTML = `<p class="error">${message}</p>`;
    } else {
        console.warn("⚠ No error message container found in HTML.");
    }
}

// toggle dark mode
function toggleDarkMode() 
{
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// keep dark mode state on reload
window.onload = async function() 
{
    if (JSON.parse(localStorage.getItem("darkMode"))) {
        document.body.classList.add("dark-mode");
    }
    await getSpotifyAccessToken(); // fetches Spotify token on page load
};