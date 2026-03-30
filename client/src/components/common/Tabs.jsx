import { motion } from 'framer-motion';
import './Tabs.css';

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tabs__item ${active === tab.id ? 'tabs__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="tabs__item-icon">{tab.icon}</span>}
          <span>{tab.label}</span>

          {active === tab.id && (
            <motion.div
              className="tabs__indicator"
              layoutId="tab-indicator"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
