import "../campus-motion.css";

const TRAILS = [
  "M-80 385C105 512 227 155 427 201S738 345 1035 40",
  "M-80 423C98 542 226 214 432 224S763 374 1035 93",
  "M-80 459C115 573 229 266 440 253S786 400 1035 145",
  "M-80 494C115 592 241 315 451 286S831 429 1035 204",
];

export default function CampusMotion({ variant = "site" }) {
  return (
    <div className={`campus-motion campus-motion--${variant}`} aria-hidden="true">
      <svg viewBox="0 0 960 580" fill="none" focusable="false">
        <g className="campus-motion__sweep">
          <g className="campus-motion__tracks">
            {TRAILS.map((path) => <path key={path} d={path} />)}
          </g>
          <g className="campus-motion__signals">
            {TRAILS.map((path) => <path key={path} d={path} pathLength="100" />)}
          </g>
        </g>
      </svg>
    </div>
  );
}
