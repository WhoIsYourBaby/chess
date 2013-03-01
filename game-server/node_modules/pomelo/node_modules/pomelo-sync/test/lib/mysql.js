var Client = require('mysql').Client;
var client = new Client();

client.host = 'pomelo.163.com';
client.user = 'xy';
client.password = 'dev';
client.database = 'Pomelo';
 
exports.client = client;
