Songs = new CollectionFS("songs", {autopublish: false});
Images = new CollectionFS("images", {autopublish: false});

//security
var allowRules = {
    insert: function(userId, file) {
        return userId && file.owner === userId;
    },
    update: function(userId, file, fields, modifier) {
        return userId && file.owner === userId;
    },
    remove: function(userId, file) {
        return userId && file.owner === userId;
    }
};
Images.allow(allowRules);

//filters
Images.filter({
    allow: {
        contentTypes: ['image/*']
    },
    maxSize: 1048576 //1MB
});

if (Meteor.isClient) {
    var imgSelectionDep = new Deps.Dependency();
    
    Accounts.ui.config({
        passwordSignupFields: 'USERNAME_ONLY'
    });

    //data subscriptions
    Meteor.subscribe("images");

    Images.acceptDropsOn("imgListArea", ".imgList");
    
    //events
    Template.imgListArea.events({
        'click #addImage': function(e) {
            e.preventDefault();
            Session.set("visibleDialog", "img.add");
        },
        'click #deleteImages': function(e) {
            e.preventDefault();
            $('.imgItem.selected').fadeOut(600, function() {
                var fileId = $(this).attr("data-cfs-id");
                Images.remove(fileId);
                imgSelectionDep.changed();
            });
        }
    });
    
    var onInvalid = function(type, fileRecord) {
        if (type === CFSErrorType.disallowedContentType || type === CFSErrorType.disallowedExtension) {
            $.gritter.add({
                title: 'Wrong File Type',
                text: "Sorry, " + fileRecord.filename + " is not the type of file we're looking for."
            });
        } else if (type === CFSErrorType.maxFileSizeExceeded) {
            $.gritter.add({
                title: 'Too Big',
                text: "Sorry, " + fileRecord.filename + " is too big to upload."
            });
        }
    };
    Images.events({
       'invalid': onInvalid 
    });

    var dataUrlCache = {};
    Handlebars.registerHelper('fileImage', function(opts) {
        var file, hash, src = "", style = "";
        hash = opts && opts.hash ? opts.hash : {};
        if (!hash.collection) {
            return "";
        }
        if (hash.fileId && hash.collection) {
            file = window[hash.collection].findOne(hash.fileId);
        }
        if (!file) {
            file = hash.file || this;
        }
        if (!file) {
            return "";
        }
        if (dataUrlCache[file._id + "_" + file.length]) {
            //we've already generated the URL, so just use it
            src = dataUrlCache[file._id + "_" + file.length];
        } else {
            style = "display: none";
            window[hash.collection].retrieveBlob(file._id, function(fileItem) {
                if (fileItem.blob || fileItem.file) {
					var fileReader = new FileReader();
                    fileReader.onload = function(oFREvent) {
                        if (!dataUrlCache[file._id + "_" + file.length]) {
                            dataUrlCache[file._id + "_" + file.length] = oFREvent.target.result;
                        }
                        var elem = $("img[data-cfs-collection=" + hash.collection + "]").filter('[data-cfs-id=' + file._id + ']');
                        elem.attr("src", oFREvent.target.result);
                        elem.css("display", "");
                    };
                    fileReader.readAsDataURL(fileItem.blob || fileItem.file);
                }
            });
        }
        console.log(file);
        return new Handlebars.SafeString('<img src="' + src + '" data-cfs-collection="' + hash.collection + '" data-cfs-id="' + file._id + '" style="' + style + '" class="' + (hash.class || '') + '" />');
    });
    
    Template.image.events({
        'click .imgItem': function(event) {
            $(event.currentTarget).toggleClass("selected");
            this.selected = $(event.currentTarget).hasClass("selected");
            imgSelectionDep.changed();
        }
    });
    
    Template.imgListArea.deleteImagesButtonDisabled = function () {
        imgSelectionDep.depend();
        return $(".imgItem.selected").length ? "" : " disabled";
    };

    Handlebars.registerHelper("loggedIn", function() {
        return !!Meteor.user();
    });

    //upload buttons
    Template.dialogAddImg.events({
        'click .save': function(e, template) {
            e.preventDefault();
            var files = template.find('input.fileSelect').files;
            console.log(files);
            for (file in files) {
				Images.storeFile(file, {title: file.filename});
			};
            Session.set("visibleDialog", null);
        }
    });

    //delete buttons
    Template.song.events({
        'click .delete': function(e) {
            e.preventDefault();
            Songs.remove(this._id);
        }
    });

    //generic dialog close event
    $(document).on('click', 'button.cancel', function(e) {
        e.preventDefault();
        Session.set("visibleDialog", null);
    });
}

if (Meteor.isServer) {
    Accounts.config({
        sendVerificationEmail: false
    });

    Meteor.publish("images", function() {
        return Images.find({}, {$sort: {uploadDate: -1}});
    });
}
