import React from 'react';

const SummaryCards = ({ summary }) => {
  return (
    <div className="summary-cards">
      <div className="summary-card total">
        <h3>Total des tâches</h3>
        <p>{summary.total}</p>
      </div>
      <div className="summary-card pending">
        <h3>À faire</h3>
        <p>{summary.pending}</p>
      </div>
      <div className="summary-card in-progress">
        <h3>En cours</h3>
        <p>{summary.inProgress}</p>
      </div>
      <div className="summary-card done">
        <h3>Terminé</h3>
        <p>{summary.done}</p>
      </div>
    </div>
  );
};

export default SummaryCards;