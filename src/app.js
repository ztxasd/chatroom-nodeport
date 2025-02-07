const express=require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

function generateSecureRandomString(length){
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

const app=express();
const db = new Sequelize('sqlite://database.sqlite');

const user=db.define('user',{
    username:{
        type: DataTypes.STRING
    },
    password:{
        type: DataTypes.STRING
    },
    uid:{
        type: DataTypes.INTEGER
    },
});

(async () => {
await db.sync();

//user.create({username:'ztx',password:'384fde3636e6e01e0194d2976d8f26410af3e846e573379cb1a09e2f0752d8cc',uid:1});

const port=process.env.port ?? 8080;

app.use('/',express.static('src/static'));
app.use(bodyParser.json());
app.use(cookieParser());

let messages=[],clientlist=[];

app.get('/chat/messages',(req,res)=>{
    let messagesStr='[';
    messages.forEach((x)=>{
        messagesStr+=JSON.stringify(x)+',';});
    if(messagesStr.length>1){
        messagesStr=messagesStr.substring(0,messagesStr.length-1)+']';
    }else{
        messagesStr='[]';
    }
    res.send(messagesStr);
});

app.post('/chat/messages',(req,res)=>{
    if(clientlist.includes(req.cookies.clientid)){
        messages.push(req.body);
    }
    res.end();
});

app.post('/login',async (req,res)=>{
    const query_username=req.body.username,query_password=req.body.hashedPassword;
    const x=await user.findAll({
        attributes:['password','uid'],
        where:{
            username:query_username
        }
    })
    if(x.length!=1||x[0].password!=query_password){
        res.status(401);
    }else{
        res.status(200);
        res.cookie('uid',x[0].uid);
        const clientid=generateSecureRandomString(100);
        clientlist.push(clientid);
        res.cookie('clientid',clientid);
    }
    res.end();
});

app.get('/user/username',async (req,res)=>{
    if(!clientlist.includes(req.cookies.clientid)){
        res.clearCookie();
        res.status(401);
        res.end();
    }else if(!isNaN(Number(req.cookies.uid))){
        const x=await user.findAll({
            attributes:['username'],
            where:{
                uid:Number(req.cookies.uid)
            }
        });
        if(x.length!=1){
            res.status(403);
            res.end();
        }else{
            res.status(200);
            res.send(JSON.stringify({username:x[0].username}));
        }
    }else{
        res.status(400);
        res.end();
    }
});

app.listen(port,()=>{
    console.log(`通过 localhost:${port} 访问 chatroom`);
});

})();