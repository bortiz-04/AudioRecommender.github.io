
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
        console.error("Missing Spotify Client ID or Secret. Check your credentials.");
        if (document.getElementById("errorMessage")) {
            showErrorMessage("⚠ Missing Spotify credentials. Please check your setup.");
        }
        return;
    }

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers:
            {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=${SPOTIFY_CLIENT_SECRET}`
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Spotify token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        SPOTIFY_ACCESS_TOKEN = data.access_token;
        SPOTIFY_TOKEN_EXPIRY = Date.now() + data.expires_in * 1000; // convert expires_in to milliseconds

        console.log("New Spotify Access Token Acquired!");
    }
    catch (error) {
        console.error("Error fetching Spotify token:", error);
        SPOTIFY_ACCESS_TOKEN = ""; // reset token to avoid using an invalid one
        SPOTIFY_TOKEN_EXPIRY = 0; // reset the token expiry
        if (document.getElementById("errorMessage")) {
            showErrorMessage("⚠ Error connecting to Spotify. Try again later.");
        }
    }
}

// shows a loading animation
function showLoading() {
    document.getElementById("loading").classList.remove("hidden");
}

// hides the loading animation
function hideLoading() {
    document.getElementById("loading").classList.add("hidden");
}

// fetches recommendations from Spotify API
async function getRecommendations() {
    const input = document.getElementById("musicInput").value.trim();
    const recommendationList = document.getElementById("recommendationList");
    const errorMessage = document.getElementById("errorMessage");
    const userEmail = localStorage.getItem("loggedInUser");

    recommendationList.innerHTML = "";
    if (errorMessage) errorMessage.innerHTML = "";

    if (!input || input.length < 1) {
        showErrorMessage("⚠ Please enter at least 1 character for a song or genre.");
        return;
    }

    showLoading();

    try {
        await getSpotifyAccessToken();

        if (!SPOTIFY_ACCESS_TOKEN) {
            throw new Error("Access token is missing!");
        }

        // Save search to backend with user email (if logged in)
        if (userEmail) {
            console.log("Saving search for user:", userEmail);
            fetch("http://localhost:8080/api/save-search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input, userEmail })
            }).catch(err => console.error("Failed to save search:", err));
        } else {
            console.warn("⚠ User not logged in. Search not saved.");
        }

        // Fetch recommendations from Spotify
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
            displayRecommendations(data.tracks.items);
        } else {
            displayRecommendations([]);
        }
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        hideLoading();
        showErrorMessage("Error fetching recommendations");
    }
}


function displayRecommendations(tracks) {
    const recommendationList = document.getElementById("recommendationList");
    recommendationList.innerHTML = "";

    if (tracks.length === 0) {
        recommendationList.innerHTML = "<p>No recommendations found. Try another song or genre.</p>";
        return;
    }

    // Filter duplicates - unique combo of name + artist(s)
    const seen = new Set();
    const uniqueTracks = tracks.filter(track => {
        const artistNames = track.artists.map(a => a.name).join(", ");
        const key = `${track.name.toLowerCase()}__${artistNames.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    uniqueTracks.forEach(track => {
        const songCard = document.createElement("div");
        songCard.classList.add("song-card");

        const albumCover = track.album.images.length > 0 ? track.album.images[0].url : "https://via.placeholder.com/150";
        const spotifyLink = track.external_urls.spotify;
        const songName = track.name;
        const artistName = track.artists.map(a => a.name).join(", ");

        songCard.innerHTML = `
            <img src="${albumCover}" alt="Album Cover" class="album-cover">
            <div class="song-info">
                <p><strong>${songName}</strong></p>
                <p>${artistName}</p>
            </div>
            <a href="${spotifyLink}" target="_blank" class="spotify-link">🎵 Listen</a>
            <button class="play-button" onclick="addToPlaylistPrompt('${songName}', '${artistName}', '${albumCover}', '${spotifyLink}')">➕ Add</button>
        `;

        recommendationList.appendChild(songCard);
    });
}


async function addToPlaylistPrompt(song, artist, cover, url) {
    const userEmail = localStorage.getItem("loggedInUser");
    if (!userEmail) return alert("You must be logged in to save songs.");

    const res = await fetch(`/api/playlists/${userEmail}`);
    const playlists = await res.json();

    let playlistOptions = playlists.map(p => `${p.id}: ${p.name}`).join('\n');
    let choice = prompt(`Choose a playlist by ID or type NEW:<name>\n\n${playlistOptions}`);

    if (!choice) return;

    // Create new playlist if user types "NEW:<name>"
    if (choice.startsWith("NEW:")) {
        const name = choice.substring(4).trim();
        if (!name) return alert("Invalid playlist name.");

        const createRes = await fetch("/api/create-playlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userEmail, name })
        });

        const created = await createRes.json();
        if (!createRes.ok) return alert(created.error || "Failed to create playlist.");

        // Refetch playlists to get new ID
        const newListRes = await fetch(`/api/playlists/${userEmail}`);
        const newList = await newListRes.json();
        const newPlaylist = newList.find(p => p.name === name);
        if (!newPlaylist) return alert("Playlist creation failed.");

        choice = newPlaylist.id;
    }

    const playlistId = parseInt(choice);
    if (isNaN(playlistId)) return alert("Invalid playlist ID.");

    const saveRes = await fetch("/api/add-to-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            playlistId,
            song_name: song,
            artist_name: artist,
            album_cover_url: cover,
            spotify_url: url
        })
    });

    const saveData = await saveRes.json();
    alert(saveData.message || saveData.error || "Unknown error saving song.");
}



// function that shows an error message to the user
function showErrorMessage(message) {
    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
        errorMessage.innerHTML = `<p class="error">${message}</p>`;
    } else {
        console.warn("⚠ No error message container found in HTML.");
    }
}

// toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}


window.onload = async function () {
    if (JSON.parse(localStorage.getItem("darkMode"))) {
        document.body.classList.add("dark-mode");
    }

    await getSpotifyAccessToken();

    const user = localStorage.getItem("loggedInUser");

    if (user) {
        document.getElementById("authBox").style.display = "none";
        document.getElementById("generatorSection").style.display = "block";
        document.getElementById("user-settings-container").style.display = "block"; // 👈 Show dropdown
    } else {
        document.getElementById("authBox").style.display = "block";
        document.getElementById("generatorSection").style.display = "none";
        document.getElementById("user-settings-container").style.display = "none"; // 👈 Hide dropdown
    }

    // Ensure delete modal is hidden on page load
    const deleteModal = document.getElementById("deleteAccountModal");
    if (deleteModal) {
        deleteModal.classList.add("hidden");
        deleteModal.style.display = "none";
    }
};

// Signup
document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    document.getElementById("authMessage").textContent = data.message || data.error;
});

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    document.getElementById("authMessage").textContent = data.message || data.error;

    if (data.message === "Login successful") {
        localStorage.setItem("loggedInUser", email);

        // Show generator section, hide auth box
        document.getElementById("authBox").style.display = "none";
        document.getElementById("generatorSection").style.display = "block";
        document.getElementById("user-settings-container").style.display = "block"; // 👈 ADD THIS

        await getSpotifyAccessToken();
        await loadSearchHistory();
    }
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");

    // Hide the generator section
    document.getElementById("generatorSection").style.display = "none";

    // Show the auth section again
    document.getElementById("authBox").style.display = "block";

    // Clear previous search results and messages
    document.getElementById("musicInput").value = "";
    document.getElementById("recommendationList").innerHTML = "";
    document.getElementById("errorMessage").innerHTML = "";
});


function viewSearchHistory() {
    const email = localStorage.getItem("loggedInUser");
    const recommendationList = document.getElementById("recommendationList");

    if (!email) {
        alert("You must be logged in to view your search history.");
        return;
    }

    // If history is already shown, remove it and return (toggle off)
    const existing = document.getElementById("searchHistorySection");
    if (existing) {
        existing.remove();
        return;
    }

    fetch(`/api/search-history/${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                recommendationList.insertAdjacentHTML("beforebegin", "<div id='searchHistorySection'><p>No search history found.</p></div>");
                return;
            }

            const listItems = data.map(item => {
                const date = item.search_time ? new Date(item.search_time).toLocaleString() : "(No date)";
                return `<li>${item.query} — ${date}</li>`;
            }).join('');

            const historyHTML = `
                <div id="searchHistorySection">
                    <h2>Your Search History:</h2>
                    <ul>${listItems}</ul>
                </div>
            `;

            recommendationList.insertAdjacentHTML("beforebegin", historyHTML);
        })
        .catch(err => {
            console.error("Error loading search history:", err);
            recommendationList.insertAdjacentHTML("beforebegin", "<div id='searchHistorySection'><p>Error loading search history.</p></div>");
        });
}

// Dropdown interaction functions
function toggleDropdown() {
    const dropdown = document.getElementById("user-settings-dropdown");
    dropdown.classList.toggle("hidden");
}

// Toggle visibility of Change Password Modal
function togglePasswordModal() {
    const modal = document.getElementById("changePasswordModal");
    modal.classList.toggle("hidden");

    // Clear input fields and message
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("passwordChangeMessage").textContent = "";
}

// Triggered when "Change Password" is clicked
function changePassword() {
    togglePasswordModal(); // show the modal
}

function closeChangePassword() {
    document.getElementById("changePasswordModal").classList.add("hidden");
    document.getElementById("passwordChangeMessage").textContent = "";
    document.getElementById("changePasswordForm").reset();
}

function closeDeleteAccount() {
    const modal = document.getElementById("deleteAccountModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = "none";  // Force hide
    }

    const messageBox = document.getElementById("deleteAccountMessage");
    const form = document.getElementById("deleteAccountForm");

    if (messageBox) messageBox.textContent = "";
    if (form) form.reset();
}


function deleteAccount() {
    toggleDeleteModal();
}

function toggleDeleteModal() {
    const modal = document.getElementById("deleteAccountModal");
    if (modal.classList.contains("hidden")) {
        modal.classList.remove("hidden");
        modal.style.display = "flex";  // Needed for centering
    } else {
        modal.classList.add("hidden");
        modal.style.display = "none";
    }

    document.getElementById("deletePassword").value = "";
    document.getElementById("deleteAccountMessage").textContent = "";
}


// Handle password form submission
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("changePasswordForm");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = localStorage.getItem("loggedInUser");
            const currentPassword = document.getElementById("currentPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const messageBox = document.getElementById("passwordChangeMessage");

            if (!email) {
                alert("You must be logged in.");
                return;
            }

            try {
                const res = await fetch("/api/change-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, currentPassword, newPassword }),
                });

                const data = await res.json();
                messageBox.textContent = data.message || data.error;
                messageBox.style.color = res.ok ? "green" : "red";

                if (res.ok) {
                    setTimeout(() => {
                        closeChangePassword();
                    }, 2000);
                }
            } catch (err) {
                messageBox.textContent = "Error updating password.";
                messageBox.style.color = "red";
            }
        });
    }
});

// LOGIN/SIGNUP
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const authMessage = document.getElementById('authMessage');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            try {
                const res = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                authMessage.textContent = data.message || 'Signup complete!';
                authMessage.style.color = res.ok ? 'green' : 'red';
            } catch (err) {
                authMessage.textContent = 'Signup error!';
                authMessage.style.color = 'red';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                if (res.ok) {

                    document.getElementById('authBox').style.display = 'none';
                    document.getElementById('generatorSection').style.display = 'block';
                    // <-- Redirect to music page
                } else {
                    authMessage.textContent = data.message || 'Login failed.';
                    authMessage.style.color = 'red';
                }
            } catch (err) {
                authMessage.textContent = 'Login error!';
                authMessage.style.color = 'red';
            }
        });
    }
});

// Logout button logic
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            document.getElementById('generatorSection').style.display = 'none';
            document.getElementById('authBox').style.display = 'block';
        });
    }
});

// Delete Account
document.addEventListener("DOMContentLoaded", () => {
    const deleteForm = document.getElementById("deleteAccountForm");
    if (deleteForm) {
        deleteForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = localStorage.getItem("loggedInUser");
            const password = document.getElementById("deletePassword").value;
            const messageBox = document.getElementById("deleteAccountMessage");

            if (!email) {
                alert("You must be logged in.");
                return;
            }

            try {
                const res = await fetch("/api/delete-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();
                messageBox.textContent = data.message || data.error;
                messageBox.style.color = res.ok ? "green" : "red";

                if (res.ok) {
                    localStorage.removeItem("loggedInUser");
                    setTimeout(() => {
                        closeDeleteAccount();
                        location.reload();
                    }, 2000);
                }
            } catch (err) {
                messageBox.textContent = "Error deleting account.";
                messageBox.style.color = "red";
            }
        });
    }
});

async function viewPlaylists() {
    const email = localStorage.getItem("loggedInUser");
    if (!email) return alert("You must be logged in.");

    const section = document.getElementById("playlistSection");
    const listDiv = document.getElementById("playlistList");
    const searchInput = document.getElementById("playlistSearch");

    // Toggle visibility
    section.classList.toggle("hidden");
    listDiv.innerHTML = "";

    if (section.classList.contains("hidden")) return;

    try {
        const res = await fetch(`/api/playlists/${email}`);
        const playlists = await res.json();

        if (!Array.isArray(playlists) || playlists.length === 0) {
            listDiv.innerHTML = "<p>No playlists found.</p>";
            return;
        }

        for (const playlist of playlists) {
            const resSongs = await fetch(`/api/playlists/songs/${playlist.id}`);
            const songs = await resSongs.json();

            const playlistContainer = document.createElement("div");
            playlistContainer.classList.add("playlist-box");

            // Playlist header with delete button
            playlistContainer.innerHTML = `
                <h3>${playlist.name}</h3>
                <button onclick="deletePlaylist(${playlist.id})" style="margin-bottom: 10px; background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 6px;">🗑 Delete Playlist</button>
            `;

            const songList = document.createElement("ul");
            songList.classList.add("playlist-songs");

            songs.forEach(song => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <strong>${song.song_name}</strong> by ${song.artist_name}
                    <a href="${song.spotify_url}" target="_blank">Listen</a>
<button class="remove-song-btn" data-playlist-id="${playlist.id}" data-song-id="${song.id}">Remove</button>
                `;
                songList.appendChild(li);
            });

            playlistContainer.appendChild(songList);
            listDiv.appendChild(playlistContainer);
        }

        // Attach Remove event listeners
        document.querySelectorAll(".remove-song-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const playlistId = btn.getAttribute("data-playlist-id");
                const songId = btn.getAttribute("data-song-id");

                try {
                    const res = await fetch(`/api/playlists/${playlistId}/songs/${songId}`, {
                        method: "DELETE"
                    });

                    const data = await res.json();
                    alert(data.message || "Song removed.");

                    // Refresh playlists view
                    viewPlaylists();
                } catch (err) {
                    console.error("Failed to remove song:", err);
                    alert("Error removing song.");
                }
            });
        });

        // Enable live filtering
        searchInput.oninput = () => {
            const term = searchInput.value.toLowerCase();
            document.querySelectorAll(".playlist-songs li").forEach(li => {
                li.style.display = li.textContent.toLowerCase().includes(term) ? "list-item" : "none";
            });
        };
    } catch (err) {
        console.error("Failed to load playlists:", err);
        listDiv.innerHTML = "<p>Error loading playlists.</p>";
    }
}

async function deletePlaylist(playlistId) {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
        const res = await fetch(`/api/playlists/${playlistId}`, {
            method: "DELETE"
        });

        const data = await res.json();
        alert(data.message || "Deleted.");

        if (res.ok) viewPlaylists(); // Refresh the playlist list
    } catch (err) {
        console.error("Failed to delete playlist:", err);
        alert("Failed to delete playlist.");
    }
}
