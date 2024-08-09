function showMainPage() {
	// retrieve tenant list
	com = ['get_tenant_list'];
	COMM_PORT.send(com); 
}

function showLoginPage() {
	loadScreen('index.html');
}

function updateAllStatus() {
	for(var i in POINT_ID_LIST) {
	}
}

function updateStatus(id,cos) {
	
}

function resize() {
	
}

function getPointListDOM(tenantName) {
	var dom = "";
	var points = [];	// registered points
	if(tenantName != null)
		points = TENANT_LIST[tenantName][0];

	for(var p in POINT_LIST) {

		if(POINT_LIST[p].info.attr.ppd && points.indexOf(p) == -1) dom += ("<li id='"+p+"'>"+POINT_LIST[p].info.name+"</li>");
	}
	return dom;
}

function readPointData(data) {
	var point_data = {};	// {id:{time:{'ppd':data, 'op_time':data, 'on_times':data,'pv':data,'av':data},...},...}
	// read ppd data	
	readPointDataPpd(point_data,data);
	// read op time data
	readPointDataOpTime(point_data,data);
	// read on times data
	readPointDataOnTimes(point_data,data);
	// read pi data
	readPointDataPv(point_data,data);
	// read ai data
	return point_data;
}

function readPointDataPpd(point_data, data) {
	var ppd = data['ppd'];	
	for(var id in ppd) {
		var aData = ppd[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['ppd'] = [aData[i][1]/1000,aData[i][2]/1000];
		}
	}
}

function addPointData(point_data, data) {
	// read ppd data
	readPointDataPpd(point_data,data);
	// read op time data
	readPointDataOpTime(point_data,data);
	// read on times data
	readPointDataOnTimes(point_data,data);
	// read pi data
	readPointDataPv(point_data,data);
}

function readPointDataOpTime(point_data, data) {
	var opTime = data['op_time'];	
	for(var id in opTime) {
		var aData = opTime[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['op_time'] = [aData[i][1],aData[i][2],aData[i][3],aData[i][4],aData[i][5]];
		}
	}
}

function readPointDataOnTimes(point_data, data) {
	var onTimes = data['on_times'];	
	for(var id in onTimes) {
		var aData = onTimes[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['on_times'] = aData[i][1];
		}
	}
}

function readPointDataPv(point_data, data) {
	var pv = data['pv'];
	for(var id in pv) {
		var aData = pv[id];
		for(var i = 0; i < aData.length; i++) {
			var time = aData[i][0]*1000;
			if(point_data[id] == null) point_data[id] = {};
			if(point_data[id][time] == null) point_data[id][time] = {};
			point_data[id][time]['pv'] = aData[i][1];
		}
	}
}

// Expand BILL_DATA result and total array for holiday data
// array length is changed 5 to 6
function calcSumOfEachZone(name) {
	var rate_info = BILL_INFO['rate'];
	var total = [0,0,0,0,0,0];	// sum of power consumption of all point's each time zone, last one is for holiday
	// if rate_info is not updated, add entry
	var diff = total.length-rate_info.length;
	for(var i = 0; i < diff; i++) {
		rate_info.push(['disable','00:00','24:00',0,getString('holiday')]);
	}
	// make time zone map for unit price
	// holiday has 1 price zone
	var zone_map = [[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0],[-1,0]];	// for 24 hour

	for(var p = rate_info.length-2; p >= 0; p--) {	// if rate_info lenght is changed, then ofset should be changed also
		if(rate_info[p][0] == 'enable') {
			var from = parseInt(rate_info[p][1]);
			var to = parseInt(rate_info[p][2]);
			var rate = parseFloat(rate_info[p][3]);
			for(var t = from; t < to; t++) {
				zone_map[t][0] = p;	// zone priority 0 origin
				zone_map[t][1] = rate;
			}
		}
	}

	// make holiday map in calendar
	// DAY_OF_WEEK[7]: 0->Sun, 6->Sat, 0 weekday, 1 holiday
	// Date.getDay() method return day of week
	// BILL_INFO['specialday']: date array of special day, invert weekday<=>holiday
	//   store time_t*1000 data

	// check date if it is holiday
	// Calendar period: 
	//   FROMD -> date object of the first day
	//   TOD   -> date object of the last day
	// 1) Check day of week of the date
	// 2) Check if the date is included in BILL_INFO['specialday']
	// 3) Add up zone map or holiday

	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var data = BILL_DATA[name].data;
	BILL_DATA[name]['total'] = total;
	var id_list = Object.keys(data);
	var points = id_list.length;
	// sum of power consumption of each point's each time zone
	var result_table = {};	// {id:[zone1,zone2,...],}
	for(var i = 0; i < points; i++) {
		var id = id_list[i];
		// initialize data table to store each time zone data
		result_table[id] = [0,0,0,0,0,0]; // last one is for holiday

		for(var time in data[id]) {
			var h = new Date(parseInt(time));
			// check date if it is holiday
			if(isHoliday(h)) {	// holiday
				if(data[id][time]['ppd'] != null) {
					result_table[id][5] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
					total[5] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
				}
			} else {	// weekday
				h = h.getHours();
				var zone = zone_map[h][0];
				if(data[id][time]['ppd'] != null) {
					result_table[id][zone] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
					total[zone] += (data[id][time]['ppd'][0]+data[id][time]['ppd'][1]);
				}
			}
		}
		BILL_DATA[name]['result'] = result_table;
		BILL_DATA[name]['total'] = total;
	}
}

function isHoliday(date) {
	// if holiday is disable, always return false
	var rate_info = BILL_INFO['rate'];
	if(rate_info[5][0] == 'disable') return false;

	var dow = date.getDay();
	var t = new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime();
	var spec = BILL_INFO['specialday'].indexOf(t);

	if(dow > 0 && dow < 6) {	// weekday
		if(spec == -1) return false;	// not specified the day
		else return true;	// specified as holiday
	} else {	// weekend
		if(spec == -1) return true;	// not specified the day
		else return false;	// specified as weekday
	}
}

function calcPrice(name) {
	// make total price from each time zone's power consumption and unit price
	var total = BILL_DATA[name].total;
	var rate_info = BILL_INFO.rate;
	var prices = [];
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') {
			// round up on 0.00*
			prices.push(Math.ceil(total[p]*rate_info[p][3]*100)/100); // round up
		} else {
			prices.push(0);
		}
	}
	BILL_DATA[name]['price'] = prices;
	return prices;
}

function makeBillDialog() {
	$('#bill').scrollTop(0);
	
	var today = new Date();
	var rate_info = BILL_INFO['rate'];
	var currency = BILL_INFO['currency'];
	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var tenants = Object.keys(BILL_DATA).length;
	var f_page = $('#bill #p1').clone();
	var d_page = $('#bill #p2').clone();
	$('#bill .page').remove();
	var page = 1;
	
	for(var name in BILL_DATA) {
		var data = BILL_DATA[name].data;
		$('#bill').append($(f_page).clone().attr('id','p'+page));
		$('#bill').append($(d_page).clone().attr('id','p'+(page+1)));
		$('#bill .page#p'+page).css('top', 65+(1052+35)*(page-1));
		$('#bill .page#p'+(page+1)).css('top', 65+(1052+35)*page);
		// count the number of pages
		// second or later page: 30 lines included

		var id_list = Object.keys(data);
		var points = id_list.length;
		var one_p = 30;

		// calc sum of each time zone's power consumption
		calcSumOfEachZone(name);	// results are stored in BILL_DATA[TENANT_NAME].result and total

		calcPrice(name);
		var prices = BILL_DATA[name].price;
		var total = BILL_DATA[name].total;

		$('#bill #p'+page+' .data-table .c1').text(getString('tzone'));
		$('#bill #p'+page+' .data-table .c2').text(getString('pconsum')+'[kWh]');
		$('#bill #p'+page+' .data-table .c3').text(getString('price')+'['+currency+']');
		$('#bill #p'+page+' .data-table .c4').text(getString('uprice')+'['+currency+'/kWh]');

		var sum = 0;	// total price
		var ptotal = 0;	// total power consumtion
		for(var p = 0; p < rate_info.length; p++) {
			if(rate_info[p][0] == 'enable') {
				sum += prices[p];
				ptotal += total[p];
				// bug fix 20160922 page is missing so all page data was overwritten
				$('#bill #p'+page+' .data-table #r'+(p+1)+' .power').text(formNum(total[p],3));
				$('#bill #p'+page+' .data-table #r'+(p+1)+' .price').text(formNum(prices[p],2));
			} 
		}
		BILL_DATA[name]['total_power'] = ptotal;
		BILL_DATA[name]['total_price'] = sum;

		$('#bill #p'+page+' .total .currency').text(currency);
		$('#bill #p'+page+' .total .result').text(formNum(sum,2));
		$('#bill #p'+page+' #total .power').text(formNum(ptotal,3));
		$('#bill #p'+page+' #total .price').text(formNum(sum,2));

		$('#bill #p'+page+' .tenant-name').text(name);
		$('#bill #p'+(page+1)+' .tenant-name').text(name);

		var pages =parseInt(points/one_p);
		var lines = one_p;
		var line_s = lines;
		var result_table = BILL_DATA[name].result;
		var total = BILL_DATA[name].total;
		if(pages < 1) lines = points;	// only one page
		for(var i = 0; i < lines; i++) {
			var id = id_list[i];
			var line = "<tr><td class='pname'>"+POINT_LIST[id].info.name+"</td><td class='zname z1'>"+formNum(result_table[id][0],3)+"</td><td class='zname z2'>"+formNum(result_table[id][1],3)+"</td><td class='zname z3'>"+formNum(result_table[id][2],3)+"</td><td class='zname z4'>"+formNum(result_table[id][3],3)+"</td><td class='zname z5'>"+formNum(result_table[id][4],3)+"</td><td class='zname z6'>"+formNum(result_table[id][5],3)+"</td></tr>";
			$('#bill #p'+(page+1)+' .data-table').append(line);
		}
	 	if(pages < 1) {
			var tline = "<tr><td class='pname'>"+getString('total')+"</td><td class='zname z1'>"+formNum(total[0],3)+"</td><td class='zname z2'>"+formNum(total[1],3)+"</td><td class='zname z3'>"+formNum(total[2],3)+"</td><td class='zname z4'>"+formNum(total[3],3)+"</td><td class='zname z5'>"+formNum(total[4],3)+"</td><td class='zname z6'>"+formNum(total[5],3)+"</td></tr>";
			$('#bill #p'+(page+1)+' .data-table').append(tline);
		} else { // more than 1 page
			// hide owner info in P.2
			$('#bill #p'+(page+1)+' .owner').hide();
			$('#bill #p'+(page+1)+' .print-date').hide();

			for(var p = 0; p < pages; p++) {
				var new_page = "<div class='page' id='p"+(page+p+2)+"'><table class='data-table'><tr><th class='pname'>"+getString('pname')+"</th><th class='zone-name z1'>zone1</th><th class='zone-name z2'>zone2</th><th class='zone-name z3'>zone3</th><th class='zone-name z4'>zone4</th><th class='zone-name z5'>zone5</th><th class='zone-name z6'>zone6</th></tr></table>";
				$('#bill').append(new_page);
				$('#bill .page#p'+(page+p+2)).css('top', 65+(1052+35)*(page+p+1));
				
				if(p+1 == pages) lines = points-one_p*(p+1);	// last page

				for(var i = 0; i < lines; i++) {
					var id = id_list[i+line_s];
					var line = "<tr><td class='pname'>"+POINT_LIST[id].info.name+"</td><td class='zname z1'>"+formNum(result_table[id][0],3)+"</td><td class='zname z2'>"+formNum(result_table[id][1],3)+"</td><td class='zname z3'>"+formNum(result_table[id][2],3)+"</td><td class='zname z4'>"+formNum(result_table[id][3],3)+"</td><td class='zname z5'>"+formNum(result_table[id][4],3)+"</td><td class='zname z6'>"+formNum(result_table[id][5],3)+"</td></tr>";
					$('#bill #p'+(page+p+2)+' .data-table').append(line);
				}
				line_s += lines;
			 	if(p+1 == pages) {	// last page
					var tline = "<tr><td class='pname'>"+getString('total')+"</td><td class='zname z1'>"+formNum(total[0],3)+"</td><td class='zname z2'>"+formNum(total[1],3)+"</td><td class='zname z3'>"+formNum(total[2],3)+"</td><td class='zname z4'>"+formNum(total[3],3)+"</td><td class='zname z5'>"+formNum(total[4],3)+"</td><td class='zname z6'>"+formNum(total[5],3)+"</td></tr>";
					$('#bill #p'+(page+p+2)+' .data-table').append(tline);
				var owner = "<div class='owner'><div class='name'>Owner Name</div><div class='address'>Address of owner</div><div class='contact'>Contact</div></div><div class='print-date'>7 May 2015</div></div>";
				$('#bill #p'+(page+p+2)).append(owner);
				}
			}
		}

		$('#bill .owner .name').text(BILL_INFO.owner);
		$('#bill .owner .address').html(addressInBill(BILL_INFO.address));
		$('#bill .owner .contact').html(contactInBill(BILL_INFO.contact));

		$('#bill .print-date').text(today.toLocaleDateString(LOCALE,DATEOPT));
		$('#bill .data-period .from').text(BILL_DATA[name].from);
		$('#bill .data-period .to').text(BILL_DATA[name].to);

		// bill info
		for(var p = 0; p < rate_info.length; p++) {
			if(rate_info[p][0] == 'enable') {
				$('#bill .data-table .zone-name.z'+(p+1)).text(rate_info[p][4]);
				$('#bill .data-table #r'+(p+1)+' .unit-price').text(formNum2(rate_info[p][3]));

			} else {
				$('#bill .data-table #r'+(p+1)).hide();
				$('#bill .data-table .zone-name.z'+(p+1)).hide();
				$('#bill .data-table .zname.z'+(p+1)).hide();
			}
		}
		page += (pages+2);
	}
}

function makeSaveData(name) {
	var saveData = '';
	var rt = '\r\n';

	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var data = BILL_DATA[name].data;
	// count the number of pages
	// fist page: 20　lines included
	// second or later page: 30 lines included
	var id_list = Object.keys(data);
	var points = id_list.length;
	var line;

	// tenant name
	saveData = name+rt;
	// summary
	saveData += (getString('period')+FS+BILL_DATA[name].from+FS+getString('to')+FS+BILL_DATA[name].to+rt);
	saveData += (getString('total')+FS+BILL_INFO.currency+FS+formNum3(BILL_DATA[name].total_price,2)+rt);

	saveData += (getString('tzone')+FS+getString('pconsum')+'[kWh],'+getString('price')+'['+BILL_INFO.currency+'],'+getString('uprice')+'['+BILL_INFO.currency+'/kWh]'+rt);

	var rate_info = BILL_INFO.rate;
	var prices = BILL_DATA[name].price;
	var total = BILL_DATA[name].total;
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') {
			saveData += (rate_info[p][4]+FS+formNum3(total[p],3)+FS+formNum3(prices[p],2)+FS+formNum2(rate_info[p][3])+rt);
		}
	}
	// output total line
	saveData += (getString('total')+FS+formNum3(BILL_DATA[name].total_power,3)+FS+formNum3(BILL_DATA[name].total_price,2)+rt+rt);

	saveData += (getString('result_table_title')+'[kWh]'+rt+rt);

	// set point name to table
	var result_table = BILL_DATA[name].result;
	saveData += getString('pname');
	for(var p = 0; p < rate_info.length; p++) {
		if(rate_info[p][0] == 'enable') saveData += (FS+rate_info[p][4]);
	}
	saveData += rt;

	for(var i = 0; i < id_list.length; i++) {
		var id = id_list[i];

		// make 1 line data
		line = POINT_LIST[id].info.name;
		var pdata = result_table[id];
		for(var z = 0; z < rate_info.length; z++) {
			if(rate_info[z][0] == 'enable') line += (FS+formNum3(pdata[z],3));
		}
		line += rt;
		saveData += line;
	}
	// total
	line = getString('total');
	for(var z = 0; z < rate_info.length; z++) {
		if(rate_info[z][0] == 'enable') line += (FS+formNum3(total[z],3));
	}
	line += rt;
	saveData += line;
	saveData += rt;
	// raw data out put
	saveData += (getString('ppd_raw_data')+rt);

	var row = makeRowData(data);
	var time_list = Object.keys(row);
	var common = FS+FS+FS;
	saveData += FS+FS+FS;
	for(var i = 0; i < id_list.length; i++) {
		saveData += (FS+POINT_LIST[id_list[i]].info.name+FS);
		common += (FS+'power'+FS+'stop');
	}
	saveData += rt;
	saveData += (common+rt);
	for(var t = 1; t < time_list.length; t++) {
		var date = new Date(parseInt(time_list[t]));
		saveData += (date.getFullYear()+FS+(date.getMonth()+1)+FS+date.getDate()+FS+date.getHours());
		for(var i = 0; i < id_list.length; i++) {
			var ppd = row[time_list[t]][id_list[i]];
			if(ppd == null) {
				saveData += (FS+FS);
			} else {
				saveData += (FS+formNum3(ppd[0],3)+FS+formNum3(ppd[1],3));
			}
		}
		saveData += rt;
	}

	// output operation data (operation time and number of switch)
	saveData += (rt+getString('operation_raw_data')+rt);
	// output header
	saveData += (FS+FS+FS);
	var second_header = FS+FS+FS;
	for(var i = 0; i < id_list.length; i++) {
		var id = id_list[i];
		saveData += (FS+POINT_LIST[id].info.name+FS);
		second_header += (FS+getString('optime_m')+FS+getString('ontimes'))
	}
	saveData += (rt+second_header+rt);

	// make every hour data
	var op_data = makeHourlyData(name);
	time_list = Object.keys(op_data);
	for(var t = 0; t < time_list.length; t++) {
		var date = new Date(parseInt(time_list[t]));
		saveData += (date.getFullYear()+FS+(date.getMonth()+1)+FS+date.getDate()+FS+date.getHours());
		for(var i = 0; i < id_list.length; i++) {
			var op = op_data[time_list[t]][id_list[i]];
			if(op == null) {
				saveData += (FS+FS);
			} else {
				saveData += (FS+Math.round(op[0]/60)+FS+op[1]);
			}
		}
		saveData += rt;

	}
	return saveData;
}

function makeRowData(data) {
	// data: [id][time]['ppd'][ppd,stop]
	// result: [time][id][ppd,stop]
	var id_list;
	var time_list;
	var result = {};
	result['title'] = {};
	id_list = Object.keys(data);
	for(var i = 0; i < id_list.length; i++) {
		time_list = Object.keys(data[id_list[i]]);
		for(var t = 0; t < time_list.length; t++) {
			var current = data[id_list[i]][time_list[t]]['ppd'];
			if(current != null) {
				if(result['title'][id_list[i]] == null) {
					result['title'][id_list[i]] = POINT_LIST[id_list[i]].info.name;
				}
				if(result[time_list[t]] == null) {
					result[time_list[t]] = {};
				}
				result[time_list[t]][id_list[i]] = current;
			}
		}
	}
	return result;
}

function makeHourlyData(name) {
	// data format
	// BILL_DATA[TENANT_NAME]['data'][id][time]['ppd'] => [ppd, stop]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['op_time'] => [op_time,cool,heat,fan,thermo]
	// BILL_DATA[TENANT_NAME]['data'][id][time]['on_times'] => on_times
	// BILL_DATA[TENANT_NAME]['data'][id][time]['pv'] => pulse_value
	var data = BILL_DATA[name].data;
	var result = {};	// {time:{id:[optime,ontimes],...},...}
	for(var id in data) {
		var time_list = Object.keys(data[id]);
		for(var i = 0; i < time_list.length; i++) {
			var time = new Date(parseInt(time_list[i]));
			var std_time = new Date(time.getFullYear(),time.getMonth(),time.getDate(),time.getHours());
			var key = std_time.getTime();
			if(result[key] == null) result[key] = {};
			if(result[key][id] == null) result[key][id] = [0,0];
			if(data[id][time_list[i]]['op_time'] != null) result[key][id][0] += data[id][time_list[i]]['op_time'][0];
			if(data[id][time_list[i]]['on_times'] != null) result[key][id][1] += data[id][time_list[i]]['on_times'];
		}
	}
	return result;
}

function addressInBill(address_info) {
	var address = '';
	for(var i in address_info) {
		if(address.length > 0) address += '<br>';
		address += address_info[i];
	}
	return address;
}

function contactInBill(contact_info) {
	var contact = '';
	for(var i in contact_info) {
		if(contact.length > 0) contact += '<br>';
		contact += contact_info[i];
	}
	return contact;
}

function updateControllerScreen(ret) {
	if(ret == 'OK') {
		// DEV_LIST[*][0]	controller type
		// DEV_LIST[*][1]	device id
		// DEV_LIST[*][2]	attribute
		$('#controller-content .list').html('');
		for(var i = 0; i < DEV_LIST.length; i++) {
			var ip_addr = DEV_LIST[i][2]['ip_addr'];
			$('#controller-content .list').append('<li id='+ip_addr.replace(/\./g,'-')+'>'+ip_addr+'</li>');
		}		
	}
}

function findController(ip_addr) {
	for(var i = 0; i < DEV_LIST.length; i++) {
		var ip = DEV_LIST[i][2]['ip_addr'];
		if(ip_addr == ip) return DEV_LIST[i][2];		
	}
	return null;
}
function selectedController() {
	var ip = $('#controller-content .list .selected').text();
	return findController(ip);
}

function checkSameIp(ip_addr) {
	for(var i = 0; i < DEV_LIST.length; i++) {
		var ip = DEV_LIST[i][2]['ip_addr'];
		if(ip_addr == ip) return true;		
	}
	return false;
}

function addNewController(type,attr) {
	var ctrl = [type,'',attr];
	DEV_LIST.push(ctrl);
	updateControllerScreen('OK');
}

function deleteSelectedController() {
	var ip_addr = $('#controller-content .list .selected').text();
	if(ip_addr.length == 0) {	// not selected
		return false;
	}
	for(var i = 0; i < DEV_LIST.length; i++) {
		var ip = DEV_LIST[i][2]['ip_addr'];
		if(ip_addr == ip) {
			DEV_LIST.splice(i,1);
			return true;
		}		
	}
	return false;
}

function drawTimeZonePrice() {
	var canvas = $('canvas')[0];
	var context = canvas.getContext('2d');
	context.clearRect(0,0,150,315);

	var zone = getTimeZoneArray();
	for(var i = 0; i < zone.length; i++) {
		drawZone(context,zone[i][0],zone[i][1],zone[i][2]);
	}
//	drawZone(context,0,24,'royalblue');
//	drawZone(context,7,19,'yellow');
//	drawZone(context,10,17,'red');
	if(zone.length > 0) {
		context.fillStyle = 'black';
		context.beginPath();
		context.lineWidth = 1;
		context.moveTo(10,10);
		context.lineTo(10,305);
		context.stroke();
	}
}

function getTimeZoneArray() {
	var zone = [];
	for(var pri = 5; pri > 0; pri--) {
		if($('#system-setup #currency-content .t'+pri).hasClass('enable')	== true) {
			var from = parseInt($('#system-setup #currency-content .t'+pri+' .tzf input').val());
			var to = parseInt($('#system-setup #currency-content .t'+pri+' .tzt input').val());
			var col = $('#system-setup #currency-content .t'+pri+' .price input').css('background-color');
			zone.push([from,to,col]);
		}
	}
	return zone;
}

function drawZone(context,from,to,col) {
	context.fillStyle = 'black';
	var up = 295*from/24+10;
	var down = 295*to/24+10;
	context.fillStyle = col;
	context.fillRect(10,up,50,down-up);

	context.fillStyle = 'black';
	context.beginPath();
	context.moveTo(10,up);
	context.lineTo(80,up);
	context.stroke();
	context.fillText(from+':00',85,up+2)
	context.beginPath();
	context.moveTo(10,down);
	context.lineTo(80,down);
	context.stroke();
	context.fillText(to+':00',85,down+2)
}

function updateUserPage() {
	// user setup
	$('#system-setup #user-content .list').html("");
	for(var i = 0; i < USERLIST.length; i++) {
		$('#system-setup #user-content .list').append('<li>'+USERLIST[i][0]+'</li>');
	}
}

function setLog(data) {
	$('#charge-log .scrol-frame tbody').html('');
	for(var i = 0; i < data.length; i++) {
		var date = new Date(data[i][1]*1000);
		var line = '<tr><td>'+date.toLocaleDateString(LOCALE,DATEOPT)+' '+date.toLocaleTimeString(LOCALE)+'</td>';
		line += ('<td>'+data[i][5]+'</td>');
		line += ('<td>'+data[i][6][1]+'</td>');
		line += ('<td>'+data[i][6][2]+'</td>');
		line += ('<td>'+data[i][4]+'</td></tr>');
		$('#charge-log .scrol-frame tbody').append(line);
	}
}

// change format of decimal point and add separater
// specify how many digit will show under dicemal point
function formNum(val,bdp) {
	var form = val.toFixed(bdp);
	var below = '';
	var above = form;
	if(bdp > 0) {
		var dp = form.indexOf('.');
		form = form.replace('.',DP);
		below = form.slice(dp);
		above = form.substring(0,dp);
	}
	var len = above.length;
	var result = below;
	while(above.length > 0) {
		result = above.substr(-3,3)+result;
		above = above.slice(0,-3);
		if(above.length > 0) result = SEP+result;
	}
	return result;
}

function formNum2(val) {
	return String(val).replace('.',DP);
}

function formNum3(val,bdp) {
	var form = val.toFixed(bdp);
	return form.replace('.',DP);
}

// call when command is received from server
function command_dispatch(command,result,data) {
	option = data;
	data = data[0];
	switch(command) {
		case 'login':
			if(result == 'OK') {
				OP_LIMIT = option[1];
				// send command to get data to initialize this app
				// get icon list
				COMM_PORT.send(['get_icon_list']);
			} else {
				alert(getString('login_failed'));
				COMM_PORT.closeConnection();
			}
			break;
		case 'logout':
			return false;
			break;
		case 'get_icon_list':
				if(result == 'OK') {
					ICONLIST = data;
				} else {
					ICONLIST = [];
				}
					// get point list
				COMM_PORT.send(['get_bill_info']);
				break;
			case 'get_bill_info':
				if(result == 'OK') {
					BILL_INFO = data;
					if(BILL_INFO['rate'].length < 6) {
						BILL_INFO['rate'].push(['disable','00:00','24:00',0,getString('holiday')]);
						BILL_INFO['specialday'] = [];
					}
					SPEC_CAL = BILL_INFO['specialday'].slice();	// copy
				} else {
					BILL_INFO['rate'] = [['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,''],['disable','00:00','24:00',0,getString('holiday')]];
					BILL_INFO['specialday'] = [];
				}
					// get clock adjustment method
				COMM_PORT.send(['get_clock_adjust']);
				break;
			case 'get_clock_adjust':
				if(result == 'OK') {
					CLOCK = data[0];
					if(data[1] == true || data[1] == 'true') ADJUST_ITM = true;
					else ADJUST_ITM = false;
				}
				// get point list
				COMM_PORT.send(['get_point_list']);
				break;
			case 'get_point_list':  	// call for initialize
				if(result == 'OK') {
					POINT_LIST = {};	// initialize point list
					POINT_ID_LIST = [];
					point_list = data;
					for(var i in point_list) {
						point = point_list[i];
						POINT_ID_LIST.push(point.id);
						POINT_LIST[point.id] = {'info':point,'stat':null};
					}
					// get point status 
					COMM_PORT.send(['get_point_status',POINT_ID_LIST]); 
				} else {

				}
				break;
			case 'set_point_info':
				if(result == 'OK') {
				} else {					
					alert(getString('pnt_save_fail'));
				}
				break;
			case 'set_point_order':
				if(result == 'OK') {
					COMM_PORT.closeConnection();
				} else {
					alert(getString('set_point_order_fail'));
				}
				break;
			case 'get_point_status':  	// call for initialize
				if(result == 'OK') {
					point_status = data;
					for(var i in point_status) {
						point = point_status[i];
						var str = point[0];
						for(var key in point[1]) {
							str += (key+":"+point[1][key]+" ");
						}
						if(POINT_LIST[point[0]] != null) {
							POINT_LIST[point[0]].stat = point[1];
						}
					}
					// initialization is completed
					showMainPage();
					COMM_PORT.ready();
				} else {

				}
				break;
			case 'operate':
				if(result == 'NG') {
					alert(getString('op_failed'));
				}
				break;
			case 'cos':
				if(COMM_PORT.isReady() == true) {
					id = data[0];
					cos = data[1];
					if(POINT_LIST[id] != null) {
						console.log(id);
						for(var key in cos) {
							console.log(key+":"+cos[key]);
							POINT_LIST[id].stat[key] = cos[key];
						}
						cellStatus(POINT_LIST[id]);
						updateOpUnits(id,cos);
					}
				}
				break;
			case 'get_user_list':
				if(result == 'OK') {
					USERLIST = data;
				} else {
					USERLIST = [];
				}
				updateUserPage();
				break;
			case 'add_user':
				if(result == 'OK') {
					COMM_PORT.send(['get_user_list']);
				} else {
					alert(getString('add_usr_fail'));
				}
				break;
			case 'update_user_info':
				if(result == 'OK') {
					COMM_PORT.send(['get_user_list']);
				} else {
					alert(getString('update_usr_fail'));
				}
				break;
			case 'set_passwd':
				if(result == 'OK') {
					// it should modify password save button function of SVM-R1/2
					//$.mobile.pageContainer.pagecontainer('change', 'menu.html', {transition: "slide", reverse: "true"});					
				} else { 
					alert(getString('set_pass_fail'));
				}
				break;
			case 'delete_user':
				if(result == 'OK') {
				} else {
					alert(getString('del_usr_fail'));
				}
				COMM_PORT.send(['get_user_list']);
				break;
			case 'add_schedule_program':
				if(result == 'NG') {
					alert(getString('add_sched_fail'));
				}
				break;
			case 'get_schedule_list':
				if(result == 'OK') {

				} else {
					alert(getString('get_sched_list_fail'));
				}
				break;
			case 'get_schedule_program':
				if(result == 'OK') {

				} else {
					alert(getString('get_sched_fail'));
				}
				break;
			case 'set_schedule_program':
				if(result == 'OK') {

				} else {
					alert(getString('set_sched_fail'));
				}
				break;
			case 'rename_schedule_program':
				if(result == 'NG') {
					alert(getString('ren_sched_name_fail'));
				}
				break;
			case 'delete_schedule_progrm':
				if(result == 'NG') {
					alert(getString('del_sched_fail'));
				}
				break;
			case 'activate_schedule_program':
				if(result == 'OK') {

				} else {
					alert(getString('act_sched_fail'));
				}
				break;
			case 'get_network_info':
				if(result == "OK") {
					var info = data;
					$('#network-setup-page #ip-addr').val(info.ipaddr);
					$('#network-setup-page #netmask').val(info.netmask);
					$('#network-setup-page #def-gw').val(info.gateway);
					$('#network-setup-page #dns-addr').val(info.dns);
					$('#network-setup-page').show();
				} else {
					alert(getString('no_support_net'));
					$.mobile.pageContainer.pagecontainer('change', 'menu.html');
				}
				break;
			case 'set_network_info':
				if(result == 'OK') {
					$.mobile.pageContainer.pagecontainer('change', 'menu.html');
				} else {
					alert(getString('netinfo_set_fail'));
				}
				break;
			case 'get_device_list':
				var type = 'Itm';
				var dev_id = 1;
				var attr = {'ip_addr':'192.168.0.1','port':8081,'user':'','passwd':''};
				if(data[1] == 'OK') {
					DEV_LIST = data;
					// DEV_LIST[*][0]	controller type
					// DEV_LIST[*][1]	device id
					// DEV_LIST[*][2]	attribute
				}
				updateControllerScreen(data[1]);
				break;
			case 'set_device_list':
				if(result == 'OK') {

				} else {
					alert(getString('save_ctrl_fail'));
				}
				break;
			case 'set_device_info':
				if(result == 'OK') {
					$.mobile.pageContainer.pagecontainer('change', 'menu.html');
					alert(getString('restart_please'));
				} else {
					alert(getString('dev_set_fail'));					
				}
				break;
			case 'get_tenant_list':
				if(result == 'OK') {
					TENANT_LIST = data;
					if($('body').find('#main').length > 0) {	// don't change screen
						var event = new $.Event('page_before_show',null);
						$('.screen').trigger(event);
						$('.screen .dialog').hide();
					} else {	// change screen
						loadScreen('main.html');
					}
				} else {

				}
				break;
			case 'mk_tenant':
				if(result == 'OK') {
					COMM_PORT.send(['get_tenant_list']);
				} else {
					alert(getString('add_tenant_fail'));
				}
				break;
			case 'rm_tenant':
				if(result == 'OK') {
					COMM_PORT.send(['get_tenant_list']);
				} else {
					alert(getString('del_tenant_fail'));
				}
				break;
			case 'reg_tenant_points':
				if(result == 'OK') {
					COMM_PORT.send(['get_tenant_list']);
				} else {
					alert(getString('update_tenant_fail'));
				}
				break;
			case 'get_tenant':
				break;
			case 'update_tenant_info':
				if(result == 'OK') {
					COMM_PORT.send(['get_tenant_list']);
				} else {
					alert(getString('update_tenant_fail'));
				}
				break;
			case 'set_charged':
				if(result == 'OK') {
					COMM_PORT.send(['get_tenant_list']);
				} else {
					alert(getString('tenant_charge_fail'));
				}
				break;
			case 'get_charge_log':
				setLog(data);
				break;
			case 'get_ppd':
				if(result == 'OK') {
					console.log(data);
				}
				break;
			case 'get_op_time':
				if(result == 'OK') {
					console.log(data);
				}
				break;
			case 'get_on_times':
				if(result == 'OK') {
					console.log(data);
				}
				break;
			case 'get_pi_val':
				if(result == 'OK') {
					console.log(data);
				}
				break;
			case 'get_ai_val':
				if(result == 'OK') {
					console.log(data);
				}
				break;
			case 'get_bill_data':
				// remove command from command array
				var com = BILL_DATA_COM.shift();
				if(result == 'OK') {
					var name = data['name'];
					if(BILL_DATA[name]['data'] == null) BILL_DATA[name]['data'] = readPointData(data[2]);
					else  addPointData(BILL_DATA[name]['data'],data[2]);
				} else {
					// return NG
					var name = BILL_DATA_COM[0][1].name;
					BILL_DAT[name]['data'] = null;
				}
				if(BILL_DATA_COM.length == 0) {
					$('#main #tenant_name').hide();
					loadDialog('tenant_bill.html',{});
				} else {
					// show tenant name in a dialog
					$('#main #tenant_name').text(BILL_DATA_COM[0][1]['name'])
					$('#main #tenan_name').show();
					COMM_PORT.send(BILL_DATA_COM[0]);
				}
				break;
			case 'get_bill_info':
				if(result == 'OK') {

				} else {
					alert(getString('save_bill_info_fail'));
				}
				break;
			case 'set_clock_adjust':
				if(result == 'OK') {

				}
				break;
			default:
		}
	return true;
}