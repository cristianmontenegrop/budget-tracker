const router = require('express').Router();
const Transaction = require('../models/transaction.js');

router.post('/api/transaction', ({ body }, res) => {
  console.log('transaction Post Attempt: ', body);
  Transaction.create(body)
    .then((dbTransaction) => {
      res.json(dbTransaction);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

router.post('/api/transaction/bulk', ({ body }, res) => {
  console.log('bulk Insertion Attempt: ', body);
  Transaction.insertMany(body)
    .then((dbTransaction) => {
      res.json(dbTransaction);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

router.get('/api/transaction', (req, res) => {
  console.log('transaction GET Attempt: ');
  Transaction.find({}).sort({ date: -1 })
    .then((dbTransaction) => {
      res.json(dbTransaction);
    })
    .catch((err) => {
      res.status(404).json(err);
    });
});

module.exports = router;
