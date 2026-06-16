const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('../config/database');
require('dotenv').config();

const secret = process.env.SESSION_SECRET;
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000,         
});

const sessionMiddleware = session({
  secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  rolling: true,                              
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    maxAge: 24 * 60 * 60 * 1000,              // 24 jam
  },
});

sessionStore.sync();

module.exports = sessionMiddleware;