//hotel interlock screen event
$(document).on('page_before_show','.screen#multihotel',function(e) {	
	resetMultiHotelScreen();
	getMultiHotel();	
});

$(document).on('click','#multihotel #hotel-main #fanstep-btn',function(e) {
	if($('#multihotel #hotel-main').attr('reject') == 'true') return;
	
	var step = $(this).attr('fanstep');
	
	if(step == 'L') step = 'M';
	else if(step == 'M') step = 'H';
	else step = 'L';
	
	$(this).attr('fanstep',step);
	
	var val;
	if(step == 'L') val = 1;
	else if(step == 'M') val = 3;
	else if(step == 'H') val = 5;
	else val = 3;
	$(this).attr('src','image/fanstep3-'+val+'.png');
});

$(document).on('click','#multihotel #hotel-main #save',function(e) {
	if($('#multihotel #hotel-main').attr('reject') == 'true') return;
	
	HOTEL_LIST.unrentedopMode = $('input[name=opmode]:checked').attr('id');
	HOTEL_LIST.unrentedOMSB = $('#multihotel #hotel-main .unrentedsettings #unrentedsetback').text();
	HOTEL_LIST.unrentedOMSP = $('#multihotel #hotel-main .unrentedsettings #unrentedsetpoint').text();
	HOTEL_LIST.unrentedfanstep = $('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep');
	
	HOTEL_LIST.rentedopMode = $('input[name=rentedopmode]:checked').attr('id');
	HOTEL_LIST.rentedOMSB = $('#multihotel #hotel-main .rentedsettings #rentedsetback').text();
	HOTEL_LIST.rentedOMSP = $('#multihotel #hotel-main .rentedsettings #rentedsetpoint').text();
	HOTEL_LIST.rentedfanstep = $('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep');
	
	HOTEL_LIST.kcMode = $('input[name=keycard]:checked').attr('id');
	HOTEL_LIST.KCSB = $('#multihotel #hotel-main .keycardout #setback').text();
	HOTEL_LIST.KCSP = $('#multihotel #hotel-main .keycardout #setpoint').text();
	HOTEL_LIST.FSL = $('#multihotel #hotel-main .keycardout .slide .disable').hasClass('hide');
	HOTEL_LIST.offFCU = $('#multihotel #hotel-main .windowopen .slide .disable').hasClass('hide');
	HOTEL_LIST.remotecontrol = $('#multihotel #hotel-main .remotecontrol .slide .disable').hasClass('hide');

	saveMultiHotel();
	
	loadScreen('top_screen.html');
});

$(document).on('click','#multihotel #hotel-main #cancel',function(e) {
	if($('#multihotel #hotel-main').attr('reject') == 'true') return;
	
	loadScreen('top_screen.html');
});

$(document).on('click','#multihotel #hotel-main #addroom',function(e) {
	if($('#multihotel #hotel-main').attr('reject') == 'true') return;
	
	$('#multihotel #room-detail #roomname').attr('roomname', '');
	
	HOTEL_SENSORFCUPAIRING = {};
	
	HOTEL_TEMPSENSOR = {};
	
	$('#multihotel #hotel-main').attr('reject',true);
	$('#multihotel #room-detail').show();
});

$(document).on('click','#multihotel #hotel-main #pointtypetable .tbody .roomname',function(e) {
	if($('#multihotel #hotel-main').attr('reject') == 'true') return;
	
	var roomname = $(this).text();
	$('#multihotel #room-detail #roomname').val(roomname);
	$('#multihotel #room-detail #roomname').attr('roomname',roomname);

	populatePointTypeTable(ROOM_DETAILS[roomname].type);
	
	HOTEL_SENSORFCUPAIRING = jQuery.extend(true, {}, ROOM_DETAILS[roomname].sensorFCUPairing);
	
	HOTEL_TEMPSENSOR = jQuery.extend(true, {}, HOTEL_SENSORFCUPAIRING);
	
	setMultiLang('body .mls');
	
	$('#multihotel #hotel-main').attr('reject',true);
	$('#multihotel #room-detail').show();
});

$(document).on('click','#multihotel #room-detail #save',function(e) {
	if ($('#multihotel #room-detail').attr('reject') == 'true') return;
	
	HOTEL_SENSORFCUPAIRING = HOTEL_TEMPSENSOR;
	
	var roomname = $('#multihotel #room-detail #roomname').val();
	var oldroomname = $('#multihotel #room-detail #roomname').attr('roomname');
	
	if(roomname.length == 0) {
		alert(getString('noroomname'));	// please input program name
		return;
	}
	
	if(oldroomname == '') {																			//check if is new room creation
		ROOM_DETAILS[roomname] = {};																
	} else if(oldroomname != roomname) {															//room name changed
		ROOM_DETAILS[roomname] = jQuery.extend(true, {}, ROOM_DETAILS[oldroomname]);
		delete ROOM_DETAILS[oldroomname];
	}

	ROOM_DETAILS[roomname].type = {};
	var sensorExistFlag = false;
	
	$('#multihotel #room-detail #pointtypetable > tbody  > tr').each(function() {		
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		if(pointType == 'hotelsensor') sensorExistFlag = true;
		if(pointType != 'hotelothers') ROOM_DETAILS[roomname].type[pointID] = pointType;			//only save points if 'pointType' is not 'hotelothers'
	});
	
	ROOM_DETAILS[roomname].sensorFCUPairing = {};
	
	if(sensorExistFlag == true) {
		$.each(HOTEL_SENSORFCUPAIRING, function( index, value ) {
			if(ROOM_DETAILS[roomname].type[index] == 'hotelsensor') {								//check sensorFCUpairing. If point is not 'hotelsensor', dont save in list.	
				var listoffcu = [];
				
				$.each(HOTEL_SENSORFCUPAIRING[index], function(i, v) {
					if(ROOM_DETAILS[roomname].type[v] == 'hotelfcu') listoffcu.push(v);				//check list of fcu. If point is not 'hotelfcu', dont save in array.	
				});
				
				ROOM_DETAILS[roomname].sensorFCUPairing[index] = listoffcu;
			}
		});
	}

	setRoomListView();
	
	//close pop up menu
	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #room-detail').hide();
});

$(document).on('click','#multihotel #room-detail #cancel',function(e) {
	if ($('#multihotel #room-detail').attr('reject') == 'true') return;
	
	HOTEL_TEMPSENSOR = jQuery.extend(true, {}, HOTEL_SENSORFCUPAIRING);

	$('#multihotel #room-detail #roomname').val('');
	$('#multihotel #room-detail #roomname').attr('roomname','');
	
	$('#multihotel #room-detail #pointtypetable tbody').remove();
	$('#multihotel #room-detail #pointtypetable').append('<tbody class="tbody"></tbody>');
	
	//Door Sensor list
	$('#multihotel #room-detail #screen-list .list').html('');
	
	//FCU list
	$('#multihotel #room-detail #pnt-select .list').html('');

	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #room-detail').hide();
});

$(document).on('click','#multihotel #room-detail #delete',function(e) {
	if ($('#multihotel #room-detail').attr('reject') == 'true') return;

	if(confirm(getString('del_conf')) == false) return;	// Is it OK to delete this program?

	var roomname = $('#multihotel #room-detail #roomname').attr('roomname');

	if(roomname != null && roomname.length > 0) {
		if(ROOM_DETAILS.hasOwnProperty(roomname)) delete ROOM_DETAILS[roomname];
	}

	HOTEL_TEMPSENSOR = jQuery.extend(true, {}, HOTEL_SENSORFCUPAIRING);
	
	setRoomListView();
	
	//close pop up menu
	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #room-detail').hide();
});

$(document).on('click touchstart','#multihotel #room-detail #pointtypetable .tbody .ptype',function(e) {
	if($('#multihotel #room-detail').attr('reject') == 'true') return;
	
	var type = $(this).attr('param');
	
	if(type == 'hotelfcu') return;
	
	switch (type) {
		case 'hotelothers':
			type = 'hotelcheckin';
			break;
		case 'hotelcheckin':
			type = 'hotelkeycard';
			break;
		case 'hotelkeycard':
			type = 'hotelsensor';
			break;
		case 'hotelsensor':
			type = 'hotelothers';
			break;
		default:
			type = 'hotelothers';
	}
	
	//Logic for only one selection START
	var checkinflag = 0;													//initialize variables
	var keycardflag = 0;
	
	$('#pointtypetable > tbody  > tr').each(function() {					//check through list and take note of occurence
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		if(pointType == 'hotelcheckin') checkinflag++;
		
		if(pointType == 'hotelkeycard') keycardflag++;
	});
	
	if(type == 'hotelcheckin' && checkinflag >= 1) type = 'hotelkeycard';	//more than one, go to next
	if(type == 'hotelkeycard' && keycardflag >= 1) type = 'hotelsensor';
	//Logic for only one selection END
	
	$(this).attr('param', type);
	
	/////////////////////////////////////////////////////////////////////////To redraw list of motion sensors START
	$('#multihotel #room-detail #screen-list .list').html('');					//reset sensor list in fcupairing
	
	$('#pointtypetable > tbody  > tr').each(function() {					//check through list and take note of occurence
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		if(pointType == 'hotelsensor') {									//to fill sensor list is type is hotelsensor			
			var line = '<li id="';
			line += pointID;												//Point ID as ID
			line += '">';
			line += POINT_LIST[pointID].info.name;							//Point Name for display
			line += '</li>';
			
			$('#multihotel #room-detail #screen-list .list').append(line);
		}
	});
	/////////////////////////////////////////////////////////////////////////To redraw list of motion sensors END
	
	setMultiLang('.mls');
});

$(document).on('click','#multihotel #room-detail #screen-list li',function(e) {
	$('#multihotel #room-detail #pnt-select .list li').removeClass('selected');
	var sid = $(this).attr('id');
	
	if (jQuery.isEmptyObject(HOTEL_TEMPSENSOR) == false) {	
		$.each(HOTEL_TEMPSENSOR, function(sensorPID,pid_list) {
			if (sid == sensorPID){
				for(var i in pid_list) {
					var id = pid_list[i];
					$('#multihotel #room-detail #pnt-select .list li#'+id).addClass('selected');
				}
			}
		});
	}
});	

$(document).on('click','#multihotel #room-detail #pnt-select li',function(e) {
	var sensorPID = ($('#multihotel #room-detail #screen-list .list .selected')).attr('id');
	if (jQuery.isEmptyObject(sensorPID)) return;												//return if no SENSOR is selected
	
	var pid_list = [];

	var points = $('#multihotel #room-detail #pnt-select .list .selected');			  				//go through list to find all selected FCU
	$.each(points, function() {
		pid_list.push($(this).attr('id'));
	});	
	
	if (jQuery.isEmptyObject(pid_list)) {														//if no FCU is selected								
		$.each(HOTEL_TEMPSENSOR, function( k, v ) {												//go through HOTEL_TEMPSENSOR list
			if (k == sensorPID) {																//if key is same as selected SENSOR
				delete HOTEL_TEMPSENSOR[sensorPID];												//delete the selected SENSOR record (clear settings)
			}
		});
	} else {
		HOTEL_TEMPSENSOR[sensorPID] = pid_list;													//Save to HOTEL_TEMSENSOR
	}
});

$(document).on('click','#multihotel #room-detail .pointtype .img-button',function(e) {
	if($('#multihotel #room-detail').attr('reject') == 'true') return;

	$('#multihotel .point-select.dialog').css('top',20);
	$('#multihotel .point-select.dialog').css('left',200);
	
	var roomname = $('#multihotel #room-detail #roomname').attr('roomname');
	
	setPointListH();

	var pointidlist = {};

	$('#multihotel #room-detail #pointtypetable > tbody  > tr').each(function() {		
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		pointidlist[pointID] = pointType;
	});

	setSelectedPointH(pointidlist);
	
	$('#multihotel .point-select.dialog').show();
	$('#multihotel #room-detail').attr('reject','true');
});

$(document).on('click','#multihotel .contents-area .point-select .ok',function(e) {
	var roomname = $('#multihotel #room-detail #roomname').attr('roomname');
	
	var TEMP_ROOM_DETAILS_TYPE = getselectedpointdetails(roomname);

	populatePointTypeTable(TEMP_ROOM_DETAILS_TYPE);
	
	$('#multihotel #room-detail').attr('reject', 'false');
});

$(document).on('click','#multihotel .contents-area .point-select .cancel',function(e) {
	$('#multihotel #room-detail').attr('reject', 'false');
});

$(document).on('click','#multihotel #hotel-pairing #save',function(e) {		
	HOTEL_SENSORFCUPAIRING = HOTEL_TEMPSENSOR;
	
	//remove selected li in both lists
	$('#multihotel #hotel-pairing #screen-list .list li').removeClass('selected');
	$('#multihotel #hotel-pairing #pnt-select .list li').removeClass('selected');
	
	//close pop up menu
	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #hotel-pairing').hide();
});	

$(document).on('click','#multihotel #hotel-pairing #cancel',function(e) {
	HOTEL_TEMPSENSOR = jQuery.extend(true, {}, HOTEL_SENSORFCUPAIRING);
	
	//remove selected li in both lists
	$('#multihotel #hotel-pairing #screen-list .list li').removeClass('selected');
	$('#multihotel #hotel-pairing #pnt-select .list li').removeClass('selected');

	//close pop up menu
	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #hotel-pairing').hide();
});

$(document).on('click','#multihotel #hotel-main #delay',function(e) {
	if($('#multihotel #hotel-main').attr('reject') == 'true') return;	

	var keycardoutdelay = HOTEL_LIST.keycardoutdelay;
	if(keycardoutdelay == '' || keycardoutdelay == null) keycardoutdelay = 0; 
	$('#multihotel #hotel-delay #keycardoutdelay').val(keycardoutdelay);
	
	var windowopendelay = HOTEL_LIST.windowopendelay;
	if(windowopendelay == '' || windowopendelay == null) windowopendelay = 0;
	$('#multihotel #hotel-delay #windowopendelay').val(windowopendelay);
	
	var checkoutdelay = HOTEL_LIST.checkoutdelay;
	if(checkoutdelay == '' || checkoutdelay == null) checkoutdelay = 0;
	$('#multihotel #hotel-delay #checkoutdelay').val(checkoutdelay);
	
	//check if checkin signal exist, if not, hide checkoutdelay
	
	$('#multihotel #hotel-main').attr('reject',true);
	$('#multihotel #hotel-delay').show();
});

$(document).on('click','#multihotel #hotel-delay #save',function(e) {
	HOTEL_LIST.keycardoutdelay = $('#multihotel #hotel-delay #keycardoutdelay').val();
	HOTEL_LIST.windowopendelay = $('#multihotel #hotel-delay #windowopendelay').val();
	HOTEL_LIST.checkoutdelay = $('#multihotel #hotel-delay #checkoutdelay').val();

	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #hotel-delay').hide();
});

$(document).on('click','#multihotel #hotel-delay #cancel',function(e) {
	var keycardoutdelay = HOTEL_LIST.keycardoutdelay;
	$('#multihotel #hotel-delay #keycardoutdelay').val(keycardoutdelay);
	
	var windowopendelay = HOTEL_LIST.windowopendelay;
	$('#multihotel #hotel-delay #windowopendelay').val(windowopendelay);
	
	var checkoutdelay = HOTEL_LIST.checkoutdelay;
	$('#multihotel #hotel-delay #checkoutdelay').val(checkoutdelay);

	$('#multihotel #hotel-main').attr('reject',false);
	$('#multihotel #hotel-delay').hide();
});

function populatePointTypeTable(pointTypeInfo) {
	//reset pointtypetable
	$('#multihotel #room-detail #pointtypetable tbody').remove();
	$('#multihotel #room-detail #pointtypetable').append('<tbody class="tbody"></tbody>');
	
	//Door Sensor list
	$('#multihotel #room-detail #screen-list .list').html('');
	
	//FCU list
	$('#multihotel #room-detail #pnt-select .list').html('');
	
	if (!jQuery.isEmptyObject(pointTypeInfo)) {
		for(var i in pointTypeInfo) {													//populate pointtype list in room details.
			var line = '<tr><td class="poname">';
			line += POINT_LIST[i].info.name;
			line += '</td><td class="ptype mls" param="';
			line += pointTypeInfo[i];
			line += '" id="';
			line += i;
			line += '">';
			line += pointTypeInfo[i];
			line += '</td></tr>';
			
			$('#multihotel #room-detail #pointtypetable').append(line);
			
			////////////////////////////////////////////////////////////////////////////////////
			if(pointTypeInfo[i] == 'hotelsensor') {										//Only hotelsensor points
				var line = '<li id="';
				line += i;																//Point ID as ID
				line += '">';
				line += POINT_LIST[i].info.name;										//Point Name for display
				line += '</li>';
				
				$('#multihotel #room-detail #screen-list .list').append(line);
			}
			
			////////////////////////////////////////////////////////////////////////////////////
			if(pointTypeInfo[i] == 'hotelfcu') {										//Only load Fcu points in selected room
				var line = '<li id="';
				line += i;																//Point ID as ID
				line += '">';
				line += POINT_LIST[i].info.name;										//Point Name for display
				line += '</li>';
				
				$('#multihotel #room-detail #pnt-select .list').append(line);
			}
		}
	}
	
	setMultiLang('body .mls');
}

function setPointListH() {
	$('#multihotel .contents-area .point-select .list').html('');
	for(var i in POINT_LIST) {
		if(POINT_LIST[i].info.type == 'Di') {
			var name = POINT_LIST[i].info.name;
			$('#multihotel .contents-area .point-select .list').append('<li id="'+i+'" ptype="hotelothers">'+name+'</li>');
		}
		
		if(POINT_LIST[i].info.type == 'Fcu') {
			var name = POINT_LIST[i].info.name;
			$('#multihotel .contents-area .point-select .list').append('<li id="'+i+'" ptype="hotelfcu">'+name+'</li>');
		}
	}
}

function setSelectedPointH(id_list) {
	$('#multihotel .contents-area .point-select .list li').removeClass('selected');

	$.each(id_list, function( key, value ) {
		$('#multihotel .contents-area .point-select .list li#'+key).addClass('selected');
		$('#multihotel .contents-area .point-select .list li#'+key).attr('ptype', value);
	});
}
/*
function getSelected() {
	var point = $('#multihotel .contents-area .point-select .list .selected');
	var id_list = [];
	for(var i = 0; i < point.length; i++) {
		id_list.push($(point[i]).attr('id'));
	}
	return id_list;
}
*/
function getselectedpointdetails(roomname) {
	var TEMP_ROOM_DETAILS_TYPE = {};
	
	var point = $('#multihotel .contents-area .point-select .list .selected');
	
	for(var i = 0; i < point.length; i++) {
		TEMP_ROOM_DETAILS_TYPE[$(point[i]).attr('id')] = $(point[i]).attr('ptype');
	}
	
	return TEMP_ROOM_DETAILS_TYPE;
}

function getMultiHotel() {
	var command = ['get_hotel'];
	COMM_PORT.send(command);
	
	var command1 = ['get_room_details'];
	COMM_PORT.send(command1);
	return true;
}

function saveMultiHotel() {
	var command = ['save_hotel',HOTEL_LIST];
	COMM_PORT.send(command);
	
	var command1 = ['save_room_details',ROOM_DETAILS];
	COMM_PORT.send(command1);
	
	return true;
}

function setRoomListView() {
	$('#multihotel #hotel-main #pointtypetable tbody').remove();
	$('#multihotel #hotel-main #pointtypetable').append('<tbody class="tbody"></tbody>');
	
	$('#multihotel #room-detail #pointtypetable tbody').remove();
	$('#multihotel #room-detail #pointtypetable').append('<tbody class="tbody"></tbody>');
	
	$('#multihotel #room-detail #roomname').val('');
	$('#multihotel #room-detail #roomname').attr('roomname','');
	
	//Door Sensor list
	$('#multihotel #room-detail #screen-list .list').html('');
	
	//FCU list
	$('#multihotel #room-detail #pnt-select .list').html('');
	
	if (jQuery.isEmptyObject(ROOM_DETAILS) == false) {
		var rooms = ROOM_DETAILS;
		
		$.each(rooms, function(key, val){
			var checkin = '';
			var keycard = '';
			var sensor = [];
			var fcu = [];
		
			$.each(val.type, function(subindex, subvalue) {
				switch(subvalue) {
					case 'hotelcheckin':
						checkin = POINT_LIST[subindex].info.name;
						break;
					case 'hotelkeycard':
						keycard = POINT_LIST[subindex].info.name;
						break;
					case 'hotelsensor':
						sensor.push(POINT_LIST[subindex].info.name);
						break;
					case 'hotelfcu':
						fcu.push(POINT_LIST[subindex].info.name);
						break;	
				}
			});
			
			var line = '<tr><td class="roomname" id="' + key + '">';
			line += key;
			line += '</td><td class="checkin">';
			line += checkin;
			line += '</td><td class="keycard">';
			line += keycard;															//display keycardDI name
			line += '</td><td class="window">';
			line += sensor;																//display window sensorDI name
			line += '</td><td class="fcu">';
			line += fcu;																//display FCU name
			line += '</td></tr>';
			
			$('#multihotel #hotel-main #pointtypetable').append(line);
		});
	}
}

function resetMultiHotelScreen() {
	$('#multihotel #hotel-main #pointtypetable tbody').remove();
	$('#multihotel #hotel-main #pointtypetable').append('<tbody class="tbody"></tbody>');
	
	$('#multihotel #room-detail #pointtypetable tbody').remove();
	$('#multihotel #room-detail #pointtypetable').append('<tbody class="tbody"></tbody>');
	
	$('#multihotel #room-detail #roomname').val('');
	$('#multihotel #room-detail #roomname').attr('roomname','');
	
	//Door Sensor list
	$('#multihotel #room-detail #screen-list .list').html('');
	
	//FCU list
	$('#multihotel #room-detail #pnt-select .list').html('');
	
	$('#multihotel #hotel-main .rentedsettings').show();
	$('#multihotel #hotel-delay .nocheckoutsignal').hide();
	$('#multihotel #hotel-main .enablemenu').css('display', 'block');
	$('#multihotel #hotel-main .keycardout #delaylabel').attr('param', 'keycarddelay');
	
	var range = [];																		//set setpoint dropdown list range
	for(var t = 32; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#multihotel #hotel-main #OMSP',range);											//populate default settings setpoint list
	setRange('#multihotel #hotel-main .keycardout #KCSP',range);								//populate keycard out setpoint list
	
	setCoolSbRange('#multihotel #hotel-main #OMSB');											//populate default settings setback list
	setCoolSbRange('#multihotel #hotel-main .keycardout #KCSB');								//populate keycard out setback list
	
	$('#multihotel #hotel-main .unrentedsettings #opmodeoff').prop('checked', true);			//reset Unrented Settings Operation Mode (radio)
	$('#multihotel #hotel-main .rentedsettings #opmodeoff').prop('checked', true);			//reset Rented Settings Operation Mode (radio)
	
	$('#multihotel #hotel-main .unrentedsettings #unrentedsetback').text('---');
	$('#multihotel #hotel-main .unrentedsettings #OMSB').find('#r---').addClass('selected');
	
	$('#multihotel #hotel-main .unrentedsettings #unrentedsetpoint').text('22.0');
	$('#multihotel #hotel-main .unrentedsettings #OMSP').find('#r220').addClass('selected');
	
	$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png'); 
	$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','L');
	
	$('#multihotel #hotel-main .rentedsettings #rentedsetback').text('---');	
	$('#multihotel #hotel-main .rentedsettings #OMSB').find('#r---').addClass('selected');
	
	$('#multihotel #hotel-main .rentedsettings #setpoint').text('22.0');
	$('#multihotel #hotel-main .rentedsettings #OMSP').find('#r220').addClass('selected');
	
	$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png');
	$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','L');
	
	$('#multihotel #hotel-main .keycardout #keycardoff').prop('checked', true);				//reset Keycard Out mode (radio)
	
	$('#multihotel #hotel-main .keycardout #setback').text('---');							//reset Keycard Out Setback value
	$('#multihotel #hotel-main .keycardout #KCSB').find('#r---').addClass('selected');
	
	$('#multihotel #hotel-main .keycardout #setpoint').text('22.0');							//reset Keycard Out Setpoint value
	$('#multihotel #hotel-main .keycardout #KCSP').find('#r220').addClass('selected');
	
	$('#multihotel #hotel-main .keycardout .slide .disable').removeClass('hide');			//reset Keycard Out Fanstep Low slide
	$('#multihotel #hotel-main .keycardout .slide .enable').addClass('hide');
	
	$('#multihotel #hotel-main .windowopen .slide .disable').removeClass('hide');			//reset Window Open Off FCU slide
	$('#multihotel #hotel-main .windowopen .slide .enable').addClass('hide');
	
	$('#multihotel #hotel-main .remotecontrol .slide .disable').removeClass('hide');			//reset remote control block slide
	$('#multihotel #hotel-main .remotecontrol .slide .enable').addClass('hide');
	
	//Door Sensor list
	$('#multihotel #hotel-pairing #screen-list .list').html('');
	
	//FCU list
	$('#multihotel #hotel-pairing #pnt-select .list').html('');
	
	//Devices Delay
	$('#multihotel #hotel-delay #keycardoutdelay').val(0);
	$('#multihotel #hotel-delay #windowopendelay').val(0);
	$('#multihotel #hotel-delay #checkoutdelay').val(0);
}

function setMultiHotelScreen() {
	
	setRoomListView();
	
	if (jQuery.isEmptyObject(HOTEL_LIST) == false) {		
		var unrentedopMode = HOTEL_LIST.unrentedopMode;
		$('#multihotel #hotel-main .unrentedsettings #' + unrentedopMode).prop('checked', true);
		
		var unrentedOMSB = HOTEL_LIST.unrentedOMSB;
		$('#multihotel #hotel-main .unrentedsettings #unrentedsetback').text(unrentedOMSB);
		$('#multihotel #hotel-main .unrentedsettings #OMSB li').removeClass('selected');
		if(unrentedOMSB == '---') $('#multihotel #hotel-main .unrentedsettings #OMSB').find('#r---').addClass('selected');
		else $('#multihotel #hotel-main .unrentedsettings #OMSB').find('#r'+unrentedOMSB*10).addClass('selected');
		
		var unrentedOMSP = HOTEL_LIST.unrentedOMSP;
		$('#multihotel #hotel-main .unrentedsettings #unrentedsetpoint').text(unrentedOMSP);
		$('#multihotel #hotel-main .unrentedsettings #OMSP li').removeClass('selected');
		$('#multihotel #hotel-main .unrentedsettings #OMSP').find('#r'+unrentedOMSP*10).addClass('selected');
		
		var unrentedfanstep = HOTEL_LIST.unrentedfanstep;
		if(unrentedfanstep == 'L') {
			$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png');
			$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','L');
		} else if(unrentedfanstep == 'M') {
			$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-3.png');
			$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','M');
		} else if(unrentedfanstep == 'H') {
			$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-5.png');
			$('#multihotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','H');
		}
		
		var rentedopMode = HOTEL_LIST.rentedopMode;
		$('#multihotel #hotel-main .rentedsettings #' + rentedopMode).prop('checked', true);
		
		var rentedOMSB = HOTEL_LIST.rentedOMSB;
		$('#multihotel #hotel-main .rentedsettings #rentedsetback').text(rentedOMSB);
		$('#multihotel #hotel-main .rentedsettings #OMSB li').removeClass('selected');
		if(rentedOMSB == '---') $('#multihotel #hotel-main .rentedsettings #OMSB').find('#r---').addClass('selected');
		else $('#multihotel #hotel-main .rentedsettings #OMSB').find('#r'+rentedOMSB*10).addClass('selected');
		
		var rentedOMSP = HOTEL_LIST.rentedOMSP;
		$('#multihotel #hotel-main .rentedsettings #rentedsetpoint').text(rentedOMSP);
		$('#multihotel #hotel-main .rentedsettings #OMSP li').removeClass('selected');
		$('#multihotel #hotel-main .rentedsettings #OMSP').find('#r'+rentedOMSP*10).addClass('selected');
		
		var rentedfanstep = HOTEL_LIST.rentedfanstep;
		if(rentedfanstep == 'L') {
			$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png');
			$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','L');
		} else if(rentedfanstep == 'M') {
			$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-3.png');
			$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','M');
		} else if(rentedfanstep == 'H') {
			$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-5.png');
			$('#multihotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','H');
		}
		
		var kcMode = HOTEL_LIST.kcMode;
		$('#multihotel #hotel-main .keycardout #' + kcMode).prop('checked', true);				//reset Keycard Out mode (radio)
		
		var KCSB = HOTEL_LIST.KCSB;
		$('#multihotel #hotel-main .keycardout #setback').text(KCSB);
		$('#multihotel #hotel-main .keycardout #KCSB li').removeClass('selected');
		if(KCSB == '---') $('#multihotel #hotel-main .keycardout #KCSB').find('#r---').addClass('selected');
		else $('#multihotel #hotel-main .keycardout #KCSB').find('#r'+KCSB*10).addClass('selected');
		
		var KCSP = HOTEL_LIST.KCSP;
		$('#multihotel #hotel-main .keycardout #setpoint').text(KCSP);
		$('#multihotel #hotel-main .keycardout #KCSP li').removeClass('selected');
		$('#multihotel #hotel-main .keycardout #KCSP').find('#r'+KCSP*10).addClass('selected');
		
		var FSL = HOTEL_LIST.FSL;
		if(FSL == true || FSL == 'true') {
			$('#multihotel #hotel-main .keycardout .slide .disable').addClass('hide');
			$('#multihotel #hotel-main .keycardout .slide .enable').removeClass('hide');
		} else {
			$('#multihotel #hotel-main .keycardout .slide .disable').removeClass('hide');
			$('#multihotel #hotel-main .keycardout .slide .enable').addClass('hide');
		}	
		
		var offFCU = HOTEL_LIST.offFCU; 
		if(offFCU == true || offFCU == 'true') {
			$('#multihotel #hotel-main .windowopen .slide .disable').addClass('hide');
			$('#multihotel #hotel-main .windowopen .slide .enable').removeClass('hide');
		} else {
			$('#multihotel #hotel-main .windowopen .slide .disable').removeClass('hide');
			$('#multihotel #hotel-main .windowopen .slide .enable').addClass('hide');
		}
		
		var remotecontrol = HOTEL_LIST.remotecontrol; 
		if(remotecontrol == true || remotecontrol == 'true') {
			$('#multihotel #hotel-main .remotecontrol .slide .disable').addClass('hide');
			$('#multihotel #hotel-main .remotecontrol .slide .enable').removeClass('hide');
		} else {
			$('#multihotel #hotel-main .remotecontrol .slide .disable').removeClass('hide');
			$('#multihotel #hotel-main .remotecontrol .slide .enable').addClass('hide');
		}
		
		setMultiLang('body .mls');
	}
}