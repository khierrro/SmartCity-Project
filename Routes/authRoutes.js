const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      role: 'citizen',
    });

    res.status(201).json({ message: 'Registrasi berhasil, silakan login' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email tidak terdaftar' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Simpan informasi lengkap di session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address
    };

    res.json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }
  res.json({
    loggedIn: true,
    id: req.session.user.id,
    name: req.session.user.name,
    email: req.session.user.email,
    role: req.session.user.role,
    phone: req.session.user.phone || null,
    address: req.session.user.address || null
  });
});


router.put('/profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  }

  const userId = req.session.user.id;
  const { phone, address, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Password saat ini harus diisi untuk mengubah password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password saat ini salah' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
      if (phone !== undefined) req.session.user.phone = phone;
      if (address !== undefined) req.session.user.address = address;
    }

    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});
// PUT /profile - update phone, address, and/or password
router.put('/profile', async (req, res) => {
  // Check if user is logged in
  if (!req.session.user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  }

  const userId = req.session.user.id;
  const { phone, address, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Fields to update
    const updateData = {};

    // Update phone & address if provided
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    // If trying to change password
    if (newPassword) {
      // Require current password for verification
      if (!currentPassword) {
        return res.status(400).json({ message: 'Password saat ini harus diisi untuk mengubah password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password saat ini salah' });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    if (Object.keys(updateData).length > 0) {
      await user.update(updateData);
      if (phone !== undefined) req.session.user.phone = phone;
      if (address !== undefined) req.session.user.address = address;
    }

    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: 'Gagal logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout berhasil' });
  });
});

router.delete('/account', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu' });
  }

  const userId = req.session.user.id;
  const { password } = req.body;  // verify password before deletion

  if (!password) {
    return res.status(400).json({ message: 'Password diperlukan untuk menghapus akun' });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Akun tidak ditemukan' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Password salah' });
    }
    await user.destroy();
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: 'Akun dihapus, tetapi logout gagal' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Akun berhasil dihapus' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});
module.exports = router;