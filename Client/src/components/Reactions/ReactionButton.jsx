import PropTypes from 'prop-types';

const ReactionButton = ({ type, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
      }
    }}
    className={`reaction-button ${isActive ? 'active' : ''}`}
    aria-label={`React with ${type}`}
    tabIndex={0}
  >
    {icon}
  </button>
);

ReactionButton.propTypes = {
  type: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ReactionButton;