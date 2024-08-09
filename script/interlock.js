
var INTERLOCK_PROG = {};	// all schedule programs under editing

var	INTERLOCK_LIST = {};
	

$(document).on('page_before_show','.screen#interlock',function(e) {
	// initialize interlock dialogs 
	getInterlock();
	getScenes();		//needed to run scenes in interlock
});

//interlock start
$(document).on('click','#interlock #interlock-prog-list li',function(e) {
	if($('#interlock #interlock-prog-list').attr('reject') == 'true') return;

	var id = $(this).attr('id');
	
	if(id == '+') { // add new program
		$(this).removeClass('selected');
		$('#interlock #interlock-prog-content #delete').hide();
	} else {
		$('#interlock #interlock-prog-content #delete').show();
	}
	//initialize TARGET and INTERLOCK_LIST in this method
	
	setIProgScreen(id);
	
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').show();
});

$(document).on('click','#interlock #interlock-prog-content #save',function(e) {
	if($('#interlock #interlock-prog-content').attr('reject') == 'true') return;

	var id = $('#interlock #interlock-prog-content').attr('ident');
	var newName = $('#interlock #interlock-prog-content input').val();
	var enable = $('#interlock #interlock-prog-content .slide .disable').hasClass('hide');
	var timer1 = $('#interlock #interlock-prog-content .timer1 input').val();
	var timer2 = $('#interlock #interlock-prog-content .timer2 input').val();
	
	// set interlock contents to INTERLOCK_SEL and send to server
	
	if(newName.length == 0) {
		alert(getString('no_prog_name'));	// please input interlock name
		return;
	}
	
	if(timer1 == '') timer1 = 0;
	if(timer2 == '') timer2 = 0;
	
	INTERLOCK_SEL.enable = enable;
	INTERLOCK_SEL.timer1 = timer1;
	INTERLOCK_SEL.timer2 = timer2;
	INTERLOCK_SEL.name = newName;
	
	INTERLOCK_SEL.output1.condition = $('#interlock #interlock-prog-content .output1-condition #output1-condition').val();
	INTERLOCK_SEL.output2.condition = $('#interlock #interlock-prog-content .output2-condition #output2-condition').val();	
	
	if(id == null || id == '') { // add new interlock that did not exist.
		if(addInterlock(newName) == false) {	// fail to add new interlock
			alert(getString('same_name'));	// this name already exist
			return;
		}
	} else {
		saveInterlock(id,newName);		//save modified interlock if oldName and newName are the same
	}
	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('interlock_screen.html');
});

$(document).on('click','#interlock #interlock-prog-content #cancel',function(e) {
	if($('#interlock #interlock-prog-content').attr('reject') == 'true') return;
	//redraw and load screen 	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('interlock_screen.html');
});

$(document).on('click','#interlock #interlock-prog-content #delete',function(e) {
	if($('#interlock #interlock-prog-content').attr('reject') == 'true') return;
	
	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?
	
	var id = $('#interlock #interlock-prog-content').attr('ident');
	
	if(id != null && id != "") {
		deleteInterlock(id);
	}	
	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('interlock_screen.html');
});

$(document).on('click','#interlock #interlock-prog-content #inter-input .multi-col-list tr',function(e) {
	$(this).removeClass('selected');
	if($('#interlock #interlock-prog-content').attr('reject') == 'true') return;
	var selected_input = $(this).attr('id');
	
	//populate management point drop down list
	$('#interlock #input-set #input-point').html('');
	for(var i in POINT_ID_LIST) {
		$('#interlock #input-set #input-point').append("<option value="+POINT_ID_LIST[i]+">"+POINT_LIST[POINT_ID_LIST[i]].info.name+"</option>");
	}
	
	//to populate Temperature drop down.
	var range = [];
	for(var t = 38; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#interlock #input-set #temp',range);
	
	resetInput();
		
	displaySelectedInput(selected_input);
	
	checkInterlockInputType(selected_input);
		
	$('#interlock #input-set').show();
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',true);
});

$(document).on('change','#interlock #input-set .button-area #input-point',function(e) {
	var selected_input = $('#interlock #input-set .button-area #input-point').val();
	
	resetInput();
	checkInterlockInputType(selected_input);
	
	var oldName = $('#interlock #input-set .button-area #input-point').attr('oldname');
	if (oldName == '+') $('#interlock #input-set .button-area #delete').hide();
});	

$(document).on('click','#interlock #input-set .an-action #stat-btn',function(e) {
	var val = $('#interlock #input-set .an-action #stat-btn').attr('stat');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#interlock #input-set .an-action #stat-btn').attr('src','image/power-green.png');
		$('#interlock #input-set .an-action #stat-btn').attr('stat','on');
	} else {
		$('#interlock #input-set .an-action #stat-btn').attr('src','image/power-gray.png');
		$('#interlock #input-set .an-action #stat-btn').attr('stat','off');
	}
});

$(document).on('click','#interlock #input-set .an-action #mode-btn',function(e) {
	var mode = $('#interlock #input-set .an-action #mode-btn').attr('mode');
	if(mode == 'cool') mode = 'heat';
	else if(mode == 'heat') mode = 'fan';
	else if(mode == 'fan') mode = 'dry';
	else mode = 'cool';
	
	$('#interlock #input-set .an-action #mode-btn').attr('src','image/'+mode+'.png');
	$('#interlock #input-set .an-action #mode-btn').attr('mode',mode);
});

$(document).on('change','#interlock #input-set .an-action .temp-condition select',function(e) {
	var condition = $('#interlock #input-set .an-action .temp-condition select').val();
	$('#interlock #input-set .an-action#temp #allTemp').html('');
	
	if(condition == 'to') {
		$('#interlock #input-set .an-action#temp #lowerLimit').show();
		$('#interlock #input-set .an-action#temp #allTemp').html('&deg;C');
	} else {
		$('#interlock #input-set .an-action#temp #lowerLimit').hide();
		$('#interlock #input-set .an-action#temp #allTemp').html('<span class="mls" param="room_temp">Room Temperature</span>');
	}
});

$(document).on('change','#interlock #input-set .an-action .av-condition select',function(e) {
	var condition = $('#interlock #input-set .an-action .av-condition select').val();
	
	if(condition == 'to') {
		$('#interlock #input-set .an-action#brightness #lowerAV').show();
		$('#interlock #input-set .an-action#brightness #percent').show();
	} else {
		$('#interlock #input-set .an-action#brightness #lowerAV').hide();
		$('#interlock #input-set .an-action#brightness #percent').hide();
	}
});

$(document).on('click','#interlock #input-set .an-action #lock-btn',function(e) {
	var val = $('#interlock #input-set .an-action #lock-btn').attr('lock');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#interlock #input-set .an-action #lock-btn').attr('src','image/lock.png');
		$('#interlock #input-set .an-action #lock-btn').attr('lock','on');
	} else {
		$('#interlock #input-set .an-action #lock-btn').attr('src','image/open.png');
		$('#interlock #input-set .an-action #lock-btn').attr('lock','off');
	}
});

$(document).on('click','#interlock #input-set .an-action #shutter-btn',function(e) {
	var val = $('#interlock #input-set .an-action #shutter-btn').attr('updown');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#interlock #input-set .an-action #shutter-btn').attr('src','image/roleup.png');
		$('#interlock #input-set .an-action #shutter-btn').attr('updown','on');
	} else {
		$('#interlock #input-set .an-action #shutter-btn').attr('src','image/roledown.png');
		$('#interlock #input-set .an-action #shutter-btn').attr('updown','off');
	}
});
	
$(document).on('click','#interlock #interlock-prog-content #inter-output1 .multi-col-list tr',function(e) {
	$(this).removeClass('selected');
	if($('#interlock #interlock-prog-content').attr('reject') == 'true') return;
	
	var selected_input = $(this).attr('id');
	
	$('#interlock #output-set #output-point').attr('oldname',selected_input);
	$('#interlock #output-set #output-point').attr('type','output1');
	
	//populate management point drop down list with management pointSceneSelect
	$('#interlock #output-set #output-point').html('');
	for(var i in POINT_ID_LIST) {
		$('#interlock #output-set #output-point').append("<option value="+POINT_ID_LIST[i]+">"+POINT_LIST[POINT_ID_LIST[i]].info.name+"</option>");
	}
	
	//populate management point drop down list with scenes
	
	if(SCENES_LIST != null) {		//if first SCENE_LIST object is not empty
		for(var id in SCENES_LIST) {
			var sceneName = 'Scene - ' + SCENES_LIST[id].name;
			$('#interlock #output-set #output-point').append("<option value="+id+">"+sceneName+"</option>");
		}
	}
	
	//to populate setpoint drop down.
	var range = [];
	for(var t = 32; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#interlock #output-set #sp',range);
	
	resetOutput();
	
	displaySelectedOutput1(selected_input);
	
	pointSceneSelect(selected_input);

	$('#interlock #output-set').show();
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',true);
});

$(document).on('click','#interlock #interlock-prog-content #inter-output2 .multi-col-list tr',function(e) {
	$(this).removeClass('selected');
	if($('#interlock #interlock-prog-content').attr('reject') == 'true') return;
	
	var selected_input = $(this).attr('id');
	
	$('#interlock #output-set #output-point').attr('oldname',selected_input);
	$('#interlock #output-set #output-point').attr('type','output2');
	
	//populate management point drop down list with management pointSceneSelect
	$('#interlock #output-set #output-point').html('');
	for(var i in POINT_ID_LIST) {
		$('#interlock #output-set #output-point').append("<option value="+POINT_ID_LIST[i]+">"+POINT_LIST[POINT_ID_LIST[i]].info.name+"</option>");
	}
	
	//populate management point drop down list with scenes
	
	if (SCENES_LIST != null) {		//if first SCENE_LIST object is not empty
		for(var id in SCENES_LIST) {
			var sceneName = 'Scene - ' + SCENES_LIST[id].name;
			$('#interlock #output-set #output-point').append("<option value="+id+">"+sceneName+"</option>");
		}
	}
	
	//to populate setpoint drop down.
	var range = [];
	for(var t = 32; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#interlock #output-set #sp',range);
	
	resetOutput();
	
	displaySelectedOutput2(selected_input);
	
	pointSceneSelect(selected_input);
	
	$('#interlock #output-set').show();
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',true);
});

$(document).on('change','#interlock #output-set .button-area #output-point',function(e) {
	var selected_input = $('#interlock #output-set .button-area #output-point').val();
	var type = $('#interlock #output-set .button-area #output-point').attr('type');

	resetOutput();
	
	pointSceneSelect(selected_input);
	
	var oldName = $('#interlock #output-set .button-area #output-point').attr('oldname');
	if (oldName == '+') $('#interlock #output-set #delete').hide();
});	

$(document).on('click','#interlock #output-set .an-action #stat-btn',function(e) {
	var val = $('#interlock #output-set .an-action #stat-btn').attr('stat');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-green.png');
		$('#interlock #output-set .an-action #stat-btn').attr('stat','on');
	} else {
		$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-gray.png');
		$('#interlock #output-set .an-action #stat-btn').attr('stat','off');
	}
});

$(document).on('click','#interlock #output-set .an-action #mode-btn',function(e) {
	var mode = $('#interlock #output-set .an-action #mode-btn').attr('mode');
	if(mode == 'cool') mode = 'heat';
	else if(mode == 'heat') mode = 'fan';
	else if(mode == 'fan') mode = 'dry';
	else mode = 'cool';
	
	$('#interlock #output-set .an-action #mode-btn').attr('src','image/'+mode+'.png');
	$('#interlock #output-set .an-action #mode-btn').attr('mode',mode);
});

$(document).on('click','#interlock #output-set .an-action #fanstep-btn',function(e) {
	var step = $('#interlock #output-set .an-action #fanstep-btn').attr('fanstep');
	
	if(step == 'L') step = 'M';
	else if(step == 'M') step = 'H';
	else step = 'L';
	
	$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep',step);
	var val;
	if(step == 'L') val = 1;
	else if(step == 'M') val = 3;
	else if(step == 'H') val = 5;
	else val = 3;
	$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-'+val+'.png');
});

$(document).on('click','#interlock #output-set .an-action #flap-btn',function(e) {
	var flap = $('#interlock #output-set .an-action #flap-btn').attr('flap');
	if(flap == 'swing') flap = 4;
	else {
		flap = parseInt(flap)-1;
		if(flap < 0) flap = 'swing';
	}
	
	if(flap == 'swing') flap = 7;
	$('#interlock #output-set .an-action #flap-btn').attr('src','image/wflap'+flap+'.png');
	if(flap == 7) flap = 'swing';
	$('#interlock #output-set .an-action #flap-btn').attr('flap',flap);
});

$(document).on('click','#interlock #output-set .an-action #lock-btn',function(e) {
	var val = $('#interlock #output-set .an-action #lock-btn').attr('lock');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#interlock #output-set .an-action #lock-btn').attr('src','image/lock.png');
		$('#interlock #output-set .an-action #lock-btn').attr('lock','on');
	} else {
		$('#interlock #output-set .an-action #lock-btn').attr('src','image/open.png');
		$('#interlock #output-set .an-action #lock-btn').attr('lock','off');
	}
});

$(document).on('click','#interlock #output-set .an-action #shutter-btn',function(e) {
	var val = $('#interlock #output-set .an-action #shutter-btn').attr('updown');
	
	if(val == 'on') val = 'off';
	else val = 'on';
	
	if(val == 'on') {
		$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roleup.png');
		$('#interlock #output-set .an-action #shutter-btn').attr('updown','on');
	} else {
		$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roledown.png');
		$('#interlock #output-set .an-action #shutter-btn').attr('updown','off');
	}
});

$(document).on('click','#interlock #input-set #delete',function(e) {	
	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?
	
	var oldName = $('#interlock #input-set #input-point').attr('oldname');
	
	if(oldName != null && oldName.length > 0) {
		for(var x in INTERLOCK_SEL.input){
			if(INTERLOCK_SEL.input[x].id == oldName) {
				INTERLOCK_SEL.input.splice(x, 1);
			}
		}
	}
	
	prog_name = INTERLOCK_SEL.name;
	
	populateInput();
	
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',false);
	$('#interlock #input-set').hide();
});

$(document).on('click','#interlock #output-set #delete',function(e) {		
	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?
	
	var oldName = decodeURI($('#interlock #output-set #output-point').attr('oldname'));
	var type = $('#interlock #output-set #output-point').attr('type');
	
	if(oldName != null && oldName.length > 0) {
		for(var x in INTERLOCK_SEL[type].controls){
			if(INTERLOCK_SEL[type].controls[x].id == oldName) {
				INTERLOCK_SEL[type].controls.splice(x, 1);
			}
		}
	}
	
	prog_name = INTERLOCK_SEL.name;
	
	populateOutput1();
	populateOutput2();	
	
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',false);
	$('#interlock #output-set').hide();
});	
	
$(document).on('click','#interlock #input-set #set',function(e) {
	var oldName = $('#interlock #input-set #input-point').attr('oldname');
	
	var managementPoint = $('#interlock #input-set #input-point').val();
	var selectedKey = $('#interlock #input-set #action .an-action .checked');
	
	var condition = {};
	
	for(var i = 0; i < selectedKey.length; i++) {
		var command = $(selectedKey[i]).parent().attr('id');
		
		if(command == 'error') {
			var val = $('#interlock #input-set #action #error .disable').hasClass('hide');
		} else if(command == 'alarm') {
			var val = $('#interlock #input-set #action #alarm .disable').hasClass('hide');
		} else if(command == 'stat') {
			var val = $('#interlock #input-set #action .an-action #stat-btn').attr('stat');
		} else if(command == 'temp') {
			var tempCondition = $('#interlock #input-set #temp .temp-condition #temp-condition').val();
			var lowerLimit = $('#interlock #input-set #temp .selectable-input #lowerLimit').text();
			var higherLimit = $('#interlock #input-set #temp .selectable-input #higherLimit').text();
			
			if(tempCondition == 'to'){
				var val = lowerLimit + 'to' + higherLimit;
				
				if(lowerLimit >= higherLimit) {
					alert(getString('chk_temp_range'));		//to check higherLimit is not lower to or equals to lowerLimit
					return;
				}
			} else if(tempCondition == '<') {
				var val = '<' + higherLimit;
			} else if(tempCondition == '>') {
				var val = '>' + higherLimit;
			}
		} else if(command == 'mode')  {
			var val = $('#interlock #input-set #action .an-action #mode-btn').attr('mode');
		} else if(command == 'lock')  {
			var val = $('#interlock #input-set #action .an-action #lock-btn').attr('lock');
		} else if(command == 'updown')  {
			var val = $('#interlock #input-set #action .an-action #shutter-btn').attr('updown');
		} else if(command == 'brightness')  {
			//var val = $('#interlock #input-set #brightness .selectable-input .current-val').text();
			
			//command = 'av';
			var avCondition = $('#interlock #input-set #brightness .av-condition #av-condition').val();
			var lowerAV = Number($('#interlock #input-set #brightness .av-input #lowerAV').val());
			var higherAV = Number($('#interlock #input-set #brightness .av-input #higherAV').val());
			
			if(Number.isNaN(lowerAV) == true || Number.isNaN(higherAV) == true) {
				alert(getString('enter_number'));
				return;
			}
			
			if(avCondition == 'to'){
				if(lowerAV >= higherAV) {
					alert(getString('chk_val_range'));		//to check higherAV is not lower to or equals to lowerAV
					return;
				}
				
				var val = lowerAV + 'to' + higherAV;
			} else if(avCondition == '<') {
				var val = '<' + higherAV;
			} else if(avCondition == '>') {
				var val = '>' + higherAV;
			}
			
			command = 'av';
		}
		
		condition[command] = val;
	}
	
	if($.isEmptyObject(condition)) {
		alert(getString("sel_com"));
		return;
	}
		
	//for new input set START
	if(oldName == '+') {
		
		for(var x in INTERLOCK_SEL.input){
			if(INTERLOCK_SEL.input[x].id == managementPoint) {
				alert(getString('regitered'));
				return;
			}
		}
		
		INTERLOCK_SEL.input.push({
			"id" : managementPoint,
			"detectCondition" : condition
		});
		
	} else {
		
		if(oldName != null && oldName.length > 0) {
			//if managementPoint changed, check if already exist
			if(managementPoint != oldName) {
				for(var x in INTERLOCK_SEL.input){
					if(INTERLOCK_SEL.input[x].id == managementPoint) {
						alert(getString('registered'));
						return;
					}
				}
			}
			
			for(var x in INTERLOCK_SEL.input){
				if(INTERLOCK_SEL.input[x].id == oldName) {
					INTERLOCK_SEL.input[x].id = managementPoint;
					INTERLOCK_SEL.input[x].detectCondition = condition;				
				}
			}
		}
	}
	
	populateInput();
	
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',false);
	$('#interlock #input-set').hide();
});

$(document).on('click','#interlock #output-set #set',function(e) {	
	var oldName = $('#interlock #output-set #output-point').attr('oldname');
	var type = $('#interlock #output-set #output-point').attr('type');
	
	var id = $('#interlock #output-set #output-point').val();
	var selectedKey = $('#interlock #output-set #action .an-action .checked');
		
	var controlsCommand = {};	
		
	for(var i = 0; i < selectedKey.length; i++) {
		var command = $(selectedKey[i]).parent().attr('id');
		
		if(command == 'stat') {
			var val = $('#interlock #output-set #action .an-action #stat-btn').attr('stat');
		} else if(command == 'sp') {
			var val = $('#interlock #output-set #sp .selectable-input .current-val').text();
		} else if(command == 'fanstep') {
			var val = $('#interlock #output-set #action .an-action #fanstep-btn').attr('fanstep');
		} else if(command == 'flap') {
			var val = $('#interlock #output-set #action .an-action #flap-btn').attr('flap');
		} else if(command == 'mode')  {
			var val = $('#interlock #output-set #action .an-action #mode-btn').attr('mode');
		} else if(command == 'lock')  {
			var val = $('#interlock #output-set #action .an-action #lock-btn').attr('lock');
		} else if(command == 'updown')  {
			var val = $('#interlock #output-set #action .an-action #shutter-btn').attr('updown');
		} else if(command == 'brightness')  {
			var val = $('#interlock #output-set #brightness .selectable-input .current-val').text();
			
			command = 'av';
		}
		
		controlsCommand[command] = val;
	}
	
	//check if managementPoint is scene, if yes, controlsCommand = scene
	if (SCENES_LIST[id] != null) {
		controlsCommand['scene'] = id;
	} else {
		if($.isEmptyObject(controlsCommand)) {
			alert(getString("sel_com"));
			return;
		}
	}
		
	//for new output set START
	if(oldName == '+') {
		for(var x in INTERLOCK_SEL[type].controls){
			if(INTERLOCK_SEL[type].controls[x].id == id) {
				alert(getString('registered'));
				return;
			}
		}
		
		INTERLOCK_SEL[type].controls.push({
			"id" : id,
			"command" : controlsCommand
		});
	} else {	
		
		if(oldName != null && oldName.length > 0) {
			//if managementPoint changed, check if already exist
			if(id != oldName) {
				for(var x in INTERLOCK_SEL[type].controls){
					if(INTERLOCK_SEL[type].controls[x].id == id) {
						alert(getString('registered'));
						return;
					}
				}
			}
			
			for(var x in INTERLOCK_SEL[type].controls){
				if(INTERLOCK_SEL[type].controls[x].id == oldName) {
					INTERLOCK_SEL[type].controls[x].id = id;
					INTERLOCK_SEL[type].controls[x].command = controlsCommand;
				}
			}
		}
	}
	
	populateOutput1();
	populateOutput2();
	
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',false);
	$('#interlock #output-set').hide();
});

$(document).on('click','#interlock #input-set #cancel',function(e) {
	$('#interlock #input-set').hide();
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',false);
});

$(document).on('click','#interlock #output-set #cancel',function(e) {
	$('#interlock #output-set').hide();
	$('#interlock #interlock-prog-list').attr('reject',true);
	$('#interlock #interlock-prog-content').attr('reject',false);
});

//get saved interlock from server
function getInterlock() {
	var command = ['get_interlock'];
	COMM_PORT.send(command);
	return true;
}	

// add brand new interlock
// if same name is already exist return false
function addInterlock(name) {
	for(var i in INTERLOCK_LIST) {
		if(INTERLOCK_LIST[i].name == name) {
			return false;
		}
	}

	var command = ['add_new_interlock',name,INTERLOCK_SEL];
	//console.log(command);
	COMM_PORT.send(command);

	return true;
}

// modify program name

// delete program
function deleteInterlock(id) {
	if(INTERLOCK_LIST[id] == null) return false;

	var command = ['delete_interlock',id];
	console.log(command);
	COMM_PORT.send(command);
	return true;
}
// set schedule program to specified program name
function saveInterlock(id,newName) {
	var command = ['save_interlock',id,INTERLOCK_SEL];
	//console.log(command);
	COMM_PORT.send(command);

	return true;
}

// schedule screen control functions
function setIProgramList() {
	//start of startProgramList
	$('#interlock #interlock-prog-list .list').html('');
	for(var i in INTERLOCK_LIST) {
		var check = '';
		if(INTERLOCK_LIST[i].enable == true || INTERLOCK_LIST[i].enable == 'true') check = "class='checked'";
		$('#interlock #interlock-prog-list .list').append("<li id="+i+" "+check+"><img src='image/check-g.png'><span>"+INTERLOCK_LIST[i].name+"</span></li>");
	}
	$('#interlock #interlock-prog-list .list').append("<li id='+' class='add'>+</li>");
	//end of startProgramList
}

// program screen data setup
function setIProgScreen(id) {
	//reset screen first
	// set to disable
	$('#interlock #interlock-prog-content .slide .disable').removeClass('hide');
	$('#interlock #interlock-prog-content .slide .enable').addClass('hide');
	
	//clear condition
	$('#interlock #interlock-prog-content #output1-condition').val('notDetected');
	$('#interlock #interlock-prog-content #output2-condition').val('notDetected');
	
	if(id == '+') {
		$('#interlock #interlock-prog-content input').val('');
		$('#interlock #interlock-prog-content').attr('name','');
		
		//clear timer
		$('#interlock #interlock-prog-content .timer1 input').val(0);
		$('#interlock #interlock-prog-content .timer2 input').val(0);
	
		$('#interlock #interlock-prog-content input').css('placeholder',getString('new_interlock'));
		$('#interlock #interlock-prog-content input').attr('placeholder',getString('new_interlock'))
		
		$('#interlock #interlock-prog-content #inter-input .multi-col-list').html('');
		$('#interlock #interlock-prog-content #inter-output1 .multi-col-list').html('');
		$('#interlock #interlock-prog-content #inter-output2 .multi-col-list').html('');
		
		$('#interlock #interlock-prog-content #inter-input .multi-col-list').append("<tr id=\"+\"><td style=\"padding: 0 0 0 150px;\">+</td></tr>");
		$('#interlock #interlock-prog-content #inter-output1 .multi-col-list').append("<tr id=\"+\"><td style=\"padding: 0 0 0 150px;\">+</td></tr>");
		$('#interlock #interlock-prog-content #inter-output2 .multi-col-list').append("<tr id=\"+\"><td style=\"padding: 0 0 0 150px;\">+</td></tr>");
		
		//reset INTERLOCK_SEL to blank.
		INTERLOCK_SEL = {
			"enable":	false,
			"owner"	:	USER,
			"name"	:	"",
			"timer1"	:	"0",
			"timer2"	:	"0",
			"input"	:	[],
			"output1" :	{
				"condition"	:	"notDetected",
				"controls"	:	[]
			},
			"output2" :	{
				"condition"	:	"notDetected",
				"controls"	:	[]
			}
		};
		
		return;
	} else {
		$('#interlock #interlock-prog-content input').val(INTERLOCK_LIST[id].name);
		$('#interlock #interlock-prog-content').attr('ident',id);
	}

	INTERLOCK_SEL = INTERLOCK_LIST[id];
	
	var enable = INTERLOCK_SEL.enable;
	
	// enable/disable switch
	if(enable == true || enable == 'true') {
		$('#interlock #interlock-prog-content .slide .disable').addClass('hide');
		$('#interlock #interlock-prog-content .slide .enable').removeClass('hide');
	} else {
		$('#interlock #interlock-prog-content .slide .disable').removeClass('hide');
		$('#interlock #interlock-prog-content .slide .enable').addClass('hide');
	}	
	
	//set timer value
	$('#interlock #interlock-prog-content .timer1 input').val(INTERLOCK_SEL.timer1);
	$('#interlock #interlock-prog-content .timer2 input').val(INTERLOCK_SEL.timer2);
	
	populateInput();
	populateOutput1();
	populateOutput2();	
}

function resetInput() {
	$('#interlock #input-set #error .slide .disable').removeClass('hide');		//reset error slide
	$('#interlock #input-set #error .slide .enable').addClass('hide');
	
	$('#interlock #input-set #alarm .slide .disable').removeClass('hide');		//reset alarm slide
	$('#interlock #input-set #alarm .slide .enable').addClass('hide');
	
	$('#interlock #input-set #temp .selectable-input #lowerLimit').text('22.0');	//reset temperature value
	$('#interlock #input-set #temp').find('#r220').addClass('selected');
	
	$('#interlock #input-set #temp .selectable-input #higherLimit').text('24.0');
	
	$('#interlock #input-set #temp .temp-condition #temp-condition').val('to');
	$('#interlock #input-set .an-action#temp #lowerLimit').show();
	$('#interlock #input-set .an-action#temp #allTemp').html('&deg;C');
	
	$('#interlock #input-set .an-action #stat-btn').attr('src','image/power-gray.png'); //reset stat
	$('#interlock #input-set .an-action #stat-btn').attr('stat','off');
	
	$('#interlock #input-set .an-action #mode-btn').attr('src','image/cool.png'); //reset mode
	$('#interlock #input-set .an-action #mode-btn').attr('mode','cool');
	
	$('#interlock #input-set .an-action #lock-btn').attr('src','image/lock.png');	//reset keylock
	$('#interlock #input-set .an-action #lock-btn').attr('lock','on');
	
	$('#interlock #input-set .an-action #shutter-btn').attr('src','image/roleup.png'); //reset roller shutter
	$('#interlock #input-set .an-action #shutter-btn').attr('updown','on');
	
	$('#interlock #input-set #brightness .av-input #lowerAV').val('0');		//reset brightness value to 100%	
	$('#interlock #input-set #brightness .av-input #higherAV').val('100');
	
	$('#interlock #input-set #brightness .av-condition #av-condition').val('to');
	$('#interlock #input-set .an-action#brightness #lowerAV').show();
	$('#interlock #input-set .an-action#brightness #percent').show();
	
	$('#interlock #input-set .an-action#error .check').removeClass('checked');	//reset check mark
	$('#interlock #input-set .an-action#alarm .check').removeClass('checked');
	$('#interlock #input-set .an-action#stat .check').removeClass('checked');
	$('#interlock #input-set .an-action#temp .check').removeClass('checked');
	$('#interlock #input-set .an-action#mode .check').removeClass('checked');
	$('#interlock #input-set .an-action#lock .check').removeClass('checked');
	$('#interlock #input-set .an-action#updown .check').removeClass('checked');
	$('#interlock #input-set .an-action#brightness .check').removeClass('checked');
	
	$('#interlock #input-set #delete').show();
	
	$('#interlock #input-set #alarm').hide();
	//$('#interlock #input-set #temp').hide();	//disable first, re-enable once issue resolved
}

function pointSceneSelect(id) {	
	$('#interlock #output-set #action').show();
	
	$('#interlock #output-set #scenes_display').hide();
	
	if (id == '+') {
		if (typeof POINT_ID_LIST !== 'undefined' && POINT_ID_LIST.length > 0) id = POINT_ID_LIST[0];
		else return;
	}
	
	$('#interlock #output-set #action #stat').hide();
	$('#interlock #output-set #action #sp').hide();
	$('#interlock #output-set #action #fanstep').hide();
	$('#interlock #output-set #action #flap').hide();
	$('#interlock #output-set #action #mode').hide();
	$('#interlock #output-set #action #lock').hide();
	$('#interlock #output-set #action #updown').hide();
	$('#interlock #output-set #action #brightness').hide();
	$('#interlock #output-set #action #brightness #brightText').show();
	$('#interlock #output-set #action #brightness #analogText').hide();
	
	if (SCENES_LIST[id] != null) {
		$('#interlock #output-set #action').hide();
		
		$('#interlock #output-set #scenes_display').show();
		
		$('#interlock #output-set #scenes_display').html('<div class="subtitle">'+SCENES_LIST[id].name+' selected</div><br>');
		
		SCENES_SEL = SCENES_LIST[id];
		
		for(var x in SCENES_SEL.output) {
			var commandMP = SCENES_SEL.output[x].id;
		
			var commands = SCENES_SEL.output[x].command;
			
			var commandImage = '';
			
			for(i in commands) {	
				var command = [];
				command[0] = i; 
				command[1] = commands[i];
				
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
					commandImage += "<span class=\"inter-val\">"+command[1]+"</span>"; //<span class=\"inter-unit\">%</span>";
				}
			}
			
			$('#interlock #output-set #scenes_display').append("<div>"+commandMP+"&nbsp;&nbsp;&nbsp;&nbsp;"+commandImage+"</div>");
		} 
	} else {
		switch(POINT_LIST[id].info.type) {							//MPoint type
			case 'Ahu':														//Air handling unit
			case 'Fcu':														//Fan coil unit
				$('#interlock #output-set #action #stat').show();
				$('#interlock #output-set #action #sp').show();
				$('#interlock #output-set #action #fanstep').show();
				$('#interlock #output-set #action #flap').show();
				$('#interlock #output-set #action #mode').show();
				break;
			case 'Dio':														//Usual on/off Switch
				$('#interlock #output-set #action #stat').show();
				break;
			case 'KeyLock':													//Keylock Open/Close
				$('#interlock #output-set #action #lock').show();	
				break;
			case 'LevelSw':													//Dimmer/Slider switch
			case 'RgbLevel':												//RGBW Switch
				$('#interlock #output-set #action #stat').show();
				$('#interlock #output-set #action #brightness').show();
				$('#interlock #output-set #action #brightness #brightText').show();
				$('#interlock #output-set #action #brightness #analogText').hide();
				break;
			case 'Shutter':													// Roller Shutter, Up and Down
				$('#interlock #output-set #action #updown').show();	//all up/ all down 						
				break;
			case 'Ao':
				$('#interlock #output-set #action #brightness').show();		
				$('#interlock #output-set #action #brightness #brightText').hide();
				$('#interlock #output-set #action #brightness #analogText').show();
				break;
			case 'Ai':														//Temp(fire), humidity, PM2.5, analog value Sensor
			case 'Di':														//Door, Window, Flood, binary Sensor
			default:														//Any other MPoint type not in list
				$('#interlock #output-set #action #stat').hide();
				$('#interlock #output-set #action #sp').hide();
				$('#interlock #output-set #action #fanstep').hide();
				$('#interlock #output-set #action #flap').hide();
				$('#interlock #output-set #action #mode').hide();
				$('#interlock #output-set #action #lock').hide();
				$('#interlock #output-set #action #updown').hide();
				$('#interlock #output-set #action #brightness').hide();
		}
	}
}

function checkInterlockInputType(selected_input) {
	if (selected_input == '+') {
		if (typeof POINT_ID_LIST !== 'undefined' && POINT_ID_LIST.length > 0) selected_input = POINT_ID_LIST[0];
		else return;
	}
	
	$('#interlock #input-set #action #stat').hide();
	$('#interlock #input-set #action #error').hide();					//Error
	$('#interlock #input-set #action #mode').hide();
	$('#interlock #input-set #action #temp').hide();					//TempRange
	$('#interlock #input-set #action #lock').hide();
	$('#interlock #input-set #action #updown').hide();
	$('#interlock #input-set #action #brightness').hide();
	$('#interlock #input-set #action #brightness #brightText').show();
	$('#interlock #input-set #action #brightness #analogText').hide();
	
	switch(POINT_LIST[selected_input].info.type) {						//MPoint type
		case 'Ahu':														//Air handling unit
		case 'Fcu':														//Fan coil unit
			$('#interlock #input-set #action #stat').show();
			$('#interlock #input-set #action #error').show();
			$('#interlock #input-set #action #mode').show();
			$('#interlock #input-set #action #temp').show();
			break;
		case 'Dio':														//Usual on/off Switch
		case 'Di':														//Door, Window, Flood, binary Sensor
			$('#interlock #input-set #action #stat').show();
			$('#interlock #input-set #action #error').show();
			break;
		case 'KeyLock':													//Keylock Open/Close
			$('#interlock #input-set #action #lock').show();			
			$('#interlock #input-set #action #error').show();
			break;
		case 'LevelSw':													//Dimmer/Slider switch
		case 'RgbLevel':												//RGBW Switch
			$('#interlock #input-set #action #stat').show();
			$('#interlock #input-set #action #error').show();
			$('#interlock #input-set #action #brightness').show();
			$('#interlock #input-set #action #brightness #brightText').show();
			$('#interlock #input-set #action #brightness #analogText').hide();
			break;
		case 'Shutter':													// Roller Shutter, Up and Down
			$('#interlock #input-set #action #error').show();
			$('#interlock #input-set #action #updown').show();			//all up/ all down 						
			break;
		case 'Ao':
		case 'Ai':														//Temp(fire), humidity, PM2.5, analog value Sensor
			$('#interlock #input-set #action #error').show();
			$('#interlock #input-set #action #brightness').show();		//****//
			$('#interlock #input-set #action #brightness #brightText').hide();
			$('#interlock #input-set #action #brightness #analogText').show();
			break;
		default:														//Any other MPoint type not in list
			$('#interlock #input-set #action #stat').hide();
			$('#interlock #input-set #action #error').hide();			//Error
			$('#interlock #input-set #action #mode').hide();
			$('#interlock #input-set #action #temp').hide();			//TempRange
			$('#interlock #input-set #action #lock').hide();
			$('#interlock #input-set #action #updown').hide();
			$('#interlock #input-set #action #brightness').hide();
	}
}

function resetOutput() {	
	$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-gray.png'); //reset stat
	$('#interlock #output-set .an-action #stat-btn').attr('stat','off');
	
	$('#interlock #output-set #sp .selectable-input .current-val').text('22.0');	//reset setpoint value
	$('#interlock #output-set #sp').find('#r220').addClass('selected');
	
	$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-1.png'); //reset fanstep
	$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','L');
	
	$('#interlock #output-set .an-action #flap-btn').attr('src','image/wflap7.png'); //reset flap
	$('#interlock #output-set .an-action #flap-btn').attr('flap','swing')
	
	
	$('#interlock #output-set .an-action #mode-btn').attr('src','image/cool.png'); //reset mode
	$('#interlock #output-set .an-action #mode-btn').attr('mode','cool');
	
	$('#interlock #output-set .an-action #lock-btn').attr('src','image/lock.png');	//reset keylock
	$('#interlock #output-set .an-action #lock-btn').attr('lock','on');
	
	$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roleup.png'); //reset roller shutter
	$('#interlock #output-set .an-action #shutter-btn').attr('updown','on');
	
	//to populate brightness drop down.
	var element = $('#interlock #output-set #brightness').find('.selectable-input ul');
	$(element).html('');
	for(var i = 0; i <= 100; i++) {
		$(element).append('<li id=r'+i+'>'+i+'</li>');
	}
	
	$('#interlock #output-set #brightness .selectable-input .current-val').text('100');		//reset brightness value to 100%
	$('#interlock #output-set #brightness .selectable-input .popup-list').find('#r100').addClass('selected');			//set preselection to 100%
	
	$('#interlock #output-set .an-action#stat .check').removeClass('checked');	//reset check mark
	$('#interlock #output-set .an-action#sp .check').removeClass('checked');
	$('#interlock #output-set .an-action#fanstep .check').removeClass('checked');
	$('#interlock #output-set .an-action#flap .check').removeClass('checked');
	$('#interlock #output-set .an-action#mode .check').removeClass('checked');
	$('#interlock #output-set .an-action#lock .check').removeClass('checked');
	$('#interlock #output-set .an-action#updown .check').removeClass('checked');
	$('#interlock #output-set .an-action#brightness .check').removeClass('checked');
	
	$('#interlock #output-set #delete').show();
}

function populateInput() {
	$('#interlock #interlock-prog-content #inter-input .multi-col-list').html('');
	
	for(var x in INTERLOCK_SEL.input){		
		var inputCommand = INTERLOCK_SEL.input[x].id;
		
		condition = INTERLOCK_SEL.input[x].detectCondition;
		
		inputImage = '';
		
		for(i in condition) {
			//icon drawing START	
			
			var command = [];
			command[0] = i; 
			command[1] = condition[i];
			
			//populate image according to selected value START
			
			if(command[0] == 'stat') {
				if(command[1] == 'on') {
					inputImage += '<img class=\"inter-img\" src=\"image/power-green.png\">';
				} else if(command[1] == 'off') {
					inputImage += '<img class=\"inter-img\" src=\"image/power-gray.png\">';
				}
			}
			else if(command[0] == 'error') {
				if(command[1] == 'true' || command[1] == true) {
					inputImage += '<img class=\"inter-img\" src=\"image/error.png\" style=\"background-color: rgb(255,0,0);\">';
				} else if(command[1] == 'false' || command[1] == false) {
					inputImage += '<img class=\"inter-img\" src=\"image/error.png\" style=\"opacity: 0.8;background-color: rgb(0,255,0);\">';
				}	
			}
			else if(command[0] == 'alarm') {
				if(command[1] == 'true' || command[1] == true) {
					inputImage += '<img class=\"inter-img\" src=\"image/close.png\"> == TRUE';
				} else if(command[1] == 'false' || command[1] == false) {
					inputImage += '<img class=\"inter-img\" src=\"image/close.png\"> == FALSE';
				}
			}
			else if(command[0] == 'temp') {
				inputImage += "<div><img class=\"inter-sub-img\" src=\"image/thermo.png\"><span class=\"inter-val\">"+command[1]+"</span><span class=\"inter-unit\">°C</span></div>";
			}
			else if(command[0] == 'mode') {
				if(command[1] == 'heat') {
					inputImage += '<img class=\"inter-img\" src=\"image/heat.png\">';
				} else if(command[1] == 'cool') {
					inputImage += '<img class=\"inter-img\" src=\"image/cool.png\">';
				} else if(command[1] == 'dry') {
					inputImage += '<img class=\"inter-img\" src=\"image/dry.png\">';
				} else if(command[1] == 'fan') {
					inputImage += '<img class=\"inter-img\" src=\"image/fan.png\">';
				}
			}
			else if(command[0] == 'lock') {
				if(command[1] == 'on') {
					inputImage += '<img class=\"inter-img\" src=\"image/lock.png\">';
				} else if(command[1] == 'off') {
					inputImage += '<img class=\"inter-img\" src=\"image/open.png\">';
				}
			}
			else if(command[0] == 'updown') {
				if(command[1] == 'on') {
					inputImage += '<img class=\"inter-img\" src=\"image/roleup.png\">';
				} else if(command[1] == 'off') {
					inputImage += '<img class=\"inter-img\" src=\"image/roledown.png\">';
				}
			}
			else if(command[0] == 'av') {
				inputImage += "<div><span class=\"inter-val\">"+command[1]+"</span>"; //<span class=\"inter-unit\">%</span></div>";
			}
			//icon drawing END
		}
		$('#interlock #interlock-prog-content #inter-input .multi-col-list').append("<tr id="+inputCommand+"><td>"+POINT_LIST[INTERLOCK_SEL.input[x].id].info.name+"</td><td>"+inputImage+"</td></tr>");
	}	
	$('#interlock #interlock-prog-content #inter-input .multi-col-list').append("<tr id=\"+\"><td style=\"padding: 0 0 0 150px;\">+</td></tr>");
}

function populateOutput1() {
	$('#interlock #interlock-prog-content #inter-output1 .multi-col-list').html('');
	
	$('#interlock #interlock-prog-content #output1-condition').val(INTERLOCK_SEL.output1.condition);
	
	for(var y in INTERLOCK_SEL.output1.controls) {
		var inputCommand = INTERLOCK_SEL.output1.controls[y].id;
		
		output1Commands = INTERLOCK_SEL.output1.controls[y].command;
		
		output1Image = '';
		
		for(i in output1Commands) {	
			//icon drawing START
		
			var command = [];
			command[0] = i; 
			command[1] = output1Commands[i];
			
			//populate image according to selected value START
			
			if(command[0] == 'stat') {
				if(command[1] == 'on') {
					output1Image += '<img class=\"inter-img\" src=\"image/power-green.png\">';
				} else if(command[1] == 'off') {
					output1Image += '<img class=\"inter-img\" src=\"image/power-gray.png\">';
				}
			}
			else if(command[0] == 'sp') {
				output1Image += "<img class=\"inter-sub-img\" src=\"image/thermo.png\"><span class=\"inter-val\">"+command[1]+"</span><span class=\"inter-unit\">°C</span>";
			}
			else if(command[0] == 'fanstep') {
				if(command[1] == 'L') {
					output1Image += '<img class=\"inter-img\" src=\"image/fanstep3-1.png\">';
				} else if(command[1] == 'M') {
					output1Image += '<img class=\"inter-img\" src=\"image/fanstep3-3.png\">';
				} else if(command[1] == 'H') {
					output1Image += '<img class=\"inter-img\" src=\"image/fanstep3-5.png\">';
				}
			}
			else if(command[0] == 'flap') {
				if(command[1] == '0') {
					output1Image += '<img class=\"inter-img\" src=\"image/wflap0.png\">';
				} else if(command[1] == '1') {
					output1Image += '<img class=\"inter-img\" src=\"image/wflap1.png\">';
				} else if(command[1] == '2') {
					output1Image += '<img class=\"inter-img\" src=\"image/wflap2.png\">';
				} else if(command[1] == '3') {
					output1Image += '<img class=\"inter-img\" src=\"image/wflap3.png\">';
				} else if(command[1] == '4') {
					output1Image += '<img class=\"inter-img\" src=\"image/wflap4.png\">';
				} else if(command[1] == 'swing') {
					output1Image += '<img class=\"inter-img\" src=\"image/wflap7.png\">';
				}
			}
			else if(command[0] == 'mode') {
				if(command[1] == 'heat') {
					output1Image += '<img class=\"inter-img\" src=\"image/heat.png\">';
				} else if(command[1] == 'cool') {
					output1Image += '<img class=\"inter-img\" src=\"image/cool.png\">';
				} else if(command[1] == 'dry') {
					output1Image += '<img class=\"inter-img\" src=\"image/dry.png\">';
				} else if(command[1] == 'fan') {
					output1Image += '<img class=\"inter-img\" src=\"image/fan.png\">';
				}
			}
			else if(command[0] == 'lock') {
				if(command[1] == 'on') {
					output1Image += '<img class=\"inter-img\" src=\"image/lock.png\">';
				} else if(command[1] == 'off') {
					output1Image += '<img class=\"inter-img\" src=\"image/open.png\">';
				}
			}
			else if(command[0] == 'updown') {
				if(command[1] == 'on') {
					output1Image += '<img class=\"inter-img\" src=\"image/roleup.png\">';
				} else if(command[1] == 'off') {
					output1Image += '<img class=\"inter-img\" src=\"image/roledown.png\">';
				}
			}
			else if(command[0] == 'av') {
				output1Image += "<span class=\"inter-val\">"+command[1]+"</span>"; //<span class=\"inter-unit\">%</span>";
			}
		}
		var name = "";
		if(POINT_LIST[inputCommand] != null) name = POINT_LIST[inputCommand].info.name;
		else if(SCENES_LIST[inputCommand] != null) name = SCENES_LIST[inputCommand].name;
		$('#interlock #interlock-prog-content #inter-output1 .multi-col-list').append("<tr id="+inputCommand+"><td>"+name+"</td><td>"+output1Image+"</td></tr>");
	}
	$('#interlock #interlock-prog-content #inter-output1 .multi-col-list').append("<tr id=\"+\"><td style=\"padding: 0 0 0 150px;\">+</td></tr>");	
}

function populateOutput2() {
	$('#interlock #interlock-prog-content #inter-output2 .multi-col-list').html('');
	
	$('#interlock #interlock-prog-content #output2-condition').val(INTERLOCK_SEL.output2.condition);
	
	for(var z in INTERLOCK_SEL.output2.controls) {
		
		var inputCommand = INTERLOCK_SEL.output2.controls[z].id;
		
		output2Commands = INTERLOCK_SEL.output2.controls[z].command;
		
		output2Image = '';
		
		for(i in output2Commands) {	
			//icon drawing START
		
			var command = [];
			command[0] = i; 
			command[1] = output2Commands[i];
			
			//populate image according to selected value START
		
			if(command[0] == 'stat') {
				if(command[1] == 'on') {
					output2Image += '<img class=\"inter-img\" src=\"image/power-green.png\">';
				} else if(command[1] == 'off') {
					output2Image += '<img class=\"inter-img\" src=\"image/power-gray.png\">';
				}
			}
			else if(command[0] == 'sp') {
				output2Image += "<img class=\"inter-sub-img\" src=\"image/thermo.png\"><span class=\"inter-val\">"+command[1]+"</span><span class=\"inter-unit\">°C</span>";
			}
			else if(command[0] == 'fanstep') {
				if(command[1] == 'L') {
					output2Image += '<img class=\"inter-img\" src=\"image/fanstep3-1.png\">';
				} else if(command[1] == 'M') {
					output2Image += '<img class=\"inter-img\" src=\"image/fanstep3-3.png\">';
				} else if(command[1] == 'H') {
					output2Image += '<img class=\"inter-img\" src=\"image/fanstep3-5.png\">';
				}
			}
			else if(command[0] == 'flap') {
				if(command[1] == '0') {
					output2Image += '<img class=\"inter-img\" src=\"image/wflap0.png\">';
				} else if(command[1] == '1') {
					output2Image += '<img class=\"inter-img\" src=\"image/wflap1.png\">';
				} else if(command[1] == '2') {
					output2Image += '<img class=\"inter-img\" src=\"image/wflap2.png\">';
				} else if(command[1] == '3') {
					output2Image += '<img class=\"inter-img\" src=\"image/wflap3.png\">';
				} else if(command[1] == '4') {
					output2Image += '<img class=\"inter-img\" src=\"image/wflap4.png\">';
				} else if(command[1] == 'swing') {
					output2Image += '<img class=\"inter-img\" src=\"image/wflap7.png\">';
				}
			}
			else if(command[0] == 'mode') {
				if(command[1] == 'heat') {
					output2Image += '<img class=\"inter-img\" src=\"image/heat.png\">';
				} else if(command[1] == 'cool') {
					output2Image += '<img class=\"inter-img\" src=\"image/cool.png\">';
				} else if(command[1] == 'dry') {
					output2Image += '<img class=\"inter-img\" src=\"image/dry.png\">';
				} else if(command[1] == 'fan') {
					output2Image += '<img class=\"inter-img\" src=\"image/fan.png\">';
				}
			}
			else if(command[0] == 'lock') {
				if(command[1] == 'on') {
					output2Image += '<img class=\"inter-img\" src=\"image/lock.png\">';
				} else if(command[1] == 'off') {
					output2Image += '<img class=\"inter-img\" src=\"image/open.png\">';
				}
			}
			else if(command[0] == 'updown') {
				if(command[1] == 'on') {
					output2Image += '<img class=\"inter-img\" src=\"image/roleup.png\">';
				} else if(command[1] == 'off') {
					output2Image += '<img class=\"inter-img\" src=\"image/roledown.png\">';
				}
			}
			else if(command[0] == 'av') {
				output2Image += "<span class=\"inter-val\">"+command[1]+"</span>"; //<span class=\"inter-unit\">%</span>";
			}
		}
		var name = "";
		if(POINT_LIST[inputCommand] != null) name = POINT_LIST[inputCommand].info.name;
		else if(SCENES_LIST[inputCommand] != null) name = SCENES_LIST[inputCommand].name;
		$('#interlock #interlock-prog-content #inter-output2 .multi-col-list').append("<tr id="+inputCommand+"><td>"+name+"</td><td>"+output2Image+"</td></tr>");
	}
	$('#interlock #interlock-prog-content #inter-output2 .multi-col-list').append("<tr id=\"+\"><td style=\"padding: 0 0 0 150px;\">+</td></tr>");
}

function displaySelectedInput(selected_input) {
	//create brand new input START
	if(selected_input == '+') {
		$('#interlock #input-set #delete').hide();
		$('#interlock #input-set #input-point').attr('oldname',selected_input);
		
		INTERLOCK_SEL.enable = $('#interlock #interlock-prog-content .slide .disable').hasClass('hide');
		INTERLOCK_SEL.timer1 = $('#interlock #interlock-prog-content .timer1 input').val();
		INTERLOCK_SEL.timer2 = $('#interlock #interlock-prog-content .timer2 input').val();
		INTERLOCK_SEL.name = $('#interlock #interlock-prog-content input').val();
		
		INTERLOCK_SEL.output1.condition = $('#interlock #interlock-prog-content .output1-condition #output1-condition').val();
		INTERLOCK_SEL.output2.condition = $('#interlock #interlock-prog-content .output2-condition #output2-condition').val();	
		
		$('#interlock #input-set').show();
		$('#interlock #interlock-prog-list').attr('reject',true);
		return;
	}
	//create brand new input END
	
	$('#interlock #input-set #input-point').attr('oldname',selected_input);
	$('#interlock #input-set #input-point').val(selected_input);
	
	for(var x in INTERLOCK_SEL.input){		
		if(INTERLOCK_SEL.input[x].id == selected_input) {
			
			condition = INTERLOCK_SEL.input[x].detectCondition;
			
			for(i in condition) {
			
				var command = [];
				command[0] = i; 
				command[1] = condition[i];
				
				//add check mark to selected value START
				if (command[0] == 'av') command[0] = 'brightness';
				
				var target = $('#interlock #input-set .an-action#'+command[0]+' .check');
				$(target).addClass('checked');
				//add check mark to selected value END	
				
				//populate image according to selected value START
				if(command[0] == 'stat') {
					if(command[1] == 'on') {
						$('#interlock #input-set .an-action #stat-btn').attr('src','image/power-green.png');
						$('#interlock #input-set .an-action #stat-btn').attr('stat','on');
					} else if(command[1] == 'off') {
						$('#interlock #input-set .an-action #stat-btn').attr('src','image/power-gray.png');
						$('#interlock #input-set .an-action #stat-btn').attr('stat','off');
					} else if(command[1] == 'error') {
						$('#interlock #input-set .an-action #stat-btn').attr('src','image/power-red.png');
						$('#interlock #input-set .an-action #stat-btn').attr('stat','error');
					}
				}
				else if(command[0] == 'error') {
					if(command[1] == 'true' || command[1] == true) {
						$('#interlock #input-set #error .slide .disable').addClass('hide');
						$('#interlock #input-set #error .slide .enable').removeClass('hide');
					} else if(command[1] == 'false' || command[1] == false) {
						$('#interlock #input-set #error .slide .disable').removeClass('hide');
						$('#interlock #input-set #error .slide .enable').addClass('hide');
					}	
				}
				else if(command[0] == 'alarm') {
					if(command[1] == 'true' || command[1] == true) {
						$('#interlock #input-set #alarm .slide .disable').addClass('hide');
						$('#interlock #input-set #alarm .slide .enable').removeClass('hide');
					} else if(command[1] == 'false' || command[1] == false) {
						$('#interlock #input-set #alarm .slide .disable').removeClass('hide');
						$('#interlock #input-set #alarm .slide .enable').addClass('hide');
					}
				}
				else if(command[0] == 'temp') {
					if(command[1].indexOf('to') > -1) {
						$('#interlock #input-set #temp .temp-condition #temp-condition').val('to');
						$('#interlock #input-set #temp .selectable-input #lowerLimit').text(command[1].substr(0,4));
						$('#interlock #input-set #temp').find('#r'+(command[1].substr(0,4))*10).addClass('selected');
						$('#interlock #input-set #temp .selectable-input #higherLimit').text(command[1].substr(6,10));
						
						$('#interlock #input-set .an-action#temp #lowerLimit').show();
						$('#interlock #input-set .an-action#temp #allTemp').html('&deg;C');
					} else {
						var condition = command[1].charAt(0);
						$('#interlock #input-set #temp .temp-condition #temp-condition').val(condition);
						$('#interlock #input-set #temp .selectable-input #higherLimit').text(command[1].substr(1));
						
						$('#interlock #input-set .an-action#temp #lowerLimit').hide();
						$('#interlock #input-set .an-action#temp #allTemp').html('<span class="mls" param="room_temp">Room Temperature</span>');
					}
				}
				else if(command[0] == 'mode') {
					if(command[1] == 'heat') {
						$('#interlock #input-set .an-action #mode-btn').attr('src','image/heat.png');
						$('#interlock #input-set .an-action #mode-btn').attr('mode','heat');
					} else if(command[1] == 'cool') {
						$('#interlock #input-set .an-action #mode-btn').attr('src','image/cool.png');
						$('#interlock #input-set .an-action #mode-btn').attr('mode','cool');
					} else if(command[1] == 'dry') {
						$('#interlock #input-set .an-action #mode-btn').attr('src','image/dry.png');
						$('#interlock #input-set .an-action #mode-btn').attr('mode','dry');
					} else if(command[1] == 'fan') {
						$('#interlock #input-set .an-action #mode-btn').attr('src','image/fan.png');
						$('#interlock #input-set .an-action #mode-btn').attr('mode','fan');
					}
				}
				else if(command[0] == 'lock') {
					if(command[1] == 'on') {
						$('#interlock #inmput-set .an-action #lock-btn').attr('src','image/lock.png');
						$('#interlock #input-set .an-action #lock-btn').attr('lock','on');
					} else if(command[1] == 'off') {
						$('#interlock #input-set .an-action #lock-btn').attr('src','image/open.png');
						$('#interlock #input-set .an-action #lock-btn').attr('lock','off');
					}
				}
				else if(command[0] == 'updown') {
					if(command[1] == 'on') {
						$('#interlock #input-set .an-action #shutter-btn').attr('src','image/roleup.png');
						$('#interlock #input-set .an-action #shutter-btn').attr('updown','on');
					} else if(command[1] == 'off') {
						$('#interlock #input-set .an-action #shutter-btn').attr('src','image/roledown.png');
						$('#interlock #input-set .an-action #shutter-btn').attr('updown','off');
					}
				}
				else if(command[0] == 'brightness') {					
					if(command[1].indexOf('to') > -1) {
						$('#interlock #input-set #brightness .av-condition #av-condition').val('to');
						var n = command[1].indexOf('to');
						var stringLength = command[1].length;
						var lowerValue = command[1].substr(0,n);
						var higherValue = command[1].substr(n+2,stringLength);
						$('#interlock #input-set #brightness .av-input #lowerAV').val(lowerValue);
						$('#interlock #input-set #brightness .av-input #higherAV').val(higherValue);
						
						$('#interlock #input-set .an-action#brightness #lowerAV').show();
						$('#interlock #input-set .an-action#brightness #percent').show();
					} else {
						var condition = command[1].charAt(0);
						$('#interlock #input-set #brightness .av-condition #av-condition').val(condition);
						$('#interlock #input-set #brightness .av-input #higherAV').val(command[1].substr(1));
						
						$('#interlock #input-set .an-action#brightness #lowerAV').hide();
						$('#interlock #input-set .an-action#brightness #percent').hide();
					}
				}
				//populate image according to selected value END
			}
		}
	}
}

function displaySelectedOutput1(selected_input) {
	if(selected_input == '+') {
		$('#interlock #output-set #delete').hide();
		
		INTERLOCK_SEL.enable = $('#interlock #interlock-prog-content .slide .disable').hasClass('hide');
		INTERLOCK_SEL.timer1 = $('#interlock #interlock-prog-content .timer1 input').val();
		INTERLOCK_SEL.timer2 = $('#interlock #interlock-prog-content .timer2 input').val();
		INTERLOCK_SEL.name = $('#interlock #interlock-prog-content input').val();
		
		INTERLOCK_SEL.output1.condition = $('#interlock #interlock-prog-content .output1-condition #output1-condition').val();
		INTERLOCK_SEL.output2.condition = $('#interlock #interlock-prog-content .output2-condition #output2-condition').val();	
	} else {
		
		$('#interlock #output-set #output-point').val(selected_input);

		for(var y in INTERLOCK_SEL.output1.controls){		
			if(INTERLOCK_SEL.output1.controls[y].id == selected_input) {
		
				output1Commands = INTERLOCK_SEL.output1.controls[y].command;
				
				for(i in output1Commands) {	
					//first get selected command and display check mark and value
					var command = [];
					command[0] = i; 
					command[1] = output1Commands[i];
					
					//add check mark to selected value START
					if (command[0] == 'av') {
						command[0] = 'brightness';
					}					
					var target = $('#interlock #output-set .an-action#'+command[0]+' .check');
					$(target).addClass('checked');
					//add check mark to selected value END	
					
					//populate image according to selected value START
					if(command[0] == 'stat') {
						if(command[1] == 'on') {
							$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-green.png');
							$('#interlock #output-set .an-action #stat-btn').attr('stat','on');
						} else if(command[1] == 'off') {
							$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-gray.png');
							$('#interlock #output-set .an-action #stat-btn').attr('stat','off');
						} else if(command[1] == 'error') {
							$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-red.png');
							$('#interlock #output-set .an-action #stat-btn').attr('stat','error');
						}
					}
					else if(command[0] == 'sp') {
						$('#interlock #output-set #sp .selectable-input .current-val').text(command[1]);
						$('#interlock #output-set #sp').find('#r'+command[1]*10).addClass('selected');
					}
					else if(command[0] == 'fanstep') {
						if(command[1] == 'L') {
							$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-1.png');
							$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','L');
						}
						else if(command[1] == 'M') {
							$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-3.png');
							$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','M')
						}
						else {
							$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-5.png');
							$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','H')
						}
					}
					else if(command[0] == 'flap') {
						var val;
						if(command[1] == 'swing') val = 7;
						else val = command[1];
						$('#interlock #output-set .an-action #flap-btn').attr('src',"image/wflap"+val+".png");
						$('#interlock #output-set .an-action #flap-btn').attr('flap',command[1])
					}
					else if(command[0] == 'mode') {
						if(command[1] == 'heat') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/heat.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','heat');
						} else if(command[1] == 'cool') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/cool.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','cool');
						} else if(command[1] == 'dry') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/dry.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','dry');
						} else if(command[1] == 'fan') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/fan.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','fan');
						}
					}
					else if(command[0] == 'lock') {
						if(command[1] == 'on') {
							$('#interlock #output-set .an-action #lock-btn').attr('src','image/lock.png');
							$('#interlock #output-set .an-action #lock-btn').attr('lock','on');
						} else if(command[1] == 'off') {
							$('#interlock #output-set .an-action #lock-btn').attr('src','image/open.png');
							$('#interlock #output-set .an-action #lock-btn').attr('lock','off');
						}
					}
					else if(command[0] == 'updown') {
						if(command[1] == 'on') {
							$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roleup.png');
							$('#interlock #output-set .an-action #shutter-btn').attr('updown','on');
						} else if(command[1] == 'off') {
							$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roledown.png');
							$('#interlock #output-set .an-action #shutter-btn').attr('updown','off');
						}
					}
					else if(command[0] == 'brightness') {
						$('#interlock #output-set #brightness .selectable-input .current-val').text(command[1]);		//reset brightness value to 100%
						$('#interlock #output-set #brightness .selectable-input .popup-list').find('#r'+command[1]).addClass('selected');
					}
					//populate image according to selected value END
				}
			}
		}
	}	
}

function displaySelectedOutput2(selected_input) {
	if(selected_input == '+') {
		$('#interlock #output-set #delete').hide();
		
		INTERLOCK_SEL.enable = $('#interlock #interlock-prog-content .slide .disable').hasClass('hide');
		INTERLOCK_SEL.timer1 = $('#interlock #interlock-prog-content .timer1 input').val();
		INTERLOCK_SEL.timer2 = $('#interlock #interlock-prog-content .timer2 input').val();
		INTERLOCK_SEL.name = $('#interlock #interlock-prog-content input').val();
		
		INTERLOCK_SEL.output1.condition = $('#interlock #interlock-prog-content .output1-condition #output1-condition').val();
		INTERLOCK_SEL.output2.condition = $('#interlock #interlock-prog-content .output2-condition #output2-condition').val();	
	} else {
		
		$('#interlock #output-set #output-point').val(selected_input);
		
		for(var z in INTERLOCK_SEL.output2.controls){		
			if(INTERLOCK_SEL.output2.controls[z].id == selected_input) {
		
				output2Commands = INTERLOCK_SEL.output2.controls[z].command;
				
				for(i in output2Commands) {	
					//first get selected command and display check mark and value
					var command = [];
					command[0] = i; 
					command[1] = output2Commands[i];
		
					//add check mark to selected value START
					if (command[0] == 'av') {
						command[0] = 'brightness';
					}
					var target = $('#interlock #output-set .an-action#'+command[0]+' .check');
					$(target).addClass('checked');
					//add check mark to selected value END	
		
					//populate image according to selected value START
					if(command[0] == 'stat') {
						if(command[1] == 'on') {
							$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-green.png');
							$('#interlock #output-set .an-action #stat-btn').attr('stat','on');
						} else if(command[1] == 'off') {
							$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-gray.png');
							$('#interlock #output-set .an-action #stat-btn').attr('stat','off');
						} else if(command[1] == 'error') {
							$('#interlock #output-set .an-action #stat-btn').attr('src','image/power-red.png');
							$('#interlock #output-set .an-action #stat-btn').attr('stat','error');
						}
					}
					else if(command[0] == 'sp') {
						$('#interlock #output-set #sp .selectable-input .current-val').text(command[1]);
						$('#interlock #output-set #sp').find('#r'+command[1]*10).addClass('selected');
					}
					else if(command[0] == 'fanstep') {
						if(command[1] == 'L') {
							$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-1.png');
							$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','L');
						}
						else if(command[1] == 'M') {
							$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-3.png');
							$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','M')
						}
						else {
							$('#interlock #output-set .an-action #fanstep-btn').attr('src','image/fanstep3-5.png');
							$('#interlock #output-set .an-action #fanstep-btn').attr('fanstep','H')
						}
					}
					else if(command[0] == 'flap') {
						var val;
						if(command[1] == 'swing') val = 7;
						else val = command[1];
						$('#interlock #output-set .an-action #flap-btn').attr('src',"image/wflap"+val+".png");
						$('#interlock #output-set .an-action #flap-btn').attr('flap',command[1])
					}
					else if(command[0] == 'mode') {
						if(command[1] == 'heat') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/heat.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','heat');
						} else if(command[1] == 'cool') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/cool.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','cool');
						} else if(command[1] == 'dry') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/dry.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','dry');
						} else if(command[1] == 'fan') {
							$('#interlock #output-set .an-action #mode-btn').attr('src','image/fan.png');
							$('#interlock #output-set .an-action #mode-btn').attr('mode','fan');
						}
					}
					else if(command[0] == 'lock') {
						if(command[1] == 'on') {
							$('#interlock #output-set .an-action #lock-btn').attr('src','image/lock.png');
							$('#interlock #output-set .an-action #lock-btn').attr('lock','on');
						} else if(command[1] == 'off') {
							$('#interlock #output-set .an-action #lock-btn').attr('src','image/open.png');
							$('#interlock #output-set .an-action #lock-btn').attr('lock','off');
						}
					}
					else if(command[0] == 'updown') {
						if(command[1] == 'on') {
							$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roleup.png');
							$('#interlock #output-set .an-action #shutter-btn').attr('updown','on');
						} else if(command[1] == 'off') {
							$('#interlock #output-set .an-action #shutter-btn').attr('src','image/roledown.png');
							$('#interlock #output-set .an-action #shutter-btn').attr('updown','off');
						}
					}
					else if(command[0] == 'brightness') {
						$('#interlock #output-set #brightness .selectable-input .current-val').text(command[1]);		//reset brightness value to 100%
						$('#interlock #output-set #brightness .selectable-input .popup-list').find('#r'+command[1]).addClass('selected');
					}
					//populate image according to selected value END
				}
			}
		}
	}
}