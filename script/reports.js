/**************************************************************
 1. "page_before_show" Functions
 2. "on click" Functions
 3. Other Event Handling Functions
 4. Report Supplementary Functions
 5. ANALOG INPUT (Ambient Trend) Report Functions
 6. Energy and Water Management Report Functions
 7. Operation Info and Malfunction Data Management Functions
 8. BEI Analysis Functions
 9. BEI Display (Energy Monitoring) Functions
 10. Energy Category/Category Settings Functions
 11. Set Start Date/Month Functions
 12. Export To CSV Functions
 13. Chart Functions
 14. Datepicker Functions
 15. Screen Resize Functions
 16. Other Util Functions
**************************************************************/
var CHART;
var INTERVAL;
var T_REPORT_FROMD;
var T_REPORT_TOD;
var IS_PREV_PORTRAIT_MODE = false;
var Y_RANGE = {};
var Y2_RANGE = {};
var Y_GRIDLINES = [];
var POINT_UNIT = "";
var MANAGEMENTPOINTLIST = {};
var AIMANAGEMENTPOINTS = [];
var Y_AXIS_UNIT = "";
var Y2_AXIS_UNIT = "";
var Y2_AXES = {};
var MLIST = [];
var TIMEFROM = "0";
var TIMETO = "0";
var TIMEINTERVAL = "3600";
var ISINTERVALCHANGED = false;
var ISTIMECHANGED = false;
var SELECTEDTYPE = ""; // selected PI Category to add
var CATEGORIES = [];

var REPORTTYPE = "";
var CHANGEDPI = [];
var SELECTEDTIMEPERIOD = "";
var REPORT_START_DATE = [];
var BEI_REGULATIONS = [];
var SITE_INFO = [];
var BEI_DISPLAY_TYPE = "";

var DATAROW_ENERGY = [];
var DATAROW_WATER = [];
var DATAROW_BEI = [];
var DATAROW_TEMPERATURE = [];
var BEIDISPLAYTIMEOUT = null;

var ENERGYGENERATORID = 0;
var WATERCONSUMPTIONID = 0;
var RECYCLEDWATERID = 0;
var TOTALID = 0; 
var ISBEIRATINGCOMPLETED = false;
var ISQUERYCLICKED = false;
var ENERGYDATEFROM = null;

var FROMD;
var TOD;

var OPERATION_INFO = [];
var ERROR_INFO = [];

/*******************************************************
 * "page_before_show" functions
********************************************************/
$(document).on('page_before_show','.screen#reports',function(e) {
	$('.cell-area').html('');
	$('.contents-area').removeClass('noscrlbar');
	var distinct = [];
	
	for(var i in REPORT_TYPE_LIST.reportTypes) {
		var name = REPORT_TYPE_LIST.reportTypes[i].name;
		var title = REPORT_TYPE_LIST.reportTypes[i].title;
		var iconLink = REPORT_TYPE_LIST.reportTypes[i].icon;
		var divName = '.cell-area .report#' + title.replace(/\s/g, '_');
		if(BEI == false && title == 'bei_rating') continue;
		
		if (distinct.indexOf(title) < 0){
	        distinct.push(title);
	        $('.cell-area').append("<div class='report' id='"+title.replace(/\s/g, '_')+"'><div class='reportTitle mls' param='"+title+"'>"+getString(title)+"</div></div>");
	        $(divName).append("<div class='reportTypebutton' id="+encodeURI(name)+"><div class='name mls' param='"+name+"'>"+name+"</div><div class='icon-area'><img class='icon' src="+iconLink+"></div></div>");  
		}else{
			$(divName).append("<div class='reportTypebutton' id="+encodeURI(name)+"><div class='name mls' param='"+name+"'>"+name+"</div><div class='icon-area'><img class='icon' src="+iconLink+"></div></div>");
		}
	}
	
	var isWaterEnabled = PI_CATEGORIES['Water_Consumption'][0]["isEnabled"];
	
	if(!isWaterEnabled){
		$('.reportTypebutton#water_management').hide();
	}else{
		$('.reportTypebutton#water_management').show();
	}
	
	resizeReportScreen();
});

$(document).on('page_before_show','.screen#Analog_Input_Report',function(e) {
	checkScreenWidth();
	initReportDatePicker();
	TEMP_DATA = null;
	DATAROW = [];
});

$(document).on('page_before_show','.screen#bei_rating_display',function(e) {
	checkScreenWidth();
	refreshDisplay(0);
});

$(document).on('page_before_show','.screen#BEI_Analysis_Report',function(e) {
	setCategoryIDs();
	checkScreenWidth();
	initReportDatePicker();
	$("#SelectTimePeriod_p3y").prop("checked", true); // for >Jquery v1.6
});

$(document).on('page_before_show','.screen#Energy_Management_Report',function(e) {
	setCategoryIDs();
});

$(document).on('page_before_show','.screen#Water_Management_Report',function(e) {
	setCategoryIDs();
});

$(document).on('page_before_show','.screen#err_reporting',function(e) {
	initReportDatePicker();
});

/*******************************************************
 * "on click" Functions
********************************************************/
$(document).on('click','#reports .cell-area .reportTypebutton',function(e){
	var reportType = decodeURI($(this).attr('id'));
	SCROLL_TOP = $('.contents-area').scrollTop();
	
	ISINTERVALCHANGED = false;
	ISTIMECHANGED = true;
	MLIST = [];
	TIMEFROM = "0";
	TIMETO = "0";
	TIMEINTERVAL = "3600";
	formatAIData2(null);
	DATAROW_ENERGY = [];
	DATAROW_BEI = [];
	localization("");
	
	if (reportType == 'ambient_trend'){
		REPORTTYPE = 'temperature';
		displayChart();
		loadScreen('analog_input_report.html');
	} else if (reportType == 'energy_management'){
		displayChart();
		PI_CATEGORIES = {};
		CATEGORIZED_PI = {};
		SELECTEDTIMEPERIOD = "";
		getPiCategories();
		getCategorizedPiManagementPoints();
		REPORTTYPE = 'energy';
		getReportStartDate();
		loadScreen('energy_management_report.html');
	}else if (reportType == 'water_management'){
		displayChart();
		PI_CATEGORIES = {};
		CATEGORIZED_PI = {};
		getPiCategories();
		getCategorizedPiManagementPoints();
		SELECTEDTIMEPERIOD = "";
		REPORTTYPE = 'water';
		getReportStartDate();
		loadScreen('water_management_report.html');	
	}else if (reportType == 'energy_mon'){
		REPORTTYPE = 'bei_display';
		loadScreen('bei_rating_display.html');
	}else if (reportType == 'bei_analysis'){
		displayChart();
		PI_CATEGORIES = {};
		CATEGORIZED_PI = {};
		getPiCategories();
		getCategorizedPiManagementPoints();
		SELECTEDTIMEPERIOD = "";
		REPORTTYPE = 'bei_analysis';
		getReportStartDate();
		getBEIRegulations();
		getSiteInfo();
		loadScreen('bei_analysis.html');
	}else if (reportType == 'op_time'){
		getReportStartDate();
		loadScreen('operation_info.html');
	}else if (reportType == 'err_reporting'){
		loadScreen('error_reporting.html');
	}else{
		//alert("Report Type Not Found!");
		alert(getString("rep_err_no_report_type"));
	}
});

$(document).on('click','.menu-item#report',function(e) {
	getReportTypes();	
	getPiCategories();
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('report_screen.html');
});

$(document).on('click','.menu-item#op_info',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('operation_info.html');
});

$(document).on('click','.menu-item#piCatgories',function(e) {
	PI_CATEGORIES = {};
	getPiCategories();
	getCategorizedPiManagementPoints();	
	REPORTTYPE = "pi_categories";
	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('pi_categories.html');
});

$(document).on('click','.menu-item#piSetting',function(e) {
	CATEGORIZED_PI = {};
	PI_CATEGORIES = {};
	REPORTTYPE = "pi_Settings";
	
	getPiCategories();
	getCategorizedPiManagementPoints();	
	
	SCROLL_TOP = $('.contents-area').scrollTop();
	loadScreen('pi_setting.html');
});

$(document).on('click','#bei_rating_display .menu-item#backToReports',function(e) {
	SCROLL_TOP = $('.contents-area').scrollTop();
	clearTimeout(BEIDISPLAYTIMEOUT);
	getPiCategories();
	REPORTTYPE = "";
	loadScreen('report_screen.html');
});

$(document).on('click','.menu-item#backToReports',function(e) {
	if(MODEL == 'S1') {
		loadScreen('top_screen.html');
	} else {
		SCROLL_TOP = $('.contents-area').scrollTop();
		getPiCategories();
		REPORTTYPE = "";
		loadScreen('report_screen.html');
	}
});

$(document).on('click','#Analog_Input_Report .Management_Points #ulManagementPointList li',function(e) {
	changeSelectAllButton();
	MLIST = appendSelectedManagementPoints();
});

$(document).on('click','#Analog_Input_Report .Management_Points .selectAllButton#selectAll',function(e){
	$(this).replaceWith("<span class='selectAllButton mls' id='unSelectAll' param='unselect_all'>" + getString("unselect_all") + "</span>");
	selectAllManagementPoints();
	MLIST = appendSelectedManagementPoints();
});

$(document).on('click','#Analog_Input_Report .Management_Points .selectAllButton#unSelectAll',function(e){
	$(this).replaceWith("<span class='selectAllButton mls' id='selectAll' param='select_all'>" + getString("select_all") + "</span>");
	unSelectAllManagementPoints();
	MLIST = appendSelectedManagementPoints();
});

$(document).on('click','.screen#Analog_Input_Report #Query',function(e) {
	console.time('finished load chart');
	console.time('milestone1 - finished javascript before DB');
	$('.loading').show();
	processAnalogInput();
});

$(document).on('click','.screen#Energy_Management_Report #Query',function(e) {
	console.time('finished load chart');
	console.time('milestone1 - finished javascript before DB');
	ISQUERYCLICKED = true;
	$('.loading').show();
	processEnergyReport();
	
});

$(document).on('click','.screen#Water_Management_Report #Query',function(e) {
	console.time('finished load chart');
	console.time('milestone1 - finished javascript before DB');
	ISQUERYCLICKED = true;
	$('.loading').show();
	processEnergyReport();
});

$(document).on('click','.screen#BEI_Analysis_Report #Query',function(e) {
	console.time('finished load chart');
	console.time('milestone1 - finished javascript before DB');
	ISQUERYCLICKED = true;
	$('.loading').show();
	processBEIReport();
});

$(document).on('click','.screen#operation_info #Query',function(e) {
	console.time('milestone1 - finished javascript before DB');
	ISQUERYCLICKED = true;
	$('.loading').show();
	processOperationInfo();
});

$(document).on('click','.screen#err_reporting #Query',function(e) {
	console.time('milestone1 - finished javascript before DB');
	ISQUERYCLICKED = true;
	$('.loading').show();
	processErrorReporting();
});

$(document).on('click','#EnergyReportCategories',function(e) {
	displayEnergyChart();
});

$(document).on('click','#WaterReportCategories',function(e) {
	displayEnergyChart();
});

$(document).on('click','#TimeControl #TimePeriod_Day',function(e) {
	var type = "Day";
	$("#SelectTimePeriod_day").prop("checked", true); // for >Jquery v1.6
	changeTimePeriodInputFunction(type);
});	

$(document).on('click','#TimeControl #TimePeriod_Month',function(e) {
	var type = "Month";
	$("#SelectTimePeriod_month").prop("checked", true); // for >Jquery v1.6
	changeTimePeriodInputFunction(type);
});	

$(document).on('click','#TimeControl #TimePeriod_Year',function(e) {
	var type = "Year";
	$("#SelectTimePeriod_year").prop("checked", true); // for >Jquery v1.6
	changeTimePeriodInputFunction(type);
});	

$(document).on('click','#TimeControl #month_to_date',function(e) {
	$('#BEI').hide();
	$('#Consumption_Details').show();
	$("#SelectTimePeriod_mtd").prop("checked", true); // for >Jquery v1.6
});	

$(document).on('click','#TimeControl #past_3_years',function(e) {
	$('#BEI').show();
	$('#Consumption_Details').hide();
	$("#SelectTimePeriod_p3y").prop("checked", true); // for >Jquery v1.6
});	

$(document).on('click','#Pi_Uncategorized #ulUncategorized li',function(e) {
	var id = $(this).attr('id');
	var index = $(this).index();
	highlightPiInDialog(id, index);
});

$(document).on('click','#pi_Categories #pi_category_settings #EnableEnergy',function(e) {
	var isEnabled = $('#pi_Categories #pi_category_settings #EnableEnergy .disable').hasClass('hide');
	if(isEnabled){
		$('#pi_Categories #Energy').show();
	}else {
		$('#pi_Categories #Energy').hide();
	}
});

$(document).on('click','#pi_Categories #pi_category_settings #EnableWater',function(e) {
	var isEnabled = $('#pi_Categories #pi_category_settings #EnableWater .disable').hasClass('hide');
	if(isEnabled){
		$('#pi_Categories #pi_category_settings #EnableWaterGen').show();
	}else {
		$('#pi_Categories #pi_category_settings #EnableWaterGen .disable').removeClass('hide');
		$('#pi_Categories #pi_category_settings #EnableWaterGen .enable').addClass('hide');
		$('#pi_Categories #pi_category_settings #EnableWaterGen').hide();
	}
});

$(document).on('click','#Pi_Categorized .img-button',function(e) {
	SELECTEDTYPE = $(this).parent().attr('id');
	var x = $(this).position();
	if(SELECTEDTYPE == 'Water_Consumption' ||  SELECTEDTYPE == 'Recycled_Water') {
		$('#pi_Setting .point-select.dialog').css('top',x.top-250);
	}else{
		$('#pi_Setting .point-select.dialog').css('top',x.top-100);
	}

	$('#pi_Setting .point-select.dialog').css('left',x.left);
	getPiManagementPoints();
	$('#pi_Setting .point-select.dialog').show();
});

$(document).on('click','#unCategorizedDialog .button.ok',function(e) {
	var list = []; 
	$('#unCategorizedList #ulUncategorized li').each(function(){
		if( $( this ).hasClass("selected")){
			list.push($(this).attr("id"));
		}
	});
	removeUnselectedPi(list);
	savePI(list);
});

$(document).on('click','#pi_category_settings #pi-category-save',function(e) {
	var energy = [];
	var energyGen = [];
	var water = [];
	var waterGen = [];
	var total = [];
	var owner = '';
	var isEnergyEnabled = $('#pi_Categories #pi_category_settings #EnableEnergy .disable').hasClass('hide');
	
	for(i=0; i<3; i++){
		var energyType = encodeURIComponent($('#Energy #cat_en_'+i).val());
		var isEnabled = $('#pi_Categories #pi_category_settings #enabled_en_' + i + ' .disable').hasClass('hide');
		var id = 100 + i + 1;
		if(energyType == ""){
			isEnabled = false;
		}
		energy.push({"id": id, "owner":owner, "type":energyType, "isEnabled":isEnabled});
	}
	
	var isEnGenEnabled = $('#pi_Categories #pi_category_settings #EnableEnergyGen .disable').hasClass('hide');
	var isWatEnabled = $('#pi_Categories #pi_category_settings #EnableWater .disable').hasClass('hide');
	var isWatGenEnabled = $('#pi_Categories #pi_category_settings #EnableWaterGen .disable').hasClass('hide');
	
	energyGen.push({"id": 201, "owner": owner, "type":"Energy_Generator", "isEnabled":isEnGenEnabled});
	water.push({"id": 301, "owner": owner, "type":"Water_Consumption", "isEnabled":isWatEnabled});
	waterGen.push({"id": 401, "owner": owner, "type":"Recycled_Water", "isEnabled":isWatGenEnabled});
	total.push({"id": 901, "owner": owner, "type":"Total", "isEnabled":true});
	
	PI_CATEGORIES = {"isEnergyEnabled":isEnergyEnabled, "Energy": energy, "Energy_Generator": energyGen, "Water_Consumption": water, "Recycled_Water": waterGen, "Total": total};

	COMM_PORT.send(['set_pi_categories',PI_CATEGORIES]);
});

$(document).on('click','.menu-area #startDateSetting',function(e) {
	$('.std-popup.menu-popup#startDate-ctrl').show();
});

$(document).on('click','#startDate-ctrl #startDate_Controls .button-area #set',function(e) {
	setReportStartMonth();
});

$(document).on('click','#startDate-ctrl #startDate_Controls .button-area #cancel',function(e) {
	$('.std-popup.menu-popup#startDate-ctrl').hide();
});

$(document).on('click','#startDate-ctrl #bei_regulation_settings .button-area #set',function(e) {
	setBEIRegulations();
});

$(document).on('click','#startDate-ctrl #bei_regulation_settings .button-area #cancel',function(e) {
	$('.std-popup.menu-popup#startDate-ctrl').hide();
});

$(document).on('click','#startDate-ctrl #selectMonth #ul_selectMonth li',function(e) {
	getDateForSelection(true);
});

$(document).on('click','#Analog_Input_Report #export',function(e) {
	$('.loading').show();
	var isInputValid = processAnalogInput();

	setTimeout(function () {
		if(isInputValid){
			var Today = new Date();
			var csvName = 'Analog_Input_Report_' + Today.getFullYear() 
												+ (Today.getMonth() < 10 ? '0' : '') + (Today.getMonth()+1) 
												+ (Today.getDate() < 10 ? '0' : '') + (Today.getDate()) 
												+ '.csv';
			var csv = exportReportToCSV();
			if(csv == null){
				return;
			}
			downloadCSV2(csv, csvName);
		}
		else{
			return;
		}
	}, 1000);
});	

$(document).on('click','#Energy_Management_Report #export',function(e) {
	ISQUERYCLICKED = true;
	var isInputValid = processEnergyReport();
	
	setTimeout(function () {
		if(isInputValid){
			var Today = new Date();
			var csvName = 'Energy_Management_Report_' 	+ Today.getFullYear() 
														+ (Today.getMonth() < 10 ? '0' : '') + (Today.getMonth()+1) 
														+ (Today.getDate() < 10 ? '0' : '') + (Today.getDate()) 
														+ '.csv';
			var csv = exportReportToCSV();
			if(csv == null){
				return;
			}
			downloadCSV2(csv, csvName);
		}
		else{
			return;
		}
	}, 1000);
});	

$(document).on('click','#Water_Management_Report #export',function(e) {
	ISQUERYCLICKED = true;
	var isInputValid = processEnergyReport();
	
	setTimeout(function () {
		if(isInputValid){
			var Today = new Date();
			var csvName = 'Water_Management_Report_' 	+ Today.getFullYear() 
														+ (Today.getMonth() < 10 ? '0' : '') + (Today.getMonth()+1) 
														+ (Today.getDate() < 10 ? '0' : '') + (Today.getDate()) 
														+ '.csv';
			var csv = exportReportToCSV();
			if(csv == null){
				return;
			}
			downloadCSV2(csv, csvName);
		}
		else{
			return;
		}
	}, 1000);
});	

$(document).on('click','#BEI_Analysis_Report #export',function(e) {
	var isInputValid = processBEIReport();
	
	setTimeout(function () {
		if(isInputValid){
			var Today = new Date();
			var csvName = 'BEI_Analysis_Report_' 	+ Today.getFullYear() 
													+ (Today.getMonth() < 10 ? '0' : '') + (Today.getMonth()+1) 
													+ (Today.getDate() < 10 ? '0' : '') + (Today.getDate()) 
													+ '.csv';
			var csv = exportBEIReportToCSV();
			if(csv == null){
				return;
			}
			downloadCSV2(csv, csvName);
		}
		else{
			return;
		}
	}, 1000);
});	

$(document).on('click','#operation_info #export',function(e) {
	ISQUERYCLICKED = true;
	var isInputValid = processOperationInfo();
	
	setTimeout(function () {
		if(isInputValid){
			var Today = new Date();
			var csvName = 'Operation_Information_Report_' 	+ Today.getFullYear() 
															+ (Today.getMonth() < 10 ? '0' : '') + (Today.getMonth()+1) 
															+ (Today.getDate() < 10 ? '0' : '') + (Today.getDate()) 
															+ '.csv';
			var csv = exportOperationInfoToCSV();
			if(csv == null){
				return;
			}
			downloadCSV2(csv, csvName);
		}
		else{
			return;
		}
	}, 1000);
});	

$(document).on('click','#err_reporting #export',function(e) {
	ISQUERYCLICKED = true;
	var isInputValid = processErrorReporting();
	
	setTimeout(function () {
		if(isInputValid){
			var Today = new Date();
			var csvName = 'Malfunction_Data_Report_' + Today.getFullYear() 
													 + (Today.getMonth() < 10 ? '0' : '') + (Today.getMonth()+1) 
													 + (Today.getDate() < 10 ? '0' : '') + (Today.getDate()) 
													 + '.csv';
			var csv = exportErrorDataToCSV();
			if(csv == null){
				return;
			}
			downloadCSV2(csv, csvName);
		}
		else{
			return;
		}
	}, 1000);
});	

/*******************************************************
 * Other Event Handling Functions
********************************************************/
$(document).on('change', '#TimeControl #fromHH #fromHH', function(e) {
	TIMEFROM = $('#Analog_Input_Report #TimeControl #fromHH #fromHH').val();
	ISTIMECHANGED = true;
});

$(document).on('change', '#Analog_Input_Report #TimeControl #toHH #toHH', function(e) {
	TIMETO = $('#Analog_Input_Report #TimeControl #toHH #toHH').val();
	ISTIMECHANGED = true;
});

$(document).on('change', '#Analog_Input_Report #TimeControl #interval', function(e) {
	if(DATAROW != null && !isEmpty(DATAROW[0]) && DATAROW != [{}]){
		$('.loading').show();
	}
	setTimeout(function () {
		TIMEINTERVAL = $('#Analog_Input_Report #TimeControl #interval').val();
		INTERVAL = $('#Analog_Input_Report #TimeControl #interval').val();
		interval = $('#Analog_Input_Report #TimeControl #interval').val();
		console.time('finished load chart');
		formatAIData2(TEMP_DATA);
		displayChart();
	}, 200);
});

$(document).on('focus', '#Analog_Input_Report #TimeControl #interval', function(e) {
	ISINTERVALCHANGED = true;
});

/*******************************************************
 * Report Supplementary Functions
********************************************************/
function getReportTypes() {
	var command = ['get_report_types'];
	COMM_PORT.send(command);
	return true;
}

function getCategorizedPiManagementPoints(){
	var command = ['get_categorized_pi'];
	COMM_PORT.send(command);
	return true;
}

function getPiCategories(){
	var command = ['get_pi_categories'];
	COMM_PORT.send(command);
	return true;
}

function getSiteInfo(){
	var command = ['get_site_info'];
	COMM_PORT.send(command);
	return true;
}

function getSiteNameForDashboard(){
	var siteName = SITE_INFO['name'];
	document.getElementById("site_name").innerHTML = siteName;
}

function setCategoryIDs(){
	ENERGYGENERATORID = PI_CATEGORIES["Energy_Generator"][0]["id"];
	WATERCONSUMPTIONID = PI_CATEGORIES["Water_Consumption"][0]["id"];
	RECYCLEDWATERID = PI_CATEGORIES["Recycled_Water"][0]["id"];
	TOTALID = PI_CATEGORIES["Total"][0]["id"];
}

/*******************************************************
 * ANALOG INPUT (Ambient Trend) Report Functions
********************************************************/
function processAnalogInput(){
	//var dateFrom = $('#TimeControl #from').val();
	//var dateTo = $('#TimeControl #to').val();
	// Kaiwei 18/12/2018 changed dateFrom and dateTo to cater for language change (eg. portugese 'dez' for 'dec')
	var dateFrom = FROMD;
	var dateTo = TOD;
	var fromHH = $('#TimeControl #fromHH #fromHH').val();
	var toHH = $('#TimeControl #toHH #toHH').val();
	var interval = $('#TimeControl #interval').val();
	var managementPoints = appendSelectedManagementPoints();
	
	if(dateFrom == null || dateFrom == '') {
		$('.loading').hide();
		alert(getString('enter_date'));
		return false;
	}
	if(dateTo == null || dateTo == '') {
		$('.loading').hide();
		alert(getString('enter_date'));
		return false;
	}
	
	if(managementPoints == null || isEmpty(managementPoints)) {
		if(REPORTTYPE != ""){
			$('.loading').hide();
			//alert("Please add a management point");
			alert(getString('rep_err_no_mgt_pt'));
			return false;
		}else{
			$('.loading').hide();
			return false;
		}
	}
	
	if (interval == null){
		interval = 3600;
		TIMEINTERVAL = interval;
		$(' #TimeControl #interval').val(interval);
	}
	
	dateFrom = new Date(dateFrom);		//convert selected time from datepicker to JS date object
	dateTo = new Date(dateTo);
	
	if(dateFrom > Date.now()) {
		$('.loading').hide();
		alert(getString('past_date'));
		return false;
	}
	
	if(dateTo-dateFrom > (40* 24 * 60 * 60 * 1000)){	// Cannot be more than 40days
		$('.loading').hide();
		alert("Query period cannot be more than 40 days");
		return false;
	}
	
	if (interval == null){
		interval = 3600;
		TIMEINTERVAL = interval;
		$('#Analog_Input_Report #TimeControl #interval').val(interval);
	}
	
	if (!ISINTERVALCHANGED){
		var timeDiff = (dateTo.getTime() + (parseInt(toHH)*(60 * 60 * 1000))) - 
		 			   (dateFrom.getTime() + (parseInt(fromHH)*(60 * 60 * 1000)));
		ISINTERVALCHANGED = true;
		
		if(timeDiff == 0){
		}else if (timeDiff <= (24 * 60 * 60 * 1000)){ 										// user selected 1 day or less 
			interval = 5 * 60;																// default 5min
			TIMEINTERVAL = interval;
			$('#Analog_Input_Report #TimeControl #interval').val(interval);
		}else if(timeDiff <= (4 * 24 * 60 * 60 * 1000)){ 									// user selected 4 days or less default 
			interval = 30 * 60;																// default 30min
			TIMEINTERVAL = interval;
			$('#Analog_Input_Report #TimeControl #interval').val(interval);
		}else{ 																				// user selected more than 4days
			interval = 60 * 60;																// default 1 hr
			TIMEINTERVAL = interval;
			$('#Analog_Input_Report #TimeControl #interval').val(interval);
		}
	}
	return getAnalogInputData(dateFrom, dateTo, fromHH, toHH, interval, managementPoints, REPORTTYPE);
}

function getAnalogInputData(dateFrom, dateTo, fromHH, toHH, interval, managementPointsList, reportType){
	var toD = dateTo;
	var fromD = dateFrom;
	
	INTERVAL = interval;
	fromD = parseInt((fromD.getTime() / 1000).toFixed(0)); //convert to unix time				
	toD = parseInt(toD.getTime() / 1000).toFixed(0);		//convert to unix time
	// Convert the hours to seconds
	fromHH =  parseInt(fromHH * 3600);
	toHH =  parseInt(toHH * 3600);
	
	fromD = parseInt(fromD) + parseInt(fromHH);
	toD = parseInt(toD) + parseInt(toHH);
	
	if(REPORTTYPE=='temperature'){
		if (toD<fromD){
		//alert("Please select a different date");
		alert(getString("rep_err_wrong_date"));
		$('.loading').hide();
		return false;
		}
	}
	var managementPoints = managementPointsList;	
	AIMANAGEMENTPOINTS = managementPointsList;
	var condition = {};
	
	condition['from'] = fromD;
	condition['to'] = toD;
	condition['id'] = managementPoints;
	
	T_REPORT_FROMD = fromD; ; 
	T_REPORT_TOD = toD;
	
	if(reportType == "temperature"){
		if((!ISTIMECHANGED) && isArrayOrObjectEqual(managementPoints, DATAKEYS)){ // Time and management points not changed, no need call DB
			try{
				formatAIData2(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				displayChart();
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			$('.loading').hide();
			return true;
		}
	}else if(reportType == "energy" || reportType == "water"){
		if(!ISTIMECHANGED){
			try{
				formatEnergyData(TEMP_DATA);
			}catch(err){
				//alert("An error has occured: " + err);
				alert(getString("rep_err_error") + err);
			}
			try{
				displayEnergyChart();
			}catch(err){
				//alert("An error occurred while displaying chart");
				alert(getString("rep_err_display_chart"));
			}
			$('.loading').hide();
			return true;
		}
	}
	
	ISTIMECHANGED = false;
	var command = [];
	
	switch(reportType) {
	    case 'temperature':
	    	//command = ['get_analog_input_values', condition];
	    	command = ['get_analog_input_values2', condition];
	        break;
	    case 'energy':
	    	condition['SELECTEDTIMEPERIOD'] = SELECTEDTIMEPERIOD;
	    	condition['interval'] = interval;
	    	if(SELECTEDTIMEPERIOD == 'Year'){
	    		//command = ['get_pi_val_temp_table', condition];
	    		//command = ['get_pi_val_daily', condition];
	    		command = ['get_pi_val_daily2', condition];
	    	}else{
	    		command = ['get_pi_val_union_all', condition];
	    	}
	        break;
	    case 'water':
	    	condition['SELECTEDTIMEPERIOD'] = SELECTEDTIMEPERIOD;
	    	condition['interval'] = interval;
	    	if(SELECTEDTIMEPERIOD == 'Year'){
	    		//command = ['get_pi_val_temp_table', condition];
	    		//command = ['get_pi_val_daily', condition];
	    		command = ['get_pi_val_daily2', condition];
	    	}else{
	    		command = ['get_pi_val_union_all', condition];
	    	}
	        break;
	    case 'bei_analysis':
	    	condition['SELECTEDTIMEPERIOD'] = SELECTEDTIMEPERIOD;
	    	condition['interval'] = interval;
	    	//command = ['get_pi_val_temp_table', condition];
	    	//command = ['get_pi_val_daily', condition];
	    	command = ['get_pi_val_daily2', condition];
	        break;
	    case 'bei_display':
	    	condition['SELECTEDTIMEPERIOD'] = SELECTEDTIMEPERIOD;
	    	condition['interval'] = interval;
	    	//command = ['get_pi_val_temp_table', condition];
	    	//command = ['get_pi_val_daily', condition];
	    	if(BEI_DISPLAY_TYPE == 'Bei'){
	    		command = ['get_pi_val_daily2', condition];
	    	}else{
	    		command = ['get_pi_val_union_all', condition];
	    	}
	        break;
	    default:
	    	break;
	}
	console.timeEnd('milestone1 - finished javascript before DB');
	console.time('milestone2 - finished getting data from DB');
	COMM_PORT.send(command);
	return true;
}

function getIntervals(){ // Get the select intervals to display in analog input report
	var selectString = 	'<select class="styleSelect" id="interval"> ' + 
						'<option disabled selected value="-1">'+ "-- " + getString("select") + " --" +'</option>' +
						'<option value="3600">' + getString("select_interval_1hr") + '</option>' +
					    '<option value="1800">' + getString("select_interval_30min") + '</option>' +
					    '<option value="900">' + getString("select_interval_15min") + '</option>' +
					    '<option value="300">' + getString("select_interval_5min") + '</option>' +
						'</select>';
	document.getElementById("SelectIntervals").innerHTML = selectString;
}

function getHHValues(){
	var HHString = '';
	for (i = 0; i < 10; i++){
		HHString = HHString + '<option value="' + i + '">0' + i + ':00</option> ';
	}
	for (i = 10; i < 24; i++){
		HHString = HHString + '<option value="' + i + '">' + i + ':00</option> ';
	}
	return HHString;
}

function getToHHMM(){
	var selectString = 	'<select class="HH" id="toHH"> ';
	selectString = selectString + getHHValues() + '</select>';
	document.getElementById("toHH").innerHTML = selectString;
}

function getFromHHMM(){
	var selectString = 	'<select class="HH" id="fromHH"> ';
	selectString = selectString + getHHValues() + '</select>';
	document.getElementById("fromHH").innerHTML = selectString;
}

function appendSelectedManagementPoints(){
	var managementPointList = [];
	var list = $( " .Management_Points #ulManagementPointList li.selected" );
	
	for(i=0; i<list.length; i++){
		managementPointList.push(list[i].id);
	}
	return managementPointList;
}

function getManagementPoints() {
	var keys = Object.keys(POINT_LIST);
	var listString = '<ul class="ulManagementPointList" id="ulManagementPointList">';
	
	for (i in keys){
		var point = POINT_LIST[keys[i]];
		
		if (point!= null && !isEmpty(point)){
			if(point.info.type != 'Fcu' && point.info.type != 'Ai'){
				//delete keys[i];
				continue;
			} else if(point.info.type == 'Fcu' && point.info.attr.temp_db == false) {
				continue;
			}else{
				listString = listString + '<li id="' + keys[i] + '">'+ point.info.name + '</li>';
			}
		}
	}
	
	listString = listString + '</ul>';
	document.getElementById("ManagementPointList").innerHTML = listString;
}

function selectAllManagementPoints(){
	$( "#Analog_Input_Report .Management_Points #ulManagementPointList li" ).each(function() {
		$( this ).removeClass("selected");
		$( this ).addClass("selected");
	});
}

function unSelectAllManagementPoints(){
	$( "#Analog_Input_Report .Management_Points #ulManagementPointList li" ).each(function() {
		$( this ).removeClass("selected");
	});
}

function changeSelectAllButton(){
	var selectedList = $( "#Analog_Input_Report .Management_Points #ulManagementPointList li.selected" );
	var totalList = $( "#Analog_Input_Report .Management_Points #ulManagementPointList li" );
	if(selectedList.length<totalList.length){
		$('#Analog_Input_Report .Management_Points .selectAllButton#unSelectAll').replaceWith("<span class='selectAllButton mls' id='selectAll' param='select_all'>" + getString("select_all") + "</span>");
	}
	else{
		$('#Analog_Input_Report .Management_Points .selectAllButton#selectAll').replaceWith("<span class='selectAllButton mls' id='unSelectAll' param='unselect_all'>" + getString("unselect_all") + "</span>");
	}
}

function processTempData(data){
	dataLength = data.length;
	var ret = {};
	
	for(i=0; i<dataLength; i++){
		tempObj = {};
		/*************************************************
		 * data[i][0] = management point ID
		 * data[i][1] = type eg. std, rt, sp
		 * data[i][2] = datetime in Unix
		 * data[i][3] = value
		 *************************************************/
		if(data[i][1] == 'sp'){
			data[i][0] = 'sp:' + data[i][0]
		}
		
		d = new Date(parseInt(data[i][2])*1000)
		dateTime = d.getFullYear().toString() + checkTime(d.getMonth()+1).toString() + checkTime(d.getDate()).toString()
				 + checkTime(d.getHours()).toString() + checkTime(d.getMinutes()).toString() + checkTime(d.getSeconds()).toString();
		
		if(ret[dateTime] == null){
			ret[dateTime] = [];
			tempObj["date"] = d.getFullYear() + "-" + checkTime(d.getMonth()+1) + "-" + checkTime(d.getDate()) + " "
			 				+ checkTime(d.getHours()) + ":" + checkTime(d.getMinutes()) + ":" + checkTime(d.getSeconds());
			ret[dateTime].push(tempObj);
		}
		tempObj = {};
		tempObj[data[i][0]] = data[i][3].toString()
        ret[dateTime].push(tempObj);
	}
	return ret;
}

function formatAIData2(TEMP_DATA){
	console.timeEnd('Analog input report milestone1');
	DATAROW = [];
	Y_GRIDLINES = []; 	 				// To populate upper and lower limits of each Management Point in the graph 
	Y_AXIS_UNIT = "";  					// Label for Y-Axis
	Y2_AXIS_UNIT = ""; 					// Label for Y2-Axis
	Y2_AXES = {}; 						// Set of managementPoints to be displayed in Y2-Axis
	Y_RANGE = {};
	Y2_RANGE = {};
	DATAKEYS = [];
	
	if(TEMP_DATA == null || isEmpty(TEMP_DATA)){
		return;
	}else{
		temp_data= JSON.parse(JSON.stringify(TEMP_DATA));
	}
	
	MANAGEMENTPOINTLIST = {};
	var tempDataSet = {};
	var fromDateTime = T_REPORT_FROMD;
	var toDateTime = T_REPORT_TOD;
	//var removeKeys = []; // to remove unnecessary keys
	var isFirstCheck = true;
	var isFirstFromDateCheck = true;

	mpLength = AIMANAGEMENTPOINTS.length
	for(i=0; i< mpLength; i++){
		var managementPoint = {};
		managementPoint["name"] = AIMANAGEMENTPOINTS[i];
		managementPoint = formatUnit(AIMANAGEMENTPOINTS[i], managementPoint);
		MANAGEMENTPOINTLIST[managementPoint["name"]] = managementPoint;
		
		var point = POINT_LIST[AIMANAGEMENTPOINTS[i]];
		DATAKEYS.push(point.info.name);
		if(point.info.type == 'Fcu'){
			DATAKEYS.push("sp:" + point.info.name);
			MANAGEMENTPOINTLIST["sp:" + point.info.name] = managementPoint;
		}
	}
	
	var firstDBDateTime = null;
	var lastDBDateTime = null;
	var intervalCount = 0;
	
	for(key in temp_data){
		var arr = temp_data[key];
		/***********************************************************
		/ tempArr[0]: {"date":"2018-10-03 21:50:00"},
		/ tempArr[n]: {"ai001-00000":"211"},{"ai001-00001":"586"},...
		************************************************************/
		dbDateTime = (Date.parse(arr[0]["date"].replace(" ", "T")))/1000;
		
		if(isFirstFromDateCheck){
			fromDateTime = setMinutes(dbDateTime, fromDateTime);
			isFirstFromDateCheck = false;
		}
		
		if(firstDBDateTime ==null || dbDateTime < firstDBDateTime){
			firstDBDateTime = dbDateTime;
		} 
		if(lastDBDateTime ==null || dbDateTime > lastDBDateTime){
			lastDBDateTime = dbDateTime;
		} 
		
		if(dbDateTime < fromDateTime + (INTERVAL * intervalCount)){
			delete temp_data[key];
		}
		else if(dbDateTime == fromDateTime + (INTERVAL * intervalCount)){
			intervalCount++;
		}else{
			var intervalDiff = Math.floor((dbDateTime - (fromDateTime + (INTERVAL * intervalCount)))/INTERVAL);
			insertNullAIValues(temp_data, intervalDiff, (fromDateTime + (INTERVAL * intervalCount)));
			intervalCount = intervalCount + intervalDiff;
			intervalCount++;
		}
	}
	
	if(firstDBDateTime > fromDateTime){
		var intervalDiff = (Math.floor((firstDBDateTime - fromDateTime)/INTERVAL));
		insertNullAIValues(temp_data, intervalDiff, fromDateTime)
	}
	
	if(lastDBDateTime < (toDateTime - INTERVAL)){
		var intervalDiff = (Math.floor((toDateTime - lastDBDateTime)/INTERVAL));
		insertNullAIValues(temp_data, intervalDiff, lastDBDateTime)
	}

	convertToDataRowAI(temp_data)
	console.timeEnd('milestone3 - finished javascript');
}

function convertToDataRowAI(tempDataSet){
	var tempKeys = Object.keys(tempDataSet);
	/*************************************************************************************************************************
	// To format the data in JSON, eg.:
	// [{"x":"2018-07-06 15:55:00","hatcp001-00001":27.1,"hatcp001-00002":-12.9},{"hatcp001-00001":6.1,"hatcp001-00002":25.1}]
	// tempData Set contains each row {"date", "Management Point1":"Value", "Management Point2":"Value"} 
	*************************************************************************************************************************/
	for (tempKeys in tempDataSet){
		var text = "{";
		var tempArr2 = tempDataSet[tempKeys]; 				// tempArr is each row
		tempKeys2 = Object.keys(tempArr2);
		
		for(tempKeys2 in tempArr2){
			var tempObj = tempArr2[tempKeys2]; 				// tempObj is each item in the row eg. Date or " {"hatcp001-00001":"-0.9000000000000004"}"
			var tempKeys3 = Object.keys(tempObj);
			
			if (tempKeys3 == "date"){
				text = text + '"x": "' + tempObj[tempKeys3] + '", ';
				dateFlag = false;
			}
			else{
				tempKeys3 = tempKeys3[0];
				if(tempKeys3.substring(0,3) == "sp:"){
					tempPoint = tempKeys3.substring(3, tempKeys3.length);
					var point = POINT_LIST[tempPoint];
					for(tempKeys3 in tempObj){ 					// tempkeys3 = Management Point Names					
						text = text + '"' + 'sp:' + point.info.name + '": ' + tempObj[tempKeys3] + ', ';
					}
				}
				else{
					var point = POINT_LIST[tempKeys3];
					for(tempKeys3 in tempObj){ 					// tempkeys3 = Management Point Names					
						text = text + '"' + point.info.name + '": ' + tempObj[tempKeys3] + ', ';
					}
				}
				checkYRange(+(tempObj[tempKeys3]), +(tempObj[tempKeys3]), MANAGEMENTPOINTLIST[tempKeys3]["y2"])
			}
		}
		
		text = text.slice(0, -2);							// Remove last 2 chars ', '
		text = text + "}";

		var dRow = JSON.parse(text);
    	DATAROW.push(dRow); 								// Push into global variable
	}
}

function insertNullAIValues(temp_data, intervalDiff, fromDateTime){
	for(j=0; j<intervalDiff; j++){
		tempObj = {};
		tempDate = new Date((fromDateTime +(j*INTERVAL))*1000);
		
		var keys = Object.keys(MANAGEMENTPOINTLIST)
		lengthKeys = keys.length
		for(i=0; i< lengthKeys; i++){
			tempArr = [];
			//var point = POINT_LIST[tempPoint];
			var name = keys[i];
			tempObj[name] = null
			
			tempArr.push({"date": tempDate.getFullYear() + "-" + checkTime(tempDate.getMonth()+1) + "-" + checkTime(tempDate.getDate()) + " " 
				+ checkTime(tempDate.getHours()) + ":" + checkTime(tempDate.getMinutes()) + ":" + checkTime(tempDate.getSeconds())});
			tempArr.push(tempObj);
			
			temp_data[tempDate.getFullYear().toString() + checkTime(tempDate.getMonth()+1).toString() + checkTime(tempDate.getDate()).toString() 
			      + checkTime(tempDate.getHours()).toString() + checkTime(tempDate.getMinutes()).toString() + checkTime(tempDate.getSeconds()).toString()] = tempArr;
		}
	}
	
	return temp_data;
}

function formatYAxisUnit_Range(point, point_unit, managementPoint){
	// Set Y-Axis labels
	var pointName = point.info.name;
	if(REPORTTYPE == 'temperature'){
		if(Y_AXIS_UNIT == ""){
			Y_AXIS_UNIT = point_unit;
		}else if(Y2_AXIS_UNIT == "" && point_unit != Y_AXIS_UNIT){
			Y2_AXIS_UNIT = point_unit;
			//Y2_AXES[managementPoint["name"]] = 'y2';	// To populate the keys for Y2 axis
			Y2_AXES[pointName] = 'y2';
			if(point.info.type == 'Fcu'){
				Y2_AXES["sp:" + pointName] = 'y2';
			}
		}else if(point_unit == Y2_AXIS_UNIT){
			Y2_AXES[pointName] = 'y2';
			if(point.info.type == 'Fcu'){
				Y2_AXES["sp:" + pointName] = 'y2';
			}
		}else if(point_unit != Y_AXIS_UNIT && point_unit != Y2_AXIS_UNIT){
			//alert("Unable to display more than 2 different unit types");
			alert(getString("rep_err_more_than_2_units"));
		}
		
		if(POINT_UNIT == Y_AXIS_UNIT){
			managementPoint = addRange(point,managementPoint, false); 
			managementPoint["y2"] = false;
		}
		else if(POINT_UNIT == Y2_AXIS_UNIT){
			managementPoint = addRange(point,managementPoint, true);
			managementPoint["y2"] = true;
		}
	}else{
		if(Y_AXIS_UNIT == ""){
			Y_AXIS_UNIT = point_unit;
		}
	}
	
	return managementPoint;
}

function formatUnit(id, managementPoint){
	var point = POINT_LIST[id];
	if (point!= null && !isEmpty(point) && point.info !=null){
		try{
			if (point.info.attr.unit_label!=null){
				POINT_UNIT = point.info.attr.unit_label;
				managementPoint["unit"] = POINT_UNIT;
				managementPoint = formatYAxisUnit_Range(point, POINT_UNIT, managementPoint);
			}else if(point.info.type == 'Fcu'){
				POINT_UNIT = "°C";
				managementPoint["unit"] = POINT_UNIT;
				managementPoint = formatYAxisUnit_Range(point, POINT_UNIT, managementPoint);
			}
		}catch(err){
			//alert("Error while getting points from POINT_LIST: "+ err);
			alert(getString("rep_err_get_pointlist") + err);
		}
	}
	return managementPoint;
}

function checkYRange(max, min, isAxisY2){
	if(isAxisY2){ 
		if(max != null){
			if (Y2_RANGE['upperLimit'] == null || Y2_RANGE['upperLimit'] < max){
				Y2_RANGE['upperLimit'] = max + Math.abs(max*0.1);
			}
		}
		if(min != null){
			if (Y2_RANGE['lowerLimit'] == null || Y2_RANGE['lowerLimit'] > min){
				Y2_RANGE['lowerLimit'] = min - Math.abs(min*0.1);
			}
		}
	}else{
		if(max != null){
			if (Y_RANGE['upperLimit'] == null || Y_RANGE['upperLimit'] < max){
				Y_RANGE['upperLimit'] = max + Math.abs(max*0.1);
			}
		}
		if(min != null){
			if (Y_RANGE['lowerLimit'] == null || Y_RANGE['lowerLimit'] > min){
				Y_RANGE['lowerLimit'] = min - Math.abs(min*0.1);
			}
		}
	}
}

function addRange(point, managementPoint, isAxisY2){
	var range = {};
	var ulimit = null;
	var llimit = null;

	// To populate the upper and lower limit lines on the y-axis
	if(point.info.type == 'Ai' && point.info.attr.ulimit_monitor){
		ulimit = parseFloat(point.info.attr.ulimit);
		range['value'] = ulimit;
		range['class'] = 'color-grid upper-limit-'+ managementPoint["name"];
		if(isAxisY2){ 
			range['axis'] = 'y2';
		}
		
		Y_GRIDLINES.push(range);
		managementPoint["uLimit"] = ulimit;
		range = {};
	}
	if (point.info.type == 'Ai' && point.info.attr.llimit_monitor){
		llimit = parseFloat(point.info.attr.llimit);
		range['value'] = llimit;
		range['class'] = 'color-grid lower-limit-'+ managementPoint["name"];
		if(isAxisY2){
			range['axis'] = 'y2';
		}
		Y_GRIDLINES.push(range);
		managementPoint["lLimit"] = llimit;
		range = {};
	}
	
	checkYRange(ulimit, llimit, isAxisY2);
	return managementPoint;
}

/*******************************************************
 * Energy and Water Management Report Functions
********************************************************/
function processEnergyReport(){
	var dateFrom, dateTo, fromHH, toHH, interval;
	var selectedTimePeriod;
	
	if(REPORTTYPE == 'bei_display'){
		selectedTimePeriod = 'Day';
		dateFrom = new Date();
	}else{
		selectedTimePeriod = $("input[name=SelectTimePeriod]:checked").val();
		dateFrom = $(' #TimeControl #from').val();
		if(selectedTimePeriod == 'Month'){
			dateFrom = ENERGYDATEFROM;
		}else if(selectedTimePeriod == 'Day'){
			// Kaiwei 18/12/2018 changed dateFrom and dateTo to cater for language change (eg. portugese 'dez' for 'dec')
			var dateFrom = FROMD;
		}
		
		dateFrom = new Date(dateFrom);
	}
	
	SELECTEDTIMEPERIOD = selectedTimePeriod;

	if(dateFrom == null || dateFrom == '' || dateFrom == 'Invalid Date') {
		$('.loading').hide();
		//alert("REPORTTYPE = " + REPORTTYPE)
		if(ISQUERYCLICKED){
			alert(getString('enter_date'));
		}
		return false;
	}

	dateFrom = getEnergyReportDateFrom(dateFrom, selectedTimePeriod);		//convert selected time from datepicker to JS date object
	dateTo = getEnergyReportDateTo(dateFrom, selectedTimePeriod);
	fromHH = getEnergyReportFromHH(selectedTimePeriod);
	toHH = getEnergyReportToHH(selectedTimePeriod);
	interval = getEnergyReportInterval(selectedTimePeriod, dateFrom, dateTo);
	
	var managementPoints = getEnergyManagementPoints();
	MANAGEMENTPOINTLIST = managementPoints;
	
	if(managementPoints == null || isEmpty(managementPoints)) {
		$('.loading').hide();
		if(REPORTTYPE == "bei_display"){
			getEnergyConsumptionForDisplay();
			return false;
		}else if(REPORTTYPE != ""){
			//alert("Please add a management point");
			alert(getString('rep_err_no_mgt_pt'));
			return false;
		}else{
			return false;
		}
	}
	ISQUERYCLICKED = false;
	return getAnalogInputData(dateFrom, dateTo, fromHH, toHH, interval, managementPoints, REPORTTYPE);
}

function pushArrayIntoDataSet(date, tempDataSet, row, key, aiValue){
	// The graph data has to be sorted by datetime
	// You need the data to be in this format:
	// ie. {"hatcp001-00001":27.1,"hatcp001-00002":-12.9}
	if (isEmpty(tempDataSet) || !(row in tempDataSet)){
		var tempObj = {};
		var tempDateObj = {};
		tempDateObj["date"] = date;
		tempObj[key] = aiValue;// Add analog input value into an object
		
		var tempArray = [];
		tempArray.push(tempDateObj);
		tempArray.push(tempObj);
		tempDataSet[row] = tempArray; // Push the array into the set 
	}
	else{
		var tempObj = {};
		tempObj[key] = aiValue; // Set the analog input value to the management point
		var tempArray = [];
		tempArray = tempDataSet[row]; // Retrieve the existing array
		tempArray.push(tempObj);
		tempDataSet[row] = tempArray;// Push the array into the set 
	}
	return tempDataSet;
}

function setMinutes(checkDateTime, firstDateTime){
	var firstDBDateTime = new Date(checkDateTime*1000);
	dbMinutes = firstDBDateTime.getMinutes(); //In case the DB values are stored in different timings eg. not 00:00(mm:ss)
	dbMinutes = dbMinutes%10;
	
	if(dbMinutes!=5){
		firstDateTime = firstDateTime + (dbMinutes*60); // set the firstDateTime to synchronize with DB timings
	}
	return firstDateTime;
}

function createArrayWithTimeOnly(firstDateTime, lastDateTime, tempDataSet, key, interval, reportType){
	var checkfirstDate = firstDateTime;
	
	if(reportType == 'energy' || reportType == 'water' || reportType == 'bei_analysis'){
		for(i in interval){
			var tempInterval = interval[i];
			var TDate = new Date(tempInterval['datefrom'] * 1000);
			var intervalDate = formatDate(TDate);
			var intervalRow = formatRow(TDate);
			
			if (isEmpty(tempDataSet) || !(intervalRow in tempDataSet)){
				var tempObj = {};
				var tempDateObj = {};
				var tempArray = [];
				tempDateObj["date"] = intervalDate;
				tempArray.push(tempDateObj);
				tempDataSet[intervalRow] = tempArray; // Push the array into the set 
			}
		}
	}
	else{
		for(i=0; (firstDateTime + (interval * i))<lastDateTime; i++ ){
			checkfirstDate = (firstDateTime + (interval * i))*1000;
			var TDate = new Date(checkfirstDate);
			var intervalDate = formatDate(TDate);
			var intervalRow = formatRow(TDate);
		
			if (isEmpty(tempDataSet) || !(intervalRow in tempDataSet)){
				var tempObj = {};
				var tempDateObj = {};
				var tempArray = [];
				tempDateObj["date"] = intervalDate;
				tempArray.push(tempDateObj);
				tempDataSet[intervalRow] = tempArray; // Push the array into the set 
			}
		}
	}
	return tempDataSet;
}

function formatDate(TDate){  // Format the date into "YYYY-MM-DD hh:mm:ss"
	var dateString = 	TDate.getFullYear()
						+ "-" + (TDate.getMonth() < 9 ? '0' : '') + (TDate.getMonth()+1)  
						+ "-" + (TDate.getDate() < 10 ? '0' : '') + (TDate.getDate())
					    + " " + (TDate.getHours() < 10 ? '0' : '') + (TDate.getHours())
					    + ":" + (TDate.getMinutes() < 10 ? '0' : '') + (TDate.getMinutes())
					    + ":" + (TDate.getSeconds() < 10 ? '0' : '') + (TDate.getSeconds());
	return dateString;
}

function formatRow(TDate){ 	//Format the date into "YYYYMMDDhhmmss"
	var rowString = 	TDate.getFullYear()
						+ (TDate.getMonth() < 9 ? '0' : '') + (TDate.getMonth()+1)  
						+ (TDate.getDate() < 10 ? '0' : '') + (TDate.getDate())
						+ (TDate.getHours() < 10 ? '0' : '') + (TDate.getHours())
						+ (TDate.getMinutes() < 10 ? '0' : '') + (TDate.getMinutes())
						+ (TDate.getSeconds() < 10 ? '0' : '') + (TDate.getSeconds());
	return rowString;
}
	
//Insert null values for missing data from DB
function insertNullValues(intervalDiff, firstDateTime, interval, intervalCount, managementPoint, tempDataSet, reportType){
	// intervalCount is last count for intervals
	// interval is the interval period eg. 1hr or 5min
	if(reportType == 'energy' || reportType == 'water' || reportType == 'bei_analysis'){
			var TDate = firstDateTime;
			var intervalDate = formatDate(TDate);
			var intervalRow = formatRow(TDate);
			var value = null;
			tempDataSet = pushArrayIntoDataSet(intervalDate, tempDataSet, intervalRow, managementPoint, value);
	}
	else{
		for(z=intervalCount; z<intervalCount+intervalDiff; z++){
			var TDate= new Date((firstDateTime + (interval * z))*1000);
			var intervalDate = formatDate(TDate);
			var intervalRow = formatRow(TDate);
			var aiValue = null;
			tempDataSet = pushArrayIntoDataSet(intervalDate, tempDataSet, intervalRow, managementPoint, aiValue);
		}
	}
	
	return tempDataSet;
}

function getAllEnergyPiID(){
	var PiInAllEnergyCat = [];
	var allEnergyCategories = getEnergyCategoriesID();
	
	for (i in allEnergyCategories){
		PiInAllEnergyCat = PiInAllEnergyCat.concat(getPiByCategoriesID(allEnergyCategories[i]));
	}
	
	PiInAllEnergyCat = PiInAllEnergyCat.concat(getPiByCategoriesID(ENERGYGENERATORID));
	return PiInAllEnergyCat;
}

function getOtherManagementPointsID(){
	// Management points not in any category but is in "Total" is classified as "Others"
	var otherPis = [];
	var PiInTotalCat = getPiByCategoriesID(TOTALID);
	var PiInAllEnergyCat = getAllEnergyPiID();
	otherPis = PiInTotalCat.filter( function(n) { return !this.has(n) }, new Set(PiInAllEnergyCat) );
	return otherPis;
}

function getEnergyManagementPoints(){
	var managementPointList = [];
	CATEGORIES = [];
	
	if(REPORTTYPE == 'energy' ){
		CATEGORIES = getEnergyCategoriesID();

		for(i in CATEGORIES){
			managementPointList = managementPointList.concat(getPiByCategoriesID(CATEGORIES[i]));
		}
		
		var genCategories = getGeneratorCategoriesID();
		
		for(i in genCategories){
			CATEGORIES.push(genCategories[i]);
			managementPointList = managementPointList.concat(getPiByCategoriesID(genCategories[i]));
		}
		
		managementPointList = managementPointList.concat(getOtherManagementPointsID());
		managementPointList = managementPointList.concat(getPiByCategoriesID(TOTALID));
		CATEGORIES.push(TOTALID);
	}
	else if(REPORTTYPE == 'water'){
		var waterCategories = getWaterCategoriesID();
		
		for(i in waterCategories){
			CATEGORIES.push(waterCategories[i]);
			managementPointList = managementPointList.concat(getPiByCategoriesID(waterCategories[i]));
		}
	}
	else if(REPORTTYPE=='bei_display'){
		CATEGORIES = getEnergyCategoriesID();
		
		for(i in CATEGORIES){
			managementPointList = managementPointList.concat(getPiByCategoriesID(CATEGORIES[i]));
		}
		
		var genCategories = getGeneratorCategoriesID();
		var waterCategories = getWaterCategoriesID();
		for(i in genCategories){
			CATEGORIES.push(genCategories[i]);
			managementPointList = managementPointList.concat(getPiByCategoriesID(genCategories[i]));
		}
		
		for(i in waterCategories){
			CATEGORIES.push(waterCategories[i]);
			managementPointList = managementPointList.concat(getPiByCategoriesID(waterCategories[i]));
		}
		
		managementPointList = managementPointList.concat(getPiByCategoriesID(TOTALID));
		CATEGORIES.push(TOTALID);
	}
	
	return managementPointList;
}

function removeCategoryUnderscores(category){
	if(category == 'Energy_Generator'){
		category = getString('energy_generator');
	}else if(category == 'Water_Consumption'){
		category = getString('water_consumption');
	}else if(category == 'Recycled_Water'){
		category = getString('recycled_water');
	//}else if(category == 'TotalConsumption'){
	//	category = getString('total_consumption');
	}else if(category == 'Estimated BEI Rating'){
		category = getString('est_bei');
	}
	return category;
}

function decodeCategories(string){
	string = removeCategoryUnderscores(decodeURIComponent(string));
	return string;
}

function getEnergyReportCategories(){
	var energy = PI_CATEGORIES['Energy'];
	var energy_generator = PI_CATEGORIES['Energy_Generator'];
	var isEnergyEnabled = PI_CATEGORIES['isEnergyEnabled']
	var htmlString = "";
	
	if(isEnergyEnabled){
		for(i=0; i<3; i++){
			if(energy[i].type != "" && energy[i].isEnabled){
				htmlString = htmlString + '<div class="subtitle check checked" id="' + energy[i].id + '"><span>' + decodeURIComponent(energy[i].type) +  '</span><img src="image/check-w.png"></div>';
			}
		}
	}
	
	if(energy_generator[0].type != "" && energy_generator[0].isEnabled){
		htmlString = htmlString + '<div class="subtitle check checked" id="' + energy_generator[0].id + '" ><span class="mls" param="energy_generator">' + energy_generator[0].type +  '</span><img src="image/check-w.png"></div>';
	}
	
	document.getElementById("EnergyReportCategories").innerHTML = htmlString;
}

function getWaterReportCategories(){
	var water = PI_CATEGORIES['Water_Consumption'];
	var water_generator = PI_CATEGORIES['Recycled_Water'];
	var htmlString = "";
	
	if(water[0].type != "" && water[0].isEnabled){
		htmlString = htmlString + '<div class="subtitle check checked" id="' + water[0].type + '"><span class="mls" param="water_consumption">' + water[0].type +  '</span><img src="image/check-w.png"></div>';
	}
	
	if(water_generator[0].type != "" && water_generator[0].isEnabled){
		htmlString = htmlString + '<div class="subtitle check checked" id="' + water_generator[0].type + '"><span class="mls" param="recycled_water">' + water_generator[0].type +  '</span><img src="image/check-w.png"></div>';
	}
	
	document.getElementById("WaterReportCategories").innerHTML = htmlString;
}

function changeTimePeriodInputFunction(type){
	var htmlString = "";
	if(type == 'Day'){
		htmlString = '<div id="FromD"><div class="input">'
					 + '<input type="text" name="from" id="from"></div></div>';
		document.getElementById("ChangeTimePeriodInput").innerHTML = htmlString;
		initReportDatePickerDay();
	}else if (type == 'Month'){
		htmlString = '<div id="FromD"><div class="input">'
			 		 + '<input type="text" name="from" id="from"></div></div>';
		document.getElementById("ChangeTimePeriodInput").innerHTML = htmlString;
		initReportDatePickerMonth();
	}else if (type == 'Year'){
		htmlString = '<div id="FromD"><div class="input">'
			 		 + '<input type="text" name="from" id="from"></div></div>';
		document.getElementById("ChangeTimePeriodInput").innerHTML = htmlString;
		initReportDatePickerYear();
	}
	
	if(WIDTH< 1000){
		$('.AITable #ChangeTimePeriodInput #from').height(22);
		$('.AITable #ChangeTimePeriodInput #from').width(200);
		$('.AITable #ChangeTimePeriodInput #from').css('font-size', '20px')
	}else{
		$('.AITable #ChangeTimePeriodInput #from').height(26);
		$('.AITable #ChangeTimePeriodInput #from').width(240);
		$('.AITable #ChangeTimePeriodInput #from').css('font-size', '22px')
	}
}

function getEnergyReportDateFrom(dateFrom, selectedTimePeriod){
	var startDate = 1;
	var startMonth = 0;
	
	if(REPORT_START_DATE != null && !isEmpty(REPORT_START_DATE)){
		startMonth = REPORT_START_DATE['month'];
		startDate = REPORT_START_DATE['date'];
	}
	
	if(selectedTimePeriod == "Day"){
		dateFrom.setHours(0,0,0,0);
	}
	else if(selectedTimePeriod == "Month"){
		dateFrom.setDate(startDate);
		dateFrom.setHours(0,0,0,0);
	}
	else if(selectedTimePeriod == "Year"){
		dateFrom.setDate(startDate);
		dateFrom.setMonth(startMonth);
		dateFrom.setHours(0,0,0,0);
	}
	else if(selectedTimePeriod == "p3y"){
		dateFrom.setDate(startDate);
		dateFrom.setMonth(startMonth);
		dateFrom.setHours(0,0,0,0);
		
		var today = new Date();
		if(today > dateFrom){
			dateFrom.setYear(dateFrom.getFullYear()-3);
		}else{
			dateFrom.setYear(dateFrom.getFullYear()-4);
		}
	}
	else if(selectedTimePeriod == "mtd"){
		dateFrom.setDate(startDate);
		dateFrom.setMonth(startMonth);
		dateFrom.setHours(0,0,0,0);
		var today = new Date();
		
		if(today > dateFrom){
			
		}else{
			dateFrom.setYear(dateFrom.getFullYear()-1);
		}
	}
	
	return dateFrom;
}

function getEnergyReportDateTo(dateFrom, selectedTimePeriod){
	var dateTo;
	dateTo = new Date(dateFrom);
	
	if(selectedTimePeriod == "Day"){
		dateTo.setDate(dateTo.getDate() + 1);
		dateTo.setHours(0);
		dateTo.setMinutes(0);
		dateTo.setSeconds(0);
	}
	else if(selectedTimePeriod == "Month"){
		dateTo.setMonth(dateTo.getMonth() + 1);
		dateTo.setHours(0);
		dateTo.setMinutes(0);
		dateTo.setSeconds(0);
	}
	else if(selectedTimePeriod == "Year"){
		dateTo.setMonth(dateTo.getMonth() + 12);
		dateTo.setHours(0);
		dateTo.setMinutes(0);
		dateTo.setSeconds(0);
	}else if(selectedTimePeriod == "p3y"){
		dateTo.setHours(0);
		dateTo.setMinutes(0);
		dateTo.setSeconds(0);
		dateTo.setYear(dateTo.getFullYear()+3);
		
		var today = new Date();
		if(today>dateTo){
			dateTo.setYear(dateTo.getFullYear()+1);
		}
	}else if(selectedTimePeriod == "mtd"){
		dateTo.setHours(0);
		dateTo.setMinutes(0);
		dateTo.setSeconds(0);
		dateTo.setYear(dateTo.getFullYear()+1);
		
		var today = new Date();
		if(today<dateTo){
			
		}else{
			dateTo.setYear(dateTo.getFullYear()+1);
		}
	}
	
	return dateTo;
}

function getEnergyReportFromHH(selectedTimePeriod){
	var fromHH;
	if(selectedTimePeriod == "Day"){
		fromHH = "23";
	}
	else if(selectedTimePeriod == "Month"){
		fromHH = "0";
	}
	else if(selectedTimePeriod == "Year"){
		fromHH = "0";
	}
	else if(selectedTimePeriod == "p3y" || selectedTimePeriod == "mtd"){
		fromHH = "0";
	} 
	return fromHH;
}

function getEnergyReportToHH(selectedTimePeriod){
	var toHH;
	
	if(selectedTimePeriod == "Day"){
		toHH = "0";
	}
	else if(selectedTimePeriod == "Month"){
		toHH = "0";
	}
	else if(selectedTimePeriod == "Year"){
		toHH = "0";
	}
	else if(selectedTimePeriod == "p3y" || selectedTimePeriod == "mtd"){
		toHH = "0";
	}
	
	return toHH;
}

function getEnergyReportInterval(selectedTimePeriod, dateFrom, dateTo){
	var intervals_list = [];
	var startDate = dateFrom.getDate();

	while (dateFrom < dateTo){
		interval = {};
        interval['datefrom'] = dateFrom.getTime()/1000;
        if(selectedTimePeriod == "Day"){
        	dateFrom = dateFrom.setHours(dateFrom.getHours() + 1); 			// interval is 1 hour
    	}
    	else if(selectedTimePeriod == "Month"){
    		dateFrom = dateFrom.setDate(dateFrom.getDate() + 1);		// interval is 1 day
    	}
    	else if(selectedTimePeriod == "Year"){
        	newMonth = dateFrom.getMonth() +1;
    		dateFrom = dateFrom.setMonth(newMonth, startDate);
    		dateFrom = new Date(dateFrom);
    		while(dateFrom.getMonth()> newMonth){
    			dateFrom.setDate(dateFrom.getDate() - 1);
    			dateFrom = new Date(dateFrom);
    		}
        }  
    	else if(selectedTimePeriod == "p3y"){
        	dateFrom = dateFrom.setMonth(dateFrom.getMonth() + 12);
        }
    	else if(selectedTimePeriod == "mtd"){
        	dateFrom = dateFrom.setMonth(dateFrom.getMonth() + 1);
        }

        dateFrom = new Date(dateFrom);
        interval['dateto'] = dateFrom.getTime()/1000;
        intervals_list.push(interval);
	}
	return intervals_list;
}

function getMonthForSelection(){
	var startMonth = 0;
	
	if(REPORT_START_DATE != null && !isEmpty(REPORT_START_DATE)){
		startMonth = REPORT_START_DATE['month'];
	}
	
	if(startMonth > 0){
		htmlString = "<div class='current-val' value='"+startMonth+"'>"+getString('month'+(parseInt(startMonth)+1))+"</div>";
	}
	else{
		htmlString = "<div class='current-val' value='0'>"+getString('month1')+"</div>";
	}
	
	htmlString = htmlString + "<ul id='ul_selectMonth' class='popup-list selectable-list' style='display: none;'>"
	
	for(i=0; i<12; i++){
		if(startMonth==i){
			htmlString = htmlString + "<li id='selectMonth_"+i+"' class='selected'>" + getString('month'+(parseInt(i)+1)) + "</i>";
		}
		else{
			htmlString = htmlString + "<li id='selectMonth_"+i+"'>" + getString('month'+(parseInt(i)+1)) + "</i>"
		}
	}
	
	htmlString = htmlString + "</ul>";
	document.getElementById("selectMonth").innerHTML = htmlString;
}

function getDateForSelection(isOnChange){
	var startDate = 0;
	var selectedMonth = 0;
	
	if(isOnChange){
		$( "#startDate-ctrl #selectMonth #ul_selectMonth li" ).each(function() {
			if($(this).hasClass("selected")){
				var id = $(this).attr('id');
				selectedMonth = parseInt(id.substr(id.indexOf('_')+1, id.length));
			}
		});
	}else {
		if(REPORT_START_DATE != null && !isEmpty(REPORT_START_DATE)){
			selectedMonth = REPORT_START_DATE['month'];
		}
	}
	
	var month = new Date();
	month.setDate(1);
	month.setMonth(selectedMonth);
	var numDays = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
	
	if(REPORT_START_DATE != null && !isEmpty(REPORT_START_DATE)){
		startDate = REPORT_START_DATE['date'];
	}

	if(startDate > 0){
		if(startDate<10){
			htmlString = "<div class='current-val'>0"+startDate+"</div>";
		}else{
			htmlString = "<div class='current-val'>"+startDate+"</div>";
		}
	}
	else{
		htmlString = "<div class='current-val'>01</div>";
	}
	
	htmlString = htmlString + "<ul id='ul_selectDate' class='popup-list selectable-list' style='display: none;'>"
	
	for(i=1; i<=numDays; i++){
		var dateString = i
		if(i<10){
			dateString = "0"+i
		}
		if(startDate==i){
			htmlString = htmlString + "<li id='selectDate_"+i+"' class='selected'>" + dateString + "</i>"
		}
		else{
			htmlString = htmlString + "<li id='selectDate_"+i+"'>" + dateString + "</i>"
		}
	}
	
	htmlString = htmlString + "</ul>";
	document.getElementById("selectDate").innerHTML = htmlString
}

function getEnergyCategoriesID(){
	var allCategories = [];
	var energy = PI_CATEGORIES['Energy'];
	var isEnergyEnabled = PI_CATEGORIES['isEnergyEnabled'];
	
	if(isEnergyEnabled){
		for (j in energy){
			if (energy[j].type != undefined && energy[j].type != "" && energy[j].isEnabled){
				allCategories.push(energy[j].id);
			}
		}
	}
	return allCategories;
}

function getGeneratorCategoriesID(){
	var allCategories = [];
	var energy_generator = PI_CATEGORIES['Energy_Generator'];
	
	if (energy_generator[0].type != undefined && energy_generator[0].type != "" && energy_generator[0].isEnabled){
		allCategories.push(energy_generator[0].id);
	}
	return allCategories;
}

function getWaterCategoriesID(){
	var allCategories = [];
	var water = PI_CATEGORIES['Water_Consumption'];
	var water_generator = PI_CATEGORIES['Recycled_Water'];
	
	if (water[0].type != undefined && water[0].type != "" && water[0].isEnabled){
		allCategories.push(water[0].id);
	}
	
	if (water_generator[0].type != undefined && water_generator[0].type != "" && water_generator[0].isEnabled){
		allCategories.push(water_generator[0].id);
	}
	return allCategories;
}

function getCategoryNameByID(id){
	var catEnergy = PI_CATEGORIES["Energy"];
	for(z in catEnergy){
		if(catEnergy[z]["id"] == id){
			return catEnergy[z]["type"];
		}
	}

	if(id == ENERGYGENERATORID){
		return PI_CATEGORIES["Energy_Generator"][0]["type"];
	}else if(id == WATERCONSUMPTIONID){
		return PI_CATEGORIES["Water_Consumption"][0]["type"];
	}else if(id == RECYCLEDWATERID){
		return PI_CATEGORIES["Recycled_Water"][0]["type"];
	}else if(id == TOTALID){
		return PI_CATEGORIES["Total"][0]["type"];
	}else if(id == getString("Others")){
		return getString("Others");
	}else if(id == getString("Total")){
		return getString("Total");
	}
	else{
		return "";
	}
}

function summationByInterval(data){
	var dataLength = data.length
	var mpList = Array.from(new Set(MANAGEMENTPOINTLIST))
	mpList = mpList.sort();
	var mpLength = mpList.length;
	
	var countMP = 0;
	var ret = [];
	var tempObj = {};
	var intervalCount = 0;
	var intervalLength = INTERVAL.length;
	var dbDate = null;
	
	for(i=0; i<dataLength; i++){
		dbDate = data[i][1];
		if(countMP >= mpLength){
			// if countMP >= mpLength, the row has included all management points. 
			// which means data[i] belong to the next row.
			countMP = 0;
			ret.push(tempObj);
			tempObj = {};
			intervalCount++;
		}
		
		var dateto = INTERVAL[intervalCount]["dateto"];
		//Kaiwei 20190802 should check if tempObj is empty before adding push {} 
		//while(data[i][1]> dateto){
		while(data[i][1]> dateto && isEmpty(tempObj)){
			ret.push({});
			intervalCount += 1;
			dateto = INTERVAL[intervalCount]["dateto"];
			
		}
		
		if(data[i][0] != mpList[countMP]){
			console.log('Missing Data: no data for ' + mpList[countMP])
			var tempArr = [];
			// Kaiwei 20191101 check if current data is added to tempObj
			var isDataAdded = false;
			for(z=countMP; z< mpLength; z++){
				if(data[i][0] != mpList[z]){
					tempObj[mpList[z]] = new Array();
					tempObj[mpList[z]].push(tempArr);
					//Kaiwei 20190802 should be countMP++ instead of intervalCount++
					countMP++;
					//intervalCount++;
				}else{
					// Kaiwei 20191101 check if current data is added to tempObj
					isDataAdded = true;
					var tempArr = [];
					var mpName = data[i][0];
					var d = new Date(parseInt(data[i][1])*1000)
					var tempDate = d.getFullYear().toString() + checkTime(d.getMonth()+1).toString() + checkTime(d.getDate()).toString()
		 						+ checkTime(d.getHours()).toString() + checkTime(d.getMinutes()).toString() + checkTime(d.getSeconds()).toString();
		
					tempArr.push(data[i][1]);
					tempArr.push(data[i][2]);
					tempArr.push(data[i][3]);
					tempArr.push(data[i][4]);
					tempArr.push(tempDate);
					
					tempObj[mpName] = new Array();
					tempObj[mpName].push(tempArr);
					countMP++;
					break;
				}
			}
			
			// Kaiwei 20191101 if data not added, add here
			if(!isDataAdded){
				if(countMP >= mpLength){
					// if countMP >= mpLength, the row has included all management points. 
					// which means data[i] belong to the next row.
					countMP = 0;
					ret.push(tempObj);
					tempObj = {};
					intervalCount++;
				}
				// Check again to make sure theres no missing data in the top of the list
				for(z=countMP; z< mpLength; z++){
					if(data[i][0] != mpList[z]){
						tempObj[mpList[z]] = new Array();
						tempObj[mpList[z]].push(tempArr);
						countMP++;
					}else{
						isDataAdded = true;
						var tempArr = [];
						var mpName = data[i][0];
						var d = new Date(parseInt(data[i][1])*1000)
						var tempDate = d.getFullYear().toString() + checkTime(d.getMonth()+1).toString() + checkTime(d.getDate()).toString()
			 						+ checkTime(d.getHours()).toString() + checkTime(d.getMinutes()).toString() + checkTime(d.getSeconds()).toString();
			
						tempArr.push(data[i][1]);
						tempArr.push(data[i][2]);
						tempArr.push(data[i][3]);
						tempArr.push(data[i][4]);
						tempArr.push(tempDate);
						
						tempObj[mpName] = new Array();
						tempObj[mpName].push(tempArr);
						countMP++;
						break;
					}
				}
			}
		}
		else {
			var tempArr = [];
			var mpName = data[i][0];
			var d = new Date(parseInt(data[i][1])*1000);
			var tempDate = d.getFullYear().toString() + checkTime(d.getMonth()+1).toString() + checkTime(d.getDate()).toString()
			 			+ checkTime(d.getHours()).toString() + checkTime(d.getMinutes()).toString() + checkTime(d.getSeconds()).toString();
			tempArr.push(data[i][1]);
			tempArr.push(data[i][2]);
			tempArr.push(data[i][3]);
			tempArr.push(data[i][4]);
			tempArr.push(tempDate);
			
			tempObj[mpName] = new Array();
			tempObj[mpName].push(tempArr);
			countMP++;
		}
	}
	ret.push(tempObj);
	intervalCount +=1;
	for(intervalCount; intervalCount<intervalLength; intervalCount++){
		ret.push({});
	}
	return ret;
}

function formatEnergyData(temp_data){
	if(temp_data == null || isEmpty(temp_data)){
		DATAROW = [];
		DATAKEYS = [];
		Y_GRIDLINES = [];
		Y2_AXES = {};
		Y_AXIS_UNIT = "";  
		Y2_AXIS_UNIT = ""; 
		Y_RANGE = {};
		Y2_RANGE = {};
		return;
	}
	
	if(REPORTTYPE == 'energy'){
		Y_AXIS_UNIT = "kWh"
	}else if(REPORTTYPE == 'water'){
		Y_AXIS_UNIT = "m3"
	}else if(REPORTTYPE == 'bei_analysis'){
		Y_AXIS_UNIT = "kWh/m2"
	}
	
	DATAROW = [];
	DATAKEYS = [];
	Y_GRIDLINES = [];
	Y2_AXES = {};
	var tempDataSet = {};
	var fromDateTime = T_REPORT_FROMD ;
	var toDateTime = T_REPORT_TOD;
	var isFirstCheck = true;
	var isDATAROWEmpty = true; // the data from db will always return empty objects if null, this flag checks if each object is empty, 
							   // returns true if there's an object that is not empty
	intervalCount = 0;
	
	if(SELECTEDTIMEPERIOD == 'Day'){
		fromDateTime = fromDateTime + 60 * 60;
	}
	
	for(j in MANAGEMENTPOINTLIST){
		tempDataSet = createArrayWithTimeOnly(fromDateTime, toDateTime, tempDataSet, MANAGEMENTPOINTLIST[j], INTERVAL, REPORTTYPE); 	
	}
	
	var interval = INTERVAL;
	
	for (i in temp_data){
		var i_data = temp_data[i];
		var tempInterval = interval[i];
		var intervalTime = new Date(tempInterval['datefrom'] * 1000);
		
		if(i_data == null || isEmpty(i_data)){
			for(j in MANAGEMENTPOINTLIST){
				tempDataSet = insertNullValues(1, intervalTime, INTERVAL, intervalCount, MANAGEMENTPOINTLIST[j], tempDataSet, REPORTTYPE);
			}
		}else{
			isDATAROWEmpty = false;
			for (key in i_data){
				var managementPointName = key;
				var tempArr = i_data[managementPointName];
				var managementPoint = {};
				managementPoint["name"] = managementPointName;
				
				var point = POINT_LIST[managementPointName];
				
				if (point!= null && !isEmpty(point) && point.info !=null){
					try{
						if (point.info.attr.unit_label!=null){
							POINT_UNIT = point.info.attr.unit_label;
							managementPoint["unit"] = POINT_UNIT;
							managementPoint = formatYAxisUnit_Range(point, POINT_UNIT, managementPoint);
						}
					}catch(err){
						//alert("Error while getting points from POINT_LIST: "+ err);
						alert(getString("rep_err_get_pointlist") + err);
					}
				}
				
				if(tempArr!= null && !isEmpty(tempArr)){
					tempArr = tempArr[0];
					/***********************************************
					/ tempArr[0]: Datetime in Unix 
					/ tempArr[1]: MIN(value) 
					/ tempArr[2]: MAX(value)
					/ tempArr[3]: SUM(amount)
					/ tempArr[4]: DateTime in format 'YYYYMMDDHHMMSS'
					************************************************/
					dbDateTime = parseInt(tempArr[0]);
					//var min_value = tempArr[1];
					//var max_value = tempArr[2];
					var sum_amount = tempArr[3];
					//var dateString = tempArr[4];
					
					//dbDateTime = getNearestDbDateTime(dbDateTime);
		
					var TDate = intervalTime;
					var intervalDate = formatDate(TDate);
					var intervalRow = formatRow(TDate);
					var value = sum_amount;
					tempDataSet = pushArrayIntoDataSet(intervalDate, tempDataSet, intervalRow, managementPointName, value);
				}
			}
		}
	}
	
	// Function to group data into categories
	if(REPORTTYPE == 'energy' || REPORTTYPE == 'water' || SELECTEDTIMEPERIOD == 'mtd' || (REPORTTYPE == 'bei_display' && BEI_DISPLAY_TYPE == 'Energy')){
		groupDataIntoCategories(tempDataSet);
	}
	else if(REPORTTYPE == 'bei_analysis' || (REPORTTYPE == 'bei_display' && BEI_DISPLAY_TYPE == 'Bei')){
		groupDataByYear(tempDataSet);
	}
	
	var tempKeys = Object.keys(tempDataSet);
	/*************************************************************************************************************************
	// To format the data in JSON, eg.:
	// [{"x":"2018-07-06 15:55:00","hatcp001-00001":27.1,"hatcp001-00002":-12.9},{"hatcp001-00001":6.1,"hatcp001-00002":25.1}]
	// tempData Set contains each row {"date", "Management Point1":"Value", "Management Point2":"Value"} 
	*************************************************************************************************************************/
	for (tempKeys in tempDataSet){
		var text = "{";
		var tempArr2 = tempDataSet[tempKeys]; 				// tempArr is each row
		tempKeys2 = Object.keys(tempArr2);
		
		for(tempKeys2 in tempArr2){
			var tempObj = tempArr2[tempKeys2]; 				// tempObj is each item in the row eg. Date or " {"hatcp001-00001":"-0.9000000000000004"}"
			var tempKeys3 = Object.keys(tempObj);
			
			if (tempKeys3 == "date"){
				text = text + '"x": "' + tempObj[tempKeys3] + '", ';
				dateFlag = false;
			}
			else{
				for(tempKeys3 in tempObj){ 					// tempkeys3 = Management Point Names					
					text = text + '"' + tempKeys3 + '": ' + tempObj[tempKeys3] + ', ';
				}
			}
		}
		
		text = text.slice(0, -2);							// Remove last 2 chars ', '
		text = text + "}";
		
		var dRow = JSON.parse(text);
    	DATAROW.push(dRow); 								// Push into global variable
	}
	
	if(REPORTTYPE == 'energy' || SELECTEDTIMEPERIOD == 'mtd'){
		DATAKEYS = CATEGORIES;
		DATAKEYS.push("TotalConsumption");
	}else if(REPORTTYPE == 'water'){
		DATAKEYS = CATEGORIES;
		if(CATEGORIES.includes(WATERCONSUMPTIONID)){
			DATAKEYS.push("TotalConsumption");
		}
	}else if(REPORTTYPE == 'bei_analysis'){
		var upper_limit = BEI_REGULATIONS['upperLimit'];
		var lower_limit = BEI_REGULATIONS['lowerLimit'];
		Y_GRIDLINES.push(
				{value: 0, text:'Y = 0'}, 
				{value: upper_limit, text:"BEI Regulation Upper Limit"},
				{value: lower_limit, text:"BEI Regulation Lower Limit"});
		
		DATAKEYS.push(getString('est_bei'));
	}
	
	if(isDATAROWEmpty){
		if(REPORTTYPE!="bei_display"){
			//alert("No Energy Data Found!");rep_err_no_data
			alert(getString("rep_err_no_energy_data"));
		}
		var consoleDateTime = new Date();
		console.log(getString("rep_err_no_energy_data") + "@ " + consoleDateTime);
		DATAROW = null;
	}
	
	if(BEI_DISPLAY_TYPE == 'Bei'){
		DATAROW_BEI = JSON.parse(JSON.stringify(DATAROW));
	}else if(BEI_DISPLAY_TYPE = 'Energy'){
		DATAROW_ENERGY = JSON.parse(JSON.stringify(DATAROW));
	}
	console.timeEnd('milestone3 - finished javascript');
}

function groupDataIntoCategories(tempDataSet){
	if(REPORTTYPE == 'energy' || SELECTEDTIMEPERIOD == 'mtd'){
		if(CATEGORIES.length == 1){
			CATEGORIES.push(getString("Total"));
		}else{
			CATEGORIES.push(getString("Others")); // list of categories including others
		}
	}
	var isOthersExist = false;
	var TotalConsumption = 0;
	var TotalGenerated = 0;
	var TotalEnergyConsumption = 0; 
	var TotalWaterConsumption = 0;
	var isTotalEnergyConsumptionChanged = false;
	var isTotalWaterConsumptionChanged = false;
	var today = new Date();
	today.setTime(today.getTime() - (15 * 60 * 1000));
	
	var totalCategoryList = getPiByCategoriesID(TOTALID);
	for(j in tempDataSet){
		var temp = tempDataSet[j];
		var tempArray = temp;
		var tempRow = [];
		var tempObj = {};
		
		for(k in temp){
			var row = temp[k];
			var tempKeys3 = Object.keys(row);
			
			if (tempKeys3 == "date"){
				tempRow.push(row);
				var date = new Date(row["date"]);
			}
			else{
				for(tempKeys3 in row){					// tempkeys3 = Management Point Names	
					var isCategoryFound = false;
					for(i in CATEGORIES){
						var categoryID =  CATEGORIES[i];
						if(categoryID == getString("Others") || categoryID == getString("Total") ){
							var category = categoryID;
							var categoryList = [];
						}else{
							var categoryList = getPiByCategoriesID(categoryID);
							var category = getCategoryNameByID(categoryID);
						}
						if(categoryList.includes(tempKeys3) && categoryID != TOTALID){
							isCategoryFound = true;
							var tempValue = row[tempKeys3];	
							// Kaiwei 20191101 check if tempValue = undefined
							// Happens when data is missing from db
							if(tempValue == undefined || tempValue == null) tempValue = 0;
							if(categoryID == ENERGYGENERATORID){
								if(tempValue != null && tempValue != undefined){
									TotalGenerated = TotalGenerated + tempValue;
									TotalConsumption = TotalConsumption - tempValue;
									TotalEnergyConsumption = TotalEnergyConsumption - tempValue;
									isTotalEnergyConsumptionChanged = true;
								}
							}
							else if(categoryID == RECYCLEDWATERID){
								TotalWaterConsumption = TotalWaterConsumption + tempValue;
								isTotalWaterConsumptionChanged = true;
							}else {
								TotalConsumption = TotalConsumption + tempValue;
								if(categoryID == WATERCONSUMPTIONID){
									TotalWaterConsumption = TotalWaterConsumption + tempValue;
									isTotalWaterConsumptionChanged = true;
								}
							}
							
							if(tempObj != null && !isEmpty(tempObj) && tempObj[category] != null){
								tempObj[category] = tempObj[category] + tempValue;
								
							}else{
								tempObj[category] = tempValue;
							}
							
							if(totalCategoryList.includes(tempKeys3)){
								var tempValue = row[tempKeys3];
								if(tempValue != null && tempValue != undefined){
									TotalEnergyConsumption = TotalEnergyConsumption + tempValue;
									isTotalEnergyConsumptionChanged = true;
								}
							}
							break;
						}else if(totalCategoryList.includes(tempKeys3) && categoryID == TOTALID){
							var tempValue = row[tempKeys3];
							if(tempValue != null && tempValue != undefined){
								TotalEnergyConsumption = TotalEnergyConsumption + tempValue;
								isTotalEnergyConsumptionChanged = true;
							}
						}
					}
					if(!isCategoryFound){
						var tempValue = row[tempKeys3];
						if(tempValue != null && tempValue != undefined){
							if(tempObj != null && !isEmpty(tempObj) && tempObj[getString("Others")] != null){
								tempObj[getString("Others")] = tempObj[getString("Others")] + tempValue;
								TotalConsumption = TotalConsumption + tempValue;
							}else if(tempObj != null && !isEmpty(tempObj) && tempObj[getString("Total")] != null){
								tempObj[getString("Total")] = tempObj[getString("Total")] + tempValue;
								TotalConsumption = TotalConsumption + tempValue;
							}
							else{
								isOthersExist = true;
								
								if(CATEGORIES.indexOf(getString("Others"))>-1){
									tempObj[getString("Others")] = tempValue;
								}else{
									tempObj[getString("Total")] = tempValue;
								}
								
								TotalConsumption = TotalConsumption + tempValue;
							}
						}
					}
				}
			}
		}

		if(REPORTTYPE == 'energy' || SELECTEDTIMEPERIOD == 'mtd' || REPORTTYPE == 'bei_display' ){		
			for(var i in CATEGORIES){
				var newTempObject = {};
				var category = getCategoryNameByID(CATEGORIES[i]);
				if(tempObj[category] != undefined){
					var tempCategory = decodeCategories(category);
					newTempObject[tempCategory] = tempObj[category];
					tempRow.push(newTempObject);
				}
			}
			
			var tempConsumptionKey = getString('total_consumption');
			var TotalConsumptionObj = {};
			TotalConsumptionObj[tempConsumptionKey] = TotalEnergyConsumption;
			
			if(date<=today){
				tempRow.push(TotalConsumptionObj);
			}
		}
		else if(REPORTTYPE == 'water'){
			for(var i in CATEGORIES){
				var newTempObject = {};
				var category = getCategoryNameByID(CATEGORIES[i]);
				if(tempObj[category] != undefined){
					var tempCategory = decodeCategories(category);
					newTempObject[tempCategory] = tempObj[category];
					tempRow.push(newTempObject);
				}
			}
			
			var tempConsumptionKey = getString('total_consumption');
			var TotalConsumptionObj = {};
			TotalConsumptionObj[tempConsumptionKey] = TotalWaterConsumption;
			
			if(date<=today){
				tempRow.push(TotalConsumptionObj);
			}
		}
		
		if(REPORTTYPE == 'bei_display'){
			if(!isTotalEnergyConsumptionChanged){
				TotalEnergyConsumption = null;
			}
			
			if(!isTotalWaterConsumptionChanged){
				TotalWaterConsumption = null;
			}
			
			var TotalEnergyConsumptionObj = {"TotalEnergyConsumption": TotalEnergyConsumption};
			var TotalWaterConsumptionObj = {"TotalWaterConsumption": TotalWaterConsumption};
			tempRow.push(TotalEnergyConsumptionObj);
			tempRow.push(TotalWaterConsumptionObj);
		}
		
		tempDataSet[j] = tempRow;
	}
	
	Y2_AXES[getString('total_consumption')] = 'y2';
	
	if(!isOthersExist){
		var index = CATEGORIES.indexOf(getString("Others"));
		if (index > -1) {
			CATEGORIES.splice(index, 1);
		}else{
			index = CATEGORIES.indexOf(getString("Total"));
			if (index > -1) {
				CATEGORIES.splice(index, 1);
			}
		}
	}
	
	/*
	if(REPORTTYPE == 'energy'){
		var index = CATEGORIES.indexOf("Total");
		if (index > -1) {
			CATEGORIES.splice(index, 1);
		}
	}*/
	
	/*if(SELECTEDTIMEPERIOD == 'mtd'){
		var Consumption_string = "";
		
		Consumption_string = Consumption_string + '<div id="consumption_details" class="std-frame">'
												+ '<div class="consumption_label">Total Consumption</div>'
												+ '<div class="consumption_det">'
												+ '<input type="text" id="total_consumption" class="total_consumption" value="'+TotalEnergyConsumption+'" readonly></div>'
												+ '<div class="consumption_label">Total Generated Energy</div>'
												+ '<div class="consumption_det">'
												+ '<input type="text" id="total_generated" class="total_generated" value="'+TotalGeneratedEnergy+'" readonly></div>'
												+ '</div>'
		
		document.getElementById("Consumption_Details").innerHTML = Consumption_string;
	}*/
}

/*******************************************************
 * Operation Info and Malfunction Data Management Functions
********************************************************/
function processOperationInfo(){
	var selectedTimePeriod = $("input[name=SelectTimePeriod]:checked").val()
	SELECTEDTIMEPERIOD = selectedTimePeriod;
	
	var dateFrom, dateTo;
	
	dateFrom = $(' #TimeControl #from').val();
	
	if(dateFrom == null || dateFrom == '') {
		$('.loading').hide();
		if(ISQUERYCLICKED){
			alert(getString('enter_date'));
		}
		return false;
	}

	if(selectedTimePeriod == 'Month'){
		dateFrom = ENERGYDATEFROM;
	}else if(selectedTimePeriod == 'Day'){
		// Kaiwei 18/12/2018 changed dateFrom and dateTo to cater for language change (eg. portugese 'dez' for 'dec')
		var dateFrom = FROMD;
	}
	
	dateFrom = new Date(dateFrom);
	dateFrom = getEnergyReportDateFrom(new Date(dateFrom), selectedTimePeriod);
	dateTo = getEnergyReportDateTo(dateFrom, selectedTimePeriod);
	
	dateFrom = parseInt((dateFrom.getTime() / 1000).toFixed(0)); //convert to unix time				
	dateTo = parseInt(dateTo.getTime() / 1000).toFixed(0);		//convert to unix time
	
	var condition = {};
	condition['from'] = dateFrom;
	condition['to'] = dateTo;
	
	T_REPORT_FROMD = dateFrom; 
	//T_REPORT_TOD = parseInt(dateTo) - (60 * 60 * 24); // Display to date as last day of month or year
	T_REPORT_TOD = dateTo; // Display to date as last day of month or year
	
	ISTIMECHANGED = false;
	var command = [];
	
	command = ['get_operation_info', condition];
	COMM_PORT.send(command);
	return true;
}

function processErrorReporting(){
	var selectedTimePeriod = $("input[name=SelectTimePeriod]:checked").val()
	SELECTEDTIMEPERIOD = selectedTimePeriod;
	
	var dateFrom, dateTo;
	
	//dateFrom = $(' #TimeControl #from').val();
	//dateTo = $(' #TimeControl #to').val();
	// Kaiwei 18/12/2018 changed dateFrom and dateTo to cater for language change (eg. portugese 'dez' for 'dec')
	var dateFrom = FROMD;
	var dateTo = TOD;
	
	if(dateFrom == null || dateFrom == '') {
		$('.loading').hide();
		if(ISQUERYCLICKED){
			alert(getString('enter_date'));
		}
		return false;
	}
	
	if(dateTo == null || dateTo == '') {
		$('.loading').hide();
		if(ISQUERYCLICKED){
			alert(getString('enter_date'));
		}
		return false;
	}
	
	dateFrom = new Date(dateFrom);		//convert selected time from datepicker to JS date object
	dateTo = new Date(dateTo);
	
	if(dateFrom > Date.now()) {
		$('.loading').hide();
		alert(getString('past_date'));
		return false;
	}
	if(dateTo > Date.now()) {
		$('.loading').hide();
		alert(getString('rep_err_wrong_date'));
		return false;
	}
	
	dateFrom = parseInt((dateFrom.getTime() / 1000).toFixed(0)); //convert to unix time				
	dateTo = parseInt(dateTo.getTime() / 1000).toFixed(0);		//convert to unix time
	
	if(dateTo < dateFrom) {
		$('.loading').hide();
		if(ISQUERYCLICKED){
			alert(getString('rep_err_wrong_date'));
		}
		return false;
	}
	
	T_REPORT_FROMD = dateFrom; 
	T_REPORT_TOD = dateTo;
	
	dateTo = parseInt(dateTo) + (60 * 60 * 24);
	
	var condition = {};
	condition['from'] = dateFrom;
	condition['to'] = dateTo;
	
	ISTIMECHANGED = false;
	var command = [];
	
	command = ['get_error_reporting', condition];
	COMM_PORT.send(command);
	return true;
}

function formatOperationInfoData(temp_data){
	var data = summationOperationInfo(temp_data);
	var table_body = document.getElementById("op_info_table_body");
	table_body.innerHTML = ""; // Delete all rows from table body first before appending new rows
	var datefrom = new Date(T_REPORT_FROMD*1000);
	
	if(SELECTEDTIMEPERIOD == "Day"){
		document.getElementById("period_title").innerHTML = getString('date');
		var periodString = datefrom.toLocaleDateString(LOCALE,DATEOPT);
	}
	else{
		var dateTo = new Date((T_REPORT_TOD*1000)-(60*60*24)); // Display end date as last day of month or year
		document.getElementById("period_title").innerHTML = getString('period');
		var periodString = datefrom.toLocaleDateString(LOCALE,DATEOPT) + " - " + dateTo.toLocaleDateString(LOCALE,DATEOPT);
	}
	document.getElementById("op_info_period").innerHTML = periodString;
	
	dataLength = data.length;
	
	for(i=0; i<dataLength; i++){
		/*******************************************
		 * data[i][0] = id
		 * data[i][1] = OPTIME.optime			
		 * data[i][2] = TOTAL_OPTIME.op_time
		 * data[i][3] = ONTIMES.on_times
		 * data[i][4] = TOTAL_ONTIMES.on_times 
		 *******************************************/
		try{
			var point = POINT_LIST[data[i][0]];
			if(point == null) continue;
			var row = table_body.insertRow();
			
			var cell_management_point = row.insertCell();
			var cell_op_time = row.insertCell();
			var cell_total_op_time = row.insertCell();
			var cell_on_time = row.insertCell();
			var cell_total_on_time = row.insertCell();
			
			cell_management_point.innerHTML = point.info.name;
			cell_management_point.style.textAlign = "left";
			cell_op_time.innerHTML = data[i][1].toFixed(1);
			cell_total_op_time.innerHTML = data[i][2].toFixed(1);
			cell_on_time.innerHTML = data[i][3];
			cell_total_on_time.innerHTML = data[i][4];
		}catch(err){
			console.log(err.message);
		}
	}
	$('.loading').hide();
}

function summationOperationInfo(temp_data){
	/*******************************************
	 * temp_data[i][0] = OPTIME.id
	 * temp_data[i][1] = OPTIME.datetime
	 * temp_data[i][2] = OPTIME.optime
	 * temp_data[i][3] = OPTIME.cool_op_time
	 * temp_data[i][4] = OPTIME.fan_op_time
	 * temp_data[i][5] = OPTIME.heat_op_time
	 * temp_data[i][6] = OPTIME.th_on_time
	 * temp_data[i][7] = TOTAL_OPTIME.op_time
	 * temp_data[i][8] = TOTAL_OPTIME.cool_op_time
	 * temp_data[i][9] = TOTAL_OPTIME.fan_op_time
	 * temp_data[i][10] = TOTAL_OPTIME.heat_op_time
	 * temp_data[i][11] = TOTAL_OPTIME.th_on_time
	 * temp_data[i][12] = ONTIMES.on_times
	 * temp_data[i][13] = TOTAL_ONTIMES.on_times 
	 *******************************************/
	var array = [];
	var arrayCount = -1;
	try{
		dataLength = temp_data.length;
		var id = '';
		for(i=0; i<dataLength; i++){
			var tempID = temp_data[i][0];
			if(tempID != id){
				var row = [];
				arrayCount += 1;
				id = tempID;
				row[0] = id;
				
				var optime = temp_data[i][2]/60/60;
				var tot_optime = temp_data[i][7]/60/60
				row[1] = optime;			
				row[2] = tot_optime;
				row[3] = temp_data[i][12];
				row[4] = temp_data[i][13];
				array.push(row);
			}else{
				var optime = temp_data[i][2]/60/60;
				array[arrayCount][1] = array[arrayCount][1] + optime;			
				array[arrayCount][3] = array[arrayCount][3] + temp_data[i][12];
			}
		}
	}catch(err){
		console.log(err.message);
	}
	return array;
}

function secondTableTranspose(data){
	// to transpose the data array into:
	// Date  | Management Point 1 | Management Point 2 | ... 
	// Date1 | optime1, ontime1   | optime2, ontime2   | ...
	/*******************************************
	 * temp_data[i][0] = OPTIME.id
	 * temp_data[i][1] = OPTIME.datetime
	 * temp_data[i][2] = OPTIME.optime
	 * temp_data[i][3] = OPTIME.cool_op_time
	 * temp_data[i][4] = OPTIME.fan_op_time
	 * temp_data[i][5] = OPTIME.heat_op_time
	 * temp_data[i][6] = OPTIME.th_on_time
	 * temp_data[i][7] = TOTAL_OPTIME.op_time
	 * temp_data[i][8] = TOTAL_OPTIME.cool_op_time
	 * temp_data[i][9] = TOTAL_OPTIME.fan_op_time
	 * temp_data[i][10] = TOTAL_OPTIME.heat_op_time
	 * temp_data[i][11] = TOTAL_OPTIME.th_on_time
	 * temp_data[i][12] = ONTIMES.on_times
	 * temp_data[i][13] = TOTAL_ONTIMES.on_times 
	 *******************************************/
	dataLength = data.length;
	
	var array = [];
	var row = [];
	var id = '';
	var arrayCount = -1;
	var rowCount = 0;
	array = createEmptyArray(array);
	
	for(i=0; i<dataLength; i++){
		var tempID = data[i][0];
		var row = [];
		var cell = [];
		
		if(tempID != id){
			id = tempID;
			rowCount = 0;
		}else{
			
		}
		row = array[rowCount];
		if(row[0] != data[i][1]){ 
			while(row[0]< data[i][1]){ // If the data is missing from DB, insert null
				cell.push(null);
				cell.push(null);
				row.push(cell);
				array[rowCount] = row;
				rowCount = rowCount+1;
				row = array[rowCount];
				cell = [];
			}
		}
		
		var optimeInMinutes = Math.floor(parseInt(data[i][2])/60);
		cell.push(optimeInMinutes);
		cell.push(data[i][12]);
		row.push(cell);
		
		array[rowCount] = row;
		rowCount++;
	}
	return array;
}

function createEmptyArray(array){
	var datefrom = T_REPORT_FROMD;
	var dateTo = T_REPORT_TOD;
	
	while(datefrom < dateTo){
		var row = [];
		row.push(datefrom)
		array.push(row);
		datefrom += (24*60*60);
	}
	return array;
}

function formatErrorInfoData(data){
	var table_body = document.getElementById("err_table_body");
	table_body.innerHTML = ""; // Delete all rows from table body first before appending new rows
	
	var datefrom = new Date(T_REPORT_FROMD*1000);
	var dateTo = new Date(T_REPORT_TOD*1000);
	var periodString = datefrom.toLocaleDateString(LOCALE,DATEOPT) + " - " + dateTo.toLocaleDateString(LOCALE,DATEOPT);
	document.getElementById("err_period").innerHTML = periodString;
	
	try{
		var array = [];
		var keys = Object.keys(data);
		
		/*********************************************************************
		 * Example from DB:
		 * {"hatcp001-00001":{"64":[1542185423],"C1":[1542183705,1542185375]},
		 *  "hatcp001-00002":{"C1":[1542185443]}}
		 *  Note: "NC" means no error code
		 *********************************************************************/
		for(i in keys){
			var tempObj = data[keys[i]];
			var errKeys = Object.keys(tempObj);
			
			for(j in errKeys){
				var row = [];
				row.push(keys[i]);
				var err_code = errKeys[j];
				if(err_code == "NC"){ // no error code
					err_code = "";
				}
				row.push(err_code);
				row.push(tempObj[errKeys[j]].length)
				array.push(row);
			}
		}
		
		DATAROW = array; // set array to global variable DATAROW for export to csv
		
		var arrayLength = array.length;
		for(k=0; k<arrayLength; k++){
			var point = POINT_LIST[array[k][0]];
			var row = table_body.insertRow();
			
			var cell_management_point = row.insertCell();
			var cell_err_code = row.insertCell();
			var cell_err_freq = row.insertCell();
			
			cell_management_point.innerHTML = point.info.name;
			cell_management_point.style.textAlign = "left";
			cell_err_code.innerHTML = array[k][1];
			cell_err_freq.innerHTML = array[k][2];
		}
		$('.loading').hide();
	}catch(err){
		console.log(err.message);
	}
}

/*******************************************************
 * BEI Analysis Functions
********************************************************/
function processBEIReport(){
	if(REPORTTYPE == 'bei_display'){
		var selectedTimePeriod = 'p3y';
	}
	else{
		var selectedTimePeriod = $("input[name=SelectTimePeriod]:checked").val();
	}
	
	SELECTEDTIMEPERIOD = selectedTimePeriod;
	var dateFrom, dateTo, fromHH, toHH, interval;
	var managementPoints = [];
	
	dateFrom = new Date();
	dateFrom = getEnergyReportDateFrom(new Date(dateFrom), selectedTimePeriod);		//convert selected time from datepicker to JS date object
	dateTo = getEnergyReportDateTo(dateFrom, selectedTimePeriod);
	fromHH = getEnergyReportFromHH(selectedTimePeriod);
	toHH = getEnergyReportToHH(selectedTimePeriod);
	interval = getEnergyReportInterval(selectedTimePeriod, dateFrom, dateTo);

	if(selectedTimePeriod == 'mtd'){
		managementPoints = getEnergyManagementPoints();
	}else if(selectedTimePeriod == 'p3y'){
		managementPoints = getPiByCategoriesID(TOTALID);
		managementPoints = managementPoints.concat(getPiByCategoriesID(ENERGYGENERATORID));
	}
	
	MANAGEMENTPOINTLIST = managementPoints;
	
	if(dateFrom == null || dateFrom == '') {
		$('.loading').hide();
		if(ISQUERYCLICKED){
			alert(getString('enter_date'));
		}
		return false;
	}
	if(dateTo == null || dateTo == '') {
		$('.loading').hide();
		if(ISQUERYCLICKED){
			alert(getString('enter_date'));
		}
		return false;
	}

	if(managementPoints == null || isEmpty(managementPoints)) {
		$('.loading').hide();
		if(REPORTTYPE == "bei_display"){
			getBEIRatingForDisplay();
			return false;
		}else if(REPORTTYPE != ""){
			//alert("Please add a management point");
			alert(getString('rep_err_no_mgt_pt'));
			return false;
		}else{
			console.log("Error: No Management Points");
			return false;
		}
	}
	ISQUERYCLICKED = false;
	return getAnalogInputData(dateFrom, dateTo, fromHH, toHH, interval, managementPoints, REPORTTYPE);
}

function getBEIRegulationsForSelection(){
	var upper_limit = 0;
	var lower_limit = 0;
	
	if(BEI_REGULATIONS != null && !isEmpty(BEI_REGULATIONS)){
		upper_limit = BEI_REGULATIONS['upperLimit'];
		lower_limit = BEI_REGULATIONS['lowerLimit'];
	}
	
	$( "#startDate-ctrl #bei_regulation_settings #bei_upper_limit").val(upper_limit);
	$( "#startDate-ctrl #bei_regulation_settings #bei_lower_limit").val(lower_limit);
}

function groupDataByYear(tempDataSet){
	DATAKEYS = [];
	var BEIinfo_List = [];
	var floorArea = SITE_INFO['size'];
	var keysLength = 0;
	keysLength = Object.keys(tempDataSet).length
	
	for(j in tempDataSet){
		keysLength--;
		var BEIinfo = {};
		var temp = tempDataSet[j];
		var tempArray = temp;
		var tempRow = [];
		var tempObj = {};
		var year = "";
		var TotalConsumption = 0;
		
		for(k in temp){
			var row = temp[k];
			var tempKeys3 = Object.keys(row);
			if (tempKeys3 == "date"){
				tempRow.push(row);
				tempDate = new Date();
				tempDate.setYear(row[tempKeys3].substring(0,4));
				year = tempDate.getFullYear().toString() + " to " + (tempDate.getFullYear()+1).toString();
				lastyear = (tempDate.getFullYear()-1).toString();
			}
			else{
				for(tempKeys3 in row){					// tempkeys3 = Management Point Names
					var categoryList = getPiByCategoriesID(ENERGYGENERATORID);
					var tempValue = row[tempKeys3];
					if(categoryList.includes(tempKeys3)){
						if(tempValue != null && tempValue != undefined){
							TotalConsumption = TotalConsumption - tempValue;
						}
					}
					
					var totalList = getPiByCategoriesID(TOTALID);
					if(totalList.includes(tempKeys3)){
						if(tempValue != null && tempValue != undefined){
							TotalConsumption = TotalConsumption + tempValue;
						}
					}
					/*
					if(tempObj != null && !isEmpty(tempObj) && tempObj[year] != null){
						tempObj[year] = tempObj[year] + tempValue;
						TotalConsumption = TotalConsumption + tempValue;
					}else{
						tempObj[year] = tempValue;
						TotalConsumption = TotalConsumption + tempValue;
					}
					*/
				}
			}
		}
		tempObj[year] = TotalConsumption/floorArea;
		BEIinfo['thisYearDate'] = year.substr(0,4);
		BEIinfo['lastYearDate'] = lastyear.substr(0,4);
		
		if(tempObj[year] == null || tempObj[year] == undefined || isNaN(tempObj[year]) || !isFinite(tempObj[year])){
			tempObj[year] = 0;
			BEIinfo['value'] = 0;
		}else{
			BEIinfo['value'] = tempObj[year];
		}
		if(keysLength>0){
			tempRow.push(tempObj);
			DATAKEYS.push(year);
			BEIinfo_List.push(BEIinfo);
		}
		if(keysLength == 0){
			var today = new Date();
			today.setDate(today.getDate()+1);
			var startMonth = REPORT_START_DATE['month'];
			var startdate = REPORT_START_DATE['date'];
			var reportStartDate = new Date(today);
			var numDays = 1;
			var totalDaysInYear = 365;
			
			reportStartDate.setMonth(startMonth);
			reportStartDate.setDate(startdate);
			var reportEndDate = new Date(reportStartDate);
			
			if(today>reportStartDate){
				numDays = Math.abs(Math.floor((today - reportStartDate)/1000/(60*60*24)));
			}else if(today<=reportStartDate){
				reportStartDate.setYear(reportStartDate.getFullYear()-1);
				numDays = Math.abs(Math.floor((reportStartDate - today)/1000/(60*60*24)));
			}
			reportEndDate.setYear(reportStartDate.getFullYear()+1);
			totalDaysInYear = Math.abs(Math.floor((reportEndDate - reportStartDate)/1000/(60*60*24)));

			// estimated value is (average consumption per day * number of days in the year)/floor area
			var estValue = (TotalConsumption/numDays * totalDaysInYear) / floorArea;
			if(!isFinite(estValue) || isNaN(estValue)){
				estValue = 0;
			}
			tempObject = {};
			tempObject[getString('est_bei')] = estValue.toFixed(2);
			tempRow.push(tempObject);
			//tempRow.push({"Estimated BEI Rating": estValue.toFixed(2)});
			
			if(estValue == null || estValue == undefined){
				BEIinfo['value'] = 0;
			}else{
				BEIinfo['value'] = estValue;
			}
			BEIinfo_List.push(BEIinfo);
		}
		tempDataSet[j] = tempRow;
	}

	if(REPORTTYPE == 'bei_display'){
	}else{
		displayBEIAnalysis(BEIinfo_List, floorArea);
	}
}

function getPiByCategoriesID(categoryID){
	var categorizedPis = [];
	for(i in CATEGORIZED_PI.categorizedPiType){
		if(CATEGORIZED_PI.categorizedPiType[i].typeId == categoryID){
			if(REPORTTYPE == 'bei_analysis' || REPORTTYPE == 'bei_display'){
				if(categoryID==ENERGYGENERATORID && !PI_CATEGORIES["Energy_Generator"][0]["isEnabled"]){
					console.log("ENERGY GENERATOR NOT ENABLED");
				}
				else{
					categorizedPis.push(CATEGORIZED_PI.categorizedPiType[i].id);
				}
			}else{
				categorizedPis.push(CATEGORIZED_PI.categorizedPiType[i].id);
			}
		}
	}
	return categorizedPis;
}
	
function displayBEIAnalysis(BEIinfo_List, floorArea){
	var htmlString = "";
	htmlString = htmlString + '<div class="std-frame" >'
							+ '<div class="subtitle" style="float:left;">' + getString('floor_area') + ': </div><div class="subtitle" id="floorArea">'+floorArea+' sqm</div>'
							+ '<div id="BEIinformation">';
	
	for(z=BEIinfo_List.length-1; z>=0; z--){
		var BEIinfo = {};

		thisYearValue = parseFloat(BEIinfo_List[z]['value']);
		//prevYearValue = parseFloat(BEIinfo_List[z-1]['value']);
		thisYearDate = BEIinfo_List[z]['thisYearDate'];
		//lastYearDate = BEIinfo_List[z]['lastYearDate'];

		BEIinfo['thisYearDate'] = thisYearDate;
		//BEIinfo['variance'] = thisYearValue -prevYearValue;
		BEIinfo['rating'] = thisYearValue;
		
		/*
		if(thisYearValue == 0 && prevYearValue == 0){
			var variance = 0;
		}else if(thisYearValue == 0){
			var variance = -100;
		}else if(prevYearValue == 0){
			var variance = 100;
		}else{
			var variance = parseFloat((parseFloat(thisYearValue)-parseFloat(prevYearValue))/parseFloat(prevYearValue)*100).toFixed(3);
		}
		*/
		htmlString = htmlString + '<div id="year_'+z+'" class="item-title">'+thisYearDate+'</div>';
		//						+ '<div id="variance_'+z+'">'
		//						+ '<div class="bei_label">% Variance</div>'
		//						+ '<div class="bei_info">';
		//if(variance>0){
		//	htmlString = htmlString + '<input style="color: red;" type="text" id="variance_'+z+'" class="bei_rating" value="'+variance+'% increase" readonly ></div>'
		//}else if (variance>0){
		//	htmlString = htmlString + '<input style="color: green;" type="text" id="variance_'+z+'" class="bei_rating" value="'+variance+'% increase" readonly ></div>'
		//}else{
		//	htmlString = htmlString + '<input style="color: green;" type="text" id="variance_'+z+'" class="bei_rating" value="'+Math.abs(variance)+'% decrease" readonly ></div>'
		//}

		//htmlString = htmlString	+ '</div>'
		htmlString = htmlString + '<div id="bei_'+z+'">';
		if(z == BEIinfo_List.length-1){
			htmlString = htmlString + '<div class="bei_label_e">'+ getString('est_bei')+'</div>';
		}else{
			htmlString = htmlString + '<div class="bei_label">'+getString('bei_rating')+'</div>';
		}
		htmlString = htmlString + '<div class="bei_info"><input type="text" id="bei_rating_'+z+'" value="' 
								+ parseFloat(thisYearValue).toFixed(2) + '" class="bei_rating" readonly></div>' + '</div>';
	}
	htmlString = htmlString	+ '</div></div>';
	document.getElementById("BEI").innerHTML = htmlString;
	
	if(WIDTH<1000){
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .item-title').css('font-size', '18px');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_rating').css('font-size', '22px');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_label').css('margin-top', '8px');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_label_e').css('margin-bottom', '2px');
	}
}	

function getBEIRegulations(){
	var command = ['get_bei_regulations'];
	COMM_PORT.send(command);
	return true;
}

function setBEIRegulations(){
	var upper_limit = $( "#startDate-ctrl #bei_regulation_settings #bei_upper_limit").val();
	var lower_limit = $( "#startDate-ctrl #bei_regulation_settings #bei_lower_limit").val();
	var bei_regulations = [];
	
	tempObj = {"upperLimit": upper_limit,"lowerLimit":lower_limit};
	bei_regulations.push(tempObj);
	reportJSON = {'reportTypes': REPORT_TYPE_LIST['reportTypes'], 'startDate': [REPORT_START_DATE], "beiRegulations": bei_regulations};
	BEI_REGULATIONS = tempObj;
	COMM_PORT.send(['set_bei_regulations',reportJSON]);
}

/*******************************************************
 * BEI Display (Energy Monitoring) Functions
********************************************************/
function refreshDisplay(count){
	// to do refresh every day
	count = count +1;
	console.log("count = " + count) ;
	
	if(REPORTTYPE != "bei_display"){
		clearTimeout(BEIDISPLAYTIMEOUT);
		return;
	}
	
	PI_CATEGORIES = {};
	CATEGORIZED_PI = {};
	getPiCategories();
	
	setTimeout(function(){
		setCategoryIDs();
		if(PI_CATEGORIES == {} || PI_CATEGORIES == null || isEmpty(PI_CATEGORIES)){
			if(!COMM_PORT.isReady()) { 
				REPORTTYPE = "";
				clearTimeout(BEIDISPLAYTIMEOUT);
			}
			return;
		}
		getCategorizedPiManagementPoints();
		getReportStartDate();
		getSiteInfo();
	}, 100);
	setTimeout(function(){
		if(parseInt(count)==1){
			$('.loading').show();
		}
		BEI_DISPLAY_TYPE = 'Bei';
		processBEIReport();
		getSiteNameForDashboard();
	}, 1000);
	
	getEnergyData();
	getBEIDisplayDate();
	resizeReportScreen();
	
	BEIDISPLAYTIMEOUT = setTimeout(function(){refreshDisplay(count)}, 15 * 60 * 1000); // Refresh every 15min
	//BEIDISPLAYTIMEOUT = setTimeout(function(){refreshDisplay(count)}, 1 * 60 * 1000); // Refresh every 1min
	//BEIDISPLAYTIMEOUT = setTimeout(function(){refreshDisplay(count)}, 10 * 1000); // Refresh every 10sec
	//BEIDISPLAYTIMEOUT = setTimeout(function(){refreshDisplay(count)}, 30 * 1000); // Refresh every 30sec
}

function getEnergyData(){
	if(ISBEIRATINGCOMPLETED){
		BEI_DISPLAY_TYPE = 'Energy';
		getPiCategories();
		setTimeout(function(){	
			setCategoryIDs();
		}, 1000);
		setTimeout(function(){	
			//setCategoryIDs();
			processEnergyReport();
			displayCards();
		}, 1500);
		setTimeout(function(){	
			//getEnergyConsumptionForDisplay();
		}, 2000);
		ISBEIRATINGCOMPLETED = false;
	}else{
		var t2 = setTimeout(getEnergyData, 500);
	}
}

function getBEIRatingForDisplay(){
	try{
		var thisYearData = DATAROW_BEI[DATAROW_BEI.length-1]
		var pastYearData = DATAROW_BEI[DATAROW_BEI.length-2];
		var thisYearBEIRating = 0;
		var pastYearBEIRating = 0;
		
		for(thisYearkey in thisYearData){
			if(thisYearkey != 'x'){
				thisYearBEIRating = thisYearData[thisYearkey];
			}
		}
		
		for(pastYearkey in pastYearData){
			if(pastYearkey != 'x'){
				pastYearBEIRating = pastYearData[pastYearkey];
			}
		}
		
		document.getElementById('bei_rating').innerHTML = thisYearBEIRating + " kWh/m²/" + getString('year');
		document.getElementById('bei_rating_pastYear').innerHTML = pastYearBEIRating.toFixed(2) + " kWh/m²/" + getString('year');
	}catch(err) {
		document.getElementById('bei_rating').innerHTML = "N.A.";
		document.getElementById('bei_rating_pastYear').innerHTML = "N.A.";
		console.log(err.message)
	}
	ISBEIRATINGCOMPLETED = true;
}

function getEnergyConsumptionForDisplay(){
	$('.loading').hide();
	setTimeout(function(){
		try{
			var en_cat = [];
			var TotalEnergyConsumption = null;
			
			index = CATEGORIES.indexOf(getString("Others"));
			if (index > -1) {
				CATEGORIES.splice(index, 1);
			}
			index = CATEGORIES.indexOf(ENERGYGENERATORID);
			if (index > -1) {
				CATEGORIES.splice(index, 1);
			}
			index = CATEGORIES.indexOf(RECYCLEDWATERID);
			if (index > -1) {
				CATEGORIES.splice(index, 1);
			}
			index = CATEGORIES.indexOf(TOTALID);
			if (index > -1) {
				CATEGORIES.splice(index, 1);
			}
			
			var en_cat_total = [];
			var index_Water = -1;
			var isCategoryFound = false;
			for(i in DATAROW_ENERGY){
				for(key in DATAROW_ENERGY[i]){
					if(key != 'x'){
						for(j in CATEGORIES){
							tempCategoryName = decodeCategories(getCategoryNameByID(CATEGORIES[j]));
							if(key == tempCategoryName){
								if(key == "Water Consumption"){
									index_Water = j;
								}
								if(en_cat_total[j] == 0 || en_cat_total[j] == null){
									en_cat_total[j] = DATAROW_ENERGY[i][key];
								}else{
									en_cat_total[j] = en_cat_total[j] + DATAROW_ENERGY[i][key];
								}
							}
						}
					}
				}
				if(i== DATAROW_ENERGY.length-1){
					TotalEnergyConsumption = DATAROW_ENERGY[i]['TotalEnergyConsumption'];
					TotalWaterConsumption = DATAROW_ENERGY[i]['TotalWaterConsumption'];
				}
			}
			
			if(TotalEnergyConsumption != null){
				document.getElementById('total_consumption').innerHTML = TotalEnergyConsumption.toFixed(2) + " kWh";
/*				$('#bei_rating_display #right #Total_Energy_Consumption').css("background-color", "#00A0C6");*/
			}else{
/*				$('#bei_rating_display #right #Total_Energy_Consumption').css("background-color", "white");*/
				$('#bei_rating_display #right #Total_Energy_Consumption').hide();
			}
			
			for(k in CATEGORIES){
				var id = 'card'+(parseInt(k)+1)+'_consumption';
				if((k == index_Water || CATEGORIES[k]==WATERCONSUMPTIONID) && TotalWaterConsumption!=null && TotalWaterConsumption!=undefined){
					document.getElementById(id).innerHTML = TotalWaterConsumption.toFixed(2) + " m³";
				}
				else if(en_cat_total[k] != null){
					document.getElementById(id).innerHTML = en_cat_total[k].toFixed(2) + " kWh";
				}
				else{
					document.getElementById(id).innerHTML = "N.A."
				}
			}
		}catch(err) {
			console.log(err.message);
			document.getElementById('total_consumption').innerHTML = "N.A.";
			for(i=0; i<CATEGORIES.length; i++){
				var id = 'card'+(parseInt(i)+1)+'_consumption';
				document.getElementById(id).innerHTML = "N.A.";
			}
		}
	}, 100);
}

function getBEIDisplayDate(){
	var today = new Date();
	var year = today.getFullYear();
	var month = convertMonthMon(today.getMonth());
	var date = checkTime(today.getDate());
	var day = convertDay(today.getDay());
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    $('#right #date #today_date').html(day + ", " + today.toLocaleDateString(LOCALE,DATEOPT) + " " + h + ":" + m + ":" + s);
    var t = setTimeout(getBEIDisplayDate, 500);
}

function displayCards(){
	var index = -1;
	var categories = JSON.parse(JSON.stringify(CATEGORIES));
	
	index = categories.indexOf(getString("Others"));
	if (index > -1) {
		categories.splice(index, 1);
	}
	index = categories.indexOf(ENERGYGENERATORID);
	if (index > -1) {
		categories.splice(index, 1);
	}
	index = categories.indexOf(RECYCLEDWATERID);
	if (index > -1) {
		categories.splice(index, 1);
	}
	index = categories.indexOf(TOTALID);
	if (index > -1) {
		categories.splice(index, 1);
	}
	
	var cardString = "";
	for (i=1; i<=categories.length; i++){
		if(i == 1 || i == 3){
			cardString = cardString + '<div>';
		}
		
		cardString = cardString + '<div id="card'+i+'">';
		if((categories[i-1]) == WATERCONSUMPTIONID){
			cardString = cardString + '<div id="card'+i+'_label" class="card_water">' + getString("water_consumption") + '</div>'
		}else{
			cardString = cardString + '<div id="card'+i+'_label">' + decodeURIComponent(getCategoryNameByID(categories[i-1])) +' <br>' + getString('energy_cons') + '</div>' 
		}
		cardString = cardString + '<div id="card'+i+'_consumption"></div>' + '</div>';

		if(i == 2 || i == 4){
			cardString = cardString + '</div>';
		}
	}
	document.getElementById('display_cards').innerHTML = cardString;
	resizeReportScreen();
}

/*******************************************************
 * Energy Category/Category Settings Functions
********************************************************/
function getCategoriesForDisplay(){
	var energy = PI_CATEGORIES['Energy'];
	var energy_generator = PI_CATEGORIES['Energy_Generator'];
	var water = PI_CATEGORIES['Water_Consumption'];
	var water_generator = PI_CATEGORIES['Recycled_Water'];
	var isEnergyEnabled = PI_CATEGORIES['isEnergyEnabled'];
	
	if(isEnergyEnabled){
		$('#pi_Categories #Energy').show();
	}else {
		$('#pi_Categories #pi_category_settings #EnableEnergy .disable').removeClass("hide");
		$('#pi_Categories #pi_category_settings #EnableEnergy .enable').addClass("hide");
		$('#pi_Categories #Energy').hide();
	}
		
	if(energy_generator[0] != null && !isEmpty(energy_generator[0]) && energy_generator[0] != undefined){
		if(!(energy_generator[0].isEnabled)){
			$('#pi_Categories #pi_category_settings #EnableEnergyGen .disable').removeClass("hide");
			$('#pi_Categories #pi_category_settings #EnableEnergyGen .enable').addClass("hide");
		}
	}
	
	if(water_generator[0] != null && !isEmpty(water_generator[0]) && water_generator[0] != undefined){
		if(!(water_generator[0].isEnabled)){
			$('#pi_Categories #pi_category_settings #EnableWaterGen .disable').removeClass("hide");
			$('#pi_Categories #pi_category_settings #EnableWaterGen .enable').addClass("hide");
		}
	}

	if(water[0] != null && !isEmpty(water[0]) && water[0] != undefined){
		if(!(water[0].isEnabled)){
			$('#pi_Categories #pi_category_settings #EnableWater .disable').removeClass("hide");
			$('#pi_Categories #pi_category_settings #EnableWater .enable').addClass("hide");
			$('#pi_Categories #pi_category_settings #EnableWaterGen').hide();
		}
	}
	
	var energyString = '';
	var sliderEnabledString = '<div class="disable mls hide">'+ getString("disable") +'</div>'
							+ '<div class="slidesw"></div>'
							+ '<div class="enable mls">'+ getString("enable") +'</div>'
							+ '</span>';
	
	var sliderDisabledString = '<div class="disable mls">'+ getString("disable") +'</div>'
							+ '<div class="slidesw"></div>'
							+ '<div class="enable mls hide">'+ getString("enable") +'</div>'
							+ '</span>';
	
	for(i=0; i<3; i++){
		var index = parseInt(i)+1;
		energyString = energyString + '<div class="categoryLine">';
		energyString = energyString + '<span class="slide" id="enabled_en_'+ i + '">'
		if(energy[i] != null && !isEmpty(energy[i]) && energy[i] != undefined){
			if(energy[i].isEnabled){
				energyString = energyString + sliderEnabledString;
			}else{
				energyString = energyString + sliderDisabledString;
			}
			energyString = energyString + "<input class='category_type_input' id='cat_en_"+ i + "' type='text'/ value=" + '"' + decodeURIComponent(energy[i].type) + '"' + ">"; 
		}else{
			energyString = energyString + sliderDisabledString;
			energyString = energyString + "<input class='category_type_input' id='cat_en_"+ i + "' type='text'/ value=''>"; 
		}
		energyString = energyString + '</div>';
	}

	document.getElementById("Energy").innerHTML = energyString;
}

function getAllEnergy(){
	var allCategories = [];
	var total = PI_CATEGORIES['Total'];
	
	if (total[0].type != undefined && total[0].type != "" && total[0].isEnabled){
		allCategories.push(total[0].type);
	}
	return allCategories;
}

function getEnergyCategories(){
	var allCategories = [];
	var energy = PI_CATEGORIES['Energy'];
	var isEnergyEnabled = PI_CATEGORIES['isEnergyEnabled'];
	
	if(isEnergyEnabled){
		for (j in energy){
			if (energy[j].type != undefined && energy[j].type != "" && energy[j].isEnabled){
				allCategories.push(energy[j].type);
			}
		}
	}
	return allCategories;
}

function getGeneratorCategories(){
	var allCategories = [];
	var energy_generator = PI_CATEGORIES['Energy_Generator'];
	
	if (energy_generator[0].type != undefined && energy_generator[0].type != "" && energy_generator[0].isEnabled){
		allCategories.push(energy_generator[0].type);
	}
	return allCategories;
}

function getWaterCategories(){
	var allCategories = [];
	var water = PI_CATEGORIES['Water_Consumption'];
	var water_generator = PI_CATEGORIES['Recycled_Water'];
	
	if (water[0].type != undefined && water[0].type != "" && water[0].isEnabled){
		allCategories.push(water[0].type);
	}
	
	if (water_generator[0].type != undefined && water_generator[0].type != "" && water_generator[0].isEnabled){
		allCategories.push(water_generator[0].type);
	}
	return allCategories;
}

function getCategoriesString(categories){
	var htmlString = "";
	
	for (i in categories){
		var tempCategory = "";
		if(categories[i] == "Energy_Generator"){
			tempCategory = "energy_generator";
		}else if(categories[i] == "Water_Consumption"){
			tempCategory = "water_consumption";
		}else if(categories[i] == "Recycled_Water"){
			tempCategory = "recycled_water";
		}else if(categories[i] == "Total"){
			tempCategory = "total";
		}else{
			tempCategory = categories[i];
		}
		htmlString = htmlString + '<div class="Management_Points categorized list-title" id="' + categories[i].replace(' ', '_') +'">'
					 + '<span class="title" >' + decodeURIComponent(getString(tempCategory)) + '</span>'
					 + '<img src="image/edit-w.png" class="img-button">'
					 + '<div class="list">'
					 + '<div id="' + categories[i].replace(' ', '_') + '_list" class="' + categories[i].replace(' ', '_') + '_List"></div>'
					 + '<ul class="ulPiList" id="ul' + categories[i].replace(' ', '_') + '">';
		
		for(j in CATEGORIZED_PI.categorizedPiType){		
			var type = CATEGORIZED_PI.categorizedPiType[j].type;
			var id = CATEGORIZED_PI.categorizedPiType[j].id;
			var name = CATEGORIZED_PI.categorizedPiType[j].name;
	
			if(type == categories[i]){
				htmlString = htmlString + '<li id="' + id + '">' + name + '</li>'
			}
		}
		htmlString = htmlString + '</ul></div></div>'; 
	}
	return htmlString;
}

function getCategorizedPiForDisplay(){
	var EnergyCategories = getEnergyCategories();
	var GeneratorCategories = getGeneratorCategories();
	var WaterCategories = getWaterCategories();
	var TotalCategory = getAllEnergy();
	
	var energyHtmlString = getCategoriesString(EnergyCategories);
	var generatorHtmlString = getCategoriesString(GeneratorCategories);
	var waterHtmlString = getCategoriesString(WaterCategories);
	var totalHtmlString =  getCategoriesString(TotalCategory);
	
	document.getElementById("Pi_Total").innerHTML = totalHtmlString;
	document.getElementById("Pi_Energy").innerHTML = energyHtmlString;
	document.getElementById("Pi_Generator").innerHTML = generatorHtmlString;
	document.getElementById("Pi_Water").innerHTML = waterHtmlString;
	
	if(PI_CATEGORIES['isEnergyEnabled']){
		$('#Total').css('float', 'left')
	}else{
		$('#Total').css('float', 'none')
	}
}

function getPiManagementPoints() {
	var keys = Object.keys(POINT_LIST);
	var listString = '<ul class="list ulPiList" id="ulUncategorized">';
	var categorizedPiIds = [];
	
	for(j in CATEGORIZED_PI.categorizedPiType){
		if (CATEGORIZED_PI.categorizedPiType[j].type == SELECTEDTYPE){
			categorizedPiIds.push(CATEGORIZED_PI.categorizedPiType[j].id);
		}
	}
	
	for (i in keys){
		var point = POINT_LIST[keys[i]];
		var isAdded = false;
		if (point!= null && !isEmpty(point)){
			if(point.info.type != 'Pi' && point.info.type != 'SPi'){
				continue;
			}else{
				for(k in categorizedPiIds){
					if(categorizedPiIds[k] == keys[i]){
						isAdded = true;
					}
				}
				if(isAdded){
					listString = listString + '<li id="' + keys[i] + '" class="selected">' + point.info.name + '</li>';
				}else{
					listString = listString + '<li id="' + keys[i] + '">' + point.info.name + '</li>';
				}
				
			}
		}
	}
	listString = listString + '</ul>';
	document.getElementById("unCategorizedList").innerHTML = listString;
}

function refreshCategoryPi(){
	getCategorizedPiForDisplay();
	getPiManagementPoints();
	
	resizeReportScreen();
}

function refreshCategories(){
	getCategoriesForDisplay();
}

function highlightPiInDialog(id, index){
	try{
		var point = POINT_LIST[id];
		var type, container = "";
		
		if(CATEGORIZED_PI.categorizedPiType != null && !isEmpty(CATEGORIZED_PI.categorizedPiType)){
			var categoryType = CATEGORIZED_PI.categorizedPiType.find(x => x.id === id)
		}
		
		type = "Uncategorized";
		container = "#Pi_Uncategorized";
		$('#Category_Details #pi_name').val(point.info.name);
		$('#Category_Details #categoryType').val(type);
	}
	catch (err){
		//alert("Unable to get Category Data. Error: " + err.message);
		alert(getString("rep_err_category_highlight") + err.message);
		return;
	}
}

function removeUnselectedPi(list){
	var categorizedPi = CATEGORIZED_PI.categorizedPiType;
	var tempArray = [];
	
	for(i in categorizedPi){
		if(categorizedPi[i].type == SELECTEDTYPE){
			if(!(list.includes(categorizedPi[i].id))){
				tempArray.push(categorizedPi[i].id);
			}
		}
	}
	
	for(j in tempArray){
		var index = CATEGORIZED_PI.categorizedPiType.findIndex(x => (x.id === tempArray[j] && x.type === SELECTEDTYPE));
		CATEGORIZED_PI.categorizedPiType.splice(index, 1);
	}
}

function getCategoryId(category){
	var catEnergy = PI_CATEGORIES["Energy"];
	for(i in catEnergy){
		if(catEnergy[i]["type"] == category){
			return catEnergy[i]["id"];
		}
	}
	
	if(category == "Energy_Generator"){
		return PI_CATEGORIES["Energy_Generator"][0]["id"];
	}else if(category == "Water_Consumption"){
		return PI_CATEGORIES["Water_Consumption"][0]["id"];
	}else if(category == "Recycled_Water"){
		return PI_CATEGORIES["Recycled_Water"][0]["id"];
	}else if(category == "Total"){
		return PI_CATEGORIES["Total"][0]["id"];
	}
	else{
		return 0;
	}
}

function savePI(list){
	var type = SELECTEDTYPE;
	
	for (i in list){
		var point = POINT_LIST[list[i]];
		var name = point.info.name;
		var id = list[i];
		var typeId = 0;
		
		if(id == undefined || id == ""){
			if(id == undefined || id == ""){
				//alert("Unable to get Meter ID. Please select a Management Point before editting the name.");
				alert(getString("rep_err_meterId"));
				return;
			}
		}
		
		if(name == undefined || name == ""){
			//alert("Unable to find management point info: " + name);
			alert(getString("rep_err_mpInfo_not_found") + name);
			return;
		}
		
		if(type == undefined || type == ""){
			//alert("Unable to retrieve category type or ID");
			alert(getString("rep_err_no_category_type"));
			return;
		}else {
			typeId = getCategoryId(type);
			if(typeId == 0){
				//alert("Unable to retrieve category type or ID");
				alert(getString("rep_err_no_category_type"));
				return;
			}
		}
		
		val = {"id":id, "owner":"", "name":name,"icon":"", "typeId":typeId, "type":type};
		var action = "";
		var index = CATEGORIZED_PI.categorizedPiType.findIndex(x => (x.id === id && x.type === type));
		var count = countIdInCategorizedPi(CATEGORIZED_PI.categorizedPiType, id)
		
		if(count == 2){ 		// Exists in Total and somewhere else
			if(index >= 0) { 	// Already exists in the same category
				 // do nothing
			}
			else{				// Exists in another category
				index = CATEGORIZED_PI.categorizedPiType.findIndex(x => (x.id === id && x.type != 'Total'));
				action = 'modify';
			}
		}else if(count == 1){ 	// only 1 in list
			var isExistsInTotal = false;
			for(j in CATEGORIZED_PI.categorizedPiType) {
			    if ((CATEGORIZED_PI.categorizedPiType[j].id == id) &&
		    		(CATEGORIZED_PI.categorizedPiType[j].type == 'Total')) {
			    	isExistsInTotal = true;
			        break;
			    }
			}
			
			if(isExistsInTotal){			// Only 1 and it is in Total
				if(type == "Total"){ 	
					// do nothing
				}else{			
					action = 'add';			// Add into a different category
				}
			}else{							// Only 1 and not inside total
				if(type == "Total"){ 
					action = 'add';
				}else{
					index = CATEGORIZED_PI.categorizedPiType.findIndex(x => x.id === id);
					action = 'modify';
				}
			}
		}else{								// Does not exist at all
			action = 'add';
		}
		
		switch(action) {
	    case 'add':
	    	CATEGORIZED_PI.categorizedPiType.push(val);
	        break;
	    case 'modify':
	    	CATEGORIZED_PI.categorizedPiType[index] = val;
	        break;
	    case 'remove':
	    	CATEGORIZED_PI.categorizedPiType.splice(index, 1);
	        break;
	    default:
	        break;
		}
		
		CHANGEDPI.push(val);
	}
	COMM_PORT.send(['set_categorized_pi',CATEGORIZED_PI]);
}

function updateCategorizedPi(){ // update existing categories in CategorizedPi
	for(i in CATEGORIZED_PI.categorizedPiType){
		if(CATEGORIZED_PI.categorizedPiType[i].typeId < 200){ // energy categories
			for (j in PI_CATEGORIES["Energy"]){
				if(CATEGORIZED_PI.categorizedPiType[i].typeId == PI_CATEGORIES["Energy"][j]["id"]){
					CATEGORIZED_PI.categorizedPiType[i].type = PI_CATEGORIES["Energy"][j]["type"]
				}
			}
		}
	}
	
	COMM_PORT.send(['set_categorized_pi',CATEGORIZED_PI]);
}

function countIdInCategorizedPi(CategorizedPi, id){
	var count = 0;
	for(i in CategorizedPi){
		if(CategorizedPi[i].id == id){
			count++;
		}
	}
	return count;
}

/*******************************************************
 * Set Start Date/Month Functions
********************************************************/
function getReportStartDate(){
	var command = ['get_start_date'];
	COMM_PORT.send(command);
	return true;
}

function setReportStartMonth(){
	var startDate = [];
	var tempDate = {};
	var selectedMonth = 0;
	var selectedDate = 1;
	var reportJSON = {};
	
	$( "#startDate-ctrl #selectMonth #ul_selectMonth li" ).each(function() {
		if($(this).hasClass("selected")){
			var id = $(this).attr('id');
			selectedMonth = parseInt(id.substr(id.indexOf('_')+1, id.length));
		}
	});

	$( "#startDate-ctrl #selectDate #ul_selectDate li" ).each(function() {
		if($(this).hasClass("selected")){
			var id = $(this).attr('id');
			selectedDate = parseInt(id.substr(id.indexOf('_')+1, id.length));
		}
	});
	
	tempDate = {"date": selectedDate, "month": selectedMonth};
	startDate.push(tempDate);
	reportJSON = {'reportTypes': REPORT_TYPE_LIST['reportTypes'], 'startDate': startDate, "beiRegulations": [BEI_REGULATIONS]};
	REPORT_START_DATE = tempDate;
	COMM_PORT.send(['set_start_date',reportJSON]);
}

/*******************************************************
 * Export To CSV Functions
********************************************************/
function exportReportToCSV(){
	if(DATAROW == null || isEmpty(DATAROW) || isEmpty(DATAROW[0])){
		return null;
	}
	if(DATAKEYS !=null && !isEmpty(DATAKEYS)){
		for(i in DATAKEYS){
			DATAKEYS[i] = decodeCategories(DATAKEYS[i]);
		}
	}
	if(REPORTTYPE == 'temperature'){
		rearrangeTime();
	}
	
	var array = DATAROW;
    var str = '';
    keysLength = DATAKEYS.length;
    
	try{
		 for (var i = 0; i < array.length; i++) {
	        var line = '';
	    	var index = 0; 
	    	var keys = Object.keys(array[i]);
	    	
	    	// get date first
	    	if(array[i]["x"] != null){
	    		dateString = array[i]["x"].replace(' ', "T");
        		var today = new Date();
        		checkDate = new Date(Date.parse(dateString));
        		if(REPORTTYPE == 'energy' || REPORTTYPE == 'water'){
        			checkDate.setTime(checkDate.getTime() + (15*60*1000)) // add 15min because data in db only populates after every 15min
        		}
        		if(today>checkDate){
        			line += array[i]["x"];
        		}
        		else{
        			break;
        		}
	    	}
	    	
	        for (key in array[i]) {
	        	if(key != "x"){
	        		if(DATAKEYS[index] != key ){
	        			if(DATAKEYS.includes(key)){
	        				if(keys.includes(DATAKEYS[index])){ // means position is wrong
	        					DATAKEYS = swapArrayPosition(DATAKEYS, index, DATAKEYS.indexOf(key))
	        					if (line != '') line += ',';
	        					line += array[i][key];
	        					index++;
	        				}
	        				else{
	        					for(j=index; j<keysLength; j++){
		        					if(DATAKEYS[j] == key){
		        						if (line != '') line += ',';
		        						line += array[i][key];
		        						break;
		        					}else{
		        						if (line != '') line += ',';
		        						if(REPORTTYPE == 'temperature'){
		        							line += "";
		        						}else{
		        							line += "0";
		        						}
		        					}
		        				}
	        					index = j;
		        				index++;
	        				}
	        			}else if(keys.includes(DATAKEYS[index])){}
	        			else{
	        				if (line != '') line += ',';
	        				if(REPORTTYPE == 'temperature'){
    							line += "";
    						}else{
    							line += "0";
    						}
	        				index++;
	        			}
	        		}
	        		else if(DATAKEYS[index] == key){
	        			if (line != '') line += ',';
	        			if(array[i][key] == null){
	        				line += "";
	        			}
	        			else{
	        				line += array[i][key];
	        			}
	    				index++;
	        		}
	        	}
	        }
	        str += line + '\r\n';
	    }
	}
	catch(err){
		console.error(err.message);
	}
	
	var headerStr = "";
	headerStr += getString('datetime'); 
	// For the header row, get all Management point names
	for (j in DATAKEYS){
		headerStr += ", " + DATAKEYS[j];
	}
	headerStr += '\r\n';
	str = headerStr + str;
	return str;
}

function rearrangeTime(){
	DATAROW = mergeSort(DATAROW);
}

function exportBEIReportToCSV(){
	var array = DATAROW;
	if(DATAROW == null || isEmpty(DATAROW) || isEmpty(DATAROW[0])){
		return null;
	}
	
    var str = '';
    keys = DATAKEYS;
    //For header row, add header names
    str += "Time Period, BEI Rating\r\n"
	
	for (var i = 0; i < array.length; i++) {
		var line = '';
		for (var index in array[i]) {
			if(index != 'x'){
				line += index + ", " + array[i][index];
			}
		}
		 str += line + '\r\n';
	}

	return str;
}

function downloadCSV2(csv, filename) {
    var csvFile;
    var downloadLink;
    $('.loading').hide();
    
    var BOM = "\uFEFF";
    var csv = BOM + csv;

    csvFile = new Blob([csv], {type: "text/csv;charset=utf-8,%EF%BB%BF"});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}

function exportOperationInfoToCSV(){
	/*******************************************
	 * OPERATION_INFO[i][0] = OPTIME.id
	 * OPERATION_INFO[i][1] = OPTIME.datetime
	 * OPERATION_INFO[i][2] = OPTIME.optime
	 * OPERATION_INFO[i][3] = OPTIME.cool_op_time
	 * OPERATION_INFO[i][4] = OPTIME.fan_op_time
	 * OPERATION_INFO[i][5] = OPTIME.heat_op_time
	 * OPERATION_INFO[i][6] = OPTIME.th_on_time
	 * OPERATION_INFO[i][7] = TOTAL_OPTIME.op_time
	 * OPERATION_INFO[i][8] = TOTAL_OPTIME.cool_op_time
	 * OPERATION_INFO[i][9] = TOTAL_OPTIME.fan_op_time
	 * OPERATION_INFO[i][10] = TOTAL_OPTIME.heat_op_time
	 * OPERATION_INFO[i][11] = TOTAL_OPTIME.th_on_time
	 * OPERATION_INFO[i][12] = ONTIMES.on_times
	 * OPERATION_INFO[i][13] = TOTAL_ONTIMES.on_times 
	 *******************************************/
	
	var str = "";
	var managementPointHeaders = [];
	var datefrom = new Date(T_REPORT_FROMD*1000);
	
	// First row in the csv is the time period
	if(SELECTEDTIMEPERIOD == "Day"){
		str += "," + getString('date') + ",";
		var periodString = datefrom.toLocaleDateString(LOCALE,DATEOPT);
	}
	else{
		var dateTo = new Date((T_REPORT_TOD*1000)-(60*60*24)); // Display end date as last day of month or year
		str += "," + getString('period') + ",";
		var periodString = datefrom.toLocaleDateString(LOCALE,DATEOPT) + " - " + dateTo.toLocaleDateString(LOCALE,DATEOPT);
	}
	
	str += periodString + '\r\n\r\n';
	
	// First Table 
	var firstHeaderStr = ",";
	var firstTableStr  = "";
	
	// First Table Header
	firstHeaderStr  += getString("management_points") + "," + getString("h_op") + "," 
					 + getString("tot_optime") + "," 
					 + getString("ontimes") + "," + getString("tot_ontimes") + '\r\n' ;
	
	// First Table Contents
	var firstTableData = summationOperationInfo(OPERATION_INFO); // get the summation of op_times
	var firstTableLength = firstTableData.length;
	
	for(i=0; i<firstTableLength; i++){
		var point = POINT_LIST[firstTableData[i][0]];
		managementPointHeaders.push(point.info.name); // add management point names for the headers in second table
		/*******************************************
		 * data[i][0] = id
		 * data[i][1] = OPTIME.optime			
		 * data[i][2] = TOTAL_OPTIME.op_time
		 * data[i][3] = ONTIMES.on_times
		 * data[i][4] = TOTAL_ONTIMES.on_times 
		 *******************************************/
		firstTableStr += ","
		firstTableStr += point.info.name + ",";
		firstTableStr += firstTableData[i][1] + ",";
		firstTableStr += firstTableData[i][2] + ",";
		firstTableStr += firstTableData[i][3] + ",";
		firstTableStr += firstTableData[i][4] + "\r\n";	
	}
	firstTableStr += "\r\n";
	
	// Comment before second table
	var commentStr = "," + getString("op_csv_comments") + "\r\n\r\n"
	
	// Second Table
	var secondHeaderStr = ",";
	var secondTableStr = ",";
	
	// Second Table Header
	secondHeaderStr += "Date ";
	var secondHeaderLength = managementPointHeaders.length;
	for(j=0; j<secondHeaderLength; j++){
		secondHeaderStr += "," + managementPointHeaders[j] + ",";
	}
	secondHeaderStr = secondHeaderStr.substr(0, secondHeaderStr.lastIndexOf(","));
	secondHeaderStr += "\r\n";
	
	secondHeaderStr += ",";
	var optimeHeader = getString("optime_m");
	var ontimeHeader = getString("ontimes");
	for(k=0; k<secondHeaderLength; k++){
		secondHeaderStr += "," + optimeHeader + "," + ontimeHeader;
	} 
	secondHeaderStr += "\r\n";
	
	// Second Table Contents
	var secondTableData = secondTableTranspose(OPERATION_INFO);
	var secondTableLength = secondTableData.length;
	
	for(y=0; y<secondTableLength; y++){
		var row = secondTableData[y]
		rowLength = row.length;
		
		for(z=0; z<rowLength; z++){
			var column = row[z];
			if(z==0){
				date = new Date(parseInt(column)*1000);
				secondTableStr += date.toLocaleDateString(LOCALE,DATEOPT);
				//secondTableStr += column + " " + date;
			}else{
				if(column[0] == null){
					column[0] = "";
				}
				if(column[1] == null){
					column[1] = "";
				}
				secondTableStr += "," + column[0] + "," + column[1];
			}
		}
		secondTableStr += "\r\n";
		secondTableStr += " ,";
	}
	
	str += firstHeaderStr + firstTableStr + commentStr + secondHeaderStr + secondTableStr;
	return str;
}

function exportErrorDataToCSV(){
	var str = "";
	var datefrom = new Date(T_REPORT_FROMD*1000);
	var dateTo = new Date(T_REPORT_TOD*1000);
	
	// First row in the csv is the time period
	str += "," + getString('period') + ",";
	var periodString = datefrom.toLocaleDateString(LOCALE,DATEOPT) + " - " + dateTo.toLocaleDateString(LOCALE,DATEOPT);
	str += periodString + '\r\n\r\n';
	str += "," + getString("management_points") + "," + getString("err_code") + "," + getString("err_code_freq") + '\r\n';
	
	var dataLength = DATAROW.length;
	for(i=0; i<dataLength; i++){
		var point = POINT_LIST[DATAROW[i][0]];
		str += ",";
		str += point.info.name + "," + DATAROW[i][1] + "," + DATAROW[i][2];
		str += '\r\n';
	}
	return str;
}

/*******************************************************
 * Chart Functions
********************************************************/
function displayChart(){
	if (DATAROW == null || isEmpty(DATAROW) ){
		if(CHART!= null && !isEmpty(CHART)){
			resetYminmax();
		}
		try{
			loadChart(null);
		}catch(err){
			console.log(err.message)
		}
	}
	else {
		try{
			DATAROWlength = DATAROW.length;
			numDataPoints = DATAROWlength * DATAKEYS.length
			maxData = 1200;
			console.log("numDataPoints = " + numDataPoints)
			console.log("maxData = " + maxData)
			
			if(numDataPoints > maxData){
				var dataset = [];
				var count = 1;
				//alert("Chart is unable to display too many datapoints. For visual purpose, datapoints will be reduced. To see more details, please export data to csv.")
				
				numNewInterval = Math.floor(numDataPoints/maxData);
				var count = 0;
				while(count<DATAROWlength){
					dataset.push(DATAROW[count]);
					count = count+numNewInterval;
				}
				
				try{
					loadChart(dataset);
				}catch(err){
					console.log(err.message);
				}
			}else{
				try{
					loadChart(DATAROW);
				}catch(err){
					console.log(err.message);
				}
			}
		}catch(err){
			//alert("Error while loading data into chart: " + err);
			alert(getString("rep_err_load_chart") + err);
		}
	}
}

function displayEnergyChart(){
	if (DATAROW == null || isEmpty(DATAROW) ){
		DATAKEYS = [];
		if(CHART!= null && !isEmpty(CHART)){
			//resetYminmax();
		}
		try{
			loadEnergyChart();
		}catch(err){
			console.log(err.message);
		}
	}
	else {
		try{
			if(REPORTTYPE != 'bei_analysis'){
				checkSelectedCategories();
			}
			try{
				loadEnergyChart();
			}catch(err){
				console.log(err.message);
			}
		}catch(err){
			//alert("Error while loading data into chart: " + err);
			alert(getString("rep_err_load_chart") + err);
		}
	}
}

function generateChart(){
	var paddingSet = {};
	if(REPORTTYPE == 'temperature'){
		paddingSet = {top: 30, right: 40, bottom: 0, left: 55};
	}else{
		paddingSet = {top: 30, right: 60, bottom: 0, left: 55};
	}
	
	
	if(DATAROW == null || isEmpty(DATAROW)){
		DATAROW = [{}];
	}
	
	if(DATAKEYS == null || isEmpty(DATAKEYS)){
		DATAKEYS = [];
	}
	
	CHART = c3.generate({
		bindto: '#chart',
		/*padding: { // Controls the padding of the chart
	        top: 30,
	        right: 40,
	        bottom: 0,
	        left: 55
	    },*/
		padding: paddingSet,
	    color: {
	    // 		pattern: ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5']
	    //		pattern: ['#071e22', '#1d7874', '#679289', '#f4c095', '#ee2e31']		//NG
	    //    	pattern: ['#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D'] 		//purple to red
	    //		pattern: ['#E5FCC2', '#9DE0AD', '#45ADA8', '#547980', '#594F4F'] 		//NG	
	    		pattern: ['#A7226E', '#EC2049', '#F26B38', '#F7DB4F', '#2F9599'] 		//sunrise
	    },
		size: {
			width: WIDTH*0.68,
			height: HEIGHT*0.8
		},
		data: {
			empty: { label: { text: getString('chart_no_data') } },//"Please Input Data"
			x: 'x',
			xFormat: '%Y-%m-%d %H:%M:%S',
			json: DATAROW, // From svmc1.js
            keys: { 
            	x: 'x',
            	value: DATAKEYS // From svmc1.js
            },
            axes: {
                //y2: 'y2'
            },
            order: getChartOrder(),
            groups: [
                ['data1', 'data2']
            ]
		},
		axis: {
			x: {
				label: {
					text: getString('datetime'),
					position: 'inner-right'
				},
				// add ticks
				type: 'timeseries',
                tick: {
                	culling: {  	 // If true is set, the ticks will be culled, then only limitted tick text will be shown. 
                        max: 12 	 // The number of tick texts will be adjusted to less than this value
                    },
                	format: getXTickFormat(),
                    rotate: -30, 	 // Rotate x axis tick text.
                    multiline: true, // If this option is set true, when a tick's text on the x-axis is too long, 
                    				 // it splits the text into multiple lines in order to avoid text overlapping.
                    fit: true		 // If true set, the ticks will be positioned nicely
                }
			},
			y: {
				default: [0,1],
				label: {
					position: 'outer-middle'
				},
			},
			y2: {
				 show: false,
				 label: {
					 position: 'outer-middle'
				 },
			}
		},
		grid: {
			y: {
				lines: []
			}
		},
		line: {
			  connectNull: true
		},
		zoom: {
	        enabled: true
	    },
	    transition: {
	        duration: 0
	    },
	    point: {
	    	show: false
	    }
	});
	
	for(i=0; i<DATAKEYS.length; i++){
		if(DATAKEYS[i].substring(0,3) == "sp:" ){
			var name = ".c3-target-"+DATAKEYS[i];
			$(name).css('stroke-dasharray','5,5');
		}
	}
}

function loadChart(dataset){	
	c3.chart.fn.axis.show_y2 = function (shown) {
		try{
			var $$ = this.internal, config = $$.config;
		    config.axis_y2_show = !!shown;
		    $$.axes.y2.style("visibility", config.axis_y2_show ? 'visible' : 'hidden');
		    $$.redraw();
		}catch(err){
			//alert("Y2 Axis Error: " + err);
			alert(getString("rep_err_Y2_axis") + err);
		}
	};
	
	c3.chart.fn.data.resetY2 = function(){
		try{
			var $$ = this.internal; config = $$.config;
			config['data_' + 'axes'] = {};
			$$.redraw();
		}catch(err){
			//alert("Y2 Axis Error: " + err);
			alert(getString("rep_err_Y2_axis") + err);
		}
	};
	
	setTimeout(function () {
		try{
			CHART.data.resetY2(); 		// C3 chart API only appends keys into Y2, need to reset Y2 in config
			CHART.axis.show_y2(false);
			CHART.load({
				unload: true,
				bindto: '#chart',
				json: dataset, 			// From svmc1.js
		        keys: {
		        	x: 'x',
		        	value: DATAKEYS 	// From svmc1.js
		        },
		        axes: Y2_AXES,
		        
			});
			CHART.ygrids.remove();
		}catch(err){
			console.log(err.message);
		}
	}, 100);

	setTimeout(function () {
		if(DATAROW.length > 200){
			$('#Analog_Input_Report #chart .tick line').css("display", "none");	
			$('#Analog_Input_Report #chart .c3-axis.c3-axis-x').children('.tick').each(function () {
				if($(this).find('text').css('display') != 'none'){
					$(this).find('text').siblings("line").css("display", "inline");
				}
			});
		}else{
			$('#Analog_Input_Report #chart .tick line').css("display", "inline");	
		}
	}, 1000);
	
	setTimeout(function () {
		CHART.axis.show_y2(true);
		CHART.ygrids(Y_GRIDLINES);
		
		CHART.axis.range({
			max: {y: parseFloat(Y_RANGE['upperLimit'])},
			min: {y: parseFloat(Y_RANGE['lowerLimit'])}
		});
		
		CHART.axis.labels({y: formatYAxisLabel(Y_AXIS_UNIT)});
		if (Y2_AXIS_UNIT != ""){
			CHART.axis.range({
				max: {y2: parseFloat(Y2_RANGE['upperLimit'])}, 
				min: {y2: parseFloat(Y2_RANGE['lowerLimit'])}
			});		
			CHART.axis.labels({y2: formatYAxisLabel(Y2_AXIS_UNIT)});
			CHART.axis.show_y2(true);
		}else{
			CHART.axis.show_y2(false);
		}
		
		for(key in MANAGEMENTPOINTLIST){
			var mPoint = MANAGEMENTPOINTLIST[key];
			var name = ".c3-line-"+mPoint["name"];
			var css = $(name).css("stroke");
			
			if(mPoint["uLimit"] != null){
				$(".c3-ygrid-line.upper-limit-"+mPoint["name"]+" line").css("stroke", css);
				$(".c3-ygrid-line.upper-limit-"+mPoint["name"]+" line").css('stroke-dasharray','5,5');
			}
			if(mPoint["lLimit"] != null){
				$(".c3-ygrid-line.lower-limit-"+mPoint["name"]+" line").css("stroke", css);
				$(".c3-ygrid-line.lower-limit-"+mPoint["name"]+" line").css('stroke-dasharray','5,5');
			}
		}
		
		if(WIDTH < 788 && DATAKEYS.length>8){
			CHART.legend.hide();
		} else{
			CHART.legend.show();
		}
		console.timeEnd('finished load chart');
		$('.loading').hide();
	}, 1000);
}

function loadEnergyChart(){
	//console.log("DATAROW = " + JSON.stringify(DATAROW));
	//console.log("DATAKEYS = " + JSON.stringify(DATAKEYS));
	if(DATAKEYS !=null && !isEmpty(DATAKEYS)){
		for(i in DATAKEYS){
			DATAKEYS[i] = decodeCategories(DATAKEYS[i]);
		}
	}
	
	c3.chart.fn.axis.show_y2 = function (shown) {
		try{
			var $$ = this.internal, config = $$.config;
		    config.axis_y2_show = !!shown;
		    $$.axes.y2.style("visibility", config.axis_y2_show ? 'visible' : 'hidden');
		    $$.redraw();
		}catch(err){
			//alert("Y2 Axis Error: " + err);
			alert(getString("rep_err_Y2_axis") + err);
		}
	};
	
	c3.chart.fn.data.resetY2 = function(){
		try{
			var $$ = this.internal; config = $$.config;
			config['data_' + 'axes'] = {};
			$$.redraw();
		}catch(err){
			//alert("Y2 Axis Error: " + err);
			alert(getString("rep_err_Y2_axis") + err);
		}
	};
	// Remove Energy Generator from the group of stacked elements in bar chart
	//var groups = DATAKEYS.filter(e => (e !== "Energy Generator"))
	var groups = DATAKEYS.filter(e => (e !== getString('energy_generator')))
	groups = groups.filter(e => (e !== "Recycled Water"))
	//groups = groups.filter(e => (e !== "TotalConsumption"))
	groups = groups.filter(e => (e !== getString('total_consumption')))
	
	
	
	CHART.destroy();
	generateChart();
	CHART.axis.labels({y: formatYAxisLabel(Y_AXIS_UNIT)});
	if(REPORTTYPE == 'energy' ){
		Y2_AXIS_UNIT = 'total_energy';
		CHART.axis.labels({y2: formatYAxisLabel(Y2_AXIS_UNIT)});
	}else if(REPORTTYPE == 'water'){
		Y2_AXIS_UNIT = 'total_water';
		CHART.axis.labels({y2: formatYAxisLabel(Y2_AXIS_UNIT)});
	}
	
	setTimeout(function () {
		CHART.data.resetY2(); 		// C3 chart API only appends keys into Y2, need to reset Y2 in config
		CHART.axis.show_y2(false);
		CHART.load({
			unload: true,
			bindto: '#chart',
			json: DATAROW, 			// From svmc1.js
	        keys: {
	        	x: 'x',
	        	value: DATAKEYS 	// From svmc1.js
	        },
	        axes: Y2_AXES,
		});
	}, 100);
	
	setTimeout(function () {
		CHART.transform('bar');
		if((REPORTTYPE == 'energy' || REPORTTYPE == 'water') && (!isEmpty(DATAROW[0]) && !isEmpty(DATAROW) && DATAROW != null)){
			CHART.axis.show_y2(true);
			//CHART.transform('line', "TotalConsumption");
			CHART.transform('line', getString('total_consumption'));
		}else if(REPORTTYPE == 'bei_analysis'){
			//CHART.transform('area', "Estimated BEI Rating");
		}
		CHART.ygrids(Y_GRIDLINES);
	}, 400);
	
	// for stacked bar chart
	setTimeout(function () {
	    CHART.groups([groups]);
	}, 800);
	
	console.timeEnd('finished load chart');
}

function checkSelectedCategories(){ // For displayEnergyChart and displayChart
	var keys = []; 
	Y_GRIDLINES = [];
	
	if(!isEmpty(DATAROW[0]) && !isEmpty(DATAROW) && DATAROW != null){
		if(REPORTTYPE == 'energy'){
			$("#EnergyReportCategories").children('div').each(function(){
				if($(this).hasClass("checked")){
					keys.push(getCategoryNameByID($(this).attr('id')));
				}
			});
		}else if (REPORTTYPE == 'water'){
			$("#WaterReportCategories").children('div').each(function(){
				if($(this).hasClass("checked")){
					keys.push($(this).attr('id'));
				}
			});
		}else if(REPORTTYPE == 'temperature'){
			for (i in MLIST){
				var point = POINT_LIST[MLIST[i]];
				var managementPoint = {};
				managementPoint["name"] = MLIST[i];
				
				if (point.info.attr.unit_label!=null){
					POINT_UNIT = point.info.attr.unit_label;
					managementPoint["unit"] = POINT_UNIT;
					managementPoint = formatYAxisUnit_Range(point, POINT_UNIT, managementPoint);
				}else if(point.info.type == 'Fcu'){
					POINT_UNIT = "°C";
					managementPoint["unit"] = POINT_UNIT;
					managementPoint = formatYAxisUnit_Range(point, POINT_UNIT, managementPoint);
				}
				
				keys.push(point.info.name);
				if(point.info.type == 'Fcu'){
					keys.push("sp:" + point.info.name);
				}
			}
		}
	}
		
	if(DATAKEYS.includes(getString("Others"))){
		keys.push(getString("Others"));
	}else if(DATAKEYS.includes(getString("Total"))){
		keys.push(getString("Total"));
	}
	if(DATAKEYS.includes(getString('total_consumption')) || DATAKEYS.includes('TotalConsumption')){
		//keys.push("TotalConsumption");
		keys.push(getString('total_consumption'))
	}
	DATAKEYS = keys;
}

function resetYminmax(){
	CHART.axis.range({
		max: 0.95,
		min: 0.05
	});
}

function getXTickFormat(){
	var xTickformat = '%d %b %H:%M';
	if(REPORTTYPE == 'temperature'){
		xTickformat = '%d %b %H:%M';
	}else if(REPORTTYPE == 'energy' || REPORTTYPE == 'water' ){
		if(SELECTEDTIMEPERIOD == 'Month'){
			xTickformat = '%d %b';
		}
		else if(SELECTEDTIMEPERIOD == 'Year'){
			xTickformat = '%b %Y';
		}
	}else if(SELECTEDTIMEPERIOD == 'p3y'){
		xTickformat = '%Y';
	}else if(SELECTEDTIMEPERIOD == 'mtd'){
		xTickformat = '%b %Y';
	}
	return xTickformat;
}

function getChartOrder(){
	var chartOrder = 'desc';
	if(REPORTTYPE == 'bei_analysis'){
		chartOrder = 'asc';
	}
	return chartOrder;
}

function formatYAxisLabel(unit){ // Get the labels for Y-axes according to the units 
	var label = "";
	// todo: Add check for type especially for units with '%'
	switch(unit){
	case getTempUnit():
		label = getString("temp ") + " " + unit;
		break;
	case "°C":
		label = getString("temp ") + " " + unit;
		break;
	case "%":
		label = getString("humidity") + " " + unit; 
		break;
	case "ppm":
		label = getString("co2") + " " + unit; 
		break;
	case "kWh":
		label = getString("energy_cons") + " " + unit; 
		break;
	case "m3":
		label = getString("water_consumption") + " " + "m³";;
		//label = getString("Water_Consumption") + " " + "m&sup3";
		break;
	case "kWh/m2":
		label = getString("bei_rating") + " " + "kWh/m²/" + getString('year');
		break;
	case "total_energy":
		label = getString("total_consumption") + " " + "kWh"; 
		break;
	case "total_water":
		label = getString("total_consumption") + " " + "m³"; 
		break;
	default:
		label = unit;
	}
	return label;
}

/*******************************************************
 * Datepicker Functions
********************************************************/
function removeDatePicker(){
	$('.TimeControl #FromD #from').removeClass('hasDatepicker');
	$(".TimeControl #ToD #to").removeClass('hasDatepicker');
}
/*
function resetReportDatePicker(){	
	removeDatePicker();
	setTimeout(function () {
		initReportDatePicker();
		$('.TimeControl #FromD #from').datepicker("setDate", FROMD );
		$('.TimeControl #FromD #from').datepicker( "option", "dateFormat", DATEFORMAT );
	
		$('.TimeControl #ToD #to').datepicker("setDate", TOD );
		$('.TimeControl #ToD #to').datepicker( "option", "dateFormat", DATEFORMAT );
	}, 100);
}
*/
function initReportDatePicker(){
	$('.TimeControl #FromD #from').datepicker({
	    showAnim: 'clip',
	    changeMonth: true,
	    dateFormat: DATEFORMAT,
	    onSelect: function(selected, inst) {
	    	// Check if the time was changed
	    	if ((FROMD != null || FROMD != undefined) && ($(this).datepicker('getDate').getTime() != FROMD.getTime())){
	    		ISTIMECHANGED = true;
	    	}
	    	//FROMD = $(this).datepicker('getDate');
	    	// Kaiwei 18/12/2018 changed dateFrom and dateTo to cater for language change (eg. portugese 'dez' for 'dec')
	    	var day = inst.selectedDay;
	    	var month = inst.selectedMonth;
	    	var year = inst.selectedYear;
            FROMD = new Date(year, month, day);
            $(this).val($.datepicker.formatDate(DATEFORMAT, FROMD));
	    },
	    onClose: function( selectedDate ) {
	      //$( ".TimeControl #FromD #from" ).datepicker( "option", "maxDate", selectedDate );
	    }
	});
	
	$('.TimeControl #ToD #to').datepicker({
	    showAnim: 'clip',
	    changeMonth: true,
	    dateFormat: DATEFORMAT,
	    onSelect: function(selected, inst) {
	    	// Check if the time was changed
	    	if ((TOD != null || TOD != undefined) && ($(this).datepicker('getDate').getTime() != TOD.getTime())){
	    		ISTIMECHANGED = true;
	    	}
	    	//TOD = $(this).datepicker('getDate');
	    	// Kaiwei 18/12/2018 changed dateFrom and dateTo to cater for language change (eg. portugese 'dez' for 'dec')
	    	var day = inst.selectedDay;
	    	var month = inst.selectedMonth;
	    	var year = inst.selectedYear;
            TOD = new Date(year, month, day);
            $(this).val($.datepicker.formatDate(DATEFORMAT, TOD));
	    },
	    onClose: function( selectedDate ) {
	      //$( ".TimeControl #ToD #to" ).datepicker( "option", "minDate", selectedDate );
	    }
	   
	});
}

function initReportDatePickerDay(){
	ISTIMECHANGED = true;
	removeDatePicker();
	initReportDatePicker();
}

function initReportDatePickerMonth(){
	ISTIMECHANGED = true;
	removeDatePicker();
	
	$('.TimeControl #FromD #from').datepicker({
		changeMonth: true,
        changeYear: true,
        showButtonPanel : true,
        dateFormat: 'MM yy',
        //dateFormat: 'yy/mm',
        maxDate: "0",
        onClose: function(selected, inst) {
        	ISTIMECHANGED = true;
	    	var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
            ENERGYDATEFROM = new Date(year, month, 1)
            $(this).val($.datepicker.formatDate('MM yy', ENERGYDATEFROM));
           // $(this).val($.datepicker.formatDate('yy/mm', new Date(year, month, 1)));
        }
	});
	
	$(".TimeControl #FromD #from").focus(function () {
	    $(".ui-datepicker-calendar").hide();
	});
}

function initReportDatePickerYear(){
	ISTIMECHANGED = true;
	removeDatePicker();
	
	$('.TimeControl #FromD #from').datepicker({
		changeMonth: false,
        changeYear: true,
        showButtonPanel : true,
        dateFormat: 'yy',
        defaultDate: '+2m',
        maxDate: "0",
        onClose: function(selected, inst) {
        	ISTIMECHANGED = true;
            var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
            $(this).val($.datepicker.formatDate('yy', new Date(year, 1, 1)));
        }
	});
	
	$(".TimeControl #FromD #from").focus(function () {
	    $(".ui-datepicker-calendar").hide();
	    $(".ui-datepicker-month").css("display", "none");
	    $(".ui-datepicker-prev.ui-corner-all").css("display", "none");
	    $(".ui-datepicker-next.ui-corner-all").css("display", "none");
	});
}

/*******************************************************
 * Screen Resize Functions
********************************************************/
function checkScreenWidth(){
	if(WIDTH < 788){
		IS_PREV_PORTRAIT_MODE = false;
		changePortraitMode();
	}
}

function changePortraitMode(){
	$('.AITable #Reports_lCol').css('float','none');
	$('.AITable #Reports_rCol').css('margin-left','2px');
	$('.AITable #Reports_rCol').css('padding-left','2px');
	$('.AITable #Reports_rCol').css('padding-right','2px');
}

function changeLandScapeMode(){
	$('.AITable #Reports_lCol').css('float','left');
	$('.AITable #Reports_rCol').css('padding-left','5px');
	$('.AITable #Reports_rCol').css('padding-right','5px');
	$('.AITable #Reports_rCol').css('width','');
}

function resizeReportScreen(){
	$('#reports .reportTitle').css('font-size', '24px');
	$('#reports .reportTypebutton').width(240);
	$('#reports .reportTypebutton').height(80);
	$('#reports .reportTypebutton .name').css('font-size', '22px');
	$('.AITable #ChangeTimePeriodInput #from').width(240);
	$('.AITable #TimeControl #TimePeriod .SelectTimePeriod').css('padding-right', '20px');
	$('#operation_info #op_info_content').css('max-width', 'none');
	
	$('.AITable #QueryButton #Query').css('font-size', '18px');
	$('.AITable #Export #export').css('font-size', '18px');
	$('.AITable #TimeControl .labels').css('font-size', '16px');
	$('.AITable #TimeControl #from').height(26);
	$('.AITable #TimeControl #from').css('font-size', '22px');
	$('#Analog_Input_Report .AITable #TimeControl .input').css('margin-left', '45px');
	$('.AITable #TimeControl .input #fromHH .HH').css('font-size', '24px');
	$('.AITable #TimeControl .input #fromHH .HH').css('margin-top', '3px');
	$('.AITable #TimeControl #to').height(26);
	$('.AITable #TimeControl #to').css('font-size', '22px');
	$('.AITable #TimeControl .input #toHH .HH').css('font-size', '24px');
	$('.AITable #TimeControl .input #toHH .HH').css('margin-top', '3px');
	//$('.AITable #Reports_rCol #Management_Points').css('font-size', '22px');
	$('.AITable #Reports_rCol #Management_Points').height(350);
	$('.AITable #Management_Points .managementPointLabels').css('font-size', '22px');
	$('.AITable .graphFootNote').css('font-size', '16px');
	
	// For malfunction data
	$('#err_reporting .AITable #Reports_lCol').width('60%');
	$('#err_reporting .AITable #Reports_rCol').css('margin-left','61%');
	
	$('#pi_Setting #Pi_Categorized .categorized ').width(300);
	$('#pi_Setting #Pi_Categorized .categorized ').css('margin', '2px 10px 2px 10px')
	$('#pi_Setting #Pi_Energy').css('margin-left', '38%');
	
	$('#pi_Setting .title').css('font-size', '24px');
	$('#pi_Setting #Pi_Categorized .title').css('font-size', '20px');
	
	$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .item-title').css('font-size', '24px');
	$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_rating').css('font-size', '24px');
	$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_label').css('margin-top', '12px');
	$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_label_e').css('margin-bottom', '0px');
	
	if(REPORTTYPE == 'bei_display'){
		$('.contents-area').height(HEIGHT-MH-50);
		var top_margin = (HEIGHT-MH-50-$('#Dashboard_BEI').height())/2*0.8;
		if(top_margin < 5) top_margin = 5;
		$('#bei_rating_display #main_display_area #right').css('margin-top',top_margin+'px');

		var cw2 = $('#bei_rating_display #right #date').width();
		var cw = (cw2-10)/2;
		$('#bei_rating_display #right #card1').css('width',cw);
		$('#bei_rating_display #right #card2').css('width',cw);
		$('#bei_rating_display #right #card3').css('width',cw);
		$('#bei_rating_display #right #card4').css('width',cw);

/*		$('#bei_rating_display #header').height(HEIGHT*0.11);
		$('#bei_rating_display #Dashboard_BEI').height(HEIGHT*0.684);
		$('#bei_rating_display #right #date').height(HEIGHT*0.06);
		$('#bei_rating_display #right #Total_Energy_Consumption').height(HEIGHT*0.15);
		$('#bei_rating_display #right #card1').height(HEIGHT*0.215);
		$('#bei_rating_display #right #card2').height(HEIGHT*0.215);
		$('#bei_rating_display #right #card3').height(HEIGHT*0.215);
		$('#bei_rating_display #right #card4').height(HEIGHT*0.215);
		$('#bei_rating_display #main_display_area #BEI_leaf_icon img').width(WIDTH*HEIGHT*0.08*0.001);
		
		var beiHeight = $('#bei_rating_display #Dashboard_BEI').height();
		$('#bei_rating_display #Dashboard_BEI #bei').css('margin-top', beiHeight*0.06);
		$('#bei_rating_display #main_display_area #BEI_leaf_icon img').css('padding-top', beiHeight*0.0015); */
	}
	
	if(WIDTH<788){
		chartResize(0.9,0.5);
		$('.AITable #Reports_lCol').width(WIDTH*0.95);
		$('.AITable #Reports_rCol').width(WIDTH*0.95);
		changePortraitMode();
	}else if(WIDTH< 1000){
		chartResize(0.58,0.78);
		$('#reports .reportTitle').css('font-size', '22px');
		$('#reports .reportTypebutton').width(220);
		$('#reports .reportTypebutton').height(65);
		$('#reports .reportTypebutton .name').css('font-size', '20px');
		
		$('#Analog_Input_Report .AITable #Reports_lCol').width('63.5%');
		$('#Analog_Input_Report .AITable #Reports_rCol').css('margin-left','64%');
		$('.AITable #QueryButton #Query').css('font-size', '15px');
		$('.AITable #Export #export').css('font-size', '15px');
		$('.AITable #TimeControl .labels').css('font-size', '14px');
		$('.AITable #TimeControl #from').height(22);
		$('.AITable #TimeControl #from').css('font-size', '20px');
		$('#Analog_Input_Report .AITable #TimeControl .input').css('margin-left', '30px');
		$('.AITable #TimeControl .input #fromHH .HH').css('font-size', '20px');
		$('.AITable #TimeControl .input #fromHH .HH').css('margin-top', '5px');
		
		$('.AITable #TimeControl #ToD').css('margin-top','7px');
		$('.AITable #TimeControl #ToD').css('margin-bottom','7px');
		$('.AITable #TimeControl #Intervals').css('margin-top','5px');
		
		$('.AITable #TimeControl #to').height(22);
		$('.AITable #TimeControl #to').css('font-size', '20px');
		$('.AITable #TimeControl .input #toHH .HH').css('font-size', '20px');
		$('.AITable #TimeControl .input #toHH .HH').css('margin-top', '5px');
		
		$('.AITable #Reports_rCol #Management_Points').css('font-size', '17px');
		$('.AITable #Reports_rCol #Management_Points').height(200);
		$('.AITable #Management_Points .managementPointLabels').css('font-size', '17px');
		$('.AITable .graphFootNote').css('font-size', '11px');
		
		// For energy and Water management
		$('#Energy_Management_Report .AITable #Reports_lCol').width('69%');
		$('#Energy_Management_Report .AITable #Reports_rCol').css('margin-left','70%');
		$('#Water_Management_Report .AITable #Reports_lCol').width('69%');
		$('#Water_Management_Report .AITable #Reports_rCol').css('margin-left','70%');
		$('.AITable #TimeControl #TimePeriod').css('font-size', '20px');
		$('.AITable #TimeControl #TimePeriod .SelectTimePeriod').css('padding-right', '2px');
		$('.AITable #SelectEnergyCategories #EnergyReportCategories .subtitle').css('font-size', '18px');
		$('.AITable #ChangeTimePeriodInput #from').width(200);
		
		// For BEI Analysis
		$('#BEI_Analysis_Report .AITable #Reports_lCol').width('63.5%');
		$('#BEI_Analysis_Report .AITable #Reports_rCol').css('margin-left','64%');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .item-title').css('font-size', '18px');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_rating').css('font-size', '22px');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_label').css('margin-top', '8px');
		$('#BEI_Analysis_Report .AITable #Reports_rCol #BEI .bei_label_e').css('margin-bottom', '2px');
		
		// For operation info
		$('#operation_info .AITable #Reports_lCol').width('69%');
		$('#operation_info .AITable #Reports_rCol').css('margin-left','70%');
		$('#operation_info #op_info_content').css('max-width', '550px');
		
		// For Category settings
		$('#pi_Setting #Pi_Categorized .categorized ').width(180);
		$('#pi_Setting #Pi_Categorized .categorized ').height(130);
		$('#pi_Setting #Pi_Categorized .categorized ').css('margin', '2px 0px 2px 10px');
		$('#pi_Setting #Pi_Energy').css('margin-left', '0px');
		$('#pi_Setting .title').css('font-size', '20px');
		$('#pi_Setting #Pi_Categorized .title').css('font-size', '17px');
		
		changeLandScapeMode();
	}else{
		chartResize(0.68,0.8);
		$('.AITable #Reports_lCol').width('70%');
		$('.AITable #Reports_rCol').css('margin-left','71%');
		changeLandScapeMode();
	}
}

function chartResize(widthPercentage, heightPercentage){
	if(CHART != null || !isEmpty(CHART)){
		setTimeout(function (){
			CHART.resize({height:HEIGHT*heightPercentage, width:WIDTH *widthPercentage});
		}, 1100);
		
		setTimeout(function (){
			if(WIDTH < 788 && DATAKEYS.length>8){
				CHART.legend.hide();
			} else{
				CHART.legend.show();
			}
		}, 1200);
	}
}

/*******************************************************
 * Other Util Functions
********************************************************/
function swapArrayPosition(arr, indexA, indexB){
	  var temp = arr[indexA];
	  arr[indexA] = arr[indexB];
	  arr[indexB] = temp;
	  
	  return arr;
}

function mergeSort (arr) {
	  if (arr.length === 1) {
	    // return once we hit an array with a single item
	    return arr
	  }
	  const middle = Math.floor(arr.length / 2) // get the middle item of the array rounded down
	  const left = arr.slice(0, middle) // items on the left side
	  const right = arr.slice(middle) // items on the right side
	  return merge(
	    mergeSort(left),
	    mergeSort(right)
	  );
}

//compare the arrays item by item and return the concatenated result
function merge (left, right) {
  let result = []
  let indexLeft = 0
  let indexRight = 0

  while (indexLeft < left.length && indexRight < right.length) {
		if(indexLeft < left.length) {
			datetime1 = new Date(left[indexLeft]['x']);
		}else{
			datetime1 = new Date(left[indexLeft-1]['x']);
		}
		
		if(indexRight < right.length) {
			datetime2 = new Date(right[indexRight]['x']);
		}else{
			datetime2 = new Date(right[indexRight-1]['x']);
		}
		
		if (datetime1 < datetime2) {
			result.push(left[indexLeft])
			indexLeft++
		}else {
			result.push(right[indexRight])
			indexRight++
		}
  }
  return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight))
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
    return true;
}

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}

function convertMonthMon(mth){
	var month = new Array();
	month[0] = getString("month1");
	month[1] = getString("month2");
	month[2] = getString("month3");
	month[3] = getString("month4");
	month[4] = getString("month5");
	month[5] = getString("month6");
	month[6] = getString("month7");
	month[7] = getString("month8");
	month[8] = getString("month9");
	month[9] = getString("month10");
	month[10] = getString("month11");
	month[11] = getString("month12");
	
	return month[mth];
}

function convertDay(d){
	var day = new Array();
	day[1] = getString("mon");
	day[2] = getString("tue");
	day[3] = getString("wed");
	day[4] = getString("thu");
	day[5] = getString("fri");
	day[6] = getString("sat");
	day[7] = getString("sun");
	
	return day[d];
}

var isArrayOrObjectEqual = function (value, other) {
	// Get the value type
	var type = Object.prototype.toString.call(value);
	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;
	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;
	// Compare the length of the length of the two items
	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	// Compare two items
	var compare = function (item1, item2) {
		// Get the object type
		var itemType = Object.prototype.toString.call(item1);
		// If an object or array, compare recursively
		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}
		// Otherwise, do a simple comparison
		else {
			// If the two items are not the same type, return false
			if (itemType !== Object.prototype.toString.call(item2)) return false;
			// Else if it's a function, convert to a string and compare
			// Otherwise, just compare
			if (itemType === '[object Function]') {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}
		}
	};

	// Compare properties
	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) return false;
			}
		}
	}
	// If nothing failed, return true
	return true;
};
