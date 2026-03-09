import React from "react";
import { Icon } from "./Icon";

// PUBLIC_INTERFACE
export function Input({
  value,
  onChange,
  placeholder,
  ariaLabel,
  leftIcon,
  type = "text",
  name,
  autoComplete
}) {
  /** Input control with optional left icon. */
  return (
    <div style={{ position: "relative" }}>
      {leftIcon ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b7280"
          }}
        >
          <Icon name={leftIcon} />
        </div>
      ) : null}
      <input
        className="input"
        style={leftIcon ? { paddingLeft: 36 } : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        type={type}
        name={name}
        autoComplete={autoComplete}
      />
    </div>
  );
}
