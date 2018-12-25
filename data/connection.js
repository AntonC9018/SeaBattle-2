const mongoose = require('mongoose');


// const url = 'mongodb://admin:admin@phallala-shard-00-00-h9zqe.mongodb.net:27017,phallala-shard-00-01-h9zqe.mongodb.net:27017,phallala-shard-00-02-h9zqe.mongodb.net:27017/test?ssl=true&replicaSet=Phallala-shard-0&authSource=admin&retryWrites=true'
const url = 'mongodb://localhost:27017/test'
//connect to MongoBD
mongoose.connect(url, {
  useNewUrlParser: true
});

mongoose.connection.once('open', function() {
  console.log('Connected to DB');
}).on('error', console.error.bind(console, 'connection error:'));
module.exports = mongoose.connection;
