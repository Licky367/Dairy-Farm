const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.createUser = async(data)=>{
    const hashed = await bcrypt.hash(data.password,10);

    return await User.create({
        name:data.name,
        email:data.email,
        phone:data.phone,
        password:hashed
    });
};

exports.loginUser = async(data)=>{
    const user = await User.findOne({email:data.email});

    if(!user) return null;

    const match = await bcrypt.compare(data.password,user.password);

    if(!match) return null;

    return user;
};

exports.findEmail = async(email)=>{
    return await User.findOne({email});
};

exports.resetPassword = async(id,password)=>{
    const hashed = await bcrypt.hash(password,10);

    return await User.findByIdAndUpdate(id,{
        password:hashed
    });
};