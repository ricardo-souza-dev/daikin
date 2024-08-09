function connection_info() {
	// read device_list.json
	try {
		$.ajax({
			type: "POST",
			url: "../server/get_devices.rb",
			async: false,
			dataType: "json"
		}).then(
			function(data) {
				USB_DEV = {};
				LAN_DEV = {};
				for(var i = 0; i < data.length; i++) {
					switch(data[i][0]) {
						case 'Dta116':
							USB_DEV[USB_ID++] = data[i];
							break;
						case 'SmartMeter':
							SMETER = data[i];
							break;
						case 'Itm':
							LAN_DEV[LAN_ID++] = data[i];
							break;
						case 'Itc':
							LAN_DEV[LAN_ID++] = data[i];
							break;
						case 'WagoIo':
							LAN_DEV[LAN_ID++] = data[i];
							break;
						case 'Dmobile':
							LAN_DEV[LAN_ID++] = data[i];
							break;
						case 'ZWave':
							ZW_DEV = true;
							break;
					}					
				}
				update_usb_dev();
				update_lan_dev();
				update_zw_dev();
			},
			function() {
				update_usb_dev();
				update_lan_dev();
				update_zw_dev();
			}
		);
	} catch(e) {
		alert(e);
	}
}

function update_usb_dev() {
	$('.connection #usb .dta').remove();
	$('.connection #usb .sm').remove();

	for(var i  in USB_DEV) {
		var line;
		var port = parseInt(USB_DEV[i][2].port.replace(/[^0-9^\.]/g,""));
		line = "<tr class='dta' did='"+i+"'><td class='dev'>DTA116A51</td><td class='id'>"+USB_DEV[i][1]+"</td><td class='usb'>";
		line += "USB"+(port+1);
		line += "</td><td></td><td></td><td class='del-btn'>";
		line += getString('del');
		line += "</td></tr>";
		$('.connection #usb').append(line);
	}
	if(SMETER != null) {
		var port = parseInt(SMETER[2].port.replace(/[^0-9^\.]/g,""));
		var line = "<tr class='sm'><td class='dev'>Smart Meter</td><td class='id'>"+SMETER[1]+"</td><td class='usb'>";
		line += "USB"+(port+1);
		for(var addr in SMETER[2].meters) {
			line2 = "</td><td class='mod-addr'>";
			line2 += addr;				
			line2 += "</td><td class='type'>";
			line2 += METER_TYPE[SMETER[2].meters[addr]];
			line2 += "</td><td class='del-btn mls' param='del'>";
			line2 += getString('del');
			line2 += "</td></tr>";
			$('.connection #usb').append(line+line2);
		}
	}
}

function update_lan_dev() {
	$('.connection #lan .itm').remove();
	$('.connection #lan .itc').remove();
	$('.connection #lan .wago').remove();
	$('.connection #lan .dm').remove();

	for(var i in LAN_DEV) {
		var line;

		switch(LAN_DEV[i][0]) {
			case "Itm":
				line = "<tr class='itm' did='"+i+"'><td class='dev'>iTM</td><td class='id'>";
				break;
			case "Itc":
				line = "<tr class='itc' did='"+i+"'><td class='dev'>iTC</td><td class='id'>";
				break;
			case "WagoIo":
				line = "<tr class='wago' did='"+i+"'><td class='dev'>WAGO</td><td class='id'>";
				break;
			case "Dmobile":
				line = "<tr class='dm' did='"+i+"'><td class='dev'>D-Mobile</td><td class='id'>";
				break;
			default:
				continue;
		}
		line += LAN_DEV[i][1];
		line += "</td><td class='ip'>";
		line += LAN_DEV[i][2].ip_addr;
		line += "</td><td class='port'>";
		line += LAN_DEV[i][2].port;
		line += "</td><td class='del-btn mls' param='del'>";
		line += getString('del');
		line += "</td>"
		$('.connection #lan').append(line);
	}
}

function update_zw_dev() {
	if(ZW_DEV == true) {
		$('.connection #zw-dev').addClass('checked');
	} else {
		$('.connection #zw-dev').removeClass('checked');
	}
}

function make_dev_data() {
	var list = [];
	for(var i in USB_DEV) {
		list.push(USB_DEV[i]);
	}
	if(SMETER != null) list.push(SMETER);
	for(var i in LAN_DEV) {
		list.push(LAN_DEV[i]);
	}
	if($('.connection #zw-dev').hasClass('checked') == true) ZW_DEV = true;
	else ZW_DEV = false;
	if(ZW_DEV == true) {
		list.push(ZWAVE_DATA);
	}
	return list;
}

function make_addr(list) {
	var addrs = Object.keys(list);
	var max = 0;
	for(var i = 0; i < addrs.length; i++) {
		var c = parseInt(addrs[i])
		if(c > max) max = c;
	}
	max++;
	return max.toString(10);
}

function delete_meter(port) {
	if(SMETER == null) return;
	delete(SMETER[2].meters[port.toString(10)])
	if(Object.keys(SMETER[2].meters).length == 0) SMETER = null;
}

$(document).on('click','.connection #save',function() {
	// generate json file from data
	var list = make_dev_data();
	try {
		var param = JSON.stringify(list);
		console.log(param);
		$.ajax({
			type: "POST",
			url: "../server/set_devices.rb",
			async: false,
			data: {data: param},
			success: function(data, textStatus, jqXHR) {
				alert(data);
			},
			error: function() {
				alert("NG");
			}
		});
	} catch(e) {
		alert(e);
	}
});

$(document).on('click','.connection .button#dta',function() {
	USB_DEV[USB_ID++] = ["Dta116",1,{"address":1,"port":"/dev/ttyUSB0","speed":19200,"parity":"EVEN","stopbit":1}];
	update_usb_dev();
});

$(document).on('click','.connection .button#sm',function() {
	if(SMETER == null) {
		SMETER = ["SmartMeter",1,{"port":"/dev/ttyUSB1","speed":19200,"parity":"EVEN","stopbit":1,"meters":{"1":"ShPM5300"}}];
	} else {
		var addr = make_addr(SMETER[2].meters);
		SMETER[2].meters[addr] = "ShPM5300";
	}
	update_usb_dev();
});

$(document).on('click','.connection .button#itm',function() {
	LAN_DEV[LAN_ID++] = ["Itm",1,{"ip_addr":"192.168.0.1","port":8081,"user":"svm","passwd":"svm"}];
	update_lan_dev();
});

$(document).on('click','.connection .button#itc',function() {
	LAN_DEV[LAN_ID++] = ["Itc",1,{"ip_addr":"192.168.0.1","port":80}];
	update_lan_dev();
});

$(document).on('click','.connection .button#wago',function() {
	LAN_DEV[LAN_ID++] = ["WagoIo",1,{"ip_addr":"192.168.0.1","port":502}];
	update_lan_dev();
});

$(document).on('click','.connection .button#dm',function() {
	LAN_DEV[LAN_ID++] = ["Dmobile",1,{"ip_addr":"192.168.0.1","port":502}];
	update_lan_dev();
});

$(document).on('click','.connection .del-btn',function() {
	var class_name = $(this).parent().attr('class');
	if(class_name == 'dta') {
		var did = $(this).parent().attr('did');
		delete(USB_DEV[did]);
		update_usb_dev();
	} else if(class_name == 'sm') {
		var addr = parseInt($(this).parent().find('.mod-addr').text());
		delete_meter(addr);
		update_usb_dev();
	} else {
		var did = $(this).parent().attr('did');
		delete(LAN_DEV[did]);
		update_lan_dev();
	}	
});

$(document).on('click','.connection .usb',function() {
	var parent = $(this).parent();
	var did = $(parent).attr('did');
	if(parent.attr('class') == 'dta') {
		var port = parseInt(USB_DEV[did][2].port.replace(/[^0-9^\.]/g,""));	
		port++;
		if(port > 3) port = 0;
		USB_DEV[did][2].port = '/dev/ttyUSB'+port;
	} else {
		var port = parseInt(SMETER[2].port.replace(/[^0-9^\.]/g,""));	
		port++;
		if(port > 3) port = 0;
		SMETER[2].port = '/dev/ttyUSB'+port;
	}
	update_usb_dev();
});

$(document).on('click','.connection .id',function() {
	DLG_TARG.dev = $(this).parent().attr('class');
	DLG_TARG.did = $(this).parent().attr('did');
	DLG_TARG.param = 'id';
	var pos = $(this).offset();
	$('.connection .dialog input').val($(this).text());
	$('.connection .dialog').show().offset(pos);
});

$(document).on('click','.connection .mod-addr',function() {
	DLG_TARG.dev = $(this).parent().attr('class');
	if(DLG_TARG.dev == 'dta') return;
	DLG_TARG.param = 'mod_addr';
	DLG_TARG.did = $(this).text();
	var pos = $(this).offset();
	$('.connection .dialog input').val($(this).text());
	$('.connection .dialog').show().offset(pos);
});

$(document).on('click','.connection .type',function() {
	var mod_addr = $(this).parent().find('.mod-addr').text();
	var meter = SMETER[2].meters[mod_addr];
	var keys = Object.keys(METER_TYPE);
	var i = keys.indexOf(meter)
	i++; if(i >= keys.length) i = 0;
	SMETER[2].meters[mod_addr] = keys[i];
	update_usb_dev();
});

$(document).on('click','.connection .ip',function() {
	DLG_TARG.dev = $(this).parent().attr('class');
	DLG_TARG.did = $(this).parent().attr('did');
	DLG_TARG.param = 'ip';
	var pos = $(this).offset();
	$('.connection .dialog input').val($(this).text());
	$('.connection .dialog').show().offset(pos);
});

$(document).on('click','.connection .port',function() {
	DLG_TARG.dev = $(this).parent().attr('class');
	DLG_TARG.did = $(this).parent().attr('did');
	DLG_TARG.param = 'port';
	var pos = $(this).offset();
	$('.connection .dialog input').val($(this).text());
	$('.connection .dialog').show().offset(pos);
});

$(document).on('click','.connection .dialog #set',function() {
	var val = $('.dialog input').val();

	try {
		switch(DLG_TARG.dev) {
			case 'dta':
				if(DLG_TARG.param == 'id') {
					USB_DEV[DLG_TARG.did][1] = parseInt(val);
				}
				update_usb_dev();
				break;
			case 'sm':
				if(DLG_TARG.param == 'id') {
					SMETER[1] = parseInt(val);
				} else if(DLG_TARG.param == 'mod_addr') {
					if(SMETER[2].meters[val] != null) {
						alert('Same modbus address cannot specify.');
						return;
					}
					var meter = SMETER[2].meters[DLG_TARG.did];
					delete(SMETER[2].meters[DLG_TARG.did]);
					SMETER[2].meters[val] = meter;
				}
				update_usb_dev();
				break;
			case 'itm':
			case 'itc':
			case 'wago':
			case 'dm':
				if(DLG_TARG.param == 'id') {
					LAN_DEV[DLG_TARG.did][1] = parseInt(val);
				} else if(DLG_TARG.param == 'ip') {
					LAN_DEV[DLG_TARG.did][2].ip_addr = val;
				} else if(DLG_TARG.param == 'port') {
					LAN_DEV[DLG_TARG.did][2].port = parseInt(val);
				}
				update_lan_dev();
				break;
		}
		$('.connection .dialog').offset({top:0,left:0})
		$('.connection .dialog').hide();
	} catch(e) {

	}
});

$(document).on('click','.connection .dialog #cancel',function() {
	$('.connection .dialog input').val('');
	$('.connection .dialog').offset({top:0,left:0})
	$('.connection .dialog').hide();
});

