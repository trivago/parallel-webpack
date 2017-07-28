const end = jest.fn();
const workerFarm = jest.fn(() => end);
workerFarm.end = end;
module.exports = workerFarm;
