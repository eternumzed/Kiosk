const test = require('node:test');
const assert = require('node:assert/strict');

const axios = require('axios');
const Counter = require('../models/counter');
const Request = require('../models/requestSchema');
const requestController = require('../controllers/requestController');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function mockCreateDoc(referenceNumber = 'FTJSC-2026-0001') {
  return {
    referenceNumber,
    toObject() {
      return {
        referenceNumber,
        fullName: 'Juan Dela Cruz',
        document: 'first time job seeker certificate',
      };
    },
    async save() {
      return this;
    },
  };
}

const original = {
  counterFindOneAndUpdate: Counter.findOneAndUpdate,
  requestFindOne: Request.findOne,
  requestCreate: Request.create,
  axiosPost: axios.post,
};

test.afterEach(() => {
  Counter.findOneAndUpdate = original.counterFindOneAndUpdate;
  Request.findOne = original.requestFindOne;
  Request.create = original.requestCreate;
  axios.post = original.axiosPost;
});

test('create-request returns 409 when active FTJSC duplicate exists', async () => {
  Counter.findOneAndUpdate = async () => ({ seq: 1 });
  Request.findOne = () => ({ lean: async () => ({ _id: 'existing' }) });

  let createCalled = false;
  Request.create = async () => {
    createCalled = true;
    return mockCreateDoc();
  };

  axios.post = async () => ({ data: { success: true } });

  const req = {
    headers: {},
    body: {
      fullName: 'Juan Dela Cruz',
      email: 'juan@example.com',
      contactNumber: '09123456789',
      address: 'Zone 1',
      document: 'first time job seeker certificate',
      zone: '1',
      lengthOfResidency: '10 years',
    },
  };
  const res = createMockRes();

  await requestController.createRequest(req, res);

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, {
    error: 'You already requested a First Time Job Seeker Certificate under this full name.',
  });
  assert.equal(createCalled, false);
});

test('create-request duplicate query normalizes case/spacing', async () => {
  Counter.findOneAndUpdate = async () => ({ seq: 2 });

  let duplicateQuery = null;
  Request.findOne = (query) => {
    duplicateQuery = query;
    return { lean: async () => ({ _id: 'existing' }) };
  };

  Request.create = async () => mockCreateDoc('FTJSC-2026-0002');
  axios.post = async () => ({ data: { success: true } });

  const req = {
    headers: {},
    body: {
      fullName: '  JUAN   dela   CRUZ  ',
      email: 'juan@example.com',
      contactNumber: '09123456789',
      address: 'Zone 1',
      document: 'first time job seeker certificate',
      zone: '1',
      lengthOfResidency: '10 years',
    },
  };
  const res = createMockRes();

  await requestController.createRequest(req, res);

  assert.ok(duplicateQuery);
  assert.equal(duplicateQuery.documentCode, 'FTJSC');
  assert.deepEqual(duplicateQuery.status, { $ne: 'Cancelled' });
  assert.deepEqual(duplicateQuery.deleted, { $ne: true });
  assert.equal(duplicateQuery.$or[0].fullNameNormalized, 'juan dela cruz');
  assert.equal(duplicateQuery.$or[1].fullName.test('Juan Dela Cruz'), true);
  assert.equal(duplicateQuery.$or[1].fullName.test('  juan    dela   cruz  '), true);
  assert.equal(duplicateQuery.$or[1].fullName.test('Juan X Cruz'), false);
  assert.equal(res.statusCode, 409);
});

test('create-request allows FTJSC re-request when only cancelled/deleted records exist', async () => {
  Counter.findOneAndUpdate = async () => ({ seq: 3 });

  let duplicateQuery = null;
  Request.findOne = (query) => {
    duplicateQuery = query;
    return { lean: async () => null };
  };

  let createdPayload = null;
  Request.create = async (payload) => {
    createdPayload = payload;
    return mockCreateDoc('FTJSC-2026-0003');
  };

  axios.post = async () => ({ data: { checkoutUrl: 'https://example.test/checkout' } });

  const req = {
    headers: {},
    body: {
      fullName: 'Juan Dela Cruz',
      email: 'juan@example.com',
      contactNumber: '09123456789',
      address: 'Zone 1',
      document: 'first time job seeker certificate',
      zone: '1',
      lengthOfResidency: '10 years',
    },
  };
  const res = createMockRes();

  await requestController.createRequest(req, res);

  assert.ok(duplicateQuery);
  assert.deepEqual(duplicateQuery.status, { $ne: 'Cancelled' });
  assert.deepEqual(duplicateQuery.deleted, { $ne: true });
  assert.ok(createdPayload);
  assert.equal(createdPayload.fullNameNormalized, 'juan dela cruz');
  assert.equal(createdPayload.documentCode, 'FTJSC');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { checkoutUrl: 'https://example.test/checkout' });
});
