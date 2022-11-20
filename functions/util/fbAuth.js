const {admin, db} = require('./admin');


//Middleware
module.exports = (req, res, next)=>{
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
      idToken = req.headers.authorization.split('Bearer ')[1];
    }else{
      console.error('No token found')
      return res.status(403).json({error: 'Unauthorizated'});
    }
  
    //verify id token, get decodedToken return value from collection == to userHandle
    admin.auth().verifyIdToken(idToken).then((decodedToken) =>{
      req.user = decodedToken; 
      console.log(decodedToken);
      return db.collection('users').where('userId', '==', req.user.uid)
      .limit(1)
      .get();
    })
    .then(data => {
      //get data -> then docs object -> extraction to data() object -> then get handle
      //acutally adding information onto the "REQUEST" via the middleware
      req.user.handle = data.docs[0].data().handle; 
      req.user.imageUrl = data.docs[0].data().imageUrl; 
      return next(); //allow the request to proceed.
    })
    .catch((err) => {
      console.error("Error while verifying token", err);
      return res.status(403).json(err);
    })
}