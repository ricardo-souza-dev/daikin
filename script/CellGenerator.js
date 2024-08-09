// Point cell generator
function cellGenerator(point) {
	switch(point.info.type) {
		case 'Fcu':
		case 'Ahu':
			return fcuCell(point.info.id,point.info.name,point.info.icon);
		case 'Vam':
			return vamCell(point.info.id,point.info.name,point.info.icon);
		case 'Di':
		case 'Dio':
			return dioCell(point.info.id,point.info.name,point.info.icon);
		case 'Ai':
		case 'Ao':
			return aiCell(point.info.id,point.info.name,point.info.icon);
		case 'Msi':
		case 'Mso':
			return msiCell(point.info.id,point.info.name,point.info.icon);
		case 'Pi':
			return piCell(point.info.id,point.info.name,point.info.icon);
		case 'SPi':
			return spiCell(point.info.id,point.info.name,point.info.icon);
		case 'LevelSw':
		case 'RgbLevel':
			return lswCell(point.info.id,point.info.name,point.info.icon);
		case 'KeyLock':
			return lockCell(point.info.id,point.info.name,point.info.icon);
		case 'Shutter':
			return shutterCell(point.info.id,point.info.name,point.info.icon);
		case 'Ir':
			return irCell(point.info.id,point.info.name,point.info.icon);
		case 'EmbAHU':
			return embAHUCell(point.info.id,point.info.name,point.info.icon);
		case 'FcuMq':
			return fcuMqCell(point.info.id,point.info.name,point.info.icon);
	}
}
// Point status setter
function cellStatus(point) {
	if(point.info == null) return;
	if(point.stat == null) return;
	if(point.stat.com_stat == false) {
		$('#'+point.info.id).addClass('com_err');
		point.stat.stat = 'err';
		return;
	}
	else {
		$('#'+point.info.id).removeClass('com_err');
	}

	switch(point.info.type) {
		case 'Fcu':
		case 'Ahu':
			setFcuStatus(point);
			break;
		case 'Vam':
			setVamStatus(point);
			break;
		case 'Di':
		case 'Dio':
		case 'Shutter':
			setDioStatus(point);
			break;
		case 'KeyLock':
			setLockStatus(point);
			break;
		case 'Ai':
		case 'Ao':
			setAiStatus(point);
			break;
		case 'Msi':
		case 'Mso':
			setMsiStatus(point);
			break;
		case 'Pi':
			setPiStatus(point);
			break;
		case 'SPi':
			setSPiStatus(point);
			break;
		case 'LevelSw':
		case 'RgbLevel':
			setLevelSwStatus(point);
			break;
		case 'EmbAHU':
			setEmbAhuStatus(point);
			break;
		case 'FcuMq':
			setFcuMqStatus(point);
			break;
	}
}
// FCU status setter
function setFcuStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;
	// status
	setStatusCell(id,point.stat.stat,point.info.icon);
	// chmaster
	setChMaster(id,point.stat.ch_master);
	// filter
	setFilter(id,point.stat.filter);
	// error
	setError(id,point.stat.error,point.stat.err_code);
	// operation condition
	setOpCondition(id,point.stat.actual_mode,point.stat.sb_stat);
	// mode
	setFcuMode(id,point.stat.mode);
	// fanstep
	if(point.info.attr.fanstep_cap && point.stat.fanstep != null) setFanstep(id,point.info.attr.fansteps,point.stat.fanstep);
	// flap
	if(point.info.attr.flap_cap && point.stat.flap != null) setFlap(id,point.stat.flap);
	// flap2
	if(point.info.attr.flap2_cap && point.stat.flap2 != null) setFlap2(id,point.stat.flap2);
	// off-timer
	setOffTimer(id,point.stat.off_timer);
	// setpoint
	var sp = point.stat.csp;
	if(point.stat.mode == 'heat') sp = point.stat.hsp;
	else if(point.stat.mode == 'auto' && point.stat.actual_mode == 'heat') sp = point.stat.hsp;
	setSpCell(id,point.stat.mode,point.stat.actual_mode,sp);
	// temperature
	setTemp(id,point.stat.temp,point.stat.mode);
}
// VAM status setter
function setVamStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// status
	setStatusCell(id,point.stat.stat,point.info.icon);
	// filter
	setFilter(id,point.stat.filter);
	// error
	setError(id,point.stat.error,point.stat.err_code);
	// mode
	if(point.info.attr.vmode_cap && point.stat.vmode != null) setVamMode(id,point.stat.vmode);
	// fanstep
	if(point.info.attr.vamount_cap && point.stat.vamount != null) {
		setFanstep(id,2,point.stat.vamount);
		// freshup
		setFreshup(id,point.stat.fresh_up);
	}
	// off-timer
	setOffTimer(id,point.stat.off_timer);
}
// Dio status setter
function setDioStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// status
	setStatusCell(id,point.stat.stat,point.info.icon);
	// error
	setError(id,point.stat.error);
	// off timer
	setOffTimer(id,point.stat.off_timer);
	// battery status
	setBatteryStatus(id,point.stat.battery);
}
// KeyLock status setter
function setLockStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// status
	setStatusCell(id,point.stat.stat,point.info.icon);
	// error
	setError(id,point.stat.error);
	// battery status
	setBatteryStatus(id,point.stat.battery);
}
// Ai status setter
function setAiStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// error
	setError(id,point.stat.error);
	// value, unit
	setValue(id,point.stat.av,point.info.attr.unit_label);
	// battery status
	setBatteryStatus(id,point.stat.battery);
}
// LevelSwitch Status setter
function setLevelSwStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;
	// status
	setStatusCell(id,point.stat.stat,point.info.icon);
	// error
	setError(id,point.stat.error);
	// off timer
	setOffTimer(id,point.stat.off_timer);
	// value, unit
	setValue(id,point.stat.av,point.info.attr.unit_label);
	// battery status
	setBatteryStatus(id,point.stat.battery);
}

// MSio status setter
function setMsiStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// error
	setError(id,point.stat.error);
	// value
	var stat = point.info.attr.tag[point.stat.ms_val];
	setValue(id,stat);
}
// Pi status setter
function setPiStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// error
	setError(id,point.stat.error);
	// value, unit
	setValue(id,point.stat.meter,point.info.attr.unit_label);
	// battery status
	setBatteryStatus(id,point.stat.battery);
}
// SPi status setter
function setSPiStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// error
	setError(id,point.stat.error);
	// value, unit
	setValue(id,point.stat.meter,point.info.attr.unit_label);
	setSubValue(id,point.stat.power,point.info.attr.sub_unit_label);
}

// EmbAHU setter
function setEmbAhuStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;
	setValue(id,point.stat.av,'%');
	setSubValue(id,point.stat.rpm,'rpm')
}

// McQuay FCU setter
function setFcuMqStatus(point) {
	var id = point.info.id;
	if(point.stat == null) return;

	// status
	setStatusCell(id,point.stat.stat,point.info.icon);
	var fan = point.stat.fanstep & 0xf;
	var val = "Fan:"+point.info.attr.fan_steps[fan];

	setSubValue(id,val,null)
}

// FCU
function fcuCell(id,name,icon) {
	return "<div class='cell fcu' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='icon/"+icon+"'>"+
				"<img class='chmaster hide' src='image/chmaster.png'>"+
				"<img class='filter hide' src='image/filter.png'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<img class='op-cond hide' src='image/csb.png'>"+
				"<div class='info-area'>"+
					"<img class='mode' src='image/cool.png'>"+
					"<img class='fanstep hide' src='image/fanstep3-5.png'>"+
					"<img class='flap hide' src='image/wflap7.png'>"+
					"<img class='flap2 hide' src='image/wvflap7.png'>"+
					"<Img class='off-timer hide' src='image/offtimer-green.png'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='temp-area'>"+
					"<div class='sp'>"+
						"<span class='csp hide'>"+
							"<span class='val'>22</span>.<span class='dp-val'>5</span><span class='unit'>&deg;C</span>"+
						"</span>"+
						"<span class='hsp hide'>"+
							"<span class='val'>22</span>.<span class='dp-val'>5</span><span class='unit'>&deg;C</span>"+
						"</span>"+
					"</div>"+
					"<div class='temp'>"+
						"<img src='image/thermo.png'>"+
						"<span class='val'>--.-</span>"+
						"<span class='unit'>&deg;C</span>"+
					"</div>"+
				"</div>"+
			"</div>"+
		"</div>";
}

// VAM
function vamCell(id,name,icon) {
	return "<div class='cell vam' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='icon/"+icon+"'>"+
				"<img class='filter hide' src='image/filter.png'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
					"<img class='mode' src='image/vm-auto.png'>"+
					"<img class='fanstep' src='image/fanstep2-1.png'>"+
					"<img class='freshup' src='image/normal.png'>"+
					"<Img class='off-timer hide' src='image/offtimer-green.png'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
			"</div>"+
		"</div>";
}
// Di/Dio
function dioCell(id,name,icon) {
	return "<div class='cell dio' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
					"<Img class='off-timer hide' src='image/offtimer-green.png'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='sub-val-area'>"+
				"</div>"+
			"</div>"+
			"<div class='battery'>"+
				"<img src='image/battery.png'>"+
				"<span class='val'>**</span>"+
				"<span class='unit'>%</span>"+
			"</div>"+
		"</div>";
}
// KeyLock
function lockCell(id,name,icon) {
	return "<div class='cell lock' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='sub-val-area'>"+
				"</div>"+
			"</div>"+
			"<div class='battery'>"+
				"<img src='image/battery.png'>"+
				"<span class='val'>**</span>"+
				"<span class='unit'>%</span>"+
			"</div>"+
		"</div>";
}
// Shutter
function shutterCell(id,name,icon) {
	return "<div class='cell shutter' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
			"</div>"+
		"</div>";
}
// IR
function irCell(id,name,icon) {
	return "<div class='cell ir' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
			"</div>"+
		"</div>";
}
// Ai
function aiCell(id,name,icon) {
	return "<div class='cell ai' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
				"<div class='sub-val-area'>"+
				"</div>"+
			"</div>"+
			"<div class='battery'>"+
				"<img src='image/battery.png'>"+
				"<span class='val'>**</span>"+
				"<span class='unit'>%</span>"+
			"</div>"+
		"</div>";
}
// LevelSw
function lswCell(id,name,icon) {
	return "<div class='cell levelsw' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
					"<Img class='off-timer hide' src='image/offtimer-green.png'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
				"<div class='sub-val-area'>"+
				"</div>"+
			"</div>"+
			"<div class='battery'>"+
				"<img src='image/battery.png'>"+
				"<span class='val'>**</span>"+
				"<span class='unit'>%</span>"+
			"</div>"+
		"</div>";
}
// Pi
function piCell(id,name,icon) {
	return "<div class='cell pi' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
				"<div class='sub-val-area'>"+
				"</div>"+
			"</div>"+
			"<div class='battery'>"+
				"<img src='image/battery.png'>"+
				"<span class='val'>**</span>"+
				"<span class='unit'>%</span>"+
			"</div>"+
		"</div>";
}
// SPi
function spiCell(id,name,icon) {
	return "<div class='cell pi' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
				"<div class='sub-val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
			"</div>"+
		"</div>";
}
// MSi/o
function msiCell(id,name,icon) {
	return "<div class='cell msi' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
				"</div>"+
			"</div>"+
		"</div>";
}

// EmbAHU
function embAHUCell(id,name,icon) {
	return "<div class='cell embAhu' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'>%</div>"+
				"</div>"+
				"<div class='sub-val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'>rpm</div>"+
				"</div>"+
			"</div>"+
		"</div>";
}
// FcuMcQuay
function fcuMqCell(id,name,icon) {
	return "<div class='cell fcuMq' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
					"<Img class='off-timer hide' src='image/offtimer-green.png'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='sub-val-area'>"+
					"<div class='val'></div>"+
				"</div>"+
			"</div>"+
		"</div>";
}

// cell control
// on/off status control
function setStatusCell(id,stat,icon) {
	var selecter = '#'+id+' .icon.stat';
	if(stat == 'on') {
		$(selecter).removeClass('off').addClass('on').attr('src','icon/on/'+icon);
	} else {
		$(selecter).removeClass('on').addClass('off').attr('src','icon/'+icon);
	}
}
// FCU mode control
function setFcuMode(id,mode) {
	var selecter = '#'+id+' .info-area .mode';
	if(mode == 'cool') $(selecter).attr('src','image/cool.png');
	else if(mode == 'heat') $(selecter).attr('src','image/heat.png');
	else if(mode == 'dry') $(selecter).attr('src','image/dry.png');
	else if(mode == 'fan') $(selecter).attr('src','image/fan.png');
	else if(mode == 'auto') $(selecter).attr('src','image/auto.png');
}
// Setpoint control
function setSpCell(id,mode,actual_mode,val) {
	var selecter = '#'+id+' .sp';
	var intpart = Math.floor(val);
	var dp = Math.round(val*10)-intpart*10;
	if(mode == 'cool' || (mode == 'auto' && actual_mode == 'cool')) {
		$(selecter).find('.csp').removeClass('hide');
		$(selecter).find('.hsp').addClass('hide');
		$(selecter).find('.csp .val').text(Math.floor(val));
		$(selecter).find('.csp .dp-val').text(dp);
	} else if(mode == 'heat' || (mode == 'auto' && actual_mode == 'heat')) {
		$(selecter).find('.hsp').removeClass('hide');
		$(selecter).find('.csp').addClass('hide');
		$(selecter).find('.hsp .val').text(Math.floor(val));
		$(selecter).find('.hsp .dp-val').text(dp);
	} else {
		$(selecter).find('.csp').addClass('hide');
		$(selecter).find('.hsp').addClass('hide');
		}
}
// Room temp indication 
function setTemp(id,val,mode) {
	if(val == null) return;
	var selecter = '#'+id+' .temp';
	$(selecter).find('.val').text(val.toFixed(1));
	if(mode == 'fan' || mode == 'dry') $(selecter).css('color','black');
	else $(selecter).css('color','white');
}

// Fanstep control
function setFanstep(id,steps,step) {
	var selecter = '#'+id+' .info-area .fanstep';
	$(selecter).attr('src',getFanstepIcon(steps,step));
	$(selecter).removeClass('hide');
}
// Flap control
function setFlap(id,flap) {
	var selecter = '#'+id+' .info-area .flap';
	$(selecter).attr('src',getFlapIcon(flap,POINT_LIST[id].info.attr.flap_steps));
	$(selecter).removeClass('hide');
}
function setFlap2(id,flap) {
	var selecter = '#'+id+' .info-area .flap2';
	$(selecter).attr('src',getFlap2Icon(flap,POINT_LIST[id].info.attr.flap_steps));
	$(selecter).removeClass('hide');
}
// off timer control
function setOffTimer(id,stat) {
	var selecter = '#'+id+' .off-timer';
	if(stat == 'on') $(selecter).removeClass('hide');
	else $(selecter).addClass('hide');
}
// filter sign control
function setFilter(id,filter) {
	var selecter = '#'+id+' .filter';
	if(filter == true) $(selecter).removeClass('hide');
	else $(selecter).addClass('hide');
}
// cool/heat master control
function setChMaster(id,chmaster) {
	var selecter = '#'+id+' .chmaster';
	if(chmaster == true) $(selecter).removeClass('hide');
	else $(selecter).addClass('hide');
}
// error control
function setError(id,error,code) {
	var selecter ='#'+id+' .error';
	var errcode = '#'+id+' .errcode';
	if(error == true) {
		$(selecter).removeClass('hide');
		$(errcode).text(code);
		$(errcode).removeClass('hide');
	} else {
		$(selecter).addClass('hide');
		$(errcode).addClass('hide');
	}
}
// operation condition control
function setOpCondition(id,mode,sb_stat) {
	console.log('SB status:'+sb_stat);
	var selecter = '#'+id+' .op-cond';
	if(sb_stat == 'off') $(selecter).addClass('hide');
	else if(mode == 'cool') $(selecter).removeClass('hide').attr('src','image/csb.png');
	else if(mode == 'heat') $(selecter).removeClass('hide').attr('src','image/hsb.png');
	else $(selecter).addClass('hide');
}
// VAM mode control
function setVamMode(id,mode) {
	var selecter = '#'+id+' .info-area .mode';
	if(mode == 'heatex') $(selecter).attr('src','image/vm-heatex.png');
	else if(mode == 'bypass') $(selecter).attr('src','image/vm-bypass.png');
	else if(mode == 'auto') $(selecter).attr('src','image/vm-auto.png');
	else $(selecter).attr('src','image/vm-.png');
}
// VAM freshup control
function setFreshup(id,freshup) {
	var selecter = '#'+id+' .freshup';
	if(freshup == true) $(selecter).attr('src','image/freshup.png');
	else $(selecter).attr('src','image/normal.png');
}
// Value setter
function setValue(id,val,unit) {
	var selecter = '#'+id+' .val-area .val';
	var unitSelecter = '#'+id+' .val-area .unit';
	if(val != null) $(selecter).text(val);
	if(unit != null) $(unitSelecter).text(unit);
}
// Sub Value setter
function setSubValue(id,val,unit) {
	var selecter = '#'+id+' .sub-val-area .val';
	var unitSelecter = '#'+id+' .sub-val-area .unit';
	if(val != null) $(selecter).text(val);
	if(unit != null) $(unitSelecter).text(unit);
}
// battery status
function setBatteryStatus(id,val) {
	if(POINT_LIST[id].info.attr.battery == false) return;
	var selecter = '#'+id+'.cell .battery';
	if(val != null) $(selecter+' .val').text(val);
	$(selecter).show();
	if(val < 10) $(selecter).addClass('empty');
	else $(selecter).removeClass('empty');
}

// get icon path
function getFanstepIcon(steps,step) {
	var stepStr = '-1.png';
	if(step == 'L') stepStr = '-1.png';
	else if(step == 'LM') stepStr = '-2.png';
	else if(step == 'M') stepStr = '-3.png';
	else if(step == 'MH') stepStr = '-4.png';
	else if(step == 'H') stepStr = '-5.png';
	else if(step == 'auto') stepStr = '-auto.png';
	else return '';

	return 'image/fanstep'+steps+stepStr;
}
function getFlapIcon(flap,steps) {
	if(flap == 'swing') flap = 7;
	else if(steps == 0)	flap = 8;
	return 'image/wflap'+flap+'.png';
}
function getFlap2Icon(flap,steps) {
	if(flap == 'swing') flap = 7;
	else if(steps == 0)	flap = 8;
	return 'image/wvflap'+flap+'.png';
}

