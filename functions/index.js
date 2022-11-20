
const {db} = require('./util/admin');
//EXPORTING SERVER CODE TO FUNCTIONS
const functions = require("firebase-functions");
//MIDDLEWARE
const FBAuth = require('./util/fbAuth');
//HANDLERS
const {getAllScreams, postOneScream, getScream, commentOnScream, likeScream, unlikeScream, deleteScream} = require('./handlers/screams')
const {signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead} = require('./handlers/users')
//CREATE EXPRESS SERVER
const app = require('express')(); //initialize

//SCREAM ROUTES
app.get('/screams', getAllScreams); 
app.post('/scream', FBAuth, postOneScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);

app.post('/scream/:screamId/comment', FBAuth, commentOnScream)

//SIGN UP ROUTES
app.post('/signup', signup);
app.post('/login', login);

app.get('/user/:handle', getUserDetails);
app.post('/notifications',FBAuth, markNotificationsRead);

app.post('/user/image', FBAuth, uploadImage); 
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

//Passes everything through the functions module, onTrigger http request, into the express App.
exports.api = functions.https.onRequest(app)

//Creates seperate modules for on database triggers
exports.createNotificationOnLike = functions.firestore.document('likes/{id}').onCreate((snapshot) =>{
  return db.doc(`screams/${snapshot.data().screamId}`).get() //take the snapshot and get the document
  .then(doc => {
    if(doc.exists){
      return db.doc(`/notifications/${snapshot.id}`).set({
        createdAt: new Date().toISOString(),
        recipient: doc.data().userHandle,
        sender: snapshot.data().userHandle,
        type: 'like',
        read: false,
        screamId: doc.id //reference is on the pointer.
      });
    }
  })
  .catch((err) => {
    console.err(err);
  })
});

exports.createNotificationOnComment = functions.firestore.document('comments/{id}').onCreate((snapshot) =>{
  return db.doc(`screams/${snapshot.data().screamId}`).get() //take the snapshot and get the document
  .then((doc) => {

    if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
      return db.doc(`/notifications/${snapshot.id}`).set({
        createdAt: new Date().toISOString(),
        recipient: doc.data().userHandle,
        sender: snapshot.data().userHandle,
        type: 'comment',
        read: false,
        screamId: doc.id //reference is on the pointer.
      });
    } 
  })
  .catch((err) => {
    console.err(err);
    return; 
  })
});

exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}').onDelete((snapshot) =>{
  return db.doc(`/notifications/${snapshot.id}`).delete()
  .catch((err) => {
    console.error(err);
    return; 
  })
});

//change all images associated with a user
exports.onUserImageChange = functions.firestore.document('/users/{userId}').onUpdate((change) => {
  console.info("WERE IN. Trigger success baby.");
  console.info(change.before.data());
  console.info(change.after.data()); 
  if(change.before.data().imageUrl !== change.after.data().imageUrl){
    console.info('image has changed')
    let batch = db.batch();
    return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
      .then((data) => {
        data.forEach((doc) => {
          const scream = db.doc(`/screams/${doc.id}`); //db.doc is a pointer to the document that allows read and write
          batch.update(scream, {userImage: change.after.data().imageUrl});
        });
        return batch.commit(); 
      });
  } else {
    return true; 
  }
});

//db has a collections object. Db also has a specific document reference
exports.onScreamDelete = functions.firestore.document(`/screams/{screamId}`).onDelete((snapshot, context) => {
  console.info("DELETING SCREAM");
  const screamId = context.params.screamId; //screamId is in the URL 
  const batch = db.batch();
  return db.collection('comments').where('screamId', '==', screamId).get()
    .then((data) => {
      data.forEach((doc) => {
        batch.delete(db.doc(`/comments/${doc.id}`));
      })
      return db.collection('likes').where('screamId', '==', screamId).get();
    })
    .then((data) => {
      data.forEach((doc) => {
        batch.delete(db.doc(`/likes/${doc.id}`));
      })
      return db.collection('notifications').where('screamId', '==', screamId).get()
    })
    .then((data) => {
      data.forEach((doc) => {
        batch.delete(db.doc(`/notifications/${doc.id}`));
      })
      return batch.commit(); 
    })
    .catch((err) => {
      console.error(err);
    })
});