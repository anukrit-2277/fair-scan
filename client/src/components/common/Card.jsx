import './Card.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) => {
  const classes = [
    'card',
    `card--${variant}`,
    `card--pad-${padding}`,
    hover && 'card--hover',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
