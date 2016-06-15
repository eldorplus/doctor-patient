'use strict';

var Models = require('../Models');

//Get Users from DB
var getAdmin = function (criteria, projection, options, callback) {
    Models.Admins.find(criteria, projection, options, callback);
};

//Get Users from DB
var getAdminMargin = function (criteria, projection, options, callback) {
    Models.AdminMargin.find(criteria, projection, options, callback);
};

//Insert User in DB
var createAdmin = function (objToSave, callback) {
    new Models.Admins(objToSave).save(callback)
};

//Insert User in DB
var createAdminMargin = function (objToSave, callback) {
    new Models.AdminMargin(objToSave).save(callback)
};

//Update User in DB
var updateAdmin = function (criteria, dataToSet, options, callback) {
    Models.Admins.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Update User in DB
var updateAdminMargin = function (criteria, dataToSet, options, callback) {
    Models.AdminMargin.findOneAndUpdate(criteria, dataToSet, options, callback);
};


//Update User in DB
var updateCharityDonations = function (criteria, dataToSet, options, callback) {
    Models.charityDonations.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Update User in DB
var updateManyDonation = function (criteria, dataToSet, options, callback) {
    Models.charityDonations.update(criteria, dataToSet, options, callback);
};

//Update User in DB
var updateCampaignDonations = function (criteria, dataToSet, options, callback) {
    Models.donation.findOneAndUpdate(criteria, dataToSet, options, callback);
};

//Update User in DB
var updateManyCampDonation = function (criteria, dataToSet, options, callback) {
    Models.donation.update(criteria, dataToSet, options, callback);
};

//Update User in DB
var getCampaignRecurringDonation = function (criteria, callback) {
    Models.donation.aggregate(criteria, callback);
};



var getDonationPopulate = function (criteria, project, options,populateModel, callback) {
    Models.donation.find(criteria, project, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        }else{
            callback(null, docs);
        }
    });
};

var getcharityDonationsPopulate = function (criteria, project, options,populateModel, callback) {
    Models.charityDonations.find(criteria, project, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        }else{
            callback(null, docs);
        }
    });
};

var getdonationRecurringCharityPopulate = function (criteria, project, options,populateModel, callback) {
    Models.donationRecurringCharity.find(criteria, project, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        }else{
            callback(null, docs);
        }
    });
};
var getdonationRecurringCampaignPopulate = function (criteria, project, options,populateModel, callback) {
    Models.donationRecurring.find(criteria, project, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        }else{
            callback(null, docs);
        }
    });
};

module.exports = {
    getAdmin: getAdmin,
    createAdmin: createAdmin,
    getDonationPopulate: getDonationPopulate,
    getcharityDonationsPopulate: getcharityDonationsPopulate,
    getdonationRecurringCharityPopulate: getdonationRecurringCharityPopulate,
    getdonationRecurringCampaignPopulate: getdonationRecurringCampaignPopulate,
    getCampaignRecurringDonation: getCampaignRecurringDonation,
    updateCharityDonations: updateCharityDonations,
    updateCampaignDonations: updateCampaignDonations,
    updateManyDonation: updateManyDonation,
    updateManyCampDonation: updateManyCampDonation,
    getAdminMargin: getAdminMargin,
    createAdminMargin: createAdminMargin,
    updateAdminMargin: updateAdminMargin,
    updateAdmin: updateAdmin
};

