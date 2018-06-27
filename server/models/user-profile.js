/*Read-only version of the user's profile.
  Help pass user data from DB to outer layers of 
  backend safely.
*/

var UserProfileModel = function (cnf) {
    this.phone = cnf.phone,
    this.firstName = cnf.firstName,
    this.lastName = cnf.lastName
};

module.exports = UserProfileModel;

