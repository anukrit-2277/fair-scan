import './Spinner.css';

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div className={`spinner spinner--${size} ${className}`}>
      <div className="spinner__ring" />
    </div>
  );
};

export default Spinner;
