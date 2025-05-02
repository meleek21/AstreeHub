import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';

const DateSeparator = ({ date }) => {
  let separatorLabel = '';
  if (isToday(date)) {
    separatorLabel = 'Aujourd\'hui';
  } else if (isYesterday(date)) {
    separatorLabel = 'Hier';
  } else {
    separatorLabel = format(date, 'MMMM d, yyyy');
  }

  return (
    <div className="date-separator">
      <span>{separatorLabel}</span>
    </div>
  );
};

export default DateSeparator;