import { useEffect, useRef, useState } from "react";

import { cancelSeatPass, getFacilities, getMySeatPasses, getSeatAvailability, getSeatPlans, reserveSeatPass } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BRAND_NAME } from "../brand";
import { RouteLink } from "../components/AppLayout";
import { ErrorState, LoadingState } from "../components/PageState";
import { authRoute } from "../router";

const ACCESS_LEVELS = ["Quiet desks", "Reading carrels and group desks", "Coding commons", "Research workstations"];
const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const campusDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
const dateLabel = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" });

function todayAtCampus() {
  const parts = Object.fromEntries(campusDate.formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function passDates(startsOn, endsOn) {
  const lastDay = new Date(endsOn);
  lastDay.setUTCDate(lastDay.getUTCDate() - 1);
  return `${dateLabel.format(new Date(startsOn))} – ${dateLabel.format(lastDay)} (inclusive)`;
}

function PlanComparison({ plans }) {
  return (
    <section className="plan-comparison" aria-labelledby="comparison-title">
      <div className="landing-section-heading"><p className="eyebrow">At a glance</p><h2 id="comparison-title">Compare seat passes</h2></div>
      <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Seat pass comparison table">
        <table>
          <thead><tr><th scope="col">What’s included</th>{plans.map((plan) => <th key={plan.id} scope="col">{plan.name}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Term</th>{plans.map((plan) => <td key={plan.id}>{plan.days} days</td>)}</tr>
            <tr><th scope="row">Demo price per term</th>{plans.map((plan) => <td key={plan.id}>{price.format(plan.price_inr)}</td>)}</tr>
            {ACCESS_LEVELS.map((access, index) => <tr key={access}><th scope="row">{access}</th>{plans.map((plan) => <td key={plan.id}>{plan.tier > index ? "Included" : "—"}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <p className="muted">Each pass reserves one seat in one eligible space, subject to availability. A higher tier gives you more spaces to choose from.</p>
    </section>
  );
}

function SeatReservation({ plans, facilities, preferredFacilityId }) {
  const { token } = useAuth();
  const preferred = facilities.find(({ id }) => String(id) === preferredFacilityId);
  const [planId, setPlanId] = useState(() => plans.find((plan) => plan.tier >= (preferred?.seat_tier ?? 1))?.id ?? "");
  const [facilityId, setFacilityId] = useState(String(preferred?.id ?? ""));
  const [startsOn, setStartsOn] = useState(todayAtCampus);
  const [seatNumber, setSeatNumber] = useState("");
  const [availability, setAvailability] = useState(null);
  const [passes, setPasses] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyPending, setHistoryPending] = useState(true);
  const [reloadHistory, setReloadHistory] = useState(0);
  const [pending, setPending] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const formHeading = useRef(null);
  const plan = plans.find(({ id }) => id === planId);
  const eligibleFacilities = facilities.filter((facility) => facility.seat_tier <= plan?.tier);

  useEffect(() => {
    let current = true;
    setHistoryPending(true);
    setHistoryError("");
    getMySeatPasses(token).then((records) => {
      if (current) setPasses(records);
    }).catch((requestError) => {
      if (current) setHistoryError(requestError.message);
    }).finally(() => {
      if (current) setHistoryPending(false);
    });
    return () => { current = false; };
  }, [token, reloadHistory]);

  function clearSelection() {
    setAvailability(null);
    setSeatNumber("");
    setError("");
    setNotice("");
  }

  function changePlan(nextPlan) {
    setPlanId(nextPlan.id);
    if (!facilities.some((facility) => String(facility.id) === facilityId && facility.seat_tier <= nextPlan.tier)) setFacilityId("");
    clearSelection();
    formHeading.current?.focus();
  }

  async function checkSeats(event) {
    event.preventDefault();
    clearSelection();
    setPending("available");
    try {
      setAvailability(await getSeatAvailability(token, { plan_id: planId, facility_id: facilityId, starts_on: startsOn }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending("");
    }
  }

  async function reserve(event) {
    event.preventDefault();
    if (!seatNumber || pending) return;
    setPending("reserving");
    setError("");
    try {
      const saved = await reserveSeatPass(token, { plan_id: planId, facility_id: Number(facilityId), seat_number: Number(seatNumber), starts_on: startsOn });
      clearSelection();
      setNotice(`Seat ${saved.seat_number} at ${saved.facility.name} is reserved. You were not charged.`);
      setReloadHistory((version) => version + 1);
    } catch (requestError) {
      setAvailability(null);
      setSeatNumber("");
      setError(requestError.message);
    } finally {
      setPending("");
    }
  }

  async function release(pass) {
    setPending("cancelling");
    setNotice("");
    setHistoryError("");
    try {
      const updated = await cancelSeatPass(token, pass.id);
      setPasses((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setAvailability(null);
      setSeatNumber("");
      setNotice(`Seat ${pass.seat_number} has been released.`);
    } catch (requestError) {
      setHistoryError(requestError.message);
    } finally {
      setConfirmId(null);
      setPending("");
    }
  }

  return (
    <>
      <PlanCards plans={plans} planId={planId} onChoose={changePlan} busy={Boolean(pending)} />
      <PlanComparison plans={plans} />
      <section className="seat-reservation card" aria-labelledby="reserve-title">
        <div className="landing-section-heading"><p className="eyebrow">Available to students</p><h2 ref={formHeading} tabIndex={-1} id="reserve-title">Reserve a numbered seat</h2><p className="muted">Choose a plan above, then find a seat for the whole term. Dates use campus time (India Standard Time).</p></div>
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        {error && <p className="form-message error" role="alert">{error}</p>}
        <form onSubmit={checkSeats}>
          <fieldset disabled={Boolean(pending)} className="seat-fields">
            <label>Study space<select required value={facilityId} onChange={(event) => { setFacilityId(event.target.value); clearSelection(); }}><option value="">Choose a space</option>{eligibleFacilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select></label>
            <label>Starts on<input type="date" required min={todayAtCampus()} value={startsOn} onChange={(event) => { setStartsOn(event.target.value); clearSelection(); }} /></label>
            <button className="button outline" type="submit">{pending === "available" ? "Checking…" : "Find seats"}</button>
          </fieldset>
        </form>
        {availability && (availability.available_seats.length ? (
          <form onSubmit={reserve}>
            <p className="muted" role="status">{availability.available_seats.length} seats free for {passDates(availability.starts_on, availability.ends_on)}.</p>
            <fieldset disabled={Boolean(pending)} className="seat-fields seat-pick">
              <label>Seat number<select required value={seatNumber} onChange={(event) => setSeatNumber(event.target.value)}><option value="">Choose a seat</option>{availability.available_seats.map((number) => <option key={number} value={number}>Seat {number}</option>)}</select></label>
              <button className="button primary" type="submit">{pending === "reserving" ? "Reserving…" : "Reserve demo pass"}</button>
            </fieldset>
          </form>
        ) : <p className="form-message error" role="status">{availability.message || "No seats are open for this term. Try another date or space."}</p>)}
      </section>
      <section className="seat-history" aria-labelledby="seat-history-title">
        <div className="landing-section-heading"><p className="eyebrow">Your reserved desks</p><h2 id="seat-history-title">My seat passes</h2></div>
        {historyPending && <p role="status">Loading seat passes…</p>}
        {historyError && <p className="form-message error" role="alert">{historyError} <button className="text-button" type="button" onClick={() => setReloadHistory((version) => version + 1)}>Reload passes</button></p>}
        {!historyError && !historyPending && passes.length === 0 && <p className="muted">You haven’t reserved a seat pass yet.</p>}
        <div className="seat-history-list">{passes.map((pass) => {
          const status = pass.status === "cancelled" ? "Cancelled" : pass.ends_on <= todayAtCampus() ? "Expired" : "Reserved";
          return <article className="seat-history-row card" key={pass.id}><div><h3>{pass.facility.name} · Seat {pass.seat_number}</h3><p>{plans.find(({ id }) => id === pass.plan_id)?.name} · {passDates(pass.starts_on, pass.ends_on)}</p></div><span className="seat-status">{status}</span>{status === "Reserved" && (confirmId === pass.id ? <div className="confirm-actions"><small>Release this seat?</small><button type="button" disabled={Boolean(pending)} onClick={() => release(pass)}>Yes, release</button><button type="button" disabled={Boolean(pending)} onClick={() => setConfirmId(null)}>Keep it</button></div> : <button type="button" className="text-button danger" disabled={Boolean(pending)} onClick={() => setConfirmId(pass.id)}>Cancel pass</button>)}</article>;
        })}</div>
      </section>
    </>
  );
}

function PlanCards({ plans, planId, onChoose, busy, loginTo }) {
  return <div className="plan-grid">{plans.map((plan) => (
    <article className={`plan-card card${plan.id === planId ? " chosen" : ""}`} key={plan.id}>
      <p className="eyebrow">{plan.days}-day pass</p><h2>{plan.name}</h2>
      <p className="plan-price">{price.format(plan.price_inr)} <span>per term</span></p>
      <p>{plan.description}</p>
      {onChoose ? <button className="button outline" type="button" onClick={() => onChoose(plan)} aria-pressed={plan.id === planId} disabled={busy}>{plan.id === planId ? "Selected plan" : "Select plan"}</button> : loginTo && <RouteLink className="button outline" to={loginTo}>Sign in to reserve</RouteLink>}
    </article>
  ))}</div>;
}

export default function PlansPage({ preferredFacilityId }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loadKey, setLoadKey] = useState(0);
  const isStudent = user?.role === "student";

  useEffect(() => {
    let current = true;
    setError("");
    Promise.all([getSeatPlans(), isStudent ? getFacilities() : []]).then(([plans, facilities]) => {
      if (current) setData({ plans, facilities: facilities.filter((facility) => facility.booking_mode === "study_seat") });
    }).catch((requestError) => {
      if (current) setError(requestError.message);
    });
    return () => { current = false; };
  }, [loadKey, isStudent]);

  if (error) return <ErrorState message={error} onRetry={() => setLoadKey((key) => key + 1)} />;
  if (!data) return <LoadingState message="Loading seat pass options…" />;
  const loginTo = !user ? authRoute("/login", preferredFacilityId ? `/plans/${preferredFacilityId}` : "/plans") : null;

  return (
    <div className="plans-page">
      <header className="plans-heading"><p className="eyebrow">{BRAND_NAME} student passes</p><h1>Same seat. <em>More time to focus.</em></h1><p>Keep a numbered seat for a week, a fortnight, or a month. Each pass ends automatically, and no payment is collected in this demo.</p></header>
      {isStudent ? <SeatReservation {...data} preferredFacilityId={preferredFacilityId} /> : <><PlanCards plans={data.plans} loginTo={loginTo} /><PlanComparison plans={data.plans} />{user && <p className="muted">Seat passes are for student accounts. <RouteLink className="inline-link" to="/teaching">Explore teaching rooms</RouteLink></p>}</>}
    </div>
  );
}
