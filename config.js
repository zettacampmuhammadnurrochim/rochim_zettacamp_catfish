const bodyParser  = require('body-parser');
const app = require('./app');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));

module.exports.config = app 