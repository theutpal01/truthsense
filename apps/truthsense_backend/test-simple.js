const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(8002, () => {
  console.log('Simple server running on port 8002');
});