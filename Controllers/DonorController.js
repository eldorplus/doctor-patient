'use strict';

var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');

var UploadManager = require('../Lib/UploadManager');
var TokenManager = require('../Lib/TokenManager');
var NotificationManager = require('../Lib/NotificationManager');
var CodeGenerator = require('../Lib/CodeGenerator');
var DAO = require('../DAO/DAO');
var Models = require('../Models');


var createDonor = function (payloadData, callback) {
    var accessToken = null;
    var donorData = null;
    var uniqueCode = null;
    var dataToSave = payloadData;
    if (dataToSave.password)
        dataToSave.password = UniversalFunctions.CryptData(dataToSave.password);
    dataToSave.firstTimeLogin = false;
    var dataToUpdate = {};


    async.series([
        function (cb) {
            //Validate phone No
            if (!dataToSave.firstName) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NAME_REQUIRED);
            } else {
                cb();
            }
        },
        function (cb) {
            //verify email address
            if (!UniversalFunctions.verifyEmailFormat(dataToSave.emailId)) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL);
            } else {
                cb();
            }
        },
        function (cb) {
            //Validate for facebookId and password
            if (typeof dataToSave.facebookId != 'undefined' && dataToSave.facebookId) {
                if (dataToSave.password) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FACEBOOK_ID_PASSWORD_ERROR);
                } else {
                    cb();
                }
            } else if (!dataToSave.password) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PASSWORD_REQUIRED);
            } else {
                cb();
            }
        },
        function (cb) {

            //Insert Into DB
            var finalDataToSave = {};
            finalDataToSave.createdOn = new Date().toISOString();
            finalDataToSave.loggedInOn = new Date().toISOString();
            finalDataToSave.emailId = dataToSave.emailId;
            finalDataToSave.firstName = dataToSave.firstName;
            finalDataToSave.deviceType = dataToSave.deviceType;
            finalDataToSave.deviceToken = dataToSave.deviceToken;
            finalDataToSave.appVersion = dataToSave.appVersion;
            if (dataToSave.lastName != 'undefined' && dataToSave.lastName) {
                finalDataToSave.lastName = dataToSave.lastName;
            }
            if (dataToSave.facebookId != 'undefined' && dataToSave.facebookId) {
                finalDataToSave.facebookId = dataToSave.facebookId;
            }else{
                finalDataToSave.passwordHash = dataToSave.password;
            }
            Service.DonorService.createDonor(finalDataToSave, function (err, donorDataFromDB) {
                if (err) {
                    if (err.code == 11000 && err.message.indexOf('customers.$emailId_1') > -1){
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_ALREADY_EXIST);
                    }
                    else {
                        cb(err)
                    }
                    cb(err)
                } else {
                    donorData = donorDataFromDB;
                    cb();
                }
            })
        },
        function (cb) {
            if (donorData) {
                var tokenData = {
                    id: donorData._id,
                    type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.DONOR
                };
                TokenManager.setToken(tokenData, function (err, output) {
                    if (err) {
                        cb(err);
                    } else {
                        accessToken = output && output.accessToken || null;
                        cb();
                    }
                });
            } else {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            }
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                accessToken: accessToken,
                userDetails: UniversalFunctions.deleteUnnecessaryDonorData(donorData.toObject())
            });
        }
    });
};



var UpdateDonor = function (payloadData, CharityData, callback) {
    var donorProfileData = null;
    var dataToSave = payloadData;


    async.series([
        function (cb) {

            var finalDataToSave = {};
            if (dataToSave.firstName != 'undefined' && dataToSave.firstName) {
                finalDataToSave.firstName = dataToSave.firstName;
            }
            if (dataToSave.lastName != 'undefined' && dataToSave.lastName) {
                finalDataToSave.lastName = dataToSave.lastName;
            }
            if (dataToSave.phoneNumber != 'undefined' && dataToSave.phoneNumber) {
                finalDataToSave.phoneNumber = dataToSave.phoneNumber;
            }
            if (dataToSave.country != 'undefined' && dataToSave.country) {
                finalDataToSave.country = dataToSave.country;
            }

            var criteria = {_id: CharityData._id};
            var options = {lean: true};


            Service.DonorService.updateDonor(criteria, finalDataToSave, options, function (err, charityDataFromDB) {
                if (err) {
                    cb(err)
                } else {
                    cb();
                }
            });
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};

var changePassword = function (queryData,userData, callback) {
    var userFound = null;
    if (!queryData.oldPassword || !queryData.newPassword || !userData) {
        return callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
    async.series([
        function (cb) {
            var criteria = {_id : userData.id  };
            var projection = {passwordHash:1};
            var options = {
                lean: true
            };
            Service.DonorService.getDonor(criteria, projection, options, function (err, data) {
                if (err) {
                    return cb(err);
                }

                if (data.length==0) {
                    return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND)
                }
                userFound = data[0];
                return cb();
            });
        },
        function (cb) {

            if (userFound.passwordHash != UniversalFunctions.CryptData(queryData.oldPassword)){
                return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_OLD_PASS)
            }else if (userFound.passwordHash == UniversalFunctions.CryptData(queryData.newPassword)){
                return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SAME_PASSWORD)
            }
            return  cb();
        },
        function (cb) {
            var criteria = {_id: userFound._id};
            var setQuery = {
                $set: {
                    passwordHash: UniversalFunctions.CryptData(queryData.newPassword)
                }
            };
            var options = {lean: true};
            Service.DonorService.updateDonor(criteria, setQuery, options, function(err,suceess){
                if(err)
                {
                    return cb(err);
                }
                cb();
            });
        }

    ], function (err, result) {
        if(err)
        {
            return callback(err);
        }
        return callback();
    })
};


var getCampaign = function (callback) {


    /* var criteria      = { complete:false},*/
    var _date = new Date();
    var criteria = {
            $and:[
                {complete:false},
                {'endDate':{$gte:new Date()}}
            ]},
        options = {lean: true},
        projection = {createdOn:0};

    var populateVariable = {
        path: "charityId",
        select: 'name'
    };

    Service.DonorService.getCampaignPopulate(criteria, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null,res);
        }
    });
};


var getCampaignById = function (payloadData, callback) {

    var criteria      = { _id:payloadData.campaignId},
        options = {lean: true},
        projection ={charityId:0};

    Service.DonorService.getCharityCampaign(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null,res);
        }
    });
};

var loginDonor = function (payloadData, callback) {
    var userFound = false;
    var accessToken = null;
    var successLogin = false;
    var updatedUserDetails = null;
    payloadData.email =payloadData.email.toLowerCase();
    async.series([
        function (cb) {
            var criteria = {
                emailId: payloadData.email
            };
            var projection = {};
            var option = {
                lean: true
            };
            Service.DonorService.getDonor(criteria, projection, option, function (err, result) {
                if (err) return cb(err)
                if(result.length==0) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_NOT_FOUND);
                userFound = result && result[0] || null;
                // updatedUserDetails= result;
                return cb();
            });
        },
        function (cb) {

            if (!userFound) {
                cb(ERROR_MESSAGE.EMAIL_NOT_FOUND);
            } else {
                if (userFound && userFound.passwordHash != UniversalFunctions.CryptData(payloadData.password)) {
                    cb(ERROR_MESSAGE.INCORRECT_PASSWORD);
                } else {
                    successLogin = true;
                    cb();
                }
            }
        },
        function (cb) { //console.log("userFound 153  ",userFound);
            if (successLogin) {
                var tokenData = {
                    id: userFound._id,
                    type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.DONOR
                };
                TokenManager.setToken(tokenData, function (err, output) {
                    if (err) {
                        cb(err);
                    } else {
                        if (output && output.accessToken){
                            accessToken = output && output.accessToken;
                            cb();
                        }else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.ERROR.IMP_ERROR)
                        }
                    }
                })
            } else {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.ERROR.IMP_ERROR)
            }

        },
        function (cb) {
            var criteria = {
                _id: userFound._id
            };
            var setQuery = {
                appVersion: payloadData.appVersion,
                deviceToken: payloadData.deviceToken,
                deviceType: payloadData.deviceType,
                onceLogin:true
            };
            Service.DonorService.updateDonor(criteria, setQuery, {lean: true}, function (err, data) {
                updatedUserDetails = data;
                cb(err, data);
            });

        },
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, {accessToken: accessToken,
                userDetails: UniversalFunctions.deleteUnnecessaryDonorData(updatedUserDetails)});
        }
    });
};


module.exports = {
    createDonor: createDonor,
    changePassword: changePassword,
    getCampaign: getCampaign,
    getCampaignById: getCampaignById,
    loginDonor: loginDonor,
    //Donation: Donation,
    UpdateDonor: UpdateDonor
};

