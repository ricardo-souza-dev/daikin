$(document).on('page_before_show','.screen#guest-rooms',function(e) {
	$('#guest-rooms .cell-area').html('');

	if(ROOMLIST.VERSION == null) {
		for(var i = 0; i < ROOMLIST.length; i++) {
			var cell = generate_room_cell(ROOMLIST[i]);
			$('#guest-rooms .cell-area').append(cell);
		}
	} else if(ROOMLIST.VERSION == 2) {
		for(let room in ROOMLIST) {
			if(room == "VERSION") continue;
			var cell = generate_room_cell2(room);
			$('#guest-rooms .cell-area').append(cell);
		}
	}
});

$(document).on('click','#guest-rooms .room .rent-stat',function(e) {
	var room = $(this).parent().attr('id');
	var rent_stat = $(this).hasClass('checkin');
	// send command
	console.log(room+" "+rent_stat);
	var stat = 'off';
	if(rent_stat) stat = 'on';
	COMM_PORT.send(['rent',[room,stat]]);

	// flip rent status
	rent = rent_stat_str(rent_stat);
//	if(rent_stat) rent_stat = false;
//	else rent_stat = true;
	$('#guest-rooms #'+room+' .rent-stat').removeClass('checkin').removeClass('checkout').addClass(rent);
	$('#guest-rooms #'+room+' .rent-stat').html(getString(rent));
});

function generate_room_cell(room) {
	name = room[1]
	if(name == null || name.length == 0) name = room[0];
	com_err = '';
	hide = '';
	if(room[2] == false) {com_err = 'com_err'; hide = 'hide';} 
	rent = rent_stat_str(room[3]);
	occ = 'unocc';
	if(room[4] == true) occ = 'occ';
	return "<div class='cell room "+com_err+"' id='"+room[0]+"'><div class='name "+occ+"'>"+name+"</div><div class='button rent-stat "+hide+" "+rent+"'>"+getString(rent)+"</div></div>";
}

function generate_room_cell2(room) {
	name = room
	com_err = '';
	hide = '';
	if(ROOMLIST[room].connection == false) {com_err = 'com_err'; hide = 'hide';}
	var stat = POINT_LIST[ROOMLIST[room].rent].stat.stat;
	if(stat == 'on') stat = true;
	else stat = false 
	rent = rent_stat_str(stat);
	occ = 'unocc';
//	if(room[4] == true) occ = 'occ';
	return "<div class='cell room "+com_err+"' id='"+room+"'><div class='name "+occ+"'>"+name+"</div><div class='button rent-stat "+hide+" "+rent+"'>"+getString(rent)+"</div></div>";
}

function rent_stat_str(stat) {
	rent = 'checkin';
	if(stat == true) rent = 'checkout';
	return rent;
} 

function make_room_hash() {
	if(ROOMLIST.VERSION == null) {
		for(var i = 0; i < ROOMLIST.length; i++) {
			room = ROOMLIST[i][0];
			ROOM_ID[room] = ROOMLIST[i];
		}
	} else if(ROOMLIST.VERSION == 2) {
		console.log("VERSION 2 ROOMLIST");
	}
}

function set_room_stat(room,cos) {
	var room = ROOM_ID[room];
	if(room == null) return;
	for(var key in cos) {
		switch(key) {
			case 'connect':
				if(cos[key] == true) {
					room[2] = true;
					$('.cell#'+room[0]).removeClass('com_err');
					$('.cell#'+room[0]+' .rent-stat').removeClass('hide');
				} else {
					room[2] = false;
					$('.cell#'+room[0]).addClass('com_err');
					$('.cell#'+room[0]+' .rent-stat').addClass('hide');
				}
				break;
			case 'occ':
				if(cos[key] == true) {
					room[4] = true;
					$('.cell#'+room[0]+' .name').removeClass('unocc').addClass('occ');
				} else {
					room[4] = false;
					$('.cell#'+room[0]+' .name').removeClass('occ').addClass('unocc');
				}
				break;
		}
	}
}

function set_room_stat2(room_name,cos) {
	var room = ROOMLIST[room_name];
	if(room == null) return;
	for(var key in cos) {
		switch(key) {
			case 'connection':
				if(cos[key] == true) {
					room.connection = true;
					$('.cell#'+room_name).removeClass('com_err');
					$('.cell#'+room_name+' .rent-stat').removeClass('hide');
				} else {
					room.connection = false;
					$('.cell#'+room_name).addClass('com_err');
					$('.cell#'+room_name+' .rent-stat').addClass('hide');
				}
				break;
			case 'occ':
				if(cos[key] == true) {
					room[4] = true;
					$('.cell#'+room[0]+' .name').removeClass('unocc').addClass('occ');
				} else {
					room[4] = false;
					$('.cell#'+room[0]+' .name').removeClass('occ').addClass('unocc');
				}
				break;
		}
	}
}

function set_rent_stat(result,name) {
	var room = ROOM_ID[name];
	if(room != null) {
		if(result == 'OK') {
			// update rent status by flip
			if(room[3] == true) room[3] = false;
			else room[3] = true;
		}
		rent = rent_stat_str(room[3]);
		$('#guest-rooms #'+name+' .rent-stat').removeClass('checkin').removeClass('checkout').addClass(rent);
		$('#guest-rooms #'+name+' .rent-stat').html(getString(rent));
	}
}
