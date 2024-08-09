// Standard on/off status indication

function OnOffStatus(point) {
	if(point.stat.stat == 'on') {
		stat = 'image/power-green.png';
	} else {
		stat = 'image/power-gray.png';
	}
	return stat;
}
