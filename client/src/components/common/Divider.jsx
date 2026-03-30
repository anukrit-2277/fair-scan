import './Divider.css';

const Divider = ({ text }) => {
  if (text) {
    return (
      <div className="divider divider--text">
        <span>{text}</span>
      </div>
    );
  }
  return <hr className="divider" />;
};

export default Divider;
