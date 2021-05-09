//Tracking user state changes
auth.onAuthStateChanged((user) =>{
    visibilityController(user);
    // if(user){
    //     // db.collection('guides').get().then(snapshot => {
    //     //     setupGuides(snapshot.docs);
    //     // });

    //     // for realtime updation of data base use this :
    //     db.collection('guides').onSnapshot(snapshot => {
    //         setupGuides(snapshot.docs);
    //     });
    // }
    // else{
    //     setupGuides([]);
    // }
    if (user) {
        db.collection('guides').onSnapshot(snapshot => {
          setupGuides(snapshot.docs);
        //   visibilityController(user);
        }, err => console.log(err.message));
      } else {
        // visibilityController();
        setupGuides([]);
      }
});

// setting up the signUp user functionality

const signupForm = document.querySelector("#signup-form");

signupForm.addEventListener("submit",(e) => {
    e.preventDefault();
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    
    auth.createUserWithEmailAndPassword(email,password).then((cred) => {
        console.log(cred);
        const modal = document.querySelector('#modal-signup');
        M.Modal.getInstance(modal).close();
        signupForm.reset();
    });

});

// create new guide
const createForm = document.querySelector('#create-form');
createForm.addEventListener('submit', (e) => {
  e.preventDefault();
  db.collection('guides').add({
    title: createForm.title.value,
    content: createForm.content.value
  }).then(() => {
    // close the create modal & reset form
    const modal = document.querySelector('#modal-create');
    M.Modal.getInstance(modal).close();
    createForm.reset();
  }).catch(err => {
    console.log(err.message);
  });
});

//logout

const logout = document.querySelector("#logout");

logout.addEventListener('click',(e) => {
    e.preventDefault();
    auth.signOut();
});

// login

const loginForm = document.querySelector("#form-control");

loginForm.addEventListener('submit',(e) => {
    e.preventDefault();

    const email = loginForm['Email'].value;
    const password = loginForm['Password'].value;

    auth.signInWithEmailAndPassword(email, password).then((cred) => {
        return db.collection('users').doc(cred.user.uid).set({
            username: signupForm['username'].value
          });
        }).then(() => {
          // close the signup modal & reset form
          const modal = document.querySelector('#modal-signup');
          M.Modal.getInstance(modal).close();
          signupForm.reset();
    });
});
