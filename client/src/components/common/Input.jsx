import { useState, forwardRef } from 'react';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import './Input.css';

const Input = forwardRef(({
  label,
  error,
  icon,
  type = 'text',
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && <label className="input-group__label">{label}</label>}
      <div className="input-group__wrapper">
        {icon && <span className="input-group__icon">{icon}</span>}
        <input
          ref={ref}
          type={inputType}
          className={`input-group__field ${icon ? 'input-group__field--has-icon' : ''} ${isPassword ? 'input-group__field--has-toggle' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="input-group__toggle"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
          </button>
        )}
      </div>
      {error && <span className="input-group__error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
