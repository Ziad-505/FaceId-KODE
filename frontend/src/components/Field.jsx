import { baseStyles } from "../config/theme";

export function Field({ id, label, value, onChange, placeholder, autoFocus, onKeyDown, type = "text", autoComplete, required }) {
  return (
    <div>
      {label && (
        <label style={baseStyles.label} htmlFor={id}>
          {label}{required && <span style={{ color: "var(--err)", marginLeft: 3 }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={baseStyles.input}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        onKeyDown={(e) => onKeyDown?.(e.key)}
      />
    </div>
  );
}
