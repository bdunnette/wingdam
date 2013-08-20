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
	  'click': function() {
		  Assets.insert({
			  title: $('.asset').val()
		  });
		  $('.asset').val('');
	  }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
