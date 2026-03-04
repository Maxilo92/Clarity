const bcrypt = require('bcryptjs');
const hash = '$2b$10$Bu8f8dNYK.cVgNhO9FY3uu6pPpoN0q.5TD6urMmg8byB.KesMwvC2';
const pass = 'password123';

bcrypt.compare(pass, hash, (err, res) => {
    console.log('Result:', res);
    if (err) console.error('Error:', err);
});
