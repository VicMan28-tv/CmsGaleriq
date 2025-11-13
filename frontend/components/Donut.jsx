// frontend/components/Donut.jsx
export default function Donut({ percent = 72, label }) {
  const text = label ?? `${percent}%`;
  return (
    <div className="donut anim-in shadow-glow" style={{ "--pct": percent }}>
      <strong className="text-lg">{text}</strong>
    </div>
  );
}
