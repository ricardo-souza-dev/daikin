var SELECTED_POINT; // set point object
var SCROLL_TOP;
var SID;
var SX,SY;
var FROMD;
var TOD;
var CURRENTMONTH;
var STATE; //check for back options.

// SVM-C1 events
// monitor screen event
$(document).on('click','.cell',function(e) {
	if($(this).hasClass('room')) return;
	if($(this).hasClass('scrnbtn')) { 	// screen button
		SID = $(this).attr('id');
		loadScreen('section.html');
	} else {	// point screen
		SELECTED_POINT = POINT_LIST[$(this).attr('id')];
		// if the point is under comm error then nothing happen
		if(SELECTED_POINT.stat.com_stat == false) return;
		SCROLL_TOP = $('.contents-area').scrollTop();

		// open operation screen
		// show operation screen depend on point type
		loadOperationScreen();
	}
});

// mouse wheel control for zoom in/out of visual screen
$(document).on('wheel','.visual-area',function(e) {
	var zoom = 1;
	var pos = $('.visual-area').offset();
	var px = pos.left;
	var py = pos.top;
	if(SID == null) { // top screen
		zoom = SCREEN_LIST.top.zoom;
	} else {
		zoom = SCREEN_LIST[SID].zoom;
	}
	if(zoom == null) zoom =1;

	var x = e.originalEvent.x;
	var y = e.originalEvent.y;

	x = (x-px)/zoom;
	y = (y-py)/zoom;
	$('.visual-area').css('transform-origin',x+'px '+y+'px');
  $('.screen .contents-area .visual-area').offset({top:py,left:px});	// this is necessary after transform-origin, sometimes position is changed especially after move

	if(e.originalEvent.deltaY > 0) {
		if(zoom <= 0.1) return;
		zoom -= 0.05;
	} else {
		if(zoom >= 5) return;
		zoom += 0.05;
	}

	$('.visual-area').css({transform:'scale('+zoom+')'});
	if(SID == null) { // top screen
		SCREEN_LIST.top.zoom = zoom;
	} else {
		SCREEN_LIST[SID].zoom = zoom;
	}
	return false;
});

// show management point name by mouse over and hide
$(document).on('mouseenter','.visual-area .layout .icon',function() {
	var name = $(this).parents('.layout').children('.name');
	$(name).css({top:50,left:10});
	$(name).show();
});
$(document).on('mouseleave','.visual-area .layout .icon',function() {
	var name = $(this).parents('.layout').children('.name');
	$(name).hide();
});

$(document).on('click','.visual-area .layout .icon',function(e) {
	var pid = $(this).parents('.layout').attr('id');
	SELECTED_POINT = POINT_LIST[pid];
	// if the point is under comm error then nothing happen
	if(SELECTED_POINT.stat.com_stat == false) return;
	SCROLL_TOP = $('.contents-area').scrollTop();

	// open operation screen
	// show operation screen depend on point type
	loadOperationScreen();
});

// operation screen event
$(document).on('click','#operation .status',function(e) {
	if($(this).parents('.lock-op').length > 0) return;
	var stat = $(this).attr('stat');
	if(stat == 'on') {
		$(this).attr('stat','off');
		$(this).attr('src','image/power-gray.png');
		pushCommand('stat','off');
	} else if(stat == 'off') {
		$(this).attr('stat','on');
		$(this).attr('src','image/power-green.png');
		pushCommand('stat','on');
	} else if(stat == 'error') {
		$(this).attr('stat','off');
		$(this).attr('src','image/power-gray.png');
		pushCommand('stat','off');
	}
});
$(document).on('click','.lock-op#operation .status',function(e) {
	var stat = $(this).attr('stat');
	if(stat == 'on') {
		$(this).attr('stat','off');
		$(this).attr('src','image/open.png');
		pushCommand('lock','off');
	} else if(stat == 'off') {
		$(this).attr('stat','on');
		$(this).attr('src','image/lock.png');
		pushCommand('lock','on');
	} else if(stat == 'error') {
		$(this).attr('stat','off');
		$(this).attr('src','image/lock-error.png');
		pushCommand('lock','off');
	}
});

$(document).on('click','#operation .up',function(e) {
	pushCommand('updown','on');	
});
$(document).on('click','#operation .stop',function(e) {
	pushCommand('updown','stop');
});
$(document).on('click','#operation .stop',function(e) {
	
});
$(document).on('click','#operation .down',function(e) {
	pushCommand('updown','off');
});

$(document).on('click','#operation .offtimer',function(e) {
	var stat = $(this).attr('stat');
	if(stat == 'on') {
		$(this).attr('stat','off');
		$(this).attr('src','image/offtimer-gray.png');
		pushCommand('off_timer','off');
	} else {
		$(this).attr('stat','on');
		$(this).attr('src','image/offtimer-green.png');
		pushCommand('off_timer','on');
	}
});
$(document).on('click','#operation .off-timer-duration li',function(e) {
	var val = $(this).attr('id').replace('d','');
	val = parseInt(val,10);
	pushCommand('off_duration',val);
});

$(document).on('click','#operation .fanstep',function(e) {
	var steps = parseInt($(this).attr('steps'));
	var step = $(this).attr('step');
	if(step == 'L') {
		if(steps == 2) step = 'H';
		else if(steps == 3) step = 'M';
		else step = 'LM';
	} else if(step == 'LM') {
		step = 'M';
	} else if(step == 'M') {
		if(steps == 3) step = 'H';
		else step = 'MH';
	} else if(step == 'MH') {
		step = 'H';
	} else if(step == 'H') {
//		if(SELECTED_POINT.info.attr.fanstep_auto_cap == true) 
		step = 'auto';
//		else step = 'L';
	} else if(step == 'auto') {
		step = 'L';
	}
	$(this).attr('step',step);
	$(this).attr('src',getFanstepIcon(steps,step));
	pushCommand('fanstep',step);
});

$(document).on('click','#operation .flap',function(e) {
	var flap = $(this).attr('flap');
	if(flap == 'swing') {
		if(SELECTED_POINT.info.attr.flap_steps == 0) flap = 0;
		else flap = 4;
	} else {
		if(SELECTED_POINT.info.attr.flap_steps == 0) flap = 'swing';
		else {
			flap = parseInt(flap);
			flap -= 1;
			if(flap < 0) flap = 'swing';
		}
	}
	$(this).attr('flap',flap);
	$(this).attr('src',getFlapIcon(flap,SELECTED_POINT.info.attr.flap_steps));
	pushCommand('flap',flap);
});

$(document).on('click','#operation .flap2',function(e) {
	var flap = $(this).attr('flap2');
	if(flap == 'swing') {
		if(SELECTED_POINT.info.attr.flap_steps == 0) flap = 0;
		else flap = 4;
	} else {
		if(SELECTED_POINT.info.attr.flap_steps == 0) flap = 'swing';
		else {
			flap = parseInt(flap);
			flap -= 1;
			if(flap < 0) flap = 'swing';
		}
	}
	$(this).attr('flap2',flap);
	$(this).attr('src',getFlap2Icon(flap,SELECTED_POINT.info.attr.flap_steps));
	pushCommand('flap2',flap);
});

$(document).on('click','#operation .mode',function(e) {
	$('#operation .mode').removeClass('active');
	$(this).addClass('active');
	SP_INFO.mode = $(this).attr('id');
	setSp($('#operation .sp-control'));
	pushCommand('mode',$(this).attr('id'));
});

$(document).on('click','#operation .filter',function(e) {
	$('#operation .filter').hide();
	pushCommand('filter_clr',true);
});

$(document).on('click','#operation .vamount',function(e) {
	var step = $(this).attr('step');
	if(step == 'auto') {
		step = 'L';
	} else if(step == 'L') {
		step = 'H';
	} else if(step == 'H') {
		step = 'auto';
	}
	$(this).attr('step',step);
	$(this).attr('src',getFanstepIcon(2,step));
	pushCommand('vamount',step);
});

$(document).on('click','#operation .freshup',function(e) {
	var stat = $(this).attr('status');
	if(stat == 'true') {
		$(this).attr('status','false');
		$(this).attr('src','image/normal.png');
		pushCommand('fresh_up',false);
	} else {
		$(this).attr('status','true');
		$(this).attr('src','image/freshup.png');
		pushCommand('fresh_up',true);
	}
});

$(document).on('click','#operation .vmode',function(e) {
	var stat = $(this).attr('mode');
	if(stat == 'auto') {
		mode = 'heatex';
	} else if(stat == 'heatex') {
		mode = 'bypass';
	} else if(stat == 'bypass') {
		mode = 'auto';
	} else {
		mode = 'auto';
	}
	$(this).attr('mode',mode);
	$(this).attr('src','image/vm-'+mode+'.png');
	pushCommand('vmode',mode);
});

$(document).on('click','#operation .sp-button', function(e) {
	if(SP_INFO.mode == 'cool') {
		pushCommand('csp',SP_INFO.csp);
	} else if(SP_INFO.mode == 'heat') {
		pushCommand('hsp',SP_INFO.hsp);
	} else if(SP_INFO.mode == 'temp' || SP_INFO.mode == 'auto') {
		if(SP_INFO.actual_mode == 'heat') {
			pushCommand('hsp',SP_INFO.hsp);
		} else if(SP_INFO.actual_mode == 'fan') {
			pushCommand('sp',SP_INFO.csp);
		} else {
			pushCommand('csp',SP_INFO.csp);
		}
	}
});

$(document).on('click','#operation #vrv-ctrl #sp-range .switch',function(e) {
	if($(this).parent().hasClass('checked') == true) $(this).parent().removeClass('checked');
	else $(this).parent().addClass('checked');
});

$(document).on('click','#operation #vrv-ctrl #set',function(e) {
	var csp_l = parseInt($('#vrv-ctrl #sp-range .cool .min .current-val').text());
	var csp_h = parseInt($('#vrv-ctrl #sp-range .cool .max .current-val').text());
	var hsp_l = parseInt($('#vrv-ctrl #sp-range .heat .min .current-val').text());
	var hsp_h = parseInt($('#vrv-ctrl #sp-range .heat .max .current-val').text());
	var csp_sb = $('#vrv-ctrl #setback .cool .current-val').text();
	if(csp_sb == '---') csp_sb = null;
	else csp_sb = parseInt(csp_sb);
	var hsp_sb = $('#vrv-ctrl #setback .heat .current-val').text();
	if(hsp_sb == '---') hsp_sb = null;
	else hsp_sb = parseInt(hsp_sb);
	var csp_limit = $('#vrv-ctrl #sp-range .selectable.cool').hasClass('checked');
	var hsp_limit = $('#vrv-ctrl #sp-range .selectable.heat').hasClass('checked');

	if(SELECTED_POINT.stat.csp_limit_valid != csp_limit) {
		SELECTED_POINT.stat.csp_limit_valid = csp_limit;
		SP_INFO.csp_limit_valid = csp_limit;
		pushCommand('csp_limit_valid',csp_limit);
		if(csp_limit == true) {
			// adjust csp depen on the range
			if(SP_INFO.csp > csp_h) {
				SP_INFO.csp = csp_h;
				pushCommand('csp',csp_h);
			} else if(SP_INFO.csp < csp_l) {
				SP_INFO.csp = csp_l;
				pushCommand('csp',csp_l);
			}
		}
	}
	if(SELECTED_POINT.stat.hsp_limit_valid != hsp_limit) {
		SELECTED_POINT.stat.hsp_limit_valid = hsp_limit;
		SP_INFO.hsp_limit_valid = hsp_limit;
		pushCommand('hsp_limit_valid',hsp_limit);
		if(hsp_limit == true) {
			// adjust csp depen on the range
			if(SP_INFO.hsp > hsp_h) {
				SP_INFO.hsp = hsp_h;
				pushCommand('hsp',hsp_h);
			} else if(SP_INFO.hsp < hsp_l) {
				SP_INFO.hsp = hsp_l;
				pushCommand('hsp',hsp_l);
			}
		}
	}
	if(SELECTED_POINT.stat.csp_l != csp_l) {
		SELECTED_POINT.stat.csp_l = csp_l;
		SP_INFO.csp_l = csp_l;
		pushCommand('csp_l',csp_l);
		if(csp_limit == true) {
			// adjust csp depen on the range
			if(SP_INFO.csp < csp_l) {
				SP_INFO.csp = csp_l;
				pushCommand('csp',csp_l);
			}
		}
	}
	if(SELECTED_POINT.stat.csp_h != csp_h) {
		SELECTED_POINT.stat.csp_h = csp_h;
		SP_INFO.csp_h = csp_h;
		pushCommand('csp_h',csp_h);
		if(csp_limit == true) {
			// adjust csp depen on the range
			if(SP_INFO.csp > csp_h) {
				SP_INFO.csp = csp_h;
				pushCommand('csp',csp_h);
			}
		}
	}
	if(SELECTED_POINT.stat.hsp_l != hsp_l) {
		SELECTED_POINT.stat.hsp_l = hsp_l;
		SP_INFO.hsp_l = hsp_l;
		pushCommand('hsp_l',hsp_l);
		if(hsp_limit == true) {
			// adjust csp depen on the range
			if(SP_INFO.hsp < hsp_l) {
				SP_INFO.hsp = hsp_l;
				pushCommand('hsp',hsp_l);
			}
		}
	}
	if(SELECTED_POINT.stat.hsp_h != hsp_h) {
		SELECTED_POINT.stat.hsp_h = hsp_h;
		SP_INFO.hsp_h = hsp_h;
		pushCommand('hsp_h',hsp_h);
		if(hsp_limit == true) {
			// adjust csp depen on the range
			if(SP_INFO.hsp > hsp_h) {
				SP_INFO.hsp = hsp_h;
				pushCommand('hsp',hsp_h);
			}
		}
	}
	if(SELECTED_POINT.stat.csp_sb != csp_sb) {
		SELECTED_POINT.stat.csp_sb = csp_sb;
		SP_INFO.csp_sb = csp_sb;
		pushCommand('csp_sb',csp_sb);
	}
	if(SELECTED_POINT.stat.hsp_sb != hsp_sb) {
		SELECTED_POINT.stat.hsp_sb = hsp_sb;
		SP_INFO.hsp_sb = hsp_sb;
		pushCommand('hsp_sb',hsp_sb);
	}

	drawSpRange($('.sp-control'));
	setSp($('.sp-control'));
	drawSetback($('.sp-control'));

	$('#operation #vrv-ctrl').hide();
});

$(document).on('click','#operation #vrv-ctrl #cancel',function(e) {
	$('#operation #vrv-ctrl').hide();
});

// analog operation
$(document).on('change','#operation.ao-op .slide-ctrl .slider',function(e) {
	var val = parseFloat($('.slide-ctrl .val').text());
	pushCommand('av',val);
});

// IR operation
$(document).on('click','#operation .button.ir',function(e) {
	var command = $(this).attr('id');
	pushCommand('ircommand',command);
});


// menu event
$(document).on('click','.menu-item#logout',function(e) {
	COMM_PORT.closeConnection();
});

$(document).on('click','.menu-item#all-on',function(e) {
	var command = ['operate',[]];
	if(SID == null) {
		for(var id in POINT_LIST) {
			command[1].push([id,{'stat':'on'}]);
		}
	} else {
		var points = SCREEN_LIST[SID].point;
		for(var i in points) {
			if(POINT_LIST[points[i]] == null) continue;
			command[1].push([points[i],{'stat':'on'}]);
		}		
	}
	COMM_PORT.send(command);
});
$(document).on('click','.menu-item#all-off',function(e) {
	var command = ['operate',[]];
	if(SID == null) {
		for(var id in POINT_LIST) {
			command[1].push([id,{'stat':'off'}]);
		}
	} else {
		var points = SCREEN_LIST[SID].point;
		for(var i in points) {
			if(POINT_LIST[points[i]] == null) continue;
			command[1].push([points[i],{'stat':'off'}]);
		}		
	}
	COMM_PORT.send(command);
});

$(document).on('click','#section .menu-item#back',function(e) {
	SID = null;
});

$(document).on('click','.menu-item#back',function(e) {
	if(SID == null) loadScreen('top_screen.html');
	else loadScreen('section.html');
});

$(document).on('click','.menu-item#schedule',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	// read schedule data from server
	// schedule pattern
	var com = ['get_schedule_pattern'];
	COMM_PORT.sendMon(com,'sched');
	// calendar
	com = ['get_calendar'];
	COMM_PORT.sendMon(com,'sched');
	// schedule programs
	com = ['get_schedule_program']
	COMM_PORT.sendMon(com,'sched');

//	loadScreen('schedule_screen.html');
});

$(document).on('click','.menu-item#system',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('system_screen.html');
});

$(document).on('click','.menu-item#ppd',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('ppd_screen.html');
});

$(document).on('click','.menu-item#interlock',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('interlock_screen.html');
});

$(document).on('click','.menu-item#scenes',function(e) {
	getScenes();
	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('scenes_screen.html');
});

$(document).on('click','.menu-item#history',function(e) {	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('history_screen.html');
});

$(document).on('click','.menu-item#hotel',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	if(MODEL == 'S3') {
		loadScreen('multihotel_interlock_screen.html');
	} else {
		loadScreen('hotel_interlock_screen.html');
	}
});

$(document).on('click','.menu-item#hotelctl',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('guest_rooms.html');
});

$(document).on('click','#operation #setup',function(e) {
	var range = makeRange(SELECTED_POINT.info.attr.csp_min,SELECTED_POINT.info.attr.csp_max);
	setRange('#vrv-ctrl #sp-range .cool',range);
	range = makeRange(SELECTED_POINT.info.attr.hsp_min,SELECTED_POINT.info.attr.hsp_max);
	setRange('#vrv-ctrl #sp-range .heat',range);

	setCoolSbRange('#vrv-ctrl #setback .cool');
	setHeatSbRange('#vrv-ctrl #setback .heat');

	setRangeInit(SELECTED_POINT);
	$('#operation #vrv-ctrl').show();
});

$(document).on('keypress keyup blur','.allownumericwithoutdecimal',function(e) {    
   $(this).val($(this).val().replace(/[^\d].+/, ""));
   	if ((e.which < 48 || e.which > 57) && e.which != 8) {  //numbers between 48 - 57, backspace is 8
		e.preventDefault();
	}
});

$(document).on('click','#system .menu-item#connect',function(e) {
	$('#system .setup').hide();
	$('#system .connection').show();
});

// page before show 
$(document).on('page_before_show','.screen',function(e) {
	$('.loading').hide();
	resize();
});

// SCREEN_LSIT.top.zoom current zoom
// SCREEN_LIST.top.x moved position by mouse
// SCREEN_LIST.top.y moved position by mouse
$(document).on('page_before_show','.screen#top',function(e) {
	$('.cell-area').html('');
	$('.contents-area').removeClass('noscrlbar');

	if(SCREEN_LIST.top.type == 'standard') {
		// put screen button
		var screen_id = SCREEN_LIST.top.screen;	// screen button list
		for(var i in screen_id) {
			var screen = SCREEN_LIST[screen_id[i]];
			if(screen == null) break;
			$('.cell-area').append(scrnBtnGenerator(screen));
			countOpUnits(screen);
		}
	} else if(SCREEN_LIST.top.type == 'visual') {
		$('.contents-area').addClass('noscrlbar');
		var bgimg = SCREEN_LIST.top.bgimg;
		if(LOCAL == false) {
			var id = GID;
			if(SITE_ID != null) id = SITE_ID;
			bgimg = bgimg.replace('screen','../screen/'+id);
		}
		$('.screen .contents-area').html('<div class="visual-area"></div>');
		$('.screen .contents-area .visual-area').css('background-image','url('+bgimg+')');
		var img = new Image();
		img.src = bgimg;
		img.onload = function() {
			$('.screen .contents-area .visual-area').css({width:img.width,height:img.height});
		}

		if(SCREEN_LIST.top.screen != null && SCREEN_LIST.top.screen.length > 0) {
			var screen_id = SCREEN_LIST.top.screen;	// screen button list
			for(var i in screen_id) {
				var screen = SCREEN_LIST[screen_id[i]];
				if(screen == null) break;
				$('.contents-area .visual-area').append(scrnBtnGenerator(screen));
				countOpUnits(screen);
				var x = 0;
				var y = 0;
				if(SCREEN_LIST.top.layout != null && SCREEN_LIST.top.layout[screen_id[i]] != null) {
					x = SCREEN_LIST.top.layout[screen_id[i]].x;
					y = SCREEN_LIST.top.layout[screen_id[i]].y;
					if(x == null) x = 0;
					if(y == null) y = 0;
				}
				$('.visual-area #'+screen_id[i]).css('top',y);
				$('.visual-area #'+screen_id[i]).css('left',x);
			}
		} else {
			for(var pid in POINT_LIST) {
				var point = POINT_LIST[pid];
				if(point == null) continue;
				$('.contents-area .visual-area').append(iconGenerator(point));
				cellStatus(point);
				var x = 0;
				var y = 0;
				if(SCREEN_LIST.top.layout != null && SCREEN_LIST.top.layout[pid] != null) {
					x = SCREEN_LIST.top.layout[pid].x;
					y = SCREEN_LIST.top.layout[pid].y;
				}
				$('.visual-area #'+pid).css('top',y);
				$('.visual-area #'+pid).css('left',x);
			}
		}

		// zoom and position
		var x = SCREEN_LIST.top.x;
		var y = SCREEN_LIST.top.y;
		var zoom = SCREEN_LIST.top.zoom;	
		setVisualScreen(x,y,zoom);

		var hammer = new Hammer($('.visual-area')[0]);
		hammer.get('pinch').set({enable:true});
		hammer.get('pan').set({threshold:0});

		var orgx,orgy;
		hammer.on('panstart',function(e) {
			var pos = $('.screen .contents-area .visual-area').offset();
			orgx = pos.left;
			orgy = pos.top;
		  $('.visual-area').css('cursor', 'move');
		}).on('panmove',function(e) {
	    $('.screen .contents-area .visual-area').offset({top:orgy+e.deltaY,left:orgx+e.deltaX});
		}).on('panend',function(e) {
	    $('.visual-area').css('cursor', 'default');
			var pos = $('.screen .contents-area .visual-area').offset();
	    SCREEN_LIST.top.x = pos.left;
	    SCREEN_LIST.top.y = pos.top;		
		});

		hammer.on('pinchstart',function(e) {
			if(SCREEN_LIST.top.zoom == null) SCREEN_LIST.top.zoom = 1;
			$('.visual-area').css('transform-origin',e.center.x+'px '+e.center.y+'px');
		}).on('pinchmove',function(e) {
			var zoom = SCREEN_LIST.top.zoom*e.scale;
			if(zoom < 0.3) zoom = 0.3;
			if(zoom > 3) zoom = 3;
			$('.visual-area').css({transform:'scale('+zoom+')'});
		}).on('pinchend',function(e) {
			var zoom = SCREEN_LIST.top.zoom*e.scale;
			if(zoom < 0.3) zoom = 0.3;
			if(zoom > 3) zoom = 3;
			SCREEN_LIST.top.zoom = zoom;
		});
	} else {	// default
		for(var id in POINT_LIST) {
			var point = POINT_LIST[id];
			// insert cell to cell-area
			$('.cell-area').append(cellGenerator(point));
			cellStatus(point);
		}
	}

	// menue indication depend on user
	if(USER != 'admin') {
		$('.menu-area #schedule').hide();
		$('.menu-area #interlock').hide();
		$('.menu-area #history').hide();
		$('.menu-area #hotel').hide();
		$('.menu-area #hotelctl').hide();
		$('.menu-area #ppd').hide();
		$('.menu-area #report').hide();
	}
	// Data Management indication depend on enable/disable
	if(DBMAN == false) $('.menu-area .menu-item#report').hide();
	// PPD billing indication depend on enable/disable
	if(PPD == false) $('.menu-area .menu-item#ppd').hide();
	
	if(MODEL != 'S2' && MODEL != 'S3' && MODEL != 'S4') $('.menu-area .menu-item#hotel').hide();
	if(MODEL != 'C1' && MODEL != 'H1' && MODEL != 'R3') {
		if(MODEL != 'S2') $('.menu-area #schedule').hide();
		$('.menu-area #interlock').hide();
		$('.menu-area #history').hide();
		$('.menu-area #scenes').hide();
	}
	if(MODEL != 'C1' || HOTEL == false) $('.menu-area #hotelctl').hide();

	if(MODEL == 'S1') {
		$('.menu-area #schedule').hide();
		$('.menu-area #interlock').hide();
		$('.menu-area #history').hide();
		$('.menu-area #hotel').hide();
		$('.menu-area #hotelctl').hide();
	}
	if(MODEL != 'S1')	{
		$('.menu-area #op_info').hide();
		getInterlock();
	}

	if(MODEL == 'R3') {
		$('.menu-area #interlock').hide();
		$('.menu-area #scenes').hide();
		$('.menu-area #history').hide();
		$('.menu-area #hotel').hide();
		$('.menu-area #hotelctl').hide();
		$('.menu-area #ppd').hide();
		$('.menu-area #report').hide();
	}

	if(MODEL == 'S4') {
		$('.menu-area #schedule').hide();
		$('.menu-area #interlock').hide();
		$('.menu-area #scenes').hide();
		$('.menu-area #history').hide();
		$('.menu-area #hotel').hide();
		$('.menu-area #hotelctl').hide();
		$('.menu-area #ppd').hide();
		$('.menu-area #report').hide();
	}
});

$(document).on('page_before_show','.screen#section',function(e) {
	$('.cell-area').html('');
	$('.contents-area').removeClass('noscrlbar');

	var name = SCREEN_LIST[SID].name;
	var points = SCREEN_LIST[SID].point;
	$('.screen#section .menu-area .menu-info').html(name);

	if(SCREEN_LIST[SID].type == 'standard') {
		// show scroll bar
		for(var i in points) {
			var point = POINT_LIST[points[i]];
			if(point == null) continue;
			$('.cell-area').append(cellGenerator(point));
			cellStatus(point);
		}
	} else if(SCREEN_LIST[SID].type == 'visual') {
		ZOOM = 1;
		$('.contents-area').addClass('noscrlbar');
		var bgimg = SCREEN_LIST[SID].bgimg;
		if(LOCAL == false) {
			var id = GID;
			if(SITE_ID != null) id = SITE_ID;
			bgimg = bgimg.replace('screen','../screen/'+id);
		}
		$('#section .contents-area').html('<div class="visual-area"></div>');
		$('#section .contents-area .visual-area').css('background-image','url('+bgimg+')');
		var img = new Image();
		img.src = bgimg;
		img.onload = function() {
			$('.screen .contents-area .visual-area').css({width:img.width,height:img.height});
		}

		for(var i in points) {
			var point = POINT_LIST[points[i]];
			if(point == null) continue;
			$('#section .contents-area .visual-area').append(iconGenerator(point));
			cellStatus(point);
			var x = 0;
			var y = 0;
			if(SCREEN_LIST[SID].layout != null && SCREEN_LIST[SID].layout[points[i]] != null) {
				x = SCREEN_LIST[SID].layout[points[i]].x;
				y = SCREEN_LIST[SID].layout[points[i]].y;
			}
			$('.visual-area #'+points[i]).css('top',y);
			$('.visual-area #'+points[i]).css('left',x);
		}
		// zoom and position
		var x = SCREEN_LIST[SID].x;
		var y = SCREEN_LIST[SID].y;
		var zoom = SCREEN_LIST[SID].zoom;	
		setVisualScreen(x,y,zoom);

		var hammer = new Hammer($('.visual-area')[0]);
		hammer.get('pinch').set({enable:true});
		hammer.get('pan').set({threshold:0});

		var orgx,orgy;
		hammer.on('panstart',function(e) {
			var pos = $('.screen .contents-area .visual-area').offset();
			orgx = pos.left;
			orgy = pos.top;
		  $('.visual-area').css('cursor', 'move');
		}).on('panmove',function(e) {
	    $('.screen .contents-area .visual-area').offset({top:orgy+e.deltaY,left:orgx+e.deltaX});
		}).on('panend',function(e) {
	    $('.visual-area').css('cursor', 'default');
			var pos = $('.screen .contents-area .visual-area').offset();
	    SCREEN_LIST[SID].x = pos.left;
	    SCREEN_LIST[SID].y = pos.top;		
		});

		hammer.on('pinchstart',function(e) {
			if(SCREEN_LIST.top.zoom == null) SCREEN_LIST.top.zoom = 1;
			$('.visual-area').css('transform-origin',e.center.x+'px '+e.center.y+'px');
		}).on('pinchmove',function(e) {
			var zoom = SCREEN_LIST.top.zoom*e.scale;
			if(zoom < 0.3) zoom = 0.3;
			if(zoom > 3) zoom = 3;
			$('.visual-area').css({transform:'scale('+zoom+')'});
		}).on('pinchend',function(e) {
			var zoom = SCREEN_LIST.top.zoom*e.scale;
			if(zoom < 0.3) zoom = 0.3;
			if(zoom > 3) zoom = 3;
			SCREEN_LIST.top.zoom = zoom;
		});
	}

	// menue indication depend on user
	if(USER != 'admin') {
		$('.menu-area #schedule').hide();
		$('.menu-area #interlock').hide();
		$('.menu-area #history').hide();
		$('.menu-area #hotel').hide();
	}
	// PPD billing menu icon depend on enable/disable
	if(PPD == false) $('.menu-area .menu-item#ppd').hide();
	
});

$(document).on('page_before_show','.screen#operation.fcu-op',function(e) {
	resize();
	// set setpoint information to SP_INFO
	var range = getSpRange(SELECTED_POINT);
	SP_INFO.range_min = range[0];
	SP_INFO.range_max = range[1];
	SP_INFO.csp_limit_valid = SELECTED_POINT.stat.csp_limit_valid;
	SP_INFO.hsp_limit_valid = SELECTED_POINT.stat.hsp_limit_valid;
	SP_INFO.csp_max = SELECTED_POINT.info.attr.csp_max;
	SP_INFO.csp_min = SELECTED_POINT.info.attr.csp_min;
	SP_INFO.hsp_max = SELECTED_POINT.info.attr.hsp_max;
	SP_INFO.hsp_min = SELECTED_POINT.info.attr.hsp_min;
	SP_INFO.csp_l = SELECTED_POINT.stat.csp_l;
	SP_INFO.csp_h = SELECTED_POINT.stat.csp_h;
	SP_INFO.hsp_l = SELECTED_POINT.stat.hsp_l;
	SP_INFO.hsp_h = SELECTED_POINT.stat.hsp_h;
	SP_INFO.csp = SELECTED_POINT.stat.csp;
	SP_INFO.hsp = SELECTED_POINT.stat.hsp;
	SP_INFO.mode = SELECTED_POINT.stat.mode;
	SP_INFO.csp_sb = SELECTED_POINT.stat.csp_sb;
	SP_INFO.hsp_sb = SELECTED_POINT.stat.hsp_sb;
	SP_INFO.actual_mode = SELECTED_POINT.stat.actual_mode;

	$('#operation #point-name').text(SELECTED_POINT.info.name);
	drawSpControlButton($('.sp-control'));
	drawSpRange($('.sp-control'));
	setSp($('.sp-control'));
	drawSetback($('.sp-control'));
	setStatus(SELECTED_POINT);

	// menue indication depend on user
	if(USER != 'admin') {
		$('.operation-panel .offtimer').hide();
		$('.operation-panel .off-timer-duration').hide();
		$('.menu-area #setup').hide();
	}

	if(MODEL == 'R3') {
		$('.menu-area #setup').hide();
	}

	if(OP_LIMIT['sp'] == true) $('#operation .operation-panel .sp-control .sp-button').hide();
	if(OP_LIMIT['mode'] == true) $('#operation .operation-panel .button-area').hide();
});

$(document).on('page_before_show','.screen#operation.vam-op',function(e) {
	resize();

	$('#operation #point-name').text(SELECTED_POINT.info.name);
	setStatusVam(SELECTED_POINT);

	// menue indication depend on user
	if(USER != 'admin') {
		$('.operation-panel .offtimer').hide();
		$('.operation-panel .off-timer-duration').hide();
	}
});

$(document).on('page_before_show','.screen#operation.dio-op',function(e) {
	resize();

	$('#operation.dio-op #point-name').text(SELECTED_POINT.info.name);
	setStatusDio(SELECTED_POINT);

	// menue indication depend on user
	if(USER != 'admin') {
		$('.operation-panel .offtimer').hide();
		$('.operation-panel .off-timer-duration').hide();
	}
});

$(document).on('page_before_show','.screen#operation.lock-op',function(e) {
	resize();

	$('#operation.lock-op #point-name').text(SELECTED_POINT.info.name);
	setStatusLock(SELECTED_POINT);
});

$(document).on('page_before_show','.screen#operation.shutter-op',function(e) {
	resize();

	$('#operation.shutter-op #point-name').text(SELECTED_POINT.info.name);
	setStatusShutter(SELECTED_POINT);
});

$(document).on('page_before_show','.screen#operation.ao-op',function(e) {
	resize();

	$('#operation.ao-op #point-name').text(SELECTED_POINT.info.name);
	setStatusAo(SELECTED_POINT);
	$('#operation.ao-op .slide-ctrl .slider').slider({change:function(event,ui){pushCommand('av',ui.value);}});
});

$(document).on('page_before_show','.screen#operation.lsw-op',function(e) {
	resize();

	$('#operation.lsw-op #point-name').text(SELECTED_POINT.info.name);
	setStatusDio(SELECTED_POINT);

	setStatusAo(SELECTED_POINT);
	$('#operation.lsw-op .slide-ctrl .slider').slider({change:function(event,ui){pushCommand('av',ui.value);}});

	// menue indication depend on user
	if(USER != 'admin') {
		$('.operation-panel .offtimer').hide();
		$('.operation-panel .off-timer-duration').hide();
	}
});

$(document).on('page_before_show','.screen#operation.rgb-op',function(e) {
	resize();

	$('#operation.rgb-op #point-name').text(SELECTED_POINT.info.name);
	setStatusDio(SELECTED_POINT);

	setStatusRgb(SELECTED_POINT);
	$('#operation.rgb-op .slide-ctrl#analog-val .slider').slider({change:function(event,ui){pushCommand('av',ui.value);}});
	$('#operation.rgb-op .slide-ctrl#r-val .slider').slider({change:function(event,ui){pushCommand('r',ui.value);}});
	$('#operation.rgb-op .slide-ctrl#g-val .slider').slider({change:function(event,ui){pushCommand('g',ui.value);}});
	$('#operation.rgb-op .slide-ctrl#b-val .slider').slider({change:function(event,ui){pushCommand('b',ui.value);}});
	$('#operation.rgb-op .slide-ctrl#w-val .slider').slider({change:function(event,ui){pushCommand('w',ui.value);}});

	// menue indication depend on user
	if(USER != 'admin') {
		$('.operation-panel .offtimer').hide();
		$('.operation-panel .off-timer-duration').hide();
	}
});

$(document).on('page_before_show','.screen#operation.ir-op',function(e) {
	resize();

	$('#operation.ir-op #point-name').text(SELECTED_POINT.info.name);
	var command = SELECTED_POINT.info.attr.command;
	var btn = "";
	for(var i in command) {
		var key = command[i];
		if(key == 'stat') key = 'onoff';
		btn += ("<div class='button ir' id='"+command[i]+"'>"+getString(key)+"</div>");
	}
	$('#operation.ir-op .button-area').html(btn);
});

$(document).on('page_before_show','.screen#operation.fcumq-op',function(e) {
	resize();

	$('#operation.fcumq-op #point-name').text(SELECTED_POINT.info.name);
	setStatusDio(SELECTED_POINT);

	// set fan steps
	var fan_steps = SELECTED_POINT.info.attr.fan_steps;
	$('#operation.fcumq-op .pulldown #1').text(fan_steps[1]);
	$('#operation.fcumq-op .pulldown #2').text(fan_steps[2]);
	$('#operation.fcumq-op .pulldown #3').text(fan_steps[3]);
	$('#operation.fcumq-op .pulldown #4').text(fan_steps[4]);
	$('#operation.fcumq-op .pulldown #5').text(fan_steps[5]);
	$('#operation.fcumq-op .pulldown #6').text(fan_steps[6]);
	$('#operation.fcumq-op .pulldown #7').text(fan_steps[7]);
	$('#operation.fcumq-op .pulldown #0x80').text(fan_steps[0x80]);
//	$('#operation.fcumq-op .pulldown').show();
	var fan = SELECTED_POINT.stat.fanstep;
	if(fan >= 0x80) fan = '0x80';
	$('#operation.fcumq-op .pulldown').val(fan);
});

function fan_select() {
	fan = $('#operation.fcumq-op .pulldown option:selected').val();
	fan = parseInt(fan);
	pushCommand('fanstep',fan);
}
