const isEmtpy = (string) => {
    if(string.trim() === '') return true;
    else return false; 
}



const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(emailRegEx)) return true
    else return false; 
}
  

exports.validateSignupData = (data) => {
    let errors = {};
    if(isEmtpy(data.email)){;
      errors.email = 'Must not be empty';
    }else if (!isEmail(data.email)){;
      errors.email = 'Must be a valid email address';
    };
    if(isEmtpy(data.password)) errors.password = 'Must not be empty';
    if(data.password != data.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if(isEmtpy(data.handle)) errors.handle = 'Must not be empty';
  
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true: false
    }
}

exports.validateLoginData = (user) =>{
    let errors = {};
    if(isEmtpy(user.email)) errors.email = 'Must not be empty'; 
    if(isEmtpy(user.password)) errors.password = 'Must not be empty';
  
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true: false
    }
}

exports.reduceUserDetails = (data) => {
    let userDetails = {}; 

    if(!isEmtpy(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmtpy(data.website.trim())){
        if(data.website.trim().substring(0,4) !== 'http'){
            userDetails.website = `http://${data.website.trim()}`;
        }else userDetails.website = data.website; 
    }
    if(!isEmtpy(data.location.trim())) userDetails.location = data.location; 

    return userDetails; 
}