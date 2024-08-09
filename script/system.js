// system screen event
$(document).on('page_before_show','.screen#system',function(e) {	
	// hide broadlink menu by default
	$('.menu-area #broadlink').hide();
	
	// language set
	$('#system .langset #language').val(LANG);

	//set decimal point
	$('#system .dpoint #dpoint').val(DP);	
	
	// set current user name for password setting
	$('#system .passwdset #user-name').text(USER);
	$('#system .passwdset input').val(PASSWD);

	// set point list to target list
	$('#system .userset #points .list').html('');
		$('#system .pointset .selectable-list .list').html('');
	for(var id in POINT_LIST) {
		var point = POINT_LIST[id];
		$('#system .userset #points .list').append("<li id='"+id+"'>"+point.info.name+"</li>");
		$('#system .pointset .selectable-list .list').append("<li id='"+id+"'>"+point.info.name+"</li>");
	}
	$('#system .userset #usr-list .list').html('');

	// set icon to selection list
	$('#system .pointset #icon-sel .img-list').html('');
	for(var i = 0; i < ICONLIST.length; i++) {
		$('#system .pointset #icon-sel .img-list').append("<li id='"+i+"'><img src='icon/"+ICONLIST[i]+"'/></li>");
	}

	// screen setup information
	var scrnlist = SCREEN_LIST.top.screen;
	$('#system .scrnset #screen-list .list').html('');
	for(var i in scrnlist) {
		var name = SCREEN_LIST[scrnlist[i]].name;
		$('#system .scrnset #screen-list .list').append('<li id="'+scrnlist[i]+'">'+name+'</li>');
	}
	$('#system .scrnset #pnt-select .list').html('');
	for(var id in POINT_LIST) {
		var point = POINT_LIST[id];
		$('#system .scrnset #pnt-select .list').append("<li id='"+id+"'>"+point.info.name+"</li>");
	}
	$('#system .scrnset #screen-list .list').sortable({
		items: 'li',
		cursor: 'move',
		opacity: 0.5
	});	

	$('#system .scrnset #screen-list .list').disableSelection();


	//datepicker for time & date
	$('#system .clock #currentdate').datepicker({
		showAnim: 'clip',
		changeMonth: true,
		dateFormat: DATEFORMAT,
	});	

	// menu indication depend on user
	if(USER != 'admin') {
		$('.menu-area #dpoint').hide();
		$('.menu-area #usr').hide();
		$('.menu-area #point').hide();
		$('.menu-area #screen').hide();
		$('.menu-area #network').hide();
		$('.menu-area #datetime').hide();
		$('.menu-area #connect').hide();
	}

	if(TP == false) {
		$('.menu-area #network').hide();
		$('.menu-area #datetime').hide();
		$('.menu-area #connect').hide();
	}
	if(MODEL == 'S1' || MODEL == 'S2' || MODEL == 'S3') {
		$('.menu-area #screen').hide();
		$('.menu-area #scenessetup').hide();		
	}
	if(MODEL == 'C2') {
		$('.menu-area #scenessetup').hide();		
	}
	if(MODEL == 'R3') {
		$('.menu-area #dpoint').hide();
		$('.menu-area #screen').hide();
		$('.menu-area #scenessetup').hide();		
		$('.menu-area #network').hide();
		$('.menu-area #datetime').hide();
		$('.menu-area #connect').hide();
	}

	if(MODEL == 'S4') {
		$('.menu-area #usr').hide();
		$('.menu-area #dpoint').hide();
		$('.menu-area #screen').hide();
		$('.menu-area #scenessetup').hide();		
		$('.menu-area #network').hide();
		$('.menu-area #datetime').hide();
		$('.menu-area #connect').hide();
	}

	//for scenes setup
	$('#system .scenes #command-set .an-action #stat-btn').attr('stat','off');
	$('#system .scenes #command-set .an-action #mode-btn').attr('mode','cool');
	$('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep','L');
	$('#system .scenes #command-set .an-action #flap-btn').attr('flap','swing');
	getScenes();
	
	// set scenes icon to selection list
	$('#system .scenes #sceneicon-sel .img-list').html('');
	for(var i = 0; i < SCENEICONLIST.length; i++) {
		$('#system .scenes #sceneicon-sel .img-list').append("<li id='"+i+"'><img src='icon/scenes/"+SCENEICONLIST[i]+"'/></li>");
	}

	if(USER == 'admin') {
		// request network setting information
		COMM_PORT.send(['get_network_info']);
		// request timezone information
		COMM_PORT.send(['get_timezone']);
		// request device connection info
		connection_info();
	}
		
	// request to get user list
	COMM_PORT.send(['get_user_list']);
	// request ntp information
	COMM_PORT.send(['get_ntp']);
	// request to see if broadlink exist
	COMM_PORT.send(['get_broadlink_exist']);
});

$(document).on('click','#system .passwdset #passwd-save',function(e) {
	var passwd = $('#system .passwdset input').val();
	COMM_PORT.send(['set_passwd',USER,passwd]);
});

$(document).on('click','#system .userset .add',function(e) {
	var name = $('#system .userset #usrname input').val();
	if(name == '') {
		alert(getString('no_user'));	//	modify later
		return;
	}
	for(var i = 0; i < USERLIST.length; i++) {
		if(name == USERLIST[i][0]) {
			alert(getString('same_user_exist'));
			return;
		}
	}
	var passwd = $('#system .userset #passwd input').val();
	var selected = $('#system .userset #points .list li.selected');
	var id_list = [];
	var id;
	for(var i = 0; i < selected.length; i++) {
		id = $(selected[i]).attr('id');
		id_list.push(id);
	}
	var limit = {'sp':false,'mode':false,'offtimer':false};
	if($('#system .userset #setpoint').hasClass('checked')) limit['sp'] = true;
	if($('#system .userset #mode').hasClass('checked')) limit['mode'] = true;

	var com = ['add_user',name,passwd,id_list,[],limit];
	COMM_PORT.send(com);
	USERLIST.push([name,passwd,id_list,[],limit]);
	$('#system .userset #usr-list .list li').removeClass('selected');
	$('#system .userset #usr-list .list').append('<li class="selected">'+name+'</li>');
});

$(document).on('click','#system .userset .modify',function(e) {
	var name = $('#system .userset #usrname input').val();
	var selected_name = $('#system .userset #usr-list .list li.selected').text();
	if(selected_name == '') {
		alert(getString('sel_user')); 
		return;
	}
	if(name != selected_name) {
		alert(getString('cannot_change_usr'));
		return;
	}
	var passwd = $('#system .userset #passwd input').val();
	var selected = $('#system .userset #points .list li.selected');
	var id_list = [];
	var id;
	for(var i = 0; i < selected.length; i++) {
		id = $(selected[i]).attr('id');
		id_list.push(id);
	}
	var limit = {'sp':false,'mode':false,'offtimer':false};
	if($('#system .userset #setpoint').hasClass('checked')) limit['sp'] = true;
	if($('#system .userset #mode').hasClass('checked')) limit['mode'] = true;

	var com = ['update_user_info',name,passwd,id_list,[],limit];
	COMM_PORT.send(com);

	for(var i = 0; i < USERLIST.length; i++) {
		if(name == USERLIST[i][0]) {
			USERLIST[i][1] = passwd;
			USERLIST[i][2] = id_list;
 			USERLIST[i][4] = limit;
			return;
		}
	}

});

$(document).on('click','#system .userset .delete',function(e) {
	var name = $('#system .userset #usrname input').val();
	if(name == '') {
		alert(getString('sel_user'));	//	modify later
		return;
	}
	if(confirm(getString('del_conf'))) {
		var com = ['delete_user',name];
		COMM_PORT.send(com);
		for(var i = 0; i < USERLIST.length; i++) {
			if(name == USERLIST[i][0]) {
				USERLIST.splice(i,1);
				break;
			}
		}
		$('#system .userset #usr-list .list').html('');
		for(var i = 0; i < USERLIST.length; i++) {
			$('#system .userset #usr-list .list').append('<li>'+USERLIST[i][0]+'</li>');
		}
		$('#system .userset #usrname input').val('');
		$('#system .userset #passwd input').val('');
		$('#system .userset #points .list li').removeClass('selected');
		$('#system .userset #setpoint').removeClass('checked');
		$('#system .userset #mode').removeClass('checked');
	}
});

$(document).on('click','#system .userset #usr-list li',function(e) {
	var name = $(this).text();
	var user_info;
	for(var i = 0; i < USERLIST.length; i++) {
		if(USERLIST[i][0] == name) {
			user_info = USERLIST[i];
			break;
		}
	}
	$('#system .userset #usrname input').val(user_info[0]);
	$('#system .userset #passwd input').val(user_info[1]);
	$('#system .userset #points .list li').removeClass('selected');
	for(var i = 0; i < user_info[2].length; i++) {
		$('#system .userset #points .list #'+user_info[2][i]).addClass('selected');
	}
	if(user_info[4]['sp'] == true) $('#system .userset #setpoint').addClass('checked');
	else $('#system .userset #setpoint').removeClass('checked');
	if(user_info[4]['mode'] == true) $('#system .userset #mode').addClass('checked');
	else $('#system .userset #mode').removeClass('checked');
});

$(document).on('click','#system .pointset .selectable-list li',function(e) {
	var id = $(this).attr('id');
	var point = POINT_LIST[id];
	if(point.info.type == "Ai") {
		$('#system .pointset .op-panel .attribute').show();
		$('#system .pointset .op-panel .attribute #unit input').val(point.info.attr.unit_label);
		if(point.info.attr.ulimit_monitor == true) {
			$('#system .pointset .op-panel .attribute #ulimit .check').addClass('checked');
			$('#system .pointset .op-panel .attribute #ulimit input').val(point.info.attr.ulimit);
		} else {
			$('#system .pointset .op-panel .attribute #ulimit .check').removeClass('checked');
			$('#system .pointset .op-panel .attribute #ulimit input').val("");
		}
		if(point.info.attr.llimit_monitor == true) {
			$('#system .pointset .op-panel .attribute #llimit .check').addClass('checked');
			$('#system .pointset .op-panel .attribute #llimit input').val(point.info.attr.llimit);
		} else {
			$('#system .pointset .op-panel .attribute #llimit .check').removeClass('checked');
			$('#system .pointset .op-panel .attribute #llimit input').val("");
		}
		$('#system .pointset .op-panel .attribute #calibration input').val(point.info.attr.calibration);
	} else {
		$('#system .pointset .op-panel .attribute').hide();
		$('#system .pointset .op-panel .attribute input').val('');
		$('#system .pointset .op-panel .attribute .check').removeClass('checked');
	}
	$('#system .pointset #point-name').val(point.info.name);
	$('#system .pointset #icon-sel .current-val').attr('src','icon/'+point.info.icon);

	$('#system .pointset #icon-sel li').removeClass('selected');
	var i = ICONLIST.indexOf(point.info.icon);
	$('#system .pointset #icon-sel #'+i).addClass('selected');
});

$(document).on('click','#system .pointset #point-save',function(e) {
	var name = $('#system .pointset #point-name').val();
	var icon = $('#system .pointset #icon-sel .current-val').attr('src').replace('icon/','');
	var id = $('#system .pointset .selectable-list li.selected').attr('id');
	POINT_LIST[id].info.name = name;
	POINT_LIST[id].info.icon = icon;

	$('#system .pointset .selectable-list li.selected').text(name);
	// update point information in the server
	var val = {};
	val[id] = {"name":name,"icon":icon};
	if(POINT_LIST[id].info.type == 'Ai') {
		var umon = $('#system .pointset .op-panel .attribute #ulimit .check').hasClass('checked');
		var ulimit = $('#system .pointset .op-panel .attribute #ulimit input').val();
		POINT_LIST[id].info.attr.ulimit_monitor = umon;
		if(umon == true) ulimit = parseFloat(ulimit);
		else ulimit = null;
		POINT_LIST[id].info.attr.ulimit = ulimit;
		var lmon = $('#system .pointset .op-panel .attribute #llimit .check').hasClass('checked');
		var llimit = $('#system .pointset .op-panel .attribute #llimit input').val();
		POINT_LIST[id].info.attr.llimit_monitor = lmon;
		if(lmon == true) llimit = parseFloat(llimit);
		else llimit = null;
		POINT_LIST[id].info.attr.llimit = llimit;
		var unit = $('#system .pointset .op-panel .attribute #unit input').val();
		POINT_LIST[id].info.attr.unit_label = unit;
		var cal = $('#system .pointset .op-panel .attribute #calibration input').val();
		cal = parseFloat(cal);
		POINT_LIST[id].info.attr.calibration = cal;		
		val[id]["attr"] = {"unit_label":unit,"ulimit_monitor":umon,"ulimit":ulimit,"llimit_monitor":lmon,"llimit":llimit,"calibration":cal};
	}
	COMM_PORT.send(['set_point_info',val]);
});

$(document).on('click','#system .network #net-save',function(e) {
	var dhcp = $('#system .network #auto-net .disable').hasClass('hide');
	var wifi = $('#system .network #con-type .disable').hasClass('hide');
	var ipaddr = $('#system .network #ipaddr').val();
	var netmask = $('#system .network #netmask').val();
	var default_gw = $('#system .network #defgw').val();
	var dns = $('#system .network #dns').val();
	var ssid = $('#system .network #ssid').val();
	var passwd = $('#system .network #passwd').val();
	var internet = $('#system .network #int-connect .disable').hasClass('hide');

	var val = {"dhcp":dhcp,"wifi":wifi,"ipaddr":ipaddr,"netmask":netmask,"gateway":default_gw,"dns":dns,"ssid":ssid,"passwd":passwd,"internet":internet};

	COMM_PORT.send(['set_network_info',val]);
});

$(document).on('click','#system .clock #auto-time-sync',function(e) {
	var ats = $('#system .clock #auto-time-sync .disable').hasClass('hide');
	
	if(ats == true || ats == 'true') $('#system .clock .dtedit').hide();	
	else $('#system .clock .dtedit').show();
	
});

$(document).on('click','#system .clock #clock-save',function(e) {
	var timezone = $('#system .clock #zone').val();
	
	var currentdate = $('#system .clock #currentdate').val();
	
	var year = currentdate.slice(0, 4);	
	var month = currentdate.slice(5, 7);
	var day = currentdate.slice(8, 10);
	
	var hour = $('#system .clock #time-hour').val();
	var minute = $('#system .clock #time-minute').val();
	
	var datetime = '"' + year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':00' + '"';
	
	var ats = $('#system .clock #auto-time-sync .disable').hasClass('hide');
	
	COMM_PORT.send(['set_ntp',ats]);
	COMM_PORT.send(['set_timezone',timezone]);
	COMM_PORT.send(['set_datetime',datetime]);
});

// screen setup function
$(document).on('click','#system .scrnset #screen-list li',function(e) {
	var sid = $(this).attr('id');
	$('#system .scrnset #pnt-select #scrn-name').val(SCREEN_LIST[sid].name);
	var points = SCREEN_LIST[sid].point;
	$('#system .scrnset #pnt-select .list li').removeClass('selected');
	for(var i in points) {
		var id = points[i];
		$('#system .scrnset #pnt-select .list li#'+id).addClass('selected');
	}
});

$(document).on('click','#system .scrnset .btn-panel #add',function(e) {
	var name = $('#system .scrnset #pnt-select #scrn-name').val();
	if(name.trim().length == 0) {
		alert(getString('type_name'));
		return;
	}

	var pid_list = [];

	var points = $('#system .scrnset #pnt-select .list .selected');
	$.each(points, function() {
		pid_list.push($(this).attr('id'));
	});	
	var sid = next_sid();
	if(SCREEN_LIST.top.type == 'default') {
		SCREEN_LIST.top.type = 'standard';
	}
	if(SCREEN_LIST.top.screen == null) {
		SCREEN_LIST.top.screen = [];
	}
	
	SCREEN_LIST[sid] = {"id":sid,"type":"standard","name":name,"point":pid_list}; 
	SCREEN_LIST.top.screen.push(sid);
	$('#system .scrnset #screen-list .list li').removeClass('selected');
	$('#system .scrnset #screen-list .list').append('<li class="selected" id="'+sid+'">'+name+'</li>');

	// clear input area
	$('#system .scrnset #pnt-select #scrn-name').val("");
	$('#system .scrnset #pnt-select .list li').removeClass('selected');
});

$(document).on('click','#system .scrnset .btn-panel #modify',function(e) {
	var sid = $('#system .scrnset #screen-list .list .selected').attr('id');
	if(sid == null) {
		alert(getString('select_scrn'));
		return;
	}
	var name = $('#system .scrnset #pnt-select #scrn-name').val();
	if(name.trim().length == 0) {
		alert(getString('type_name'));
		return;
	}
	var pid_list = [];

	var points = $('#system .scrnset #pnt-select .list .selected');
	$.each(points, function() {
		pid_list.push($(this).attr('id'));
	});	
	SCREEN_LIST[sid].name = name;
	SCREEN_LIST[sid].point = pid_list;
	$('#system .scrnset #screen-list .list .selected').html(name);

	// clear input area
	$('#system .scrnset #pnt-select #scrn-name').val("");
	$('#system .scrnset #pnt-select .list li').removeClass('selected');
});

$(document).on('click','#system .scrnset .btn-panel #delete',function(e) {
	var sid = $('#system .scrnset #screen-list .list .selected').attr('id');
	if(sid == null) {
		alert(getString('select_scrn'));
		return;
	}

	if(confirm(getString('conf_del_usr')) == false) return;

	var i = SCREEN_LIST.top.screen.indexOf(sid);
	if(i < 0) return;
	SCREEN_LIST.top.screen.splice(i,1);
	if(SCREEN_LIST.top.layout != null) delete SCREEN_LIST.top.layout[sid];
	if(SCREEN_LIST[sid] != null) delete SCREEN_LIST[sid];
	$('#system .scrnset #screen-list .list .selected').remove();
	$('#system .scrnset #pnt-select .list li').removeClass('selected');
	$('#system .scrnset #pnt-select #scrn-name').val('');
});

$(document).on('click','#system .scrnset .btn-panel #save',function(e) {
	SCREEN_LIST.top.screen = [];
	var screens = $('#system .scrnset #screen-list .list li');
	$.each(screens, function() {
		var sid = $(this).attr('id');
		SCREEN_LIST.top.screen.push(sid);
	});
	if(screens.length == 0) SCREEN_LIST = {"top":{"type":"default"}};

	var screen_list = {};
	for(var i in SCREEN_LIST) {
		screen_list[i] = {};
		screen_list[i].type = SCREEN_LIST[i].type;
		if(SCREEN_LIST[i].screen != null) screen_list[i].screen = SCREEN_LIST[i].screen;
		if(SCREEN_LIST[i].bgimg != null) screen_list[i].bgimg = SCREEN_LIST[i].bgimg;
		if(SCREEN_LIST[i].layout != null) screen_list[i].layout = SCREEN_LIST[i].layout;
		if(SCREEN_LIST[i].id != null) screen_list[i].id = SCREEN_LIST[i].id;
		if(SCREEN_LIST[i].name != null) screen_list[i].name = SCREEN_LIST[i].name;
		if(SCREEN_LIST[i].point != null) screen_list[i].point = SCREEN_LIST[i].point;
	}
	COMM_PORT.send(['set_screen_list',screen_list]);
});

$(document).on('click','#system .broadlink .add_ir_commands #learn_ir',function(e) {
	//get Management Point ID
	var selectedremote = $('#system .setup-area .broadlink #selected_blr').val();

	var command = ['broadlink_learning', selectedremote];
	COMM_PORT.send(command);
	
	if(confirm("Point the remote at the Broadlink Remote and press the button on the remote."+"\n"+"\n"+"Click 'OK' when the orange LED disappear.","OK")) {
		var command = ['get_broadlink_ircode', selectedremote];
		COMM_PORT.send(command);
	}
});

$(document).on('click','#system .broadlink #test_command',function(e) {
	var selectedremote = $('#system .setup-area .broadlink #selected_blr').val();
	
	if (jQuery.isEmptyObject(BROADLINK_LEARNED_COMMAND) == true) {
		$('#system .broadlink .add_ir_commands #learn_ir').removeClass("selected");
		alert('Broadlink has not learned any IR commands.');
		return;
	}
	
	var command = ['send_ir_command', BROADLINK_LEARNED_COMMAND, selectedremote];
	COMM_PORT.send(command);
});	

$(document).on('click','#system .broadlink .command-display .unique-selectable-list li',function(e) {
	if ($(this).hasClass('selected') == true) {
		$(this).parent('.list').find('.selected').removeClass('selected');
		$('#system .broadlink .save_learned_command #command-name').val('');
	} else {
		$(this).parent('.list').find('.selected').removeClass('selected');
		$(this).addClass('selected');
		var sid = $(this).attr('id');
		$('#system .broadlink .save_learned_command #command-name').val(decodeURI(sid));
	}
});

$(document).on('click','#system .broadlink .save_learned_command #save',function(e) {
	//get Management Point ID	
	var point = $('#system .broadlink .save_learned_command .list .selected');
	var selectedcommand = point.attr('id');
	
	var buttonname = $('#system .broadlink .save_learned_command #command-name').val();
	
	var tempvar = BROADLINK_LEARNED_COMMAND.toString();
	
	if(tempvar != "") {																//Learned IR Command exist
		if(selectedcommand === undefined) {											//If list has no selection
			if(buttonname != '') {													//If text box have value
				BROADLINK_COMMANDS[buttonname] = {"irCode": tempvar};	//create new IR command with new name
			} else {
				alert('Please key in a name for learned command.');
			}
		} else {																	//if list has selection
			if(buttonname != '') {													//delete existing, create new command with new name
				delete BROADLINK_COMMANDS[decodeURI(selectedcommand)];
				BROADLINK_COMMANDS[buttonname] = {"irCode": tempvar};
			} else {
				alert('Please key in a name for learned command.');
			}
		}
	} else {																		//learned IR command does not exist
		if(selectedcommand === undefined) {											//If list has no selection
			alert('There is no learned command to save');
		} else {																	//List has selection
			if(buttonname != decodeURI(selectedcommand)) {
				BROADLINK_COMMANDS[buttonname] = BROADLINK_COMMANDS[decodeURI(selectedcommand)];
				delete BROADLINK_COMMANDS[decodeURI(selectedcommand)];
			}
		}
	}

	var command = ['save_broadlink', BROADLINK_COMMANDS];
	COMM_PORT.send(command);
	redraw_ir_command_list();
});	

$(document).on('click','#system .broadlink .save_learned_command #delete',function(e) {
	//get Management Point ID
	var point = $('#system .broadlink .save_learned_command .list .selected');
	var selectedcommand = point.attr('id');
	
	
	if (selectedcommand === undefined) {
		alert('Please select a command to delete.');
		return;
	}
	else {
		if (confirm('Delete selected command?')) {
			delete BROADLINK_COMMANDS[decodeURI(selectedcommand)];
		} 
	}

	var command = ['save_broadlink', BROADLINK_COMMANDS];
	COMM_PORT.send(command);
	redraw_ir_command_list();
});

function redraw_ir_command_list() {	
	$('#system .setup-area .broadlink .command-display .list').html('');

	var selectedremote = $('#system .setup-area .broadlink #selected_blr').val();
	
	var commandlist = BROADLINK_COMMANDS;				
	
	jQuery.each(commandlist, function(key,value) {
		$('#system .setup-area .broadlink .command-display .list').append("<li id="+encodeURI(key)+"><span>"+key+"</span></li>");
	});	
	
	$('#system .broadlink .save_learned_command #command-name').val('');
	
	BROADLINK_LEARNED_COMMAND = [];
	$('#system .broadlink .add_ir_commands #learn_ir').removeClass("selected");
}

function sel_lang() {
	try {
		LANG = $('#system .langset #language option:selected').val();
		if(window.localStorage) {
			try {
				window.localStorage.setItem("lang",LANG);
			} catch(e) {}
		}
		localization('#system');
	} catch(e) {
		alert(e);
	}	
}


$(document).on('click','#system .menu-item#lang',function(e) {
	$('#system .setup').hide();
	$('#system .langset').show();
});
$(document).on('click','#system .menu-item#dpoint',function(e) {
	$('#system .setup').hide();
	$('#system .dpoint').show();
});
$(document).on('click','#system .menu-item#passwd',function(e) {
	$('#system .setup').hide();
	$('#system .passwdset').show();
});
$(document).on('click','#system .menu-item#usr',function(e) {
	$('#system .userset #usr-list .list').html('');
	for(var i = 0; i < USERLIST.length; i++) {
		$('#system .userset #usr-list .list').append('<li>'+USERLIST[i][0]+'</li>');
	}

	$('#system .setup').hide();
	$('#system .userset').show();
});

$(document).on('click','#system .menu-item#point',function(e) {
	$('#system .pointset .selectable-list .li').removeClass('selected');
	$('#system .pointset #point-name').val('');
	$('#system .pointset #icon-sel .current-val').attr('src','image/blank.png');

	$('#system .setup').hide();
	$('#system .pointset').show();
});

$(document).on('click','#system .menu-item#network',function(e) {
	$('#system .setup').hide();
	$('#system .network').show();
});

$(document).on('click','#system .menu-item#datetime',function(e) {
	COMM_PORT.send(['get_datetime']);	
	COMM_PORT.send(['get_ntp']);
	
	var ats = $('#system .clock #auto-time-sync .disable').hasClass('hide');
	
	if(ats == true || ats == 'true') $('#system .clock .dtedit').hide();	
	else $('#system .clock .dtedit').show();	
		
	$('#system .setup').hide();
	$('#system .clock').show();
});

$(document).on('click','#system .menu-item#screen',function(e) {
	$('#system .setup').hide();
	$('#system .scrnset').show();
});

$(document).on('click','#system .menu-item#scenessetup',function(e) {
	getScenes();
	$('#system .setup').hide();
	$('#system .scenes').show();
});

$(document).on('click','#system .menu-item#broadlink',function(e) {
	var command = ['get_broadlink'];
	COMM_PORT.send(command);
});	