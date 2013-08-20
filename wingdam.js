Assets = new Meteor.Collection('assets');

if (Meteor.isClient) {
  Template.content.helpers({
	  users: function() {
		  return Meteor.users.find();
	  },
	  assets: function() {
		  return Assets.find();
	  }
  });
  
  Template.add_item.events({
	  'click .submit': function() {
		  Assets.insert({
			  title: $('.asset').val()
		  });
		  $('.asset').val('');
	  }
  });
  
  Template.asset.events({
	  'click .delete': function() {
		  console.log(this);
		  Assets.remove(this._id);
	  }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
