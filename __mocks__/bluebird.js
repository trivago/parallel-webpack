const then = jest.fn();
const resolve = jest.fn().mockReturnValue({ then });
const reject = jest.fn();

module.exports = {
    reject,
    resolve,
    then,
};
