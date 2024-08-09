// SVM parts function
// These methods control indication only

var SP_INFO = {'range_min':16,'range_max':32,'csp_l':16,'csp_h':32,'hsp_l':16,'hsp_h':32,'csp':23,'hsp':23,'mode':'cool','csp_sb':null,'hsp_sb':null,'actual_mode':'cool'};

// close popup menu when mouse is clicked outside of popup
// event handler for popup should add e.stopPropagation()
// otherwise popup will be closed by this method
$(document).on('click','body',function(e) {
	hidePopup();
});

function hidePopup() {
	$('.popup-list').hide();
	$('.img-list').hide();
}

// slide switch indication switch
$(document).on('click','.slide .disable',function(e) {
	// to enable
	$(this).parent('.slide').find('.enable').removeClass('hide');
	$(this).addClass('hide');
});
$(document).on('click','.slide .enable',function(e) {
	// to disable
	$(this).parent('.slide').find('.disable').removeClass('hide');
	$(this).addClass('hide');
});

// radio button control
$(document).on('click','.radio.button',function(e) {
	if($(this).hasClass('selected')) $(this).removeClass('selected');
	else $(this).addClass('selected');
});

// popup menu control
$(document).on('click','.selectable-input .current-val',function(e) {
	hidePopup();
	var popup = $(this).parent('.selectable-input').find('.popup-list');
	var width = $(this).outerWidth();
	var pos = $(this).position();
	var top = pos.top;
	var left = pos.left;
	var height = 34;	// item height
	// find selected item
	var items = $(popup).find('li');
	var select_num = 0;
	for(var i = 0; i < items.length; i++) {
		if($(items[i]).hasClass('selected') == true) {
			select_num = i;
			break;
		}
	}
	$(popup).show();
	$(popup).css('width',width);
	$(popup).css('top',top-height-12);
	$(popup).css('left',left+5);
	$(popup).scrollTop(select_num*height-height-17);
	e.stopPropagation();
});

$(document).on('click','.selectable-input .popup-list li',function(e) {
	var list = $(this).parent('.popup-list');
	$(list).hide();
	$(list).find('li').removeClass('selected');
	$(this).addClass('selected');
	$(this).parents('.selectable-input').find('.current-val').text($(this).text());
	e.stopPropagation();
});

// selectable list control
$(document).on('click','.selectable-list li',function(e) {
	$(this).parent('.list').find('.selected').removeClass('selected');
	$(this).addClass('selected');
});

$(document).on('click','.selectable-list td',function(e) {
	$(this).parents('.multi-col-list').find('.selected').removeClass('selected');
	$(this).parent('tr').addClass('selected');
});

$(document).on('click','.multi-selectable-list li',function(e) {
	if(e.shiftKey == false) { // without shift key
		if($(this).hasClass('selected') == true) $(this).removeClass('selected');
		else $(this).addClass('selected');
	} else {	// with shift key: range select
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

// selectable image list control
$(document).on('click','.selectable-img .current-val',function(e) {
	hidePopup();
	var popup = $(this).parent('.selectable-img').find('.img-list');
	var pos = $(this).position();
	var top = pos.top;
	var left = pos.left;
	var height = $(this).height();	// item height
	// find selected item
	var items = $(popup).find('li');
	var select_num = 0;
	for(var i = 0; i < items.length; i++) {
		if($(items[i]).hasClass('selected') == true) {
			select_num = i;
			break;
		}
	}
	$(popup).show();
	$(popup).css('width',height+15);
	$(popup).css('top',top-height+5);
	$(popup).css('left',left-2);
	$(popup).scrollTop((select_num-1)*height);
	e.stopPropagation();
});

$(document).on('click','.selectable-img .img-list li',function(e) {
	$('.selectable-img .img-list li').removeClass('selected');
	$(this).addClass('selected');
	var src = $(this).find('img').attr('src');
	$(this).parents('.selectable-img').find('.current-val').attr('src',src);
});

// point select dialog control
$(document).on('click','.point-select.dialog .button',function(e) {
	$('.point-select.dialog').hide();
});

// check title control 
$(document).on('click','.subtitle.check',function(e) {
	if($(this).hasClass('checked')) { // clear check
		$(this).removeClass('checked');
	} else {	// check
		$(this).addClass('checked');
	}
});

// setpoint control panel
// up/down button event 
$(document).on('mousedown','.sp-control .sp-button',function(e) {
	$(this).css('opacity',0.2);
});
$(document).on('click','.sp-control .sp-button',function(e) {
	$(this).css('opacity',1);
});

$(document).on('click','.sp-control .sp-button.up',function(e) {
	var spstep = SELECTED_POINT.info.attr.sp_step;
	if(SPSTEP > spstep) spstep = SPSTEP; 
	if(SP_INFO.mode == 'cool') {
		if(SP_INFO.csp_limit_valid == true && SP_INFO.csp_h < SP_INFO.csp+spstep) return;
		if(SP_INFO.csp_max < SP_INFO.csp+spstep) return;
		SP_INFO.csp += spstep;
	} else if(SP_INFO.mode == 'heat') {
		if(SP_INFO.hsp_limit_valid == true && SP_INFO.hsp_h < SP_INFO.hsp+spstep) return;
		if(SP_INFO.hsp_max < SP_INFO.hsp+spstep) return;
		SP_INFO.hsp += spstep;
	} else if(SP_INFO.mode == 'temp' || SP_INFO.mode == 'auto') {
		if(SP_INFO.actual_mode == 'heat') {
			if(SP_INFO.hsp_limit_valid == true && SP_INFO.hsp_h < SP_INFO.hsp+spstep) return;
			if(SP_INFO.hsp_max < SP_INFO.hsp+spstep) return;
			SP_INFO.hsp += spstep;
		} else {
			if(SP_INFO.csp_limit_valid == true && SP_INFO.csp_h < SP_INFO.csp+spstep) return;
			if(SP_INFO.csp_max < SP_INFO.csp+spstep) return;
			SP_INFO.csp += spstep;
		}
	}
	setSp($(this).parent('.sp-control'));
});

$(document).on('click','.sp-control .sp-button.down',function(e) {
	var spstep = SELECTED_POINT.info.attr.sp_step;
	if(SPSTEP > spstep) spstep = SPSTEP; 
	if(SP_INFO.mode == 'cool') {
		if(SP_INFO.csp_limit_valid == true && SP_INFO.csp_l > SP_INFO.csp-spstep) return;
		if(SP_INFO.csp_min > SP_INFO.csp-spstep) return;
		SP_INFO.csp -= spstep;
	} else if(SP_INFO.mode == 'heat') {
		if(SP_INFO.hsp_limit_valid == true && SP_INFO.hsp_l > SP_INFO.hsp-spstep) return;
		if(SP_INFO.hsp_min > SP_INFO.hsp-spstep) return;
		SP_INFO.hsp -= spstep;
	} else if(SP_INFO.mode == 'temp' || SP_INFO.mode == 'auto') {
		if(SP_INFO.actual_mode == 'heat') {
			if(SP_INFO.hsp_limit_valid == true && SP_INFO.hsp_l > SP_INFO.hsp-spstep) return;
			if(SP_INFO.hsp_min > SP_INFO.hsp-spstep) return;
			SP_INFO.hsp -= spstep;
		} else {
			if(SP_INFO.csp_limit_valid == true && SP_INFO.csp_l > SP_INFO.csp-spstep) return;
			if(SP_INFO.csp_min > SP_INFO.csp-spstep) return;
			SP_INFO.csp -= spstep;
		}
	}
	setSp($(this).parent('.sp-control'));
});

// sp_info: {csp_l,csp_h,hsp_l,hsp_h,range_min,range_max,csp,hsp,mode,csp_sb,hsp_sb}

// call when setpoint range will draw
function drawSpRange(element) {
	var e = $(element).find('.sp-canvas');
	if(e == null) return;

	var context = e[0].getContext('2d');
	context.clearRect(0,0,300,300);

	var csp_limit = SP_INFO.csp_limit_valid;
	var hsp_limit = SP_INFO.hsp_limit_valid;
	var csp_max = SP_INFO.csp_max;
	var csp_min = SP_INFO.csp_min;
	var hsp_max = SP_INFO.hsp_max;
	var hsp_min = SP_INFO.hsp_min;
	var csp_l = SP_INFO.csp_l
	var csp_h = SP_INFO.csp_h;
	var hsp_l = SP_INFO.hsp_l;
	var hsp_h = SP_INFO.hsp_h;
	var range_min = SP_INFO.range_min;
	var range_max = SP_INFO.range_max;

	if(csp_limit == false) {
		csp_l = csp_min;
		csp_h = csp_max;
	} 
	if(hsp_limit == false) {
		hsp_l = hsp_min;
		hsp_h = hsp_max;
	}
	// cool setpoint range
	var min = getAngle(csp_l,range_min,range_max);
	var max = getAngle(csp_h,range_min,range_max);
	context.beginPath();
	context.lineWidth = 5;
	context.strokeStyle = '#00efef';
	context.arc(150,150,137.5,min,max,false);
	context.stroke();

	// heat setpoint range
	if(SELECTED_POINT.info.attr.mode_cap.indexOf('H') >= 0) {
		min = getAngle(hsp_l,range_min,range_max);
		max = getAngle(hsp_h,range_min,range_max);
		context.beginPath();
		context.lineWidth = 5;
		context.strokeStyle = 'orangered';
		context.arc(150,150,132.5,min,max,false);
		context.stroke();
	}
}

// call when sp information will draw
function setSp(element) {
	$(element).find('.sp-container').hide();
	$(element).find('.sp-triangle').hide();
	$(element).find('.csp').hide();
	$(element).find('.hsp').hide();
	$(element).find('.sp-button').hide();

	var hsp = SP_INFO.hsp;
	var csp = SP_INFO.csp;
	var range_min = SP_INFO.range_min;
	var range_max = SP_INFO.range_max;
	var mode = SP_INFO.mode;
	var actual_mode = SP_INFO.actual_mode;

	// draw sp value and pointer
	if(mode == 'heat') {
		$(element).find('.hsp').show();
		drawSpInfo(element,hsp);
		var angle = getAngleSpPointer(hsp,range_min,range_max);
		$(element).find('.hsp').css('transform','rotate('+angle+'deg)');	
		$(element).find('sp-button').show();
	}	else if(mode == 'cool') {
		$(element).find('.csp').show();
		drawSpInfo(element,csp);
		var angle = getAngleSpPointer(csp,range_min,range_max);
		$(element).find('.csp').css('transform','rotate('+angle+'deg)');
		$(element).find('sp-button').show();
	} else if(mode == 'temp' || mode == 'auto') {
		$(element).find('sp-button').show();
		if(actual_mode == 'heat') {
			$(element).find('.hsp').show();
			drawSpInfo(element,hsp);
			var angle = getAngleSpPointer(hsp,range_min,range_max);
			$(element).find('.hsp').css('transform','rotate('+angle+'deg)');	
		} else {
			$(element).find('.csp').show();
			drawSpInfo(element,csp);
			var angle = getAngleSpPointer(csp,range_min,range_max);
			$(element).find('.csp').css('transform','rotate('+angle+'deg)');
		}
	} else { // hide setpoint indication
	}
}
function drawSpInfo(element,sp) {
	$(element).find('.sp-container').show();
	$(element).find('.sp-button').show();
	$(element).find('.val').text(parseInt(sp));
	$(element).find('.decp').text(sp.toFixed(1).split('.')[1]);
}

function drawSetback(element) {
	var csp_sb = SP_INFO.csp_sb;
	var hsp_sb = SP_INFO.hsp_sb;
	var range_min = SP_INFO.range_min;
	var range_max = SP_INFO.range_max;

	if(csp_sb == null) $(element).find('.csb').hide();
	else {
		angle = getAngleSpPointer(csp_sb,range_min,range_max);
		$(element).find('.csb').css('transform','rotate('+angle+'deg)');
		$(element).find('.csb').show();
	}
	if(hsp_sb == null) $(element).find('.hsb').hide();
	else {
		angle = getAngleSpPointer(hsp_sb,range_min,range_max);
		$(element).find('.hsb').css('transform','rotate('+angle+'deg)');		
		$(element).find('.hsb').show();
	}
}

function drawSpControlButton(element) {
	var e = $(element).find('.sp-button.up');
	if(e == null) return;
	var context = e[0].getContext('2d');
	context.beginPath();
	context.moveTo(0,150);
	context.lineTo(300,150);
	context.lineTo(150,0);
	context.closePath();
	context.fillStyle = 'rgba(255,255,255,0.2)';
	context.fill();

	e = $(element).find('.sp-button.down');
	if(e == null) return;
	context = e[0].getContext('2d');
	context.beginPath();
	context.moveTo(0,0);
	context.lineTo(300,0);
	context.lineTo(150,150);
	context.closePath();
	context.fillStyle = 'rgba(255,255,255,0.2)';
	context.fill();	
}

function getAngle(val,min,max) {
	return ((val-min)/(max-min)*240-210)/180*Math.PI;
}
function getAngleSpPointer(val,min,max) {
	return ((val-min)/(max-min)*240-120);
}

function getSpRange(point) {
	if(point == null) return null;
	var csp_min = point.info.attr.csp_min;
	var csp_max = point.info.attr.csp_max;
	var hsp_min = point.info.attr.hsp_min;
	var hsp_max = point.info.attr.hsp_max;
	var range_min = hsp_min;
	if(range_min > csp_min) range_min = csp_min;
	var range_max = csp_max;
	if(range_max < hsp_max) range_max = hsp_max;
	return [range_min,range_max];
}

// calendar function
// mark date
$(document).on('click','.calendar td',function(e) {
	if($(this).text() == '') return;
	if($(this).hasClass('date') == true) {	// specify by date
		$(this).removeClass('date');
		$(this).addClass('day');
	} else if($(this).hasClass('day') == true) { // specify by day of week
		$(this).removeClass('day');
	} else {
		$(this).addClass('date');
	}
});

// set date to calendar
// std is start day of week
//  if true then start from monday
//  start from sunday when false
function setCalendar(element, year, month,std) {
	var day = new Date(year,month-1,1);
	var day_of_week = [' .day1',' .day2',' .day3',' .day4',' .day5',' .day6',' .day7'];
	var day_ofset = 0;	// week starts from sunday
	var sunday;

	$(element).find('table td').text('');
	$(element).find('table td').removeClass('date');
	$(element).find('table td').removeClass('day');
	$(element).attr('year',year);
	$(element).attr('month',month);
	$(element).find('.month').text(getString('month'+month));
	$(element).find('.year').text(year);
	if(std == true) {	// week starts from monday
		day_ofset = 1;
		sunday = day_of_week[6];
	} else {	// week starts from sunday
		sunday = day_of_week[0];
	}
	$(element).find('.dow'+sunday).text(getString('s_sun'));
	$(element).find(sunday).css('color','red');

	// set day of week short string to calendar header
	$(element).find('.dow'+day_of_week[1-day_ofset]).text(getString('s_mon'));
	$(element).find('.dow'+day_of_week[2-day_ofset]).text(getString('s_tue'));
	$(element).find('.dow'+day_of_week[3-day_ofset]).text(getString('s_wed'));
	$(element).find('.dow'+day_of_week[4-day_ofset]).text(getString('s_thu'));
	$(element).find('.dow'+day_of_week[5-day_ofset]).text(getString('s_fri'));
	$(element).find('.dow'+day_of_week[6-day_ofset]).text(getString('s_sat'));

	var week = 1;
	var d = day.getDay()-day_ofset;	// day of week sufix
	if(d < 0) d = 6;
	for(var i = 0; i < 31; i++) {
		$(element).find('.week'+week+day_of_week[d]).text(day.getDate());
		d++;
		if(d > 6) {d = 0; week++;}
		day.setDate(day.getDate()+1);
		if(day.getMonth() == month) break; // end of month
	}
}

function initSlider(targ,min,max,step,dp,val,unit) {
	if(unit == null) unit = '';
	if(val == null) return;
	$(targ+' .slider').slider({
		min: min,
		max: max,
		step: step,
		value: val,
		orientation: 'vertical',
		slide: function(event,ui) {
			$(targ+' .val').text(ui.value.toFixed(dp)+unit);
		},
		change: function(event, ui) {

		}
	});
	$(targ+' .val').text(val.toFixed(dp)+unit);
}