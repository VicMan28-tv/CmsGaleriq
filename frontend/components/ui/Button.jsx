// frontend/components/ui/Button.jsx
export default function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-galeriq-primary text-white font-medium shadow-glow anim-in hover:bg-violet-600 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
