const mongoose = require('mongoose');
const router = require('express').Router();
const User = mongoose.model('User');
const passport = require('passport');
const utils = require('../lib/utils');

router.get(
  '/protected',
  passport.authenticate('jwt', { session: false }),
  (req, res, next) => {
    res.status(200).json({ success: true, msg: 'You are authorized!' });
  },
);

router.post('/login', (req, res, next) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ success: false, msg: 'could not find user' });
      }

      const isValid = utils.validPassword(
        req.body.password,
        user.hash,
        user.salt,
      );

      if (isValid) {
        const { token, expires } = utils.issueJWT(user);

        res.status(200).json({
          success: true,
          user,
          token,
          expiresIn: expires,
        });
      } else {
        res
          .status(401)
          .json({ success: false, msg: 'you entered the wrong password' });
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/register', (req, res, next) => {
  const { salt, hash } = utils.genPassword(req.body.password);

  const newUser = new User({ username: req.body.username, salt, hash });

  newUser
    .save()
    .then((user) => {
      const { token, expires } = utils.issueJWT(user);

      res.json({ success: true, user, token, expiresIn: expires });
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
