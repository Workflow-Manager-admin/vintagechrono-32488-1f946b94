import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// PUBLIC_INTERFACE
// VintageChrono Main Container Component
// Implements all UI, logic, and responsive vintage aesthetics per requirements.
// Now including: Wikipedia 'On This Day' API integration, all interactive controls,
// loading animation, accessibility and responsiveness.
function App() {
  // --- STATE MANAGEMENT ---
  // Today
  const today = new Date();

  // Selected date (year, month, day)
  const [selectedDate, setSelectedDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });

  // Event feed (Wikipedia: On This Day)
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Timeline slider year (mirrors selected year)
  const [sliderYear, setSliderYear] = useState(today.getFullYear());

  // Sound state for toggling effects
  const [soundOn, setSoundOn] = useState(false);

  // Store last fetch date for minimal loads (avoid duplicate API fetches)
  const lastFetchedDate = useRef(null);

  // Refs for sound samples
  const quillAudioRef = useRef();

  // --- UTILITY: Clamp last valid DOM date for year/month ---
  function clampDay(year, month, desiredDay) {
    // month is 1-based; day must be valid for the month (28/29/30/31)
    const daysInMonth = new Date(year, month, 0).getDate();
    return Math.min(desiredDay, daysInMonth);
  }

  // --- API: Fetch events for current selected date (Wikipedia) ---
  // PUBLIC_INTERFACE
  async function fetchWikipediaEvents(dateObj) {
    setLoading(true);

    const { month, day } = dateObj;
    // Prevent duplicate/refetch if no change
    const fetchKey = `${month}-${day}`;
    if (lastFetchedDate.current === fetchKey) {
      setLoading(false);
      return;
    }
    lastFetchedDate.current = fetchKey;

    // Loading sound
    playQuill();

    try {
      // Wikipedia "On This Day" endpoint; e.g. .../events/7/4
      const resp = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
      );
      // Throw error if not OK
      if (!resp.ok) throw new Error("API Error");

      // API delivers shape: { events: [{year, text, pages, ...}] }
      const data = await resp.json();
      // Only take 5-10 events
      setEvents((data.events || []).slice(0, 10));
    } catch (err) {
      setEvents([
        {
          year: "N/A",
          text: "Failed to retrieve events for this date.",
          links: [],
        },
      ]);
    }
    // Give a short min time for animation
    setTimeout(() => setLoading(false), 800);
  }

  // --- SOUND EFFECTS ---
  function playTypewriter() {
    if (soundOn && typeof window !== "undefined" && window.Audio) {
      const t = new window.Audio("https://cdn.pixabay.com/audio/2022/12/19/audio_126bfa3cb7.mp3");
      t.volume = 0.19;
      t.play();
    }
  }
  function playQuill() {
    if (soundOn && quillAudioRef.current) {
      quillAudioRef.current.pause();
      quillAudioRef.current.currentTime = 0;
      quillAudioRef.current.play();
    }
  }

  // --- HANDLERS: All UI Interactivity ---
  function handleDateChange(part, value) {
    playTypewriter();
    setSelectedDate((prev) => {
      let next = { ...prev, [part]: value };
      // When changing month/year: clamp day just in case (for Feb/leap/short months)
      next.day = clampDay(next.year, next.month, next.day);
      return next;
    });
  }
  function handleSliderYearChange(year) {
    playTypewriter();
    setSelectedDate((prev) => ({
      ...prev,
      year,
      // Clamp day for Feb/short months
      day: clampDay(year, prev.month, prev.day),
    }));
  }
  function goToRandomDate() {
    playTypewriter();
    // Random year/month/day within valid ranges
    const randomYear = Math.floor(Math.random() * (today.getFullYear() - 1800 + 1)) + 1800;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const maxDay = new Date(randomYear, randomMonth, 0).getDate();
    const randomDay = Math.floor(Math.random() * maxDay) + 1;
    setSelectedDate({
      year: randomYear,
      month: randomMonth,
      day: randomDay,
    });
  }
  function goToBirthYear() {
    playTypewriter();
    let y = window.prompt("Enter your birth year (e.g. 1984):");
    let yearInt = parseInt(y);
    if (yearInt && yearInt > 1800 && yearInt <= today.getFullYear()) {
      setSelectedDate((prev) => ({
        ...prev,
        year: yearInt,
        day: clampDay(yearInt, prev.month, prev.day),
      }));
    }
  }

  // --- UI EFFECTS: Reload events on date change ---
  useEffect(() => {
    fetchWikipediaEvents(selectedDate);
    setSliderYear(selectedDate.year); // keep UI timeline in sync
    // eslint-disable-next-line
  }, [selectedDate.month, selectedDate.day]); // always refetch if month/day changes

  useEffect(() => {
    // If user changes year via rotary or slider, sync sliderYear
    setSliderYear(selectedDate.year);
  }, [selectedDate.year]);

  // --- JSX-RENDER ---
  return (
    <div className="vintage-app parchment-bg">
      {/* Audio assets for effects (hidden) */}
      <audio
        ref={quillAudioRef}
        src="https://cdn.pixabay.com/audio/2022/03/15/audio_115bff429c.mp3"
        preload="auto"
        style={{ display: "none" }}
        aria-hidden="true"
      />
      {/* Masthead */}
      <header className="vintage-masthead">
        <span
          className="masthead-text"
          style={{ fontFamily: "Cormorant Garamond, Playfair Display, serif" }}
        >
          <span className="dropcap-v" aria-hidden="true">𝒫𝒶𝓈𝓉</span>
          Blast
        </span>
        <span className="masthead-sub">VintageChrono</span>
      </header>

      <main className="chronomain">
        {/* Rotary Date Picker - dial controls */}
        <section className="rotary-date-picker" aria-label="Pick a date">
          <DropdownDial
            label="Day"
            value={selectedDate.day}
            min={1}
            max={new Date(selectedDate.year, selectedDate.month, 0).getDate()}
            onChange={v => handleDateChange("day", Number(v))}
            accent
            options={Array.from({length: new Date(selectedDate.year, selectedDate.month, 0).getDate()}, (_, i) => i + 1)}
          />
          <DropdownDial
            label="Month"
            value={selectedDate.month}
            min={1}
            max={12}
            onChange={v => handleDateChange("month", Number(v))}
            options={Array.from({length: 12}, (_, i) => i + 1)}
            monthNames={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
          />
          <DropdownDial
            label="Year"
            value={selectedDate.year}
            min={1800}
            max={today.getFullYear()}
            onChange={v => handleDateChange("year", Number(v))}
            options={Array.from({length: today.getFullYear() - 1800 + 1}, (_,i)=> 1800 + i)}
          />
        </section>

        {/* Timeline: Pocket Watch Slider */}
        <section className="pocket-timeline" aria-label="Timeline slider">
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
            aria-label="Surprise: Jump to a random date!"
            className="wax-seal-btn"
            onClick={goToRandomDate}
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && goToRandomDate()}
            title="Random Date"
            type="button"
          >
            🎲 <span className="seal-text">Random Date</span>
          </button>
          <button
            aria-label="Go to My Birth Year"
            className="typewriter-btn"
            onClick={goToBirthYear}
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && goToBirthYear()}
            type="button"
          >
            📰 <span className="tw-text">My Birth Year</span>
          </button>
        </section>

        {/* Event Feed (with loading animation and accessibility/aria) */}
        <section className="event-feed newspaper-bg" aria-live="polite">
          {loading && <LoadingAnimation />}
          {!loading && events && <EventsFeed events={events} dateObj={selectedDate} />}
        </section>
      </main>

      {/* Footer: sound toggle & credits */}
      <footer className="vintage-footer">
        <button
          className={`sound-toggle-btn${soundOn ? " active" : ""}`}
          aria-label={soundOn
            ? "Mute typewriter/phonograph sounds"
            : "Enable typewriter/phonograph sounds"
          }
          onClick={() => setSoundOn(v => !v)}
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
