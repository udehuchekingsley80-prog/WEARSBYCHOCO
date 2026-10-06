const express = require('express');
const { body } = require('express-validator');
const { User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { handleValidation } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/asyncHandler');

const router = express.Router();
router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.userId).select('username title firstName lastName email phone');
  res.json({ user });
}));

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Please enter a valid email address.'),
    body('phone').optional({ checkFalsy: true }).isString().trim().isLength({ max: 30 }).withMessage('Please enter a valid phone number.'),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.email = req.body.email;
    if (typeof req.body.phone === 'string') user.phone = req.body.phone;
    await user.save();

    res.json({
      success: true,
      user: {
        username: user.username,
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    });
  }),
);

module.exports = router;
