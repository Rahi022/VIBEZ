import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './Dashboard.css';
import logo from "../assets/vibez-dashboard.png";
import { AuthContext } from "../Context/Context";
import axios from 'axios';

function Dashboard() {
  console.log('RENDERING DASHBOARD.JS');

  const [searchQuery, setSearchQuery] = useState("");
  const [nowPlaying, setNowPlaying] = useState({
    title: "Default Song",
    artist: "Default Artist",
    albumArt: "https://via.placeholder.com/150",
    audio: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3"
  });
  const [music, setMusic] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [workout, setWorkout] = useState([]);
  const [chillVibes, setChillVibes] = useState([]);
  const [message, setMessage] = useState("");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  const audioRefs = useRef([]);
  const [playingIndex, setPlayingIndex] = useState(null);

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const getMusic = async () => {
    const url = `https://spotify23.p.rapidapi.com/search/?q=${searchQuery || 'top hits'}&type=multi&offset=0&limit=10&numberOfTopResults=5`;
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '2cc44eeab1msh94f483caae01410p17fe1djsncf0fbe74aebc',
        'x-rapidapi-host': 'spotify23.p.rapidapi.com'
      }
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      const tracks = result.tracks?.items.slice(0, 5) || [];
      setMusic(tracks);
      setWorkout(tracks.slice(0, 2));
      setChillVibes(tracks.slice(2, 4));
      setRecentlyPlayed(tracks.slice(0, 4));
      console.log(result);
    } catch (error) {
      console.error("Error fetching music data:", error);
      setMessage("Failed to fetch music. Please try again later.");
    }
  };

  useEffect(() => {
    getMusic();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    getMusic();
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("spotifyToken");
      await logout();
      navigate("/signin");
    } catch (error) {
      console.error("Logout failed", error);
      setMessage("Failed to log out. Please try again.");
    }
  };

  const togglePlayPause = (index) => {
    if (playingIndex === index) {
      audioRefs.current[index].pause();
      setPlayingIndex(null);
    } else {
      if (playingIndex !== null) {
        audioRefs.current[playingIndex].pause();
      }
      audioRefs.current[index].play();
      setPlayingIndex(index);
      setNowPlaying({
        title: music[index].data.name,
        artist: music[index].data.artists.items.map(artist => artist.profile.name).join(", "),
        albumArt: music[index].data.albumOfTrack?.coverArt?.sources[0]?.url || "https://via.placeholder.com/150",
        audio: music[index].data.preview_url || "https://samplelib.com/lib/preview/mp3/sample-3s.mp3"
      });

      // Track recently played songs
      setRecentlyPlayed((prev) => {
        const newRecentlyPlayed = [...prev];
        newRecentlyPlayed.unshift(music[index]); // Add new song at the beginning
        return newRecentlyPlayed.slice(0, 4); // Keep only the last 4 songs
      });
    }
  };

  const addToFavorites = (track) => {
    if (!favorites.some(fav => fav.data.id === track.data.id)) {
      setFavorites((prev) => [...prev, track]);
    }
  };

  const removeFromFavorites = (track) => {
    setFavorites((prev) => prev.filter((fav) => fav.data.id !== track.data.id));
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <img src={logo} alt="Vibez Logo" className="logo" />
        <h1>Welcome to VIBEZ Music Player</h1>
      </header>

      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {message && <p className="error-message">{message}</p>}

      <div className="main-content">

      <section className="recommended">
        <h2>Recommended</h2>
        {music.length > 0 ? (
          music.map((track, index) => (
            <div key={index} className="recommended-track">
              {/* Display song image */}
              <br></br>
              <img
                src={track.data.albumOfTrack?.coverArt?.sources[0]?.url || "https://via.placeholder.com/150"}
                alt="Album Art"
                className="track-image"
              />
              <div className="track-info">
                <p><strong>{track.data.name || "Unknown Title"}</strong></p>
                <p>{track.data.artists.items.map(artist => artist.profile.name).join(", ") || "Unknown Artist"}</p>
              </div>
              <audio
                ref={(el) => audioRefs.current[index] = el}
                src={track.data.preview_url || "https://samplelib.com/lib/preview/mp3/sample-3s.mp3"}
              />
              <button onClick={() => togglePlayPause(index)}>
                {playingIndex === index ? 'Pause' : 'Play'}
              </button>
              <button onClick={() => addToFavorites(track)}>Like</button>
              <br></br>
            </div>
          ))
        ) : (
          <p>Loading recommended tracks...</p>
        )}
      </section>


        <section className="now-playing">
          <h2>Now Playing</h2>
          <div className="now-playing-info">
            <img src={nowPlaying.albumArt} alt="Album Art" className="album-art" />
            <div>
              <p className="song-title">{nowPlaying.title}</p>
              <p className="artist-name">{nowPlaying.artist}</p>
            </div>
          </div>
          <br></br>
          <br></br>
          <section className="playlists">
          <h2>Your Playlists</h2>
          <ul>
            <br></br>
            <li><b>Favorites</b></li>
            {favorites.map((track, index) => (
              <li key={index}>
                {track.data.name} - {track.data.artists.items.map(artist => artist.profile.name).join(", ")}
                <button onClick={() => removeFromFavorites(track)}> Discard </button>
              </li>
            ))}
          </ul>
          </section>
        </section>

        <section className="recently-played">
          <h2>Recently Played</h2>
          <ul>
            {recentlyPlayed.map((track, index) => (
              <li key={index}>
                {track.data.name} - {track.data.artists.items.map(artist => artist.profile.name).join(", ")}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <button className="logout-button" onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Dashboard;
