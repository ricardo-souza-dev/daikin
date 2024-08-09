// Login page event

$(document).on("pagebeforeshow", "#internet-setup-page", function(e,data) {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_internet.rb",
			async: false,
			dataType: "json",
			success: function(data,textStatus,jqXHR) {
				if(data['connect']) $('#internet-setup-page #internet-enable').val('true');
				else $('#internet-setup-page #internet-enable').val('false');
				$('#internet-setup-page #internet-enable').slider('refresh');
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on("pageinit", "#internet-setup-page", function(e) {
	$(this).on("click", "#internet-save", function(e) {
		try {
			var internet = false
			if($('#internet-setup-page #internet-enable').val() == 'true') internet = true;
			$.ajax({
				type: "POST",
				url: "/server/set_internet.rb",
				async: false,
				data: {connect: internet},
				success: function(data, textStatus, jqXHR) {
					alert(data);
				}
			});
		} catch(e) {
			alert(e);
		}
	});
});

$(document).on("pagebeforeshow", "#network-setup-page", function(e,data) {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_ip.rb",
			async: false,
			dataType: "json",
			success: function(data,textStatus,jqXHR) {
				$('#network-setup-page #ip-addr').val(data['ipaddr']);
				$('#network-setup-page #netmask').val(data['netmask']);
				$('#network-setup-page #def-gw').val(data['gateway']);
				$('#network-setup-page #dns-addr').val(data['dns']);
				if(data['wifi']) $('#network-setup-page #wifi-enable').val('true');
				else $('#network-setup-page #wifi-enable').val('false');
				$('#network-setup-page #wifi-enable').slider('refresh');
				if(data['dhcp']) $('#network-setup-page #dhcp-enable').val('true');
				else $('#network-setup-page #dhcp-enable').val('false');
				$('#network-setup-page #dhcp-enable').slider('refresh');
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on("pageinit", "#network-setup-page", function(e) {
	$(this).on("click", "#network-save", function(e) {
		try {
			var wifi = false;
			if($('#network-setup-page #wifi-enable').val() == 'true') wifi = true;
			var dhcp = false;
			if($('#network-setup-page #dhcp-enable').val() == 'true') dhcp = true;
			var ipaddr = $('#network-setup-page #ip-addr').val();
			var netmask = $('#network-setup-page #netmask').val();
			var gateway = $('#network-setup-page #def-gw').val();
			var dns = $('#network-setup-page #dns-addr').val();

			$.ajax({
				type: "POST",
				url: "/server/set_ip.rb",
				async: false,
				data: {ipaddr: ipaddr, netmask: netmask, gateway: gateway, dns: dns, wifi: wifi, dhcp: dhcp},
				success: function(data, textStatus, jqXHR) {
					alert(data);
				}
			});
		} catch(e) {
			alert(e);
		}
	});
});

$(document).on("pagebeforeshow", "#wifi-setup-page", function(e,data) {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_wifi.rb",
			async: false,
			dataType: "json",
			success: function(data,textStatus,jqXHR) {
				$('#wifi-setup-page #ssid').val(data['ssid']);
				$('#wifi-setup-page #pin').val(data['pin']);
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on("pageinit", "#wifi-setup-page", function(e) {
	$(this).on("click", "#wifi-save", function(e) {
		try {
			var ssid = $('#wifi-setup-page #ssid').val();
			var pin = $('#wifi-setup-page #pin').val();
			$.ajax({
				type: "POST",
				url: "/server/set_wifi.rb",
				async: false,
				data: {ssid: ssid, pin: pin},
				success: function(data, textStatus, jqXHR) {
					alert(data);
				}
			});
		} catch(e) {
			alert(e);
		}
	});
});

$(document).on('pagebeforeshow','#timezone-setup-page',function(e,date) {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_timezone.rb",
			async: false,
			dataType: "text",
			success: function(data,textStatus,jqXHR) {
				var zone = data.replace(/[\n\r]/g,"");
				$('#timezone-setup-page #tzone').val(zone).selectmenu('refresh',true);
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on('click','#timezone-setup-page #timezone-save',function(e) {
	try {
		var tzone = $('#timezone-setup-page #tzone').val();
		$.ajax({
			type: "POST",
			url: "/server/set_timezone.rb",
			async: false,
			data: {tzone: tzone},
			success: function(data, textStatus, jqXHR) {
				alert(data);
			}
		});
	} catch(e) {
		alert(e);
	}	
});

/* DTA116A51 connection setting */
$(document).on('pagebeforeshow','#adaptor-setup-page',function(e,date) {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_adaptor.rb",
			async: false,
			dataType: "json",
			success: function(data,textStatus,jqXHR) {
				var adaptors = data['adaptors'].toString(10);
				$('#adaptor-setup-page #adaptor').val(adaptors).selectmenu('refresh',true);
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on('click','#adaptor-setup-page #adaptor-save',function(e) {
	try {
		var adaptor = $('#adaptor-setup-page #adaptor').val();
		adaptor = parseInt(adaptor);	
		$.ajax({
			type: "POST",
			url: "/server/set_adaptor.rb",
			async: false,
			data: {adaptors: adaptor},
			success: function(data, textStatus, jqXHR) {
				alert(data);
			}
		});
	} catch(e) {
		alert(e);
	}	
});

// Alert mail setup page event
$(document).on("pagebeforeshow", "#alert-mail-setup-page", function(e,data) {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_alertmail.rb",
			async: false,
			dataType: "json",
			success: function(data,textStatus,jqXHR) {
				if(data['active'] == 'true') $('#alert-mail-setup-page #alert-enable').val('true');
				else $('#alert-mail-setup-page #alert-enable').val('false');
				$('#alert-mail-setup-page #alert-enable').slider('refresh');

				$('#alert-mail-setup-page #smtp-server').val(data['address']);
				$('#alert-mail-setup-page #port').val(data['port']);
				$('#alert-mail-setup-page #domain').val(data['domain']);
				$('#alert-mail-setup-page #usrname').val(data['user']);
				$('#alert-mail-setup-page #passwd').val(data['passwd']);
				$('#alert-mail-setup-page #sndname').val(data['site']);
				var list = '';
				for(var i = 0; i < data['to'].length; i++) {
					list += (data['to'][i] + '\n');
				}
				$('#alert-mail-setup-page #sndaddr').val(list);
				$('#alert-mail-setup-page #lang-select').val(data['lang']);
				$('#alert-mail-setup-page #lang-select').selectmenu('refresh');
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on("pageinit", "#alert-mail-setup-page", function(e) {
	$(this).on("click", "#alert-mail-save", function(e) {
		try {
			var active = $('#alert-mail-setup-page #alert-enable').val();
			var addr = $('#alert-mail-setup-page #smtp-server').val();
			var port = parseInt($('#alert-mail-setup-page #port').val());
			var domain = $('#alert-mail-setup-page #domain').val();
			var user = $('#alert-mail-setup-page #usrname').val();
			var passwd = $('#alert-mail-setup-page #passwd').val();
			var to = $('#alert-mail-setup-page #sndaddr').val().split('\n');
			var site = $('#alert-mail-setup-page #sndname').val();
			var lang = $('#alert-mail-setup-page #lang-select').val();
			var param = JSON.stringify({active: active, address: addr, port: port, domain: domain, user: user, passwd: passwd, to: to, site: site, lang: lang});
			console.log(param);
			$.ajax({
				type: "POST",
				url: "/server/set_alertmail.rb",
				async: false,
				data: {data: param},
				success: function(data, textStatus, jqXHR) {
					alert(data);
				}
			});
		} catch(e) {
			alert(e);
		}
	});
});

$(document).on("click", "#customize-page #img-save", function(e) {
	var fd = new FormData();
	var $file = $('#img-form');
	fd.append($file.attr('name'),$file.prop('files')[0]);
	$.ajax({
		url: '../server/imgfile_save.rb',
		method: 'post',
		async: false,
		data: fd,
		processData: false,
		contentType: false,
		success: function(data) {
			alert(data);
		}
	});	
});


// functions 



