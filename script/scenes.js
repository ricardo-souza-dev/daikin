$(document).on('page_before_show','.screen#scenes',function(e) {
	$('.cell-area').html('');
	$('.contents-area').removeClass('noscrlbar');

	getInterlock();	
	for(var id in SCENES_LIST) {
		var iconLink = SCENES_LIST[id].icon;
		var name = SCENES_LIST[id].name;
		$('.cell-area').append("<div class='scenesbutton' id="+id+"><div class='name'>"+name+"</div><div class='icon-area'><img class='icon' src="+iconLink+"></div></div>");
	}
});

//scene screen execute start
$(document).on('click','#scenes .cell-area .scenesbutton',function(e) {
	var id = $(this).attr('id');
	
	var command = ['run_scenes', id];
	COMM_PORT.send(command);
});

//scenes setting event
$(document).on('click','#system .scenes #scenes-prog-list li',function(e) {
	if($('#system .scenes #scenes-prog-list').attr('reject') == 'true') return;

	var id = $(this).attr('id');
	
	if(id == undefined) { // add new program
		$('#system .scenes #scenes-prog-content #delete').hide();
		$('#system .scenes #scenes-prog-content #execute').hide();
		$('#system .scenes #scenes-prog-content #copy').hide();
	} else {
		$('#system .scenes #scenes-prog-content #delete').show();
		$('#system .scenes #scenes-prog-content #execute').show();
		$('#system .scenes #scenes-prog-content #copy').show();
	}
	
	setSceneProgScreen(id);
	
	$('#system .scenes #scenes-prog-content #execute').hide();	//hide execute button
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').show();
});

$(document).on('click','#system .setup-area .scenes #scenes-prog-content #copy',function(e) {
	if($('#system .scenes #scenes-prog-content').attr('reject') == 'true') return;
	
	var id = $('#system .scenes #scenes-prog-content').attr('ident');

	if(SCENES_LIST[id] == null) return;

	SECENES_SEL = $.extend(true, {}, SCENES_LIST[id]);
	var scenes_name = 'Copy of ' + scenes_name;
	SCENES_SEL.name = scenes_name;
	
	setSceneProgScreen(id);
	
	$('#system .scenes #scenes-prog-content #scenename').val('');
	$('#system .scenes #scenes-prog-content #scenename').attr('placeholder', scenes_name);	//special transparent title, display only
	$('#system .scenes #scenes-prog-content').attr('ident','');
	
	$('#system .scenes #scenes-prog-content #execute').hide();	//hide execute button
	$('#system .scenes #scenes-prog-content #delete').hide();	//hide delete button
	$('#system .scenes #scenes-prog-content #copy').hide();	//hide copy button
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').show();
});

$(document).on('click','#system .setup-area .scenes #scenes-prog-content #delay',function(e) {
	if($('#system .scenes #scenes-prog-content').attr('reject') == 'true') return;
	
	$('#system .scenes #delay-set #delay1').val(SCENES_SEL.delay1);
	$('#system .scenes #delay-set #delay2').val(SCENES_SEL.delay2);
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',true);
	$('#system .scenes #delay-set').show();
});

$(document).on('click','#system .scenes #delay-set #save',function(e) {
	var delayTime1 = $('#system .scenes #delay-set #delay1').val();
	var delayTime2 = $('#system .scenes #delay-set #delay2').val();
	
	if(delayTime1 == '') delayTime1 = 0;
	if(delayTime2 == '') delayTime2 = 0;
	
	SCENES_SEL.delay1 = delayTime1;
	SCENES_SEL.delay2 = delayTime2;
	
	populateSceneCommands();
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',false);
	$('#system .scenes #delay-set').hide();
});

$(document).on('click','#system .scenes #delay-set #cancel',function(e) {
	
	var delay1 = $('#system .scenes #delay-set #delay1').attr('delay');
	var delay2 = $('#system .scenes #delay-set #delay2').attr('delay');
	
	$('#system .scenes #delay-set #delay1').val(delay1);
	$('#system .scenes #delay-set #delay2').val(delay2);
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',false);
	$('#system .scenes #delay-set').hide();
});

$(document).on('click','#system .scenes #scenes-prog-content #scenes-commands .multi-col-list tr',function(e) {
	if($('#system .scenes #scenes-prog-content').attr('reject') == 'true') return;
	
	var selected_output = $(this).attr('id');
	
	if(selected_output == 'delay') return;

	if(selected_output == '+') $(this).removeClass('selected');
	
	resetScenesOutput();
	checkSceneOutputType(selected_output);
	displayScenesOutput(selected_output);
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',true);
	$('#system .scenes #command-set').show();
});

$(document).on('click','#system .scenes #scenes-prog-content #execute',function(e) {
	var id = $('#system .scenes #scenes-prog-content').attr('ident');
	
	var command = ['run_scenes', id];
	COMM_PORT.send(command);
	
	getScenes();
});

$(document).on('click','#system .scenes #scenes-prog-content #save',function(e) {
	if($('#system .scenes #scenes-prog-content').attr('reject') == 'true') return;
	
	var id = $('#system .scenes #scenes-prog-content').attr('ident');
	var newName = $('#system .scenes #scenes-prog-content #scenename').val();
	var icon = $('#system .scenes #scenes-prog-content #sceneicon-sel .current-val').attr('src');
	var delayTime1 = $('#system .scenes #delay-set #delay1').val();
	var delayTime2 = $('#system .scenes #delay-set #delay2').val();
	
	if(newName.length == 0) {
		alert(getString('no_prog_name'));	// please input name
		return;
	}
	
	if(SCENES_LIST[newName] != null) {
		alert(getString('same_name'));	// this name already exist
		return;
	}
	
	if(delayTime1 == '') delayTime1 = 0;
	if(delayTime2 == '') delayTime2 = 0;
	
	SCENES_SEL.name = newName;
	SCENES_SEL.icon = icon;
	SCENES_SEL.delay1 = delayTime1;
	SCENES_SEL.delay2 = delayTime2;
	
	//start save new sort order
	var tempArray = [];
	$('#system .scenes #scenes-prog-content #scenes-commands tbody tr').each(function(){
		var tempId = $(this).attr("id");
	    for(var x in SCENES_SEL.output) {
			if(SCENES_SEL.output[x].id == tempId) {
				tempArray.push(SCENES_SEL.output[x]);
			}
		}
	});
	
	SCENES_SEL.output = tempArray;
	//end save new sort order
	
	if(id == "") { // add new scenes that did not exist.
		if(addScenes(newName) == false) {	// fail to add new scene
			alert(getString('same_name'));	// this name already exist
			return;
		}
	} else {
		saveScenes(id,newName);	
	}
	
	getScenes();
	$('#system .scenes #scenes-prog-list').attr('reject',false);
	$('#system .scenes #scenes-prog-content').hide();
});

$(document).on('click','#system .scenes #scenes-prog-content #cancel',function(e) {
	if($('#system .scenes #scenes-prog-content').attr('reject') == 'true') return;
	
	getScenes();
	$('#system .scenes #scenes-prog-list').attr('reject',false);
	$('#system .scenes #scenes-prog-content').hide();
});

$(document).on('click','#system .scenes #scenes-prog-content #delete',function(e) {
	if($('#system .scenes #scenes-prog-content').attr('reject') == 'true') return;
	
	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?
	
	var id = $('#system .scenes #scenes-prog-content').attr('ident');
	
	if(id.length > 0) {
		deleteScenes(id);
	}	
	
	getScenes();
	$('#system .scenes #scenes-prog-list').attr('reject',false);
	$('#system .scenes #scenes-prog-content').hide();
});

$(document).on('change','#system .scenes #command-set .button-area #management-point',function(e) {
	var selected_input = $('#system .scenes #command-set .button-area #management-point').val();
	
	$('#system .scenes #command-set .an-action#stat .check').removeClass('checked');	//reset check mark
	$('#system .scenes #command-set .an-action#sp .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#fanstep .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#flap .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#mode .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#lock .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#updown .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#brightness .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#interlock .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#interlock').attr('val',false);
	$('#system .scenes #command-set .an-action#interlock .disable').removeClass('hide');
	$('#system .scenes #command-set .an-action#interlock .enable').addClass('hide');
	
	checkSceneOutputType(selected_input);

	var oldName = $('#system .scenes #command-set .button-area #management-point').attr('oldname');
	if (oldName == '+') $('#system .scenes #command-set .button-area #delete').hide();
});	

$(document).on('click','#system .scenes #command-set .an-action #stat-btn',function(e) {
	var val = $('#system .scenes #command-set .an-action #stat-btn').attr('stat');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#system .scenes #command-set .an-action #stat-btn').attr('src','image/power-green.png');
		$('#system .scenes #command-set .an-action #stat-btn').attr('stat','on');
	} else {
		$('#system .scenes #command-set .an-action #stat-btn').attr('src','image/power-gray.png');
		$('#system .scenes #command-set .an-action #stat-btn').attr('stat','off');
	}
});

$(document).on('click','#system .scenes #command-set .an-action #mode-btn',function(e) {
	var mode = $('#system .scenes #command-set .an-action #mode-btn').attr('mode');
	if(mode == 'cool') mode = 'heat';
	else if(mode == 'heat') mode = 'fan';
	else if(mode == 'fan') mode = 'dry';
	else mode = 'cool';
	
	$('#system .scenes #command-set .an-action #mode-btn').attr('src','image/'+mode+'.png');
	$('#system .scenes #command-set .an-action #mode-btn').attr('mode',mode);
});

$(document).on('click','#system .scenes #command-set .an-action #fanstep-btn',function(e) {
	var step = $('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep');
	
	if(step == 'L') step = 'M';
	else if(step == 'M') step = 'H';
	else step = 'L';
	
	$('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep',step);
	var val;
	if(step == 'L') val = 1;
	else if(step == 'M') val = 3;
	else if(step == 'H') val = 5;
	else val = 3;
	$('#system .scenes #command-set .an-action #fanstep-btn').attr('src','image/fanstep3-'+val+'.png');
});

$(document).on('click','#system .scenes #command-set .an-action #flap-btn',function(e) {
	var flap = $('#system .scenes #command-set .an-action #flap-btn').attr('flap');
	if(flap == 'swing') flap = 4;
	else {
		flap = parseInt(flap)-1;
		if(flap < 0) flap = 'swing';
	}
	
	if(flap == 'swing') flap = 7;
	$('#system .scenes #command-set .an-action #flap-btn').attr('src','image/wflap'+flap+'.png');
	if(flap == 7) flap = 'swing';
	$('#system .scenes #command-set .an-action #flap-btn').attr('flap',flap);
});

$(document).on('click','#system .scenes #command-set .an-action #lock-btn',function(e) {
	var val = $('#system .scenes #command-set .an-action #lock-btn').attr('lock');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#system .scenes #command-set .an-action #lock-btn').attr('src','image/lock.png');
		$('#system .scenes #command-set .an-action #lock-btn').attr('lock','on');
	} else {
		$('#system .scenes #command-set .an-action #lock-btn').attr('src','image/open.png');
		$('#system .scenes #command-set .an-action #lock-btn').attr('lock','off');
	}
});

$(document).on('click','#system .scenes #command-set .an-action #shutter-btn',function(e) {
	var val = $('#system .scenes #command-set .an-action #shutter-btn').attr('updown');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#system .scenes #command-set .an-action #shutter-btn').attr('src','image/roleup.png');
		$('#system .scenes #command-set .an-action #shutter-btn').attr('updown','on');
	} else {
		$('#system .scenes #command-set .an-action #shutter-btn').attr('src','image/roledown.png');
		$('#system .scenes #command-set .an-action #shutter-btn').attr('updown','off');
	}
});

$(document).on('click','#system .scenes #command-set #set',function(e) {
	var managementPoint = $('#system .scenes #command-set #management-point').val();
	var selectedKey = $('#system .scenes #command-set #action .an-action .checked');
	
	var oldName = $('#system .scenes #command-set #management-point').attr('oldname');
	
	var controlsCommand = {};	
		
	for(var i = 0; i < selectedKey.length; i++) {
		var command = $(selectedKey[i]).parent().attr('id');
		
		if(command == 'stat') {
			var val = $('#system .scenes #command-set #action .an-action #stat-btn').attr('stat');
		} else if(command == 'sp') {
			var val = $('#system .scenes #command-set #sp .selectable-input .current-val').text();
		} else if(command == 'fanstep') {
			var val = $('#system .scenes #command-set #action .an-action #fanstep-btn').attr('fanstep');
		} else if(command == 'flap') {
			var val = $('#system .scenes #command-set #action .an-action #flap-btn').attr('flap');
		} else if(command == 'mode')  {
			var val = $('#system .scenes #command-set #action .an-action #mode-btn').attr('mode');
		} else if(command == 'lock')  {
			var val = $('#system .scenes #command-set #action .an-action #lock-btn').attr('lock');
		} else if(command == 'updown')  {
			var val = $('#system .scenes #command-set #action .an-action #shutter-btn').attr('updown');
		} else if(command == 'brightness')  {
			var val = $('#system .scenes #command-set #brightness .selectable-input .current-val').text();
			
			command = 'av';
		} else if(command == 'interlock') {
			var val = $('#system .scenes #command-set #action .an-action#interlock').attr('val');
			if(val == 'true' || val == true) val = true;
			else val = false;
		}
		
		controlsCommand[command] = val;
	}
	
	if($.isEmptyObject(controlsCommand)) {
		alert(getString("sel_com"));
		return;
	}
		
	//for new output set START
	if(oldName == '+') {
		for(var x in SCENES_SEL.output){
			if(SCENES_SEL.output[x].id == managementPoint) {
				alert(getString('registered'));
				return;
			}
		}
		
		SCENES_SEL.output.push({
			"id" : managementPoint,
			"command" : controlsCommand
		});
	} else {	
		
		if(oldName != null && oldName.length > 0) {
			//if managementPoint changed, check if already exist
			if(managementPoint != oldName) {
				for(var x in SCENES_SEL.output){
					if(SCENES_SEL.output[x].id == managementPoint) {
						alert(getString('registered'));
						return;
					}
				}
			}
			
			for(var x in SCENES_SEL.output){
				if(SCENES_SEL.output[x].id == oldName) {
					SCENES_SEL.output[x].id = managementPoint;
					SCENES_SEL.output[x].command = controlsCommand;
				}
			}
		}
	}
	
	populateSceneCommands();
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',false);
	$('#system .scenes #command-set').hide();
});

$(document).on('click','#system .scenes #command-set #cancel',function(e) {
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',false);
	$('#system .scenes #command-set').hide();
});

$(document).on('click','#system .scenes #command-set #delete',function(e) {
	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?
	
	var oldName = $('#system .scenes #command-set #management-point').attr('oldname');
	
	if(oldName != null && oldName.length > 0) {
		for(var x in SCENES_SEL.output){
			if(SCENES_SEL.output[x].id == oldName) {
				SCENES_SEL.output.splice(x, 1);
			}
		}
	}
	
	populateSceneCommands();	
	
	$('#system .scenes #scenes-prog-list').attr('reject',true);
	$('#system .scenes #scenes-prog-content').attr('reject',false);
	$('#system .scenes #command-set').hide();
});

$(document).on('click','#system .scenes #command-set #interlock .enable',function(e) {
	$(this).parents('#interlock').attr('val',false);
});
$(document).on('click','#system .scenes #command-set #interlock .disable',function(e) {
	$(this).parents('#interlock').attr('val',true);
});

function getScenes() {
	var command = ['get_scenes'];
	COMM_PORT.send(command);
	return true;
}

function addScenes(name) {

	if(SCENES_LIST[name] != null) return false;	

	var command = ['add_new_scenes',name,SCENES_SEL];
	COMM_PORT.send(command);

	return true;
}

function saveScenes(id,newName) {
	checkFlag = false;
	if(SCENES_LIST[id] == null) {
		alert('Scene name not found in list.');
	}
//	SCENES_LIST[newName] = SCENS_SEL;		
	
	var command = ['save_scenes',id,SCENES_SEL];
	COMM_PORT.send(command);

	return true;
}

function deleteScenes(id) {
	if(SCENES_LIST[id] == null) return false;

	var command = ['delete_scenes',id];
	COMM_PORT.send(command);
	return true;
}

function setSceneProgramList() {			//set list of scenes, showing scenes names.
	$('#system .scenes #scenes-prog-list .list').html('');
	for(var id in SCENES_LIST) {
		$('#system .scenes #scenes-prog-list .list').append("<li id="+id+"><span>"+SCENES_LIST[id].name+"</span></li>");
	}
	$('#system .scenes #scenes-prog-list .list').append("<li class='add'>+</li>");
}

function setSceneProgScreen(id) {
	if(id == undefined) {
		$('#system .scenes #scenes-prog-content #scenename').val('');
		$('#system .scenes #scenes-prog-content #scenename').attr('placeholder', getString('new_scene'));	//special
		$('#system .scenes #scenes-prog-content').attr('name','');
		
		$('#system .scenes #scenes-prog-content #sceneicon-sel .current-val').attr('src', 'icon/scenes/home.png');
		$('#system .scenes #scenes-prog-content #sceneicon-sel li').removeClass('selected');		
		$('#system .scenes #scenes-prog-content #sceneicon-sel #1').addClass('selected');
		
		$('#system .scenes #delay-set #delay1').val(0);
		$('#system .scenes #delay-set #delay1').attr('delay',0);
		$('#system .scenes #delay-set #delay2').val(0);
		$('#system .scenes #delay-set #delay2').attr('delay',0);
		$('#system .scenes #scenes-prog-content').attr('ident',"");
		
		$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').html('');
		
		$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').append("<tr id=\"+\"><td style=\"padding-left: 135px;\">+</td></tr>");
		
		//reset SCENES_SEL to blank.
		
		SCENES_SEL = {
			"owner": USER,
			"name": "",
			"icon": "",
			"delay1": 0,
			"delay2": 0,
			"output": []
		};
		
		return;
	} else {
		$('#system .scenes #scenes-prog-content #scenename').val(SCENES_LIST[id].name);
		$('#system .scenes #scenes-prog-content').attr('ident',id);
	}

	if(SCENES_LIST[id] != null) SCENES_SEL = SCENES_LIST[id];
	
	$('#system .scenes #scenes-prog-content #sceneicon-sel .current-val').attr('src', SCENES_SEL.icon);
	
	$('#system .scenes #delay-set #delay1').val(SCENES_SEL.delay1);
	$('#system .scenes #delay-set #delay1').attr('delay',SCENES_SEL.delay1);
	$('#system .scenes #delay-set #delay2').val(SCENES_SEL.delay2);
	$('#system .scenes #delay-set #delay2').attr('delay',SCENES_SEL.delay2);
	
	//preselect the icon when clicking on icon select
	$('#system .scenes #scenes-prog-content #sceneicon-sel li').removeClass('selected');
	var imageFile = SCENES_SEL.icon.split('/', 3);
	var i = SCENEICONLIST.indexOf(imageFile[2]);
	$('#system .scenes #scenes-prog-content #sceneicon-sel #'+i).addClass('selected');
	
	populateSceneCommands();
}

function checkSceneOutputType(selected_input) {
	if (selected_input == '+') {
		if (typeof POINT_ID_LIST !== 'undefined' && POINT_ID_LIST.length > 0) selected_input = POINT_ID_LIST[0];
		else return;
	}
	
	$('#system .scenes #command-set #action #stat').hide();
	$('#system .scenes #command-set #action #sp').hide();
	$('#system .scenes #command-set #action #fanstep').hide();
	$('#system .scenes #command-set #action #flap').hide();
	$('#system .scenes #command-set #action #mode').hide();
	$('#system .scenes #command-set #action #lock').hide();
	$('#system .scenes #command-set #action #updown').hide();
	$('#system .scenes #command-set #action #brightness').hide();
	$('#system .scenes #command-set #action #brightness #brightText').show();
	$('#system .scenes #command-set #action #brightness #analogText').hide();
	$('#system .scenes #command-set #action #interlock').hide();
	
	if(POINT_LIST[selected_input] != null) {
		switch(POINT_LIST[selected_input].info.type) {						//MPoint type
			case 'Ahu':														//Air handling unit
			case 'Fcu':														//Fan coil unit
				$('#system .scenes #command-set #action #stat').show();
				$('#system .scenes #command-set #action #sp').show();
				$('#system .scenes #command-set #action #fanstep').show();
				$('#system .scenes #command-set #action #flap').show();
				$('#system .scenes #command-set #action #mode').show();
				break;
			case 'Dio':														//Usual on/off Switch
				$('#system .scenes #command-set #action #stat').show();
				break;
			case 'KeyLock':													//Keylock Open/Close
				$('#system .scenes #command-set #action #lock').show();	
				break;
			case 'LevelSw':													//Dimmer/Slider switch
			case 'RgbLevel':
				$('#system .scenes #command-set #action #stat').show();
				$('#system .scenes #command-set #action #brightness').show();
				$('#system .scenes #command-set #action #brightness #brightText').show();
				$('#system .scenes #command-set #action #brightness #analogText').hide();
				break;
			case 'Shutter':													// Roller Shutter, Up and Down
				$('#system .scenes #command-set #action #updown').show();	//all up/ all down 						
				break;
			case 'Ao':
				$('#system .scenes #command-set #action #brightness').show();	//****//
				$('#system .scenes #command-set #action #brightness #brightText').hide();
				$('#system .scenes #command-set #action #brightness #analogText').show();
				break;
			case 'Ai':														//Temp(fire), humidity, PM2.5, analog value Sensor
			case 'Di':														//Door, Window, Flood, binary Sensor
			default:														//Any other MPoint type not in list
				$('#system .scenes #command-set #action #stat').hide();
				$('#system .scenes #command-set #action #sp').hide();
				$('#system .scenes #command-set #action #fanstep').hide();
				$('#system .scenes #command-set #action #flap').hide();
				$('#system .scenes #command-set #action #mode').hide();
				$('#system .scenes #command-set #action #lock').hide();
				$('#system .scenes #command-set #action #updown').hide();
				$('#system .scenes #command-set #action #brightness').hide();
		}
	} else if(INTERLOCK_LIST[selected_input] != null) {
		$('#system .scenes #command-set #action #interlock').show();
	}
}

function populateSceneCommands() {
	$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').html('');
	
	if (SCENES_SEL.delay1 != 0){				//Display first delay in list of commands
		$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').append("<tr id='delay'><td>First delay(sec): </td><td>"+SCENES_SEL.delay1+"</td></tr>");
	}
	
	for(var x in SCENES_SEL.output) {
		var commandMP = SCENES_SEL.output[x].id;
		
		var commands = SCENES_SEL.output[x].command;
		
		commandImage = '';
		
		if(POINT_LIST[commandMP] != null) {
			for(i in commands) {	
				var command = [];
				command[0] = i; 
				command[1] = commands[i];
				
				//populate image according to selected value START
				
				if(command[0] == 'stat') {
					if(command[1] == 'on') {
						commandImage += '<img class=\"inter-img\" src=\"image/power-green.png\">';
					} else if(command[1] == 'off') {
						commandImage += '<img class=\"inter-img\" src=\"image/power-gray.png\">';
					}
				}
				else if(command[0] == 'sp') {
					commandImage += "<img class=\"inter-sub-img\" src=\"image/thermo.png\"><span class=\"inter-val\">"+command[1]+"</span><span class=\"inter-unit\">°C</span>";
				}
				else if(command[0] == 'fanstep') {
					if(command[1] == 'L') {
						commandImage += '<img class=\"inter-img\" src=\"image/fanstep3-1.png\">';
					} else if(command[1] == 'M') {
						commandImage += '<img class=\"inter-img\" src=\"image/fanstep3-3.png\">';
					} else if(command[1] == 'H') {
						commandImage += '<img class=\"inter-img\" src=\"image/fanstep3-5.png\">';
					}
				}
				else if(command[0] == 'flap') {
					if(command[1] == '0') {
						commandImage += '<img class=\"inter-img\" src=\"image/wflap0.png\">';
					} else if(command[1] == '1') {
						commandImage += '<img class=\"inter-img\" src=\"image/wflap1.png\">';
					} else if(command[1] == '2') {
						commandImage += '<img class=\"inter-img\" src=\"image/wflap2.png\">';
					} else if(command[1] == '3') {
						commandImage += '<img class=\"inter-img\" src=\"image/wflap3.png\">';
					} else if(command[1] == '4') {
						commandImage += '<img class=\"inter-img\" src=\"image/wflap4.png\">';
					} else if(command[1] == 'swing') {
						commandImage += '<img class=\"inter-img\" src=\"image/wflap7.png\">';
					}
				}
				else if(command[0] == 'mode') {
					if(command[1] == 'heat') {
						commandImage += '<img class=\"inter-img\" src=\"image/heat.png\">';
					} else if(command[1] == 'cool') {
						commandImage += '<img class=\"inter-img\" src=\"image/cool.png\">';
					} else if(command[1] == 'dry') {
						commandImage += '<img class=\"inter-img\" src=\"image/dry.png\">';
					} else if(command[1] == 'fan') {
						commandImage += '<img class=\"inter-img\" src=\"image/fan.png\">';
					}
				}
				else if(command[0] == 'lock') {
					if(command[1] == 'on') {
						commandImage += '<img class=\"inter-img\" src=\"image/lock.png\">';
					} else if(command[1] == 'off') {
						commandImage += '<img class=\"inter-img\" src=\"image/open.png\">';
					}
				}
				else if(command[0] == 'updown') {
					if(command[1] == 'on') {
						commandImage += '<img class=\"inter-img\" src=\"image/roleup.png\">';
					} else if(command[1] == 'off') {
						commandImage += '<img class=\"inter-img\" src=\"image/roledown.png\">';
					}
				}
				else if(command[0] == 'av') {
					commandImage += "<span class=\"inter-val\">"+command[1]+"</span><span class=\"inter-unit\">%</span>";
				}
			}
			$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').append("<tr id="+commandMP+"><td style='width: 170px;'>"+POINT_LIST[commandMP].info.name+"</td><td>"+commandImage+"</td></tr>");
		} else if(INTERLOCK_LIST[commandMP] != null) {
			if(commands['interlock'] == true) commandImage = getString('enable');
			else commandImage = getString('disable'); 
			$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').append("<tr id="+commandMP+"><td style='width: 170px;'>"+INTERLOCK_LIST[commandMP].name+"</td><td>"+commandImage+"</td></tr>");
		}
		
		if (x != SCENES_SEL.output.length - 1) {		//avoid displaying this delay line on the last line
			if (SCENES_SEL.delay2 != 0){				//Display second delay in list of commands
				$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').append("<tr id='delay'><td>Next delay(sec): </td><td>"+SCENES_SEL.delay2+"</td></tr>");
			}
		}
	}
	$('#system .scenes #scenes-prog-content #scenes-commands .multi-col-list').append("<tr id=\"+\"><td style=\"padding-left: 135px;\">+</td></tr>");	
	
	$('#system .scenes #scenes-prog-content #scenes-commands tbody').sortable();
}

function resetScenesOutput() {
	//populate management point drop down list
	$('#system .scenes #command-set #management-point').html('');
	for(var i in POINT_ID_LIST) {
		$('#system .scenes #command-set #management-point').append("<option value="+POINT_ID_LIST[i]+">"+POINT_LIST[POINT_ID_LIST[i]].info.name+"</option>");
	}
	for(var i in INTERLOCK_LIST) {
		$('#system .scenes #command-set #management-point').append("<option value="+i+">"+getString('interlock')+' - '+INTERLOCK_LIST[i].name+"</option>");
	}
	
	//to populate setpoint drop down.
	var range = [];
	for(var t = 32; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#system .scenes #command-set #sp',range);
	
	
	$('#system .scenes #command-set .an-action #stat-btn').attr('src','image/power-gray.png'); //reset stat
	$('#system .scenes #command-set .an-action #stat-btn').attr('stat','off');
	
	$('#system .scenes #command-set #sp .selectable-input .current-val').text('22.0');	//reset setpoint value
	$('#system .scenes #command-set #sp').find('#r220').addClass('selected');			//set preselection to 22.0c
	
	$('#system .scenes #command-set .an-action #fanstep-btn').attr('src','image/fanstep3-1.png'); //reset fanstep
	$('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep','L');
	
	$('#system .scenes #command-set .an-action #flap-btn').attr('src','image/wflap7.png'); //reset flap
	$('#system .scenes #command-set .an-action #flap-btn').attr('flap','swing')
	
	
	$('#system .scenes #command-set .an-action #mode-btn').attr('src','image/cool.png'); //reset mode
	$('#system .scenes #command-set .an-action #mode-btn').attr('mode','cool');
	
	$('#system .scenes #command-set .an-action #lock-btn').attr('src','image/lock.png');	//reset keylock
	$('#system .scenes #command-set .an-action #lock-btn').attr('lock','on');
	
	$('#system .scenes #command-set .an-action #shutter-btn').attr('src','image/roleup.png'); //reset roller shutter
	$('#system .scenes #command-set .an-action #shutter-btn').attr('updown','on');
	
	//to populate brightness drop down.
	var element = $('#system .scenes #command-set #brightness').find('.selectable-input ul');
	$(element).html('');
	for(var i = 0; i <= 100; i++) {
		$(element).append('<li id=r'+i+'>'+i+'</li>');
	}
	
	$('#system .scenes #command-set #brightness .selectable-input .current-val').text('100');		//reset brightness value to 100%
	$('#system .scenes #command-set #brightness .selectable-input .popup-list').find('#r100').addClass('selected');			//set preselection to 100%

	$('#system .scenes #command-set .an-action#stat .check').removeClass('checked');	//reset check mark
	$('#system .scenes #command-set .an-action#sp .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#fanstep .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#flap .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#mode .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#lock .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#updown .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#brightness .check').removeClass('checked');
	
	$('#system .scenes #command-set .an-action#interlock .check').removeClass('checked');
	$('#system .scenes #command-set .an-action#interlock').attr('val',false);
	$('#system .scenes #command-set .an-action#interlock .disable').removeClass('hide');
	$('#system .scenes #command-set .an-action#interlock .enable').addClass('hide');

	$('#system .scenes #command-set #delete').show();
}

function displayScenesOutput(selected_output) {
	$('#system .scenes #command-set #management-point').attr('oldname', selected_output);
	
	if(selected_output == '+') {
		$('#system .scenes #command-set #delete').hide();
	} else if(POINT_LIST[selected_output] != null) {
		$('#system .scenes #command-set #management-point').val(selected_output);
		
		for(var x in SCENES_SEL.output){		
			if(SCENES_SEL.output[x].id == selected_output) {
		
				var outputCommands = SCENES_SEL.output[x].command;
				
				for(var i in outputCommands) {	
					//first get selected command and display check mark and value
					var command = [];
					command[0] = i; 
					command[1] = outputCommands[i];
		
					//add check mark to selected value START
					if (command[0] == 'av') {
						command[0] = 'brightness';
					}
					var target = $('#system .scenes #command-set .an-action#'+command[0]+' .check');
					$(target).addClass('checked');
					//add check mark to selected value END	
		
					//populate image according to selected value START
					if(command[0] == 'stat') {
						if(command[1] == 'on') {
							$('#system .scenes #command-set .an-action #stat-btn').attr('src','image/power-green.png');
							$('#system .scenes #command-set .an-action #stat-btn').attr('stat','on');
						} else if(command[1] == 'off') {
							$('#system .scenes #command-set .an-action #stat-btn').attr('src','image/power-gray.png');
							$('#system .scenes #command-set .an-action #stat-btn').attr('stat','off');
						} else if(command[1] == 'error') {
							$('#system .scenes #command-set .an-action #stat-btn').attr('src','image/power-red.png');
							$('#system .scenes #command-set .an-action #stat-btn').attr('stat','error');
						}
					}
					else if(command[0] == 'sp') {
						$('#system .scenes #command-set #sp .selectable-input .current-val').text(command[1]);
						$('#system .scenes #command-set #sp').find('#r'+command[1]*10).addClass('selected');
					}
					else if(command[0] == 'fanstep') {
						if(command[1] == 'L') {
							$('#system .scenes #command-set .an-action #fanstep-btn').attr('src','image/fanstep3-1.png');
							$('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep','L');
						}
						else if(command[1] == 'M') {
							$('#system .scenes #command-set .an-action #fanstep-btn').attr('src','image/fanstep3-3.png');
							$('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep','M')
						}
						else {
							$('#system .scenes #command-set .an-action #fanstep-btn').attr('src','image/fanstep3-5.png');
							$('#system .scenes #command-set .an-action #fanstep-btn').attr('fanstep','H')
						}
					}
					else if(command[0] == 'flap') {
						var val;
						if(command[1] == 'swing') val = 7;
						else val = command[1];
						$('#system .scenes #command-set .an-action #flap-btn').attr('src',"image/wflap"+val+".png");
						$('#system .scenes #command-set .an-action #flap-btn').attr('flap',command[1])
					}
					else if(command[0] == 'mode') {
						if(command[1] == 'heat') {
							$('#system .scenes #command-set .an-action #mode-btn').attr('src','image/heat.png');
							$('#system .scenes #command-set .an-action #mode-btn').attr('mode','heat');
						} else if(command[1] == 'cool') {
							$('#system .scenes #command-set .an-action #mode-btn').attr('src','image/cool.png');
							$('#system .scenes #command-set .an-action #mode-btn').attr('mode','cool');
						} else if(command[1] == 'dry') {
							$('#system .scenes #command-set .an-action #mode-btn').attr('src','image/dry.png');
							$('#system .scenes #command-set .an-action #mode-btn').attr('mode','dry');
						} else if(command[1] == 'fan') {
							$('#system .scenes #command-set .an-action #mode-btn').attr('src','image/fan.png');
							$('#system .scenes #command-set .an-action #mode-btn').attr('mode','fan');
						}
					}
					else if(command[0] == 'lock') {
						if(command[1] == 'on') {
							$('#system .scenes #command-set .an-action #lock-btn').attr('src','image/lock.png');
							$('#system .scenes #command-set .an-action #lock-btn').attr('lock','on');
						} else if(command[1] == 'off') {
							$('#system .scenes #command-set .an-action #lock-btn').attr('src','image/open.png');
							$('#system .scenes #command-set .an-action #lock-btn').attr('lock','off');
						}
					}
					else if(command[0] == 'updown') {
						if(command[1] == 'on') {
							$('#system .scenes #command-set .an-action #shutter-btn').attr('src','image/roleup.png');
							$('#system .scenes #command-set .an-action #shutter-btn').attr('updown','on');
						} else if(command[1] == 'off') {
							$('#system .scenes #command-set .an-action #shutter-btn').attr('src','image/roledown.png');
							$('#system .scenes #command-set .an-action #shutter-btn').attr('updown','off');
						}
					}
					else if(command[0] == 'brightness') {
						$('#system .scenes #command-set #brightness .selectable-input .current-val').text(command[1]);		//reset brightness value to 100%
						$('#system .scenes #command-set #brightness .selectable-input .popup-list').find('#r'+command[1]).addClass('selected');
					}
					//populate image according to selected value END
				}
			}
		}
	} else if(INTERLOCK_LIST[selected_output] != null) {
		$('#system .scenes #command-set #management-point').val(selected_output);
		var target = $('#system .scenes #command-set .an-action#interlock .check');
		$(target).addClass('checked');

		if(INTERLOCK_LIST[selected_output].enable == true || INTERLOCK_LIST[selected_output].enable == 'true') {
				$('#system .scenes #command-set .an-action#interlock').attr('val',true);
				$('#system .scenes #command-set .an-action#interlock .disable').addClass('hide');
				$('#system .scenes #command-set .an-action#interlock .enable').removeClass('hide');
		} else {
				$('#system .scenes #command-set .an-action#interlock').attr('val',false);
				$('#system .scenes #command-set .an-action#interlock .disable').removeClass('hide');
				$('#system .scenes #command-set .an-action#interlock .enable').addClass('hide');
		}
	}
}