

import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/LoginFormPractice")
  .then(() => {
    console.log('mongoose connected');
  })
  .catch((e) => {
    console.log('failed');
  });

const logInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }
});

const LogInCollection = mongoose.model('LogInCollection', logInSchema);

export default LogInCollection;
