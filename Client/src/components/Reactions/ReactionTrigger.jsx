import PropTypes from 'prop-types';
import ReactionButton from './ReactionButton';
import { Tooltip } from '@mui/material'; // Using Material-UI Tooltip

const reactionTypes = [
  { 
    type: 'Jaime', 
    name: "j'aime",
    icon: <lord-icon src="https://cdn.lordicon.com/jrvgxhep.json" trigger="morph" state="hover-up" colors="primary:#f24c00,secondary:#f4b69c" style={{ width: '40px', height: '40px' }} /> 
  },
  { 
    type: 'Bravo', 
    name: 'Bravo',
    icon: <lord-icon src="https://cdn.lordicon.com/hlpsxaub.json" trigger="morph" colors="primary:#f4b69c,secondary:#3a3347" style={{ width: '40px', height: '40px' }}/> 
  },
  { 
    type: 'Jadore', 
    name: "j'adore",
    icon: <lord-icon src="https://cdn.lordicon.com/dqhmanhc.json" trigger="morph" state="morph-glitter" style={{ width: '40px', height: '40px' }}/> 
  },
  { 
    type: 'Youpi', 
    name: 'Youpi!',
    icon: <lord-icon src="https://cdn.lordicon.com/mhnfcfpf.json" trigger="morph" colors="primary:#4bb3fd,secondary:#ffc738,tertiary:#f28ba8,quaternary:#f24c00" style={{ width: '40px', height: '40px' }}/> 
  },
  { 
    type: 'Brillant', 
    name: 'Brilliant',
    icon: <lord-icon src="https://cdn.lordicon.com/edplgash.json" trigger="morph" style={{ width: '40px', height: '40px' }}/> 
  },
];

const ReactionTrigger = ({ 
  isHovered, 
  setIsHovered, 
  userReaction, 
  reactionSummary, 
  handleReaction 
}) => {
  const currentReaction = reactionTypes.find(r => r.type === userReaction);

  return (
    <div
      className="reaction-trigger"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tooltip 
        title={currentReaction?.name} 
        arrow
        placement="top"
      >
        <button className="reaction-trigger-button">
          {userReaction ? (
            <>
              {currentReaction?.icon}
            </>
          ) : (
            <lord-icon
    src="https://cdn.lordicon.com/msyeyaka.json"
    trigger="morph"
    stroke="bold"
    state="hover-up" style={{ width: '35px', height: '35px' }}/> 
          )}
        </button>
      </Tooltip>
      
      <div className={`reaction-buttons ${isHovered ? 'visible' : ''}`}>
        {reactionTypes.map(({ type, icon, name }) => (
          <Tooltip 
            key={type}
            title={name}
            arrow
            placement="top"
          >
            <div>
              <ReactionButton
                type={type}
                icon={icon}
                count={reactionSummary[`${type}Count`]}
                isActive={userReaction === type}
                onClick={() => handleReaction(type)}
              />
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

ReactionTrigger.propTypes = {
  isHovered: PropTypes.bool.isRequired,
  setIsHovered: PropTypes.func.isRequired,
  userReaction: PropTypes.string,
  reactionSummary: PropTypes.object.isRequired,
  handleReaction: PropTypes.func.isRequired,
};

export default ReactionTrigger;