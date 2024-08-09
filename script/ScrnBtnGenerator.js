// screen button generator

function scrnBtnGenerator(screen) {
	var id = screen.id;
	var name = screen.name;

	// check if point is exist
	let points = 0;
	for(let p in screen.point) {
		if(POINT_LIST[screen.point[p]] != null) points ++;
	}
	// if screen does not have point then it will not show
	if(points == 0) return "";
	return screenCell(id,name);
}

function screenCell(id,name) {
	return "<div class='cell scrnbtn' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='error hide' src='image/error.png'>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='op-info mls' param='op_units'>operation units</div>"+
				"<div class='op-value'><span class='op-units'>0</span>/<span class='all-units'>0</span></div>"+
			"</div>"+
		"</div>";
}

function countOpUnits(screen) {
	var id = screen.id;
	var points = screen.point;
	var total = 0;
	var op = 0;
	var error = false;
	var types = ['Fcu','Dio','Chiller','Hydrobox','Vam'];
	for(var i in points) {
		var point = POINT_LIST[points[i]];
		if(point == null) continue;
		if(types.indexOf(point.info.type) == -1) continue;
		total++;
		if(point.stat == null) continue;
		if(point.stat.stat == "on")  op++;
		if(point.stat.error == true) error = true;
	}
	if(error == true) $('.scrnbtn#'+id+' .error').removeClass('hide');
	else $('.scrnbtn#'+id+' .error').addClass('hide');

	screen.stat = {};
	screen.stat.op = op;
	screen.stat.total = total;
	$('.scrnbtn#'+id+' .op-units').html(op);
	$('.scrnbtn#'+id+' .all-units').html(total);
}

function updateOpUnits(id, cos) {	// id: point id
	// Update on/off or error only
	if(cos.stat == null && cos.error == null) return;
	// find screen which is contain id
	var list = SCREEN_LIST.top.screen;
	for(var i in list) {
		if(SCREEN_LIST[list[i]].point.indexOf(id) >= 0) {
			sid = list[i];
			countOpUnits(SCREEN_LIST[sid]);
		}
	}
}