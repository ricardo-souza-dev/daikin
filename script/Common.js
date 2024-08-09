var SCROLL_TOP = 0;

// event
$(window).on('resize',function(e) {
	setWindowSize();
});

function setWindowSize() {
	// without this, scroll bar will appear when window change to small
	$('.container').hide(); 
	WIDTH = $(window).width();
	HEIGHT = $(window).height();
	// adjust screen size to window sise
	$('.container').width(WIDTH);
	$('.container').height(HEIGHT);
	$('.container').show();
	resize();
}

// String table related method to support multi language
function loadStringTable() {
	$.ajaxSetup({async:false});
	$.getJSON('script/StringTable.json', function(data) {
		STRING_TABLE = data;
		console.log("string table is loaded");
	});
	$.getJSON('script/StatString.json', function(data) {
		STAT_STRING = data;
		console.log("stat string is loaded");
	});
	$.ajaxSetup({async:true});
}

function getString(key) {
	var lang = LANG;
	if(key == 'temp_unit') return getTempUnit();
	else {
		var word = STRING_TABLE[lang][key];
		if(word == null) word = key;
		return word;
	}
}

function getTempUnit() {
	if(TEMPUNIT == 'C') return '&deg;C';
	else return '&deg;F';
}

function setMultiLang(selector) {
	$(selector).each(function(i) {
		key = $(this).attr('param');
		word = getString(key);
		$(this).html(word);
	});
	$('#history .ml').each(function(i) {
		word = $(this).attr('param');
		$(this).html(word);
	});
}

function loadScreen(url) {
	var options = {
		type: 'POST',
		url: url,
		dataType: 'html',
		error: function(xhr, textStatus, errorThrown) {
			alert(textStatus);
		},
		success: function(data, textStatus) {
			var loadPoint = '.screen';
			var new_page = $(data).find(loadPoint);
			screenTransition(new_page,loadPoint);
		},
		complete: function(xhr, textStatus) {
		}
	};
	$.ajax(options);
}

function screenTransition(new_page,loadPoint) {
	var event = new $.Event('page_before_show');
	$(loadPoint).fadeOut(500,function() {
		$(loadPoint).replaceWith($(new_page));
		$(loadPoint).trigger(event);
		setMultiLang(loadPoint+' .mls');
		$('.loading').hide();
		$(loadPoint).fadeTo(0,0.1,function() {
			scrollScreen();
			$(loadPoint).fadeTo(500,1);
		});
	});
	resize();
}

function scrollScreen() {
	$('#top .contents-area').scrollTop(SCROLL_TOP);
}

function loadPageByLink(element) {
	var link = $(element).attr('href');
	loadScreen(link);
}

function loadDialog(url) {
	var options = {
		type: 'POST',
		url: url,
		dataType: 'html',
		error: function(xhr, textStatus, errorThrown) {
			alert(textStatus);
		},
		success: function(data, textStatus) {
			var loadPoint = '.dialog';

			var new_page = $(data).filter('.dialog');
			$('.dialog').replaceWith(new_page);
			setMultiLang('.dialog .mls');
			prepareDialog($(new_page).attr('id'));
			var left = parseInt($('.container').attr('left'));
			$('.dialog').css('left',left);
			$('.dialog').show();
		},
		complete: function(xhr, textStatus) {
		}
	};
	$.ajax(options);
}
