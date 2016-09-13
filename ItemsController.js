/**
 * ItemsController
 *
 * @description :: Server-side logic for managing items
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	create: function(req,res){
      console.log('Item index');
      //item object
      itemObj = {
        item_name : req.param('item_name'),
        item_desc : req.param('item_desc'),
        item_price : req.param('item_price'),
        category: req.param('category')
      }

      Items.create(itemObj,function itemCreated(err,item){

        if(err)
            console.log(err);

        res.redirect('/business/items?id='+req.param('category'));

      });
  },

     //delete action
  destroy: function(req,res,next){

    console.log('Item destroy');
    Items.findOne(req.param('id'), function foundItem(err,item){

      if(err) return next(err);

      if(!item) return next('Item doesn\'t exists.');

      Items.destroy(req.param('id'), function itemDestroyed(err){
        if(err) return next(err);
      });

      res.redirect('/business/items?id='+req.param('category'));

    });
  }
	
};

