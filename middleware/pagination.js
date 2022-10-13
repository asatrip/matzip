const pagination = (pnResult, queryData, queryKeyName, listCount) => {
  const contentSize = listCount || 10;
  const pnSizeInput = 5;
  let pnNum = 0, pnTotal = 0, offset = 0, pnStart = 0, pnEnd = 0, queryLimit = '';
  let pnSize = pnSizeInput || 10;
  if (queryData && Object.keys(queryData).filter(key => key === queryKeyName)) {
    pnNum = Number(queryData[`${queryKeyName}`]) || 1;
  }
  pnStart = (Math.ceil(pnNum / pnSize) - 1) * pnSize + 1;
  // pnEnd = (pnStart + pnSize) - 1;
  pnEnd = (pnStart + pnSize);
  const totalCount = pnResult[0].count;
  if (contentSize !== 0 && contentSize !== null) {
    pnTotal = Math.ceil(totalCount / contentSize);
    if (pnEnd > pnTotal) pnEnd = pnTotal;
    if ((pnNum - 1) * contentSize > 0) {
      offset = (pnNum - 1) * contentSize;
    }
    queryLimit = `LIMIT ${offset}, ${contentSize}`;
  }
  return {
    pnNum,
    pnStart,
    pnEnd,
    pnTotal,
    queryLimit,
    pnSize,
    totalCount,
  };
};

module.exports = pagination;