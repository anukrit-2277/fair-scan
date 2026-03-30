import './Logo.css';

const Logo = ({ size = 'md', withText = true }) => {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`logo logo--${size}`}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="4"
          y="4"
          width="40"
          height="40"
          rx="12"
          fill="url(#logo-gradient)"
        />
        <path
          d="M16 18H32M16 24H28M16 30H24"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="34" cy="30" r="6" stroke="white" strokeWidth="2" fill="none" />
        <line x1="38.5" y1="34.5" x2="42" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="logo-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6C5CE7" />
            <stop offset="1" stopColor="#A29BFE" />
          </linearGradient>
        </defs>
      </svg>
      {withText && <span className="logo__text">FairScan</span>}
    </div>
  );
};

export default Logo;
