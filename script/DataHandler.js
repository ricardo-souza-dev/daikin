// Point data handling method

function updateStatus(id, cos) {
	var status = POINT_LIST[id].stat;
	if(status == null) return;
	var selector;
	for(var item in cos) {
		status[item] = cos[item];
	}
	updateScreen(id);
}

function makePointListDom(id_list) {
	var dom = '';
	for(var i = 0; i < id_list.length; i++) {
		var id = id_list[i];
		var point = POINT_LIST[id];
		if(point == null) continue;
		var type = point.info.type;
		switch(type) {
			case 'Fcu':
			case 'Ahu':
				dom += makeFcuCell(point);
				break;
			case 'Vam':
				dom += makeVamCell(point);
				break;
			case 'Di':
			case 'Dio':
				dom += makeDioCell(point);
				break;
			case 'Ai':
			case 'Ao':
				dom += makeAioCell(point);
				break;
			case 'Pi':
				dom += makePiCell(point);
				break;
			case 'Msi':
			case 'Mso':
				dom += makeMsioCell(point);
				break;
		}
	}
	return dom;
}

// FCU, AHU
function makeFcuCell(point) {
	var temp_unit = getTempUnit();
	return "<li class='mpoint fcu' id='"+point.info.id+"'><img class='icon' src=''/><div class='point-info'><div class='point-name'></div><div class='setpoint'><span class='cool'><span class='title'></span><span class='value'></span><span class='unit'>"+temp_unit+"</span></span><span class='heat'><span class='title'></span><span class='value'></span><span class='unit'>"+temp_unit+"</span></span></div><div class='temp'><span class='title'>"+getString('rt')+"</span><span class='value'></span><span class='unit'>"+temp_unit+"</span></div></div><div class='stat'><img src=''></div><div class='mode'><img src=''></div><div class='filter'><img src='image/filter.png'></div><div class='error'><img src='image/error.png'><div class='code'></div></div></li>";
}

//VAM
function makeVamCell(point) {
	return "<li class='mpoint vam' id='"+point.info.id+"'><img class='icon' src=''/><div class='point-info'><div class='point-name'></div></div><div class='stat'><img src=''></div><div class='mode'><img src=''></div><div class='error'><img src='image/error.png'><div class='code'></div></div></li>";
}

// Di, Dio
function makeDioCell(point) {
	return "<li class='mpoint dio' id='"+point.info.id+"'><img class='icon' src=''/><div class='point-info'><div class='point-name'></div></div><div class='stat'><img src=''></div><div class='error'><img src='image/error.png'><div class='code'></div></div></li>";
}

// Ai, Ao
function makeAioCell(point) {
	return "<li class='mpoint aio' id='"+point.info.id+"'><img class='icon' src=''/><div class='point-info'><div class='point-name'></div><div class='value'><span class='title'></span><span class='value'></span><span class='unit'></span></div></div><div class='error'><img src='image/error.png'><div class='code'></div></div></li>";
}

// Pi
function makePiCell(point) {
	return "<li class='mpoint pi' id='"+point.info.id+"'><img class='icon' src=''/><div class='point-info'><div class='point-name'></div><div class='meter'><span class='title'></span><span class='value'></span><span class='unit'></span></div></div><div class='error'><img src='image/error.png'><div class='code'></div></div></li>";
}

// MSio
function makeMsioCell(point) {
	return "<li class='mpoint msio' id='"+point.info.id+"'><img class='icon' src=''/><div class='point-info'><div class='point-name'></div><div class='value'></div></div><div class='error'><img src='image/error.png'><div class='code'></div></div></li>";
}

// cell screen related methods
function updateScreen(id) {
	var point = POINT_LIST[id];
	if(point == null) return;
	var type = point.info.type;
	switch(type) {
		case 'Fcu':
		case 'Ahu':
			updateFcuCellStatus(point);
			break;
		case 'Vam':
			updateVamCellStatus(point);
			break;
		case 'Di':
		case 'Dio':
			updateDioCellStatus(point);
			break;
		case 'Ai':
		case 'Ao':
			updateAioCellStatus(point);
			break;
		case 'Pi':
			updatePiCellStatus(point);
			break;
		case 'Msi':
		case 'Mso':
			updateMsioCellStatus(point);
			break;
	}
	if(point.stat.com_stat == false) {
		$('#'+point.info.id+ ' .icon').addClass('commerr');
		$('#'+point.info.id+ ' .setpoint').addClass('commerr');
		$('#'+point.info.id+ ' .temp').addClass('commerr');
		$('#'+point.info.id+ ' .stat').addClass('commerr');
		$('#'+point.info.id+ ' .filter').addClass('commerr');
		$('#'+point.info.id+ ' .mode').addClass('commerr');
		$('#'+point.info.id+ ' .error').hide();
	} else {
		$('#'+point.info.id+ ' .icon').removeClass('commerr');
		$('#'+point.info.id+ ' .setpoint').removeClass('commerr');
		$('#'+point.info.id+ ' .temp').removeClass('commerr');
		$('#'+point.info.id+ ' .stat').removeClass('commerr');
		$('#'+point.info.id+ ' .filter').removeClass('commerr');
		$('#'+point.info.id+ ' .mode').removeClass('commerr');
	}
}

function updateFcuCellStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(cell.length > 0) {
		$(cell).find('.point-name').text(point.info.name);
		$(cell).find('.icon').attr('src',point.info.icon);
		if(point.stat.sp_mode == 'single') {
			$(cell).find('.setpoint .title').text(getString('sp'));
			if(point.stat.actual_mode == 'cool' && point.stat.mode != 'dry') {
				if(point.stat.csp == null) return;
				$(cell).find('.setpoint .value').text(point.stat.csp.toFixed(1));
				$(cell).find('.setpoint').show();
				$(cell).find('.setpoint .cool').show();
				$(cell).find('.setpoint .heat').hide();
			} else if(point.stat.actual_mode == 'heat') {
				if(point.stat.hsp == null) return;
				$(cell).find('.setpoint .value').text(point.stat.hsp.toFixed(1));
				$(cell).find('.setpoint').show();
				$(cell).find('.setpoint .cool').hide();
				$(cell).find('.setpoint .heat').show();
			} else {
				$(cell).find('.setpoint').hide();
			}
		} else {
			$(cell).find('.setpoint .cool .title').text(getString('csp'));
			if(point.stat.csp != null) $(cell).find('.setpoint .cool .value').text(point.stat.csp.toFixed(1));
			$(cell).find('.setpoint .heat .title').text(getString('hsp'));
			if(point.stat.hsp != null) $(cell).find('.setpoint .heat .value').text(point.stat.hsp.toFixed(1));
			if(point.stat.actual_mode == 'fan' || point.stat.mode == 'dry') {
				$(cell).find('.setpoint').hide();
			} else {
				$(cell).find('.setpoint').show();
			}
		}
		if(point.stat.temp != null) $(cell).find('.temp .value').text(point.stat.temp.toFixed(1));
		var stat = OnOffStatus(point);
		$(cell).find('.stat img').attr('src',stat);
		if(point.info.mode_cap == true) {
			$(cell).find('.mode img').show();
			$(cell).find('.mode img').attr('src','image/'+point.stat.mode+'.png');
		} else {
			$(cell).find('.mode img').hide();
		}
		if(point.stat.error == true) {
			$(cell).find('.error .code').text(point.stat.err_code);
			$(cell).find('.error').show();
			$(cell).find('.error .code').show();
		} else {
			$(cell).find('.error').hide();
		}
		if(point.stat.filter == true) {
			$(cell).find('.filter').show();
		} else {
			$(cell).find('.filter').hide();
		}
	}
}

function updateVamCellStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(cell.length > 0) {
		$(cell).find('.point-name').text(point.info.name);
		$(cell).find('.icon').attr('src',point.info.icon);
		var stat = OnOffStatus(point);
		$(cell).find('.stat img').attr('src',stat);
		if(point.stat.vmode == 'auto') {
			$(cell).find('.mode img').attr('src','image/vm-auto.png');
		} else if(point.stat.vmode == 'bypass') {
			$(cell).find('.mode img').attr('src','image/vm-bypass.png');
		} else {
			$(cell).find('.mode img').attr('src','image/vm-heatex.png');
		}
		if(point.stat.error == true) {
			$(cell).find('.error .code').text(point.stat.err_code);
			$(cell).find('.error').show();
		} else {
			$(cell).find('.error').hide();
		}
	}
}

function updateDioCellStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(cell.length > 0) {
		$(cell).find('.point-name').text(point.info.name);
		$(cell).find('.icon').attr('src',point.info.icon);
		var stat = OnOffStatus(point);
		$(cell).find('.stat img').attr('src',stat);
		if(point.stat.error == true) {
			$(cell).find('.error .code').text(point.stat.err_code);
			$(cell).find('.error').show();
		} else {
			$(cell).find('.error').hide();
		}
	}
}

function updateAioCellStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(cell.length > 0) {
		$(cell).find('.point-name').text(point.info.name);
		$(cell).find('.icon').attr('src',point.info.icon);
		$(cell).find('.value .value').text(point.stat.av);
		$(cell).find('.value .unit').text(point.info.attr.unit_label);
		if(point.stat.error == true) {
			$(cell).find('.error .code').text(point.stat.err_code);
			$(cell).find('.error').show();
		} else {
			$(cell).find('.error').hide();
		}
	}
}

function updatePiCellStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(cell.length > 0) {
		$(cell).find('.point-name').text(point.info.name);
		$(cell).find('.icon').attr('src',point.info.icon);
		$(cell).find('.meter .value').text(point.stat.meter);
		$(cell).find('.meter .unit').text(point.info.attr.unit_label);
		if(point.stat.error == true) {
			$(cell).find('.error .code').text(point.stat.err_code);
			$(cell).find('.error').show();
		} else {
			$(cell).find('.error').hide();
		}
	}
}

function updateMsioCellStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(cell.length > 0) {
		$(cell).find('.point-name').text(point.info.name);
		$(cell).find('.icon').attr('src',point.info.icon);
		$(cell).find('.value').text(point.stat.tag[point.stat.ms_val]);
		if(point.stat.error == true) {
			$(cell).find('.error .code').text(point.stat.err_code);
			$(cell).find('.error').show();
		} else {
			$(cell).find('.error').hide();
		}
	}
}

function makeCommandDialog(point) {
	$('.main-page .operation-panel').remove();
	var dom;
	switch(point.info.type) {
		case 'Fcu':
			dom = makeFcuCommandDom();
			break;
		case 'Ahu':
			break;
		case 'Vam':
			dom = makeVamCommandDom();
			break;
		case 'Dio':
			dom = makeDioCommandDom();
			break;
		case 'Ao':
			break;
		case 'Mso':
			break;
	}
	$('.main-page').append(dom);

	if(point.stat.com_stat == false) {
		$('.nav-btn').hide();
	}
}
