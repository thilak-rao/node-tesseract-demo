(function() {
	'use strict';
	var files;
	$('#fileInput').on('change', prepareUpload);
	$('#uploadImg').on('submit', uploadFiles);
	$('#tryAgain').on('click', tryAgain);

	// Grab the files and set them to our variable
	function prepareUpload(event) {
	  files = event.target.files;
	}

	function uploadFiles(event){
	    event.stopPropagation(); // Stop stuff happening
	    event.preventDefault(); // Totally stop stuff happening
	    
	    // Create a formdata object and add the files
	    var data = new FormData();
	    $.each(files, function(key, value) {
	        data.append(key, value);
	    });

	    $.ajax({
	        url: '/upload',
	        type: 'POST',
	        data: data,
	        cache: false,
	        dataType: 'json',
	        processData: false, // Don't process the files
	        contentType: false, // Set content type to false as jQuery will tell the server its a query string request
	        success: function(data, textStatus, jqXHR) {
	            if (typeof data.error === 'undefined') {
	                // Success so call function to process the form
	                uploadSuccess(event, data);
	                poll();
	            } else {
	                // Handle errors here
	                console.log('ERRORS: ' + data.error);
	            }
	        },
	        error: function(jqXHR, textStatus, errorThrown) {
	            // Handle errors here
	            console.log('ERRORS: ' + textStatus);
	            // STOP LOADING SPINNER
	        }
	    });
	}

	function uploadSuccess(event, data) {
		$('#successCallout').show();
	}

	function poll(){
	    $.ajax({ url: "/polling", success: function(data){
	        if(data.response){
        		$('#ocrText').html(data.response).parent().show();
        		$('#successCallout').hide();
	        }
	    }, dataType: "json", complete: poll, timeout: 30000 });
	}

	function tryAgain(e){
		e.preventDefault();
		window.location.reload();
	}
}());
