import PropTypes from 'prop-types';
import UserBadge from '../UserBadge';
import { Tooltip } from '@mui/material'; 


const ReactedUsers = ({ users, userInfoMap }) => {
  const groupedReactions = users.reduce((acc, reaction) => {
    if (!acc[reaction.employeeId]) {
      acc[reaction.employeeId] = [];
    }
    acc[reaction.employeeId].push(reaction);
    return acc;
  }, {});

  return (
    <div className="reacted-users-container">
      {Object.entries(groupedReactions).length > 0 ? (
        <ul className="reacted-users-list">
          {Object.entries(groupedReactions).map(([userId, reactions]) => (
            <li key={userId} className="reacted-user-item">
              <div className="user-reaction-container">
                <UserBadge userId={userId} />
                <div className="reaction-types">
                  {reactions.map((reaction) => (
                    <Tooltip 
                      key={`${userId}-${reaction.id}`}
                      title={reaction.type}
                      arrow
                      placement="top"
                    >
                      <span 
                        className={`reaction-badge reaction-${reaction.type.toLowerCase()}`}
                      >
                        {getReactionEmoji(reaction.type)}
                      </span>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-reactions-message">No reactions yet</div>
      )}
    </div>
  );
};


// Helper function to get emoji for each reaction type
const getReactionEmoji = (type) => {
  switch(type) {
    case "J'aime": return <lord-icon src="https://cdn.lordicon.com/jrvgxhep.json" trigger="morph" state="hover-up" colors="primary:#f24c00,secondary:#f4b69c" style={{ width: '40px', height: '40px' }}/> ;
    case 'Bravo': return <lord-icon src="https://cdn.lordicon.com/hlpsxaub.json" trigger="morph" colors="primary:#f4b69c,secondary:#3a3347" style={{ width: '40px', height: '40px' }}/>;
    case 'Jadore': return <lord-icon src="https://cdn.lordicon.com/dqhmanhc.json" trigger="morph" state="morph-glitter" style={{ width: '40px', height: '40px' }}/>;
    case 'Youpi': return <lord-icon src="https://cdn.lordicon.com/mhnfcfpf.json" trigger="morph" colors="primary:#4bb3fd,secondary:#ffc738,tertiary:#f28ba8,quaternary:#f24c00" style={{ width: '40px', height: '40px' }}/>;
    case 'Brillant': return <lord-icon src="https://cdn.lordicon.com/edplgash.json" trigger="morph" style={{ width: '40px', height: '40px' }}/>;
    default: return <lord-icon src="https://cdn.lordicon.com/jrvgxhep.json" trigger="morph" state="hover-up" colors="primary:#f24c00,secondary:#f4b69c" style={{ width: '40px', height: '40px' }}/>;
  }
};

ReactedUsers.propTypes = {
  users: PropTypes.array.isRequired,
  userInfoMap: PropTypes.object,
};

export default ReactedUsers;