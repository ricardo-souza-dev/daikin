
// login page event
$(document).ready(function() {
	if(LOCAL) {
		// check if local connection can use
		$.ajax({ 
			type:'POST',
			url:location.href.replace('index.html','')+'/server/sis.json',
			dataType:'json',
			async: false,
			cache: false
		}).done(function(data) {
			// local host access
			$('#login-page .register').hide();
			// write sis access information
			if(window.localStorage) {
				window.localStorage.setItem('sis_connect',data.connect);
				window.localStorage.setItem('sis_host',data.host);
			} else {
			}
		}).fail(function(jqXHR, textStatus, errorThrown) {
			// redirect to internet site
			if(window.localStorage) {
				var connect = window.localStorage.getItem('sis_connect');
				var host = window.localStorage.getItem('sis_host');
				if(connect == 'true') location.href = 'https://'+host+'/SVMP'+MODEL+'/';
			} else {
			}
		});
	} else { 	// internet access through SIS
		// if internet access is not registered yet then register screen will show
		var accessKey = null;
		if(window.localStorage) {
			accessKey = window.localStorage.getItem(MODEL+'key');
		}
		if(accessKey == null) {	// access key is not registered yet
			$('.login-panel .std').hide();
			$('.login-panel .register').show();
		} else {
			$('.login-panel .std').show();
			$('.login-panel .register').hide();
		}
	}

	if(window.localStorage) {
		var lang = window.localStorage.getItem('lang');
		if(lang && lang.length > 0) {
			LANG = lang;
		}
		USER = window.localStorage.getItem('user');
		PASSWD = window.localStorage.getItem('passwd');
	}
	loadStringTable();
	setMultiLang('body .mls');
	WIDTH = $(window).width();
	HEIGHT = $(window).height();
	$('.container').width(WIDTH);
	$('.container').height(HEIGHT);
	$('.loading').css('top',HEIGHT/2-50);
	$('.loading').css('left',WIDTH/2-50);
//	$('#svm-ctrl').attr('placeholder',getString('svm_ctrler'));
//	showOpening();
	showLoginPage();
});

$(document).on('click','img.daikin-logo',function(e) {
	if(LOCAL) {
		if(window.localStorage) {
			var connect = window.localStorage.getItem('sis_connect');
			var host = window.localStorage.getItem('sis_host');
			var registered = window.localStorage.getItem('registered');
			if(connect == 'true') {
				if(registered == 'true') location.href = 'https://'+host+'/SVMP'+MODEL+'/';
				// GET key to get access key
				$('.loading').show();
				try {
					// generate key to get access key
					var key = (new Date().getTime()%10000000).toString(16);
					$.ajax({
						type: "POST",
						url: location.href.replace('index.html','')+"/server/key_generator.rb",
						async: false,
						dataType: "text",
						data: {key: key},
					}).done(function(data,textStatus,jqXHR) {
						$('.loading').hide();
						if(data.indexOf("OK") != -1) {
							window.localStorage.setItem('registered',true);
							alert("Please copy this key and input in the next screen.\r\nKey: "+key);
							location.href = 'https://'+host+'/SVMP'+MODEL+'/';
						} else {
							alert("Registration process is failed. Please check internet access is available.");
						}
					}).fail(function(data,textStatus,errorThrown) {
							$('.loading').hide();
							alert(textStatus);
					});
				} catch(e) {
					alert(e);
				}
			}
		} else {
		}	
	}
});

$(document).on('click','.login-panel #login',function(e) {
	USER = $('.login-panel .user').val();
	PASSWD = $('.login-panel .passwd').val();
	if(window.localStorage) {
		window.localStorage.setItem('user',USER);
		window.localStorage.setItem('passwd',PASSWD);
	}
	$('.top-page').hide();
	$('.loading').fadeIn(1000);
	connect();
	SCROLL_TOP = 0;
});

// register access key to sis
$(document).on('click','.login-panel #reg-btn',function(e) {
	var key = $('.login-panel #svm-ctrl').val();
	var host = window.localStorage.getItem('sis_host');
	$.ajax({ 
		type:'POST',
		url: location.origin+'/accesskey/'+key+'.jsonp',
		dataType:'jsonp',
		jsonpCallback: 'accesskey',
		cache: false
	}).done(function(json) {
		if(window.localStorage) {
			window.localStorage.setItem(MODEL+'key',json.key);
			window.localStorage.setItem(MODEL+'siteid',json.site_id);
		} else {
			alert('error');	// internet access can not use
		}
		location.reload();
	}).fail(function(jqXHR, textStatus, errorThrown) {
		alert(errorThrown); // cannot get access key
	});
});