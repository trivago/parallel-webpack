const api = {
    error: jest.fn().mockReturnThis(),
    then: jest.fn().mockReturnThis(),
    resolve: jest.fn().mockReturnThis(),
    reject: jest.fn().mockReturnThis(),
    promisify: jest.fn().mockReturnThis(),
    settle: jest.fn().mockReturnThis(),
    all: jest.fn().mockReturnThis(),
    finally: jest.fn().mockReturnThis(),
    asCallback: jest.fn().mockReturnThis(),
};

module.exports = api;
