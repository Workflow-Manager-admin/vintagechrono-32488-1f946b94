import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/*
 * Util: useDebouncedSound — returns a function to play a sound with debouncing and overlap-protection
 */
// PUBLIC_INTERFACE
function useDebouncedSound(audioUrl, enabled, volume = 0.19, debounceMs = 100) {
  // audioUrl: string (path to sound)
  // enabled: boolean (sound state)
  // volume: float (0–1), default 0.19
  // debounceMs: ms between sound retriggers (to prevent "sound overlap" on fast UI)
  const lastPlayed = useRef(0);
  const audioRef = useRef(null);

  /** Returns a playSound function which triggers the sound at most once per debounce interval and prevents overlap. */
  function playSound() {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastPlayed.current < debounceMs) return;
    lastPlayed.current = now;
    try {
      // Single instance for consistent non-overlap
      if (!audioRef.current) {
        audioRef.current = new window.Audio(audioUrl);
        audioRef.current.volume = volume;
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      // Prevent stacking: only play if not already nearly playing (avoid 'popcorn' effect in extreme rapid clicks)
      // let it start; browser policy may silently ignore super-fast re-triggers
      audioRef.current.play();
    } catch {}
  }
  return playSound;
}

// PUBLIC_INTERFACE
// VintageChrono Main Container Component
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

  // Store last fetch date for minimal loads
  const lastFetchedDate = useRef(null);

  // Refs for sound samples
  const quillAudioRef = useRef();

  // --- TYPEWRITER SOUND (debounced) ---
  // Use relative path to public asset (React serves from public/ as root)
  const typewriterSound = useDebouncedSound(
    process.env.PUBLIC_URL
      ? process.env.PUBLIC_URL + "/typewriter-click.mp3"
      : "/typewriter-click.mp3",
    soundOn,
    0.21,
    92 // ms: Tune so fast UI doesn't overlap/clickstorm.
  );

  // --- UTILITY: Clamp last valid DOM date for year/month ---
  function clampDay(year, month, desiredDay) {
    // month is 1-based; day must be valid for the month (28/29/30/31)
    const daysInMonth = new Date(year, month, 0).getDate();
    return Math.min(desiredDay, daysInMonth);
  }

  // --- API: Fetch events for current selected date (Wikipedia) ---
  // PUBLIC_INTERFACE
  /**
   * Fetches "On This Day" historical events for a particular date.
   * Always triggers on any change to day, month, or year—showing a loading animation,
   * and ensures display is for the selected day/month/year only. 
   */
  async function fetchWikipediaEvents(dateObj) {
    setLoading(true);

    // Use full date for fetching and to prevent duplicate refetches
    const { year, month, day } = dateObj;
    const fetchKey = `${year}-${month}-${day}`;
    if (lastFetchedDate.current === fetchKey) {
      setLoading(false);
      return;
    }
    lastFetchedDate.current = fetchKey;

    // Loading sound
    playQuill();

    try {
      // Wikipedia "On This Day" endpoint
      const resp = await fetch(
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
      );
      if (!resp.ok) throw new Error("API Error");

      const data = await resp.json();

      let filteredEvents = [];
      if (Array.isArray(data.events)) {
        filteredEvents = data.events.filter(ev => Number(ev.year) === Number(year));
        if (filteredEvents.length < 1) {
          filteredEvents = data.events.slice(0, 10);
        }
      }

      setEvents(filteredEvents.length > 0 ? filteredEvents : [{
        year: "N/A",
        text: `No major events recorded for ${month}/${day}/${year}.`,
        links: [],
      }]);
    } catch (err) {
      setEvents([
        {
          year: "N/A",
          text: "Failed to retrieve events for this date.",
          links: [],
        },
      ]);
    }
    setTimeout(() => setLoading(false), 800);
  }

  // --- SOUND EFFECTS ---
  /** See useDebouncedSound for typewriter click. */
  function playQuill() {
    if (soundOn && quillAudioRef.current) {
      quillAudioRef.current.pause();
      quillAudioRef.current.currentTime = 0;
      quillAudioRef.current.play();
    }
  }

  // --- HANDLERS: All UI Interactivity ---
  function handleDateChange(part, value) {
    typewriterSound();
    setSelectedDate((prev) => {
      let next = { ...prev, [part]: value };
      // Clamp for Feb/leap months
      next.day = clampDay(next.year, next.month, next.day);
      return next;
    });
  }
  function handleSliderYearChange(year) {
    typewriterSound();
    setSelectedDate((prev) => ({
      ...prev,
      year,
      day: clampDay(year, prev.month, prev.day),
    }));
  }
  function goToRandomDate() {
    typewriterSound();
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
    typewriterSound();
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
    setSliderYear(selectedDate.year);
    // eslint-disable-next-line
  }, [selectedDate.year, selectedDate.month, selectedDate.day]);

  useEffect(() => {
    setSliderYear(selectedDate.year);
  }, [selectedDate.year]);

  // Attach global typewriter sound to all focus/keyboard/interactive UI (buttons, selects, input sliders)
  useEffect(() => {
    if (!soundOn) return;

    // Listeners for clicks and keys on interactive elements
    const handleUiClick = (e) => {
      // Limit to button, select, input[type="range"],[type="button"]
      const tag = e.target.tagName;
      if (
        tag === "BUTTON" ||
        tag === "SELECT" ||
        (tag === "INPUT" && ["button", "range"].includes(e.target.type))
      ) {
        typewriterSound();
      }
    };

    const handleUiKey = (e) => {
      const tag = e.target.tagName;
      // Trigger for Enter/Space/ArrowUp/ArrowDown/Left/Right on interactive el (button, select, slider)
      if (
        (tag === "BUTTON" || tag === "SELECT" ||
         (tag === "INPUT" && ["button", "range"].includes(e.target.type))) &&
        (
          e.key === "Enter" ||
          e.key === " " ||
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        )
      ) {
        typewriterSound();
      }
    };

    document.addEventListener("click", handleUiClick, true);
    document.addEventListener("keydown", handleUiKey, true);

    return () => {
      document.removeEventListener("click", handleUiClick, true);
      document.removeEventListener("keydown", handleUiKey, true);
    };
    // eslint-disable-next-line
  }, [soundOn]); // (Re-attach if toggled on/off)

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
      {/* Masthead with gradient & vintage style */}
      <header className="vintage-masthead">
        {/* --- Enhanced Premium Vintage Gradient Title --- */}
        <span
          className="masthead-text"
          style={{
            fontFamily: "Cormorant Garamond, Playfair Display, serif",
            fontWeight: 900,
            letterSpacing: 3,
            display: "inline-block",
            // Multi-stop gold/sepia gradient with subtle soft vignetting and paper blend.
            background:
              "linear-gradient(91deg, #6a4e42 5%, #bfa77a 30%, #f3e1bc 53%, #c8ad7f 70%, #eadaba 88%, #ab845a 98%), url('https://www.transparenttextures.com/patterns/old-mathematics.png')",
            backgroundBlendMode: "soft-light, multiply",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textFillColor: "transparent",
            textShadow: "0 2px 0 #bfa77a, 0 3px 12px #eadaba9c",
            filter: "contrast(1.16) brightness(1.08)",
          }}
        >
          {/* Gradient Dropcap Past */}
          <span
            className="dropcap-v"
            aria-hidden="true"
            style={{
              fontFamily: "inherit",
              fontWeight: 900,
              // Paper-blend, metallic gold gradient for the dropcap
              background:
                "linear-gradient(119deg, #bfa77a 10%, #c8ad7f 39%, #f7e5b9 65%, #ab845a 85%, #6a4e42 100%), url('https://www.transparenttextures.com/patterns/old-mathematics.png')",
              backgroundBlendMode: "overlay, multiply",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textFillColor: "transparent",
              textShadow: "0 2px 0 #ab845a99, 0 3px 12px #eadaba80",
              filter: "contrast(1.19) brightness(1.12)",
              letterSpacing: 2
            }}
          >
            𝒫𝒶𝓈𝓉
          </span>
          Blast
        </span>
        {/* Subtitle with gentle horizontal gold/sepia ribbon gradient */}
        <span
          className="masthead-sub"
          style={{
            background:
              "linear-gradient(90deg, #ab845a 9%, #eadaba 57%, #bfa77a 90%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textFillColor: "transparent",
            fontFamily: "Playfair Display, Cormorant Garamond, serif",
            letterSpacing: 2,
            fontStyle: "italic",
            fontWeight: 700,
            // Add a whisper of texture for "parchment"
            backgroundImage:
              "linear-gradient(90deg, #ab845a 9%, #eadaba 57%, #bfa77a 90%), url('https://www.transparenttextures.com/patterns/old-mathematics.png')",
            backgroundBlendMode: "soft-light, multiply",
          }}
        >
          VintageChrono
        </span>
      </header>

      <main className="chronomain">
        {/* Controls Row */}
        <section className="control-row" aria-label="All controls" style={{display: "flex", width: "100%", alignItems: "stretch", justifyContent: "center"}}>
          {/* Left side: Date Picker */}
          <div className="rotary-date-picker" style={{flex: 1, minWidth: 0, justifyContent: "flex-end", gap: "1vw"}}>
            <DropdownDial
              label="Day"
              value={selectedDate.day}
              min={1}
              max={new Date(selectedDate.year, selectedDate.month, 0).getDate()}
              onChange={v => { typewriterSound(); handleDateChange("day", Number(v)); }}
              accent
              options={Array.from({length: new Date(selectedDate.year, selectedDate.month, 0).getDate()}, (_, i) => i + 1)}
            />
            <DropdownDial
              label="Month"
              value={selectedDate.month}
              min={1}
              max={12}
              onChange={v => { typewriterSound(); handleDateChange("month", Number(v)); }}
              options={Array.from({length: 12}, (_, i) => i + 1)}
              monthNames={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]}
            />
            <DropdownDial
              label="Year"
              value={selectedDate.year}
              min={1800}
              max={today.getFullYear()}
              onChange={v => { typewriterSound(); handleDateChange("year", Number(v)); }}
              options={Array.from({length: today.getFullYear() - 1800 + 1}, (_,i)=> 1800 + i)}
            />
          </div>
          {/* Center: Random Date Button */}
          <div className="action-buttons inline-action" style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 2vw",
            minWidth: 0
          }}>
            <button
              aria-label="Surprise: Jump to a random date!"
              className="wax-seal-btn"
              onClick={() => { typewriterSound(); goToRandomDate(); }}
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter") { typewriterSound(); goToRandomDate(); } }}
              title="Random Date"
              type="button"
              style={{
                margin: "0 auto",
                display: "block"
              }}
            >
              🎲 <span className="seal-text">Random Date</span>
            </button>
          </div>
          {/* Right side: Timeline Slider */}
          <div className="timeline-row" style={{flex: 1, minWidth: 0, justifyContent: "flex-start", display: "flex"}}>
            <PocketWatchSlider
              year={sliderYear}
              min={1800}
              max={today.getFullYear()}
              onChange={val => { typewriterSound(); handleSliderYearChange(val); }}
            />
          </div>
        </section>

        {/* Event Feed */}
        <section className="event-feed newspaper-bg" aria-live="polite">
          {loading && <LoadingAnimation />}
          {!loading && events && <EventsFeed events={events} dateObj={selectedDate} />}
        </section>
      </main>

      {/* Footer: Only credits, no sound toggle */}
      <footer className="vintage-footer">
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

/**
 * DropdownDial: Date part picker in a rotary drum style with dropdown menu inside.
 * Vintage-styled for maximum authenticity; supports months with short names option.
 */
function DropdownDial({
  label,
  min,
  max,
  value,
  onChange,
  accent,
  options,
  monthNames
}) {
  return (
    <div className={`dial-selector${accent ? " accent" : ""}`}>
      <label className="dial-label">{label}</label>
      <div className="dial-drum" aria-label={label}>
        <button
          className="dial-btn"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          tabIndex={0}
          type="button"
        >
          ◀
        </button>
        {/* Inline dropdown */}
        <select
          className="dial-number"
          aria-label={`Select ${label}`}
          style={{
            fontSize: "1.19em",
            border: "none",
            background: "transparent",
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900,
            color: "inherit",
            textAlign: "center",
            appearance: "none",
            WebkitAppearance: "none",
            outline: "none",
            cursor: "pointer"
          }}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        >
          {options
            ? options.map((v, i) => (
                <option key={v} value={v}>
                  {monthNames && label === "Month"
                    ? monthNames[v-1]
                    : v}
                </option>
              ))
            : Array.from({ length: max - min + 1 }, (_, i) =>
                <option key={min + i} value={min + i}>{min + i}</option>
              )}
        </select>
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
