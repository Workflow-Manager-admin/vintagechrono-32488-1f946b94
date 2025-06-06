import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// PUBLIC_INTERFACE
// VintageChrono Main Container Component
// Implements all UI, logic, and responsive vintage aesthetics per requirements.
function App() {
  // --- STATE ---
  // Today's date information
  const today = new Date();
  // Set up date state: year, month, day
  const [selectedDate, setSelectedDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });

  // Wikipedia events state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI: timeline slider year
  const [sliderYear, setSliderYear] = useState(today.getFullYear());

  // UI: sound
  const [soundOn, setSoundOn] = useState(false);

  // UI: loading sound for transitions
  const quillAudioRef = useRef();

  // --- UTILS ---
  // Formats YYYY-MM-DD
  function getDateString({ year, month, day }) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }
  // Get events (Wikipedia API)
  // PUBLIC_INTERFACE
  async function fetchWikipediaEvents(dateObj) {
    setLoading(true);
    const { month, day } = dateObj;
    // Wikipedia 'On This Day' endpoint for English
    // Example: https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/3/7
    try {
      playQuill();
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
      );
      const data = await res.json();
      // Filter/trim to best 10 if many
      setEvents((data.events || []).slice(0, 10));
    } catch (e) {
      setEvents([
        {
          year: "N/A",
          text: "Failed to retrieve events for this date.",
          links: [],
        },
      ]);
    }
    setTimeout(() => setLoading(false), 900); // Show animation for a short time
  }

  // Sound
  function playTypewriter() {
    if (soundOn && window.Audio) {
      // Simple typewriter click
      let t = new window.Audio(
        "https://cdn.pixabay.com/audio/2022/12/19/audio_126bfa3cb7.mp3"
      );
      t.volume = 0.2;
      t.play();
    }
  }
  function playQuill() {
    if (soundOn && quillAudioRef.current) {
      // Fast restart
      quillAudioRef.current.pause();
      quillAudioRef.current.currentTime = 0;
      quillAudioRef.current.play();
    }
  }

  // --- EFFECTS ---
  // Load events on date change
  useEffect(() => {
    fetchWikipediaEvents(selectedDate);
    // eslint-disable-next-line
  }, [selectedDate]);

  // Update sliderYear with selected or when timeline moves
  useEffect(() => {
    setSliderYear(selectedDate.year);
  }, [selectedDate.year]);

  // --- HANDLERS ---
  // Date rotary: wheels
  function handleDateChange(part, value) {
    playTypewriter();
    setSelectedDate((prev) => {
      const update = { ...prev, [part]: value };
      // Clamp day for month/year
      let lastDay = new Date(
        update.year,
        update.month,
        0
      ).getDate(); /* month is 1-based */
      if (update.day > lastDay) update.day = lastDay;
      return update;
    });
  }

  // Timeline: pocket-watch slider
  function handleSliderYearChange(newYear) {
    playTypewriter();
    setSelectedDate((prev) => ({
      year: newYear,
      month: prev.month,
      day: prev.day > 28 ? 28 : prev.day, // clamp for February etc
    }));
  }

  // Wax seal random year
  function goToRandomYear() {
    playTypewriter();
    let rand = Math.floor(Math.random() * (today.getFullYear() - 1800 + 1)) + 1800;
    setSelectedDate((prev) => ({
      year: rand,
      month: prev.month,
      day: prev.day,
    }));
  }

  // Typewriter key: "My Birth Year"
  function goToBirthYear() {
    playTypewriter();
    let y = window.prompt("Enter your birth year (e.g. 1984):");
    let yearInt = parseInt(y);
    if (yearInt && yearInt > 1800 && yearInt <= today.getFullYear())
      setSelectedDate((prev) => ({
        year: yearInt,
        month: prev.month,
        day: prev.day,
      }));
  }

  // --- RENDER ---
  return (
    <div className="vintage-app parchment-bg">
      {/* Sound & Page Animation assets (hidden) */}
      <audio
        ref={quillAudioRef}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_115bff429c.mp3"
        preload="auto"
        style={{ display: "none" }}
      />

      {/* Vintage Masthead */}
      <header className="vintage-masthead">
        <span
          className="masthead-text"
          style={{ fontFamily: "Cormorant Garamond, Playfair Display, serif" }}
        >
          <span className="dropcap-v">𝒫𝒶𝓈𝓉</span>
          Blast
        </span>
        <span className="masthead-sub">VintageChrono</span>
      </header>

      {/* Main Content */}
      <main className="chronomain">
        {/* Rotary Date Picker */}
        <section className="rotary-date-picker" aria-label="Pick a date">
          <DialSelector
            label="Day"
            value={selectedDate.day}
            min={1}
            max={new Date(selectedDate.year, selectedDate.month, 0).getDate()}
            onChange={(v) => handleDateChange("day", Number(v))}
            accent
          />
          <DialSelector
            label="Month"
            value={selectedDate.month}
            min={1}
            max={12}
            onChange={(v) => handleDateChange("month", Number(v))}
          />
          <DialSelector
            label="Year"
            value={selectedDate.year}
            min={1800}
            max={today.getFullYear()}
            onChange={(v) => handleDateChange("year", Number(v))}
          />
        </section>

        {/* Pocket Watch Timeline Slider */}
        <section
          className="pocket-timeline"
          aria-label="Timeline slider"
        >
          <PocketWatchSlider
            year={sliderYear}
            min={1800}
            max={today.getFullYear()}
            onChange={handleSliderYearChange}
          />
        </section>

        {/* Action Buttons */}
        <section className="action-buttons">
          <button
            aria-label="Surprise: Jump to a random year!"
            className="wax-seal-btn"
            onClick={goToRandomYear}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goToRandomYear()}
            title="Random Year"
            type="button"
          >
            🧧
            <span className="seal-text">Random Year</span>
          </button>
          <button
            aria-label="Go to My Birth Year"
            className="typewriter-btn"
            onClick={goToBirthYear}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && goToBirthYear()}
            type="button"
          >
            📰
            <span className="tw-text">My Birth Year</span>
          </button>
        </section>

        {/* Event Feed */}
        <section className="event-feed newspaper-bg" aria-live="polite">
          {loading && (
            <LoadingAnimation />
          )}
          {!loading && events && (
            <EventsFeed events={events} dateObj={selectedDate} />
          )}
        </section>
      </main>

      {/* Footer: Sound Toggle & Credits */}
      <footer className="vintage-footer">
        <button
          className={`sound-toggle-btn${soundOn ? " active" : ""}`}
          aria-label={soundOn ? "Mute typewriter/phonograph sounds" : "Enable typewriter/phonograph sounds"}
          onClick={() => setSoundOn((v) => !v)}
          type="button"
        >
          {soundOn ? "🔊 Sound On" : "🔈 Sound Off"}
        </button>
        <div className="footer-credits">
          <span>
            <span role="img" aria-label="Quill">
              🪶
            </span>{" "}
            VintageChrono | PastBlast &mdash; Powered by Wikipedia
          </span>
        </div>
      </footer>
    </div>
  );
}

// --- DIAL SELECTOR (Rotary/Brass Dial) ---
function DialSelector({ label, min, max, value, onChange, accent }) {
  // Create dial options
  let items = [];
  for (let i = min; i <= max; i++) {
    items.push(i);
  }
  return (
    <div className={`dial-selector${accent ? " accent" : ""}`}>
      <label className="dial-label">{label}</label>
      <div className="dial-drum" role="listbox" tabIndex={0} aria-label={label}>
        <button
          className="dial-btn"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          tabIndex={0}
          type="button"
        >
          ◀
        </button>
        <span className="dial-number">{value}</span>
        <button
          className="dial-btn"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          tabIndex={0}
          type="button"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

// --- POCKET WATCH TIMELINE SLIDER ---
function PocketWatchSlider({ year, min, max, onChange }) {
  const sliderRef = useRef();
  // Themed "face" & pointer; keyboard accessible.
  return (
    <div className="pocket-watch-slider" tabIndex={0}>
      <div className="watch-face">
        <div className="watch-center">
          <span className="watch-label">Year: {year}</span>
        </div>
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          value={year}
          className="timeline-range"
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Year timeline slider"
        />
        <div className="watch-marks">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}

// --- NEWSPAPER EVENTS FEED ---
function EventsFeed({ events, dateObj }) {
  if (!events.length)
    return <div className="no-events">No historical records found for this date.</div>;
  const humanDate = new Date(
    dateObj.year,
    dateObj.month - 1,
    dateObj.day
  ).toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return (
    <div>
      <h2 className="events-headline">
        ⏳ Newspaper Clippings: {humanDate}
      </h2>
      <div className="clipping-list">
        {events.map((ev, idx) => (
          <NewspaperClipping key={idx} event={ev} idx={idx} />
        ))}
      </div>
    </div>
  );
}

// --- NEWSPAPER CLIPPING CARD ---
function NewspaperClipping({ event, idx }) {
  // Use random smudge for accent/hover
  return (
    <article className="clipping-card" tabIndex={0}>
      <div className="clipping-year">{event.year || "?"}</div>
      <div className="clipping-content">
        <div className="clipping-text">{event.text || ""}</div>
        {event.links && event.links.length > 0 && (
          <div className="clipping-links">
            {event.links.slice(0, 2).map((l, i) => (
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="clipping-link"
                key={l.page + i}
                tabIndex={0}
                title={l.title}
              >{l.title || l.page}</a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

// --- LOADING ANIMATION (Paper/Quill) ---
function LoadingAnimation() {
  // Quill writing animation with sheet movement
  return (
    <div className="loading-anim" aria-label="Loading">
      <div className="paper-flip">
        <div className="paper"></div>
      </div>
      <div className="quill"></div>
      <div className="loading-text">Loading...</div>
    </div>
  );
}

export default App;
