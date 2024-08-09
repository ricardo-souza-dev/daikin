//Billing screen event
$(document).on('page_before_show','.screen#ppd',function(e) {
	resize();
	//start from SVMPS1
	$('.loading').hide();
	
	COMM_PORT.send(['get_tenant_list']);
});

$(document).on('page_before_show','.screen#bill',function(e) {
	$('.loading').hide();
	prepareDialog('bill');
});	

$(document).on('click', '#ppd #show', function(e) {
	$('.loading').show();
	var name = $('#ppd .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); $('.loading').hide(); return;}
	var points = TENANT_LIST[name][0];
	var from = $('#ppd #from').val();
	var to = $('#ppd #to').val();
	if(from == '' || to == '') {alert(getString('no_date_specified')); $('.loading').hide(); return;}
	var f = FROMD.getTime()/1000;
	var t = TOD.getTime()/1000+60*60*24-1;
	
	// request tenant data to database
	var com = ['get_bill_data',{'name':name,'from':f,'to':t,'id':points}];
	BILL_DATA = {};
	BILL_DATA[name] = {};
	BILL_DATA[name]['from'] = FROMD.toLocaleDateString(LOCALE,DATEOPT);
	BILL_DATA[name]['to'] = TOD.toLocaleDateString(LOCALE,DATEOPT);
	BILL_DATA[name]['data'] = {};
	pointsArray = splitPointList(points);
	for(var i = 0; i < pointsArray.length; i++) {
		com = ['get_bill_data',{'name':name,'from':f,'to':t,'id':pointsArray[i]}];
		BILL_DATA_COM.push(com);
	}
	COMM_PORT.send(BILL_DATA_COM[0]);
});

$(document).on('click','#ppd #show-all',function(e) {
	$('.loading').show();
	// send data request for all tenants
	BILL_DATA = {};
	for(var name in TENANT_LIST) {
		if(name == null || name.length == 0) continue;
		var points = TENANT_LIST[name][0];
		var from = $('#ppd #from').val();
		var to = $('#ppd #to').val();
		if(from == '' || to == '') {alert(getString('no_date_specified')); $('.loading').hide(); return;}
		var f = FROMD.getTime()/1000;
		var t = TOD.getTime()/1000+60*60*24-1;

		// request tenant data to database
		var com = ['get_bill_data',{'name':name,'from':f,'to':t,'id':points}];
		BILL_DATA[name] = {};
		BILL_DATA[name]['from'] = FROMD.toLocaleDateString(LOCALE,DATEOPT);
		BILL_DATA[name]['to'] = TOD.toLocaleDateString(LOCALE,DATEOPT);
		BILL_DATA[name]['data'] = {};
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
	var max = 200;
	for(var i = 0; i < points.length; i+=max) {
		pointArray.push(points.slice(i,i+max));
	}
	return pointArray;
}

//from PS1 start

$(document).on('click', '#ppd #add', function(e) {
	// open tenant add screen
	STATE = 'tenant'; //for back function
	$('.tenant-list .tenant').removeClass('selected');  			//remove all selected tenant
	$('#ppd .setup').hide();										//hide main setup page
	$('#ppd .ppd').hide();
	$('#ppd .menu-item#owner').hide();
	$('#ppd .menu-item#unitprice').hide();
	$('#ppd .tenant-edit').show();									//show tenant-edit sub page

	prepareDialog('tenant-edit');
});

$(document).on('click', '#ppd #edit', function(e) {
	// open tenant edit screen
	STATE = 'tenant'; //for back function
	// get tenant name
	var name = $('#ppd .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); return;}
	var option = {tenant: name}
	$('#ppd .setup').hide();
	$('#ppd .ppd').hide();
	$('#ppd .menu-item#owner').hide();
	$('#ppd .menu-item#unitprice').hide();	
	$('#ppd .tenant-edit').show();
	
	prepareDialog('tenant-edit');
});

$(document).on('click', '#ppd #delete', function(e) {
	var name = $('#ppd .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); return;}
	// show confirm dialog
	if(confirm(getString('del_tenant_conf')) == false) return;
	// send tenant delete command
	COMM_PORT.send(['rm_tenant',name]);
});

$(document).on('click','#ppd .tenant-list li', function(e) {
	$('#ppd .tenant-list li').removeClass('selected');
	$(e.currentTarget).addClass('selected');
});
/*tenant charge start*/
$(document).on('click','#ppd #tenant-charge',function(e) {
	STATE = 'prepaid'; //for back function
	// open charge dialog
	// get tenant name
	var name = $('#ppd .tenant-list .selected').attr('id');
	if(name == null || name.length == 0) {alert(getString('no_tenant_select')); return;}
	var option = {tenant: name}
	
	if(TENANT_LIST[name][0].length > 900) {alert(getString('more_than_limit')); return;}
	
	$('#ppd .setup').hide();
	$('#ppd .ppd').hide();
	$('#ppd .menu-item#owner').hide();
	$('#ppd .menu-item#unitprice').hide();	
	$('#ppd .charge').show();
	
	prepareDialog('charge');
});

$(document).on('click','#ppd #show-log',function(e) {
	STATE = 'prepaid'; //for back function
	$('#ppd .setup').hide();
	$('#ppd .ppd').hide();
		$('#ppd .menu-item#owner').hide();
	$('#ppd .menu-item#unitprice').hide();
	$('#ppd .charge-log').show(); //to change
	COMM_PORT.send(['get_charge_log']);
	$('.charge-log .scrol-frame').height($(window).height()-200);	
});

$(document).on('click','.charge #remain .button',function(e) {
	$('.charge #remain .value').text('');
});

$(document).on('click','.charge #charge-amount .button',function(e) {
	var add_val = $('.charge #charge-amount input').val();
	add_val = parseInt(add_val);
	if(isNaN(add_val) == true) add_val = 0;
	var remain = $('.charge #remain .value').text();
	if(remain == '') remain = add_val;
	else remain = parseFloat(remain)+add_val;
	$('.charge #remain .value').text(remain.toFixed(2));
});

$(document).on('click','.charge #save',function(e) {
	var command;
	// check tenant name
	var name = $('.charge .tenant-name').text();
	// if name is empty then show alert
	if(name == null || name.length == 0) {alert(getString('no_tenant')); return;}
	var amount = $('.charge #remain .value').text();
	if(amount == '') amount = null;
	else amount = parseFloat(amount);
	var level = $('.charge #alarm input').val();
	if(level == '') level = 0;
	else level = parseInt(level);
	command = ['set_charged',name,amount,level];
	COMM_PORT.send(command);
	
	$('#ppd .setup').hide();
	$('#ppd .ppd').show();
	$('#ppd .menu-area #owner').show();
	$('#ppd .menu-area #unitprice').show();
	COMM_PORT.send(['get_tenant_list']);
	STATE = null;
});
 
/*tenant charge end*/
$(document).on('click', '#bill #print', function(e) {
	window.print();
});

$(document).on('click', '#bill #save', function(e) {
  var csvFile;
  var downloadLink;
  
	for(var name in BILL_DATA) {
		var csv = makeSaveData(name);	// csv file data
		var fileName = name+' '+BILL_DATA[name].from+'-'+BILL_DATA[name].to+'.csv';

	  var BOM = "\uFEFF";
	  var csv = BOM + csv;

	  csvFile = new Blob([csv], {type: "text/csv;charset=utf-8,%EF%BB%BF"});
	  downloadLink = document.createElement("a");
	  downloadLink.download = fileName;
	  downloadLink.href = window.URL.createObjectURL(csvFile);
	  downloadLink.style.display = "none";
	  document.body.appendChild(downloadLink);
	  downloadLink.click();
	}
});

$(document).on('click', '#bill #back2', function(e) {
	// back to PPD Screen
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('ppd_screen.html');
});

//tenant edit start
$(document).on('click','.tenant-edit #save', function(e) {
	var command;
	// check tenant name	
	var name = $('#ppd .tenant-name-sect #input').val();
	// if name is empty then show alert
	if(name.length == 0) {alert(getString('no_tenant')); return;}
	var mode = $('.tenant-edit').attr('mode');
	var id_list = [];
	var reg = $('.tenant-edit .registered-points .point-list li')
	for(var i = 0; i < reg.length; i++) {
		id_list[i] = reg[i].id;
	}
	if(mode == 'new') {
		// if name is already registered then show alert
		if(TENANT_LIST[name] != null) {alert(getString('tenatn_dup')); return;}
		command = ['mk_tenant',name,id_list];
	} else {
		var old_name = $('.tenant-edit').attr('name');
		if(name != old_name) {	// tenant name is modified
			command = ['update_tenant_info',old_name,name,id_list];
		} else { // modify only point list
			command = ['reg_tenant_points',name,id_list];
		}
	}
	COMM_PORT.send(command);
	
	$('#ppd .setup').hide();
	$('#ppd .ppd').show();
	$('#ppd .menu-area #owner').show();
	$('#ppd .menu-area #unitprice').show();
	COMM_PORT.send(['get_tenant_list']);
	STATE = null;
});

// select/un select point
$(document).on('click','.tenant-edit .point-list li', function(e) {
	if(e.shiftKey == false ) {	// one select
		if($(e.target).hasClass('selected')) {
			$('.tenant-edit .point-list #'+e.target.id).removeClass('selected');
		} else {
			$('.tenant-edit .point-list #'+e.target.id).addClass('selected');
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
$(document).on('click','.tenant-edit #reg', function(e) {
	var sel = $('.tenant-edit .un-registered-points .point-list .selected');
	var dom = $('.tenant-edit .registered-points .point-list').html();
	for(var i = 0; i < sel.length; i++) {
		dom += sel[i].outerHTML;
	}
	$('.tenant-edit .un-registered-points .point-list .selected').remove();
	$('.tenant-edit .registered-points .point-list').html(dom);
});

$(document).on('click','.tenant-edit #un-reg', function(e) {
	var sel = $('.tenant-edit .registered-points .point-list .selected');
	var dom = $('.tenant-edit .un-registered-points .point-list').html();
	for(var i = 0; i < sel.length; i++) {
		dom += sel[i].outerHTML;
	}
	$('.tenant-edit .registered-points .point-list .selected').remove();
	$('.tenant-edit .un-registered-points .point-list').html(dom);
});


$(document).on('click','#ppd .menu-item#owner',function(e) {
	STATE = 'owner'; //for back function
	$('#ppd .setup').hide();
	$('#ppd .ppd').hide();
	$('#ppd .menu-item#owner').hide();
	$('#ppd .menu-item#unitprice').hide();
	$('#ppd .owner').show();
	
	if(BILL_INFO['owner'] !== undefined) { 
		$('#owner-info input').val(BILL_INFO['owner']);
		$('#addr-info1 input').val(BILL_INFO['address'][0]);
		$('#addr-info2 input').val(BILL_INFO['address'][1]);
		$('#addr-info3 input').val(BILL_INFO['address'][2]);
		$('#contact-info1 input').val(BILL_INFO['contact'][0]);
		$('#contact-info2 input').val(BILL_INFO['contact'][1]);
		$('#contact-info3 input').val(BILL_INFO['contact'][2]);
	}	
});	

$(document).on('click','#ppd .menu-item#unitprice',function(e) {
	STATE = 'unitprice'; //for back function
	
	$('#ppd .setup').hide();
	$('#ppd .ppd').hide();
	$('#ppd .menu-item#owner').hide();
	$('#ppd .menu-item#unitprice').hide();	
	$('#ppd .unitprice').show();
	
	if(HOLIDAY == false) {
		$('#holiday').hide();
	}	
	
	$('#ppd #currency-content .currency input').val(BILL_INFO['currency']);
	$('#ppd #currency-content table .cmk').text(BILL_INFO['currency']);
	
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
		$('#ppd #currency-content .calendar-panel').show();
	} else {
		// hide holiday calendar
		$('#ppd #currency-content .calendar-panel').hide();
	}
	
	SPEC_CAL = BILL_INFO['specialday'].slice();	// copy
	
	setCalendarPPD(new Date());

	drawTimeZonePrice();
});	

$(document).on('click','#ppd .menu-item#back1',function(e) {
	if(STATE == 'unitprice' || STATE == 'owner' || STATE == 'tenant' || STATE == 'prepaid') {
		$('#ppd .setup').hide();
		$('#ppd .ppd').show();
		
		$('#ppd .menu-area #owner').show();
		$('#ppd .menu-area #unitprice').show();
		COMM_PORT.send(['get_tenant_list']);
	} else {
		if(SID == null) loadScreen('top_screen.html');
		else loadScreen('section.html');
		loadScreen('top_screen.html');
	}

	STATE = null;
});	

$(document).on('click','#ppd #owner-content #save',function(e) {
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
	
	$('#ppd .setup').hide();
	$('#ppd .ppd').show();
	$('#ppd .menu-area #owner').show();
	$('#ppd .menu-area #unitprice').show();
	COMM_PORT.send(['get_tenant_list']);
	STATE = null;
});

$(document).on('click','#ppd #currency-content .priority',function(e) {
	if($(this).parent('.tzp').hasClass('enable') == true) {
		$(this).parent('.tzp').css('opacity',0.4);
		$(this).parent('.tzp').removeClass('enable');
		if($(this).parent('.tzp').hasClass('t6') == true) {
			// hide holiday
			$('#ppd #currency-content .calendar-panel').hide();
		}
	} else {
		$(this).parent('.tzp').css('opacity',1);
		$(this).parent('.tzp').addClass('enable');
		if($(this).parent('.tzp').hasClass('t6') == true) {
			// show holiday
			$('#ppd #currency-content .calendar-panel').show();
		}
	}
	drawTimeZonePrice();
});

$(document).on('click','#ppd #currency-content .tz input',function(e) {
	if($(this).parents('.tzp').hasClass('enable') == true) {	
		$('.dialog').hide();
		var pos = $(this).position();
		$('#ppd #currency-content .time-select').css('top',pos.top);
		$('#ppd #currency-content .time-select').css('left',pos.left);
		$(this).addClass('selected');
		var val = $(this).val();
		var pos = 0;
		$('#ppd #currency-content .time-select li').removeClass('selected');
		if(val != '') {
			val = val.split(':')[0];
			$('#ppd #currency-content .time-select #h'+val).addClass('selected');
			pos = parseInt(val)*21;
		}
		$('#ppd #currency-content .time-select').show();	
		$('#ppd #currency-content .time-select').scrollTop(pos);	
	}
	e.stopPropagation();
});

$(document).on('click','#ppd #currency-content .time-select li',function(e) {
	var id = $(this).attr('id');
	$('#ppd #currency-content .time-select li').removeClass('selected');
	$(this).addClass('selected');
	$('#ppd #currency-content .tz input.selected').val($(this).text());
	$('#ppd #currency-content .tz input.selected').removeClass('selected');
	$('.dialog').hide();
	drawTimeZonePrice();
});

$(document).on('blur','#ppd #currency-content .currency input',function(e) {
	var cur = $(this).val();
	$('#ppd #currency-content table .cmk').text(cur);
});

$(document).on('click','#ppd #currency-content .calendar-ppd #prev',function(e) {
	var year = CURRENTMONTH.getFullYear();
	var month = CURRENTMONTH.getMonth();	// month is actual month - 1
	var lastMonth = new Date(year,month-1,1);
	setCalendarPPD(lastMonth);
});

$(document).on('click','#ppd #currency-content .calendar-ppd #next',function(e) {
	var year = CURRENTMONTH.getFullYear();
	var month = CURRENTMONTH.getMonth();	// month is actual month - 1
	var nextMonth = new Date(year,month+1,1);
	setCalendarPPD(nextMonth);
});

$(document).on('click','#ppd #currency-content .calendar-ppd td',function(e) {
	// specified date is sorted in SPEC_CAL array
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

//Unit Price Setting click save function
$(document).on('click','#ppd #currency-content #currency-save',function(e) {
	BILL_INFO['currency'] = $('#ppd #currency-content .currency input').val();  //
	var price_info = [];
	for(var pri = 1; pri <= 6; pri++) {
		var info = [];
		if($('#ppd #currency-content .t'+pri).hasClass('enable') == true) info.push('enable');
		else info.push('disable');
		info.push($('#ppd #currency-content .t'+pri+' .tzf input').val());
		info.push($('#ppd #currency-content .t'+pri+' .tzt input').val());
		var pv = $('#ppd #currency-content .t'+pri+' .price input').val();
		pv = pv.replace(DP,'.');
		var price = parseFloat(pv);
		if(isNaN(price) == true) {
			alert(getString('in_rate_val'));
			return;
		}
		info.push(price);
		info.push($('#ppd #currency-content .t'+pri+' .name input').val());
		price_info.push(info);
	}
	BILL_INFO['rate'] = price_info;
	BILL_INFO['specialday'] = SPEC_CAL.slice();
	COMM_PORT.send(['set_bill_info',BILL_INFO]);
	
	$('#ppd .setup').hide();
	$('#ppd .ppd').show();
	$('#ppd .menu-area #owner').show();
	$('#ppd .menu-area #unitprice').show();		
	COMM_PORT.send(['get_tenant_list']);
	STATE = null;
});



function sel_dpoint() {
	try {
		DP = $('#system #dpoint option:selected').val();
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
		localization('#system');
	} catch(e) {
		alert(e);
	}	
};

function setCalendarPPD(date) {	// date is Date object
	// set calendar date of this month
	var year = date.getFullYear();
	var month = date.getMonth();	// month is actual month - 1
	var firstDay = new Date(year,month,1);
	var lastDay = new Date(new Date(year,month+1,1)-1);
	var ld = lastDay.getDate();
	var week = 1;

	// set year
	$('#ppd #currency-content .calendar-ppd .year').text(year);
	// set month
	$('#ppd #currency-content .calendar-ppd .month').text(getString('month'+(month+1)));

	// clear calendar
	$('#ppd #currency-content .calendar-ppd td').text('');
	$('#ppd #currency-content .calendar-ppd td').removeClass('selected');
	$('#ppd #currency-content .calendar-ppd .selectable.d0').addClass('selected');
	$('#ppd #currency-content .calendar-ppd .selectable.d6').addClass('selected');
	
	var dow = firstDay.getDay();	// day of week of the first day
	for(d = 1; d <= ld; d++) {
		$('#ppd #currency-content .calendar-ppd .week'+week+' .d'+dow).text(d);
		if(SPEC_CAL.indexOf(new Date(year,month,d).getTime()) != -1) {
			// this day is special day
			// invert indication
			if($('#ppd #currency-content .calendar-ppd .week'+week+' .d'+dow).hasClass('selected') == true) $('#ppd #currency-content .calendar-ppd .week'+week+' .d'+dow).removeClass('selected');
			else $('#ppd #currency-content .calendar-ppd .week'+week+' .d'+dow).addClass('selected');
		}
		dow++;
		if(dow > 6) {
			dow = 0;
			week++;
		}
	}
	CURRENTMONTH = date;
}

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
		$('.tenant-edit').attr('mode','new');
		// add tenant
		$('.tenant-edit .page-title').text(getString('new_tenant'));
		// add point name to un registered list
		$('.tenant-edit .registered-points .point-list').html(null);
		$(':input').val('');
		$('.un-registered-points .point-list').html(getPointListDOM(null));
	} else {
		// edit tenant
		$('.tenant-edit').attr('mode','modify');
		$('.tenant-edit').attr('name',tenant);
//		$('.page-title').text(getString('edit_tenant'));
		$('.tenant-edit .tenant-name-sect input').val(tenant);
		var points = TENANT_LIST[tenant][0];
		var dom = "";
		for(var i = 0; i < points.length; i++) {
			dom += ("<li id="+points[i]+">"+POINT_LIST[points[i]].info.name+"</li>");
		}
		$('.tenant-edit .registered-points .point-list').html(dom);
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
		$('.charge').attr('name',name);
		$('.charge .tenant-name').text(name);
		var tenant = TENANT_LIST[name];
		if(tenant == null) return;
		if(tenant[1] != null) $('.charge #remain .value').text(tenant[1].toFixed(2));
		if(tenant[3] == null) tenant[3] = 0; 
		$('.charge #charge-amount input').val(0);
		$('.charge #alarm input').val(tenant[3]);
		$('.charge .currency').text(BILL_INFO['currency'])
	}
}