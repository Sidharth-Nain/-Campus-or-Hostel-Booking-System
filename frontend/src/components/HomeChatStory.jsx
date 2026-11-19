import { useEffect, useRef, useState } from "react";

import { RouteLink } from "./AppLayout";
import "../home-chat-story.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const MESSAGE_INTERVAL_SECONDS = 2;
const MESSAGES = [
  { from: "Daksh", text: "I’m five minutes away. Will there still be a seat at the library?" },
  { from: "Arhan", text: "Don’t stress. We can use Campus Flow." },
  { from: "Daksh", text: "What’s Campus Flow?" },
  { from: "Arhan", text: "It lets you reserve a numbered study desk online and go straight to it when you arrive. Give me a minute." },
  { from: "Arhan", text: "I got my desk! See if the one next to me is free.", receipt: true },
  { from: "Daksh", text: "Perfect. See you in five!" },
];

function prefersReducedMotion() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(REDUCED_MOTION).matches);
}

function SampleSeatReceipt() {
  return (
    <figure className="chat-story-receipt" aria-label="Sample seat reservation, no booking was made">
      <div className="chat-story-receipt-top">
        <figcaption>Sample reservation</figcaption>
        <span>Reserved · Demo</span>
      </div>
      <div className="chat-story-receipt-body">
        <div><strong>Quiet Study Desks</strong><span>Arhan · Focus Week · 7 days</span></div>
        <div className="chat-story-receipt-seat"><span>Desk</span><strong>07</strong></div>
      </div>
    </figure>
  );
}

export default function HomeChatStory() {
  const chatRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [phase, setPhase] = useState(() => (
    typeof IntersectionObserver === "function" && !prefersReducedMotion() ? "waiting" : "complete"
  ));
  const [take, setTake] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia?.(REDUCED_MOTION);
    function updatePreference(event) {
      setReducedMotion(event.matches);
      if (event.matches) setPhase("complete");
    }
    preference?.addEventListener?.("change", updatePreference);
    return () => preference?.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || phase !== "waiting" || !chatRef.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setPhase((current) => current === "waiting" ? "playing" : current);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(chatRef.current);
    return () => observer.disconnect();
  }, [phase, reducedMotion]);

  function handlePlayback() {
    if (phase !== "complete") {
      setPhase("complete");
      return;
    }
    setTake((current) => current + 1);
    setPhase("playing");
  }

  return (
    <section className="home-chat-story" aria-labelledby="home-chat-story-title">
      <div className="chat-story-copy landing-section-heading">
        <p className="eyebrow">A study plan in motion</p>
        <h2 id="home-chat-story-title">Running late? Your desk can wait.</h2>
        <p className="muted">See how two friends make a library plan without counting on an empty desk when they arrive.</p>
        <RouteLink className="button primary" to="/plans">Explore student seat passes</RouteLink>
      </div>

      <div className="chat-story-window" ref={chatRef}>
        <div className="chat-story-bar">
          <span className="chat-story-avatar" aria-hidden="true">A&amp;D</span>
          <div className="chat-story-bar-copy"><strong>Arhan &amp; Daksh</strong><span>Library plans · Demo chat</span></div>
          {!reducedMotion && (
            <button className="chat-story-control" type="button" onClick={handlePlayback}>
              {phase === "complete" ? "Replay chat" : "Show full chat"}
            </button>
          )}
        </div>

        <ol className="chat-story-messages" data-phase={phase} key={take} role="list" aria-label="Sample conversation between Arhan and Daksh">
          {MESSAGES.map((message, index) => (
            <li
              className={message.from === "Arhan" ? "chat-story-message is-reply" : "chat-story-message"}
              key={message.text}
              style={{ "--message-delay": `${index * MESSAGE_INTERVAL_SECONDS}s` }}
              onAnimationEnd={index === MESSAGES.length - 1 ? () => setPhase("complete") : undefined}
            >
              <div className="chat-story-bubble">
                <strong className="chat-story-sender">{message.from}</strong>
                <p>{message.text}</p>
                {message.receipt && <SampleSeatReceipt />}
              </div>
            </li>
          ))}
        </ol>
        <p className="chat-story-note">Fictional conversation. No real booking or payment was made.</p>
      </div>
    </section>
  );
}
