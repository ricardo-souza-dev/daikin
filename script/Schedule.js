// schedule program
// {name:
//	{'enable':true/false,
//	 'target':[target points],
//	 'schedule':{schedule list}
//	},
//	name:{},...}
// 
// schedule list
// {name: <-- pattern name
//	{'wd':[day of week],
//	 'spd':[calendar]},
//  name: {},...}
// 
// pattern
// {name:
//	 [{'time':time(min from 0:00),
//	  'action':{com:action,...}},
//		 {},...],
//	name:[],...}
// 
// Calendar
// {name:
//		{month:[{'type':type,	(type: 'date'/'dow')
//		 'date':date,
//		 'day':day of week,	(mon,tue,...)
//		 'week':week (1,2,3,4,'last')},...],
//		 month:[],...}
//	 name:{},...
//	}

var SCHEDULE_PROG = {};	// all schedule programs under editing
// TARGET and SCHED_LSIT is initialize when #prog-content is opened
var TARGET = [];				// taget points of this program for edit
var TARGET1 = [];				
var TARGET2 = [];		
var TARGET3 = [];		
var SCHED_LIST = {};		// schedule list of this program for edit
var PATTERN_LIST = {};	// all stored pattern list
var PATTERN = [];				// a pttern of selected pattern in the list to edit
var CALENDAR = {};			// all stored calendar
var CALENDAR_CONTENT = [];
var MON_START = true;	// week start from monday if true otherwise start from sunday
var LISTED_CAL = [];

// schedule screen event
$(document).on('page_before_show','.screen#schedule',function(e) {
	// initialize schedule dialogs ex. sp range preaceholder and etc...
	initScheduleDialogs();
	// set program name to list
	setProgramList();
	// load scene information
	getScenes();
	// load interlock intformation
	getInterlock();
});


$(document).on('click','#schedule #prog-content .sched-name',function(e) {
	if($('#schedule #prog-content').attr('reject') == 'true') return;

	var name = $(this).text();
	if(name == '+') {
		$(this).parent().removeClass('selected');
		name = '';
		$('#schedule #patn-set #delete').hide();
		$('#schedule #patn-set #del-btn').hide();
	} else {
		$('#schedule #patn-set #delete').show();
		$('#schedule #patn-set #del-btn').show();
	}
	$('#schedule #patn-set').attr('sched-name',name);
	$('#schedule #patn-set #daily-patn').addClass('hide');

//	$('#schedule #patn-set #cancel').show();

	// selected schedule pattern is copyed for edit
	setScheduleScreen(name);
	$('#schedule #patn-set').show();
	$('#scheudle #prog-content').attr('reject',true);
});
$(document).on('click','#schedule #prog-content .dow',function(e) {
	if($('#schedule #prog-content').attr('reject') == 'true') return;

	var name = $(this).parent().find('.sched-name').text();
	var dow = SCHED_LIST[name].wd;
	LISTED_CAL = $.extend(true,[],SCHED_LIST[name].spd);

	$('#schedule #day-assign .item-title').text(name);

	// clear target day of week
	$('#schedule #day-assign #day-of-week .check').removeClass('checked');
	// set target day of week
	for(var i = 0; i < dow.length; i++) {
		$('#schedule #day-assign #'+dow[i]).addClass('checked');
	}

	// set calendar 
	setCalendarToList();
	$('#schedule #day-assign #sp-cal #select').hide();
	$('#schedule #day-assign').show();
	$('#schedule #prog-content').attr('reject',true);
});

$(document).on('click','#schedule #patn-set #set',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;

	var pattern = $('#schedule #patn-set #patn-list .selected').text();
	if(pattern.length == 0) {
		alert(getString(patn_not_set));	// pattern is not selected
		return;
	}
	var sched = {'wd':[],'spd':[]};
	var selectedName = $('#schedule #patn-set').attr('sched-name');
	if(selectedName == '') {	// new pattern is set
		SCHED_LIST[pattern] = sched;
	} else if(pattern != selectedName) {	// pattern is changed
		if(SCHED_LIST[pattern] != null) {	// selected pattern is already set
			alert(getString('patn_set_already')); 	// This pattern is already set.
			return;
		} else {	// pattern is just modified
			SCHED_LIST[pattern] = SCHED_LIST[selectedName];
			delete SCHED_LIST[selectedName];
		} 
	} else {	// pattern is not changed
	}
	setScheduleList();
	$('#schedule #patn-set').hide();
	$('#scheudle #prog-content').attr('reject',false);
});
$(document).on('click','#schedule #patn-set #delete',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;

	var pattern = $('#schedule #patn-set #patn-list .selected').text();
	var selectedName = $('#schedule #patn-set').attr('sched-name');

	if(confirm(getString('del_sched'))) {	// Delete this pattern from the schedule list. Is it OK?
			delete SCHED_LIST[selectedName];
	}

	setScheduleList();
	$('#schedule #patn-set').hide();
	$('#scheudle #prog-content').attr('reject',false);
});
$(document).on('click','#schedule #patn-set #cancel',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;

	$('#schedule #patn-set').hide();
	$('#scheudle #prog-content').attr('reject',false);
});

$(document).on('click','#schedule #patn-set #patn-list li',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;

	var name = $(this).text();
	if(name == '+') {
		name = '';
		$(this).removeClass('selected');
		PATTERN = [];
		$('#schedule #patn-set #daily-patn').removeClass('hide');
		$('#schedule #patn-set #del-btn').hide();
	} else {
		PATTERN = $.extend(true,[],PATTERN_LIST[name]);
		$('#schedule #patn-set #daily-patn').removeClass('hide');
		$('#schedule #patn-set #del-btn').show();
	}
	setPatternData(name);
});

$(document).on('click','#schedule #patn-set #set-btn',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;

	var name = $('#schedule #patn-set #patn-name').val();
	if(name.length == 0) {	// pattern name is not set
		alert(getString('no_patn_name'));	
		return;
	}
	var oldName = $('#schedule #patn-set').attr('patn-name');
	if(oldName == '' || oldName != name) {	// new pattern 
		if(addPattern(name) == false) {
			alert(getString('same_name'));
			return;
		}
	}
	// update pattern list and send it to server
	setPattern(name,PATTERN);

	$('#schedule #patn-set #del-btn').show();

	$('#schedule #patn-set').attr('patn-name',name);
	setPatternList(name);
});
$(document).on('click','#schedule #patn-set #del-btn',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;

	if(confirm(getString('del_patn_conf')) == false) return;	// This pattern will be deleted and connot use anymore. Is it OK? 
	var name = $('#schedule #patn-set').attr('patn-name');
	if(deletePattern(name) == false) {
		alert(getString('del_fail'));
		return;
	}

	// delete this pattern from the list
	$('#schedule #patn-set #patn-name').val('');
	var addLine = "<tr><td class='action add' colspan='2'>+</td></tr>";
	$('#schedule #patn-set #daily-patn table').html(addLine);
	$('#schedule #patn-set #daily-patn').addClass('hide');
	setPatternList('');
	$(this).hide();
});

$(document).on('click','#schedule #patn-set #daily-patn td',function(e) {
	if($('#schedule #patn-set').attr('reject') == 'true') return;
	var suffix = null;
	var time = 0;
	var action = {};
	if($(this).text() == '+')	{	// add new action
	} else {
		suffix = parseInt($(this).parent().attr('id'));
		time = PATTERN[suffix].time;
		action = PATTERN[suffix].action;
	}
	$('#schedule #action-set').attr('suffix',suffix);
	$('#schedule #action-set #hour .current-val').text(zeroFill(parseInt(time/60)));
	$('#schedule #action-set #min .current-val').text(zeroFill(parseInt(time%60)));
	$('#schedule #action-set #hour li').removeClass('selected');
	$('#schedule #action-set #min li').removeClass('selected');
	$('#schedule #action-set .an-action .check').removeClass('checked');
	initSchedAction();
	for(var id in action) {
		var target = $('#schedule #action-set .an-action#'+id+' .check');
		$(target).addClass('checked');
		if(id == 'stat') setSchedStat(action[id]);
		else if(id == 'sp') setSchedSp(action[id]);
		else if(id == 'fanstep') setSchedFanstep(action[id]);
		else if(id == 'flap') setSchedFlap(action[id]);
		else if(id == 'mode') setSchedMode(action[id]);
		else if(id == 'off_timer') setSchedOfftimer(action[id]);
		else if(id == 'csp_sb') setSchedCspSb(action[id]);
		else if(id == 'hsp_sb') setSchedHspSb(action[id]);
		else if(id == 'interlock') setInterlock(action[id]);
	}
	// show action set dialog
	$('#schedule #action-set').show();
	$('#schedule #patn-set').attr('reject',true);
});

// set action
$(document).on('click','#schedule #action-set #set',function(e) {
	var hour = parseInt($('#schedule #action-set #hour').text());
	var min = parseInt($('#schedule #action-set #min').text());
	var action = makeActionList();
	var suffix = parseInt($('#schedule #action-set').attr('suffix'));
	if(isNaN(suffix)) {	// new action
		// insert action to PATTERN
		PATTERN.push({'time':hour*60+min,'action':action});
		sortPattern();
	} else {
		// update action in PATTERN
		PATTERN[suffix].time = hour*60+min;
		PATTERN[suffix].action = action;
		sortPattern();
	}
	setPatternAction();
	$('#schedule #action-set').hide();
	$('#schedule #patn-set').attr('reject',false);
});
$(document).on('click','#schedule #action-set #cancel',function(e) {
	$('#schedule #action-set').hide();
	$('#schedule #patn-set').attr('reject',false);
});
$(document).on('click','#schedule #action-set #delete',function(e) {
	var suffix = parseInt($('#schedule #action-set').attr('suffix'));
	if(isNaN(suffix)) {// new action
	} else {
		// delete action in PATTERN
		PATTERN.splice(suffix,1);
	}
	setPatternAction();
	$('#schedule #action-set').hide();
	$('#schedule #patn-set').attr('reject',false);
});

$(document).on('click','#schedule #action-set #stat-btn',function(e) {
	var val = $(this).parent().attr('val');
	if(val == 'on') val = 'off';
	else val = 'on';
	setSchedStat(val);
});
$(document).on('click','#schedule #action-set #sp .popup-list li',function(e) {
	$(this).parents('#sp').attr('val',$(this).text());
});
$(document).on('click','#schedule #action-set #fanstep-btn',function(e) {
	var val = $(this).parent().attr('val');
	if(val == 'L') val = 'M';
	else if(val == 'M') val = 'H';
	else val = 'L';
	setSchedFanstep(val);
});
$(document).on('click','#schedule #action-set #flap-btn',function(e) {
	var val = $(this).parent().attr('val');
	if(val == 'swing') val = 4;
	else {
		val = parseInt(val)-1;
		if(val < 0) val = 'swing';
	}
	setSchedFlap(val);
});
$(document).on('click','#schedule #action-set #mode-btn',function(e) {
	var val = $(this).parent().attr('val');
	if(val == 'cool') val = 'heat';
	else if(val == 'heat') val = 'fan';
	else if(val == 'fan') val = 'dry';
	else val = 'cool';
	setSchedMode(val);
});
$(document).on('click','#schedule #action-set #off-timer-btn',function(e) {
	var val = $(this).parent().attr('val');
	if(val == 'on') val = 'off';
	else val = 'on';
	setSchedOfftimer(val);
});
$(document).on('click','#schedule #action-set #csp_sb .popup-list li',function(e) {
	$(this).parents('#csp_sb').attr('val',$(this).text());
});
$(document).on('click','#schedule #action-set #hsp_sb .popup-list li',function(e) {
	$(this).parents('#hsp_sb').attr('val',$(this).text());
});
$(document).on('click','#schedule #action-set #interlock .enable',function(e) {
	$(this).parents('#interlock').attr('val',false);
});
$(document).on('click','#schedule #action-set #interlock .disable',function(e) {
	$(this).parents('#interlock').attr('val',true);
});

$(document).on('click','#schedule #day-assign #set',function(e) {
	var name = $('#schedule #day-assign .item-title').text();
	// store selected day of week information
	var selected = $('#schedule #day-assign #day-of-week .checked');
	var dow = [];
	for(var i = 0; i < selected.length; i++) {
		dow.push($(selected[i]).attr('id'));
	}
	SCHED_LIST[name].wd = dow;
	// store selected calendar information
	var selected = $('#schedule #day-assign #sp-cal .list .checked');
	var spd = [];
	for(var i = 0; i < selected.length; i++) {
		spd.push($(selected[i]).find('span').text());
	}	
	SCHED_LIST[name].spd = spd;

	setScheduleList();
	$('#schedule #day-assign').hide();
	$('#schedule #cal-set').hide();
	$('#schedule #prog-content').attr('reject',false);
});
$(document).on('click','#schedule #day-assign #cancel',function(e) {
	$('#schedule #day-assign').hide();
	$('#schedule #cal-set').hide();
	$('#schedule #prog-content').attr('reject',false);
});
$(document).on('click','#schedule #day-assign #sp-cal #select',function(e) {
	var sel = $('#schedule #day-assign #sp-cal .list .selected');
	if(sel.length == 0) return;
	if($(sel).hasClass('checked')) {
		$(sel).removeClass('checked');
		$('#schedule #day-assign #select').text(getString('select'));
	} else {
		$(sel).addClass('checked');
		$('#schedule #day-assign #select').text(getString('clear'));
	}
});

$(document).on('click','#schedule #day-assign .list li',function(e) {
	// set button name select or clear depend on status
	if($(this).hasClass('checked')) $('#schedule #day-assign #select').text(getString('clear'));
	else $('#schedule #day-assign #select').text(getString('select')); 
	// open caledar dialog
	var cal_name = $(this).find('span').text();
	if(cal_name == '+') {	// new calendar
		$('#schedule #cal-set #cal-name').val('');
		CALENDAR_TEMP = {};
		$(this).removeClass('selected');
		$('#schedule #day-assign #sp-cal #select').hide();
		$('#schedule #cal-set #delete').hide();
	} else {
		$('#schedule #cal-set #cal-name').val(cal_name);
		CALENDAR_TEMP = $.extend(true,{},CALENDAR[cal_name]);
		$('#schedule #day-assign #sp-cal #select').show();
		$('#schedule #cal-set #delete').show();
	}
	var today = new Date();
	setCalendarWithSpecialDays(today.getFullYear(),today.getMonth()+1);

	$('#schedule #cal-set').show();
});

$(document).on('click','#schedule #cal-set #prev',function(e) {
	// set special days to CALENDAR_TEMP
	setMonthlyCalendar();
	var year = parseInt($(this).parents('.calendar').attr('year'));
	var month = parseInt($(this).parents('.calendar').attr('month'));
	month--;
	if(month < 1) {year--; month = 12;}
	setCalendarWithSpecialDays(year,month);
});
$(document).on('click','#schedule #cal-set #next',function(e) {
	// set special days to CALENDAR_TEMP
	setMonthlyCalendar();
	var year = parseInt($(this).parents('.calendar').attr('year'));
	var month = parseInt($(this).parents('.calendar').attr('month'));
	month++;
	if(month > 12) {year++; month = 1;}
	setCalendarWithSpecialDays(year,month);
});
$(document).on('click','#schedule #cal-set #set',function(e) {
	var name = $('#schedule #cal-set #cal-name').val();
	if(name.length == 0) {
		alert(getString('no_cal_name'));	// calendar name is not set
		return;
	}
	// set special days to CALENDAR_TEMP
	setMonthlyCalendar();
	// copy data CALENDAR_TEMP to CALENDAR
	// and save calendar to server
	saveCalendar(name,CALENDAR_TEMP);

	setCalendarToList();

	$('#schedule #cal-set').hide();
});
$(document).on('click','#schedule #cal-set #cancel',function(e) {
	$('#schedule #cal-set').hide();
});
$(document).on('click','#schedule #cal-set #delete',function(e) {
	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete?

	var name = $('#schedule #day-assign #sp-cal .list .selected span').text();
	if($('#schedule #day-assign #sp-cal .list .selected').hasClass('checked')) {
		// delete from LISTED_CAL
		var i = LISTED_CAL.indexOf(name);
		if(i >= 0) LISTED_CAL.splice(i,1);
	}
	// delete from CALENDAR
	// send calendar delete command to server
	saveCalendar(name,null);	

	setCalendarToList();
	$('#schedule #cal-set').hide();
});

// schedule screen event
$(document).on('click','#schedule #prog-list li',function(e) {
	if($('#schedule #prog-list').attr('reject') == 'true') return;

	var prog_name = $(this).text();

	if(prog_name == '+') { // add new program
		prog_name = '';
		$(this).removeClass('selected');
		$('#schedule #prog-content #delete').hide();
	} else {
		$('#schedule #prog-content #delete').show();
	}
	// initialize TARGET and SHCED_LIST in this method
	setProgScreen(prog_name);
//	setPointList();	
	$('#schedule #prog-list').attr('reject',true);
	$('#schedule #prog-content').show();
});

// program screen
$(document).on('click','#schedule #prog-content .list-title .img-button',function(e) {
	if($('#schedule #prog-content').attr('reject') == 'true') return;

	$('#schedule #prog-content .point-select.dialog').css('top',20);
	$('#schedule #prog-content .point-select.dialog').css('left',200);
	$('#schedule #prog-content .point-select .scene').removeClass('checked');
	$('#schedule #prog-content .point-select .interlock').removeClass('checked');
	setPointList();
	setSelectedPoint(TARGET);
	TARGET1 = getSelected();
	TARGET2 = [];	// scene target
	TARGET3 = [];	// interlock target
	for(var i in TARGET) {
		if(TARGET[i].startsWith('scn-')) TARGET2.push(TARGET[i]);
		else if(TARGET[i].startsWith('inl-')) TARGET3.push(TARGET[i]);
	}
	$('#schedule #prog-content .point-select.dialog').show();
	$('#schedule #prog-content').attr('reject','true');
});
$(document).on('click','#schedule #prog-content #set',function(e) {
	if($('#schedule #prog-content').attr('reject') == 'true') return;

	var oldName = $('#schedule #prog-content').attr('name');
	var newName = $('#schedule #prog-content input').val();
	var enable = $('#schedule #prog-content .slide .disable').hasClass('hide');
	if(newName.length == 0) {
		alert(getString('no_prog_name'));	// please input program name
		return;
	}
	if(oldName == null || oldName.length == 0) { // add program 
		if(addProgram(newName) == false) {	// fail to add program
			alert(getString('same_name'));	// this name is already exist
			return;
		}
	} else if(oldName != newName) {	// modify program name
		if(modifyProgramName(newName,oldName) == false) {	// fail to modify program name
			alert(getString('same_name'));	// this name is already exist
			return;
		}
	}

	// set program contents to SCHEDULE_PROG and send to server
	if(setProgram(newName,enable,TARGET,SCHED_LIST) == false) {
		alert("BUG");
	}

	setProgramList();
	$('#schedule #prog-content').hide();
	$('#schedule #prog-list').attr('reject',false);
});
$(document).on('click','#schedule #prog-content #cancel',function(e) {
	if($('#schedule #prog-content').attr('reject') == 'true') return;

	$('#schedule #prog-content').hide();
	$('#schedule #prog-list').attr('reject',false);
});
$(document).on('click','#schedule #prog-content #delete',function(e) {
	if($('#schedule #prog-content').attr('reject') == 'true') return;

	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?

	var name = $('#schedule #prog-content').attr('name');
	if(name != null && name.length > 0) {
		deleteProgram(name);
	}
	setProgramList();
	$('#schedule #prog-content').hide();
	$('#schedule #prog-list').attr('reject',false);
});

// point select dialog
$(document).on('click','#schedule #prog-content .point-select .scene',function(e) {
	if($('#schedule #prog-content .point-select .scene').hasClass('checked')) { // scenes list
		// store selected point info to TARGET
		if($('#schedule #prog-content .point-select .interlock').hasClass('checked')) {	// interlock is selected
			$('#schedule #prog-content .point-select .interlock').removeClass('checked');
			TARGET3 = getSelected();
		} else {	// point list is selected
			TARGET1 = getSelected();	
		}
		setSceneList();
		setSelectedPoint(TARGET2);
	} else { // point list
		TARGET2 = getSelected();
		setPointList();
		setSelectedPoint(TARGET1);
	}
});

$(document).on('click','#schedule #prog-content .point-select .interlock',function(e) {
	if($('#schedule #prog-content .point-select .interlock').hasClass('checked')) { // scenes list
		// store selected point info to TARGET
		if($('#schedule #prog-content .point-select .scene').hasClass('checked')) {	// interlock is selected
			$('#schedule #prog-content .point-select .scene').removeClass('checked');
			TARGET2 = getSelected();
		} else {	// point list is selected
			TARGET1 = getSelected();	
		}
		setInterlockList();
		setSelectedPoint(TARGET3);
	} else { // point list
		TARGET2 = getSelected();
		setPointList();
		setSelectedPoint(TARGET1);
	}
});

$(document).on('click','#schedule #prog-content .point-select .ok',function(e) {
	if($('#schedule #prog-content .point-select .scene').hasClass('checked')) { // scenes list
		TARGET2 = getSelected();
	} else if($('#schedule #prog-content .point-select .interlock').hasClass('checked')) {
		TARGET3 = getSelected();
	} else {
		TARGET1 = getSelected();
	}
	t1 = TARGET1.concat(TARGET2);
	TARGET = t1.concat(TARGET3);
	setPointsToList('#schedule #prog-content #ctrl-target .list');
	$('#schedule #prog-content').attr('reject',false);
});
$(document).on('click','#schedule #prog-content .point-select .cancel',function(e) {
	$('#schedule #prog-content').attr('reject',false);
});

function getSelected() {
	var point = $('#schedule #prog-content .point-select .list .selected');
	var id_list = [];
	for(var i = 0; i < point.length; i++) {
		id_list.push($(point[i]).attr('id'));
	}
	return id_list;
}

// add new program
// if smae name is already exist return false
function addProgram(name) {
	if(SCHEDULE_PROG.hasOwnProperty(name)) { // name is already exist
		return false;
	} else {
		SCHEDULE_PROG[name] = {'enable':false,'target':[],'schedule':[]};
		var command = ['add_schedule_program',name];
		console.log(command);
		COMM_PORT.send(command);

		return true;
	}
}

// modify program name
// if no oldName or newName exist then return false
function modifyProgramName(newName,oldName) {
	if(SCHEDULE_PROG.hasOwnProperty(oldName)) {
		if(addProgram(newName)) {
			SCHEDULE_PROG[newName] = SCHEDULE_PROG[oldName];
			delete SCHEDULE_PROG[oldName];
			var command = ['rename_schedule_program',oldName,newName];
			console.log(command);
			COMM_PORT.send(command);
			return true;
		} else return false;	// newName is already exist
	} else return false;	// oldName is not exist
}

// delete program
function deleteProgram(name) {
	if(SCHEDULE_PROG.hasOwnProperty(name) == false) return false;
	delete SCHEDULE_PROG[name];
	var command = ['delete_schedule_program',name];
	console.log(command);
	COMM_PORT.send(command);
	return true;
}
// set schedule program to specified program name
function setProgram(name,enable,targ_list,sched_list) {
	if(SCHEDULE_PROG.hasOwnProperty(name) == false) return false;
	SCHEDULE_PROG[name].enable = enable;
	SCHEDULE_PROG[name].target = $.extend(true,[],targ_list);
	SCHEDULE_PROG[name].schedule = sched_list;
	// send schedule program to server
	var command = ['set_schedule_program',name,SCHEDULE_PROG[name]];
	console.log(command);
	COMM_PORT.send(command);

	return true;
}

// convert scene index to name
function conv_scene_target(targ_list) {
	var list = [];
	for(var i in targ_list) {
		if(POINT_LIST[targ_list[i]] == null) {
			var name = Object.keys(SCENES_LIST)[targ_list[i]];
			list.push(name);
		} else {
			list.push(targ_list[i]);
		}
	}
	return list;
}

// return program name list
function getProgramList() {
	return Object.keys(SCHEDULE_PROG);
}

// return the program is enable or not
// enable is true
function isProgEnable(name) {
	if(SCHEDULE_PROG.hasOwnProperty(name) == false) return false;
	return SCHEDULE_PROG[name].enable;
}

// schedule screen control functions
function setProgramList() {
	var prog_list = getProgramList();
	$('#schedule #prog-list .list').html('');
	for(var i in prog_list) {
		var check = '';
		if(isProgEnable(prog_list[i])) check = "class='checked'";
		$('#schedule #prog-list .list').append("<li "+check+"><img src='image/check-g.png'><span>"+prog_list[i]+"</span></li>");
	}
	$('#schedule #prog-list .list').append("<li class='add'>+</li>");
}

// program screen data setup
function setProgScreen(name) {
	if(name == '') {
		$('#schedule #prog-content input').val('');
		$('#schedule #prog-content').attr('name','');		
	} else {
		$('#schedule #prog-content input').val(name);
		$('#schedule #prog-content').attr('name',name);
	}
	// reset screen first
	// set to disable
	$('#schedule #prog-content .slide .disable').removeClass('hide');
	$('#schedule #prog-content .slide .enable').addClass('hide');
	// clear target list
	$('#schedule #prog-content #ctrl-target .list').html('');

	TARGET = [];
	SCHED_LIST = {};
	if(SCHEDULE_PROG.hasOwnProperty(name)) {
		var enable = SCHEDULE_PROG[name].enable;
		// copy original data for edit
		TARGET = $.extend(true,[],SCHEDULE_PROG[name].target);
		SCHED_LIST = $.extend(true,{},SCHEDULE_PROG[name].schedule);
		// enable/disable switch
		if(enable) {
			$('#schedule #prog-content .slide .disable').addClass('hide');
			$('#schedule #prog-content .slide .enable').removeClass('hide');
		}
		// target list
		setPointsToList('#schedule #prog-content #ctrl-target .list');
	}
	// schedule list
	setScheduleList();
}

function conv_scene_name(targ_list) {
	var list = [];
	for(var i in targ_list) {
		if(POINT_LIST[targ_list[i]] == null) {
			var index = SCENES_LIST[targ_list[i]];
			list.push(index);
		} else {
			list.push(targ_list[i]);
		}
	}
	return list;
}

// set schedule list to list
function setScheduleList() {
	// clear schedule list
	$('#schedule #prog-content #sched-list table').html('');

	for(var name in SCHED_LIST) {
		var line = "<tr><td class='sched-name'>"+name+"</td><td class='dow'>"+makeTargetDay(name)+"</td></tr>";
		$('#schedule #prog-content #sched-list table').append(line);
	}

	$('#schedule #prog-content #sched-list table').append("<tr><td class='sched-name add' colspan='2'>+</td></tr>");
}
function makeTargetDay(name) {
	var dow = SCHED_LIST[name].wd;
	var spd = SCHED_LIST[name].spd;
//<span class='dow-name'>M</span>
	var days = '';
	for(var i = 0; i < dow.length; i++) {
		days += ("<span class='dow-name'>"+getString('s_'+dow[i])+"</span>");
	}
	for(var i = 0; i < spd.length; i++) {
		days += ("<span class='dow-name'>"+spd[i]+"</span>");
	}
	return days;
}

// set point name to dialog
function setPointList() {
	$('#schedule #prog-content .point-select .list').html('');
	for(var i in POINT_LIST) {
		var name = POINT_LIST[i].info.name;
		$('#schedule #prog-content .point-select .list').append("<li id='"+i+"''>"+name+"</li>");
	}
}

// set scene name to dialog
function setSceneList() {
	$('#schedule #prog-content .point-select .list').html('');
	for(var id in SCENES_LIST) {
		var name = SCENES_LIST[id].name;
		$('#schedule #prog-content .point-select .list').append("<li id='"+id+"''>"+name+"</li>");
	}
}

// set interlock name to dialog
function setInterlockList() {
	$('#schedule #prog-content .point-select .list').html('');
	for(var id in INTERLOCK_LIST) {
		var name = INTERLOCK_LIST[id].name;
		$('#schedule #prog-content .point-select .list').append("<li id='"+id+"''>"+name+"</li>");
	}
}

// set selected
function setSelectedPoint(id_list) {
	$('#schedule #prog-content .point-select .list li').removeClass('selected');
	for(var i = 0; i < id_list.length; i++) {
		$('#schedule #prog-content .point-select .list li#'+id_list[i]).addClass('selected');
	}
}

// set selected point in TARGET
function setPointsToList(target) {
	$(target).html('');
	for(var i = 0; i < TARGET.length; i++) {
		if(POINT_LIST[TARGET[i]] != null) $(target).append("<li id='"+TARGET[i]+"'>"+POINT_LIST[TARGET[i]].info.name+"</li>");
		else if(TARGET[i].startsWith('scn-')) {
			var name = SCENES_LIST[TARGET[i]].name;
			$(target).append("<li id='"+TARGET[i]+"'>"+name+"</li>");
		} else if(TARGET[i].startsWith('inl-')) {
			var name = INTERLOCK_LIST[TARGET[i]].name;
			$(target).append("<li id='"+TARGET[i]+"'>"+name+"</li>");
		}
	}
}

// initialize schedule dialogs
function initScheduleDialogs() {
	$('#schedule #prog-content input').css('placeholder',getString('prog_name'));
	$('#schedule #prog-content input').attr('placeholder',getString('new_prog_name'))
	$('#schedule #patn-set #sched-name').attr('placeholder',getString('sched_name'));	// New Schedule
	$('#schedule #patn-set #patn-name').attr('placeholder',getString('patn_name'));	// New Pattern

	// set time range
	$('#schedule #action-set #hour ul').html('');
	$('#schedule #action-set #min ul').html('');
	var val;
	for(var h = 0; h < 24; h++) {
		$('#schedule #action-set #hour ul').append('<li>'+zeroFill(h)+'</li>');
	}
	for(var m = 0; m < 60; m++) {
		$('#schedule #action-set #min ul').append('<li>'+zeroFill(m)+'</li>');
	}
	var range = [];
	for(var t = 32; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#schedule #action-set #sp',range);
	setCoolSbRange('#schedule #action-set #csp_sb');
	setHeatSbRange('#schedule #action-set #hsp_sb');
}

// schedule screen functions
// schedule screen data setup
function setScheduleScreen(name) {
	if(name != null && name != '') {
		PATTERN = $.extend(true,[],PATTERN_LIST[name]);
	} else {
		PATTERN = [];
	}
	// set pattern list

	setPatternList(name);

	setPatternData(name);
}

// set pattern to the list
function setPatternList(selected) {
	$('#schedule #patn-set #patn-list .list').html('');
	for(var name in PATTERN_LIST) {
		if(selected == name) {
			$('#schedule #patn-set #patn-list .list').append("<li class='selected'>"+name+"</li>"); 
			$('#schedule #patn-set #daily-patn').removeClass('hide');
		}	else $('#schedule #patn-set #patn-list .list').append("<li>"+name+"</li>");
	}
	$('#schedule #patn-set #patn-list .list').append("<li class='add'>+</li>");
}

// pattern data set 
function setPatternData(name) {
	$('#schedule #patn-set #patn-name').val(name);
	$('#schedule #patn-set').attr('patn-name',name);
	// make time line of this pattern
	setPatternAction();
}
function setPatternAction() {
	$('#schedule #patn-set #daily-patn table').html('');
	for(var i = 0; i < PATTERN.length; i++) {
		var time = PATTERN[i].time;
		var action = PATTERN[i].action;
		var line = "<tr id='"+i+"'><td class='time'>"+makeTimeStr(time)+"</td><td class='action'>"+makeActionData(action)+"</td></tr>";
		$('#schedule #patn-set #daily-patn table').append(line);
	}
	$('#schedule #patn-set #daily-patn table').append("<td class='action add' colspan='2'>+</td>");
}
// make action indication on the list
function makeActionData(action) {
	var data = '';
	for(var com in action) {
		if(com == 'stat') {
			if(action[com] == 'on') data += "<img class='sched-img' src='image/power-green.png'>";
			else data += "<img class='sched-img' src='image/power-gray.png'>";
		} else if(com == 'sp') {
			data += ("<img class='sched-sub-img' src='image/thermo.png'><span class='sched-val'>"+action[com].toFixed(1)+"</span><span class='sched-unit'>&deg;C</span>");
		} else if(com == 'fanstep') {
			if(action[com] == 'L') data += "<img class='sched-img' src='image/fanstep3-1.png'>";
			else if(action[com] == 'M') data += "<img class='sched-img' src='image/fanstep3-3.png'>";
			else data += "<img class='sched-img' src='image/fanstep3-5.png'>";
		} else if(com == 'flap') {
			var val;
			if(action[com] == 'swing') val = 7;
			else val = action[com];
			data += ("<img class='sched-img' src='image/wflap"+val+".png'>");
		} else if(com == 'mode') {
			data += ("<img class='sched-img' src='image/"+action[com]+".png'>");
		} else if(com == 'off_timer') {
			if(action[com] == 'on') data += "<img class='sched-img' src='image/offtimer-green.png'>";
			else data += "<img class='sched-img' src='image/offtimer-gray.png'>";
		} else if(com == 'csp_sb') {
			var val = action[com];
			if(val == null) val = '---';
			else val = val.toFixed(1);
			data += ("<img class='sched-sub-img' src='image/csb.png'><span class='sched-val'>"+			val+"</span><span class='sched-unit'>&deg;C</span>");
		} else if(com == 'hsp_sb') {
			var val = action[com];
			if(val == null) val = '---';
			else val = val.toFixed(1);
			data += ("<img class='sched-sub-img' src='image/hsb.png'><span class='sched-val'>"+			val+"</span><span class='sched-unit'>&deg;C</span>");
		} else if(com == 'scene') {
			data += ("<span class='sched-val'>"+getString('scene_exec')+"</span>");
		} else if(com == 'interlock') {
			var enable = getString('disable');
			if(action[com] == true) enable = getString('enable');
			data += ("<span class='sched-val'>"+getString('interlock')+' '+enable+"</span>");
		}
	}
	return data;
}

// add new pattern
function addPattern(name) {
	if(PATTERN_LIST.hasOwnProperty(name)) return false;
	PATTERN_LIST[name] = [];
	return true;
}

// set pattern
function setPattern(name, pattern) {
	PATTERN_LIST[name] = $.extend(true,[],pattern);

	// send pattern list to server
	var command = ['set_schedule_pattern',PATTERN_LIST];
	console.log(command);
	COMM_PORT.send(command);
}

// delete pattern
function deletePattern(name) {
	if(PATTERN_LIST.hasOwnProperty(name) == false) return false;
	delete PATTERN_LIST[name];
	// send pattern list to server
	var command = ['set_schedule_pattern',PATTERN_LIST];
	console.log(command);
	COMM_PORT.send(command);
	return true;
}

// sort pattern by time
function sortPattern() {
	PATTERN.sort(function(a,b) {
		return (a.time < b.time) ? -1: 1;
	});
}

// action setup
// make action list
function makeActionList() {
	var actionList = {};
	// check each operation
	var actions = $('#schedule #action-set #action .an-action .checked');
	for(var i = 0; i < actions.length; i++) {
		var command = $(actions[i]).parent().attr('id');
		var val = $(actions[i]).parent().attr('val');
		if(val == 'true') val = true;
		else if(val == 'false') val =false;
		if(command == 'sp') {
			val = parseFloat(val);
			if(isNaN(val)) val = null;
		} else if(command == 'csp_sb') {
			val = parseFloat(val);
			if(isNaN(val)) val = null;
		}	else if(command == 'hsp_sb') {
			val = parseFloat(val);
			if(isNaN(val)) val = null;
		}
		actionList[command] = val;
	}
	return actionList;
}

// initialize action set dialog
function initSchedAction() {
	setSchedStat('off');
	setSchedSp(24);
	setSchedFanstep('L');
	setSchedFlap('swing');
	setSchedMode('cool');
	setSchedOfftimer('off');
	setSchedCspSb(null);
	setSchedHspSb(null);
	setInterlock(false);
}

// set each control item indication
function setSchedStat(stat) {
	var target = $('#schedule #action-set #stat');
	if(stat == 'on') {
		$(target).attr('val','on');
		$(target).find('#stat-btn').attr('src','image/power-green.png');
	} else {
		$(target).attr('val','off');
		$(target).find('#stat-btn').attr('src','image/power-gray.png');
	}
}
function setSchedSp(sp) {
	var target = $('#schedule #action-set #sp');
	var val;
	if(sp == null) val = '---';
	else {
		val = sp.toFixed(1);
		$(target).find('#r'+sp*10).addClass('selected');
	}
	$(target).attr('val',sp);
	$(target).find('.current-val').text(val);
}
function setSchedFanstep(step) {
	var target = $('#schedule #action-set #fanstep');
	$(target).attr('val',step);
	var val;
	if(step == 'L') val = 1;
	else if(step == 'M') val = 3;
	else if(step == 'H') val = 5;
	else val = 3;
	$(target).find('#fanstep-btn').attr('src','image/fanstep3-'+val+'.png');
}
function setSchedFlap(flap) {
	var target = $('#schedule #action-set #flap');
	$(target).attr('val',flap);
	if(flap == 'swing') flap = 7;
	$(target).find('#flap-btn').attr('src','image/wflap'+flap+'.png');
}
function setSchedMode(mode) {
	var target = $('#schedule #action-set #mode');
	$(target).attr('val',mode);
	$(target).find('#mode-btn').attr('src','image/'+mode+'.png');
}
function setSchedOfftimer(stat) {
	var target = $('#schedule #action-set #off_timer');
	if(stat == 'on') {
		$(target).attr('val','on');
		$(target).find('#off-timer-btn').attr('src','image/offtimer-green.png');
	} else {
		$(target).attr('val','off');
		$(target).find('#off-timer-btn').attr('src','image/offtimer-gray.png');
	}
}
function setSchedCspSb(csb) {
	var target = $('#schedule #action-set #csp_sb');
	$(target).attr('val',csb);
	var val;
	if(csb == null) {
		val = '---';
		$(target).find('#---').addClass('selected');
	} else {
		val = csb.toFixed(1);
		$(target).find('#r'+sp*10).addClass('selected');
	}
	$(target).find('.current-val').text(val);
}
function setSchedHspSb(hsb) {
	var target = $('#schedule #action-set #hsp_sb');
	$(target).attr('val',hsb);
	var val;
	if(hsb == null) {
		val = '---';
		$(target).find('#---').addClass('selected');
	} else {
		val = hsb.toFixed(1);
		$(target).find('#r'+sp*10).addClass('selected');
	}
	$(target).find('.current-val').text(val);
}
function setInterlock(enable) {
	var target = $('#schedule #action-set #interlock');
	$('#schedule #action-set #interlock').attr('val',enable)
	if(enable == 'true' || enable == true) {
		$('#schedule #action-set #interlock .disable').addClass('hide');
		$('#schedule #action-set #interlock .enable').removeClass('hide');
	} else {
		$('#schedule #action-set #interlock .disable').removeClass('hide');
		$('#schedule #action-set #interlock .enable').addClass('hide');
	}
}

// calendar functions
// set calendar to the list of dialog
function setCalendarToList() {
	$('#schedule #day-assign #sp-cal .list').html('');	// clear list

	for(var name in CALENDAR) {
		var checked = false;
		console.log(LISTED_CAL.length);
		for(var i = 0; i < LISTED_CAL.length; i++) {
			if(name == LISTED_CAL[i]) {checked = true; break;}
		}
		if(checked) $('#schedule #day-assign #sp-cal .list').append("<li class='checked'><img src='image/check-b.png'><span>"+name+"</span></li>");
		else $('#schedule #day-assign #sp-cal .list').append("<li><img src='image/check-b.png'><span>"+name+"</span></li>");
	}
	$('#schedule #day-assign #sp-cal .list').append("<li class='add'><span>+</span></li>")
}
// get selected date
function setMonthlyCalendar() {
	var cal = getSpecialDays();
	for(var month in cal) {
		month = parseInt(month);
		CALENDAR_TEMP[month] = cal[month]
	}
}
function getSpecialDays() {
	var month = parseInt($('#schedule #cal-set .calendar').attr('month'));
	var dates = $('#schedule #cal-set .calendar .date');
	var days = $('#schedule #cal-set .calendar .day');
	var sp_days = [];
	for(var i = 0; i < dates.length; i++) {
		var date = parseInt($(dates[i]).text());
		sp_days.push({'type':'date','date':date});
	}
	for(var i = 0; i < days.length; i++) {
		var week = parseInt($(days[i]).parent().attr('class').replace('week',''));
		var day = parseInt($(days[i]).attr('class').replace(/day/g,''));
		if(week == 6) week = 'last';
		else if(week >= 4) {	// check if this is the last week
			if($('#schedule #cal-set .calendar .week'+(week+1)+' .day'+day).text().length == 0) week = 'last';
		}
		day = getDay(day);
		sp_days.push({'type':'day','day':day,'week':week});
	}
	var ret = {};
	ret[month] = sp_days;
	return ret;
}
function getDay(day) {
	var days = ['sun','mon','tue','wed','thu','fri','sat'];
	if(MON_START) {
		if(day == 7) day = 0;
		return days[day];
	}	else {
		return days[day-1];
	}
}

// set special days to calendar 
function setCalendarWithSpecialDays(year,month) {
	setCalendar($('#schedule #cal-set .calendar'),year,month,MON_START);

	var days = CALENDAR_TEMP[month];
	if(days == null) {
	} else {
		// set special days
		for(var i = 0; i < days.length; i++) {
			if(days[i].type == 'date') {
				setDateAsSpecialDay(days[i].date);
			} else {
				setDayAsSpecialDay(days[i].day,days[i].week);
			}
		}
	}
}
function setDateAsSpecialDay(date) {
	date = String(date);
	var days = $('#schedule #cal-set .calendar td');
	for(var i = 0; i < days.length; i++) {
		if($(days[i]).text() == date) {
			$(days[i]).addClass('date');
			break;
		}
	}
}
function setDayAsSpecialDay(day,week) {
	var mon = ['mon','tue','wed','thu','fri','sat','sun'];
	var sun = ['sun','mon','tue','wed','thu','fri','sat'];
	if(MON_START) day = 'day'+(mon.indexOf(day)+1);
	else day = 'day'+(sun.indexOf(day)+1);
	if(week == 'last') {
		for(var i = 6; i >= 4; i--) {
			if($('#schedule #cal-set .calendar .week'+i+' .'+day).text().length > 0) {
				week = i;
				break;
			}
		}
	}
	$('#schedule #cal-set .calendar .week'+week+' .'+day).addClass('day');
}

function saveCalendar(name, calendar) {
	if(calendar == null) delete CALENDAR[name];
	else CALENDAR[name] = $.extend(true,{},calendar);
	// send calendar data to server
	var command = ['set_calendar',CALENDAR];
	console.log(command);
	COMM_PORT.send(command);
}