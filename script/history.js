// history screen event
$(document).on('page_before_show','.screen.history',function(e) {
	$('.history .query #from').datepicker({
    showAnim: 'clip',
    changeMonth: true,
    dateFormat: DATEFORMAT,
    onSelect: function(selected, inst) {
    	FROMD = $(this).datepicker('getDate');
    },
    onClose: function( selectedDate ) {
      $( ".history .query #to" ).datepicker( "option", "minDate", selectedDate );
    }
	});
	
	$('.history .query #to').datepicker({
    showAnim: 'clip',
    changeMonth: true,
    dateFormat: DATEFORMAT,
    onSelect: function(selected, inst) {
    	TOD = $(this).datepicker('getDate');
    },
    onClose: function( selectedDate ) {
      $( ".history .query #from" ).datepicker( "option", "maxDate", selectedDate );
    }
	});
	
	getHistory();
});

//History start
$(document).on('click','.history #refresh',function(e) {
	$('.history .query #from').val('');
	
	DATESEL = new Date();
	
	getHistory();
});

$(document).on('click','.history #reset',function(e) {
	$('.history .query #from').val('');
	
	getHistory();
});

$(document).on('click','.history #query',function(e) {
	var dateselected = $('.history .query #from').val();
	
	if(dateselected == null || dateselected == '') {
		alert(getString('enter_date'));
		return;
	}
	
	dateselected = new Date(dateselected);		//convert selected time from datepicker to JS date object
	
	var datetime = new Date(RECPP[1]*1000); 	//convert UNIX time from server to JS date object
	datetime.setHours(0, 0, 0, 0);				//set hours min sec and millisecond to 0
	
	if(dateselected < datetime) {
		var date_word = datetime.toLocaleDateString(LOCALE,DATEOPT);
		var word = getString('does_not_contain_records');
//		alert(eval(getString('does_not_contain_records')));
		alert(word+date_word);
		return;
	}
	
	if(dateselected > Date.now()) {
		alert(getString('past_date'));
		return;
	}
	
	DATESEL = dateselected;						//cannot change DATESEL, will affect date displayed when return condition method
	
	getHistory();
});

$(document).on('click','.history #export',function(e) {
	exportTableToCSV('history.csv');
});	

$(document).on('click','.history .table #history #id',function(e) {
	HISTORY = HISTORY.reverse();
	setHistory();
});

$(document).on('click','.history .table #history #date',function(e) {
	HISTORY = HISTORY.reverse();
	setHistory();
});

$(document).on('click','.history .table #history #time',function(e) {
	HISTORY = HISTORY.reverse();
	setHistory();
});

$(document).on('click','.history .table #history #type',function(e) {
	if($('.history .type .point-select.dialog').attr('reject') == 'true') return;
	
	$('.history .type .point-select.dialog').css('top',100);
	$('.history .type .point-select.dialog').css('left',200);

	fillUniqueList(2);
	
	$('.history .type .point-select.dialog').show();
	$('.history .type .point-select.dialog').attr('reject',true);
});

$(document).on('click','.history .type .dialog .button-area .ok',function(e) {
	//get selected START
	var type = $('.history .type .dialog .multi-selectable-list .list li.selected');
	
	var selected_list = [];
	var selected;
	for(var i = 0; i < type.length; i++) {
		selected = $(type[i]).attr('id');
		selected_list.push(selected);
	}
	//get selected END
	$('.history .type .point-select.dialog').attr('reject',false);
	if(selected_list.length == 0) {return;} 	//do nothing when nothing is selected
	
	//make new HISTORY variable with only selected criteria START
	var tempHistory	= [];
	
	for(var x in HISTORY) {
		for(var y = 0; y < selected_list.length; y++) {
			if(HISTORY[x][2] == selected_list[y]) {
				tempHistory.push(HISTORY[x]);
			}	
		}
		
	}
	
	HISTORY = tempHistory;
	//make new HISTORY variable with only selected criteria END
	
	setHistory();
});	

$(document).on('click','.history .type .dialog .button-area .cancel',function(e) {
	$('.history .type .point-select.dialog').attr('reject',false);
});		

$(document).on('click','.history .table #history #source',function(e) {
	if($('.history .type .point-select.dialog').attr('reject') == 'true') return;
	
	$('.history .source .point-select.dialog').css('top',100);
	$('.history .source .point-select.dialog').css('left',650);

	fillUniqueList(3);
	
	$('.history .source .point-select.dialog').show();
	$('.history .type .point-select.dialog').attr('reject',true);
});

$(document).on('click','.history .source .dialog .button-area .ok',function(e) {
	//get selected START
	var type = $('.history .source .dialog .multi-selectable-list .list li.selected');
	
	var selected_list = [];
	var selected;
	for(var i = 0; i < type.length; i++) {
		selected = $(type[i]).attr('id');
		selected_list.push(selected);
	}
	//get selected END
	$('.history .type .point-select.dialog').attr('reject',false);
	if(selected_list.length == 0) {return;} 	//do nothing when nothing is selected
	
	//make new HISTORY variable with only selected criteria START
	var tempHistory = [];
	
	for(var x in HISTORY) {
		for(var y = 0; y < selected_list.length; y++) {
			if(HISTORY[x][3] == selected_list[y]) {
				tempHistory.push(HISTORY[x]);
			}	
		}
		
	}
	
	HISTORY = tempHistory;
	//make new HISTORY variable with only selected criteria END
	
	setHistory();
});	

$(document).on('click','.history .dialog .button-area .cancel',function(e) {
	$('.history .type .point-select.dialog').attr('reject',false);
});

$(document).on('click','.history .table #history #operator',function(e) {
	if($('.history .type .point-select.dialog').attr('reject') == 'true') return;
	
	$('.history .operator .point-select.dialog').css('top',100);
	$('.history .operator .point-select.dialog').css('left',750);

	fillUniqueList(4);
	
	$('.history .operator .point-select.dialog').show();
	$('.history .type .point-select.dialog').attr('reject',true);
});

$(document).on('click','.history .operator .dialog .button-area .ok',function(e) {
	//get selected START
	var type = $('.history .operator .dialog .multi-selectable-list .list li.selected');
	
	var selected_list = [];
	var selected;
	for(var i = 0; i < type.length; i++) {
		selected = $(type[i]).attr('id');
		selected_list.push(selected);
	}
	//get selected END
	$('.history .type .point-select.dialog').attr('reject',false);
	if(selected_list.length == 0) {return;} 	//do nothing when nothing is selected
	
	//make new HISTORY variable with only selected criteria START
	var tempHistory = [];
	
	for(var x in HISTORY) {
		for(var y = 0; y < selected_list.length; y++) {
			if(HISTORY[x][4] == selected_list[y]) {
				tempHistory.push(HISTORY[x]);
			}	
		}
		
	}
	
	HISTORY = tempHistory;
	//make new HISTORY variable with only selected criteria END
	
	setHistory();
});	

$(document).on('click','.history .table #history #target',function(e) {
	if($('.history .type .point-select.dialog').attr('reject') == 'true') return;
	
	$('.history .target .point-select.dialog').css('top',100);
	$('.history .target .point-select.dialog').css('left',300);

	fillUniqueList(5);
	
	$('.history .target .point-select.dialog').show();
	$('.history .type .point-select.dialog').attr('reject',true);
});

$(document).on('click','.history .target .dialog .button-area .ok',function(e) {
	//get selected START
	var type = $('.history .target .dialog .multi-selectable-list .list li.selected');
	
	var selected_list = [];
	var selected;
	for(var i = 0; i < type.length; i++) {
		selected = $(type[i]).attr('id');
		selected_list.push(selected);
	}
	//get selected END
	$('.history .type .point-select.dialog').attr('reject',false);
	if(selected_list.length == 0) {return;} 	//do nothing when nothing is selected
	
	//make new HISTORY variable with only selected criteria START
	tempHistory = [];
	
	for(var x in HISTORY) {
		for(var y = 0; y < selected_list.length; y++) {
			if(HISTORY[x][5] == selected_list[y]) {
				tempHistory.push(HISTORY[x]);
			}	
		}
		
	}
	
	HISTORY = tempHistory;
	//make new HISTORY variable with only selected criteria END
	
	setHistory();
});	

$(document).on('click','.history .pageNav .prevPage',function(e) {
	$('.history .query #from').val('');
	
	//check and see if HISTORY ID 0 exist, if yes, return
	for (var i in HISTORY) {
		if (HISTORY[i][0] == RECPP[0]) return;
	}
	
	DATESEL.setDate(DATESEL.getDate() - 1);	
	
	getHistory();
});

$(document).on('click','.history .pageNav .nextPage',function(e) {
	$('.history .query #from').val('');
	
	var d = new Date();
	//return and do nothing if DATESEL is today.
	if (DATESEL.getDate() == d.getDate() && DATESEL.getMonth() == d.getMonth() && DATESEL.getFullYear() == d.getFullYear()) {return;}
	
	DATESEL.setDate(DATESEL.getDate() + 1);
	
	getHistory();
});

function getHistory() {
	var fromD = new Date(DATESEL.getTime());
	
	fromD.setHours(0, 0, 0, 0);		//set hours min sec and millisecond to 0
	var toD = new Date(fromD.getTime());
	
	fromD = parseInt((fromD.getTime() / 1000).toFixed(0)); //convert to unix time
	
	toD.setDate(toD.getDate() + 1);						//add one day to toD
	toD = parseInt(toD.getTime() / 1000).toFixed(0);	//convert to unix time
	
	var condition = {};
	condition['from'] = fromD;
	condition['to'] = toD;
	
	var command = ['get_history',condition];
	COMM_PORT.send(command);
	return true;
}

function setHistory() {	
	$('.history .table #history tbody').remove();				//reset to blank table
	
	if (HISTORY.length == 0) {
		$('.history .table #history').append("<tr></tr>");
		alert(getString('no_records'));
	}
	
	for (var i in HISTORY) {		
		var type = HISTORY[i][2];	
		var source = HISTORY[i][3];	
		var operator = HISTORY[i][4];	
		var target = HISTORY[i][5];	
			
		//translate UNIX datetime to normal START
		var a = new Date(HISTORY[i][1]*1000);
		var year = a.getFullYear();
		var month = a.getMonth();
		
		var date = a.getDate();
		if(date < 10) date = "0" + date;
		
		var recordDate = new Date(year, month, date);
		
		var hour = a.getHours();
		if(hour < 10) hour = "0" + hour;
		
		var min = a.getMinutes();
		if(min < 10) min = "0" + min;
		//translate UNIX datetime to normal END
		
		//translate HISTORY contents column to readable text START
		var contents = HISTORY[i][6];
		var output = new String();
		
		if(contents[0].constructor == Object) {
			checksum = 1;
			for (key in contents[0]) {
				if (key == 'av') {		//add unit to AV value, split output because of style difference
					output += "<span class='mls' param='"+key+"'></span>: "; //separate with SPAN if not MLS will change it
					output += "<span class='mls' param='"+contents[0][key]+"'>"+contents[0][key]+"</span> ";
					
					try {
						var targetc = POINT_LIST[target]['info']['attr']['unit_label'];				//Try to see if point has unit label
					}
					catch(err) {
						var targetc = '';															//if fail, blank
					}
					finally {
						output += "<span>" + targetc + "</span>";
					}					
				} else {
					var cand = STAT_STRING[key];
					if(cand != null) {
						if(cand["flag"] == true) {
							output += "<span class='mls' param='"+key+"'></span>: ";
							output += "<span class='mls' param='"+cand[contents[0][key]]+"'></span>";
						} else {
							if(cand[contents[0][key]] != null) output += "<span class='mls' param='"+cand[contents[0][key]]+"'></span>";
							else output += "<span class='mls' param='"+contents[0][key]+"'></span>";
						}
					} else {
						output += "<span class='mls' param='"+key+"'></span>: "; //separate with SPAN if not MLS will change it
						output += "<span class='mls' param='"+contents[0][key]+"'>"+contents[0][key]+"</span>";
					}
				}
				
				//check if last, if not append ", "
				if(Object.keys(contents[0]).length != checksum) output += "<span>, </span>";
				checksum++;
			}
		} else {
			output = getString(contents[0]);
			for(var i = 1; i < contents.length; i++) {
				output = output.replace('param['+i+']',contents[i]);
			}
		}

		var printstring = "<tr><td class='date'>"+recordDate.toLocaleDateString(LOCALE,DATEOPT)+" "+hour+":"+min+"</td>";
		printstring += "<td class='type mls' param='"+type+"'>"+type+"</td>";
		
		try {
			var targetb = POINT_LIST[target].info.name;
		}
		catch(err) {
			var targetb = target;
		}
		finally {
			printstring += "<td class='target'>"+targetb+"</td>";
		}
		
		printstring += "<td class='contents'>"+output+"</td>";
		printstring += "<td  class='source mls' param='"+source+"'>"+source+"</td>";
		printstring += "<td  class='operator'>"+operator+"</td></tr>";
		
		$('.history .table #history').append(printstring);
	}
	
	$('.history .pageNav .pageNum').html(DATESEL.toLocaleDateString(LOCALE,DATEOPT));  //set page number(Date)
	
	setMultiLang('#history .mls');		//for Multi Language Support
	
	COMM_PORT.send(['get_first_id_number']); //to get first record ID number for pageNav
}

function fillUniqueList(iden) {
	//check for unique entries START
	var row = [];
	
	for (var i = 0; i < HISTORY.length; i++) {
		cols = HISTORY[i];
		row.push(cols[iden]);
	}
	
	let unique = [...new Set(row)];
	//check for unique entries END
	
	switch (iden) {
		case 2:
			iden = '.history .type .dialog .multi-selectable-list .list';
			break;
		case 3:
			iden = '.history .source .dialog .multi-selectable-list .list';
			break;
		case 4:
			iden = '.history .operator .dialog .multi-selectable-list .list';
			break;
		case 5:
			iden = '.history .target .dialog .multi-selectable-list .list';
	}
	
	//clear list
	$(iden).empty();
	
	//Fill list
	unique = jQuery.grep(unique, function(n){ return (n); });		//remove space and blank records in array
	unique.sort();													//sort array

	for (var x = 0; x < unique.length; x++) {
		var valx = unique[x];
		
		if(iden == '.history .target .dialog .multi-selectable-list .list') {
			try {
				$(iden).append("<li id='" + valx + "'>" + POINT_LIST[valx].info.name + "</li>");	//'" "' if not will get truncated with space
			}
			catch(err) {
				$(iden).append("<li id='" + valx + "'>" + valx + "</li>");	//'" "' if not will get truncated with space
			}						
		} else {	
				$(iden).append("<li class='mls' param='" + valx + "' id='" + valx + "'>'" + valx + "'</li>");	//'" "' if not will get truncated with space
		}
	}		
	
	setMultiLang('.list .mls');
}

function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;

    csvFile = new Blob([csv], {type: "text/csv;charset=utf-8,%EF%BB%BF"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function exportTableToCSV(filename) {
    var csv = [];
    var rows = $('.history table tbody tr');
    
	csv.push('date & time,type,target,contents,source,operator');	//adding in the header row. If get from tables, it will be in caps, will create type error with excel
	
    for (var i = 0; i < rows.length; i++) {
        var row = [];
		cols = rows[i].querySelectorAll("td, th");
        
        for (var j = 0; j < cols.length; j++) {
			var stringText = '"' + cols[j].innerText + '"';
			row.push(stringText);
		}
        csv.push(row.join(","));        
    }

    downloadCSV(csv.join("\n"), filename);
}