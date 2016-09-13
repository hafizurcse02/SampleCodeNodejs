/**
 * BusinessController
 *
 * @description :: Server-side logic for managing businesses
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	index: function(req,res){
    console.log(new Date().toISOString() + ': BusinessController::index');

	    // Check session if logged in redirect to dashboard
		if(req.session.Business.id)
			res.redirect('/business/checkIn');
		else	
		// Else redirect to login page
		res.redirect('/business/login');
		
	},

	login : function(req,res){
		res.view();
	},

	register: function(req,res){
		res.view();
	},


  
  checkedinList: function(req,res){
    
    console.log(new Date().toISOString() + ': BusinessController::checkedinList');
    console.log(req.session);

    var viewState = req.param('state');
    //res.session.lastViewState = viewState;
    //console.log(req.session);
    //console.log(res.session.lastViewState);

    CheckIn.find({businessID:req.session.Business.id, state:viewState}).sort({timeOfCurrentState:1}).exec(function findCB(err, result){
        res.view({
          CheckIn : result,
          state : viewState
        });       
    });    
  },

  checkIn: function(req,res){

    console.log(new Date().toISOString() + ': BusinessController::checkin');

    // Get an array of all CheckIn customers with a specific type
    CheckIn.find(function foundOrders(err, results) {
      if(err) return(err);

      //pass array to the view
      res.view({
        CheckIn : results
      });             

    });
  },  
 
  checkedinCreate: function(req,res){
    
    console.log(new Date().toISOString() + ': BusinessController::checkedinCreate');

    var checkedinID = req.param('id');
    CheckIn.findOne({id:checkedinID}).exec(function(err, results) {

        if(err) return(err);

        res.view({
          CheckIn:results,
          ModifyMode: true
      });
    });
  },

   
	search: function(req,res){

    console.log(new Date().toISOString() + ': BusinessController::search');

		var query = req.param('query');

  		if(query){
    		//search business according to search query

    		Business.find({ 
           					or :[ 
                					{ like: { business_name: '%'+query+'%' }  }
               					] 
           				} , function ( err, business ){
        
        		// some code here
        		if(err){
          			console.log(err);
        		}
        		
        		//console.log(business);
          			//res.json(business);
          			res.view(business);
          			//res.redirect('product/')
        		

    		});
  		}
  		else{

  			Business.find().exec(function(err,business){
  				if(err)
  					console.log(err);

  				res.view({business:business});	
  			})
  			
  		}
  
		
	},

	menu: function(req,res){

    console.log(new Date().toISOString() + ': BusinessController::menu');

		//Get business id from session
		business_id = req.session.Business.id;

		//Get an array of all Products in the product collection
  		Category.find({business: business_id}).exec(function(err, category){
  			
  			if(err) return(err);

  			//pass array to the view
  			res.view({
  				category : category
  			});
  		});
		
	},

	setting: function(req,res){

    console.log(new Date().toISOString() + ': BusinessController::setting');

		Business.findOne(req.session.Business.id).exec(function(err,business){

			if(err) return(err);

			res.view({
				business: business
			});	
		})

	},

	tables: function(req,res){

    console.log(new Date().toISOString() + ': BusinessController::tables');

		Tables.findOne({business:req.session.Business.id}).exec(function(err,table){
			
			if(err) return(err);

			res.view({
				table:table
			});
		});
		
	},

	items: function(req,res){

    console.log(new Date().toISOString() + ': BusinessController::items');

		var category_id = req.param('id');

		Category.findOne({id:category_id}).exec(function(err, category) {

			Items.find({category:category_id}).exec(function(err,items){

				if(err) return(err);


				res.view({
					category:category,
					items:items
				});
			});
		});

		
	},


	// Create business based on information on register view
	create: function(req,res,next){

    console.log(new Date().toISOString() + ': BusinessController::create');

		//Generate a unique token 
		var password = req.param('password'); 

		var lat = parseFloat(req.param('lat'));
  		var lng = parseFloat(req.param('lng'));

  		console.log('geoLocation : '+lng+','+lat);

		var gps = {

    				"type": "Point",
    				"coordinates": [lng,lat]
  			
		};



		console.log(gps);

		require('bcrypt').hash(password,10, function passwordEncrypted(err,encryptedPassword) {
          
          if(err) 
          	return next(err);



		// Business Object
		var businessObj  ={
			business_name : req.param('business_name'),
			business_address : req.param('business_address'),
			gps : gps,
			longitude : req.param('lng'),
			latitude : req.param('lat'),
			contact_name : req.param('contact_name'),
			email : req.param('email'),
      lastOrderNumber: 0,
			contact_phone : req.param('contact_phone'),
			password: encryptedPassword
		}

		//console.log(businessObj);

		Business.create(businessObj,function businessCreated(err,business){
			// Check for error
			if(err){
				console.log(err);
				req.session.flash = {
					err : err
				}
				// Redirect to register page 
				return res.redirect('/business/register');
			}

			// On sucessful register send email with login details
			var subject = 'Thank you for registering with myBuzzApp';


          var bodyContent = 'Welcome '+ req.param('business_name')+',<br><br> Thank you for registering your business with myBUZZ smart paging notification system. Your account was successfully created.<br><br>You\'re just steps away from being able to instantly notify your guests mobile when their order or table is ready!<br><br> <b>Your account details are...</b><br> Username: '+req.param('email')+'<br> Password: '+req.param('password')+' <br><br>To get started, head to the <a href="http://admin.mybuzzapp.com/">myBUZZ Business Portal</a> and log in with the account details provided. It\'s that easy!<br><br>Any questions, please don\'t hesitate to get in touch with a member of the myBUZZ team via <a href="mailto:hello@mybuzzapp.com">email</a> or phone <b>1800 MY BUZZ</b> (1800 692 899).<br><br>Kind regards,<br>The myBUZZ team';
 
       		EmailService.sendEmailMailGun({receiver:req.param('email'),subject:subject,bodyContent:bodyContent}, function(err,email){
            	if(err)
                	console.log(err);
        	}); 


			// Set session 
			req.session.Business = business;

        	// Redirect to dashboard
        	//res.json(business);
        	res.redirect('/business/checkIn')

		}); 
		
		});
	},

//update the value from edit form
  profileUpdate: function(req,res,next){

    console.log(new Date().toISOString() + ': BusinessController::profileUpdate');
		var lat = parseFloat(req.param('lat'));
		var lng = parseFloat(req.param('lng'));

		console.log('geoLocation : '+lng+','+lat);

		var gps = {

    				"type": "Point",
    				"coordinates": [lng,lat]
  			
		};

  	// Business Object
		var businessObj  ={
			business_name : req.param('business_name'),
			business_address : req.param('business_address'),
			gps : gps,
			longitude : req.param('lng'),
			latitude : req.param('lat')
		}


  	Business.update(req.param('id'),businessObj, function userUpdated(err,data){
  		if(err) {
  			return res.send(err);
  		}
  		if(data){
  			
			console.log(data);

  		}
      //res.send(200);
  	  res.redirect('/business/setting/'+req.param('id'));
  	});
  },

  //Contact Update Function
  contactUpdate : function(req,res,next){

    console.log(new Date().toISOString() + ': BusinessController::contactUpdate');

  	// Business Object
		var businessObj  ={
			contact_name : req.param('contact_name'),
			//email : req.param('email'),
			contact_phone : req.param('contact_phone')
		}


  		Business.update(req.param('id'),businessObj, function userUpdated(err,data){
  			if(err) {
  				return res.send(err);
  			}
  			if(data){
  				console.log(data);
			}
     		res.redirect('/business/setting/'+req.param('id'));
  		});

  },


  //Password Update Function
  passwordUpdate: function(req,res,next){

    console.log(new Date().toISOString() + ': BusinessController::passwordUpdate');

    var password = req.param('password'); 
    
    require('bcrypt').hash(password,10, function passwordEncrypted(err,encryptedPassword) {
          
        if(err) 
          	return next(err);

    // Business Object
		var businessObj  ={
			password: encryptedPassword
		}


  		Business.update(req.param('id'),businessObj, function userUpdated(err,data){
  			if(err) {
  				return res.send(err);
  			}
  			if(data){
  				console.log(data);
			}
     		res.redirect('/business/setting/'+req.param('id'));
  		});
  	});
  },

//show business details
  show: function(req,res,next){

    console.log(new Date().toISOString() + ': BusinessController::show');

  	Business.findOne(req.param('id'), function foundProduct(err,business) {
  		if(err) return next(err);

  		if(!business) return next();
      	
  		res.json(business);
  	});
  },

  nearMe: function(req,res,next){

    console.log(new Date().toISOString() + ': BusinessController::nearMe');

  	// Get user location
  	var lat = parseFloat(req.param('lat'));
  	var lng = parseFloat(req.param('lng'));

  	console.log('geoLocation : '+lat+','+lng);
  	

  	//Search Business based on location
  	Business.native(function(err, collection) {
     
       collection.geoNear(lng,lat, {
        limit: 30,
        maxDistance: 3000/6378137, // in meters
        //query: {}, // allows filtering
        distanceMultiplier: 6378137, // converts radians to miles (use 6371 for km)
        spherical : true
      }, function(mongoErr, business) {
        if (mongoErr) {
          console.error(mongoErr);
          res.send('geoProximity failed with error='+mongoErr);
        } else {
    		//console.log(business.results);      
			//res.view('business/serach',business.results);
			//res.send('proximity successful, got '+docs.results.length+' results.');
            res.json(business.results);
        }
      });
    });
	
  },

  getNextOrderNum: function(req,res,next){
    console.log(new Date().toISOString() + ': BusinessController::getNextOrderNum');

    // Find the record.
    Business.findOne(req.param('id')).exec(function afterFindBusiness(errBusinessFind, foundBusiness){

      if (errBusinessFind) {

        return next(errBusinessFind);

      } else {

        if (foundBusiness === undefined) {
          
          // Could not find the record in the business table.
          console.log('Could not find Business record with ID: ' + params['id']);
          return res.json({
            error: 'Could not find Business record with ID: ' + params['id']
          });          

        } else {

          var newOrderNum = foundBusiness.lastOrderNumber + 1;
          if (newOrderNum > 9999)
          {
            newOrderNum = 0;
          }

          Business.update(req.param('id'),
                          {lastOrderNumber: newOrderNum}, 
                          function afterOrderNumUpdated(errBusinessUpdate,updateBusiness){
            if(errBusinessUpdate) {
              return res.send(errBusinessUpdate);
            }

            return res.json({
              NewOrderNum: '#OID' + newOrderNum
            }); 

          }); // END - Business update.

        } //  END - Business not found.

      } // END - Error on find Business.

    }); // END - Find business.

  }

};



