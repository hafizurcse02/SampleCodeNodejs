/**
 * CheckInController
 *
 * @description :: Server-side logic for managing CheckIns
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

   index: function(req,res,next){
      console.log(new Date().toISOString() + ': CheckInController::index');

      //Get an array of all CheckIn customers in the checkin collection
      CheckIn.find(function foundCategory(err, result){
         if(err) return(err);

         console.log('check in controller index 2');

			res.view({
				CheckIn : result
			});	  			
  	});
	},

   

   create: function(req, res, next){
   
      console.log(new Date().toISOString() + ': CheckInController::create');

      // Find the business.
    Business.findOne(req.session.Business.id).exec(function afterFindBusiness(errBusinessFind, foundBusiness){

      if (errBusinessFind) {

         console.log('Error on CheckInController::create : ' + errBusinessFind);
        return next(errBusinessFind);

      } else {

        if (foundBusiness === undefined) {

          // Could not find the record in the CheckIn table.
          console.log('Could not find Business record with ID: ' + req.session.Business.id);
           req.session.flash = {
             err: 'Could not find Business record with ID: ' + req.session.Business.id
           }

        } else {

               var checkedInObj = {
                  checkInType: 'MobileNum',
                  userName: req.param('userName'),
                  businessID: req.session.Business.id,
                  businessName: foundBusiness.business_name,
                  state: req.param('state'),
                  mobileNum: req.param('mobileNum'),
                  orderNumber: req.param('orderNumber'),
               timeOfLastState: new Date().toISOString(),
               timeOfCurrentState: new Date().toISOString(),
               buzzedCount: 0
               }     

               CheckIn.create( checkedInObj, function CheckInCreated(err, result) {
                  
                   if (err) {
                     
                     console.log(err);
                       
                       req.session.flash = {
                         err: err
                     }                           
                   }
                  
                  res.redirect('/business/checkIn');         
               });    

        }

         }

      });

   },

   // process the info from edit view
   update: function(req, res, next) {

      console.log(new Date().toISOString() + ': CheckInController::update');

      // Find the record.
    CheckIn.findOne(req.param('id')).exec(function afterFindCheckIn(errCheckInFind, foundCheckIn){

      if (errCheckInFind) {

        return next(errCheckInFind);

      } else {

        if (foundCheckIn === undefined) {
          
          // Could not find the record in the CheckIn table.
          console.log('Could not find CheckIn record with ID: ' + params['id']);
          return res.json({
            error: 'Could not find CheckIn record with ID: ' + params['id']
          });          

        } else {

         // Reset some of the fields, only when changing states.
         var buzzCount = 0;
             var NewTimeOfLastState = foundCheckIn.timeOfCurrentState;
             var NewTimeOfCurrentState = new Date().toISOString(); 

         if (foundCheckIn.state === req.param('state')) {
            buzzCount = foundCheckIn.buzzedCount;
               NewTimeOfLastState = foundCheckIn.timeOfLastState;
               NewTimeOfCurrentState = foundCheckIn.timeOfCurrentState;             
         }
         

               var checkedInObj = {
                  userName: req.param('userName'),
                  state: req.param('state'),
                  mobileNum: req.param('mobileNum'),
                  orderNumber: req.param('orderNumber'),
               timeOfLastState: NewTimeOfLastState,
               timeOfCurrentState: NewTimeOfCurrentState,
               buzzedCount: buzzCount
               }

               CheckIn.update(req.param('id'), checkedInObj, function CheckInUpdate(err) {
                  if (err) {
                     return next(err);
                  }
               });
               res.redirect('/business/checkIn');

        } // END - CheckIn record not found.

      } // END - Error on find CheckIn record.

    }); // END - Find CheckIn record.

		/*
		var checkedInObj = {
			checkInType: 'MobileNum',
			userName: req.param('userName'),
			businessID: req.session.Business.id,
			state: req.param('state'),
			mobileNum: req.param('mobileNum'),
			orderNumber: req.param('orderNumber'),
			timeOfLastState: new Date().toISOString(),
			timeOfCurrentState: new Date().toISOString(),
			buzzedCount: 0
		}

      CheckIn.update(req.param('id'), checkedInObj, function CheckInUpdate(err) {
         if (err) {
            return next(err);
         }
      });
      res.redirect('/business/checkIn');
      */
   }, 

   // Buzz the user
   buzz: function(req, res, next) {

    console.log(new Date().toISOString() + ': CheckInController::buzz');

    CheckIn.findOne(req.param('id'), function foundCheckIn(err,result){

     if(err) return next(err);

     if(!result) return next('Customer doesn\'t exists.');

      console.log(result.checkInType);
      var userName = result.userName;
      var orderNumber = result.orderNumber;
      var mobileNum = result.mobileNum;
      var state = result.state;

      if (result.checkInType == 'SmartPhone' && result.deviceToken !== undefined && result.deviceToken.length > 20) 
      {
        if (result.deviceToken.length < 80) 
        {
          SendIosNotification(result.deviceToken,userName, state, orderNumber, result);
        }
        else
        {
          SendAndroidNotification(result.deviceToken,userName, state, orderNumber, result);
        };
      }
      else
      {
        console.log("Trying to send sms");         
        SendSms(userName, state, orderNumber, mobileNum, result);
      };
      res.redirect('/business/checkin');

     });

    },  

   //delete action
   destroy: function(req,res,next){

      var id = req.param('id');
      console.log(new Date().toISOString() + ': CheckInController::destroy ' + id);

      CheckIn.findOne(id, function foundCheckIn(err,result){

  			if(err) return next(err);

  			if(!result) return next('Customer doesn\'t exists.');

  			CheckIn.destroy(req.param('id'), function checkInDestroyed(err){
  				if(err) return next(err);
  			 });

  			res.redirect('/business/checkIn');

      });
   },

   // render the edit view (e.g. /views/edit.ejs)
   find: function(req, res, next) {
      
      console.log(new Date().toISOString() + ': CheckInController::find');
      
      // Find the user from the id passed in via params
      CheckIn.findOne(req.param('id'), function foundCheckIn(err, result) {
         if (err) return next(err);
         if (!result) return next('Customer doesn\'t exist.');

         
         res.view({
            CheckIn: result
         });

         //res.json(result);
         //res.redirect('/business/checkIn/update?id=' + req.param('id'));
         //res.redirect('/business/checkIn);
      });
   },

   checkedinList: function(req,res){

      console.log(new Date().toISOString() + ': CheckInController::checkedinList');

		CheckIn.find({type:1}).exec(function findCB(err, result){
			console.log('im in getTables2');
			res.view({
				CheckIn : result
			});  

         //res.view('/business/checkedinList.ejs', {message: 'Login failed!', layout: null});
         //res.view("business/checkIn/",{checkin: "/business/checkedinList.ejs"})
      });    
   }

};

//------------- END OF MODAL EXPORT -------------//
//###############################################//



//Following functions are used in Checkin Controller main functions
function SendIosNotification(deviceToken, userName, state, orderNumber, checkInRecord) {
  var http = require('http');
  var apn = require('apn');
  var url = require('url');

  var myPhone =   deviceToken;
  var businessName = businessName;

  //"2052146e1511c4df1b6403b01ffaf89759116319204e6e4a5d9ce604bac48787";
  //var myiPad = "51798aaef34f439bbb57d6e668c5c5a780049dae840a0a3626453cd4922bc7ac";

  var myDevice = new apn.Device(myPhone);

  var note = new apn.Notification();
  note.badge = 1;
  note.sound = 'default';


  note.alert = GetNotificationMessageBody(userName, orderNumber, state, checkInRecord.businessName);

  //note.alert = "Your table for " + orderNumber + " is ready at " + businessName + ". Please come to the counter.";
  note.payload = {'messageFrom': 'Your order is ready'};

  note.device = myDevice;

  var callback = function(errorNum, notification){
    console.log('Error is: %s', errorNum);
    console.log("Note " + notification);
  }

  var options = {
      gateway: 'gateway.sandbox.push.apple.com', // this URL is different for Apple's Production Servers and changes when you go to production
      errorCallback: callback,
      cert: 'api/controllers/MyBuzzProCert.pem',
      key:  'api/controllers/MyBuzzProKey.pem',
      passphrase: 'tylygnt@490',
      port: 2195,
      enhanced: true,
      cacheLength: 100
    }

  console.log(options);
  console.log(note);
  var apnsConnection = new apn.Connection(options);
  console.log("Attempting to send notification to apn");
  apnsConnection.sendNotification(note);
  IncrementBuzzCount(checkInRecord);

}
//------------------------------


function SendAndroidNotification(deviceToken,userName, state, orderNumber, checkInRecord)
{
  console.log('Trying t send android notification');
  var gcm = require('node-gcm');

  var message = new gcm.Message();

  var messageBody = GetNotificationMessageBody(userName, orderNumber, state, checkInRecord.businessName);

  //message.addData('97953208822', '');
  message.addData('message', messageBody);
  message.addNotification('title', 'myBUZZ');
  message.addNotification('icon', 'ic_launcher');
  message.addNotification('body', messageBody);
  message.addNotification('message', messageBody);

  var regIds = [deviceToken];

  // Set up the sender with you API key
  var sender = new gcm.Sender('AIzaSyBl_C9yE7DgEEwvuPprZVsyFx8T3M9Z2dk');

  //Now the sender can be used to send messages
  sender.send(message, regIds, function (err, result) {
    if (err) {
      console.error("error: " +err);
      console.log("Failed to notify Android.  Attempting to send SMS instead.");
      SendSms(userName, state, orderNumber, checkInRecord.mobileNum, checkInRecord);
    } else {
  console.log("sucess: " + result);
        IncrementBuzzCount(checkInRecord);
    }
  });

  /*sender.sendNoRetry(message, regIds, function (err, result) {
    if(err) console.error("error: " +err);
    else    console.log("sucess: " +result);
  });*/

}
//------------------------------


function SendSms(userName, state, orderNumber, mobileNum, checkInRecord)
{
  var querystring = require('querystring');
  var http = require('http');
  var fs = require('fs');
  var request = require('request');

  var post_data = querystring.stringify({
    'action': 'sendsms',
    'user' : 'stiv8mk8',
    'password': '45inPXtW',
    'to': '61402705818',
    'from' : 'myBuzz',
    'text' : 'My test message'
  });

  console.log("state:" + state);
  var smsMessage = GetSmsText(userName, orderNumber, state, checkInRecord.businessName);

  console.log(mobileNum);
  request({url:"http://www.smsglobal.com.au/http-api.php?",qs: {
    'action': 'sendsms',
    'user' : 'stiv8mk8',
    'password': '45inPXtW',
    'to': '61'+mobileNum, //Change this to handle global numbers
    'from' : 'myBUZZ',
    'text' : smsMessage
    }}, function(error, response, body){
      console.log("SMS Gateway response: " + body);
      if (error !== undefined)
      {
        IncrementBuzzCount(checkInRecord);
      }
    });
}
//------------------------------


function GetSmsText(userName, orderNumber, state, businessName) {

  console.log('Trying to send sms. State of check in is ' + state);
  if (state == 'WaitingForOrder' ||  state == 'BuzzedForOrder')
  {
    return "Hi " + userName + ", your order " + orderNumber + " at " + businessName  + " is now ready. Please come to the counter.";
  } 
  else
  {
    if (state == 'WaitingForTable' ||  state == 'BuzzedForTable')
    {
      return "Hi " + userName + ", your table at " + businessName  + " is now ready. Please come to the counter to be seated." ;
    }

  };
  return "Notification from " + businessName  + ". Please check with the counter.";

}
//------------------------------


function GetNotificationMessageBody(userName, orderNumber, state, businessName)
{
  console.log('Trying to send a notification. State of check in is ' + state);
  if (state == 'WaitingForOrder' ||  state == 'BuzzedForOrder')
  {
    return "Hi "+ userName +", your order " + orderNumber + " at " + businessName  + " is now ready. Please come to the counter.";
  }
  else
  {
    if (state == 'WaitingForTable' ||  state == 'BuzzedForTable')
    {
      return "Hi "+ userName +", your table at " + businessName + " is now ready. Please come to the counter to be seated." ;
    }

  };

  return "Notification from " + businessName  + ". Please check with the counter.";
}
//------------------------------


function IncrementBuzzCount(checkInRecord){

  var newBuzzCount = checkInRecord.buzzedCount + 1;
  CheckIn.update(checkInRecord.id, {buzzedCount: newBuzzCount}, function CheckInUpdate(err) {

  });

}
//------------------------------



