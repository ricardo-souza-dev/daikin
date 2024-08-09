var FROMD;
var TOD;
var CURRENTMONTH;
var REQS = 0;

// to kill a link in html file only for S1
$(document).on('click','a',function(e) {return false;});

$(document).on('click','body',function(e) {
	if($('#currency-content .dialog').is(':visible') == true) {
		$('.dialog').hide();		
	}
});

$(document).on('page_before_show','#login', function(e) {
	$('.loading').hide();
});

$(document).on('click', '#login #login-btn', function(e) {
	USER = $('.panel .user-name').val();
	PASSWD = $('.panel .passwd').val();

	if(USER.length == 0) {
		alert(getString('no_user'));
		return;
	}
	$('.loading').show();
	connect();
});

$(document).on('page_before_show','#main', function(e) {
	$('.loading').hide();
	// set tenant list
	var dom = "";
	var controlled = '';
	var warn = '';
	if(PREPAIED != true) {
		$('#tenant-charge').hide();
		$('#show-log').hide();
	} 
	var h = $('#main .panel').height();
	$('#main .tenant-list').height(h-35);

	for(var name in TENANT_LIST) {
		controlled = '';
		warn = '';
		var charged = '';
		if(TENANT_LIST[name][1] != null) {
			charged = ' ('+getString('remain')+' '+BILL_INFO['currency']+TENANT_LIST[name][1]+')';
			if(TENANT_LIST[name][1] <= 0) {
				controlled = ' warn';
			} else if(TENANT_LIST[name][1] <= TENANT_LIST[name][3]) {
				warn = ' warn';
			}
		}
		dom += ("<li class='tenant "+controlled+"' id='"+name+"'>"+name+"<span class='charged"+warn+"'>"+charged+"</span></li>");
	}
	$('#main .tenant-list').html(dom);

	$('#main #from').datepicker({
    showAnim: 'clip',
    changeMonth: true,
    dateFormat: DATEFORMAT,
    onSelect: function(selected, inst) {
    	FROMD = $(this).datepicker('getDate');
    },
    onClose: function( selectedDate ) {
      $( "#main #to" ).datepicker( "option", "minDate", selectedDate );
    }
	});
	$('#main #to').datepicker({
    showAnim: 'clip',
    changeMonth: true,
    dateFormat: DATEFORMAT,
    onSelect: function(selected, inst) {
    	TOD = $(this).datepicker('getDate');
    },
    onClose: function( selectedDate ) {
      $( "#main #from" ).datepicker( "option", "maxDate", selectedDate );
    }
	});
	setMultiLang('#main .mls');
	var h = $('.panel').height();
	$('.tenant-list').css('height',h-35);		
});

$(document).on('click', '#main #show', function(e) {
	$('.loading').show();
	var name = $('#main .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); $('.loading').hide(); return;}
	var points = TENANT_LIST[name][0];
	var from = $('#main #from').val();
	var to = $('#main #to').val();
	if(from == '' || to == '') {alert(getString('no_date_specified')); $('.loading').hide(); return;}
	var f = FROMD.getTime()/1000;
	var t = TOD.getTime()/1000+60*60*24-1;

	// request tenant data to database
	var com; // = ['get_bill_data',{'name':name,'from':f,'to':t,'id':points}];
	BILL_DATA = {};
	BILL_DATA[name] = {};
	BILL_DATA[name]['from'] = FROMD.toLocaleDateString(LOCALE,DATEOPT);
	BILL_DATA[name]['to'] = TOD.toLocaleDateString(LOCALE,DATEOPT);
	BILL_DATA[name]['data'] = null;
	pointsArray = splitPointList(points);
	for(var i = 0; i < pointsArray.length; i++) {
		com = ['get_bill_data',{'name':name,'from':f,'to':t,'id':pointsArray[i]}];
		BILL_DATA_COM.push(com);
	}
	COMM_PORT.send(BILL_DATA_COM[0]);
});

$(document).on('click','#main #show-all',function(e) {
	$('.loading').show();
	// send data request for all tenants
	BILL_DATA = {};
	for(var name in TENANT_LIST) {
		if(name == null || name.length == 0) continue;
		var points = TENANT_LIST[name][0];
		var from = $('#main #from').val();
		var to = $('#main #to').val();
		if(from == '' || to == '') {alert(getString('no_date_specified')); $('.loading').hide(); return;}
		var f = FROMD.getTime()/1000;
		var t = TOD.getTime()/1000+60*60*24-1;

		// request tenant data to database
		var com = ['get_bill_data',{'name':name,'from':f,'to':t,'id':points}];
		BILL_DATA[name] = {};
		BILL_DATA[name]['from'] = FROMD.toLocaleDateString(LOCALE,DATEOPT);
		BILL_DATA[name]['to'] = TOD.toLocaleDateString(LOCALE,DATEOPT);
		BILL_DATA[name]['data'] = null;
		pointsArray = splitPointList(points);
		for(var i = 0; i < pointsArray.length; i++) {
			com = ['get_bill_data',{'name':name,'from':f,'to':t,'id':pointsArray[i]}];
			BILL_DATA_COM.push(com);
		}
//		COMM_PORT.send(com);
	}
	// show tenant name in dialog
	$('#main #tenant_name').text(BILL_DATA_COM[0][1]['name'])
	$('#main #tenant_name').show();
	// send first request
	COMM_PORT.send(BILL_DATA_COM[0]);
});

function splitPointList(points) {
	var pointArray = [];
	var max = 20;
	for(var i = 0; i < points.length; i+=max) {
		pointArray.push(points.slice(i,i+max));
	}
	return pointArray;
}

$(document).on('click', '#main #add', function(e) {
	// open tenant add screen
	$('.tenant-list .tenant').removeClass('selected');
	loadDialog('tenant_edit.html');
});

$(document).on('click', '#main #edit', function(e) {
	// open tenant edit screen
	// get tenant name
	var name = $('#main .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); return;}
	var option = {tenant: name}
	loadDialog('tenant_edit.html');
});

$(document).on('click', '#main #delete', function(e) {
	var name = $('#main .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); return;}
	// show confirm dialog
	if(confirm(getString('del_tenant_conf')) == false) return;
	// send tenant delete command
	COMM_PORT.send(['rm_tenant',name]);
});

$(document).on('click','#main .tenant-list li', function(e) {
	$('#main .tenant-list li').removeClass('selected');
	$(e.currentTarget).addClass('selected');
});

$(document).on('click','#main #tenant-charge',function(e) {
	// open charge dialog
	// get tenant name
	var name = $('#main .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); return;}
	var option = {tenant: name}
	loadDialog('charge.html');
});

$(document).on('click','#main #show-log',function(e) {
	loadScreen('charge_log.html');
});

$(document).on('click','#main #setup', function(e) {
	// Bill setting
	//  building owner information; name and others
	//  owner logo
	//  save folder
	// iTM connection setting
	//  add/delete iTM
	//  iTM network setting
	// user registration
	loadScreen('system.html');
});

$(document).on('click','#main #logout', function(e) {
	COMM_PORT.closeConnection();
});

$(document).on('click', '#bill #print', function(e) {
	window.print();
});

$(document).on('click', '#bill #save', function(e) {
	if(typeof Blob === 'undefined') {
		alert('Save is not supported on this browser');
		return;
	}
  var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('chrome') == -1) {
      alert('Save function is supported only on Google Chrome');
      return;
    }
	var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
	for(var name in BILL_DATA) {
		var data = makeSaveData(name);	// csv file data
		var fileName = name+' '+BILL_DATA[name].from+'-'+BILL_DATA[name].to+'.csv';
		var blob = new Blob([bom,data],{type:'text/plain'});
		var a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.target = '_blank';
		a.download = fileName;
		a.click();
	}
});

$(document).on('click', '#bill #close', function(e) {
	// back to main page
	$('.dialog').hide();
});

$(document).on('click','#tenant-edit #save', function(e) {
	var command;
	// check tenant name
	var name = $('.tenant-name-sect input').val();
	// if name is empty then show alert
	if(name.length == 0) {alert(getString('no_tenant')); return;}
	var mode = $('#tenant-edit').attr('mode');
	var id_list = [];
	var reg = $('#tenant-edit .registered-points .point-list li')
	for(var i = 0; i < reg.length; i++) {
		id_list[i] = reg[i].id;
	}
	if(mode == 'new') {
		// if name is already registered then show alert
		if(TENANT_LIST[name] != null) {alert(getString('tenant_dup')); return;}
		command = ['mk_tenant',name,id_list];
	} else {
		var old_name = $('#tenant-edit').attr('name');
		if(name != old_name) {	// tenant name is modified
			command = ['update_tenant_info',old_name,name,id_list];
		} else { // modify only point list
			command = ['reg_tenant_points',name,id_list];
		}
	}
	COMM_PORT.send(command);
});

$(document).on('click','#tenant-edit #cancel', function(e) {
	$('.dialog').hide();
});

// select/un select point
$(document).on('click','#tenant-edit .point-list li', function(e) {
	if(e.shiftKey == false ) {	// one select
		if($(e.target).hasClass('selected')) {
			$('#tenant-edit .point-list #'+e.target.id).removeClass('selected');
		} else {
			$('#tenant-edit .point-list #'+e.target.id).addClass('selected');
		}
	} else {	// range select
		if($(e.target).hasClass('selected')) {
			var targ = e.target;
			while($(targ).hasClass('selected') == true) {
				$(targ).removeClass('selected');
				targ = $(targ).prev('li');
		}
		} else {
			var targ = e.target;
			while($(targ).hasClass('selected') == false && $(targ).length > 0) {
				$(targ).addClass('selected');
				targ = $(targ).prev('li');
			}
		}
	}
});

// register/un register point to tenant
$(document).on('click','#tenant-edit #reg', function(e) {
	var sel = $('#tenant-edit .un-registered-points .point-list .selected')
	var dom = $('#tenant-edit .registered-points .point-list').html();
	for(var i = 0; i < sel.length; i++) {
		dom += sel[i].outerHTML;
	}
	$('#tenant-edit .un-registered-points .point-list .selected').remove();
	$('#tenant-edit .registered-points .point-list').html(dom);
});

$(document).on('click','#tenant-edit #un-reg', function(e) {
	var sel = $('#tenant-edit .registered-points .point-list .selected')
	var dom = $('#tenant-edit .un-registered-points .point-list').html();
	for(var i = 0; i < sel.length; i++) {
		dom += sel[i].outerHTML;
	}
	$('#tenant-edit .registered-points .point-list .selected').remove();
	$('#tenant-edit .un-registered-points .point-list').html(dom);
});

$(document).on('click','.dialog#charge #remain .button',function(e) {
	$('.dialog#charge #remain .value').text('');
});

$(document).on('click','.dialog#charge #charge-amount .button',function(e) {
	var add_val = $('.dialog#charge #charge-amount input').val();
	add_val = parseInt(add_val);
	var remain = $('.dialog#charge #remain .value').text();
	if(remain == '') remain = add_val;
	else remain = parseInt(remain)+add_val;
	$('.dialog#charge #remain .value').text(remain);
});

$(document).on('click','.dialog#charge #save',function(e) {
	var command;
	// check tenant name
	var name = $('.dialog#charge .tenant-name').text();
	// if name is empty then show alert
	if(name == null || name.length == 0) {alert(getString('no_tenant')); return;}
	var amount = $('.dialog#charge #remain .value').text();
	if(amount == '') amount = null;
	else amount = parseInt(amount);
	var level = $('.dialog#charge #alarm input').val();
	if(level == '') level = 0;
	else level = parseInt(level);
	command = ['set_charged',name,amount,level];
	COMM_PORT.send(command);
});

$(document).on('click','.dialog#charge #cancel',function(e) {
	$('.dialog#charge').hide();
});

$(document).on('page_before_show','#system-setup',function(e) {
	COMM_PORT.send(['get_device_list']);
	COMM_PORT.send(['get_user_list']);
	$('#lang-content #language').val(LANG);
	$('#lang-content #dpoint').val(DP);
	$('#owner-info input').val(BILL_INFO['owner']);
	$('#addr-info1 input').val(BILL_INFO['address'][0]);
	$('#addr-info2 input').val(BILL_INFO['address'][1]);
	$('#addr-info3 input').val(BILL_INFO['address'][2]);
	$('#contact-info1 input').val(BILL_INFO['contact'][0]);
	$('#contact-info2 input').val(BILL_INFO['contact'][1]);
	$('#contact-info3 input').val(BILL_INFO['contact'][2]);

	if(PREPAIED != true) {
		$('#useradd').hide();
	}

	// clock adjustment method
	if(CLOCK == 'internet') $('#system-setup #clock-content #internet input').attr('checked',true);
	else $('#system-setup #clock-content #itm input').attr('checked',true);
	// currency setup 
	$('#currency-content .currency input').val(BILL_INFO['currency']);
	$('#system-setup #currency-content table .cmk').text(BILL_INFO['currency']);

	// default name
	$('#currency-content .t6 .name input').val(getString('holiday'));
	$('#currency-content .t6 .tz input').prop('disabled',true);

	if(BILL_INFO['rate'].length < 6) {
		BILL_INFO['rate'].push(['disable','00:00','24:00',0,getString('holiday')]);
	}
	var rate_info = BILL_INFO['rate'];
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') {
			$('#currency-content .t'+(p+1)).css('opacity',1);
			$('#currency-content .t'+(p+1)).addClass('enable');
		} else {
			$('#currency-content .t'+(p+1)).css('opacity',0.4);
			$('#currency-content .t'+(p+1)).removeClass('enable');
		}
		$('#currency-content .t'+(p+1)+' .tzf input').val(rate_info[p][1]);
		$('#currency-content .t'+(p+1)+' .tzt input').val(rate_info[p][2]);
		var pv = String(rate_info[p][3]).replace('.',DP);
		$('#currency-content .t'+(p+1)+' .price input').val(pv);
		$('#currency-content .t'+(p+1)+' .name input').val(rate_info[p][4]);
	}
	if(rate_info[5][0] == 'enable') {
		// show holiday calendar
		$('#system-setup #currency-content .calendar-panel').show();
	} else {
		// hide holiday calendar
		$('#system-setup #currency-content .calendar-panel').hide();
	}
	SPEC_CAL = BILL_INFO['specialday'].slice();	// copy
	setCalendar(new Date());

	//////////////////////////////////////////
	$('#passwd-content input').val(PASSWD);

	//////////////////////////////////////////
	drawTimeZonePrice();

	if(HOLIDAY == false) {
		$('#system-setup .holiday').hide();
	}

	//////////////////////////////////////////
	// change menu depend on user
	if(USER != 'admin') {
		$('#system-setup #clock-adjust').hide();
		$('#system-setup #clock-content').hide();
		$('#system-setup #controller').hide();
		$('#system-setup #controller-content').hide();
		$('#system-setup #useradd').hide();
		$('#system-setup #user-content').hide();
	}
});

$(document).on('click','#system-setup #back',function(e) {
	loadScreen('main.html');
});

$(document).on('click','#system-setup .menu-item',function(e) {
	$(this).next('.menu-content').slideToggle();
});

function sel_lang() {
	try {
		LANG = $('#system-setup #language option:selected').val();
		if(window.localStorage) {
			try {
				window.localStorage.setItem("lang",LANG);
			} catch(e) {}
		}
		localization('#system-setup');
	} catch(e) {
		alert(e);
	}	
};

function sel_dpoint() {
	try {
		DP = $('#system-setup #dpoint option:selected').val();
		if(DP == '.') {
			SEP = ',';
			FS = ',';
		} else if(DP == ',') {
			SEP = '.';
			FS = ';';
		}
		if(window.localStorage) {
			try {
				window.localStorage.setItem("dpoint",DP);
			} catch(e) {}
		}
		localization('#system-setup');
	} catch(e) {
		alert(e);
	}	
};

$(document).on('click','#system-setup #clock-content #save',function(e) {
	CLOCK = $("#system-setup #clock-content input[name='clockadjust']:checked").val();
	if(CLOCK == 'itm') ADJUST_ITM = false;
	else ADJUST_ITM = true;
	var com = ['set_clock_adjust',[CLOCK,ADJUST_ITM]];
	COMM_PORT.send(com);
	$('#clock-content').slideUp();
});

$(document).on('click','#system-setup #owner-content #save',function(e) {
	BILL_INFO['owner'] = $('#owner-info input').val();
	BILL_INFO['address'] = [];
	var addr = $('#addr-info1 input').val();
	if(addr.length > 0) BILL_INFO['address'].push(addr);
	addr = $('#addr-info2 input').val();
	if(addr.length > 0) BILL_INFO['address'].push(addr);
	addr = $('#addr-info3 input').val();
	if(addr.length > 0) BILL_INFO['address'].push(addr);
	BILL_INFO['contact'] = [];
	var contact = $('#contact-info1 input').val();
	if(contact.length > 0) BILL_INFO['contact'].push(contact);
	contact = $('#contact-info2 input').val();
	if(contact.length > 0) BILL_INFO['contact'].push(contact);
	contact = $('#contact-info3 input').val();
	if(contact.length > 0) BILL_INFO['contact'].push(contact);
	COMM_PORT.send(['set_bill_info',BILL_INFO]);
	$('#owner-content').slideUp();
});

$(document).on('click','#system-setup #currency-content .priority',function(e) {
	if($(this).parent('.tzp').hasClass('enable') == true) {
		$(this).parent('.tzp').css('opacity',0.4);
		$(this).parent('.tzp').removeClass('enable');
		if($(this).parent('.tzp').hasClass('t6') == true) {
			// hide holiday
			$('#system-setup #currency-content .calendar-panel').hide();
		}
	} else {
		$(this).parent('.tzp').css('opacity',1);
		$(this).parent('.tzp').addClass('enable');
		if($(this).parent('.tzp').hasClass('t6') == true) {
			// show holiday
			$('#system-setup #currency-content .calendar-panel').show();
		}
	}
	drawTimeZonePrice();
});

$(document).on('click','#system-setup #currency-content .tz input',function(e) {
	if($(this).parents('.tzp').hasClass('enable') == true) {	
		$('.dialog').hide();
		var pos = $(this).position();
		$('#system-setup #currency-content .time-select').css('top',pos.top);
		$('#system-setup #currency-content .time-select').css('left',pos.left);
		$(this).addClass('selected');
		var val = $(this).val();
		var pos = 0;
		$('#system-setup #currency-content .time-select li').removeClass('selected');
		if(val != '') {
			val = val.split(':')[0];
			$('#system-setup #currency-content .time-select #h'+val).addClass('selected');
			pos = parseInt(val)*21;
		}
		$('#system-setup #currency-content .time-select').show();	
		$('#system-setup #currency-content .time-select').scrollTop(pos);	
	}
	e.stopPropagation();
});

$(document).on('click','#system-setup #currency-content .time-select li',function(e) {
	var id = $(this).attr('id');
	$('#system-setup #currency-content .time-select li').removeClass('selected');
	$(this).addClass('selected');
	$('#system-setup #currency-content .tz input.selected').val($(this).text());
	$('#system-setup #currency-content .tz input.selected').removeClass('selected');
	$('.dialog').hide();
	drawTimeZonePrice();
});

$(document).on('blur','#system-setup #currency-content .currency input',function(e) {
	var cur = $(this).val();
	$('#system-setup #currency-content table .cmk').text(cur);
});

$(document).on('click','#system-setup #currency-content .calendar #prev',function(e) {
	var year = CURRENTMONTH.getFullYear();
	var month = CURRENTMONTH.getMonth();	// month is actual month - 1
	var lastMonth = new Date(year,month-1,1);
	setCalendar(lastMonth);
});

$(document).on('click','#system-setup #currency-content .calendar #next',function(e) {
	var year = CURRENTMONTH.getFullYear();
	var month = CURRENTMONTH.getMonth();	// month is actual month - 1
	var nextMonth = new Date(year,month+1,1);
	setCalendar(nextMonth);
});

$(document).on('click','#system-setup #currency-content .calendar td',function(e) {
	// specified date is sotred in SPEC_CAL array
	var date = parseInt($(this).text());
	if($(this).hasClass('selectable') == true &&
		isNaN(date) == false) {	// date is clicked
		var year = CURRENTMONTH.getFullYear();
		var month = CURRENTMONTH.getMonth();	// month is actual month - 1
		var targ = new Date(year,month,date).getTime();
		var index = SPEC_CAL.indexOf(targ);
		if(index == -1) {	// add special day
			SPEC_CAL.push(targ);
		} else {	// delete special day
			SPEC_CAL.splice(index,1);
		}
		// invert calendar date
		if($(this).hasClass('selected') == true) {
			$(this).removeClass('selected');
		} else {
			$(this).addClass('selected');
		}
	}
});

function setCalendar(date) {	// date is Date object
	// set calendar date of this month
	var year = date.getFullYear();
	var month = date.getMonth();	// month is actual month - 1
	var firstDay = new Date(year,month,1);
	var lastDay = new Date(new Date(year,month+1,1)-1);
	var ld = lastDay.getDate();
	var week = 1;

	// set year
	$('#system-setup #currency-content .calendar .year').text(year);
	// set month
	$('#system-setup #currency-content .calendar .month').text(getString('month'+(month+1)));

	// clear calendar
	$('#system-setup #currency-content .calendar td').text('');
	$('#system-setup #currency-content .calendar td').removeClass('selected');
	$('#system-setup #currency-content .calendar .selectable.d0').addClass('selected');
	$('#system-setup #currency-content .calendar .selectable.d6').addClass('selected');
	
	var dow = firstDay.getDay();	// day of week of the first day
	for(d = 1; d <= ld; d++) {
		$('#system-setup #currency-content .calendar .week'+week+' .d'+dow).text(d);
		if(SPEC_CAL.indexOf(new Date(year,month,d).getTime()) != -1) {
			// this day is special day
			// invert indication
			if($('#system-setup #currency-content .calendar .week'+week+' .d'+dow).hasClass('selected') == true) $('#system-setup #currency-content .calendar .week'+week+' .d'+dow).removeClass('selected');
			else $('#system-setup #currency-content .calendar .week'+week+' .d'+dow).addClass('selected');
		}
		dow++;
		if(dow > 6) {
			dow = 0;
			week++;
		}
	}
	CURRENTMONTH = date;
}

$(document).on('click','#system-setup #currency-content #currency-save',function(e) {
	BILL_INFO['currency'] = $('#system-setup #currency-content .currency input').val();
	var price_info = [];
	for(var pri = 1; pri <= 6; pri++) {
		var info = [];
		if($('#system-setup #currency-content .t'+pri).hasClass('enable') == true) info.push('enable');
		else info.push('disable');
		info.push($('#system-setup #currency-content .t'+pri+' .tzf input').val());
		info.push($('#system-setup #currency-content .t'+pri+' .tzt input').val());
		var pv = $('#system-setup #currency-content .t'+pri+' .price input').val();
		pv = pv.replace(DP,'.');
		var price = parseFloat(pv);
		if(isNaN(price) == true) {
			alert(getString('in_rate_val'));
			return;
		}
		info.push(price);
		info.push($('#system-setup #currency-content .t'+pri+' .name input').val());
		price_info.push(info);
	}
	BILL_INFO['rate'] = price_info;
	BILL_INFO['specialday'] = SPEC_CAL.slice();
	COMM_PORT.send(['set_bill_info',BILL_INFO]);
	$('#currency-content').slideUp();
});

$(document).on('click','#system-setup #controller-content .list li', function(e) {
	$('#controller-content .list li').removeClass('selected');
	$(this).addClass('selected');
	var attr = findController($(this).attr('id').replace(/-/g,'.'));
	if(attr == null) {
		alert(getString('no_ctrl'));
		return;
	}
	$('#controller-content #ipaddr input').val(attr['ip_addr']);
	$('#controller-content #port input').val(attr['port']);
	$('#controller-content #user input').val(attr['user']);
	$('#controller-content #passwd input').val(attr['passwd']);
	$('#controller-content .modify').removeClass('deactive');
	$('#controller-content .delete').removeClass('deactive');
});

$(document).on('click','#system-setup #controller-content .add', function(e) {
	var attr = {};
	attr['ip_addr'] = $('#controller-content #ipaddr input').val();
	attr['port'] = parseInt($('#controller-content #port input').val());
	attr['user'] = $('#controller-content #user input').val();
	attr['passwd'] = $('#controller-content #passwd input').val();
	if(attr['ip_addr'].length == 0) {
		alert(getString('in_ctrl_addr'));
		return;
	}
	if(checkSameIp(attr['ip_addr']) == true) {
		alert(getString('alert_same_ip'));
		return;
	}
	addNewController('Itm',attr);
	$('#controller-content .list #'+attr['ip_addr'].replace(/\./g,'-')).addClass('selected');
	$('#controller-content .modify').removeClass('deactive');
	$('#controller-content .delete').removeClass('deactive');
});

$(document).on('click','#system-setup #controller-content .modify', function(e) {
	if($(this).hasClass('deactive')) return;
	var attr = selectedController();
	if(attr == null) {
		alert(getString('no_ctrl'));
		return;
	}
	attr['ip_addr'] = $('#controller-content #ipaddr input').val();
	attr['port'] = parseInt($('#controller-content #port input').val());
	attr['user'] = $('#controller-content #user input').val();
	attr['passwd'] = $('#controller-content #passwd input').val();
	updateControllerScreen('OK');
	$('#controller-content .list #'+attr['ip_addr'].replace(/\./g,'-')).addClass('selected');
});

$(document).on('click','#system-setup #controller-content .delete',function(e) {
	if($(this).hasClass('deactive')) return;
	if(deleteSelectedController() == false) {
		alert(getString('del_ctrl_fail'));
	}	else {
		updateControllerScreen('OK');
		$('#controller-content input').val('');
		$('#controller-content .modify').addClass('deactive');
		$('#controller-content .delete').addClass('deactive');
	}
});

$(document).on('click','#system-setup #controller-content #controller-save',function(e) {
	COMM_PORT.send(['set_device_list',DEV_LIST]);
	$('#controller-content').slideUp();
});

$(document).on('click','#system-setup #passwd-content #passwd-save',function(e) {
	var passwd = $('#passwd-content input').val();
	COMM_PORT.send(['set_passwd',USER,passwd]);
	$('#passwd-content').slideUp();
});

$(document).on('click','#system-setup #user-content .list li', function(e) {
	$('#user-content .list li').removeClass('selected');
	$(this).addClass('selected');

	// find user name and passwd
	var current_user = $(this).text();
	var user_info = null;
	for( var i = 0; USERLIST.length; i++) {
		if(USERLIST[i][0] == current_user) {
			user_info = USERLIST[i];
			break;
		}
	}
	if(user_info == null) {
		alert('error');
		return;
	}	

	$('#user-content #usrname input').val(USERLIST[i][0]);
	$('#user-content #passwd input').val(USERLIST[i][1]);
	$('#user-content .delete').removeClass('deactive');
});

$(document).on('click','#system-setup #user-content .add', function(e) {
	var user = $('#user-content #usrname input').val();
	var passwd = $('#user-content #passwd input').val();
	$('#system-setup #user-content .list li').removeClass('selected');

	if(user.length == 0) {
		alert(getString('no_user'));
		return;
	}
	// check same user is registered or not
	if(sameUserRegistered(user) == true) {
		alert(getString('same_user_exist'));
		return;
	}

	$('#user-content .delete').addClass('deactive');

	COMM_PORT.send(['add_user',user,passwd,POINT_ID_LIST,[],{}]);
});

function sameUserRegistered(user) {
	var name_list = $('#system-setup #user-content .list li');
	for(var i = 0; i < name_list.length; i++) {
		if($(name_list[i]).text() == user) return true;
	}
	return false;
}

$(document).on('click','#system-setup #user-content .delete',function(e) {
	if($(this).hasClass('deactive')) return;

	var user = $('#system-setup #user-content .selected').text();
	$('#system-setup #user-content .selected').remove();

	$('#user-content input').val('');
	$('#user-content .delete').addClass('deactive');

	COMM_PORT.send(['delete_user',user]);
});

$(document).on('page_before_show','#charge-log',function(e) {
	COMM_PORT.send(['get_charge_log']);
	$('#charge-log .scrol-frame').height($(window).height()-200);
});

$(document).on('click','#charge-log #back',function(e) {
	loadScreen('main.html');	
});

function prepareDialog(id) {	
	if(id == 'tenant-edit') {
		makeTenantEditDialog();	
	} else if(id == 'bill') {
		makeBillDialog();
	} else if(id == 'charge') {
		makeChargeDialog();
	}
	$('.loading').hide();
}

function makeTenantEditDialog() {
	var tenant = $('.tenant-list .selected').attr('id');
	if(tenant == null) {
		$('#tenant-edit').attr('mode','new');
		// add tenant
		$('.page-title').text(getString('new_tenant'));
		// add point name to un registered list
		$('.un-registered-points .point-list').html(getPointListDOM(null));
	} else {
		// edit tenant
		$('#tenant-edit').attr('mode','modify');
		$('#tenant-edit').attr('name',tenant);
//		$('.page-title').text(getString('edit_tenant'));
		$('#tenant-edit .tenant-name-sect input').val(tenant);
		var points = TENANT_LIST[tenant][0];
		var dom = "";
		for(var i = 0; i < points.length; i++) {
			dom += ("<li id="+points[i]+">"+POINT_LIST[points[i]].info.name+"</li>");
		}
		$('#tenant-edit .registered-points .point-list').html(dom);
		// add point name to un registered list
		$('.un-registered-points .point-list').html(getPointListDOM(tenant));
		// limit
		$('.limit .price input').val(TENANT_LIST[tenant][1]);
		// day
		$('.limit .period input').val(TENANT_LIST[tenant][2]);
	}
	$('.limit .price .currency').text(BILL_INFO['currency'])
}

function makeChargeDialog() {
	var name = $('.tenant-list .selected').attr('id');
	if(name == null) {
		return;
	} else {
		$('.dialog#charge').attr('name',name);
		$('.dialog#charge .tenant-name').text(name);
		var tenant = TENANT_LIST[name];
		if(tenant == null) return;
		if(tenant[1] != null) $('.dialog#charge #remain .value').text(tenant[1]);
		if(tenant[3] == null) tenant[3] = 0; 
		$('.dialog#charge #charge-amount input').val(0);
		$('.dialog#charge #alarm input').val(tenant[3]);
		$('.dialog#charge .currency').text(BILL_INFO['currency'])
	}
}


