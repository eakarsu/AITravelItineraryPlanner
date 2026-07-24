'use strict';
const router=require('express').Router(),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),pool=require('../config/database');
const{authenticate,secret}=require('../middleware/auth');
router.post('/login',async(req,res)=>{try{
  const{email,password,tenantId}=req.body||{};
  if(!email||!password)return res.status(400).json({error:'email and password are required'});
  const result=tenantId
    ?await pool.query('SELECT u.id,u.email,u.password_hash,u.name,m.tenant_id,m.role FROM travel_users u JOIN travel_memberships m ON m.user_id=u.id AND m.active=TRUE WHERE LOWER(u.email)=LOWER($1) AND m.tenant_id=$2 LIMIT 1',[email,tenantId])
    :await pool.query('SELECT u.id,u.email,u.password_hash,u.name,m.tenant_id,m.role FROM travel_users u JOIN travel_memberships m ON m.user_id=u.id AND m.active=TRUE WHERE LOWER(u.email)=LOWER($1) ORDER BY m.tenant_id LIMIT 2',[email]);
  if(!tenantId&&result.rows.length>1)return res.status(400).json({error:'tenantId is required for users with multiple active memberships'});
  const row=result.rows[0];if(!row||!await bcrypt.compare(password,row.password_hash))return res.status(401).json({error:'Invalid credentials'});
  const user={id:row.id,email:row.email,name:row.name,tenantId:row.tenant_id,role:row.role},token=jwt.sign(user,secret(),{issuer:'governed-travel',algorithm:'HS256',expiresIn:process.env.JWT_TTL||'1h'});res.json({token,user});
}catch(_error){res.status(500).json({error:'Login failed'});}});
router.get('/me',authenticate,(req,res)=>res.json({user:req.user}));
router.get('/verify',authenticate,(req,res)=>res.json({valid:true,user:req.user}));
router.get('/demo-credentials',(req,res)=>{
  if(process.env.NODE_ENV==='production'||process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL==='false')return res.status(404).json({error:'Demo credentials are disabled'});
  if(!process.env.DEMO_EMAIL||!process.env.DEMO_PASSWORD)return res.status(503).json({error:'Demo account is not configured'});
  res.json({email:process.env.DEMO_EMAIL,password:process.env.DEMO_PASSWORD});
});
module.exports=router;
