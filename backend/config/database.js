const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB 連接成功: ${conn.connection.host}`);
  } catch (error) {
    console.error(`錯誤: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 