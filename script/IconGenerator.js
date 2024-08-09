// Point cell generator
function iconGenerator(point) {
	switch(point.info.type) {
		case 'Fcu':
		case 'Ahu':
			return fcuIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'Vam':
			return vamIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'Di':
		case 'Dio':
		case 'LevelSw':
		case 'RgbLevel':
		case 'KeyLock':
			return dioIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'Ai':
		case 'Ao':
			return aiIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'Msi':
		case 'Mso':
			return msiIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'Pi':
			return piIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'SPi':
			return spiIcon(point.info.id,point.info.name,point.info.icon,"");
		case 'Shutter':
		case 'Ir':
			return otherIcon(point.info.id,point.info.name,point.info.icon,"");			
	}
}

function iconGeneratorLite(point) {
	var org = location.origin+"/";
	switch(point.type) {
		case 'Fcu':
		case 'Ahu':
			return fcuIcon(point.id,point.name,point.icon,org);
		case 'Vam':
			return vamIcon(point.id,point.name,point.icon,org);
		case 'Di':
		case 'Dio':
		case 'LevelSw':
		case 'RgbLevel':
		case 'KeyLock':
			return dioIcon(point.id,point.name,point.icon,org);
		case 'Ai':
		case 'Ao':
			return aiIcon(point.id,point.name,point.icon,org);
		case 'Msi':
		case 'Mso':
			return msiIcon(point.id,point.name,point.icon,org);
		case 'Pi':
			return piIcon(point.id,point.name,point.icon,org);
		case 'SPi':
			return spiIcon(point.id,point.name,point.icon,org);
		case 'Shutter':
		case 'Ir':
			return otherIcon(point.id,point.name,point.icon,org);			
	}
}

// FCU
function fcuIcon(id,name,icon,org) {
	return "<div class='layout fcu' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='"+org+"icon/"+icon+"'>"+
				"<img class='chmaster hide' src='"+org+"image/chmaster.png'>"+
				"<img class='filter hide' src='image/filter.png'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<img class='op-cond hide' src='image/csb.png'>"+
				"<div class='info-area'>"+
					"<img class='mode' src='image/cool.png'>"+
					"<img class='fanstep hide' src='image/fanstep3-5.png'>"+
					"<img class='flap hide' src='image/wflap7.png'>"+
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
						"<img src='"+org+"image/thermo.png'>"+
						"<span class='val'>--.-</span>"+
						"<span class='unit'>&deg;C</span>"+
					"</div>"+
				"</div>"+
			"</div>"+
		"</div>";
}

// VAM
function vamIcon(id,name,icon,org) {
	return "<div class='layout vam' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='"+org+"icon/"+icon+"'>"+
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
function dioIcon(id,name,icon,org) {
	return "<div class='layout dio' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon stat off' src='"+org+"icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
				"<div class='info-area'>"+
					"<Img class='off-timer hide' src='image/offtimer-green.png'>"+
				"</div>"+
			"</div>"+
			"<div class='stat-area'>"+
			"</div>"+
		"</div>";
}
// Other
function otherIcon(id,name,icon,org) {
	return "<div class='layout other' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='"+org+"icon/"+icon+"'>"+
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
function aiIcon(id,name,icon,org) {
	return "<div class='layout ai' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='"+org+"icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
			"</div>"+
		"</div>";
}
// Pi
function piIcon(id,name,icon,org) {
	return "<div class='layout pi' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='"+org+"icon/"+icon+"'>"+
				"<img class='error hide' src='image/error.png'>"+
				"<div class='errcode hide'></div>"+
			"</div>"+
			"<div class='stat-area'>"+
				"<div class='val-area'>"+
					"<div class='val'></div>"+
					"<div class='unit'></div>"+
				"</div>"+
			"</div>"+
		"</div>";
}
// SPi
function spiIcon(id,name,icon,org) {
	return "<div class='layout pi' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='"+org+"icon/"+icon+"'>"+
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
function msiIcon(id,name,icon,org) {
	return "<div class='layout msi' id='"+id+"'>"+
			"<div class='name'>"+name+"</div>"+
			"<div class='icon-area'>"+
				"<img class='icon' src='"+org+"icon/"+icon+"'>"+
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

