module.exports = process.env.POMELO_PROTOCOL_COV ?
                 require('./lib-cov/protocol') :
                 require('./lib/protocol');