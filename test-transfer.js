const axios = require('axios');
axios.post('http://localhost:3000/api/ledger/transfer', {
  fromAccountId: 1,
  toAccountId: 319,
  amount: 100,
  date: "2026-06-15"
}).then(res => console.log(res.data)).catch(err => console.error(err.response ? err.response.data : err.message));
