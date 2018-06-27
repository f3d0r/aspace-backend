/*Helps move data out of the Controller.
  Any request sent to Controller will eventually produce
  an ApiResponse instance.
*/
var ApiResponse = function (cnf) {
    this.success = cnf.success; //signals whether requests succeeded
    this.extras = cnf.extras;  //extra data to be sent as part of response
};

module.exports = ApiResponse;

