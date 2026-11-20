import { useState } from "react";

import { BRAND_NAME } from "../brand";
import { RouteLink } from "../components/AppLayout";
import CampusMotion from "../components/CampusMotion";
import HomeBookingPreview from "../components/HomeBookingPreview";
import HomeChatStory from "../components/HomeChatStory";
import HomeSpaces from "../components/HomeSpaces";

const EXAMPLES = {
  student: {
    label: "For students",
    before: "You find a free desk today, but tomorrow you’re back to looking for a seat.",
    after: "Pick a numbered desk once and keep that same seat for 7, 14, or 30 days, depending on your pass and availability.",
    link: "Compare seat passes", route: "/plans",
  },
  teacher: {
    label: "For teachers",
    before: "You want to run a revision session but still need to find a room with enough seats and a projector.",
    after: "Filter for teaching rooms, check the amenities and time, then request the entire room for your class.",
    link: "Find teaching rooms", route: "/teaching",
  },
};

const FAQ = [
  ["What can I book as a student?", "Pick a time and a numbered seat in a lab, classroom, or library for instant confirmation. For courts and seminar venues, request the whole space. A study pass lets you keep the same desk for several days."],
  ["Can I teach in the library?", "No. Library and study spaces are for studying. Verified teachers can request an entire classroom or teaching hall from the teaching-room directory."],
  ["How do I get teacher access?", "Create an account, then ask your campus administrator to verify and enable teacher access. Picking an account type on a public form cannot grant teacher access."],
  ["Does a seat pass renew or charge me?", "No. This is a demo: the displayed INR prices are illustrative. Passes end automatically and the site does not collect payment or renew them."],
  ["How does approval work?", "Seats are confirmed as soon as you book. Whole-space requests go to an administrator, who checks availability again before approving. You can see the result in My bookings."],
  ["Can I cancel a booking or seat pass?", "Use My bookings to manage eligible single-session requests. The Seat passes page shows your passes and lets you release a seat pass that has not expired."],
];

function CampusMap() {
  return (
    <div className="campus-map" aria-hidden="true">
      <div className="campus-map-top"><span><i /> CAMPUS SPACE MAP</span><span>ILLUSTRATION</span></div>
      <div className="campus-map-grid">
        <div className="map-room map-study"><span>STUDY DESKS</span><div className="map-desks">{Array.from({ length: 6 }, (_, index) => <i key={index} />)}</div></div>
        <div className="map-room map-class"><span>CLASSROOM</span><div className="map-desks">{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div></div>
        <div className="map-room map-hall"><span>TEACHING HALL</span><div className="map-stage" /> <div className="map-desks">{Array.from({ length: 8 }, (_, index) => <i key={index} />)}</div></div>
      </div>
      <div className="campus-map-bottom"><span><i /> Numbered seat</span><span><i /> Whole room</span></div>
    </div>
  );
}

function exploreHomeSpaces() {
  const heading = document.getElementById("home-spaces-title");
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: "start" });
}

export default function HomePage() {
  const [audience, setAudience] = useState("student");
  const example = EXAMPLES[audience];

  return (
    <div className="marketing-home">
      <section className="landing-hero" aria-labelledby="landing-title">
        <CampusMotion variant="landing" />
        <div className="landing-copy">
          <p className="landing-kicker">Campus booking for students and teachers</p>
          <h1 id="landing-title">Find your seat.<br /><em>Make room to teach.</em></h1>
          <p>Reserve a desk for your study routine or request a whole classroom for your next lesson. Check amenities and availability before you book.</p>
          <div className="landing-actions">
            <button className="button primary" type="button" onClick={exploreHomeSpaces}>Explore spaces</button>
            <RouteLink className="button outline" to="/teaching">Find a teaching room</RouteLink>
          </div>
        </div>
        <CampusMap />
      </section>

      <HomeSpaces />
      <HomeBookingPreview />
      <HomeChatStory />

      <section className="landing-section" aria-labelledby="difference-title">
        <div className="landing-section-heading"><p className="eyebrow">Two ways to book</p><h2 id="difference-title">A desk for studying. A room for teaching.</h2></div>
        <div className="audience-switch" role="group" aria-label="Booking example">
          {Object.entries(EXAMPLES).map(([key, item]) => <button key={key} type="button" aria-pressed={audience === key} onClick={() => setAudience(key)}>{item.label}</button>)}
        </div>
        <div className="booking-examples" aria-live="polite">
          <article><span>Without a booking</span><p>{example.before}</p></article>
          <article><span>With {BRAND_NAME}</span><p>{example.after}</p><RouteLink className="inline-link" to={example.route}>{example.link}</RouteLink></article>
        </div>
      </section>

      <section className="landing-section landing-faq" aria-labelledby="faq-title">
        <div className="landing-section-heading"><p className="eyebrow">Good to know</p><h2 id="faq-title">Frequently asked questions</h2></div>
        <div>{FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="home-next-step" aria-labelledby="home-next-step-title">
        <div className="landing-section-heading">
          <p className="eyebrow">Your next visit</p>
          <h2 id="home-next-step-title">Find the space you need</h2>
          <p>Browse by location, capacity, or amenities, or compare passes if you want the same desk for longer.</p>
        </div>
        <div className="home-next-actions">
          <RouteLink className="button primary" to="/facilities">Browse the directory</RouteLink>
          <RouteLink className="button outline" to="/plans">Compare seat passes</RouteLink>
        </div>
      </section>
    </div>
  );
}
