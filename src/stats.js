const statsCollectionTotal = {
  startTime: new Date(),
};

const statsCollectionByDate = {
  startTime: new Date(),
};

const getYearMonthDay = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return { year, month, day };
};

const report = (title) => {
  statsCollectionTotal[title] = (statsCollectionTotal[title] || 0) + 1;

  const { year, month, day } = getYearMonthDay();

  statsCollectionByDate[year] = statsCollectionByDate[year] || {};
  statsCollectionByDate[year][month] = statsCollectionByDate[year][month] || {};
  statsCollectionByDate[year][month][day] = statsCollectionByDate[year][month][day] || {};
  statsCollectionByDate[year][month][day][title] = (statsCollectionByDate[year][month][day][title] || 0) + 1;
};

// const getStatsOnDate = (date) => {
//   const { year, month, day } = getYearMonthDay(date);
//   return ((statsCollectionByDate[year] || {})[month] || {})[day] || {};
// };

const getStats = () => {
  // const yesterday = getStatsOnDate(new Date(new Date().setDate(-1)));

  return {
    // yesterday,
    statsCollectionTotal,
    statsCollectionByDate,
  };
};

module.exports = { report, getStats };
