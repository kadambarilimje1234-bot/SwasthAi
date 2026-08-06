const User = require('../models/User');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');

// Generate JWT - Longer expiry
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'swasthai_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }  // 7 days
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_REFRESH_SECRET || 'swasthai_refresh_secret_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }  // 30 days
  );
};

// ============================================
// LOGIN
// ============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📝 Login attempt:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email }).populate('hospital', 'hospitalName hospitalCode');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    console.log('✅ Login successful:', email);

    res.json({
      success: true,
      data: {
        accessToken: token,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospital: user.hospital,
          ward: user.ward,
          specialization: user.specialization
        }
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// ============================================
// REGISTER
// ============================================
exports.register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      hospitalName,
      hospitalCode,
      specialization,
      ward,
      phone,
      licenseNumber,
      department
    } = req.body;

    console.log('📝 Register attempt:', { email, name, role });

    // Validations
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and role are required'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create hospital if not exists
    let hospital = null;
    if (hospitalCode) {
      hospital = await Hospital.findOne({ hospitalCode: hospitalCode.toUpperCase() });
    }
    
    if (!hospital) {
      hospital = new Hospital({
        hospitalName: hospitalName || 'Default Hospital',
        hospitalCode: hospitalCode ? hospitalCode.toUpperCase() : `HOSP-${Date.now()}`,
        address: {
          city: 'Unknown',
          state: 'Unknown',
          country: 'India'
        },
        phone: phone || '0000000000',
        email: email,
        departments: [department || 'General'],
        totalBeds: 0,
        availableBeds: 0
      });
      await hospital.save();
      console.log('🏥 New hospital created:', hospital.hospitalName);
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role,
      hospital: hospital._id,
      specialization: specialization || '',
      ward: ward || 'ALL',
      phone: phone || '',
      licenseNumber: licenseNumber || '',
      department: department || 'General',
      isActive: true
    });

    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        accessToken: token,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          hospital: {
            id: hospital._id,
            name: hospital.hospitalName,
            code: hospital.hospitalCode
          },
          ward: user.ward,
          specialization: user.specialization
        }
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    console.log('🔄 Refresh token attempt');

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'swasthai_refresh_secret_2026'
    );

    // Find user with this refresh token
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshToken: refreshToken
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    console.log('✅ Refresh token successful');

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
};

// ============================================
// LOGOUT
// ============================================
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// ============================================
// GET CURRENT USER
// ============================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('hospital', 'hospitalName hospitalCode address phone email')
      .select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};