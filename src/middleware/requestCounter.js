const counters = {
  total: 0,
  byEndpoint: {},
};

function counterMiddleware(req, res, next) {
  counters.total += 1;
  const key = `${req.method} ${req.baseUrl}${req.path}`;
  counters.byEndpoint[key] = (counters.byEndpoint[key] || 0) + 1;
  next();
}

function getCounters() {
  return counters;
}

function resetCounters() {
  counters.total = 0;
  counters.byEndpoint = {};
}

export { counterMiddleware, getCounters, resetCounters };
