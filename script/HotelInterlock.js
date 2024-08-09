//hotel interlock screen event
$(document).on('page_before_show','.screen#hotel',function(e) {	
	resetHotelScreen();
	getHotel();	
});

//Hotel Interlock START
$(document).on('click touchstart','#hotel #hotel-main #pointtypetable .tbody .ptype',function(e) {
	if($('#hotel #hotel-main').attr('reject') == 'true') return;
	
	var type = $(this).attr('param');
	
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
	
	//hide screen components and change CSS START
	$('#hotel #hotel-main .rentedsettings').hide();							//to reset/show rented settings
	$('#hotel #hotel-delay .nocheckoutsignal').show();
	$('#hotel #hotel-main .enablemenu').css('display', 'flex');
	$('#hotel #hotel-main .keycardout #delaylabel').attr('param', 'checkoutdelay');
	
	$('#pointtypetable > tbody  > tr').each(function() {					//check through list and take note of occurrence
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		if(pointType == 'hotelcheckin') {
			$('#hotel #hotel-main .rentedsettings').show();					//hide only if exist in list
			$('#hotel #hotel-delay .nocheckoutsignal').hide();
			$('#hotel #hotel-main .enablemenu').css('display', 'block');
			$('#hotel #hotel-main .keycardout #delaylabel').attr('param', 'keycarddelay');
		}
	});
	//hide screen components and change CSS END
	
	setMultiLang('.mls');
});

$(document).on('click','#hotel #hotel-main #fanstep-btn',function(e) {
	if($('#hotel #hotel-main').attr('reject') == 'true') return;
	
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

$(document).on('click','#hotel #hotel-main #save',function(e) {
	if($('#hotel #hotel-main').attr('reject') == 'true') return;
	
	HOTEL_LIST.type = {};
	$('#pointtypetable > tbody  > tr').each(function() {		
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		if(pointType != 'hotelothers') HOTEL_LIST.type[pointID] = pointType;			//only save points if 'pointType' is not 'hotelothers'
	});
	
	HOTEL_LIST.unrentedopMode = $('input[name=opmode]:checked').attr('id');
	HOTEL_LIST.unrentedOMSB = $('#hotel #hotel-main .unrentedsettings #unrentedsetback').text();
	HOTEL_LIST.unrentedOMSP = $('#hotel #hotel-main .unrentedsettings #unrentedsetpoint').text();
	HOTEL_LIST.unrentedfanstep = $('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep');
	
	HOTEL_LIST.rentedopMode = $('input[name=rentedopmode]:checked').attr('id');
	HOTEL_LIST.rentedOMSB = $('#hotel #hotel-main .rentedsettings #rentedsetback').text();
	HOTEL_LIST.rentedOMSP = $('#hotel #hotel-main .rentedsettings #rentedsetpoint').text();
	HOTEL_LIST.rentedfanstep = $('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep');
	
	HOTEL_LIST.kcMode = $('input[name=keycard]:checked').attr('id');
	HOTEL_LIST.KCSB = $('#hotel #hotel-main .keycardout #setback').text();
	HOTEL_LIST.KCSP = $('#hotel #hotel-main .keycardout #setpoint').text();
	HOTEL_LIST.FSL = $('#hotel #hotel-main .keycardout .slide .disable').hasClass('hide');
	HOTEL_LIST.offFCU = $('#hotel #hotel-main .windowopen .slide .disable').hasClass('hide');
	HOTEL_LIST.remotecontrol = $('#hotel #hotel-main .remotecontrol .slide .disable').hasClass('hide');
	
	var pointType = HOTEL_LIST.type;													 
	var sensorExistFlag = false;
	$.each(pointType, function(key, val){												//Does not save point sensor list if door sensor does not exist
		if(val == 'hotelsensor') sensorExistFlag = true;
	});
	
	if(sensorExistFlag == true) HOTEL_LIST.sensorFCUPairing = HOTEL_SENSORFCUPAIRING; 
	else HOTEL_LIST.sensorFCUPairing = {};
	
	saveHotel();
	
	loadScreen('top_screen.html');
});

$(document).on('click','#hotel #hotel-main #cancel',function(e) {
	if($('#hotel #hotel-main').attr('reject') == 'true') return;
	
	loadScreen('top_screen.html');
});	

$(document).on('click','#hotel #hotel-main #pairing',function(e) {
	if($('#hotel #hotel-main').attr('reject') == 'true') return;
	
	//**Reread pointtype list and determine if there is a door sensor, redraw if door sensor exist, before user click save START**//
	HOTEL_LIST.type = {};
	$('#pointtypetable > tbody  > tr').each(function() {		
		var pointID = $(this).find('.ptype').attr('id');
		var pointType = $(this).find('.ptype').attr('param');
		
		if(pointType != 'hotelothers') HOTEL_LIST.type[pointID] = pointType;			//only save points if 'pointType' is not 'hotelothers'
	});
	
	$('#hotel #hotel-pairing #screen-list .list').html('');								//Door Sensor list reset
	
	$('#hotel #hotel-pairing #pnt-select .list').html('');								//FCU list reset
	
	var pointType = HOTEL_LIST.type;													 
	$.each(pointType, function(key, val){												//redraw hotelsensor in case changed before save
		if(val == 'hotelsensor') {														//Only hotelsensor points for Point Type selection
			var line = '<li id="';
			line += key;																//Point ID as ID
			line += '">';
			line += POINT_LIST[key].info.name;											//Point Name for display
			line += '</li>';
			
			$('#hotel #hotel-pairing #screen-list .list').append(line);
		}
	});
	//**Reread pointtype list and determine if there is a door sensor, redraw if door sensor exist, before user click save END**//
	
	//FCU list
	for(var i in POINT_ID_LIST) {
		if(POINT_LIST[POINT_ID_LIST[i]].info.type == 'Fcu') {							//Only load Fcu points for Point Type selection
			var line = '<li id="';
			line += POINT_ID_LIST[i];													//Point ID as ID
			line += '">';
			line += POINT_LIST[POINT_ID_LIST[i]].info.name;								//Point Name for display
			line += '</li>';
			
			$('#hotel #hotel-pairing #pnt-select .list').append(line);
		}	
	}
	
	HOTEL_TEMPSENSOR = jQuery.extend(true, {}, HOTEL_SENSORFCUPAIRING);
	
	$('#hotel #hotel-main').attr('reject',true);
	$('#hotel #hotel-pairing').show();
});

$(document).on('click','#hotel #hotel-pairing #screen-list li',function(e) {
	$('#hotel #hotel-pairing #pnt-select .list li').removeClass('selected');
	var sid = $(this).attr('id');
	
	if (jQuery.isEmptyObject(HOTEL_TEMPSENSOR) == false) {	
		$.each(HOTEL_TEMPSENSOR, function(sensorPID,pid_list) {
			if (sid == sensorPID){
				for(var i in pid_list) {
					var id = pid_list[i];
					$('#hotel #hotel-pairing #pnt-select .list li#'+id).addClass('selected');
				}
			}
		});
	}
});	

$(document).on('click','#hotel #hotel-pairing #pnt-select li',function(e) {
	var sensorPID = ($('#hotel #hotel-pairing #screen-list .list .selected')).attr('id');
	if (jQuery.isEmptyObject(sensorPID)) return;												//return if no SENSOR is selected
	
	var pid_list = [];

	var points = $('#hotel #hotel-pairing #pnt-select .list .selected');						//go through list to find all selected FCU
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

$(document).on('click','#hotel #hotel-pairing #save',function(e) {		
	HOTEL_SENSORFCUPAIRING = HOTEL_TEMPSENSOR;
	
	//remove selected li in both lists
	$('#hotel #hotel-pairing #screen-list .list li').removeClass('selected');
	$('#hotel #hotel-pairing #pnt-select .list li').removeClass('selected');
	
	//close pop up menu
	$('#hotel #hotel-main').attr('reject',false);
	$('#hotel #hotel-pairing').hide();
});	

$(document).on('click','#hotel #hotel-pairing #cancel',function(e) {
	HOTEL_TEMPSENSOR = jQuery.extend(true, {}, HOTEL_SENSORFCUPAIRING);
	
	//remove selected li in both lists
	$('#hotel #hotel-pairing #screen-list .list li').removeClass('selected');
	$('#hotel #hotel-pairing #pnt-select .list li').removeClass('selected');

	//close pop up menu
	$('#hotel #hotel-main').attr('reject',false);
	$('#hotel #hotel-pairing').hide();
});

$(document).on('click','#hotel #hotel-main #delay',function(e) {
	if($('#hotel #hotel-main').attr('reject') == 'true') return;	

	var keycardoutdelay = HOTEL_LIST.keycardoutdelay;
	if(keycardoutdelay == '' || keycardoutdelay == null) keycardoutdelay = 0; 
	$('#hotel #hotel-delay #keycardoutdelay').val(keycardoutdelay);
	
	var windowopendelay = HOTEL_LIST.windowopendelay;
	if(windowopendelay == '' || windowopendelay == null) windowopendelay = 0;
	$('#hotel #hotel-delay #windowopendelay').val(windowopendelay);
	
	var checkoutdelay = HOTEL_LIST.checkoutdelay;
	if(checkoutdelay == '' || checkoutdelay == null) checkoutdelay = 0;
	$('#hotel #hotel-delay #checkoutdelay').val(checkoutdelay);
	
	//check if checkin signal exist, if not, hide checkoutdelay
	
	$('#hotel #hotel-main').attr('reject',true);
	$('#hotel #hotel-delay').show();
});

$(document).on('click','#hotel #hotel-delay #save',function(e) {
	HOTEL_LIST.keycardoutdelay = $('#hotel #hotel-delay #keycardoutdelay').val();
	HOTEL_LIST.windowopendelay = $('#hotel #hotel-delay #windowopendelay').val();
	HOTEL_LIST.checkoutdelay = $('#hotel #hotel-delay #checkoutdelay').val();

	$('#hotel #hotel-main').attr('reject',false);
	$('#hotel #hotel-delay').hide();
});

$(document).on('click','#hotel #hotel-delay #cancel',function(e) {
	var keycardoutdelay = HOTEL_LIST.keycardoutdelay;
	$('#hotel #hotel-delay #keycardoutdelay').val(keycardoutdelay);
	
	var windowopendelay = HOTEL_LIST.windowopendelay;
	$('#hotel #hotel-delay #windowopendelay').val(windowopendelay);
	
	var checkoutdelay = HOTEL_LIST.checkoutdelay;
	$('#hotel #hotel-delay #checkoutdelay').val(checkoutdelay);

	$('#hotel #hotel-main').attr('reject',false);
	$('#hotel #hotel-delay').hide();
});

function getHotel() {
	var command = ['get_hotel'];
	COMM_PORT.send(command);
	return true;
}

function saveHotel() {
	var command = ['save_hotel',HOTEL_LIST];
	COMM_PORT.send(command);
	return true;
}

function resetHotelScreen() {
	
	$('#hotel #hotel-main #pointtypetable tbody').remove();
	
	$('#hotel #hotel-main #pointtypetable').append('<tbody class="tbody">');
	
	for(var i in POINT_ID_LIST) {
		if(POINT_LIST[POINT_ID_LIST[i]].info.type == 'Di') {							//Only load Di points for Point Type selection
			var line = '<tr><td class="poname">';
			line += POINT_LIST[POINT_ID_LIST[i]].info.name;								//Point Name
			line += '</td><td class="ptype mls" param="hotelothers" id="';				//Set default point type to 'hotelothers'
			line += POINT_ID_LIST[i]
			line += '"></td></tr>';
			
			$('#hotel #hotel-main #pointtypetable').append(line);
		}	
	}
	
	$('#hotel #hotel-main #pointtypetable').append('</tbody>');
	
	$('#hotel #hotel-main .rentedsettings').hide();										//to reset/show rented settings
	$('#hotel #hotel-delay .nocheckoutsignal').show();
	$('#hotel #hotel-main .enablemenu').css('display', 'flex');
	$('#hotel #hotel-main .keycardout #delaylabel').attr('param', 'checkoutdelay');
	
	var range = [];																		//set setpoint dropdown list range
	for(var t = 32; t >= 16; t-=0.5) {
		range.push(t.toFixed(1));
	}
	setRange('#hotel #hotel-main #OMSP',range);											//populate default settings setpoint list
	setRange('#hotel #hotel-main .keycardout #KCSP',range);								//populate keycard out setpoint list
	
	setCoolSbRange('#hotel #hotel-main #OMSB');											//populate default settings setback list
	setCoolSbRange('#hotel #hotel-main .keycardout #KCSB');								//populate keycard out setback list
	
	$('#hotel #hotel-main .unrentedsettings #opmodeoff').prop('checked', true);			//reset Unrented Settings Operation Mode (radio)
	$('#hotel #hotel-main .rentedsettings #opmodeoff').prop('checked', true);			//reset Rented Settings Operation Mode (radio)
	
	$('#hotel #hotel-main .unrentedsettings #unrentedsetback').text('---');
	$('#hotel #hotel-main .unrentedsettings #OMSB').find('#r---').addClass('selected');
	
	$('#hotel #hotel-main .unrentedsettings #unrentedsetpoint').text('22.0');
	$('#hotel #hotel-main .unrentedsettings #OMSP').find('#r220').addClass('selected');
	
	$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png'); 
	$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','L');
	
	$('#hotel #hotel-main .rentedsettings #rentedsetback').text('---');	
	$('#hotel #hotel-main .rentedsettings #OMSB').find('#r---').addClass('selected');
	
	$('#hotel #hotel-main .rentedsettings #setpoint').text('22.0');
	$('#hotel #hotel-main .rentedsettings #OMSP').find('#r220').addClass('selected');
	
	$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png');
	$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','L');
	
	$('#hotel #hotel-main .keycardout #keycardoff').prop('checked', true);				//reset Keycard Out mode (radio)
	
	$('#hotel #hotel-main .keycardout #setback').text('---');							//reset Keycard Out Setback value
	$('#hotel #hotel-main .keycardout #KCSB').find('#r---').addClass('selected');
	
	$('#hotel #hotel-main .keycardout #setpoint').text('22.0');							//reset Keycard Out Setpoint value
	$('#hotel #hotel-main .keycardout #KCSP').find('#r220').addClass('selected');
	
	$('#hotel #hotel-main .keycardout .slide .disable').removeClass('hide');			//reset Keycard Out Fanstep Low slide
	$('#hotel #hotel-main .keycardout .slide .enable').addClass('hide');
	
	$('#hotel #hotel-main .windowopen .slide .disable').removeClass('hide');			//reset Window Open Off FCU slide
	$('#hotel #hotel-main .windowopen .slide .enable').addClass('hide');
	
	$('#hotel #hotel-main .remotecontrol .slide .disable').removeClass('hide');			//reset remote control block slide
	$('#hotel #hotel-main .remotecontrol .slide .enable').addClass('hide');
	
	//Door Sensor list
	$('#hotel #hotel-pairing #screen-list .list').html('');
	
	//FCU list
	$('#hotel #hotel-pairing #pnt-select .list').html('');
	
	//Devices Delay
	$('#hotel #hotel-delay #keycardoutdelay').val(0);
	$('#hotel #hotel-delay #windowopendelay').val(0);
	$('#hotel #hotel-delay #checkoutdelay').val(0);
}

function setHotelScreen() {
		
	if (jQuery.isEmptyObject(HOTEL_LIST) == false) {	
		var pointType = HOTEL_LIST.type;
		$.each(pointType, function(key, val){	
			$('#hotel #hotel-main #pointtypetable #' + key).attr('param',val);
		});
		
		$('#pointtypetable > tbody  > tr').each(function() {							//check through list and take note of occurrence
			var pointID = $(this).find('.ptype').attr('id');
			var pointType = $(this).find('.ptype').attr('param');
			
			if(pointType == 'hotelcheckin') {
				$('#hotel #hotel-main .rentedsettings').show();							//hide only if exist in list
				$('#hotel #hotel-delay .nocheckoutsignal').hide();
				$('#hotel #hotel-main .enablemenu').css('display', 'block');
				$('#hotel #hotel-main .keycardout #delaylabel').attr('param', 'keycarddelay');
			}
		});
		
		var unrentedopMode = HOTEL_LIST.unrentedopMode;
		$('#hotel #hotel-main .unrentedsettings #' + unrentedopMode).prop('checked', true);
		
		var unrentedOMSB = HOTEL_LIST.unrentedOMSB;
		$('#hotel #hotel-main .unrentedsettings #unrentedsetback').text(unrentedOMSB);
		$('#hotel #hotel-main .unrentedsettings #OMSB li').removeClass('selected');
		if(unrentedOMSB == '---') $('#hotel #hotel-main .unrentedsettings #OMSB').find('#r---').addClass('selected');
		else $('#hotel #hotel-main .unrentedsettings #OMSB').find('#r'+unrentedOMSB*10).addClass('selected');
		
		var unrentedOMSP = HOTEL_LIST.unrentedOMSP;
		$('#hotel #hotel-main .unrentedsettings #unrentedsetpoint').text(unrentedOMSP);
		$('#hotel #hotel-main .unrentedsettings #OMSP li').removeClass('selected');
		$('#hotel #hotel-main .unrentedsettings #OMSP').find('#r'+unrentedOMSP*10).addClass('selected');
		
		var unrentedfanstep = HOTEL_LIST.unrentedfanstep;
		if(unrentedfanstep == 'L') {
			$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png');
			$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','L');
		} else if(unrentedfanstep == 'M') {
			$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-3.png');
			$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','M');
		} else if(unrentedfanstep == 'H') {
			$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('src','image/fanstep3-5.png');
			$('#hotel #hotel-main .unrentedsettings #fanstep-btn').attr('fanstep','H');
		}
		
		var rentedopMode = HOTEL_LIST.rentedopMode;
		$('#hotel #hotel-main .rentedsettings #' + rentedopMode).prop('checked', true);
		
		var rentedOMSB = HOTEL_LIST.rentedOMSB;
		$('#hotel #hotel-main .rentedsettings #rentedsetback').text(rentedOMSB);
		$('#hotel #hotel-main .rentedsettings #OMSB li').removeClass('selected');
		if(rentedOMSB == '---') $('#hotel #hotel-main .rentedsettings #OMSB').find('#r---').addClass('selected');
		else $('#hotel #hotel-main .rentedsettings #OMSB').find('#r'+rentedOMSB*10).addClass('selected');
		
		var rentedOMSP = HOTEL_LIST.rentedOMSP;
		$('#hotel #hotel-main .rentedsettings #rentedsetpoint').text(rentedOMSP);
		$('#hotel #hotel-main .rentedsettings #OMSP li').removeClass('selected');
		$('#hotel #hotel-main .rentedsettings #OMSP').find('#r'+rentedOMSP*10).addClass('selected');
		
		var rentedfanstep = HOTEL_LIST.rentedfanstep;
		if(rentedfanstep == 'L') {
			$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-1.png');
			$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','L');
		} else if(rentedfanstep == 'M') {
			$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-3.png');
			$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','M');
		} else if(rentedfanstep == 'H') {
			$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('src','image/fanstep3-5.png');
			$('#hotel #hotel-main .rentedsettings #fanstep-btn').attr('fanstep','H');
		}
		
		var kcMode = HOTEL_LIST.kcMode;
		$('#hotel #hotel-main .keycardout #' + kcMode).prop('checked', true);				//reset Keycard Out mode (radio)
		
		var KCSB = HOTEL_LIST.KCSB;
		$('#hotel #hotel-main .keycardout #setback').text(KCSB);
		$('#hotel #hotel-main .keycardout #KCSB li').removeClass('selected');
		if(KCSB == '---') $('#hotel #hotel-main .keycardout #KCSB').find('#r---').addClass('selected');
		else $('#hotel #hotel-main .keycardout #KCSB').find('#r'+KCSB*10).addClass('selected');
		
		var KCSP = HOTEL_LIST.KCSP;
		$('#hotel #hotel-main .keycardout #setpoint').text(KCSP);
		$('#hotel #hotel-main .keycardout #KCSP li').removeClass('selected');
		$('#hotel #hotel-main .keycardout #KCSP').find('#r'+KCSP*10).addClass('selected');
		
		var FSL = HOTEL_LIST.FSL;
		if(FSL == true || FSL == 'true') {
			$('#hotel #hotel-main .keycardout .slide .disable').addClass('hide');
			$('#hotel #hotel-main .keycardout .slide .enable').removeClass('hide');
		} else {
			$('#hotel #hotel-main .keycardout .slide .disable').removeClass('hide');
			$('#hotel #hotel-main .keycardout .slide .enable').addClass('hide');
		}	
		
		var offFCU = HOTEL_LIST.offFCU; 
		if(offFCU == true || offFCU == 'true') {
			$('#hotel #hotel-main .windowopen .slide .disable').addClass('hide');
			$('#hotel #hotel-main .windowopen .slide .enable').removeClass('hide');
		} else {
			$('#hotel #hotel-main .windowopen .slide .disable').removeClass('hide');
			$('#hotel #hotel-main .windowopen .slide .enable').addClass('hide');
		}
		
		var remotecontrol = HOTEL_LIST.remotecontrol; 
		if(remotecontrol == true || remotecontrol == 'true') {
			$('#hotel #hotel-main .remotecontrol .slide .disable').addClass('hide');
			$('#hotel #hotel-main .remotecontrol .slide .enable').removeClass('hide');
		} else {
			$('#hotel #hotel-main .remotecontrol .slide .disable').removeClass('hide');
			$('#hotel #hotel-main .remotecontrol .slide .enable').addClass('hide');
		}
		
		HOTEL_SENSORFCUPAIRING = jQuery.extend(true, {}, HOTEL_LIST.sensorFCUPairing);
		
		//FCU list
		for(var i in POINT_ID_LIST) {
			if(POINT_LIST[POINT_ID_LIST[i]].info.type == 'Fcu') {							//Only load Fcu points for Point Type selection
				var line = '<li id="';
				line += POINT_ID_LIST[i];													//Point ID as ID
				line += '">';
				line += POINT_LIST[POINT_ID_LIST[i]].info.name;								//Point Name for display
				line += '</li>';
				
				$('#hotel #hotel-pairing #pnt-select .list').append(line);
			}	
		}
		
		setMultiLang('body .mls');
	}
}