// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Search the bookmarks when entering the search keyword.
/* 
$(function() {
  $('#search').change(function() {
     $('#bookmarks').empty();
     dumpBookmarks($('#search').val());
  });
}); */

$(function() {
	$('#findButton').click(function(){
		var search = $('#search').val();
		var replace = $('#replace').val();
		console.log("search="+search+", replace="+replace);
		dumpBookmarks(search, replace);
	});
});
	
chrome.browserAction.onClicked.addListener(function(tab) {
  console.log("listing bookmarks: " );
  chrome.bookmarks.getTree( process_bookmark );
});
// Traverse the bookmark tree, and print the folder and nodes.
function dumpBookmarks(query, newValue) {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      $('#bookmarks').append(dumpTreeNodesToLog(bookmarkTreeNodes, query, newValue));
    });
}
function dumpTreeNodes(bookmarkNodes, query) {
  var list = $('<ul>');
  var i;
  for (i = 0; i < bookmarkNodes.length; i++) {
    list.append(dumpNodeToLog(bookmarkNodes[i], query));
  }
  return list;
}

function dumpTreeNodesToLog(bookmarkNodes, query, newValue) {
  var i;
  for (i = 0; i < bookmarkNodes.length; i++) {
    dumpNodeToLog(bookmarkNodes[i], query, newValue);
  }
}

function dumpNodeToLog(bookmarkNode, query, newValue){
    if (bookmarkNode.title) {
       if (query && !bookmarkNode.children) {
          if (String(bookmarkNode.url).indexOf(query) != -1) {
			  console.log("The bookmark "+String(bookmarkNode.url) +"contains " + query + " will be changed to " +newValue);
			  updateUrl(bookmarkNode, query,newValue);
		  }
			  
       }
	}
	if (bookmarkNode.children && bookmarkNode.children.length > 0) {
        dumpTreeNodesToLog(bookmarkNode.children, query, newValue );
  }
}

function updateUrl(bookmarkNode, oldVal, newVal){
	newUrl=String(bookmarkNode.url).replace(oldVal, newVal);
	console.log("Updating url of bookmark with url " + bookmarkNode.url + " to " + newUrl );
	chrome.bookmarks.update(String(bookmarkNode.id), {
                   url: newUrl
                 });
}

function dumpNode(bookmarkNode, query) {
  if (bookmarkNode.title) {
    if (query && !bookmarkNode.children) {
      if (String(bookmarkNode.url).indexOf(query) == -1) {
        return $('<span></span>');
      }
	  console.log("The bookmark "+String(bookmarkNode.url) +" contains " + query);
    
    var anchor = $('<a>');
    anchor.attr('href', bookmarkNode.url);
    anchor.text(bookmarkNode.title);
    /*
     * When clicking on a bookmark in the extension, a new tab is fired with
     * the bookmark url.
     */
    anchor.click(function() {
      chrome.tabs.create({url: bookmarkNode.url});
    });
    var span = $('<span>');
    var options = bookmarkNode.children ?
      $('<span>[<a href="#" id="addlink">Add</a>]</span>') :
      $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
        'href="#">Delete</a>]</span>');
    var edit = bookmarkNode.children ? $('<table><tr><td>Name</td><td>' +
      '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
      '</td></tr></table>') : $('<input>');
    // Show add and edit links when hover over.
        span.hover(function() {
        span.append(options);
        $('#deletelink').click(function() {
          $('#deletedialog').empty().dialog({
                 autoOpen: false,
                 title: 'Confirm Deletion',
                 resizable: false,
                 height: 140,
                 modal: true,
                 overlay: {
                   backgroundColor: '#000',
                   opacity: 0.5
                 },
                 buttons: {
                   'Yes, Delete It!': function() {
                      chrome.bookmarks.remove(String(bookmarkNode.id));
                      span.parent().remove();
                      $(this).dialog('destroy');
                    },
                    Cancel: function() {
                      $(this).dialog('destroy');
                    }
                 }
               }).dialog('open');
         });
        $('#addlink').click(function() {
          $('#adddialog').empty().append(edit).dialog({autoOpen: false,
            closeOnEscape: true, title: 'Add New Bookmark', modal: true,
            buttons: {
            'Add' : function() {
               chrome.bookmarks.create({parentId: bookmarkNode.id,
                 title: $('#title').val(), url: $('#url').val()});
               $('#bookmarks').empty();
               $(this).dialog('destroy');
               window.dumpBookmarks();
             },
            'Cancel': function() {
               $(this).dialog('destroy');
            }
          }}).dialog('open');
        });
        $('#editlink').click(function() {
         edit.val(anchor.text());
         $('#editdialog').empty().append(edit).dialog({autoOpen: false,
           closeOnEscape: true, title: 'Edit Title', modal: true,
           show: 'slide', buttons: {
              'Save': function() {
                 chrome.bookmarks.update(String(bookmarkNode.id), {
                   title: edit.val()
                 });
                 anchor.text(edit.val());
                 options.show();
                 $(this).dialog('destroy');
              },
             'Cancel': function() {
                 $(this).dialog('destroy');
             }
         }}).dialog('open');
        });
        options.fadeIn();
      },
      // unhover
      function() {
        options.remove();
      }).append(anchor);
	}
  }
  var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    li.append(dumpTreeNodes(bookmarkNode.children, query));
  }
  return li;
}

document.addEventListener('DOMContentLoaded', function () {
  dumpBookmarks();
});