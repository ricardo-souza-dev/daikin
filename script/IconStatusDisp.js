// Icon on/off status indication

function OnOffStatus(point) {
	var cell = $('.main-screen #'+point.info.id);
	if(point.stat.stat == 'on') {
		$(cell).find('.icon').addClass('on');			
	} else {
		$(cell).find('.icon').removeClass('on');
	}
	return '';
}
