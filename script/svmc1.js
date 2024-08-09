// SVM-C1 methods
// call when screen size should adjust by window size
function resize() {
	$('.contents-area').width(WIDTH);
	$('.contents-area').height(HEIGHT-MH);
	$('.contents-area .visual-area').css({width:WIDTH, height:HEIGHT-MH});

	// in case of login page
	var h = $('.opening').height()+$('.model').height();
	$('.top-page').css('padding-top',(HEIGHT-h)/2-100);

	// operation screen vertical adjustment
	var top = 68;
	var margin = (HEIGHT-MH-top-380)/2;
	if(margin < 0) margin = 0;
	$('#operation .top-area').css('margin-bottom',margin);
	/////////////////////////////////////////////////////////
	// schedule screen vertical adjustment
	$('#schedule #prog-list .list').height(HEIGHT-130);
	$('#schedule #prog-content').height(HEIGHT-120);
	$('#schedule #prog-content #ctrl-target .list').css('height',HEIGHT-205);
	$('#schedule #prog-content #sched-list .multi-col-list').css('height',HEIGHT-203);
	$('#schedule #patn-set #patn-list .list').height(HEIGHT-154);
	$('#schedule #patn-set #daily-patn .multi-col-list').height(HEIGHT-240);
	$('#schedule #day-assign').css('top',(HEIGHT-450)/2);
	$('#schedule #cal-set').css('top',(HEIGHT-450)/2);
	/////////////////////////////////////////////////////////
	$('.charge-log .scrol-frame').height(HEIGHT-200);
	$('#ppd .tenant-list').height(HEIGHT-200);
	$('#interlock #interlock-prog-list .list').height(HEIGHT-130);
	$('#interlock #interlock-prog-content').height(HEIGHT-80);
	$('#system .scenes #scenes-prog-list .list').height(HEIGHT-200);
	$('.history .table tbody').height(HEIGHT-300); //(HEIGHT-260);
	/////////////////////////////////////////////////////////
	//Kaiwei 25/07/2018 add resize for reports
	// RASBERRY Pi 800 x 480
	$('#Analog_Input_Report .Management_Points').height(HEIGHT*0.55)
	resizeReportScreen();
}

function scrollScreen() {
	$('#top .contents-area').scrollTop(SCROLL_TOP);
}

function localization(page) {
	setMultiLang(page + ' .mls');
	var datePick = '';
	if(LANG == 'en') {
		datePick = '';
		LOCALE = 'en-GB';
		DATEFORMAT = 'd M yy';
	}	else if(LANG == 'es') {
		datePick = 'es';
		LOCALE = 'es';
		DATEFORMAT = 'd M yy';
	}	else if(LANG == 'br') {
		datePick = 'pt-BR';
		LOCALE = 'pt-BR';
		DATEFORMAT = 'd M yy';
	}	else if(LANG == 'cn') {
		datePick = 'zh-CN';
		LOCALE = 'zh-CN';
		DATEFORMAT = 'yy/mm/dd';
	}	else if(LANG == 'jp') {
		datePick = 'ja';
		LOCALE = 'ja-JP';
		DATEFORMAT = 'yy/mm/dd';
	}
	$.datepicker.setDefaults( $.datepicker.regional[datePick] );	
}

function holidayprice() {
	try {
		$.ajax({
			type: "POST",
			url: "/server/get_holidayprice.rb",
			async: false,
			dataType: "json",
			success: function(data,textStatus,jqXHR) {
				if(data['holidayprice']) HOLIDAY = true;
				else HOLIDAY = false;
			}
		});
	} catch(e) {
		alert(e);
	}
}
// Show opening screen of SVM-S1 with animation
function showOpening() {
	var h = $('.opening').height()+$('.model').height();
	$('.top-page').css('padding-top',(HEIGHT-h)/2);
	$('.opening').fadeIn(2000,function() {$('.model').fadeIn(1000,login)});
	$('.user').attr('placeholder',getString('usrname'));
	$('.passwd').attr('placeholder',getString('passwd'));
	if(USER != null && USER.length > 0) $('.user').val(USER);
	if(PASSWD != null && PASSWD.length > 0) $('.passwd').val(PASSWD);
	setMultiLang('body .mls');
}

// visual screen setting
function setVisualScreen(x,y,zoom) {
	console.log("P "+x+";"+y+";"+zoom);
	if(x == null) x = 0;
	if(y == null) y = 0;
	if(zoom == null) zoom = 1;
	$('.visual-area').css('transform-origin','0px '+'0px');
	$('.visual-area').css({transform:'scale('+zoom+')'});	
  $('.visual-area').offset({top:y,left:x});
}
// call in showOpening
function login() {
	if(AUTOLOGIN == true) {
		connect();
	} else {
		// slide up title
		$('.top-page').animate({'padding-top':'-=100'},1000,function() {
			// show login panel
			$('.login-panel').fadeIn(1000);
		});
	}
}

// show login page without animation
function showLoginPage() {
	var registered = window.localStorage.getItem('registered');
	if(registered == "true") {
		$('.model #internet').show();
	}	else {
		$('.model #internet').hide();
	}
	SCROLL_TOP = 0;
	$('.screen').fadeOut(1000,function() {
		$('.top-page').fadeTo(0,0.1);
		$('.opening').fadeTo(0,0.1);
		$('.model').fadeTo(0,0.1);
		$('.login-panel').fadeTo(0,0.1);
		var h = $('.opening').height()+$('.model').height();
		$('.top-page').css('padding-top',(HEIGHT-h)/2-100);
		$('.opening').fadeTo(1000,1);
		$('.model').fadeTo(1000,1);
		$('.login-panel').fadeTo(1000,1);
		$('.top-page').fadeTo(0,1);
	});
	$('.user').attr('placeholder',getString('usrname'));
	$('.passwd').attr('placeholder',getString('passwd'));
	if(USER != null && USER.length > 0) $('.user').val(USER);
	if(PASSWD != null && PASSWD.length > 0) $('.passwd').val(PASSWD);
	$('.loading').hide();
	setMultiLang('body .mls');
}

// load operation screen depend on management point type
// point has to be set SELECTED_POINT
function loadOperationScreen() {
	switch(SELECTED_POINT.info.type) {
	case 'Fcu':
		loadScreen('operation_screen.html');
		break;
	case 'Dio':
		loadScreen('operation_screen_dio.html');
		break;
	case 'KeyLock':
		loadScreen('operation_screen_lock.html');
		break;
	case 'Ao':
		loadScreen('operation_screen_ao.html');
		break;
	case 'MSo':
		break;
	case 'Vam':
		loadScreen('operation_screen_vam.html');
		break;
	case 'Ahu':
		loadScreen('operation_screen.html');
		break;
	case 'LevelSw':
		loadScreen('operation_screen_lsw.html');
		break;
	case 'RgbLevel':
		loadScreen('operation_screen_rgb.html');
		break;
	case 'Shutter':
		loadScreen('operation_screen_shutter.html');
		break;
	case 'Chiller':
		break;
	case 'Ir':
		loadScreen('operation_screen_ir.html');
		break;
	case 'FcuMq':
		loadScreen('operation_screen_fcumq.html');
		break;
	}
}

// set status of the point on the operation screen
function setStatus(point) {
	// status
	if(point.stat.stat == 'on') {
		$('#operation .status').attr('src','image/power-green.png');
		$('#operation .status').attr('stat','on');
	} else {
		$('#operation .status').attr('src','image/power-gray.png');
		$('#operation .status').attr('stat','off');
	}
	if(point.stat.error == true) {
		$('#operation .status').attr('src','image/power-red.png');
		$('#operation .status').attr('stat','error');
	}
	// off timer
	if(point.stat.off_timer == 'on') {
		$('#operation .offtimer').attr('src','image/offtimer-green.png');
		$('#operation .offtimer').attr('stat','on');
	} else {
		$('#operation .offtimer').attr('src','image/offtimer-gray.png');
		$('#operation .offtimer').attr('stat','off');
	}
	// off timer duration
	setOffTimerDuration($('#operation .off-timer-duration'));
	var duration = point.stat.off_duration;
	$('#operation .off-timer-duration #d'+duration).addClass('selected');
	$('#operation .off-timer-duration .current-val').text(makeTimeStr(duration));
	// fanstep
	if(point.info.attr.fanstep_cap == true && point.stat.fanstep != null) {
		$('#operation .fanstep').show();
		$('#operation .fanstep').attr('src',getFanstepIcon(point.info.attr.fansteps,point.stat.fanstep));
		$('#operation .fanstep').attr('steps',point.info.attr.fansteps);
		$('#operation .fanstep').attr('step',point.stat.fanstep);
	} else $('#operation .fanstep').hide();
	// flap
	if(point.info.attr.flap_cap == true && point.stat.flap != null) {
		$('#operation .flap').show();
		$('#operation .flap').attr('src',getFlapIcon(point.stat.flap,point.info.attr.flap_steps));
		$('#operation .flap').attr('flap',point.stat.flap);
	} else $('#operation .flap').hide();
	// flap2
	if(point.info.attr.flap2_cap == true && point.stat.flap2 != null) {
		$('#operation .flap2').show();
		$('#operation .flap2').attr('src',getFlap2Icon(point.stat.flap2,point.info.attr.flap_steps));
		$('#operation .flap2').attr('flap2',point.stat.flap2);
	} else $('#operation .flap2').hide();

	// mode
	var mode = point.info.attr.mode_cap;
	if(mode.indexOf('F') >= 0) $('#operation #fan').show();
	else $('#operation #fan').hide();
	if(mode.indexOf('D') >= 0) $('#operatoin #dry').show();
	else $('#operation #dry').hide();
	if(point.stat.ch_master == true) {
		if(mode.indexOf('C') >= 0) $('#operation #cool').show();
		else $('#operation #cool').hide();
		if(mode.indexOf('H') >= 0) $('#operation #heat').show();
		else $('#operation #heat').hide();
		if(mode.indexOf('A') >= 0) $('#operatoin #auto').show();
		else $('#operation #auto').hide();
		$('#operation #temp').hide();
		$('#operation #'+point.stat.mode).addClass('active');
	} else {
		$('#operation #cool').hide();
		$('#operation #heat').hide();
		$('#operation #auto').hide();
		$('#operation #temp').show();
		if(point.stat.mode == 'cool' || point.stat.mode == 'heat') $('#operation #temp').addClass('active');
		else $('#operation #'+point.stat.mode).addClass('active');
	}
	// filter sign
	if(point.stat.filter == true) {
		$('#operation .filter').show();
	}
}

function setStatusVam(point) {
	// status
	if(point.stat.stat == 'on') {
		$('#operation .status').attr('src','image/power-green.png');
		$('#operation .status').attr('stat','on');
	} else {
		$('#operation .status').attr('src','image/power-gray.png');
		$('#operation .status').attr('stat','off');
	}
	if(point.stat.error == true) {
		$('#operation .status').attr('src','image/power-red.png');
		$('#operation .status').attr('stat','error');
	}
	// off timer
	if(point.stat.off_timer == 'on') {
		$('#operation .offtimer').attr('src','image/offtimer-green.png');
		$('#operation .offtimer').attr('stat','on');
	} else {
		$('#operation .offtimer').attr('src','image/offtimer-gray.png');
		$('#operation .offtimer').attr('stat','off');
	}
	// off timer duration
	setOffTimerDuration($('#operation .off-timer-duration'));
	var duration = point.stat.off_duration;
	$('#operation .off-timer-duration #d'+duration).addClass('selected');
	$('#operation .off-timer-duration .current-val').text(makeTimeStr(duration));
	// ventilation amount
	if(point.info.attr.vamount_cap != '') {
		$('#operation .vamount').attr('src',getFanstepIcon(2,point.stat.vamount));
		$('#operation .vamount').attr('step',point.stat.vamount);
		$('#operation .vamount').show();
		var icon = 'image/normal.png';
		if(point.stat.fresh_up == true) icon = 'image/freshup.png';
		$('#operation .freshup').attr('src',icon);
		$('#operation .freshup').attr('status',point.stat.fresh_up);
		$('#operation .freshup').show();
	} else {
		$('#operation .vamount').hide();
		$('#operation .freshup').hide();
	}
	// ventilation mode
	var mode = point.info.attr.vmode_cap;
	if(mode != '') {
		$('#operation .vmode').attr('src','image/vm-'+point.stat.vmode+'.png');
		$('#operation .vmode').attr('mode',point.stat.vmode);
		$('#operation .vmode').show();
	} else {
		$('#operation .vmode').hide();
	}
	// filter sign
	if(point.stat.filter == true) {
		$('#operation .filter').show();
	}
}

function setStatusDio(point) {
	// status
	if(point.stat.stat == 'on') {
		$('#operation .status').attr('src','image/power-green.png');
		$('#operation .status').attr('stat','on');
	} else {
		$('#operation .status').attr('src','image/power-gray.png');
		$('#operation .status').attr('stat','off');
	}
	if(point.stat.error == true) {
		$('#operation .status').attr('src','image/power-red.png');
		$('#operation .status').attr('stat','error');
	}
	// off timer
	if(point.stat.off_timer == 'on') {
		$('#operation .offtimer').attr('src','image/offtimer-green.png');
		$('#operation .offtimer').attr('stat','on');
	} else {
		$('#operation .offtimer').attr('src','image/offtimer-gray.png');
		$('#operation .offtimer').attr('stat','off');
	}
	// off timer duration
	setOffTimerDuration($('#operation .off-timer-duration'));
	var duration = point.stat.off_duration;
	$('#operation .off-timer-duration #d'+duration).addClass('selected');
	$('#operation .off-timer-duration .current-val').text(makeTimeStr(duration));
}

function setStatusLock(point) {
	// status
	if(point.stat.stat == 'on') {
		$('#operation .status').attr('src','image/lock.png');
		$('#operation .status').attr('stat','on');
	} else {
		$('#operation .status').attr('src','image/open.png');
		$('#operation .status').attr('stat','off');
	}
	if(point.stat.error == true) {
		$('#operation .status').attr('src','image/lock-error.png');
		$('#operation .status').attr('stat','error');
	}
}

function setStatusShutter(point) {
	// status
	if(point.stat.updown == 'on') {
		$('#operation .status').attr('src','image/power-green.png');
		$('#operation .status').attr('stat','on');
	} else {
		$('#operation .status').attr('src','image/power-gray.png');
		$('#operation .status').attr('stat','off');
	}
}

function setStatusAo(point) {
	var min = point.info.attr.ao_min;
	var max = point.info.attr.ao_max;
	var step = point.info.attr.ao_step;
	var unit = point.info.attr.unit_label;
	var val = point.stat.av;
	var dp = 0;
	if(step < 1 && step >= 0.1) dp = 1;
	else if(step < 0.1 && step >= 0.01) dp = 2;
	else dp = 0;
	initSlider('#operation .slide-ctrl',min,max,step,dp,val,unit);
}

function setStatusRgb(point) {
	var min = point.info.attr.ao_min;
	var max = point.info.attr.ao_max;
	var step = point.info.attr.ao_step;
	var unit = point.info.attr.unit_label;
	var av = point.stat.av;
	var r = point.stat.r;
	var g = point.stat.g;
	var b = point.stat.b;
	var w = point.stat.w;
	var dp = 0;
	if(step < 1 && step >= 0.1) dp = 1;
	else if(step < 0.1 && step >= 0.01) dp = 2;
	else dp = 0;
	initSlider('#operation .slide-ctrl#analog-val',min,max,step,dp,av,unit);
	initSlider('#operation .slide-ctrl#r-val',min,max,step,dp,r,unit);
	initSlider('#operation .slide-ctrl#g-val',min,max,step,dp,g,unit);
	initSlider('#operation .slide-ctrl#b-val',min,max,step,dp,b,unit);
	initSlider('#operation .slide-ctrl#w-val',min,max,step,dp,w,unit);
}

// off timer duration setup
function setOffTimerDuration(obj) {
	var list = $(obj).find('ul');
	$(list).html('');
	for(var i = 5; i <= 720; i+=5) {
		$(list).append("<li id='d"+i+"''>"+makeTimeStr(i)+'</li>');
	}
}
function makeTimeStr(time) {
	var hour = parseInt(time/60);
	var min = time%60;
	return zeroFill(hour)+':'+zeroFill(min);
}

function zeroFill(val) {
	var ret = '';
	if(val < 10) ret = '0'+val;
	else ret += val;
	return ret;
}

function setRangeInit(point) {
	// setpoint range
	if(point.stat.csp_limit_valid == true) $('#operation #vrv-ctrl #sp-range .cool.selectable').addClass('checked');
	else $('#operation #vrv-ctrl #sp-range .cool.selectable').removeClass('checked');
	if(point.stat.hsp_limit_valid == true) $('#operation #vrv-ctrl #sp-range .heat.selectable').addClass('checked');
	else $('#operation #vrv-ctrl #sp-range .heat.selectable').removeClass('checked');

	if(point.info.attr.mode_cap.indexOf('H') < 0)	$('#operation #vrv-ctrl #sp-range .heat').hide();
	else $('#operation #vrv-ctrl #sp-range .heat').show();

	$('#operation #vrv-ctrl li').removeClass('selected');
	point.stat.csp_limit_valid;
	var sel = $('#operation #vrv-ctrl #sp-range .cool .min ul #r'+(point.stat.csp_l*10).toFixed(0));
	$(sel).addClass('selected');
	$('#operation #vrv-ctrl #sp-range .cool .min .current-val').text($(sel).text());
	var sel = $('#operation #vrv-ctrl #sp-range .cool .max ul #r'+(point.stat.csp_h*10).toFixed(0));
	$(sel).addClass('selected');
	$('#operation #vrv-ctrl #sp-range .cool .max .current-val').text($(sel).text());
	point.stat.hsp_limt_valid;
	var sel = $('#operation #vrv-ctrl #sp-range .heat .min ul #r'+(point.stat.hsp_l*10).toFixed(0));
	$(sel).addClass('selected');
	$('#operation #vrv-ctrl #sp-range .heat .min .current-val').text($(sel).text());
	var sel = $('#operation #vrv-ctrl #sp-range .heat .max ul #r'+(point.stat.hsp_h*10).toFixed(0));
	$(sel).addClass('selected');
	$('#operation #vrv-ctrl #sp-range .heat .max .current-val').text($(sel).text());
	point.stat.hsp_limt_valid;

	// setback
	var csp_sb = point.stat.csp_sb;
	if(csp_sb == null) csp_sb = '---';
	else csp_sb = (csp_sb*10).toFixed(0);
	var sel = $('#operation #vrv-ctrl #setback .cool ul #r'+csp_sb);
	$(sel).addClass('selected');
	$('#operation #vrv-ctrl #setback .cool .current-val').text($(sel).text());
	var hsp_sb = point.stat.hsp_sb;
	if(hsp_sb == null) hsp_sb = '---';
	else hsp_sb = (hsp_sb*10).toFixed(0);
	var sel = $('#operation #vrv-ctrl #setback .heat ul #r'+hsp_sb);
	$(sel).addClass('selected');
	$('#operation #vrv-ctrl #setback .heat .current-val').text($(sel).text());
}

function setRange(target,range) {
	var element = $(target).find('.selectable-input ul');
	$(element).html('');
	for(var i = 0; i < range.length; i++) {
		$(element).append('<li id=r'+range[i].replace('.','')+'>'+range[i]+'</li>');
	}
}

function setCoolSbRange(target) {
	var range = makeRange(24,35);
	range.unshift('---');
	setRange(target,range);
}
function setHeatSbRange(target) {
	var range = makeRange(10,20);
	range.push('---');
	setRange(target,range);
}

function makeRange(min,max) {
	var range = [];
	for(var i = max; i >= min; i--) {
		range.push(i.toFixed(1));
	}
	return range;
}

function set_network_info_to_system_screen(data) {
	// initialize switch
	$("#system .network #auto-net .disable").removeClass('hide');
	$("#system .network #auto-net .enable").addClass('hide');
	$("#system .network #con-type .disbale").removeClass('hide');
	$("#system .network #con-type .enable").addClass('hide');
	$("#system .network #int-connect .disable").removeClass('hide');
	$("#system .network #int-connect .enable").addClass('hide');

	if(data['dhcp'] == 'true' || data['dhcp'] == true) {				
		$("#system .network #auto-net .disable").addClass('hide');
		$("#system .network #auto-net .enable").removeClass('hide');
	}
	if(data['wifi'] == 'true' || data['wifi'] == true) {
		$("#system .network #con-type .disable").addClass('hide');
		$("#system .network #con-type .enable").removeClass('hide');
	}
	if(data['internet'] == 'true' || data['internet'] == true) {
		$("#system .network #int-connect .disable").addClass('hide');
		$("#system .network #int-connect .enable").removeClass('hide');
	}

	$("#system .network #ipaddr").val(data['ipaddr']);
	$("#system .network #netmask").val(data['netmask']);
	$("#system .network #defgw").val(data['gateway']);
	$("#system .network #dns").val(data['dns']);
	$("#system .network #ssid").val(data['ssid']);
	$("#system .network #passwd").val(data['passwd']);
}

function set_timezone_info_to_system_screen(data) {
	var zone = data.replace(/[\n\r]/g,"");
	$("#system .clock #zone").val(zone);
}

function set_ntp_info_to_system_screen(data) {
	$("#system .clock #auto-time-sync .disable").removeClass('hide');
	$("#system .clock #auto-time-sync .enable").addClass('hide');
	
	if(data == 'true' || data == true) {
		$("#system .clock #auto-time-sync .disable").addClass('hide');
		$("#system .clock #auto-time-sync .enable").removeClass('hide');
	} 	
}

function set_datetime_info_to_system_screen(data) {
	var now = data;
	
	$("#system .clock #currentdate").val(now.slice(0, 4) + "/" + now.slice(5, 7) + "/" + now.slice(8, 10));
	
	$("#system .clock #time-hour").val(now.slice(11, 13));
	$("#system .clock #time-minute").val(('0'+now.slice(14, 16)).slice(-2)); //.slice to add 0 when minutes in single digits
}	

function next_sid() {
	var id_list = SCREEN_LIST.top.screen;
	var max = 0;
	for(var i in id_list) {
		var num = parseInt(id_list[i].replace('scrn',''));
		if(num > max) max = num;
	}
	max++;
	return 'scrn'+('000'+max).slice(-3);
}

function getPointListDOM(tenantName) {
	var dom = "";
	var points = [];	// registered points
	if(tenantName != null)
		points = TENANT_LIST[tenantName][0];

	for(var p in POINT_LIST) {

		if(POINT_LIST[p].info.attr.ppd && points.indexOf(p) == -1) dom += ("<li id='"+p+"'>"+POINT_LIST[p].info.name+"</li>");
	}
	return dom;
}

function readPointData(data) {
	var point_data = {};	// {id:{time:{'ppd':data, 'op_time':data, 'on_times':data,'pv':data,'av':data},...},...}
	// read ppd data	
	readPointDataPpd(point_data,data);
	// read op time data
	readPointDataOpTime(point_data,data);
	// read on times data
	readPointDataOnTimes(point_data,data);
	// read pi data
	readPointDataPv(point_data,data);
	// read ai data
	return point_data;
}

function readPointDataPpd(point_data, data) {
	var ppd = data['ppd'];	
	for(var id in ppd) {
		var aData = ppd[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['ppd'] = [aData[i][1]/1000,aData[i][2]/1000];
		}
	}
}

function readPointDataOpTime(point_data, data) {
	var opTime = data['op_time'];	
	for(var id in opTime) {
		var aData = opTime[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['op_time'] = [aData[i][1],aData[i][2],aData[i][3],aData[i][4],aData[i][5]];
		}
	}
}

function readPointDataOnTimes(point_data, data) {
	var onTimes = data['on_times'];	
	for(var id in onTimes) {
		var aData = onTimes[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['on_times'] = aData[i][1];
		}
	}
}

function readPointDataPv(point_data, data) {
	var pv = data['pv'];
	for(var id in pv) {
		var aData = pv[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['pv'] = aData[i][1];
		}
	}
}
// from SVMPS1 start


// Expand BILL_DATA result and total array for holiday data
// array length is changed 5 to 6
function calcSumOfEachZone(name) {
	var rate_info = BILL_INFO['rate'];
	var total = [0,0,0,0,0,0];	// sum of power consumption of all point's each time zone, last one is for holiday
	// if rate_info is not updated, add entry
	var diff = total.length-rate_info.length;
	for(var i = 0; i < diff; i++) {
		rate_info.push(['disable','00:00','24:00',0,getString('holiday')]);
	}
	// make time zone map for unit price
	// holiday has 1 price zone
	var zone_map = [[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]];	// for 24 hour

	for(var p = rate_info.length-2; p >= 0; p--) {	// if rate_info lenght is changed, then ofset should be changed also
		if(rate_info[p][0] == 'enable') {
			var from = parseInt(rate_info[p][1]);
			var to = parseInt(rate_info[p][2]);
			var rate = parseFloat(rate_info[p][3]);
			for(var t = from; t < to; t++) {
				zone_map[t][0] = p;	// zone priority 0 origin
				zone_map[t][1] = rate;
			}
		}
	}

	// make holiday map in calendar
	// DAY_OF_WEEK[7]: 0->Sun, 6->Sat, 0 weekday, 1 holiday
	// Date.getDay() method return day of week
	// BILL_INFO['specialday']: date array of special day, invert weekday<=>holiday
	//   store time_t*1000 data

	// check date if it is holiday
	// Calendar period: 
	//   FROMD -> date object of the first day
	//   TOD   -> date object of the last day
	// 1) Check day of week of the date
	// 2) Check if the date is included in BILL_INFO['specialday']
	// 3) Add up zone map or holiday

	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var data = BILL_DATA[name].data;
	BILL_DATA[name]['total'] = total;
	var id_list = Object.keys(data);
	var points = id_list.length;
	// sum of power consumption of each point's each time zone
	var result_table = {};	// {id:[zone1,zone2,...],}
	for(var i = 0; i < points; i++) {
		var id = id_list[i];
		// initialize data table to store each time zone data
		result_table[id] = [0,0,0,0,0,0]; // last one is for holiday

		for(var time in data[id]) {
			var h = new Date(parseInt(time));
			// check date if it is holiday
			if(isHoliday(h)) {	// holiday
				if(data[id][time]['ppd'] != null) {
					result_table[id][5] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
					total[5] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
				}
			} else {	// weekday
				h = h.getHours();
				var zone = zone_map[h][0];
				if(data[id][time]['ppd'] != null) {
					result_table[id][zone] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
					total[zone] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
				}
			}
		}
		BILL_DATA[name]['result'] = result_table;
		BILL_DATA[name]['total'] = total;
	}
}

function isHoliday(date) {
	// if holiday is disable, always return false
	var rate_info = BILL_INFO['rate'];
	if(rate_info[5][0] == 'disable') return false;

	var dow = date.getDay();
	var t = new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();
	var spec = BILL_INFO['specialday'].indexOf(t);

	if(dow > 0 && dow < 6) {	// weekday
		if(spec == -1) return false;	// not specified the day
		else return true;	// specified as holiday
	} else {	// weekend
		if(spec == -1) return true;	// not specified the day
		else return false;	// specified as weekday
	}
}

function calcPrice(name) {
	// make total price from each time zone's power consumption and unit price
	var total = BILL_DATA[name].total;
	var rate_info = BILL_INFO.rate;
	var prices = [];
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') {
			// round up on 0.00*
			prices.push(Math.ceil(total[p]*rate_info[p][3]*100)/100); // round up
		} else {
			prices.push(0);
		}
	}
	BILL_DATA[name]['price'] = prices;
	return prices;
}

function makeBillDialog() {
	$('#bill').scrollTop(0);
	
	var today = new Date();
	var rate_info = BILL_INFO['rate'];
	var currency = BILL_INFO['currency'];
	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var tenants = Object.keys(BILL_DATA).length;
	var f_page = $('#bill .contents-area #p1').clone();
	var d_page = $('#bill .contents-area #p2').clone();
	$('#bill .contents-area .page').remove();

	$('#ppd .setup').hide();
	$('#ppd .ppd').hide();	
	
	var page = 1;
	
	for(var name in BILL_DATA) {
		var data = BILL_DATA[name].data;
		$('#bill .contents-area').append($(f_page).clone().attr('id','p'+page));
		$('#bill .contents-area').append($(d_page).clone().attr('id','p'+(page+1)));
		//$('#bill .page#p'+page).css('top', 0+(1052+35)*(page-1)); //0 was initially 65
		//$('#bill .page#p'+(page+1)).css('top', 0+(1052+35)*page); //0 was initially 65
		// count the number of pages
		// second or later page: 30 lines included

		var id_list = Object.keys(data);
		var points = id_list.length;
		var one_p = 30;

		// calc sum of each time zone's power consumption
		calcSumOfEachZone(name);	// results are stored in BILL_DATA[TENANT_NAME].result and total

		calcPrice(name);
		var prices = BILL_DATA[name].price;
		var total = BILL_DATA[name].total;

		$('#bill .contents-area #p'+page+' .data-table .c1').text(getString('tzone'));
		$('#bill .contents-area #p'+page+' .data-table .c2').text(getString('pconsum')+'[kWh]');
		$('#bill .contents-area #p'+page+' .data-table .c3').text(getString('price')+'['+currency+']');
		$('#bill .contents-area #p'+page+' .data-table .c4').text(getString('uprice')+'['+currency+'/kWh]');

		var sum = 0;	// total price
		var ptotal = 0;	// total power consumtion
		for(var p = 0; p < rate_info.length; p++) {
			if(rate_info[p][0] == 'enable') {
				sum += prices[p];
				ptotal += total[p];
				// bug fix 20160922 page is missing so all page data was overwritten
				$('#bill .contents-area #p'+page+' .data-table #r'+(p+1)+' .power').text(formNum(total[p],3));
				$('#bill .contents-area #p'+page+' .data-table #r'+(p+1)+' .price').text(formNum(prices[p],2));
			} 
		}
		BILL_DATA[name]['total_power'] = ptotal;
		BILL_DATA[name]['total_price'] = sum;

		$('#bill .contents-area #p'+page+' .total .currency').text(currency);
		$('#bill .contents-area #p'+page+' .total .result').text(formNum(sum,2));
		$('#bill .contents-area #p'+page+' #total .power').text(formNum(ptotal,3));
		$('#bill .contents-area #p'+page+' #total .price').text(formNum(sum,2));

		$('#bill .contents-area #p'+page+' .tenant-name').text(name);
		$('#bill .contents-area #p'+(page+1)+' .tenant-name').text(name);

		var pages = parseInt(points/one_p);
		var lines = one_p;
		var line_s = lines;
		var result_table = BILL_DATA[name].result;
		var total = BILL_DATA[name].total;
		if(pages < 1) lines = points;	// only one page
		for(var i = 0; i < lines; i++) {
			var id = id_list[i];
			var line = "<tr><td class='pname'>"+POINT_LIST[id].info.name+"</td><td class='zname z1'>"+formNum(result_table[id][0],3)+"</td><td class='zname z2'>"+formNum(result_table[id][1],3)+"</td><td class='zname z3'>"+formNum(result_table[id][2],3)+"</td><td class='zname z4'>"+formNum(result_table[id][3],3)+"</td><td class='zname z5'>"+formNum(result_table[id][4],3)+"</td><td class='zname z6'>"+formNum(result_table[id][5],3)+"</td></tr>";
			$('#bill .contents-area #p'+(page+1)+' .data-table').append(line);
		}
	 	if(pages < 1) {
			var tline = "<tr><td class='pname'>"+getString('total')+"</td><td class='zname z1'>"+formNum(total[0],3)+"</td><td class='zname z2'>"+formNum(total[1],3)+"</td><td class='zname z3'>"+formNum(total[2],3)+"</td><td class='zname z4'>"+formNum(total[3],3)+"</td><td class='zname z5'>"+formNum(total[4],3)+"</td><td class='zname z6'>"+formNum(total[5],3)+"</td></tr>";
			$('#bill .contents-area #p'+(page+1)+' .data-table').append(tline);
		} else { // more than 1 page
			// hide owner info in P.2
			$('#bill .contents-area #p'+(page+1)+' .owner').hide();
			$('#bill .contents-area #p'+(page+1)+' .print-date').hide();

			for(var p = 0; p < pages; p++) {
				var new_page = "<div class='page' id='p"+(page+p+2)+"'><table class='data-table'><tr><th class='pname'>"+getString('pname')+"</th><th class='zone-name z1'>zone1</th><th class='zone-name z2'>zone2</th><th class='zone-name z3'>zone3</th><th class='zone-name z4'>zone4</th><th class='zone-name z5'>zone5</th><th class='zone-name z6'>zone6</th></tr></table>";
				$('#bill .contents-area').append(new_page);
				//$('#bill .page#p'+(page+p+2)).css('top', 0+(1052+35)*(page+p+1)); //0 was initially 65
				
				if(p+1 == pages) lines = points-one_p*(p+1);	// last page

				for(var i = 0; i < lines; i++) {
					var id = id_list[i+line_s];
					var line = "<tr><td class='pname'>"+POINT_LIST[id].info.name+"</td><td class='zname z1'>"+formNum(result_table[id][0],3)+"</td><td class='zname z2'>"+formNum(result_table[id][1],3)+"</td><td class='zname z3'>"+formNum(result_table[id][2],3)+"</td><td class='zname z4'>"+formNum(result_table[id][3],3)+"</td><td class='zname z5'>"+formNum(result_table[id][4],3)+"</td><td class='zname z6'>"+formNum(result_table[id][5],3)+"</td></tr>";
					$('#bill .contents-area #p'+(page+p+2)+' .data-table').append(line);
				}
				line_s += lines;
			 	if(p+1 == pages) {	// last page
					var tline = "<tr><td class='pname'>"+getString('total')+"</td><td class='zname z1'>"+formNum(total[0],3)+"</td><td class='zname z2'>"+formNum(total[1],3)+"</td><td class='zname z3'>"+formNum(total[2],3)+"</td><td class='zname z4'>"+formNum(total[3],3)+"</td><td class='zname z5'>"+formNum(total[4],3)+"</td><td class='zname z6'>"+formNum(total[5],3)+"</td></tr>";
					$('#bill .contents-area #p'+(page+p+2)+' .data-table').append(tline);
				var owner = "<div class='owner'><div class='name'>Owner Name</div><div class='address'>Address of owner</div><div class='contact'>Contact</div></div><div class='print-date'>7 May 2015</div></div>";
				$('#bill .contents-area #p'+(page+p+2)).append(owner);
				}
			}
		}

		$('#bill  .contents-area .owner .name').text(BILL_INFO.owner);
		$('#bill  .contents-area .owner .address').html(addressInBill(BILL_INFO.address));
		$('#bill  .contents-area .owner .contact').html(contactInBill(BILL_INFO.contact));

		$('#bill  .contents-area .print-date').text(today.toLocaleDateString(LOCALE,DATEOPT));
		$('#bill  .contents-area .data-period .from').text(BILL_DATA[name].from);
		$('#bill  .contents-area .data-period .to').text(BILL_DATA[name].to);

		// bill info
		for(var p = 0; p < rate_info.length; p++) {
			if(rate_info[p][0] == 'enable') {
				$('#bill .contents-area .data-table .zone-name.z'+(p+1)).text(rate_info[p][4]);
				$('#bill .contents-area .data-table #r'+(p+1)+' .unit-price').text(formNum2(rate_info[p][3]));

			} else {
				$('#bill .contents-area .data-table #r'+(p+1)).hide();
				$('#bill .contents-area .data-table .zone-name.z'+(p+1)).hide();
				$('#bill .contents-area .data-table .zname.z'+(p+1)).hide();
			}
		}
		page += (pages+2);
	}
}

function makeSaveData(name) {
	var saveData = '';
	var rt = '\r\n';

	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var data = BILL_DATA[name].data;
	// count the number of pages
	// fist page: 20　lines included
	// second or later page: 30 lines included
	var id_list = Object.keys(data);
	var points = id_list.length;
	var line;

	// tenant name
	saveData = name+rt;
	// summary
	saveData += (getString('period')+FS+BILL_DATA[name].from+FS+getString('to')+FS+BILL_DATA[name].to+rt);
	saveData += (getString('total')+FS+BILL_INFO.currency+FS+formNum3(BILL_DATA[name].total_price,2)+rt);

	saveData += (getString('tzone')+FS+getString('pconsum')+'[kWh],'+getString('price')+'['+BILL_INFO.currency+'],'+getString('uprice')+'['+BILL_INFO.currency+'/kWh]'+rt);

	var rate_info = BILL_INFO.rate;
	var prices = BILL_DATA[name].price;
	var total = BILL_DATA[name].total;
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') {
			saveData += (rate_info[p][4]+FS+formNum3(total[p],3)+FS+formNum3(prices[p],2)+FS+formNum2(rate_info[p][3])+rt);
		}
	}
	// output total line
	saveData += (getString('total')+FS+formNum3(BILL_DATA[name].total_power,3)+FS+formNum3(BILL_DATA[name].total_price,2)+rt+rt);

	saveData += (getString('result_table_title')+'[kWh]'+rt+rt);

	// set point name to table
	var result_table = BILL_DATA[name].result;
	saveData += getString('pname');
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') saveData += (FS+rate_info[p][4]);
	}
	saveData += rt;

	for(var i = 0; i < id_list.length; i++) {
		var id = id_list[i];

		// make 1 line data
		line = POINT_LIST[id].info.name;
		var pdata = result_table[id];
		for(var z = 0; z < rate_info.length; z++) {
			if(rate_info[z][0] == 'enable') line += (FS+formNum3(pdata[z],3));
		}
		line += rt;
		saveData += line;
	}
	// total
	line = getString('total');
	for(var z = 0; z < rate_info.length; z++) {
		if(rate_info[z][0] == 'enable') line += (FS+formNum3(total[z],3));
	}
	line += rt;
	saveData += line;
	saveData += rt;
	// raw data out put
	saveData += (getString('ppd_raw_data')+rt);

	var row = makeRowData(data);
	var time_list = Object.keys(row);
	var common = FS+FS+FS;
	saveData += FS+FS+FS;
	for(var i = 0; i < id_list.length; i++) {
		saveData += (FS+POINT_LIST[id_list[i]].info.name+FS);
		common += (FS+'power'+FS+'stop');
	}
	saveData += rt;
	saveData += (common+rt);
	for(var t = 1; t < time_list.length; t++) {
		var date = new Date(parseInt(time_list[t]));
		saveData += (date.getFullYear()+FS+(date.getMonth()+1)+FS+date.getDate()+FS+date.getHours());
		for(var i = 0; i < id_list.length; i++) {
			var ppd = row[time_list[t]][id_list[i]];
			if(ppd == null) {
				saveData += (FS+FS);
			} else {
				saveData += (FS+formNum3(ppd[0],3)+FS+formNum3(ppd[1],3));
			}
		}
		saveData += rt;
	}
/*
	// output operation data (operation time and number of switch)
	saveData += (rt+getString('operation_raw_data')+rt);
	// output header
	saveData += (FS+FS+FS);
	var second_header = FS+FS+FS;
	for(var i = 0; i < id_list.length; i++) {
		var id = id_list[i];
		saveData += (FS+POINT_LIST[id].info.name+FS);
		second_header += (FS+getString('optime_m')+FS+getString('ontimes'))
	}
	saveData += (rt+second_header+rt);

	// make every hour data
	var op_data = makeHourlyData(name);
	time_list = Object.keys(op_data);
	for(var t = 0; t < time_list.length; t++) {
		var date = new Date(parseInt(time_list[t]));
		saveData += (date.getFullYear()+FS+(date.getMonth()+1)+FS+date.getDate()+FS+date.getHours());
		for(var i = 0; i < id_list.length; i++) {
			var op = op_data[time_list[t]][id_list[i]];
			if(op == null) {
				saveData += (FS+FS);
			} else {
				saveData += (FS+Math.round(op[0]/60)+FS+op[1]);
			}
		}
		saveData += rt;

	}*/
	return saveData;
}

function makeRowData(data) {
	// data: [id][time]['ppd'][ppd,stop]
	// result: [time][id][ppd,stop]
	var id_list;
	var time_list;
	var result = {};
	result['title'] = {};
	id_list = Object.keys(data);
	for(var i = 0; i < id_list.length; i++) {
		time_list = Object.keys(data[id_list[i]]);
		for(var t = 0; t < time_list.length; t++) {
			var current = data[id_list[i]][time_list[t]]['ppd'];
			if(current != null) {
				if(result['title'][id_list[i]] == null) {
					result['title'][id_list[i]] = POINT_LIST[id_list[i]].info.name;
				}
				if(result[time_list[t]] == null) {
					result[time_list[t]] = {};
				}
				result[time_list[t]][id_list[i]] = current;
			}
		}
	}
	return result;
}

function makeHourlyData(name) {
	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var data = BILL_DATA[name].data;
	var result = {};	// {time:{id:[optime,ontimes],...},...}
	for(var id in data) {
		var time_list = Object.keys(data[id]);
		for(var i = 0; i < time_list.length; i++) {
			var time = new Date(parseInt(time_list[i]));
			var std_time = new Date(time.getFullYear(),time.getMonth(),time.getDate(),time.getHours());
			var key = std_time.getTime();
			if(result[key] == null) result[key] = {};
			if(result[key][id] == null) result[key][id] = [0,0];
			if(data[id][time_list[i]]['op_time'] != null) result[key][id][0] += data[id][time_list[i]]['op_time'][0];
			if(data[id][time_list[i]]['on_times'] != null) result[key][id][1] += data[id][time_list[i]]['on_times'];
		}
	}
	return result;
}

function addressInBill(address_info) {
	var address = '';
	for(var i in address_info) {
		if(address.length > 0) address += '<br>';
		address += address_info[i];
	}
	return address;
}

function contactInBill(contact_info) {
	var contact = '';
	for(var i in contact_info) {
		if(contact.length > 0) contact += '<br>';
		contact += contact_info[i];
	}
	return contact;
}


// from SVMPS1 end
function drawTimeZonePrice() {
	var canvas = $('canvas')[0];
	var context = canvas.getContext('2d');
	context.clearRect(0,0,150,315);

	var zone = getTimeZoneArray();
	for(var i = 0; i < zone.length; i++) {
		drawZone(context,zone[i][0],zone[i][1],zone[i][2]);
	}
//	drawZone(context,0,24,'royalblue');
//	drawZone(context,7,19,'yellow');
//	drawZone(context,10,17,'red');
	if(zone.length > 0) {
		context.fillStyle = 'black';
		context.beginPath();
		context.lineWidth = 1;
		context.moveTo(10,10);
		context.lineTo(10,305);
		context.stroke();
	}
}

function drawZone(context,from,to,col) {
	context.fillStyle = 'black';
	var up = 295*from/24+10;
	var down = 295*to/24+10;
	context.fillStyle = col;
	context.fillRect(10,up,50,down-up);

	context.fillStyle = 'black';
	context.beginPath();
	context.moveTo(10,up);
	context.lineTo(80,up);
	context.stroke();
	context.fillText(from+':00',85,up+2)
	context.beginPath();
	context.moveTo(10,down);
	context.lineTo(80,down);
	context.stroke();
	context.fillText(to+':00',85,down+2)
}

function getTimeZoneArray() {
	var zone = [];
	for(var pri = 5; pri > 0; pri--) {
		if($('#ppd #currency-content .t'+pri).hasClass('enable')	== true) {
			var from = parseInt($('#ppd #currency-content .t'+pri+' .tzf input').val());
			var to = parseInt($('#ppd #currency-content .t'+pri+' .tzt input').val());
			var col = $('#ppd #currency-content .t'+pri+' .price input').css('background-color');
			zone.push([from,to,col]);
		}
	}
	return zone;
}

//from SVMPS1 start

function setLog(data) {
	$('.charge-log .scrol-frame tbody').html('');
	for(var i = 0; i < data.length; i++) {
		var date = new Date(data[i][1]*1000);
		var line = '<tr><td>'+date.toLocaleDateString(LOCALE,DATEOPT)+' '+date.toLocaleTimeString(LOCALE)+'</td>';
		line += ('<td>'+data[i][5]+'</td>');
		line += ('<td>'+data[i][6][1]+'</td>');
		line += ('<td>'+data[i][6][2]+'</td>');
		line += ('<td>'+data[i][4]+'</td></tr>');
		$('.charge-log .scrol-frame tbody').append(line);
	}
}

// change format of decimal point and add separater
// specify how many digit will show under dicemal point
function formNum(val,bdp) {
	var form = val.toFixed(bdp);
	var below = '';
	var above = form;
	if(bdp > 0) {
		var dp = form.indexOf('.');
		form = form.replace('.',DP);
		below = form.slice(dp);
		above = form.substring(0,dp);
	}
	var len = above.length;
	var result = below;
	while(above.length > 0) {
		result = above.substr(-3,3)+result;
		above = above.slice(0,-3);
		if(above.length > 0) result = SEP+result;
	}
	return result;
}

function formNum2(val) {
	return String(val).replace('.',DP);
}

function formNum3(val,bdp) {
	var form = val.toFixed(bdp);
	return form.replace('.',DP);
}

function printDiv(divID) {
	//Get the HTML of div
	var divElements = document.getElementById(divID).innerHTML;
	//Get the HTML of whole page
	var oldPage = document.body.innerHTML;

	//Reset the page's HTML with div's HTML only
	document.body.innerHTML = "<html><head><title></title></head><body>" + divElements + "</body>";

	//Print Page
	window.print();

	//Restore orignal HTML
	document.body.innerHTML = oldPage;

  
}

//from SVMPS1 end

function populateTenantList() {
	var dom = "";
	var controlled = '';
	var warn = '';
	if(PREPAIED != true) {
		$('.prepaid').hide();
	} 

	var h = $('#ppd .panel').height();
	$('#ppd .tenant-list').height(HEIGHT-200);

	for(var name in TENANT_LIST) {
		controlled = '';
		warn = '';
		var charged = '';
		if(TENANT_LIST[name][1] != null) {
			charged = ' ('+getString('remain')+' '+BILL_INFO['currency']+TENANT_LIST[name][1].toFixed(2)+')';
			if(TENANT_LIST[name][1] <= 0) {
				controlled = ' warn';
			} else if(TENANT_LIST[name][1] <= TENANT_LIST[name][3]) {
				warn = ' warn';
			}
		}
		dom += ("<li class='tenant "+controlled+"' id='"+name+"'>"+name+"<span class='charged"+warn+"'>"+charged+"</span></li>");
	}
	
	$('#ppd .tenant-list').html(dom);
	
	$('#ppd #from').datepicker({
    showAnim: 'clip',
    changeMonth: true,
    dateFormat: DATEFORMAT,
    onSelect: function(selected, inst) {
    	FROMD = $(this).datepicker('getDate');
    },
    onClose: function( selectedDate ) {
      $( "#ppd #to" ).datepicker( "option", "minDate", selectedDate );
    }
	});
	
	$('#ppd #to').datepicker({
    showAnim: 'clip',
    changeMonth: true,
    dateFormat: DATEFORMAT,
    onSelect: function(selected, inst) {
    	TOD = $(this).datepicker('getDate');
    },
    onClose: function( selectedDate ) {
      $( "#ppd #from" ).datepicker( "option", "maxDate", selectedDate );
    }
	});
	
	setMultiLang('#ppd .mls');
	
	var h = $('#ppd .panel').height();
	
	$('#ppd .tenant-list').height(HEIGHT-200);	
	//end from SVMPS1
	localization('#ppd');	
}
// call when the connection is closed
// SVM-C1 shows login page after connection closed
function connectionClosed() {
	showLoginPage();
}

// command dispatch for SVM-C1
function command_dispatch(command,result,data) {
	// evt is JSON object send from server include command
	// command dispatch
	option = data;
	data = data[0];
	switch(command) {
		case 'login':
			if(result == 'OK') {
				OP_LIMIT = option[1];
				// request ppd enable/disable
				COMM_PORT.send(['get_option_info']);
				// request screen list
				COMM_PORT.send(['get_screen_list']);
				// request point list
				COMM_PORT.send(['get_point_list']);
				// request to get icon list
				COMM_PORT.send(['get_icon_list']);
				// request to get scene icon list
				COMM_PORT.send(['get_sceneicon_list']);
				// request bill info for PPD
				COMM_PORT.send(['get_bill_info']);
				// get tenant list
//				COMM_PORT.send(['get_tenant_list']);
				// get room list for hotel control
				COMM_PORT.send(['get_room_list']);
//			this is sample
//			COMM_PORT.send(['save_file','tmp.json',{"stat":"on","data":[1,2,3,4,5]}]);
			} else {
				alert(getString('login_failed'));
				COMM_PORT.closeConnection();
			}
			break;
		case 'logout':
			return false;
			break;
		case 'get_option_info':
			if(data.ppd_enable == true) PPD = true;
			else PPD = false;
			if(data.prepaied_enable == true) PREPAIED = true;
			else PREPAIED = false;
			if(data.hotel == true) HOTEL = true;
			else HOTEL = false;
			if(data.data == true) DBMAN = true
			else DBMAN = false;
			if(data.bei == true) BEI = true;
			else BEI = false;
			break;
		case 'get_screen_list':
			SCREEN_LIST = data;
			break;
		case 'set_screen_list':
			if(result == 'NG') {
				alert(getString('fail_scrn_save'));
			} else {
				alert('OK');
			}
			break;
		case 'get_bill_data':
			// remove command from command array
			var com = BILL_DATA_COM.shift();
			if(result == 'OK') {
				var name = data['name'];
				$.extend(BILL_DATA[name]['data'], readPointData(data));
			} else {
				// return NG
				var name = BILL_DATA_COM[0][1].name;
				BILL_DATA[name]['data'] = {};
			}
			if(BILL_DATA_COM.length == 0) {
				$('#main #tenant_name').hide();
				loadScreen('tenant_bill.html',{});
			} else {
				// show tenant name in a dialog
				$('#main #tenant_name').text(BILL_DATA_COM[0][1]['name'])
				$('#main #tenan_name').show();
				COMM_PORT.send(BILL_DATA_COM[0]);
			}
			break;	
		case 'get_bill_info':
			if(result == 'OK' || (data != undefined && data['rate'] != undefined)) {
				BILL_INFO = data;
				if(BILL_INFO['rate'].length < 6) {
					BILL_INFO['rate'].push(['disable','00:00','24:00',0,getString('holiday')]);
					BILL_INFO['specialday'] = [];
				}
				SPEC_CAL = BILL_INFO['specialday'].slice();	// copy
			} else {
				BILL_INFO['rate'] = [['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,getString('holiday')]];
				BILL_INFO['specialday'] = [];
			}
			break;	
		case 'get_point_list':
			if(result == 'OK') {
				// read point list
				POINT_LIST = {};	// initialize point list
				POINT_ID_LIST = [];
				var point_list = data;
				for(var i in point_list) {
					var point = point_list[i];
					POINT_ID_LIST.push(point.id);
					POINT_LIST[point.id] = {'info':point,'stat':null};
				}
				// get point status 
				var com = ['get_point_status',POINT_ID_LIST];
				COMM_PORT.send(com); 
			}
			break;
		case 'get_point_status':
			if(result == 'OK') {
				var point_status = data;
				for(var i in point_status) {
					var point = point_status[i];
					if(POINT_LIST[point[0]] != null) {
						POINT_LIST[point[0]].stat = point[1];
						cellStatus(POINT_LIST[point[0]]);
					}
				}
				// load main screen
				loadScreen('top_screen.html');
				// initialization is completed
				COMM_PORT.ready();
			} else {

			}
			break;
		case 'set_point_info':
			if(result == 'OK') {

			} else {

			}
			break;
		case 'cos':
			if(COMM_PORT.isReady() == true) {
				id = data[0];
				cos = data[1];
				if(POINT_LIST[id] != null) {
					console.log(id);
					for(var key in cos) {
						console.log(key+":"+cos[key]);
						POINT_LIST[id].stat[key] = cos[key];
					}
					cellStatus(POINT_LIST[id]);
					updateOpUnits(id,cos);
				}
			}
			break;
		case 'rcos':
			if(COMM_PORT.isReady() == true) {
				room = data[0];
				cos = data[1];
				if(cos.version == null) {
					if(ROOM_ID[room] != null) {
						set_room_stat(room,cos);
					}
				} else if(cos.version == 2) {
					if(ROOMLIST[room] != null) {
						set_room_stat2(room,cos);
					}
				}
			}
			break;
		case 'get_room_list':
			if(result == 'OK') {
				ROOMLIST = data;
				make_room_hash();
			} else {
				ROOMLIST = [];
				ROOM_ID = {};
			}
			break;
		case 'rent':
			set_rent_stat(result,data);
			break;
		case 'set_passwd':
			alert(result);
			break;
		case 'get_user_list':
			if(result == 'OK') {
				USERLIST = data;
			} else {
				USERLIST = [];
			}
			break;
		case 'get_icon_list':
			if(result == 'OK') {
				ICONLIST = data;
			} else {
				ICONLIST = [];
			}
			break;
		case 'get_sceneicon_list':
			if(result == 'OK') {
				SCENEICONLIST = data;
			} else {
				SCENEICONLIST = [];
			}
			break;	
		case 'set_schedule_pattern':
			if(result == 'OK') {

			} else {
				
			}
			break;
		case 'get_schedule_pattern':
			if(result == 'OK') {
				PATTERN_LIST = data;
			} else {
				PATTERN_LIST = {};
			}
			COMM_PORT.removeCom('sched',command);
			if(COMM_PORT.monitoredCom('sched').length == 0) loadScreen('schedule_screen.html');
			break;
		case 'set_calendar':
			if(result == 'OK') {

			} else {
				
			}
			break;
		case 'get_calendar':
			if(result == 'OK') {
				CALENDAR = data;
			} else {
				CALENDAR = {}
			}
			COMM_PORT.removeCom('sched',command);
			if(COMM_PORT.monitoredCom('sched').length == 0) loadScreen('schedule_screen.html');
			break;
		case 'add_schedule_program':
			if(result == 'OK') {

			} else {
				
			}
			break;
		case 'get_schedule_program':
			if(result == 'OK') {
				SCHEDULE_PROG = data;				
			} else {
				SCHEDULE_PROG = {};
			}
			COMM_PORT.removeCom('sched',command);
			if(COMM_PORT.monitoredCom('sched').length == 0) loadScreen('schedule_screen.html');
			break;
		case 'set_schedule_program':
			if(result == 'OK') {

			} else {
				
			}
			break;
		case 'rename_schedule_program':
			if(result == 'OK') {

			} else {
				
			}
			break;
		case 'delete_schedule_program':
			if(result == 'OK') {

			} else {
				
			}
			break;
		case 'get_network_info':
			if(result == "OK") set_network_info_to_system_screen(data);
			else alert('Could not get network setting information');
			break;
		case 'set_network_info':
			if(result == "NG") alert("Fail to set network setting");
			break;
		case 'get_timezone':
			if(result == "OK") set_timezone_info_to_system_screen(data);
			else alert("Could not get timezone information");
			break;
		case 'set_timezone':
			if(result == "NG") alert("Fail to set timezone");
			break;
		case 'get_history':
			FULL_HISTORY = data;
			HISTORY = data;	
			if(result == 'OK') setHistory();
			if(result == 'NG') alert("Fail to retrieve history");
			break;
		case 'get_first_id_number':
			if(result == 'OK') {
				RECPP = data[0];
			}
			break;
		case 'get_interlock':
			INTERLOCK_LIST = data;
			if(result == 'NG') INTERLOCK_LIST = {};
			setIProgramList();
			break;
		case 'delete_interlock':
			if(result == 'NG') alert("Fail to delete interlock");
			break;
		case 'rename_interlock':
			if(result == 'NG') alert("Fail to rename interlock");
			break;
		case 'add_new_interlock':
			if(result == 'NG') alert("Fail to add new interlock");
			break;
		case 'save_interlock':
			if(result == 'NG') alert("Fail to save interlock");
			break;
		case 'get_hotel':
			HOTEL_LIST = data;
			if(result == 'NG') {
				HOTEL_LIST = {};
			} else {
				if(MODEL != 'S3'){
					setHotelScreen();
				}
			}
			break;
		case 'get_room_details':
			ROOM_DETAILS = data;
			if(result == 'NG') {
				ROOM_DETAILS = {};
			} else {
				setMultiHotelScreen();
			}
			break;
		case 'save_hotel':
			if(result == 'NG') alert("Fail to save hotel settings");
			break;	
		case 'get_scenes':
			if (typeof data === 'undefined') {
				SCENES_LIST = {};
			} else if(result == 'NG') {
				SCENES_LIST = {};
			} else {
				SCENES_LIST = data;
			}
			setSceneProgramList();
			break;
		//Kaiwei 16/07/2018 Added functions for reports
		/*********************************************/
		case 'get_report_types':
			if (typeof data === 'undefined') {
				REPORT_TYPE_LIST = {"report_types":[]};
			} else {
				REPORT_TYPE_LIST = data;
			}
			if(result == 'NG') REPORT_TYPE_LIST = {"report_types":[]};
			break;	
		/*********************************************/	
		//Kaiwei 16/07/2018 Added functions to retrieve AI data
		/*********************************************/
		case 'get_analog_input_values':
			if (typeof data === 'undefined') {
				TEMP_DATA = null;
			} else {
				TEMP_DATA = data;
			}
			
			if(result == 'NG') TEMP_DATA = null;
			
			if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
				//alert("No Analog Input Data Found!");
				alert(getString("rep_err_no_AI_data"));
			}
			try{
				formatAIData(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				displayChart();
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			
			break;
		case 'get_analog_input_values2':
			console.timeEnd('milestone2 - finished getting data from DB');
			console.time('milestone3 - finished javascript');
			if (typeof data === 'undefined') {
				TEMP_DATA = null;
			} else {
				TEMP_DATA = processTempData(data);
				//TEMP_DATA = data;
			}
			
			if(result == 'NG') TEMP_DATA = null;
			
			if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
				//alert("No Analog Input Data Found!");
				alert(getString("rep_err_no_AI_data"));
			}
			try{
				formatAIData2(TEMP_DATA)
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				$('.loading').hide();
				displayChart();
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			
			break;
		case 'get_pi_val_temp_table':
			console.timeEnd('milestone2 - finished getting data from DB');
			console.time('milestone3 - finished javascript');
			if (typeof data === 'undefined') {
				TEMP_DATA = null;
			}else {
				try{
					TEMP_DATA = summationByInterval(data)
				}catch(err){
					//alert("An error occurred while displaying chart");
					//alert(getString("rep_err_display_chart"));
					console.log(err.message)
				}
			}
			if(result == 'NG') TEMP_DATA = null;
			
			if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
				//alert("No Energy Data Found!");
				alert(getString("rep_err_no_energy_data"));
			}
			try{
				formatEnergyData(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				if(REPORTTYPE == 'bei_display'){
					if(BEI_DISPLAY_TYPE == 'Bei'){
						getBEIRatingForDisplay();
					}else if(BEI_DISPLAY_TYPE == 'Energy'){
						getEnergyConsumptionForDisplay();
					}
				}else{
					$('.loading').hide();
					displayEnergyChart();
				}
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			break;
		case 'get_pi_val_union_all':
			console.timeEnd('milestone2 - finished getting data from DB');
			console.time('milestone3 - finished javascript');
			if (typeof data === 'undefined') {
				TEMP_DATA = null;
			}else {
				try{
					TEMP_DATA = summationByInterval(data)
					//TEMP_DATA = summationByIntervalFull(data);
				}catch(err){
					//alert("An error occurred while displaying chart");
					//alert(getString("rep_err_display_chart"));
					console.log(err.message)
				}
				
			}
			if(result == 'NG') TEMP_DATA = null;
			
			if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
				//alert("No Energy Data Found!");
				alert(getString("rep_err_no_energy_data"));
			}
			try{
				formatEnergyData(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				if(REPORTTYPE == 'bei_display'){
					if(BEI_DISPLAY_TYPE == 'Bei'){
						getBEIRatingForDisplay();
					}else if(BEI_DISPLAY_TYPE == 'Energy'){
						getEnergyConsumptionForDisplay();
					}
				}else{
					$('.loading').hide();
					displayEnergyChart();
				}
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			
			break;
		case 'get_pi_val_daily':
			console.timeEnd('milestone2 - finished getting data from DB');
			console.time('milestone3 - finished javascript');
			if (typeof data === 'undefined') {
				TEMP_DATA = null;
			}else {
				try{
					TEMP_DATA = summationByInterval(data)
					//TEMP_DATA = summationByIntervalFull(data);
				}catch(err){
					//alert("An error occurred while displaying chart");
					//alert(getString("rep_err_display_chart"));
					console.log(err.message)
				}
				
			}
			if(result == 'NG') TEMP_DATA = null;
			
			if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
				//alert("No Energy Data Found!");
				alert(getString("rep_err_no_energy_data"));
			}
			try{
				
				formatEnergyData(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				if(REPORTTYPE == 'bei_display'){
					if(BEI_DISPLAY_TYPE == 'Bei'){
						getBEIRatingForDisplay();
					}else if(BEI_DISPLAY_TYPE == 'Energy'){
						getEnergyConsumptionForDisplay();
					}
				}else{
					$('.loading').hide();
					displayEnergyChart();
				}
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			
			break;
			
		case 'get_pi_val_daily2':
			console.timeEnd('milestone2 - finished getting data from DB');
			console.time('milestone3 - finished javascript');
			if (typeof data === 'undefined') {
				TEMP_DATA = null;
			}else {
				try{
					TEMP_DATA = summationByInterval(data);
					//TEMP_DATA = summationByIntervalFull(data);
				}catch(err){
					//alert("An error occurred while displaying chart");
					//alert(getString("rep_err_display_chart"));
					console.log(err.message)
				}
				
			}
			if(result == 'NG') TEMP_DATA = null;
			
			if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
				//alert("No Energy Data Found!");
				alert(getString("rep_err_no_energy_data"));
			}
			try{
				
				formatEnergyData(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				if(REPORTTYPE == 'bei_display'){
					if(BEI_DISPLAY_TYPE == 'Bei'){
						getBEIRatingForDisplay();
					}else if(BEI_DISPLAY_TYPE == 'Energy'){
						getEnergyConsumptionForDisplay();
					}
				}else{
					$('.loading').hide();
					displayEnergyChart();
				}
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			
			break;
		/*********************************************/		
		//Kaiwei 15/08/2018 Added functions to retrieve categorized pi
		/*********************************************/
		case 'get_categorized_pi':
			if (typeof data === 'undefined') {
				CATEGORIZED_PI = {};
			} else {
				CATEGORIZED_PI = data;
			}
			if(result == 'NG') CATEGORIZED_PI = {};
			break;
		case 'get_pi_categories':
			if (typeof data === 'undefined') {
				PI_CATEGORIES = {};
			} else {
				PI_CATEGORIES = data;
			}
			if(result == 'NG') PI_CATEGORIES = {};
			break;
		/*********************************************/
		//Kaiwei 15/08/2018 Added functions to set categorized pi
		/*********************************************/
		case 'set_categorized_pi':
			if(result == 'OK') {
				if(REPORTTYPE == "pi_Settings"){
					refreshCategoryPi();
				}
			} else {
				//alert("An error has occurred while adding management point");
				alert(getString("rep_err_add_man_point"));
			}
			break;
		case 'set_pi_categories':
			if(result == 'OK') {
				//alert("Categories Set Successful");
				alert(getString("rep_success_categories"));
				refreshCategories();
				updateCategorizedPi();
			} else {
				//add alert for errors
				alert(getString("rep_err_set_categories"));
			}
			break;
		/*********************************************/
		//Kaiwei 30/08/2018 Added functions for report start date
		/*********************************************/
		case 'get_start_date':
			if (typeof data === 'undefined') {
				REPORT_START_DATE = {"startDate":[]};
			} else {
				REPORT_START_DATE = data;
				tempArr = REPORT_START_DATE['startDate']
				REPORT_START_DATE = tempArr[0];
			}
			if(result == 'NG') REPORT_TYPE_LIST = {"report_types":[]};
			break;	
		case 'set_start_date':
			if(result == 'OK') {
				//alert("Start Date Set Successful");
				//alert(getString("rep_success_set_start_date"));
				$('.std-popup.menu-popup#startDate-ctrl').hide();
				ISTIMECHANGED = true;
			} else {
				//alert("An error has occurred. Unable to set start date.");
				alert(getString("rep_err_set_start_date"));
			}
			break;
		case 'get_bei_regulations':
			if (typeof data === 'undefined') {
				BEI_REGULATIONS = {"beiRegulations":[]};
			} else {
				BEI_REGULATIONS = data;
				tempArr = BEI_REGULATIONS['beiRegulations']
				BEI_REGULATIONS = tempArr[0];
			}
			if(result == 'NG') BEI_REGULATIONS = {"beiRegulations":[]};
			break;	
		case 'set_bei_regulations':
			if(result == 'OK') {
				//alert("BEI Regulations Set Successful");
				//alert(getString("rep_success_set_bei_regulations"));
				$('.std-popup.menu-popup#startDate-ctrl').hide();
				//processBEIReport();
			} else {
				//alert("An error has occurred. Unable to set BEI Regulations.");
				alert(getString("rep_err_set_bei_regulations"));
			}
			break;
		/*************************************************************************/	
		//  Kaiwei 14/11/2018 Added functions to retrieve Operation and Error Info
		/*************************************************************************/
		case 'get_operation_info':
			if (typeof data === 'undefined') {
				OPERATION_INFO = [];
			} else {
				OPERATION_INFO = data;
				formatOperationInfoData(data);
			}
			
			if(OPERATION_INFO == null || isEmpty(OPERATION_INFO)){
				//alert("No Data Found!");
				alert(getString("rep_err_no_data"));
			}
			if(result == 'NG') OPERATION_INFO = [];
			break;
		case 'get_error_reporting':
			if (typeof data === 'undefined') {
				ERROR_INFO = [];
			} else {
				ERROR_INFO = data;
				formatErrorInfoData(data);
			}
			if(ERROR_INFO == null || isEmpty(ERROR_INFO)){
				//alert("No Data Found!");
				alert(getString("rep_err_no_data"));
			}
			if(result == 'NG') OPERATION_INFO = [];
			break;
		/*********************************************/
		case 'get_site_info':
			if (typeof data === 'undefined') {
				SITE_INFO = {};
			} else {
				SITE_INFO = data;
			}
			if(result == 'NG') SITE_INFO = {};
			break;
		case 'run_scenes':
			if(result == 'NG') alert(getString('scenes_fail'));
			if(result == 'OK') alert(getString('scenes_success'));
			break;
		case 'delete_scenes':
			if(result == 'NG') alert("Fail to delete scenes");
			break;
		case 'rename_scenes':
			if(result == 'NG') alert("Fail to rename scenes");
			break;
		case 'add_new_scenes':
			if(result == 'NG') alert("Fail to add new scenes");
			break;
		case 'save_scenes':
			if(result == 'NG') alert("Fail to save scenes");	
			break;
		case 'get_tenant_list':
			if(result == 'OK') {
				TENANT_LIST = data;
				if($('body').find('#ppd').length > 0) {	// don't change screen
					populateTenantList();
				} else {	// change screen
					loadScreen('ppd_screen.html');
				}
			} else {
			}
			break;					
		case 'mk_tenant':
			if(result == 'OK') {
				COMM_PORT.send(['get_tenant_list']);
			} else {
				alert(getString('add_tenant_fail'));
			}
			break;
		case 'rm_tenant':
			if(result == 'OK') {
				COMM_PORT.send(['get_tenant_list']);
			} else {
				alert(getString('del_tenant_fail'));
			}
			break;
		case 'reg_tenant_points':
			if(result == 'OK') {
				COMM_PORT.send(['get_tenant_list']);
			} else {
				alert(getString('update_tenant_fail'));
			}
			break;
		case 'get_tenant':
			break;
		case 'update_tenant_info':
			if(result == 'OK') {
				COMM_PORT.send(['get_tenant_list']);
			} else {
				alert(getString('update_tenant_fail'));
			}
			break;
		case 'set_charged':
			if(result == 'OK') {
				COMM_PORT.send(['get_tenant_list']);
			} else {
				alert(getString('tenant_charge_fail'));
			}
			break;
		case 'get_charge_log':
			setLog(data);
			break;
		case 'get_ppd':
			if(result == 'OK') {
				console.log(data);
			}
			break;		
		case 'get_ntp':
			if(result == "OK") set_ntp_info_to_system_screen(data);
			else alert("Could not get NTP information");
			break;			
		case 'get_datetime':
			if(result == "OK") set_datetime_info_to_system_screen(data);
			else alert("Could not get datetime information");
			break;	
		case 'set_datetime':
			if(result == "NG") alert("Fail to set datetime");
			break;	
		case 'set_ntp':
			if(result == "NG") alert("Fail to set auto time sync");
			break;	
    	case 'save_file':
			if(result == "NG") alert("Fail to save file");
			else COMM_PORT.send(['get_file','tmp.json']);   // this is sample
			break;
   	case 'get_file':
			if(result == "NG") alert("Fail to get file");
			else console.log(data); // this is sample
			break;
		case 'get_broadlink_exist':
			if(data == true && USER == 'admin') $('.menu-area #broadlink').show();
			break;
		case 'get_broadlink':	
			if(result == "NG") alert("Fail to get file");
			else {
				BROADLINK_COMMANDS = data;
				$('#system .setup').hide();
				$('#system .broadlink').show();
				
				$('#system .setup-area .broadlink .pulldown').html('');
	
				jQuery.each(POINT_LIST, function(key,value) {
					var type = key.substring(0, 3);
					if (type == 'blr') {
						$('#system .setup-area .broadlink .pulldown').append("<option value="+ key +">"+ value['info']['name'] +"</option>");
					}
				});	
				
				redraw_ir_command_list();
			}
			break;
		case 'save_broadlink':
			if(result == 'NG') {
				alert("Fail to save broadlink commands");
			} else {
				commandlist = BROADLINK_COMMANDS;
				
				var attr = [];
				
				jQuery.each(commandlist, function(key,value) {
					attr.push(key);
				});
				
				jQuery.each(POINT_LIST, function(key,value) {
					if(key.substring(0,3) == 'blr') POINT_LIST[key]['info']['attr']['command'] = attr;
				});		
			}
			break;
		case 'get_broadlink_ircode':
			if(result == "NG") {
				$('#system .broadlink .add_ir_commands #learn_ir').removeClass("selected");
				alert("Fail to get broadlink command");
			}
			else { 
				BROADLINK_LEARNED_COMMAND = data; 
				
				if (jQuery.isEmptyObject(BROADLINK_LEARNED_COMMAND) != true) {
					$('#system .broadlink .add_ir_commands #learn_ir').addClass("selected");
				}
			}
			break;
  		default:
	}
	return true;
}